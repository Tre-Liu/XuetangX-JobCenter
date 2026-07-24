# Report Generation Reference Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the existing three-step report wizard with professional/industry scope, major, related industry, region, up to ten jobs, custom/template creation, dynamic report metadata, and a real draft-to-complete report lifecycle.

**Architecture:** Keep report catalog and template data in `src/mock/research-report.ts`; extract validation, TOC initialization, empty-title detection, and dynamic HTML generation into a focused JavaScript utility with TypeScript declarations so it can be unit tested directly by Node. Wire the utility into the Vue flow, then mirror the same state machine and copy in the static `file://` renderer.

**Tech Stack:** Vue 3 Composition API, TypeScript, plain JavaScript utilities, Node test runner, Vite, existing CSS system.

## Global Constraints

- Preserve the existing `参数配置 → 目录调整 → 报告生成` three-step flow.
- Report kinds are exactly `专业报告` and `行业报告`.
- Professional reports require a major; industry reports allow the major to be empty.
- Title, related industry, region, and at least one job are required.
- A report accepts at most 10 jobs.
- Custom creation starts with exactly one editable root chapter.
- Template creation loads the selected local template and confirms before replacing a modified TOC.
- No new backend API, package dependency, or template-management administration page.
- Generated reports enter the library as `draft`; the first save changes the status to `done`.
- Vue and `file://` static entry behavior must remain equivalent.
- Existing report editing, PDF export, and ADS export must continue to work.

---

## File Structure

- Create `major-construction-platform/src/utils/report-generation.js`
  - Pure report form validation, TOC initialization, empty-title lookup, and dynamic report HTML generation.
- Create `major-construction-platform/src/utils/report-generation.d.ts`
  - TypeScript contracts for the JavaScript utility.
- Create `major-construction-platform/tests/report-generation.test.mjs`
  - Behavioral unit tests for the pure report utility.
- Modify `major-construction-platform/src/mock/research-report.ts`
  - Report form/item types, professional and industry templates, local major/region options, and expanded seed records.
- Modify `major-construction-platform/src/App.vue`
  - Vue wizard form, job selection, validation, TOC source tracking, generation lifecycle, catalog persistence, and export metadata.
- Modify `major-construction-platform/index.html`
  - Static renderer state, markup, validation, interactions, dynamic content, catalog lifecycle, and export parity.
- Modify `major-construction-platform/src/styles/80-report.css`
  - New field errors, segmented controls, job picker, chips, template metadata, generation error, and responsive layout.
- Modify `major-construction-platform/tests/results-portal.test.mjs`
  - Structural and VM interaction tests for Vue/static parity.

---

### Task 1: Add the report domain model, templates, and pure utility

**Files:**
- Create: `major-construction-platform/src/utils/report-generation.js`
- Create: `major-construction-platform/src/utils/report-generation.d.ts`
- Create: `major-construction-platform/tests/report-generation.test.mjs`
- Modify: `major-construction-platform/src/mock/research-report.ts`
- Modify: `major-construction-platform/src/App.vue:446-470`

**Interfaces:**
- Consumes: existing `ReportTocItem` shape and the current professional report TOC.
- Produces:
  - `type ReportKind = 'professional' | 'industry'`
  - `type ReportCreationMode = 'custom' | 'template'`
  - `interface ReportForm`
  - `interface ReportTemplate`
  - `REPORT_KIND_OPTIONS`, `REPORT_MAJOR_OPTIONS`, `REPORT_REGION_OPTIONS`, `REPORT_TEMPLATES`
  - `validateReportForm(form): ReportValidationError | null`
  - `createReportTocForMode(options): ReportTocEditorNode[]`
  - `findEmptyReportTocTitle(rows): string | null`
  - `buildDynamicReportContent(options): string`

- [ ] **Step 1: Write failing utility tests**

Create `tests/report-generation.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDynamicReportContent,
  createReportTocForMode,
  findEmptyReportTocTitle,
  validateReportForm,
} from '../src/utils/report-generation.js'

const validForm = {
  title: '智能建造行业分析报告',
  reportKind: 'professional',
  major: '智能建造工程专业',
  industry: '智能建造产业链',
  relatedIndustry: '智能建造',
  region: '辽宁省',
  jobIds: ['job-bim-deepening'],
  creationMode: 'template',
  templateId: 'professional-analysis',
}

test('report form validation applies common and report-kind-specific rules', () => {
  assert.equal(validateReportForm(validForm), null)
  assert.deepEqual(
    validateReportForm({ ...validForm, title: '  ' }),
    { field: 'title', message: '请输入报告名称' },
  )
  assert.deepEqual(
    validateReportForm({ ...validForm, major: '' }),
    { field: 'major', message: '请选择专业' },
  )
  assert.equal(
    validateReportForm({ ...validForm, reportKind: 'industry', major: '' }),
    null,
  )
  assert.deepEqual(
    validateReportForm({ ...validForm, jobIds: [] }),
    { field: 'jobIds', message: '请至少选择一个分析岗位' },
  )
  assert.deepEqual(
    validateReportForm({
      ...validForm,
      jobIds: Array.from({ length: 11 }, (_, index) => `job-${index}`),
    }),
    { field: 'jobIds', message: '最多选择 10 个分析岗位' },
  )
  assert.deepEqual(
    validateReportForm({ ...validForm, templateId: '' }),
    { field: 'templateId', message: '请选择报告模板' },
  )
  assert.equal(
    validateReportForm({
      ...validForm,
      creationMode: 'custom',
      templateId: '',
    }),
    null,
  )
})

test('report TOC initialization differentiates custom and template creation', () => {
  const templates = [{
    id: 'professional-analysis',
    toc: [{ title: '专业建设背景', children: [{ title: '建设基础' }] }],
  }]
  let sequence = 0
  const createId = () => `toc-${sequence += 1}`

  assert.deepEqual(
    createReportTocForMode({
      creationMode: 'custom',
      templateId: '',
      templates,
      createId,
    }),
    [{ id: 'toc-1', title: '新增章节', children: [] }],
  )

  assert.deepEqual(
    createReportTocForMode({
      creationMode: 'template',
      templateId: 'professional-analysis',
      templates,
      createId,
    }),
    [{
      id: 'toc-2',
      title: '专业建设背景',
      children: [{ id: 'toc-3', title: '建设基础', children: [] }],
    }],
  )
})

test('empty TOC title lookup returns the first invalid node id', () => {
  assert.equal(
    findEmptyReportTocTitle([
      {
        id: 'root',
        title: '第一章',
        children: [{ id: 'empty-child', title: '  ', children: [] }],
      },
    ]),
    'empty-child',
  )
  assert.equal(
    findEmptyReportTocTitle([{ id: 'root', title: '第一章', children: [] }]),
    null,
  )
})

test('dynamic report content escapes parameters and includes report scope', () => {
  const html = buildDynamicReportContent({
    baseHtml: '<h1>旧标题</h1><p class="report-doc-subtitle">旧副标题</p><h2>正文</h2>',
    form: { ...validForm, title: '<智能建造报告>' },
    jobNames: ['BIM深化设计工程师', '智慧工地管理工程师'],
    referenceFileCount: 2,
    generatedDate: '2026年7月24日',
  })

  assert.match(html, /&lt;智能建造报告&gt;/)
  assert.match(html, /智能建造工程专业/)
  assert.match(html, /辽宁省/)
  assert.match(html, /BIM深化设计工程师、智慧工地管理工程师/)
  assert.match(html, /按模板创建/)
  assert.match(html, /参考文件 2 个/)
  assert.doesNotMatch(html, /<智能建造报告>/)
})
```

- [ ] **Step 2: Run the utility tests and verify they fail**

Run:

```bash
cd major-construction-platform
node --test tests/report-generation.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/utils/report-generation.js`.

- [ ] **Step 3: Expand the report domain data**

Replace the report types and constants at the start of `src/mock/research-report.ts` with:

```ts
export type ResearchReportStatus = 'done' | 'draft'
export type ReportKind = 'professional' | 'industry'
export type ReportCreationMode = 'custom' | 'template'

export interface ReportTocItem {
  title: string
  children?: ReportTocItem[]
}

export interface ReportForm {
  title: string
  type: string
  reportKind: ReportKind
  major: string
  industry: string
  relatedIndustry: string
  region: string
  jobIds: string[]
  creationMode: ReportCreationMode
  templateId: string
}

export interface ReportTemplate {
  id: string
  name: string
  reportKind: ReportKind
  description: string
  toc: ReportTocItem[]
}

export interface ResearchReportItem extends ReportForm {
  id: number
  date: string
  status: ResearchReportStatus
  referenceFileCount: number
  toc: ReportTocItem[]
}

export const REPORT_KIND_OPTIONS = [
  { value: 'professional', label: '专业报告' },
  { value: 'industry', label: '行业报告' },
] as const

export const REPORT_TYPE_OPTIONS = [
  '专业产业调研报告',
  '人才培养调研报告',
  '学徒制调研报告',
  '人才需求调研报告',
  '培养方案修订',
  '人才培养方案',
]

export const REPORT_MAJOR_OPTIONS = [
  '智能建造工程专业',
  '建筑工程技术专业',
  '建设工程管理专业',
]

export const REPORT_REGION_OPTIONS = [
  '全国',
  '辽宁省',
  '京津冀',
  '东北',
  '华北',
  '东北 / 华北',
]

export const REPORT_DEFAULT_MAJOR = REPORT_MAJOR_OPTIONS[0]

export const REPORT_DEFAULT_FORM: ReportForm = {
  title: '智能建造工程专业产业调研报告',
  type: REPORT_TYPE_OPTIONS[0],
  reportKind: 'professional',
  major: REPORT_DEFAULT_MAJOR,
  industry: '智能建造产业链',
  relatedIndustry: '智能建造',
  region: '东北 / 华北',
  jobIds: [],
  creationMode: 'template',
  templateId: 'professional-analysis',
}
```

Keep the current `REPORT_TOC` as the professional template TOC, add a focused industry TOC, and export both templates:

```ts
export const INDUSTRY_REPORT_TOC: ReportTocItem[] = [
  {
    title: '行业发展概况',
    children: [
      { title: '行业定义与研究范围' },
      { title: '行业规模与发展阶段' },
      { title: '政策环境与发展趋势' },
    ],
  },
  {
    title: '区域产业与企业分析',
    children: [
      { title: '区域产业布局' },
      { title: '重点企业与业务方向' },
      { title: '产业链协同关系' },
    ],
  },
  {
    title: '岗位需求与能力分析',
    children: [
      { title: '核心岗位需求' },
      { title: '典型工作任务' },
      { title: '知识技能素养要求' },
    ],
  },
  {
    title: '技术变革与人才培养建议',
    children: [
      { title: '新技术新工艺影响' },
      { title: '人才培养方向建议' },
      { title: '课程与实践项目建议' },
    ],
  },
  { title: '数据来源说明' },
]

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'professional-analysis',
    name: '专业分析报告模板',
    reportKind: 'professional',
    description: '面向专业建设、产业岗位需求与改进建议。',
    toc: REPORT_TOC,
  },
  {
    id: 'industry-analysis',
    name: '行业分析报告模板',
    reportKind: 'industry',
    description: '面向行业发展、区域产业、企业岗位与人才需求。',
    toc: INDUSTRY_REPORT_TOC,
  },
]
```

Move `REPORTS` below `REPORT_TEMPLATES`, then update each seed record to the expanded shape. Use `professional` for records 1, 2, 3, 5, and 6; use `industry` for record 4. Each record must include the existing internal `type`, `relatedIndustry`, two valid `jobIds`, `creationMode: 'template'`, the matching `templateId`, `referenceFileCount: 0`, and `toc: REPORT_TOC` or `toc: INDUSTRY_REPORT_TOC` according to its kind. These constant TOCs are treated as immutable; editing always passes through `buildReportTocRows`.

- [ ] **Step 4: Implement the pure utility**

Create `src/utils/report-generation.js`:

```js
const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const reportKindLabel = (kind) => kind === 'industry' ? '行业报告' : '专业报告'
const creationModeLabel = (mode) => mode === 'custom' ? '自定义' : '按模板创建'

export const validateReportForm = (form) => {
  if (!String(form.title || '').trim()) {
    return { field: 'title', message: '请输入报告名称' }
  }
  if (form.reportKind === 'professional' && !String(form.major || '').trim()) {
    return { field: 'major', message: '请选择专业' }
  }
  if (!String(form.relatedIndustry || '').trim()) {
    return { field: 'relatedIndustry', message: '请输入相关行业' }
  }
  if (!String(form.region || '').trim()) {
    return { field: 'region', message: '请选择指定区域' }
  }
  if (!Array.isArray(form.jobIds) || form.jobIds.length === 0) {
    return { field: 'jobIds', message: '请至少选择一个分析岗位' }
  }
  if (form.jobIds.length > 10) {
    return { field: 'jobIds', message: '最多选择 10 个分析岗位' }
  }
  if (form.creationMode === 'template' && !String(form.templateId || '').trim()) {
    return { field: 'templateId', message: '请选择报告模板' }
  }
  return null
}

const buildTocRows = (items, createId) =>
  items.map((item) => ({
    id: createId(),
    title: item.title,
    children: buildTocRows(item.children || [], createId),
  }))

export const createReportTocForMode = ({
  creationMode,
  templateId,
  templates,
  createId,
}) => {
  if (creationMode === 'custom') {
    return [{ id: createId(), title: '新增章节', children: [] }]
  }
  const template = templates.find((item) => item.id === templateId)
  if (!template) return []
  return buildTocRows(template.toc || [], createId)
}

export const findEmptyReportTocTitle = (rows) => {
  for (const row of rows) {
    if (!String(row.title || '').trim()) return row.id
    const childId = findEmptyReportTocTitle(row.children || [])
    if (childId) return childId
  }
  return null
}

export const buildDynamicReportContent = ({
  baseHtml,
  form,
  jobNames,
  referenceFileCount,
  generatedDate,
}) => {
  const title = escapeHtml(form.title)
  const major = escapeHtml(form.major || '未指定专业')
  const industry = escapeHtml(form.relatedIndustry)
  const region = escapeHtml(form.region)
  const jobs = escapeHtml(jobNames.join('、'))
  const subtitle = `报告类型：${reportKindLabel(form.reportKind)} ｜ 专业：${major} ｜ 相关行业：${industry} ｜ 分析区域：${region} ｜ 生成日期：${escapeHtml(generatedDate)}`
  const scope = `<section class="report-scope-summary"><h2>报告生成范围</h2><p>本报告采用${creationModeLabel(form.creationMode)}方式生成，重点分析岗位包括：${jobs}。</p><p>本次生成使用参考文件 ${Number(referenceFileCount) || 0} 个。</p></section>`

  let html = String(baseHtml || '')
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${title}</h1>`)
    .replace(
      /<p class="report-doc-subtitle">[\s\S]*?<\/p>/,
      `<p class="report-doc-subtitle">${subtitle}</p>`,
    )

  const firstH2Index = html.indexOf('<h2>')
  if (firstH2Index >= 0) {
    html = `${html.slice(0, firstH2Index)}${scope}${html.slice(firstH2Index)}`
  } else {
    html += scope
  }
  return html
}
```

Create `src/utils/report-generation.d.ts`:

```ts
import type {
  ReportCreationMode,
  ReportForm,
  ReportTemplate,
  ReportTocItem,
} from '../mock/research-report'

export interface ReportValidationError {
  field: keyof ReportForm
  message: string
}

export interface ReportTocEditorNode {
  id: string
  title: string
  children: ReportTocEditorNode[]
}

export function validateReportForm(form: ReportForm): ReportValidationError | null

export function createReportTocForMode(options: {
  creationMode: ReportCreationMode
  templateId: string
  templates: ReportTemplate[]
  createId: () => string
}): ReportTocEditorNode[]

export function findEmptyReportTocTitle(rows: ReportTocEditorNode[]): string | null

export function buildDynamicReportContent(options: {
  baseHtml: string
  form: ReportForm
  jobNames: string[]
  referenceFileCount: number
  generatedDate: string
}): string

export type { ReportTocItem }
```

- [ ] **Step 5: Keep current Vue assignments compatible with the expanded form**

Add `major-construction-platform/src/App.vue` to this task's modified files. Keep the existing internal `type` field and replace the current partial assignment in `editReport` with a default-backed assignment:

```ts
reportForm.value = {
  ...REPORT_DEFAULT_FORM,
  title: report.title,
  type: report.type,
  industry: report.industry,
  region: report.region,
  reportKind: report.reportKind,
  major: report.major,
  relatedIndustry: report.relatedIndustry,
  jobIds: [...report.jobIds],
  creationMode: report.creationMode,
  templateId: report.templateId,
}
```

This compatibility edit keeps the application type-correct before the complete edit/preview loading behavior is implemented in Task 4.

- [ ] **Step 6: Run the utility tests and build**

Run:

```bash
cd major-construction-platform
node --test tests/report-generation.test.mjs
npm run build
```

Expected: all four utility tests PASS; production build PASS.

- [ ] **Step 7: Commit the domain layer**

```bash
git add major-construction-platform/src/mock/research-report.ts \
  major-construction-platform/src/utils/report-generation.js \
  major-construction-platform/src/utils/report-generation.d.ts \
  major-construction-platform/src/App.vue \
  major-construction-platform/tests/report-generation.test.mjs
git commit -m "feat: add report creation domain model"
```

---

### Task 2: Build the expanded Vue parameter step and validation

**Files:**
- Modify: `major-construction-platform/src/App.vue:30-55`
- Modify: `major-construction-platform/src/App.vue:420-475`
- Modify: `major-construction-platform/src/App.vue:2355-2375`
- Modify: `major-construction-platform/src/App.vue:4110-4220`
- Modify: `major-construction-platform/src/App.vue:9260-9365`
- Modify: `major-construction-platform/tests/results-portal.test.mjs:611-638`

**Interfaces:**
- Consumes: Task 1 report types/constants, `validateReportForm`, and `RESEARCH_JOB_CANDIDATES`.
- Produces:
  - `reportCreateValidation: Ref<ReportValidationError | null>`
  - `availableReportTemplates: ComputedRef<ReportTemplate[]>`
  - `selectedReportJobs: ComputedRef<ResearchJobCandidate[]>`
  - `toggleReportJob(jobId: string): void`
  - expanded step-one DOM contract used by the static parity task.

- [ ] **Step 1: Write failing Vue structure tests**

Replace the current `Vue report creation uses a validated three-step wizard` test body with:

```js
test('Vue report creation captures the full analysis scope', () => {
  assert.match(appVue, /const reportCreateValidation = ref<ReportValidationError \| null>\(null\)/)
  assert.match(appVue, /validateReportForm\(reportForm\.value\)/)
  assert.match(appVue, /const selectedReportJobs = computed\(\(\) =>/)
  assert.match(appVue, /const toggleReportJob = \(jobId: string\) =>/)
  assert.match(appVue, /reportForm\.value\.jobIds\.length >= 10/)
  assert.match(appVue, />专业报告</)
  assert.match(appVue, />行业报告</)
  assert.match(appVue, />选择专业</)
  assert.match(appVue, />相关行业</)
  assert.match(appVue, />选择指定区域</)
  assert.match(appVue, />选择分析岗位</)
  assert.match(appVue, />创建方式</)
  assert.match(appVue, />按模板创建</)
  assert.match(appVue, />自定义</)
  assert.match(appVue, />报告模板</)
  assert.match(appVue, /最多选择 10 个/)
  assert.match(appVue, /class="report-field-error"/)
})

test('Vue report wizard keeps the existing three-step contract', () => {
  assert.match(appVue, /type ReportCreateStep = 1 \| 2 \| 3/)
  assert.match(appVue, /label: '参数配置'/)
  assert.match(appVue, /label: '目录调整'/)
  assert.match(appVue, /label: '报告生成'/)
  assert.match(appVue, /AI 开始生成报告/)
  assert.doesNotMatch(appVue, /选择报告维度/)
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report creation captures|Vue report wizard keeps" tests/results-portal.test.mjs
```

Expected: the full-scope test FAILS because the new fields and validation state do not exist; the three-step contract test PASSES.

- [ ] **Step 3: Import the new domain and utility contracts**

Update the report import in `src/App.vue`:

```ts
import {
  REPORT_DEFAULT_FORM,
  REPORT_DEFAULT_MAJOR,
  REPORT_KIND_OPTIONS,
  REPORT_MAJOR_OPTIONS,
  REPORT_REGION_OPTIONS,
  REPORTS,
  REPORT_CONTENT,
  REPORT_INDUSTRY_OPTIONS,
  REPORT_TEMPLATES,
  type ResearchReportItem,
  type ReportForm,
  type ReportTemplate,
  type ReportTocItem,
} from './mock/research-report'
import {
  buildDynamicReportContent,
  createReportTocForMode,
  findEmptyReportTocTitle,
  validateReportForm,
  type ReportValidationError,
} from './utils/report-generation'
```

- [ ] **Step 4: Replace the Vue form state and add derived selections**

Use:

```ts
const reportForm = ref<ReportForm>({
  ...REPORT_DEFAULT_FORM,
  jobIds: [...REPORT_DEFAULT_FORM.jobIds],
})
const reportCreateValidation = ref<ReportValidationError | null>(null)

const availableReportTemplates = computed<ReportTemplate[]>(() =>
  REPORT_TEMPLATES.filter((template) => template.reportKind === reportForm.value.reportKind)
)
const selectedReportJobs = computed(() =>
  RESEARCH_JOB_CANDIDATES.filter((job) => reportForm.value.jobIds.includes(job.id))
)
const reportFieldError = (field: keyof ReportForm) =>
  reportCreateValidation.value?.field === field
    ? reportCreateValidation.value.message
    : ''

const toggleReportJob = (jobId: string) => {
  const selected = reportForm.value.jobIds.includes(jobId)
  if (selected) {
    reportForm.value.jobIds = reportForm.value.jobIds.filter((id) => id !== jobId)
  } else if (reportForm.value.jobIds.length < 10) {
    reportForm.value.jobIds = [...reportForm.value.jobIds, jobId]
  } else {
    reportCreateValidation.value = {
      field: 'jobIds',
      message: '最多选择 10 个分析岗位',
    }
    return
  }
  if (reportCreateValidation.value?.field === 'jobIds') {
    reportCreateValidation.value = null
  }
}
```

Remove the legacy `reportCreateError` ref and all comparisons against its string value. Field-local rendering must use `reportCreateValidation` through `reportFieldError`.

Watch the report kind so incompatible template selection is replaced with the first compatible template:

```ts
watch(
  () => reportForm.value.reportKind,
  (kind) => {
    if (kind === 'professional' && !reportForm.value.major) {
      reportForm.value.major = REPORT_DEFAULT_MAJOR
    }
    const firstTemplate = REPORT_TEMPLATES.find((item) => item.reportKind === kind)
    reportForm.value.templateId = firstTemplate?.id ?? ''
  }
)
```

- [ ] **Step 5: Replace validation and new-report reset**

Use:

```ts
const validateReportParameters = () => {
  reportCreateValidation.value = validateReportForm(reportForm.value)
  return reportCreateValidation.value === null
}

const openReportCreate = () => {
  currentJobSection.value = '报告生成'
  currentReportView.value = 'create'
  activeReportId.value = 0
  reportCreateStep.value = 1
  reportCreateMaxStep.value = 1
  reportCreateValidation.value = null
  reportReferenceFiles.value = []
  reportGenerationPending.value = false
  reportForm.value = {
    ...REPORT_DEFAULT_FORM,
    industry: activeIndustryChainLabel.value,
    relatedIndustry: activeIndustryChainLabel.value.replace(/产业链$/, ''),
    jobIds: [],
  }
  reportEditorContent.value = REPORT_CONTENT
}
```

- [ ] **Step 6: Replace the first-step Vue markup**

Inside `reportCreateStep === 1`, render:

```vue
<section class="research-card report-form-card report-parameter-card">
  <div class="research-card-head">
    <div>
      <h3>基本参数</h3>
      <span>设置报告对象、数据范围与创建方式</span>
    </div>
  </div>
  <div class="report-parameter-grid">
    <label class="report-field report-field-wide">
      <span>报告名称</span>
      <input
        v-model="reportForm.title"
        :aria-invalid="Boolean(reportFieldError('title'))"
      />
      <small v-if="reportFieldError('title')" class="report-field-error">
        {{ reportFieldError('title') }}
      </small>
    </label>

    <fieldset class="report-field report-field-wide report-segmented-field">
      <legend>报告类型</legend>
      <div class="report-segmented-options">
        <label v-for="option in REPORT_KIND_OPTIONS" :key="option.value">
          <input v-model="reportForm.reportKind" type="radio" :value="option.value" />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </fieldset>

    <label class="report-field">
      <span>选择专业</span>
      <select
        v-model="reportForm.major"
        :aria-invalid="Boolean(reportFieldError('major'))"
      >
        <option value="">不指定专业</option>
        <option v-for="major in REPORT_MAJOR_OPTIONS" :key="major">{{ major }}</option>
      </select>
      <small v-if="reportFieldError('major')" class="report-field-error">
        {{ reportFieldError('major') }}
      </small>
    </label>

    <label class="report-field">
      <span>相关行业</span>
      <input
        v-model="reportForm.relatedIndustry"
        :aria-invalid="Boolean(reportFieldError('relatedIndustry'))"
      />
      <small v-if="reportFieldError('relatedIndustry')" class="report-field-error">
        {{ reportFieldError('relatedIndustry') }}
      </small>
    </label>

    <label class="report-field">
      <span>选择指定区域</span>
      <select v-model="reportForm.region">
        <option value="">请选择</option>
        <option v-for="region in REPORT_REGION_OPTIONS" :key="region">{{ region }}</option>
      </select>
      <small v-if="reportFieldError('region')" class="report-field-error">
        {{ reportFieldError('region') }}
      </small>
    </label>

    <fieldset class="report-field report-field-wide report-job-field">
      <legend>选择分析岗位</legend>
      <div class="report-job-field-head">
        <span>从岗位库选择，最多选择 10 个</span>
        <strong>{{ reportForm.jobIds.length }} / 10</strong>
      </div>
      <div class="report-job-options">
        <label v-for="job in RESEARCH_JOB_CANDIDATES" :key="job.id">
          <input
            type="checkbox"
            :checked="reportForm.jobIds.includes(job.id)"
            :disabled="!reportForm.jobIds.includes(job.id) && reportForm.jobIds.length >= 10"
            @change="toggleReportJob(job.id)"
          />
          <span><strong>{{ job.name }}</strong><em>{{ job.groupName }}</em></span>
        </label>
      </div>
      <small v-if="reportFieldError('jobIds')" class="report-field-error">
        {{ reportFieldError('jobIds') }}
      </small>
    </fieldset>

    <fieldset class="report-field report-field-wide report-segmented-field">
      <legend>创建方式</legend>
      <div class="report-segmented-options">
        <label>
          <input v-model="reportForm.creationMode" type="radio" value="custom" />
          <span>自定义</span>
        </label>
        <label>
          <input v-model="reportForm.creationMode" type="radio" value="template" />
          <span>按模板创建</span>
        </label>
      </div>
    </fieldset>

    <label v-if="reportForm.creationMode === 'template'" class="report-field report-field-wide">
      <span>报告模板</span>
      <select v-model="reportForm.templateId">
        <option
          v-for="template in availableReportTemplates"
          :key="template.id"
          :value="template.id"
        >
          {{ template.name }}
        </option>
      </select>
      <em class="report-field-hint">
        {{ availableReportTemplates.find((item) => item.id === reportForm.templateId)?.description }}
      </em>
      <small v-if="reportFieldError('templateId')" class="report-field-error">
        {{ reportFieldError('templateId') }}
      </small>
    </label>

    <label class="report-field report-field-wide">
      <span>参考文件上传</span>
      <span class="report-file-control">
        <input class="report-file-input" type="file" multiple @change="setReportReferenceFiles" />
        <span class="report-file-trigger">
          <span class="report-file-icon" aria-hidden="true">↑</span>选择文件
        </span>
        <em class="report-file-summary">
          {{ reportReferenceFiles.length ? `已选择 ${reportReferenceFiles.length} 个文件` : '未选择文件' }}
        </em>
      </span>
    </label>
  </div>
</section>
<p
  v-if="reportCreateValidation"
  class="report-wizard-error"
  role="alert"
>
  {{ reportCreateValidation.message }}
</p>
```

- [ ] **Step 7: Run focused tests and type-check**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report creation captures|Vue report wizard keeps" tests/results-portal.test.mjs
npx vue-tsc -b
```

Expected: focused tests PASS; type-check PASS.

- [ ] **Step 8: Commit the Vue parameter step**

```bash
git add major-construction-platform/src/App.vue \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: expand report parameter scope"
```

---

### Task 3: Implement Vue TOC initialization, overwrite confirmation, and TOC validation

**Files:**
- Modify: `major-construction-platform/src/App.vue:448-470`
- Modify: `major-construction-platform/src/App.vue:4195-4310`
- Modify: `major-construction-platform/src/App.vue:9350-9365`
- Modify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: `createReportTocForMode`, `findEmptyReportTocTitle`, `REPORT_TEMPLATES`.
- Produces:
  - `reportTocSource: Ref<{ creationMode; templateId } | null>`
  - `reportTocDirty: Ref<boolean>`
  - `initializeReportTocFromForm(): boolean`
  - `validateReportToc(): boolean`

- [ ] **Step 1: Write failing TOC behavior tests**

Add:

```js
test('Vue report TOC follows creation mode and protects modified content', () => {
  assert.match(appVue, /const reportTocSource = ref</)
  assert.match(appVue, /const reportTocDirty = ref\(false\)/)
  assert.match(appVue, /createReportTocForMode\(\{/)
  assert.match(appVue, /window\.confirm\('当前目录已修改，切换创建方式或模板将覆盖现有目录。是否继续？'\)/)
  assert.match(appVue, /findEmptyReportTocTitle\(reportTocRows\.value\)/)
  assert.match(appVue, /目录标题不能为空/)
  assert.match(appVue, /reportTocDirty\.value = true/)
  assert.match(appVue, /自定义目录/)
  assert.match(appVue, /当前模板/)
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report TOC follows" tests/results-portal.test.mjs
```

Expected: FAIL because TOC source and dirty tracking are absent.

- [ ] **Step 3: Add TOC source state and initialization**

Add near the report state:

```ts
type ReportTocSource = Pick<ReportForm, 'creationMode' | 'templateId'>

const reportTocSource = ref<ReportTocSource | null>(null)
const reportTocDirty = ref(false)
const reportTocError = ref('')

const currentReportTocSource = (): ReportTocSource => ({
  creationMode: reportForm.value.creationMode,
  templateId: reportForm.value.creationMode === 'template'
    ? reportForm.value.templateId
    : '',
})

const sameReportTocSource = (
  first: ReportTocSource | null,
  second: ReportTocSource,
) =>
  first?.creationMode === second.creationMode
  && first?.templateId === second.templateId

const initializeReportTocFromForm = () => {
  const nextSource = currentReportTocSource()
  if (sameReportTocSource(reportTocSource.value, nextSource)) return true

  if (
    reportTocSource.value
    && reportTocDirty.value
    && !window.confirm('当前目录已修改，切换创建方式或模板将覆盖现有目录。是否继续？')
  ) {
    reportForm.value.creationMode = reportTocSource.value.creationMode
    reportForm.value.templateId = reportTocSource.value.templateId
    return false
  }

  reportTocRows.value = createReportTocForMode({
    creationMode: nextSource.creationMode,
    templateId: nextSource.templateId,
    templates: REPORT_TEMPLATES,
    createId: createReportTocId,
  })
  reportTocSource.value = nextSource
  reportTocDirty.value = false
  reportTocError.value = ''
  return true
}

const validateReportToc = () => {
  const invalidId = findEmptyReportTocTitle(reportTocRows.value)
  if (invalidId) {
    reportTocError.value = '目录标题不能为空'
    nextTick(() => {
      document.querySelector<HTMLInputElement>(
        `[data-report-toc-id="${invalidId}"]`,
      )?.focus()
    })
    return false
  }
  reportTocError.value = ''
  return true
}
```

Change step progression:

```ts
const goToNextReportCreateStep = () => {
  if (reportCreateStep.value === 1) {
    if (!validateReportParameters() || !initializeReportTocFromForm()) return
    reportCreateMaxStep.value = Math.max(reportCreateMaxStep.value, 2) as ReportCreateStep
    reportCreateStep.value = 2
    return
  }
  if (reportCreateStep.value === 2 && validateReportToc()) {
    reportCreateMaxStep.value = 3
    reportCreateStep.value = 3
  }
}
```

- [ ] **Step 4: Mark every TOC mutation as dirty**

At the end of `addReportTocChapter`, `removeReportTocNode`, `updateReportTocTitle`, `addReportTocChild`, and `removeReportTocChild`, add:

```ts
reportTocDirty.value = true
reportTocError.value = ''
```

Reset `reportTocSource`, `reportTocDirty`, and `reportTocError` in `openReportCreate`.

- [ ] **Step 5: Expose TOC source and errors in the second step**

Update the directory header:

```vue
<div class="research-card-head report-card-head">
  <div>
    <h3>目录结构</h3>
    <span v-if="reportTocSource?.creationMode === 'template'">
      当前模板：{{ REPORT_TEMPLATES.find((item) => item.id === reportTocSource?.templateId)?.name }}
    </span>
    <span v-else>自定义目录</span>
  </div>
  <button class="secondary-action compact" @click="addReportTocChapter">＋ 新增章</button>
</div>
```

Add `:data-report-toc-id="toc.id"` to every TOC input, using `child.id` and `grandchild.id` for nested rows. Render:

```vue
<p v-if="reportTocError" class="report-wizard-error" role="alert">
  {{ reportTocError }}
</p>
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report TOC follows" tests/results-portal.test.mjs
npx vue-tsc -b
```

Expected: test PASS; type-check PASS.

- [ ] **Step 7: Commit Vue TOC behavior**

```bash
git add major-construction-platform/src/App.vue \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: initialize report directories by mode"
```

---

### Task 4: Complete Vue confirmation, generation, catalog lifecycle, and exports

**Files:**
- Modify: `major-construction-platform/src/App.vue:2355-2375`
- Modify: `major-construction-platform/src/App.vue:4110-4405`
- Modify: `major-construction-platform/src/App.vue:9260-9410`
- Modify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: expanded `ResearchReportItem`, `buildDynamicReportContent`, selected jobs, serialized TOC.
- Produces:
  - full confirmation summary.
  - exactly one generated draft record.
  - first-save transition from `draft` to `done`.
  - expanded ADS metadata.
  - retryable generation error UI.

- [ ] **Step 1: Write failing lifecycle and confirmation tests**

Add:

```js
test('Vue report confirmation and lifecycle persist the full generation scope', () => {
  assert.match(appVue, />分析范围</)
  assert.match(appVue, /selectedReportJobs/)
  assert.match(appVue, /reportForm\.creationMode === 'template'/)
  assert.match(appVue, /referenceFileCount: reportReferenceFiles\.value\.length/)
  assert.match(appVue, /toc: serializeReportToc\(reportTocRows\.value\)/)
  assert.match(appVue, /buildDynamicReportContent\(\{/)
  assert.match(appVue, /status: 'draft'/)
  assert.match(appVue, /status: 'done'/)
  assert.match(appVue, /if \(activeReportId\.value === 0\)/)
  assert.match(appVue, /reportGenerationError/)
  assert.match(appVue, />重新生成</)
  assert.match(appVue, />返回配置</)
  assert.match(appVue, /creationMode: activeReport/)
  assert.match(appVue, /jobIds: activeReport/)
  assert.match(appVue, /referenceFileCount:/)
})
```

- [ ] **Step 2: Run the lifecycle test and verify failure**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report confirmation and lifecycle" tests/results-portal.test.mjs
```

Expected: FAIL because the expanded confirmation and persistence fields are absent.

- [ ] **Step 3: Restore full configuration when editing or previewing**

Add a shared loader and use it from both `editReport` and `previewReport`:

```ts
const loadReportConfiguration = (report: ResearchReportItem) => {
  activeReportId.value = report.id
  reportForm.value = {
    title: report.title,
    type: report.type,
    reportKind: report.reportKind,
    major: report.major,
    industry: report.industry,
    relatedIndustry: report.relatedIndustry,
    region: report.region,
    jobIds: [...report.jobIds],
    creationMode: report.creationMode,
    templateId: report.templateId,
  }
  reportTocRows.value = buildReportTocRows(report.toc)
  reportTocSource.value = {
    creationMode: report.creationMode,
    templateId: report.templateId,
  }
  reportTocDirty.value = false
  reportEditorContent.value = buildDynamicReportContent({
    baseHtml: REPORT_CONTENT,
    form: reportForm.value,
    jobNames: selectedReportJobs.value.map((job) => job.name),
    referenceFileCount: report.referenceFileCount,
    generatedDate: report.date,
  })
}

const editReport = (report: ResearchReportItem) => {
  loadReportConfiguration(report)
  currentReportView.value = 'editor'
}

const previewReport = (report?: ResearchReportItem) => {
  if (report) loadReportConfiguration(report)
  currentReportView.value = 'preview'
}
```

- [ ] **Step 4: Create one draft after successful generation**

Add:

```ts
const reportGenerationError = ref('')

const formatReportDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const createGeneratedReportDraft = () => {
  if (activeReportId.value !== 0) return
  const nextId = Math.max(...reportRows.value.map((item) => item.id), 0) + 1
  const report: ResearchReportItem = {
    id: nextId,
    ...reportForm.value,
    jobIds: [...reportForm.value.jobIds],
    date: formatReportDate(),
    status: 'draft',
    referenceFileCount: reportReferenceFiles.value.length,
    toc: serializeReportToc(reportTocRows.value),
  }
  reportRows.value = [report, ...reportRows.value]
  activeReportId.value = nextId
}

const generateReportPreview = () => {
  if (reportGenerationPending.value) return
  reportGenerationPending.value = true
  reportGenerationError.value = ''
  currentReportView.value = 'generating'
  window.setTimeout(() => {
    try {
      reportEditorContent.value = buildDynamicReportContent({
        baseHtml: REPORT_CONTENT,
        form: reportForm.value,
        jobNames: selectedReportJobs.value.map((job) => job.name),
        referenceFileCount: reportReferenceFiles.value.length,
        generatedDate: formatReportDate(),
      })
      createGeneratedReportDraft()
      currentReportView.value = 'editor'
    } catch {
      reportGenerationError.value = '报告生成失败，请重试或返回配置检查参数。'
    } finally {
      reportGenerationPending.value = false
    }
  }, 900)
}
```

In the generating template, branch on `reportGenerationError`:

```vue
<section v-if="reportGenerationError" class="research-card report-generating-card report-generation-error">
  <div class="report-loading-mark">!</div>
  <h3>报告生成失败</h3>
  <p>{{ reportGenerationError }}</p>
  <div class="report-generation-error-actions">
    <button class="primary-action compact" @click="generateReportPreview">重新生成</button>
    <button class="secondary-action" @click="returnToReportCreate">返回配置</button>
  </div>
</section>
```

- [ ] **Step 5: Mark the report complete on save and preserve copied configuration**

Extend `saveReport`:

```ts
reportRows.value = reportRows.value.map((report) =>
  report.id === activeReportId.value
    ? {
        ...report,
        status: 'done',
        toc: serializeReportToc(reportTocRows.value),
      }
    : report
)
```

`copyReport` already spreads the complete record. Keep the spread and ensure nested data is copied:

```ts
jobIds: [...report.jobIds],
toc: report.toc.map((item) => structuredClone(item)),
```

- [ ] **Step 6: Expand filtering, catalog labels, confirmation, and ADS metadata**

Search with:

```ts
const selectedJobNamesForReport = (report: ResearchReportItem) =>
  RESEARCH_JOB_CANDIDATES
    .filter((job) => report.jobIds.includes(job.id))
    .map((job) => job.name)

const filteredReportRows = computed(() => {
  const keyword = reportSearchText.value.trim().toLowerCase()
  const chainKeyword = activeIndustryChainLabel.value.toLowerCase()
  return reportRows.value.filter((report) => {
    const haystack = [
      report.title,
      report.reportKind === 'industry' ? '行业报告' : '专业报告',
      report.industry,
      report.relatedIndustry,
      report.region,
      report.major,
      ...selectedJobNamesForReport(report),
    ].join(' ').toLowerCase()
    return report.industry.toLowerCase() === chainKeyword
      && (!keyword || haystack.includes(keyword))
  })
})
```

In the report table, render the kind and creation mode:

```vue
<td>
  <span class="report-type-tag">
    {{ report.reportKind === 'industry' ? '行业报告' : '专业报告' }}
  </span>
  <span class="report-mode-tag">
    {{ report.creationMode === 'template' ? '模板' : '自定义' }}
  </span>
</td>
```

Add an “分析范围” card on step three:

```vue
<section class="research-card report-confirm-card">
  <div class="research-card-head"><h3>分析范围</h3></div>
  <p>已选择 {{ selectedReportJobs.length }} 个分析岗位</p>
  <div class="report-summary-tags">
    <span v-for="job in selectedReportJobs" :key="job.id">{{ job.name }}</span>
  </div>
</section>
```

Replace the report information summary with:

```vue
<section class="research-card report-confirm-card">
  <div class="research-card-head"><h3>报告信息</h3></div>
  <dl class="report-summary-list">
    <div><dt>报告名称</dt><dd>{{ reportForm.title }}</dd></div>
    <div><dt>报告类型</dt><dd>{{ reportForm.reportKind === 'industry' ? '行业报告' : '专业报告' }}</dd></div>
    <div><dt>专业</dt><dd>{{ reportForm.major || '未指定' }}</dd></div>
    <div><dt>相关行业</dt><dd>{{ reportForm.relatedIndustry }}</dd></div>
    <div><dt>指定区域</dt><dd>{{ reportForm.region }}</dd></div>
    <div>
      <dt>创建方式</dt>
      <dd>
        {{ reportForm.creationMode === 'template'
          ? `按模板创建 · ${availableReportTemplates.find((item) => item.id === reportForm.templateId)?.name ?? ''}`
          : '自定义' }}
      </dd>
    </div>
    <div><dt>参考文件</dt><dd>{{ reportReferenceFiles.length }} 个文件</dd></div>
  </dl>
</section>
```

Expand ADS `metadata`:

```ts
reportKind: activeReport?.reportKind ?? reportForm.value.reportKind,
major: activeReport?.major ?? reportForm.value.major,
relatedIndustry: activeReport?.relatedIndustry ?? reportForm.value.relatedIndustry,
region: activeReport?.region ?? reportForm.value.region,
jobIds: activeReport?.jobIds ?? reportForm.value.jobIds,
jobNames: selectedReportJobs.value.map((job) => job.name),
creationMode: activeReport?.creationMode ?? reportForm.value.creationMode,
templateId: activeReport?.templateId ?? reportForm.value.templateId,
referenceFileCount: activeReport?.referenceFileCount ?? reportReferenceFiles.value.length,
```

- [ ] **Step 7: Run focused tests and build**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report confirmation and lifecycle|report page starts|report reference files" tests/results-portal.test.mjs
npm run build
```

Expected: focused tests PASS; production build PASS.

- [ ] **Step 8: Commit the Vue lifecycle**

```bash
git add major-construction-platform/src/App.vue \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: persist generated report drafts"
```

---

### Task 5: Mirror parameters, jobs, templates, and TOC behavior in the static entry

**Files:**
- Modify: `major-construction-platform/index.html:1890-2050`
- Modify: `major-construction-platform/index.html:3920-4060`
- Modify: `major-construction-platform/index.html:7000-7090`
- Modify: `major-construction-platform/index.html:7560-7780`
- Modify: `major-construction-platform/tests/results-portal.test.mjs:497-610`

**Interfaces:**
- Consumes: static `staticJobs`, report template shapes, and the Vue DOM/copy contract from Tasks 2–3.
- Produces: VM-testable static parameter and TOC state machine with the same validation messages and limits.

- [ ] **Step 1: Expand the static VM test harness**

In `static report navigation renders library and creation states without errors`, add `confirm()` and richer input stubs:

```js
let confirmCalls = 0
const sandbox = {
  // existing entries
  window: {
    // existing entries
    confirm() {
      confirmCalls += 1
      return true
    },
  },
}
```

After clicking “new”, assert:

```js
assert.match(app.innerHTML, /专业报告/)
assert.match(app.innerHTML, /行业报告/)
assert.match(app.innerHTML, /选择专业/)
assert.match(app.innerHTML, /相关行业/)
assert.match(app.innerHTML, /选择指定区域/)
assert.match(app.innerHTML, /选择分析岗位/)
assert.match(app.innerHTML, /0 \/ 10/)
assert.match(app.innerHTML, /按模板创建/)
assert.match(app.innerHTML, /专业分析报告模板/)
```

Before `nextToToc`, simulate selecting one job:

```js
const jobToggle = new FakeElement()
jobToggle.closest = (selector) => {
  if (selector === '[data-report-job]') {
    return { dataset: { reportJob: 'job-bim-deepening' } }
  }
  return null
}
jobToggle.matches = () => false
assert.doesNotThrow(() => clickHandler({ target: jobToggle }))
assert.match(app.innerHTML, /1 \/ 10/)
```

After `nextToToc`, assert:

```js
assert.match(app.innerHTML, /当前模板：专业分析报告模板/)
```

- [ ] **Step 2: Run the static navigation test and verify failure**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="static report navigation renders" tests/results-portal.test.mjs
```

Expected: FAIL because static report form and job interaction use the legacy shape.

- [ ] **Step 3: Replace static report state and template configuration**

Define:

```js
const staticReportKindOptions = [
  ['professional', '专业报告'],
  ['industry', '行业报告'],
]
const staticReportMajorOptions = [
  '智能建造工程专业',
  '建筑工程技术专业',
  '建设工程管理专业',
]
const staticReportRegionOptions = ['全国', '辽宁省', '京津冀', '东北', '华北', '东北 / 华北']
const staticReportJobOptions = staticJobs.map(({ id, name, groupName }) => ({
  id,
  name,
  groupName,
}))
const staticIndustryReportTocSeed = [
  { title: '行业发展概况', children: [{ title: '行业定义与研究范围' }, { title: '行业规模与发展阶段' }, { title: '政策环境与发展趋势' }] },
  { title: '区域产业与企业分析', children: [{ title: '区域产业布局' }, { title: '重点企业与业务方向' }, { title: '产业链协同关系' }] },
  { title: '岗位需求与能力分析', children: [{ title: '核心岗位需求' }, { title: '典型工作任务' }, { title: '知识技能素养要求' }] },
  { title: '技术变革与人才培养建议', children: [{ title: '新技术新工艺影响' }, { title: '人才培养方向建议' }, { title: '课程与实践项目建议' }] },
  { title: '数据来源说明', children: [] },
]
const staticReportTemplates = [
  { id: 'professional-analysis', name: '专业分析报告模板', reportKind: 'professional', toc: reportTocSeed },
  { id: 'industry-analysis', name: '行业分析报告模板', reportKind: 'industry', toc: staticIndustryReportTocSeed },
]
let staticReportForm = {
  title: '智能建造工程专业产业调研报告',
  type: reportTypeOptions[0],
  reportKind: 'professional',
  major: staticReportMajorOptions[0],
  industry: staticSelectedIndustryChain,
  relatedIndustry: '智能建造',
  region: '东北 / 华北',
  jobIds: [],
  creationMode: 'template',
  templateId: 'professional-analysis',
}
let staticReportTocSource = null
let staticReportTocDirty = false
let staticReportTocError = ''
```

Expand every `reportRowsSeed` entry with `reportKind`, `relatedIndustry`, `jobIds`, `creationMode`, `templateId`, `referenceFileCount`, and `toc`. Use the same professional/industry mapping and job ids as the Vue `REPORTS` seeds while retaining the legacy `type` string.

- [ ] **Step 4: Replace static validation and TOC initialization**

Use:

```js
const validateStaticReportParameters = () => {
  const checks = [
    [!staticReportForm.title.trim(), 'title', '请输入报告名称'],
    [staticReportForm.reportKind === 'professional' && !staticReportForm.major, 'major', '请选择专业'],
    [!staticReportForm.relatedIndustry.trim(), 'relatedIndustry', '请输入相关行业'],
    [!staticReportForm.region, 'region', '请选择指定区域'],
    [staticReportForm.jobIds.length === 0, 'jobIds', '请至少选择一个分析岗位'],
    [staticReportForm.jobIds.length > 10, 'jobIds', '最多选择 10 个分析岗位'],
    [staticReportForm.creationMode === 'template' && !staticReportForm.templateId, 'templateId', '请选择报告模板'],
  ]
  const invalid = checks.find(([condition]) => condition)
  staticReportValidationError = invalid
    ? { field: invalid[1], message: invalid[2] }
    : null
  return staticReportValidationError === null
}

const staticCurrentTocSource = () => ({
  creationMode: staticReportForm.creationMode,
  templateId: staticReportForm.creationMode === 'template'
    ? staticReportForm.templateId
    : '',
})
const sameStaticTocSource = (first, second) =>
  first?.creationMode === second.creationMode
  && first?.templateId === second.templateId

const initializeStaticReportToc = () => {
  const nextSource = staticCurrentTocSource()
  if (sameStaticTocSource(staticReportTocSource, nextSource)) return true
  if (
    staticReportTocSource
    && staticReportTocDirty
    && !window.confirm('当前目录已修改，切换创建方式或模板将覆盖现有目录。是否继续？')
  ) {
    staticReportForm.creationMode = staticReportTocSource.creationMode
    staticReportForm.templateId = staticReportTocSource.templateId
    return false
  }
  const template = staticReportTemplates.find((item) => item.id === nextSource.templateId)
  reportToc = nextSource.creationMode === 'custom'
    ? [{ id: createReportTocId(), title: '新增章节', children: [] }]
    : cloneReportToc(template?.toc || [])
  staticReportTocSource = nextSource
  staticReportTocDirty = false
  staticReportTocError = ''
  return true
}

const findStaticEmptyTocTitle = (rows) => {
  for (const row of rows) {
    if (!String(row.title || '').trim()) return row.id
    const childId = findStaticEmptyTocTitle(row.children || [])
    if (childId) return childId
  }
  return ''
}
```

Step-one next must call `validateStaticReportParameters()` and `initializeStaticReportToc()`. Step-two next must block when `findStaticEmptyTocTitle(reportToc)` returns an id.

- [ ] **Step 5: Render the complete static parameter form**

Mirror the Vue labels and use stable data attributes:

```html
data-report-kind
data-report-major
data-report-related-industry
data-report-region
data-report-job
data-report-creation-mode
data-report-template
```

The job options are buttons:

```js
const jobPicker = `<div class="report-job-options">${staticReportJobOptions.map((job) => {
  const checked = staticReportForm.jobIds.includes(job.id)
  const disabled = !checked && staticReportForm.jobIds.length >= 10
  return `<button type="button" class="${checked ? 'selected' : ''}" data-report-job="${job.id}" aria-pressed="${checked}" ${disabled ? 'disabled' : ''}><strong>${escapeText(job.name)}</strong><em>${escapeText(job.groupName)}</em></button>`
}).join('')}</div>`
```

Render field-local errors by comparing `staticReportValidationError?.field` and outputting:

```js
`<small class="report-field-error">${escapeText(staticReportValidationError.message)}</small>`
```

- [ ] **Step 6: Add static click/change handlers**

Job click:

```js
const reportJob = target.closest('[data-report-job]')
if (reportJob) {
  const jobId = reportJob.dataset.reportJob
  if (staticReportForm.jobIds.includes(jobId)) {
    staticReportForm.jobIds = staticReportForm.jobIds.filter((id) => id !== jobId)
  } else if (staticReportForm.jobIds.length < 10) {
    staticReportForm.jobIds = [...staticReportForm.jobIds, jobId]
  } else {
    staticReportValidationError = { field: 'jobIds', message: '最多选择 10 个分析岗位' }
  }
  renderReport('create')
  return
}
```

Change handlers:

```js
if (target.matches('[data-report-kind]')) {
  staticReportForm.reportKind = target.value
  if (target.value === 'professional' && !staticReportForm.major) {
    staticReportForm.major = staticReportMajorOptions[0]
  }
  staticReportForm.templateId = target.value === 'industry'
    ? 'industry-analysis'
    : 'professional-analysis'
  renderReport('create')
  return
}
if (target.matches('[data-report-major]')) staticReportForm.major = target.value
if (target.matches('[data-report-related-industry]')) staticReportForm.relatedIndustry = target.value
if (target.matches('[data-report-region]')) staticReportForm.region = target.value
if (target.matches('[data-report-creation-mode]')) {
  staticReportForm.creationMode = target.value
  renderReport('create')
  return
}
if (target.matches('[data-report-template]')) staticReportForm.templateId = target.value
```

Every TOC add, delete, or title edit sets `staticReportTocDirty = true`.

- [ ] **Step 7: Run the static navigation test**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="static report navigation renders" tests/results-portal.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit static parameter parity**

```bash
git add major-construction-platform/index.html \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: mirror report scope in static entry"
```

---

### Task 6: Complete static confirmation, lifecycle, dynamic content, and exports

**Files:**
- Modify: `major-construction-platform/index.html:4000-4090`
- Modify: `major-construction-platform/index.html:7070-7170`
- Modify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: static form/TOC state from Task 5.
- Produces: static confirmation parity, dynamic editor content, one generated draft, save-to-done transition, and expanded ADS metadata.

- [ ] **Step 1: Add failing static lifecycle assertions**

Extend the static navigation VM test after step three:

```js
assert.match(app.innerHTML, /分析范围/)
assert.match(app.innerHTML, /BIM深化设计工程师/)
assert.match(app.innerHTML, /专业分析报告模板/)

const generate = new FakeElement()
generate.closest = (selector) => {
  if (selector === '[data-report-action]') {
    return { dataset: { reportAction: 'generate' } }
  }
  return null
}
generate.matches = () => false
assert.doesNotThrow(() => clickHandler({ target: generate }))
```

Add a separate structural test:

```js
test('static report generation persists scope and lifecycle metadata', () => {
  assert.match(staticHtml, /const buildStaticDynamicReportContent = \(/)
  assert.match(staticHtml, /status: 'draft'/)
  assert.match(staticHtml, /status: 'done'/)
  assert.match(staticHtml, /referenceFileCount: staticReportFileCount/)
  assert.match(staticHtml, /toc: serializeReportToc\(reportToc\)/)
  assert.match(staticHtml, /jobIds: \[\.\.\.staticReportForm\.jobIds\]/)
  assert.match(staticHtml, /creationMode: activeReport/)
  assert.match(staticHtml, /templateId: activeReport/)
})
```

- [ ] **Step 2: Run the static lifecycle tests and verify failure**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="static report navigation renders|static report generation persists" tests/results-portal.test.mjs
```

Expected: lifecycle structural test FAILS.

- [ ] **Step 3: Add dynamic static HTML generation**

Define:

```js
const buildStaticDynamicReportContent = () => {
  const escape = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  const jobNames = staticReportJobOptions
    .filter((job) => staticReportForm.jobIds.includes(job.id))
    .map((job) => job.name)
  const kind = staticReportForm.reportKind === 'industry' ? '行业报告' : '专业报告'
  const mode = staticReportForm.creationMode === 'custom' ? '自定义' : '按模板创建'
  const subtitle = `报告类型：${kind} ｜ 专业：${staticReportForm.major || '未指定专业'} ｜ 相关行业：${staticReportForm.relatedIndustry} ｜ 分析区域：${staticReportForm.region} ｜ 生成日期：${new Date().toISOString().slice(0, 10)}`
  const scope = `<section class="report-scope-summary"><h2>报告生成范围</h2><p>本报告采用${mode}方式生成，重点分析岗位包括：${jobNames.join('、')}。</p><p>本次生成使用参考文件 ${staticReportFileCount} 个。</p></section>`
  let html = reportContentHtml
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${escape(staticReportForm.title)}</h1>`)
    .replace(/<p class="report-doc-subtitle">[\s\S]*?<\/p>/, `<p class="report-doc-subtitle">${escape(subtitle)}</p>`)
  const firstH2 = html.indexOf('<h2>')
  return firstH2 >= 0
    ? `${html.slice(0, firstH2)}${scope}${html.slice(firstH2)}`
    : `${html}${scope}`
}
```

- [ ] **Step 4: Create one static draft and complete it on save**

Add:

```js
const createStaticGeneratedDraft = () => {
  if (staticActiveReportId !== 0) return
  const nextId = Math.max(...staticReportRows.map((item) => item.id), 0) + 1
  staticReportRows = [{
    id: nextId,
    ...staticReportForm,
    jobIds: [...staticReportForm.jobIds],
    date: new Date().toISOString().slice(0, 10),
    status: 'draft',
    referenceFileCount: staticReportFileCount,
    toc: serializeReportToc(reportToc),
  }, ...staticReportRows]
  staticActiveReportId = nextId
}
```

Change generate:

```js
staticReportEditorContent = buildStaticDynamicReportContent()
renderReport('generating')
window.setTimeout(() => {
  createStaticGeneratedDraft()
  renderReport('editor')
}, 900)
```

Change save:

```js
staticReportRows = staticReportRows.map((report) =>
  report.id === staticActiveReportId
    ? { ...report, status: 'done', toc: serializeReportToc(reportToc) }
    : report
)
```

- [ ] **Step 5: Expand static confirmation, search, labels, and ADS metadata**

Render the static report-information and analysis-range cards with:

```js
const templateName = staticReportTemplates.find(
  (item) => item.id === staticReportForm.templateId,
)?.name || ''
const selectedJobs = staticReportJobOptions.filter(
  (job) => staticReportForm.jobIds.includes(job.id),
)
const reportInfo = `<section class="research-card report-confirm-card">
  <div class="research-card-head"><h3>报告信息</h3></div>
  <dl class="report-summary-list">
    <div><dt>报告名称</dt><dd>${escapeText(staticReportForm.title)}</dd></div>
    <div><dt>报告类型</dt><dd>${staticReportForm.reportKind === 'industry' ? '行业报告' : '专业报告'}</dd></div>
    <div><dt>专业</dt><dd>${escapeText(staticReportForm.major || '未指定')}</dd></div>
    <div><dt>相关行业</dt><dd>${escapeText(staticReportForm.relatedIndustry)}</dd></div>
    <div><dt>指定区域</dt><dd>${escapeText(staticReportForm.region)}</dd></div>
    <div><dt>创建方式</dt><dd>${staticReportForm.creationMode === 'template' ? `按模板创建 · ${escapeText(templateName)}` : '自定义'}</dd></div>
    <div><dt>参考文件</dt><dd>${staticReportFileCount} 个文件</dd></div>
  </dl>
</section>`
const analysisScope = `<section class="research-card report-confirm-card">
  <div class="research-card-head"><h3>分析范围</h3></div>
  <p>已选择 ${selectedJobs.length} 个分析岗位</p>
  <div class="report-summary-tags">${selectedJobs.map((job) => `<span>${escapeText(job.name)}</span>`).join('')}</div>
</section>`
```

The third step must also display:

- report kind label;
- major or `未指定`;
- related industry;
- region;
- creation mode and template name;
- file count;
- selected job count and job chips;
- TOC summary.

The report library search haystack must include related industry and selected job names. The type cell must display `专业报告/行业报告` plus `模板/自定义`.

Add ADS metadata:

```js
reportKind: activeReport?.reportKind || staticReportForm.reportKind,
major: activeReport?.major || staticReportForm.major,
relatedIndustry: activeReport?.relatedIndustry || staticReportForm.relatedIndustry,
region: activeReport?.region || staticReportForm.region,
jobIds: activeReport?.jobIds || staticReportForm.jobIds,
jobNames: staticReportJobOptions
  .filter((job) => (activeReport?.jobIds || staticReportForm.jobIds).includes(job.id))
  .map((job) => job.name),
creationMode: activeReport?.creationMode || staticReportForm.creationMode,
templateId: activeReport?.templateId || staticReportForm.templateId,
referenceFileCount: activeReport?.referenceFileCount || staticReportFileCount,
```

- [ ] **Step 6: Run static tests and build**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="static report navigation renders|static report generation persists|static html can deep-link directly to the report library" tests/results-portal.test.mjs
npm run build
```

Expected: focused static tests PASS; build PASS.

- [ ] **Step 7: Commit static lifecycle parity**

```bash
git add major-construction-platform/index.html \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: persist static report generation"
```

---

### Task 7: Style, responsive QA, and full verification

**Files:**
- Modify: `major-construction-platform/src/styles/80-report.css:190-550`
- Modify: `major-construction-platform/tests/results-portal.test.mjs:655-690`

**Interfaces:**
- Consumes: new Vue/static class names from Tasks 2–6.
- Produces: compact desktop layout, single-column narrow layout, accessible selected/disabled states, and final verified build.

- [ ] **Step 1: Write failing style assertions**

Extend `report wizard styling stays compact and prevents text overflow`:

```js
const jobOptions = styleBlock('.report-job-options')
const segmentedOptions = styleBlock('.report-segmented-options')
const fieldError = styleBlock('.report-field-error')
const summaryTags = styleBlock('.report-summary-tags')

assert.match(jobOptions, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
assert.match(jobOptions, /max-height:\s*260px/)
assert.match(jobOptions, /overflow:\s*auto/)
assert.match(segmentedOptions, /display:\s*flex/)
assert.match(fieldError, /color:\s*#c43b3b/)
assert.match(summaryTags, /flex-wrap:\s*wrap/)
assert.match(stylesCss, /\.report-job-options button:disabled/)
assert.match(
  stylesCss,
  /@media \(max-width:\s*900px\)[\s\S]*\.report-job-options[\s\S]*grid-template-columns:\s*1fr/,
)
```

- [ ] **Step 2: Run the style test and verify failure**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report wizard styling stays compact" tests/results-portal.test.mjs
```

Expected: FAIL because the new class blocks do not exist.

- [ ] **Step 3: Add report field and selection styles**

Add:

```css
.report-field-error {
  color: #c43b3b;
  font-size: 12px;
  font-style: normal;
}

.report-field-hint {
  color: #8290a6;
  font-size: 12px;
  font-style: normal;
}

.report-segmented-field,
.report-job-field {
  padding: 0;
  border: 0;
}

.report-segmented-field legend,
.report-job-field legend {
  margin-bottom: 8px;
  color: #53627a;
  font-size: 13px;
  font-weight: 700;
}

.report-segmented-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.report-segmented-options label {
  position: relative;
}

.report-segmented-options input {
  position: absolute;
  opacity: 0;
}

.report-segmented-options span {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  padding: 0 16px;
  border: 1px solid #d8e2f1;
  border-radius: 8px;
  color: #66758d;
  background: #ffffff;
  cursor: pointer;
}

.report-segmented-options input:checked + span {
  border-color: #78a0ff;
  color: #2f6ff5;
  background: #edf3ff;
  box-shadow: inset 0 0 0 1px rgba(47, 111, 245, 0.08);
}

.report-segmented-options input:focus-visible + span {
  outline: 3px solid rgba(47, 111, 245, 0.16);
  outline-offset: 2px;
}

.report-job-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  color: #8290a6;
  font-size: 12px;
}

.report-job-field-head strong {
  color: #2f6ff5;
}

.report-job-options {
  display: grid;
  max-height: 260px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
  overflow: auto;
  border: 1px solid #dce6f4;
  border-radius: 9px;
  background: #fbfdff;
}

.report-job-options label,
.report-job-options button {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 9px;
  padding: 10px;
  border: 1px solid #e2e9f4;
  border-radius: 8px;
  color: #52617a;
  text-align: left;
  background: #ffffff;
}

.report-job-options label:has(input:checked),
.report-job-options button.selected {
  border-color: #8aaeff;
  color: #245fda;
  background: #f1f6ff;
}

.report-job-options button:disabled,
.report-job-options label:has(input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

.report-job-options strong,
.report-job-options em {
  display: block;
  overflow-wrap: anywhere;
}

.report-job-options em {
  margin-top: 3px;
  color: #8a96a9;
  font-size: 11px;
  font-style: normal;
}

.report-summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 18px 18px;
}

.report-summary-tags span,
.report-mode-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  color: #2f6ff5;
  background: #edf3ff;
  font-size: 12px;
}

.report-summary-tags span {
  min-height: 28px;
  padding: 0 10px;
}

.report-mode-tag {
  margin-left: 6px;
  padding: 3px 8px;
}

.report-generation-error .report-loading-mark {
  color: #c43b3b;
  background: #fff0f0;
}

.report-generation-error-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
```

Under `@media (max-width: 900px)` add:

```css
.report-job-options {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 4: Run style and report tests**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report wizard styling|report reference files|Vue report|static report" tests/results-portal.test.mjs
```

Expected: all selected tests PASS.

- [ ] **Step 5: Run the full automated verification**

Run:

```bash
cd major-construction-platform
npm test
npm run build
```

Expected: all tests PASS; Vite production build completes without TypeScript errors.

- [ ] **Step 6: Run visual QA at desktop and narrow widths**

Start:

```bash
cd major-construction-platform
npm run dev -- --port 4173
```

Verify in the browser:

1. Open the report library and create a report.
2. Desktop width around 1440px: parameter fields use two columns; job options use two columns; no horizontal scroll.
3. Select exactly 10 jobs: counter shows `10 / 10`; remaining jobs are visibly disabled.
4. Switch professional/industry kinds: major requirement and matching template update correctly.
5. Enter template TOC, edit one title, return, change template/mode, and confirm the overwrite warning.
6. Custom mode begins with one `新增章节`.
7. Clear a TOC title: progression is blocked and the empty input receives focus.
8. Generate: one draft appears in the report library.
9. Save: the record changes to `已完成`.
10. Preview PDF and export ADS: both actions complete and ADS includes job/template metadata.
11. Narrow width around 760px: form and job options use one column; buttons and tags wrap without clipping.

- [ ] **Step 7: Commit styles and final verification changes**

```bash
git add major-construction-platform/src/styles/80-report.css \
  major-construction-platform/tests/results-portal.test.mjs
git commit -m "style: polish report generation scope"
```

- [ ] **Step 8: Confirm the worktree is clean**

Run:

```bash
git status --short
git log -7 --oneline
```

Expected: `git status --short` has no output; the log shows the report domain, Vue parameters, Vue TOC, Vue lifecycle, static parameters, static lifecycle, and styling commits.
