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

const CURRENT_BASELINE = {
  'chains.primaryValue': 19,
  'chains.totalValue': 129,
  'stages.primaryValue': 57,
  'stages.supportingMetrics.10链精细节点': 1133,
  'majors.primaryValue': 682,
  'majors.totalValue': 2142,
  'industries.primaryValue': 1955,
  'positions.primaryValue': 645,
  'positions.totalValue': 1356,
  'recruitmentPipeline.inputRows': 240034,
  'recruitmentPipeline.validUniqueRows': 239149,
  'recruitmentPipeline.formallyMatchedJobs': 19297,
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

function assertCountOperand(assetName, fieldName, value) {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    fail(`${assetName} ${fieldName} ${receivedLabel(value)} 必须是有限非负整数`)
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

  const receivedIds = Array.isArray(snapshot.assets)
    ? snapshot.assets.map(({ id }) => id)
    : []
  const hasCanonicalAssets = receivedIds.length === ASSET_ORDER.length
    && receivedIds.every((id, index) => id === ASSET_ORDER[index])
  if (!hasCanonicalAssets) {
    fail(
      `资产类型必须恰好为 ${ASSET_ORDER.join(', ')} 并按此顺序; `
      + `received ${receivedLabel(receivedIds)}`,
    )
  }

  const chains = findAsset(snapshot, 'chains')
  assertCountOperand('产业链', '标准产业链', chains.primaryValue)
  assertCountOperand('产业链', '源产业链', chains.totalValue)
  if (!(chains.primaryValue <= chains.totalValue)) {
    fail(`产业链数量不一致: 标准产业链 ${chains.primaryValue} 不得大于源产业链 ${chains.totalValue}`)
  }

  const majors = findAsset(snapshot, 'majors')
  assertCountOperand('专业', '确定关联专业', majors.primaryValue)
  assertCountOperand('专业', '专业总数', majors.totalValue)
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

  const pipeline = snapshot.recruitmentPipeline
  const recruitmentOperands = [
    ['inputRows', '输入记录'],
    ['validUniqueRows', '有效唯一'],
    ['duplicateRows', '重复'],
    ['invalidRows', '无效'],
    ['formallyMatchedJobs', '正式匹配'],
    ['mediumReviewJobs', '待复核'],
    ['unmatchedRows', '未匹配'],
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

  for (const asset of snapshot.assets) {
    if (
      asset.coverageRate !== undefined
      && (!Number.isFinite(asset.coverageRate) || asset.coverageRate < 0 || asset.coverageRate > 1)
    ) {
      fail(
        `${ASSET_NAMES[asset.id]} ${asset.id} 覆盖率 ${String(asset.coverageRate)} `
        + '必须是 0 到 1 之间的有限数值',
      )
    }
  }

  const years = pipeline.completedYears
  const yearsAreSortedUnique = Array.isArray(years)
    && years.every((year, index) =>
      Number.isInteger(year) && (index === 0 || year > years[index - 1]),
    )
  if (!yearsAreSortedUnique) {
    fail(`招聘完成年份 ${receivedLabel(years)} 必须升序且唯一`)
  }
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
