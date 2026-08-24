import csv
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from new_double_high_collector.cli import build_parser, main, volume_root_for_output


class CliTests(unittest.TestCase):
    def test_external_output_resolves_marker_to_volume_root(self):
        output = Path("/Volumes/新加卷/vocational_colleges/2025/new_double_high")
        self.assertEqual(volume_root_for_output(output), Path("/Volumes/新加卷"))

    def test_monitor_volume_defaults_to_five_second_checks(self):
        args = build_parser().parse_args(["monitor-volume", "--output", "/Volumes/新加卷/data"])
        self.assertEqual(args.interval, 5.0)

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
            with mock.patch("new_double_high_collector.cli.HttpClient.fetch") as fetch:
                exit_code = main(["download", "--baseline", str(baseline), "--output", str(output), "--resume"])
            self.assertEqual(exit_code, 0)
            fetch.assert_not_called()


if __name__ == "__main__":
    unittest.main()
