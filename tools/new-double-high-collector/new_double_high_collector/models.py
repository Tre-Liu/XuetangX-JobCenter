from dataclasses import asdict, dataclass


VERIFIED = "verified"
PROJECT_TYPES = frozenset({"high_level_school", "high_level_group"})


@dataclass(frozen=True)
class Institution:
    institution_code: str
    province: str
    institution_name: str
    official_domain: str
    aliases: tuple[str, ...]


@dataclass(frozen=True)
class ProfessionalGroup:
    group_id: str
    institution_code: str
    project_type: str
    group_name: str
    group_evidence_url: str
    verification_status: str


@dataclass(frozen=True)
class GroupMajor:
    group_id: str
    major_code: str
    major_name: str
    membership_evidence_url: str
    verification_status: str


@dataclass(frozen=True)
class Candidate:
    group_id: str
    major_code: str
    title: str
    link_text: str
    filename: str
    page_text: str
    source_page_url: str
    download_url: str


@dataclass(frozen=True)
class Classification:
    status: str
    year_evidence: str
    major_evidence: str
    document_evidence: str
    notes: str


@dataclass(frozen=True)
class DownloadRecord:
    record_id: str
    group_id: str
    major_code: str
    major_name: str
    grade_year: str
    document_title: str
    source_page_url: str
    download_url: str
    source_domain: str
    published_at: str
    fetched_at: str
    content_type: str
    file_size_bytes: int
    sha256: str
    relative_path: str
    version_status: str
    verification_status: str
    notes: str

    def to_row(self) -> dict[str, str]:
        values = asdict(self)
        return {key: str(value) for key, value in values.items()}


@dataclass(frozen=True)
class GapRecord:
    group_id: str
    major_code: str
    major_name: str
    gap_status: str
    checked_urls: str
    checked_at: str
    notes: str

    def to_row(self) -> dict[str, str]:
        return asdict(self)
