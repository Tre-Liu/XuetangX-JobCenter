# 热门岗位分析版本控件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在热门岗位分析浮窗左上方补充固定显示“2026版本”的版本按钮，并保持 Vue 页面和静态演示版一致。

**Architecture:** 版本入口仅属于展示层，不新增响应式状态、数据结构或点击处理。Vue 模板和静态 HTML 模板分别渲染同一语义结构，独立样式写入决策中心样式文件，以三列头部网格保证标题继续居中。

**Tech Stack:** Vue 3 单文件组件、静态 HTML 模板、CSS、Node.js `node:test`

## Global Constraints

- 控件固定显示“2026版本”和向下箭头。
- 控件使用原生 `button`，并设置 `aria-label="当前分析版本：2026版本"`。
- 本次不提供下拉菜单、历史版本数据或版本切换行为。
- Vue 页面与 `index.html` 静态演示版的标签、类名和布局保持一致。
- 标题保持视觉居中，右上角关闭与“重新分析”操作保持不变。
- 使用热门岗位浮窗独立类名，不修改人才方案版本控件样式。

---

### Task 1: Vue 与静态浮窗版本控件

**Files:**
- Modify: `major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs`
- Modify: `major-construction-platform/src/App.vue:6747-6753`
- Modify: `major-construction-platform/index.html:6265-6274`
- Modify: `major-construction-platform/src/styles/90-decision.css:950-987`

**Interfaces:**
- Consumes: 现有 `.ai-analysis-header` 三列网格和 `staticAiAnalysisModalHtml()` 静态模板。
- Produces: `.ai-analysis-version-select` 按钮和 `.ai-analysis-version-chevron` 箭头；两份页面均提供 `aria-label="当前分析版本：2026版本"`。

- [ ] **Step 1: 写入会失败的版本控件回归测试**

在 `tests/ai-smart-construction-suggestion.test.mjs` 的标题居中测试前加入：

```js
test('hot-job analysis shows the fixed 2026 version control in Vue and static entries', () => {
  for (const source of [appVue, staticHtml]) {
    const modal = source.match(/ai-analysis-modal-page[\s\S]{0,1800}ai-analysis-hot-jobs/)?.[0] || ''
    assert.match(modal, /class="ai-analysis-version-select"/)
    assert.match(modal, /aria-label="当前分析版本：2026版本"/)
    assert.match(modal, />\s*<span>2026版本<\/span>/)
    assert.match(modal, /class="ai-analysis-version-chevron"/)
  }

  assert.match(
    stylesCss,
    /\.ai-analysis-version-select\s*\{[\s\S]*position:\s*absolute;[\s\S]*left:\s*0;/
  )
  assert.match(stylesCss, /\.ai-analysis-version-select:focus-visible\s*\{/)
})
```

该测试用于捕获 Vue 或静态浮窗漏渲染版本按钮、按钮文案或可访问性标签错误，以及按钮不再固定于报告页左上方的回归。

- [ ] **Step 2: 运行测试并确认按预期失败**

Run:

```bash
cd major-construction-platform
node --test tests/ai-smart-construction-suggestion.test.mjs
```

Expected: FAIL，首个新增断言提示未匹配 `class="ai-analysis-version-select"`；其余既有测试保持原结果。

- [ ] **Step 3: 在 Vue 浮窗头部加入固定版本按钮**

将 `src/App.vue` 的 `.ai-analysis-header` 调整为：

```vue
<header class="ai-analysis-header">
  <button
    class="ai-analysis-version-select"
    type="button"
    aria-label="当前分析版本：2026版本"
  >
    <span>2026版本</span>
    <span class="ai-analysis-version-chevron" aria-hidden="true"></span>
  </button>
  <h2>{{ activeAiAnalysis.title }}</h2>
  <div>
    <span>基于 {{ activeAiAnalysis.generatedAt }} 数据的分析结果</span>
    <button type="button" @click="reanalyzeAiHotJobs">重新分析</button>
  </div>
</header>
```

按钮不绑定 `@click`，不增加版本状态。

- [ ] **Step 4: 在静态浮窗模板加入相同版本按钮**

将 `index.html` 中 `staticAiAnalysisModalHtml()` 的头部模板调整为：

```html
<header class="ai-analysis-header"><button class="ai-analysis-version-select" type="button" aria-label="当前分析版本：2026版本"><span>2026版本</span><span class="ai-analysis-version-chevron" aria-hidden="true"></span></button><h2>${staticEscapeText(advice.title)}</h2><div><span>基于 ${staticEscapeText(advice.generatedAt)} 数据的分析结果</span><button type="button" data-reanalyze-hot-jobs>重新分析</button></div></header>
```

不新增 `data-*` 事件标记或委托处理。

- [ ] **Step 5: 增加独立版本控件样式并保持标题居中**

在 `src/styles/90-decision.css` 的 `.ai-analysis-header` 后加入：

```css
.ai-analysis-version-select {
  position: absolute;
  left: 0;
  display: inline-flex;
  width: 148px;
  height: 32px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 5px 12px;
  border: 1px solid rgba(79, 116, 207, 0.12);
  border-radius: 8px;
  color: #526386;
  font-size: 13px;
  line-height: 20px;
  background: rgba(255, 255, 255, 0.28);
}

.ai-analysis-version-chevron {
  width: 6px;
  height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
}

.ai-analysis-version-select:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}
```

并在现有 `.ai-analysis-header` 中加入 `position: relative;`，使按钮以报告头部左边缘定位；不修改 `.talent-version-select`。

- [ ] **Step 6: 运行针对性测试并确认通过**

Run:

```bash
cd major-construction-platform
node --test tests/ai-smart-construction-suggestion.test.mjs
```

Expected: PASS，退出码为 0，新增测试和全部既有热门岗位分析测试均无失败。

- [ ] **Step 7: 运行完整测试与生产构建**

Run:

```bash
cd major-construction-platform
npm test
npm run build
```

Expected: 两条命令均退出码为 0；测试输出无失败，构建生成生产产物且无 TypeScript 或 Vite 错误。

- [ ] **Step 8: 检查差异并提交实现**

Run:

```bash
git diff --check
git diff -- major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/90-decision.css major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git status --short
```

确认只包含版本控件相关修改，保留工作区中用户已有的其他改动。随后执行：

```bash
git add major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/90-decision.css major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs major-construction-platform/docs/superpowers/plans/2026-08-05-hot-job-analysis-version-control.md
git commit -m "feat: add hot job analysis version control"
```

