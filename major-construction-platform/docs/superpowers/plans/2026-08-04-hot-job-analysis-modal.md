# 热门岗位分析建议浮窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接通 AI 助手中的“热门岗位分析建议”入口，使 Vue 页面与静态演示版都以可访问、可关闭、锁定背景滚动的大尺寸浮窗展示现有分析内容。

**Architecture:** 复用现有 `activeAiAnalysisKey`、`aiHotJobAnalysisAdvice`、`staticAiAnalysisModalHtml()` 和浮窗样式，不新增路由或数据层。Vue 版通过响应式状态和元素引用管理焦点及滚动；静态版通过事件委托和专用打开/关闭函数实现同等行为。

**Tech Stack:** Vue 3 Composition API、TypeScript、原生 DOM 事件委托、Node.js `node:test`、Vite。

## Global Constraints

- 只接通“热门岗位分析建议”，其余三个 AI 快捷入口保持现有行为。
- 浮窗在当前页面打开，不跳转独立页面。
- 支持关闭按钮、遮罩空白处和 `Escape` 关闭。
- 浮窗打开时锁定背景滚动，关闭和卸载时恢复。
- Vue 页面与 `index.html` 静态演示版行为一致。
- 不重构分析数据、不新增接口、不修改浮窗报告内容。
- 当前工作区已有用户改动；只修改列出的文件，不覆盖无关差异。

---

### Task 1: Vue 浮窗入口与生命周期

**Files:**
- Modify: `tests/ai-smart-construction-suggestion.test.mjs`
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `activeAiAnalysisKey: Ref<AiSuggestionItem['key'] | ''>`、`activeAiAnalysis`、`aiSuggestionItems`。
- Produces: `openAiSuggestion(key, event?)` 打开 `hot-jobs` 浮窗；`closeAiAnalysisModal()` 统一恢复滚动和焦点；模板的 `@keydown.esc` 处理退出键。

- [ ] **Step 1: 写入 Vue 入口失败测试**

将原“保持无动作”测试拆开，先为 Vue 写出新行为断言：

```js
test('hot-job suggestion opens the Vue analysis modal', () => {
  assert.doesNotMatch(appVue, /if \(key === 'hot-jobs'\) return/)
  assert.match(
    appVue,
    /if \(key === 'hot-jobs'\) \{[\s\S]*activeAiAnalysisKey\.value = 'hot-jobs'[\s\S]*return/
  )
  assert.match(appVue, /@keydown\.esc="closeAiAnalysisModal"/)
  assert.match(appVue, /ref="aiAnalysisCloseRef"/)
  assert.match(appVue, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(appVue, /aiAnalysisReturnFocus[\s\S]*focus\(\{ preventScroll: true \}\)/)
})
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL，原因是 Vue 的 `hot-jobs` 分支仍提前 `return`，且缺少滚动锁定、关闭焦点引用和退出键绑定。

- [ ] **Step 3: 实现 Vue 最小交互闭环**

在 `src/App.vue` 的 AI 助手状态附近加入关闭按钮引用、焦点来源和原始滚动样式：

```ts
const aiAnalysisCloseRef = ref<HTMLButtonElement | null>(null)
let aiAnalysisReturnFocus: HTMLElement | null = null
let aiAnalysisPreviousBodyOverflow = ''
```

把打开和关闭逻辑调整为：

```ts
const closeAiAnalysisModal = () => {
  if (!activeAiAnalysisKey.value) return
  const returnFocus = aiAnalysisReturnFocus
  activeAiAnalysisKey.value = ''
  document.body.style.overflow = aiAnalysisPreviousBodyOverflow
  aiAnalysisReturnFocus = null
  nextTick(() => {
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
  })
}

const openAiSuggestion = (key: AiSuggestionItem['key'], event?: Event) => {
  if (key === 'hot-jobs') {
    aiAnalysisReturnFocus = event?.currentTarget instanceof HTMLElement
      ? event.currentTarget
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    closeAiSuggestionPanel()
    aiAnalysisPreviousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    activeAiAnalysisKey.value = 'hot-jobs'
    nextTick(() => aiAnalysisCloseRef.value?.focus({ preventScroll: true }))
    return
  }
  closeAiSuggestionPanel()
  openDecisionCenter()
  if (key === 'course-cross') {
    selectDecisionPage('governance', 'course-diagnosis')
    activeDecisionCourseTab.value = '课程交叉分析'
    decisionCourseStatus.value = 'result'
  } else if (key === 'plan-diagnosis') {
    selectDecisionPage('governance', 'plan-analysis')
    activeDecisionPlanModeTab.value = '培养方案诊断分析'
  } else if (key === 'plan-compare') {
    selectDecisionPage('governance', 'plan-analysis')
    activeDecisionPlanModeTab.value = '培养方案对比分析'
  }
  persistDecisionState()
}
```

模板入口传入事件，并为浮窗增加退出键、可聚焦关闭按钮与内容点击隔离：

```vue
@click="openAiSuggestion(item.key, $event)"

<div
  v-if="activeAiAnalysis"
  class="dialog-backdrop ai-analysis-backdrop"
  @click.self="closeAiAnalysisModal"
  @keydown.esc="closeAiAnalysisModal"
>
  <section class="ai-analysis-modal" @click.stop>
    <button
      ref="aiAnalysisCloseRef"
      class="ai-analysis-close"
      type="button"
      aria-label="关闭热门岗位分析建议"
      @click="closeAiAnalysisModal"
    >
      ×
    </button>
```

加入卸载清理，避免组件卸载遗留锁定：

```ts
onBeforeUnmount(() => {
  if (activeAiAnalysisKey.value) document.body.style.overflow = aiAnalysisPreviousBodyOverflow
})
```

- [ ] **Step 4: 运行测试并确认 Vue 用例通过**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: Vue 新用例 PASS；静态版新用例尚未加入，不影响本任务验收。

- [ ] **Step 5: 检查 Vue 文件差异**

Run: `git diff --check -- src/App.vue tests/ai-smart-construction-suggestion.test.mjs`

Expected: 无空白错误；差异只包含热门岗位浮窗入口、关闭生命周期和对应测试。

---

### Task 2: 静态演示版浮窗入口与关闭行为

**Files:**
- Modify: `tests/ai-smart-construction-suggestion.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `staticAiAnalysisModalHtml()`、`removeStaticAiPanels()`、`staticAiSuggestionPanelOpen`。
- Produces: `openStaticAiAnalysis(trigger)` 和 `closeStaticAiAnalysis()`；两者管理唯一浮窗、滚动样式和焦点恢复。

- [ ] **Step 1: 写入静态版失败测试**

在测试文件中加入独立静态版用例：

```js
test('hot-job suggestion opens the static analysis modal', () => {
  assert.doesNotMatch(staticHtml, /if \(key === 'hot-jobs'\) return/)
  assert.match(
    staticHtml,
    /if \(key === 'hot-jobs'\) \{[\s\S]*openStaticAiAnalysis\([\s\S]*return/
  )
  assert.match(staticHtml, /app\.insertAdjacentHTML\('beforeend', staticAiAnalysisModalHtml\(\)\)/)
  assert.match(staticHtml, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(staticHtml, /const closeStaticAiAnalysis = \(\) =>/)
  assert.match(staticHtml, /staticAiAnalysisReturnFocus[\s\S]*focus\(\{ preventScroll: true \}\)/)
})
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL，原因是静态版仍对 `hot-jobs` 提前返回，并且没有专用打开/关闭函数。

- [ ] **Step 3: 实现静态版最小交互闭环**

在静态 AI 助手状态附近加入：

```js
let staticAiAnalysisReturnFocus = null
let staticAiAnalysisPreviousBodyOverflow = ''

const closeStaticAiAnalysis = () => {
  const returnFocus = staticAiAnalysisReturnFocus
  app.querySelectorAll('.ai-analysis-backdrop[data-static-ai-layer]').forEach((node) => node.remove())
  document.body.style.overflow = staticAiAnalysisPreviousBodyOverflow
  staticAiAnalysisReturnFocus = null
  requestAnimationFrame(() => {
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
  })
}

const openStaticAiAnalysis = (trigger) => {
  staticAiAnalysisReturnFocus = trigger instanceof HTMLElement
    ? trigger
    : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  staticAiSuggestionPanelOpen = false
  removeStaticAiPanels()
  staticAiAnalysisPreviousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  app.insertAdjacentHTML('beforeend', staticAiAnalysisModalHtml())
  requestAnimationFrame(() => app.querySelector('.ai-analysis-close')?.focus({ preventScroll: true }))
}
```

将 `openStaticAiSuggestion` 改为接收触发元素，并在 `hot-jobs` 分支调用打开函数；事件委托传入建议项元素。关闭按钮、遮罩和 `Escape` 统一调用 `closeStaticAiAnalysis()`。遮罩点击仅在 `target === backdrop` 时关闭，点击 `.ai-analysis-modal` 内容不得关闭。

- [ ] **Step 4: 运行测试并确认静态版用例通过**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: 全部 AI 助手专项测试 PASS。

- [ ] **Step 5: 检查静态版文件差异**

Run: `git diff --check -- index.html tests/ai-smart-construction-suggestion.test.mjs`

Expected: 无空白错误；差异只涉及静态热门岗位浮窗的打开、关闭、滚动和焦点逻辑。

---

### Task 3: 回归、构建与浏览器验收

**Files:**
- Verify: `src/App.vue`
- Verify: `index.html`
- Verify: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: Task 1 和 Task 2 的浮窗交互。
- Produces: 可复现的自动化与浏览器验收证据。

- [ ] **Step 1: 运行相关决策中心与 AI 助手测试**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs tests/decision-center-vue.test.mjs tests/decision-center-static.test.mjs`

Expected: 0 failures。

- [ ] **Step 2: 运行完整测试集**

Run: `npm test`

Expected: 0 failures；若存在与本次无关的既有失败，记录测试名和失败证据，不修改无关模块。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: 退出码 0，Vue TypeScript 检查和 Vite 构建成功。

- [ ] **Step 4: 启动本地页面并进行交互验收**

Run: `npm run dev`

浏览器依次验证：打开 AI 助手、点击“热门岗位分析建议”、确认浮窗覆盖当前页且内部可滚动、点击内容不关闭、遮罩关闭、重新打开后按 `Escape` 关闭、再次打开后点右上角关闭，并确认关闭后焦点返回入口、背景页面恢复滚动。

- [ ] **Step 5: 检查最终范围**

Run: `git diff --check && git status --short && git diff -- src/App.vue index.html tests/ai-smart-construction-suggestion.test.mjs`

Expected: 无空白错误；只报告本次修改文件以及工作区中原有的其他用户改动，不暂存或提交无关文件。
