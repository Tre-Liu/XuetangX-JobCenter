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
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: the `tab` argument, `label`, `purpose`, and `staticCurrentIndustryChainTabs()` inside `researchHtml(tab)`.
- Produces: `pageChrome: string`, empty for `analysis` and unchanged for all other tabs.

- [ ] **Step 1: Write the failing regression test**

Replace the previous chain-switcher-only static assertions with a page-chrome assertion:

```js
test('hot-job analysis omits the shared research page chrome', () => {
  assert.match(
    appVue,
    /const showIndustryResearchChrome = computed\(\(\) =>[\s\S]*currentJobResearchTab\.value !== 'analysis'/,
  )
  assert.match(
    staticHtml,
    /const pageChrome = tab === 'analysis'[\s\S]*\? ''[\s\S]*: `<header class="research-title-row">[\s\S]*<p class="research-page-purpose">\$\{purpose\}<\/p>`/,
  )
  assert.match(
    staticHtml,
    /<div class="job-research-page">\$\{pageChrome\}\$\{content\}<\/div>/,
  )
})
```

This verifies the existing Vue behavior and requires equivalent static behavior without coupling to CSS.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="hot-job analysis omits the shared research page chrome" tests/ai-smart-construction-suggestion.test.mjs
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
node --test --test-name-pattern="hot-job analysis omits the shared research page chrome" tests/ai-smart-construction-suggestion.test.mjs
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

