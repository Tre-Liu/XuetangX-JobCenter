import { stat } from 'node:fs/promises'
import {
  readCsvObjects,
  readWorksheetRows,
  requireColumns,
  rowsToObjects,
} from '../lib/readers.mjs'

const uniqueNonBlank = (rows, key) =>
  new Set(rows.map((row) => String(row[key] ?? '').trim()).filter(Boolean)).size

function orderedChainNames(rows) {
  const names = []
  const seen = new Set()

  rows.forEach((row, index) => {
    const name = String(row.standard_chain ?? '').trim()
    if (!name) throw new Error(`标准产业链名称第 ${index + 1} 行为空`)
    if (seen.has(name)) throw new Error(`标准产业链名称重复: ${name}`)
    seen.add(name)
    names.push(name)
  })

  return names
}

export function buildStaticAssetMetrics(input) {
  const chainNames = orderedChainNames(input.standardizedChains)
  const standardized = chainNames.length
  const chainTotal = uniqueNonBlank(input.chainCatalog, '产业链')
  const stages = uniqueNonBlank(input.stageNodes, 'node_id')
  const details = uniqueNonBlank(input.detailedNodes, '节点编码')
  const industryRows = input.industries.filter((row) => String(row['代码'] ?? '').trim())
  const uniqueIndustries = uniqueNonBlank(industryRows, '代码')

  return [
    {
      id: 'chains',
      label: '标准产业链',
      primaryValue: standardized,
      totalValue: chainTotal,
      ...(chainTotal ? { coverageRate: standardized / chainTotal } : {}),
      status: chainTotal && standardized === chainTotal ? 'validated' : 'partial',
      definition: '标准化产业链名称数 ÷ 源产业链名称数',
      grain: '产业链名称',
      sourceIds: ['chainStandardization', 'chainCatalog'],
      supportingMetrics: [],
      details: {
        kind: 'name-list',
        label: '完整标准产业链名称',
        items: chainNames,
      },
    },
    {
      id: 'stages',
      label: '产业环节',
      primaryValue: stages,
      status: 'validated',
      definition: '按 node_id 去重的标准阶段环节',
      grain: '标准阶段环节ID',
      sourceIds: ['stageNodes', 'detailedNodes'],
      supportingMetrics: [{ label: '10链精细节点', value: details }],
    },
    {
      id: 'industries',
      label: '国标行业',
      primaryValue: uniqueIndustries,
      totalValue: industryRows.length,
      ...(industryRows.length ? { coverageRate: uniqueIndustries / industryRows.length } : {}),
      status: industryRows.length ? 'validated' : 'partial',
      definition: '唯一行业代码数 ÷ 有效数据行数',
      grain: '国民经济行业代码',
      sourceIds: ['industryCatalog'],
      supportingMetrics: [{ label: '重复代码行', value: industryRows.length - uniqueIndustries }],
    },
  ]
}

async function readSourceObjects(source) {
  const objects = source.kind === 'csv'
    ? await readCsvObjects(source.absolutePath)
    : rowsToObjects(await readWorksheetRows(source.absolutePath, source.sheet))
  requireColumns(objects, source.requiredColumns, source.id)
  return objects
}

async function sourceStatus(source) {
  const file = await stat(source.absolutePath)
  return {
    id: source.id,
    assetId: source.assetId,
    relativePath: source.relativePath,
    selectedCandidate: true,
    modifiedAt: file.mtime.toISOString(),
    grain: source.grain,
    status: 'validated',
    notes: [],
  }
}

export async function collectStaticAssets({ resolvedSources }) {
  const sourceIds = [
    'chainStandardization',
    'chainCatalog',
    'stageNodes',
    'detailedNodes',
    'industryCatalog',
  ]
  const sources = sourceIds.map((id) => resolvedSources[id])
  const rows = await Promise.all(sources.map(readSourceObjects))

  return {
    assets: buildStaticAssetMetrics({
      standardizedChains: rows[0],
      chainCatalog: rows[1],
      stageNodes: rows[2],
      detailedNodes: rows[3],
      industries: rows[4],
    }),
    sources: await Promise.all(sources.map(sourceStatus)),
  }
}
