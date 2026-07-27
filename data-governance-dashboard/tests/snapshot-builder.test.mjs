import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertCurrentBaseline,
  buildDashboardSnapshot,
  formatSummary,
  validateSnapshot,
} from '../scripts/build-snapshot.mjs'
import { writeJsonAtomically } from '../scripts/lib/atomic-write.mjs'
import {
  currentBaselineFixture,
  validSnapshotFixture,
} from './helpers/snapshot-fixture.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projectParent = resolve(projectRoot, '..')
const logicalWorkspaceRoot = basename(dirname(projectParent)) === '.worktrees'
  ? resolve(projectParent, '../..')
  : projectParent

function asset(snapshot, id) {
  return snapshot.assets.find((item) => item.id === id)
}

test('snapshot accepts the independent valid fixture', () => {
  assert.doesNotThrow(() => validateSnapshot(structuredClone(validSnapshotFixture)))
})

test('snapshot requires exactly the six expected asset IDs', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.assets[5].id = 'unknown'
  assert.throws(
    () => validateSnapshot(snapshot),
    /资产类型必须恰好为 chains, stages, majors, industries, positions, recruitment.*received.*unknown/,
  )
})

test('snapshot rejects position totals that do not reconcile', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  const position = asset(snapshot, 'positions')
  position.primaryValue = 3
  position.totalValue = 5
  position.supportingMetrics = [
    { label: '未匹配岗位', value: 1 },
    { label: '岗位—节点关系', value: 3 },
    { label: '建议复核关系', value: 1 },
  ]
  assert.throws(
    () => validateSnapshot(snapshot),
    /岗位.*已匹配岗位 3.*未匹配岗位 1.*岗位总数 5/,
  )
})

test('snapshot rejects recruitment counts that do not reconcile', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.recruitmentPipeline.inputRows = 10
  snapshot.recruitmentPipeline.validUniqueRows = 8
  snapshot.recruitmentPipeline.duplicateRows = 1
  snapshot.recruitmentPipeline.invalidRows = 0
  assert.throws(
    () => validateSnapshot(snapshot),
    /招聘.*有效唯一 8.*重复 1.*无效 0.*输入 10/,
  )
})

test('snapshot rejects chain and major numerators above their totals with values', () => {
  const chainSnapshot = structuredClone(validSnapshotFixture)
  Object.assign(asset(chainSnapshot, 'chains'), {
    primaryValue: 4,
    totalValue: 3,
    coverageRate: 1,
  })
  assert.throws(
    () => validateSnapshot(chainSnapshot),
    /产业链.*标准产业链 4.*源产业链 3/,
  )

  const majorSnapshot = structuredClone(validSnapshotFixture)
  Object.assign(asset(majorSnapshot, 'majors'), {
    primaryValue: 3,
    totalValue: 2,
    coverageRate: 1,
  })
  assert.throws(
    () => validateSnapshot(majorSnapshot),
    /专业.*确定关联专业 3.*专业总数 2/,
  )
})

test('snapshot rejects non-finite operands in chain and major invariants', () => {
  const chainSnapshot = structuredClone(validSnapshotFixture)
  asset(chainSnapshot, 'chains').primaryValue = Number.NaN
  assert.throws(
    () => validateSnapshot(chainSnapshot),
    /产业链.*标准产业链 NaN.*源产业链 3/,
  )

  const majorSnapshot = structuredClone(validSnapshotFixture)
  asset(majorSnapshot, 'majors').totalValue = Number.NaN
  assert.throws(
    () => validateSnapshot(majorSnapshot),
    /专业.*确定关联专业 1.*专业总数 NaN/,
  )
})

test('snapshot rejects recruitment result categories above valid unique rows', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  Object.assign(snapshot.recruitmentPipeline, {
    formallyMatchedJobs: 3,
    mediumReviewJobs: 3,
    unmatchedRows: 3,
  })
  assert.throws(
    () => validateSnapshot(snapshot),
    /招聘.*正式匹配 3.*待复核 3.*未匹配 3.*有效唯一 8/,
  )
})

test('snapshot rejects non-finite operands in recruitment result categories', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.recruitmentPipeline.mediumReviewJobs = Number.NaN
  assert.throws(
    () => validateSnapshot(snapshot),
    /招聘.*正式匹配 2.*待复核 NaN.*未匹配 3.*有效唯一 8/,
  )
})

test('snapshot rejects non-finite and out-of-range coverage rates', () => {
  for (const coverageRate of [Number.NaN, Number.POSITIVE_INFINITY, -0.01, 1.01]) {
    const snapshot = structuredClone(validSnapshotFixture)
    asset(snapshot, 'chains').coverageRate = coverageRate
    assert.throws(
      () => validateSnapshot(snapshot),
      /产业链 chains 覆盖率.*必须是 0 到 1 之间的有限数值/,
    )
  }
})

test('snapshot requires completed recruitment years to be ascending and unique', () => {
  for (const completedYears of [[2016, 2014], [2014, 2014]]) {
    const snapshot = structuredClone(validSnapshotFixture)
    snapshot.recruitmentPipeline.completedYears = completedYears
    assert.throws(
      () => validateSnapshot(snapshot),
      /招聘完成年份.*必须升序且唯一/,
    )
  }
})

test('current baseline reports the exact mismatched path and values', () => {
  assert.throws(
    () => assertCurrentBaseline(validSnapshotFixture),
    /基线不一致 chains\.primaryValue: expected 19, received 2/,
  )
  assert.doesNotThrow(() => assertCurrentBaseline(currentBaselineFixture()))
})

test('summary exposes the approved human-readable baseline', () => {
  assert.equal(
    formatSummary(currentBaselineFixture()),
    [
      '快照生成成功',
      '产业链 19/129',
      '专业 682/2142',
      '岗位 645/1356',
      '招聘有效唯一 239149',
      '当前批次 2014—2016',
    ].join('\n'),
  )
})

test('builder assembles the six assets in canonical order without absolute paths', async () => {
  const snapshot = await buildDashboardSnapshot({
    workspaceRoot: logicalWorkspaceRoot,
    now: new Date('2026-07-27T01:02:03.000Z'),
  })

  assert.deepEqual(
    snapshot.assets.map(({ id }) => id),
    ['chains', 'stages', 'majors', 'industries', 'positions', 'recruitment'],
  )
  assert.equal(snapshot.generatedAt, '2026-07-27T01:02:03.000Z')
  assert.equal(snapshot.workspaceRootLabel, basename(logicalWorkspaceRoot))
  assert.equal(snapshot.overallStatus, 'partial')
  assert.ok(snapshot.sources.every(({ relativePath }) => !relativePath.startsWith('/')))
  assert.doesNotMatch(JSON.stringify(snapshot), new RegExp(logicalWorkspaceRoot))
})

test('atomic writer replaces complete JSON without leaving temp files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-atomic-'))
  const path = join(dir, 'snapshot.json')
  await writeFile(path, '{"old":true}\n')

  await writeJsonAtomically(path, { schemaVersion: 1, value: 42 })

  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), { schemaVersion: 1, value: 42 })
  assert.deepEqual(await readdir(dir), ['snapshot.json'])
})

test('atomic writer preserves the previous output when serialization fails', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-atomic-failure-'))
  const path = join(dir, 'snapshot.json')
  const previous = '{"previous":true}\n'
  await writeFile(path, previous)

  await assert.rejects(() => writeJsonAtomically(path, { unsupported: 1n }), /BigInt/)

  assert.equal(await readFile(path, 'utf8'), previous)
  assert.deepEqual(await readdir(dir), ['snapshot.json'])
})

test('atomic writer removes its temp file when replacement fails after writing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-atomic-rename-failure-'))
  const path = join(dir, 'snapshot.json')
  await writeFile(join(dir, 'keep.txt'), 'keep')
  await mkdir(path)

  await assert.rejects(() => writeJsonAtomically(path, { complete: true }))

  assert.deepEqual((await readdir(dir)).sort(), ['keep.txt', 'snapshot.json'])
  assert.deepEqual(await readdir(path), [])
})
