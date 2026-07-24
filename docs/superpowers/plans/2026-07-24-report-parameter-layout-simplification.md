# Report Parameter Layout Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase the “基本参数” header spacing and remove report-dimension selection from the complete report creation flow.

**Architecture:** Keep the three-step wizard and basic parameter form intact. Remove the dimension-only state and UI from both the Vue application and the file-compatible static entry, then add a report-specific header class so the spacing change does not affect shared cards elsewhere.

**Tech Stack:** Vue 3, TypeScript, static JavaScript template strings, CSS, Node.js test runner, Vite.

## Global Constraints

- Modify both the Vue entry and the `file://` static entry so they remain behaviorally consistent.
- Keep the report title validation and the three-step wizard.
- Do not change the shared `.research-card-head` style used by other pages.
- Do not change report table, directory editing, generation, preview, or editing behavior.

---

### Task 1: Lock the simplified flow in tests

**Files:**
- Modify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: `appVue`, `staticHtml`, and `stylesCss` source strings already loaded by the test file.
- Produces: Source-level assertions for the dimension-free flow and the report-specific header height.

- [ ] **Step 1: Update the wizard behavior assertions**

Replace the dimension-validation assertion in `Vue report creation uses a validated three-step wizard` and add checks that neither entry renders dimension selection:

```js
assert.doesNotMatch(appVue, /selectedReportDimensions\.value\.length === 0/)
assert.doesNotMatch(appVue, /选择报告维度/)
assert.doesNotMatch(staticHtml, /选择报告维度/)
assert.doesNotMatch(appVue, /已选择 .* 个报告维度/)
assert.doesNotMatch(staticHtml, /已选择 .* 个报告维度/)
```

In the static navigation test, add this assertion after opening the creation page:

```js
assert.doesNotMatch(app.innerHTML, /选择报告维度/)
```

- [ ] **Step 2: Update the report styling assertions**

Replace dimension-card checks in `report wizard styling stays compact and prevents text overflow` with the report-specific header assertion:

```js
const parameterHeader = styleBlock('.report-parameter-card > .research-card-head')

assert.match(parameterHeader, /height:\s*68px/)
assert.match(parameterHeader, /padding:\s*0 20px/)
assert.doesNotMatch(stylesCss, /\.report-wizard \.report-dimension-grid/)
```

Retain the existing stepper, parameter-grid, and TOC overflow assertions.

- [ ] **Step 3: Run the focused tests and verify failure**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report" tests/results-portal.test.mjs
```

Expected: FAIL because the Vue and static entries still render “选择报告维度”, and `.report-parameter-card > .research-card-head` does not yet exist.

### Task 2: Remove dimension selection from both application entries

**Files:**
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/index.html`

**Interfaces:**
- Consumes: Existing `reportForm`, report wizard navigation, report TOC, and report generation state.
- Produces: A report wizard whose first-step validation only requires a title and whose confirmation step contains report information plus the directory summary.

- [ ] **Step 1: Simplify Vue state and validation**

Remove `REPORT_DIMENSIONS` from the `./mock/research-report` import. Remove:

```ts
const selectedReportDimensions = ref(REPORT_DIMENSIONS.map((item) => item.key))
const selectedReportDimensionItems = computed(() =>
  REPORT_DIMENSIONS.filter((dimension) => selectedReportDimensions.value.includes(dimension.key))
)
const toggleReportDimension = (key: string) => {
  selectedReportDimensions.value = selectedReportDimensions.value.includes(key)
    ? selectedReportDimensions.value.filter((item) => item !== key)
    : [...selectedReportDimensions.value, key]
}
const reportSelectedDimensionRows = computed(() =>
  REPORT_DIMENSIONS.filter((dimension) =>
    selectedReportDimensions.value.includes(dimension.key)
  )
)
```

Remove the `selectedReportDimensions` reset from `openReportCreate`.

Reduce `validateReportParameters` to:

```ts
const validateReportParameters = () => {
  if (!reportForm.value.title.trim()) {
    reportCreateError.value = '请输入报告标题'
    return false
  }
  reportCreateError.value = ''
  return true
}
```

- [ ] **Step 2: Simplify the Vue template**

Add `report-parameter-card` to the basic-parameter section:

```vue
<section class="research-card report-form-card report-parameter-card">
```

Delete the complete `<section class="research-card report-dimension-panel">...</section>`.

Delete the complete confirmation card headed by “生成范围”. Keep “报告信息”, “目录摘要”, and the AI readiness note.

- [ ] **Step 3: Simplify static state and validation**

Remove the `reportDimensions` array and `selectedReportDimensions` set.

Reduce `validateStaticReportParameters` to:

```js
const validateStaticReportParameters = () => {
  if (!staticReportForm.title.trim()) {
    staticReportValidationError = '请输入报告标题'
    return false
  }
  staticReportValidationError = ''
  return true
}
```

Remove the dimension-toggle click branch and remove `dimensions` from the static report save payload.

- [ ] **Step 4: Simplify the static templates**

Add `report-parameter-card` to the parameter section:

```html
<section class="research-card report-form-card report-parameter-card">
```

Delete the dimension-panel template, the `selectedDimensionRows` derivation, and the “生成范围” confirmation card.

- [ ] **Step 5: Run the focused tests**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report" tests/results-portal.test.mjs
```

Expected: The behavior assertions pass; the header-style assertion still fails until Task 3.

### Task 3: Increase only the basic-parameter header spacing

**Files:**
- Modify: `major-construction-platform/src/styles/80-report.css`

**Interfaces:**
- Consumes: `.report-parameter-card` added to both application entries.
- Produces: A 68px basic-parameter header with unchanged shared card styling.

- [ ] **Step 1: Add the scoped header rule**

Add near the report wizard styles:

```css
.report-parameter-card > .research-card-head {
  height: 68px;
  padding: 0 20px;
}
```

- [ ] **Step 2: Remove dimension-only CSS**

Delete:

```css
.report-wizard .report-dimension-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.report-dimension-card {
  min-width: 0;
  overflow-wrap: anywhere;
}

.report-dimension-card strong,
.report-dimension-card em {
  white-space: normal;
}

.report-dimension-panel .research-card-head {
  min-height: 58px;
}
```

Remove `.report-wizard .report-dimension-grid` from the `max-width: 900px` media-query selector list.

- [ ] **Step 3: Run focused tests**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report" tests/results-portal.test.mjs
```

Expected: PASS.

### Task 4: Verify the complete project

**Files:**
- Verify: `major-construction-platform/src/App.vue`
- Verify: `major-construction-platform/index.html`
- Verify: `major-construction-platform/src/styles/80-report.css`
- Verify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: Completed Tasks 1–3.
- Produces: Evidence that the complete application still tests and builds.

- [ ] **Step 1: Check for stale dimension-flow references**

Run:

```bash
cd major-construction-platform
rg -n "选择报告维度|selectedReportDimensions|reportSelectedDimensionRows|toggleReportDimension|report-dimension-panel|report-wizard \\.report-dimension-grid" src/App.vue index.html src/styles/80-report.css tests/results-portal.test.mjs
```

Expected: Matches only in negative test assertions, with no production references.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
cd major-construction-platform
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Build production assets**

Run:

```bash
cd major-construction-platform
npm run build
```

Expected: Type checking and the Vite production build complete successfully.

- [ ] **Step 4: Review the final diff**

Run:

```bash
git diff --check
git diff -- major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/80-report.css major-construction-platform/tests/results-portal.test.mjs
```

Expected: No whitespace errors; the diff is limited to the requested report-parameter simplification plus pre-existing changes already present in those files.
