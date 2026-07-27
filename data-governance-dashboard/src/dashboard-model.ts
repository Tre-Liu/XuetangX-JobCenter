import type { DashboardSnapshot } from './types/dashboard'

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
  const generatedAt = typeof snapshot.generatedAt === 'string'
    ? new Date(snapshot.generatedAt).getTime()
    : Number.NaN
  const age = now.getTime() - generatedAt

  if (!Number.isFinite(generatedAt) || age > 7 * 24 * 60 * 60 * 1000) {
    return { label: '数据已过期', tone: 'stale' }
  }
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

  return { valid: true, snapshot: value as DashboardSnapshot }
}
