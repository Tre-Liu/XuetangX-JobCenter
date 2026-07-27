import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'
import { buildStaticAssetMetrics, collectStaticAssets } from '../scripts/collectors/static-assets.mjs'
import { SOURCE_REGISTRY } from '../scripts/source-registry.mjs'
import { resolveAllSources } from '../scripts/lib/readers.mjs'

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

test('static metrics preserve the complete ordered chain names and deduplicate other assets', () => {
  const result = buildStaticAssetMetrics({
    standardizedChains: [{ standard_chain: '链A' }, { standard_chain: '链B' }],
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
    details: {
      kind: 'name-list',
      label: '完整标准产业链名称',
      items: ['链A', '链B'],
    },
  })
  assert.equal(result.find((item) => item.id === 'stages').primaryValue, 2)
  assert.deepEqual(result.find((item) => item.id === 'stages').supportingMetrics, [
    { label: '10链精细节点', value: 2 },
  ])
  assert.equal(result.find((item) => item.id === 'industries').primaryValue, 2)
  assert.equal(result.find((item) => item.id === 'industries').totalValue, 3)
})

test('standardized chain names reject blanks and duplicates instead of hiding source defects', () => {
  const base = {
    chainCatalog: [{ 产业链: '链A' }, { 产业链: '链B' }],
    stageNodes: [],
    detailedNodes: [],
    industries: [],
  }

  assert.throws(
    () => buildStaticAssetMetrics({
      ...base,
      standardizedChains: [{ standard_chain: '链A' }, { standard_chain: ' ' }],
    }),
    /标准产业链名称第 2 行为空/,
  )
  assert.throws(
    () => buildStaticAssetMetrics({
      ...base,
      standardizedChains: [{ standard_chain: '链A' }, { standard_chain: '链A' }],
    }),
    /标准产业链名称重复: 链A/,
  )
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

test('empty chain and industry denominators omit coverage and remain partial', () => {
  const result = buildStaticAssetMetrics({
    standardizedChains: [],
    chainCatalog: [],
    stageNodes: [],
    detailedNodes: [],
    industries: [],
  })
  const chains = result.find((item) => item.id === 'chains')
  const industries = result.find((item) => item.id === 'industries')

  assert.equal(chains.status, 'partial')
  assert.equal(industries.status, 'partial')
  assert.equal('coverageRate' in chains, false)
  assert.equal('coverageRate' in industries, false)
  assert.ok(result.every((item) => [
    item.primaryValue,
    item.totalValue,
    item.coverageRate,
    ...item.supportingMetrics.map((metric) => metric.value),
  ].every((value) => value === undefined || typeof value !== 'number' || Number.isFinite(value))))
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

test('collector reports the read-only Task 3 source baselines', async () => {
  const task3SourceIds = new Set([
    'chainStandardization',
    'chainCatalog',
    'stageNodes',
    'detailedNodes',
    'industryCatalog',
  ])
  const resolvedSources = await resolveAllSources(
    workspaceRoot,
    SOURCE_REGISTRY.filter((source) => task3SourceIds.has(source.id)),
  )
  const assets = (await collectStaticAssets({ workspaceRoot, resolvedSources })).assets

  assert.deepEqual(assets.find((asset) => asset.id === 'chains').primaryValue, 19)
  assert.deepEqual(assets.find((asset) => asset.id === 'chains').totalValue, 129)
  assert.equal(assets.find((asset) => asset.id === 'chains').details.items.length, 19)
  assert.deepEqual(assets.find((asset) => asset.id === 'chains').details.items.slice(0, 2), [
    '数据要素与数字经济产业链',
    '高端装备与智能制造产业链',
  ])
  assert.deepEqual(assets.find((asset) => asset.id === 'stages').primaryValue, 57)
  assert.deepEqual(assets.find((asset) => asset.id === 'stages').supportingMetrics, [
    { label: '10链精细节点', value: 1133 },
  ])
  assert.deepEqual(assets.find((asset) => asset.id === 'industries').primaryValue, 1955)
  assert.deepEqual(assets.find((asset) => asset.id === 'industries').totalValue, 1956)
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
