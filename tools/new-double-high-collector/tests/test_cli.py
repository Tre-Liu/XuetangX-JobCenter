import csv
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

from new_double_high_collector.cli import (
    _apply_candidate_review,
    _candidate_rank,
    _checked_urls,
    _gap_status_from_candidates,
    _official_hosts,
    build_parser,
    main,
    volume_root_for_output,
)
from new_double_high_collector.http_client import RobotsDenied


class CliTests(unittest.TestCase):
    def test_gap_checked_urls_fall_back_to_verified_seeds(self):
        self.assertEqual(
            _checked_urls([], ["https://example.edu.cn/jwc", "https://example.edu.cn/jwc"]),
            "https://example.edu.cn/jwc",
        )

    def test_verified_candidate_review_overrides_misleading_page_title(self):
        row = {
            "group_id": "HFVT-590302",
            "major_code": "520601",
            "download_url": "https://hzyxy.example.edu.cn/rehab.pdf",
            "status": "eligible_official_2025",
            "year_evidence": "2025级",
            "major_evidence": "康复治疗技术",
            "notes": "",
        }
        reviews = {
            ("HFVT-590302", "520601", "https://hzyxy.example.edu.cn/rehab.pdf"): {
                "status": "wrong_year",
                "year_evidence": "PDF首页2024级",
                "major_evidence": "康复治疗技术",
                "notes": "网页标题2025级，但PDF首页为2024级",
                "verification_status": "verified",
            }
        }

        reviewed = _apply_candidate_review(row, reviews)

        self.assertEqual(reviewed["status"], "wrong_year")
        self.assertEqual(reviewed["year_evidence"], "PDF首页2024级")
        self.assertIn("PDF首页", reviewed["notes"])
        self.assertEqual(reviewed["review_verification_status"], "verified")

    def test_verified_eligible_review_outranks_automatic_false_positive(self):
        rows = [
            {
                "title": "2025级广告艺术设计专业技能考核标准",
                "filename": "standard.pdf",
                "review_verification_status": "",
            },
            {
                "title": "2025级广告艺术设计专业（影视广告方向）人才培养方案",
                "filename": "plan.pdf",
                "review_verification_status": "verified",
            },
        ]

        self.assertEqual(sorted(rows, key=_candidate_rank)[0]["filename"], "plan.pdf")

    def test_reviewed_wrong_year_beats_unrelated_major_mismatches_for_gap(self):
        rows = [
            {"status": "major_mismatch", "major_evidence": ""},
            {"status": "wrong_year", "major_evidence": "康复治疗技术"},
            {"status": "year_ambiguous", "major_evidence": ""},
        ]

        self.assertEqual(_gap_status_from_candidates(rows), "wrong_year_only")

    def test_unmatched_wrong_year_does_not_override_ambiguous_year_candidate(self):
        rows = [
            {"status": "wrong_year", "major_evidence": ""},
            {"status": "year_ambiguous", "major_evidence": ""},
        ]

        self.assertEqual(_gap_status_from_candidates(rows), "year_ambiguous")

    def test_unmatched_wrong_year_alone_is_not_a_target_major_old_version(self):
        rows = [{"status": "wrong_year", "major_evidence": ""}]

        self.assertEqual(
            _gap_status_from_candidates(rows), "not_found_official_2025"
        )

    def test_year_ambiguous_beats_unrelated_wrong_document_type_for_gap(self):
        rows = [
            {"status": "wrong_document_type", "major_evidence": ""},
            {"status": "year_ambiguous", "major_evidence": "土木工程检测技术"},
        ]

        self.assertEqual(_gap_status_from_candidates(rows), "year_ambiguous")

    def test_verified_gap_review_beats_unreviewed_historical_candidate(self):
        rows = [
            {
                "status": "wrong_document_type",
                "major_evidence": "智能焊接技术（460110）",
                "review_verification_status": "verified",
            },
            {
                "status": "wrong_year",
                "major_evidence": "智能焊接技术（460110）",
                "review_verification_status": "",
            },
        ]

        self.assertEqual(_gap_status_from_candidates(rows), "wrong_document_type")

    def test_official_hosts_include_parent_when_domain_uses_www(self):
        self.assertEqual(
            _official_hosts("https://www.htc.edu.cn"),
            {"www.htc.edu.cn", "htc.edu.cn"},
        )

    def test_external_output_resolves_marker_to_volume_root(self):
        output = Path("/Volumes/新加卷/vocational_colleges/2025/new_double_high")
        self.assertEqual(volume_root_for_output(output), Path("/Volumes/新加卷"))

    def test_monitor_volume_defaults_to_five_second_checks(self):
        args = build_parser().parse_args(["monitor-volume", "--output", "/Volumes/新加卷/data"])
        self.assertEqual(args.interval, 5.0)

    def test_standard_three_year_plan_is_preferred_over_articulation_variants(self):
        rows = [
            {"filename": "2025-高本贯通-数控技术-人才培养方案.pdf"},
            {"filename": "2025-三二分段-数控技术-人才培养方案.pdf"},
            {"filename": "2025-三年制-数控技术-人才培养方案.pdf"},
        ]

        self.assertIn("三年制", sorted(rows, key=_candidate_rank)[0]["filename"])

    def test_plain_plan_is_preferred_over_special_training_variant(self):
        rows = [
            {
                "title": "数控技术（现代学徒制）-2025版专业人才培养方案",
                "filename": "A.pdf",
            },
            {
                "title": "数控技术-2025版专业人才培养方案",
                "filename": "B.pdf",
            },
        ]

        self.assertEqual(
            sorted(rows, key=_candidate_rank)[0]["title"],
            "数控技术-2025版专业人才培养方案",
        )

    def test_plain_plan_is_preferred_over_sino_german_direction(self):
        rows = [
            {
                "title": "机电与汽车工程学院2025级人才培养方案",
                "filename": "2025机械制造及自动化（中德方向三年制）专业人才培养方案.pdf",
            },
            {
                "title": "机电与汽车工程学院2025级人才培养方案",
                "filename": "2025级机械制造及自动化专业人才培养方案（三年制）.pdf",
            },
        ]

        self.assertEqual(
            sorted(rows, key=_candidate_rank)[0]["filename"],
            "2025级机械制造及自动化专业人才培养方案（三年制）.pdf",
        )

    def test_validate_baseline_returns_nonzero_for_invalid_data(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name, headers, rows in [
                ("institutions.csv", ["institution_code", "province", "institution_name", "official_domain", "aliases"], [["I", "北京", "学校", "http://bad.example", ""]]),
                ("professional_groups.csv", ["group_id", "institution_code", "project_type", "group_name", "group_evidence_url", "verification_status"], []),
                ("group_majors.csv", ["group_id", "major_code", "major_name", "membership_evidence_url", "verification_status"], []),
            ]:
                with (root / name).open("w", encoding="utf-8", newline="") as stream:
                    writer = csv.writer(stream)
                    writer.writerow(headers)
                    writer.writerows(rows)
            self.assertEqual(main(["validate-baseline", "--baseline", str(root)]), 1)

    def test_check_volume_maps_disconnect_to_exit_74(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "out"
            with mock.patch("new_double_high_collector.cli.VolumeGuard.initialize", side_effect=__import__("new_double_high_collector.volume_guard", fromlist=["VolumeDisconnected"]).VolumeDisconnected("gone")):
                self.assertEqual(main(["check-volume", "--output", str(output)]), 74)

    def test_discover_records_robots_denial_as_access_blocked_candidate(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            baseline = root / "baseline"
            output = root / "output"
            baseline.mkdir()
            output.mkdir()
            tables = [
                ("institutions.csv", ["institution_code", "province", "institution_name", "official_domain", "aliases"], [["I001", "湖北", "示例职业学院", "https://example.edu.cn", ""]]),
                ("professional_groups.csv", ["group_id", "institution_code", "project_type", "group_name", "group_evidence_url", "verification_status"], [["G001", "I001", "high_level_group", "现代通信技术专业群", "https://example.edu.cn/group", "verified"]]),
                ("group_majors.csv", ["group_id", "major_code", "major_name", "membership_evidence_url", "verification_status"], [["G001", "510301", "现代通信技术", "https://example.edu.cn/major", "verified"]]),
                ("seeds.csv", ["institution_code", "seed_url", "seed_type", "evidence_url", "verification_status"], [["I001", "https://example.edu.cn/blocked", "official_index", "https://example.edu.cn", "verified"]]),
            ]
            for name, headers, rows in tables:
                with (baseline / name).open("w", encoding="utf-8", newline="") as stream:
                    writer = csv.writer(stream)
                    writer.writerow(headers)
                    writer.writerows(rows)

            with mock.patch(
                "new_double_high_collector.cli.HttpClient.fetch",
                side_effect=RobotsDenied("robots.txt disallows https://example.edu.cn/blocked"),
            ), mock.patch("new_double_high_collector.cli.ensure_disk_space"):
                exit_code = main([
                    "discover",
                    "--baseline",
                    str(baseline),
                    "--output",
                    str(output),
                    "--institution",
                    "I001",
                ])

            self.assertEqual(exit_code, 0)
            with (output / "_catalog" / "candidates.csv").open(
                "r", encoding="utf-8", newline=""
            ) as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["status"], "access_blocked")
            self.assertEqual(rows[0]["source_page_url"], "https://example.edu.cn/blocked")
            error_event = (output / "_logs" / "errors.jsonl").read_text(
                encoding="utf-8"
            )
            self.assertIn('"event_type": "discover_robots_denied"', error_event)

    def test_discover_records_network_failure_as_access_blocked_candidate(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            baseline = root / "baseline"
            output = root / "output"
            baseline.mkdir()
            output.mkdir()
            tables = [
                ("institutions.csv", ["institution_code", "province", "institution_name", "official_domain", "aliases"], [["I001", "湖南", "示例职业学院", "https://example.edu.cn", ""]]),
                ("professional_groups.csv", ["group_id", "institution_code", "project_type", "group_name", "group_evidence_url", "verification_status"], [["G001", "I001", "high_level_group", "护理专业群", "https://example.edu.cn/group", "verified"]]),
                ("group_majors.csv", ["group_id", "major_code", "major_name", "membership_evidence_url", "verification_status"], [["G001", "520201", "护理", "https://example.edu.cn/major", "verified"]]),
                ("seeds.csv", ["institution_code", "seed_url", "seed_type", "evidence_url", "verification_status"], [["I001", "https://example.edu.cn/", "official_homepage", "https://example.edu.cn/", "verified"]]),
            ]
            for name, headers, rows in tables:
                with (baseline / name).open("w", encoding="utf-8", newline="") as stream:
                    writer = csv.writer(stream)
                    writer.writerow(headers)
                    writer.writerows(rows)

            with mock.patch(
                "new_double_high_collector.cli.HttpClient.fetch",
                side_effect=urllib.error.URLError("TLS handshake failed"),
            ), mock.patch("new_double_high_collector.cli.ensure_disk_space"):
                exit_code = main([
                    "discover",
                    "--baseline",
                    str(baseline),
                    "--output",
                    str(output),
                    "--institution",
                    "I001",
                ])

            self.assertEqual(exit_code, 0)
            with (output / "_catalog" / "candidates.csv").open(
                "r", encoding="utf-8", newline=""
            ) as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["status"], "access_blocked")
            self.assertIn("TLS handshake failed", rows[0]["notes"])
            error_event = (output / "_logs" / "errors.jsonl").read_text(
                encoding="utf-8"
            )
            self.assertIn('"event_type": "discover_network_error"', error_event)

    def test_discover_applies_verified_review_to_network_failure_candidate(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            baseline = root / "baseline"
            output = root / "output"
            baseline.mkdir()
            output.mkdir()
            page_url = "https://example.edu.cn/official-review"
            tables = [
                ("institutions.csv", ["institution_code", "province", "institution_name", "official_domain", "aliases"], [["I001", "江苏", "示例职业学院", "https://example.edu.cn", ""]]),
                ("professional_groups.csv", ["group_id", "institution_code", "project_type", "group_name", "group_evidence_url", "verification_status"], [["G001", "I001", "high_level_group", "现代物流管理专业群", "https://example.edu.cn/group", "verified"]]),
                ("group_majors.csv", ["group_id", "major_code", "major_name", "membership_evidence_url", "verification_status"], [["G001", "530802", "现代物流管理", "https://example.edu.cn/major", "verified"]]),
                ("seeds.csv", ["institution_code", "seed_url", "seed_type", "evidence_url", "verification_status"], [["I001", page_url, "official_review", page_url, "verified"]]),
                ("candidate_reviews.csv", ["group_id", "major_code", "download_url", "status", "year_evidence", "major_evidence", "document_evidence", "notes", "verification_status"], [["G001", "530802", page_url, "not_found_official_2025", "官网检索未发现2025级原件", "现代物流管理", "学校官网与教务处已人工核验", "不以网络瞬时失败覆盖人工复核", "verified"]]),
            ]
            for name, headers, rows in tables:
                with (baseline / name).open("w", encoding="utf-8", newline="") as stream:
                    writer = csv.writer(stream)
                    writer.writerow(headers)
                    writer.writerows(rows)

            with mock.patch(
                "new_double_high_collector.cli.HttpClient.fetch",
                side_effect=urllib.error.URLError("TLS handshake failed"),
            ), mock.patch("new_double_high_collector.cli.ensure_disk_space"):
                exit_code = main([
                    "discover",
                    "--baseline",
                    str(baseline),
                    "--output",
                    str(output),
                    "--institution",
                    "I001",
                ])

            self.assertEqual(exit_code, 0)
            with (output / "_catalog" / "candidates.csv").open(
                "r", encoding="utf-8", newline=""
            ) as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual(rows[0]["status"], "not_found_official_2025")
            self.assertEqual(rows[0]["review_verification_status"], "verified")
            self.assertIn("人工复核", rows[0]["notes"])

    def test_discover_keeps_verified_review_when_review_url_is_not_a_seed(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            baseline = root / "baseline"
            output = root / "output"
            baseline.mkdir()
            output.mkdir()
            seed_url = "https://example.edu.cn/"
            review_url = "https://example.edu.cn/major-plan-review"
            tables = [
                ("institutions.csv", ["institution_code", "province", "institution_name", "official_domain", "aliases"], [["I001", "浙江", "示例职业大学", "https://example.edu.cn", ""]]),
                ("professional_groups.csv", ["group_id", "institution_code", "project_type", "group_name", "group_evidence_url", "verification_status"], [["G001", "I001", "high_level_group", "智能机电技术专业群", "https://example.edu.cn/group", "verified"]]),
                ("group_majors.csv", ["group_id", "major_code", "major_name", "membership_evidence_url", "verification_status"], [["G001", "460302", "智能机电技术", "https://example.edu.cn/major", "verified"]]),
                ("seeds.csv", ["institution_code", "seed_url", "seed_type", "evidence_url", "verification_status"], [["I001", seed_url, "official_homepage", seed_url, "verified"]]),
                ("candidate_reviews.csv", ["group_id", "major_code", "download_url", "status", "year_evidence", "major_evidence", "document_evidence", "notes", "verification_status"], [["G001", "460302", review_url, "access_blocked", "官网证明2025级方案已制订", "智能机电技术；专业代码460302", "学校官网2025级方案论证页", "官网附件入口当前无法连接", "verified"]]),
            ]
            for name, headers, rows in tables:
                with (baseline / name).open("w", encoding="utf-8", newline="") as stream:
                    writer = csv.writer(stream)
                    writer.writerow(headers)
                    writer.writerows(rows)

            with mock.patch(
                "new_double_high_collector.cli.HttpClient.fetch",
                side_effect=urllib.error.URLError("TLS handshake failed"),
            ), mock.patch("new_double_high_collector.cli.ensure_disk_space"):
                exit_code = main([
                    "discover",
                    "--baseline",
                    str(baseline),
                    "--output",
                    str(output),
                    "--institution",
                    "I001",
                ])

            self.assertEqual(exit_code, 0)
            with (output / "_catalog" / "candidates.csv").open(
                "r", encoding="utf-8", newline=""
            ) as stream:
                rows = list(csv.DictReader(stream))
            reviewed = [row for row in rows if row["download_url"] == review_url]
            self.assertEqual(len(reviewed), 1)
            self.assertEqual(reviewed[0]["status"], "access_blocked")
            self.assertEqual(reviewed[0]["review_verification_status"], "verified")
            self.assertIn("2025级", reviewed[0]["year_evidence"])

    def test_discover_records_official_host_redirect_as_access_blocked_candidate(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            baseline = root / "baseline"
            output = root / "output"
            baseline.mkdir()
            output.mkdir()
            tables = [
                ("institutions.csv", ["institution_code", "province", "institution_name", "official_domain", "aliases"], [["I001", "江苏", "示例职业学院", "https://example.edu.cn", ""]]),
                ("professional_groups.csv", ["group_id", "institution_code", "project_type", "group_name", "group_evidence_url", "verification_status"], [["G001", "I001", "high_level_group", "船舶工程技术专业群", "https://example.edu.cn/group", "verified"]]),
                ("group_majors.csv", ["group_id", "major_code", "major_name", "membership_evidence_url", "verification_status"], [["G001", "460501", "船舶工程技术", "https://example.edu.cn/major", "verified"]]),
                ("seeds.csv", ["institution_code", "seed_url", "seed_type", "evidence_url", "verification_status"], [["I001", "https://example.edu.cn/plan", "official_2025_plan", "https://example.edu.cn/plan", "verified"]]),
            ]
            for name, headers, rows in tables:
                with (baseline / name).open("w", encoding="utf-8", newline="") as stream:
                    writer = csv.writer(stream)
                    writer.writerow(headers)
                    writer.writerows(rows)

            with mock.patch(
                "new_double_high_collector.cli.HttpClient.fetch",
                side_effect=ValueError(
                    "redirect left official hosts: http://127.0.0.1/cas/login"
                ),
            ), mock.patch("new_double_high_collector.cli.ensure_disk_space"):
                exit_code = main([
                    "discover",
                    "--baseline",
                    str(baseline),
                    "--output",
                    str(output),
                    "--institution",
                    "I001",
                ])

            self.assertEqual(exit_code, 0)
            with (output / "_catalog" / "candidates.csv").open(
                "r", encoding="utf-8", newline=""
            ) as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["status"], "access_blocked")
            self.assertEqual(rows[0]["source_page_url"], "https://example.edu.cn/plan")
            self.assertIn("127.0.0.1", rows[0]["notes"])

    def test_resume_skips_completed_record_without_http_request(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            baseline = root / "baseline"
            output = root / "output"
            catalog = output / "_catalog"
            baseline.mkdir()
            catalog.mkdir(parents=True)
            tables = [
                ("institutions.csv", ["institution_code", "province", "institution_name", "official_domain", "aliases"], [["I001", "北京", "示例职业学院", "https://example.edu.cn", ""]]),
                ("professional_groups.csv", ["group_id", "institution_code", "project_type", "group_name", "group_evidence_url", "verification_status"], [["G001", "I001", "high_level_group", "智能制造专业群", "https://example.edu.cn/group", "verified"]]),
                ("group_majors.csv", ["group_id", "major_code", "major_name", "membership_evidence_url", "verification_status"], [["G001", "460301", "机电一体化技术", "https://example.edu.cn/major", "verified"]]),
            ]
            for name, headers, rows in tables:
                with (baseline / name).open("w", encoding="utf-8", newline="") as stream:
                    writer = csv.writer(stream)
                    writer.writerow(headers)
                    writer.writerows(rows)
            with (catalog / "candidates.csv").open("w", encoding="utf-8", newline="") as stream:
                writer = csv.writer(stream)
                writer.writerow(["institution_code", "group_id", "major_code", "filename", "source_page_url", "download_url", "status"])
                writer.writerow(["I001", "G001", "460301", "plan.pdf", "https://example.edu.cn/page", "https://example.edu.cn/plan.pdf", "eligible_official_2025"])
            with (catalog / "manifest.csv").open("w", encoding="utf-8", newline="") as stream:
                writer = csv.writer(stream)
                writer.writerow(["record_id"])
                writer.writerow(["G001/460301"])
            with (catalog / "gaps.csv").open("w", encoding="utf-8", newline="") as stream:
                writer = csv.writer(stream)
                writer.writerow(["group_id", "major_code", "major_name", "gap_status", "checked_urls", "checked_at", "notes"])
                writer.writerow(["G001", "460301", "机电一体化技术", "manual_review_required", "https://example.edu.cn/page", "2026-08-24", "old failure"])
            with mock.patch("new_double_high_collector.cli.HttpClient.fetch") as fetch:
                exit_code = main(["download", "--baseline", str(baseline), "--output", str(output), "--resume"])
            self.assertEqual(exit_code, 0)
            fetch.assert_not_called()
            with (catalog / "gaps.csv").open("r", encoding="utf-8", newline="") as stream:
                self.assertEqual(list(csv.DictReader(stream)), [])


if __name__ == "__main__":
    unittest.main()
