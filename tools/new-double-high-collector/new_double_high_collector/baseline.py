import csv
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from .models import (
    PROJECT_TYPES,
    VERIFIED,
    GroupMajor,
    Institution,
    ProfessionalGroup,
)


def _read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        return [
            {key: (value or "").strip() for key, value in row.items()}
            for row in csv.DictReader(stream)
        ]


def _is_https_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def _is_major_code(value: str) -> bool:
    return len(value) in (6, 7) and value[:6].isdigit() and (
        len(value) == 6 or value[6] == "K"
    )


@dataclass(frozen=True)
class Baseline:
    institutions: tuple[Institution, ...]
    groups: tuple[ProfessionalGroup, ...]
    majors: tuple[GroupMajor, ...]

    @classmethod
    def load(cls, root: Path) -> "Baseline":
        institution_rows = _read_rows(root / "institutions.csv")
        group_rows = _read_rows(root / "professional_groups.csv")
        major_rows = _read_rows(root / "group_majors.csv")

        institutions = tuple(
            Institution(
                institution_code=row["institution_code"],
                province=row["province"],
                institution_name=row["institution_name"],
                official_domain=row["official_domain"].rstrip("/"),
                aliases=tuple(
                    alias.strip()
                    for alias in row.get("aliases", "").split("|")
                    if alias.strip()
                ),
            )
            for row in institution_rows
        )
        groups = tuple(
            ProfessionalGroup(
                group_id=row["group_id"],
                institution_code=row["institution_code"],
                project_type=row["project_type"],
                group_name=row["group_name"],
                group_evidence_url=row["group_evidence_url"],
                verification_status=row["verification_status"],
            )
            for row in group_rows
        )
        majors = tuple(
            GroupMajor(
                group_id=row["group_id"],
                major_code=row["major_code"],
                major_name=row["major_name"],
                membership_evidence_url=row["membership_evidence_url"],
                verification_status=row["verification_status"],
            )
            for row in major_rows
        )
        return cls(institutions=institutions, groups=groups, majors=majors)

    def validate(self) -> list[str]:
        errors: list[str] = []
        institution_ids = [row.institution_code for row in self.institutions]
        group_ids = [row.group_id for row in self.groups]

        for value, count in Counter(institution_ids).items():
            if count > 1:
                errors.append(f"{value}: duplicate institution_code")
        for value, count in Counter(group_ids).items():
            if count > 1:
                errors.append(f"{value}: duplicate group_id")

        institution_id_set = set(institution_ids)
        group_id_set = set(group_ids)

        for institution in self.institutions:
            if not institution.institution_code:
                errors.append("institution row: institution_code is required")
            if not institution.institution_name:
                errors.append(f"{institution.institution_code}: institution_name is required")
            if not _is_https_url(institution.official_domain):
                errors.append(
                    f"{institution.institution_code}: official_domain must be an HTTPS URL"
                )

        for group in self.groups:
            if group.institution_code not in institution_id_set:
                errors.append(f"{group.group_id}: missing parent institution")
            if group.project_type not in PROJECT_TYPES:
                errors.append(f"{group.group_id}: invalid project_type")
            if group.verification_status == VERIFIED and not _is_https_url(
                group.group_evidence_url
            ):
                errors.append(
                    f"{group.group_id}: verified group requires official evidence URL"
                )

        for major in self.majors:
            record_id = f"{major.group_id}/{major.major_code}"
            if major.group_id not in group_id_set:
                errors.append(f"{record_id}: missing parent group")
            if major.verification_status == VERIFIED and not _is_major_code(
                major.major_code
            ):
                errors.append(
                    f"{record_id}: verified major_code must be six digits"
                )
            if major.verification_status == VERIFIED and not _is_https_url(
                major.membership_evidence_url
            ):
                errors.append(
                    f"{record_id}: verified major requires official evidence URL"
                )

        return errors
