#!/usr/bin/env python3
import json
import sqlite3
from pathlib import Path


BASE = Path(__file__).resolve().parent
DATA = json.loads((BASE / "analysis_results.json").read_text(encoding="utf-8"))
TOTAL = DATA["rows"]


def pct(x):
    return f"{x * 100:.1f}%"


top = DATA["top"]
family_counts = {x["name"]: x["count"] for x in top["family"]}
dedup = DATA["dedup_repost_key"]
dedup_total = dedup["rows"]
family_rows = []
for rank, item in enumerate(top["family"], 1):
    name = item["name"]
    fs = DATA["family_salary"].get(name, {})
    family_rows.append({
        "rank": rank,
        "岗位族群": name,
        "招聘记录": item["count"],
        "占比": item["count"] / TOTAL,
        "合并后占比": dedup["family"].get(name, 0) / dedup_total,
        "薪资中位数": fs.get("median"),
        "有效薪资样本": fs.get("count", 0),
    })

salary_order = ["4千以下", "4千-6千", "6千-8千", "8千-1万", "1万-1.5万", "1.5万-2万", "2万-3万", "3万以上"]
salary_map = {x["name"]: x["count"] for x in top["salary_band"]}
salary_rows = [
    {"order": i + 1, "薪资带": name, "招聘记录": salary_map.get(name, 0), "占有效薪资": salary_map.get(name, 0) / DATA["salary"]["valid_count"]}
    for i, name in enumerate(salary_order)
]

city_salary = DATA["city_salary"]
city_rows = []
for rank, item in enumerate(top["city"][:20], 1):
    name = item["name"]
    s = city_salary.get(name, {})
    city_rows.append({
        "rank": rank,
        "城市": name,
        "招聘记录": item["count"],
        "占比": item["count"] / TOTAL,
        "薪资中位数": s.get("median"),
        "薪资P25": s.get("p25"),
        "薪资P75": s.get("p75"),
        "有效薪资样本": s.get("count", 0),
    })

role_rows = [
    {"rank": i + 1, "原始岗位名": x["name"], "招聘记录": x["count"], "占比": x["count"] / TOTAL}
    for i, x in enumerate(top["raw_title"][:20])
]

entry_labels = {"经验不限", "无需经验", "在校/应届", "应届生", "在校生/应届生", "在校生", "无经验"}
experience_map = {x["name"]: x["count"] for x in top["experience"]}
entry_count = sum(experience_map.get(x, 0) for x in entry_labels)

education_counts = {x["name"]: x["count"] for x in top["education"]}
education_rows = [
    {"学历口径": "大专", "招聘记录": education_counts.get("大专", 0), "占比": education_counts.get("大专", 0) / TOTAL, "薪资中位数": DATA["education_salary"].get("大专", {}).get("median")},
    {"学历口径": "本科", "招聘记录": education_counts.get("本科", 0), "占比": education_counts.get("本科", 0) / TOTAL, "薪资中位数": DATA["education_salary"].get("本科", {}).get("median")},
    {"学历口径": "硕士", "招聘记录": education_counts.get("硕士", 0), "占比": education_counts.get("硕士", 0) / TOTAL, "薪资中位数": DATA["education_salary"].get("硕士", {}).get("median")},
    {"学历口径": "博士", "招聘记录": education_counts.get("博士", 0), "占比": education_counts.get("博士", 0) / TOTAL, "薪资中位数": DATA["education_salary"].get("博士", {}).get("median")},
    {"学历口径": "中专/中技（合并两种写法）", "招聘记录": education_counts.get("中专/中技", 0) + education_counts.get("中技/中专", 0), "占比": (education_counts.get("中专/中技", 0) + education_counts.get("中技/中专", 0)) / TOTAL, "薪资中位数": 6000},
    {"学历口径": "学历不限/无要求", "招聘记录": education_counts.get("学历不限", 0) + education_counts.get("无学历要求", 0), "占比": (education_counts.get("学历不限", 0) + education_counts.get("无学历要求", 0)) / TOTAL, "薪资中位数": 6500},
    {"学历口径": "未标注", "招聘记录": education_counts.get("未标注", 0), "占比": education_counts.get("未标注", 0) / TOTAL, "薪资中位数": DATA["education_salary"].get("未标注", {}).get("median")},
]

quality_rows = [
    {"问题": "重复发布型组合", "数量": DATA["duplicates_repost_key_hash"]["duplicate_rows"], "占比": DATA["duplicates_repost_key_hash"]["duplicate_share"], "影响": "岗位数量会被重复发布放大；适合看曝光结构，不等于独立职位数", "严重度": "高"},
    {"问题": "招聘人数缺失", "数量": DATA["missing"]["招聘人数"]["count"], "占比": DATA["missing"]["招聘人数"]["share"], "影响": "不能将招聘记录数换算成实际招聘人数", "严重度": "高"},
    {"问题": "行业为不限或未标注", "数量": 100680 + DATA["missing"]["招聘类别"]["count"], "占比": (100680 + DATA["missing"]["招聘类别"]["count"]) / TOTAL, "影响": "行业结构只能作为补充观察，不能做完整行业需求排名", "严重度": "中"},
    {"问题": "工作区域缺失", "数量": DATA["missing"]["工作区域"]["count"], "占比": DATA["missing"]["工作区域"]["share"], "影响": "城市级结论可靠性高于区县级结论", "严重度": "中"},
    {"问题": "零薪资占位", "数量": DATA["numeric_invalid"].get("零薪资占位", 0), "占比": DATA["numeric_invalid"].get("零薪资占位", 0) / TOTAL, "影响": "已从薪资分布中排除，避免拉低中位数", "严重度": "中"},
    {"问题": "岗位族群难判定", "数量": family_counts["其他/难判定"], "占比": family_counts["其他/难判定"] / TOTAL, "影响": "标题关键词归类只能反映方向，不能替代人工职业编码", "严重度": "中"},
]

summary_row = {
    "招聘记录": TOTAL,
    "合并后岗位组合": dedup_total,
    "重复发布型占比": DATA["duplicates_repost_key_hash"]["duplicate_share"],
    "入门友好占比": entry_count / TOTAL,
    "薪资有效覆盖": DATA["salary"]["coverage"],
    "薪资中位数": DATA["salary"]["quantiles"]["0.5"],
    "岗位族群可判定率": 1 - family_counts["其他/难判定"] / TOTAL,
}

source = {
    "id": "recruitment_csv_2025",
    "label": "应届生招聘大数据2025全量聚合查询",
    "path": str(BASE / "report_queries.sql"),
}

cards = []

charts = [
    {
        "id": "family_mix",
        "title": "招聘记录按岗位族群分布",
        "subtitle": "2025年1-6月；按招聘记录计，岗位族群为标题关键词归类",
        "type": "horizontalBar",
        "dataset": "job_families",
        "sourceId": source["id"],
        "encodings": {
            "x": {"field": "岗位族群", "type": "nominal", "label": "岗位族群"},
            "y": {"field": "招聘记录", "type": "quantitative", "format": "compact", "label": "招聘记录"},
            "tooltip": [
                {"field": "占比", "type": "quantitative", "format": "percent", "label": "原始占比"},
                {"field": "合并后占比", "type": "quantitative", "format": "percent", "label": "合并后占比"},
                {"field": "薪资中位数", "type": "quantitative", "format": "number", "label": "月薪中位数"},
            ],
        },
        "xAxisTitle": "岗位族群",
        "yAxisTitle": "招聘记录",
        "layout": "full",
        "maxRows": 20,
    },
    {
        "id": "salary_distribution",
        "title": "有效招聘记录的月薪区间中点分布",
        "subtitle": "覆盖26.66万条有效薪资记录；已排除零薪资占位和缺失值",
        "type": "bar",
        "dataset": "salary_bands",
        "sourceId": source["id"],
        "encodings": {
            "x": {"field": "薪资带", "type": "ordinal", "label": "月薪区间中点"},
            "y": {"field": "招聘记录", "type": "quantitative", "format": "compact", "label": "招聘记录"},
            "tooltip": [{"field": "占有效薪资", "type": "quantitative", "format": "percent", "label": "占有效薪资"}],
        },
        "xAxisTitle": "月薪区间中点",
        "yAxisTitle": "招聘记录",
        "layout": "full",
    },
    {
        "id": "family_salary",
        "title": "各岗位族群月薪中位数",
        "subtitle": "单位：元/月；以有效月薪区间中点计算，样本量随族群不同",
        "type": "horizontalBar",
        "dataset": "job_families_salary",
        "sourceId": source["id"],
        "encodings": {
            "x": {"field": "岗位族群", "type": "nominal", "label": "岗位族群"},
            "y": {"field": "薪资中位数", "type": "quantitative", "format": "number", "label": "月薪中位数"},
            "tooltip": [
                {"field": "有效薪资样本", "type": "quantitative", "format": "compact", "label": "有效薪资样本"},
                {"field": "招聘记录", "type": "quantitative", "format": "compact", "label": "全部招聘记录"},
            ],
        },
        "xAxisTitle": "岗位族群",
        "yAxisTitle": "月薪中位数（元/月）",
        "layout": "full",
        "maxRows": 20,
    },
]

tables = [
    {"id": "top_titles", "title": "高频原始岗位名称", "subtitle": "保留原始岗位名，不做同义词合并", "dataset": "top_titles", "sourceId": source["id"], "density": "comfortable", "defaultSort": {"field": "招聘记录", "direction": "desc"}, "columns": [{"field": "rank", "label": "排名", "type": "number"}, {"field": "原始岗位名", "label": "岗位名称", "type": "text"}, {"field": "招聘记录", "label": "招聘记录", "format": "number", "align": "right"}, {"field": "占比", "label": "占全部记录", "format": "percent", "align": "right"}]},
    {"id": "education", "title": "学历要求与薪资中位数", "subtitle": "学历口径按原字段汇总；中专/中技与学历不限做了同义写法合并", "dataset": "education", "sourceId": source["id"], "density": "comfortable", "defaultSort": {"field": "招聘记录", "direction": "desc"}, "columns": [{"field": "学历口径", "label": "学历要求", "type": "text"}, {"field": "招聘记录", "label": "招聘记录", "format": "number", "align": "right"}, {"field": "占比", "label": "占比", "format": "percent", "align": "right"}, {"field": "薪资中位数", "label": "月薪中位数（元）", "format": "number", "align": "right"}]},
    {"id": "cities", "title": "招聘记录最多的20个城市", "subtitle": "城市按招聘记录数排序，薪资为有效区间中点的中位数", "dataset": "cities", "sourceId": source["id"], "density": "compact", "defaultSort": {"field": "招聘记录", "direction": "desc"}, "columns": [{"field": "rank", "label": "排名", "type": "number"}, {"field": "城市", "label": "城市", "type": "text"}, {"field": "招聘记录", "label": "招聘记录", "format": "number", "align": "right"}, {"field": "占比", "label": "占比", "format": "percent", "align": "right"}, {"field": "薪资中位数", "label": "月薪中位数（元）", "format": "number", "align": "right"}, {"field": "薪资P25", "label": "P25", "format": "number", "align": "right"}, {"field": "薪资P75", "label": "P75", "format": "number", "align": "right"}]},
    {"id": "quality", "title": "关键数据质量风险", "subtitle": "按对岗位结构、薪资和地域分析的影响排序", "dataset": "quality", "sourceId": source["id"], "density": "spacious", "defaultSort": {"field": "数量", "direction": "desc"}, "columns": [{"field": "问题", "label": "问题", "type": "text"}, {"field": "数量", "label": "数量", "format": "number", "align": "right"}, {"field": "占比", "label": "占比", "format": "percent", "align": "right"}, {"field": "影响", "label": "分析影响", "type": "text"}, {"field": "严重度", "label": "严重度", "type": "text"}]},
]

blocks = [
    {"id": "title", "type": "markdown", "body": "# 2025应届生招聘岗位洞察"},
    {"id": "executive_summary", "type": "markdown", "sourceId": source["id"], "body": f"## Executive Summary\n\n- **这不是一张只由技术岗构成的校招表。** 28.19万条记录中，标题可判定的岗位里，销售/商务/市场是最大族群；行政职能、生产制造、教育培训、设计传媒和生活服务也占据较大规模。\n- **薪资中心在7000元/月。** 94.6%的记录有可用正薪资区间；区间中点的中位数为7000元，P25为5500元、P75为9000元，IT/数字技术岗位中位数最高，约9000元。\n- **约七成岗位对新人明确友好。** {pct(entry_count / TOTAL)}的记录把经验写为不限、无需经验、无经验或在校/应届；但仍有相当一部分岗位要求1年以上经验，数据不是纯粹的“零经验校招池”。\n- **招聘记录数不能直接等同于真实岗位数。** 按企业、岗位名、地点和薪资合并后，约34.0%的原记录属于已出现组合的再次发布；招聘人数又有93.8%缺失，因此更适合看需求结构与曝光结构。"},
    {"id": "mix_story", "type": "markdown", "sourceId": source["id"], "body": "## 岗位需求以销售、职能和制造技术为主\n\n**销售/商务/市场占全部招聘记录13.2%，是最大可判定岗位族群。** 行政/人力/职能占9.7%，生产制造/工程技术占8.1%，教育培训占7.8%，设计/传媒/内容占7.3%。这说明应届生市场同时需要获客、运营支撑和一线技术执行，并非只有互联网研发岗位。\n\n**去除重复发布型组合后，主结论不变，但结构会调整。** 销售仍居首；行政职能和生产制造的占比分别上升约1.8和1.5个百分点，教育培训和设计传媒则下降约2.2和1.3个百分点，后两类岗位的重复发布更明显。"},
    {"id": "family_mix_block", "type": "chart", "chartId": "family_mix"},
    {"id": "titles_story", "type": "markdown", "sourceId": source["id"], "body": "## 高频岗位名称高度分散\n\n单一岗位名的占比都不高：最常见的“外贸业务员”也只占0.6%。因此，专业建设或课程调整不宜追逐某一个职位名称，应该围绕可迁移的岗位能力簇来设计，例如销售转化、客户沟通、办公协作、数据处理、工业设备与质量、内容生产和数字工具使用。"},
    {"id": "top_titles_block", "type": "table", "tableId": "top_titles"},
    {"id": "salary_story", "type": "markdown", "sourceId": source["id"], "body": "## 薪资中位数约7000元，技术岗位溢价最明显\n\n**超过一半的有效薪资集中在4000—8000元/月。** 其中区间中点在6000—8000元的记录最多，占有效薪资约31.8%；4000—6000元约24.6%。\n\n**IT/数字技术岗位的薪资中位数约9000元，领先其他主要族群。** 咨询/研究/法务和销售/商务/市场约7500元；生产制造、建筑工程和教育培训约7000元；行政、财会、供应链和产品运营多在6500元左右；生活服务约5500元。薪资只是岗位区间中点，并未控制城市、学历和公司差异，不能解释为岗位本身的净溢价。"},
    {"id": "salary_dist_block", "type": "chart", "chartId": "salary_distribution"},
    {"id": "family_salary_block", "type": "chart", "chartId": "family_salary"},
    {"id": "education_story", "type": "markdown", "sourceId": source["id"], "body": "## 大专和本科是招聘主体，学历提升伴随更高薪资区间\n\n大专要求占33.8%，本科占28.0%，两者合计61.8%；硕士与博士合计约4.1%。本科岗位薪资中位数约7500元，高于大专岗位的6500元；硕士约1.1万元，博士约2.5万元。这里反映的是岗位组合差异，不是同岗位的学历回报因果关系。"},
    {"id": "education_block", "type": "table", "tableId": "education"},
    {"id": "city_story", "type": "markdown", "sourceId": source["id"], "body": "## 机会分布广，但一线城市薪资中位数更高\n\n广州、成都、北京、上海、深圳、杭州位居招聘记录前列。北京和上海的月薪中位数均约9000元，深圳与杭州约8000元；广州约7000元、成都约7500元。城市差异同时受岗位结构、行业构成与生活成本影响，不能只按名义月薪排序求职吸引力。"},
    {"id": "cities_block", "type": "table", "tableId": "cities"},
    {"id": "quality_story", "type": "markdown", "sourceId": source["id"], "body": "## 先去重，再把招聘记录当作需求信号\n\n**这份数据适合回答“市场上在发布什么”，不适合直接回答“企业实际要招多少人”。** 招聘人数缺失率93.8%，且同类职位存在明显重复发布；行业字段又有57.6%为“不限”或未标注。用于专业设置、课程方向和就业服务时，应先按企业—岗位—地点—薪资组合去重，再对重点岗位做人工职业编码与能力词抽取。"},
    {"id": "quality_block", "type": "table", "tableId": "quality"},
    {"id": "next_steps", "type": "markdown", "body": "## 建议如何使用这份数据\n\n1. **专业建设：** 以岗位族群和能力簇为主，不以单个岗位名为主；优先关注销售转化、职能办公、制造质量、电商内容和数字技术五类横向能力。\n2. **就业服务：** 将岗位按学历、经验和城市切成不同求职池，避免把要求1—3年经验的岗位混入纯应届推荐。\n3. **校企合作：** 对重复发布少但去重后占比上升的制造技术、行政职能岗位优先做企业复核，它们更可能代表分散而稳定的真实需求。\n4. **后续分析：** 从职位描述提取技能、证书、软件工具和专业要求，并将岗位归类到国家职业分类或学校专业目录，形成可追溯映射。"},
    {"id": "further_questions", "type": "markdown", "body": "## 进一步值得追问的问题\n\n- 哪些岗位族群在不同专业、学历和城市中同时具备较大规模与较高薪资？\n- 职位描述中最常见的软件工具、证书、技能和专业限制是什么？\n- 重复发布集中在哪些企业、平台与岗位，是否存在招聘外包或长期曝光型职位？\n- 将2025年与2019—2024年按相同去重口径比较后，哪些岗位需求正在上升或收缩？"},
    {"id": "caveats", "type": "markdown", "sourceId": source["id"], "body": "## 口径与限制\n\n- 统计单位是招聘记录，不是独立职位、录用人数或企业数。\n- 数据覆盖2025年1—6月，6月记录占45.7%，可能受采集批次和平台发布节奏影响，不宜据此判断月度增长。\n- 岗位族群由标题关键词规则归类，23.8%仍为“其他/难判定”；归类结果用于方向性洞察。\n- 薪资以最低—最高月薪区间中点计算，排除了7546条零薪资占位和缺失/异常区间；提成、奖金、实习日薪与年包口径可能未完全统一。\n- 数据来源高度集中于两个匿名平台，平台2与平台75合计占93.8%，结论代表该样本的招聘曝光结构。"},
]

artifact = {
    "surface": "report",
    "manifest": {
        "version": 1,
        "surface": "report",
        "title": "2025应届生招聘岗位洞察",
        "description": "基于2025年1—6月应届生招聘CSV的全量岗位结构、薪资、学历、城市与数据质量分析。",
        "generatedAt": DATA["generated_at"],
        "sources": [source],
        "cards": cards,
        "charts": charts,
        "tables": tables,
        "blocks": blocks,
    },
    "snapshot": {
        "version": 1,
        "generatedAt": DATA["generated_at"],
        "status": "ready",
        "datasets": {
            "summary": [summary_row],
            "job_families": family_rows,
            "job_families_salary": sorted([x for x in family_rows if x["薪资中位数"] is not None], key=lambda x: x["薪资中位数"], reverse=True),
            "salary_bands": salary_rows,
            "top_titles": role_rows,
            "education": education_rows,
            "cities": city_rows,
            "quality": quality_rows,
        },
    },
    "sources": [source],
}

db_path = BASE / "report_data.sqlite"
if db_path.exists():
    db_path.unlink()
conn = sqlite3.connect(db_path)
for table_name, rows in artifact["snapshot"]["datasets"].items():
    if not rows:
        continue
    columns = list(rows[0].keys())
    def sql_type(column):
        values = [row.get(column) for row in rows if row.get(column) is not None]
        if values and all(isinstance(value, bool) or isinstance(value, int) for value in values):
            return "INTEGER"
        if values and all(isinstance(value, (int, float)) and not isinstance(value, bool) for value in values):
            return "REAL"
        return "TEXT"
    column_sql = ", ".join(f'"{column}" {sql_type(column)}' for column in columns)
    conn.execute(f'CREATE TABLE "{table_name}" ({column_sql})')
    placeholders = ", ".join("?" for _ in columns)
    quoted_columns = ", ".join(f'"{column}"' for column in columns)
    conn.executemany(
        f'INSERT INTO "{table_name}" ({quoted_columns}) VALUES ({placeholders})',
        [[row.get(column) for column in columns] for row in rows],
    )
conn.commit()
conn.close()

(BASE / "artifact_payload.json").write_text(json.dumps(artifact, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"artifact": str(BASE / "artifact_payload.json"), "entry_count": entry_count, "entry_share": entry_count / TOTAL, "family_rows": len(family_rows)}, ensure_ascii=False, indent=2))
