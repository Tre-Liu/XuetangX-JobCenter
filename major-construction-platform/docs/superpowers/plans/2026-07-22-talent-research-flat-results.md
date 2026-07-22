# Talent Research Flat Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the suggestion/count clutter and render talent research results as a full-width flat page with a compact reusable search bar.

**Architecture:** Keep the existing `researchHasSearched`/`showResults` state and result data flow. Use that state to emit matching `has-results` and `compact` classes in both Vue and the `file://` renderer, then express the visual transition in the shared CSS without changing filtering or PDF preview behavior.

**Tech Stack:** Vue 3 SFC templates, static JavaScript template strings, CSS, Node.js built-in test runner, Vite.

## Global Constraints

- Remove “猜你想搜”, both suggested keyword buttons, and “已收录 235 篇院校人才培养方案” from both entries.
- Keep the title, description, and main search box before the first search.
- After searching, hide the repeated title/description but keep a compact search bar with the current keyword and action.
- Flatten the results wrapper by removing its outer border, radius, background, shadow, padding, and narrow width constraint.
- Preserve filtering, empty results, vertical scrolling, result selection, PDF preview, and collapse behavior.
- Vue and direct `file://` entry behavior must remain equivalent.

---

### Task 1: State-specific search markup in Vue and `file://`

**Files:**
- Modify: `tests/results-portal.test.mjs:3255-3275`
- Modify: `src/App.vue:3815-3821`
- Modify: `src/App.vue:7151-7169`
- Modify: `index.html:4636-4642`
- Modify: `index.html:6706-6711`

**Interfaces:**
- Consumes: Vue `researchHasSearched: Ref<boolean>` and static `showResults: boolean`.
- Produces: `.talent-research-home.has-results` and `.talent-research-search-card.compact` state hooks in both renderers.
- Preserves: `searchResearchPlans()`, `talentResearchSearchBody(showResults, form)`, `data-research-plan-search`, and current keyword form state.

- [ ] **Step 1: Replace the stale suggestion assertions and add a failing dual-entry state test**

In `tests/results-portal.test.mjs`, remove the assertions that require the two suggested keywords and extend the talent research test with:

```js
test('talent research removes discovery copy and renders state-specific search layouts', () => {
  for (const source of [appSource, staticHtml]) {
    assert.doesNotMatch(source, /猜你想搜/)
    assert.doesNotMatch(source, /已收录 235 篇院校人才培养方案/)
  }

  assert.match(
    appSource,
    /class="talent-research-home"\s*:class="\{ 'has-results': researchHasSearched \}"/
  )
  assert.match(
    appSource,
    /class="talent-research-search-card"\s*:class="\{ compact: researchHasSearched \}"/
  )
  assert.doesNotMatch(appSource, /searchResearchSuggestion/)
  assert.match(staticHtml, /talent-research-home\$\{resultsStateClass\}/)
  assert.match(staticHtml, /talent-research-search-card\$\{searchCardStateClass\}/)
  assert.doesNotMatch(staticHtml, /data-research-suggestion/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern='talent research removes discovery copy' tests/results-portal.test.mjs
```

Expected: FAIL because both entries still contain `猜你想搜`, the count copy, and suggestion handlers.

- [ ] **Step 3: Implement the Vue state-specific markup**

Delete `searchResearchSuggestion()` from `src/App.vue`. Replace the search home opening and search card content with:

```vue
<section
  v-if="!selectedResearchPlan"
  class="talent-research-home"
  :class="{ 'has-results': researchHasSearched }"
>
  <div
    class="talent-research-search-card"
    :class="{ compact: researchHasSearched }"
  >
    <template v-if="!researchHasSearched">
      <h3>人才培养方案调研</h3>
      <p>搜索全国优秀职业院校人培方案，支持按学校、专业和年份快速定位。</p>
    </template>
    <div class="research-master-search">
      <input
        v-model="researchSearchForm.keyword"
        placeholder="输入专业关键词如：智能建造、BIM、装配式建筑"
        @keyup.enter="searchResearchPlans"
      >
      <button type="button" @click="searchResearchPlans">✦ 开始调研</button>
    </div>
  </div>
```

Keep the existing conditional `research-results-panel` immediately after this block.

- [ ] **Step 4: Implement equivalent static renderer markup**

Inside `talentResearchSearchBody()` in `index.html`, add state fragments before the return:

```js
const resultsStateClass = showResults ? ' has-results' : ''
const searchCardStateClass = showResults ? ' compact' : ''
const searchIntro = showResults
  ? ''
  : '<h3>人才培养方案调研</h3><p>搜索全国优秀职业院校人培方案，支持按学校、专业和年份快速定位。</p>'
```

Use those fragments in the returned search shell and remove suggestion/count markup:

```js
return `<div class="talent-subsystem-page talent-research-page"><header class="talent-subsystem-head"><h2>人才培养方案调研</h2></header><section class="talent-research-home${resultsStateClass}"><div class="talent-research-search-card${searchCardStateClass}">${searchIntro}<div class="research-master-search"><input data-research-keyword placeholder="输入专业关键词如：智能建造、BIM、装配式建筑" value="${safeResearchValue(form.keyword || '')}"><button data-research-plan-search>✦ 开始调研</button></div></div>${showResults ? `<section class="research-results-panel"><div class="research-results-head"><div><h3>搜索结果</h3><span>共找到 ${results.length} 个人才培养方案</span></div><button data-research-results-collapse>收起结果</button></div><div class="research-result-list">${resultBody}</div></section>` : ''}</section></div>`
```

Simplify the delegated search click handler to remove the orphaned suggestion branch:

```js
if (target.closest('[data-research-plan-search]')) {
  lastResearchSearchForm = readResearchSearchForm()
  app.innerHTML = talentResearchHtml(true, '', lastResearchSearchForm)
  resetStaticResearchScroll()
  return
}
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern='talent research' tests/results-portal.test.mjs
```

Expected: all matched talent research tests PASS.

- [ ] **Step 6: Commit the state markup change**

```bash
git add src/App.vue index.html tests/results-portal.test.mjs
git commit -m "feat: simplify talent research search states"
```

---

### Task 2: Full-width flat results styling and browser verification

**Files:**
- Modify: `tests/results-portal.test.mjs:3277-3284`
- Modify: `src/styles/50-dialogs.css:1677-1692`
- Modify: `src/styles/60-portrait.css:1-32`
- Modify: `src/styles/60-portrait.css:90-97`

**Interfaces:**
- Consumes: `.has-results` and `.compact` hooks produced by Task 1.
- Produces: a bounded, full-width search/results layout while retaining `.talent-research-page { overflow: auto; }`.
- Preserves: `.research-result-card` internal presentation and all PDF preview styles.

- [ ] **Step 1: Add a failing CSS contract test for the flat layout**

Add to `tests/results-portal.test.mjs`:

```js
test('talent research results use a compact full-width flat layout', () => {
  const searchedHomeStyles = styleBlock('.talent-research-home.has-results')
  const compactSearchStyles = styleBlock('.talent-research-search-card.compact')
  const compactMasterSearchStyles = styleBlock(
    '.talent-research-search-card.compact .research-master-search'
  )
  const resultsPanelStyles = styleBlock('.research-results-panel')

  assert.match(searchedHomeStyles, /justify-items:\s*stretch/)
  assert.match(compactSearchStyles, /width:\s*100%/)
  assert.match(compactMasterSearchStyles, /box-shadow:\s*none/)
  assert.match(resultsPanelStyles, /width:\s*100%/)
  assert.match(resultsPanelStyles, /padding:\s*0/)
  assert.match(resultsPanelStyles, /border:\s*0/)
  assert.match(resultsPanelStyles, /border-radius:\s*0/)
  assert.match(resultsPanelStyles, /background:\s*transparent/)
  assert.match(resultsPanelStyles, /box-shadow:\s*none/)
})
```

- [ ] **Step 2: Run the CSS contract test and verify RED**

Run:

```bash
node --test --test-name-pattern='compact full-width flat layout' tests/results-portal.test.mjs
```

Expected: FAIL because the state selectors do not exist and `.research-results-panel` still has card styling.

- [ ] **Step 3: Add searched-state layout rules**

Add after the existing search card rules in `src/styles/50-dialogs.css`:

```css
.talent-research-home.has-results {
  min-height: 0;
  align-content: start;
  justify-items: stretch;
  gap: 24px;
  padding: 28px 36px 70px;
}

.talent-research-search-card.compact {
  width: 100%;
  max-width: none;
  text-align: left;
}
```

- [ ] **Step 4: Compact the searched-state toolbar and flatten the results wrapper**

Add the compact toolbar overrides after `.research-master-search button` in `src/styles/60-portrait.css`:

```css
.talent-research-search-card.compact .research-master-search {
  height: 54px;
  padding: 6px 8px 6px 18px;
  border-radius: 10px;
  box-shadow: none;
}

.talent-research-search-card.compact .research-master-search input {
  font-size: 16px;
}

.talent-research-search-card.compact .research-master-search button {
  height: 42px;
}
```

Replace `.research-results-panel` with:

```css
.research-results-panel {
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern='talent research|talent subsystem pages stay constrained' tests/results-portal.test.mjs
```

Expected: all matched tests PASS.

- [ ] **Step 6: Verify direct-file browser behavior**

Open `index.html` through Playwright using the system Chrome, select `人才方案管理` → `人才培养方案调研`, search once, and inspect the result page. Verify all of the following in the browser DOM:

```text
“猜你想搜” count: 0
“已收录 235 篇” count: 0
.talent-research-search-card.compact count: 1
.research-results-panel computed width equals its available parent width
.research-results-panel computed border width is 0px
.research-results-panel computed box shadow is none
.talent-research-page scrollTop increases after a downward wheel gesture
clicking the first .research-result-card opens .research-preview-page
```

- [ ] **Step 7: Run full verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: 0 test failures, build exit code 0, and no whitespace errors. Existing Vite large-chunk and classic-script warnings may remain; no new warning is acceptable.

- [ ] **Step 8: Commit the flat layout**

```bash
git add src/styles/50-dialogs.css src/styles/60-portrait.css tests/results-portal.test.mjs
git commit -m "style: flatten talent research results"
```
