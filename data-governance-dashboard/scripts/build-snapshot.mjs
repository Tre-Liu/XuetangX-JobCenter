import { basename, resolve } from 'node:path'
import { collectMatchedAssets } from './collectors/matched-assets.mjs'
import { collectRecruitment } from './collectors/recruitment.mjs'
import { collectStaticAssets } from './collectors/static-assets.mjs'
import { resolveAllSources } from './lib/readers.mjs'
import { SOURCE_REGISTRY } from './source-registry.mjs'

const ASSET_ORDER = ['chains', 'stages', 'majors', 'industries', 'positions', 'recruitment']
const ASSET_NAMES = {
  chains: '产业链',
  stages: '产业环节',
  majors: '专业',
  industries: '国标行业',
  positions: '岗位',
  recruitment: '招聘信息',
}

const ASSET_STATUSES = new Set(['validated', 'partial', 'review', 'in_progress'])
const SOURCE_STATUSES = new Set(['validated', 'partial', 'review', 'in_progress', 'missing'])
const OVERALL_STATUSES = new Set(['healthy', 'partial', 'stale', 'error'])
const TOTAL_ASSETS = new Set(['chains', 'majors', 'industries', 'positions', 'recruitment'])
const PRIMARY_FIELD_NAMES = {
  chains: '标准产业链',
  stages: '主指标',
  majors: '确定关联专业',
  industries: '唯一代码',
  positions: '已匹配岗位',
  recruitment: '有效唯一',
}
const TOTAL_FIELD_NAMES = {
  chains: '源产业链',
  majors: '专业总数',
  industries: '有效行',
  positions: '岗位总数',
  recruitment: '输入记录',
}
const SUPPORTING_METRICS = {
  chains: [],
  stages: [
    ['10链精细节点', 'number'],
  ],
  majors: [
    ['待人工研判', 'number'],
    ['未匹配', 'number'],
    ['多产业链专业', 'number'],
    ['产业链关系', 'number'],
  ],
  industries: [
    ['重复代码行', 'number'],
  ],
  positions: [
    ['未匹配岗位', 'number'],
    ['岗位—节点关系', 'number'],
    ['高置信关系', 'number'],
    ['建议复核关系', 'number'],
  ],
  recruitment: [
    ['正式匹配招聘', 'number'],
    ['中置信待复核', 'number'],
    ['未匹配', 'number'],
    ['当前批次', 'string'],
  ],
}
const COVERAGE_TOLERANCE = 1e-12

const CURRENT_BASELINE = {
  'chains.primaryValue': 19,
  'chains.totalValue': 129,
  'stages.primaryValue': 57,
  'stages.supportingMetrics.10链精细节点': 1133,
  'majors.primaryValue': 682,
  'majors.totalValue': 2142,
  'majors.supportingMetrics.待人工研判': 443,
  'majors.supportingMetrics.未匹配': 1017,
  'majors.supportingMetrics.多产业链专业': 89,
  'majors.supportingMetrics.产业链关系': 791,
  'industries.primaryValue': 1955,
  'industries.totalValue': 1956,
  'positions.primaryValue': 645,
  'positions.totalValue': 1356,
  'positions.supportingMetrics.未匹配岗位': 711,
  'positions.supportingMetrics.岗位—节点关系': 706,
  'positions.supportingMetrics.高置信关系': 157,
  'positions.supportingMetrics.建议复核关系': 175,
  'recruitmentPipeline.inputRows': 240034,
  'recruitmentPipeline.validUniqueRows': 239149,
  'recruitmentPipeline.duplicateRows': 53,
  'recruitmentPipeline.invalidRows': 832,
  'recruitmentPipeline.formallyMatchedJobs': 19297,
  'recruitmentPipeline.mediumReviewJobs': 55378,
  'recruitmentPipeline.unmatchedRows': 164474,
  'recruitmentPipeline.formalRelationCount': 19297,
  'recruitmentPipeline.completedYears': [2014, 2015, 2016],
}

function fail(message) {
  throw new Error(message)
}

function findAsset(snapshot, id) {
  return snapshot.assets.find((asset) => asset.id === id)
}

function supportingValue(asset, label) {
  return asset.supportingMetrics.find((metric) => metric.label === label)?.value
}

function receivedLabel(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value)
  return JSON.stringify(value) ?? String(value)
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCanonicalIsoTimestamp(value) {
  if (
    typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) return false

  const timestamp = new Date(value)
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value
}

function isNonemptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isCanonicalRelativePath(value) {
  if (!isNonemptyString(value) || value !== value.trim()) return false
  if (value.startsWith('/') || value.startsWith('\\') || /^[A-Za-z]:[\\/]/.test(value)) return false
  if (value.includes('\\')) return false
  const segments = value.split('/')
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
}

function assertCountOperand(assetName, fieldName, value) {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    fail(`${assetName} ${fieldName} ${receivedLabel(value)} 必须是有限非负整数`)
  }
}

function assertNonemptyField(context, fieldName, value) {
  if (!isNonemptyString(value)) {
    fail(`${context} ${fieldName} ${receivedLabel(value)} 必须是非空字符串`)
  }
}

function assertSupportingMetrics(asset) {
  const assetName = ASSET_NAMES[asset.id]
  const expected = SUPPORTING_METRICS[asset.id]
  const receivedLabels = Array.isArray(asset.supportingMetrics)
    ? asset.supportingMetrics.map((metric) => metric?.label)
    : asset.supportingMetrics
  const labelsMatch = Array.isArray(asset.supportingMetrics)
    && asset.supportingMetrics.length === expected.length
    && expected.every(([label], index) => asset.supportingMetrics[index]?.label === label)
  if (!labelsMatch) {
    fail(
      `${assetName} 补充指标必须按顺序为 ${expected.map(([label]) => label).join(', ')}; `
      + `received ${receivedLabel(receivedLabels)}`,
    )
  }

  expected.forEach(([label, type], index) => {
    const value = asset.supportingMetrics[index].value
    if (type === 'number') {
      assertCountOperand(assetName, label, value)
    } else {
      assertNonemptyField(assetName, label, value)
    }
  })
}

function assertAssetShape(asset) {
  const assetName = ASSET_NAMES[asset.id]
  assertNonemptyField(assetName, '标签', asset.label)
  assertCountOperand(assetName, PRIMARY_FIELD_NAMES[asset.id], asset.primaryValue)
  assertNonemptyField(assetName, '定义', asset.definition)
  assertNonemptyField(assetName, '统计粒度', asset.grain)
  if (!ASSET_STATUSES.has(asset.status)) {
    fail(`${assetName} 状态 ${receivedLabel(asset.status)} 无效`)
  }
  if (
    !Array.isArray(asset.sourceIds)
    || asset.sourceIds.length === 0
    || !asset.sourceIds.every(isNonemptyString)
    || new Set(asset.sourceIds).size !== asset.sourceIds.length
  ) {
    fail(`${assetName} 来源 ID 必须是至少一个非空且唯一的字符串数组`)
  }
  assertSupportingMetrics(asset)

  if (!TOTAL_ASSETS.has(asset.id)) {
    if (asset.totalValue !== undefined) {
      fail(`${assetName} 不得提供总数; received ${receivedLabel(asset.totalValue)}`)
    }
    if (asset.coverageRate !== undefined) {
      fail(`${assetName} 无总数时不得提供覆盖率; received ${receivedLabel(asset.coverageRate)}`)
    }
    return
  }

  if (asset.totalValue === undefined) {
    fail(
      `${assetName} 必须提供总数; ${assetName} ${TOTAL_FIELD_NAMES[asset.id]} `
      + 'undefined 必须是有限非负整数',
    )
  }
  assertCountOperand(assetName, TOTAL_FIELD_NAMES[asset.id], asset.totalValue)
  if (asset.totalValue === 0) {
    if (asset.primaryValue !== 0) {
      fail(`${assetName} 总数为 0 时主指标必须为 0; received ${asset.primaryValue}`)
    }
    if (asset.coverageRate !== undefined) {
      fail(`${assetName} 总数为 0 时不得提供覆盖率; received ${receivedLabel(asset.coverageRate)}`)
    }
    return
  }

  if (
    !Number.isFinite(asset.coverageRate)
    || asset.coverageRate < 0
    || asset.coverageRate > 1
  ) {
    fail(
      `${assetName} ${asset.id} 覆盖率 ${String(asset.coverageRate)} `
      + '必须是 0 到 1 之间的有限数值',
    )
  }
}

function assertCoverageMatches(asset) {
  if (!TOTAL_ASSETS.has(asset.id) || asset.totalValue === 0) return
  const expectedCoverage = asset.primaryValue / asset.totalValue
  if (Math.abs(asset.coverageRate - expectedCoverage) > COVERAGE_TOLERANCE) {
    fail(
      `${ASSET_NAMES[asset.id]} 覆盖率 ${asset.coverageRate} `
      + `必须等于主指标 ${asset.primaryValue} 除以总数 ${asset.totalValue}`,
    )
  }
}

function baselineValue(snapshot, path) {
  const [root, field, ...remainder] = path.split('.')
  if (root === 'recruitmentPipeline') return snapshot.recruitmentPipeline[field]

  const asset = findAsset(snapshot, root)
  if (field === 'supportingMetrics') return supportingValue(asset, remainder.join('.'))
  return asset?.[field]
}

function formatYearRanges(years) {
  if (!years.length) return '无'

  const ranges = []
  let start = years[0]
  let end = start
  for (const year of years.slice(1)) {
    if (year === end + 1) {
      end = year
    } else {
      ranges.push(start === end ? String(start) : `${start}—${end}`)
      start = year
      end = year
    }
  }
  ranges.push(start === end ? String(start) : `${start}—${end}`)
  return ranges.join(', ')
}

export function validateSnapshot(snapshot) {
  if (snapshot?.schemaVersion !== 1) {
    fail(`未知快照版本: received ${receivedLabel(snapshot?.schemaVersion)}`)
  }
  if (!isCanonicalIsoTimestamp(snapshot.generatedAt)) {
    fail(`快照生成时间 ${receivedLabel(snapshot.generatedAt)} 必须是规范 ISO 时间`)
  }
  if (!isNonemptyString(snapshot.workspaceRootLabel)) {
    fail(`工作区标签 ${receivedLabel(snapshot.workspaceRootLabel)} 必须非空`)
  }
  if (!OVERALL_STATUSES.has(snapshot.overallStatus)) {
    fail(`总体状态 ${receivedLabel(snapshot.overallStatus)} 无效`)
  }

  const receivedIds = Array.isArray(snapshot.assets)
    ? snapshot.assets.map((asset) => asset?.id)
    : []
  const hasCanonicalAssets = receivedIds.length === ASSET_ORDER.length
    && receivedIds.every((id, index) => id === ASSET_ORDER[index])
  if (!hasCanonicalAssets) {
    fail(
      `资产类型必须恰好为 ${ASSET_ORDER.join(', ')} 并按此顺序; `
      + `received ${receivedLabel(receivedIds)}`,
    )
  }

  for (const asset of snapshot.assets) assertAssetShape(asset)

  const chains = findAsset(snapshot, 'chains')
  if (!(chains.primaryValue <= chains.totalValue)) {
    fail(`产业链数量不一致: 标准产业链 ${chains.primaryValue} 不得大于源产业链 ${chains.totalValue}`)
  }

  const majors = findAsset(snapshot, 'majors')
  if (!(majors.primaryValue <= majors.totalValue)) {
    fail(`专业数量不一致: 确定关联专业 ${majors.primaryValue} 不得大于专业总数 ${majors.totalValue}`)
  }

  const positions = findAsset(snapshot, 'positions')
  const unmatchedPositions = supportingValue(positions, '未匹配岗位')
  assertCountOperand('岗位', '已匹配岗位', positions.primaryValue)
  assertCountOperand('岗位', '未匹配岗位', unmatchedPositions)
  assertCountOperand('岗位', '岗位总数', positions.totalValue)
  if (positions.primaryValue + unmatchedPositions !== positions.totalValue) {
    fail(
      `岗位数量不一致: 已匹配岗位 ${positions.primaryValue} + `
      + `未匹配岗位 ${unmatchedPositions} 必须等于岗位总数 ${positions.totalValue}`,
    )
  }
  const positionRelations = supportingValue(positions, '岗位—节点关系')
  const highConfidence = supportingValue(positions, '高置信关系')
  const reviewRelations = supportingValue(positions, '建议复核关系')
  if (highConfidence + reviewRelations > positionRelations) {
    fail(
      `岗位关系数量不一致: 高置信关系 ${highConfidence} + `
      + `建议复核关系 ${reviewRelations} 不得大于关系 ${positionRelations}`,
    )
  }
  if (positionRelations < positions.primaryValue) {
    fail(
      `岗位关系数量不一致: 关系 ${positionRelations} 不得少于已匹配岗位 ${positions.primaryValue}`,
    )
  }

  const industry = findAsset(snapshot, 'industries')
  const duplicateIndustries = supportingValue(industry, '重复代码行')
  if (industry.primaryValue + duplicateIndustries !== industry.totalValue) {
    fail(
      `国标行业数量不一致: 唯一代码 ${industry.primaryValue} + `
      + `重复代码行 ${duplicateIndustries} 必须等于有效行 ${industry.totalValue}`,
    )
  }

  const majorReview = supportingValue(majors, '待人工研判')
  const majorUnmatched = supportingValue(majors, '未匹配')
  const multiChain = supportingValue(majors, '多产业链专业')
  const majorRelations = supportingValue(majors, '产业链关系')
  if (majors.primaryValue + majorReview + majorUnmatched !== majors.totalValue) {
    fail(
      `专业数量不一致: 确定关联 ${majors.primaryValue} + 待人工研判 ${majorReview} + `
      + `未匹配 ${majorUnmatched} 必须等于总数 ${majors.totalValue}`,
    )
  }
  if (multiChain > majors.primaryValue) {
    fail(`专业数量不一致: 多产业链专业 ${multiChain} 不得大于确定关联 ${majors.primaryValue}`)
  }
  if (majorRelations < majors.primaryValue) {
    fail(`专业关系数量不一致: 产业链关系 ${majorRelations} 不得少于确定关联 ${majors.primaryValue}`)
  }

  const pipeline = snapshot.recruitmentPipeline
  const recruitmentOperands = [
    ['inputRows', '输入记录'],
    ['validUniqueRows', '有效唯一'],
    ['duplicateRows', '重复'],
    ['invalidRows', '无效'],
    ['formallyMatchedJobs', '正式匹配'],
    ['mediumReviewJobs', '待复核'],
    ['unmatchedRows', '未匹配'],
    ['formalRelationCount', '正式关系'],
  ]
  for (const [field, label] of recruitmentOperands) {
    assertCountOperand('招聘', label, pipeline[field])
  }

  const classifiedInput = pipeline.validUniqueRows + pipeline.duplicateRows + pipeline.invalidRows
  if (classifiedInput !== pipeline.inputRows) {
    fail(
      `招聘输入数量不一致: 有效唯一 ${pipeline.validUniqueRows} + 重复 ${pipeline.duplicateRows} + `
      + `无效 ${pipeline.invalidRows} 必须等于输入 ${pipeline.inputRows}`,
    )
  }

  const classifiedResults = pipeline.formallyMatchedJobs
    + pipeline.mediumReviewJobs
    + pipeline.unmatchedRows
  if (!(classifiedResults <= pipeline.validUniqueRows)) {
    fail(
      `招聘结果数量不一致: 正式匹配 ${pipeline.formallyMatchedJobs} + `
      + `待复核 ${pipeline.mediumReviewJobs} + 未匹配 ${pipeline.unmatchedRows} `
      + `不得大于有效唯一 ${pipeline.validUniqueRows}`,
    )
  }
  if (pipeline.formalRelationCount < pipeline.formallyMatchedJobs) {
    fail(
      `招聘关系数量不一致: 正式关系 ${pipeline.formalRelationCount} `
      + `不得少于正式匹配 ${pipeline.formallyMatchedJobs}`,
    )
  }

  const years = pipeline.completedYears
  const yearsAreSortedUnique = Array.isArray(years)
    && years.every((year, index) =>
      Number.isInteger(year)
      && year >= 1000
      && year <= 9999
      && (index === 0 || year > years[index - 1]),
    )
  if (!yearsAreSortedUnique) {
    fail(`招聘完成年份 ${receivedLabel(years)} 必须升序且唯一，并且每项是 1000 到 9999 的整数`)
  }

  const recruitment = findAsset(snapshot, 'recruitment')
  const recruitmentMappings = [
    ['有效唯一', recruitment.primaryValue, pipeline.validUniqueRows],
    ['输入记录', recruitment.totalValue, pipeline.inputRows],
    ['正式匹配招聘', supportingValue(recruitment, '正式匹配招聘'), pipeline.formallyMatchedJobs],
    ['中置信待复核', supportingValue(recruitment, '中置信待复核'), pipeline.mediumReviewJobs],
    ['未匹配', supportingValue(recruitment, '未匹配'), pipeline.unmatchedRows],
  ]
  for (const [label, assetValue, pipelineValue] of recruitmentMappings) {
    if (assetValue !== pipelineValue) {
      fail(`招聘资产 ${label} ${assetValue} 必须等于流水线 ${pipelineValue}`)
    }
  }
  const batchLabel = supportingValue(recruitment, '当前批次')
  const expectedBatchLabel = formatYearRanges(years)
  if (batchLabel !== expectedBatchLabel) {
    fail(`招聘资产 当前批次 ${receivedLabel(batchLabel)} 必须等于 ${expectedBatchLabel}`)
  }

  if (!Array.isArray(snapshot.sources)) {
    fail('来源必须是数组')
  }
  const sourceIds = new Set()
  for (const source of snapshot.sources) {
    if (!isRecord(source)) fail(`来源 ${receivedLabel(source)} 必须是对象`)
    assertNonemptyField('来源', 'ID', source.id)
    if (sourceIds.has(source.id)) fail(`来源 ID ${source.id} 必须唯一`)
    sourceIds.add(source.id)
    if (!ASSET_ORDER.includes(source.assetId)) {
      fail(`来源 ${source.id} 资产类型 ${receivedLabel(source.assetId)} 无效`)
    }
    if (!isCanonicalRelativePath(source.relativePath)) {
      fail(`来源 ${source.id} 路径 ${receivedLabel(source.relativePath)} 必须是相对规范路径`)
    }
    if (source.selectedCandidate !== true) {
      fail(`来源 ${source.id} selectedCandidate 必须为 true`)
    }
    if (!isCanonicalIsoTimestamp(source.modifiedAt)) {
      fail(`来源 ${source.id} 更新时间 ${receivedLabel(source.modifiedAt)} 必须是规范 ISO 时间`)
    }
    assertNonemptyField(`来源 ${source.id}`, '统计粒度', source.grain)
    if (!SOURCE_STATUSES.has(source.status)) {
      fail(`来源 ${source.id} 状态 ${receivedLabel(source.status)} 无效`)
    }
    if (
      !Array.isArray(source.notes)
      || !source.notes.every(isNonemptyString)
      || new Set(source.notes).size !== source.notes.length
    ) {
      fail(`来源 ${source.id} 备注必须是唯一非空字符串数组`)
    }
  }

  const sourcesById = new Map(snapshot.sources.map((source) => [source.id, source]))
  for (const asset of snapshot.assets) {
    for (const sourceId of asset.sourceIds) {
      const source = sourcesById.get(sourceId)
      if (!source || source.assetId !== asset.id) {
        fail(`${ASSET_NAMES[asset.id]} 来源 ${sourceId} 必须引用已存在的同资产来源`)
      }
    }
  }

  if (
    !Array.isArray(snapshot.warnings)
    || !snapshot.warnings.every(isNonemptyString)
    || new Set(snapshot.warnings).size !== snapshot.warnings.length
  ) {
    fail('警告必须是唯一非空字符串数组')
  }

  for (const asset of snapshot.assets) assertCoverageMatches(asset)
}

export async function buildDashboardSnapshot({ workspaceRoot, now = new Date() }) {
  const resolvedSources = await resolveAllSources(workspaceRoot, SOURCE_REGISTRY)
  const [staticResult, matchedResult, recruitmentResult] = await Promise.all([
    collectStaticAssets({ workspaceRoot, resolvedSources }),
    collectMatchedAssets({ workspaceRoot, resolvedSources }),
    collectRecruitment({
      workspaceRoot,
      resolvedSource: resolvedSources.recruitmentManifests,
    }),
  ])
  const unsortedAssets = [
    ...staticResult.assets,
    ...matchedResult.assets,
    recruitmentResult.asset,
  ]
  const assets = ASSET_ORDER.map((id) => unsortedAssets.find((asset) => asset.id === id))
  const snapshot = {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    workspaceRootLabel: basename(resolve(workspaceRoot)),
    overallStatus: assets.some(
      (asset) => asset.status === 'in_progress' || asset.status === 'partial',
    )
      ? 'partial'
      : 'healthy',
    assets,
    recruitmentPipeline: recruitmentResult.pipeline,
    sources: [
      ...staticResult.sources,
      ...matchedResult.sources,
      ...recruitmentResult.sources,
    ],
    warnings: recruitmentResult.warnings,
  }

  validateSnapshot(snapshot)
  return snapshot
}

export function assertCurrentBaseline(snapshot) {
  for (const [path, expected] of Object.entries(CURRENT_BASELINE)) {
    const received = baselineValue(snapshot, path)
    if (receivedLabel(received) !== receivedLabel(expected)) {
      fail(`基线不一致 ${path}: expected ${receivedLabel(expected)}, received ${receivedLabel(received)}`)
    }
  }
}

export function formatSummary(snapshot) {
  const chains = findAsset(snapshot, 'chains')
  const majors = findAsset(snapshot, 'majors')
  const positions = findAsset(snapshot, 'positions')
  return [
    '快照生成成功',
    `产业链 ${chains.primaryValue}/${chains.totalValue}`,
    `专业 ${majors.primaryValue}/${majors.totalValue}`,
    `岗位 ${positions.primaryValue}/${positions.totalValue}`,
    `招聘有效唯一 ${snapshot.recruitmentPipeline.validUniqueRows}`,
    `当前批次 ${formatYearRanges(snapshot.recruitmentPipeline.completedYears)}`,
  ].join('\n')
}
