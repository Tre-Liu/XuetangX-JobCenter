# Hide Analysis Chain Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the current-industry-chain switcher from the inline 「热门岗位研判」 page without changing any other research page.

**Architecture:** Keep the existing shared research header and gate only the chain-switcher fragment on the `analysis` tab. Apply the same tab-aware conditional in the Vue template and the file-mode static renderer so both application entry points stay equivalent.

**Tech Stack:** Vue 3, TypeScript, static HTML/JavaScript fallback, Node.js test runner

## Global Constraints

- 「热门岗位研判」页面不渲染「当前产业链」标签和产业链按钮。
- 页面标题、简介和分析内容保持不变。
- 其他产业及岗位分析页面继续按原逻辑显示产业链切换栏。
- Vue 入口与直接打开 `index.html` 的静态入口行为一致。
- Use conditional rendering rather than CSS hiding.

---

### Task 1: Gate the shared chain switcher on the analysis tab

**Files:**
- Modify: `src/App.vue:8103-8121`
- Modify: `index.html:4350-4370`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: `currentJobResearchTab: Ref<JobResearchTabKey>` in Vue and the `tab` argument of `researchHtml(tab)` in the static renderer.
- Produces: A research header where the chain switcher exists only when the active research tab is not `analysis`.

- [ ] **Step 1: Write the failing regression test**

Add assertions that require Vue to use `v-if="currentJobResearchTab !== 'analysis'"` on `.research-chain-tabs-wrap` and require the static renderer to derive an empty chain-switcher string for `analysis`:

```js
test('hot-job analysis omits the shared current-industry-chain switcher', () => {
  assert.match(
    appVue,
    /v-if="currentJobResearchTab !== 'analysis'" class="research-chain-tabs-wrap" aria-label="当前产业链"/,
  )
  assert.match(
    staticHtml,
    /const chainTabs = tab === 'analysis' \? '' : staticCurrentIndustryChainTabs\(\)/,
  )
  assert.match(
    staticHtml,
    /<header class="research-title-row"><div><h2>\$\{label\}<\/h2><\/div>\$\{chainTabs\}<\/header>/,
  )
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="hot-job analysis omits" tests/ai-smart-construction-suggestion.test.mjs
```

Expected: FAIL because Vue renders the switcher without the tab guard and the static renderer inserts `staticCurrentIndustryChainTabs()` unconditionally.

- [ ] **Step 3: Implement the minimal Vue conditional**

Change the shared switcher opening tag in `src/App.vue` to:

```vue
<div
  v-if="currentJobResearchTab !== 'analysis'"
  class="research-chain-tabs-wrap"
  aria-label="当前产业链"
>
```

Do not change the title, purpose line, chain button behavior, or `HotJobAnalysisPage`.

- [ ] **Step 4: Implement the equivalent static conditional**

In `researchHtml(tab)`, derive and render the switcher fragment:

```js
const chainTabs = tab === 'analysis' ? '' : staticCurrentIndustryChainTabs()
return shellStart('job', 'research', tab)
  + `<div class="job-research-page"><header class="research-title-row"><div><h2>${label}</h2></div>${chainTabs}</header><p class="research-page-purpose">${purpose}</p>${content}</div>`
  + shellEnd
```

- [ ] **Step 5: Run focused and full verification**

Run:

```bash
node --test --test-name-pattern="hot-job analysis omits" tests/ai-smart-construction-suggestion.test.mjs
npm test
npm run build
git diff --check
```

Expected: focused test passes, all project tests pass with zero failures, production build exits 0, and `git diff --check` exits 0.

- [ ] **Step 6: Browser-check the file-mode page**

Open `index.html?tab=analysis&view=job-research`, then verify:

- The active menu is 「热门岗位研判」.
- No element matching `.research-title-row > .research-chain-tabs-wrap` exists.
- The heading 「热门岗位分析建议」 and existing inline analysis content remain visible.
- Opening another research tab still shows its current-industry-chain switcher.

