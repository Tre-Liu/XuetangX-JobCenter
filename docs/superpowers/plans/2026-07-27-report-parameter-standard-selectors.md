# Report Parameter Standard Selectors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify report creation parameters, add a GB/T 4754—2017 industry search selector, support mixed city/economic-zone multi-select, and remove the analysis-job limit.

**Architecture:** Keep legacy report metadata for stored-record compatibility, but remove it from the creation UI and validation path. Add one generated GB/T data asset used by both application entries, derive city choices from the existing region geo asset, and centralize search/normalization behavior in small JavaScript utilities that can be tested directly by Node.

**Tech Stack:** Vue 3, TypeScript, static JavaScript template strings, CSS, Node.js test runner, Vite.

## Global Constraints

- Modify both the Vue application and the `file://` static entry.
- Keep the three-step wizard, report title, major, reference files, TOC editor, generation, preview, and legacy report loading.
- Do not display report type, creation mode, or report template in new-report parameter or confirmation UI.
- Use the complete current GB/T 4754—2017 classification: 20 sections, 97 divisions, 473 groups, and 1382 classes.
- Allow mixed city and economic-zone multi-select with no quantity limit.
- Allow any number of analysis jobs, but still require at least one job.
- Add no runtime network dependency.

## File Structure

- Create `major-construction-platform/src/data/gb-t-4754-2017.js`
  - Generated browser asset containing the complete standard classification and source metadata.
- Create `major-construction-platform/src/utils/report-parameter-options.js`
  - Pure search, region-option derivation, selection normalization, and display helpers.
- Create `major-construction-platform/tests/report-parameter-options.test.mjs`
  - Direct behavioral tests for industry and region selection utilities and data completeness.
- Modify `major-construction-platform/src/mock/research-report.ts`
  - Extend report form/record compatibility fields and defaults.
- Modify `major-construction-platform/src/utils/report-generation.js`
  - Normalize new fields, validate retained fields only, and serialize multi-region metadata.
- Modify `major-construction-platform/tests/report-generation.test.mjs`
  - Lock validation, compatibility, and generated-scope behavior.
- Modify `major-construction-platform/src/App.vue`
  - Implement the Vue search selectors, remove obsolete controls, and remove the job cap.
- Modify `major-construction-platform/index.html`
  - Load the generated industry asset and mirror all selector/validation behavior in the static entry.
- Modify `major-construction-platform/src/styles/80-report.css`
  - Style searchable option panels, selection tags, grouped results, and responsive layouts.
- Modify `major-construction-platform/tests/results-portal.test.mjs`
  - Cover Vue/static source contracts and the static behavioral harness.

---

### Task 1: Standard option data and pure selector utilities

**Files:**
- Create: `major-construction-platform/src/data/gb-t-4754-2017.js`
- Create: `major-construction-platform/src/utils/report-parameter-options.js`
- Create: `major-construction-platform/tests/report-parameter-options.test.mjs`

**Interfaces:**
- Consumes: `window.staticRegionCityGeoData` from `src/data/static-region-city-geo.js`.
- Produces:
  - `globalThis.gbT4754IndustryOptions`
  - `globalThis.gbT4754IndustrySource`
  - `REPORT_ECONOMIC_ZONE_OPTIONS`
  - `searchStandardIndustries(options, keyword, limit)`
  - `buildReportRegionOptions(geoData)`
  - `searchReportRegions(options, keyword, selectedIds, limit)`
  - `normalizeReportRegionSelection(form, options)`
  - `formatReportRegionNames(names)`

- [ ] **Step 1: Write failing utility and data-coverage tests**

Create `tests/report-parameter-options.test.mjs` with focused cases:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import {
  REPORT_ECONOMIC_ZONE_OPTIONS,
  buildReportRegionOptions,
  formatReportRegionNames,
  normalizeReportRegionSelection,
  searchReportRegions,
  searchStandardIndustries,
} from '../src/utils/report-parameter-options.js'

test('GB/T 4754 data asset contains every classification level', async () => {
  const source = await readFile(new URL('../src/data/gb-t-4754-2017.js', import.meta.url), 'utf8')
  const context = {}
  vm.runInNewContext(source, context)
  const options = context.gbT4754IndustryOptions
  assert.equal(options.filter((item) => item.level === 'section').length, 20)
  assert.equal(options.filter((item) => item.level === 'division').length, 97)
  assert.equal(options.filter((item) => item.level === 'group').length, 473)
  assert.equal(options.filter((item) => item.level === 'class').length, 1382)
})

test('industry search matches code and name without losing hierarchy', () => {
  const options = [
    { code: 'E', name: '建筑业', level: 'section', parentCode: null },
    { code: '47', name: '房屋建筑业', level: 'division', parentCode: 'E' },
    { code: '4710', name: '住宅房屋建筑', level: 'class', parentCode: '471' },
  ]
  assert.deepEqual(searchStandardIndustries(options, '4710'), [options[2]])
  assert.deepEqual(searchStandardIndustries(options, '建筑'), options)
})

test('region options mix cities and economic zones and deduplicate selections', () => {
  const options = buildReportRegionOptions({
    辽宁: { features: [
      { name: '沈阳市', adcode: 210100 },
      { name: '大连市', adcode: 210200 },
    ] },
  })
  assert.ok(options.some((item) => item.id === 'city:210100' && item.province === '辽宁'))
  assert.ok(options.some((item) => item.id === 'economic-zone:jing-jin-ji'))
  assert.deepEqual(
    normalizeReportRegionSelection(
      { regionIds: ['city:210100', 'city:210100'], regionNames: ['沈阳市', '沈阳市'] },
      options,
    ),
    {
      regionIds: ['city:210100'],
      regionNames: ['沈阳市'],
      region: '沈阳市',
    },
  )
  assert.equal(formatReportRegionNames(['沈阳市', '京津冀']), '沈阳市、京津冀')
  assert.ok(searchReportRegions(options, '辽宁', [], 20).some((item) => item.name === '沈阳市'))
  assert.equal(REPORT_ECONOMIC_ZONE_OPTIONS.length, 8)
})
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd major-construction-platform
node --test tests/report-parameter-options.test.mjs
```

Expected: FAIL because the data asset and utility module do not exist.

- [ ] **Step 3: Add the pure option utilities**

Implement `src/utils/report-parameter-options.js` with deterministic, dependency-free functions:

```js
export const REPORT_ECONOMIC_ZONE_OPTIONS = [
  { id: 'economic-zone:jing-jin-ji', name: '京津冀', type: 'economic-zone' },
  { id: 'economic-zone:yangtze-river-delta', name: '长三角', type: 'economic-zone' },
  { id: 'economic-zone:greater-bay-area', name: '粤港澳大湾区', type: 'economic-zone' },
  { id: 'economic-zone:chengdu-chongqing', name: '成渝地区双城经济圈', type: 'economic-zone' },
  { id: 'economic-zone:middle-yangtze', name: '长江中游城市群', type: 'economic-zone' },
  { id: 'economic-zone:guanzhong-plain', name: '关中平原城市群', type: 'economic-zone' },
  { id: 'economic-zone:beibu-gulf', name: '北部湾经济区', type: 'economic-zone' },
  { id: 'economic-zone:west-strait', name: '海峡西岸经济区', type: 'economic-zone' },
]

export const searchStandardIndustries = (options = [], keyword = '', limit = 80) => {
  const normalized = String(keyword).trim().toLowerCase()
  const matches = normalized
    ? options.filter((item) =>
        `${item.code} ${item.name}`.toLowerCase().includes(normalized)
      )
    : options
  return matches.slice(0, limit)
}

export const buildReportRegionOptions = (geoData = {}) => {
  const directMunicipalities = [
    { id: 'city:110100', name: '北京市', type: 'city', province: '北京' },
    { id: 'city:120100', name: '天津市', type: 'city', province: '天津' },
    { id: 'city:310100', name: '上海市', type: 'city', province: '上海' },
    { id: 'city:500100', name: '重庆市', type: 'city', province: '重庆' },
  ]
  const cities = Object.entries(geoData).flatMap(([province, value]) =>
    (value?.features ?? [])
      .filter((feature) => /市$|地区$|自治州$|盟$/.test(feature.name))
      .map((feature) => ({
        id: `city:${feature.adcode}`,
        name: feature.name,
        type: 'city',
        province,
      }))
  )
  return [...directMunicipalities, ...cities, ...REPORT_ECONOMIC_ZONE_OPTIONS]
}

export const searchReportRegions = (
  options = [],
  keyword = '',
  selectedIds = [],
  limit = 80,
) => {
  const selected = new Set(selectedIds)
  const normalized = String(keyword).trim().toLowerCase()
  return options
    .filter((item) => !selected.has(item.id))
    .filter((item) =>
      !normalized
      || `${item.name} ${item.province ?? ''} ${item.type}`.toLowerCase().includes(normalized)
    )
    .slice(0, limit)
}

export const formatReportRegionNames = (names = []) =>
  [...new Set(names.filter(Boolean))].join('、')

export const normalizeReportRegionSelection = (form = {}, options = []) => {
  const byId = new Map(options.map((item) => [item.id, item]))
  const ids = [...new Set(Array.isArray(form.regionIds) ? form.regionIds : [])]
    .filter((id) => byId.has(id))
  const legacyNames = Array.isArray(form.regionNames)
    ? form.regionNames
    : String(form.region || '').split(/[、/]/).map((name) => name.trim()).filter(Boolean)
  const names = ids.length
    ? ids.map((id) => byId.get(id).name)
    : [...new Set(legacyNames)]
  return { regionIds: ids, regionNames: names, region: formatReportRegionNames(names) }
}
```

- [ ] **Step 4: Add the generated GB/T asset**

Create `src/data/gb-t-4754-2017.js` from the official National Bureau of Statistics document:

`https://www.stats.gov.cn/xxgk/tjbz/gjtjbz/201710/P020200612582987744004.DOCX`

The asset must be classic-script compatible and expose exactly:

```js
// Source: GB/T 4754—2017 with Amendment No. 1, National Bureau of Statistics.
globalThis.gbT4754IndustrySource = {
  standard: 'GB/T 4754—2017',
  authority: '国家统计局',
  url: 'https://www.stats.gov.cn/xxgk/tjbz/gjtjbz/201710/t20171017_1758922.html',
}
globalThis.gbT4754IndustryOptions = [
  { code: 'A', name: '农、林、牧、渔业', level: 'section', parentCode: null },
  { code: '01', name: '农业', level: 'division', parentCode: 'A' },
  { code: '011', name: '谷物种植', level: 'group', parentCode: '01' },
  { code: '0111', name: '稻谷种植', level: 'class', parentCode: '011' }
]
```

The shown rows define the exact object shape and parent-code convention. The generated committed array must contain all 1972 official entries, ordered by the standard, and satisfy the exact per-level counts in Step 1.

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
cd major-construction-platform
node --test tests/report-parameter-options.test.mjs
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add major-construction-platform/src/data/gb-t-4754-2017.js \
  major-construction-platform/src/utils/report-parameter-options.js \
  major-construction-platform/tests/report-parameter-options.test.mjs
git commit -m "feat(report): add standard industry and region options"
```

---

### Task 2: Report form normalization, validation, and generated scope

**Files:**
- Modify: `major-construction-platform/src/mock/research-report.ts`
- Modify: `major-construction-platform/src/utils/report-generation.js`
- Modify: `major-construction-platform/tests/report-generation.test.mjs`

**Interfaces:**
- Consumes: `formatReportRegionNames()` and `normalizeReportRegionSelection()` from Task 1.
- Produces:
  - `ReportForm.relatedIndustryCode: string`
  - `ReportForm.regionIds: string[]`
  - `ReportForm.regionNames: string[]`
  - `normalizeReportForm(form, { regionOptions })`
  - `validateReportForm(form, { industryOptions, regionOptions })`

- [ ] **Step 1: Replace obsolete validation tests with retained-field tests**

Update the `validForm` fixture:

```js
const validForm = {
  title: '智能建造行业分析报告',
  reportKind: 'professional',
  major: '智能建造工程专业',
  industry: '智能建造产业链',
  relatedIndustryCode: '47',
  relatedIndustry: '房屋建筑业',
  regionIds: ['city:210100', 'economic-zone:jing-jin-ji'],
  regionNames: ['沈阳市', '京津冀'],
  region: '沈阳市、京津冀',
  jobIds: ['job-bim-deepening'],
  creationMode: 'template',
  templateId: 'professional-analysis',
}
```

Assert:

```js
assert.equal(validateReportForm(validForm, {
  industryOptions: [{ code: '47', name: '房屋建筑业' }],
  regionOptions: [
    { id: 'city:210100', name: '沈阳市' },
    { id: 'economic-zone:jing-jin-ji', name: '京津冀' },
  ],
}), null)
assert.equal(validateReportForm({
  ...validForm,
  jobIds: Array.from({ length: 25 }, (_, index) => `job-${index}`),
}), null)
assert.deepEqual(
  validateReportForm({ ...validForm, relatedIndustryCode: '', relatedIndustry: '' }),
  { field: 'relatedIndustryCode', message: '请选择相关行业' },
)
assert.deepEqual(
  validateReportForm({ ...validForm, regionIds: [], regionNames: [], region: '' }),
  { field: 'regionIds', message: '请至少选择一个城市或经济区' },
)
assert.equal(validateReportForm({ ...validForm, templateId: '', creationMode: 'template' }), null)
```

Update generated-content assertions to require `47 房屋建筑业` and `沈阳市、京津冀`, and to reject `报告类型：` and `按模板创建`.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd major-construction-platform
node --test tests/report-generation.test.mjs
```

Expected: FAIL because the form still enforces 10 jobs and template selection, and does not know the new fields.

- [ ] **Step 3: Extend report types and default values**

In `src/mock/research-report.ts`, add:

```ts
relatedIndustryCode: string
regionIds: string[]
regionNames: string[]
```

Keep `reportKind`, `creationMode`, `templateId`, and `region` as compatibility fields. Set the new-report defaults to:

```ts
relatedIndustryCode: '47',
relatedIndustry: '房屋建筑业',
regionIds: ['city:210100', 'economic-zone:jing-jin-ji'],
regionNames: ['沈阳市', '京津冀'],
region: '沈阳市、京津冀',
reportKind: 'professional',
creationMode: 'template',
templateId: 'professional-analysis',
```

Add empty arrays to legacy records only through normalization; do not mechanically rewrite every stored mock record.

- [ ] **Step 4: Normalize and validate only visible decisions**

Change `normalizeReportForm` to clone `jobIds`, `regionIds`, and `regionNames`. Preserve legacy compatibility fields without using them as validation decisions.

Change `validateReportForm` so the validation order is:

```js
title
major
relatedIndustryCode / relatedIndustry
regionIds / regionNames / legacy region
jobIds
```

Delete the 10-job check, report-kind-specific major exemption, template check, and creation-mode check.

Update `createReportAdsMetadata()` to emit:

```js
relatedIndustryCode: normalized.relatedIndustryCode,
relatedIndustry: normalized.relatedIndustry,
regionIds: [...normalized.regionIds],
regionNames: [...normalized.regionNames],
region: normalized.region,
```

Update `buildDynamicReportContent()` so the subtitle includes professional major, standard industry, multiple regions, and generated date but excludes report type and creation mode.

- [ ] **Step 5: Run tests and verify GREEN**

Run:

```bash
cd major-construction-platform
node --test tests/report-generation.test.mjs
```

Expected: all report-generation utility tests pass.

- [ ] **Step 6: Commit**

```bash
git add major-construction-platform/src/mock/research-report.ts \
  major-construction-platform/src/utils/report-generation.js \
  major-construction-platform/tests/report-generation.test.mjs
git commit -m "refactor(report): normalize simplified analysis scope"
```

---

### Task 3: Vue parameter selectors and unlimited job selection

**Files:**
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: global GB/T options, existing `staticRegionCityGeoData`, Task 1 utilities, and Task 2 form fields.
- Produces: Vue search selector state and handlers:
  - `reportIndustrySearch`
  - `reportIndustryOpen`
  - `filteredReportIndustryOptions`
  - `selectReportIndustry(option)`
  - `reportRegionSearch`
  - `reportRegionOpen`
  - `filteredReportRegionOptions`
  - `selectReportRegion(option)`
  - `removeReportRegion(id)`

- [ ] **Step 1: Update Vue source-contract assertions**

Replace old positive assertions with:

```js
assert.doesNotMatch(parameterTemplate, />报告类型</)
assert.doesNotMatch(parameterTemplate, />创建方式</)
assert.doesNotMatch(parameterTemplate, />报告模板</)
assert.doesNotMatch(parameterTemplate, /最多选择 10 个|\/ 10/)
assert.doesNotMatch(appVue, /reportForm\.value\.jobIds\.length >= 10/)
assert.match(parameterTemplate, /data-report-industry-search/)
assert.match(parameterTemplate, /GB\/T 4754—2017/)
assert.match(parameterTemplate, /data-report-region-search/)
assert.match(parameterTemplate, /已选择 .* 个/)
assert.match(appVue, /const selectReportRegion =/)
assert.match(appVue, /const removeReportRegion =/)
```

Also assert the confirmation template excludes report type, creation mode, and template name.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report" tests/results-portal.test.mjs
```

Expected: FAIL on obsolete fields, old limit logic, and missing selector state.

- [ ] **Step 3: Load shared option data and initialize selector state**

Import Task 1 helpers in `App.vue`. Read the global industry data through a typed lookup:

```ts
const reportIndustryOptions = (
  globalThis as typeof globalThis & {
    gbT4754IndustryOptions?: StandardIndustryOption[]
  }
).gbT4754IndustryOptions ?? []

const reportRegionOptions = buildReportRegionOptions(staticRegionCityGeoLookup())
```

Add computed filtered options and selection handlers. Selecting an industry writes both code and name. Adding a region writes `regionIds`, `regionNames`, and the compatibility `region` string. Remove and clear actions update all three fields atomically.

- [ ] **Step 4: Remove obsolete Vue behavior**

- Delete the report-kind control and its watch-based template synchronization.
- Delete creation-mode and template controls.
- Simplify TOC initialization to keep the existing default TOC; change its helper text to “默认目录，可按需调整”.
- Remove the overwrite confirmation that only protected switching modes/templates.
- Change `toggleReportJob()` to append every unselected ID without checking length.
- Keep the zero-job validation.
- Update `openReportCreate()` and legacy load normalization for the new fields.

- [ ] **Step 5: Replace the Vue parameter fields**

Render a single-select industry combobox with:

- selected “code name” value,
- search input,
- grouped level label,
- clear button,
- option buttons,
- `aria-expanded`, `role="combobox"`, and `role="listbox"`.

Render a multi-select region combobox with:

- selected removable tags,
- search input,
- separate “城市” and “经济区” groups,
- clear-all action,
- no maximum count.

Change the job header to:

```vue
<span>从岗位库选择，支持多选</span>
<strong>已选择 {{ reportForm.jobIds.length }} 个</strong>
```

- [ ] **Step 6: Update the confirmation view**

Keep report name, major, standard industry, regions, jobs, and references. Remove report type and creation mode rows. Render multiple regions from `regionNames`.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report" tests/results-portal.test.mjs
```

Expected: all Vue report source-contract tests pass.

- [ ] **Step 8: Commit**

```bash
git add major-construction-platform/src/App.vue \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat(report): simplify Vue parameter selection"
```

---

### Task 4: Static entry selector parity

**Files:**
- Modify: `major-construction-platform/index.html`
- Modify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: `globalThis.gbT4754IndustryOptions`, `window.staticRegionCityGeoData`, and the same form compatibility fields as Vue.
- Produces: static selector markup and event-delegation attributes:
  - `data-report-industry-search`
  - `data-report-industry-option`
  - `data-report-industry-clear`
  - `data-report-region-search`
  - `data-report-region-option`
  - `data-report-region-remove`
  - `data-report-region-clear`

- [ ] **Step 1: Add failing static behavior assertions**

Update the existing static report harness to assert after opening a new report:

```js
assert.doesNotMatch(app.innerHTML, /专业报告|行业报告|创建方式|报告模板/)
assert.doesNotMatch(app.innerHTML, /最多选择 10 个|0 \/ 10/)
assert.match(app.innerHTML, /GB\/T 4754—2017/)
assert.match(app.innerHTML, /搜索行业编码或名称/)
assert.match(app.innerHTML, /搜索城市或经济区/)
assert.match(app.innerHTML, /已选择 0 个/)
```

Simulate 11 distinct job toggles and assert “已选择 11 个”. Simulate selecting `47 房屋建筑业`, `沈阳市`, and `京津冀`; then assert the confirmation step shows all three values and no template summary.

- [ ] **Step 2: Run static report tests and verify RED**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="static report" tests/results-portal.test.mjs
```

Expected: FAIL because static markup and handlers still implement the old controls.

- [ ] **Step 3: Load GB/T data before the inline application**

Add beside `static-region-city-geo.js`:

```html
<script src="./src/data/gb-t-4754-2017.js"></script>
```

Initialize static search/open state and build city/economic-zone choices from `window.staticRegionCityGeoData`.

- [ ] **Step 4: Mirror normalized static form behavior**

Extend `normalizeStaticReportForm()` with `relatedIndustryCode`, `regionIds`, and `regionNames`. Convert old `region` strings into compatibility tags when IDs are unavailable.

Update static validation to require the retained fields only. Delete kind/template validation and delete the 10-job branch.

- [ ] **Step 5: Replace static parameter and confirmation templates**

Remove report type, creation mode, and report template template strings. Add industry and region combobox HTML using the data attributes in the Interfaces block. Show the job count as “已选择 N 个”.

Change the TOC source text to “默认目录，可按需调整” and remove mode/template switching behavior. Remove report type and creation mode from the confirmation summary.

- [ ] **Step 6: Add static event delegation**

Implement input handlers for industry/region search text and click handlers for select, remove, clear, and outside-close behavior. Each selection must update compatibility strings before `renderReport('create')`.

- [ ] **Step 7: Run static report tests and verify GREEN**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="static report" tests/results-portal.test.mjs
```

Expected: all static report tests pass.

- [ ] **Step 8: Commit**

```bash
git add major-construction-platform/index.html \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat(report): mirror standard selectors in static entry"
```

---

### Task 5: Selector styling, responsive behavior, and full verification

**Files:**
- Modify: `major-construction-platform/src/styles/80-report.css`
- Modify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: selector class names added in Tasks 3 and 4.
- Produces: shared visual behavior for both Vue and static markup.

- [ ] **Step 1: Add failing styling assertions**

Assert that `.report-combobox`, `.report-combobox-panel`, `.report-selection-tags`, `.report-option-group`, and `.report-option-row` exist. Assert the panel has an absolute position, bounded height, scrolling, and a z-index; assert tags wrap; assert the narrow breakpoint makes the retained parameter fields one column.

- [ ] **Step 2: Run the style test and verify RED**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report wizard styling" tests/results-portal.test.mjs
```

Expected: FAIL because selector styles do not exist.

- [ ] **Step 3: Add shared selector styles**

Add scoped styles that:

- anchor the dropdown to `.report-combobox`,
- cap the panel at `320px` with `overflow-y: auto`,
- provide visible hover, selected, and focus states,
- display code, name, and level without truncating important text,
- wrap selected region tags,
- keep remove/clear controls keyboard-visible,
- switch to one column at the existing narrow report breakpoint.

- [ ] **Step 4: Run focused report tests**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report" tests/report-parameter-options.test.mjs tests/report-generation.test.mjs tests/results-portal.test.mjs
```

Expected: all report-related tests pass.

- [ ] **Step 5: Check for stale production behavior**

Run:

```bash
cd major-construction-platform
rg -n "最多选择 10 个|/ 10|data-report-kind|data-report-creation-mode|data-report-template|>报告类型<|>创建方式<|>报告模板<" \
  src/App.vue index.html src/utils/report-generation.js src/styles/80-report.css
```

Expected: no matches in new-report parameter or confirmation templates and no 10-job validation logic. Legacy report-library display strings may remain outside the creation flow.

- [ ] **Step 6: Run the full test suite**

Run:

```bash
cd major-construction-platform
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 7: Run the production build**

Run:

```bash
cd major-construction-platform
npm run build
```

Expected: `vue-tsc -b`, Vite, and the Sites worker build all exit successfully.

- [ ] **Step 8: Inspect the final diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intended report files and the plan/design history are changed.

- [ ] **Step 9: Commit**

```bash
git add major-construction-platform/src/styles/80-report.css \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "style(report): polish standard parameter selectors"
```
