import json
import zipfile
from collections import Counter
from pathlib import Path


ROOT = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程")
WORK = ROOT / ".tmp/enterprise-name-audit"
OUTPUT = ROOT / "outputs/enterprise-name-cleaning/产业链企业名称清洗处理结果.xlsx"
RULES = ROOT / "outputs/enterprise-name-cleaning/产业链企业名称数据清洗规则.md"


with (WORK / "enterprise-cleaning-results.json").open(encoding="utf-8") as handle:
    data = json.load(handle)

issues = data["issues"]
conflicts = data["conflicts"]
assert len(issues) == data["metadata"]["issue_entities"] == 35_538
assert len(conflicts) == data["metadata"]["conflict_entities"] == 245
assert sum(data["action_counts"].values()) == len(issues)
assert sum(data["severity_counts"].values()) == len(issues)
assert Counter(item["record_action"] for item in issues) == Counter(data["action_counts"])
assert Counter(item["severity"] for item in issues) == Counter(data["severity_counts"])
assert all(item["record_action"] and item["severity"] and item["reason_codes"] and item["sources"] for item in issues)

target = [item for item in issues if item.get("credit_code") == "91440300053864005T"]
assert len(target) == 1
target = target[0]
assert target["record_action"] == "QUARANTINE"
assert target["severity"] == "Critical"
assert "JUDICIAL_NAME_INVALID" in target["reason_codes"]
assert target["company_name_clean"] is None
target_refs = {(source["file"], source["sheet"], source["row"]) for source in target["sources"]}
assert any("风电产业链.xlsx" in file and sheet == "基础信息" and row == 4171 for file, sheet, row in target_refs)
assert any("IDC产业链.xlsx" in file and sheet == "基础信息" and row == 5533 for file, sheet, row in target_refs)

summary = json.loads((WORK / "summary-inspect.ndjson").read_text(encoding="utf-8").splitlines()[0])
values = summary["values"]
assert values[3][1] == 71
assert values[3][3] == 2_127_518
assert values[3][5] == 1_359_208
assert values[3][7] == 35_538
summary_reasons = {row[0]: row[1] for row in values[13:28] if row[0]}
assert summary_reasons == data["reason_counts"]

formula_scan = [json.loads(line) for line in (WORK / "formula-errors.ndjson").read_text(encoding="utf-8").splitlines() if line]
assert not any(item.get("kind") in {"error", "match"} for item in formula_scan)

assert RULES.is_file()
assert OUTPUT.is_file() and OUTPUT.stat().st_size > 1_000_000
with zipfile.ZipFile(OUTPUT) as archive:
    workbook_xml = archive.read("xl/workbook.xml").decode("utf-8")
    for sheet_name in ("处理汇总", "异常企业明细", "名称冲突", "规则说明"):
        assert sheet_name in workbook_xml
    target_bytes = b"91440300053864005T"
    assert any(target_bytes in archive.read(name) for name in archive.namelist() if name.endswith(".xml"))

print(json.dumps({
    "tests_expected": 9,
    "input_records": data["metadata"]["input_records"],
    "unique_entities": data["metadata"]["unique_entities"],
    "issue_entities": len(issues),
    "conflict_entities": len(conflicts),
    "action_counts": data["action_counts"],
    "severity_counts": data["severity_counts"],
    "target_sources": sorted([list(item) for item in target_refs]),
    "formula_error_matches": 0,
    "workbook_bytes": OUTPUT.stat().st_size,
    "sheets": ["处理汇总", "异常企业明细", "名称冲突", "规则说明"],
}, ensure_ascii=False, indent=2))
