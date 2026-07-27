import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import {
  REPORT_ECONOMIC_ZONE_OPTIONS,
  buildReportRegionOptions,
  formatReportRegionNames,
  normalizeReportRegionSelection,
  searchReportRegions,
  searchStandardIndustries,
} from '../src/utils/report-parameter-options.js'

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
