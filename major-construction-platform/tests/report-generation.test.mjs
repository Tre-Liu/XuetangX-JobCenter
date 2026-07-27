import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDynamicReportContent,
  createReportAdsMetadata,
  createReportTocForMode,
  findEmptyReportTocTitle,
  normalizeReportForm,
  validateReportForm,
} from '../src/utils/report-generation.js'

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

test('report form validation requires a chain and either library or custom jobs', () => {
  const validationOptions = {
    regionOptions: [
      { id: 'city:210100', name: '沈阳市' },
      { id: 'economic-zone:jing-jin-ji', name: '京津冀' },
    ],
  }
  assert.equal(validateReportForm(validForm, validationOptions), null)
  assert.deepEqual(
    validateReportForm({ ...validForm, title: '  ' }),
    { field: 'title', message: '请输入报告名称' },
  )
  assert.deepEqual(
    validateReportForm({ ...validForm, major: '' }),
    { field: 'major', message: '请选择专业' },
  )
  assert.deepEqual(
    validateReportForm({
      ...validForm,
      industry: '',
      industryChainId: '',
      industryChainName: '',
      industryChainSource: '',
    }),
    { field: 'industryChainName', message: '请选择或输入产业链' },
  )
  assert.deepEqual(
    validateReportForm({
      ...validForm,
      regionIds: [],
      regionNames: [],
      region: '',
    }),
    { field: 'regionIds', message: '请至少选择一个城市或经济区' },
  )
  assert.deepEqual(
    validateReportForm({
      ...validForm,
      jobIds: [],
      customJobNames: [],
    }),
    { field: 'jobIds', message: '请至少选择或输入一个分析岗位' },
  )
  assert.equal(
    validateReportForm({
      ...validForm,
      jobIds: [],
      customJobNames: ['城市更新咨询师'],
    }),
    null,
  )
  assert.deepEqual(
    validateReportForm({
      ...validForm,
      jobIds: Array.from({ length: 25 }, (_, index) => `job-${index}`),
    }),
    null,
  )
  assert.equal(
    validateReportForm({
      ...validForm,
      templateId: '',
      creationMode: 'template',
    }),
    null,
  )
  assert.deepEqual(
    validateReportForm({
      ...validForm,
      regionIds: ['city:missing'],
      regionNames: ['不存在的城市'],
      region: '不存在的城市',
    }, validationOptions),
    { field: 'regionIds', message: '请至少选择一个城市或经济区' },
  )
})

test('report form normalization preserves legacy scope and clones selection arrays', () => {
  const normalized = normalizeReportForm({
    ...validForm,
    jobIds: ['job-bim-deepening'],
    regionIds: ['city:210100'],
    regionNames: ['沈阳市'],
  })
  assert.notEqual(normalized.jobIds, validForm.jobIds)
  assert.notEqual(normalized.customJobNames, validForm.customJobNames)
  assert.deepEqual(normalized.customJobNames, ['数字建造咨询师'])
  assert.deepEqual(normalized.regionIds, ['city:210100'])
  assert.deepEqual(normalized.regionNames, ['沈阳市'])

  assert.deepEqual(
    normalizeReportForm({
      ...validForm,
      regionIds: undefined,
      regionNames: undefined,
      region: '辽宁 / 京津冀',
    }).regionNames,
    ['辽宁', '京津冀'],
  )
})

test('ADS metadata emits industry chain, custom jobs, and multi-region scope', () => {
  const metadata = createReportAdsMetadata(validForm, [
    { id: 'job-bim-deepening', name: 'BIM深化设计工程师' },
  ])

  assert.equal(metadata.industryChainName, '智能建造产业链')
  assert.equal(metadata.industryChainSource, 'library')
  assert.deepEqual(metadata.customJobNames, ['数字建造咨询师'])
  assert.deepEqual(
    metadata.jobNames,
    ['BIM深化设计工程师', '数字建造咨询师'],
  )
  assert.deepEqual(metadata.regionIds, [
    'city:210100',
    'economic-zone:jing-jin-ji',
  ])
  assert.deepEqual(metadata.regionNames, ['沈阳市', '京津冀'])
  assert.equal(metadata.region, '沈阳市、京津冀')
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
    jobNames: [
      'BIM深化设计工程师',
      '智慧工地管理工程师',
      '数字建造咨询师',
    ],
    referenceFileCount: 2,
    generatedDate: '2026年7月24日',
  })

  assert.match(html, /&lt;智能建造报告&gt;/)
  assert.match(html, /智能建造工程专业/)
  assert.match(html, /产业链：智能建造产业链/)
  assert.match(html, /沈阳市、京津冀/)
  assert.match(
    html,
    /BIM深化设计工程师、智慧工地管理工程师、数字建造咨询师/,
  )
  assert.match(html, /参考文件 2 个/)
  assert.doesNotMatch(html, /相关行业：/)
  assert.doesNotMatch(html, /报告类型：/)
  assert.doesNotMatch(html, /按模板创建/)
  assert.doesNotMatch(html, /<智能建造报告>/)
})
