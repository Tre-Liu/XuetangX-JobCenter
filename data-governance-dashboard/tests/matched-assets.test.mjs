import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import XLSX from 'xlsx'
import {
  readMajorSummaries,
  readPositionSummary,
  buildMatchedAssetMetrics,
  collectMatchedAssets,
} from '../scripts/collectors/matched-assets.mjs'

const undergraduate = {
  total: 2,
  matched: 1,
  multiChain: 0,
  relations: 1,
  review: 0,
  unmatched: 1,
}

const vocational = {
  total: 3,
  matched: 2,
  multiChain: 1,
  relations: 3,
  review: 1,
  unmatched: 0,
}

const total = {
  total: 5,
  matched: 3,
  multiChain: 1,
  relations: 4,
  review: 1,
  unmatched: 1,
}

const positionSummary = {
  total: 4,
  matched: 3,
  unmatched: 1,
  relations: 5,
  stages: 2,
  highConfidence: 2,
  reviewRelations: 1,
}

const catalogRows = [
  { 专业编码: 'U1', 教育类型: '高等教育' },
  { 专业编码: 'U2', 教育类型: '高等教育' },
  { 专业编码: 'V1', 教育类型: '职业教育' },
  { 专业编码: 'V2', 教育类型: '职业教育' },
  { 专业编码: 'V3', 教育类型: '职业教育' },
]

function summaryRows({
  undergraduateSummary = undergraduate,
  vocationalSummary = vocational,
  totalSummary = total,
} = {}) {
  const row = (label, summary) => [
    label,
    summary.total,
    summary.matched,
    summary.multiChain,
    summary.relations,
    summary.review,
    summary.unmatched,
    summary.total ? summary.matched / summary.total : 0,
  ]

  return [
    ['标题'],
    [
      '数据范围（本期）',
      '专业数',
      '有确定关联专业',
      '多产业链专业',
      '产业链关系数',
      '待人工研判',
      '未匹配',
      '确定关联专业率',
    ],
    row('普通本科', undergraduateSummary),
    row('职业教育（中职+高职专科+职业本科）', vocationalSummary),
    row('合计', totalSummary),
  ]
}

test('major summaries read undergraduate, vocational, and total rows by label', () => {
  assert.deepEqual(readMajorSummaries(summaryRows()), {
    undergraduate,
    vocational,
    total,
  })
})

test('major summaries name missing headers and group rows', () => {
  assert.throws(
    () => readMajorSummaries([['其他表头']]),
    /专业汇总缺少数据范围表头/,
  )
  assert.throws(
    () => readMajorSummaries([
      ['数据范围', '专业数', '有确定关联专业', '多产业链专业', '产业链关系数', '待人工研判', '未匹配'],
      ['合计', 0, 0, 0, 0, 0, 0],
    ]),
    /专业汇总缺少普通本科行/,
  )
})

test('major summaries reject group totals that do not reconcile to the total row', () => {
  assert.throws(
    () => readMajorSummaries(summaryRows({
      totalSummary: { ...total, matched: 4, relations: 5, review: 0 },
    })),
    /专业分组汇总不一致.*确定关联专业.*分组合计 3.*总计 4/,
  )
})

test('position summary reads alternating key-value cells', () => {
  assert.deepEqual(readPositionSummary([
    ['岗位总数', 4, '已匹配岗位', 3, '未匹配岗位', 1, '关系总数', 5],
    ['产业节点数', 2, '岗位匹配率', 0.75, '高置信关系', 2, '建议复核关系', 1],
  ]), positionSummary)
})

test('matched metrics build separate undergraduate and vocational assets', () => {
  const [undergraduateAsset, vocationalAsset, positions] = buildMatchedAssetMetrics({
    majorCatalogRows: catalogRows,
    majorSummaries: { undergraduate, vocational, total },
    positionSummary,
  })

  assert.deepEqual(undergraduateAsset, {
    id: 'undergraduateMajors',
    label: '高教（本科）',
    primaryValue: 1,
    totalValue: 2,
    coverageRate: 0.5,
    status: 'partial',
    definition: '普通本科中有确定产业链关联的专业数 ÷ 普通本科专业总数',
    grain: '专业编码',
    sourceIds: ['undergraduateMajorCatalog', 'undergraduateMajorMatches'],
    supportingMetrics: [
      { label: '待人工研判', value: 0 },
      { label: '未匹配', value: 1 },
      { label: '多产业链专业', value: 0 },
      { label: '产业链关系', value: 1 },
    ],
  })
  assert.equal(vocationalAsset.id, 'vocationalMajors')
  assert.equal(vocationalAsset.label, '职教')
  assert.equal(vocationalAsset.primaryValue, 2)
  assert.equal(vocationalAsset.totalValue, 3)
  assert.equal(vocationalAsset.coverageRate, 2 / 3)
  assert.deepEqual(vocationalAsset.sourceIds, [
    'vocationalMajorCatalog',
    'vocationalMajorMatches',
  ])
  assert.equal(positions.coverageRate, 0.75)
})

test('matched metrics omit grouped coverage rates when denominators are zero', () => {
  const zeroMajor = {
    total: 0,
    matched: 0,
    multiChain: 0,
    relations: 0,
    review: 0,
    unmatched: 0,
  }
  const zeroPosition = {
    total: 0,
    matched: 0,
    unmatched: 0,
    relations: 0,
    stages: 0,
    highConfidence: 0,
    reviewRelations: 0,
  }
  const assets = buildMatchedAssetMetrics({
    majorCatalogRows: [],
    majorSummaries: {
      undergraduate: zeroMajor,
      vocational: zeroMajor,
      total: zeroMajor,
    },
    positionSummary: zeroPosition,
  })

  assert.ok(assets.every((asset) => !('coverageRate' in asset)))
})

test('matched metrics reject catalog counts that disagree with either education group', () => {
  assert.throws(
    () => buildMatchedAssetMetrics({
      majorCatalogRows: catalogRows.slice(1),
      majorSummaries: { undergraduate, vocational, total },
      positionSummary,
    }),
    /高教（本科）汇总总数 2.*专业目录去重数 1/,
  )
})

test('major and position invariants reject invalid counts and relationships', () => {
  assert.throws(
    () => buildMatchedAssetMetrics({
      majorCatalogRows: catalogRows,
      majorSummaries: {
        undergraduate: { ...undergraduate, matched: Number.NaN },
        vocational,
        total,
      },
      positionSummary,
    }),
    /专业汇总.*确定关联专业.*NaN.*有限非负整数/,
  )
  assert.throws(
    () => buildMatchedAssetMetrics({
      majorCatalogRows: catalogRows,
      majorSummaries: { undergraduate, vocational, total },
      positionSummary: { ...positionSummary, unmatched: 0 },
    }),
    /已匹配岗位 3.*未匹配岗位 0.*岗位总数 4/,
  )
})

test('collector emits metric-owned source records for both professional modules', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-matched-assets-'))
  const majorCatalogPath = join(dir, 'major-catalog.xlsx')
  const majorMatchesPath = join(dir, 'major-matches.xlsx')
  const positionMatchesPath = join(dir, 'position-matches.xlsx')

  writeWorkbook(majorCatalogPath, '全部专业', [
    ['专业名称', '专业编码', '教育类型'],
    ['本科A', 'U1', '高等教育'],
    ['本科B', 'U2', '高等教育'],
    ['职教A', 'V1', '职业教育'],
    ['职教B', 'V2', '职业教育'],
    ['职教C', 'V3', '职业教育'],
  ])
  writeWorkbook(majorMatchesPath, '说明与统计', summaryRows())
  writeWorkbook(positionMatchesPath, '说明与统计', [
    ['岗位总数', 4, '已匹配岗位', 3, '未匹配岗位', 1, '关系总数', 5],
    ['产业节点数', 2, '岗位匹配率', 0.75, '高置信关系', 2, '建议复核关系', 1],
  ])

  const result = await collectMatchedAssets({
    resolvedSources: {
      majorCatalog: source('majorCatalog', 'majors', majorCatalogPath, '全部专业', ['专业名称', '专业编码']),
      majorMatches: source('majorMatches', 'majors', majorMatchesPath, '说明与统计'),
      positionMatches: source('positionMatches', 'positions', positionMatchesPath, '说明与统计'),
    },
  })

  assert.deepEqual(result.assets.map((asset) => asset.id), [
    'undergraduateMajors',
    'vocationalMajors',
    'positions',
  ])
  assert.deepEqual(result.sources.map(({ id, assetId }) => ({ id, assetId })), [
    { id: 'undergraduateMajorCatalog', assetId: 'undergraduateMajors' },
    { id: 'undergraduateMajorMatches', assetId: 'undergraduateMajors' },
    { id: 'vocationalMajorCatalog', assetId: 'vocationalMajors' },
    { id: 'vocationalMajorMatches', assetId: 'vocationalMajors' },
    { id: 'positionMatches', assetId: 'positions' },
  ])
  assert.ok(result.sources.every((item) =>
    item.selectedCandidate && item.status === 'validated' && item.notes.length === 0))
  assert.equal(result.sources[0].modifiedAt, (await stat(majorCatalogPath)).mtime.toISOString())
  assert.equal(result.sources[0].relativePath, 'majorCatalog.xlsx')
  assert.equal(result.sources[2].relativePath, 'majorCatalog.xlsx')
})

function writeWorkbook(path, sheet, rows) {
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), sheet)
  XLSX.writeFile(book, path)
}

function source(id, assetId, absolutePath, sheet, requiredColumns) {
  return {
    id,
    assetId,
    kind: id === 'majorCatalog' ? 'xlsx' : 'xlsx-summary',
    absolutePath,
    relativePath: `${id}.xlsx`,
    sheet,
    grain: id === 'majorCatalog'
      ? '专业编码'
      : id === 'majorMatches'
        ? '专业匹配状态'
        : '岗位编码',
    ...(requiredColumns ? { requiredColumns } : {}),
  }
}
