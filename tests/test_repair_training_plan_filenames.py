import csv
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.repair_training_plan_filenames import (
    apply_repair_plan,
    build_repair_plan,
    extract_official_filename,
    fallback_filename,
    is_machine_filename,
    sanitize_filename,
    update_json_file,
    write_audit_csv,
)


class FilenameClassificationTests(unittest.TestCase):
    def test_uuid_hash_and_virtual_names_are_machine_names(self):
        machine_names = (
            "4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf",
            "B0A724568D88A1A89A7C521EAA1_F114B0DB_4CF705.pdf",
            "5b5b96ad386b4aada6dc58b95346bd5e.pdf",
            "2025101621295016941nm7c.pdf",
            "20251016212950723m4eykl.pdf",
            "25091454ay1s.pdf",
            "41be309704.pdf",
            "virtual_attach_file.pdf",
        )
        for name in machine_names:
            with self.subTest(name=name):
                self.assertTrue(is_machine_filename(name))

    def test_meaningful_ascii_filename_is_not_treated_as_machine_name(self):
        self.assertFalse(
            is_machine_filename(
                "2025banchengshiguidaocheliangyingyongjishuzhuanyerencaipeiyangfangan.pdf"
            )
        )
        self.assertFalse(is_machine_filename("01-2025slgc.pdf"))


class OfficialFilenameExtractionTests(unittest.TestCase):
    def test_extracts_webplus_title_for_matching_pdf(self):
        html = """
        <span pdfsrc="/x/other.pdf"
              sudyfile-attr="{'title':'其他方案.pdf'}"></span>
        <span pdfsrc="/x/4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf"
              sudyfile-attr="{'title':'2025级人物形象设计专业人才培养方案.pdf'}"></span>
        """
        actual = extract_official_filename(
            html,
            "https://example.edu/x/4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf",
        )
        self.assertEqual(actual, "2025级人物形象设计专业人才培养方案.pdf")

    def test_extracts_html_entity_encoded_sudy_title(self):
        html = """
        <a href="/uploadfile/71/Attachment/41be309704.pdf"
           sudyfile-attr="{&#39;title&#39;:附件2.2025级智能光电技术应用专业人才培养方案.pdf}">
           附件2.2025级智能光电技术应用专业人才培养方案.pdf
        </a>
        """
        actual = extract_official_filename(
            html,
            "https://example.edu/uploadfile/71/Attachment/41be309704.pdf",
        )
        self.assertEqual(actual, "附件2.2025级智能光电技术应用专业人才培养方案.pdf")

    def test_ignores_generic_anchor_text(self):
        html = """
        <a href="/__local/hash.pdf">PDF 文件</a>
        """
        self.assertIsNone(
            extract_official_filename(html, "https://example.edu/__local/hash.pdf")
        )


class NamingFallbackTests(unittest.TestCase):
    def test_fallback_uses_school_group_major(self):
        relative_path = (
            "documents/湖南/HNIVC_湖南工业职业技术学院/数控技术专业群/"
            "460103_数控技术/B0A724568D88A1A89A7C521EAA1_F114B0DB_4CF705.pdf"
        )
        self.assertEqual(
            fallback_filename(relative_path),
            "湖南工业职业技术学院-数控技术专业群-数控技术.pdf",
        )

    def test_sanitize_filename_removes_filesystem_separators(self):
        self.assertEqual(
            sanitize_filename("2025级/人物形象设计：人才培养方案.pdf"),
            "2025级-人物形象设计-人才培养方案.pdf",
        )

    def test_sanitize_filename_preserves_chinese_parentheses(self):
        self.assertEqual(
            sanitize_filename("2025级艺术设计专业（品牌形象设计方向）人才培养方案.pdf"),
            "2025级艺术设计专业（品牌形象设计方向）人才培养方案.pdf",
        )


class RepairPlanIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        (self.root / "_catalog").mkdir()
        self.official_relative = (
            "documents/湖南/HNMMC_湖南大众传媒职业技术学院/数字媒体艺术设计专业群/"
            "550117_人物形象设计/4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf"
        )
        self.fallback_relative = (
            "documents/湖南/HNIVC_湖南工业职业技术学院/数控技术专业群/"
            "460103_数控技术/B0A724568D88A1A89A7C521EAA1_F114B0DB_4CF705.pdf"
        )
        rows = []
        for record_id, relative_path, page_url, download_url, payload in (
            (
                "HNMMC-550103/550117",
                self.official_relative,
                "https://example.edu/page.htm",
                "https://example.edu/x/4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf",
                b"official-pdf",
            ),
            (
                "HNIVC-460103/460103",
                self.fallback_relative,
                "https://example.edu/no-name.htm",
                "https://example.edu/x/B0A724568D88A1A89A7C521EAA1_F114B0DB_4CF705.pdf",
                b"fallback-pdf",
            ),
        ):
            file_path = self.root / relative_path
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_bytes(payload)
            rows.append(
                {
                    "record_id": record_id,
                    "source_page_url": page_url,
                    "download_url": download_url,
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "relative_path": relative_path,
                }
            )
        with (self.root / "_catalog/manifest.csv").open(
            "w", encoding="utf-8", newline=""
        ) as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)

    def tearDown(self):
        self.tempdir.cleanup()

    def test_build_plan_is_read_only_and_selects_official_then_fallback(self):
        pages = {
            "https://example.edu/page.htm": """
                <span pdfsrc='/x/4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf'
                      sudyfile-attr="{'title':'2025级人物形象设计专业人才培养方案.pdf'}"></span>
            """,
            "https://example.edu/no-name.htm": "<a href='/x/hash.pdf'>PDF 文件</a>",
        }
        plan = build_repair_plan(self.root, page_loader=pages.get)
        self.assertEqual(len(plan), 2)
        by_record = {row["record_id"]: row for row in plan}
        self.assertEqual(
            by_record["HNMMC-550103/550117"]["new_filename"],
            "2025级人物形象设计专业人才培养方案.pdf",
        )
        self.assertEqual(
            by_record["HNMMC-550103/550117"]["naming_basis"], "官网附件标题"
        )
        self.assertEqual(
            by_record["HNIVC-460103/460103"]["new_filename"],
            "湖南工业职业技术学院-数控技术专业群-数控技术.pdf",
        )
        self.assertEqual(
            by_record["HNIVC-460103/460103"]["naming_basis"], "学校-专业群-专业兜底"
        )
        self.assertTrue((self.root / self.official_relative).exists())
        self.assertTrue((self.root / self.fallback_relative).exists())

    def test_apply_plan_renames_files_and_updates_manifest(self):
        pages = {
            "https://example.edu/page.htm": """
                <span pdfsrc='/x/4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf'
                      sudyfile-attr="{'title':'2025级人物形象设计专业人才培养方案.pdf'}"></span>
            """,
            "https://example.edu/no-name.htm": "",
        }
        plan = build_repair_plan(self.root, page_loader=pages.get)
        backup = self.root / "_catalog/manifest.before.csv"
        apply_repair_plan(self.root, plan, backup_path=backup)

        self.assertTrue(backup.exists())
        self.assertFalse((self.root / self.official_relative).exists())
        self.assertFalse((self.root / self.fallback_relative).exists())
        with (self.root / "_catalog/manifest.csv").open(encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
        for row in rows:
            self.assertFalse(is_machine_filename(Path(row["relative_path"]).name))
            self.assertTrue((self.root / row["relative_path"]).exists())

    def test_write_audit_csv_preserves_mapping_and_basis(self):
        pages = {
            "https://example.edu/page.htm": """
                <span pdfsrc='/x/4fa26f05-124a-4aa8-9f54-d68ff22dd55d.pdf'
                      sudyfile-attr="{'title':'2025级人物形象设计专业人才培养方案.pdf'}"></span>
            """,
            "https://example.edu/no-name.htm": "",
        }
        plan = build_repair_plan(self.root, page_loader=pages.get)
        audit_path = self.root / "audit.csv"
        write_audit_csv(plan, audit_path)
        with audit_path.open(encoding="utf-8-sig") as handle:
            rows = list(csv.DictReader(handle))
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["naming_basis"], "官网附件标题")
        self.assertEqual(rows[1]["naming_basis"], "学校-专业群-专业兜底")


class JsonSourceUpdateTests(unittest.TestCase):
    def test_updates_paired_english_and_chinese_source_fields(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "sources.json"
            old_path = "/catalog/documents/a/uuid.pdf"
            new_path = "/catalog/documents/a/真实文件名.pdf"
            payload = [
                {
                    "source_path": old_path,
                    "source_file": "uuid.pdf",
                    "source_sha256": "unchanged",
                },
                {
                    "来源路径": old_path,
                    "参考人培文件": "uuid.pdf",
                    "SHA-256": "unchanged",
                },
                {"来源路径": "/catalog/documents/other.pdf", "参考人培文件": "other.pdf"},
            ]
            path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
            replacements = update_json_file(path, {old_path: new_path})
            updated = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(replacements, 2)
            self.assertEqual(updated[0]["source_path"], new_path)
            self.assertEqual(updated[0]["source_file"], "真实文件名.pdf")
            self.assertEqual(updated[1]["来源路径"], new_path)
            self.assertEqual(updated[1]["参考人培文件"], "真实文件名.pdf")
            self.assertEqual(updated[2], payload[2])


if __name__ == "__main__":
    unittest.main()
