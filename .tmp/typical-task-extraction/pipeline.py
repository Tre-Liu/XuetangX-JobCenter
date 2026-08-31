import re
from difflib import SequenceMatcher
from pathlib import Path


def parse_source_metadata(path):
    path = Path(path)
    parts = path.parts
    documents_index = parts.index("documents")
    province, school_part, group, major_part = parts[documents_index + 1 : documents_index + 5]
    school = school_part.split("_", 1)[1] if "_" in school_part else school_part
    major_code, major = major_part.split("_", 1) if "_" in major_part else ("", major_part)
    return {
        "province": province,
        "school": school,
        "professional_group": group,
        "major_code": major_code,
        "major": major,
        "source_file": path.name,
    }


def split_numbered_items(text):
    text = re.sub(r"\s+", "", text or "")
    chunks = re.split(r"(?=\d+[.、])", text)
    items = []
    for chunk in chunks:
        chunk = re.sub(r"^\d+[.、]", "", chunk)
        chunk = re.sub(r"(?:的)?识图能力$", "识读", chunk)
        chunk = re.sub(r"能力$", "", chunk)
        chunk = chunk.strip("；;。,.，、 ")
        if chunk:
            items.append(chunk)
    return items


def detect_task_table_columns(header):
    normalized = [re.sub(r"\s+", "", str(value or "")) for value in header]
    result = {}
    for index, value in enumerate(normalized):
        if "岗位" in value and "任务" not in value:
            result.setdefault("job", index)
        if "典型工作任务" in value or value in {"工作任务", "主要工作任务"}:
            result.setdefault("task", index)
        if any(key in value for key in ("职业能力", "能力要求", "岗位能力")):
            result.setdefault("ability", index)
        if any(key in value for key in ("支撑课程", "对应课程")):
            result.setdefault("course", index)
    return result if {"job", "task", "ability"}.issubset(result) else None


def classify_competency(text):
    text = re.sub(r"\s+", "", text or "")
    quality_terms = (
        "素养", "意识", "精神", "职业道德", "责任", "合作", "沟通", "协调",
        "诚信", "敬业", "规范意识", "安全意识", "质量意识", "环保意识",
    )
    knowledge_terms = ("掌握", "熟悉", "了解", "知识", "原理", "规范", "标准", "法规")
    if any(term in text for term in quality_terms):
        return "素养"
    if any(term in text for term in knowledge_terms):
        return "知识"
    return "技能"


def atomize_competency(text):
    text = re.sub(r"\s+", "", text or "")
    label_pattern = re.compile(r"(?:\d+[.、])?(素质|素养|知识|能力|技能)(?:目标|要求)?[:：]")
    labels = list(label_pattern.finditer(text))
    sections = []
    if labels:
        for index, match in enumerate(labels):
            end = labels[index + 1].start() if index + 1 < len(labels) else len(text)
            category = {"素质": "素养", "素养": "素养", "知识": "知识", "能力": "技能", "技能": "技能"}[match.group(1)]
            sections.append((category, text[match.end() : end]))
    else:
        sections.append((None, text))

    atoms = []
    for forced_category, body in sections:
        for item in re.split(r"[；;。]+", body):
            item = re.sub(r"^\d+[.、]", "", item).strip("，,、:： ")
            if not item:
                continue
            category = forced_category or classify_competency(item)
            if category in {"技能", "素养"}:
                item = re.sub(r"^(?:能够|能|具有|具备)", "", item)
                item = re.sub(r"(?:的)?能力$", "", item)
            item = item.strip("，,、:： ")
            if item:
                atoms.append({"category": category, "item": item})
    return atoms


def job_match_score(target, source_job, source_major=""):
    def normalize(value):
        value = re.sub(r"[（(][^）)]*[）)]", "", value or "")
        value = re.sub(r"[\s·•,，、；;:：\-—_/]+", "", value)
        value = re.sub(r"^(?:高级|中级|初级|资深|实习|见习|助理)", "", value)
        value = re.sub(r"(?:岗位群|岗位|岗)$", "", value)
        return value

    target_norm = normalize(target)
    raw_source = source_job or ""
    source_variants = {normalize(raw_source)}
    if "/" in raw_source:
        parts = [part for part in raw_source.split("/") if part]
        source_variants.update(normalize(part) for part in parts)
    source_variants = {item for item in source_variants if item}
    if not target_norm or not source_variants:
        return 0.0

    def base_score(source_norm):
        left = re.sub(r"(?:人员|实习生)$", "", target_norm)
        right = re.sub(r"(?:人员|实习生)$", "", source_norm)
        left = re.sub(r"工$", "", left)
        right = re.sub(r"工$", "", right)
        if left == right:
            return 1.0
        shorter, longer = sorted((left, right), key=len)
        if len(shorter) >= 4 and shorter in longer:
            return min(0.96, 0.86 + 0.10 * len(shorter) / max(1, len(longer)))
        ratio = SequenceMatcher(None, left, right).ratio()
        match = SequenceMatcher(None, left, right).find_longest_match()
        common_ratio = match.size / max(1, min(len(left), len(right)))
        return 0.55 * common_ratio + 0.45 * ratio

    scored_variants = [(base_score(source), source) for source in source_variants]
    score, best_source = max(scored_variants)
    major = normalize(source_major).replace("专业", "").replace("技术", "")
    if score >= 0.55 and len(major) >= 4:
        match = SequenceMatcher(None, target_norm, major).find_longest_match()
        major_ratio = match.size / max(1, len(major))
        if major_ratio >= 0.5:
            score += min(0.14, 0.08 + 0.08 * major_ratio)

    generic_tokens = (
        "技术支持", "质量管理", "施工管理", "售前售后", "工程师", "技术员", "操作员",
        "实习生", "设计助理", "项目经理", "产品经理", "质量", "管理", "工程", "技术",
        "设计师", "设计", "开发", "施工", "运营", "销售", "客服", "服务", "售前", "售后",
        "支持", "装配", "安装", "调试", "维修", "维护", "检测", "检验", "质检", "操作",
        "系统", "项目", "数据", "分析", "安全", "资料", "产品", "研发", "媒体", "客户", "顾问",
        "创意", "工艺", "专员", "助理", "经理", "主管", "总监", "人员", "工作",
        "喷漆", "涂装", "生产", "制造", "规划", "CAD", "普通", "岗位", "实习", "见习", "学徒",
        "储备", "高级", "中级", "初级", "资深", "师", "员", "工",
    )

    def residue(value):
        result = value
        for token in generic_tokens:
            result = result.replace(token, "")
        return result

    target_domain = residue(target_norm)
    source_domain = residue(best_source)
    major_domain = residue(major)
    target_grams = {target_domain[i : i + 2] for i in range(max(0, len(target_domain) - 1))}
    source_grams = {source_domain[i : i + 2] for i in range(max(0, len(source_domain) - 1))}
    major_grams = {major_domain[i : i + 2] for i in range(max(0, len(major_domain) - 1))}
    exact_short = bool(target_domain and source_domain and (target_domain in source_domain or source_domain in target_domain))
    domain_aligned = exact_short or bool(target_grams & (source_grams | major_grams))
    if len(target_domain) < 3 and target_domain != source_domain:
        domain_aligned = False
    if not domain_aligned:
        score = min(score, 0.74)

    function_groups = (
        ("设计", "制图", "建模"),
        ("开发", "研发", "编程"),
        ("运维", "维护", "维修", "保养", "检修"),
        ("装配", "组装", "安装"),
        ("检测", "检验", "测试", "质检", "试验"),
        ("操作", "加工", "生产", "制造"),
        ("销售", "营销", "客服", "售前", "售后", "服务", "招生", "顾问"),
        ("教师", "助教", "讲师", "老师", "培训"),
        ("剪辑", "制作", "拍摄"),
        ("管理",),
        ("喷漆", "涂装"),
        ("运营", "推广", "编辑"),
    )

    def functions(value):
        return {index for index, group in enumerate(function_groups) if any(token in value for token in group)}

    target_functions = functions(target_norm)
    source_functions = functions(best_source)
    generic_title = any(token in target_norm for token in ("工程师", "技术员", "专员", "助理", "经理", "主管", "人员", "学徒"))
    if target_functions and source_functions and not target_functions.issubset(source_functions):
        score = min(score, 0.74)
    elif not target_functions and source_functions and generic_title:
        score = min(score, 0.74)
    return min(1.0, score)


def is_valid_source_job(source_job, major=""):
    value = re.sub(r"\s+", "", source_job or "")
    major_value = re.sub(r"\s+", "", major or "")
    if not (2 <= len(value) <= 60):
        return False
    if value in {"岗位", "工作岗位", "职业岗位", "专业", "课程", major_value}:
        return False
    if any(token in value for token in ("大赛", "赛项", "证书", "课程", "专业核心")):
        return False
    return re.search(r"(?:厅|局|学院|学校)$", value) is None


def _is_plausible_task(text):
    text = re.sub(r"\s+", "", text or "")
    if not re.search(r"[\u4e00-\u9fff]", text):
        return False
    return not re.fullmatch(r"\d+(?:\.\d+)?(?:年|%|％)?", text)


def _is_plausible_competency(text):
    text = re.sub(r"\s+", "", text or "")
    if not re.search(r"[\u4e00-\u9fff]", text):
        return False
    return not re.fullmatch(r"\d+(?:\.\d+)?(?:年|%|％)?", text)


def consume_task_table(rows, state=None):
    state = dict(state or {})
    colmap = state.get("colmap")
    start = 0
    for index, row in enumerate(rows):
        found = detect_task_table_columns(row)
        if found:
            colmap = found
            start = index + 1
            state = {"colmap": colmap}
            break
    if colmap is None:
        return [], state

    state["colmap"] = colmap
    records = []
    for row in rows[start:]:
        values = list(row or [])
        required = max(colmap.values()) + 1
        values.extend([None] * max(0, required - len(values)))

        raw_job = values[colmap["job"]]
        raw_task = values[colmap["task"]]
        raw_ability = values[colmap["ability"]]
        raw_course = values[colmap["course"]] if "course" in colmap else None

        if raw_job:
            state["job"] = re.sub(r"\s+", "", str(raw_job))
        if raw_task:
            tasks = split_numbered_items(str(raw_task))
            if tasks and _is_plausible_task(tasks[0]):
                state["task"] = tasks[0]
        if raw_course:
            state["course"] = re.sub(r"\s+", "", str(raw_course))

        if not raw_ability or not state.get("job") or not state.get("task"):
            continue
        for ability in split_numbered_items(str(raw_ability)):
            if not _is_plausible_task(state["task"]) or not _is_plausible_competency(ability):
                continue
            records.append(
                {
                    "source_job": state["job"],
                    "typical_task": state["task"],
                    "competency": ability,
                    "supporting_course": state.get("course", ""),
                }
            )
    return records, state
