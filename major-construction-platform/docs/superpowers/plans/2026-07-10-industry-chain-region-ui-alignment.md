# 产业链图谱与区域产业分析 UI 对齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变普通与人工智能产业链数据口径的前提下，将“产业链图谱”“区域产业分析”和 KPI 数据详情弹窗严格还原到 Figma 设计稿，并保持 Vue 与静态入口一致。

**Architecture:** 保留 `src/App.vue` 与 `index.html` 的双入口结构，使用现有计算属性和静态渲染函数提供数据，仅调整展示契约、交互语义和 `src/styles/20-talent.css`。普通与人工智能产业链不合并数据源，而是复用相同的卡片、阶段、地图、排行和弹窗视觉类；所有新增契约先由源码级 Node 测试锁定，再实施最小改动。

**Tech Stack:** Vue 3、TypeScript、Vite、原生 HTML/CSS/JavaScript、Node.js `node:test`。

## Global Constraints

- 仅在 `main` 分支工作，不恢复或重新创建 `codex/ai-industry-chain-unified-view`。
- Figma 文件节点 `3281:11937` 及用户提供的三张截图是唯一视觉基准；区域主画板为 `2764:33068`、尺寸 `1440 × 1322`。
- 普通产业链和人工智能产业链共用视觉结构，但继续使用各自真实数据、统计口径、加载和失败状态。
- 保留矩形树图、桑基图、地图全国/省/市/区县下钻、省份排行联动与静态 `file://` 入口。
- 热力色阶必须使用 `#0A2EC9`、`#173FFB`、`#113FFF`、`#346BFF`、`#5992FF`、`#8BBAFF`、`#B5D6FF`、`#D6EAFF`、`#E7F0FF`。
- 不修改企业源数据、产业节点定义、国标行业映射或区域统计口径。
- 不提交供应商输出、Excel 检查文件、临时预览图、根目录 `node_modules` 或其他用户改动。
- `1440px` 是像素对齐主验收宽度；较窄桌面不得水平溢出或遮挡交互。

---

## File Map

- Create: `tests/industry-research-figma-ui.test.mjs` — 锁定双入口结构、Figma 色阶、弹窗语义和响应式契约。
- Modify: `src/App.vue` — 统一 Vue 页面修饰类、AI/普通 KPI 展示结构与弹窗交互语义。
- Modify: `index.html` — 同步静态入口的页面结构、KPI 与弹窗事件。
- Modify: `src/styles/20-talent.css` — 实现 Figma 尺寸、间距、卡片、阶段标题、地图排行、合作卡片、弹窗和响应式样式。
- Modify: `tests/results-portal.test.mjs` — 扩展现有静态入口和区域页面回归断言。
- Modify: `tests/industry-research-management.test.mjs` — 扩展 Vue 产业链结构和弹窗断言。
- Modify: `tests/ai-industry-chain-dual-entry.test.mjs` — 锁定 AI/普通双分支共用视觉类且数据口径不变。
- Create/Modify: `design-qa.md` — 记录同视口、同状态视觉对比和最终结论。

---

### Task 1: 锁定 Figma 展示契约

**Files:**
- Create: `tests/industry-research-figma-ui.test.mjs`
- Modify: `tests/results-portal.test.mjs:189-225`
- Modify: `tests/industry-research-management.test.mjs:473-510`
- Modify: `tests/ai-industry-chain-dual-entry.test.mjs:97-140`

**Interfaces:**
- Consumes: `src/App.vue`、`index.html`、`src/styles.css` 的源码文本。
- Produces: 共享页面类 `industry-research-figma-board`、KPI 类 `industry-figma-kpi-card`、区域容器 `industry-region-figma-dashboard`、弹窗标题 `national-industry-metric-title` 和九级热力变量契约。

- [ ] **Step 1: 写入失败测试**

创建 `tests/industry-research-figma-ui.test.mjs`：

```js
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const styles = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

const styleBlock = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return styles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

test('industry research chain and region share the Figma board contract', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /industry-research-figma-board/)
    assert.match(source, /industry-figma-kpi-card/)
    assert.match(source, /industry-region-figma-dashboard/)
    assert.match(source, /产业链结构图谱/)
    assert.match(source, /全国企业区域分布/)
    assert.match(source, /省份排名 TOP15/)
  }
})

test('industry metric detail dialog keeps the Figma sections and accessible title', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /national-industry-metric-title/)
    assert.match(source, /aria-modal="true"/)
    assert.match(source, /统计口径/)
    assert.match(source, /关联行业/)
    assert.match(source, /专业建设提示/)
  }
  assert.match(appVue, /@keydown\.esc="closeNationalIndustryMetricDialog"/)
  assert.match(staticHtml, /id="national-industry-metric-title"/)
})

test('regional heatmap uses the nine Figma color stops', () => {
  for (const color of [
    '#0A2EC9', '#173FFB', '#113FFF', '#346BFF', '#5992FF',
    '#8BBAFF', '#B5D6FF', '#D6EAFF', '#E7F0FF'
  ]) assert.match(styles.toUpperCase(), new RegExp(color.toUpperCase()))
  assert.match(styleBlock('.industry-region-figma-dashboard'), /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+320px/)
  assert.match(styleBlock('.industry-region-grid'), /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/)
})

test('Figma KPI cards expose focus and compact desktop layout', () => {
  assert.match(styleBlock('.industry-national-kpis'), /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(styles, /\.industry-figma-kpi-card:hover[\s\S]*\.industry-figma-kpi-card:focus-visible/)
  assert.match(styleBlock('.industry-national-detail-dialog'), /width:\s*min\(720px,\s*calc\(100vw\s*-\s*48px\)\)/)
})
```

在 `tests/results-portal.test.mjs` 中补充：

```js
assert.match(appVue, /industry-research-figma-board/)
assert.match(staticHtml, /industry-research-figma-board/)
assert.match(appVue, /industry-figma-kpi-card/)
assert.match(staticHtml, /industry-figma-kpi-card/)
assert.match(appVue, /industry-region-figma-dashboard/)
assert.match(staticHtml, /industry-region-figma-dashboard/)
```

在 `tests/industry-research-management.test.mjs` 中补充：

```js
assert.match(appVue, /industry-research-figma-board/)
assert.match(appVue, /industry-figma-kpi-card/)
assert.match(appVue, /industry-region-figma-dashboard/)
```

在 `tests/ai-industry-chain-dual-entry.test.mjs` 中补充：

```js
assert.match(app, /industry-research-figma-board/)
assert.match(staticHtml, /industry-research-figma-board/)
assert.match(app, /industry-figma-kpi-card/)
assert.match(staticHtml, /industry-figma-kpi-card/)
assert.match(app, /industry-region-figma-dashboard/)
assert.match(staticHtml, /industry-region-figma-dashboard/)
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
node --test tests/industry-research-figma-ui.test.mjs tests/results-portal.test.mjs tests/industry-research-management.test.mjs tests/ai-industry-chain-dual-entry.test.mjs
```

Expected: FAIL，至少报告缺少 `industry-research-figma-board`、`industry-figma-kpi-card`、`industry-region-figma-dashboard` 和九级 Figma 色阶。

- [ ] **Step 3: 提交测试契约**

```bash
git add major-construction-platform/tests/industry-research-figma-ui.test.mjs major-construction-platform/tests/results-portal.test.mjs major-construction-platform/tests/industry-research-management.test.mjs major-construction-platform/tests/ai-industry-chain-dual-entry.test.mjs
git commit -m "test: lock industry research Figma contract"
```

---

### Task 2: 对齐 Vue 产业链与区域页面结构

**Files:**
- Modify: `src/App.vue:1084`
- Modify: `src/App.vue:1635-1638`
- Modify: `src/App.vue:3073-3078`
- Modify: `src/App.vue:7510-8175`
- Modify: `src/App.vue:10561-10608`
- Test: `tests/industry-research-figma-ui.test.mjs`
- Test: `tests/industry-research-management.test.mjs`
- Test: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: `NATIONAL_INDUSTRY_CHAIN_METRICS.summaryMetrics`、`aiIndustryChainData`、`aiIndustryKeyCityCount`、现有地图和桑基图计算属性。
- Produces: `industry-research-figma-board` 页面修饰类、统一 KPI 基础类、可关闭且可恢复焦点的 `selectedNationalIndustryMetric` 模态状态。

- [ ] **Step 1: 记录 KPI 触发元素并补齐 Escape/焦点恢复**

在 `selectedNationalIndustryMetricLabel` 附近增加：

```ts
const nationalIndustryMetricTrigger = ref<HTMLElement | null>(null)
```

将打开/关闭函数替换为：

```ts
const openNationalIndustryMetricDialog = (label: string, event?: Event) => {
  selectedNationalIndustryMetricLabel.value = label
  nationalIndustryMetricTrigger.value = event?.currentTarget instanceof HTMLElement
    ? event.currentTarget
    : null
}
const closeNationalIndustryMetricDialog = () => {
  selectedNationalIndustryMetricLabel.value = ''
  requestAnimationFrame(() => nationalIndustryMetricTrigger.value?.focus())
}
```

普通 KPI 点击传入事件：

```vue
@click="openNationalIndustryMetricDialog(metric.label, $event)"
```

- [ ] **Step 2: 统一产业链主内容与 KPI 类名**

在产业链主卡增加页面类：

```vue
<section class="research-card industry-layout-card industry-research-figma-board industry-chain-figma-board">
```

普通 KPI 按钮改为：

```vue
<button
  v-for="metric in NATIONAL_INDUSTRY_CHAIN_METRICS.summaryMetrics"
  :key="metric.label"
  type="button"
  class="industry-national-kpi-card industry-figma-kpi-card"
  :aria-label="`查看${metric.label}详情`"
  @click="openNationalIndustryMetricDialog(metric.label, $event)"
>
  <span>{{ metric.label }}</span>
  <strong>{{ metric.value }}</strong>
  <em>{{ metric.note }}</em>
  <i>查看详情</i>
</button>
```

AI KPI 容器保留 `ai-chain-kpis` 以兼容旧样式，同时加入统一视觉类：

```vue
<div class="ai-chain-kpis industry-national-kpis">
  <article class="industry-figma-kpi-card"><span>去重企业</span><strong>{{ formatAiIndustryCount(aiIndustryChainData.meta.companyCount) }}</strong><em>完整企业库</em></article>
  <article class="industry-figma-kpi-card"><span>细分节点</span><strong>{{ aiIndustryChainData.meta.nodeCount }}</strong><em>全部可查询</em></article>
  <article class="industry-figma-kpi-card"><span>标准阶段</span><strong>{{ aiIndustryChainData.meta.stageCount }}</strong><em>上游 / 中游 / 下游</em></article>
  <article class="industry-figma-kpi-card"><span>数据来源</span><strong>{{ aiIndustryChainData.meta.sourceCount }}</strong><em>人工智能 / 视觉 / 语音</em></article>
</div>
```

仅普通国标 KPI 可打开详情；AI KPI 不伪造未提供的国标详情数据。

- [ ] **Step 3: 对齐区域页面语义类**

区域 KPI 改为：

```vue
<section class="demand-kpi-grid industry-kpi-grid industry-region-kpi-grid industry-research-figma-board">
  <article class="industry-figma-kpi-card"><span>覆盖省份</span><strong>{{ isAiIndustryChain ? aiIndustryChainData?.provinces.length ?? 0 : 31 }}</strong><em>全国样本</em></article>
  <article class="industry-figma-kpi-card"><span>企业样本</span><strong>{{ isAiIndustryChain ? formatAiIndustryCount(aiIndustryChainData?.meta.companyCount ?? 0) : '12,680' }}</strong><em>{{ isAiIndustryChain ? '人工智能去重企业' : '智能建造相关企业' }}</em></article>
  <article class="industry-figma-kpi-card"><span>重点城市</span><strong>{{ isAiIndustryChain ? aiIndustryKeyCityCount : 18 }}</strong><em>产业集聚城市</em></article>
</section>
```

地图与排行容器改为：

```vue
<div class="professional-map-dashboard industry-region-map-dashboard industry-region-figma-dashboard">
```

区域合作方向的现有 `industry-region-grid` 数据和循环保持不变。

- [ ] **Step 4: 对齐弹窗语义和键盘关闭**

将遮罩和弹窗头部改为：

```vue
<div
  v-if="selectedNationalIndustryMetric"
  class="dialog-backdrop"
  @click.self="closeNationalIndustryMetricDialog"
  @keydown.esc="closeNationalIndustryMetricDialog"
>
  <section
    class="industry-national-detail-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="national-industry-metric-title"
    tabindex="-1"
  >
    <header class="dialog-header">
      <div>
        <h2 id="national-industry-metric-title">{{ selectedNationalIndustryMetric.label }}</h2>
        <span>GB/T 4754 行业分类</span>
      </div>
      <button type="button" class="dialog-close" aria-label="关闭国标行业指标详情" @click="closeNationalIndustryMetricDialog">×</button>
    </header>
```

弹窗正文继续使用现有动态 `detail.summary`、`basis`、`dimensions`、`industries` 和 `action`。

- [ ] **Step 5: 运行 Vue 契约测试**

Run:

```bash
node --test tests/industry-research-figma-ui.test.mjs tests/industry-research-management.test.mjs tests/ai-industry-chain-dual-entry.test.mjs
```

Expected: 结构和交互断言通过；CSS 色阶和布局断言仍可在 Task 4 前失败。

- [ ] **Step 6: 提交 Vue 结构改动**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/tests/industry-research-figma-ui.test.mjs major-construction-platform/tests/industry-research-management.test.mjs major-construction-platform/tests/ai-industry-chain-dual-entry.test.mjs
git commit -m "feat: align Vue industry research structure"
```

---

### Task 3: 同步静态入口结构与弹窗事件

**Files:**
- Modify: `index.html:2066-2330`
- Modify: `index.html:2890-3110`
- Modify: `index.html:5685-5692`
- Modify: `index.html:6615-6655`
- Test: `tests/industry-research-figma-ui.test.mjs`
- Test: `tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: `staticNationalIndustryChainMetrics`、`staticAiIndustryChainData`、`staticIndustryRegionMapBody()`、`appendStaticDialog()`。
- Produces: 与 Vue 相同的 Figma 类名、带标题关联的静态模态弹窗、Escape 关闭和触发元素焦点恢复。

- [ ] **Step 1: 同步 KPI 与页面类**

静态普通 KPI 模板改为：

```js
`<div class="industry-national-kpis">${staticNationalIndustryChainMetrics.summaryMetrics.map((metric) => `<button type="button" class="industry-national-kpi-card industry-figma-kpi-card" data-static-national-metric="${staticEscapeText(metric.label)}" aria-label="查看${staticEscapeText(metric.label)}详情"><span>${staticEscapeText(metric.label)}</span><strong>${staticEscapeText(metric.value)}</strong><em>${staticEscapeText(metric.note)}</em><i>查看详情</i></button>`).join('')}</div>`
```

产业链主卡增加：

```html
class="research-card industry-layout-card industry-research-figma-board industry-chain-figma-board"
```

AI KPI 的四个 `article` 增加 `industry-figma-kpi-card`，区域 KPI 的三个 `article` 同样增加该类。

- [ ] **Step 2: 同步区域地图类与合作卡片结构**

将静态地图排行外层改为：

```html
<div class="industry-map-layout industry-region-figma-dashboard">
```

确保普通和 AI `staticIndustryRegionMapBody()` 都返回该类，且普通区域合作方向仍使用：

```html
<div class="industry-region-grid">${industryRegionCards.map((item) => `<article><strong>${item.name}</strong><span>${item.field}</span><p>${item.desc}</p></article>`).join('')}</div>
```

- [ ] **Step 3: 补齐静态弹窗标题与焦点恢复**

将弹窗模板头部改为：

```js
return `<section class="industry-national-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="national-industry-metric-title" tabindex="-1"><header class="dialog-header"><div><h2 id="national-industry-metric-title">${staticEscapeText(metric.label)}</h2><span>GB/T 4754 行业分类</span></div><button type="button" class="dialog-close" aria-label="关闭国标行业指标详情" data-close-static-dialog>×</button></header><div class="industry-national-detail-body"><section class="industry-national-detail-hero"><div><span>${staticEscapeText(metric.note)}</span><strong>${staticEscapeText(metric.value)}</strong></div><p>${staticEscapeText(detail.summary || '')}</p></section><section class="portrait-dialog-section"><h3>统计口径</h3><p>${staticEscapeText(detail.basis || '')}</p></section><section class="industry-national-detail-grid" aria-label="关键指标">${dimensions}</section><section class="portrait-dialog-section"><h3>关联行业</h3><div class="industry-national-detail-tags">${industries}</div></section><section class="portrait-dialog-section"><h3>专业建设提示</h3><p>${staticEscapeText(detail.action || '')}</p></section></div></section>`
```

在静态事件状态区增加：

```js
let staticNationalIndustryMetricTrigger = null
```

打开函数保存触发元素：

```js
const showStaticNationalIndustryMetricDialog = (label, trigger = null) => {
  const metric = staticNationalIndustryMetricByLabel(label)
  if (!metric) return
  staticNationalIndustryMetricTrigger = trigger instanceof HTMLElement ? trigger : null
  appendStaticDialog(staticNationalIndustryMetricDialogHtml(metric))
}
```

事件委托传入按钮，并在关闭后恢复焦点：

```js
showStaticNationalIndustryMetricDialog(
  staticNationalMetric.dataset.staticNationalMetric || '',
  staticNationalMetric
)

if (event.key === 'Escape' && document.querySelector('.industry-national-detail-dialog')) {
  document.querySelector('.dialog-backdrop')?.remove()
  staticNationalIndustryMetricTrigger?.focus()
}
```

- [ ] **Step 4: 运行静态入口测试**

Run:

```bash
node --test tests/industry-research-figma-ui.test.mjs tests/results-portal.test.mjs
```

Expected: 双入口类名、弹窗标题、打开函数和静态事件断言通过；CSS 断言仍可在 Task 4 前失败。

- [ ] **Step 5: 提交静态入口改动**

```bash
git add major-construction-platform/index.html major-construction-platform/tests/industry-research-figma-ui.test.mjs major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: align static industry research UI"
```

---

### Task 4: 实现 Figma 视觉参数与响应式布局

**Files:**
- Modify: `src/styles/20-talent.css:796-1370`
- Modify: `src/styles/20-talent.css:1759-1795`
- Modify: `src/styles/20-talent.css:2020-2190`
- Modify: `src/styles/20-talent.css:2458-2515`
- Modify: `src/styles/20-talent.css:5654-5715`
- Test: `tests/industry-research-figma-ui.test.mjs`

**Interfaces:**
- Consumes: Task 2/3 产生的共享类。
- Produces: 1440px Figma 桌面布局、九级热力色阶、四列合作卡、720px 数据详情弹窗和窄桌面回退。

- [ ] **Step 1: 定义 Figma 视觉变量**

在产业调研样式区增加：

```css
.industry-research-figma-board {
  --industry-figma-blue: #346bff;
  --industry-figma-surface: #f4f7ff;
  --industry-figma-card: #ffffff;
  --industry-figma-border: #dce6fb;
  --industry-figma-text: #1f3152;
  --industry-figma-muted: #7786a2;
  border-color: var(--industry-figma-border);
  border-radius: 10px;
  background: var(--industry-figma-surface);
}
```

- [ ] **Step 2: 对齐 KPI、阶段标题和节点卡片**

增加/调整：

```css
.industry-figma-kpi-card {
  position: relative;
  min-height: 112px;
  padding: 18px 20px;
  border: 1px solid #dce6fb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(38, 71, 135, 0.04);
}

.industry-figma-kpi-card:hover,
.industry-figma-kpi-card:focus-visible {
  border-color: #7fa6ff;
  box-shadow: 0 12px 28px rgba(52, 107, 255, 0.14);
  outline: none;
}

.industry-treemap-stage header {
  min-height: 72px;
  padding: 16px 20px;
  border-radius: 10px 28px 28px 10px;
}

.industry-treemap-stage.stage-upstream header { background: #e9f0ff; }
.industry-treemap-stage.stage-midstream header { background: #e4f8f8; }
.industry-treemap-stage.stage-downstream header { background: #f0e9ff; }

.industry-treemap-node {
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(34, 63, 119, 0.04);
}
```

保留现有上中下游色彩区分、节点数量驱动的 `--node-size` 和 AI 搜索/展开逻辑。

- [ ] **Step 3: 对齐弹窗**

```css
.industry-national-detail-dialog {
  width: min(720px, calc(100vw - 48px));
  max-height: calc(100vh - 64px);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(22, 34, 56, 0.28);
}

.industry-national-detail-body { gap: 18px; padding: 20px 24px 26px; }
.industry-national-detail-hero { padding: 18px; border-radius: 10px; background: #f4f7ff; }
.industry-national-detail-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.industry-national-detail-body .portrait-dialog-section:last-child {
  padding: 14px 16px;
  border: 1px solid #cfe0ff;
  border-radius: 10px;
  background: #eef4ff;
}
```

- [ ] **Step 4: 对齐区域地图、排行与九级色阶**

```css
.industry-region-figma-dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
}

.heat-1 { fill: #e7f0ff; }
.heat-2 { fill: #d6eaff; }
.heat-3 { fill: #b5d6ff; }
.heat-4 { fill: #8bbaff; }
.heat-5 { fill: #5992ff; }
.heat-6 { fill: #346bff; }
.heat-7 { fill: #113fff; }
.heat-8 { fill: #173ffb; }
.heat-9 { fill: #0a2ec9; }

.map-scale i {
  background: linear-gradient(180deg,
    #0a2ec9 0%, #173ffb 14%, #113fff 28%, #346bff 42%,
    #5992ff 56%, #8bbaff 70%, #b5d6ff 82%, #d6eaff 92%, #e7f0ff 100%);
}

.province-rank-list { gap: 10px; padding: 16px 18px 20px; }
.province-rank-list div,
.province-rank-list button { grid-template-columns: 52px 1fr 52px; gap: 8px; }
.province-rank-list i { height: 8px; }
```

同时把 Vue 与静态入口的自适应色阶函数输出范围从 `heat-1..heat-5` 扩展为 `heat-1..heat-9`，继续使用现有 `Math.log1p(count) / maxLog`，只将量化级数改为 9：

```ts
return `heat-${Math.min(9, Math.max(1, Math.ceil(ratio * 9)))}`
```

- [ ] **Step 5: 对齐四列区域合作卡**

```css
.industry-region-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.industry-region-grid article {
  min-height: 156px;
  padding: 18px;
  border-radius: 10px;
  background: #fff;
}
```

- [ ] **Step 6: 加入窄桌面回退**

```css
@media (max-width: 1180px) {
  .industry-region-figma-dashboard { grid-template-columns: minmax(0, 1fr) 300px; }
  .industry-region-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 900px) {
  .industry-region-figma-dashboard { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .industry-region-grid { grid-template-columns: 1fr; }
  .industry-national-detail-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 7: 运行 UI 契约与相关回归测试**

Run:

```bash
node --test tests/industry-research-figma-ui.test.mjs tests/results-portal.test.mjs tests/industry-research-management.test.mjs tests/ai-industry-chain-dual-entry.test.mjs tests/research-brief-strip.test.mjs
```

Expected: PASS，且原有对数自适应、下钻、桑基图和 AI 城市 KPI 断言不回退。

- [ ] **Step 8: 提交视觉样式**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/20-talent.css major-construction-platform/tests/industry-research-figma-ui.test.mjs major-construction-platform/tests/results-portal.test.mjs major-construction-platform/tests/industry-research-management.test.mjs major-construction-platform/tests/ai-industry-chain-dual-entry.test.mjs
git commit -m "style: align industry research with Figma"
```

---

### Task 5: 全量验证与视觉 QA

**Files:**
- Create/Modify: `design-qa.md`
- Modify: Task 2-4 中发现视觉差异的对应文件。

**Interfaces:**
- Consumes: 可运行的 Vue 页面、Figma 指定画板和 KPI 弹窗状态。
- Produces: `design-qa.md`，最终一行必须是 `final result: passed`；若无法取得同状态截图，则必须为 `final result: blocked`。

- [ ] **Step 1: 运行完整自动化验证**

Run:

```bash
npm test
./node_modules/.bin/vue-tsc -b
./node_modules/.bin/vite build
```

Expected: 三个命令退出码均为 0。任何失败都记录精确命令和首个关键错误，修复后重新运行失败命令。

- [ ] **Step 2: 启动本地页面**

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

Expected: Vite 在 4173 端口启动；保持进程运行供浏览器检查。

- [ ] **Step 3: 捕获四个同视口状态**

在浏览器设置 `1440 × 1322` 视口，依次捕获：

1. `?view=job-industry&tab=chain` 的矩形树图。
2. 点击“关联国标行业”后的 KPI 详情弹窗。
3. 同页面切换桑基图。
4. `?view=job-industry&tab=region` 的全国区域分布。

分别再切换到人工智能产业链，确认共用视觉类、真实加载状态和 KPI 数值。

- [ ] **Step 4: 写入首轮视觉报告**

`design-qa.md` 使用以下固定结构：

```markdown
# Design QA

## Reference
- Figma file: 智慧专业（原专业决策）
- Root node: 3281:11937
- Region frame: 2764:33068
- Viewport: 1440 × 1322

## States
- Chain treemap: record `pass` or `fail`; use `None` when there is no difference, otherwise list the exact layout, spacing, color, typography, or content mismatch.
- KPI dialog: record `pass` or `fail`; use `None` when there is no difference, otherwise list the exact mismatch.
- Chain sankey: record `pass` or `fail`; use `None` when there is no difference, otherwise list the exact mismatch.
- Region map: record `pass` or `fail`; use `None` when there is no difference, otherwise list the exact mismatch.

## Remaining issues
- P0/P1/P2 issue or `None`

final result: blocked
```

- [ ] **Step 5: 修复 P0/P1/P2 差异并重复截图**

每轮只修改报告中可验证的差异；修复后重新运行相关 Node 测试、重新截图并更新表格。不得用 HTTP 200、构建成功或开发服务器启动代替视觉验证。

- [ ] **Step 6: 完成最终验证**

Run:

```bash
npm test
./node_modules/.bin/vue-tsc -b
./node_modules/.bin/vite build
git diff --check
```

Expected: 全部退出码为 0；`design-qa.md` 最后一行为：

```text
final result: passed
```

- [ ] **Step 7: 提交 QA 修复和报告**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/20-talent.css major-construction-platform/tests/industry-research-figma-ui.test.mjs major-construction-platform/tests/results-portal.test.mjs major-construction-platform/tests/industry-research-management.test.mjs major-construction-platform/tests/ai-industry-chain-dual-entry.test.mjs major-construction-platform/design-qa.md
git commit -m "fix: complete industry research design QA"
```
