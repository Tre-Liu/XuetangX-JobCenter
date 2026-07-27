import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatCount,
  formatPercent,
  snapshotDisplayStatus,
  snapshotLoadState,
} from '../src/dashboard-model.ts'

test('dashboard formats Chinese-facing counts and percentages', () => {
  assert.equal(formatCount(239149), '239,149')
  assert.equal(formatPercent(0.318394), '31.8%')
})

test('snapshot older than seven days is stale', () => {
  assert.deepEqual(
    snapshotDisplayStatus(
      { generatedAt: '2026-07-01T00:00:00.000Z', overallStatus: 'partial' },
      new Date('2026-07-09T00:00:00.000Z'),
    ),
    { label: '数据已过期', tone: 'stale' },
  )
})

test('snapshot with a missing or invalid generated date is stale', () => {
  assert.deepEqual(snapshotDisplayStatus({}, new Date('2026-07-09T00:00:00.000Z')), {
    label: '数据已过期',
    tone: 'stale',
  })
  assert.deepEqual(
    snapshotDisplayStatus({ generatedAt: 'not-a-date' }, new Date('2026-07-09T00:00:00.000Z')),
    { label: '数据已过期', tone: 'stale' },
  )
})

test('unknown snapshot schema produces a reader-facing error state', () => {
  assert.deepEqual(snapshotLoadState({ schemaVersion: 2 }), {
    valid: false,
    message: '无法展示数据：未知快照版本 2',
  })
})
