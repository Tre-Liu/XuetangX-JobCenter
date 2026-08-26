import re

from .models import Candidate, Classification, GroupMajor


TRAINING_PLAN_PATTERN = re.compile(r"人才培养方案|培养方案")
EXPLICIT_2025_PATTERN = re.compile(
    r"2025\s*(?:级|版)|2025\s*年[^。；]{0,20}培养方案|"
    r"2025\s*[-—_]\s*(?:二年制|三年制|三二分段|高本贯通)[^。；]{0,30}培养方案"
)
COHORT_PATTERN = re.compile(r"(20\d{2})\s*(?:级|版)")
ACADEMIC_YEAR_PATTERN = re.compile(r"20\d{2}\s*[-—至/]\s*20\d{2}\s*学年")


def _combined(candidate: Candidate) -> str:
    return " ".join(
        value
        for value in (
            candidate.title,
            candidate.link_text,
            candidate.filename,
            candidate.page_text,
        )
        if value
    )


def _attachment_identity(candidate: Candidate) -> str:
    return " ".join(
        value
        for value in (
            candidate.title,
            candidate.link_text,
            candidate.filename,
        )
        if value
    )


def classify_candidate(candidate: Candidate, major: GroupMajor) -> Classification:
    text = _combined(candidate)
    attachment_text = _attachment_identity(candidate)
    document_match = TRAINING_PLAN_PATTERN.search(text)
    if not document_match:
        return Classification(
            status="wrong_document_type",
            year_evidence="",
            major_evidence="",
            document_evidence="未出现人才培养方案或培养方案",
            notes="",
        )

    explicit_2025 = EXPLICIT_2025_PATTERN.search(attachment_text)
    cohort_years = COHORT_PATTERN.findall(attachment_text)
    if any(year != "2025" for year in cohort_years) and not explicit_2025:
        return Classification(
            status="wrong_year",
            year_evidence="、".join(sorted(set(cohort_years))),
            major_evidence="",
            document_evidence=document_match.group(0),
            notes="",
        )
    if not explicit_2025:
        year_note = ACADEMIC_YEAR_PATTERN.search(attachment_text)
        return Classification(
            status="year_ambiguous",
            year_evidence=year_note.group(0) if year_note else "未找到2025级或2025版",
            major_evidence="",
            document_evidence=document_match.group(0),
            notes="",
        )

    major_evidence = ""
    if major.major_code and major.major_code in attachment_text:
        major_evidence = major.major_code
    elif major.major_name and major.major_name in attachment_text:
        major_evidence = major.major_name
    elif major.major_name:
        for terminal_suffix in ("技术", "与管理"):
            if not major.major_name.endswith(terminal_suffix):
                continue
            shortened_name = major.major_name.removesuffix(terminal_suffix)
            shortened_pattern = re.compile(
                rf"{re.escape(shortened_name)}(?:专业)?(?:人才)?培养方案"
            )
            if shortened_name and shortened_pattern.search(attachment_text):
                major_evidence = shortened_name
                break
    if not major_evidence:
        return Classification(
            status="major_mismatch",
            year_evidence=explicit_2025.group(0),
            major_evidence="未找到专业代码或名称",
            document_evidence=document_match.group(0),
            notes="",
        )

    return Classification(
        status="eligible_official_2025",
        year_evidence=explicit_2025.group(0),
        major_evidence=major_evidence,
        document_evidence=document_match.group(0),
        notes="",
    )
