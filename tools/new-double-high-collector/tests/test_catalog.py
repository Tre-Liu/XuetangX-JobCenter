import csv
import json
import tempfile
import unittest
from pathlib import Path

from new_double_high_collector.catalog import Catalog
from new_double_high_collector.models import DownloadRecord, GapRecord


def read_rows(path):
    with path.open("r", encoding="utf-8", newline="") as stream:
        return list(csv.DictReader(stream))


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.catalog = Catalog(self.root)
        self.record = DownloadRecord(
            record_id="R001",
            group_id="G001",
            major_code="460301",
            major_name="机电一体化技术",
            grade_year="2025",
            document_title="2025级人才培养方案",
            source_page_url="https://example.edu.cn/a",
            download_url="https://example.edu.cn/a.pdf",
            source_domain="example.edu.cn",
            published_at="2025-08-01",
            fetched_at="2026-08-24T00:00:00+00:00",
            content_type="application/pdf",
            file_size_bytes=12,
            sha256="a" * 64,
            relative_path="documents/a.pdf",
            version_status="current",
            verification_status="downloaded_official_2025",
            notes="",
        )

    def tearDown(self):
        self.tempdir.cleanup()

    def test_manifest_write_is_atomic_and_upserts_by_record_id(self):
        self.catalog.upsert_manifest(self.record)
        replacement = DownloadRecord(**{**self.record.__dict__, "notes": "修订版"})
        self.catalog.upsert_manifest(replacement)

        rows = read_rows(self.root / "_catalog" / "manifest.csv")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["notes"], "修订版")
        self.assertFalse((self.root / "_catalog" / "manifest.csv.tmp").exists())

    def test_gap_write_and_event_log_are_utf8_jsonl(self):
        gap = GapRecord(
            group_id="G001",
            major_code="460301",
            major_name="机电一体化技术",
            gap_status="not_found_official_2025",
            checked_urls="https://example.edu.cn/jwc",
            checked_at="2026-08-24T00:00:00+00:00",
            notes="官网未发现",
        )
        self.catalog.upsert_gap(gap)
        self.catalog.append_event("gap_recorded", "G001/460301", "https://example.edu.cn/jwc", {"说明": "官网未发现"})

        self.assertEqual(read_rows(self.root / "_catalog" / "gaps.csv")[0]["notes"], "官网未发现")
        event = json.loads((self.root / "_logs" / "events.jsonl").read_text(encoding="utf-8"))
        self.assertEqual(event["event_type"], "gap_recorded")
        self.assertEqual(event["details"]["说明"], "官网未发现")


if __name__ == "__main__":
    unittest.main()
