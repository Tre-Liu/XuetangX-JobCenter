import type {
  AssetMetric,
  DashboardSnapshot,
  RecruitmentPipeline,
  SourceStatus,
} from './types/dashboard'

const assetIds = ['chains', 'stages', 'majors', 'industries', 'positions', 'recruitment'] as const
const assetStatuses = new Set(['validated', 'partial', 'review', 'in_progress'])
const sourceStatuses = new Set(['validated', 'partial', 'review', 'in_progress', 'missing'])
const overallStatuses = new Set(['healthy', 'partial', 'stale', 'error'])

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

function isStrictlyAscendingYears(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.every(isNonnegativeInteger)
    && value.every((year, index) => index === 0 || year > value[index - 1])
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false

  const timestamp = new Date(value)
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value
}

function isAssetMetric(value: unknown): boolean {
  if (!isRecord(value)
    || !assetIds.includes(value.id as (typeof assetIds)[number])
    || typeof value.label !== 'string'
    || !isFiniteNumber(value.primaryValue)
    || !assetStatuses.has(value.status as string)
    || typeof value.definition !== 'string'
    || typeof value.grain !== 'string'
    || !Array.isArray(value.sourceIds)
    || !value.sourceIds.every((sourceId) => typeof sourceId === 'string')
    || !Array.isArray(value.supportingMetrics)
    || !value.supportingMetrics.every((metric) => isRecord(metric)
      && typeof metric.label === 'string'
      && (typeof metric.value === 'string' || isFiniteNumber(metric.value)))) {
    return false
  }

  return (value.totalValue === undefined || isFiniteNumber(value.totalValue))
    && (value.coverageRate === undefined || isFiniteNumber(value.coverageRate))
}

function isRecruitmentPipeline(value: unknown): value is RecruitmentPipeline {
  return isRecord(value)
    && isNonnegativeInteger(value.inputRows)
    && isNonnegativeInteger(value.validUniqueRows)
    && isNonnegativeInteger(value.duplicateRows)
    && isNonnegativeInteger(value.invalidRows)
    && isNonnegativeInteger(value.formallyMatchedJobs)
    && isNonnegativeInteger(value.mediumReviewJobs)
    && isNonnegativeInteger(value.unmatchedRows)
    && isNonnegativeInteger(value.formalRelationCount)
    && isStrictlyAscendingYears(value.completedYears)
}

function isSourceStatus(value: unknown): value is SourceStatus {
  return isRecord(value)
    && typeof value.id === 'string'
    && assetIds.includes(value.assetId as (typeof assetIds)[number])
    && typeof value.relativePath === 'string'
    && typeof value.selectedCandidate === 'boolean'
    && isCanonicalIsoTimestamp(value.modifiedAt)
    && typeof value.grain === 'string'
    && sourceStatuses.has(value.status as string)
    && Array.isArray(value.notes)
    && value.notes.every((note) => typeof note === 'string')
}

function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || !isCanonicalIsoTimestamp(value.generatedAt)
    || typeof value.workspaceRootLabel !== 'string'
    || !overallStatuses.has(value.overallStatus as string)
    || !Array.isArray(value.assets)
    || value.assets.length !== assetIds.length
    || !value.assets.every(isAssetMetric)
    || !isRecruitmentPipeline(value.recruitmentPipeline)
    || !Array.isArray(value.sources)
    || !value.sources.every(isSourceStatus)
    || !Array.isArray(value.warnings)
    || !value.warnings.every((warning) => typeof warning === 'string')) {
    return false
  }

  const ids = new Set(value.assets.map((asset) => asset.id))
  return ids.size === assetIds.length && assetIds.every((assetId) => ids.has(assetId))
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
  'majors',
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
