# AI Region KPI Dimensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AI industry chain regional KPI cards use the same province, enterprise sample, and key-city dimensions as the other industry chains.

**Architecture:** Derive the AI key-city count at runtime from the loaded company collection by normalizing non-empty city names and counting distinct values. Implement the same calculation in the Vue entry and the file-compatible static entry, with source-contract tests preventing either entry from reverting to the data-quality KPI or using different city-normalization rules.

**Tech Stack:** Vue 3 computed state, TypeScript, static JavaScript template rendering, Node.js test runner.

## Global Constraints

- The three KPI labels must be `覆盖省份`, `企业样本`, and `重点城市`.
- The key-city value must count distinct normalized non-empty `company.city` values.
- The key-city note must be `产业集聚城市`.
- `地区待补` and `省份字段缺失企业` must not appear in the regional KPI markup.
- Do not change enterprise source data, map distribution, ranking, or drilldown behavior.

---

### Task 1: Lock the cross-entry KPI contract with a failing test

**Files:**
- Modify: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: source strings already loaded as `app` and `staticHtml`.
- Produces: a regression test requiring `aiIndustryKeyCityCount`, `staticAiIndustryKeyCityCount`, and the unified labels in both entry points.

- [ ] **Step 1: Write the failing test**

Append:

```js
test('AI regional KPI cards use the same dimensions in Vue and static entries', () => {
  assert.match(app, /const aiIndustryKeyCityCount\s*=\s*computed/)
  assert.match(staticHtml, /const staticAiIndustryKeyCityCount\s*=\s*\(data\)\s*=>/)

  for (const source of [app, staticHtml]) {
    assert.match(source, />覆盖省份</)
    assert.match(source, />企业样本</)
    assert.match(source, />重点城市</)
    assert.match(source, />产业集聚城市</)
  }

  assert.doesNotMatch(app, /<span v-if="isAiIndustryChain">地区待补<\/span>/)
  assert.doesNotMatch(staticHtml, /<article><span>地区待补<\/span>/)
  assert.doesNotMatch(staticHtml, />覆盖省级地区</)
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: FAIL in `AI regional KPI cards use the same dimensions in Vue and static entries` because the two key-city helpers and unified AI markup do not exist.

### Task 2: Implement distinct key-city metrics in both entries

**Files:**
- Modify: `src/App.vue:1831-1842`
- Modify: `src/App.vue:7900-7904`
- Modify: `index.html:2765-2785`
- Modify: `index.html:2902-2906`

**Interfaces:**
- Consumes: `aiIndustryChainData.value.companies`, `normalizeProvinceName(name)`, `staticNormalizeRegionName(name)`, and `data.companies`.
- Produces: `aiIndustryKeyCityCount: ComputedRef<number>` and `staticAiIndustryKeyCityCount(data): number`.

- [ ] **Step 1: Add the Vue derived count**

Add after `aiIndustryRegionProvinceRankItems`:

```ts
const aiIndustryKeyCityCount = computed(() => new Set(
  (aiIndustryChainData.value?.companies ?? [])
    .map((company) => normalizeRegionName(company.city))
    .filter(Boolean)
).size)
```

- [ ] **Step 2: Unify the Vue KPI markup**

Replace the three articles with:

```vue
<article><span>覆盖省份</span><strong>{{ isAiIndustryChain ? aiIndustryChainData?.provinces.length ?? 0 : 31 }}</strong><em>全国样本</em></article>
<article><span>企业样本</span><strong>{{ isAiIndustryChain ? formatAiIndustryCount(aiIndustryChainData?.meta.companyCount ?? 0) : '12,680' }}</strong><em>{{ isAiIndustryChain ? '人工智能去重企业' : '智能建造相关企业' }}</em></article>
<article><span>重点城市</span><strong>{{ isAiIndustryChain ? aiIndustryKeyCityCount : 18 }}</strong><em>产业集聚城市</em></article>
```

- [ ] **Step 3: Add the static derived count**

Add after `staticNormalizeRegionName`:

```js
const staticAiIndustryKeyCityCount = (data) => new Set(
  (data?.companies || [])
    .map((company) => staticNormalizeRegionName(company.city))
    .filter(Boolean)
).size
```

- [ ] **Step 4: Unify the static KPI markup**

Set `staticAiIndustryRegionSectionHtml` to render:

```js
return `<section class="demand-kpi-grid industry-kpi-grid industry-region-kpi-grid"><article><span>覆盖省份</span><strong>${data.provinces.length}</strong><em>全国样本</em></article><article><span>企业样本</span><strong>${staticAiIndustryFormatCount(data.meta.companyCount)}</strong><em>人工智能去重企业</em></article><article><span>重点城市</span><strong>${staticAiIndustryKeyCityCount(data)}</strong><em>产业集聚城市</em></article></section>${staticAiIndustryRegionMapBody()}`
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit the implementation**

```bash
git add tests/ai-industry-chain-dual-entry.test.mjs src/App.vue index.html
git commit -m "fix: align AI region KPI dimensions"
```

### Task 3: Run full verification

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: completed Task 2 implementation.
- Produces: test, typecheck, production build, and file-build evidence.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run Vue type checking**

Run: `./node_modules/.bin/vue-tsc -b`

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Run the production build**

Run: `./node_modules/.bin/vite build`

Expected: exit code 0 and generated `dist` assets.

- [ ] **Step 4: Run the static file-entry regression tests**

Run: `node --test tests/results-portal.test.mjs tests/ai-industry-chain-dual-entry.test.mjs`

Expected: all tests PASS, including direct-file rendering and the AI regional KPI contract. The repository does not contain a separate `vite.file.config.ts`; direct-file compatibility is maintained by the static `index.html` fallback and its Node tests.

- [ ] **Step 5: Inspect the final diff**

Run: `git diff --check HEAD~1 && git status --short`

Expected: no whitespace errors; only expected verification artifacts, if any, are untracked.
