import csv
import json
import os
from dataclasses import fields
from datetime import datetime, timezone
from pathlib import Path

from .models import DownloadRecord, GapRecord


class Catalog:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.catalog_dir = root / "_catalog"
        self.logs_dir = root / "_logs"
        self.catalog_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)

    def upsert_manifest(self, record: DownloadRecord) -> None:
        self._upsert(
            self.catalog_dir / "manifest.csv",
            [field.name for field in fields(DownloadRecord)],
            record.to_row(),
            ("record_id",),
        )

    def upsert_gap(self, record: GapRecord) -> None:
        self._upsert(
            self.catalog_dir / "gaps.csv",
            [field.name for field in fields(GapRecord)],
            record.to_row(),
            ("group_id", "major_code"),
        )

    def append_event(
        self,
        event_type: str,
        record_id: str,
        url: str,
        details: dict,
        error: bool = False,
    ) -> None:
        path = self.logs_dir / ("errors.jsonl" if error else "events.jsonl")
        event = {
            "event_type": event_type,
            "record_id": record_id,
            "url": url,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": details,
        }
        with path.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(event, ensure_ascii=False) + "\n")

    def _upsert(
        self,
        path: Path,
        fieldnames: list[str],
        row: dict[str, str],
        key_fields: tuple[str, ...],
    ) -> None:
        existing: list[dict[str, str]] = []
        if path.exists():
            with path.open("r", encoding="utf-8-sig", newline="") as stream:
                existing = list(csv.DictReader(stream))
        key = tuple(row[field] for field in key_fields)
        output = [
            old
            for old in existing
            if tuple(old.get(field, "") for field in key_fields) != key
        ]
        output.append(row)
        temp_path = path.with_name(path.name + ".tmp")
        with temp_path.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(output)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_path, path)
