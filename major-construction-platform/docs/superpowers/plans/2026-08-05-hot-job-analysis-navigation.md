# 热门岗位研判导航改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 隐藏岗位建设中心与全部 AI 助手入口，并将原热门岗位分析弹窗改为“新岗位新技术”后的“热门岗位研判”内嵌页面。

**Architecture:** 在岗位调研页签模型中加入 `analysis` 键值，并将 Vue 的热门岗位内容抽到自管理的 `HotJobAnalysisPage.vue`，由岗位中心内容区直接渲染。静态演示版复用现有热门岗位 HTML 生成逻辑，但改为普通页面函数并接入岗位页签路由；底层岗位建设和分析数据保留，仅移除当前导航入口。

**Tech Stack:** Vue 3、TypeScript、Vite、Node.js `node:test`、单文件静态演示页。

## Global Constraints

- 菜单名称必须为“热门岗位研判”，紧跟“新岗位新技术”。
- 左侧 `NEW` AI 助手、右下角人物助手和建议面板均不渲染。
- “岗位建设中心”整组导航不渲染，但底层实现与数据不删除。
- Vue 主页面与 `index.html` 静态演示版行为一致。
- 保留当前工作区中企业表头改名等既有未提交修改，不覆盖、不纳入本功能提交。

---

### Task 1: 导航模型与隐藏入口

**Files:**
- Modify: `src/mock/job-research.ts`
- Modify: `src/App.vue`
- Modify: `index.html`
- Modify: `tests/decision-center-static.test.mjs`
- Modify: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Produces: `JobResearchTabKey = 'portrait' | 'demand' | 'forecast' | 'analysis'`。
- Produces: `JOB_RESEARCH_TABS` 的末项 `{ key: 'analysis', label: '热门岗位研判' }`。
- Consumes: 现有 `selectJobResearchTab(tabKey)` 和静态版 `[data-research-tab]` 事件路由。

- [ ] **Step 1: 写入失败测试**

在 `decision-center-static.test.mjs` 中把岗位中心导航断言改为：

```js
for (const source of [`${appVue}\n${jobResearchMock}`, staticHtml]) {
  assert.match(source, /新岗位新技术[\s\S]*热门岗位研判/)
}
assert.doesNotMatch(appVue, /v-else-if="item === '岗位建设中心'"/)
assert.doesNotMatch(staticHtml, /data-job-primary="build"/)
```

在 `ai-smart-construction-suggestion.test.mjs` 中新增：

```js
test('AI assistant launchers are hidden in Vue and static fallback', () => {
  for (const source of [appVue, staticHtml]) {
    assert.doesNotMatch(source, /data-ai-dock-toggle/)
    assert.doesNotMatch(source, /class="support-avatar global-ai-assistant"/)
    assert.doesNotMatch(source, /id="ai-suggestion-panel"/)
  }
})
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test tests/decision-center-static.test.mjs tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL，原因包含缺少“热门岗位研判”，且仍存在 `data-ai-dock-toggle`、人物助手和岗位建设导航。

- [ ] **Step 3: 实现最小导航改动**

将 `src/mock/job-research.ts` 的类型与数组更新为：

```ts
export type JobResearchTabKey = 'portrait' | 'demand' | 'forecast' | 'analysis'

export const JOB_RESEARCH_TABS: JobResearchTab[] = [
  { key: 'portrait', label: '岗位画像分析' },
  { key: 'demand', label: '招聘需求趋势' },
  { key: 'forecast', label: '新岗位新技术' },
  { key: 'analysis', label: '热门岗位研判' },
]
```

在 Vue 模板中删除两处助手按钮、建议面板和“岗位建设中心”模板分支；把 `jobSideItems` 收窄为 `['产业调研', '报告生成']`。静态版 `staticDockHtml()` 不输出两个助手按钮，`shellStart()` 不输出 build 导航组，并给 `researchTabs` 追加 `['analysis', '热门岗位研判']`。

- [ ] **Step 4: 运行导航测试并确认通过**

Run: `node --test tests/decision-center-static.test.mjs tests/ai-smart-construction-suggestion.test.mjs`

Expected: 新的隐藏入口与导航顺序断言 PASS；旧弹窗入口断言会在下一任务替换。

- [ ] **Step 5: 提交导航改动**

```bash
git add major-construction-platform/src/mock/job-research.ts major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/tests/decision-center-static.test.mjs major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: add hot job analysis navigation"
```

提交前用 `git diff --cached` 确认不包含既有的企业表头改名行。

---

### Task 2: Vue 内嵌热门岗位研判页

**Files:**
- Create: `src/components/HotJobAnalysisPage.vue`
- Modify: `src/App.vue`
- Modify: `src/styles/90-decision.css`
- Modify: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: `aiHotJobAnalysisAdvice`、`getAiHotJobPage()`、`getAiHotJobAbilityCount()`、`getAiHotJobSuggestionMetrics()`。
- Produces: 无 props 的 `<HotJobAnalysisPage />`，内部持有分页、能力展开、人培方案模拟和分析栏目状态。

- [ ] **Step 1: 写入失败测试**

在测试中读取新组件并将 Vue 断言源设为组合文本：

```js
const hotJobAnalysisPage = await readFile(new URL('../src/components/HotJobAnalysisPage.vue', import.meta.url), 'utf8')
const vueSource = `${appVue}\n${hotJobAnalysisPage}`
```

新增页面承载断言：

```js
test('Vue renders hot-job analysis as an inline research page', () => {
  assert.match(appVue, /currentJobResearchTab === 'analysis'[\s\S]*<HotJobAnalysisPage\s*\/>/)
  assert.match(hotJobAnalysisPage, /class="hot-job-analysis-page"/)
  assert.doesNotMatch(appVue, /class="dialog-backdrop ai-analysis-backdrop"/)
  assert.doesNotMatch(hotJobAnalysisPage, /aria-modal="true"|ai-analysis-close/)
})
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL，原因是组件文件不存在或 App 尚未渲染 `<HotJobAnalysisPage />`。

- [ ] **Step 3: 创建自管理页面组件**

把原弹窗 `ai-analysis-modal-page` 内的完整业务内容移入 `HotJobAnalysisPage.vue`，脚本状态至少包含：

```ts
const activeAiAnalysis = aiHotJobAnalysisAdvice
const activeAiAnalysisTab = ref<'goals' | 'requirements' | 'courses'>('goals')
const activeAiHotJobPage = ref(1)
const aiJobAbilitiesExpanded = ref(false)
const aiTalentPlanAvailable = ref(true)

const reanalyzeAiHotJobs = () => {
  activeAiHotJobPage.value = 1
  aiJobAbilitiesExpanded.value = false
  aiTalentPlanAvailable.value = true
}
```

组件根节点使用：

```vue
<section class="hot-job-analysis-page" aria-label="热门岗位研判">
  <div class="ai-analysis-modal-page">
    <!-- 原热门岗位分析完整内容，不包含遮罩、关闭按钮和弹窗 role -->
  </div>
</section>
```

在 `App.vue` 导入组件，并在岗位调研模板的 portrait/demand/forecast 分支前加入：

```vue
<template v-else-if="currentJobResearchTab === 'analysis'">
  <HotJobAnalysisPage />
</template>
```

删除 App 中仅供弹窗使用的状态、打开/关闭函数、滚动锁定和弹窗模板。

- [ ] **Step 4: 添加页面作用域样式**

在 `90-decision.css` 添加：

```css
.hot-job-analysis-page {
  width: 100%;
  min-width: 0;
}

.hot-job-analysis-page .ai-analysis-modal-page {
  width: 100%;
  min-height: 100%;
  padding: 24px;
  overflow: visible;
  background: transparent;
}
```

- [ ] **Step 5: 运行 Vue 专项测试并确认通过**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: PASS，且原分页、能力、无培养方案与三栏目断言继续覆盖新组件。

- [ ] **Step 6: 提交 Vue 页面改动**

```bash
git add major-construction-platform/src/components/HotJobAnalysisPage.vue major-construction-platform/src/App.vue major-construction-platform/src/styles/90-decision.css major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: embed hot job analysis page"
```

---

### Task 3: 静态演示版页面接入与整体验证

**Files:**
- Modify: `index.html`
- Modify: `tests/ai-smart-construction-suggestion.test.mjs`
- Modify: `tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: 静态热门岗位数据、`staticAiHotJobsHtml(advice)` 与现有 `data-ai-*` 页面内交互。
- Produces: `staticAiAnalysisPageHtml()` 普通页面 HTML；`jobBody('analysis')` 路由结果。

- [ ] **Step 1: 写入失败测试**

新增静态承载断言：

```js
test('static fallback renders hot-job analysis as an inline research page', () => {
  assert.match(staticHtml, /const staticAiAnalysisPageHtml = \(\) =>/)
  assert.match(staticHtml, /tab === 'analysis' \? staticAiAnalysisPageHtml\(\)/)
  assert.match(staticHtml, /class="hot-job-analysis-page"/)
  assert.doesNotMatch(staticHtml, /class="dialog-backdrop ai-analysis-backdrop"/)
  assert.doesNotMatch(staticHtml, /data-ai-analysis-close/)
})
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs tests/results-portal.test.mjs`

Expected: FAIL，原因是静态版仍输出弹窗函数，且 `analysis` 未路由到页面函数。

- [ ] **Step 3: 改造静态页面函数和事件**

将 `staticAiAnalysisModalHtml()` 改为 `staticAiAnalysisPageHtml()`，根节点改为：

```html
<section class="hot-job-analysis-page" aria-label="热门岗位研判">
  <div class="ai-analysis-modal-page">...</div>
</section>
```

删除静态弹窗打开、关闭、遮罩、焦点回退和 body 滚动锁定代码。保留分页、能力展开、人培方案模拟和栏目切换的事件分支，让这些分支更新内嵌页面节点。

岗位页签内容选择改为：

```js
const body = tab === 'demand'
  ? demandHtml()
  : tab === 'forecast'
    ? forecastBody
    : tab === 'analysis'
      ? staticAiAnalysisPageHtml()
      : portraitBody()
```

- [ ] **Step 4: 运行静态专项测试并确认通过**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs tests/results-portal.test.mjs`

Expected: PASS，静态入口隐藏、页签顺序、内容与交互断言全部通过。

- [ ] **Step 5: 运行完整验证**

Run: `npm test`

Expected: 全部 Node 测试 PASS。

Run: `npm run build`

Expected: `vue-tsc`、Vite 构建和 Sites worker 生成均退出码 0。

- [ ] **Step 6: 浏览器人工验收**

启动 `npm run dev`，访问 `index.html?tab=portrait&view=job-research`，依次确认：岗位建设中心不可见；两处助手不可见；“热门岗位研判”位于“新岗位新技术”之后；点击后出现完整内嵌页；分页、能力展开、重新分析和分析栏目切换可用；页面无遮罩、关闭按钮或背景滚动锁定。

- [ ] **Step 7: 提交静态版与最终测试改动**

```bash
git add major-construction-platform/index.html major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: mirror hot job analysis page in static demo"
```

提交前再次检查暂存差异，排除用户既有的企业表头修改行。
