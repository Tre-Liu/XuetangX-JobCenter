import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import XLSX from 'xlsx'
import {
  readMajorSummary,
  readPositionSummary,
  buildMatchedAssetMetrics,
  collectMatchedAssets,
} from '../scripts/collectors/matched-assets.mjs'

test('major summary reads the 合计 row by label rather than fixed coordinates', () => {
  const summary = readMajorSummary([
    ['标题'],
    ['数据范围（本期）', '专业数', '有确定关联专业', '多产业链专业', '产业链关系数', '待人工研判', '未匹配', '确定关联专业率'],
    ['合计', 2142, 682, 89, 791, 443, 1017, 682 / 2142],
  ])

  assert.deepEqual(summary, {
    total: 2142,
    matched: 682,
    multiChain: 89,
    relations: 791,
    review: 443,
    unmatched: 1017,
  })
})

test('position summary reads alternating key-value cells', () => {
  const summary = readPositionSummary([
    ['岗位总数', 1356, '已匹配岗位', 645, '未匹配岗位', 711, '关系总数', 706],
    ['产业节点数', 57, '岗位匹配率', 645 / 1356, '高置信关系', 157, '建议复核关系', 175],
  ])

  assert.deepEqual(summary, {
    total: 1356,
    matched: 645,
    unmatched: 711,
    relations: 706,
    stages: 57,
    highConfidence: 157,
    reviewRelations: 175,
  })
})

test('major summary names a missing data-range header', () => {
  assert.throws(
    () => readMajorSummary([['其他表头'], ['合计', 2142]]),
    /专业汇总缺少数据范围表头/,
  )
})

test('major summary names a missing 合计 row and required field', () => {
  assert.throws(
    () => readMajorSummary([['数据范围', '专业数'], ['普通本科', 840]]),
    /专业汇总缺少合计行/,
  )
  assert.throws(
    () => readMajorSummary([['数据范围', '专业数'], ['合计', 2142]]),
    /专业汇总 缺少统计字段: 有确定关联专业/,
  )
})

test('position summary names a missing required label', () => {
  assert.throws(
    () => readPositionSummary([['岗位总数', 1356]]),
    /岗位汇总 缺少统计字段: 已匹配岗位/,
  )
})

test('matched metrics use unique major codes and source summary values', () => {
  const [majors, positions] = buildMatchedAssetMetrics({
    majorCatalogRows: [{ 专业编码: 'A' }, { 专业编码: 'A' }, { 专业编码: 'B' }],
    majorSummary: { total: 2, matched: 1, multiChain: 0, relations: 1, review: 0, unmatched: 1 },
    positionSummary: { total: 4, matched: 3, unmatched: 1, relations: 5, stages: 2, highConfidence: 2, reviewRelations: 1 },
  })

  assert.equal(majors.coverageRate, 0.5)
  assert.equal(positions.coverageRate, 0.75)
  assert.deepEqual(positions.supportingMetrics, [
    { label: '未匹配岗位', value: 1 },
    { label: '岗位—节点关系', value: 5 },
    { label: '高置信关系', value: 2 },
    { label: '建议复核关系', value: 1 },
  ])
})

test('matched metrics omit coverage rates when their denominators are zero', () => {
  const [majors, positions] = buildMatchedAssetMetrics({
    majorCatalogRows: [],
    majorSummary: { total: 0, matched: 0, multiChain: 0, relations: 0, review: 0, unmatched: 0 },
    positionSummary: { total: 0, matched: 0, unmatched: 0, relations: 0, stages: 0, highConfidence: 0, reviewRelations: 0 },
  })

  assert.equal(majors.status, 'partial')
  assert.equal(positions.status, 'partial')
  assert.equal('coverageRate' in majors, false)
  assert.equal('coverageRate' in positions, false)
  assert.ok([majors, positions].every((asset) => [
    asset.primaryValue,
    asset.totalValue,
    asset.coverageRate,
    ...asset.supportingMetrics.map((metric) => metric.value),
  ].every((value) => value === undefined || Number.isFinite(value))))
})

test('collector reads the catalog and summary workbooks with validated source statuses', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-matched-assets-'))
  const majorCatalogPath = join(dir, 'major-catalog.xlsx')
  const majorMatchesPath = join(dir, 'major-matches.xlsx')
  const positionMatchesPath = join(dir, 'position-matches.xlsx')

  writeWorkbook(majorCatalogPath, '全部专业', [['专业名称', '专业编码'], ['专业A', 'A'], ['专业A', 'A'], ['专业B', 'B']])
  writeWorkbook(majorMatchesPath, '说明与统计', [
    ['标题'],
    ['数据范围', '专业数', '有确定关联专业', '多产业链专业', '产业链关系数', '待人工研判', '未匹配'],
    ['合计', 2, 1, 0, 1, 0, 1],
  ])
  writeWorkbook(positionMatchesPath, '说明与统计', [
    ['岗位总数', 4, '已匹配岗位', 3, '未匹配岗位', 1, '关系总数', 5],
    ['产业节点数', 2, '岗位匹配率', 0.75, '高置信关系', 2, '建议复核关系', 1],
  ])

  const result = await collectMatchedAssets({
    workspaceRoot: dir,
    resolvedSources: {
      majorCatalog: source('majorCatalog', 'majors', majorCatalogPath, '全部专业', ['专业名称', '专业编码']),
      majorMatches: source('majorMatches', 'majors', majorMatchesPath, '说明与统计'),
      positionMatches: source('positionMatches', 'positions', positionMatchesPath, '说明与统计'),
    },
  })

  assert.equal(result.assets.find((asset) => asset.id === 'majors').totalValue, 2)
  assert.deepEqual(result.sources.map((item) => item.id), ['majorCatalog', 'majorMatches', 'positionMatches'])
  assert.ok(result.sources.every((item) => item.selectedCandidate && item.status === 'validated' && item.notes.length === 0))
  assert.equal(result.sources[0].modifiedAt, (await stat(majorCatalogPath)).mtime.toISOString())
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
    grain: id === 'majorCatalog' ? '专业编码' : id === 'majorMatches' ? '专业匹配状态' : '岗位编码',
    ...(requiredColumns ? { requiredColumns } : {}),
  }
}
