import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'

const decisionMock = await readFile(new URL('../src/mock/decision-center.ts', import.meta.url), 'utf8')

function parseExportedConstObject(source, exportName) {
  const exportToken = `export const ${exportName} = `
  const exportIndex = source.indexOf(exportToken)
  assert.notEqual(exportIndex, -1, `Missing export: ${exportName}`)

  const objectStart = source.indexOf('{', exportIndex)
  const objectEnd = source.indexOf('} as const', objectStart)
  assert.notEqual(objectStart, -1, `Missing object body for export: ${exportName}`)
  assert.notEqual(objectEnd, -1, `Missing "as const" terminator for export: ${exportName}`)

  return JSON.parse(JSON.stringify(vm.runInNewContext(`(${source.slice(objectStart, objectEnd + 1)})`)))
}

test('decision center mock exports overview, governance flows, and placeholder pages', () => {
  for (const token of [
    'export const decisionCenterOverview',
    'export const decisionCenterMenuGroups',
    'export const planAnalysisStates',
    'export const courseDiagnosisStates',
    'export const governancePlaceholderPages'
  ]) {
    assert.match(decisionMock, new RegExp(token))
  }
})

test('decision center mock includes the approved navigation labels', () => {
  for (const label of [
    '专业决策中枢',
    '专业建设治理',
    '专业质量监控',
    '专业运行数据',
    '专业全局概览',
    '培养方案分析',
    '课程体系诊断',
    '课程交叉分析',
    '专业改进建议',
    'AI课程运行'
  ]) {
    assert.match(decisionMock, new RegExp(label))
  }
})

test('plan and course diagnosis states include pending, loading, result, and warning views', () => {
  for (const token of [
    "status: 'pending'",
    "status: 'loading'",
    "status: 'result'",
    "status: 'warning'",
    '开始分析',
    '重新方案分析',
    '课程体系信息校验结果'
  ]) {
    assert.match(decisionMock, new RegExp(token))
  }
})

test('decision-center mock defines mode panels, result panels, and product-style placeholder content', () => {
  for (const token of [
    'modePanels',
    'panels',
    'analysisTitle',
    'insightTitle',
    'topTabs',
    'modeTabs',
    '高交叉课程对',
    'AI改进建议'
  ]) {
    assert.match(decisionMock, new RegExp(token))
  }
})

test('decision center mock defines a dedicated improvement-page report model', () => {
  const improvementPage = parseExportedConstObject(decisionMock, 'decisionImprovementPage')
  const defaultState = improvementPage.states.default

  assert.equal(improvementPage.headerMeta.title, '专业改进建议')
  assert.equal(improvementPage.headerMeta.meta.length, 3)
  assert.equal(improvementPage.stateSwitcher.ariaLabel, '专业改进建议状态切换')
  assert.deepEqual(
    improvementPage.stateSwitcher.options.map((option) => option.value),
    ['default', 'refreshing', 'empty', 'warning']
  )
  assert.equal(defaultState.heroSignals[0].note, '智能体开发、AIGC应用、多模态数据处理')
  assert.match(defaultState.headlineSummary, /AIGC 应用工程师/)
  assert.deepEqual(Object.keys(defaultState.evidenceMatrix[0]), [
    'trend',
    'ability',
    'courses',
    'gap',
    'action',
    'training'
  ])
  assert.equal(defaultState.evidenceMatrix[0].trend, '智能体开发')
  assert.ok(defaultState.courseAdjustments.length > 0)
  assert.ok(defaultState.trainingAdditions.length > 0)
  assert.ok(defaultState.resourceRecommendations.length > 0)
  assert.ok(defaultState.deliveryTimeline.length > 0)
  assert.deepEqual(Object.keys(defaultState.courseAdjustments[0]), ['course', 'change', 'reason', 'priority'])
  assert.deepEqual(Object.keys(defaultState.trainingAdditions[0]), ['name', 'focus', 'format', 'duration'])
  assert.deepEqual(Object.keys(defaultState.resourceRecommendations[0]), ['resource', 'type', 'purpose', 'owner'])
  assert.deepEqual(Object.keys(defaultState.deliveryTimeline[0]), ['phase', 'window', 'deliverables'])
  assert.equal(improvementPage.states.refreshing.title, '建议生成中')
  assert.equal(improvementPage.states.refreshing.message, '正在同步招聘数据与行业动态，请稍候...')
  assert.equal(improvementPage.states.empty.description, '完成一次岗位趋势与课程映射分析后，这里会生成可直接落地的整改任务单。')
  assert.equal(improvementPage.states.empty.cta, '开始分析')
  assert.equal(improvementPage.states.warning.title, '生成前需补齐关键数据')
  assert.deepEqual(improvementPage.states.warning.warningFlags, ['岗位样本不足', '课程映射未补全'])
})
