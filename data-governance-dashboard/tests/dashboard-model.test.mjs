import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatCount,
  formatPercent,
  snapshotDisplayStatus,
  snapshotLoadState,
} from '../src/dashboard-model.ts'
import {
  snapshotContractViolationFixtures,
  validSnapshotFixture,
} from './helpers/snapshot-fixture.mjs'

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

test('snapshot with a non-canonical normalized ISO timestamp is stale', () => {
  assert.deepEqual(
    snapshotDisplayStatus(
      { generatedAt: '2026-02-29T00:00:00.000Z', overallStatus: 'healthy' },
      new Date('2026-03-01T00:00:01.000Z'),
    ),
    { label: '数据已过期', tone: 'stale' },
  )
})

test('an explicit stale status remains stale while the snapshot is fresh', () => {
  assert.deepEqual(
    snapshotDisplayStatus(
      { generatedAt: '2026-07-08T00:00:00.000Z', overallStatus: 'stale' },
      new Date('2026-07-09T00:00:00.000Z'),
    ),
    { label: '数据已过期', tone: 'stale' },
  )
})

test('unknown snapshot schema produces a reader-facing error state', () => {
  assert.deepEqual(snapshotLoadState({ schemaVersion: 2 }), {
    valid: false,
    message: '无法展示数据：未知快照版本 2',
  })
})

test('schema version one still rejects a snapshot without the dashboard shape', () => {
  assert.deepEqual(snapshotLoadState({ schemaVersion: 1 }), {
    valid: false,
    message: '无法展示数据：快照数据结构不完整',
  })
})

test('schema version one rejects malformed asset collections', () => {
  assert.deepEqual(snapshotLoadState({
    schemaVersion: 1,
    generatedAt: '2026-07-27T04:10:05.943Z',
    workspaceRootLabel: 'fixture',
    overallStatus: 'healthy',
    assets: [],
  }), {
    valid: false,
    message: '无法展示数据：快照数据结构不完整',
  })
})

test('browser snapshot guard accepts the shared independent valid fixture', () => {
  assert.deepEqual(snapshotLoadState(structuredClone(validSnapshotFixture)), {
    valid: true,
    snapshot: validSnapshotFixture,
  })
})

for (const contractCase of snapshotContractViolationFixtures()) {
  test(`browser snapshot guard rejects ${contractCase.name}`, () => {
    assert.deepEqual(snapshotLoadState(structuredClone(contractCase.snapshot)), {
      valid: false,
      message: '无法展示数据：快照数据结构不完整',
    })
  })
}
