# CMS AI Course Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clickable CMS "create AI course" demo that starts from the AI course list page, opens the long creation modal, lets the user select an official major, then hands off into the existing industry research management page.

**Architecture:** Extend the existing `industry-research-admin` CMS surface instead of creating a new page. Keep Vue and standalone HTML parity: `src/App.vue` owns the Vite app path, and `industry-research-admin.html` remains the directly openable demo path. Store only the course creation handoff in `localStorage`; keep existing industry research initialization state separate.

**Tech Stack:** Vue 3 Composition API, plain HTML/CSS for static parity, Node built-in test runner, Vite build.

## Global Constraints

- Match the supplied CMS screenshots: dense admin layout, dark blue left sidebar, blue primary buttons, light gray form rows, 3px radius.
- No backend integration, authentication, real upload processing, or real CMS API calls.
- Use storage key `major-construction-platform:cms-ai-course-creation` for created course handoff.
- Preserve storage key `major-construction-platform:industry-research` for industry research initialization.
- Update both `major-construction-platform/src/App.vue` and `major-construction-platform/industry-research-admin.html`.
- Use test-first implementation: every production change is preceded by a failing test.
- Run `npm test` and `npm run build` in `major-construction-platform` before completion.

---

## File Structure

- Modify: `major-construction-platform/tests/industry-research-management.test.mjs`
  - Adds source-level regression tests for the AI course list, create modal, official major picker, handoff state, and static HTML parity.
- Modify: `major-construction-platform/src/App.vue`
  - Adds CMS AI course list mode, create modal state, official major picker state, validation, and handoff into the existing industry research page.
- Modify: `major-construction-platform/src/styles/95-cms-admin.css`
  - Adds CMS list, filter, table, modal, picker, upload, validation, and form layout styles that match the screenshots.
- Modify: `major-construction-platform/industry-research-admin.html`
  - Mirrors the same clickable CMS loop for direct `file://` demo use.

---

### Task 1: Source Tests For CMS AI Course Creation Loop

**Files:**
- Modify: `major-construction-platform/tests/industry-research-management.test.mjs`
- Test: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: existing constants `appVue`, `stylesCss`, `localHtml`, and `rootLocalHtml` in the test file.
- Produces: failing tests that require the Vue and static implementations to expose stable markers:
  - `cmsAiCourseCreationStateKey`
  - `cmsAiCoursePageMode`
  - `openCmsAiCourseCreateDialog`
  - `confirmCmsOfficialMajorSelection`
  - `confirmCmsAiCourseCreation`
  - CSS classes `cms-ai-course-list-page`, `cms-ai-course-modal`, `cms-official-major-picker`

- [ ] **Step 1: Write the failing tests**

Append these tests after `industry research CMS persists selected chains for demo handoff`:

```js
test('CMS AI course list is the upper-level entry before industry research management', () => {
  assert.match(appVue, /cmsAiCoursePageMode = ref<'list' \| 'industry'>\('list'\)/)
  assert.match(appVue, /class="cms-ai-course-list-page"/)
  assert.match(appVue, /AI课管理/)
  assert.match(appVue, /AI课使用/)
  assert.match(appVue, /AI课运营管理/)
  assert.match(appVue, /创建AI课/)
  assert.match(appVue, /课程名称或课程id/)
  assert.match(appVue, /共查询到 91 条结果/)
  assert.match(appVue, /萧瑟专业建设520/)
})

test('CMS AI course creation modal exposes the staged long form', () => {
  assert.match(appVue, /openCmsAiCourseCreateDialog/)
  assert.match(appVue, /class="cms-ai-course-modal"/)
  assert.match(appVue, /class="cms-ai-course-modal-body"/)
  assert.match(appVue, /class="cms-ai-course-modal-footer"/)
  assert.match(appVue, /创建AI课/)
  for (const label of ['名称', '名称英文', '介绍', '所属学校', '是否开放', '课程封面', '工作室', '是否为学分AI课', '合同管理']) {
    assert.match(appVue, new RegExp(label))
  }
})

test('school selection reveals platform source model type college and major controls', () => {
  assert.match(appVue, /selectCmsAiCourseSchool/)
  assert.match(appVue, /清华大学（envning）（uvid = 91）/)
  assert.match(appVue, /平台类型/)
  assert.match(appVue, /教学平台/)
  assert.match(appVue, /培训平台/)
  assert.match(appVue, /来源/)
  assert.match(appVue, /学堂自研/)
  assert.match(appVue, /可选基座模型/)
  assert.match(appVue, /智谱GLM-4-Plus/)
  assert.match(appVue, /DeepSeek-V3/)
  assert.match(appVue, /类型/)
  assert.match(appVue, /学科共建/)
  assert.match(appVue, /专业建设/)
  assert.match(appVue, /所属学院/)
  assert.match(appVue, /所属专业/)
  assert.match(appVue, /添加专业/)
})

test('official major picker supports undergraduate vocational search and confirmation', () => {
  assert.match(appVue, /cmsOfficialMajorLevel = ref<'undergraduate' \| 'vocational'>/)
  assert.match(appVue, /filteredCmsOfficialMajors = computed/)
  assert.match(appVue, /openCmsOfficialMajorPicker/)
  assert.match(appVue, /confirmCmsOfficialMajorSelection/)
  assert.match(appVue, /class="cms-official-major-picker"/)
  assert.match(appVue, /本科/)
  assert.match(appVue, /职教/)
  assert.match(appVue, /080717T/)
  assert.match(appVue, /人工智能/)
  assert.match(appVue, /081008T/)
  assert.match(appVue, /智能建造/)
  assert.match(appVue, /510209/)
  assert.match(appVue, /人工智能技术应用/)
  assert.match(appVue, /440304/)
  assert.match(appVue, /智能建造技术/)
})

test('CMS AI course creation persists handoff state and switches into industry research', () => {
  assert.match(appVue, /const cmsAiCourseCreationStateKey = 'major-construction-platform:cms-ai-course-creation'/)
  assert.match(appVue, /confirmCmsAiCourseCreation/)
  assert.match(appVue, /localStorage\.setItem\(cmsAiCourseCreationStateKey/)
  assert.match(appVue, /cmsAiCoursePageMode\.value = 'industry'/)
  assert.match(appVue, /validateCmsAiCourseCreation/)
  assert.match(appVue, /请选择所属学校/)
  assert.match(appVue, /请选择所属专业/)
})

test('standalone CMS html mirrors AI course creation loop', () => {
  for (const source of [localHtml, rootLocalHtml]) {
    assert.match(source, /cms-ai-course-list-page/)
    assert.match(source, /创建AI课/)
    assert.match(source, /cms-ai-course-modal/)
    assert.match(source, /清华大学（envning）（uvid = 91）/)
    assert.match(source, /学科共建/)
    assert.match(source, /添加专业/)
    assert.match(source, /cms-official-major-picker/)
    assert.match(source, /major-construction-platform:cms-ai-course-creation/)
    assert.match(source, /showIndustryResearchPage/)
  }
})

test('CMS AI course creation has dedicated list modal and picker styling', () => {
  assert.match(stylesCss, /\.cms-ai-course-list-page\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-filter-grid\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-table\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-modal\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-modal-body\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-modal-footer\s*\{/)
  assert.match(stylesCss, /\.cms-official-major-picker\s*\{/)
  assert.match(stylesCss, /\.cms-field-error\s*\{/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd major-construction-platform
npm test -- tests/industry-research-management.test.mjs
```

Expected: FAIL with missing markers such as `cmsAiCoursePageMode`, `cms-ai-course-list-page`, and `cmsAiCourseCreationStateKey`.

- [ ] **Step 3: Commit only the failing tests**

Run:

```bash
git add major-construction-platform/tests/industry-research-management.test.mjs
git commit -m "test: cover cms ai course creation loop"
```

Expected: commit succeeds with only the test file staged.

---

### Task 2: Vue CMS AI Course List, Modal, Picker, And Handoff

**Files:**
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/src/styles/95-cms-admin.css`
- Test: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: failing tests from Task 1.
- Produces:
  - `cmsAiCourseCreationStateKey: string`
  - `cmsAiCoursePageMode: Ref<'list' | 'industry'>`
  - `openCmsAiCourseCreateDialog(): void`
  - `closeCmsAiCourseCreateDialog(): void`
  - `selectCmsAiCourseSchool(schoolId: string): void`
  - `openCmsOfficialMajorPicker(): void`
  - `confirmCmsOfficialMajorSelection(): void`
  - `validateCmsAiCourseCreation(): boolean`
  - `confirmCmsAiCourseCreation(): void`

- [ ] **Step 1: Add Vue state and data constants**

In `src/App.vue`, near `industryResearchStateKey`, add:

```ts
const cmsAiCourseCreationStateKey = 'major-construction-platform:cms-ai-course-creation'
type CmsAiCoursePageMode = 'list' | 'industry'
type CmsOfficialMajorLevel = 'undergraduate' | 'vocational'
type CmsAiCourseForm = {
  name: string
  englishName: string
  intro: string
  schoolId: string
  schoolLabel: string
  platformType: 'teaching' | 'training'
  openStatus: 'no' | 'yes'
  source: string
  model: string
  defaultModel: string
  typeLevel1: string
  typeLevel2: string
  college: string
  majorCode: string
  majorName: string
  majorEducationLevel: CmsOfficialMajorLevel | ''
  studio: string
  creditCourse: 'no' | 'yes'
}
type CmsOfficialMajor = {
  level: CmsOfficialMajorLevel
  code: string
  name: string
  category: string
}
const cmsAiCourseSchools = [
  { id: '91', label: '清华大学（envning）（uvid = 91）' },
  { id: '102', label: '黄河大学（demo）（uvid = 102）' },
  { id: '118', label: '中国海洋大学（envning）（uvid = 118）' }
]
const cmsAiCourseRows = [
  { id: 3182, name: '萧瑟专业建设520', open: '是', source: '学堂自研 - 智谱GLM-4-Plus', type: '共建课程-专业建设', school: '黄河大学', platform: '教学平台' },
  { id: 3180, name: 'm空 专业建设', open: '是', source: '学堂自研 - 智谱GLM-4-Plus', type: '共建课程-专业建设', school: '黄河大学', platform: '教学平台' },
  { id: 3165, name: 'm专业建设', open: '是', source: '学堂自研 - 智谱GLM-4-Plus', type: '共建课程-专业建设', school: '黄河大学', platform: '教学平台' },
  { id: 3139, name: '萧瑟专业建设512', open: '是', source: '学堂自研 - DeepSeek-V3', type: '共建课程-专业建设', school: '黄河大学', platform: '教学平台' },
  { id: 3096, name: '中国海洋大学的AI课', open: '是', source: '学堂自研 - 智谱GLM-4-Plus', type: '共建课程-专业建设', school: '中国海洋大学', platform: '教学平台' }
]
const cmsModelOptions = ['智谱GLM-4-Plus', '通义千问Max', '通义千问Plus', '文心4.0Turbo', 'DeepSeek-V3', 'DeepSeek-R1', 'Gemini2.5Pro', 'Gemini3Pro', 'DeepSeekV3.2-thinking', 'DeepSeekV3.2', 'GPT-5.2', 'GPT-5.4', 'qwen3.6-plus', 'qwen3.6-max']
const cmsOfficialMajors: CmsOfficialMajor[] = [
  { level: 'undergraduate', code: '080717T', name: '人工智能', category: '工学 / 电子信息类' },
  { level: 'undergraduate', code: '081008T', name: '智能建造', category: '工学 / 土木类' },
  { level: 'undergraduate', code: '080901', name: '计算机科学与技术', category: '工学 / 计算机类' },
  { level: 'undergraduate', code: '080910T', name: '数据科学与大数据技术', category: '工学 / 计算机类' },
  { level: 'vocational', code: '510209', name: '人工智能技术应用', category: '电子与信息大类 / 计算机类' },
  { level: 'vocational', code: '440304', name: '智能建造技术', category: '土木建筑大类 / 土建施工类' },
  { level: 'vocational', code: '510203', name: '软件技术', category: '电子与信息大类 / 计算机类' },
  { level: 'vocational', code: '510205', name: '大数据技术', category: '电子与信息大类 / 计算机类' }
]
const createBlankCmsAiCourseForm = (): CmsAiCourseForm => ({
  name: '',
  englishName: '',
  intro: '',
  schoolId: '',
  schoolLabel: '',
  platformType: 'teaching',
  openStatus: 'no',
  source: '学堂自研',
  model: '智谱GLM-4-Plus',
  defaultModel: '智谱GLM-4-Plus',
  typeLevel1: '',
  typeLevel2: '',
  college: '',
  majorCode: '',
  majorName: '',
  majorEducationLevel: '',
  studio: '无',
  creditCourse: 'no'
})
```

Then near existing refs add:

```ts
const cmsAiCoursePageMode = ref<CmsAiCoursePageMode>('list')
const cmsAiCourseCreateDialogOpen = ref(false)
const cmsAiCourseForm = ref<CmsAiCourseForm>(createBlankCmsAiCourseForm())
const cmsAiCourseValidationErrors = ref<Record<string, string>>({})
const cmsOfficialMajorPickerOpen = ref(false)
const cmsOfficialMajorLevel = ref<CmsOfficialMajorLevel>('undergraduate')
const cmsOfficialMajorKeyword = ref('')
const cmsSelectedOfficialMajorCode = ref('')
```

- [ ] **Step 2: Add computed values and handlers**

In `src/App.vue`, near other computed values and handlers, add:

```ts
const cmsAiCourseSchoolSelected = computed(() => cmsAiCourseForm.value.schoolId !== '')
const cmsAiCourseNeedsMajor = computed(() =>
  cmsAiCourseForm.value.typeLevel1 === '学科共建'
  && cmsAiCourseForm.value.typeLevel2 === '专业建设'
  && cmsAiCourseForm.value.college !== ''
)
const filteredCmsOfficialMajors = computed(() => {
  const keyword = cmsOfficialMajorKeyword.value.trim().toLowerCase()
  return cmsOfficialMajors.filter((major) => {
    if (major.level !== cmsOfficialMajorLevel.value) return false
    if (!keyword) return true
    return major.name.toLowerCase().includes(keyword) || major.code.toLowerCase().includes(keyword)
  })
})
const selectedCmsOfficialMajor = computed(() =>
  cmsOfficialMajors.find((major) => major.code === cmsSelectedOfficialMajorCode.value)
)

const openCmsAiCourseCreateDialog = () => {
  cmsAiCourseForm.value = createBlankCmsAiCourseForm()
  cmsAiCourseValidationErrors.value = {}
  cmsAiCourseCreateDialogOpen.value = true
}

const closeCmsAiCourseCreateDialog = () => {
  cmsAiCourseCreateDialogOpen.value = false
  cmsOfficialMajorPickerOpen.value = false
}

const selectCmsAiCourseSchool = (schoolId: string) => {
  const school = cmsAiCourseSchools.find((item) => item.id === schoolId)
  cmsAiCourseForm.value.schoolId = school?.id ?? ''
  cmsAiCourseForm.value.schoolLabel = school?.label ?? ''
}

const openCmsOfficialMajorPicker = () => {
  cmsOfficialMajorLevel.value = cmsAiCourseForm.value.majorEducationLevel || 'undergraduate'
  cmsSelectedOfficialMajorCode.value = cmsAiCourseForm.value.majorCode
  cmsOfficialMajorKeyword.value = ''
  cmsOfficialMajorPickerOpen.value = true
}

const confirmCmsOfficialMajorSelection = () => {
  const major = selectedCmsOfficialMajor.value
  if (!major) return
  cmsAiCourseForm.value.majorCode = major.code
  cmsAiCourseForm.value.majorName = major.name
  cmsAiCourseForm.value.majorEducationLevel = major.level
  cmsOfficialMajorPickerOpen.value = false
}

const validateCmsAiCourseCreation = () => {
  const errors: Record<string, string> = {}
  if (!cmsAiCourseForm.value.name.trim()) errors.name = '请输入名称'
  if (!cmsAiCourseForm.value.schoolId) errors.school = '请选择所属学校'
  if (cmsAiCourseForm.value.typeLevel1 !== '学科共建' || cmsAiCourseForm.value.typeLevel2 !== '专业建设') errors.type = '请选择学科共建 / 专业建设'
  if (!cmsAiCourseForm.value.college) errors.college = '请选择所属学院'
  if (!cmsAiCourseForm.value.majorCode) errors.major = '请选择所属专业'
  cmsAiCourseValidationErrors.value = errors
  return Object.keys(errors).length === 0
}

const confirmCmsAiCourseCreation = () => {
  if (!validateCmsAiCourseCreation()) return
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(cmsAiCourseCreationStateKey, JSON.stringify({
      ...cmsAiCourseForm.value,
      createdAt: new Date().toISOString()
    }))
  }
  cmsAiCourseCreateDialogOpen.value = false
  cmsOfficialMajorPickerOpen.value = false
  cmsAiCoursePageMode.value = 'industry'
}
```

- [ ] **Step 3: Replace the CMS branch with list-or-industry mode**

Inside `v-else-if="isIndustryResearchAdminView"`, keep the sidebar and topbar. Replace the body content with:

```vue
<section class="cms-page-body">
  <article v-if="cmsAiCoursePageMode === 'list'" class="cms-ai-course-list-page">
    <!-- CMS AI course filters, table, create button, modal, picker -->
  </article>
  <article v-else class="cms-management-card">
    <!-- Existing industry research management card content goes here unchanged -->
  </article>
</section>
```

The list article must include:

```vue
<nav class="cms-ai-course-tabs" aria-label="AI 课程管理">
  <button class="active" type="button">AI课管理</button>
  <button type="button">AI课使用</button>
  <button type="button">AI课运营管理</button>
</nav>
<section class="cms-ai-course-filter-grid">
  <label><span>课程名称或课程id</span><input placeholder="课程名称或课程id"></label>
  <label><span>所属学校</span><input placeholder="输入所属学校名"></label>
  <label><span>所属平台</span><select><option>请选择</option></select></label>
  <label><span>交付状态</span><select><option>请选择</option></select></label>
  <label><span>是否开放</span><select><option>请选择</option></select></label>
  <label><span>来源</span><select><option>请选择</option></select></label>
  <label><span>类型</span><select><option>共建课程-专业建设</option></select></label>
  <label><span>AI课档位</span><select><option>请选择</option></select></label>
  <label><span>合同档位</span><select><option>请选择</option></select></label>
  <label><span>合同状态</span><select><option>请选择</option></select></label>
  <label><span>是否上架 xuetang.ai</span><select><option>请选择</option></select></label>
  <label><span>标签筛选</span><select><option>请选择</option></select></label>
</section>
<div class="cms-ai-course-actions">
  <button class="cms-primary-button" type="button">查询</button>
  <button class="cms-link-button" type="button">清空</button>
  <button class="cms-primary-button" type="button" @click="openCmsAiCourseCreateDialog">创建AI课</button>
</div>
<p class="cms-ai-course-result-count">共查询到 91 条结果</p>
<table class="cms-ai-course-table">
  <thead>
    <tr><th>AI课程ID</th><th>名称</th><th>是否开放</th><th>来源</th><th>类型</th><th>所属学校</th><th>所属平台</th><th>操作</th></tr>
  </thead>
  <tbody>
    <tr v-for="course in cmsAiCourseRows" :key="course.id">
      <td>{{ course.id }}</td>
      <td>{{ course.name }}</td>
      <td>{{ course.open }}</td>
      <td>{{ course.source }}</td>
      <td>{{ course.type }}</td>
      <td>{{ course.school }}</td>
      <td>{{ course.platform }}</td>
      <td><button class="cms-link-button" type="button">管理</button></td>
    </tr>
  </tbody>
</table>
```

Move the existing industry card content into the `v-else` article without changing its internal industry research behavior.

- [ ] **Step 4: Add modal and picker markup**

Place the modal after the table within the list article:

```vue
<section v-if="cmsAiCourseCreateDialogOpen" class="cms-modal-overlay" aria-label="创建AI课弹窗">
  <div class="cms-ai-course-modal" role="dialog" aria-modal="true">
    <header class="cms-ai-course-modal-header">
      <h2>创建AI课</h2>
      <button type="button" aria-label="关闭" @click="closeCmsAiCourseCreateDialog">×</button>
    </header>
    <div class="cms-ai-course-modal-body">
      <label class="cms-form-row required"><span>名称</span><input v-model="cmsAiCourseForm.name" placeholder="专业建设"></label>
      <p v-if="cmsAiCourseValidationErrors.name" class="cms-field-error">{{ cmsAiCourseValidationErrors.name }}</p>
      <label class="cms-form-row"><span>名称英文</span><input v-model="cmsAiCourseForm.englishName"></label>
      <label class="cms-form-row"><span>介绍</span><textarea v-model="cmsAiCourseForm.intro"></textarea></label>
      <label class="cms-form-row required">
        <span>所属学校</span>
        <select :value="cmsAiCourseForm.schoolId" @change="selectCmsAiCourseSchool(($event.target as HTMLSelectElement).value)">
          <option value="">输入所属学校名称或域名</option>
          <option v-for="school in cmsAiCourseSchools" :key="school.id" :value="school.id">{{ school.label }}</option>
        </select>
      </label>
      <p v-if="cmsAiCourseValidationErrors.school" class="cms-field-error">{{ cmsAiCourseValidationErrors.school }}</p>

      <template v-if="cmsAiCourseSchoolSelected">
        <div class="cms-radio-row"><span>平台类型</span><label><input v-model="cmsAiCourseForm.platformType" type="radio" value="teaching">教学平台</label><label><input v-model="cmsAiCourseForm.platformType" type="radio" value="training">培训平台</label></div>
        <div class="cms-radio-row"><span>来源</span><label><input checked type="radio">学堂自研</label></div>
        <section class="cms-model-panel">
          <strong>可选基座模型</strong>
          <label v-for="model in cmsModelOptions" :key="model"><input v-model="cmsAiCourseForm.model" type="radio" :value="model">{{ model }}</label>
        </section>
        <label class="cms-form-row"><span>默认基座模型</span><select v-model="cmsAiCourseForm.defaultModel"><option v-for="model in cmsModelOptions" :key="model">{{ model }}</option></select></label>
        <label class="cms-form-row"><span>能力展示说明</span><input value="大模型能力由学生在线提供"></label>
        <div class="cms-upload-row"><span>能力展示图片</span><button type="button" class="cms-primary-button">点击上传</button><em>建议高度32像素</em></div>
        <label class="cms-form-row"><span>类型</span><select v-model="cmsAiCourseForm.typeLevel1"><option value="">请选择</option><option>教学</option><option>学科共建</option></select><select v-model="cmsAiCourseForm.typeLevel2"><option value="">请选择</option><option>基础版</option><option>专业建设</option></select></label>
        <p v-if="cmsAiCourseValidationErrors.type" class="cms-field-error">{{ cmsAiCourseValidationErrors.type }}</p>
        <label class="cms-form-row required"><span>所属学院</span><select v-model="cmsAiCourseForm.college"><option value="">请选择</option><option>学堂</option><option>土木工程学院</option><option>计算机学院</option></select></label>
        <p v-if="cmsAiCourseValidationErrors.college" class="cms-field-error">{{ cmsAiCourseValidationErrors.college }}</p>
        <label v-if="cmsAiCourseNeedsMajor" class="cms-form-row required"><span>所属专业</span><input readonly :value="cmsAiCourseForm.majorCode ? `${cmsAiCourseForm.majorCode} ${cmsAiCourseForm.majorName}` : ''" placeholder="输入并选择专业"><button type="button" class="cms-secondary-button" @click="openCmsOfficialMajorPicker">添加专业</button></label>
        <p v-if="cmsAiCourseValidationErrors.major" class="cms-field-error">{{ cmsAiCourseValidationErrors.major }}</p>
      </template>

      <label class="cms-form-row"><span>是否开放</span><select v-model="cmsAiCourseForm.openStatus"><option value="no">否</option><option value="yes">是</option></select></label>
      <div class="cms-cover-upload"><span>课程封面</span><div class="cms-cover-placeholder">图片</div><button class="cms-primary-button" type="button">点击上传</button><em>图片比例建议16:9，大小不超过300k</em></div>
      <label class="cms-form-row"><span>工作室</span><select v-model="cmsAiCourseForm.studio"><option>无</option></select></label>
      <div class="cms-radio-row"><span>是否为学分AI课</span><label><input v-model="cmsAiCourseForm.creditCourse" type="radio" value="yes">是</label><label><input v-model="cmsAiCourseForm.creditCourse" type="radio" value="no">否</label></div>
      <h3 class="cms-contract-title">合同管理</h3>
      <div class="cms-contract-grid">
        <div><span>AI课档位</span><label><input type="radio">卓越课</label><label><input type="radio">精品课</label><label><input type="radio">精品培育课</label><label><input type="radio">培育课</label></div>
        <div><span>服务档位</span><label><input type="radio">一档</label><label><input type="radio">二档</label><label><input type="radio">三档</label></div>
        <div><span>合同状态</span><label><input type="radio">已签合同</label><label><input type="radio">试用</label><label><input type="radio">演示/测试</label></div>
        <div><span>交付状态</span><label><input checked type="radio">未交付</label><label><input type="radio">已交付</label></div>
      </div>
    </div>
    <footer class="cms-ai-course-modal-footer">
      <button class="cms-secondary-button" type="button" @click="closeCmsAiCourseCreateDialog">取消</button>
      <button class="cms-primary-button" type="button" @click="confirmCmsAiCourseCreation">确定</button>
    </footer>
  </div>
</section>

<section v-if="cmsOfficialMajorPickerOpen" class="cms-modal-overlay nested" aria-label="官方专业选择框">
  <div class="cms-official-major-picker" role="dialog" aria-modal="true">
    <header class="cms-ai-course-modal-header"><h2>选择官方专业</h2><button type="button" @click="cmsOfficialMajorPickerOpen = false">×</button></header>
    <div class="cms-major-picker-toolbar">
      <button type="button" :class="{ active: cmsOfficialMajorLevel === 'undergraduate' }" @click="cmsOfficialMajorLevel = 'undergraduate'">本科</button>
      <button type="button" :class="{ active: cmsOfficialMajorLevel === 'vocational' }" @click="cmsOfficialMajorLevel = 'vocational'">职教</button>
      <input v-model="cmsOfficialMajorKeyword" placeholder="搜索专业名称或代码">
    </div>
    <div class="cms-major-option-list">
      <button v-for="major in filteredCmsOfficialMajors" :key="major.code" type="button" :class="{ selected: cmsSelectedOfficialMajorCode === major.code }" @click="cmsSelectedOfficialMajorCode = major.code">
        <strong>{{ major.code }} {{ major.name }}</strong><span>{{ major.category }}</span>
      </button>
    </div>
    <footer class="cms-ai-course-modal-footer"><button class="cms-secondary-button" type="button" @click="cmsOfficialMajorPickerOpen = false">取消</button><button class="cms-primary-button" type="button" @click="confirmCmsOfficialMajorSelection">确定</button></footer>
  </div>
</section>
```

- [ ] **Step 5: Add minimal CSS for the new classes**

Append to `src/styles/95-cms-admin.css`:

```css
.cms-ai-course-list-page {
  min-height: calc(100vh - 98px);
  padding: 22px;
  border-radius: 3px;
  background: #ffffff;
}

.cms-ai-course-tabs {
  display: flex;
  gap: 32px;
  border-bottom: 1px solid #e4e9f0;
}

.cms-ai-course-tabs button {
  position: relative;
  height: 44px;
  border: 0;
  color: #303742;
  font-weight: 700;
  background: transparent;
}

.cms-ai-course-tabs button.active {
  color: #1890ff;
}

.cms-ai-course-tabs button.active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #1890ff;
  content: "";
}

.cms-ai-course-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 14px 18px;
  margin-top: 18px;
}

.cms-ai-course-filter-grid label,
.cms-form-row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  color: #545c66;
  font-weight: 700;
}

.cms-ai-course-filter-grid input,
.cms-ai-course-filter-grid select,
.cms-form-row input,
.cms-form-row select,
.cms-form-row textarea,
.cms-major-picker-toolbar input {
  width: 100%;
  min-height: 38px;
  border: 1px solid #d9e0ea;
  border-radius: 3px;
  color: #303742;
  background: #ffffff;
}

.cms-form-row textarea {
  min-height: 64px;
  resize: vertical;
}

.cms-ai-course-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
}

.cms-ai-course-actions .cms-primary-button:last-child {
  margin-left: auto;
}

.cms-link-button {
  border: 0;
  color: #1890ff;
  background: transparent;
}

.cms-ai-course-result-count {
  margin: 18px 0 12px;
  color: #303742;
}

.cms-ai-course-table {
  width: 100%;
  border-collapse: collapse;
  color: #5f6670;
  table-layout: fixed;
}

.cms-ai-course-table th,
.cms-ai-course-table td {
  padding: 13px 12px;
  border: 1px solid #e8edf3;
  text-align: left;
  vertical-align: top;
}

.cms-ai-course-table th {
  color: #8b95a1;
  font-weight: 700;
  background: #fbfcfe;
}

.cms-modal-overlay {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.48);
}

.cms-modal-overlay.nested {
  z-index: 120;
}

.cms-ai-course-modal,
.cms-official-major-picker {
  display: grid;
  width: min(760px, calc(100vw - 80px));
  max-height: calc(100vh - 90px);
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-radius: 3px;
  background: #ffffff;
  box-shadow: 0 16px 42px rgba(23, 32, 44, 0.24);
}

.cms-official-major-picker {
  width: min(620px, calc(100vw - 80px));
}

.cms-ai-course-modal-header,
.cms-ai-course-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.cms-ai-course-modal-header h2 {
  margin: 0;
  font-size: 18px;
}

.cms-ai-course-modal-header button {
  border: 0;
  color: #9aa3ad;
  font-size: 24px;
  background: transparent;
}

.cms-ai-course-modal-body {
  display: grid;
  gap: 16px;
  overflow: auto;
  padding: 10px 24px 24px;
}

.cms-ai-course-modal-footer {
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #eef2f6;
}

.cms-form-row.required > span::before {
  color: #f56c6c;
  content: "* ";
}

.cms-field-error {
  margin: -8px 0 0 124px;
  color: #f56c6c;
  font-size: 13px;
}

.cms-radio-row,
.cms-upload-row,
.cms-cover-upload,
.cms-contract-grid > div {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #545c66;
  font-weight: 700;
}

.cms-model-panel,
.cms-contract-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
  padding: 18px 28px;
  background: #f5f7fa;
}

.cms-model-panel strong {
  grid-column: 1 / -1;
}

.cms-cover-placeholder {
  display: grid;
  width: 300px;
  height: 170px;
  place-items: center;
  border: 1px dashed #d8dee8;
  color: #b3bac4;
  background: #ffffff;
}

.cms-contract-title {
  margin: 8px 0 0 112px;
  font-size: 17px;
}

.cms-major-picker-toolbar {
  display: grid;
  grid-template-columns: 80px 80px minmax(0, 1fr);
  gap: 10px;
  padding: 0 24px 16px;
}

.cms-major-picker-toolbar button,
.cms-major-option-list button {
  border: 1px solid #d9e0ea;
  border-radius: 3px;
  background: #ffffff;
}

.cms-major-picker-toolbar button.active,
.cms-major-option-list button.selected {
  border-color: #1890ff;
  color: #1890ff;
  background: #f4faff;
}

.cms-major-option-list {
  display: grid;
  gap: 10px;
  max-height: 360px;
  overflow: auto;
  padding: 0 24px 24px;
}

.cms-major-option-list button {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  text-align: left;
}

.cms-major-option-list span {
  color: #7b8491;
}
```

- [ ] **Step 6: Run the targeted test to verify it passes for Vue/source markers**

Run:

```bash
cd major-construction-platform
npm test -- tests/industry-research-management.test.mjs
```

Expected: some tests may still fail because standalone HTML has not been updated in Task 3. Vue/source/style tests should pass.

- [ ] **Step 7: Commit Vue and CSS implementation**

Run:

```bash
git add major-construction-platform/src/App.vue major-construction-platform/src/styles/95-cms-admin.css
git commit -m "feat: add cms ai course creation flow"
```

Expected: commit succeeds with Vue/CSS changes only.

---

### Task 3: Standalone HTML Parity

**Files:**
- Modify: `major-construction-platform/industry-research-admin.html`
- Test: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: static tests from Task 1.
- Produces:
  - list page element `.cms-ai-course-list-page`
  - modal element `.cms-ai-course-modal`
  - picker element `.cms-official-major-picker`
  - function `showIndustryResearchPage()`
  - state key `major-construction-platform:cms-ai-course-creation`

- [ ] **Step 1: Add static list page, modal, picker, and page switch**

In `industry-research-admin.html`, wrap the existing management card in an industry container:

```html
<article class="management-card" id="industryPage" hidden>
  <!-- existing titlebar, tabs, and industry-panel stay here -->
</article>
```

Before it, add:

```html
<article class="cms-ai-course-list-page" id="courseListPage">
  <nav class="cms-ai-course-tabs"><button class="active">AI课管理</button><button>AI课使用</button><button>AI课运营管理</button></nav>
  <section class="cms-ai-course-filter-grid">
    <label><span>课程名称或课程id</span><input placeholder="课程名称或课程id"></label>
    <label><span>所属学校</span><input placeholder="输入所属学校名"></label>
    <label><span>所属平台</span><select><option>请选择</option></select></label>
    <label><span>交付状态</span><select><option>请选择</option></select></label>
    <label><span>类型</span><select><option>共建课程-专业建设</option></select></label>
    <label><span>标签筛选</span><select><option>请选择</option></select></label>
  </section>
  <div class="cms-ai-course-actions"><button class="primary">查询</button><button class="link-button">清空</button><button class="primary" id="openCreateCourse">创建AI课</button></div>
  <p class="cms-ai-course-result-count">共查询到 91 条结果</p>
  <table class="cms-ai-course-table">
    <thead><tr><th>AI课程ID</th><th>名称</th><th>是否开放</th><th>来源</th><th>类型</th><th>所属学校</th><th>所属平台</th><th>操作</th></tr></thead>
    <tbody id="courseRows"></tbody>
  </table>
</article>
```

Add modal and picker shells before `</main>`:

```html
<section class="cms-modal-overlay" id="createCourseOverlay" hidden>
  <div class="cms-ai-course-modal" role="dialog" aria-modal="true">
    <header class="cms-ai-course-modal-header"><h2>创建AI课</h2><button id="closeCreateCourse">×</button></header>
    <div class="cms-ai-course-modal-body" id="createCourseBody">
      <!-- static form fields matching Vue labels: 名称, 名称英文, 介绍, 所属学校, 平台类型, 来源, 可选基座模型, 类型, 所属学院, 所属专业, 合同管理 -->
    </div>
    <footer class="cms-ai-course-modal-footer"><button class="secondary" id="cancelCreateCourse">取消</button><button class="primary" id="confirmCreateCourse">确定</button></footer>
  </div>
</section>
<section class="cms-modal-overlay nested" id="majorPickerOverlay" hidden>
  <div class="cms-official-major-picker" role="dialog" aria-modal="true">
    <header class="cms-ai-course-modal-header"><h2>选择官方专业</h2><button id="closeMajorPicker">×</button></header>
    <div class="cms-major-picker-toolbar"><button class="active" data-major-level="undergraduate">本科</button><button data-major-level="vocational">职教</button><input id="majorSearch" placeholder="搜索专业名称或代码"></div>
    <div class="cms-major-option-list" id="majorOptions"></div>
    <footer class="cms-ai-course-modal-footer"><button class="secondary" id="cancelMajorPicker">取消</button><button class="primary" id="confirmMajorPicker">确定</button></footer>
  </div>
</section>
```

- [ ] **Step 2: Add static JavaScript for course rows and interactions**

In the script, before existing industry `chains`, add:

```js
const cmsAiCourseCreationStateKey = 'major-construction-platform:cms-ai-course-creation';
const cmsAiCourseRows = [
  [3182, '萧瑟专业建设520', '是', '学堂自研 - 智谱GLM-4-Plus', '共建课程-专业建设', '黄河大学', '教学平台'],
  [3180, 'm空 专业建设', '是', '学堂自研 - 智谱GLM-4-Plus', '共建课程-专业建设', '黄河大学', '教学平台'],
  [3165, 'm专业建设', '是', '学堂自研 - 智谱GLM-4-Plus', '共建课程-专业建设', '黄河大学', '教学平台'],
  [3139, '萧瑟专业建设512', '是', '学堂自研 - DeepSeek-V3', '共建课程-专业建设', '黄河大学', '教学平台']
];
const cmsOfficialMajors = [
  ['undergraduate', '080717T', '人工智能', '工学 / 电子信息类'],
  ['undergraduate', '081008T', '智能建造', '工学 / 土木类'],
  ['undergraduate', '080901', '计算机科学与技术', '工学 / 计算机类'],
  ['vocational', '510209', '人工智能技术应用', '电子与信息大类 / 计算机类'],
  ['vocational', '440304', '智能建造技术', '土木建筑大类 / 土建施工类']
];
let selectedMajorCode = '';
let currentMajorLevel = 'undergraduate';
const courseForm = { name: '', schoolId: '', schoolLabel: '', typeLevel1: '', typeLevel2: '', college: '', majorCode: '', majorName: '', majorEducationLevel: '' };
const showIndustryResearchPage = () => {
  document.querySelector('#courseListPage').hidden = true;
  document.querySelector('#industryPage').hidden = false;
};
const renderCourseRows = () => {
  document.querySelector('#courseRows').innerHTML = cmsAiCourseRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}<td><button class="link-button">管理</button></td></tr>`).join('');
};
const renderMajorOptions = () => {
  const keyword = document.querySelector('#majorSearch').value.trim().toLowerCase();
  document.querySelector('#majorOptions').innerHTML = cmsOfficialMajors
    .filter((major) => major[0] === currentMajorLevel && (!keyword || major[1].toLowerCase().includes(keyword) || major[2].toLowerCase().includes(keyword)))
    .map((major) => `<button class="${selectedMajorCode === major[1] ? 'selected' : ''}" data-major-code="${major[1]}"><strong>${major[1]} ${major[2]}</strong><span>${major[3]}</span></button>`)
    .join('');
};
```

Then add click handlers:

```js
renderCourseRows();
document.querySelector('#openCreateCourse').addEventListener('click', () => {
  document.querySelector('#createCourseOverlay').hidden = false;
});
document.querySelector('#closeCreateCourse').addEventListener('click', () => {
  document.querySelector('#createCourseOverlay').hidden = true;
});
document.querySelector('#cancelCreateCourse').addEventListener('click', () => {
  document.querySelector('#createCourseOverlay').hidden = true;
});
document.addEventListener('change', (event) => {
  if (event.target.id === 'courseSchool') {
    courseForm.schoolId = event.target.value;
    courseForm.schoolLabel = event.target.selectedOptions[0]?.textContent || '';
    document.querySelector('#schoolExpandedFields').hidden = courseForm.schoolId === '';
  }
  if (event.target.id === 'courseTypeLevel1') courseForm.typeLevel1 = event.target.value;
  if (event.target.id === 'courseTypeLevel2') courseForm.typeLevel2 = event.target.value;
  if (event.target.id === 'courseCollege') courseForm.college = event.target.value;
  const needsMajor = courseForm.typeLevel1 === '学科共建' && courseForm.typeLevel2 === '专业建设' && courseForm.college !== '';
  document.querySelector('#courseMajorRow').hidden = !needsMajor;
});
document.querySelector('#openMajorPicker').addEventListener('click', () => {
  document.querySelector('#majorPickerOverlay').hidden = false;
  renderMajorOptions();
});
document.querySelector('#majorSearch').addEventListener('input', renderMajorOptions);
document.querySelector('#majorOptions').addEventListener('click', (event) => {
  const option = event.target.closest('[data-major-code]');
  if (!option) return;
  selectedMajorCode = option.dataset.majorCode;
  renderMajorOptions();
});
document.querySelectorAll('[data-major-level]').forEach((button) => {
  button.addEventListener('click', () => {
    currentMajorLevel = button.dataset.majorLevel;
    document.querySelectorAll('[data-major-level]').forEach((item) => item.classList.toggle('active', item === button));
    renderMajorOptions();
  });
});
document.querySelector('#confirmMajorPicker').addEventListener('click', () => {
  const major = cmsOfficialMajors.find((item) => item[1] === selectedMajorCode);
  if (!major) return;
  courseForm.majorEducationLevel = major[0];
  courseForm.majorCode = major[1];
  courseForm.majorName = major[2];
  document.querySelector('#courseMajorInput').value = `${major[1]} ${major[2]}`;
  document.querySelector('#majorPickerOverlay').hidden = true;
});
document.querySelector('#confirmCreateCourse').addEventListener('click', () => {
  courseForm.name = document.querySelector('#courseName').value.trim();
  localStorage.setItem(cmsAiCourseCreationStateKey, JSON.stringify({ ...courseForm, createdAt: new Date().toISOString() }));
  document.querySelector('#createCourseOverlay').hidden = true;
  showIndustryResearchPage();
});
```

- [ ] **Step 3: Copy matching CSS into the standalone style block**

Copy the new CSS selectors from Task 2 into the `<style>` block, replacing `.cms-primary-button` with `.primary` where needed and adding:

```css
.link-button { border: 0; color: #1890ff; background: transparent; }
[hidden] { display: none !important; }
```

- [ ] **Step 4: Run the targeted test to verify Vue and static parity passes**

Run:

```bash
cd major-construction-platform
npm test -- tests/industry-research-management.test.mjs
```

Expected: PASS for the full `industry-research-management.test.mjs` file.

- [ ] **Step 5: Commit static HTML parity**

Run:

```bash
git add major-construction-platform/industry-research-admin.html
git commit -m "feat: mirror cms ai course flow in static demo"
```

Expected: commit succeeds with only the standalone HTML change.

---

### Task 4: Full Verification And Visual Smoke Check

**Files:**
- Modify only if verification exposes defects:
  - `major-construction-platform/src/App.vue`
  - `major-construction-platform/src/styles/95-cms-admin.css`
  - `major-construction-platform/industry-research-admin.html`
- Test: all `major-construction-platform/tests/*.mjs`

**Interfaces:**
- Consumes: implemented Vue and static flows.
- Produces: verified working CMS demo with no known test or build failures.

- [ ] **Step 1: Run all tests**

Run:

```bash
cd major-construction-platform
npm test
```

Expected: PASS. If it fails, capture the exact failing test and fix with a new failing test or by correcting the implementation to satisfy the existing failing test.

- [ ] **Step 2: Run production build**

Run:

```bash
cd major-construction-platform
npm run build
```

Expected: exit code 0. Known warnings about `/index.html` external script module type or chunk size are acceptable only if the build exits successfully.

- [ ] **Step 3: Start the dev server**

Run:

```bash
cd major-construction-platform
npm run dev
```

Expected: Vite starts and prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 4: Browser smoke the flow**

Open:

```text
http://localhost:5173/index.html?view=industry-research-admin
```

Verify:

- AI course list page is the first screen.
- `创建AI课` opens the modal.
- Selecting `清华大学（envning）（uvid = 91）` reveals platform type, source, model, type, and college fields.
- Selecting `学科共建`, `专业建设`, and `学堂` reveals `所属专业`.
- `添加专业` opens the official major picker.
- Selecting `本科 / 081008T 智能建造` and confirming fills the major row.
- Clicking `确定` switches to the existing industry research management page with `数据初始化`.
- Clicking `数据初始化` still shows initialization and recommendations.

- [ ] **Step 5: Static file smoke check**

Open the absolute file path:

```text
/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/major-construction-platform/industry-research-admin.html
```

Verify the same list, modal, official major picker, create confirmation, and industry research initialization flow.

- [ ] **Step 6: Commit any verification fixes**

If fixes were needed, commit them:

```bash
git add major-construction-platform/src/App.vue major-construction-platform/src/styles/95-cms-admin.css major-construction-platform/industry-research-admin.html major-construction-platform/tests/industry-research-management.test.mjs
git commit -m "fix: polish cms ai course creation verification"
```

Expected: commit only when verification fixes were actually made.

---

## Self-Review

- Spec coverage: The plan covers the upper-level CMS list, create modal, school expansion, type/college/major reveal, official major picker, creation handoff, Vue/static parity, validation markers, and full verification.
- Placeholder scan: No unresolved placeholders or vague "add tests" steps remain.
- Type consistency: Function and state names are consistent across tests and implementation tasks: `cmsAiCourseCreationStateKey`, `cmsAiCoursePageMode`, `openCmsAiCourseCreateDialog`, `confirmCmsOfficialMajorSelection`, and `confirmCmsAiCourseCreation`.
