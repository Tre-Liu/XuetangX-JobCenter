# Job-Training Optimization Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the demo menu and hot-job analysis page from 「热门岗位研判」 to 「岗培优化建议」 across Vue and static entry points.

**Architecture:** Keep the existing `analysis` route and data flow. Update only the user-visible menu label, central title, accessible page label, and their behavior tests in both rendering paths.

**Tech Stack:** Vue 3, TypeScript mock data, static HTML/JavaScript fallback, Node.js test runner

## Global Constraints

- Vue demo 左侧岗位分析菜单名称改为「岗培优化建议」。
- 静态 `index.html` demo 左侧菜单名称同步修改。
- Vue 分析页面中央标题改为「岗培优化建议」。
- 静态分析页面中央标题同步修改。
- 页面路由 key `analysis`、数据结构和交互保持不变。
- 正文小标题「热门岗位分析」以及岗位标签「市场热门岗」「产业代表岗」保持不变。
- 不全局替换其他隐藏模块中的历史配置名称。

---

### Task 1: Rename the active analysis menu and page

**Files:**
- Modify: `src/mock/job-research.ts:112`
- Modify: `src/mock/decision-center.ts:437`
- Modify: `src/components/HotJobAnalysisPage.vue:48`
- Modify: `index.html:1882,6030,6247`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`
- Test: `tests/results-portal.test.mjs:2490-2570`
- Test: `tests/decision-center-static.test.mjs:115-215`

**Interfaces:**
- Consumes: research tab key `analysis` and `aiHotJobAnalysisAdvice.title`.
- Produces: menu label, accessible page name, and central heading 「岗培优化建议」 in Vue and static demos.

- [ ] **Step 1: Update tests first**

Change the Vue title contract to:

```js
assert.equal(aiHotJobAnalysisAdvice.title, '岗培优化建议')
```

Change the static rendered analysis case and central-heading assertion to:

```js
['analysis', '岗培优化建议', true]
assert.match(app.innerHTML, /<header class="ai-analysis-header">[\s\S]*?<h2>岗培优化建议<\/h2>/)
```

Change menu-order expectations to require:

```js
'新岗位新技术',
'岗培优化建议',
```

and verify the order with:

```js
/新岗位新技术[\s\S]*岗培优化建议/
```

Add an accessible-label assertion for the Vue page:

```js
assert.match(hotJobAnalysisPage, /aria-label="岗培优化建议"/)
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test --test-name-pattern="hot-job analysis uses the menu name|static job analysis deep links|job center exposes" tests/ai-smart-construction-suggestion.test.mjs tests/results-portal.test.mjs tests/decision-center-static.test.mjs
```

Expected: failures report the old 「热门岗位研判」 menu, title, or accessible label.

- [ ] **Step 3: Apply minimal production copy changes**

Change only current demo occurrences associated with the `analysis` tab/page:

```ts
{ key: 'analysis', label: '岗培优化建议' }
title: '岗培优化建议'
```

and:

```html
aria-label="岗培优化建议"
```

Apply equivalent static values in `index.html`. Do not change the route key or inner heading 「热门岗位分析」.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same focused command. Expected: all matching tests pass with zero failures.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all tests pass, production build exits 0, and the diff check exits 0.

