# Task 7 — 顶部栏与六类指标卡报告

## 实现

- 新增显示模型：中文数量/百分比格式化、超过七日或无效生成时间的过期状态、未知快照版本的读者可见错误状态。
- 新增 `DashboardHeader`、原生按钮根元素的 `MetricCard`、以及按快照六项资产渲染的 `DashboardView`。
- 指标卡展示主值、可选分母与覆盖率、状态、定义、统计粒度和辅助指标；点击会保存 `selectedAssetId` 并通过 `openSources` 形成 Task 9 的来源面板接缝。
- `App.vue` 仅注入静态快照。数据测试命令收窄为 `tests/*.test.mjs`，防止 Node 将 Vue/Vitest 测试误作数据测试执行。

## RED → GREEN

1. 先添加模型与 Vue 行为测试；`node --test tests/dashboard-model.test.mjs` 因缺少 `dashboard-model.ts` 失败，`npx vitest run tests/dashboard-summary.test.ts` 因缺少组件失败。
2. 实现最小显示模型和组件后，模型 4/4、聚焦 Vue 测试 6/6 通过。
3. 初次完整验证暴露 `node --test` 自动发现 `.ts` Vue 测试的隔离问题；限定数据测试 glob 后重跑通过。
4. 初次构建发现一个多余 CSS 右花括号；移除后重新完整验证无警告。

## 验证

`npm run verify`（最终）通过：59 个 Node 数据测试、6 个 Vitest/Vue 测试、`refresh:check` 与 `vue-tsc`/Vite 生产构建均成功。

## 变更文件

- `data-governance-dashboard/src/dashboard-model.ts`
- `data-governance-dashboard/src/components/DashboardHeader.vue`
- `data-governance-dashboard/src/components/MetricCard.vue`
- `data-governance-dashboard/src/components/DashboardView.vue`
- `data-governance-dashboard/src/App.vue`
- `data-governance-dashboard/src/styles.css`
- `data-governance-dashboard/tests/dashboard-model.test.mjs`
- `data-governance-dashboard/tests/dashboard-summary.test.ts`
- `data-governance-dashboard/package.json`

## 自审与关注点

- 自审确认：错误状态使用 `role="alert"`，指标卡是 `type="button"`、具备名称和 `aria-pressed` 选择状态；有效快照逐项渲染全部六张卡，过期/无效日期不会误报正常。
- `git diff --check` 通过，最终构建无 CSS 或 TypeScript 警告。
- 有意未实现来源抽屉；本任务只保留选中资产与 `openSources` 接缝，留给 Task 9 扩展。
