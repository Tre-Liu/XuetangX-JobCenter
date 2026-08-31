import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from pipeline import atomize_competency, is_valid_source_job, job_match_score


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
POSITIONS = Path("/Users/liuhongzhe/Desktop/岗位产业环节匹配/岗位.csv")


def compact(text):
    return re.sub(r"\s+", "", text or "").strip("，,；;。 ")


def bigrams(text):
    text = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff]", "", text or "")
    if len(text) < 2:
        return {text} if text else set()
    return {text[index : index + 2] for index in range(len(text) - 1)}


def stable_id(prefix, *parts):
    digest = hashlib.sha1("|".join(str(part) for part in parts).encode("utf-8")).hexdigest()[:12].upper()
    return f"{prefix}-{digest}"


def split_task_parts(text):
    parts = [compact(part) for part in re.split(r"[；;]+", text or "")]
    parts = [re.sub(r"^\d+[.、]", "", part) for part in parts if 2 <= len(part) <= 100]
    return parts or [compact(text)]


def choose_task_part(task, competency):
    parts = split_task_parts(task)
    if len(parts) == 1:
        return parts[0]
    ability_grams = bigrams(competency)
    scored = [(len(bigrams(part) & ability_grams), len(part), part) for part in parts]
    score, _, selected = max(scored)
    return selected if score else compact(task)


def clean_record(record):
    source_job = compact(record.get("source_job"))
    task = compact(record.get("typical_task"))
    competency = compact(record.get("competency"))
    major = compact(record.get("major"))
    if not (2 <= len(source_job) <= 60 and 2 <= len(task) <= 140 and 2 <= len(competency) <= 800):
        return None
    if not is_valid_source_job(source_job, major):
        return None
    if any(re.fullmatch(pattern, task) for pattern in (r"\d+(?:年|%)?", r"20\d{2}年")):
        return None
    result = dict(record)
    result.update({"source_job": source_job, "typical_task": task, "competency": competency})
    return result


def build_concepts(records):
    concepts = defaultdict(list)
    for raw in records:
        record = clean_record(raw)
        if not record:
            continue
        key = (record["source_job"], record.get("major_code", ""), record.get("major", ""))
        concepts[key].append(record)
    return concepts


def build_task_atoms(concept_records):
    by_source = defaultdict(list)
    for record in concept_records:
        source_key = (
            record.get("school", ""),
            record.get("professional_group", ""),
            record.get("major_code", ""),
            record.get("major", ""),
            record.get("source_path", ""),
        )
        by_source[source_key].append(record)

    selected_sources = sorted(by_source.items(), key=lambda item: len(item[1]), reverse=True)[:2]
    atoms = []
    for source_key, source_records in selected_sources:
        task_map = defaultdict(list)
        for record in source_records:
            for atom in atomize_competency(record["competency"]):
                task = choose_task_part(record["typical_task"], atom["item"])
                task_map[task].append((atom, record))

        common_quality = Counter()
        for entries in task_map.values():
            for atom, _ in entries:
                if atom["category"] == "素养":
                    common_quality[atom["item"]] += 1

        for task, entries in task_map.items():
            categories = defaultdict(list)
            for atom, record in entries:
                key = (atom["category"], atom["item"])
                if key not in {(item["category"], item["item"]) for item in categories[atom["category"]]}:
                    categories[atom["category"]].append(
                        {
                            **atom,
                            "record": record,
                            "extraction_method": "人培任务表原文原子化",
                            "evidence_level": "直接证据",
                        }
                    )

            exemplar = entries[0][1]
            if not categories["知识"] and exemplar.get("supporting_course"):
                courses = [compact(item) for item in re.split(r"[、，,；;]", exemplar["supporting_course"])]
                courses = [item for item in courses if 2 <= len(item) <= 24][:2]
                if courses:
                    categories["知识"].append(
                        {
                            "category": "知识",
                            "item": f"掌握{'、'.join(courses)}相关基础知识",
                            "record": exemplar,
                            "extraction_method": "支撑课程规范化推导",
                            "evidence_level": "间接证据（需复核）",
                        }
                    )
            if not categories["技能"]:
                categories["技能"].append(
                    {
                        "category": "技能",
                        "item": f"完成{task}",
                        "record": exemplar,
                        "extraction_method": "典型任务动作转写",
                        "evidence_level": "间接证据（需复核）",
                    }
                )
            if not categories["素养"] and common_quality:
                quality = common_quality.most_common(1)[0][0]
                categories["素养"].append(
                    {
                        "category": "素养",
                        "item": quality,
                        "record": exemplar,
                        "extraction_method": "同岗位通用素养映射",
                        "evidence_level": "间接证据（需复核）",
                    }
                )

            for category in ("知识", "技能", "素养"):
                for item in categories[category][:4]:
                    atoms.append({"task": task, **item})
    return atoms


def match_positions(concepts):
    concept_keys = list(concepts)
    index = defaultdict(set)
    concept_grams = []
    for concept_index, (source_job, _, major) in enumerate(concept_keys):
        grams = bigrams(source_job + major)
        concept_grams.append(grams)
        for gram in grams:
            index[gram].add(concept_index)

    coverage = []
    accepted = []
    with POSITIONS.open(encoding="utf-8-sig", newline="") as handle:
        for position in csv.DictReader(handle):
            target = compact(position["cleaned_position"])
            counts = Counter()
            for gram in bigrams(target):
                counts.update(index.get(gram, ()))
            candidate_indexes = [item[0] for item in counts.most_common(80)]
            ranked = []
            for concept_index in candidate_indexes:
                source_job, major_code, major = concept_keys[concept_index]
                score = job_match_score(target, source_job, major)
                ranked.append((score, concept_index))
            ranked.sort(reverse=True)
            best_score, best_index = ranked[0] if ranked else (0.0, None)
            second_score = ranked[1][0] if len(ranked) > 1 else 0.0
            margin = best_score - second_score
            if best_score >= 0.86 or (best_score >= 0.80 and margin >= 0.08):
                status = "已匹配"
            elif best_score >= 0.72:
                status = "需复核"
            else:
                status = "未匹配"

            if best_index is not None:
                source_job, major_code, major = concept_keys[best_index]
                schools = sorted({record.get("school", "") for record in concepts[concept_keys[best_index]] if record.get("school")})
            else:
                source_job = major_code = major = ""
                schools = []
            coverage_row = {
                "岗位ID": position["id"],
                "岗位": target,
                "匹配状态": status,
                "匹配来源岗位": source_job if status != "未匹配" else "",
                "匹配专业代码": major_code if status != "未匹配" else "",
                "匹配专业": major if status != "未匹配" else "",
                "参考学校": "；".join(schools[:3]) if status != "未匹配" else "",
                "最佳匹配分": round(best_score, 4),
                "次佳匹配分": round(second_score, 4),
                "分差": round(margin, 4),
                "说明": "仅“已匹配”进入能力明细；“需复核”保留候选但不自动生成任务。",
            }
            coverage.append(coverage_row)
            if status == "已匹配":
                accepted.append((position, concept_keys[best_index], best_score))
    return coverage, accepted


def main():
    records = json.loads((DATA_DIR / "source_records.json").read_text(encoding="utf-8"))
    audit = json.loads((DATA_DIR / "source_audit.json").read_text(encoding="utf-8"))
    concepts = build_concepts(records)
    coverage, accepted = match_positions(concepts)

    concept_atoms = {}
    detail = []
    gaps = []
    for position, concept_key, score in accepted:
        if concept_key not in concept_atoms:
            concept_atoms[concept_key] = build_task_atoms(concepts[concept_key])
        atoms = concept_atoms[concept_key]
        by_task = defaultdict(set)
        for atom in atoms:
            record = atom["record"]
            task_id = stable_id("TASK", position["id"], atom["task"])
            competency_id = stable_id("CAP", task_id, atom["category"], atom["item"], record.get("school", ""))
            by_task[atom["task"]].add(atom["category"])
            detail.append(
                {
                    "岗位ID": position["id"],
                    "岗位": position["cleaned_position"],
                    "来源岗位": concept_key[0],
                    "任务ID": task_id,
                    "典型工作任务": atom["task"],
                    "能力项ID": competency_id,
                    "能力类别": atom["category"],
                    "原子能力项": atom["item"],
                    "学校": record.get("school", ""),
                    "专业群": record.get("professional_group", ""),
                    "专业代码": record.get("major_code", ""),
                    "专业": record.get("major", ""),
                    "参考人培文件": record.get("source_file", Path(record.get("source_path", "")).name),
                    "来源定位": record.get("source_locator", ""),
                    "来源路径": record.get("source_path", ""),
                    "SHA-256": record.get("source_sha256", ""),
                    "岗位匹配分": round(score, 4),
                    "抽取方式": atom["extraction_method"],
                    "证据等级": atom["evidence_level"],
                    "原始能力表述": record.get("competency", ""),
                    "支撑课程": record.get("supporting_course", ""),
                }
            )
        for task, categories in by_task.items():
            missing = [category for category in ("知识", "技能", "素养") if category not in categories]
            if missing:
                gaps.append(
                    {
                        "岗位ID": position["id"],
                        "岗位": position["cleaned_position"],
                        "任务ID": stable_id("TASK", position["id"], task),
                        "典型工作任务": task,
                        "缺少类别": "、".join(missing),
                        "处理建议": "补充企业实践专家访谈或回查该专业培养规格，不自动编造能力项。",
                    }
                )

    unique_detail = []
    seen = set()
    for row in detail:
        key = (row["岗位ID"], row["任务ID"], row["能力类别"], row["原子能力项"], row["学校"], row["专业代码"])
        if key not in seen:
            seen.add(key)
            unique_detail.append(row)

    valid_audit = [item for item in audit if not Path(item["representative_path"]).name.startswith("._")]
    sources = []
    for item in valid_audit:
        path = Path(item["representative_path"])
        try:
            metadata_parts = path.parts[path.parts.index("documents") + 1 :]
        except ValueError:
            metadata_parts = ()
        sources.append(
            {
                "省份": metadata_parts[0] if metadata_parts else "",
                "代表文件": str(path),
                "SHA-256": item["sha256"],
                "重复路径数": len(item.get("duplicate_paths", [])),
                "抽取记录数": item.get("record_count", 0),
                "状态": "已抽取任务表" if item.get("record_count", 0) else "未识别到结构化任务表",
                "备注": item.get("error", ""),
            }
        )

    definitions = [
        {"主题": "典型工作任务定义", "规范": "职业行动中的具体工作领域，是工作过程结构完整的综合性任务；反映职业典型工作内容和工作方式，完成过程能够促进职业能力发展，完成方式和结果具有开放性。", "来源": "20240704职业教育-工作任务.docx；典型工作任务【定义】"},
        {"主题": "来源真实性", "规范": "任务须源于企业真实职业实践，通过岗位/职业分析、实践专家研讨、观察、访谈、关键事件等方法获得，不以课程名或软件功能代替任务。", "来源": "20240704职业教育-工作任务.docx；典型工作任务分析"},
        {"主题": "结构完整性", "规范": "任务应覆盖确认/资讯、决策与计划、实施、检查、评价及结果记录等完整行动过程，并涉及对象、内容、手段、组织、产品、环境等工作过程要素。", "来源": "20240704职业教育-工作任务.docx；工作过程结构"},
        {"主题": "代表性与粒度", "规范": "反映主要工作内容和典型工作形式，对职业成长和企业流程具有重要意义；一个专业/职业通常约10—20个典型工作任务，不把零散步骤误作典型任务。", "来源": "20240704职业教育-工作任务.docx；典型工作任务特征"},
        {"主题": "知识项", "规范": "完成任务所需的事实、概念、原理、标准、规范及对象/工具/方法知识；使用“了解/熟悉/掌握+单一知识对象”表述，一行一个知识对象。", "来源": "20240704职业教育-工作任务.docx；工作知识与技能"},
        {"主题": "技能项", "规范": "运用工具和方法改变工作对象、形成产品/服务或完成过程控制的可观察行动；使用“动词+对象/结果”表述，一行一个动作结果。", "来源": "20240704职业教育-工作任务.docx；工作知识与技能"},
        {"主题": "素养项", "规范": "贯穿任务实施的职业道德、责任、质量、安全、环保、协作、创新和工匠精神等稳定行为要求；一行一个可观察的职业行为倾向。", "来源": "20240704职业教育-工作任务.docx；培养规格与精神价值导向"},
        {"主题": "链接规则", "规范": "岗位ID→任务ID→能力项ID。每条能力项只链接一个典型工作任务；同一任务可链接多个知识、技能、素养原子项。来源同时记录学校、专业、文件、页码/表号和SHA-256。", "来源": "本次规范化规则（基于首文档方法论）"},
        {"主题": "证据等级", "规范": "直接证据=人培任务表原文原子化；间接证据=由支撑课程、典型任务动作或同岗位素养映射，必须标“需复核”；无可靠依据则进入缺口表，不强行生成。", "来源": "本次证据治理规则"},
    ]

    category_counts = Counter(row["能力类别"] for row in unique_detail)
    status_counts = Counter(row["匹配状态"] for row in coverage)
    summary = {
        "岗位总数": len(coverage),
        "已匹配岗位": status_counts["已匹配"],
        "需复核岗位": status_counts["需复核"],
        "未匹配岗位": status_counts["未匹配"],
        "能力明细行": len(unique_detail),
        "典型任务数": len({(row["岗位ID"], row["任务ID"]) for row in unique_detail}),
        "知识项": category_counts["知识"],
        "技能项": category_counts["技能"],
        "素养项": category_counts["素养"],
        "能力类别缺口": len(gaps),
        "人培文件数（排除macOS资源叉）": len(valid_audit),
        "识别到结构化任务表的独立文件": sum(1 for item in valid_audit if item.get("record_count", 0)),
    }

    for name, value in (
        ("definitions.json", definitions),
        ("coverage.json", coverage),
        ("detail.json", unique_detail),
        ("gaps.json", gaps),
        ("sources.json", sources),
        ("dataset_summary.json", summary),
    ):
        (DATA_DIR / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
