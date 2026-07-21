import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const workbookBuilder = await readFile(new URL('../spreadsheet_build/build_research_summary_prompts.mjs', import.meta.url), 'utf8')

const pageKeys = [
  'industry-chain',
  'industry-region',
  'industry-policy',
  'industry-company',
  'professional-map',
  'professional-trend',
  'job-portrait',
  'job-demand',
  'job-forecast',
]

test('Vue owns one dynamic active summary for all nine pages', () => {
  assert.match(app, /activeResearchSummaryContext/)
  assert.match(app, /researchSummaryClient\.summarize/)
  assert.match(app, /activeResearchSummary\.title/)
  assert.match(app, /v-for="item in activeResearchSummary\.items"/)
  assert.match(app, /researchSummaryLoading/)
  assert.doesNotMatch(app, /const industryResearchBriefs:/)
  assert.doesNotMatch(app, /const professionalAnalysisBriefs:/)
  assert.doesNotMatch(app, /const jobResearchBriefs:/)
})

test('Vue context contains every dynamic page key', () => {
  for (const pageKey of pageKeys) assert.match(app, new RegExp(`['"]${pageKey}['"]`))
})

test('standalone entry declares the same nine page keys', () => {
  for (const pageKey of pageKeys) assert.match(html, new RegExp(`['"]${pageKey}['"]`))
})

test('standalone fallback builds interpretive judgments from rich page groups', () => {
  assert.match(html, /staticResearchSummaryInsightBuilders/)
  assert.match(html, /staticBuildJobPortraitInsights/)
  assert.match(html, /总体研判.*结构特征.*机会与问题.*建设启示/)
  assert.match(html, /title:\s*context\.subject\.slice\(0, 40\)/)
  assert.doesNotMatch(html, /title:\s*`\$\{context\.subject\}｜\$\{config\.title\}`/)
  assert.doesNotMatch(html, /context\.facts\.slice\(0, 3\)\.map\(\(fact\) => `\$\{fact\.label\}为/)
  for (const groupName of ['产业节点', '区域排名', '政策条目', '代表企业', '省份布点', '历年开设', '代表岗位', '高频技能', '课程映射']) {
    assert.match(html, new RegExp(`name: ['"]${groupName}['"]`), groupName)
  }
})

test('prompt workbook teaches the same conclusion-first four-part contract', () => {
  assert.match(workbookBuilder, /研判.*当前页面反映的发展状态/)
  assert.match(workbookBuilder, /数字保留在页面 KPI 和图表/)
  assert.match(workbookBuilder, /不输出括号证据或孤立统计标签/)
  assert.match(workbookBuilder, /title 必须直接使用输入 subject/)
  assert.match(workbookBuilder, /当前对象名称/)
  assert.match(workbookBuilder, /总体研判、结构特征、机会与问题、建设启示/)
  assert.doesNotMatch(workbookBuilder, /优先引用数字、排名、趋势和结构/)
})
