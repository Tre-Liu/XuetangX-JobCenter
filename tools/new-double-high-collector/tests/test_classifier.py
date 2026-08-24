import unittest

from new_double_high_collector.classifier import classify_candidate
from new_double_high_collector.models import Candidate, GroupMajor


def candidate(title, filename="plan.pdf", page_text=""):
    return Candidate(
        group_id="G001",
        major_code="460301",
        title=title,
        link_text=title,
        filename=filename,
        page_text=page_text,
        source_page_url="https://jwc.example.edu.cn/a",
        download_url="https://jwc.example.edu.cn/a.pdf",
    )


MAJOR = GroupMajor(
    "G001",
    "460301",
    "机电一体化技术",
    "https://jwc.example.edu.cn/group",
    "verified",
)


class ClassifierTests(unittest.TestCase):
    def test_accepts_explicit_2025_cohort_and_exact_major(self):
        result = classify_candidate(candidate("机电一体化技术2025级人才培养方案"), MAJOR)

        self.assertEqual(result.status, "eligible_official_2025")
        self.assertIn("2025级", result.year_evidence)
        self.assertIn("机电一体化技术", result.major_evidence)

    def test_treats_academic_year_alone_as_ambiguous(self):
        result = classify_candidate(candidate("机电一体化技术2024-2025学年培养方案"), MAJOR)

        self.assertEqual(result.status, "year_ambiguous")

    def test_rejects_wrong_cohort(self):
        result = classify_candidate(candidate("机电一体化技术2024级人才培养方案"), MAJOR)

        self.assertEqual(result.status, "wrong_year")

    def test_rejects_major_mismatch_even_when_year_is_correct(self):
        result = classify_candidate(candidate("软件技术2025级人才培养方案", "510203.pdf"), MAJOR)

        self.assertEqual(result.status, "major_mismatch")

    def test_does_not_use_other_rows_on_a_multi_major_page_as_major_evidence(self):
        attachment = Candidate(
            group_id="G001",
            major_code="480404",
            title="广东职业技术学院2025级人才培养方案",
            link_text="现代纺织技术（三年制）",
            filename="480401.pdf",
            page_text="页面同时列出针织技术与针织服装",
            source_page_url="https://example.edu.cn/plans",
            download_url="https://example.edu.cn/480401.pdf",
        )
        major = GroupMajor(
            "G001",
            "480404",
            "针织技术与针织服装",
            "https://example.edu.cn/group",
            "verified",
        )

        result = classify_candidate(attachment, major)

        self.assertEqual(result.status, "major_mismatch")

    def test_rejects_non_training_document(self):
        result = classify_candidate(candidate("机电一体化技术2025级招生简章"), MAJOR)

        self.assertEqual(result.status, "wrong_document_type")


if __name__ == "__main__":
    unittest.main()
