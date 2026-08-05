# Hide Analysis Page Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the duplicated outer title and description from the static 「热门岗位研判」 page while preserving all other research-page headers.

**Architecture:** Change only the static `researchHtml(tab)` renderer. Derive a `pageChrome` fragment that is empty for `analysis` and contains the existing title, chain switcher, and purpose line for every other job-research tab.

**Tech Stack:** Static HTML/JavaScript fallback, Node.js test runner

## Global Constraints

- 「热门岗位研判」静态页面不渲染外层标题「热门岗位研判」。
- 同一页面不渲染说明文字「综合产业链、招聘与岗位能力数据，研判热门岗位及专业建设方向。」
- 页面直接从「2026版本 / 热门岗位分析建议」分析内容开始。
- 其他岗位分析页面继续保留各自的页面标题、说明和产业链切换栏。
- 不改动分析内容、分页、能力详情和分析栏目交互。
- Use conditional rendering rather than CSS hiding.

---

### Task 1: Gate the static research page chrome on the analysis tab

**Files:**
- Modify: `index.html:4350-4365`
- Test: `tests/results-portal.test.mjs:2490-2570`

**Interfaces:**
- Consumes: the `tab` argument, `label`, `purpose`, and `staticCurrentIndustryChainTabs()` inside `researchHtml(tab)`.
- Produces: `pageChrome: string`, empty for `analysis` and unchanged for all other tabs.

- [ ] **Step 1: Write the failing regression test**

Extend the existing real static-file rendering test with an `analysis` case and assert on the rendered `app.innerHTML`:

```js
const cases = [
  ['portrait', '岗位画像分析', false],
  ['demand', '招聘需求趋势', false],
  ['forecast', '新岗位新技术', false],
  ['analysis', '热门岗位分析建议', true],
]

// After rendering each case through the file:// bootstrap sandbox:
if (isAnalysis) {
  assert.doesNotMatch(app.innerHTML, /<h2>热门岗位研判<\/h2>/)
  assert.doesNotMatch(app.innerHTML, /综合产业链、招聘与岗位能力数据，研判热门岗位及专业建设方向。/)
  assert.doesNotMatch(app.innerHTML, /class="research-page-purpose"/)
} else {
  assert.match(app.innerHTML, new RegExp(`<h2>${title}<\\/h2>`))
  assert.match(app.innerHTML, /class="research-page-purpose"/)
}
```

This executes the real static renderer and catches the production bug if the outer page chrome returns.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="static job analysis deep links" tests/results-portal.test.mjs
```

Expected: FAIL because the static renderer still emits `research-title-row` and `research-page-purpose` for `analysis`.

- [ ] **Step 3: Implement the minimal static conditional**

Replace the current `chainTabs` fragment with:

```js
const pageChrome = tab === 'analysis'
  ? ''
  : `<header class="research-title-row"><div><h2>${label}</h2></div>${staticCurrentIndustryChainTabs()}</header><p class="research-page-purpose">${purpose}</p>`
return shellStart('job', 'research', tab)
  + `<div class="job-research-page">${pageChrome}${content}</div>`
  + shellEnd
```

Do not modify `staticAiAnalysisPageHtml()`, Vue templates, styles, or non-analysis tab behavior.

- [ ] **Step 4: Run focused verification and confirm GREEN**

Run:

```bash
node --test --test-name-pattern="static job analysis deep links" tests/results-portal.test.mjs
```

Expected: PASS with one matching test and zero failures.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all project tests pass with zero failures, production build exits 0, and `git diff --check` exits 0.

- [ ] **Step 6: Verify rendered behavior**

For `index.html?tab=analysis&view=job-research`, confirm from the static renderer contract and available browser surface that:

- No outer `research-title-row` or `research-page-purpose` is present.
- 「热门岗位分析建议」 remains visible.
- A normal tab such as `portrait` still receives `research-title-row`, purpose text, and the chain switcher.
