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

test('basic info chain industry is selected from research industries with a custom option', () => {
  assert.match(appVue, /const industryChainOptions = computed/)
  assert.match(appVue, /INDUSTRY_NODES\.map/)
  assert.match(appVue, /const customChainIndustryMode =/)
  assert.match(appVue, /v-for="option in industryChainOptions"/)
  assert.match(appVue, /basicInfoCustomChainIndustry/)
  assert.match(appVue, /v-if="basicInfoForm\.chainIndustry === customChainIndustryMode"/)

  assert.match(staticHtml, /const staticBasicChainOptions = \(\) =>/)
  assert.match(staticHtml, /data-basic-chain-select/)
  assert.match(staticHtml, /data-basic-custom-chain/)
  assert.match(staticHtml, /staticCustomChainIndustryValue/)
})

test('custom chain industry entries are merged into the industry sankey graph', () => {
  assert.match(appVue, /const customIndustrySankeyEntries = ref/)
  assert.match(appVue, /const upsertCustomIndustrySankeyEntry = \(chainIndustry: string\) =>/)
  assert.match(appVue, /const industrySankeyNodesForView = computed/)
  assert.match(appVue, /customIndustrySankeyEntries\.value/)
  assert.match(appVue, /v-for="node in industrySankeyNodesForView"/)

  assert.match(staticHtml, /const staticCustomIndustrySankeyEntries = \[\]/)
  assert.match(staticHtml, /const upsertStaticCustomIndustrySankeyEntry = \(chainIndustry = ''\) =>/)
  assert.match(staticHtml, /staticCustomIndustrySankeyEntries/)
  assert.match(staticHtml, /staticIndustrySankeyNodesForView/)
})
