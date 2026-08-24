import argparse
import csv
import hashlib
import json
import os
import sys
import time
from collections import defaultdict, deque
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urlsplit

from .baseline import Baseline
from .catalog import Catalog
from .classifier import classify_candidate
from .discovery import discover_from_html, discover_html_links
from .downloader import MAX_FILE_SIZE, StoreContext, store_bytes
from .http_client import HttpClient
from .models import Candidate, GapRecord
from .qa import run_qa
from .volume_guard import DiskSpaceStop, VolumeDisconnected, VolumeGuard, ensure_disk_space


EXIT_DISCONNECTED = 74
EXIT_DISK_SPACE = 75
MINIMUM_FREE_BYTES = 30 * 1024**3
ALERT_PATH = Path("work/new-double-high-collector-runtime/alerts.jsonl")


def volume_root_for_output(output: Path) -> Path:
    absolute = output.expanduser().absolute()
    parts = absolute.parts
    if len(parts) >= 3 and parts[1] == "Volumes":
        return Path("/") / parts[1] / parts[2]
    return absolute


def _guard(output: Path) -> VolumeGuard:
    return VolumeGuard(volume_root_for_output(output), ALERT_PATH)


def _atomic_json(path: Path, value: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    with temp.open("w", encoding="utf-8") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)


def _atomic_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    with temp.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)


def _read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def _official_hosts(domain: str) -> set[str]:
    host = urlsplit(domain).hostname
    return {host} if host else set()


def _decode_html(data: bytes, content_type: str) -> str:
    charset = "utf-8"
    for part in content_type.split(";")[1:]:
        if "charset=" in part.lower():
            charset = part.split("=", 1)[1].strip().strip('"')
    try:
        return data.decode(charset, errors="replace")
    except LookupError:
        return data.decode("utf-8", errors="replace")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="new-double-high-collector")
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("init-volume", "check-volume"):
        command = commands.add_parser(name)
        command.add_argument("--output", type=Path, required=True)
    command = commands.add_parser("monitor-volume")
    command.add_argument("--output", type=Path, required=True)
    command.add_argument("--interval", type=float, default=5.0)
    command = commands.add_parser("validate-baseline")
    command.add_argument("--baseline", type=Path, required=True)
    for name in ("discover", "download"):
        command = commands.add_parser(name)
        command.add_argument("--baseline", type=Path, required=True)
        command.add_argument("--output", type=Path, required=True)
        command.add_argument("--institution")
        if name == "download":
            command.add_argument("--resume", action="store_true")
    command = commands.add_parser("qa")
    command.add_argument("--baseline", type=Path, required=True)
    command.add_argument("--output", type=Path, required=True)
    return parser


def _init_volume(output: Path) -> int:
    volume = volume_root_for_output(output)
    if not volume.is_dir():
        raise VolumeDisconnected(f"volume path is unavailable: {volume}")
    guard = _guard(output)
    identity = guard.initialize()
    ensure_disk_space(volume, MINIMUM_FREE_BYTES)
    output.mkdir(parents=True, exist_ok=True)
    for name in ("documents", "_catalog", "_logs", "_quarantine"):
        (output / name).mkdir(exist_ok=True)
    Catalog(output)
    print(json.dumps({"volume": identity.mount_path, "st_dev": identity.st_dev, "output": str(output)}, ensure_ascii=False))
    return 0


def _check_volume(output: Path) -> int:
    guard = _guard(output)
    identity = guard.initialize()
    ensure_disk_space(volume_root_for_output(output), MINIMUM_FREE_BYTES)
    digest = guard.smoke_test()
    print(json.dumps({"volume": identity.mount_path, "st_dev": identity.st_dev, "smoke_sha256": digest}, ensure_ascii=False))
    return 0


def _monitor_volume(output: Path, interval: float) -> int:
    if interval <= 0:
        raise ValueError("monitor interval must be positive")
    guard = _guard(output)
    identity = guard.initialize()
    print(
        json.dumps(
            {
                "event": "volume_monitor_started",
                "volume": identity.mount_path,
                "st_dev": identity.st_dev,
                "interval_seconds": interval,
            },
            ensure_ascii=False,
        ),
        flush=True,
    )
    while True:
        time.sleep(interval)
        guard.check()


def _validate_baseline(path: Path) -> int:
    errors = Baseline.load(path).validate()
    for error in errors:
        print(error, file=sys.stderr)
    print(f"{len(errors)} baseline errors")
    return 1 if errors else 0


def _qa(baseline_path: Path, output: Path) -> int:
    report = run_qa(output, Baseline.load(baseline_path))
    _atomic_json(output / "_catalog" / "run_summary.json", report.to_json())
    print(json.dumps(report.to_json(), ensure_ascii=False, indent=2))
    return 1 if report.errors else 0


def _selected_baseline(path: Path, institution_code: Optional[str]) -> Baseline:
    baseline = Baseline.load(path)
    errors = baseline.validate()
    if errors:
        raise ValueError("baseline validation failed: " + "; ".join(errors))
    if institution_code and institution_code not in {row.institution_code for row in baseline.institutions}:
        raise ValueError(f"unknown institution: {institution_code}")
    return baseline


def _discover(baseline_path: Path, output: Path, institution_code: Optional[str]) -> int:
    baseline = _selected_baseline(baseline_path, institution_code)
    seeds = _read_csv(baseline_path / "seeds.csv")
    guard = _guard(output)
    guard.initialize()
    ensure_disk_space(volume_root_for_output(output), MINIMUM_FREE_BYTES)
    Catalog(output)
    client = HttpClient(user_agent="RenpeiCollector/1.0 (+official vocational-education research)")
    groups_by_institution = defaultdict(list)
    majors_by_group = defaultdict(list)
    for group in baseline.groups:
        groups_by_institution[group.institution_code].append(group)
    for major in baseline.majors:
        majors_by_group[major.group_id].append(major)
    candidate_rows: list[dict[str, str]] = []

    for institution in baseline.institutions:
        if institution_code and institution.institution_code != institution_code:
            continue
        institution_seeds = [row["seed_url"] for row in seeds if row.get("institution_code") == institution.institution_code and row.get("verification_status") == "verified"]
        hosts = _official_hosts(institution.official_domain)
        extra_keywords = tuple(
            value
            for group in groups_by_institution[institution.institution_code]
            for major in majors_by_group[group.group_id]
            for value in (major.major_code, major.major_name)
        )
        queue = deque((url, 0) for url in institution_seeds)
        visited: set[str] = set()
        while queue and len(visited) < 500:
            page_url, depth = queue.popleft()
            if page_url in visited:
                continue
            visited.add(page_url)
            guard.check()
            with client.fetch(page_url, allowed_hosts=hosts) as response:
                if response.status != 200:
                    Catalog(output).append_event("discover_http_error", institution.institution_code, page_url, {"status": response.status}, error=True)
                    continue
                html = _decode_html(response.stream.read(10 * 1024 * 1024), response.headers.get("Content-Type", ""))
            for group in groups_by_institution[institution.institution_code]:
                for major in majors_by_group[group.group_id]:
                    for candidate in discover_from_html(group.group_id, major.major_code, page_url, html, hosts):
                        classification = classify_candidate(candidate, major)
                        row = {key: str(value) for key, value in asdict(candidate).items()}
                        row.update({key: str(value) for key, value in asdict(classification).items()})
                        row["institution_code"] = institution.institution_code
                        candidate_rows.append(row)
            if depth < 2:
                for link in discover_html_links(page_url, html, hosts, extra_keywords):
                    if link not in visited:
                        queue.append((link, depth + 1))
        Catalog(output).append_event("institution_discovered", institution.institution_code, institution.official_domain, {"pages": len(visited)})

    unique = {}
    for row in candidate_rows:
        unique[(row["group_id"], row["major_code"], row["download_url"])] = row
    rows = list(unique.values())
    fields = ["institution_code", "group_id", "major_code", "title", "link_text", "filename", "page_text", "source_page_url", "download_url", "status", "year_evidence", "major_evidence", "document_evidence", "notes"]
    guard.check()
    _atomic_csv(output / "_catalog" / "candidates.csv", fields, rows)
    print(f"{len(rows)} candidates")
    return 0


def _stream_bytes(response, guard: VolumeGuard) -> bytes:
    length = response.headers.get("Content-Length")
    if length and int(length) > MAX_FILE_SIZE:
        raise ValueError(f"file exceeds {MAX_FILE_SIZE} bytes")
    chunks: list[bytes] = []
    total = 0
    last_check = time.monotonic()
    while True:
        chunk = response.stream.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_FILE_SIZE:
            raise ValueError(f"file exceeds {MAX_FILE_SIZE} bytes")
        chunks.append(chunk)
        now = time.monotonic()
        if now - last_check >= 5:
            guard.check()
            last_check = now
    guard.check()
    return b"".join(chunks)


def _candidate_rank(row: dict[str, str]) -> tuple[int, str]:
    filename = row.get("filename", "")
    if "三年制" in filename and "三二分段" not in filename and "高本贯通" not in filename:
        priority = 0
    elif "二年制" in filename:
        priority = 1
    elif "三二分段" in filename:
        priority = 2
    elif "高本贯通" in filename:
        priority = 3
    else:
        priority = 4
    return priority, filename


def _download(baseline_path: Path, output: Path, institution_code: Optional[str], resume: bool) -> int:
    baseline = _selected_baseline(baseline_path, institution_code)
    guard = _guard(output)
    guard.initialize()
    catalog = Catalog(output)
    candidates = _read_csv(output / "_catalog" / "candidates.csv")
    manifests = _read_csv(output / "_catalog" / "manifest.csv")
    completed = {row.get("record_id", "") for row in manifests} if resume else set()
    institutions = {row.institution_code: row for row in baseline.institutions}
    groups = {row.group_id: row for row in baseline.groups}
    majors = {(row.group_id, row.major_code): row for row in baseline.majors}
    groups_by_institution = {group.group_id: group.institution_code for group in baseline.groups}
    by_major = defaultdict(list)
    for row in candidates:
        by_major[(row.get("group_id", ""), row.get("major_code", ""))].append(row)
    client = HttpClient(user_agent="RenpeiCollector/1.0 (+official vocational-education research)")
    failures = 0

    for key, major in majors.items():
        group = groups[major.group_id]
        institution = institutions[groups_by_institution[group.group_id]]
        if institution_code and institution.institution_code != institution_code:
            continue
        record_id = f"{major.group_id}/{major.major_code}"
        if record_id in completed:
            catalog.resolve_gap(group.group_id, major.major_code)
            catalog.append_event("resume_skip", record_id, "", {"reason": "terminal manifest exists"})
            continue
        eligible = sorted(
            (row for row in by_major[key] if row.get("status") == "eligible_official_2025"),
            key=_candidate_rank,
        )
        if not eligible:
            statuses = {row.get("status", "") for row in by_major[key]}
            gap_status = "not_found_official_2025" if not statuses else ("wrong_year_only" if statuses == {"wrong_year"} else sorted(statuses)[0])
            catalog.upsert_gap(GapRecord(group.group_id, major.major_code, major.major_name, gap_status, "|".join(sorted({row.get("source_page_url", "") for row in by_major[key]})), datetime.now(timezone.utc).isoformat(), ""))
            continue
        success = False
        hosts = _official_hosts(institution.official_domain)
        for row in eligible:
            try:
                guard.check()
                ensure_disk_space(volume_root_for_output(output), MINIMUM_FREE_BYTES)
                with client.fetch(
                    row["download_url"],
                    allowed_hosts=hosts,
                    referer=row.get("source_page_url") or None,
                ) as response:
                    if response.status != 200:
                        raise ValueError(f"HTTP {response.status}")
                    data = _stream_bytes(response, guard)
                fetched_at = datetime.now(timezone.utc).isoformat()
                context = StoreContext(record_id, group.group_id, institution.province, institution.institution_code, institution.institution_name, group.group_name, major.major_code, major.major_name, "2025", row.get("link_text") or row.get("title") or row.get("filename"), row["source_page_url"], row["download_url"], "", fetched_at, "downloaded_official_2025")
                record = store_bytes(context, data, row["filename"], output, guard)
                catalog.upsert_manifest(record)
                catalog.resolve_gap(group.group_id, major.major_code)
                catalog.append_event("downloaded", record_id, row["download_url"], {"sha256": record.sha256, "bytes": record.file_size_bytes})
                success = True
                break
            except (VolumeDisconnected, DiskSpaceStop):
                raise
            except Exception as error:
                failures += 1
                catalog.append_event("download_error", record_id, row.get("download_url", ""), {"error": str(error)}, error=True)
        if not success:
            catalog.upsert_gap(GapRecord(group.group_id, major.major_code, major.major_name, "manual_review_required", "|".join(row.get("source_page_url", "") for row in eligible), datetime.now(timezone.utc).isoformat(), "all eligible candidates failed"))
    print(f"download completed with {failures} candidate failures")
    return 1 if failures else 0


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "init-volume":
            return _init_volume(args.output)
        if args.command == "check-volume":
            return _check_volume(args.output)
        if args.command == "monitor-volume":
            return _monitor_volume(args.output, args.interval)
        if args.command == "validate-baseline":
            return _validate_baseline(args.baseline)
        if args.command == "qa":
            return _qa(args.baseline, args.output)
        if args.command == "discover":
            return _discover(args.baseline, args.output, args.institution)
        if args.command == "download":
            return _download(args.baseline, args.output, args.institution, args.resume)
        return 2
    except VolumeDisconnected as error:
        print(str(error), file=sys.stderr)
        return EXIT_DISCONNECTED
    except DiskSpaceStop as error:
        print(str(error), file=sys.stderr)
        return EXIT_DISK_SPACE
    except (OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
