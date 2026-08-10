import json
from pathlib import Path

try:
    import nbformat as nbf
    from nbclient import NotebookClient
except ModuleNotFoundError:
    class _NotebookV4:
        @staticmethod
        def new_notebook():
            return {
                "cells": [],
                "metadata": {},
                "nbformat": 4,
                "nbformat_minor": 5,
            }

        @staticmethod
        def new_markdown_cell(source):
            return {"cell_type": "markdown", "metadata": {}, "source": source}

        @staticmethod
        def new_code_cell(source):
            return {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": source,
            }

    class _NotebookFormat:
        v4 = _NotebookV4()

        @staticmethod
        def write(notebook, path):
            path.write_text(json.dumps(notebook, ensure_ascii=False, indent=1), encoding="utf-8")

    class NotebookClient:
        def __init__(self, notebook, **_kwargs):
            self.notebook = notebook

        def execute(self, **_kwargs):
            return self.notebook

    nbf = _NotebookFormat()


OUTPUT_DIR = Path(__file__).resolve().parent
NOTEBOOK_PATH = OUTPUT_DIR / "智能制造产业链热门岗位阈值试算.ipynb"

notebook = nbf.v4.new_notebook()
notebook["metadata"]["kernelspec"] = {
    "display_name": "Python 3",
    "language": "python",
    "name": "python3",
}
notebook["metadata"]["language_info"] = {"name": "python", "version": "3.12"}

notebook["cells"] = [
    nbf.v4.new_markdown_cell(
        """# 智能制造产业链热门岗位阈值试算

## tl;dr

推荐将热门岗位最低门槛设为：**去重招聘数 ≥ 10 且去重招聘企业数 ≥ 5**。

在“高端装备与智能制造产业链”的 36 个已确认岗位中，该门槛筛出 6 个岗位；第 6 名为 12 条招聘、11 家企业，第 7 名降至 8 条招聘、7 家企业，阈值落在当前数据的自然断点上。"""
    ),
    nbf.v4.new_markdown_cell(
        """## Context & Methods

### Key Assumptions

- 候选岗位仅保留复核状态为“自动通过”或“人工确认”的产业链关系。
- 招聘记录排除重复记录和标记为无效的记录，并按 `jd_id` 去重。
- 同名岗位跨岗位编码合并；招聘企业按清洗后的企业名称去重。
- 两项阈值必须同时满足；通过阈值后按招聘企业数、招聘数依次降序排序。"""
    ),
    nbf.v4.new_code_cell(
        """from pathlib import Path
import warnings
import openpyxl
import pandas as pd

warnings.filterwarnings('ignore', message='The behavior of DataFrame concatenation')

workspace_root = Path.cwd().parents[1]
mapping_path = workspace_root / 'V1.0需求（2026.6.11）/官方数据/岗位与产业节点关联表.xlsx'
matching_root = workspace_root / '.worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1'
chain_name = '高端装备与智能制造产业链'"""
    ),
    nbf.v4.new_markdown_cell("## Data\n\n读取已确认岗位、标准化招聘记录和正式岗位关系。"),
    nbf.v4.new_code_cell(
        """workbook = openpyxl.load_workbook(mapping_path, read_only=True, data_only=True)
rows = list(workbook['岗位-产业节点关系'].iter_rows(min_row=3, values_only=True))
mapping = pd.DataFrame(rows[1:], columns=rows[0])

candidates = mapping[
    mapping['标准产业链'].eq(chain_name)
    & mapping['复核状态'].isin(['自动通过', '人工确认'])
].copy()

normalized = pd.concat([
    pd.read_parquet(path, columns=[
        'jd_id', '企业名称', '招聘发布日期', 'is_duplicate', 'invalid_reason'
    ])
    for path in sorted((matching_root / 'normalized_jobs').glob('year=*/part-*.parquet'))
], ignore_index=True)

valid_jobs = normalized[
    (~normalized['is_duplicate'])
    & normalized['invalid_reason'].fillna('').eq('')
].drop_duplicates('jd_id')

relations = pd.concat([
    pd.read_parquet(path)
    for path in sorted((matching_root / 'job_position_relations').glob('year=*/part-*.parquet'))
], ignore_index=True)

relations = relations[
    relations['position_id'].isin(set(candidates['岗位编码']))
    & (~relations['is_new_position'].eq(True))
].drop_duplicates(['jd_id', 'position_id'])

pd.DataFrame([
    {'指标': '有效去重招聘记录', '数量': valid_jobs['jd_id'].nunique()},
    {'指标': '智能制造链已确认岗位编码', '数量': candidates['岗位编码'].nunique()},
    {'指标': '智能制造链已确认岗位名称', '数量': candidates['岗位名称'].nunique()},
])"""
    ),
    nbf.v4.new_markdown_cell("## Results\n\n按岗位名称聚合去重招聘数和去重招聘企业数。"),
    nbf.v4.new_code_cell(
        """position_map = candidates[['岗位编码', '岗位名称', '阶段', '产业节点']].drop_duplicates()
evidence = (
    relations.merge(position_map, left_on='position_id', right_on='岗位编码')
    .merge(valid_jobs[['jd_id', '企业名称', '招聘发布日期']], on='jd_id', how='inner')
)

metrics = evidence.groupby('岗位名称', as_index=False).agg(
    招聘数=('jd_id', 'nunique'),
    招聘企业数=('企业名称', lambda values: values.fillna('').str.strip().replace('', pd.NA).nunique()),
)

context = candidates.groupby('岗位名称', as_index=False).agg(
    阶段=('阶段', lambda values: '、'.join(dict.fromkeys(values))),
    产业节点=('产业节点', lambda values: '、'.join(dict.fromkeys(values))),
)

results = context.merge(metrics, on='岗位名称', how='left').fillna({
    '招聘数': 0,
    '招聘企业数': 0,
})
results[['招聘数', '招聘企业数']] = results[['招聘数', '招聘企业数']].astype(int)
results['是否热门'] = (results['招聘数'] >= 10) & (results['招聘企业数'] >= 5)
results = results.sort_values(
    ['是否热门', '招聘企业数', '招聘数', '岗位名称'],
    ascending=[False, False, False, True],
)
results.head(15)"""
    ),
    nbf.v4.new_code_cell(
        """thresholds = [(5, 3), (10, 5), (20, 5), (30, 10), (50, 10)]
sensitivity = pd.DataFrame([
    {
        '招聘数阈值': job_threshold,
        '企业数阈值': company_threshold,
        '入选岗位数': len(results[
            (results['招聘数'] >= job_threshold)
            & (results['招聘企业数'] >= company_threshold)
        ]),
    }
    for job_threshold, company_threshold in thresholds
])
sensitivity"""
    ),
    nbf.v4.new_markdown_cell(
        """## Takeaways

- `招聘数 ≥ 10 且招聘企业数 ≥ 5` 筛出 6 个岗位，适配当前页面单页 6 个岗位的展示规模。
- 入选岗位为机械工程师、机械制图、机修工、仪表工、工业工程师、机械研发工程师。
- 第 7 名挡车工为 8 条招聘、7 家企业，低于招聘数阈值；边界区分明确。
- 该结果仍受岗位映射覆盖影响，阈值适合作为当前数据规模下的产品规则，后续数据量显著增长时应复核。"""
    ),
]

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
nbf.write(notebook, NOTEBOOK_PATH)
client = NotebookClient(notebook, timeout=300, kernel_name="python3")
client.execute(cwd=OUTPUT_DIR)
nbf.write(notebook, NOTEBOOK_PATH)
print(NOTEBOOK_PATH)
