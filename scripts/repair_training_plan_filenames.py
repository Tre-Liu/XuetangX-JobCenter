#!/usr/bin/env python3
"""Audit and repair machine-generated training-plan PDF filenames."""

from __future__ import annotations

import argparse
import html
import csv
import hashlib
import json
import os
import re
import shutil
import unicodedata
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen


UUID_RE = re.compile(
    r"^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.pdf$", re.IGNORECASE
)
HEX32_RE = re.compile(r"^[0-9a-f]{32}\.pdf$", re.IGNORECASE)
VSB_HASH_RE = re.compile(
    r"^[0-9a-f]{20,}_[0-9a-f]{6,}_[0-9a-f]{4,}\.pdf$", re.IGNORECASE
)
TIMESTAMP_TOKEN_RE = re.compile(r"^\d{8,}[a-z0-9]{4,}\.pdf$", re.IGNORECASE)
SHORT_HASH_RE = re.compile(r"^[0-9a-f]{10}\.pdf$", re.IGNORECASE)
GENERIC_MACHINE_NAMES = {"virtual_attach_file.pdf"}
GENERIC_LINK_TEXT = {"pdf", "pdf文件", "pdf 文件", "附件", "下载", "点击下载"}


def is_machine_filename(name: str) -> bool:
    normalized = PurePosixPath(str(name)).name.strip()
    return normalized.lower() in GENERIC_MACHINE_NAMES or any(
        pattern.fullmatch(normalized)
        for pattern in (
            UUID_RE,
            HEX32_RE,
            VSB_HASH_RE,
            TIMESTAMP_TOKEN_RE,
            SHORT_HASH_RE,
        )
    )


def sanitize_filename(name: str) -> str:
    normalized = unicodedata.normalize("NFC", html.unescape(str(name))).strip()
    normalized = re.sub(r"[\\/:*?\"<>|：]+", "-", normalized)
    normalized = re.sub(r"\s+", " ", normalized)
    normalized = re.sub(r"-{2,}", "-", normalized).strip(" .-")
    if not normalized.lower().endswith(".pdf"):
        normalized += ".pdf"
    return normalized


def _url_basename(value: str) -> str:
    return unquote(PurePosixPath(urlsplit(value).path).name)


def _title_from_sudy_attr(value: str) -> str | None:
    decoded = html.unescape(value or "")
    match = re.search(
        r"(?:['\"]?title['\"]?)\s*:\s*['\"]?([^'\"}\r\n]+?\.pdf)",
        decoded,
        flags=re.IGNORECASE,
    )
    return sanitize_filename(match.group(1)) if match else None


def _meaningful_anchor_filename(text: str) -> str | None:
    candidate = re.sub(r"\s+", " ", html.unescape(text or "")).strip()
    if candidate.lower() in GENERIC_LINK_TEXT:
        return None
    if candidate.lower().endswith(".pdf") and not is_machine_filename(candidate):
        return sanitize_filename(candidate)
    return None


class _OfficialFilenameParser(HTMLParser):
    def __init__(self, target_basename: str):
        super().__init__(convert_charrefs=True)
        self.target_basename = target_basename
        self.candidates: list[str] = []
        self._anchor_depth = 0
        self._matching_anchor = False
        self._anchor_text: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        attr_map = {key.lower(): value or "" for key, value in attrs}
        linked_values = [
            attr_map.get(key, "") for key in ("href", "pdfsrc", "src", "data-src")
        ]
        matches_target = any(
            _url_basename(value) == self.target_basename
            for value in linked_values
            if value
        )
        if matches_target:
            official = _title_from_sudy_attr(attr_map.get("sudyfile-attr", ""))
            if official:
                self.candidates.append(official)
        if tag.lower() == "a":
            self._anchor_depth = 1
            self._matching_anchor = matches_target
            self._anchor_text = []
        elif self._anchor_depth:
            self._anchor_depth += 1

    def handle_data(self, data: str):
        if self._matching_anchor:
            self._anchor_text.append(data)

    def handle_endtag(self, tag: str):
        if not self._anchor_depth:
            return
        if tag.lower() == "a" and self._anchor_depth == 1:
            if self._matching_anchor:
                official = _meaningful_anchor_filename("".join(self._anchor_text))
                if official:
                    self.candidates.append(official)
            self._anchor_depth = 0
            self._matching_anchor = False
            self._anchor_text = []
        else:
            self._anchor_depth -= 1


def extract_official_filename(page_html: str, download_url: str) -> str | None:
    target_basename = _url_basename(download_url)
    parser = _OfficialFilenameParser(target_basename)
    parser.feed(page_html or "")
    return parser.candidates[0] if parser.candidates else None


def _without_code_prefix(value: str) -> str:
    return value.split("_", 1)[1] if "_" in value else value


def fallback_filename(relative_path: str) -> str:
    parts = PurePosixPath(relative_path).parts
    if len(parts) < 5:
        raise ValueError(f"无法从路径提取学校、专业群和专业: {relative_path}")
    school = _without_code_prefix(parts[-4])
    professional_group = parts[-3]
    major = _without_code_prefix(parts[-2])
    return sanitize_filename(f"{school}-{professional_group}-{major}.pdf")


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or ()), list(reader)


def _candidate_filenames(catalog_root: Path) -> dict[str, str]:
    candidates_path = catalog_root / "_catalog/candidates.csv"
    if not candidates_path.exists():
        return {}
    _, rows = _read_csv(candidates_path)
    result: dict[str, str] = {}
    for row in rows:
        official = _meaningful_anchor_filename(row.get("link_text", ""))
        if official and row.get("download_url"):
            result.setdefault(row["download_url"], official)
    return result


def _is_html_page(source_page_url: str, download_url: str) -> bool:
    if not source_page_url or source_page_url == download_url:
        return False
    return PurePosixPath(urlsplit(source_page_url).path).suffix.lower() not in {
        ".pdf",
        ".doc",
        ".docx",
    }


def build_repair_plan(
    catalog_root: str | Path,
    *,
    page_loader=None,
) -> list[dict[str, str]]:
    root = Path(catalog_root)
    manifest_path = root / "_catalog/manifest.csv"
    _, manifest_rows = _read_csv(manifest_path)
    candidate_names = _candidate_filenames(root)
    page_cache: dict[str, str] = {}
    plan: list[dict[str, str]] = []
    planned_targets: set[str] = set()

    for row in manifest_rows:
        old_relative = row.get("relative_path", "")
        old_filename = PurePosixPath(old_relative).name
        if not is_machine_filename(old_filename):
            continue
        old_path = root / old_relative
        if not old_path.is_file():
            raise FileNotFoundError(f"manifest 文件不存在: {old_relative}")
        expected_sha = row.get("sha256", "").lower()
        actual_sha = _sha256(old_path)
        if expected_sha and actual_sha != expected_sha:
            raise ValueError(
                f"SHA-256 不一致: {old_relative} expected={expected_sha} actual={actual_sha}"
            )

        official_name = None
        source_page_url = row.get("source_page_url", "")
        download_url = row.get("download_url", "")
        if page_loader and _is_html_page(source_page_url, download_url):
            if source_page_url not in page_cache:
                page_cache[source_page_url] = page_loader(source_page_url) or ""
            official_name = extract_official_filename(
                page_cache[source_page_url], download_url
            )
        if official_name:
            naming_basis = "官网附件标题"
        else:
            official_name = candidate_names.get(download_url)
            naming_basis = "官网链接文字" if official_name else ""
        if not official_name:
            official_name = fallback_filename(old_relative)
            naming_basis = "学校-专业群-专业兜底"

        new_filename = sanitize_filename(official_name)
        new_relative = str(PurePosixPath(old_relative).with_name(new_filename))
        if new_relative in planned_targets:
            raise ValueError(f"改名目标重复: {new_relative}")
        planned_targets.add(new_relative)
        new_path = root / new_relative
        if new_path.exists() and new_path != old_path:
            raise FileExistsError(f"改名目标已存在: {new_relative}")
        plan.append(
            {
                "record_id": row.get("record_id", ""),
                "old_filename": old_filename,
                "new_filename": new_filename,
                "old_relative_path": old_relative,
                "new_relative_path": new_relative,
                "naming_basis": naming_basis,
                "source_page_url": source_page_url,
                "download_url": download_url,
                "sha256": actual_sha,
                "status": "待执行",
            }
        )
    return plan


def apply_repair_plan(
    catalog_root: str | Path,
    plan: list[dict[str, str]],
    *,
    backup_path: str | Path,
) -> None:
    root = Path(catalog_root)
    manifest_path = root / "_catalog/manifest.csv"
    backup = Path(backup_path)
    fieldnames, manifest_rows = _read_csv(manifest_path)
    mapping = {row["old_relative_path"]: row["new_relative_path"] for row in plan}
    if len(mapping) != len(plan):
        raise ValueError("修复计划包含重复旧路径")

    for row in plan:
        old_path = root / row["old_relative_path"]
        new_path = root / row["new_relative_path"]
        if not old_path.is_file():
            raise FileNotFoundError(f"待改名文件不存在: {row['old_relative_path']}")
        if _sha256(old_path) != row["sha256"]:
            raise ValueError(f"执行前 SHA-256 已变化: {row['old_relative_path']}")
        if new_path.exists() and new_path != old_path:
            raise FileExistsError(f"改名目标已存在: {row['new_relative_path']}")

    backup.parent.mkdir(parents=True, exist_ok=True)
    if backup.exists():
        raise FileExistsError(f"manifest 备份已存在: {backup}")
    shutil.copy2(manifest_path, backup)
    renamed: list[tuple[Path, Path]] = []
    temp_manifest = manifest_path.with_name(manifest_path.name + ".tmp-filename-repair")
    try:
        for row in plan:
            old_path = root / row["old_relative_path"]
            new_path = root / row["new_relative_path"]
            old_path.rename(new_path)
            renamed.append((old_path, new_path))
            row["status"] = "已执行"
        for manifest_row in manifest_rows:
            if manifest_row.get("relative_path") in mapping:
                manifest_row["relative_path"] = mapping[manifest_row["relative_path"]]
        with temp_manifest.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(manifest_rows)
        os.replace(temp_manifest, manifest_path)
    except Exception:
        if temp_manifest.exists():
            temp_manifest.unlink()
        for old_path, new_path in reversed(renamed):
            if new_path.exists() and not old_path.exists():
                new_path.rename(old_path)
        shutil.copy2(backup, manifest_path)
        raise


def write_audit_csv(plan: list[dict[str, str]], output_path: str | Path) -> None:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "record_id",
        "old_filename",
        "new_filename",
        "old_relative_path",
        "new_relative_path",
        "naming_basis",
        "source_page_url",
        "download_url",
        "sha256",
        "status",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(plan)


PATH_KEYS = {
    "source_path",
    "来源路径",
    "representative_path",
    "代表文件",
}
FILENAME_KEYS = {"source_file", "参考人培文件", "文件名"}


def update_json_file(path: str | Path, path_mapping: dict[str, str]) -> int:
    json_path = Path(path)
    payload = json.loads(json_path.read_text(encoding="utf-8"))

    def update(value) -> int:
        changes = 0
        if isinstance(value, dict):
            matched_new_paths = []
            for key in PATH_KEYS:
                current = value.get(key)
                if isinstance(current, str) and current in path_mapping:
                    value[key] = path_mapping[current]
                    matched_new_paths.append(value[key])
            if matched_new_paths:
                new_filename = PurePosixPath(matched_new_paths[0]).name
                for key in FILENAME_KEYS:
                    if key in value:
                        value[key] = new_filename
                changes += 1
            for key, child in value.items():
                if key not in PATH_KEYS and key not in FILENAME_KEYS:
                    changes += update(child)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                if isinstance(child, str) and child in path_mapping:
                    value[index] = path_mapping[child]
                    changes += 1
                else:
                    changes += update(child)
        return changes

    changes = update(payload)
    if changes:
        temp_path = json_path.with_name(json_path.name + ".tmp-filename-repair")
        temp_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        os.replace(temp_path, json_path)
    return changes


def _http_page_loader(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(request, timeout=30) as response:
            data = response.read()
            charset = response.headers.get_content_charset() or "utf-8"
        return data.decode(charset, errors="replace")
    except Exception:
        return ""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog-root", required=True, type=Path)
    parser.add_argument("--audit-csv", required=True, type=Path)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--backup-path", type=Path)
    parser.add_argument("--json-files", nargs="*", type=Path, default=[])
    args = parser.parse_args()

    plan = build_repair_plan(args.catalog_root, page_loader=_http_page_loader)
    write_audit_csv(plan, args.audit_csv)
    updated_json = {}
    if args.apply:
        backup_path = args.backup_path or (
            args.catalog_root / "_catalog/manifest.before-filename-repair-20260903.csv"
        )
        apply_repair_plan(args.catalog_root, plan, backup_path=backup_path)
        write_audit_csv(plan, args.audit_csv)
        full_mapping = {}
        for row in plan:
            full_mapping[row["old_relative_path"]] = row["new_relative_path"]
            full_mapping[str(args.catalog_root / row["old_relative_path"])] = str(
                args.catalog_root / row["new_relative_path"]
            )
        for json_file in args.json_files:
            updated_json[str(json_file)] = update_json_file(json_file, full_mapping)

    basis_counts = {}
    for row in plan:
        basis_counts[row["naming_basis"]] = basis_counts.get(row["naming_basis"], 0) + 1
    print(
        json.dumps(
            {
                "mode": "apply" if args.apply else "dry-run",
                "planned_rows": len(plan),
                "naming_basis": basis_counts,
                "audit_csv": str(args.audit_csv),
                "updated_json": updated_json,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
