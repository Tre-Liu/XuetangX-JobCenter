import test from 'node:test'
import assert from 'node:assert/strict'
import * as runtime from '../src/utils/report-generation.js'

const jobOptions = [
  { id: 'job-a', name: '岗位 A' },
  { id: 'job-b', name: '岗位 B' },
]

const templates = [
  {
    id: 'professional-analysis',
    reportKind: 'professional',
    toc: [{ title: '专业目录' }],
  },
  {
    id: 'industry-analysis',
    reportKind: 'industry',
    toc: [{ title: '行业目录' }],
  },
]

const reportForm = {
  title: '报告 A',
  type: '专业产业调研报告',
  reportKind: 'professional',
  major: '智能建造工程专业',
  industry: '智能建造产业链',
  relatedIndustry: '智能建造',
  region: '辽宁省',
  jobIds: ['job-b', 'job-a'],
  creationMode: 'template',
  templateId: 'professional-analysis',
}

const completedReport = {
  id: 1,
  ...reportForm,
  title: '已完成报告',
  date: '2026-07-01',
  status: 'done',
  referenceFileCount: 2,
  toc: [{ title: '原目录' }],
}

test('generation navigation invalidates stale callbacks and keeps click-time state immutable', () => {
  const scheduled = []
  const controller = runtime.createReportGenerationController({
    setTimer(callback) {
      scheduled.push(callback)
      return scheduled.length
    },
    clearTimer() {},
  })
  let rows = [completedReport]
  const mutableForm = {
    ...reportForm,
    jobIds: [...reportForm.jobIds],
  }
  const mutableToc = [{ title: '报告 A 目录' }]
  const snapshot = runtime.createReportGenerationSnapshot({
    rows,
    activeReportId: 0,
    form: mutableForm,
    toc: mutableToc,
    referenceFileCount: 3,
    generatedDate: '2026-07-27',
    jobOptions,
  })

  controller.schedule(() => {
    rows = runtime.applyReportGeneration(rows, snapshot)
  }, 900)
  mutableForm.title = '后来编辑的报告 B'
  mutableForm.jobIds.reverse()
  mutableToc[0].title = '后来编辑的目录'
  controller.invalidate()
  scheduled[0]()

  assert.deepEqual(rows, [completedReport])
  assert.equal(snapshot.report.title, '报告 A')
  assert.deepEqual(snapshot.report.jobIds, ['job-b', 'job-a'])
  assert.deepEqual(snapshot.report.toc, [{ title: '报告 A 目录' }])
  assert.equal(snapshot.report.referenceFileCount, 3)
})

test('regeneration preserves done status and rollback only reverts its own report', () => {
  const rows = [
    completedReport,
    { ...completedReport, id: 2, title: '无关报告', status: 'draft' },
  ]
  const snapshot = runtime.createReportGenerationSnapshot({
    rows,
    activeReportId: completedReport.id,
    form: { ...reportForm, title: '已完成报告（重新生成）' },
    toc: [{ title: '新目录' }],
    referenceFileCount: 4,
    generatedDate: '2026-07-27',
    jobOptions,
  })

  const generatedRows = runtime.applyReportGeneration(rows, snapshot)
  assert.equal(generatedRows.find((report) => report.id === 1)?.status, 'done')

  const concurrentReport = { ...completedReport, id: 3, title: '期间新增报告' }
  const rolledBackRows = runtime.rollbackReportGeneration(
    [...generatedRows, concurrentReport],
    snapshot,
  )
  assert.deepEqual(
    rolledBackRows.map(({ id, title, status }) => ({ id, title, status })),
    [
      { id: 1, title: '已完成报告', status: 'done' },
      { id: 2, title: '无关报告', status: 'draft' },
      { id: 3, title: '期间新增报告', status: 'done' },
    ],
  )
})

test('custom reload normalizes template provenance and restores a canceled kind change atomically', () => {
  const customReport = {
    ...completedReport,
    reportKind: 'professional',
    creationMode: 'custom',
    templateId: 'professional-analysis',
    referenceFileCount: 5,
  }
  const loaded = runtime.createReportConfigurationState(customReport)

  assert.equal(loaded.form.templateId, '')
  assert.deepEqual(loaded.tocSource, {
    reportKind: 'professional',
    creationMode: 'custom',
    templateId: '',
  })
  assert.deepEqual(loaded.referenceFiles, [])
  assert.equal(loaded.referenceFileCount, 5)

  const restored = runtime.restoreReportTocSelection(
    {
      ...loaded.form,
      reportKind: 'industry',
      creationMode: 'template',
      templateId: 'industry-analysis',
    },
    loaded.tocSource,
  )
  assert.equal(restored.reportKind, 'professional')
  assert.equal(restored.creationMode, 'custom')
  assert.equal(restored.templateId, '')
})

test('template validation rejects missing and cross-kind templates before TOC reuse', () => {
  assert.equal(
    runtime.isReportTemplateSelectionValid(reportForm, templates),
    true,
  )
  assert.equal(
    runtime.isReportTemplateSelectionValid(
      { ...reportForm, reportKind: 'industry' },
      templates,
    ),
    false,
  )
  assert.equal(
    runtime.isReportTemplateSelectionValid(
      { ...reportForm, templateId: 'missing-template' },
      templates,
    ),
    false,
  )
})

test('ADS metadata preserves empty major and maps job names in job id order', () => {
  const metadata = runtime.createReportAdsMetadata(
    {
      ...completedReport,
      reportKind: 'industry',
      major: '',
      jobIds: ['job-b', 'job-a'],
    },
    jobOptions,
  )

  assert.equal(metadata.major, '')
  assert.equal(metadata.majorGroup, '')
  assert.deepEqual(metadata.jobIds, ['job-b', 'job-a'])
  assert.deepEqual(metadata.jobNames, ['岗位 B', '岗位 A'])
})

test('one-root TOC still allows deleting a nested child', () => {
  const toc = [{
    id: 'root',
    title: '唯一根章',
    children: [{ id: 'child', title: '可删除子节点', children: [] }],
  }]

  assert.deepEqual(
    runtime.removeReportTocNodeById(toc, 'child'),
    [{ id: 'root', title: '唯一根章', children: [] }],
  )
  assert.equal(runtime.removeReportTocNodeById(toc, 'root'), toc)
})
