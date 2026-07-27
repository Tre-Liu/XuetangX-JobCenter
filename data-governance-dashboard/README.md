# 专业建设数据治理驾驶舱

## 运行前提

- Node.js 24 或更高版本。
- 一个包含下列外部源文件的专业建设数据工作区。干净克隆只包含驾驶舱工程和已发布快照，不包含招聘清单，也不承诺包含这些源 Excel/CSV。

必需源包括：

- `output/industry-chain-standardization/industry_chain_standardization_summary.csv`
- `output/industry-chain-stage-nodes/industry_chain_stage_nodes.csv`
- `V1.0需求（2026.6.11）/官方数据/` 下的产业链分类、精细节点、专业目录、专业匹配、国民经济行业分类和岗位匹配工作簿
- 招聘清单目录 `outputs/recruitment_position_matching/v1/manifests`；若该目录无有效完成清单，则使用 `.worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1/manifests`

## 首次运行

1. `npm install`
2. `npm run refresh`
3. `npm run dev`

以上命令均在 `data-governance-dashboard` 目录执行。默认数据工作区为本工程父目录；从仓库的 linked worktree 运行时，脚本会自动回到对应主工作区读取外部源数据，避免把 worktree 目录误当成数据根目录。

## 数据刷新

默认数据工作区为本工程父目录。其他位置使用：

`npm run refresh -- --workspace-root /absolute/path/to/workspace`

刷新脚本仅在全部源校验通过后替换快照。
`npm run refresh` 和 `npm run refresh:check` 都要求上述外部工作区源可用；不会把大型招聘清单复制进本工程。

## 验证与构建

- `npm test`
- `npm run refresh:check`
- `npm run build`
- `npm run build:single`
- `npm run verify`

`npm run verify` 会依次执行测试、真实数据基线检查、TypeScript 检查、Vite 构建和单 HTML 构建。
因此 `npm run refresh:check` 与 `npm run verify` 均要求上述外部工作区源存在且通过结构校验。

## 单 HTML 离线交付

运行：

```bash
npm run refresh
npm run build:single
```

最终文件为 `dist-single/index.html`。该文件已内嵌页面脚本、样式和当前数据快照，
不依赖本地服务器、CDN 或同目录附属资源，可直接双击离线打开。

源数据变化后，需要重新运行 `npm run refresh` 和 `npm run build:single` 生成最新快照。

## 当前数据边界

招聘处理清单当前覆盖 2014—2016；2017—2025 不计入当前成果。
57 个标准阶段环节与 1,133 个精细产业节点属于不同粒度，不相加。
