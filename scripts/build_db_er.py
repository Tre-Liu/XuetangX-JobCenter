from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

import pdfplumber


SOURCE_PDF = Path(
    "/Users/liuhongzhe/Desktop/DataDictionary_20260617172916.pdf"
)
OUT_DIR = Path("output/db-er")
OUT_HTML = OUT_DIR / "gangwei_er.html"
OUT_JSON = OUT_DIR / "gangwei_schema.json"
OUT_COVERAGE = OUT_DIR / "coverage.md"


TABLE_HEAD_RE = re.compile(r"2\.1\.1\.(\d+)\. 表: ([^\n]+)")
VIEW_HEAD_RE = re.compile(r"2\.1\.2\.(\d+)\. 视图: ([^\n]+)")
TYPE_RE = r"(?:bigint|int|smallint|tinyint(?:\(1\))?|varchar\(\d+\)|char\(\d+\)|decimal\(\d+,\s*\d+\)|datetime(?:\(3\))?|date|text|longtext|double)"
FIELD_RE = re.compile(rf"^\s*(\d+)\s+([A-Za-z_][A-Za-z0-9_]*)\s+({TYPE_RE})\s*(.*)$")
VIEW_FIELD_RE = re.compile(rf"^\s*([A-Za-z_][A-Za-z0-9_]*)\s+({TYPE_RE})\s*(.*)$")


@dataclass
class Field:
    name: str
    type: str
    not_null: bool = False
    primary: bool = False
    auto_increment: bool = False
    default: str = ""
    indexed: bool = False
    notes: str = ""


@dataclass
class DbObject:
    name: str
    kind: str
    order: int
    comment: str
    fields: list[Field]


@dataclass
class Relation:
    source_table: str
    source_fields: list[str]
    target_table: str
    target_fields: list[str]
    relation_type: str
    confidence: str
    evidence: str


def clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line.strip())


def normalize_text(text: str) -> str:
    # Keep object headings on separate lines and remove page headers/footers.
    lines = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("服务器: local"):
            continue
        if re.fullmatch(r"gangwei\s+\d+", line):
            continue
        lines.append(line)
    return "\n".join(lines)


def split_sections(text: str) -> list[tuple[str, int, str, str]]:
    matches = []
    for m in TABLE_HEAD_RE.finditer(text):
        matches.append((m.start(), m.end(), "table", int(m.group(1)), clean_line(m.group(2))))
    for m in VIEW_HEAD_RE.finditer(text):
        matches.append((m.start(), m.end(), "view", int(m.group(1)), clean_line(m.group(2))))
    matches.sort(key=lambda x: x[0])

    sections = []
    for idx, (_start, end, kind, order, name) in enumerate(matches):
        next_start = matches[idx + 1][0] if idx + 1 < len(matches) else len(text)
        sections.append((kind, order, name, text[end:next_start]))
    return sections


def object_comment(section: str) -> str:
    comments = []
    for raw in section.splitlines():
        line = clean_line(raw)
        if not line:
            continue
        if line in {"字段", "索引", "外键", "名称 类型 方法 字段", "名称 类型 Null"}:
            break
        if line.startswith("位置 名称 类型"):
            break
        comments.append(line)
    return " ".join(comments)


def field_blocks(section: str) -> list[list[str]]:
    lines = [clean_line(line) for line in section.splitlines() if clean_line(line)]
    starts = [idx for idx, line in enumerate(lines) if FIELD_RE.match(line)]
    blocks: list[list[str]] = []
    for pos, start in enumerate(starts):
        end = starts[pos + 1] if pos + 1 < len(starts) else len(lines)
        blocks.append(lines[start:end])
    return blocks


def extract_default(text: str) -> str:
    m = re.search(r"默认:\s*([^ 索引]+|'[^']*'|CURRENT_TIMESTAMP)", text)
    return m.group(1) if m else ""


def extract_notes(block: Iterable[str]) -> str:
    skip_tokens = ("索引", "默认:", "主键", "自动递增", "UNIQUE", "NORMAL", "BTREE", "字段", "外键")
    notes = []
    for idx, line in enumerate(block):
        if idx == 0:
            # Remove the technical prefix from the first line; keep only inline Chinese notes if present.
            line = FIELD_RE.sub("", line).strip()
        if not line:
            continue
        if any(token in line for token in skip_tokens):
            continue
        if re.match(r"^[A-Za-z0-9_]+$", line):
            continue
        notes.append(line)
    return " ".join(notes)


def parse_table_fields(section: str) -> list[Field]:
    fields = []
    for block in field_blocks(section):
        first = block[0]
        m = FIELD_RE.match(first)
        if not m:
            continue
        whole = " ".join(block)
        fields.append(
            Field(
                name=m.group(2),
                type=m.group(3).replace(" ", ""),
                not_null="✓" in whole,
                primary="主键" in whole,
                auto_increment="自动递增" in whole,
                default=extract_default(whole),
                indexed="索引" in whole or "idx_" in whole or "uk_" in whole or "fk_" in whole,
                notes=extract_notes(block),
            )
        )
    return fields


def parse_view_fields(section: str) -> list[Field]:
    fields = []
    for raw in section.splitlines():
        line = clean_line(raw)
        if not line or line in {"字段", "名称 类型 Null"}:
            continue
        m = VIEW_FIELD_RE.match(line)
        if not m:
            continue
        # Avoid parsing index/foreign-key tables if text extraction spills.
        if m.group(1) in {"名称", "字段", "索引"}:
            continue
        fields.append(Field(name=m.group(1), type=m.group(2).replace(" ", ""), not_null="✓" in line))
    return fields


def parse_pdf() -> tuple[list[DbObject], int]:
    with pdfplumber.open(SOURCE_PDF) as pdf:
        page_count = len(pdf.pages)
        text = "\n".join(normalize_text(page.extract_text() or "") for page in pdf.pages[3:])
    objects = []
    for kind, order, name, section in split_sections(text):
        fields = parse_table_fields(section) if kind == "table" else parse_view_fields(section)
        objects.append(DbObject(name=name, kind=kind, order=order, comment=object_comment(section), fields=fields))
    return objects, page_count


def relations() -> list[Relation]:
    return [
        Relation("dict_industry_chain_node", ["chain_code", "dict_version"], "dict_industry_chain", ["chain_code", "dict_version"], "物理外键", "explicit", "PDF 外键 fk_chain_node_chain"),
        Relation("dict_occupation", ["small_class_code", "taxonomy_version"], "dict_occupation_class", ["class_code", "taxonomy_version"], "物理外键", "explicit", "PDF 外键 fk_occupation_small_class"),
        Relation("dict_occupation_alias", ["occupation_code", "taxonomy_version"], "dict_occupation", ["occupation_code", "taxonomy_version"], "物理外键", "explicit", "PDF 外键 fk_alias_occupation"),
        Relation("job_market_company", ["insight_id"], "job_market_insight", ["id"], "物理外键", "explicit", "PDF 外键 fk_market_company_insight"),
        Relation("job_position_occupation", ["occupation_code", "taxonomy_version"], "dict_occupation", ["occupation_code", "taxonomy_version"], "物理外键", "explicit", "PDF 外键 fk_position_occ_occupation"),
        Relation("companies", ["representative_jd_id"], "jds", ["jd_id"], "业务关联", "inferred", "字段说明: 代表 JD，详情页可跳转样本职位"),
        Relation("job_market_company", ["company_id"], "companies", ["company_id"], "业务关联", "inferred", "典型企业明细使用 company_id 关联企业主数据"),
        Relation("jds", ["company_name"], "companies", ["display_name"], "派生来源", "inferred", "companies 为 JD 派生企业主数据，display_name 来自 JD 高频原名"),
        Relation("dict_industry_chain_node", ["parent_node_code", "dict_version"], "dict_industry_chain_node", ["node_code", "dict_version"], "父子层级", "inferred", "字段说明: 父节点编码，顶层为空"),
        Relation("dict_occupation_class", ["parent_code", "taxonomy_version"], "dict_occupation_class", ["class_code", "taxonomy_version"], "父子层级", "inferred", "字段说明: 父级编码，大类为空"),
        Relation("major_catalogs", ["pid"], "major_catalogs", ["major_catalog_id"], "父子层级", "inferred", "专业目录 pid 与唯一 major_catalog_id"),
        Relation("industry_catalogs", ["parent_ids"], "industry_catalogs", ["id"], "祖先路径", "inferred", "parent_ids 为 varchar 路径字段，表示行业目录父级集合"),
        Relation("job_capability_mappings", ["industry_id"], "industry_catalogs", ["id"], "业务关联", "inferred", "关联表字段 industry_id"),
        Relation("job_capability_mappings", ["capability_id"], "capabilities", ["id"], "业务关联", "inferred", "关联表字段 capability_id"),
        Relation("job_industry_mappings", ["jd_id"], "jds", ["jd_id"], "业务关联", "inferred", "关联表字段 jd_id；jds.jd_id 为唯一索引"),
        Relation("job_industry_mappings", ["industry_id"], "industry_catalogs", ["id"], "业务关联", "inferred", "关联表字段 industry_id"),
        Relation("job_major_mappings", ["jd_id"], "jds", ["jd_id"], "业务关联", "inferred", "关联表字段 jd_id；jds.jd_id 为唯一索引"),
        Relation("job_major_mappings", ["major_catalog_id"], "major_catalogs", ["major_catalog_id"], "业务关联", "inferred", "关联表字段 major_catalog_id；major_catalogs.major_catalog_id 为唯一索引"),
        Relation("job_cluster", ["industry_chain_code"], "dict_industry_chain", ["chain_code"], "业务关联", "inferred", "字段说明写明指向 dict_industry_chain.chain_code"),
        Relation("job_cluster", ["industry_node_code"], "dict_industry_chain_node", ["node_code"], "业务关联", "inferred", "字段说明写明指向 dict_industry_chain_node.node_code"),
        Relation("job_cluster_competency", ["cluster_id", "profile_version"], "job_cluster", ["cluster_id", "profile_version"], "从属明细", "inferred", "索引 idx_cluster_competency"),
        Relation("job_position", ["cluster_id", "profile_version"], "job_cluster", ["cluster_id", "profile_version"], "业务关联", "inferred", "索引 idx_cluster_id"),
        Relation("job_position", ["source_industry_catalog_id"], "industry_catalogs", ["id"], "业务关联", "inferred", "字段说明写明来源 industry_catalogs.id"),
        Relation("job_position", ["primary_occupation_code", "taxonomy_version"], "dict_occupation", ["occupation_code", "taxonomy_version"], "业务关联", "inferred", "索引 idx_primary_occupation"),
        Relation("job_position_competency", ["position_id", "profile_version"], "job_position", ["position_id", "profile_version"], "从属明细", "inferred", "索引 idx_position_competency"),
        Relation("job_position_jd", ["position_id", "profile_version"], "job_position", ["position_id", "profile_version"], "桥接关联", "inferred", "索引 idx_position_period"),
        Relation("job_position_jd", ["jd_id"], "jds", ["jd_id"], "桥接关联", "inferred", "字段说明: 招聘 JD ID"),
        Relation("job_position_jd", ["industry_id"], "industry_catalogs", ["id"], "桥接关联", "inferred", "字段说明: 桥接用 industry_catalogs L3 id"),
        Relation("job_position_occupation", ["position_id", "profile_version"], "job_position", ["position_id", "profile_version"], "桥接关联", "inferred", "唯一索引 uk_position_occ_version"),
        Relation("job_position_tag", ["position_id", "profile_version"], "job_position", ["position_id", "profile_version"], "从属明细", "inferred", "唯一索引 uk_position_tag"),
        Relation("job_market_insight", ["position_id"], "job_position", ["position_id"], "业务关联", "inferred", "字段说明: 关联岗位（产品 job_id）"),
        Relation("v_industry_chain_node", ["node_code", "chain_code", "dict_version"], "dict_industry_chain_node", ["node_code", "chain_code", "dict_version"], "视图来源", "inferred", "视图字段与 dict_industry_chain_node 对齐"),
        Relation("v_job_position_detail", ["position_id", "profile_version"], "job_position", ["position_id", "profile_version"], "视图来源", "inferred", "视图字段以岗位画像为主实体"),
        Relation("v_job_position_detail", ["cluster_id"], "job_cluster", ["cluster_id"], "视图来源", "inferred", "视图包含岗位群字段"),
        Relation("v_job_position_detail", ["occupation_code"], "dict_occupation", ["occupation_code"], "视图来源", "inferred", "视图包含国标职业字段"),
        Relation("v_occupation_with_class", ["occupation_code", "taxonomy_version"], "dict_occupation", ["occupation_code", "taxonomy_version"], "视图来源", "inferred", "视图为职业及分类展开"),
        Relation("v_occupation_with_class", ["small_class_code", "taxonomy_version"], "dict_occupation_class", ["class_code", "taxonomy_version"], "视图来源", "inferred", "视图包含分类层级字段"),
    ]


def filter_relations_for_objects(rels: list[Relation], objects: list[DbObject]) -> list[Relation]:
    object_names = {obj.name for obj in objects}
    return [rel for rel in rels if rel.source_table in object_names and rel.target_table in object_names]


TABLE_MEANINGS = {
    "capabilities": "能力项基础字典，沉淀可复用能力名称和说明",
    "companies": "企业主数据表，由 JD 聚合派生企业档案",
    "dict_industry_chain": "产业链主字典，定义产业链编码、名称和版本",
    "dict_industry_chain_node": "产业链节点字典，定义链上节点和父子层级",
    "dict_occupation": "职业分类大典细类职业，保存国标职业编码和分类冗余",
    "dict_occupation_alias": "职业名称别名，用于同一职业的别称和历史名称匹配",
    "dict_occupation_class": "职业分类层级字典，保存大类、中类、小类树",
    "industry_catalogs": "行业目录基础表，用于岗位和 JD 的行业归属",
    "jds": "招聘 JD 结构化结果，保存岗位、公司、薪资和要求",
    "job_capability_mappings": "行业目录与能力项的关联表",
    "job_cluster": "岗位群主表，按产业链和产业节点聚合岗位",
    "job_cluster_competency": "岗位群共性能力明细",
    "job_industry_mappings": "JD 与行业目录的匹配结果",
    "job_major_mappings": "JD 与专业目录的匹配结果",
    "job_market_company": "市场调研快照下的典型企业明细",
    "job_market_insight": "岗位市场调研快照，保存周期、薪资和需求信息",
    "job_position": "岗位画像主实体，承载产品侧岗位详情",
    "job_position_competency": "岗位画像能力项明细",
    "job_position_jd": "岗位画像与招聘 JD 的周期桥接表",
    "job_position_occupation": "岗位画像与国标职业的映射表",
    "job_position_tag": "岗位画像标签表",
    "major_catalogs": "专业目录基础表，保存专业编码、层级和父级",
    "zhaopin": "智联招聘原始爬虫结果，供 JD 处理链路消费",
    "v_industry_chain_node": "产业链节点展示视图",
    "v_job_position_detail": "岗位画像详情聚合视图",
    "v_occupation_with_class": "职业及分类层级展开视图",
}


POSITIONS = {
    "dict_industry_chain": (45, 40),
    "dict_industry_chain_node": (45, 220),
    "dict_occupation_class": (45, 400),
    "dict_occupation": (45, 580),
    "dict_occupation_alias": (45, 760),
    "capabilities": (45, 940),
    "companies": (410, 40),
    "industry_catalogs": (410, 220),
    "major_catalogs": (410, 400),
    "jds": (410, 580),
    "zhaopin": (410, 620),
    "job_capability_mappings": (775, 40),
    "job_industry_mappings": (775, 220),
    "job_major_mappings": (775, 400),
    "job_cluster": (775, 580),
    "job_cluster_competency": (775, 760),
    "job_position": (1140, 120),
    "job_position_competency": (1140, 300),
    "job_position_jd": (1140, 480),
    "job_position_occupation": (1140, 660),
    "job_position_tag": (1140, 840),
    "job_market_insight": (1505, 120),
    "job_market_company": (1505, 300),
    "v_industry_chain_node": (1505, 480),
    "v_job_position_detail": (1505, 660),
    "v_occupation_with_class": (1505, 840),
}


def esc(text: object) -> str:
    return html.escape(str(text), quote=True)


def group_for(name: str, kind: str) -> str:
    if kind == "view":
        return "视图"
    if name.startswith("dict_"):
        return "标准字典"
    if name in {"industry_catalogs", "major_catalogs", "capabilities"}:
        return "基础目录"
    if name in {"jds", "zhaopin"}:
        return "招聘原始数据"
    if "mapping" in name:
        return "匹配关联表"
    if name.startswith("job_market"):
        return "市场调研"
    return "岗位画像"


def meaning_for(obj: DbObject) -> str:
    return TABLE_MEANINGS.get(obj.name) or obj.comment or group_for(obj.name, obj.kind)


def trim_label(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 1] + "…"


def relation_field_names(obj: DbObject, rels: list[Relation]) -> set[str]:
    names: set[str] = set()
    for rel in rels:
        if rel.source_table == obj.name:
            names.update(rel.source_fields)
        if rel.target_table == obj.name:
            names.update(rel.target_fields)
    return names


def relation_source_field_names(obj: DbObject, rels: list[Relation]) -> set[str]:
    names: set[str] = set()
    for rel in rels:
        if rel.source_table == obj.name:
            names.update(rel.source_fields)
    return names


def relation_target_field_names(obj: DbObject, rels: list[Relation]) -> set[str]:
    names: set[str] = set()
    for rel in rels:
        if rel.target_table == obj.name:
            names.update(rel.target_fields)
    return names


def key_fields_for_node(obj: DbObject, rels: list[Relation], max_fields: int = 7) -> tuple[list[Field], int]:
    relation_names = relation_field_names(obj, rels)
    ordered: list[Field] = []

    def add(match) -> None:
        for field in obj.fields:
            if match(field) and field.name not in {item.name for item in ordered}:
                ordered.append(field)

    add(lambda f: f.primary)
    add(lambda f: f.name in relation_names)
    add(lambda f: f.indexed)
    add(lambda _f: True)
    visible = ordered[:max_fields]
    return visible, max(0, len(obj.fields) - len(visible))


def render_svg(objects: list[DbObject], rels: list[Relation]) -> str:
    by_name = {obj.name: obj for obj in objects}
    w, h = 1840, 1120
    node_w, node_h = 285, 150
    parts = [
        f'<svg class="graph" viewBox="0 0 {w} {h}" role="img" aria-label="gangwei database relationship graph">',
        '<defs><marker id="arrow-solid" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2563eb"/></marker><marker id="arrow-dashed" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#64748b"/></marker></defs>',
    ]
    for rel_idx, rel in enumerate(rels, 1):
        if rel.source_table not in POSITIONS or rel.target_table not in POSITIONS:
            continue
        if rel.source_table not in by_name or rel.target_table not in by_name:
            continue
        sx, sy = POSITIONS[rel.source_table]
        tx, ty = POSITIONS[rel.target_table]
        x1 = sx + node_w
        y1 = sy + node_h / 2
        x2 = tx
        y2 = ty + node_h / 2
        if tx < sx:
            x1 = sx
            x2 = tx + node_w
        dx = max(50, abs(x2 - x1) / 2)
        cls = "edge explicit" if rel.confidence == "explicit" else "edge inferred"
        marker = "arrow-solid" if rel.confidence == "explicit" else "arrow-dashed"
        parts.append(
            f'<path class="{cls}" data-rel="r{rel_idx}" data-source="{esc(rel.source_table)}" data-target="{esc(rel.target_table)}" '
            f'd="M{x1},{y1} C{x1+dx},{y1} {x2-dx},{y2} {x2},{y2}" marker-end="url(#{marker})">'
            f"<title>{esc(rel.source_table)}.{esc(', '.join(rel.source_fields))} -> {esc(rel.target_table)}.{esc(', '.join(rel.target_fields))}</title>"
            "</path>"
        )
    for obj in objects:
        if obj.name not in POSITIONS:
            continue
        x, y = POSITIONS[obj.name]
        klass = "node view" if obj.kind == "view" else "node table"
        visible_fields, remaining_count = key_fields_for_node(obj, rels)
        parts.append(f'<g class="{klass}" data-name="{esc(obj.name)}">')
        parts.append(f'<rect x="{x}" y="{y}" width="{node_w}" height="{node_h}" rx="8"/>')
        parts.append(f'<text class="node-title" x="{x+12}" y="{y+24}">{esc(trim_label(obj.name, 30))}</text>')
        parts.append(f'<text class="node-meaning" x="{x+12}" y="{y+45}">{esc(trim_label(meaning_for(obj), 34))}</text>')
        parts.append(f'<line class="node-rule" x1="{x+12}" y1="{y+57}" x2="{x+node_w-12}" y2="{y+57}"/>')
        field_y = y + 75
        source_fields = relation_source_field_names(obj, rels)
        target_fields = relation_target_field_names(obj, rels)
        for field in visible_fields:
            tag = "PK" if field.primary else "FK" if field.name in source_fields else "REF" if field.name in target_fields else "IDX" if field.indexed else ""
            type_text = trim_label(field.type, 15)
            field_text = f"{field.name}: {type_text}"
            tag_text = f"[{tag}] " if tag else ""
            parts.append(f'<text class="node-field" x="{x+12}" y="{field_y}">{esc(tag_text + trim_label(field_text, 34))}</text>')
            field_y += 13
        if remaining_count:
            parts.append(f'<text class="node-more" x="{x+12}" y="{field_y}">+ {remaining_count} fields below</text>')
        parts.append("</g>")
    parts.append("</svg>")
    return "\n".join(parts)


def render_relation_table(rels: list[Relation]) -> str:
    rows = []
    for idx, rel in enumerate(rels, 1):
        rows.append(
            f'<tr data-rel="r{idx}" data-source="{esc(rel.source_table)}" data-target="{esc(rel.target_table)}">'
            f"<td>{idx}</td>"
            f"<td><code>{esc(rel.source_table)}.{esc(', '.join(rel.source_fields))}</code></td>"
            f"<td>-></td>"
            f"<td><code>{esc(rel.target_table)}.{esc(', '.join(rel.target_fields))}</code></td>"
            f"<td><span class=\"badge {esc(rel.confidence)}\">{esc(rel.relation_type)}</span></td>"
            f"<td>{esc(rel.evidence)}</td>"
            "</tr>"
        )
    return "\n".join(rows)


def render_hover_css(objects: list[DbObject], rels: list[Relation]) -> str:
    rules = [
        ".graph:has(.node:hover) .edge, .graph:has(.edge:hover) .edge { opacity: .06; }",
        ".graph:has(.node:hover) .node, .graph:has(.edge:hover) .node { opacity: .28; }",
        ".graph .node:hover { opacity: 1; }",
        ".graph .node:hover rect { stroke: #2563eb; stroke-width: 2.4; fill: #eff6ff; }",
        ".graph .edge:hover { opacity: 1; stroke-width: 4; }",
    ]
    object_names = [obj.name for obj in objects]
    for name in object_names:
        edge_selectors = [
            f'.graph:has(.node[data-name="{name}"]:hover) .edge[data-source="{name}"]',
            f'.graph:has(.node[data-name="{name}"]:hover) .edge[data-target="{name}"]',
        ]
        rules.append(", ".join(edge_selectors) + " { opacity: 1; stroke-width: 4; }")

        connected = set()
        for rel in rels:
            if rel.source_table == name:
                connected.add(rel.target_table)
            if rel.target_table == name:
                connected.add(rel.source_table)
        node_selectors = [f'.graph:has(.node[data-name="{name}"]:hover) .node[data-name="{name}"]']
        node_selectors.extend(f'.graph:has(.node[data-name="{name}"]:hover) .node[data-name="{target}"]' for target in sorted(connected))
        rules.append(", ".join(node_selectors) + " { opacity: 1; }")
        rules.append(", ".join(f"{selector} rect" for selector in node_selectors) + " { stroke: #2563eb; stroke-width: 2.4; }")

    for idx, rel in enumerate(rels, 1):
        rules.append(
            f'.graph:has(.edge[data-rel="r{idx}"]:hover) .edge[data-rel="r{idx}"] '
            "{ opacity: 1; stroke-width: 4; }"
        )
        rules.append(
            f'.graph:has(.edge[data-rel="r{idx}"]:hover) .node[data-name="{rel.source_table}"], '
            f'.graph:has(.edge[data-rel="r{idx}"]:hover) .node[data-name="{rel.target_table}"] '
            "{ opacity: 1; }"
        )
        rules.append(
            f'.graph:has(.edge[data-rel="r{idx}"]:hover) .node[data-name="{rel.source_table}"] rect, '
            f'.graph:has(.edge[data-rel="r{idx}"]:hover) .node[data-name="{rel.target_table}"] rect '
            "{ stroke: #2563eb; stroke-width: 2.4; }"
        )
    return "\n    ".join(rules)


def render_object_cards(objects: list[DbObject]) -> str:
    cards = []
    for obj in objects:
        field_rows = []
        for field in obj.fields:
            flags = []
            if field.primary:
                flags.append("PK")
            if field.auto_increment:
                flags.append("AI")
            if field.not_null:
                flags.append("NN")
            if field.indexed:
                flags.append("IDX")
            flag_html = " ".join(f'<span class="mini">{esc(flag)}</span>' for flag in flags)
            field_rows.append(
                "<tr>"
                f"<td><code>{esc(field.name)}</code></td>"
                f"<td>{esc(field.type)}</td>"
                f"<td>{flag_html}</td>"
                f"<td>{esc(field.default)}</td>"
                f"<td>{esc(field.notes)}</td>"
                "</tr>"
            )
        cards.append(
            f'<section class="card" data-name="{esc(obj.name)}" data-kind="{esc(obj.kind)}">'
            f"<h3>{esc(obj.name)} <span>{esc('视图' if obj.kind == 'view' else '表')}</span></h3>"
            f"<p>{esc(meaning_for(obj))}</p>"
            '<table class="fields"><thead><tr><th>字段</th><th>类型</th><th>标记</th><th>默认</th><th>说明</th></tr></thead>'
            f"<tbody>{''.join(field_rows)}</tbody></table>"
            "</section>"
        )
    return "\n".join(cards)


def render_html(objects: list[DbObject], rels: list[Relation], page_count: int) -> str:
    table_count = sum(1 for obj in objects if obj.kind == "table")
    view_count = sum(1 for obj in objects if obj.kind == "view")
    explicit_count = sum(1 for rel in rels if rel.confidence == "explicit")
    inferred_count = len(rels) - explicit_count
    object_names = ", ".join(obj.name for obj in objects)
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>gangwei 数据库字段级关联关系图</title>
  <style>
    :root {{
      --bg: #f7f8fb;
      --ink: #1f2937;
      --muted: #64748b;
      --line: #d7dde8;
      --card: #ffffff;
      --blue: #2563eb;
      --green: #15803d;
      --orange: #b45309;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; color: var(--ink); background: var(--bg); }}
    header {{ padding: 28px 34px 18px; background: #111827; color: white; }}
    h1 {{ margin: 0 0 10px; font-size: 28px; letter-spacing: 0; }}
    header p {{ margin: 5px 0; color: #cbd5e1; line-height: 1.55; }}
    main {{ padding: 22px 34px 50px; }}
    .toolbar {{ display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }}
    input {{ width: min(520px, 100%); padding: 11px 13px; border: 1px solid var(--line); border-radius: 8px; font-size: 14px; background: white; }}
    .stats {{ display: grid; grid-template-columns: repeat(4, minmax(150px, 1fr)); gap: 12px; margin: 16px 0 22px; }}
    .stat {{ background: white; border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; }}
    .stat strong {{ display: block; font-size: 24px; margin-bottom: 2px; }}
    .stat span {{ color: var(--muted); font-size: 13px; }}
    .panel {{ background: white; border: 1px solid var(--line); border-radius: 8px; padding: 16px; margin: 18px 0; overflow: auto; }}
    h2 {{ font-size: 19px; margin: 0 0 13px; }}
    .legend {{ display: flex; gap: 18px; flex-wrap: wrap; color: var(--muted); font-size: 13px; margin-bottom: 10px; }}
    .legend i {{ display: inline-block; width: 34px; height: 0; border-top: 3px solid var(--blue); vertical-align: middle; margin-right: 7px; }}
    .legend .dash {{ border-top-style: dashed; border-color: #64748b; }}
    .graph {{ min-width: 1500px; width: 100%; height: auto; background: #fbfdff; border: 1px solid #e5eaf2; border-radius: 8px; }}
    .edge {{ fill: none; stroke-width: 1.55; opacity: .38; pointer-events: stroke; transition: opacity .12s ease, stroke-width .12s ease; }}
    .edge.explicit {{ stroke: var(--blue); stroke-width: 2.4; opacity: .62; }}
    .edge.inferred {{ stroke: #64748b; stroke-dasharray: 7 6; }}
    .edge.is-dimmed {{ opacity: .06; }}
    .edge.is-highlighted {{ opacity: 1; stroke-width: 4; }}
    .edge.inferred.is-highlighted {{ stroke: #334155; }}
    .node {{ transition: opacity .12s ease; cursor: default; }}
    .node rect {{ fill: white; stroke: #cbd5e1; stroke-width: 1.2; filter: drop-shadow(0 1px 2px rgba(15, 23, 42, .08)); transition: stroke .12s ease, stroke-width .12s ease, fill .12s ease; }}
    .node.view rect {{ fill: #f0fdf4; stroke: #86efac; }}
    .node.is-dimmed {{ opacity: .28; }}
    .node.is-highlighted rect {{ stroke: #2563eb; stroke-width: 2.4; fill: #eff6ff; }}
    .node.view.is-highlighted rect {{ fill: #dcfce7; stroke: #16a34a; }}
    .node-title {{ font-size: 14px; font-weight: 700; fill: #111827; }}
    .node-meaning {{ font-size: 10.5px; fill: #475569; }}
    .node-rule {{ stroke: #e2e8f0; stroke-width: 1; }}
    .node-field {{ font-size: 10.5px; fill: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }}
    .node-more {{ font-size: 10.5px; fill: #64748b; font-style: italic; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ padding: 9px 10px; border-bottom: 1px solid #e7ecf4; text-align: left; vertical-align: top; font-size: 13px; line-height: 1.45; }}
    th {{ color: #475569; background: #f8fafc; position: sticky; top: 0; }}
    #relationTable tbody tr {{ transition: background .12s ease, opacity .12s ease; }}
    #relationTable tbody tr.is-highlighted {{ background: #eff6ff; }}
    #relationTable tbody tr.is-dimmed {{ opacity: .38; }}
    code {{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: #0f172a; }}
    .badge, .mini {{ display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 8px; font-size: 12px; white-space: nowrap; }}
    .badge.explicit {{ color: #1d4ed8; background: #dbeafe; }}
    .badge.inferred {{ color: #475569; background: #e2e8f0; }}
    .mini {{ color: #374151; background: #eef2f7; margin-right: 4px; padding: 1px 6px; }}
    .cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(410px, 1fr)); gap: 14px; }}
    .card {{ background: white; border: 1px solid var(--line); border-radius: 8px; padding: 14px; overflow: hidden; }}
    .card h3 {{ margin: 0 0 5px; font-size: 16px; }}
    .card h3 span {{ color: var(--muted); font-size: 12px; font-weight: 500; margin-left: 8px; }}
    .card p {{ min-height: 20px; color: var(--muted); margin: 0 0 10px; font-size: 13px; line-height: 1.5; }}
    .fields th:nth-child(1) {{ width: 27%; }}
    .fields th:nth-child(2) {{ width: 18%; }}
    .fields th:nth-child(3) {{ width: 17%; }}
    .fields th:nth-child(4) {{ width: 12%; }}
    footer {{ color: var(--muted); font-size: 12px; margin-top: 20px; line-height: 1.6; }}
    {render_hover_css(objects, rels)}
    @media (max-width: 760px) {{
      header, main {{ padding-left: 16px; padding-right: 16px; }}
      .stats {{ grid-template-columns: repeat(2, minmax(130px, 1fr)); }}
      .cards {{ grid-template-columns: 1fr; }}
      th, td {{ font-size: 12px; padding: 7px; }}
    }}
  </style>
</head>
<body>
  <header>
    <h1>gangwei 数据库字段级关联关系图</h1>
    <p>来源 PDF: {esc(SOURCE_PDF)}；共 {page_count} 页。实线为数据字典明确外键，虚线为字段说明、索引和关联表命名推断的业务关系；总览图矩形内展示表含义和关键字段，下方明细保留全字段。</p>
    <p>覆盖对象: {esc(object_names)}</p>
  </header>
  <main>
    <div class="toolbar">
      <input id="filter" type="search" placeholder="搜索表、视图或字段，例如 position_id / dict_occupation / jd_id">
    </div>
    <section class="stats" aria-label="coverage">
      <div class="stat"><strong>{table_count}</strong><span>表，已全部纳入</span></div>
      <div class="stat"><strong>{view_count}</strong><span>视图，已全部纳入</span></div>
      <div class="stat"><strong>{explicit_count}</strong><span>PDF 明确外键</span></div>
      <div class="stat"><strong>{inferred_count}</strong><span>业务推断关系</span></div>
    </section>
    <section class="panel">
      <h2>关系总览图</h2>
      <div class="legend"><span><i></i>明确外键</span><span><i class="dash"></i>业务推断/视图来源</span></div>
      {render_svg(objects, rels)}
    </section>
    <section class="panel">
      <h2>字段级关系列表</h2>
      <table id="relationTable">
        <thead><tr><th>#</th><th>来源字段</th><th></th><th>目标字段</th><th>类型</th><th>依据</th></tr></thead>
        <tbody>{render_relation_table(rels)}</tbody>
      </table>
    </section>
    <section>
      <h2>表与视图字段明细</h2>
      <div class="cards" id="cards">{render_object_cards(objects)}</div>
    </section>
    <footer>
      注: 总览图为保持可读性，优先展示主键、外键/关联字段、索引字段和前序业务字段；每张表的完整字段清单在“表与视图字段明细”中。zhaopin 为招聘爬虫原始结果表，PDF 未给出稳定外键；已作为独立源表保留在图中。parent_ids 是路径/集合字段，图中按祖先路径关系表达，不等同单字段物理外键。
    </footer>
  </main>
  <script>
    const filter = document.getElementById('filter');
    const cards = Array.from(document.querySelectorAll('.card'));
    const graphNodes = Array.from(document.querySelectorAll('g.node'));
    const edges = Array.from(document.querySelectorAll('.edge'));
    const relRows = Array.from(document.querySelectorAll('#relationTable tbody tr'));

    function setGraphState(activeNode, activeRel) {{
      const connectedNodes = new Set();
      if (activeNode) connectedNodes.add(activeNode);

      edges.forEach(edge => {{
        const source = edge.dataset.source;
        const target = edge.dataset.target;
        const rel = edge.dataset.rel;
        const matchesNode = activeNode && (source === activeNode || target === activeNode);
        const matchesRel = activeRel && rel === activeRel;
        const on = matchesNode || matchesRel;
        edge.classList.toggle('is-highlighted', on);
        edge.classList.toggle('is-dimmed', Boolean(activeNode || activeRel) && !on);
        if (on) {{
          connectedNodes.add(source);
          connectedNodes.add(target);
        }}
      }});

      graphNodes.forEach(node => {{
        const on = connectedNodes.has(node.dataset.name);
        node.classList.toggle('is-highlighted', on);
        node.classList.toggle('is-dimmed', Boolean(activeNode || activeRel) && !on);
      }});

      relRows.forEach(row => {{
        const on = (activeRel && row.dataset.rel === activeRel) ||
          (activeNode && (row.dataset.source === activeNode || row.dataset.target === activeNode));
        row.classList.toggle('is-highlighted', on);
        row.classList.toggle('is-dimmed', Boolean(activeNode || activeRel) && !on);
      }});
    }}

    function clearGraphState() {{
      setGraphState('', '');
    }}

    window.dbErSetGraphState = setGraphState;
    window.dbErClearGraphState = clearGraphState;

    function bindHover(el, enter, leave) {{
      ['mouseenter', 'mouseover', 'pointerenter'].forEach(type => el.addEventListener(type, enter));
      ['mouseleave', 'mouseout', 'pointerleave'].forEach(type => el.addEventListener(type, leave));
    }}

    graphNodes.forEach(node => {{
      bindHover(node, () => setGraphState(node.dataset.name, ''), clearGraphState);
    }});

    edges.forEach(edge => {{
      bindHover(edge, () => setGraphState('', edge.dataset.rel), clearGraphState);
    }});

    relRows.forEach(row => {{
      bindHover(row, () => setGraphState('', row.dataset.rel), clearGraphState);
    }});

    cards.forEach(card => {{
      bindHover(card, () => setGraphState(card.dataset.name, ''), clearGraphState);
    }});

    filter.addEventListener('input', () => {{
      const q = filter.value.trim().toLowerCase();
      cards.forEach(card => card.style.display = card.innerText.toLowerCase().includes(q) ? '' : 'none');
      relRows.forEach(row => row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none');
      clearGraphState();
    }});
  </script>
</body>
</html>"""


def write_outputs(objects: list[DbObject], rels: list[Relation], page_count: int) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "source_pdf": str(SOURCE_PDF),
        "page_count": page_count,
        "objects": [asdict(obj) for obj in objects],
        "relations": [asdict(rel) for rel in rels],
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_HTML.write_text(render_html(objects, rels, page_count), encoding="utf-8")

    tables = [obj for obj in objects if obj.kind == "table"]
    views = [obj for obj in objects if obj.kind == "view"]
    lines = [
        "# gangwei 数据库 ER 图覆盖清单",
        "",
        f"- 来源 PDF: `{SOURCE_PDF}`",
        f"- PDF 页数: {page_count}",
        f"- 表: {len(tables)} / {len(tables)}",
        f"- 视图: {len(views)} / {len(views)}",
        f"- 字段级关系: {len(rels)} 条，其中明确外键 {sum(1 for r in rels if r.confidence == 'explicit')} 条",
        "",
        "## 表",
    ]
    for obj in tables:
        lines.append(f"- `{obj.name}`: {len(obj.fields)} 字段")
    lines.extend(["", "## 视图"])
    for obj in views:
        lines.append(f"- `{obj.name}`: {len(obj.fields)} 字段")
    lines.extend(["", "## 字段级关系"])
    for rel in rels:
        lines.append(
            f"- `{rel.source_table}.{', '.join(rel.source_fields)}` -> `{rel.target_table}.{', '.join(rel.target_fields)}` ({rel.relation_type}; {rel.confidence})"
        )
    OUT_COVERAGE.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    objects, page_count = parse_pdf()
    actual_tables = sum(1 for obj in objects if obj.kind == "table")
    actual_views = sum(1 for obj in objects if obj.kind == "view")
    if actual_tables == 0 and actual_views == 0:
        raise SystemExit("Coverage mismatch: no database objects parsed from PDF")
    rels = filter_relations_for_objects(relations(), objects)
    write_outputs(objects, rels, page_count)
    print(f"Wrote {OUT_HTML}")
    print(f"Wrote {OUT_JSON}")
    print(f"Wrote {OUT_COVERAGE}")


if __name__ == "__main__":
    main()
