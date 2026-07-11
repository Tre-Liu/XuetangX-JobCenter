#!/usr/bin/env python3
"""Match every industrial-park source row to the existing 19-chain/57-node dictionary.

The script is intentionally deterministic and evidence preserving.  It never drops a
source row: rows without sufficient evidence are written with an explicit unmatched
or review status, while the one-to-many relation table contains only candidate or
confirmed relationships.
"""

from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

import pandas as pd


PARK_DTA = Path("/Users/liuhongzhe/Desktop/产业园区网全部产业园数据/产业园区网_产业园数据.dta")
NODE_CSV = Path("/Users/liuhongzhe/Desktop/产业链整理结果/industry_chain_stage_nodes.csv")
OUTPUT_DIR = Path("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/work/park-industry-chain-match")


def norm(value: object) -> str:
    text = unicodedata.normalize("NFKC", "" if value is None else str(value))
    return re.sub(r"\s+", "", text).strip()


def intro_sector_text(value: object) -> str:
    """Keep the industrial/context portion and exclude common amenity boilerplate."""
    text = norm(value)
    cut_markers = ["园区周边房价", "园区生活配套", "居住环境", "商业环境", "超市:", "超市："]
    positions = [text.find(marker) for marker in cut_markers if text.find(marker) >= 0]
    if positions:
        text = text[: min(positions)]
    return text[:1800]


def term_hit(text: str, term: str) -> bool:
    if not text or not term:
        return False
    if term.isascii() and term.isalnum():
        return re.search(rf"(?<![A-Za-z0-9]){re.escape(term)}(?![A-Za-z0-9])", text, re.I) is not None
    return norm(term).lower() in text.lower()


CHAIN_TERMS: dict[str, list[str]] = {
    "数据要素与数字经济产业链": ["数据要素", "大数据", "数字经济", "数字产业", "数据产业", "数字内容", "文化创意", "广告产业", "动漫游戏"],
    "高端装备与智能制造产业链": ["高端装备", "装备制造", "智能制造", "机械制造", "机械设备", "工业母机", "数控机床", "机床产业", "激光产业", "工程机械"],
    "基础设施与城市建设产业链": ["基础设施", "城市建设", "工程建设", "建筑产业", "建筑科技", "建材产业", "房地产", "产业新城", "市政工程"],
    "医药生物与医疗健康产业链": ["生物医药", "医药产业", "医疗产业", "医疗器械", "制药", "中药产业", "生命健康", "大健康", "康养", "体外诊断"],
    "新能源与电力装备产业链": ["新能源", "光伏", "风电", "太阳能", "锂电", "动力电池", "储能", "电力装备", "电力设备", "输配电", "特高压", "充电桩"],
    "智能物联与消费电子产业链": ["物联网", "智能物联", "消费电子", "家用电器", "家电产业", "智能家居", "智能终端", "手机产业", "传感器产业"],
    "石油化工产业链": ["石油化工", "石化产业", "化工产业", "化学工业", "煤化工", "精细化工", "日用化工", "日化产业"],
    "汽车与智能网联汽车产业链": ["汽车产业", "汽车工业", "汽车制造", "汽车零部件", "汽配", "新能源汽车", "智能网联汽车", "车联网", "自动驾驶", "智能交通", "整车制造"],
    "食品饮料产业链": ["食品饮料", "食品产业", "食品加工", "饮料产业", "农产品加工", "农副产品加工", "粮油加工", "乳制品", "酿酒", "茶产业"],
    "新一代信息基础设施产业链": ["信息基础设施", "通信产业", "5G", "光通信", "数据中心", "IDC", "云计算", "边缘计算", "算力", "网络通信", "服务器产业"],
    "绿色环保与资源循环产业链": ["节能环保", "环保产业", "资源循环", "循环经济", "再生资源", "固废", "污水处理", "水处理", "大气治理", "碳中和", "低碳产业"],
    "新材料产业链": ["新材料", "先进材料", "复合材料", "高分子材料", "金属材料", "稀土", "石墨烯", "陶瓷材料", "冶金产业", "钢铁产业", "有色金属"],
    "空天装备与低空经济产业链": ["航空航天", "航空产业", "航天产业", "低空经济", "通用航空", "无人机", "飞行器", "卫星产业", "火箭产业", "eVTOL"],
    "机器人产业链": ["机器人", "工业机器人", "服务机器人", "人形机器人", "机器人工业", "机器人产业"],
    "人工智能产业链": ["人工智能", "AI产业", "大模型", "机器视觉", "计算机视觉", "语音识别", "智能算法", "算法产业"],
    "半导体与集成电路产业链": ["半导体", "集成电路", "芯片产业", "芯片制造", "晶圆", "封装测试", "微电子", "光刻胶"],
    "纺织产业链": ["纺织产业", "纺织服装", "服装产业", "家纺", "纺纱", "织造", "印染", "面料产业", "针织", "鞋服产业", "丝绸产业"],
    "新型显示与虚拟现实产业链": ["新型显示", "显示面板", "显示屏", "液晶显示", "OLED", "LCD", "虚拟现实", "增强现实", "VR产业", "AR产业", "光电显示"],
    "软件与数字安全产业链": ["软件产业", "软件园", "信息软件", "信息技术", "网络安全", "信息安全", "数字安全", "区块链", "操作系统", "数据库产业", "中间件", "服务外包"],
}


NODE_TERMS: dict[str, list[str]] = {
    "node-001": ["数据采集", "数据资源", "数据存储", "数据源", "采集设备"],
    "node-002": ["数据治理", "数据清洗", "数据标注", "数据交易", "数据流通", "数据服务"],
    "node-003": ["数字经济", "数字内容", "文化创意", "广告", "动漫", "游戏", "数字媒体", "产业数字化"],
    "node-004": ["工业母机", "数控机床", "机床", "关键基础件", "轴承", "齿轮", "模具", "机械零部件"],
    "node-005": ["高端装备", "装备制造", "激光装备", "工程机械", "专用设备", "自动化设备"],
    "node-006": ["智能工厂", "生产线", "系统集成", "设备运维", "工业运维"],
    "node-007": ["规划设计", "建材", "水泥", "砂石", "工程准备"],
    "node-008": ["房地产", "建筑施工", "工程建设", "基础设施", "市政建设", "产业新城"],
    "node-009": ["物业", "城市运营", "公用事业", "环卫", "燃气运营", "供水运营"],
    "node-010": ["药物研发", "原料药", "诊断试剂", "体外诊断", "基因", "细胞", "疫苗"],
    "node-011": ["制药", "药品生产", "医疗器械", "医疗装备", "医疗机器人", "医药制造"],
    "node-012": ["医疗服务", "医院", "临床", "康复", "健康管理", "康养", "养老"],
    "node-013": ["电池材料", "锂电材料", "电芯", "光伏组件", "太阳能电池", "风电装备", "发电设备"],
    "node-014": ["发电系统", "储能", "输配电", "特高压", "变压器", "电网"],
    "node-015": ["充电桩", "能源服务", "售电", "电力运营", "综合能源", "新能源运营"],
    "node-016": ["传感器", "芯片模组", "通信模组", "电子元器件", "基础器件"],
    "node-017": ["智能终端", "家用电器", "家电", "消费电子", "智能手机", "物联平台"],
    "node-018": ["智能家居", "智慧家庭", "行业物联", "消费电子渠道"],
    "node-019": ["油气", "石油开采", "天然气", "煤化工", "基础化工原料"],
    "node-020": ["炼油", "炼化", "烯烃", "芳烃", "化工材料", "化工中间体"],
    "node-021": ["塑料", "橡胶", "涂料", "精细化工", "农药", "化肥", "日化"],
    "node-022": ["汽车零部件", "汽车电子", "轮胎", "汽车材料", "关键总成", "汽配"],
    "node-023": ["整车制造", "汽车制造", "智能座舱", "车载电子", "智能网联", "自动驾驶系统"],
    "node-024": ["汽车后市场", "汽车销售", "汽车服务", "出行服务", "车联网服务", "智能交通", "自动驾驶应用"],
    "node-025": ["农产品", "农副产品", "食品原料", "食品配料", "粮食", "果蔬", "水产", "畜牧"],
    "node-026": ["食品加工", "饮料制造", "酿造", "乳制品", "粮油加工", "食品制造"],
    "node-027": ["餐饮", "食品零售", "食品电商", "品牌运营", "商超"],
    "node-028": ["服务器", "光通信", "网络设备", "通信设备", "算力硬件"],
    "node-029": ["5G", "数据中心", "IDC", "云计算", "边缘计算", "通信网络"],
    "node-030": ["云服务", "算力服务", "网络服务", "行业数字化"],
    "node-031": ["环保装备", "环境监测", "资源回收", "再生资源", "碳管理"],
    "node-032": ["大气治理", "污水处理", "固废", "节能减排", "碳中和", "污染治理"],
    "node-033": ["绿色运营", "循环经济", "园区环保", "市政环保"],
    "node-034": ["矿物材料", "化工材料", "材料原料", "稀土", "有色金属", "钢铁"],
    "node-035": ["先进材料", "新材料制备", "复合材料", "高分子材料", "石墨烯", "陶瓷材料"],
    "node-036": ["材料应用", "材料加工", "材料配套"],
    "node-037": ["航空材料", "航天材料", "航空零部件", "航电", "航空发动机", "动力系统"],
    "node-038": ["航空装备", "航天装备", "无人机", "eVTOL", "飞行器制造", "通用航空制造"],
    "node-039": ["低空物流", "低空文旅", "低空巡检", "空域服务", "通用航空运营", "低空运营"],
    "node-040": ["减速器", "伺服", "机器人控制器", "机器人传感器", "机器人零部件"],
    "node-041": ["机器人本体", "工业机器人", "人形机器人", "机器人制造", "机器人系统集成"],
    "node-042": ["服务机器人", "特种机器人", "机器人应用", "机器人教育"],
    "node-043": ["训练数据", "AI算力", "算法模型", "大模型", "人工智能基础平台"],
    "node-044": ["机器视觉", "计算机视觉", "语音识别", "智能感知", "算法平台", "AI工具"],
    "node-045": ["人工智能应用", "AI应用", "行业智能化", "智能服务"],
    "node-046": ["半导体材料", "半导体设备", "光刻胶", "晶圆设备"],
    "node-047": ["芯片设计", "晶圆制造", "封装测试", "集成电路", "芯片制造"],
    "node-048": ["汽车芯片", "工业芯片", "电子终端", "通信芯片"],
    "node-049": ["天然纤维", "化学纤维", "纺织原料", "棉纺", "毛纺"],
    "node-050": ["纺纱", "织造", "印染", "面料", "服装制造"],
    "node-051": ["服装", "家纺", "鞋服", "纺织品", "品牌服饰"],
    "node-052": ["显示材料", "光学器件", "显示部件", "VR部件"],
    "node-053": ["显示面板", "显示屏", "OLED", "LCD", "VR设备", "AR设备"],
    "node-054": ["虚拟现实", "增强现实", "VR内容", "AR内容", "沉浸式", "工业仿真"],
    "node-055": ["基础软件", "操作系统", "数据库", "中间件", "密码技术", "区块链底层"],
    "node-056": ["应用软件", "区块链平台", "安全产品", "网络安全产品"],
    "node-057": ["软件服务", "政企数字化", "安全运营", "服务外包", "信息技术服务"],
}


# category, chain, optional node, score, explanation
CATEGORY_RULES: dict[str, list[tuple[str, str | None, int, str]]] = {
    "汽车工业": [("汽车与智能网联汽车产业链", None, 58, "原始产业标签直接对应汽车链")],
    "航空航天": [("空天装备与低空经济产业链", None, 58, "原始产业标签直接对应空天链")],
    "农林牧渔": [("食品饮料产业链", "node-025", 46, "农林牧渔与食品饮料上游原料环节相关")],
    "装备制造": [("高端装备与智能制造产业链", None, 56, "原始产业标签直接对应装备制造链")],
    "机械设备": [("高端装备与智能制造产业链", None, 54, "原始产业标签直接对应机械设备环节")],
    "化工日化": [("石油化工产业链", None, 55, "原始产业标签对应化工及下游制品")],
    "纺织服装": [("纺织产业链", None, 56, "原始产业标签直接对应纺织链")],
    "建材冶金": [
        ("基础设施与城市建设产业链", "node-007", 43, "建材与城市建设上游工程材料相关"),
        ("新材料产业链", None, 40, "冶金与基础/先进材料相关"),
    ],
    "能源电力": [("新能源与电力装备产业链", None, 54, "原始产业标签对应能源与电力装备")],
    "环保节能": [("绿色环保与资源循环产业链", None, 56, "原始产业标签直接对应绿色环保链")],
    "医疗医药": [("医药生物与医疗健康产业链", None, 57, "原始产业标签直接对应医药医疗链")],
    "房地产建筑": [("基础设施与城市建设产业链", None, 55, "原始产业标签直接对应城市建设链")],
    "食品饮料": [("食品饮料产业链", None, 58, "原始产业标签直接对应食品饮料链")],
    "家电数码": [("智能物联与消费电子产业链", "node-017", 52, "家电数码对应智能终端与家电环节")],
    "文化创意": [("数据要素与数字经济产业链", "node-003", 48, "文化创意对应数字内容与场景应用")],
    "电子商务": [("数据要素与数字经济产业链", "node-003", 45, "电子商务对应数字经济场景应用")],
    "科技服务": [("软件与数字安全产业链", "node-057", 38, "科技服务可能对应政企数字化与软件服务，需复核")],
    "电子信息": [
        ("新一代信息基础设施产业链", None, 34, "电子信息宽口径候选"),
        ("半导体与集成电路产业链", None, 34, "电子信息宽口径候选"),
        ("智能物联与消费电子产业链", None, 34, "电子信息宽口径候选"),
        ("新型显示与虚拟现实产业链", None, 32, "电子信息宽口径候选"),
        ("软件与数字安全产业链", None, 32, "电子信息宽口径候选"),
    ],
    "电子产业": [
        ("半导体与集成电路产业链", None, 36, "电子产业宽口径候选"),
        ("智能物联与消费电子产业链", None, 36, "电子产业宽口径候选"),
        ("新型显示与虚拟现实产业链", None, 32, "电子产业宽口径候选"),
    ],
    "国防科技产业": [
        ("空天装备与低空经济产业链", None, 35, "国防科技宽口径候选"),
        ("高端装备与智能制造产业链", None, 32, "国防科技宽口径候选"),
        ("半导体与集成电路产业链", None, 30, "国防科技宽口径候选"),
    ],
}


EXCLUDED_CATEGORY_NOTES = {
    "其他": "原始产业标签为“其他”，需依赖园区名称/简介中的明确产业证据",
    "仓储物流": "现有19条标准链不含独立物流产业链，仅在出现具体产业对象时匹配",
    "大消费": "现有19条标准链不含独立大消费/商贸链，需依赖具体产业对象",
    "轻工业": "轻工业口径过宽，需依赖食品、纺织、家电等具体产业证据",
    "金融保险": "现有19条标准链不含独立金融保险链，需依赖数字金融等具体证据",
    "高新技术": "高新技术是园区属性而非具体产业链，需依赖名称/简介证据",
}


def matched_terms(text: str, terms: list[str]) -> list[str]:
    return [term for term in terms if term_hit(text, term)]


def confidence(score: int) -> str:
    if score >= 72:
        return "高"
    if score >= 48:
        return "中"
    return "低"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    parks = pd.read_stata(PARK_DTA, convert_categoricals=False)
    nodes = pd.read_csv(NODE_CSV)
    nodes["node_id"] = nodes["node_id"].astype(str)
    node_by_id = nodes.set_index("node_id").to_dict("index")
    chain_nodes = {chain: part.sort_values("node_id")["node_id"].tolist() for chain, part in nodes.groupby("standard_chain")}

    assert set(CHAIN_TERMS) == set(chain_nodes), "Chain-rule names must exactly match the 19-chain dictionary"
    assert set(NODE_TERMS) == set(node_by_id), "Node-rule ids must exactly match the 57-node dictionary"

    parks = parks.copy()
    parks.insert(0, "source_row", range(2, len(parks) + 2))
    parks.insert(0, "record_id", [f"park-{i:06d}" for i in range(1, len(parks) + 1)])
    parks["产业_norm"] = parks["产业"].map(norm)
    parks["名称_norm"] = parks["产业园名称"].map(norm)
    parks["简介产业段"] = parks["简介"].map(intro_sector_text)

    relation_rows: list[dict[str, object]] = []
    summary_rows: list[dict[str, object]] = []

    for row in parks.itertuples(index=False):
        rowd = row._asdict()
        category = rowd["产业_norm"]
        name_text = rowd["名称_norm"]
        intro_text = rowd["简介产业段"]
        chain_evidence: dict[str, dict[str, object]] = defaultdict(lambda: {
            "score": 0,
            "category_reasons": [],
            "category_nodes": [],
            "name_hits": [],
            "intro_hits": [],
        })

        for chain, node_id, score, reason in CATEGORY_RULES.get(category, []):
            evidence = chain_evidence[chain]
            evidence["score"] = max(int(evidence["score"]), score)
            evidence["category_reasons"].append(reason)
            if node_id:
                evidence["category_nodes"].append(node_id)

        for chain, terms in CHAIN_TERMS.items():
            name_hits = matched_terms(name_text, terms)
            intro_hits = matched_terms(intro_text, terms)
            if name_hits:
                evidence = chain_evidence[chain]
                evidence["name_hits"] = name_hits
                # An explicit sector phrase in the park name is medium-confidence
                # evidence even when the source category is the catch-all "其他".
                evidence["score"] = int(evidence["score"]) + min(68, 50 + 8 * (len(name_hits) - 1))

            # Description-only additions require stronger evidence to avoid amenity boilerplate.
            intro_anchor = [t for t in intro_hits if len(norm(t)) >= 4 or t.upper() in {"5G", "IDC", "OLED", "LCD"}]
            preexisting = chain in chain_evidence
            if intro_hits and (preexisting or len(set(intro_hits)) >= 2 or intro_anchor):
                evidence = chain_evidence[chain]
                evidence["intro_hits"] = intro_hits[:8]
                if preexisting:
                    intro_score = min(26, 8 * len(set(intro_hits)))
                else:
                    intro_score = min(46, 30 + 6 * (len(set(intro_hits)) - 1))
                evidence["score"] = int(evidence["score"]) + intro_score

        row_relations: list[dict[str, object]] = []
        for chain, ev in chain_evidence.items():
            score = min(100, int(ev["score"]))
            if score < 28:
                continue

            node_scores: dict[str, int] = {}
            node_hit_detail: dict[str, tuple[list[str], list[str]]] = {}
            for node_id in chain_nodes[chain]:
                n_name_hits = matched_terms(name_text, NODE_TERMS[node_id])
                n_intro_hits = matched_terms(intro_text, NODE_TERMS[node_id])
                n_score = 18 * len(set(n_name_hits)) + 5 * len(set(n_intro_hits))
                if node_id in ev["category_nodes"]:
                    n_score += 24
                if n_score > 0:
                    node_scores[node_id] = n_score
                    node_hit_detail[node_id] = (n_name_hits, n_intro_hits[:8])

            selected_nodes: list[str] = []
            if node_scores:
                max_node_score = max(node_scores.values())
                selected_nodes = [nid for nid, ns in node_scores.items() if ns >= max(12, int(max_node_score * 0.55))]

            evidence_parts: list[str] = []
            if ev["category_reasons"]:
                evidence_parts.append("产业标签:" + "；".join(ev["category_reasons"]))
            if ev["name_hits"]:
                evidence_parts.append("园区名称关键词:" + "、".join(ev["name_hits"]))
            if ev["intro_hits"]:
                evidence_parts.append("简介关键词:" + "、".join(ev["intro_hits"]))
            base_reason = "；".join(evidence_parts)
            conf = confidence(score)

            if selected_nodes:
                for node_id in selected_nodes:
                    node = node_by_id[node_id]
                    n_name_hits, n_intro_hits = node_hit_detail[node_id]
                    node_ev = []
                    if n_name_hits:
                        node_ev.append("名称节点词:" + "、".join(n_name_hits))
                    if n_intro_hits:
                        node_ev.append("简介节点词:" + "、".join(n_intro_hits))
                    if node_id in ev["category_nodes"]:
                        node_ev.append("产业标签直接指向该节点")
                    relation_conf = conf if node_scores[node_id] >= 18 else ("中" if conf == "高" else conf)
                    row_relations.append({
                        "record_id": rowd["record_id"],
                        "source_row": rowd["source_row"],
                        "产业园名称": rowd["产业园名称"],
                        "原始产业": rowd["产业"],
                        "省份": rowd["省份"],
                        "城市": rowd["城市"],
                        "区县": rowd["区县"],
                        "standard_chain": chain,
                        "stage": node["stage"],
                        "node_id": node_id,
                        "node_name": node["node_name"],
                        "relation_scope": "产业节点",
                        "confidence": relation_conf,
                        "chain_score": score,
                        "node_score": node_scores[node_id],
                        "matched_name_terms": "、".join(ev["name_hits"] + n_name_hits),
                        "matched_intro_terms": "、".join(ev["intro_hits"] + n_intro_hits),
                        "match_reason": base_reason + ("；" if base_reason and node_ev else "") + "；".join(node_ev),
                        "candidate_nodes": "",
                    })
            else:
                candidate = [f"{nid}:{node_by_id[nid]['node_name']}" for nid in chain_nodes[chain]]
                row_relations.append({
                    "record_id": rowd["record_id"],
                    "source_row": rowd["source_row"],
                    "产业园名称": rowd["产业园名称"],
                    "原始产业": rowd["产业"],
                    "省份": rowd["省份"],
                    "城市": rowd["城市"],
                    "区县": rowd["区县"],
                    "standard_chain": chain,
                    "stage": "待细分",
                    "node_id": "",
                    "node_name": "",
                    "relation_scope": "产业链级（候选节点待复核）",
                    "confidence": conf,
                    "chain_score": score,
                    "node_score": 0,
                    "matched_name_terms": "、".join(ev["name_hits"]),
                    "matched_intro_terms": "、".join(ev["intro_hits"]),
                    "match_reason": base_reason,
                    "candidate_nodes": "；".join(candidate),
                })

        # Remove identical relation targets caused by overlapping evidence paths.
        dedup: dict[tuple[str, str], dict[str, object]] = {}
        for rel in row_relations:
            key = (str(rel["standard_chain"]), str(rel["node_id"]))
            current = dedup.get(key)
            if current is None or int(rel["chain_score"]) > int(current["chain_score"]):
                dedup[key] = rel
        row_relations = list(dedup.values())
        relation_rows.extend(row_relations)

        high_medium = [r for r in row_relations if r["confidence"] in {"高", "中"}]
        node_specific = [r for r in high_medium if r["node_id"]]
        if node_specific:
            status = "已匹配-节点明确"
            review_reason = ""
        elif high_medium:
            status = "已匹配-链明确节点待细分"
            review_reason = "产业链证据较明确，但原始数据不足以精确判断上中下游节点"
        elif row_relations:
            status = "待复核-宽口径候选"
            review_reason = "仅有宽口径产业标签或较弱文本证据，候选链需人工复核"
        else:
            status = "无明确关联"
            review_reason = EXCLUDED_CATEGORY_NOTES.get(category, "园区名称和产业简介未出现可映射到19条标准链的明确证据")

        chains = sorted({str(r["standard_chain"]) for r in row_relations})
        nodes_out = sorted({f"{r['node_id']}:{r['node_name']}" for r in row_relations if r["node_id"]})
        best_conf = "无"
        if any(r["confidence"] == "高" for r in row_relations):
            best_conf = "高"
        elif any(r["confidence"] == "中" for r in row_relations):
            best_conf = "中"
        elif row_relations:
            best_conf = "低"
        best_reason = "；".join(dict.fromkeys(str(r["match_reason"]) for r in row_relations if r["match_reason"]))[:1200]
        summary_rows.append({
            "record_id": rowd["record_id"],
            "source_row": rowd["source_row"],
            "级别": rowd["级别"],
            "原始产业": rowd["产业"],
            "产业_norm": category,
            "产业园名称": rowd["产业园名称"],
            "链接": rowd["链接"],
            "位置": rowd["位置"],
            "经度": rowd["经度"],
            "纬度": rowd["纬度"],
            "省份": rowd["省份"],
            "城市": rowd["城市"],
            "区县": rowd["区县"],
            "匹配状态": status,
            "最高置信度": best_conf,
            "关联产业链数": len(chains),
            "关联节点数": len(nodes_out),
            "关联产业链汇总": "；".join(chains),
            "关联节点汇总": "；".join(nodes_out),
            "匹配依据摘要": best_reason,
            "待复核/未匹配原因": review_reason,
            "简介证据片段": intro_text[:360],
        })

    coverage = pd.DataFrame(summary_rows)
    relations = pd.DataFrame(relation_rows)
    if not relations.empty:
        relations.insert(0, "relation_id", [f"rel-{i:07d}" for i in range(1, len(relations) + 1)])

    # Full-coverage and referential-integrity assertions.
    assert len(coverage) == len(parks)
    assert coverage["record_id"].is_unique
    assert set(relations["record_id"]).issubset(set(coverage["record_id"]))
    assert coverage["匹配状态"].value_counts().sum() == len(parks)
    assert set(relations["standard_chain"]).issubset(set(nodes["standard_chain"]))
    assert set(relations.loc[relations["node_id"] != "", "node_id"]).issubset(set(nodes["node_id"]))

    # Representative rule checks protect the most important deterministic routes.
    check_pairs = {
        "宁波镇海化学工业园区": "石油化工产业链",
        "重庆天健创意动漫基地": "数据要素与数字经济产业链",
        "广安西部通用航空工业园": "空天装备与低空经济产业链",
        "冕宁稀土高新产业园区": "新材料产业链",
    }
    for park_name, expected_chain in check_pairs.items():
        ids = set(coverage.loc[coverage["产业园名称"] == park_name, "record_id"])
        if ids:
            actual = set(relations.loc[relations["record_id"].isin(ids), "standard_chain"])
            assert expected_chain in actual, f"Representative match failed: {park_name} -> {expected_chain}"

    coverage.to_csv(OUTPUT_DIR / "park_full_coverage.csv", index=False, encoding="utf-8-sig")
    relations.to_csv(OUTPUT_DIR / "park_chain_node_relations.csv", index=False, encoding="utf-8-sig")
    coverage[
        [
            "record_id", "source_row", "级别", "原始产业", "产业园名称", "省份", "城市", "区县",
            "匹配状态", "最高置信度", "关联产业链数", "关联节点数", "关联产业链汇总", "关联节点汇总",
            "待复核/未匹配原因", "匹配依据摘要", "链接",
        ]
    ].to_csv(OUTPUT_DIR / "park_full_coverage_compact.csv", index=False, encoding="utf-8-sig")
    coverage[
        [
            "record_id", "source_row", "原始产业", "产业园名称", "省份", "城市", "区县", "匹配状态",
            "最高置信度", "关联产业链汇总", "关联节点汇总", "待复核/未匹配原因", "链接",
        ]
    ].to_csv(OUTPUT_DIR / "park_full_coverage_minimal.csv", index=False, encoding="utf-8-sig")
    relations[
        [
            "relation_id", "record_id", "source_row", "产业园名称", "原始产业", "standard_chain", "stage",
            "node_id", "node_name", "relation_scope", "confidence", "chain_score", "node_score",
            "matched_name_terms", "matched_intro_terms", "match_reason", "candidate_nodes",
        ]
    ].to_csv(OUTPUT_DIR / "park_chain_node_relations_compact.csv", index=False, encoding="utf-8-sig")
    nodes.to_csv(OUTPUT_DIR / "industry_chain_node_dictionary.csv", index=False, encoding="utf-8-sig")

    category_rows = []
    all_categories = sorted(set(parks["产业_norm"]))
    for category in all_categories:
        rules = CATEGORY_RULES.get(category, [])
        if rules:
            for chain, node_id, score, reason in rules:
                category_rows.append({"原始产业标签": category, "候选标准产业链": chain, "直接节点": node_id or "", "基础分": score, "规则说明": reason})
        else:
            category_rows.append({"原始产业标签": category, "候选标准产业链": "", "直接节点": "", "基础分": 0, "规则说明": EXCLUDED_CATEGORY_NOTES.get(category, "无直接标签映射，依赖名称/简介")})
    pd.DataFrame(category_rows).to_csv(OUTPUT_DIR / "category_mapping_rules.csv", index=False, encoding="utf-8-sig")

    status_counts = coverage["匹配状态"].value_counts().to_dict()
    confidence_counts = coverage["最高置信度"].value_counts().to_dict()
    chain_counts = (
        relations.groupby("standard_chain")["record_id"].nunique().sort_values(ascending=False).to_dict()
        if not relations.empty else {}
    )
    node_counts = (
        relations.loc[relations["node_id"] != ""].groupby(["node_id", "node_name"])["record_id"].nunique().sort_values(ascending=False)
        if not relations.empty else pd.Series(dtype=int)
    )
    summary = {
        "source_rows": int(len(parks)),
        "source_columns": 11,
        "source_exact_duplicate_rows": int(parks.drop(columns=["record_id", "source_row", "产业_norm", "名称_norm", "简介产业段"]).duplicated().sum()),
        "duplicate_park_name_rows": int(parks["产业园名称"].duplicated().sum()),
        "unique_park_names": int(parks["产业园名称"].nunique()),
        "source_industry_categories": int(parks["产业_norm"].nunique()),
        "relation_rows": int(len(relations)),
        "parks_with_any_relation": int((coverage["关联产业链数"] > 0).sum()),
        "parks_without_relation": int((coverage["关联产业链数"] == 0).sum()),
        "full_coverage_rows": int(len(coverage)),
        "coverage_check": bool(len(coverage) == len(parks) and coverage["record_id"].is_unique),
        "status_counts": {str(k): int(v) for k, v in status_counts.items()},
        "confidence_counts": {str(k): int(v) for k, v in confidence_counts.items()},
        "chain_unique_park_counts": {str(k): int(v) for k, v in chain_counts.items()},
        "node_unique_park_counts": {f"{k[0]}:{k[1]}": int(v) for k, v in node_counts.items()},
        "method_notes": [
            "每条源数据以record_id保留，未匹配记录不会被删除。",
            "优先采用原始产业标签和园区名称；简介只使用生活配套等模板段之前的产业语境。",
            "节点证据不足时保留产业链级关系并列出3个候选节点，不强制伪造上下游。",
            "低置信度候选和标准链体系之外的园区单独标记为待复核或无明确关联。",
        ],
    }
    (OUTPUT_DIR / "mapping_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
