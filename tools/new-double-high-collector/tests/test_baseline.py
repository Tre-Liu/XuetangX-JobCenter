import csv
import tempfile
import unittest
from pathlib import Path

from new_double_high_collector.baseline import Baseline


INSTITUTION_FIELDS = [
    "institution_code",
    "province",
    "institution_name",
    "official_domain",
    "aliases",
]
GROUP_FIELDS = [
    "group_id",
    "institution_code",
    "project_type",
    "group_name",
    "group_evidence_url",
    "verification_status",
]
MAJOR_FIELDS = [
    "group_id",
    "major_code",
    "major_name",
    "membership_evidence_url",
    "verification_status",
]


def write_csv(path, fieldnames, rows):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(dict(zip(fieldnames, row)))


def write_baseline(root, institutions=(), groups=(), majors=()):
    write_csv(root / "institutions.csv", INSTITUTION_FIELDS, institutions)
    write_csv(root / "professional_groups.csv", GROUP_FIELDS, groups)
    write_csv(root / "group_majors.csv", MAJOR_FIELDS, majors)


class BaselineTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)

    def tearDown(self):
        self.tempdir.cleanup()

    def test_requires_official_evidence_for_verified_group(self):
        write_baseline(
            self.root,
            institutions=[
                ["I001", "北京", "示例职业学院", "https://www.example.edu.cn", "示例学院"]
            ],
            groups=[
                ["G001", "I001", "high_level_group", "智能制造专业群", "", "verified"]
            ],
            majors=[
                [
                    "G001",
                    "460301",
                    "机电一体化技术",
                    "https://www.example.edu.cn/group.pdf",
                    "verified",
                ]
            ],
        )

        errors = Baseline.load(self.root).validate()

        self.assertIn("G001: verified group requires official evidence URL", errors)

    def test_rejects_major_without_parent_group(self):
        write_baseline(
            self.root,
            majors=[
                [
                    "G404",
                    "460301",
                    "机电一体化技术",
                    "https://www.example.edu.cn/a",
                    "verified",
                ]
            ],
        )

        errors = Baseline.load(self.root).validate()

        self.assertIn("G404/460301: missing parent group", errors)

    def test_loads_aliases_and_accepts_complete_verified_baseline(self):
        write_baseline(
            self.root,
            institutions=[
                [
                    "I001",
                    "江苏",
                    "示例职业技术大学",
                    "https://www.example.edu.cn",
                    "示例职业学院|示例职大",
                ]
            ],
            groups=[
                [
                    "G001",
                    "I001",
                    "high_level_school",
                    "智能制造专业群",
                    "https://www.example.edu.cn/double-high.pdf",
                    "verified",
                ]
            ],
            majors=[
                [
                    "G001",
                    "460301",
                    "机电一体化技术",
                    "https://www.example.edu.cn/double-high.pdf",
                    "verified",
                ]
            ],
        )

        baseline = Baseline.load(self.root)

        self.assertEqual(baseline.validate(), [])
        self.assertEqual(
            baseline.institutions[0].aliases, ("示例职业学院", "示例职大")
        )

    def test_rejects_duplicate_ids_and_invalid_major_code(self):
        write_baseline(
            self.root,
            institutions=[
                ["I001", "北京", "学校一", "https://one.example.edu.cn", ""],
                ["I001", "天津", "学校二", "https://two.example.edu.cn", ""],
            ],
            groups=[
                [
                    "G001",
                    "I001",
                    "high_level_group",
                    "专业群一",
                    "https://one.example.edu.cn/group",
                    "verified",
                ],
                [
                    "G001",
                    "I001",
                    "high_level_group",
                    "专业群二",
                    "https://one.example.edu.cn/group2",
                    "verified",
                ],
            ],
            majors=[
                [
                    "G001",
                    "ABC123",
                    "错误代码专业",
                    "https://one.example.edu.cn/group",
                    "verified",
                ]
            ],
        )

        errors = Baseline.load(self.root).validate()

        self.assertIn("I001: duplicate institution_code", errors)
        self.assertIn("G001: duplicate group_id", errors)
        self.assertIn("G001/ABC123: verified major_code must be six digits", errors)

    def test_accepts_nationally_controlled_major_code_with_k_suffix(self):
        write_baseline(
            self.root,
            institutions=[
                ["I001", "安徽", "示例职业学院", "https://www.example.edu.cn", ""]
            ],
            groups=[
                [
                    "G001",
                    "I001",
                    "high_level_group",
                    "智慧健康养老服务与管理专业群",
                    "https://www.example.edu.cn/group",
                    "verified",
                ]
            ],
            majors=[
                [
                    "G001",
                    "520101K",
                    "临床医学",
                    "https://www.example.edu.cn/group",
                    "verified",
                ]
            ],
        )

        self.assertEqual(Baseline.load(self.root).validate(), [])


if __name__ == "__main__":
    unittest.main()
