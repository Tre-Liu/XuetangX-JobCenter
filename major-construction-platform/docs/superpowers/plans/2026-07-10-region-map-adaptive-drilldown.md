# Region Map Adaptive Drilldown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore and complete offline national-to-province-to-city-to-district drilldown with logarithmic adaptive heat colors in both application entries.

**Architecture:** Keep the current local SVG map assets and aggregate city/district counts from the loaded artificial-intelligence company records. Both the Vue component and standalone HTML renderer maintain the same province/city/district state machine and the same `log1p` five-band heat formula, while each entry renders through its existing mechanism.

**Tech Stack:** Vue 3, TypeScript, standalone JavaScript in `index.html`, local SVG paths, Node test runner.

## Global Constraints

- Both `src/App.vue` and `index.html` must implement the behavior because the primary demo is opened through `file://.../index.html`.
- Do not add a runtime network dependency.
- Do not replace existing uncommitted AI industry-chain work or stage the shared dirty files.
- District-level fallback uses real aggregated cards/rankings where district boundary SVG data is unavailable.
- Heat levels use `Math.log1p` over current-scope nonzero counts and map to `heat-1` through `heat-5`; zero values remain muted.

---

### Task 1: Add dual-entry regression coverage

**Files:**
- Modify: `tests/ai-industry-chain-dual-entry.test.mjs`
- Test: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: source strings loaded by the existing dual-entry test.
- Produces: structural assertions for `adaptiveHeatTone`, three drill state variables, region aggregation, breadcrumb controls, and click handlers.

- [ ] **Step 1: Write the failing tests**

Add these focused contracts:

```js
test('AI regional maps use logarithmic adaptive heat levels in both entries', () => {
  assert.match(app, /const adaptiveHeatTone[\s\S]*?Math\.log1p/)
  assert.match(staticHtml, /const staticAdaptiveHeatTone[\s\S]*?Math\.log1p/)
  assert.match(`${app}\n${staticHtml}`, /对数自适应/)
})

test('AI regional maps expose national province city district drilldown in both entries', () => {
  for (const token of [
    'selectedIndustryMapProvince',
    'selectedIndustryMapCity',
    'selectedIndustryMapDistrict',
    'selectIndustryMapProvince',
    'selectIndustryMapCity',
    'selectIndustryMapDistrict',
    'industry-map-breadcrumb',
  ]) assert.match(app, new RegExp(token))

  for (const token of [
    'staticSelectedIndustryMapProvince',
    'staticSelectedIndustryMapCity',
    'staticSelectedIndustryMapDistrict',
    'data-map-drill-province',
    'data-map-drill-city',
    'data-map-drill-district',
    'data-map-drill-level',
  ]) assert.match(staticHtml, new RegExp(token))
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: FAIL because `Math.log1p`, district state, and the AI drilldown render paths are missing.

### Task 2: Restore and extend the standalone static map

**Files:**
- Modify: `index.html`
- Test: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: `staticAiIndustryChainData.companies`, `staticAiIndustryChainData.provinces`, and `window.staticRegionCityGeoData`.
- Produces: `staticAdaptiveHeatTone(count, counts)`, city/district aggregation helpers, `staticSelectedIndustryMapProvince`, `staticSelectedIndustryMapCity`, `staticSelectedIndustryMapDistrict`, and HTML with the three drill attributes.

- [ ] **Step 1: Implement logarithmic heat calculation**

Create `staticAdaptiveHeatTone(count, counts)` using `Math.log1p`, minimum/maximum normalization, and five heat bands. Replace the current `count / maxMetric` thresholds in the AI province branch.

```js
const staticAdaptiveHeatTone = (count, counts) => {
  if (!(count > 0)) return 'heat-0'
  const maxLog = Math.max(0, ...counts.filter((value) => value > 0).map((value) => Math.log1p(value)))
  if (!maxLog) return 'heat-0'
  const level = Math.min(5, Math.max(1, Math.ceil((Math.log1p(count) / maxLog) * 5)))
  return `heat-${level}`
}
```

- [ ] **Step 2: Implement data-driven region aggregation**

Filter AI companies by normalized province, then aggregate by normalized city; filter again by selected city and aggregate by district. Preserve unknown records under “地区待补充” only in summaries, not as clickable map regions.

```js
const staticAiIndustryCityMetrics = (province) => staticAggregateRegionCounts(
  staticAiIndustryChainData?.companies.filter((company) => staticNormalizeRegionName(company.province) === province) || [],
  'city'
)
const staticAiIndustryDistrictMetrics = (province, city) => staticAggregateRegionCounts(
  staticAiIndustryChainData?.companies.filter((company) => (
    staticNormalizeRegionName(company.province) === province
    && staticNormalizeRegionName(company.city) === city
  )) || [],
  'district'
)
```

- [ ] **Step 3: Restore province clicking and add city/district rendering**

Always emit `data-map-drill-province` for AI province paths and ranking buttons. Render province boundary/city counts after province selection, render district cards after city selection, and add breadcrumb buttons for national/province/city navigation.

- [ ] **Step 4: Extend delegated click handling**

Handle district selection and breadcrumb navigation, resetting all lower levels whenever an upper level changes.

```js
const drillLevel = target.closest('[data-map-drill-level]')?.dataset.mapDrillLevel
if (drillLevel === 'national') {
  staticSelectedIndustryMapProvince = null
  staticSelectedIndustryMapCity = null
  staticSelectedIndustryMapDistrict = null
}
if (drillLevel === 'province') {
  staticSelectedIndustryMapCity = null
  staticSelectedIndustryMapDistrict = null
}
```

- [ ] **Step 5: Run focused test and verify partial GREEN**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: static-entry assertions pass while Vue-entry assertions still fail.

### Task 3: Add the same state machine to Vue

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/20-talent.css` only if existing drilldown classes do not cover Vue controls.
- Test: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: `aiIndustryChainData.value.companies`, `chinaGeoFeatures`, and `window.staticRegionCityGeoData`.
- Produces: `selectedIndustryMapProvince`, `selectedIndustryMapCity`, `selectedIndustryMapDistrict`, `adaptiveHeatTone`, scoped metrics, breadcrumbs, and click handlers used by the regional template.

- [ ] **Step 1: Add Vue drill state and pure aggregation helpers**

Add three refs, normalization helpers, scoped computed city/district arrays, and `adaptiveHeatTone(count, counts)` using the same formula as the static entry.

```ts
const selectedIndustryMapProvince = ref<string | null>(null)
const selectedIndustryMapCity = ref<string | null>(null)
const selectedIndustryMapDistrict = ref<string | null>(null)
const adaptiveHeatTone = (count: number, counts: number[]) => {
  if (!(count > 0)) return 'heat-0'
  const maxLog = Math.max(0, ...counts.filter((value) => value > 0).map((value) => Math.log1p(value)))
  if (!maxLog) return 'heat-0'
  const level = Math.min(5, Math.max(1, Math.ceil((Math.log1p(count) / maxLog) * 5)))
  return `heat-${level}`
}
```

- [ ] **Step 2: Replace linear AI province tones**

Calculate every province tone from the current province count list through `adaptiveHeatTone`.

- [ ] **Step 3: Add conditional national/city/district views**

Make national paths and rankings clickable. When a province is active, use local city boundary paths and city metrics; when a city is active, show district metric cards/rankings and the selected district state.

- [ ] **Step 4: Add breadcrumb navigation and state reset**

Implement national/province/city breadcrumb buttons and clear lower-level state on every upper-level transition and relevant industry-chain change.

```ts
const selectIndustryMapProvince = (province: string) => {
  selectedIndustryMapProvince.value = province
  selectedIndustryMapCity.value = null
  selectedIndustryMapDistrict.value = null
}
const selectIndustryMapCity = (city: string) => {
  selectedIndustryMapCity.value = city
  selectedIndustryMapDistrict.value = null
}
const selectIndustryMapDistrict = (district: string) => {
  selectedIndustryMapDistrict.value = district
}
```

- [ ] **Step 5: Run focused test and verify GREEN**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: all dual-entry drilldown assertions pass.

### Task 4: Verify behavior and guard against regressions

**Files:**
- Verify: `index.html`
- Verify: `src/App.vue`
- Verify: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: completed dual-entry implementation.
- Produces: fresh test, build, and browser evidence.

- [ ] **Step 1: Run all automated tests**

Run: `npm test`

Expected: zero failures.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: exit code 0; pre-existing chunk-size or classic-script warnings may remain non-blocking.

- [ ] **Step 3: Verify the standalone entry in a browser**

Serve the project locally, open the artificial-intelligence regional analysis, click 广东 → 深圳 → 南山区 (or another available district), verify five distinguishable heat levels, then navigate back through the breadcrumb.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check` and inspect only the relevant hunks in `index.html`, `src/App.vue`, the optional CSS file, and the dual-entry test. Do not stage shared dirty source files.
