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

## Fix Round 1

### 修复内容

- 生成时间现在要求为规范 UTC ISO 字符串，并以 `Date#toISOString()` 往返比对；JavaScript 会自动归一化的 `2026-02-29` 等语义无效日期会进入“数据已过期”状态。
- 新鲜快照的显式 `overallStatus: 'stale'` 也显示“数据已过期”；基于快照年龄的过期判定仍优先执行。
- `snapshotLoadState` 不再对任意 v1 对象进行强制类型转换。它会有界验证顶部展示字段、六个规范资产 ID，以及安全渲染所需的资产数组字段；不完整数据返回“无法展示数据：快照数据结构不完整”。
- 指标按钮保留带资产标签的 `aria-label`，并经 `aria-describedby` 关联屏幕阅读器描述，覆盖状态、总数、覆盖率、定义、统计粒度和辅助指标。

### RED → GREEN

1. 先添加非闰年归一化时间、显式 stale、v1 缺字段、空资产数组、损坏 v1 告警，以及挂载后的辅助描述回归测试。
2. RED：模型 8 项中 4 项失败（日期被归一化、显式 stale 被忽略、两个 v1 输入被接受）；Vue 6 项中 2 项失败（无 `aria-describedby`、损坏 v1 进入空看板）。
3. GREEN：实现规范 ISO 往返校验、运行时形状守卫和描述关联后，模型 8/8、聚焦 Vue 6/6 通过。

### 最终验证与自审

- `npm run verify` 通过：63 个 Node 数据测试、7 个 Vitest/Vue 测试、快照校验与 `vue-tsc`/Vite 构建全部成功且无警告。
- `git diff --check` 通过。自审确认数据守卫拒绝 `{ schemaVersion: 1 }` 与缺失规范资产集合；无障碍断言检查真实挂载按钮的关联描述，不读取源码文本。
- 仍未实现图表或来源抽屉，符合本轮范围。
