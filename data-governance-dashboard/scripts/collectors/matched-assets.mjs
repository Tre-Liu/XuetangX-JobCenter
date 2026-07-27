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

function receivedLabel(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value)
  return JSON.stringify(value) ?? String(value)
}

function assertSummaryCount(summaryName, label, value) {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(
      `${summaryName} ${label} ${receivedLabel(value)} 必须是有限非负整数`,
    )
  }
}

const MAJOR_FIELDS = {
  total: '专业总数',
  matched: '确定关联专业',
  multiChain: '多产业链专业',
  relations: '产业链关系',
  review: '待人工研判',
  unmatched: '未匹配',
}

const POSITION_FIELDS = {
  total: '岗位总数',
  matched: '已匹配岗位',
  unmatched: '未匹配岗位',
  relations: '关系总数',
  stages: '产业节点数',
  highConfidence: '高置信关系',
  reviewRelations: '建议复核关系',
}

function validateMajorSummary(summary) {
  for (const [field, label] of Object.entries(MAJOR_FIELDS)) {
    assertSummaryCount('专业汇总', label, summary[field])
  }
  if (summary.matched + summary.review + summary.unmatched !== summary.total) {
    throw new Error(
      `专业汇总分类不一致: 确定关联专业 ${summary.matched} + `
      + `待人工研判 ${summary.review} + 未匹配 ${summary.unmatched} `
      + `必须等于总数 ${summary.total}`,
    )
  }
  if (summary.multiChain > summary.matched) {
    throw new Error(
      `专业汇总多产业链专业 ${summary.multiChain} 不得大于确定关联专业 ${summary.matched}`,
    )
  }
  if (summary.relations < summary.matched) {
    throw new Error(
      `专业汇总产业链关系 ${summary.relations} 不得少于确定关联专业 ${summary.matched}`,
    )
  }
}

function validatePositionSummary(summary) {
  for (const [field, label] of Object.entries(POSITION_FIELDS)) {
    assertSummaryCount('岗位汇总', label, summary[field])
  }
  if (summary.matched + summary.unmatched !== summary.total) {
    throw new Error(
      `岗位汇总数量不一致: 已匹配岗位 ${summary.matched} + `
      + `未匹配岗位 ${summary.unmatched} 必须等于岗位总数 ${summary.total}`,
    )
  }
  if (summary.highConfidence + summary.reviewRelations > summary.relations) {
    throw new Error(
      `岗位汇总关系分类不一致: 高置信关系 ${summary.highConfidence} + `
      + `建议复核关系 ${summary.reviewRelations} 不得大于关系总数 ${summary.relations}`,
    )
  }
  if (summary.relations < summary.matched) {
    throw new Error(
      `岗位汇总关系总数 ${summary.relations} 不得少于已匹配岗位 ${summary.matched}`,
    )
  }
}

export function readMajorSummary(rows) {
  const headerIndex = rows.findIndex((row) => rowLabel(row).startsWith('数据范围'))
  if (headerIndex === -1) throw new Error('专业汇总缺少数据范围表头')

  const totalRow = rows.slice(headerIndex + 1).find((row) => rowLabel(row) === '合计')
  if (!totalRow) throw new Error('专业汇总缺少合计行')

  const values = new Map(rows[headerIndex].map((label, index) => [String(label ?? '').trim(), totalRow[index]]))
  const summary = {
    total: requiredValue(values, '专业数', '专业汇总'),
    matched: requiredValue(values, '有确定关联专业', '专业汇总'),
    multiChain: requiredValue(values, '多产业链专业', '专业汇总'),
    relations: requiredValue(values, '产业链关系数', '专业汇总'),
    review: requiredValue(values, '待人工研判', '专业汇总'),
    unmatched: requiredValue(values, '未匹配', '专业汇总'),
  }
  validateMajorSummary(summary)
  return summary
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

  const summary = {
    total: requiredValue(values, '岗位总数', '岗位汇总'),
    matched: requiredValue(values, '已匹配岗位', '岗位汇总'),
    unmatched: requiredValue(values, '未匹配岗位', '岗位汇总'),
    relations: requiredValue(values, '关系总数', '岗位汇总'),
    stages: requiredValue(values, '产业节点数', '岗位汇总'),
    highConfidence: requiredValue(values, '高置信关系', '岗位汇总'),
    reviewRelations: requiredValue(values, '建议复核关系', '岗位汇总'),
  }
  validatePositionSummary(summary)
  return summary
}

export function buildMatchedAssetMetrics({ majorCatalogRows, majorSummary, positionSummary }) {
  const catalogTotal = uniqueNonBlank(majorCatalogRows, '专业编码')
  validateMajorSummary(majorSummary)
  validatePositionSummary(positionSummary)
  if (majorSummary.total !== catalogTotal) {
    throw new Error(
      `专业汇总总数 ${majorSummary.total} 必须等于专业目录去重数 ${catalogTotal}`,
    )
  }

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
