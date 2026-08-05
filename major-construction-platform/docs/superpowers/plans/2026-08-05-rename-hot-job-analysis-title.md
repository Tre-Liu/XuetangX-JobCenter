# Rename Hot-Job Analysis Title Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display 「热门岗位研判」 as the central title of the hot-job analysis page in both Vue and static entry points.

**Architecture:** Update the title value in the Vue mock data and its static `index.html` mirror. Protect the Vue data contract with a direct module assertion and the static UI contract through the existing real file-mode rendering sandbox.

**Tech Stack:** TypeScript mock data, static HTML/JavaScript fallback, Node.js test runner

## Global Constraints

- 页面中央主标题从「热门岗位分析建议」改为「热门岗位研判」。
- Vue 入口与静态 `index.html` 入口显示一致。
- 左侧菜单名称继续保持「热门岗位研判」。
- 正文小标题「热门岗位分析」保持不变。
- 不全局替换其他隐藏模块中的同名配置。

---

### Task 1: Rename the active hot-job analysis title

**Files:**
- Modify: `src/mock/decision-center.ts:430-445`
- Modify: `index.html:6025-6035`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`
- Test: `tests/results-portal.test.mjs:2490-2570`

**Interfaces:**
- Consumes: `aiHotJobAnalysisAdvice.title` and the static `aiHotJobAnalysisAdvice.title` mirror.
- Produces: The literal central page heading 「热门岗位研判」 in both rendering paths.

- [ ] **Step 1: Write failing title contract tests**

Add a direct Vue data assertion:

```js
test('hot-job analysis uses the menu name as its page title', async () => {
  const { aiHotJobAnalysisAdvice } = await import('../src/mock/decision-center.ts')
  assert.equal(aiHotJobAnalysisAdvice.title, '热门岗位研判')
})
```

Update the real static rendering case from:

```js
['analysis', '热门岗位分析建议', true]
```

to:

```js
['analysis', '热门岗位研判', true]
```

Inside the `isAnalysis` branch, also require the rendered central heading and reject the old title:

```js
assert.match(app.innerHTML, /class="ai-analysis-modal-title"><h2>热门岗位研判<\/h2>/)
assert.doesNotMatch(app.innerHTML, /热门岗位分析建议/)
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern="hot-job analysis uses the menu name|static job analysis deep links" tests/ai-smart-construction-suggestion.test.mjs tests/results-portal.test.mjs
```

Expected: both title contracts fail because both sources still use 「热门岗位分析建议」.

- [ ] **Step 3: Apply the two minimal title changes**

Change only the active analysis-advice title values:

```ts
title: '热门岗位研判',
```

and:

```js
title: '热门岗位研判',
```

Do not replace other occurrences of 「热门岗位分析建议」 belonging to hidden module configurations.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="hot-job analysis uses the menu name|static job analysis deep links" tests/ai-smart-construction-suggestion.test.mjs tests/results-portal.test.mjs
```

Expected: both matching tests pass with zero failures.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all tests pass, production build exits 0, and the diff check exits 0.

