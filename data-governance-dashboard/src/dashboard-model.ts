import type {
  AssetMetric,
  DashboardSnapshot,
  RecruitmentPipeline,
  SourceStatus,
} from './types/dashboard'

const assetIds = [
  'chains',
  'stages',
  'undergraduateMajors',
  'vocationalMajors',
  'industries',
  'positions',
  'recruitment',
] as const
const assetStatuses = new Set(['validated', 'partial', 'review', 'in_progress'])
const sourceStatuses = new Set(['validated', 'partial', 'review', 'in_progress', 'missing'])
const overallStatuses = new Set(['healthy', 'partial', 'stale', 'error'])
const totalAssetIds = new Set<AssetMetric['id']>([
  'chains',
  'undergraduateMajors',
  'vocationalMajors',
  'industries',
  'positions',
  'recruitment',
])
const supportingMetricContracts = {
  chains: [],
  stages: [
    ['10链精细节点', 'number'],
  ],
  undergraduateMajors: [
    ['待人工研判', 'number'],
    ['未匹配', 'number'],
    ['多产业链专业', 'number'],
    ['产业链关系', 'number'],
  ],
  vocationalMajors: [
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
} as const
const coverageTolerance = 1e-12

export type SnapshotStatusInput = {
  schemaVersion?: unknown
  generatedAt?: unknown
  overallStatus?: unknown
}

export type SnapshotDisplayStatus = {
  label: string
  tone: 'healthy' | 'partial' | 'stale' | 'error'
}

export type SnapshotLoadState =
  | { valid: true; snapshot: DashboardSnapshot }
  | { valid: false; message: string }

export type CoverageRow = {
  id: AssetMetric['id']
  label: string
  rate: number
}

export type FunnelStage = {
  id: 'input' | 'valid' | 'review' | 'matched'
  label: string
  value: number
  tone: 'primary' | 'warning' | 'success'
}

export type RecruitmentFootnote = {
  label: '重复记录' | '无效记录' | '未匹配' | '正式关系'
  value: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonnegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isCanonicalRelativePath(value: unknown): value is string {
  if (!isNonemptyString(value) || value !== value.trim()) return false
  if (value.startsWith('/') || value.startsWith('\\') || /^[A-Za-z]:[\\/]/.test(value)) return false
  if (value.includes('\\')) return false
  return value.split('/').every((segment) =>
    segment.length > 0 && segment !== '.' && segment !== '..')
}

function isStrictlyAscendingYears(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.every((year) => isNonnegativeInteger(year) && year >= 1000 && year <= 9999)
    && value.every((year, index) => index === 0 || year > value[index - 1])
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false

  const timestamp = new Date(value)
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value
}

function isValidAssetDetails(
  id: AssetMetric['id'],
  details: unknown,
  primaryValue: number,
) {
  if (id !== 'chains') return details === undefined
  if (!isRecord(details)
    || details.kind !== 'name-list'
    || !isNonemptyString(details.label)
    || !Array.isArray(details.items)
    || details.items.length !== primaryValue
    || !details.items.every(isNonemptyString)) {
    return false
  }
  return new Set(details.items).size === details.items.length
}

function isAssetMetric(value: unknown): boolean {
  if (!isRecord(value)
    || !assetIds.includes(value.id as (typeof assetIds)[number])
    || !isNonemptyString(value.label)
    || !isNonnegativeInteger(value.primaryValue)
    || !assetStatuses.has(value.status as string)
    || !isNonemptyString(value.definition)
    || !isNonemptyString(value.grain)
    || !Array.isArray(value.sourceIds)
    || value.sourceIds.length === 0
    || !value.sourceIds.every(isNonemptyString)
    || new Set(value.sourceIds).size !== value.sourceIds.length
    || !Array.isArray(value.supportingMetrics)) {
    return false
  }

  const id = value.id as AssetMetric['id']
  if (!isValidAssetDetails(id, value.details, value.primaryValue as number)) return false
  const expectedSupporting = supportingMetricContracts[id]
  const supportingMetrics = value.supportingMetrics as unknown[]
  const supportingValid = supportingMetrics.length === expectedSupporting.length
    && expectedSupporting.every(([label, type], index) => {
      const metric = supportingMetrics[index]
      return isRecord(metric)
        && metric.label === label
        && (type === 'number'
          ? isNonnegativeInteger(metric.value)
          : isNonemptyString(metric.value))
    })
  if (!supportingValid) return false

  if (!totalAssetIds.has(id)) {
    return value.totalValue === undefined && value.coverageRate === undefined
  }
  if (!isNonnegativeInteger(value.totalValue) || value.primaryValue > value.totalValue) {
    return false
  }
  if (value.totalValue === 0) {
    return value.primaryValue === 0 && value.coverageRate === undefined
  }
  if (
    !isFiniteNumber(value.coverageRate)
    || value.coverageRate < 0
    || value.coverageRate > 1
  ) return false

  return Math.abs(value.coverageRate - value.primaryValue / value.totalValue) <= coverageTolerance
}

function isRecruitmentPipeline(value: unknown): value is RecruitmentPipeline {
  if (!(isRecord(value)
    && isNonnegativeInteger(value.inputRows)
    && isNonnegativeInteger(value.validUniqueRows)
    && isNonnegativeInteger(value.duplicateRows)
    && isNonnegativeInteger(value.invalidRows)
    && isNonnegativeInteger(value.formallyMatchedJobs)
    && isNonnegativeInteger(value.mediumReviewJobs)
    && isNonnegativeInteger(value.unmatchedRows)
    && isNonnegativeInteger(value.formalRelationCount)
    && isStrictlyAscendingYears(value.completedYears))) {
    return false
  }

  return value.validUniqueRows + value.duplicateRows + value.invalidRows === value.inputRows
    && value.formallyMatchedJobs + value.mediumReviewJobs + value.unmatchedRows
      <= value.validUniqueRows
    && value.formalRelationCount >= value.formallyMatchedJobs
}

function isSourceStatus(value: unknown): value is SourceStatus {
  return isRecord(value)
    && isNonemptyString(value.id)
    && assetIds.includes(value.assetId as (typeof assetIds)[number])
    && isCanonicalRelativePath(value.relativePath)
    && value.selectedCandidate === true
    && isCanonicalIsoTimestamp(value.modifiedAt)
    && isNonemptyString(value.grain)
    && sourceStatuses.has(value.status as string)
    && Array.isArray(value.notes)
    && value.notes.every(isNonemptyString)
    && new Set(value.notes).size === value.notes.length
}

function supportingValue(asset: AssetMetric, label: string) {
  return asset.supportingMetrics.find((metric) => metric.label === label)?.value
}

export function formatYearRanges(years: ReadonlyArray<number>) {
  if (!years.length) return '无'

  const ranges: string[] = []
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

function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || !isCanonicalIsoTimestamp(value.generatedAt)
    || !isNonemptyString(value.workspaceRootLabel)
    || !overallStatuses.has(value.overallStatus as string)
    || !Array.isArray(value.assets)
    || value.assets.length !== assetIds.length
    || !assetIds.every((assetId, index) =>
      (value.assets as Array<{ id?: unknown }>)[index]?.id === assetId)
    || !value.assets.every(isAssetMetric)
    || !isRecruitmentPipeline(value.recruitmentPipeline)
    || !Array.isArray(value.sources)
    || !value.sources.every(isSourceStatus)
    || !Array.isArray(value.warnings)
    || !value.warnings.every(isNonemptyString)
    || new Set(value.warnings).size !== value.warnings.length) {
    return false
  }

  const assets = value.assets as AssetMetric[]
  const pipeline = value.recruitmentPipeline
  const sources = value.sources as SourceStatus[]
  const sourceIds = new Set(value.sources.map((source) => source.id))
  if (sourceIds.size !== value.sources.length) return false

  const sourcesById = new Map(sources.map((source) => [source.id, source]))
  if (!assets.every((asset) => asset.sourceIds.every((sourceId) =>
    sourcesById.get(sourceId)?.assetId === asset.id))) {
    return false
  }

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  const industries = assetsById.get('industries')!
  const duplicateIndustries = supportingValue(industries, '重复代码行') as number
  if (industries.primaryValue + duplicateIndustries !== industries.totalValue) return false

  for (const majorId of ['undergraduateMajors', 'vocationalMajors'] as const) {
    const majors = assetsById.get(majorId)!
    const majorReview = supportingValue(majors, '待人工研判') as number
    const majorUnmatched = supportingValue(majors, '未匹配') as number
    const multiChain = supportingValue(majors, '多产业链专业') as number
    const majorRelations = supportingValue(majors, '产业链关系') as number
    if (
      majors.primaryValue + majorReview + majorUnmatched !== majors.totalValue
      || multiChain > majors.primaryValue
      || majorRelations < majors.primaryValue
    ) return false
  }

  const positions = assetsById.get('positions')!
  const unmatchedPositions = supportingValue(positions, '未匹配岗位') as number
  const positionRelations = supportingValue(positions, '岗位—节点关系') as number
  const highConfidence = supportingValue(positions, '高置信关系') as number
  const reviewRelations = supportingValue(positions, '建议复核关系') as number
  if (
    positions.primaryValue + unmatchedPositions !== positions.totalValue
    || highConfidence + reviewRelations > positionRelations
    || positionRelations < positions.primaryValue
  ) return false

  const recruitment = assetsById.get('recruitment')!
  return recruitment.primaryValue === pipeline.validUniqueRows
    && recruitment.totalValue === pipeline.inputRows
    && supportingValue(recruitment, '正式匹配招聘') === pipeline.formallyMatchedJobs
    && supportingValue(recruitment, '中置信待复核') === pipeline.mediumReviewJobs
    && supportingValue(recruitment, '未匹配') === pipeline.unmatchedRows
    && supportingValue(recruitment, '当前批次')
      === formatYearRanges(pipeline.completedYears)
}

export const formatCount = (value: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)

export const formatPercent = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)

export function filterSources(
  sources: ReadonlyArray<SourceStatus>,
  {
    assetId = 'all',
    status = 'all',
  }: {
    assetId?: AssetMetric['id'] | 'all'
    status?: SourceStatus['status'] | 'all'
  },
): SourceStatus[] {
  return sources.filter((source) =>
    (assetId === 'all' || source.assetId === assetId)
    && (status === 'all' || source.status === status))
}

export const sourcesForAsset = (
  sources: ReadonlyArray<SourceStatus>,
  assetId: AssetMetric['id'],
) => filterSources(sources, { assetId, status: 'all' })

export const statusLabel = (status: string) => ({
  validated: '已校验',
  partial: '部分覆盖',
  review: '建议复核',
  in_progress: '跑批进行中',
  missing: '缺少数据源',
}[status] ?? '未知状态')

const coverageOrder: AssetMetric['id'][] = [
  'chains',
  'undergraduateMajors',
  'vocationalMajors',
  'positions',
  'industries',
  'recruitment',
]

function safeCount(value: unknown): number {
  return isNonnegativeInteger(value) ? value : 0
}

export function buildCoverageRows(
  assets: ReadonlyArray<Pick<AssetMetric, 'id' | 'label' | 'coverageRate'>>,
): CoverageRow[] {
  const compatibleAssets = new Map(assets.map((asset) => [asset.id, asset]))

  return coverageOrder.flatMap((id) => {
    const asset = compatibleAssets.get(id)
    if (!asset || asset.coverageRate === undefined) return []

    return [{
      id,
      label: asset.label,
      rate: isFiniteNumber(asset.coverageRate)
        ? Math.min(1, Math.max(0, asset.coverageRate))
        : 0,
    }]
  })
}

export function buildRecruitmentStages(pipeline: RecruitmentPipeline): FunnelStage[] {
  return [
    { id: 'input', label: '输入记录', value: safeCount(pipeline.inputRows), tone: 'primary' },
    { id: 'valid', label: '有效唯一', value: safeCount(pipeline.validUniqueRows), tone: 'primary' },
    { id: 'review', label: '待复核', value: safeCount(pipeline.mediumReviewJobs), tone: 'warning' },
    { id: 'matched', label: '正式匹配', value: safeCount(pipeline.formallyMatchedJobs), tone: 'success' },
  ]
}

export function buildRecruitmentFootnotes(pipeline: RecruitmentPipeline): RecruitmentFootnote[] {
  return [
    { label: '重复记录', value: safeCount(pipeline.duplicateRows) },
    { label: '无效记录', value: safeCount(pipeline.invalidRows) },
    { label: '未匹配', value: safeCount(pipeline.unmatchedRows) },
    { label: '正式关系', value: safeCount(pipeline.formalRelationCount) },
  ]
}

export function snapshotDisplayStatus(
  snapshot: SnapshotStatusInput,
  now = new Date(),
): SnapshotDisplayStatus {
  const generatedAt = isCanonicalIsoTimestamp(snapshot.generatedAt)
    ? new Date(snapshot.generatedAt).getTime()
    : Number.NaN
  const age = now.getTime() - generatedAt

  if (!Number.isFinite(generatedAt) || age > 7 * 24 * 60 * 60 * 1000) {
    return { label: '数据已过期', tone: 'stale' }
  }
  if (snapshot.overallStatus === 'stale') return { label: '数据已过期', tone: 'stale' }
  if (snapshot.overallStatus === 'partial') return { label: '部分完成', tone: 'partial' }
  if (snapshot.overallStatus === 'error') return { label: '快照异常', tone: 'error' }
  return { label: '数据快照正常', tone: 'healthy' }
}

export function snapshotLoadState(value: unknown): SnapshotLoadState {
  const snapshot = value as SnapshotStatusInput | null | undefined

  if (snapshot?.schemaVersion !== 1) {
    return {
      valid: false,
      message: `无法展示数据：未知快照版本 ${String(snapshot?.schemaVersion ?? '缺失')}`,
    }
  }

  if (!isDashboardSnapshot(value)) {
    return { valid: false, message: '无法展示数据：快照数据结构不完整' }
  }

  return { valid: true, snapshot: value }
}
