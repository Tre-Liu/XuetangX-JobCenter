from __future__ import annotations

import collections
import json
import re
import sys
import unicodedata
import zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET


ROOT = Path("/Users/liuhongzhe/Desktop/2025年最新产业链企业相关数据")
OUT = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/.tmp/enterprise-name-audit/audit-summary.json")

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

HEADER_ALIASES = {
    "name": {"企业名称", "公司名称", "企业全称", "单位名称", "名称", "原文件导入名称"},
    "credit": {"统一社会信用代码", "统一信用代码", "社会信用代码", "信用代码"},
    "status": {"经营状态", "企业状态", "登记状态", "状态"},
}

PLACEHOLDER_RE = re.compile(r"^(?:[-—–_/\\.·*]+|无|暂无|未知|未公开|未披露|空|null|none|n/?a|nan|0)$", re.I)
COURT_RE = re.compile(r"(?:企业)?名称.*?(?:人民法院|登记机关).*?(?:不适宜|不予使用|认定)")
STATUS_IN_NAME_RE = re.compile(r"[（(\[][^）)\]]*(?:注销|吊销|撤销|迁出|清算|歇业|停业|除名|责令关闭|证书废止|已告解散|不适宜|名称已被认定)[^）)\]]*[）)\]]")
URL_EMAIL_RE = re.compile(r"(?:https?://|www\.|@[a-z0-9.-]+\.[a-z]{2,})", re.I)
PHONE_RE = re.compile(r"^(?:\+?86[- ]?)?(?:1[3-9]\d{9}|0\d{2,3}[- ]?\d{7,8})$")
PURE_NUMBER_RE = re.compile(r"^\d+(?:\.0+)?$")
CODEISH_RE = re.compile(r"^[0-9A-Z]{15,20}$", re.I)
BAD_ENCODING_RE = re.compile(r"(?:�|锟斤拷|烫烫烫|屯屯屯|\?{3,})")
CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u200b\ufeff]")
LEGAL_FORM_RE = re.compile(
    r"(?:公司|集团|厂|店|所|中心|院|局|社|场|站|部|行|馆|事务所|合作社|合伙企业|"
    r"研究院|工作室|委员会|协会|学校|医院|基金会|实验室|银行|大学|商会|联社|家庭农场|"
    r"分公司|分行|支行|营业部|办事处|农场|矿|队|个体工商户)$"
)
INACTIVE_STATUS_RE = re.compile(r"(?:注销|吊销|撤销|已告解散|清算|歇业|停业|关闭|迁出|非正常|除名|失效)")
ACTIVE_STATUS_RE = re.compile(r"(?:存续|在业|开业|正常|经营|在营|在册)")


def normalize_text(value: object) -> str:
    if value is None:
        return ""
    text = unicodedata.normalize("NFKC", str(value))
    text = CONTROL_RE.sub("", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_name_key(name: str) -> str:
    text = normalize_text(name).lower()
    return re.sub(r"[\s·•・,，.。;；:：'\"“”‘’`~!！?？()（）\[\]【】{}<>《》_-]+", "", text)


def valid_credit(code: str) -> bool:
    code = normalize_text(code).upper().replace(" ", "")
    return bool(re.fullmatch(r"[0-9A-Z]{18}", code))


def column_number(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref.upper())
    if not letters:
        return -1
    num = 0
    for ch in letters.group(0):
        num = num * 26 + ord(ch) - 64
    return num


def row_number(cell_ref: str) -> int:
    match = re.search(r"\d+", cell_ref)
    return int(match.group(0)) if match else -1


def read_shared_strings(book: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in book.namelist():
        return []
    strings: list[str] = []
    with book.open("xl/sharedStrings.xml") as source:
        for _event, elem in ET.iterparse(source, events=("end",)):
            if elem.tag == f"{{{MAIN_NS}}}si":
                strings.append("".join(node.text or "" for node in elem.iter(f"{{{MAIN_NS}}}t")))
                elem.clear()
    return strings


def workbook_sheets(book: zipfile.ZipFile) -> list[tuple[str, str]]:
    workbook = ET.parse(book.open("xl/workbook.xml")).getroot()
    rels = ET.parse(book.open("xl/_rels/workbook.xml.rels")).getroot()
    rel_targets = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall(f"{{{PKG_REL_NS}}}Relationship")
        if rel.attrib.get("Type", "").endswith("/worksheet")
    }
    result = []
    for sheet in workbook.findall(f".//{{{MAIN_NS}}}sheet"):
        rel_id = sheet.attrib.get(f"{{{REL_NS}}}id")
        target = rel_targets.get(rel_id or "")
        if not target:
            continue
        if target.startswith("/"):
            path = target.lstrip("/")
        else:
            path = str(PurePosixPath("xl") / target)
        result.append((sheet.attrib.get("name", ""), path))
    return result


def decode_cell(cell: ET.Element, shared: list[str]) -> str:
    kind = cell.attrib.get("t")
    if kind == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(f"{{{MAIN_NS}}}t"))
    value = cell.find(f"{{{MAIN_NS}}}v")
    if value is None or value.text is None:
        return ""
    if kind == "s":
        try:
            return shared[int(value.text)]
        except (ValueError, IndexError):
            return ""
    return value.text


def read_header_cells(book: zipfile.ZipFile, sheet_path: str, shared: list[str], max_row: int = 20) -> dict[int, dict[int, str]]:
    rows: dict[int, dict[int, str]] = collections.defaultdict(dict)
    with book.open(sheet_path) as source:
        for _event, elem in ET.iterparse(source, events=("end",)):
            if elem.tag != f"{{{MAIN_NS}}}c":
                continue
            ref = elem.attrib.get("r", "")
            row = row_number(ref)
            if 0 < row <= max_row:
                rows[row][column_number(ref)] = normalize_text(decode_cell(elem, shared))
            elem.clear()
            if row > max_row:
                break
    return rows


def identify_header(rows: dict[int, dict[int, str]]) -> tuple[int, dict[str, int]] | None:
    best: tuple[int, int, dict[str, int]] | None = None
    for row_num, values in rows.items():
        found: dict[str, int] = {}
        for col, value in values.items():
            compact = normalize_text(value).replace(" ", "")
            for role, aliases in HEADER_ALIASES.items():
                if compact in aliases:
                    found[role] = col
        score = (3 if "name" in found else 0) + len(found)
        if "name" in found and (best is None or score > best[0]):
            best = (score, row_num, found)
    return (best[1], best[2]) if best else None


def find_data_sheet(book: zipfile.ZipFile, sheets: list[tuple[str, str]], shared: list[str]):
    candidates = []
    for sheet_name, sheet_path in sheets:
        header = identify_header(read_header_cells(book, sheet_path, shared))
        if header:
            columns = header[1]
            score = (
                20 * ("credit" in columns)
                + 10 * ("status" in columns)
                + 5 * bool(re.search(r"基础信息|信息匹配|匹配信息|基础信息项", sheet_name))
            )
            candidates.append((score, sheet_name, sheet_path, header[0], columns))
    if not candidates:
        return None
    _score, sheet_name, sheet_path, header_row, columns = max(candidates, key=lambda item: item[0])
    return sheet_name, sheet_path, header_row, columns


def iter_records(book: zipfile.ZipFile, sheet_path: str, shared: list[str], header_row: int, columns: dict[str, int]):
    wanted = set(columns.values())
    row_values: dict[int, dict[int, str]] = collections.defaultdict(dict)
    with book.open(sheet_path) as source:
        for _event, elem in ET.iterparse(source, events=("end",)):
            if elem.tag != f"{{{MAIN_NS}}}c":
                continue
            ref = elem.attrib.get("r", "")
            row = row_number(ref)
            col = column_number(ref)
            if row > header_row and col in wanted:
                row_values[row][col] = normalize_text(decode_cell(elem, shared))
            elem.clear()
    for row, values in row_values.items():
        name = values.get(columns["name"], "")
        if not name:
            continue
        yield {
            "row": row,
            "name": name,
            "credit": values.get(columns.get("credit", -1), ""),
            "status": values.get(columns.get("status", -1), ""),
        }


def name_categories(name: str) -> set[str]:
    raw = str(name)
    clean = normalize_text(raw)
    compact = re.sub(r"\s+", "", clean)
    categories: set[str] = set()
    if not clean or PLACEHOLDER_RE.fullmatch(clean):
        categories.add("占位符或空值")
        return categories
    if COURT_RE.search(clean) or "企业名称已被人民法院认定不适宜" in clean:
        categories.add("司法或登记机关认定名称不适宜")
    if STATUS_IN_NAME_RE.search(clean):
        categories.add("名称中混入注销/吊销/失效状态")
    if re.search(r"[（(]\s*曾用名\s*[:：]", clean):
        categories.add("名称中混入曾用名备注")
    if PURE_NUMBER_RE.fullmatch(compact):
        categories.add("纯数字名称")
    if CODEISH_RE.fullmatch(compact) and (compact.isdigit() or len(compact) == 18):
        categories.add("疑似信用代码或注册号误填名称")
    if PHONE_RE.fullmatch(compact):
        categories.add("疑似电话号码误填名称")
    if URL_EMAIL_RE.search(clean):
        categories.add("网址或邮箱误填名称")
    if BAD_ENCODING_RE.search(clean):
        categories.add("乱码或不可识别字符")
    if CONTROL_RE.search(raw) or raw != raw.strip() or re.search(r"\s{2,}", raw):
        categories.add("空白或控制字符需规范化")
    if len(compact) == 1:
        categories.add("名称过短")
    if len(compact) > 100:
        categories.add("名称异常过长")
    if re.fullmatch(r"[A-Za-z0-9 .,&'()_+\-/]+", clean):
        categories.add("纯外文或字母数字名称待核验")
    if re.search(r"[()（）\[\]【】]", clean):
        pairs = [("(", ")"), ("（", "）"), ("[", "]"), ("【", "】")]
        if any(clean.count(left) != clean.count(right) for left, right in pairs):
            categories.add("括号不匹配")
    if re.search(r"[\u4e00-\u9fff]", clean) and not LEGAL_FORM_RE.search(clean) and len(compact) <= 8:
        categories.add("缺少企业组织形式后缀待核验")
    return categories


def is_primary_book(path: Path) -> bool:
    return not re.search(r"(?:荣誉|资质)", path.name)


def add_example(bucket: dict[str, list[dict]], category: str, record: dict, limit: int = 30):
    examples = bucket.setdefault(category, [])
    signature = (record["name"], record.get("credit", ""))
    if len(examples) < limit and all((item["name"], item.get("credit", "")) != signature for item in examples):
        examples.append(record)


def main() -> None:
    books = sorted(path for path in ROOT.rglob("*.xlsx") if not path.name.startswith(".~"))
    workbook_summaries = []
    failed_books = []
    unique_entities: dict[str, dict] = {}
    name_conflicts: dict[str, set[str]] = collections.defaultdict(set)
    occurrence_counts = collections.Counter()
    unique_category_keys: dict[str, set[str]] = collections.defaultdict(set)
    examples: dict[str, list[dict]] = {}
    status_occurrences = collections.Counter()
    status_unique_keys: dict[str, set[str]] = collections.defaultdict(set)
    invalid_status_keys: set[str] = set()
    total_primary_rows = 0
    total_all_rows = 0

    for index, path in enumerate(books, start=1):
        print(f"[{index}/{len(books)}] {path.relative_to(ROOT)}", file=sys.stderr, flush=True)
        try:
            with zipfile.ZipFile(path) as book:
                shared = read_shared_strings(book)
                sheets = workbook_sheets(book)
                selected = find_data_sheet(book, sheets, shared)
                if not selected:
                    workbook_summaries.append({
                        "file": str(path),
                        "primary": is_primary_book(path),
                        "sheets": [name for name, _ in sheets],
                        "rows": 0,
                        "warning": "未识别到企业名称字段",
                    })
                    continue
                sheet_name, sheet_path, header_row, columns = selected
                row_count = 0
                for record in iter_records(book, sheet_path, shared, header_row, columns):
                    row_count += 1
                    total_all_rows += 1
                    if not is_primary_book(path):
                        continue
                    total_primary_rows += 1
                    record.update({"file": str(path), "sheet": sheet_name})
                    name = normalize_text(record["name"])
                    credit = normalize_text(record["credit"]).upper().replace(" ", "")
                    status = normalize_text(record["status"])
                    record["name"] = name
                    record["credit"] = credit
                    record["status"] = status
                    key = f"credit:{credit}" if valid_credit(credit) else f"name:{normalize_name_key(name)}"
                    if key not in unique_entities:
                        unique_entities[key] = record.copy()
                    elif unique_entities[key]["name"] != name:
                        name_conflicts[key].update({unique_entities[key]["name"], name})
                    categories = name_categories(name)
                    for category in categories:
                        occurrence_counts[category] += 1
                        unique_category_keys[category].add(key)
                        add_example(examples, category, record)
                    status_occurrences[status or "[空值]"] += 1
                    status_unique_keys[status or "[空值]"].add(key)
                    if INACTIVE_STATUS_RE.search(status) and not ACTIVE_STATUS_RE.search(status):
                        invalid_status_keys.add(key)
                        add_example(examples, "非正常经营状态", record)
                workbook_summaries.append({
                    "file": str(path),
                    "primary": is_primary_book(path),
                    "sheets": [name for name, _ in sheets],
                    "selected_sheet": sheet_name,
                    "header_row": header_row,
                    "columns": columns,
                    "rows": row_count,
                })
        except Exception as exc:
            failed_books.append({"file": str(path), "error": f"{type(exc).__name__}: {exc}"})

    category_summary = []
    for category in sorted(occurrence_counts, key=lambda item: (-len(unique_category_keys[item]), item)):
        category_summary.append({
            "category": category,
            "unique_enterprises": len(unique_category_keys[category]),
            "occurrences": occurrence_counts[category],
            "examples": examples.get(category, []),
        })

    status_summary = [
        {"status": status, "unique_enterprises": len(status_unique_keys[status]), "occurrences": count}
        for status, count in status_occurrences.most_common()
    ]

    conflict_examples = []
    for key, names in name_conflicts.items():
        if len(names) > 1 and len(conflict_examples) < 50:
            conflict_examples.append({"key": key, "names": sorted(names), "first_record": unique_entities[key]})

    result = {
        "root": str(ROOT),
        "workbooks_scanned": len(books),
        "primary_workbooks": sum(is_primary_book(path) for path in books),
        "all_rows_read": total_all_rows,
        "primary_rows_read": total_primary_rows,
        "unique_primary_entities": len(unique_entities),
        "unique_inactive_entities": len(invalid_status_keys),
        "category_summary": category_summary,
        "status_summary": status_summary,
        "inactive_examples": examples.get("非正常经营状态", []),
        "credit_code_name_conflicts": {
            "count": sum(1 for names in name_conflicts.values() if len(names) > 1),
            "examples": conflict_examples,
        },
        "workbooks": workbook_summaries,
        "failed_workbooks": failed_books,
    }
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: result[key] for key in [
        "workbooks_scanned", "primary_workbooks", "all_rows_read", "primary_rows_read",
        "unique_primary_entities", "unique_inactive_entities", "failed_workbooks"
    ]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
