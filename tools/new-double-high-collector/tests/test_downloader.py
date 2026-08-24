import tempfile
import unittest
from pathlib import Path

from new_double_high_collector.downloader import (
    FileSignatureMismatch,
    StoreContext,
    store_bytes,
)
from new_double_high_collector.volume_guard import VolumeGuard


class DownloaderTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.output = self.root / "output"
        self.output.mkdir()
        self.guard = VolumeGuard(
            self.output,
            self.root / "runtime" / "alerts.jsonl",
            notifier=lambda _message: None,
        )
        self.guard.initialize()
        self.context = StoreContext(
            record_id="G001-460301-a",
            group_id="G001",
            province="江苏",
            institution_code="I001",
            institution_name="示例职业技术大学",
            group_name="智能制造专业群",
            major_code="460301",
            major_name="机电一体化技术",
            grade_year="2025",
            document_title="机电一体化技术2025级人才培养方案",
            source_page_url="https://jwc.example.edu.cn/a",
            download_url="https://jwc.example.edu.cn/a.pdf",
            published_at="2025-08-01",
            fetched_at="2026-08-24T00:00:00+00:00",
            verification_status="downloaded_official_2025",
        )

    def tearDown(self):
        self.tempdir.cleanup()

    def test_pdf_magic_is_required_even_when_extension_is_pdf(self):
        with self.assertRaises(FileSignatureMismatch):
            store_bytes(
                self.context,
                b"<html>login</html>",
                "plan.pdf",
                self.output,
                self.guard,
            )

    def test_same_filename_different_hash_gets_hash_suffix(self):
        first = store_bytes(
            self.context,
            b"%PDF-1.7\nfirst",
            "plan.pdf",
            self.output,
            self.guard,
        )
        second = store_bytes(
            self.context,
            b"%PDF-1.7\nsecond",
            "plan.pdf",
            self.output,
            self.guard,
        )

        self.assertNotEqual(first.relative_path, second.relative_path)
        self.assertTrue(second.relative_path.endswith("plan__a5bd426d.pdf"))

    def test_chinese_hierarchy_is_preserved_and_unsafe_characters_are_removed(self):
        record = store_bytes(
            self.context,
            b"%PDF-1.7\ncontent",
            "培养/方案:2025.pdf",
            self.output,
            self.guard,
        )

        self.assertIn("江苏", record.relative_path)
        self.assertIn("I001_示例职业技术大学", record.relative_path)
        self.assertNotIn(":", Path(record.relative_path).name)
        self.assertNotIn("/方案", record.relative_path)
        self.assertEqual(len(record.sha256), 64)


if __name__ == "__main__":
    unittest.main()
