import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'
import { COURSE_NODES } from '../src/mock/job-center.ts'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('vue job detail reads edited basic fields from overrides', () => {
  assert.match(appVue, /const selectedJobBasic = computed/)
  assert.match(appVue, /jobBasicForId\(selectedJobId\.value\)/)

  for (const field of ['name', 'occupation', 'occupationCode', 'groupName']) {
    assert.match(appVue, new RegExp(`displayBasicValue\\(selectedJobBasic\\.${field}\\)`))
  }
  assert.match(appVue, /<h2>\{\{ selectedJobBasic\?\.name \?\? selectedJob\.name \}\}<\/h2>/)
})

test('static job detail wires the basic info edit dialog and override data', () => {
  assert.match(staticHtml, /data-open-basic-dialog/)
  assert.match(staticHtml, /const getStaticBasicInfo = \(jobId = ''\) =>/)
  assert.match(staticHtml, /const showStaticBasicInfoDialog = \(\) =>/)
  assert.match(staticHtml, /const saveStaticBasicInfoDialog = \(dialog\) =>/)
  assert.match(staticHtml, /refreshStaticBasicDialogState/)
  assert.match(staticHtml, /staticJobBasicOverrides = \{[\s\S]*\[jobId\]:/)
})

test('static job detail exposes and refreshes related course actions', () => {
  assert.match(staticHtml, /const staticCourseRelationHtml = \(jobId = 'job-bim-modeler'\) =>/)
  assert.match(staticHtml, /data-open-course-dialog/)
  assert.match(appVue, /<h4>相关课程<\/h4>/)
  assert.match(staticHtml, /<h4>相关课程<\/h4>/)
  assert.match(staticHtml, /关联课程将同步展示到产业岗位课程图谱中/)
  assert.match(staticHtml, /课程编码：/)
  assert.match(staticHtml, /data-remove-static-course/)
  assert.match(staticHtml, /请点击“增加课程”进行关联/)
})

test('related courses use simulated course codes instead of internal ids', () => {
  const bimDeepeningCourseCodes = COURSE_NODES
    .filter((course) => course.jobIds.includes('job-bim-deepening'))
    .map((course) => course.code)

  assert.deepEqual(bimDeepeningCourseCodes, ['ZNJZ-BIM-001', 'ZNJZ-BIM-002', 'ZNJZ-PFAB-001'])
  assert.match(appVue, /课程编码：\{\{ course\.code \}\}/)
  assert.match(appVue, /\[course\.name, course\.code, course\.id\]/)
  assert.match(staticHtml, /课程编码：\$\{staticEscapeText\(course\.code \|\| course\.id\)\}/)
  assert.doesNotMatch(staticHtml, /课程编码：\$\{staticEscapeText\(course\.id\)\}/)
})

test('basic info dialog aligns field labels, editors, and helper text rows', () => {
  assert.match(stylesCss, /\.job-basic-form-grid:not\(\.single\) \.task-form-field\s*\{[\s\S]*grid-template-rows:\s*18px 42px 16px/)
  assert.match(stylesCss, /\.job-basic-form-grid:not\(\.single\) \.task-form-field em\s*\{[\s\S]*min-height:\s*16px/)
})

test('basic info dialog uses a structured industry editor instead of a chain industry select', () => {
  assert.match(appVue, /type IndustryEntityEditForm =/)
  assert.match(appVue, /const industryEntityForm = ref<IndustryEntityEditForm>/)
  assert.match(appVue, /产业链描述/)
  assert.match(appVue, /产业名称/)
  assert.match(appVue, /所属环节/)
  assert.match(appVue, /关键技术\/场景/)
  assert.match(appVue, /代表企业\/需求线索/)
  assert.doesNotMatch(appVue, /const customChainIndustryMode =/)
  assert.doesNotMatch(appVue, /v-for="option in industryChainOptions"/)

  assert.match(staticHtml, /data-basic-chain-name/)
  assert.match(staticHtml, /data-basic-chain-desc/)
  assert.match(staticHtml, /data-basic-industry-name/)
  assert.match(staticHtml, /data-basic-industry-stage/)
  assert.match(staticHtml, /data-basic-industry-key-fields/)
  assert.doesNotMatch(staticHtml, /data-basic-chain-select/)
})

test('basic info dialog uses single job level options', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /<option[^>]*>初级<\/option>|'初级'/)
    assert.match(source, /<option[^>]*>中级<\/option>|'中级'/)
    assert.match(source, /<option[^>]*>高级<\/option>|'高级'/)
    assert.doesNotMatch(source, /初级 \/ 中级/)
    assert.doesNotMatch(source, /中级 \/ 高级/)
    assert.doesNotMatch(source, /初中级/)
  }
})

test('manual job add keeps only the low cost creation fields', () => {
  assert.match(appVue, /v-if="manualJobDialogOpen" class="job-basic-form-card quick-job-form-card"/)
  assert.match(appVue, /<span>岗位名称<\/span>[\s\S]*<span>所属岗位群<\/span>[\s\S]*<span>所属产业链<\/span>[\s\S]*<span>所属产业<\/span>/)
  assert.match(appVue, /v-else-if="industryEntityForm\.entityType === 'job'" class="job-basic-form-card"/)
  assert.match(appVue, /const manualJobIndustryOptions = computed/)
  assert.match(appVue, /manualJobDialogOpen\.value[\s\S]*return form\.name\.trim\(\) !== ''/)
  assert.match(appVue, /v-if="manualJobDialogOpen"[\s\S]*<label class="task-form-field required">\s*<span>岗位名称<\/span>[\s\S]*<label class="task-form-field">\s*<span>所属岗位群<\/span>[\s\S]*<label class="task-form-field">\s*<span>所属产业链<\/span>[\s\S]*<label class="task-form-field">\s*<span>所属产业<\/span>/)

  assert.match(staticHtml, /data-manual-job-quick-form/)
  assert.match(staticHtml, /data-basic-industry-id/)
  assert.match(staticHtml, /if \(dialog\.querySelector\('\[data-manual-job-quick-form\]'\)\) \{\s*if \(save\) save\.disabled = !name/)
  assert.match(staticHtml, /岗位名称[\s\S]*所属岗位群[\s\S]*所属产业链[\s\S]*所属产业/)
})

test('industry chain and industry graph nodes open the same detail editor', () => {
  assert.match(appVue, /const openIndustryEntityDialog = \(entityType: 'chain' \| 'industry'/)
  assert.match(appVue, /@click\.stop="openIndustryEntityDialog\('chain', chain\.id\)"/)
  assert.match(appVue, /@click\.stop="openIndustryEntityDialog\('industry', industry\.id\)"/)
  assert.match(appVue, /const saveIndustryEntityInfo = \(\) =>/)
  assert.match(appVue, /industryChainOverrides\.value/)
  assert.match(appVue, /industryNodeOverrides\.value/)

  assert.match(staticHtml, /data-open-static-industry-entity="chain"/)
  assert.match(staticHtml, /data-open-static-industry-entity="industry"/)
  assert.match(staticHtml, /const showStaticIndustryEntityDialog = \(entityType, entityId, jobId = staticSelectedJobId\) =>/)
  assert.match(staticHtml, /const saveStaticIndustryEntityDialog = \(dialog\) =>/)
})
