import csv
import hashlib
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

from .baseline import Baseline


VALID_DOWNLOAD_STATUSES = {
    "downloaded_official_2025",
    "derived_pdf_from_official_page_images_2025",
}
VALID_GAP_STATUSES = {
    "not_found_official_2025",
    "year_ambiguous",
    "wrong_year_only",
    "wrong_document_type",
    "major_mismatch",
    "access_blocked",
    "manual_review_required",
}


def _rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def _official(host: str, baseline: Baseline) -> bool:
    normalized = host.lower().rstrip(".")
    for institution in baseline.institutions:
        official = (urlsplit(institution.official_domain).hostname or "").lower().rstrip(".")
        allowed_roots = {official}
        if official.startswith("www."):
            allowed_roots.add(official.removeprefix("www."))
        for allowed in allowed_roots:
            if normalized == allowed or normalized.endswith("." + allowed):
                return True
    return False


@dataclass
class QaReport:
    errors: list[str]
    institutions_checked: int
    groups_checked: int
    majors_checked: int
    downloaded_records: int
    gaps_by_status: dict[str, int]
    downloaded_bytes: int

    def to_json(self) -> dict[str, object]:
        return {
            "errors": self.errors,
            "institutions_checked": self.institutions_checked,
            "groups_checked": self.groups_checked,
            "majors_checked": self.majors_checked,
            "downloaded_records": self.downloaded_records,
            "gaps_by_status": self.gaps_by_status,
            "downloaded_bytes": self.downloaded_bytes,
        }


def run_qa(root: Path, baseline: Baseline) -> QaReport:
    errors = list(baseline.validate())
    manifests = _rows(root / "_catalog" / "manifest.csv")
    gaps = _rows(root / "_catalog" / "gaps.csv")
    manifest_keys = [row.get("record_id", "") or f'{row.get("group_id", "")}/{row.get("major_code", "")}' for row in manifests]
    gap_keys = [f'{row.get("group_id", "")}/{row.get("major_code", "")}' for row in gaps]

    for key, count in Counter(manifest_keys).items():
        if key and count > 1:
            errors.append(f"{key} has duplicate manifest records")
    overlap = set(manifest_keys) & set(gap_keys)
    errors.extend(f"{key} appears in both manifest and gaps" for key in sorted(overlap))

    for major in baseline.majors:
        if major.verification_status != "verified":
            continue
        key = f"{major.group_id}/{major.major_code}"
        if key not in manifest_keys and key not in gap_keys:
            errors.append(f"{key} has no terminal state")

    downloaded_bytes = 0
    for row in manifests:
        key = row.get("record_id", "unknown")
        status = row.get("verification_status", "")
        if status not in VALID_DOWNLOAD_STATUSES:
            errors.append(f"{key} has invalid download status {status}")
        if row.get("grade_year") != "2025":
            errors.append(f"{key} is not a 2025 plan")
        host = row.get("source_domain") or (urlsplit(row.get("download_url", "")).hostname or "")
        if not _official(host, baseline):
            errors.append(f"{key} uses non-official domain {host}")
        relative = Path(row.get("relative_path", ""))
        if relative.is_absolute() or ".." in relative.parts:
            errors.append(f"{key} has unsafe relative path")
            continue
        path = root / relative
        if not path.is_file():
            errors.append(f"{key} file is missing: {relative}")
            continue
        data = path.read_bytes()
        try:
            expected_size = int(row.get("file_size_bytes", ""))
        except ValueError:
            expected_size = -1
        if expected_size != len(data):
            errors.append(f"{key} file size mismatch")
        if row.get("sha256") != hashlib.sha256(data).hexdigest():
            errors.append(f"{key} sha256 mismatch")
        downloaded_bytes += len(data)

    gap_counts = Counter(row.get("gap_status", "") for row in gaps)
    for row in gaps:
        status = row.get("gap_status", "")
        if status not in VALID_GAP_STATUSES:
            errors.append(f'{row.get("group_id", "")}/{row.get("major_code", "")} has invalid gap status {status}')

    return QaReport(
        errors=errors,
        institutions_checked=len(baseline.institutions),
        groups_checked=len(baseline.groups),
        majors_checked=len(baseline.majors),
        downloaded_records=len(manifests),
        gaps_by_status=dict(sorted(gap_counts.items())),
        downloaded_bytes=downloaded_bytes,
    )
