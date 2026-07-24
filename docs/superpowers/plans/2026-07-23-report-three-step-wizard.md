# Report Generation Three-Step Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current side-by-side report creation page with a compact three-step wizard for parameter configuration, table-of-contents editing, and generation confirmation.

**Architecture:** Keep `currentReportView` as the report module's top-level state and add a local `ReportCreateStep` state inside the existing `create` view. Reuse the current form, dimension, and TOC data structures; derive the confirmation summary from live state. Mirror the same state machine and copy in the static `file://` renderer.

**Tech Stack:** Vue 3 Composition API, TypeScript, plain CSS, static HTML/JavaScript, Node.js built-in test runner.

## Global Constraints

- The wizard order is exactly `参数配置` → `目录调整` → `报告生成`.
- The stepper height is approximately `44px` and must remain visually secondary to the page title.
- Report title is required and at least one report dimension must be selected before leaving step 1.
- The TOC must retain at least one root chapter.
- Existing report library, generating, editor, preview, PDF, and ADS flows remain intact.
- Vue and `file://` static entry behavior and Chinese copy remain aligned.
- No new UI library, backend API, or persistent draft model may be added.
- Grid children must use `min-width: 0`; long Chinese copy must wrap or truncate within its container.

## File Structure

- `major-construction-platform/src/App.vue`
  - Owns Vue wizard state, validation, derived summary, and the three step templates.
- `major-construction-platform/src/styles/80-report.css`
  - Owns compact stepper, focused step panels, stable footer, overflow rules, and responsive layout.
- `major-construction-platform/index.html`
  - Mirrors the wizard for the standalone `file://` application.
- `major-construction-platform/tests/results-portal.test.mjs`
  - Locks Vue source contracts, static runtime navigation, copy parity, and overflow-critical CSS.

---

### Task 1: Add the Vue wizard state machine and source contract

**Files:**
- Modify: `major-construction-platform/tests/results-portal.test.mjs`
- Modify: `major-construction-platform/src/App.vue:425-470`
- Modify: `major-construction-platform/src/App.vue:4129-4270`

**Interfaces:**
- Consumes: existing `reportForm`, `selectedReportDimensions`, `reportTocRows`, `REPORT_DIMENSIONS`, and `currentReportView`.
- Produces:
  - `type ReportCreateStep = 1 | 2 | 3`
  - `reportCreateStep: Ref<ReportCreateStep>`
  - `reportCreateMaxStep: Ref<ReportCreateStep>`
  - `reportCreateError: Ref<string>`
  - `reportReferenceFiles: Ref<File[]>`
  - `goToReportCreateStep(step: ReportCreateStep): void`
  - `goToNextReportCreateStep(): void`
  - `goToPreviousReportCreateStep(): void`
  - `returnToReportCreate(): void`
  - `reportTocSummary: ComputedRef<{ chapters: number; sections: number; entries: number }>`

- [ ] **Step 1: Write the failing Vue source-contract test**

Add this test after the existing report creation test in `tests/results-portal.test.mjs`:

```js
test('Vue report creation uses a validated three-step wizard', () => {
  assert.match(appVue, /type ReportCreateStep = 1 \| 2 \| 3/)
  assert.match(appVue, /const reportCreateStep = ref<ReportCreateStep>\(1\)/)
  assert.match(appVue, /const reportCreateMaxStep = ref<ReportCreateStep>\(1\)/)
  assert.match(appVue, /const validateReportParameters = \(\) =>/)
  assert.match(appVue, /reportForm\.value\.title\.trim\(\)/)
  assert.match(appVue, /selectedReportDimensions\.value\.length === 0/)
  assert.match(appVue, /const goToNextReportCreateStep = \(\) =>/)
  assert.match(appVue, /const returnToReportCreate = \(\) =>/)
  assert.match(appVue, /:aria-current=.*'step'/)
  assert.match(appVue, /label: '参数配置'/)
  assert.match(appVue, /label: '目录调整'/)
  assert.match(appVue, /label: '报告生成'/)
  assert.match(appVue, /AI 开始生成报告/)
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report creation uses a validated three-step wizard" tests/results-portal.test.mjs
```

Expected: FAIL because `ReportCreateStep` and the wizard markup do not exist.

- [ ] **Step 3: Add the wizard state and validation helpers**

Add beside `currentReportView` and the existing report refs in `src/App.vue`:

```ts
type ReportCreateStep = 1 | 2 | 3

const reportCreateStep = ref<ReportCreateStep>(1)
const reportCreateMaxStep = ref<ReportCreateStep>(1)
const reportCreateError = ref('')
const reportReferenceFiles = ref<File[]>([])
const reportGenerationPending = ref(false)
```

Add beside the existing report helper functions:

```ts
const validateReportParameters = () => {
  if (!reportForm.value.title.trim()) {
    reportCreateError.value = '请输入报告标题'
    return false
  }
  if (selectedReportDimensions.value.length === 0) {
    reportCreateError.value = '请至少选择一个报告维度'
    return false
  }
  reportCreateError.value = ''
  return true
}

const setReportReferenceFiles = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement | null
  reportReferenceFiles.value = Array.from(input?.files ?? [])
}

const reportSelectedDimensionRows = computed(() =>
  REPORT_DIMENSIONS.filter((dimension) =>
    selectedReportDimensions.value.includes(dimension.key)
  )
)

const countReportTocRows = (
  rows: ReportTocEditorItem[],
  depth = 1
): { chapters: number; sections: number; entries: number } =>
  rows.reduce(
    (summary, row) => {
      if (depth === 1) summary.chapters += 1
      else if (depth === 2) summary.sections += 1
      else summary.entries += 1

      const children = countReportTocRows(row.children, depth + 1)
      summary.chapters += children.chapters
      summary.sections += children.sections
      summary.entries += children.entries
      return summary
    },
    { chapters: 0, sections: 0, entries: 0 }
  )

const reportTocSummary = computed(() => countReportTocRows(reportTocRows.value))

const goToReportCreateStep = (step: ReportCreateStep) => {
  if (step > reportCreateMaxStep.value) return
  if (step > reportCreateStep.value && reportCreateStep.value === 1 && !validateReportParameters()) {
    return
  }
  reportCreateError.value = ''
  reportCreateStep.value = step
}

const goToNextReportCreateStep = () => {
  if (reportCreateStep.value === 1) {
    if (!validateReportParameters()) return
    reportCreateMaxStep.value = Math.max(reportCreateMaxStep.value, 2) as ReportCreateStep
    reportCreateStep.value = 2
    return
  }
  if (reportCreateStep.value === 2) {
    reportCreateMaxStep.value = 3
    reportCreateStep.value = 3
  }
}

const goToPreviousReportCreateStep = () => {
  reportCreateError.value = ''
  if (reportCreateStep.value > 1) {
    reportCreateStep.value = (reportCreateStep.value - 1) as ReportCreateStep
  }
}

const returnToReportCreate = () => {
  currentReportView.value = 'create'
  reportCreateStep.value = 3
  reportCreateMaxStep.value = 3
}
```

Update `openReportCreate` so a new report always starts cleanly:

```ts
const openReportCreate = () => {
  currentJobSection.value = '报告生成'
  currentReportView.value = 'create'
  activeReportId.value = 0
  reportCreateStep.value = 1
  reportCreateMaxStep.value = 1
  reportCreateError.value = ''
  reportReferenceFiles.value = []
  reportGenerationPending.value = false
  reportForm.value = { ...REPORT_DEFAULT_FORM, industry: activeIndustryChainLabel.value }
  selectedReportDimensions.value = REPORT_DIMENSIONS.map((item) => item.key)
  reportTocRows.value = buildReportTocRows(REPORT_TOC)
  reportEditorContent.value = REPORT_CONTENT
}
```

Guard the existing generator:

```ts
const generateReportPreview = () => {
  if (reportGenerationPending.value) return
  reportGenerationPending.value = true
  currentReportView.value = 'generating'
  window.setTimeout(() => {
    reportEditorContent.value = REPORT_CONTENT
    reportGenerationPending.value = false
    currentReportView.value = 'editor'
  }, 900)
}
```

- [ ] **Step 4: Replace the Vue create view with the three step templates**

Replace the existing `currentReportView === 'create'` block in `src/App.vue` with:

```vue
<template v-else-if="currentReportView === 'create'">
  <section class="report-wizard">
    <div class="report-wizard-toolbar">
      <div>
        <h3>
          {{
            reportCreateStep === 1
              ? '配置报告参数'
              : reportCreateStep === 2
                ? '调整报告目录'
                : '确认并生成报告'
          }}
        </h3>
        <span>步骤 {{ reportCreateStep }} / 3</span>
      </div>
      <button class="secondary-action" @click="currentReportView = 'library'">返回报告库</button>
    </div>

    <nav class="report-wizard-stepper" aria-label="报告生成步骤">
      <button
        v-for="step in [
          { index: 1, label: '参数配置' },
          { index: 2, label: '目录调整' },
          { index: 3, label: '报告生成' },
        ]"
        :key="step.index"
        type="button"
        class="report-wizard-step"
        :class="{
          active: reportCreateStep === step.index,
          complete: reportCreateMaxStep > step.index,
        }"
        :disabled="step.index > reportCreateMaxStep"
        :aria-current="reportCreateStep === step.index ? 'step' : undefined"
        @click="goToReportCreateStep(step.index as ReportCreateStep)"
      >
        <span>{{ reportCreateMaxStep > step.index ? '✓' : step.index }}</span>
        <strong>{{ step.label }}</strong>
      </button>
    </nav>

    <div v-if="reportCreateStep === 1" class="report-wizard-panel">
      <section class="research-card report-form-card">
        <div class="research-card-head">
          <div>
            <h3>基本参数</h3>
            <span>设置报告名称、类型与数据范围</span>
          </div>
        </div>
        <div class="report-parameter-grid">
          <label class="report-field report-field-wide">
            <span>报告标题</span>
            <input
              v-model="reportForm.title"
              :aria-invalid="reportCreateError === '请输入报告标题'"
              aria-describedby="report-create-error"
            />
          </label>
          <label class="report-field">
            <span>报告类型</span>
            <select v-model="reportForm.type">
              <option v-for="type in REPORT_TYPE_OPTIONS" :key="type">{{ type }}</option>
            </select>
          </label>
          <label class="report-field">
            <span>产业方向</span>
            <select v-model="reportForm.industry">
              <option v-for="industry in REPORT_INDUSTRY_OPTIONS" :key="industry">
                {{ industry }}
              </option>
            </select>
          </label>
          <label class="report-field report-field-wide">
            <span>参考文件上传</span>
            <input type="file" multiple @change="setReportReferenceFiles" />
            <em v-if="reportReferenceFiles.length" class="report-file-summary">
              已选择 {{ reportReferenceFiles.length }} 个文件
            </em>
          </label>
        </div>
      </section>

      <section class="research-card report-dimension-panel">
        <div class="research-card-head report-card-head">
          <div>
            <h3>选择报告维度</h3>
            <span>至少选择 1 项，选中内容将进入目录建议</span>
          </div>
        </div>
        <div class="report-dimension-grid">
          <button
            v-for="dimension in REPORT_DIMENSIONS"
            :key="dimension.key"
            type="button"
            class="report-dimension-card"
            :class="{ selected: selectedReportDimensions.includes(dimension.key) }"
            @click="toggleReportDimension(dimension.key)"
          >
            <span>{{ selectedReportDimensions.includes(dimension.key) ? '✓' : '' }}</span>
            <strong>{{ dimension.title }}</strong>
            <em>{{ dimension.desc }}</em>
          </button>
        </div>
      </section>
      <p
        v-if="reportCreateError"
        id="report-create-error"
        class="report-wizard-error"
        role="alert"
      >
        {{ reportCreateError }}
      </p>
    </div>

    <div v-else-if="reportCreateStep === 2" class="report-wizard-panel">
      <section class="research-card report-form-card report-toc-card">
        <div class="research-card-head report-card-head">
          <div>
            <h3>目录结构</h3>
            <span>支持三级目录，可直接修改标题</span>
          </div>
          <button class="secondary-action compact" @click="addReportTocChapter">＋ 新增章</button>
        </div>
        <div class="report-toc-tree report-toc-outline report-toc-scroll">
          <article v-for="toc in reportTocRootRows" :key="toc.id">
            <div class="report-toc-row report-toc-row-chapter">
              <span class="report-toc-index">{{ toc.num }}</span>
              <input
                :value="toc.title"
                @input="updateReportTocTitle(toc.id, ($event.target as HTMLInputElement).value)"
              />
              <div class="report-toc-actions">
                <button title="新增内容" @click="addReportTocChild(toc.id, toc.depth)">＋</button>
                <button
                  title="删除章节"
                  :disabled="reportTocRows.length <= 1"
                  @click="removeReportTocNode(toc.id)"
                >
                  ⌫
                </button>
              </div>
            </div>
            <div class="report-toc-children">
              <template
                v-for="child in reportTocChildRows(toc.children, toc.path)"
                :key="child.id"
              >
                <div class="report-toc-row report-toc-row-child">
                  <span class="report-toc-index">{{ child.num }}</span>
                  <input
                    :value="child.title"
                    @input="updateReportTocTitle(child.id, ($event.target as HTMLInputElement).value)"
                  />
                  <div class="report-toc-actions">
                    <button
                      v-if="canAddReportTocChild(child.depth)"
                      title="新增内容"
                      @click="addReportTocChild(child.id, child.depth)"
                    >
                      ＋
                    </button>
                    <button title="删除内容" @click="removeReportTocChild(child.id)">×</button>
                  </div>
                </div>
                <div
                  v-if="child.children.length"
                  class="report-toc-children report-toc-children-deep"
                >
                  <div
                    v-for="grandchild in reportTocChildRows(child.children, child.path)"
                    :key="grandchild.id"
                    class="report-toc-row report-toc-row-leaf"
                  >
                    <span class="report-toc-index">{{ grandchild.num }}</span>
                    <input
                      :value="grandchild.title"
                      @input="updateReportTocTitle(grandchild.id, ($event.target as HTMLInputElement).value)"
                    />
                    <button title="删除条目" @click="removeReportTocChild(grandchild.id)">×</button>
                  </div>
                </div>
              </template>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div v-else class="report-wizard-panel report-confirm-panel">
      <section class="research-card report-confirm-card">
        <div class="research-card-head"><h3>报告信息</h3></div>
        <dl class="report-summary-list">
          <div><dt>报告标题</dt><dd>{{ reportForm.title }}</dd></div>
          <div><dt>报告类型</dt><dd>{{ reportForm.type }}</dd></div>
          <div><dt>产业方向</dt><dd>{{ reportForm.industry }}</dd></div>
          <div><dt>参考文件</dt><dd>{{ reportReferenceFiles.length }} 个文件</dd></div>
        </dl>
      </section>
      <section class="research-card report-confirm-card">
        <div class="research-card-head"><h3>生成范围</h3></div>
        <p>已选择 {{ reportSelectedDimensionRows.length }} 个报告维度</p>
        <div class="report-summary-tags">
          <span v-for="dimension in reportSelectedDimensionRows" :key="dimension.key">
            {{ dimension.title }}
          </span>
        </div>
      </section>
      <section class="research-card report-confirm-card">
        <div class="research-card-head report-card-head">
          <h3>目录摘要</h3>
          <button type="button" class="report-summary-link" @click="goToReportCreateStep(2)">
            查看全部
          </button>
        </div>
        <p>
          共 {{ reportTocSummary.chapters }} 章、{{ reportTocSummary.sections }} 节、
          {{ reportTocSummary.entries }} 个三级条目
        </p>
        <ol>
          <li v-for="row in reportTocRootRows.slice(0, 2)" :key="row.id">{{ row.title }}</li>
        </ol>
      </section>
      <aside class="report-ready-note">
        <strong>AI 已准备就绪</strong>
        <span>生成完成后将进入报告编辑页，可继续修改和导出。</span>
      </aside>
    </div>

    <footer class="report-wizard-footer">
      <button
        v-if="reportCreateStep > 1"
        type="button"
        class="secondary-action"
        @click="goToPreviousReportCreateStep"
      >
        上一步
      </button>
      <span v-else>配置将保留在当前创建流程中</span>
      <button
        v-if="reportCreateStep < 3"
        type="button"
        class="primary-action compact"
        @click="goToNextReportCreateStep"
      >
        {{ reportCreateStep === 1 ? '下一步：目录调整' : '下一步：报告生成' }}
      </button>
      <button
        v-else
        type="button"
        class="primary-action compact"
        :disabled="reportGenerationPending"
        @click="generateReportPreview"
      >
        {{ reportGenerationPending ? '正在生成…' : 'AI 开始生成报告' }}
      </button>
    </footer>
  </section>
</template>
```

Change the editor toolbar button from:

```vue
<button class="secondary-action" @click="currentReportView = 'create'">‹ 返回配置</button>
```

to:

```vue
<button class="secondary-action" @click="returnToReportCreate">‹ 返回配置</button>
```

- [ ] **Step 5: Run the focused test and type check**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="Vue report creation uses a validated three-step wizard" tests/results-portal.test.mjs
npx vue-tsc -b
```

Expected: the focused test passes and `vue-tsc` exits with code 0.

- [ ] **Step 6: Commit the Vue wizard**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: add report creation wizard"
```

---

### Task 2: Mirror the wizard in the static `file://` renderer

**Files:**
- Modify: `major-construction-platform/tests/results-portal.test.mjs:540-590`
- Modify: `major-construction-platform/index.html:1909-2050`
- Modify: `major-construction-platform/index.html:3976-4000`
- Modify: `major-construction-platform/index.html:6999-7085`
- Modify: `major-construction-platform/index.html:7630-7665`

**Interfaces:**
- Consumes: existing `reportHtml(view)`, `renderReport(view)`, `reportToc`, `reportDimensions`, and `selectedReportDimensions`.
- Produces:
  - `staticReportCreateStep: 1 | 2 | 3` by convention
  - `staticReportCreateMaxStep: 1 | 2 | 3`
  - `staticReportForm: { title: string; type: string; industry: string }`
  - `staticReportValidationError: string`
  - `staticReportFileCount: number`
  - `renderStaticReportCreateBody(): string`

- [ ] **Step 1: Replace the existing static creation test with a three-step runtime test**

After the existing test opens a new report, assert step 1 and simulate the next buttons:

```js
assert.match(app.innerHTML, /参数配置/)
assert.match(app.innerHTML, /步骤 1 \/ 3/)
assert.match(app.innerHTML, /基本参数/)
assert.doesNotMatch(app.innerHTML, /目录结构/)

const nextToToc = new FakeElement()
nextToToc.closest = (selector) => {
  if (selector === '[data-report-step-next]') return { dataset: {} }
  return null
}
nextToToc.matches = () => false
assert.doesNotThrow(() => clickHandler({ target: nextToToc }))
assert.match(app.innerHTML, /步骤 2 \/ 3/)
assert.match(app.innerHTML, /目录结构/)

const nextToConfirm = new FakeElement()
nextToConfirm.closest = (selector) => {
  if (selector === '[data-report-step-next]') return { dataset: {} }
  return null
}
nextToConfirm.matches = () => false
assert.doesNotThrow(() => clickHandler({ target: nextToConfirm }))
assert.match(app.innerHTML, /步骤 3 \/ 3/)
assert.match(app.innerHTML, /确认并生成报告/)
assert.match(app.innerHTML, /AI 开始生成报告/)
```

- [ ] **Step 2: Run the focused static runtime test and verify it fails**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="static report navigation renders library and creation states without errors" tests/results-portal.test.mjs
```

Expected: FAIL because the current create view renders parameters and TOC together.

- [ ] **Step 3: Add static wizard state and summary helpers**

Add near `staticReportView`:

```js
let staticReportCreateStep = 1
let staticReportCreateMaxStep = 1
let staticReportValidationError = ''
let staticReportFileCount = 0
let staticReportForm = {
  title: '智能建造工程专业产业调研报告',
  type: reportTypeOptions[0],
  industry: staticSelectedIndustryChain
}
```

Because `reportTypeOptions` is currently declared after the report state, move the `reportTypeOptions` and `reportIndustryOptions` declarations immediately above `staticReportForm`.

Add before `reportHtml`:

```js
const countStaticReportToc = (rows, depth = 1) => rows.reduce((summary, row) => {
  if (depth === 1) summary.chapters += 1
  else if (depth === 2) summary.sections += 1
  else summary.entries += 1
  const children = countStaticReportToc(row.children || [], depth + 1)
  summary.chapters += children.chapters
  summary.sections += children.sections
  summary.entries += children.entries
  return summary
}, { chapters: 0, sections: 0, entries: 0 })

const validateStaticReportParameters = () => {
  if (!staticReportForm.title.trim()) {
    staticReportValidationError = '请输入报告标题'
    return false
  }
  if (selectedReportDimensions.size === 0) {
    staticReportValidationError = '请至少选择一个报告维度'
    return false
  }
  staticReportValidationError = ''
  return true
}

const staticReportStepperHtml = () => {
  const steps = [
    [1, '参数配置'],
    [2, '目录调整'],
    [3, '报告生成']
  ]
  return `<nav class="report-wizard-stepper" aria-label="报告生成步骤">${steps.map(([index, label]) => {
    const active = staticReportCreateStep === index
    const complete = staticReportCreateMaxStep > index
    const disabled = index > staticReportCreateMaxStep
    return `<button type="button" class="report-wizard-step ${active ? 'active' : ''} ${complete ? 'complete' : ''}" data-report-step="${index}" ${active ? 'aria-current="step"' : ''} ${disabled ? 'disabled' : ''}><span>${complete ? '✓' : index}</span><strong>${label}</strong></button>`
  }).join('')}</nav>`
}
```

Update `renderReportTocNodes` so the last remaining root chapter is visibly non-deletable:

```js
const rootDeleteDisabled = depth === 1 && reportToc.length <= 1
const actions = `<div class="report-toc-actions">${addButton}<button title="删除目录" data-report-toc-delete="${toc.id}" ${rootDeleteDisabled ? 'disabled' : ''}>${depth === 1 ? '⌫' : '×'}</button></div>`
```

Retain this exact click guard as a second line of defense:

```js
if (reportToc.length > 1) {
  reportToc = removeReportTocTreeNode(
    reportToc,
    reportTocDelete.dataset.reportTocDelete
  )
}
```

- [ ] **Step 4: Render one static step at a time**

Replace the current `createBody` assignment with three explicit bodies and a shared shell:

```js
const parameterBody = `<div class="report-wizard-panel">
  <section class="research-card report-form-card">
    <div class="research-card-head"><div><h3>基本参数</h3><span>设置报告名称、类型与数据范围</span></div></div>
    <div class="report-parameter-grid">
      <label class="report-field report-field-wide"><span>报告标题</span><input data-report-form-title value="${escapeText(staticReportForm.title)}"></label>
      <label class="report-field"><span>报告类型</span><select data-report-form-type>${reportTypeOptions.map((item) => `<option ${item === staticReportForm.type ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
      <label class="report-field"><span>产业方向</span><select data-report-form-industry>${reportIndustryOptions.map((item) => `<option ${item === staticReportForm.industry ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
      <label class="report-field report-field-wide"><span>参考文件上传</span><input type="file" multiple data-report-files><em class="report-file-summary">${staticReportFileCount ? `已选择 ${staticReportFileCount} 个文件` : ''}</em></label>
    </div>
  </section>
  <section class="research-card report-dimension-panel">
    <div class="research-card-head"><div><h3>选择报告维度</h3><span>至少选择 1 项，选中内容将进入目录建议</span></div></div>
    <div class="report-dimension-grid">${reportDimensions.map((dimension) => `<button type="button" class="report-dimension-card ${selectedReportDimensions.has(dimension.key) ? 'selected' : ''}" data-report-dimension="${dimension.key}"><span>${selectedReportDimensions.has(dimension.key) ? '✓' : ''}</span><strong>${dimension.title}</strong><em>${dimension.desc}</em></button>`).join('')}</div>
  </section>
  ${staticReportValidationError ? `<p class="report-wizard-error" role="alert">${staticReportValidationError}</p>` : ''}
</div>`

const tocBody = `<div class="report-wizard-panel"><section class="research-card report-form-card report-toc-card"><div class="research-card-head report-card-head"><div><h3>目录结构</h3><span>支持三级目录，可直接修改标题</span></div><button class="secondary-action compact" data-report-toc-add>＋ 新增章</button></div><div class="report-toc-tree report-toc-outline report-toc-scroll">${tocEditorHtml}</div></section></div>`

const tocSummary = countStaticReportToc(reportToc)
const selectedDimensionRows = reportDimensions.filter((item) => selectedReportDimensions.has(item.key))
const confirmBody = `<div class="report-wizard-panel report-confirm-panel">
  <section class="research-card report-confirm-card"><div class="research-card-head"><h3>报告信息</h3></div><dl class="report-summary-list"><div><dt>报告标题</dt><dd>${escapeText(staticReportForm.title)}</dd></div><div><dt>报告类型</dt><dd>${escapeText(staticReportForm.type)}</dd></div><div><dt>产业方向</dt><dd>${escapeText(staticReportForm.industry)}</dd></div><div><dt>参考文件</dt><dd>${staticReportFileCount} 个文件</dd></div></dl></section>
  <section class="research-card report-confirm-card"><div class="research-card-head"><h3>生成范围</h3></div><p>已选择 ${selectedDimensionRows.length} 个报告维度</p><div class="report-summary-tags">${selectedDimensionRows.map((item) => `<span>${item.title}</span>`).join('')}</div></section>
  <section class="research-card report-confirm-card"><div class="research-card-head report-card-head"><h3>目录摘要</h3><button type="button" class="report-summary-link" data-report-step="2">查看全部</button></div><p>共 ${tocSummary.chapters} 章、${tocSummary.sections} 节、${tocSummary.entries} 个三级条目</p><ol>${reportToc.slice(0, 2).map((row) => `<li>${escapeText(row.title)}</li>`).join('')}</ol></section>
  <aside class="report-ready-note"><strong>AI 已准备就绪</strong><span>生成完成后将进入报告编辑页，可继续修改和导出。</span></aside>
</div>`

const stepBody = staticReportCreateStep === 1 ? parameterBody : staticReportCreateStep === 2 ? tocBody : confirmBody
const createBody = `<section class="report-wizard">
  <div class="report-wizard-toolbar"><div><h3>${staticReportCreateStep === 1 ? '配置报告参数' : staticReportCreateStep === 2 ? '调整报告目录' : '确认并生成报告'}</h3><span>步骤 ${staticReportCreateStep} / 3</span></div><button class="secondary-action" data-report-action="library">返回报告库</button></div>
  ${staticReportStepperHtml()}
  ${stepBody}
  <footer class="report-wizard-footer">
    ${staticReportCreateStep > 1 ? '<button type="button" class="secondary-action" data-report-step-previous>上一步</button>' : '<span>配置将保留在当前创建流程中</span>'}
    ${staticReportCreateStep < 3 ? `<button type="button" class="primary-action compact" data-report-step-next>${staticReportCreateStep === 1 ? '下一步：目录调整' : '下一步：报告生成'}</button>` : '<button type="button" class="primary-action compact" data-report-action="generate">AI 开始生成报告</button>'}
  </footer>
</section>`
```

- [ ] **Step 5: Wire static navigation and form preservation**

Add these branches before the existing `data-report-action` branch:

```js
const reportStep = target.closest('[data-report-step]')
if (reportStep) {
  const nextStep = Number(reportStep.dataset.reportStep)
  if (nextStep <= staticReportCreateMaxStep) {
    if (nextStep <= staticReportCreateStep || validateStaticReportParameters()) {
      staticReportCreateStep = nextStep
      staticReportValidationError = ''
    }
  }
  renderReport('create')
  return
}

if (target.closest('[data-report-step-next]')) {
  if (staticReportCreateStep === 1 && !validateStaticReportParameters()) {
    renderReport('create')
    return
  }
  staticReportCreateStep = Math.min(3, staticReportCreateStep + 1)
  staticReportCreateMaxStep = Math.max(staticReportCreateMaxStep, staticReportCreateStep)
  renderReport('create')
  return
}

if (target.closest('[data-report-step-previous]')) {
  staticReportCreateStep = Math.max(1, staticReportCreateStep - 1)
  staticReportValidationError = ''
  renderReport('create')
  return
}
```

Reset state in the `new` action:

```js
staticReportCreateStep = 1
staticReportCreateMaxStep = 1
staticReportValidationError = ''
staticReportFileCount = 0
staticReportForm = {
  title: '智能建造工程专业产业调研报告',
  type: reportTypeOptions[0],
  industry: staticSelectedIndustryChain
}
```

Before rendering `create` from the editor action, set:

```js
staticReportCreateStep = 3
staticReportCreateMaxStep = 3
```

Add to the input handler:

```js
if (target.matches('[data-report-form-title]')) {
  staticReportForm.title = target.value
  return
}
```

Add to the change handler:

```js
if (target.matches('[data-report-form-type]')) {
  staticReportForm.type = target.value
  return
}
if (target.matches('[data-report-form-industry]')) {
  staticReportForm.industry = target.value
  return
}
if (target.matches('[data-report-files]')) {
  staticReportFileCount = target.files?.length || 0
  renderReport('create')
  return
}
```

- [ ] **Step 6: Run the focused static test**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="static report navigation renders library and creation states without errors" tests/results-portal.test.mjs
```

Expected: PASS and the simulated flow reaches steps 1, 2, and 3 in order.

- [ ] **Step 7: Commit static parity**

```bash
git add major-construction-platform/index.html major-construction-platform/tests/results-portal.test.mjs
git commit -m "feat: mirror report wizard in static entry"
```

---

### Task 3: Apply compact, overflow-safe wizard styling

**Files:**
- Modify: `major-construction-platform/tests/results-portal.test.mjs`
- Modify: `major-construction-platform/src/styles/80-report.css:170-470`

**Interfaces:**
- Consumes: the class names introduced by Tasks 1 and 2.
- Produces: a 44px stepper, two-column parameter/dimension layouts, internally scrolling TOC, stable footer, and single-column responsive fallback.

- [ ] **Step 1: Write the failing CSS contract test**

Add:

```js
test('report wizard styling stays compact and prevents text overflow', () => {
  const stepper = styleBlock('.report-wizard-stepper')
  const parameterGrid = styleBlock('.report-parameter-grid')
  const tocScroll = styleBlock('.report-toc-scroll')
  const dimensionCard = styleBlock('.report-dimension-card')

  assert.match(stepper, /min-height:\s*44px/)
  assert.match(stepper, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(parameterGrid, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(tocScroll, /overflow:\s*auto/)
  assert.match(dimensionCard, /min-width:\s*0/)
  assert.match(dimensionCard, /overflow-wrap:\s*anywhere/)
  assert.match(stylesCss, /@media \(max-width:\s*900px\)[\s\S]*\.report-parameter-grid,[\s\S]*\.report-dimension-grid[\s\S]*grid-template-columns:\s*1fr/)
})
```

- [ ] **Step 2: Run the CSS test and verify it fails**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report wizard styling stays compact and prevents text overflow" tests/results-portal.test.mjs
```

Expected: FAIL because the wizard selectors do not exist.

- [ ] **Step 3: Replace the old split-create layout rules with wizard rules**

Add to `src/styles/80-report.css`, replacing the obsolete `.report-form-layout`, `.report-side-stack`, and `.report-main-stack` create-layout rules:

```css
.report-wizard {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.report-wizard-toolbar,
.report-wizard-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.report-wizard-toolbar > div {
  min-width: 0;
}

.report-wizard-toolbar h3 {
  margin: 0;
  color: #1f2f52;
  font-size: 18px;
}

.report-wizard-toolbar span,
.report-wizard-footer > span {
  color: #8290a6;
  font-size: 12px;
}

.report-wizard-stepper {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 44px;
  padding: 5px 8px;
  border: 1px solid #e0e8f5;
  border-radius: 9px;
  background: #f7f9fd;
}

.report-wizard-step {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  color: #8a96aa;
  background: transparent;
  cursor: pointer;
}

.report-wizard-step:not(:last-child)::after {
  position: absolute;
  right: -10%;
  width: 20%;
  border-top: 1px solid #d5dfef;
  content: "";
}

.report-wizard-step > span {
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  place-items: center;
  border: 1px solid #c7d4e8;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 900;
  background: #ffffff;
}

.report-wizard-step strong {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
}

.report-wizard-step.active,
.report-wizard-step.complete {
  color: #2f73ff;
}

.report-wizard-step.active > span {
  border-color: #2f73ff;
  color: #ffffff;
  background: #2f73ff;
}

.report-wizard-step.complete > span {
  border-color: #c9d9fb;
  color: #2f73ff;
  background: #eaf1ff;
}

.report-wizard-step:disabled {
  cursor: default;
}

.report-wizard-panel {
  display: grid;
  min-width: 0;
  gap: 14px;
}

.report-parameter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
  padding: 0 18px 18px;
}

.report-parameter-grid .report-field {
  min-width: 0;
  margin: 0;
}

.report-field-wide {
  grid-column: 1 / -1;
}

.report-file-summary {
  min-width: 0;
  overflow: hidden;
  color: #7d899d;
  font-size: 12px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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

.report-toc-scroll {
  max-height: 590px;
  overflow: auto;
  overscroll-behavior: contain;
}

.report-toc-row,
.report-toc-tree input {
  min-width: 0;
  max-width: 100%;
}

.report-wizard-error {
  margin: 0;
  padding: 10px 14px;
  border: 1px solid #ffd0d0;
  border-radius: 8px;
  color: #c43b3b;
  font-size: 13px;
  background: #fff6f6;
}

.report-confirm-panel {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.report-confirm-card {
  min-width: 0;
}

.report-confirm-card:first-child,
.report-ready-note {
  grid-column: 1 / -1;
}

.report-summary-list {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0 18px 18px;
}

.report-summary-list > div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid #edf1f7;
}

.report-summary-list dt {
  color: #8290a6;
}

.report-summary-list dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #31415d;
  font-weight: 700;
}

.report-confirm-card > p,
.report-confirm-card > ol,
.report-summary-tags {
  margin: 0 18px 18px;
}

.report-summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.report-summary-tags span {
  max-width: 100%;
  padding: 6px 10px;
  border-radius: 999px;
  overflow-wrap: anywhere;
  color: #2f73ff;
  font-size: 12px;
  font-weight: 800;
  background: #eef4ff;
}

.report-summary-link {
  border: 0;
  color: #2f73ff;
  font-weight: 800;
  background: transparent;
  cursor: pointer;
}

.report-ready-note {
  display: grid;
  gap: 4px;
  padding: 16px 18px;
  border: 1px solid #cbdafa;
  border-radius: 9px;
  color: #56657d;
  background: #f5f8ff;
}

.report-ready-note strong {
  color: #1f2f52;
}

.report-wizard-footer {
  min-height: 56px;
  padding-top: 12px;
  border-top: 1px solid #e2e9f4;
}

@media (max-width: 900px) {
  .report-parameter-grid,
  .report-wizard .report-dimension-grid,
  .report-confirm-panel {
    grid-template-columns: 1fr;
  }

  .report-field-wide,
  .report-confirm-card:first-child,
  .report-ready-note {
    grid-column: auto;
  }

  .report-wizard-step {
    gap: 5px;
  }

  .report-wizard-step > span {
    width: 22px;
    height: 22px;
    flex-basis: 22px;
  }
}

@media (max-width: 620px) {
  .report-wizard-step strong {
    font-size: 12px;
  }

  .report-wizard-toolbar,
  .report-wizard-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .report-wizard-footer .primary-action,
  .report-wizard-footer .secondary-action {
    width: 100%;
  }
}
```

- [ ] **Step 4: Run CSS and report tests**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="report wizard|static report navigation" tests/results-portal.test.mjs
```

Expected: all selected tests pass.

- [ ] **Step 5: Commit the responsive styling**

```bash
git add major-construction-platform/src/styles/80-report.css major-construction-platform/tests/results-portal.test.mjs
git commit -m "style: refine report wizard layout"
```

---

### Task 4: Complete regression and visual verification

**Files:**
- Modify only if verification exposes a wizard-specific defect:
  - `major-construction-platform/src/App.vue`
  - `major-construction-platform/src/styles/80-report.css`
  - `major-construction-platform/index.html`
  - `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: completed Vue and static wizard implementations.
- Produces: a tested production build and visual evidence that text remains inside components.

- [ ] **Step 1: Run the full Node test suite**

Run:

```bash
cd major-construction-platform
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run:

```bash
cd major-construction-platform
npm run build
```

Expected: `vue-tsc -b`, Vite build, and Sites worker build all exit with code 0.

- [ ] **Step 3: Launch the local application for visual inspection**

Run:

```bash
cd major-construction-platform
npm run dev
```

Open:

```text
http://localhost:5173/index.html?tab=chain&reportView=create&professionalTab=trend&view=job-report
```

Verify at desktop width:

- The stepper is approximately 44px high.
- Step labels, dimension titles, dimension descriptions, and footer buttons do not overflow.
- Step 1 uses a two-column parameter and dimension layout.
- Step 2 TOC scrolls inside its panel and the footer remains visible.
- Step 3 summary wraps long report titles and shows the selected dimensions.

Verify at a width below 900px:

- Parameter fields, dimension cards, and confirmation cards use one column.
- No horizontal scrollbar appears inside the report page.
- Step labels and footer controls remain readable.

- [ ] **Step 4: Exercise the end-to-end report path**

Use the page controls to:

1. Open `＋ 新建报告`.
2. Clear the title and verify “请输入报告标题”.
3. Restore the title and deselect all dimensions; verify “请至少选择一个报告维度”.
4. Select one dimension and advance to step 2.
5. Edit one TOC item and advance to step 3.
6. Confirm the summary contains the edited TOC counts and current parameter values.
7. Return to steps 1 and 2 and confirm prior data remains.
8. Return to step 3 and click `AI 开始生成报告`.
9. Confirm the generating screen appears, followed by the editor.
10. Click `返回配置` and confirm the wizard returns to step 3.

- [ ] **Step 5: Run diff and repository checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the planned report wizard files and documentation are changed.

- [ ] **Step 6: Commit any verification-only fixes**

If Task 4 required code changes:

```bash
git add major-construction-platform/src/App.vue major-construction-platform/src/styles/80-report.css major-construction-platform/index.html major-construction-platform/tests/results-portal.test.mjs
git commit -m "fix: harden report wizard interactions"
```

If no code changed during verification, do not create an empty commit.
