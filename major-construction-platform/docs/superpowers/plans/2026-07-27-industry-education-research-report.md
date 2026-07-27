# 产教调研报告参数联动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将报告创建页改为“专业 → 产业链 → 岗位”联动流程，支持名称唯一的自定义产业链和多个自定义岗位，并让报告生成、导出及静态演示入口使用同一口径。

**Architecture:** 在 `report-parameter-options.js` 中实现无 UI 依赖的候选筛选、级联重置和名称唯一性规则；`report-generation.js` 负责表单兼容、校验、快照、正文及导出；Vue 与静态入口只持有交互状态并调用这些规则的等价实现。新表单显式保存产业链来源和自定义岗位，旧行业字段只在读取历史报告时兜底。

**Tech Stack:** Vue 3 Composition API、TypeScript 5.8、JavaScript ES modules、Node.js `node:test`、Vite 6、原生 HTML/CSS/JavaScript 静态入口。

## Global Constraints

- 左侧入口及报告创建流程内对应名称统一为“产教调研报告”。
- 产业链为单选，岗位为多选。
- 未选择产业链时，岗位候选为空且自定义岗位输入不可用。
- 自定义产业链不返回库内岗位，但允许添加多个自定义岗位。
- 切换专业、清除产业链或切换产业链必须清空全部岗位。
- 产业链和岗位名称去除首尾空格后按完整名称唯一，库内与自定义之间也不得重名。
- 至少选择一个产业链和一个岗位后才能进入下一步。
- 不新增运行时依赖，不建设新的后台字典模块，不扩充全平台基础数据。
- 保持历史报告可读，并同步维护 Vue 入口与 `file://` 静态入口。

---

## File Structure

- `src/mock/research-report.ts`：定义报告表单新增字段、报告专用专业—产业链—岗位映射和默认值。
- `src/utils/report-parameter-options.js`：实现名称标准化、产业链搜索、岗位过滤、级联清空和自定义项去重。
- `src/utils/report-parameter-options.d.ts`：声明新增纯函数和候选类型。
- `src/utils/report-generation.js`：兼容旧表单，校验新字段，合并库内与自定义岗位，并生成产业链口径的正文与导出元数据。
- `src/utils/report-generation.d.ts`：同步新表单、选项和返回值声明。
- `src/App.vue`：实现 Vue 创建页的产业链组合框、自定义岗位输入及响应式联动。
- `src/styles/80-report.css`：补充自定义添加行、空状态、标签和禁用态样式。
- `index.html`：同步静态演示页面的数据、渲染和事件处理。
- `tests/report-parameter-options.test.mjs`：验证纯联动与唯一性规则。
- `tests/report-generation.test.mjs`：验证新表单标准化、校验、正文和 ADS 数据。
- `tests/report-generation-runtime.test.mjs`：验证快照不可变性和自定义岗位持久化。
- `tests/results-portal.test.mjs`：通过静态页面运行时 harness 验证真实交互。

---

### Task 1: 报告产业链与岗位联动规则

**Files:**
- Modify: `src/mock/research-report.ts`
- Modify: `src/utils/report-parameter-options.js`
- Modify: `src/utils/report-parameter-options.d.ts`
- Test: `tests/report-parameter-options.test.mjs`

**Interfaces:**
- Consumes: 现有 `ReportForm`、`RESEARCH_JOB_CANDIDATES` 的 `{ id, name }` 结构。
- Produces:
  - `normalizeReportOptionName(value: unknown): string`
  - `searchReportIndustryChains(options, major, keyword): ReportIndustryChainOption[]`
  - `getReportJobsForChain(chainId, chainOptions, jobOptions): ReportJobOption[]`
  - `resetReportIndustryScope(form): ReportForm`
  - `selectReportIndustryChain(form, option): ReportForm`
  - `createCustomReportIndustryChain(form, input, libraryOptions): { form, error }`
  - `addCustomReportJob(form, input, visibleJobOptions): { form, error }`
  - `removeCustomReportJob(form, name): ReportForm`
  - `resolveReportJobNames(jobIds, customJobNames, jobOptions): string[]`
  - `REPORT_INDUSTRY_CHAIN_OPTIONS: ReportIndustryChainOption[]`

- [ ] **Step 1: Write failing linkage tests**

Add imports and behavior tests to `tests/report-parameter-options.test.mjs`:

```js
import {
  addCustomReportJob,
  createCustomReportIndustryChain,
  getReportJobsForChain,
  removeCustomReportJob,
  resetReportIndustryScope,
  resolveReportJobNames,
  searchReportIndustryChains,
  selectReportIndustryChain,
} from '../src/utils/report-parameter-options.js'

const chainOptions = [
  {
    id: 'chain-smart',
    name: '智能建造产业链',
    majors: ['智能建造工程专业'],
    jobIds: ['job-bim', 'job-site'],
  },
  {
    id: 'chain-prefab',
    name: '装配式建筑产业链',
    majors: ['智能建造工程专业', '建筑工程技术专业'],
    jobIds: ['job-prefab'],
  },
]
const jobOptions = [
  { id: 'job-bim', name: 'BIM深化设计工程师' },
  { id: 'job-site', name: '智慧工地管理工程师' },
  { id: 'job-prefab', name: '装配式建筑深化设计师' },
]
const emptyScope = {
  major: '智能建造工程专业',
  industry: '',
  industryChainId: '',
  industryChainName: '',
  industryChainSource: '',
  jobIds: [],
  customJobNames: [],
}

test('report chains are restricted to the selected major and searched by name', () => {
  assert.deepEqual(
    searchReportIndustryChains(chainOptions, '建筑工程技术专业', ''),
    [chainOptions[1]],
  )
  assert.deepEqual(
    searchReportIndustryChains(chainOptions, '智能建造工程专业', '装配式'),
    [chainOptions[1]],
  )
})

test('changing report chain resets jobs and exposes only mapped jobs', () => {
  const selected = selectReportIndustryChain(
    { ...emptyScope, jobIds: ['old'], customJobNames: ['旧岗位'] },
    chainOptions[0],
  )
  assert.deepEqual(selected.jobIds, [])
  assert.deepEqual(selected.customJobNames, [])
  assert.deepEqual(
    getReportJobsForChain(selected.industryChainId, chainOptions, jobOptions),
    jobOptions.slice(0, 2),
  )
  assert.deepEqual(getReportJobsForChain('', chainOptions, jobOptions), [])
  assert.deepEqual(
    getReportJobsForChain('custom:智能建造咨询链', chainOptions, jobOptions),
    [],
  )
})

test('custom chains and jobs trim names and reject library or custom duplicates', () => {
  const duplicateChain = createCustomReportIndustryChain(
    emptyScope,
    ' 智能建造产业链 ',
    chainOptions,
  )
  assert.equal(duplicateChain.error, '产业链名称已存在')

  const customChain = createCustomReportIndustryChain(
    emptyScope,
    ' 智能建造咨询链 ',
    chainOptions,
  )
  assert.equal(customChain.error, '')
  assert.equal(customChain.form.industryChainName, '智能建造咨询链')
  assert.equal(customChain.form.industryChainSource, 'custom')

  const firstJob = addCustomReportJob(
    customChain.form,
    ' 数字建造咨询师 ',
    jobOptions,
  )
  assert.deepEqual(firstJob.form.customJobNames, ['数字建造咨询师'])
  assert.equal(firstJob.error, '')
  assert.equal(
    addCustomReportJob(firstJob.form, '数字建造咨询师', jobOptions).error,
    '岗位名称已存在',
  )
  assert.equal(
    addCustomReportJob(firstJob.form, 'BIM深化设计工程师', jobOptions).error,
    '岗位名称已存在',
  )
  assert.deepEqual(
    removeCustomReportJob(firstJob.form, '数字建造咨询师').customJobNames,
    [],
  )
})

test('resetting scope and resolving names preserve unique display order', () => {
  assert.deepEqual(
    resetReportIndustryScope({
      ...emptyScope,
      industryChainId: 'chain-smart',
      industryChainName: '智能建造产业链',
      industryChainSource: 'library',
      jobIds: ['job-site'],
      customJobNames: ['数字建造咨询师'],
    }),
    emptyScope,
  )
  assert.deepEqual(
    resolveReportJobNames(
      ['job-site', 'job-bim'],
      ['数字建造咨询师', ' 智慧工地管理工程师 '],
      jobOptions,
    ),
    ['智慧工地管理工程师', 'BIM深化设计工程师', '数字建造咨询师'],
  )
})
```

- [ ] **Step 2: Run the linkage tests and verify RED**

Run:

```bash
npm test -- tests/report-parameter-options.test.mjs
```

Expected: FAIL because the new exported functions do not exist.

- [ ] **Step 3: Add the report chain data and form fields**

In `src/mock/research-report.ts`, extend `ReportForm`:

```ts
export type ReportIndustryChainSource = '' | 'library' | 'custom'

export interface ReportForm {
  // existing fields remain for compatibility
  industryChainId: string
  industryChainName: string
  industryChainSource: ReportIndustryChainSource
  customJobNames: string[]
}

export interface ReportIndustryChainOption {
  id: string
  name: string
  majors: string[]
  jobIds: string[]
}
```

Define `REPORT_INDUSTRY_CHAIN_OPTIONS` with these exact relationships:

```ts
export const REPORT_INDUSTRY_CHAIN_OPTIONS: ReportIndustryChainOption[] = [
  {
    id: 'chain-smart-construction',
    name: '智能建造产业链',
    majors: ['智能建造工程专业', '建筑工程技术专业', '建设工程管理专业'],
    jobIds: [
      'job-bim-modeler',
      'job-bim-deepening',
      'job-parametric-design',
      'job-prefab-designer',
      'job-component-production',
      'job-prefab-quality',
      'job-smart-construction-tech',
      'job-construction-robot-operator',
      'job-uav-construction',
      'job-smart-site-manager',
      'job-project-digital-manager',
      'job-safety-iot',
      'job-structure-monitoring',
      'job-smart-inspection',
      'job-quality-data',
      'job-smart-survey',
      'job-laser-scan',
      'job-site-data-collector',
      'job-green-construction',
      'job-building-smart-ops',
      'job-energy-carbon',
      'job-bim-data-governance',
      'job-construction-platform-implementation',
      'job-iot-device-integration',
    ],
  },
  {
    id: 'chain-ai',
    name: '人工智能产业链',
    majors: ['智能建造工程专业'],
    jobIds: [],
  },
  {
    id: 'chain-prefabricated-building',
    name: '装配式建筑产业链',
    majors: ['智能建造工程专业', '建筑工程技术专业'],
    jobIds: [
      'job-prefab-designer',
      'job-component-production',
      'job-prefab-quality',
    ],
  },
  {
    id: 'chain-building-digital-service',
    name: '建筑数字化服务链',
    majors: ['智能建造工程专业', '建筑工程技术专业', '建设工程管理专业'],
    jobIds: [
      'job-bim-modeler',
      'job-bim-deepening',
      'job-parametric-design',
      'job-smart-site-manager',
      'job-project-digital-manager',
      'job-safety-iot',
      'job-bim-data-governance',
      'job-construction-platform-implementation',
      'job-iot-device-integration',
    ],
  },
  {
    id: 'chain-green-low-carbon-building',
    name: '绿色低碳建造产业链',
    majors: ['智能建造工程专业', '建筑工程技术专业', '建设工程管理专业'],
    jobIds: [
      'job-structure-monitoring',
      'job-smart-inspection',
      'job-quality-data',
      'job-green-construction',
      'job-building-smart-ops',
      'job-energy-carbon',
    ],
  },
]
```

Set the new-report default to:

```ts
industry: '',
industryChainId: '',
industryChainName: '',
industryChainSource: '',
jobIds: [],
customJobNames: [],
```

Historical `REPORTS` entries receive normalized library-chain fields and `customJobNames: []` so their display remains unchanged.

- [ ] **Step 4: Implement the pure linkage helpers**

In `src/utils/report-parameter-options.js`, implement:

```js
export const normalizeReportOptionName = (value = '') =>
  String(value).trim()

const normalizedNameKey = (value) =>
  normalizeReportOptionName(value).toLocaleLowerCase('zh-CN')

export const searchReportIndustryChains = (
  options = [],
  major = '',
  keyword = '',
) => {
  const normalizedKeyword = normalizedNameKey(keyword)
  return options.filter((option) =>
    option.majors.includes(major)
    && (!normalizedKeyword
      || normalizedNameKey(option.name).includes(normalizedKeyword)),
  )
}
```

Implement the other produced interfaces as immutable object/array transformations:

```js
export const getReportJobsForChain = (
  chainId = '',
  chainOptions = [],
  jobOptions = [],
) => {
  const chain = chainOptions.find((option) => option.id === chainId)
  if (!chain) return []
  const allowed = new Set(chain.jobIds)
  return jobOptions.filter((job) => allowed.has(job.id))
}

export const resetReportIndustryScope = (form = {}) => ({
  ...form,
  industry: '',
  industryChainId: '',
  industryChainName: '',
  industryChainSource: '',
  jobIds: [],
  customJobNames: [],
})

export const selectReportIndustryChain = (form = {}, option) => ({
  ...resetReportIndustryScope(form),
  industry: option.name,
  industryChainId: option.id,
  industryChainName: option.name,
  industryChainSource: 'library',
})
```

`createCustomReportIndustryChain` rejects blank input with `请输入产业链名称`, rejects a name matching any library option or the current selected chain with `产业链名称已存在`, and otherwise returns a reset form with ID `custom:${normalizedName}` and source `custom`.

`addCustomReportJob` returns `请先选择产业链` when `industryChainName` is empty, `请输入岗位名称` for blank input, and `岗位名称已存在` when the normalized name matches any visible library job or existing custom job. `removeCustomReportJob` filters by normalized name. `resolveReportJobNames` keeps library job ID order, appends custom names, and removes normalized duplicates.

- [ ] **Step 5: Add matching declarations**

In `src/utils/report-parameter-options.d.ts`, declare all produced interfaces with readonly inputs and concrete return types. Import `ReportForm` and `ReportIndustryChainOption` from `../mock/research-report`.

- [ ] **Step 6: Run the linkage tests and verify GREEN**

Run:

```bash
npm test -- tests/report-parameter-options.test.mjs
```

Expected: all report parameter option tests PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/mock/research-report.ts src/utils/report-parameter-options.js src/utils/report-parameter-options.d.ts tests/report-parameter-options.test.mjs
git commit -m "feat(report): add industry chain job linkage rules"
```

---

### Task 2: 报告表单校验、快照、正文与导出

**Files:**
- Modify: `src/utils/report-generation.js`
- Modify: `src/utils/report-generation.d.ts`
- Modify: `tests/report-generation.test.mjs`
- Modify: `tests/report-generation-runtime.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `resolveReportJobNames(jobIds, customJobNames, jobOptions)` 和新增 `ReportForm` 字段。
- Produces: `normalizeReportForm`、`validateReportForm`、`createReportGenerationSnapshot`、`createReportAdsMetadata`、`buildDynamicReportContent` 对新旧报告均有效。

- [ ] **Step 1: Replace the report-generation fixture with the new scope**

Update `validForm` in `tests/report-generation.test.mjs`:

```js
const validForm = {
  title: '智能建造产教调研报告',
  reportKind: 'professional',
  major: '智能建造工程专业',
  industry: '智能建造产业链',
  industryChainId: 'chain-smart-construction',
  industryChainName: '智能建造产业链',
  industryChainSource: 'library',
  relatedIndustryCode: '',
  relatedIndustry: '',
  regionIds: ['city:210100', 'economic-zone:jing-jin-ji'],
  regionNames: ['沈阳市', '京津冀'],
  region: '沈阳市、京津冀',
  jobIds: ['job-bim-deepening'],
  customJobNames: ['数字建造咨询师'],
  creationMode: 'template',
  templateId: 'professional-analysis',
}
```

Change validation assertions to expect:

```js
assert.deepEqual(
  validateReportForm({ ...validForm, industryChainName: '' }),
  { field: 'industryChainName', message: '请选择或输入产业链' },
)
assert.deepEqual(
  validateReportForm({ ...validForm, jobIds: [], customJobNames: [] }),
  { field: 'jobIds', message: '请至少选择或输入一个分析岗位' },
)
assert.equal(
  validateReportForm({ ...validForm, jobIds: [], customJobNames: ['咨询师'] }),
  null,
)
```

Add assertions that ADS metadata contains:

```js
assert.equal(metadata.industryChainName, '智能建造产业链')
assert.equal(metadata.industryChainSource, 'library')
assert.deepEqual(metadata.customJobNames, ['数字建造咨询师'])
assert.deepEqual(metadata.jobNames, ['BIM深化设计工程师', '数字建造咨询师'])
```

Change dynamic content expectations to match `产业链：智能建造产业链` and both library/custom job names, and to reject `相关行业：`.

- [ ] **Step 2: Add runtime snapshot and legacy compatibility tests**

In `tests/report-generation-runtime.test.mjs`, add:

```js
test('generation snapshot clones custom jobs and restores a legacy chain name', () => {
  const snapshot = runtime.createReportGenerationSnapshot({
    rows: [],
    activeReportId: 0,
    form: {
      ...reportForm,
      industryChainId: 'custom:城市更新服务链',
      industryChainName: '城市更新服务链',
      industryChainSource: 'custom',
      customJobNames: ['城市更新咨询师'],
    },
    toc: [{ title: '目录' }],
    referenceFileCount: 0,
    generatedDate: '2026-07-27',
    jobOptions,
  })
  assert.deepEqual(snapshot.report.customJobNames, ['城市更新咨询师'])
  assert.deepEqual(snapshot.jobNames, ['岗位 B', '岗位 A', '城市更新咨询师'])

  const legacy = runtime.normalizeReportForm({
    ...reportForm,
    industry: '智能建造产业链',
    industryChainId: undefined,
    industryChainName: undefined,
    industryChainSource: undefined,
    customJobNames: undefined,
  })
  assert.equal(legacy.industryChainName, '智能建造产业链')
  assert.equal(legacy.industryChainSource, 'library')
  assert.deepEqual(legacy.customJobNames, [])
})
```

- [ ] **Step 3: Run focused generation tests and verify RED**

Run:

```bash
npm test -- tests/report-generation.test.mjs tests/report-generation-runtime.test.mjs
```

Expected: FAIL because the generator still validates and renders related industry fields and drops custom jobs.

- [ ] **Step 4: Normalize and clone the new fields**

In `src/utils/report-generation.js`:

- Import Task 1's `resolveReportJobNames` under a non-conflicting name.
- Clone `customJobNames` in `cloneReportRecord`.
- In `normalizeReportForm`, trim and deduplicate `customJobNames`.
- Restore missing legacy `industryChainName` from `form.industry`.
- Restore missing legacy `industryChainSource` to `library` when a legacy chain name exists.
- Keep `industry` synchronized with `industryChainName` for new snapshots.

The normalized result must always contain strings for `industryChainId`, `industryChainName`, and `industryChainSource`, plus arrays for `jobIds` and `customJobNames`.

- [ ] **Step 5: Replace industry validation and merge job names**

Update `validateReportForm`:

```js
if (!normalized.industryChainName) {
  return { field: 'industryChainName', message: '请选择或输入产业链' }
}
if (
  normalized.jobIds.length === 0
  && normalized.customJobNames.length === 0
) {
  return {
    field: 'jobIds',
    message: '请至少选择或输入一个分析岗位',
  }
}
```

Remove new-form validation against GB/T industry options. Keep the optional `regionOptions` validation.

Change the exported report job resolver signature to:

```js
export const resolveReportJobNames = (
  jobIds = [],
  jobOptions = [],
  customJobNames = [],
) => resolveLinkedReportJobNames(jobIds, customJobNames, jobOptions)
```

Use this signature in metadata and snapshots.

- [ ] **Step 6: Render and export the industry-chain scope**

`createReportAdsMetadata` must include:

```js
industryChainId: normalized.industryChainId,
industryChainName: normalized.industryChainName,
industryChainSource: normalized.industryChainSource,
customJobNames: [...normalized.customJobNames],
jobNames: resolveReportJobNames(
  normalized.jobIds,
  jobOptions,
  normalized.customJobNames,
),
```

`buildDynamicReportContent` must build:

```js
const subtitle =
  `专业：${major} ｜ 产业链：${industryChain} ｜ 分析区域：${region} ｜ 生成日期：${escapeHtml(generatedDate)}`
```

- [ ] **Step 7: Update TypeScript declarations**

Update `ReportValidationError` to allow `industryChainName`, update report metadata return fields, and ensure every generated snapshot/report includes `customJobNames`. Remove `industryOptions` from `validateReportForm` options while preserving `regionOptions`.

- [ ] **Step 8: Run focused generation tests and verify GREEN**

Run:

```bash
npm test -- tests/report-generation.test.mjs tests/report-generation-runtime.test.mjs
```

Expected: all focused generation tests PASS.

- [ ] **Step 9: Commit Task 2**

```bash
git add src/utils/report-generation.js src/utils/report-generation.d.ts tests/report-generation.test.mjs tests/report-generation-runtime.test.mjs
git commit -m "feat(report): generate reports from chain and custom jobs"
```

---

### Task 3: Vue 创建页交互

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/80-report.css`
- Modify: `tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: Task 1 的链/岗位 helpers 和 `REPORT_INDUSTRY_CHAIN_OPTIONS`，Task 2 的新表单与校验。
- Produces: Vue 创建页的专业—产业链—岗位联动、自定义录入、即时唯一性错误和确认页显示。

- [ ] **Step 1: Add a source-boundary test for the Vue integration contract**

In `tests/results-portal.test.mjs`, add one integration-boundary test that catches accidental retention of the old selector:

```js
test('Vue report creation uses chain and custom-job controls', () => {
  const reportCreateBlock = sourceSlice(
    appVue,
    '<div class="report-parameter-grid">',
    '<label class="report-field report-field-wide">',
  )
  assert.match(appVue, />\\s*产教调研报告\\s*</)
  assert.match(reportCreateBlock, />选择产业链</)
  assert.match(reportCreateBlock, /data-report-chain-search/)
  assert.match(reportCreateBlock, /data-report-custom-job-input/)
  assert.match(reportCreateBlock, /暂无库内关联岗位|请先选择产业链/)
  assert.doesNotMatch(reportCreateBlock, />相关行业</)
  assert.doesNotMatch(reportCreateBlock, /GB\\/T 4754/)
})
```

The behavioral rules remain protected by Task 1 tests; this test protects the Vue wiring boundary and removal of the obsolete control.

- [ ] **Step 2: Run the Vue integration test and verify RED**

Run:

```bash
npm test -- tests/results-portal.test.mjs
```

Expected: FAIL because Vue still renders “相关行业” and has no custom-job control.

- [ ] **Step 3: Replace Vue selector state and computed values**

In `src/App.vue`:

- Remove GB/T industry option globals, search state, level labels, selector functions, and validation options used only by the report form.
- Import `REPORT_INDUSTRY_CHAIN_OPTIONS`.
- Import Task 1 helpers.
- Add:

```ts
const reportIndustryChainSearch = ref('')
const reportIndustryChainOpen = ref(false)
const reportIndustryChainError = ref('')
const reportCustomJobInput = ref('')
const reportCustomJobError = ref('')

const filteredReportIndustryChainOptions = computed(() =>
  searchReportIndustryChains(
    REPORT_INDUSTRY_CHAIN_OPTIONS,
    reportForm.value.major,
    reportIndustryChainSearch.value,
  ),
)
const availableReportJobs = computed(() =>
  getReportJobsForChain(
    reportForm.value.industryChainId,
    REPORT_INDUSTRY_CHAIN_OPTIONS,
    RESEARCH_JOB_CANDIDATES,
  ),
)
const selectedReportJobNames = computed(() =>
  resolveReportJobNames(
    reportForm.value.jobIds,
    reportForm.value.customJobNames,
    RESEARCH_JOB_CANDIDATES,
  ),
)
```

Create handlers for selecting/clearing/adding a chain, toggling a library job, adding/removing custom jobs, and clearing immediate errors.

- [ ] **Step 4: Add cascade watchers**

Watch `reportForm.value.major`; when it changes due to user interaction, assign `resetReportIndustryScope(reportForm.value)` and clear all chain/job inputs and errors. Do not trigger this reset while loading an existing report: use an explicit `handleReportMajorChange` handler on the `<select>` instead of a broad watcher.

Every chain select, custom chain add, chain clear, and chain switch must replace the form with the Task 1 helper result, thereby clearing both `jobIds` and `customJobNames`.

- [ ] **Step 5: Replace the Vue form controls**

Replace the “相关行业” block with a “选择产业链” combobox:

```vue
<div class="report-field report-combobox">
  <span>选择产业链</span>
  <small class="report-field-hint">根据所选专业推荐，也可输入自定义产业链</small>
  <div class="report-combobox-control" role="combobox">
    <span v-if="reportForm.industryChainName" class="report-selected-value">
      {{ reportForm.industryChainName }}
      <button type="button" aria-label="清除产业链" @click.stop="clearReportIndustryChain">×</button>
    </span>
    <input
      v-model="reportIndustryChainSearch"
      data-report-chain-search
      placeholder="搜索或输入产业链名称"
      @focus="reportIndustryChainOpen = true"
      @keydown.enter.prevent="addCustomReportIndustryChain"
    />
  </div>
</div>
```

The panel renders matching library options, an “添加自定义产业链「名称」” button when the trimmed input is non-empty and not an exact library match, and an empty hint when no library options exist.

Replace the job body with:

- Empty panel “请先选择产业链” when no chain is selected.
- `availableReportJobs` checkboxes for a library chain.
- Empty panel “暂无库内关联岗位，可在下方输入岗位名称” when selected chain has no mapped jobs.
- A custom job input and add button, disabled until a chain is selected.
- Removable tags for `customJobNames`.
- Count based on `selectedReportJobNames.length`.

- [ ] **Step 6: Update confirm and creation flows**

- New report creation starts with blank chain and blank jobs.
- Loading history preserves normalized chain/custom job fields.
- Confirm summary label becomes “产业链”.
- Selected-job summary renders `selectedReportJobNames`.
- `validateReportParameters` passes only region options.
- `createReportGenerationSnapshot` and ADS export continue receiving `RESEARCH_JOB_CANDIDATES`; Task 2 merges custom names.
- Replace visible `调研报告生成` navigation copy with `产教调研报告`.

- [ ] **Step 7: Add focused CSS**

In `src/styles/80-report.css`, add:

```css
.report-option-add,
.report-custom-job-entry {
  display: flex;
  align-items: center;
  gap: 8px;
}

.report-job-empty {
  padding: 24px;
  border: 1px dashed #cbd8ee;
  border-radius: 9px;
  color: #8290a6;
  text-align: center;
  background: #fbfdff;
}

.report-custom-job-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
```

Use existing input, tag, button, error and disabled styles where possible.

- [ ] **Step 8: Run tests and build**

Run:

```bash
npm test -- tests/report-parameter-options.test.mjs tests/report-generation.test.mjs tests/report-generation-runtime.test.mjs tests/results-portal.test.mjs
npm run build
```

Expected: focused tests PASS and `vue-tsc -b && vite build` succeeds without TypeScript errors.

- [ ] **Step 9: Commit Task 3**

```bash
git add src/App.vue src/styles/80-report.css tests/results-portal.test.mjs
git commit -m "feat(report): add chain-driven Vue report form"
```

---

### Task 4: `file://` 静态演示交互

**Files:**
- Modify: `index.html`
- Modify: `tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: Task 1 和 Task 2 的字段、错误文案及级联语义。
- Produces: 与 Vue 入口一致的静态报告创建交互，供用户截图所示的 `file://.../index.html` 直接运行。

- [ ] **Step 1: Add static runtime interaction tests**

The existing harness already exposes current HTML and input/click/keydown/change helpers. Add:

```js
test('static report chain controls gate and filter job choices', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness)

  assert.match(harness.html, /产教调研报告/)
  assert.match(harness.html, /选择产业链/)
  assert.match(harness.html, /请先选择产业链/)
  assert.doesNotMatch(harness.html, /data-report-job=/)

  harness.input('[data-report-chain-search]', '智能建造产业链')
  harness.click('[data-report-chain-option]', {
    reportChainOption: 'chain-smart-construction',
  })
  assert.match(harness.html, /data-report-job="job-bim-deepening"/)

  harness.change('[data-report-major]', '建筑工程技术专业')
  assert.match(harness.html, /请先选择产业链/)
  assert.doesNotMatch(harness.html, /data-report-job=/)
})

test('static report accepts unique custom chain and multiple custom jobs', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness)

  harness.input('[data-report-chain-search]', '城市更新服务链')
  harness.keydown('[data-report-chain-search]', 'Enter')
  assert.match(harness.html, /城市更新服务链/)
  assert.match(harness.html, /暂无库内关联岗位/)

  harness.input('[data-report-custom-job-input]', '城市更新咨询师')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  harness.input('[data-report-custom-job-input]', '城市更新项目经理')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  assert.match(harness.html, /城市更新咨询师/)
  assert.match(harness.html, /城市更新项目经理/)

  harness.input('[data-report-custom-job-input]', ' 城市更新咨询师 ')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  assert.match(harness.html, /岗位名称已存在/)
})

test('static report rejects library-name custom chain and generates custom jobs', () => {
  const harness = createStaticReportHarness({ deferTimers: true })
  openStaticReportCreate(harness)
  harness.input('[data-report-chain-search]', '智能建造产业链')
  harness.keydown('[data-report-chain-search]', 'Enter')
  assert.match(harness.html, /产业链名称已存在/)

  harness.input('[data-report-chain-search]', '城市更新服务链')
  harness.keydown('[data-report-chain-search]', 'Enter')
  harness.input('[data-report-custom-job-input]', '城市更新咨询师')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  advanceStaticReport(harness)
  advanceStaticReport(harness)
  harness.click('[data-report-action]', { reportAction: 'generate' })
  harness.runTimer(0)
  assert.match(harness.html, /产业链：城市更新服务链/)
  assert.match(harness.html, /城市更新咨询师/)
})
```

- [ ] **Step 2: Run static runtime tests and verify RED**

Run:

```bash
npm test -- tests/results-portal.test.mjs
```

Expected: FAIL because the static page still uses GB/T industry controls and renders all jobs.

- [ ] **Step 3: Add static chain mappings and normalized form fields**

In `index.html`, replace report-only `staticReportIndustryOptions` use with `staticReportIndustryChainOptions`, mirroring the five chain mappings from `src/mock/research-report.ts`.

Initialize new reports with blank chain and job fields. Normalize historical report rows into:

```js
industryChainId,
industryChainName,
industryChainSource,
customJobNames,
```

while falling back to their existing `industry` value.

- [ ] **Step 4: Implement static linkage and uniqueness functions**

Inside the static bootstrap, add local equivalents of the Task 1 functions with the exact same trim, full-name uniqueness, reset and error messages. Keep them adjacent to the static report data to prevent divergence.

Update static generation normalization, validation, snapshot cloning, search text, report summary, dynamic body and ADS export to use industry-chain fields and merged job names.

- [ ] **Step 5: Replace static report HTML**

Render the same states and data attributes used by the tests:

- `[data-report-chain-search]`
- `[data-report-chain-option]`
- `[data-report-chain-clear]`
- `[data-report-custom-job-input]`
- `[data-report-custom-job-add]`
- `[data-report-custom-job-remove]`

Remove the report-form GB/T label, code/name tags and `data-report-industry-*` controls. Preserve the unrelated national-industry analytics elsewhere in `index.html`.

- [ ] **Step 6: Wire static input, keydown, change and click events**

- Input updates search/custom-job drafts and clears the corresponding immediate error.
- Enter in chain search attempts custom-chain creation.
- Chain option click performs library selection and resets jobs.
- Major change resets the entire chain/job scope.
- Checkbox click toggles only currently available library jobs.
- Enter/button in custom job input adds a unique job.
- Remove buttons delete custom jobs.
- Clear/switch chain clears both job arrays.

Rerender `reportHtml('create')` after each state-changing action.

- [ ] **Step 7: Run static and focused tests**

Run:

```bash
npm test -- tests/results-portal.test.mjs tests/report-parameter-options.test.mjs tests/report-generation.test.mjs tests/report-generation-runtime.test.mjs
```

Expected: all focused tests PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add index.html tests/results-portal.test.mjs
git commit -m "feat(report): sync static chain-driven report flow"
```

---

### Task 5: 全量验证与视觉验收

**Files:**
- Modify only if verification reveals a defect in files already listed above.

**Interfaces:**
- Consumes: Tasks 1–4 completed implementation.
- Produces: verified build and user-visible behavior in the actual static demo URL.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm test
```

Expected: all Node tests PASS with no unhandled errors.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: `vue-tsc -b`, Vite build and sites worker build all succeed.

- [ ] **Step 3: Search for obsolete report-form copy**

Run:

```bash
rg -n "调研报告生成|>相关行业<|搜索行业编码或名称|data-report-industry-" src/App.vue index.html
```

Expected: no obsolete report-entry or report-form matches. Unrelated industry analytics copy is allowed only when it is outside the report creation block.

- [ ] **Step 4: Launch and inspect the static demo**

Run:

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173/index.html?tab=demand&reportView=create&professionalTab=map&view=job-report
```

Verify:

1. Entry says “产教调研报告”.
2. No chain selected initially; jobs show “请先选择产业链”.
3. A library chain shows only its mapped jobs.
4. A custom chain shows no library jobs.
5. Two unique custom jobs can be added and one can be removed.
6. Duplicate library/custom names show the designed inline errors.
7. Changing major clears chain and jobs.
8. The confirm page and generated preview say “产业链” and include custom jobs.

- [ ] **Step 5: Fix only verified defects and rerun affected checks**

For each defect, first add or tighten a test that reproduces it, run that test to see the expected failure, apply the smallest fix, then rerun the focused test, `npm test`, and `npm run build`.

- [ ] **Step 6: Commit verification fixes if any**

If verification changed files:

```bash
git add src/App.vue src/styles/80-report.css src/mock/research-report.ts src/utils/report-parameter-options.js src/utils/report-parameter-options.d.ts src/utils/report-generation.js src/utils/report-generation.d.ts index.html tests/report-parameter-options.test.mjs tests/report-generation.test.mjs tests/report-generation-runtime.test.mjs tests/results-portal.test.mjs
git commit -m "fix(report): resolve chain report verification findings"
```

If verification changed no files, do not create an empty commit.
