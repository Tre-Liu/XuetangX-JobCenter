#!/usr/bin/env python3
import json
import sqlite3
from pathlib import Path


base = Path(__file__).resolve().parent
d = json.loads((base / "analysis_results.json").read_text(encoding="utf-8"))
a = json.loads((base / "artifact_payload.json").read_text(encoding="utf-8"))
total = d["rows"]

assert d["malformed_rows"] == 0
assert sum(x["count"] for x in d["top"]["family"]) == total
assert sum(x["count"] for x in d["top"]["month"]) == total
assert sum(x["count"] for x in d["top"]["salary_band"]) == d["salary"]["valid_count"]
assert d["duplicates_repost_key_hash"]["duplicate_rows"] + d["duplicates_repost_key_hash"]["unique"] == total
assert d["dedup_repost_key"]["rows"] == d["duplicates_repost_key_hash"]["unique"]
assert sum(d["dedup_repost_key"]["family"].values()) == d["dedup_repost_key"]["rows"]
assert a["snapshot"]["datasets"]["summary"][0]["招聘记录"] == total
assert len(a["manifest"]["charts"]) == 3
assert len(a["manifest"]["tables"]) == 4
assert a["manifest"]["blocks"][0]["body"] == "# " + a["manifest"]["title"]

conn = sqlite3.connect(base / "report_data.sqlite")
expected = {name: len(rows) for name, rows in a["snapshot"]["datasets"].items()}
actual = {name: conn.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0] for name in expected}
conn.close()
assert actual == expected

print(json.dumps({
    "status": "passed",
    "logical_rows": total,
    "family_total": sum(x["count"] for x in d["top"]["family"]),
    "salary_valid_rows": d["salary"]["valid_count"],
    "salary_band_total": sum(x["count"] for x in d["top"]["salary_band"]),
    "dedup_key_unique": d["dedup_repost_key"]["rows"],
    "artifact_charts": len(a["manifest"]["charts"]),
    "artifact_tables": len(a["manifest"]["tables"]),
    "sqlite_rows": actual,
}, ensure_ascii=False, indent=2))
