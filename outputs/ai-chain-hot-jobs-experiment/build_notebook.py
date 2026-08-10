from pathlib import Path

import nbformat as nbf
from nbclient import NotebookClient


OUTPUT_DIR = Path(__file__).resolve().parent
NOTEBOOK_PATH = OUTPUT_DIR / "人工智能产业链热门岗位试算.ipynb"

notebook = nbf.v4.new_notebook()
notebook["metadata"]["kernelspec"] = {
    "display_name": "Python 3",
    "language": "python",
    "name": "python3",
}
notebook["metadata"]["language_info"] = {"name": "python", "version": "3.12"}

notebook["cells"] = [
    nbf.v4.new_markdown_cell(
        """# 人工智能产业链热门岗位试算

## tl;dr

本试算只使用已确认的“人工智能产业链—产业节点—岗位”关系，以及岗位—招聘 JD 的高置信正式关系。按“去重招聘不少于 20 条、招聘企业不少于 3 家”的最低样本门槛，当前只有 **算法工程师** 入选。

该结果更主要地反映当前岗位映射和招聘匹配覆盖不足，不能直接解释为人工智能产业链只有一个热门岗位。"""
    ),
    nbf.v4.new_markdown_cell(
        """## Context & Methods

### Key Assumptions

- 产业链岗位候选来自 `岗位与产业节点关联表.xlsx`，仅保留复核状态为“自动通过”或“人工确认”的人工智能产业链关系。
- 招聘证据来自 `job_position_relations` 的高置信正式关系；自动聚类新岗位因尚未完成产业链映射，本次不纳入。
- 招聘记录按 `jd_id` 去重，企业按企业名称去重。
- 入选门槛：去重招聘数 ≥ 20 且招聘企业数 ≥ 3。
- 热门度仅用于通过门槛后的排序：招聘数量百分位 55% + 企业数量百分位 25% + 活跃月份百分位 20%。"""
    ),
    nbf.v4.new_code_cell(
        """from pathlib import Path
import sqlite3
import warnings
import openpyxl
import pandas as pd

warnings.filterwarnings('ignore', message='The behavior of DataFrame concatenation')

workspace_root = Path.cwd().parents[1]
mapping_path = workspace_root / 'V1.0需求（2026.6.11）/官方数据/岗位与产业节点关联表.xlsx'
matching_root = workspace_root / '.worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1'

mapping_path, matching_root"""
    ),
    nbf.v4.new_markdown_cell("## Data\n\n读取产业链岗位映射、标准化招聘记录和正式岗位关系，并核对数据规模。"),
    nbf.v4.new_code_cell(
        """workbook = openpyxl.load_workbook(mapping_path, read_only=True, data_only=True)
mapping_rows = list(workbook['岗位-产业节点关系'].iter_rows(min_row=3, values_only=True))
mapping = pd.DataFrame(mapping_rows[1:], columns=mapping_rows[0])

ai_mapping = mapping[
    (mapping['标准产业链'] == '人工智能产业链')
    & mapping['复核状态'].isin(['自动通过', '人工确认'])
].copy()

normalized_files = sorted((matching_root / 'normalized_jobs').glob('year=*/part-*.parquet'))
relation_files = sorted((matching_root / 'job_position_relations').glob('year=*/part-*.parquet'))

normalized = pd.concat([
    pd.read_parquet(path, columns=[
        'jd_id', '企业名称', '招聘发布日期', 'source_year', 'is_duplicate', 'invalid_reason'
    ])
    for path in normalized_files
], ignore_index=True)

relations = pd.concat([pd.read_parquet(path) for path in relation_files], ignore_index=True)

valid_jobs = normalized[
    (~normalized['is_duplicate'])
    & normalized['invalid_reason'].fillna('').eq('')
].drop_duplicates('jd_id')

data_profile = pd.DataFrame([
    {'指标': '输入招聘记录', '数量': len(normalized)},
    {'指标': '有效去重招聘记录', '数量': valid_jobs['jd_id'].nunique()},
    {'指标': '全部正式岗位关系', '数量': len(relations)},
    {'指标': '原有岗位正式关系', '数量': len(relations[~relations['is_new_position'].eq(True)])},
    {'指标': '人工智能产业链已确认候选岗位', '数量': ai_mapping['岗位编码'].nunique()},
])
data_profile"""
    ),
    nbf.v4.new_markdown_cell("## Results\n\n先按岗位 ID 聚合招聘数量、招聘企业数量和活跃月份，再应用最低样本门槛。"),
    nbf.v4.new_code_cell(
        """candidate_ids = set(ai_mapping['岗位编码'])
candidate_relations = relations[
    relations['position_id'].isin(candidate_ids)
    & (~relations['is_new_position'].eq(True))
].drop_duplicates(['jd_id', 'position_id'])

candidate_context = ai_mapping.groupby(['岗位编码', '岗位名称'], as_index=False).agg(
    阶段=('阶段', lambda values: '、'.join(dict.fromkeys(values))),
    产业节点=('产业节点', lambda values: '、'.join(dict.fromkeys(values))),
    产业映射最高分=('相关度分数', 'max'),
    产业映射最高置信度=('置信度', lambda values: '高' if '高' in set(values) else '中'),
)

connection = sqlite3.connect(':memory:')
candidate_context.to_sql('ai_candidates', connection, index=False)
candidate_relations[[
    'jd_id', 'position_id', 'position_name', 'match_score'
]].to_sql('formal_relations', connection, index=False)
valid_jobs[[
    'jd_id', '企业名称', '招聘发布日期'
]].to_sql('valid_jobs', connection, index=False)

HOT_JOB_SQL = '''
SELECT
  c.岗位编码,
  c.岗位名称,
  c.阶段,
  c.产业节点,
  c.产业映射最高分,
  c.产业映射最高置信度,
  COUNT(DISTINCT r.jd_id) AS 去重招聘数,
  COUNT(DISTINCT NULLIF(TRIM(v.企业名称), '')) AS 招聘企业数,
  COUNT(DISTINCT CASE
    WHEN LENGTH(v.招聘发布日期) >= 7 THEN SUBSTR(v.招聘发布日期, 1, 7)
  END) AS 活跃月份数,
  AVG(r.match_score) AS 平均匹配分
FROM ai_candidates c
LEFT JOIN formal_relations r ON r.position_id = c.岗位编码
LEFT JOIN valid_jobs v ON v.jd_id = r.jd_id
GROUP BY
  c.岗位编码, c.岗位名称, c.阶段, c.产业节点,
  c.产业映射最高分, c.产业映射最高置信度
'''

results = pd.read_sql_query(HOT_JOB_SQL, connection)

for column in ['去重招聘数', '招聘企业数', '活跃月份数']:
    results[column] = results[column].fillna(0).astype(int)

for column in ['去重招聘数', '招聘企业数', '活跃月份数']:
    positive = results[column] > 0
    results[f'{column}百分位'] = 0.0
    results.loc[positive, f'{column}百分位'] = (
        results.loc[positive, column].rank(method='max', pct=True) * 100
    )

results['热门度'] = (
    results['去重招聘数百分位'] * 0.55
    + results['招聘企业数百分位'] * 0.25
    + results['活跃月份数百分位'] * 0.20
).round(1)
results['是否入选'] = (results['去重招聘数'] >= 20) & (results['招聘企业数'] >= 3)
results['结论'] = results['是否入选'].map({True: '入选', False: '样本不足'})

display_columns = [
    '岗位编码', '岗位名称', '阶段', '产业节点', '去重招聘数', '招聘企业数',
    '活跃月份数', '热门度', '结论'
]
results.sort_values(['是否入选', '热门度', '去重招聘数'], ascending=False)[display_columns]"""
    ),
    nbf.v4.new_code_cell(
        """selected = results[results['是否入选']].sort_values('热门度', ascending=False)
coverage = pd.DataFrame([
    {'检查项': '候选岗位中有正式招聘关系', '结果': f\"{(results['去重招聘数'] > 0).sum()}/{len(results)}\", '覆盖率': (results['去重招聘数'] > 0).mean()},
    {'检查项': '候选岗位通过最低样本门槛', '结果': f\"{len(selected)}/{len(results)}\", '覆盖率': len(selected) / len(results)},
    {'检查项': '有效招聘进入原有岗位正式关系', '结果': f\"{relations.loc[~relations['is_new_position'].eq(True), 'jd_id'].nunique()}/{valid_jobs['jd_id'].nunique()}\", '覆盖率': relations.loc[~relations['is_new_position'].eq(True), 'jd_id'].nunique() / valid_jobs['jd_id'].nunique()},
])
coverage"""
    ),
    nbf.v4.new_markdown_cell(
        """## Sensitivity Test: 六岗位展示规则

为避免绝对门槛在低覆盖数据下只留下一个岗位，测试“正式关系优先 + 中置信首选候选半权重 + 产业链阶段覆盖”的固定 Top 6 规则。中置信数据只作为候选信号，并在结果中明确标记为待复核。"""
    ),
    nbf.v4.new_code_cell(
        """medium_files = sorted((matching_root / 'review_medium').glob('year=*/part-*.parquet'))
medium = pd.concat([pd.read_parquet(path) for path in medium_files], ignore_index=True)
medium_ai = medium[
    medium['position_id'].isin(candidate_ids)
    & medium['candidate_rank'].eq(1)
].drop_duplicates(['jd_id', 'position_id'])

formal_by_name = results.groupby('岗位名称', as_index=False)['去重招聘数'].sum()
medium_by_name = medium_ai.groupby('position_name', as_index=False).agg(
    待复核招聘数=('jd_id', 'nunique')
).rename(columns={'position_name': '岗位名称'})
mapping_by_name = ai_mapping.groupby('岗位名称', as_index=False).agg(
    阶段=('阶段', lambda values: '、'.join(dict.fromkeys(values))),
    产业节点=('产业节点', lambda values: '、'.join(dict.fromkeys(values))),
    产业映射最高分=('相关度分数', 'max'),
)

sensitivity = mapping_by_name.merge(formal_by_name, on='岗位名称', how='left').merge(
    medium_by_name, on='岗位名称', how='left'
).fillna({'去重招聘数': 0, '待复核招聘数': 0})
sensitivity[['去重招聘数', '待复核招聘数']] = sensitivity[[
    '去重招聘数', '待复核招聘数'
]].astype(int)
sensitivity['加权招聘证据'] = (
    sensitivity['去重招聘数'] + sensitivity['待复核招聘数'] * 0.5
)

evidence_top = sensitivity[sensitivity['加权招聘证据'] > 0].sort_values(
    ['加权招聘证据', '产业映射最高分'], ascending=False
).head(5)
selected_names = set(evidence_top['岗位名称'])
covered_stages = set(evidence_top['阶段'])
stage_fill = sensitivity[
    (~sensitivity['岗位名称'].isin(selected_names))
    & (~sensitivity['阶段'].isin(covered_stages))
].sort_values('产业映射最高分', ascending=False).head(1)

adjusted_selected = pd.concat([evidence_top, stage_fill], ignore_index=True)
adjusted_selected['入选类型'] = adjusted_selected.apply(
    lambda row: '核心热门' if row['去重招聘数'] >= 20
    else ('数据候选' if row['加权招聘证据'] > 0 else '产业代表'),
    axis=1,
)
adjusted_selected[[
    '岗位名称', '阶段', '产业节点', '去重招聘数', '待复核招聘数',
    '加权招聘证据', '产业映射最高分', '入选类型'
]]"""
    ),
    nbf.v4.new_markdown_cell(
        """## Takeaways

- **严格门槛只入选算法工程师，不适合当前页面展示。**
- 调整为固定 Top 6 后，入选岗位为算法工程师、机器视觉工程师、自然语言处理、机器学习工程师、语音识别工程师和智能驾驶工程师。
- 算法工程师标记为“核心热门”；其余有招聘信号的岗位标记为“数据候选”；为补齐下游环节加入的智能驾驶工程师标记为“产业代表”。
- 该分层规则比直接降低绝对门槛更诚实：既增加展示数量，也不会把中置信或零招聘样本包装成已验证热门岗位。"""
    ),
]

nbf.write(notebook, NOTEBOOK_PATH)
client = NotebookClient(notebook, timeout=300, kernel_name="python3")
client.execute(cwd=OUTPUT_DIR)
nbf.write(notebook, NOTEBOOK_PATH)
print(NOTEBOOK_PATH)
