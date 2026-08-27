import csv
import hashlib
import tempfile
import unittest
from pathlib import Path

from new_double_high_collector.baseline import Baseline
from new_double_high_collector.qa import _official, run_qa


def write_csv(path, headers, rows):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(headers)
        writer.writerows(rows)


class QaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.baseline_root = self.root / "baseline"
        self.output = self.root / "output"
        self.baseline_root.mkdir()
        self.output.mkdir()
        write_csv(
            self.baseline_root / "institutions.csv",
            ["institution_code", "province", "institution_name", "official_domain", "aliases"],
            [["I001", "北京", "示例职业学院", "https://example.edu.cn", ""]],
        )
        write_csv(
            self.baseline_root / "professional_groups.csv",
            ["group_id", "institution_code", "project_type", "group_name", "group_evidence_url", "verification_status"],
            [["G001", "I001", "high_level_group", "智能制造专业群", "https://example.edu.cn/group", "verified"]],
        )
        write_csv(
            self.baseline_root / "group_majors.csv",
            ["group_id", "major_code", "major_name", "membership_evidence_url", "verification_status"],
            [["G001", "460301", "机电一体化技术", "https://example.edu.cn/major", "verified"]],
        )
        self.baseline = Baseline.load(self.baseline_root)

    def test_requires_each_verified_major_to_have_manifest_or_gap(self):
        report = run_qa(self.output, self.baseline)
        self.assertIn("G001/460301 has no terminal state", report.errors)

    def test_valid_manifest_checks_file_hash_size_and_official_domain(self):
        document = self.output / "documents" / "plan.pdf"
        document.parent.mkdir(parents=True)
        data = b"%PDF-1.7\nvalid"
        document.write_bytes(data)
        catalog = self.output / "_catalog"
        catalog.mkdir()
        headers = [
            "record_id", "group_id", "major_code", "major_name", "grade_year",
            "document_title", "source_page_url", "download_url", "source_domain",
            "published_at", "fetched_at", "content_type", "file_size_bytes", "sha256",
            "relative_path", "version_status", "verification_status", "notes",
        ]
        write_csv(catalog / "manifest.csv", headers, [[
            "G001/460301", "G001", "460301", "机电一体化技术", "2025",
            "2025级人才培养方案", "https://example.edu.cn/page", "https://files.example.edu.cn/plan.pdf",
            "files.example.edu.cn", "", "2026-08-24T00:00:00Z", "application/pdf",
            str(len(data)), hashlib.sha256(data).hexdigest(), "documents/plan.pdf",
            "current", "downloaded_official_2025", "",
        ]])
        report = run_qa(self.output, self.baseline)
        self.assertEqual(report.errors, [])
        self.assertEqual(report.downloaded_records, 1)
        self.assertEqual(report.downloaded_bytes, len(data))

    def test_accepts_sibling_subdomain_when_official_host_uses_www(self):
        write_csv(
            self.baseline_root / "institutions.csv",
            ["institution_code", "province", "institution_name", "official_domain", "aliases"],
            [["I001", "山东", "示例职业学院", "https://www.example.edu.cn", ""]],
        )
        baseline = Baseline.load(self.baseline_root)

        self.assertTrue(_official("jwc.example.edu.cn", baseline))
        self.assertFalse(_official("example.edu.cn.evil.test", baseline))

    def test_accepts_pdf_derived_from_official_page_images(self):
        document = self.output / "documents" / "derived.pdf"
        document.parent.mkdir(parents=True)
        data = b"%PDF-1.7\nderived"
        document.write_bytes(data)
        catalog = self.output / "_catalog"
        catalog.mkdir()
        headers = [
            "record_id", "group_id", "major_code", "major_name", "grade_year",
            "document_title", "source_page_url", "download_url", "source_domain",
            "published_at", "fetched_at", "content_type", "file_size_bytes", "sha256",
            "relative_path", "version_status", "verification_status", "notes",
        ]
        write_csv(catalog / "manifest.csv", headers, [[
            "G001/460301", "G001", "460301", "机电一体化技术", "2025",
            "2025级人才培养方案", "https://jwc.example.edu.cn/page",
            "https://jwc.example.edu.cn/page", "jwc.example.edu.cn", "",
            "2026-08-27T00:00:00Z", "application/pdf", str(len(data)),
            hashlib.sha256(data).hexdigest(), "documents/derived.pdf", "current",
            "derived_pdf_from_official_page_images_2025",
            "由学校官网逐页PNG按原顺序合成；非官网原始PDF",
        ]])

        report = run_qa(self.output, self.baseline)

        self.assertEqual(report.errors, [])

    def test_detects_manifest_gap_overlap(self):
        catalog = self.output / "_catalog"
        catalog.mkdir()
        write_csv(catalog / "manifest.csv", ["record_id", "group_id", "major_code"], [["G001/460301", "G001", "460301"]])
        write_csv(catalog / "gaps.csv", ["group_id", "major_code", "major_name", "gap_status", "checked_urls", "checked_at", "notes"], [["G001", "460301", "机电一体化技术", "not_found_official_2025", "", "", ""]])
        report = run_qa(self.output, self.baseline)
        self.assertIn("G001/460301 appears in both manifest and gaps", report.errors)


if __name__ == "__main__":
    unittest.main()
