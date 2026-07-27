import type { DashboardSnapshot } from './types/dashboard'

const assetIds = ['chains', 'stages', 'majors', 'industries', 'positions', 'recruitment'] as const
const assetStatuses = new Set(['validated', 'partial', 'review', 'in_progress'])
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
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

function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || !isCanonicalIsoTimestamp(value.generatedAt)
    || typeof value.workspaceRootLabel !== 'string'
    || !overallStatuses.has(value.overallStatus as string)
    || !Array.isArray(value.assets)
    || value.assets.length !== assetIds.length
    || !value.assets.every(isAssetMetric)) {
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
