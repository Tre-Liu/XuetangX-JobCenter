# Industry Chain National Industry Metrics Design

## Scope

Add national-standard industry classification metrics to the "产业链图谱" module in `major-construction-platform`.

The first implementation focuses on four approved dimensions:

- 关联行业总数
- 上中下游行业分布
- 代表企业行业覆盖
- 行业增长信号

The classification basis is GB/T 4754 national economic industry classification. The UI should use Chinese labels and keep the existing industry-chain graph as the primary reading surface.

## Goals

- Help users answer "当前产业链跟多少国标行业有关".
- Show which GB/T 4754 industries appear in upstream, midstream, and downstream stages.
- Explain representative enterprise coverage by national-standard industry category.
- Surface growth signals for related industries using demo-ready metrics that can later connect to recruitment, policy, and enterprise datasets.

## Non-Goals

- Do not add live crawling or external data calls.
- Do not redesign the whole industry research page.
- Do not change the existing industry-chain switch between treemap and sankey.
- Do not introduce multi-chain comparison in this iteration.

## Data Model

Add a mock data structure for national industry classification metrics near the existing industry research mock data.

Recommended fields:

- `summaryMetrics`: KPI cards for related industry count, covered sections, core industries, and growth industries.
- `stageDistributions`: upstream, midstream, downstream mappings to GB/T 4754 section and division names.
- `enterpriseCoverage`: representative enterprise coverage by GB/T 4754 industry category, including share, enterprise count, and sample enterprises.
- `growthSignals`: industry growth indicators covering recruitment heat, policy heat, enterprise activity, and a short interpretation.

Use GB/T 4754-style hierarchy labels:

- 门类: such as `E 建筑业`, `I 信息传输、软件和信息技术服务业`, `M 科学研究和技术服务业`, `C 制造业`.
- 大类: such as `47 房屋建筑业`, `48 土木工程建筑业`, `65 软件和信息技术服务业`, `74 专业技术服务业`.

## UI Design

### Industry Overview KPIs

Place a compact KPI strip under the "产业链结构图谱" card header and before the treemap/sankey content.

Suggested cards:

- 关联国标行业: value such as `12个`
- 覆盖门类: value such as `5类`
- 核心关联行业: value such as `建筑业 / 软件和信息技术服务业`
- 增长行业: value such as `专业技术服务业、专用设备制造业`

### Stage Industry Distribution

In the existing treemap stage headers, add a short line for covered national industries:

- 上游: `C 制造业`、`I 信息传输、软件和信息技术服务业`、`M 科学研究和技术服务业`.
- 中游: `E 建筑业`、`I 信息传输、软件和信息技术服务业`、`M 科学研究和技术服务业`.
- 下游: `E 建筑业`、`N 水利、环境和公共设施管理业`、`M 科学研究和技术服务业`.

Keep this text compact so the existing graph remains readable.

### Enterprise Industry Coverage

Add a new "国标行业关联分析" section under the graph, before or near the existing insight grid.

Show representative enterprise industry coverage with horizontal bars or compact rows:

- Industry label
- Share
- Enterprise count
- Sample enterprises

### Growth Signals

In the same section, add growth signal cards or rows with:

- Industry label
- 招聘热度
- 政策热度
- 企业活跃度
- Short interpretation

Use demo mock values with clear relative meaning, not external-claim wording. Avoid implying real-time statistics unless backed by actual source integration.

## Data Flow

1. Mock data exports national industry metrics.
2. `App.vue` imports or derives display-ready arrays.
3. The "产业链图谱" template renders:
   - KPI strip
   - stage industry labels
   - enterprise coverage rows
   - growth signal rows
4. Existing graph behavior remains unchanged.

## Styling

Follow the existing `20-talent.css` design language:

- 8px card radius
- compact operational layout
- restrained blue, teal, and warm accent usage already present in the page
- no nested cards
- no marketing-style hero copy

Ensure text wraps cleanly on desktop and mobile.

## Testing

Add or update static tests to verify:

- the GB/T 4754 industry metric labels render in the page source or component text
- the four approved dimensions are represented
- existing industry chain view mode labels still exist

Run:

- `npm test`
- `npm run build`

If build warnings are pre-existing Vite chunk or script warnings, report them separately from failures.
