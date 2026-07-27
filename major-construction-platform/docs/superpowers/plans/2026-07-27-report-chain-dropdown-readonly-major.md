# Report Chain Dropdown and Read-only Major Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the report chain search combobox with a standard dropdown and make the current professional major read-only.

**Architecture:** Keep the existing report form, chain/job linkage helpers, uniqueness rules, generation snapshot, and export model. Change only the Vue and static-entry presentation/state adapters: a select value identifies a library chain, an empty value clears scope, and a `__custom__` sentinel reveals the existing custom-chain confirmation input.

**Tech Stack:** Vue 3, TypeScript, browser-native HTML select controls, static JavaScript fallback, Node test runner, Vite.

## Global Constraints

- The professional major comes from the current professional construction context and cannot be changed on the report page.
- The chain control is a standard dropdown with “请选择产业链”, related library chains, and “自定义产业链”.
- The custom chain name input is rendered only after “自定义产业链” is selected.
- Changing or clearing the chain clears all library and custom jobs.
- Existing chain/job uniqueness, report generation, legacy loading, and ADS export behavior must remain unchanged.
- Vue and `index.html` must expose equivalent behavior.

---

### Task 1: Lock the Vue major and replace the chain combobox

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/80-report.css`
- Test: `tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: `REPORT_INDUSTRY_CHAIN_OPTIONS`, `selectReportIndustryChain(form, chainId, chainOptions)`, `resetReportIndustryScope(form)`, and `createCustomReportIndustryChain(form, name, chainOptions)`.
- Produces: `reportIndustryChainSelectValue: ComputedRef<string>`, `handleReportIndustryChainSelect(value: string): void`, `data-report-major-readonly`, `data-report-chain-select`, and `data-report-custom-chain-input`.

- [ ] **Step 1: Write the failing Vue source-contract test**

```js
test('Vue report keeps the current major read-only and uses a chain select', () => {
  const parameterTemplate = sourceSlice(
    appVue,
    '<section class="research-card report-form-card report-parameter-card">',
    '<label class="report-field report-field-wide">'
  )
  assert.match(parameterTemplate, /data-report-major-readonly/)
  assert.doesNotMatch(parameterTemplate, /data-report-major(?:\s|=)/)
  assert.match(parameterTemplate, /data-report-chain-select/)
  assert.match(parameterTemplate, />请选择产业链</)
  assert.match(parameterTemplate, />自定义产业链</)
  assert.match(parameterTemplate, /data-report-custom-chain-input/)
  assert.doesNotMatch(parameterTemplate, /data-report-chain-search/)
})
```

- [ ] **Step 2: Run the Vue source-contract test and verify RED**

Run:

```bash
node --test --test-name-pattern="Vue report keeps the current major read-only" tests/results-portal.test.mjs
```

Expected: FAIL because the template still contains `data-report-major` and `data-report-chain-search`.

- [ ] **Step 3: Implement the Vue select adapter and template**

```ts
const CUSTOM_REPORT_CHAIN_VALUE = '__custom__'

const reportIndustryChainSelectValue = computed(() =>
  reportForm.value.industryChainSource === 'custom'
    ? CUSTOM_REPORT_CHAIN_VALUE
    : reportForm.value.industryChainId
)

const handleReportIndustryChainSelect = (value: string) => {
  if (!value) {
    clearReportChain()
    return
  }
  if (value === CUSTOM_REPORT_CHAIN_VALUE) {
    reportForm.value = {
      ...resetReportIndustryScope(reportForm.value),
      industryChainSource: 'custom',
    }
    reportIndustryChainSearch.value = ''
    return
  }
  selectReportChain(value)
}
```

Render the major as:

```vue
<div class="report-field">
  <span>专业</span>
  <div class="report-readonly-value" data-report-major-readonly>
    {{ reportForm.major }}
  </div>
</div>
```

Render the chain as a native select:

```vue
<select
  data-report-chain-select
  :value="reportIndustryChainSelectValue"
  @change="handleReportIndustryChainSelect(($event.target as HTMLSelectElement).value)"
>
  <option value="">请选择产业链</option>
  <option
    v-for="option in filteredReportIndustryChainOptions"
    :key="option.id"
    :value="option.id"
  >
    {{ option.name }}
  </option>
  <option :value="CUSTOM_REPORT_CHAIN_VALUE">自定义产业链</option>
</select>
```

When `reportForm.industryChainSource === 'custom'`, render `data-report-custom-chain-input` and the existing confirmation action. On custom report load, seed `reportIndustryChainSearch` with the existing custom chain name.

- [ ] **Step 4: Run the focused Vue test and relevant report tests**

Run:

```bash
node --test --test-name-pattern="Vue report|report entries align" tests/results-portal.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the Vue change**

```bash
git add src/App.vue src/styles/80-report.css tests/results-portal.test.mjs
git commit -m "feat(report): use chain dropdown with read-only major"
```

### Task 2: Mirror the select behavior in the static entry

**Files:**
- Modify: `index.html`
- Test: `tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: `staticReportIndustryChainOptions`, `selectStaticReportIndustryChain(chainId)`, `resetStaticReportIndustryScope()`, and `createStaticReportCustomIndustryChain()`.
- Produces: `data-report-major-readonly`, `data-report-chain-select`, `data-report-custom-chain-input`, and the same empty/library/custom state transitions as Vue.

- [ ] **Step 1: Write failing static rendering and runtime tests**

```js
test('static report renders a read-only major and native chain select', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness, { selectDefaultChain: false })
  assert.match(harness.html, /data-report-major-readonly/)
  assert.doesNotMatch(harness.html, /data-report-major(?:\s|=)/)
  assert.match(harness.html, /data-report-chain-select/)
  assert.match(harness.html, /<option value="">请选择产业链<\/option>/)
  assert.match(harness.html, /<option value="__custom__">自定义产业链<\/option>/)
  assert.doesNotMatch(harness.html, /data-report-chain-search/)
})

test('static custom chain input appears only for the custom select option', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness, { selectDefaultChain: false })
  assert.doesNotMatch(harness.html, /data-report-custom-chain-input/)
  harness.change('[data-report-chain-select]', '__custom__')
  assert.match(harness.html, /data-report-custom-chain-input/)
  assert.match(harness.html, /暂无库内关联岗位/)
})
```

- [ ] **Step 2: Run the static tests and verify RED**

Run:

```bash
node --test --test-name-pattern="static report renders a read-only major|static custom chain input appears" tests/results-portal.test.mjs
```

Expected: FAIL because the static renderer still emits a major select and chain search combobox.

- [ ] **Step 3: Implement the static native select**

Render:

```js
const chainSelectValue = staticReportForm.industryChainSource === 'custom'
  ? '__custom__'
  : staticReportForm.industryChainId

const chainPicker = `<select data-report-chain-select>
  <option value="">请选择产业链</option>
  ${filteredStaticReportIndustryChains.map((option) =>
    `<option value="${escapeText(option.id)}">${escapeText(option.name)}</option>`
  ).join('')}
  <option value="__custom__">自定义产业链</option>
</select>`
```

In the change handler:

```js
if (target.matches('[data-report-chain-select]')) {
  const value = target.value
  if (!value) resetStaticReportIndustryScope()
  else if (value === '__custom__') {
    resetStaticReportIndustryScope()
    staticReportForm.industryChainSource = 'custom'
  } else {
    selectStaticReportIndustryChain(value)
  }
  renderReport('create')
  return
}
```

Render the current major with `data-report-major-readonly`. Render `data-report-custom-chain-input` plus the confirmation button only in custom mode, and route Enter/input handling from the old search selector to the new custom input selector.

- [ ] **Step 4: Update existing static helpers and verify GREEN**

Update `selectStaticReportChain` to call:

```js
harness.change('[data-report-chain-select]', chainId)
```

Update custom-chain tests to select `__custom__`, input through `data-report-custom-chain-input`, and press Enter. Remove expectations tied to search panels and major changes.

Run:

```bash
node --test tests/results-portal.test.mjs
```

Expected: all results portal tests PASS.

- [ ] **Step 5: Commit the static change**

```bash
git add index.html tests/results-portal.test.mjs
git commit -m "feat(report): sync native chain select in static entry"
```

### Task 3: Full verification and browser QA

**Files:**
- Verify: `src/App.vue`
- Verify: `index.html`
- Verify: `tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: the completed Vue and static controls.
- Produces: evidence that all automated and interactive acceptance criteria pass.

- [ ] **Step 1: Scan for obsolete editable controls**

Run:

```bash
rg -n "data-report-major(\\s|=)|data-report-chain-search|搜索或输入产业链名称" src/App.vue index.html tests
```

Expected: no production matches.

- [ ] **Step 2: Run the complete test suite**

Run:

```bash
npm test
```

Expected: 398 tests PASS or the updated total with zero failures.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete with exit code 0.

- [ ] **Step 4: Verify the built page interactively**

Open the built report page and confirm:

1. The professional major is visible but cannot be selected.
2. The chain field is a native dropdown.
3. Selecting a library chain shows only mapped jobs.
4. Selecting “自定义产业链” reveals the name input and no library jobs.
5. Confirming a custom chain enables custom job entry.

- [ ] **Step 5: Commit any verification-only test updates**

```bash
git add tests
git commit -m "test(report): verify dropdown and read-only major"
```
