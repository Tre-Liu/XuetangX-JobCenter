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
