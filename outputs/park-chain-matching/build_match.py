from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path

import pandas as pd


ROOT = Path('/Users/liuhongzhe/Desktop/产业园区网全部产业园数据')
CHAIN_ROOT = Path('/Users/liuhongzhe/Desktop/产业链整理结果')
OUT = Path('/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/park-chain-matching')
OUT.mkdir(parents=True, exist_ok=True)


def norm(value) -> str:
    if value is None:
        return ''
    if isinstance(value, float) and pd.isna(value):
        return ''
    return str(value).strip()


parks = pd.read_excel(ROOT / '产业园区网_产业园数据.xlsx', dtype=object)
parks = parks.fillna('')
parks['产业'] = parks['产业'].map(norm)
parks['产业园名称'] = parks['产业园名称'].map(norm)
parks['park_row_id'] = [f'P{i:06d}' for i in range(1, len(parks) + 1)]
parks['source_row_number'] = range(2, len(parks) + 2)

nodes = pd.read_csv(CHAIN_ROOT / 'industry_chain_stage_nodes.csv', dtype=str).fillna('')
orig_map = pd.read_csv(CHAIN_ROOT / 'original_to_stage_node_mapping.csv', dtype=str).fillna('')
evidence = pd.read_csv(CHAIN_ROOT / 'original_direction_field_evidence.csv', dtype=str).fillna('')

node_by_id = {r['node_id']: r for r in nodes.to_dict('records')}
nodes_by_chain = defaultdict(list)
for r in nodes.itertuples(index=False):
    nodes_by_chain[r.standard_chain].append(r.node_id)

orig_to_nodes = defaultdict(list)
for r in orig_map.itertuples(index=False):
    key = (r.display_name_cleaned, r.standard_chain, r.node_id)
    if key not in {(x[0], x[1], x[2]) for x in orig_to_nodes[r.display_name_cleaned]}:
        orig_to_nodes[r.display_name_cleaned].append(
            (r.display_name_cleaned, r.standard_chain, r.node_id, r.node_name, r.stage, r.mapping_type)
        )


def all_chain(chain: str):
    return [(chain, node_id) for node_id in nodes_by_chain[chain]]


def some_nodes(chain: str, node_ids):
    return [(chain, node_id) for node_id in node_ids]


# The category rules are intentionally explicit and broad. They provide a stable
# floor for every non-"其他" park row; name-keyword hits add narrower evidence.
category_rules = {
    '汽车工业': all_chain('汽车与智能网联汽车产业链'),
    '医疗医药': all_chain('医药生物与医疗健康产业链'),
    '航空航天': all_chain('空天装备与低空经济产业链'),
    '国防科技产业': all_chain('空天装备与低空经济产业链') + all_chain('高端装备与智能制造产业链'),
    '环保节能': all_chain('绿色环保与资源循环产业链'),
    '食品饮料': all_chain('食品饮料产业链'),
    '纺织服装': all_chain('纺织产业链'),
    '房地产建筑': all_chain('基础设施与城市建设产业链'),
    '能源电力': all_chain('新能源与电力装备产业链'),
    '化工日化': all_chain('石油化工产业链') + all_chain('新材料产业链'),
    '建材冶金': all_chain('基础设施与城市建设产业链') + some_nodes('新材料产业链', ['node-034', 'node-035']),
    '家电数码': all_chain('智能物联与消费电子产业链') + all_chain('新型显示与虚拟现实产业链'),
    '电子产业': (
        all_chain('半导体与集成电路产业链')
        + all_chain('智能物联与消费电子产业链')
        + all_chain('新一代信息基础设施产业链')
        + all_chain('新型显示与虚拟现实产业链')
    ),
    '电子信息': (
        all_chain('半导体与集成电路产业链')
        + all_chain('智能物联与消费电子产业链')
        + all_chain('新一代信息基础设施产业链')
        + all_chain('新型显示与虚拟现实产业链')
        + all_chain('人工智能产业链')
        + all_chain('软件与数字安全产业链')
    ),
    '装备制造': (
        all_chain('高端装备与智能制造产业链')
        + all_chain('机器人产业链')
        + some_nodes('新能源与电力装备产业链', ['node-014'])
        + some_nodes('空天装备与低空经济产业链', ['node-038'])
    ),
    '机械设备': (
        all_chain('高端装备与智能制造产业链')
        + some_nodes('机器人产业链', ['node-040', 'node-041'])
        + some_nodes('半导体与集成电路产业链', ['node-046'])
        + some_nodes('新能源与电力装备产业链', ['node-014'])
    ),
    '农林牧渔': some_nodes('食品饮料产业链', ['node-025']),
    '大消费': (
        some_nodes('食品饮料产业链', ['node-027'])
        + some_nodes('纺织产业链', ['node-051'])
        + some_nodes('智能物联与消费电子产业链', ['node-018'])
    ),
    '文化创意': some_nodes('数据要素与数字经济产业链', ['node-003']) + some_nodes('新型显示与虚拟现实产业链', ['node-054']),
    '仓储物流': (
        some_nodes('基础设施与城市建设产业链', ['node-009'])
        + some_nodes('数据要素与数字经济产业链', ['node-003'])
        + some_nodes('新一代信息基础设施产业链', ['node-030'])
    ),
    '电子商务': (
        some_nodes('数据要素与数字经济产业链', ['node-003'])
        + some_nodes('软件与数字安全产业链', ['node-057'])
        + some_nodes('新一代信息基础设施产业链', ['node-030'])
    ),
    '金融保险': (
        some_nodes('数据要素与数字经济产业链', ['node-002', 'node-003'])
        + some_nodes('软件与数字安全产业链', ['node-056', 'node-057'])
    ),
    '科技服务': (
        some_nodes('数据要素与数字经济产业链', ['node-002', 'node-003'])
        + some_nodes('人工智能产业链', ['node-044', 'node-045'])
        + some_nodes('软件与数字安全产业链', ['node-056', 'node-057'])
        + some_nodes('新一代信息基础设施产业链', ['node-030'])
    ),
    '轻工业': (
        some_nodes('食品饮料产业链', ['node-027'])
        + some_nodes('纺织产业链', ['node-051'])
        + some_nodes('智能物联与消费电子产业链', ['node-018'])
    ),
}


# Name matching uses high-signal original directions only. Generic words such as
# “工业”“园区”“服务”“设备” are excluded to avoid incidental matches.
name_keywords = sorted(
    {
        norm(x)
        for x in evidence['display_name_cleaned'].tolist()
        if norm(x) and len(norm(x)) >= 2
    },
    key=len,
    reverse=True,
)
keyword_to_orig = defaultdict(list)
for keyword in name_keywords:
    keyword_to_orig[keyword].append(keyword)


def key_hits(park_name: str):
    hits = []
    for keyword in name_keywords:
        if keyword in park_name:
            hits.append(keyword)
    return hits


def unique_pairs(pairs):
    seen = set()
    out = []
    for chain, node_id in pairs:
        if (chain, node_id) not in seen:
            seen.add((chain, node_id))
            out.append((chain, node_id))
    return out


master_rows = []
detail_rows = []
summary_counts = defaultdict(int)

for _, row in parks.iterrows():
    category = norm(row['产业'])
    park_name = norm(row['产业园名称'])
    cat_pairs = list(category_rules.get(category, []))
    cat_pairs = unique_pairs(cat_pairs)
    hits = key_hits(park_name)
    name_pairs = []
    name_orig = []
    for hit in hits:
        name_orig.append(hit)
        for _, chain, node_id, _, _, _ in orig_to_nodes.get(hit, []):
            name_pairs.append((chain, node_id))
    name_pairs = unique_pairs(name_pairs)
    pairs = unique_pairs(cat_pairs + name_pairs)

    if cat_pairs and name_pairs:
        status = '已匹配（产业分类+园区名称）'
        scope = '产业字段；园区名称关键词'
        confidence = '高'
        reason = f'产业字段“{category}”命中分类规则；园区名称命中：{"；".join(hits)}。'
    elif cat_pairs:
        status = '已匹配（产业分类）'
        scope = '产业字段'
        confidence = '中'
        reason = f'产业字段“{category}”命中分类规则；按宽口径关联到相关标准链节点。'
    elif name_pairs:
        status = '已匹配（园区名称关键词）'
        scope = '园区名称关键词'
        confidence = '高'
        reason = f'园区名称命中产业链整理结果中的原始方向：{"；".join(name_orig)}。'
    else:
        status = '待人工研判'
        scope = '未命中'
        confidence = '待确认'
        reason = '产业字段为泛化类别或园区名称未命中产业链整理结果中的高信号关键词，保留原记录待人工研判。'

    chains = []
    node_labels = []
    node_ids = []
    for chain, node_id in pairs:
        n = node_by_id[node_id]
        if chain not in chains:
            chains.append(chain)
        node_ids.append(node_id)
        node_labels.append(f'{chain}>{n["stage"]}>{n["node_name"]}')

    out = row.to_dict()
    out.update(
        {
            'match_status': status,
            'match_scope': scope,
            'match_confidence': confidence,
            'matched_standard_chains': '；'.join(chains),
            'matched_node_ids': '；'.join(node_ids),
            'matched_nodes': '；'.join(node_labels),
            'match_count': len(pairs),
            'name_keyword_hits': '；'.join(hits),
            'match_reason': reason,
        }
    )
    master_rows.append(out)

    if pairs:
        for chain, node_id in pairs:
            n = node_by_id[node_id]
            basis = []
            if (chain, node_id) in cat_pairs:
                basis.append('产业字段规则')
            if (chain, node_id) in name_pairs:
                basis.append('园区名称关键词')
            detail_rows.append(
                {
                    'park_row_id': row['park_row_id'],
                    'source_row_number': row['source_row_number'],
                    '产业园名称': park_name,
                    '产业': category,
                    '省份': norm(row['省份']),
                    '城市': norm(row['城市']),
                    '区县': norm(row['区县']),
                    'match_status': status,
                    'match_confidence': confidence,
                    'match_basis': '；'.join(basis),
                    'keyword_hits': '；'.join(hits),
                    'standard_chain': chain,
                    'stage': n['stage'],
                    'node_id': node_id,
                    'node_name': n['node_name'],
                    'node_description': n['node_description'],
                    'mapping_type': '原始方向映射' if '园区名称关键词' in basis else '分类规则/标准链推导',
                    'match_reason': reason,
                }
            )
            summary_counts[(category, chain, n['stage'], node_id, n['node_name'], status)] += 1
    else:
        detail_rows.append(
            {
                'park_row_id': row['park_row_id'],
                'source_row_number': row['source_row_number'],
                '产业园名称': park_name,
                '产业': category,
                '省份': norm(row['省份']),
                '城市': norm(row['城市']),
                '区县': norm(row['区县']),
                'match_status': status,
                'match_confidence': confidence,
                'match_basis': '',
                'keyword_hits': '；'.join(hits),
                'standard_chain': '',
                'stage': '',
                'node_id': '',
                'node_name': '',
                'node_description': '',
                'mapping_type': '',
                'match_reason': reason,
            }
        )
        summary_counts[(category, '', '', '', '', status)] += 1


master = pd.DataFrame(master_rows)
details = pd.DataFrame(detail_rows)

summary_rows = []
for key, count in sorted(summary_counts.items()):
    category, chain, stage, node_id, node_name, status = key
    summary_rows.append(
        {
            '产业': category,
            'standard_chain': chain,
            'stage': stage,
            'node_id': node_id,
            'node_name': node_name,
            'match_status': status,
            'park_count': count,
        }
    )
summary = pd.DataFrame(summary_rows)

rule_rows = []
for category in sorted(set(parks['产业'])):
    pairs = unique_pairs(category_rules.get(category, []))
    chain_names = []
    for chain, _ in pairs:
        if chain not in chain_names:
            chain_names.append(chain)
    rule_rows.append(
        {
            '产业字段': category,
            '规则类型': '分类规则' if pairs else '无直接分类规则',
            '关联标准产业链': '；'.join(chain_names),
            '关联节点数': len(pairs),
            '说明': '；'.join(
                [
                    '按宽口径将该园区分类关联到相关链的节点层' if pairs else '仅依赖园区名称关键词；未命中则保留待人工研判',
                    '名称关键词命中时会叠加原始方向到节点的精确映射',
                ]
            ),
        }
    )
rules = pd.DataFrame(rule_rows)

master_cols = [
    'park_row_id', 'source_row_number', '级别', '产业', '产业园名称', '链接', '简介', '位置', '经度', '纬度', '省份', '城市', '区县',
    'match_status', 'match_scope', 'match_confidence', 'matched_standard_chains', 'matched_node_ids', 'matched_nodes', 'match_count',
    'name_keyword_hits', 'match_reason',
]
master = master[master_cols]

master.to_csv(OUT / 'park_master_with_chain_match.csv', index=False, encoding='utf-8-sig')
compact_cols = [
    'park_row_id', 'source_row_number', '级别', '产业', '产业园名称', '链接', '位置', '经度', '纬度', '省份', '城市', '区县',
    'match_status', 'match_scope', 'match_confidence', 'matched_standard_chains', 'matched_node_ids', 'matched_nodes', 'match_count',
    'name_keyword_hits', 'match_reason',
]
master[compact_cols].to_csv(OUT / 'park_master_mapping_compact.csv', index=False, encoding='utf-8-sig')
details.to_csv(OUT / 'park_chain_node_match_details.csv', index=False, encoding='utf-8-sig')
summary.to_csv(OUT / 'park_chain_node_match_summary.csv', index=False, encoding='utf-8-sig')
rules.to_csv(OUT / 'park_category_match_rules.csv', index=False, encoding='utf-8-sig')

note = {
    'source_xlsx': str(ROOT / '产业园区网_产业园数据.xlsx'),
    'source_dta': str(ROOT / '产业园区网_产业园数据.dta'),
    'source_row_count': int(len(parks)),
    'master_row_count': int(len(master)),
    'detail_row_count': int(len(details)),
    'matched_master_rows': int((master['match_count'] > 0).sum()),
    'unmatched_master_rows': int((master['match_count'] == 0).sum()),
    'distinct_categories': int(master['产业'].nunique()),
    'distinct_standard_chains_in_details': int(details['standard_chain'].replace('', pd.NA).dropna().nunique()),
    'distinct_nodes_in_details': int(details['node_id'].replace('', pd.NA).dropna().nunique()),
    'matching_logic': [
        '产业字段分类规则：将园区数据的产业大类映射到产业链整理结果中的标准链/节点，作为宽口径关联。',
        '园区名称关键词：命中产业链整理结果中的原始方向后，沿 original_to_stage_node_mapping.csv 追溯到标准链和节点。',
        '未命中记录不删除、不强行归类，单独保留为待人工研判。',
        'source_row_number 对应源 XLSX 的 Excel 行号（含表头，因此首条数据为第 2 行）。',
    ],
}
(OUT / 'matching_note.json').write_text(json.dumps(note, ensure_ascii=False, indent=2), encoding='utf-8')

print(json.dumps(note, ensure_ascii=False, indent=2))
print('status_counts')
print(master['match_status'].value_counts(dropna=False).to_string())
print('category_counts')
print(master.groupby(['产业', 'match_status']).size().to_string())
