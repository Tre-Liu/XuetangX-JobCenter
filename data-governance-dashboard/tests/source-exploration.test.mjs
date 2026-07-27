import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterSources,
  snapshotLoadState,
  sourcesForAsset,
  statusLabel,
} from '../src/dashboard-model.ts'
import { validSnapshotFixture } from './helpers/snapshot-fixture.mjs'

const sources = [
  { id: 'undergraduateMajorCatalog', assetId: 'undergraduateMajors', status: 'validated' },
  { id: 'undergraduateMajorMatches', assetId: 'undergraduateMajors', status: 'partial' },
  { id: 'vocationalMajorCatalog', assetId: 'vocationalMajors', status: 'validated' },
  { id: 'positionMatches', assetId: 'positions', status: 'review' },
]

const validSource = {
  id: 'undergraduateMajorCatalog',
  assetId: 'undergraduateMajors',
  relativePath: '官方数据/专业目录.xlsx',
  selectedCandidate: true,
  modifiedAt: '2026-07-14T00:00:00.000Z',
  grain: '专业编码',
  status: 'validated',
  notes: ['按专业编码去重'],
}

test('source filters compose asset and quality status', () => {
  assert.deepEqual(
    filterSources(sources, {
      assetId: 'undergraduateMajors',
      status: 'partial',
    }).map(({ id }) => id),
    ['undergraduateMajorMatches'],
  )
  assert.deepEqual(sourcesForAsset(sources, 'undergraduateMajors').map(({ id }) => id), [
    'undergraduateMajorCatalog',
    'undergraduateMajorMatches',
  ])
})

test('source statuses use stable reader-facing labels', () => {
  assert.deepEqual(
    ['validated', 'partial', 'review', 'in_progress', 'missing', 'unexpected'].map(statusLabel),
    ['已校验', '部分覆盖', '建议复核', '跑批进行中', '缺少数据源', '未知状态'],
  )
})

test('snapshot validation accepts complete safe-rendering sources and warnings', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  const sourceIndex = snapshot.sources.findIndex(({ id }) => id === validSource.id)
  snapshot.sources[sourceIndex] = validSource
  snapshot.warnings = ['招聘匹配仍在处理中']

  assert.equal(snapshotLoadState(snapshot).valid, true)
})

test('snapshot validation rejects malformed source fields', () => {
  const malformedValues = [
    ['id', 7],
    ['assetId', 'unknown'],
    ['relativePath', null],
    ['selectedCandidate', 'yes'],
    ['modifiedAt', '14 July 2026'],
    ['grain', 12],
    ['status', 'ready'],
    ['notes', ['可用', 3]],
  ]

  for (const [field, value] of malformedValues) {
    const snapshot = structuredClone(validSnapshotFixture)
    const sourceIndex = snapshot.sources.findIndex(({ id }) => id === validSource.id)
    snapshot.sources[sourceIndex] = { ...validSource, [field]: value }

    assert.deepEqual(
      snapshotLoadState(snapshot),
      { valid: false, message: '无法展示数据：快照数据结构不完整' },
      `expected malformed source field ${field} to be rejected`,
    )
  }
})

test('snapshot validation rejects warnings that are absent or not strings', () => {
  for (const warnings of [undefined, '单条警告', ['可展示', 7]]) {
    const snapshot = structuredClone(validSnapshotFixture)
    if (warnings === undefined) {
      delete snapshot.warnings
    } else {
      snapshot.warnings = warnings
    }

    assert.deepEqual(snapshotLoadState(snapshot), {
      valid: false,
      message: '无法展示数据：快照数据结构不完整',
    })
  }
})

test('snapshot validation rejects duplicate source IDs', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.sources.push({
    ...validSource,
    relativePath: '治理结果/重复来源.xlsx',
  })

  assert.deepEqual(snapshotLoadState(snapshot), {
    valid: false,
    message: '无法展示数据：快照数据结构不完整',
  })
})

test('snapshot validation rejects duplicate source IDs within an asset metric', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.assets[0].sourceIds = ['chainCatalog', 'chainCatalog']

  assert.deepEqual(snapshotLoadState(snapshot), {
    valid: false,
    message: '无法展示数据：快照数据结构不完整',
  })
})

test('snapshot validation rejects dangling source IDs', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.assets[0].sourceIds = ['source-not-in-snapshot']

  assert.deepEqual(snapshotLoadState(snapshot), {
    valid: false,
    message: '无法展示数据：快照数据结构不完整',
  })
})
