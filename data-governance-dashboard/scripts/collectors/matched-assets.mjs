import { stat } from 'node:fs/promises'
import { readWorksheetRows, requireColumns, rowsToObjects } from '../lib/readers.mjs'

const uniqueNonBlank = (rows, key) =>
  new Set(rows.map((row) => String(row[key] ?? '').trim()).filter(Boolean)).size

function rowLabel(row) {
  return String(row[0] ?? '').trim()
}

function requiredValue(map, label, summaryName) {
  if (!map.has(label)) throw new Error(`${summaryName} 缺少统计字段: ${label}`)
  return map.get(label)
}

export function readMajorSummary(rows) {
  const headerIndex = rows.findIndex((row) => rowLabel(row).startsWith('数据范围'))
  if (headerIndex === -1) throw new Error('专业汇总缺少数据范围表头')

  const totalRow = rows.slice(headerIndex + 1).find((row) => rowLabel(row) === '合计')
  if (!totalRow) throw new Error('专业汇总缺少合计行')

  const values = new Map(rows[headerIndex].map((label, index) => [String(label ?? '').trim(), totalRow[index]]))
  return {
    total: requiredValue(values, '专业数', '专业汇总'),
    matched: requiredValue(values, '有确定关联专业', '专业汇总'),
    multiChain: requiredValue(values, '多产业链专业', '专业汇总'),
    relations: requiredValue(values, '产业链关系数', '专业汇总'),
    review: requiredValue(values, '待人工研判', '专业汇总'),
    unmatched: requiredValue(values, '未匹配', '专业汇总'),
  }
}

export function readPositionSummary(rows) {
  const values = new Map(
    rows.flatMap((row) =>
      Array.from({ length: Math.floor(row.length / 2) }, (_, index) => [
        String(row[index * 2] ?? '').trim(),
        row[index * 2 + 1],
      ]),
    ).filter(([key]) => key),
  )

  return {
    total: requiredValue(values, '岗位总数', '岗位汇总'),
    matched: requiredValue(values, '已匹配岗位', '岗位汇总'),
    unmatched: requiredValue(values, '未匹配岗位', '岗位汇总'),
    relations: requiredValue(values, '关系总数', '岗位汇总'),
    stages: requiredValue(values, '产业节点数', '岗位汇总'),
    highConfidence: requiredValue(values, '高置信关系', '岗位汇总'),
    reviewRelations: requiredValue(values, '建议复核关系', '岗位汇总'),
  }
}

export function buildMatchedAssetMetrics({ majorCatalogRows, majorSummary, positionSummary }) {
  const catalogTotal = uniqueNonBlank(majorCatalogRows, '专业编码')

  return [
    {
      id: 'majors',
      label: '专业',
      primaryValue: majorSummary.matched,
      totalValue: catalogTotal,
      ...(catalogTotal ? { coverageRate: majorSummary.matched / catalogTotal } : {}),
      status: 'partial',
      definition: '有确定产业链关联的专业数 ÷ 标准专业目录总数',
      grain: '专业编码',
      sourceIds: ['majorCatalog', 'majorMatches'],
      supportingMetrics: [
        { label: '待人工研判', value: majorSummary.review },
        { label: '未匹配', value: majorSummary.unmatched },
        { label: '多产业链专业', value: majorSummary.multiChain },
        { label: '产业链关系', value: majorSummary.relations },
      ],
    },
    {
      id: 'positions',
      label: '岗位',
      primaryValue: positionSummary.matched,
      totalValue: positionSummary.total,
      ...(positionSummary.total ? { coverageRate: positionSummary.matched / positionSummary.total } : {}),
      status: 'partial',
      definition: '已匹配产业节点岗位数 ÷ 岗位总数',
      grain: '岗位编码',
      sourceIds: ['positionMatches'],
      supportingMetrics: [
        { label: '未匹配岗位', value: positionSummary.unmatched },
        { label: '岗位—节点关系', value: positionSummary.relations },
        { label: '高置信关系', value: positionSummary.highConfidence },
        { label: '建议复核关系', value: positionSummary.reviewRelations },
      ],
    },
  ]
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

export async function collectMatchedAssets({ resolvedSources }) {
  const sourceIds = ['majorCatalog', 'majorMatches', 'positionMatches']
  const sources = sourceIds.map((id) => resolvedSources[id])
  const [majorCatalogRows, majorSummaryRows, positionSummaryRows] = await Promise.all(
    sources.map((source) => readWorksheetRows(source.absolutePath, source.sheet)),
  )
  const majorCatalog = rowsToObjects(majorCatalogRows)
  requireColumns(majorCatalog, sources[0].requiredColumns, sources[0].id)

  return {
    assets: buildMatchedAssetMetrics({
      majorCatalogRows: majorCatalog,
      majorSummary: readMajorSummary(majorSummaryRows),
      positionSummary: readPositionSummary(positionSummaryRows),
    }),
    sources: await Promise.all(sources.map(sourceStatus)),
  }
}
