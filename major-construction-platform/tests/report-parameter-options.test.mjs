import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import {
  REPORT_ECONOMIC_ZONE_OPTIONS,
  addCustomReportJob,
  buildReportRegionOptions,
  createCustomReportIndustryChain,
  formatReportRegionNames,
  getReportJobsForChain,
  normalizeReportRegionSelection,
  removeCustomReportJob,
  resetReportIndustryScope,
  resolveReportJobNames,
  searchReportRegions,
  searchReportIndustryChains,
  searchStandardIndustries,
  selectReportIndustryChain,
} from '../src/utils/report-parameter-options.js'

const reportChainOptions = [
  {
    id: 'chain-smart',
    name: '智能建造产业链',
    majors: ['智能建造工程专业'],
    jobIds: ['job-bim', 'job-site'],
  },
  {
    id: 'chain-prefab',
    name: '装配式建筑产业链',
    majors: ['智能建造工程专业', '建筑工程技术专业'],
    jobIds: ['job-prefab'],
  },
]

const reportJobOptions = [
  { id: 'job-bim', name: 'BIM深化设计工程师' },
  { id: 'job-site', name: '智慧工地管理工程师' },
  { id: 'job-prefab', name: '装配式建筑深化设计师' },
]

const emptyReportScope = {
  major: '智能建造工程专业',
  industry: '',
  industryChainId: '',
  industryChainName: '',
  industryChainSource: '',
  jobIds: [],
  customJobNames: [],
}

test('GB/T 4754 data asset contains every classification level', async () => {
  const source = await readFile(
    new URL('../src/data/gb-t-4754-2017.js', import.meta.url),
    'utf8',
  )
  const context = {}
  vm.runInNewContext(source, context)
  const options = context.gbT4754IndustryOptions

  assert.equal(options.filter((item) => item.level === 'section').length, 20)
  assert.equal(options.filter((item) => item.level === 'division').length, 97)
  assert.equal(options.filter((item) => item.level === 'group').length, 473)
  assert.equal(options.filter((item) => item.level === 'class').length, 1382)
  assert.equal(context.gbT4754IndustrySource.standard, 'GB/T 4754—2017')
})

test('industry search matches code and name without losing hierarchy', () => {
  const options = [
    { code: 'E', name: '建筑业', level: 'section', parentCode: null },
    { code: '47', name: '房屋建筑业', level: 'division', parentCode: 'E' },
    { code: '4710', name: '住宅房屋建筑', level: 'class', parentCode: '471' },
  ]

  assert.deepEqual(searchStandardIndustries(options, '4710'), [options[2]])
  assert.deepEqual(searchStandardIndustries(options, '建筑'), options)
  assert.deepEqual(searchStandardIndustries(options, '', 2), options.slice(0, 2))
})

test('region options mix cities and economic zones and deduplicate selections', () => {
  const options = buildReportRegionOptions({
    辽宁: {
      features: [
        { name: '沈阳市', adcode: 210100 },
        { name: '大连市', adcode: 210200 },
      ],
    },
  })

  assert.ok(
    options.some(
      (item) => item.id === 'city:210100' && item.province === '辽宁',
    ),
  )
  assert.ok(options.some((item) => item.id === 'economic-zone:jing-jin-ji'))
  assert.deepEqual(
    normalizeReportRegionSelection(
      {
        regionIds: ['city:210100', 'city:210100'],
        regionNames: ['沈阳市', '沈阳市'],
      },
      options,
    ),
    {
      regionIds: ['city:210100'],
      regionNames: ['沈阳市'],
      region: '沈阳市',
    },
  )
  assert.equal(formatReportRegionNames(['沈阳市', '京津冀']), '沈阳市、京津冀')
  assert.ok(
    searchReportRegions(options, '辽宁', [], 20).some(
      (item) => item.name === '沈阳市',
    ),
  )
  assert.equal(REPORT_ECONOMIC_ZONE_OPTIONS.length, 8)
})

test('legacy region strings remain visible until users standardize them', () => {
  assert.deepEqual(
    normalizeReportRegionSelection(
      { region: '辽宁 / 京津冀' },
      [],
    ),
    {
      regionIds: [],
      regionNames: ['辽宁', '京津冀'],
      region: '辽宁、京津冀',
    },
  )
})

test('report chains are restricted to the selected major and searched by name', () => {
  assert.deepEqual(
    searchReportIndustryChains(
      reportChainOptions,
      '建筑工程技术专业',
      '',
    ),
    [reportChainOptions[1]],
  )
  assert.deepEqual(
    searchReportIndustryChains(
      reportChainOptions,
      '智能建造工程专业',
      '装配式',
    ),
    [reportChainOptions[1]],
  )
})

test('changing report chain resets jobs and exposes only mapped jobs', () => {
  const selected = selectReportIndustryChain(
    {
      ...emptyReportScope,
      jobIds: ['old'],
      customJobNames: ['旧岗位'],
    },
    reportChainOptions[0],
  )

  assert.deepEqual(selected.jobIds, [])
  assert.deepEqual(selected.customJobNames, [])
  assert.deepEqual(
    getReportJobsForChain(
      selected.industryChainId,
      reportChainOptions,
      reportJobOptions,
    ),
    reportJobOptions.slice(0, 2),
  )
  assert.deepEqual(
    getReportJobsForChain('', reportChainOptions, reportJobOptions),
    [],
  )
  assert.deepEqual(
    getReportJobsForChain(
      'custom:智能建造咨询链',
      reportChainOptions,
      reportJobOptions,
    ),
    [],
  )
})

test('custom chains and jobs trim names and reject library or custom duplicates', () => {
  const duplicateChain = createCustomReportIndustryChain(
    emptyReportScope,
    ' 智能建造产业链 ',
    reportChainOptions,
  )
  assert.equal(duplicateChain.error, '产业链名称已存在')

  const customChain = createCustomReportIndustryChain(
    emptyReportScope,
    ' 智能建造咨询链 ',
    reportChainOptions,
  )
  assert.equal(customChain.error, '')
  assert.equal(customChain.form.industryChainId, '')
  assert.equal(customChain.form.industryChainName, '智能建造咨询链')
  assert.equal(customChain.form.industryChainSource, 'custom')

  const firstJob = addCustomReportJob(
    customChain.form,
    ' 数字建造咨询师 ',
    reportJobOptions,
  )
  assert.deepEqual(firstJob.form.customJobNames, ['数字建造咨询师'])
  assert.equal(firstJob.error, '')
  assert.equal(
    addCustomReportJob(
      firstJob.form,
      '数字建造咨询师',
      reportJobOptions,
    ).error,
    '岗位名称已存在',
  )
  assert.equal(
    addCustomReportJob(
      firstJob.form,
      'BIM深化设计工程师',
      reportJobOptions,
    ).error,
    '岗位名称已存在',
  )
  assert.deepEqual(
    removeCustomReportJob(
      firstJob.form,
      '数字建造咨询师',
    ).customJobNames,
    [],
  )
})

test('resetting scope and resolving names preserve unique display order', () => {
  assert.deepEqual(
    resetReportIndustryScope({
      ...emptyReportScope,
      industryChainId: 'chain-smart',
      industryChainName: '智能建造产业链',
      industryChainSource: 'library',
      jobIds: ['job-site'],
      customJobNames: ['数字建造咨询师'],
    }),
    emptyReportScope,
  )
  assert.deepEqual(
    resolveReportJobNames(
      ['job-site', 'job-bim'],
      ['数字建造咨询师', ' 智慧工地管理工程师 '],
      reportJobOptions,
    ),
    ['智慧工地管理工程师', 'BIM深化设计工程师', '数字建造咨询师'],
  )
})
