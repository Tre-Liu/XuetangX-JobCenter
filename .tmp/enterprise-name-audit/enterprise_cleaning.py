from __future__ import annotations

import collections
import json
import re
import unicodedata
import zipfile
from pathlib import Path
from typing import Iterable

from audit_names import (
    ROOT,
    find_data_sheet,
    iter_records,
    read_shared_strings,
    workbook_sheets,
)


RULE_DOC = Path(
    "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/enterprise-name-cleaning/产业链企业名称数据清洗规则.md"
)
DEFAULT_OUTPUT = Path(
    "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/.tmp/enterprise-name-audit/enterprise-cleaning-results.json"
)

CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u200b\ufeff]")
PLACEHOLDER_RE = re.compile(r"^(?:[-—–_/\\.·*]+|无|暂无|未知|未公开|未披露|空|null|none|n/?a|nan|0)$", re.I)
CREDIT_CODE_RE = re.compile(r"^[0-9A-Z]{18}$", re.I)
REGISTRATION_CODE_RE = re.compile(r"^\d{15}$")
PURE_NUMBER_RE = re.compile(r"^\d+(?:\.0+)?$")
PHONE_RE = re.compile(r"^(?:\+?86[- ]?)?(?:1[3-9]\d{9}|0\d{2,3}[- ]?\d{7,8})$")
URL_EMAIL_RE = re.compile(r"(?:https?://|www\.|@[a-z0-9.-]+\.[a-z]{2,})", re.I)
BAD_ENCODING_RE = re.compile(r"(?:�|锟斤拷|烫烫烫|屯屯屯|\?{3,})")
COURT_RE = re.compile(r"(?:企业)?名称.*?人民法院.*?(?:不适宜|不予使用|停止使用|认定)")
REGISTRY_RE = re.compile(r"(?:企业)?名称.*?登记机关.*?(?:不适宜|不予使用|停止使用|认定)")
GENERIC_INVALID_NAME_RE = re.compile(r"名称已被认定(?:为)?不适宜|名称已被认定应当停止使用")
FORMER_NAME_RE = re.compile(r"[（(]\s*曾用名\s*[:：]\s*(.*?)[）)]\s*$")
STATUS_NOTE_RE = re.compile(
    r"[（(]\s*(已注销|注销|吊销(?:,?未注销)?|已强制除名|已除名|破产清算|责令关闭|"
    r"已告解散|证书废止|迁出|已歇业|歇业|停业)\s*[）)]\s*$"
)
STATUS_ONLY_RE = re.compile(
    r"^(?:[0-9A-Z]{18})?[（(]?(?:已注销|注销|吊销|已强制除名|已除名|破产清算|"
    r"责令关闭|已告解散|证书废止|迁出|已歇业|歇业|停业)[）)]?$"
)
INACTIVE_STATUS_RE = re.compile(r"(?:注销|吊销|撤销|迁出|责令关闭|歇业|已告解散|证书废止|除名|关闭|失效)")
ACTIVE_STATUS_RE = re.compile(r"(?:存续|开业|在业|正常|在营|在册|仍注册)")
LEGAL_FORM_RE = re.compile(
    r"(?:公司|集团|厂|店|所|中心|院|局|社|场|站|部|行|馆|事务所|合作社|合伙企业|"
    r"研究院|工作室|委员会|协会|学校|医院|基金会|实验室|银行|大学|商会|联社|家庭农场|"
    r"分公司|分行|支行|营业部|办事处|农场|矿|队|个体工商户|网吧|药房|公寓|管理处|工程处)$"
)

ACTION_PRIORITY = {"KEEP": 0, "KEEP_CLEANED": 1, "REVIEW": 2, "HIDE": 3, "QUARANTINE": 4}
SEVERITY_PRIORITY = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
REASON_SEVERITY = {
    "EMPTY_OR_PLACEHOLDER": "Critical",
    "CREDIT_CODE_AS_NAME": "Critical",
    "NUMERIC_ONLY_NAME": "Critical",
    "JUDICIAL_NAME_INVALID": "Critical",
    "REGISTRY_NAME_INVALID": "Critical",
    "STATUS_TEXT_AS_NAME": "Critical",
    "URL_EMAIL_PHONE_AS_NAME": "Critical",
    "GARBLED_TEXT": "High",
    "TRUNCATED_NAME": "High",
    "UNBALANCED_BRACKETS": "High",
    "STATUS_MIXED_IN_NAME": "High",
    "NAME_STATUS_CONFLICT": "High",
    "INACTIVE_REGISTRATION": "High",
    "MULTIPLE_NAMES_FOR_CREDIT_CODE": "High",
    "STATUS_CONFLICT": "High",
    "FORMER_NAME_MIXED": "Medium",
    "UNKNOWN_REGISTRATION_STATUS": "Medium",
    "MISSING_LEGAL_FORM_REVIEW": "Medium",
    "FOREIGN_NAME_REVIEW": "Medium",
    "NAME_TOO_SHORT_REVIEW": "Medium",
    "NAME_TOO_LONG_REVIEW": "Medium",
    "WHITESPACE_NORMALIZED": "Low",
}

REASON_LABELS = {
    "EMPTY_OR_PLACEHOLDER": "名称为空或占位符",
    "CREDIT_CODE_AS_NAME": "信用代码或注册号误填名称",
    "NUMERIC_ONLY_NAME": "纯数字名称",
    "JUDICIAL_NAME_INVALID": "人民法院认定名称不适宜",
    "REGISTRY_NAME_INVALID": "登记机关认定名称不适宜或停止使用",
    "STATUS_TEXT_AS_NAME": "名称仅包含状态说明",
    "URL_EMAIL_PHONE_AS_NAME": "电话、邮箱或网址误填名称",
    "GARBLED_TEXT": "名称包含乱码",
    "TRUNCATED_NAME": "名称疑似被截断",
    "UNBALANCED_BRACKETS": "名称括号不匹配",
    "STATUS_MIXED_IN_NAME": "名称混入注销、除名或清算状态",
    "NAME_STATUS_CONFLICT": "名称状态说明与登记状态冲突",
    "INACTIVE_REGISTRATION": "企业登记状态非正常",
    "MULTIPLE_NAMES_FOR_CREDIT_CODE": "同一信用代码对应多个现行名称",
    "STATUS_CONFLICT": "同一主体存在相互冲突的登记状态",
    "FORMER_NAME_MIXED": "当前名称混入曾用名备注",
    "UNKNOWN_REGISTRATION_STATUS": "登记状态为空或未知",
    "MISSING_LEGAL_FORM_REVIEW": "缺少常见组织形式后缀",
    "FOREIGN_NAME_REVIEW": "纯外文名称需核验中文登记名",
    "NAME_TOO_SHORT_REVIEW": "名称过短",
    "NAME_TOO_LONG_REVIEW": "名称异常过长",
    "WHITESPACE_NORMALIZED": "空白或控制字符已规范化",
}


def normalize_text(value: object) -> str:
    if value is None:
        return ""
    text = unicodedata.normalize("NFKC", str(value))
    text = CONTROL_RE.sub("", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_name_key(name: str) -> str:
    text = normalize_text(name).lower()
    return re.sub(r"[\s·•・,，.。;；:：'\"“”‘’`~!！?？()（）\[\]【】{}<>《》_-]+", "", text)


def clean_credit_code(value: object) -> str:
    return normalize_text(value).upper().replace(" ", "")


def is_valid_credit_code(value: object) -> bool:
    return bool(CREDIT_CODE_RE.fullmatch(clean_credit_code(value)))


def status_group(status: str) -> str:
    clean = normalize_text(status)
    if not clean or PLACEHOLDER_RE.fullmatch(clean) or clean in {"其他", "未知"}:
        return "UNKNOWN"
    if INACTIVE_STATUS_RE.search(clean):
        return "INACTIVE"
    if ACTIVE_STATUS_RE.search(clean):
        return "ACTIVE"
    return "UNKNOWN"


def extract_leading_credit(name: str) -> str:
    match = re.match(r"^([0-9A-Z]{18})(?=[(（]|$)", name, re.I)
    return match.group(1).upper() if match else ""


def severity_for(reasons: Iterable[str]) -> str:
    severities = [REASON_SEVERITY.get(reason, "Medium") for reason in reasons]
    return max(severities, key=lambda value: SEVERITY_PRIORITY[value], default="Low")


def action_result(action: str) -> str:
    return {
        "KEEP": "无需处理",
        "KEEP_CLEANED": "采用清洗后名称并保留原值",
        "REVIEW": "进入人工复核队列，复核前不作为可信企业主数据",
        "HIDE": "保留历史主体，默认从有效企业库和统计中隐藏",
        "QUARANTINE": "隔离异常名称，停止展示并按信用代码回查现行名称",
    }[action]


def classify_record(name: object, credit: object, status: object) -> dict:
    raw_name = "" if name is None else str(name)
    clean_name = normalize_text(raw_name)
    credit_clean = clean_credit_code(credit)
    status_clean = normalize_text(status)
    reasons: list[str] = []
    former_names: list[str] = []
    name_status_note = ""
    strong_invalid = False

    extracted_credit = extract_leading_credit(clean_name)
    if not is_valid_credit_code(credit_clean) and extracted_credit:
        credit_clean = extracted_credit

    if raw_name != clean_name:
        reasons.append("WHITESPACE_NORMALIZED")

    compact = clean_name.replace(" ", "")
    if not clean_name or PLACEHOLDER_RE.fullmatch(clean_name):
        reasons.append("EMPTY_OR_PLACEHOLDER")
        strong_invalid = True
        clean_name = ""
    elif CREDIT_CODE_RE.fullmatch(compact) or REGISTRATION_CODE_RE.fullmatch(compact):
        reasons.append("CREDIT_CODE_AS_NAME")
        if PURE_NUMBER_RE.fullmatch(compact):
            reasons.append("NUMERIC_ONLY_NAME")
        strong_invalid = True
        clean_name = ""
    elif PURE_NUMBER_RE.fullmatch(compact):
        reasons.append("NUMERIC_ONLY_NAME")
        strong_invalid = True
        clean_name = ""
    elif COURT_RE.search(clean_name):
        reasons.append("JUDICIAL_NAME_INVALID")
        strong_invalid = True
        clean_name = ""
    elif REGISTRY_RE.search(clean_name) or GENERIC_INVALID_NAME_RE.search(clean_name):
        reasons.append("REGISTRY_NAME_INVALID")
        strong_invalid = True
        clean_name = ""
    elif STATUS_ONLY_RE.fullmatch(compact):
        reasons.append("STATUS_TEXT_AS_NAME")
        strong_invalid = True
        clean_name = ""
    elif URL_EMAIL_RE.search(clean_name) or PHONE_RE.fullmatch(compact):
        reasons.append("URL_EMAIL_PHONE_AS_NAME")
        strong_invalid = True
        clean_name = ""
    else:
        former_match = FORMER_NAME_RE.search(clean_name)
        if former_match:
            former_names = [part.strip() for part in re.split(r"[,，;；]", former_match.group(1)) if part.strip()]
            clean_name = clean_name[: former_match.start()].strip()
            reasons.append("FORMER_NAME_MIXED")

        status_match = STATUS_NOTE_RE.search(clean_name)
        if status_match:
            name_status_note = status_match.group(1)
            clean_name = clean_name[: status_match.start()].strip()
            reasons.append("STATUS_MIXED_IN_NAME")

        if BAD_ENCODING_RE.search(clean_name):
            reasons.append("GARBLED_TEXT")
        pairs = [("(", ")"), ("（", "）"), ("[", "]"), ("【", "】")]
        if any(clean_name.count(left) != clean_name.count(right) for left, right in pairs):
            reasons.append("UNBALANCED_BRACKETS")
        if re.search(r"(?:有限公司企|企业名称已|名称已被认定为不适宜的企)$", clean_name):
            reasons.append("TRUNCATED_NAME")
        compact_clean = clean_name.replace(" ", "")
        if len(compact_clean) == 1:
            reasons.append("NAME_TOO_SHORT_REVIEW")
        if len(compact_clean) > 100:
            reasons.append("NAME_TOO_LONG_REVIEW")
        if re.fullmatch(r"[A-Za-z0-9 .,&'()_+\-/]+", clean_name) and clean_name:
            reasons.append("FOREIGN_NAME_REVIEW")
        if (
            re.search(r"[\u4e00-\u9fff]", clean_name)
            and clean_name
            and not LEGAL_FORM_RE.search(clean_name)
            and len(compact_clean) <= 8
        ):
            reasons.append("MISSING_LEGAL_FORM_REVIEW")

    reg_group = status_group(status_clean)
    if reg_group == "INACTIVE":
        reasons.append("INACTIVE_REGISTRATION")
    elif reg_group == "UNKNOWN":
        reasons.append("UNKNOWN_REGISTRATION_STATUS")
    if name_status_note and reg_group == "ACTIVE":
        reasons.append("NAME_STATUS_CONFLICT")

    reasons = list(dict.fromkeys(reasons))
    if strong_invalid:
        action = "QUARANTINE"
        quality = "INVALID"
    elif reg_group == "INACTIVE":
        action = "HIDE"
        quality = "CLEANED" if former_names or name_status_note else "VALID"
    elif any(reason in reasons for reason in {
        "NAME_STATUS_CONFLICT", "GARBLED_TEXT", "TRUNCATED_NAME", "UNBALANCED_BRACKETS",
        "UNKNOWN_REGISTRATION_STATUS", "MISSING_LEGAL_FORM_REVIEW", "FOREIGN_NAME_REVIEW",
        "NAME_TOO_SHORT_REVIEW", "NAME_TOO_LONG_REVIEW",
    }):
        action = "REVIEW"
        quality = "REVIEW"
    elif former_names or name_status_note or "WHITESPACE_NORMALIZED" in reasons:
        action = "KEEP_CLEANED"
        quality = "CLEANED"
    else:
        action = "KEEP"
        quality = "VALID"

    return {
        "raw_company_name": raw_name,
        "company_name_clean": clean_name or None,
        "company_name_normalized": normalize_name_key(clean_name) if clean_name else "",
        "credit_code_clean": credit_clean,
        "former_company_names": former_names,
        "name_status_note": name_status_note,
        "registration_status_raw": status_clean,
        "registration_status_group": reg_group,
        "is_active": True if reg_group == "ACTIVE" else False if reg_group == "INACTIVE" else None,
        "name_quality_status": quality,
        "reason_codes": reasons,
        "reason_labels": [REASON_LABELS[reason] for reason in reasons],
        "severity": severity_for(reasons),
        "record_action": action,
        "processing_result": action_result(action),
        "manual_review_required": action in {"REVIEW", "QUARANTINE"},
    }


def _entity_key(classified: dict) -> str:
    credit = classified["credit_code_clean"]
    if is_valid_credit_code(credit):
        return f"credit:{credit}"
    normalized = classified["company_name_normalized"] or normalize_name_key(classified["raw_company_name"])
    return f"name:{normalized}"


def aggregate_records(records: Iterable[dict]) -> list[dict]:
    entities: dict[str, dict] = {}
    for record in records:
        classified = classify_record(record.get("name"), record.get("credit"), record.get("status"))
        key = _entity_key(classified)
        source = {
            "file": record.get("source_file", ""),
            "sheet": record.get("source_sheet", ""),
            "row": int(record.get("source_row", 0) or 0),
        }
        entity = entities.get(key)
        if entity is None:
            entity = {
                "entity_key": key,
                "credit_code": classified["credit_code_clean"],
                "all_names": [],
                "clean_name_candidates": [],
                "former_company_names": [],
                "registration_statuses": [],
                "reason_codes": [],
                "sources": [],
                "source_count": 0,
                "occurrence_count": 0,
                "record_action": "KEEP",
                "severity": "Low",
                "name_quality_status": "VALID",
            }
            entities[key] = entity
        entity["occurrence_count"] += 1
        if classified["raw_company_name"] not in entity["all_names"]:
            entity["all_names"].append(classified["raw_company_name"])
        if classified["company_name_clean"] and classified["company_name_clean"] not in entity["clean_name_candidates"]:
            entity["clean_name_candidates"].append(classified["company_name_clean"])
        for former_name in classified["former_company_names"]:
            if former_name not in entity["former_company_names"]:
                entity["former_company_names"].append(former_name)
        status = classified["registration_status_raw"] or "[空值]"
        if status not in entity["registration_statuses"]:
            entity["registration_statuses"].append(status)
        for reason in classified["reason_codes"]:
            if reason not in entity["reason_codes"]:
                entity["reason_codes"].append(reason)
        if source not in entity["sources"]:
            entity["source_count"] += 1
            if len(entity["sources"]) < 10:
                entity["sources"].append(source)
        if ACTION_PRIORITY[classified["record_action"]] > ACTION_PRIORITY[entity["record_action"]]:
            entity["record_action"] = classified["record_action"]
            entity["name_quality_status"] = classified["name_quality_status"]
        if SEVERITY_PRIORITY[classified["severity"]] > SEVERITY_PRIORITY[entity["severity"]]:
            entity["severity"] = classified["severity"]

    for entity in entities.values():
        normalized_candidates = {normalize_name_key(name) for name in entity["clean_name_candidates"] if name}
        if entity["credit_code"] and len(normalized_candidates) > 1:
            entity["reason_codes"].append("MULTIPLE_NAMES_FOR_CREDIT_CODE")
            if entity["record_action"] not in {"QUARANTINE", "HIDE"}:
                entity["record_action"] = "REVIEW"
                entity["name_quality_status"] = "REVIEW"
            entity["severity"] = max(entity["severity"], "High", key=lambda value: SEVERITY_PRIORITY[value])
        status_groups = {status_group(status) for status in entity["registration_statuses"]}
        if "ACTIVE" in status_groups and "INACTIVE" in status_groups:
            entity["reason_codes"].append("STATUS_CONFLICT")
            if entity["record_action"] not in {"QUARANTINE", "HIDE"}:
                entity["record_action"] = "REVIEW"
                entity["name_quality_status"] = "REVIEW"
            entity["severity"] = max(entity["severity"], "High", key=lambda value: SEVERITY_PRIORITY[value])
        entity["reason_codes"] = list(dict.fromkeys(entity["reason_codes"]))
        entity["reason_labels"] = [REASON_LABELS[reason] for reason in entity["reason_codes"]]
        entity["company_name_clean"] = entity["clean_name_candidates"][0] if entity["clean_name_candidates"] else None
        entity["registration_status_group"] = (
            "CONFLICT" if "ACTIVE" in status_groups and "INACTIVE" in status_groups
            else "INACTIVE" if "INACTIVE" in status_groups
            else "ACTIVE" if "ACTIVE" in status_groups
            else "UNKNOWN"
        )
        entity["processing_result"] = action_result(entity["record_action"])
        entity["manual_review_required"] = entity["record_action"] in {"REVIEW", "QUARANTINE"}
    return list(entities.values())


def is_primary_book(path: Path) -> bool:
    return not path.name.startswith(".~") and not re.search(r"(?:荣誉|资质)", path.name)


def iter_primary_records(root: Path = ROOT):
    books = sorted(path for path in root.rglob("*.xlsx") if is_primary_book(path))
    for index, path in enumerate(books, start=1):
        print(f"[{index}/{len(books)}] {path.relative_to(root)}", flush=True)
        with zipfile.ZipFile(path) as book:
            shared = read_shared_strings(book)
            selected = find_data_sheet(book, workbook_sheets(book), shared)
            if not selected:
                continue
            sheet_name, sheet_path, header_row, columns = selected
            for record in iter_records(book, sheet_path, shared, header_row, columns):
                yield {
                    "name": record["name"],
                    "credit": record["credit"],
                    "status": record["status"],
                    "source_file": str(path.relative_to(root)),
                    "source_sheet": sheet_name,
                    "source_row": record["row"],
                }


def run_full_scan(root: Path = ROOT, output_path: Path = DEFAULT_OUTPUT) -> dict:
    if not RULE_DOC.exists():
        raise FileNotFoundError(f"Cleaning rule document not found: {RULE_DOC}")
    primary_books = sorted(path for path in root.rglob("*.xlsx") if is_primary_book(path))
    entities = aggregate_records(iter_primary_records(root))
    input_records = sum(entity["occurrence_count"] for entity in entities)
    issues = [entity for entity in entities if entity["record_action"] != "KEEP" or entity["reason_codes"]]
    issues.sort(key=lambda item: (
        -ACTION_PRIORITY[item["record_action"]],
        -SEVERITY_PRIORITY[item["severity"]],
        item["credit_code"] or item["entity_key"],
    ))
    conflicts = [entity for entity in issues if "MULTIPLE_NAMES_FOR_CREDIT_CODE" in entity["reason_codes"]]
    action_counts = collections.Counter(entity["record_action"] for entity in issues)
    severity_counts = collections.Counter(entity["severity"] for entity in issues)
    reason_counts = collections.Counter(reason for entity in issues for reason in entity["reason_codes"])
    result = {
        "metadata": {
            "rule_document": str(RULE_DOC),
            "source_root": str(root),
            "primary_workbooks": len(primary_books),
            "input_records": input_records,
            "unique_entities": len(entities),
            "issue_entities": len(issues),
            "conflict_entities": len(conflicts),
        },
        "action_counts": dict(action_counts),
        "severity_counts": dict(severity_counts),
        "reason_counts": dict(reason_counts),
        "issues": issues,
        "conflicts": conflicts,
    }
    output_path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return result


if __name__ == "__main__":
    result = run_full_scan()
    print(json.dumps({
        **result["metadata"],
        "action_counts": result["action_counts"],
        "severity_counts": result["severity_counts"],
    }, ensure_ascii=False, indent=2))
