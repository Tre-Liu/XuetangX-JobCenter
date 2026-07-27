import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import { buildStaticAssetMetrics, collectStaticAssets } from '../scripts/collectors/static-assets.mjs'

test('static metrics deduplicate chains, stage nodes, detailed nodes, and industries', () => {
  const result = buildStaticAssetMetrics({
    standardizedChains: [{ standard_chain: '链A' }, { standard_chain: '链A' }, { standard_chain: '链B' }],
    chainCatalog: [{ 产业链: '链A' }, { 产业链: '链B' }, { 产业链: '链C' }],
    stageNodes: [{ node_id: 'n1' }, { node_id: 'n1' }, { node_id: 'n2' }],
    detailedNodes: [{ 节点编码: 'd1', 产业链名称: '链A' }, { 节点编码: 'd2', 产业链名称: '链A' }],
    industries: [{ 代码: 'A' }, { 代码: '01' }, { 代码: '01' }],
  })

  assert.deepEqual(result.find((item) => item.id === 'chains'), {
    id: 'chains',
    label: '标准产业链',
    primaryValue: 2,
    totalValue: 3,
    coverageRate: 2 / 3,
    status: 'partial',
    definition: '标准化产业链名称数 ÷ 源产业链名称数',
    grain: '产业链名称',
    sourceIds: ['chainStandardization', 'chainCatalog'],
    supportingMetrics: [],
  })
  assert.equal(result.find((item) => item.id === 'stages').primaryValue, 2)
  assert.deepEqual(result.find((item) => item.id === 'stages').supportingMetrics, [
    { label: '10链精细节点', value: 2 },
  ])
  assert.equal(result.find((item) => item.id === 'industries').primaryValue, 2)
  assert.equal(result.find((item) => item.id === 'industries').totalValue, 3)
})

test('stage metric never manufactures a coverage rate across incompatible grains', () => {
  const [stage] = buildStaticAssetMetrics({
    standardizedChains: [],
    chainCatalog: [],
    stageNodes: [{ node_id: 'n1' }],
    detailedNodes: [{ 节点编码: 'd1' }],
    industries: [],
  }).filter((item) => item.id === 'stages')
  assert.equal(stage.coverageRate, undefined)
  assert.equal(stage.totalValue, undefined)
})

test('collector reads five resolved sources and reports their selected status', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-static-assets-'))
  const chainStandardizationPath = join(dir, 'standardized.csv')
  const stageNodesPath = join(dir, 'stages.csv')
  const chainCatalogPath = join(dir, 'chains.xlsx')
  const detailedNodesPath = join(dir, 'details.xlsx')
  const industryCatalogPath = join(dir, 'industries.xlsx')
  await writeFile(chainStandardizationPath, 'standard_chain\n链A\n链B\n', 'utf8')
  await writeFile(stageNodesPath, 'node_id,standard_chain,stage\nn1,链A,上游\n', 'utf8')

  const writeWorkbook = (path, sheet, rows) => {
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), sheet)
    XLSX.writeFile(book, path)
  }
  writeWorkbook(chainCatalogPath, '产业链-产业', [['产业链'], ['链A'], ['链B']])
  writeWorkbook(detailedNodesPath, '节点明细', [['产业ID', '产业链名称', '节点编码'], ['1', '链A', 'd1']])
  writeWorkbook(industryCatalogPath, '国民经济行业分类', [['代码', '名称', '层级'], ['A', '农业', '门类']])

  const resolvedSources = {
    chainStandardization: source('chainStandardization', 'chains', chainStandardizationPath, 'standard_chain'),
    chainCatalog: source('chainCatalog', 'chains', chainCatalogPath, '产业链-产业', ['产业链']),
    stageNodes: source('stageNodes', 'stages', stageNodesPath, 'node_id,standard_chain,stage'),
    detailedNodes: source('detailedNodes', 'stages', detailedNodesPath, '节点明细', ['产业ID', '产业链名称', '节点编码']),
    industryCatalog: source('industryCatalog', 'industries', industryCatalogPath, '国民经济行业分类', ['代码', '名称', '层级']),
  }

  const result = await collectStaticAssets({ workspaceRoot: dir, resolvedSources })

  assert.deepEqual(result.assets.map((asset) => asset.id), ['chains', 'stages', 'industries'])
  assert.equal(result.assets.find((asset) => asset.id === 'stages').primaryValue, 1)
  assert.deepEqual(result.sources.map((item) => item.id), Object.keys(resolvedSources))
  assert.ok(result.sources.every((item) => item.selectedCandidate && item.status === 'validated' && item.notes.length === 0))
  const sourceMtime = (await stat(chainStandardizationPath)).mtime.toISOString()
  assert.equal(result.sources[0].modifiedAt, sourceMtime)
})

function source(id, assetId, absolutePath, sheetOrColumns, requiredColumns) {
  const isCsv = id === 'chainStandardization' || id === 'stageNodes'
  return {
    id,
    assetId,
    kind: isCsv ? 'csv' : 'xlsx',
    absolutePath,
    relativePath: `${id}.${isCsv ? 'csv' : 'xlsx'}`,
    grain: id,
    ...(isCsv ? { requiredColumns: sheetOrColumns.split(',') } : { sheet: sheetOrColumns, requiredColumns }),
  }
}
