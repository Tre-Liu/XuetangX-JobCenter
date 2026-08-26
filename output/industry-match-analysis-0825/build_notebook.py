import json
from pathlib import Path


OUTPUT_PATH = Path("output/industry-match-analysis-0825/产业环节未匹配原因分析_0825.ipynb")


def code(source: str):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in source.strip().splitlines()],
    }


def markdown(source: str):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in source.strip().splitlines()],
    }


notebook = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {"name": "python", "version": "3"},
    },
    "cells": [],
}

notebook["cells"] = [
    markdown(
        """
## tl;dr

- 本次未匹配共 **639** 条，其中 **626 条（98.0%）为 `node_ambiguous`**，同一产业链与环节名称命中了 2 或 3 个候选；主因是匹配自然键不唯一，而不是节点名称缺失。
- 其余 **13 条（2.0%）为 `industry_not_found`**，只涉及 **3611 汽柴油车整车制造**和 **3670 汽车零部件及配件制造**两个有效四位代码；两者都存在于本地参考工作簿的行业小类清单，指向导入端行业字典覆盖/版本不一致。
- 当前结果中没有 `node_not_found`。但由于 8 月 21 日与 8 月 25 日文件的输入行号范围和业务键集合不同，不能直接用 1495→639 断言整体修复率。
- 优先修复顺序：先消除同一产业链内环节自然键的重复候选，再补齐行业代码 3611/3670；修复前继续 dry-run，不直接写库。
"""
    ),
    markdown(
        """
## Context & Methods

### Key Assumptions

- 分析粒度是一条“产业链 × 产业环节 × 国民经济行业小类”的未匹配记录。
- `line` 视为源文件行号；当前 CSV 中一行号只出现一次。
- 对“同名候选为什么有 2～3 个”的物理原因，只能定位到数据库自然键不唯一。若要区分重复导入、不同父路径同名或历史版本并存，还需要候选节点 ID、父节点 ID、层级与状态字段。

本 notebook 对当前 CSV 做完整性、唯一性、失败码一致性、候选数分布、产业链集中度、历史结果重合度和参考工作簿唯一性核查。
"""
    ),
    markdown("## Data\n\n### 1. Load sources"),
    code(
        """
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

CURRENT = Path('/Users/liuhongzhe/Desktop/edu_industry_industrial_map_unmatched_0825.csv')
PREVIOUS = Path('/Users/liuhongzhe/Desktop/edu_industry_industrial_map_unmatched.csv')
REFERENCE = Path('/Users/liuhongzhe/Desktop/19条产业链全量细分环节与国民经济行业小类匹配表（新）.xlsx')

def load_csv(path):
    frame = pd.read_csv(path, dtype=str, encoding='utf-8-sig', keep_default_na=False)
    frame['csv_row'] = range(2, len(frame) + 2)
    frame['line_num'] = pd.to_numeric(frame['line'], errors='coerce')
    frame['node_candidates_num'] = pd.to_numeric(frame['node_candidates'], errors='coerce')
    return frame

current = load_csv(CURRENT)
previous = load_csv(PREVIOUS)
current.head(10)
"""
    ),
    markdown("### 2. Validate grain and completeness"),
    code(
        """
required = ['chain_name','industry_code','industry_name','line','node_candidates','node_name','reason']
profile = pd.DataFrame({
    'metric': [
        'rows', 'chains', 'industry_codes', 'node_names', 'duplicate_full_rows',
        'duplicate_business_keys', 'blank_required_fields', 'unique_line_numbers',
        'min_line', 'max_line'
    ],
    'value': [
        len(current), current.chain_name.nunique(), current.industry_code.nunique(),
        current.node_name.nunique(), current.duplicated(required).sum(),
        current.duplicated(['chain_name','industry_code','industry_name','line','node_name'], keep=False).sum(),
        int(current[['chain_name','industry_code','industry_name','line','node_name','reason']].eq('').sum().sum()),
        current.line_num.nunique(), int(current.line_num.min()), int(current.line_num.max())
    ]
})
profile
"""
    ),
    markdown("## Results\n\n### 3. Failure types and inferred match coverage"),
    code(
        """
reason_counts = current.reason.value_counts().rename_axis('reason').reset_index(name='rows')
reason_counts['share_of_unmatched'] = reason_counts['rows'] / len(current)

# The denominator is inferred from one record per source line and a source range of lines 2..1180.
inferred_total_rows = int(current.line_num.max() - 1)
inferred_matched_rows = inferred_total_rows - len(current)
coverage = pd.DataFrame({
    'status': ['matched (inferred)', 'node_ambiguous', 'industry_not_found'],
    'rows': [inferred_matched_rows,
             int((current.reason == 'node_ambiguous').sum()),
             int((current.reason == 'industry_not_found').sum())]
})
coverage['share_of_inferred_input'] = coverage['rows'] / inferred_total_rows
display(reason_counts)
coverage
"""
    ),
    markdown(
        """
**Interpretation.** 失败几乎全部由环节候选不唯一造成。按 `line=2..1180` 推算的 1179 条输入中，约 540 条已匹配、626 条因环节歧义失败、13 条因行业字典缺失失败。该分母是基于行号的推算，完整成功结果未提供。
"""
    ),
    markdown("### 4. Candidate-count distribution confirms a non-unique node key"),
    code(
        """
ambiguous = current[current.reason == 'node_ambiguous'].copy()
candidate_distribution = ambiguous.node_candidates_num.value_counts().sort_index().rename_axis('candidate_count').reset_index(name='rows')
candidate_distribution['share_of_ambiguous'] = candidate_distribution['rows'] / len(ambiguous)
candidate_distribution
"""
    ),
    code(
        """
assert ambiguous.node_candidates_num.gt(1).all()
assert (current.reason == 'node_not_found').sum() == 0
print('All ambiguous rows have 2–3 candidates; no node_not_found rows are present.')
"""
    ),
    markdown(
        """
**Interpretation.** 257 条命中 2 个候选，369 条命中 3 个候选；没有候选数为 0 的记录。因此名称覆盖不是当前瓶颈，真正瓶颈是“产业链 + 环节名称”没有唯一落到一个节点 ID。
"""
    ),
    markdown("### 5. Concentration by industry chain"),
    code(
        """
chain_summary = pd.crosstab(current.chain_name, current.reason)
for column in ['node_ambiguous', 'industry_not_found']:
    if column not in chain_summary:
        chain_summary[column] = 0
chain_summary['total_unmatched'] = chain_summary.sum(axis=1)
chain_summary = chain_summary.sort_values('total_unmatched', ascending=False).reset_index()
chain_summary.head(10)
"""
    ),
    code(
        """
plot_data = chain_summary.sort_values('total_unmatched').tail(10)
ax = plot_data.plot.barh(
    x='chain_name', y=['node_ambiguous','industry_not_found'], stacked=True,
    figsize=(10, 6), color=['#2563EB', '#F59E0B']
)
ax.set_title('未匹配数量最高的 10 条产业链')
ax.set_xlabel('未匹配记录数')
ax.set_ylabel('')
ax.legend(['环节候选不唯一', '行业小类未找到'], loc='lower right')
plt.tight_layout()
plt.show()
"""
    ),
    markdown(
        """
**Interpretation.** 智能物联与消费电子（109 条）、汽车与智能网联汽车（74 条）、高端装备与智能制造（58 条）、医药生物与医疗健康（50 条）、绿色环保与资源循环（44 条）合计 335 条，占全部失败的 52.4%。修复重复节点时应先从这 5 条产业链开始。
"""
    ),
    markdown("### 6. The 13 industry failures come from only two codes"),
    code(
        """
industry_missing = (
    current[current.reason == 'industry_not_found']
    .groupby(['industry_code','industry_name'])
    .agg(rows=('csv_row','size'), chains=('chain_name','nunique'))
    .reset_index()
    .sort_values('rows', ascending=False)
)
industry_missing
"""
    ),
    code(
        """
reference_industries = pd.read_excel(REFERENCE, sheet_name='引用行业小类', dtype=str, keep_default_na=False)
reference_industries = reference_industries.iloc[:, :2]
reference_industries.columns = ['industry_code','industry_name']
reference_industries[reference_industries.industry_code.isin(['3611','3670'])]
"""
    ),
    markdown(
        """
**Interpretation.** 两个代码均为四位数字，且存在于参考工作簿的行业小类清单；因此问题更像导入服务使用的 `industry_l4` 字典未覆盖/未同步这两个代码，而不是 CSV 中的格式错误。
"""
    ),
    markdown("### 7. Source workbook does not duplicate chain-node names"),
    code(
        """
reference_nodes = pd.read_excel(REFERENCE, sheet_name='节点清单', header=2, dtype=str, keep_default_na=False)
duplicate_reference_nodes = (
    reference_nodes.groupby(['产业链','产业环节'])
    .size().rename('rows').reset_index()
    .query('rows > 1')
)
pd.DataFrame({
    'reference_node_rows': [len(reference_nodes)],
    'unique_chain_node_keys': [reference_nodes[['产业链','产业环节']].drop_duplicates().shape[0]],
    'duplicate_chain_node_groups': [len(duplicate_reference_nodes)]
})
"""
    ),
    markdown(
        """
**Interpretation.** 本地参考工作簿的 1602 个“产业链 + 产业环节”键全部唯一。如果该工作簿仍是新数据库的来源，则 2～3 个候选不是由参考源表的同名重复直接造成，而更可能出现在数据库加载、历史版本共存、层级路径展开或匹配查询未限定有效节点的环节。
"""
    ),
    markdown("### 8. Historical comparison: persistent causes, but different input scope"),
    code(
        """
compare_key = ['chain_name','industry_code','industry_name','node_name']
shared = current.merge(previous, on=compare_key, suffixes=('_current','_previous'))
transition = pd.crosstab(shared.reason_previous, shared.reason_current)
scope = pd.DataFrame({
    'run': ['2026-08-21','2026-08-25'],
    'unmatched_rows': [len(previous), len(current)],
    'min_line': [int(previous.line_num.min()), int(current.line_num.min())],
    'max_line': [int(previous.line_num.max()), int(current.line_num.max())],
    'unique_business_keys': [previous[compare_key].drop_duplicates().shape[0], current[compare_key].drop_duplicates().shape[0]]
})
display(scope)
transition
"""
    ),
    markdown(
        """
**Interpretation.** 两次结果有 349 个相同业务键，其中 336 条仍为 `node_ambiguous`、13 条仍为 `industry_not_found`，说明两类根因持续存在。但两次文件的行号上限分别为 1804 与 1180，当前还有 290 个业务键不在旧失败集内，所以不能把 1495→639 直接当作同口径修复率。
"""
    ),
    markdown("### 9. Representative rows for audit"),
    code(
        """
samples = pd.concat([
    current[current.reason == 'node_ambiguous'].sort_values(['chain_name','line_num']).head(8),
    current[current.reason == 'industry_not_found'].sort_values(['chain_name','line_num']).head(8),
])
samples[['csv_row','line','chain_name','node_name','industry_code','industry_name','node_candidates','reason']]
"""
    ),
    markdown(
        """
## Takeaways

1. **P0：节点唯一性治理。** 用稳定 `node_id` 作为入库主键；至少把候选节点 ID、父路径、层级、状态输出到 unmatched 文件。导入前增加 `(chain_id, normalized_node_name, active_status)` 唯一性或冲突检测。
2. **P0：行业字典补齐。** 核对 `industry_l4` 是否缺少 3611、3670，或是否因版本/有效状态过滤不可见；补齐后回归 13 条失败。
3. **P1：先处理高集中产业链。** 前 5 条产业链贡献 52.4% 的失败，优先检查其重复节点能最快降低失败量。
4. **P1：保持 dry-run。** 当前 626 条存在多候选，不能随意取第一条，否则会把行业关系挂到错误层级或历史节点。
5. **验证口径。** 下一次同时导出总输入行数、成功行数、失败行数及输入版本哈希，避免仅凭 unmatched 文件跨批次比较。
"""
    ),
]

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.write_text(json.dumps(notebook, ensure_ascii=False, indent=1), encoding="utf-8")
print(OUTPUT_PATH.resolve())
