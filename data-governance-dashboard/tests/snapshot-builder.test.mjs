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
  snapshotContractViolationFixtures,
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

for (const contractCase of snapshotContractViolationFixtures()) {
  test(`snapshot contract rejects ${contractCase.name}`, () => {
    assert.throws(
      () => validateSnapshot(structuredClone(contractCase.snapshot)),
      contractCase.error,
    )
  })
}

test('snapshot requires exactly the seven expected asset IDs', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.assets[6].id = 'unknown'
  assert.throws(
    () => validateSnapshot(snapshot),
    /资产类型必须恰好为 chains, stages, undergraduateMajors, vocationalMajors, industries, positions, recruitment.*received.*unknown/,
  )
})

test('snapshot requires assets in canonical order', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.assets.reverse()
  assert.throws(
    () => validateSnapshot(snapshot),
    /资产类型必须恰好为 chains, stages, undergraduateMajors, vocationalMajors, industries, positions, recruitment.*按此顺序.*received/,
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
    { label: '高置信关系', value: 1 },
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
    details: {
      kind: 'name-list',
      label: '完整标准产业链名称',
      items: ['链A', '链B', '链C', '链D'],
    },
  })
  assert.throws(
    () => validateSnapshot(chainSnapshot),
    /产业链.*标准产业链 4.*源产业链 3/,
  )

  const majorSnapshot = structuredClone(validSnapshotFixture)
  Object.assign(asset(majorSnapshot, 'undergraduateMajors'), {
    primaryValue: 3,
    totalValue: 2,
    coverageRate: 1,
  })
  assert.throws(
    () => validateSnapshot(majorSnapshot),
    /高教（本科）.*确定关联专业 3.*专业总数 2/,
  )
})

test('snapshot rejects non-finite operands in chain and major invariants', () => {
  const chainSnapshot = structuredClone(validSnapshotFixture)
  asset(chainSnapshot, 'chains').primaryValue = Number.NaN
  assert.throws(
    () => validateSnapshot(chainSnapshot),
    /产业链.*标准产业链 NaN.*有限非负整数/,
  )

  const majorSnapshot = structuredClone(validSnapshotFixture)
  asset(majorSnapshot, 'vocationalMajors').totalValue = Number.NaN
  assert.throws(
    () => validateSnapshot(majorSnapshot),
    /职教.*专业总数 NaN.*有限非负整数/,
  )
})

test('snapshot rejects non-integer chain and major count operands before reconciliation', () => {
  const cases = [
    {
      id: 'chains',
      field: 'primaryValue',
      value: '2',
      error: /产业链.*标准产业链.*"2".*有限非负整数/,
    },
    {
      id: 'chains',
      field: 'totalValue',
      value: Number.POSITIVE_INFINITY,
      error: /产业链.*源产业链.*Infinity.*有限非负整数/,
    },
    {
      id: 'undergraduateMajors',
      field: 'primaryValue',
      value: 1.5,
      error: /高教（本科）.*确定关联专业.*1\.5.*有限非负整数/,
    },
    {
      id: 'vocationalMajors',
      field: 'totalValue',
      value: undefined,
      error: /职教.*专业总数.*undefined.*有限非负整数/,
    },
  ]

  for (const { id, field, value, error } of cases) {
    const snapshot = structuredClone(validSnapshotFixture)
    asset(snapshot, id)[field] = value
    assert.throws(() => validateSnapshot(snapshot), error)
  }
})

test('snapshot rejects invalid position count operands before reconciliation', () => {
  const cases = [
    {
      field: 'primaryValue',
      value: '3',
      error: /岗位.*已匹配岗位.*"3".*有限非负整数/,
    },
    {
      field: 'totalValue',
      value: -1,
      error: /岗位.*岗位总数.*-1.*有限非负整数/,
    },
    {
      metric: '未匹配岗位',
      value: Number.POSITIVE_INFINITY,
      error: /岗位.*未匹配岗位.*Infinity.*有限非负整数/,
    },
  ]

  for (const { field, metric, value, error } of cases) {
    const snapshot = structuredClone(validSnapshotFixture)
    const position = asset(snapshot, 'positions')
    if (field) position[field] = value
    else position.supportingMetrics.find(({ label }) => label === metric).value = value
    assert.throws(() => validateSnapshot(snapshot), error)
  }
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
    /招聘.*待复核 NaN.*有限非负整数/,
  )
})

test('snapshot rejects every invalid recruitment invariant operand before arithmetic', () => {
  const cases = [
    ['inputRows', '输入记录', '10'],
    ['validUniqueRows', '有效唯一', Number.POSITIVE_INFINITY],
    ['duplicateRows', '重复', 1.5],
    ['invalidRows', '无效', -1],
    ['formallyMatchedJobs', '正式匹配', undefined],
    ['mediumReviewJobs', '待复核', Number.NaN],
    ['unmatchedRows', '未匹配', '3'],
  ]

  for (const [field, label, value] of cases) {
    const snapshot = structuredClone(validSnapshotFixture)
    snapshot.recruitmentPipeline[field] = value
    assert.throws(
      () => validateSnapshot(snapshot),
      new RegExp(`招聘.*${label}.*${String(value).replace('.', '\\.')}.*有限非负整数`),
    )
  }
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

test('current baseline checks every approved supporting and recruitment figure', () => {
  const cases = [
    ['industries.totalValue', (snapshot) => { asset(snapshot, 'industries').totalValue = 1955 }],
    ['undergraduateMajors.supportingMetrics.待人工研判', (snapshot) => { asset(snapshot, 'undergraduateMajors').supportingMetrics[0].value = 160 }],
    ['undergraduateMajors.supportingMetrics.未匹配', (snapshot) => { asset(snapshot, 'undergraduateMajors').supportingMetrics[1].value = 488 }],
    ['undergraduateMajors.supportingMetrics.多产业链专业', (snapshot) => { asset(snapshot, 'undergraduateMajors').supportingMetrics[2].value = 20 }],
    ['undergraduateMajors.supportingMetrics.产业链关系', (snapshot) => { asset(snapshot, 'undergraduateMajors').supportingMetrics[3].value = 215 }],
    ['vocationalMajors.supportingMetrics.待人工研判', (snapshot) => { asset(snapshot, 'vocationalMajors').supportingMetrics[0].value = 281 }],
    ['vocationalMajors.supportingMetrics.未匹配', (snapshot) => { asset(snapshot, 'vocationalMajors').supportingMetrics[1].value = 527 }],
    ['vocationalMajors.supportingMetrics.多产业链专业', (snapshot) => { asset(snapshot, 'vocationalMajors').supportingMetrics[2].value = 67 }],
    ['vocationalMajors.supportingMetrics.产业链关系', (snapshot) => { asset(snapshot, 'vocationalMajors').supportingMetrics[3].value = 574 }],
    ['positions.supportingMetrics.未匹配岗位', (snapshot) => { asset(snapshot, 'positions').supportingMetrics[0].value = 710 }],
    ['positions.supportingMetrics.岗位—节点关系', (snapshot) => { asset(snapshot, 'positions').supportingMetrics[1].value = 705 }],
    ['positions.supportingMetrics.高置信关系', (snapshot) => { asset(snapshot, 'positions').supportingMetrics[2].value = 156 }],
    ['positions.supportingMetrics.建议复核关系', (snapshot) => { asset(snapshot, 'positions').supportingMetrics[3].value = 174 }],
    ['recruitmentPipeline.duplicateRows', (snapshot) => { snapshot.recruitmentPipeline.duplicateRows = 52 }],
    ['recruitmentPipeline.invalidRows', (snapshot) => { snapshot.recruitmentPipeline.invalidRows = 831 }],
    ['recruitmentPipeline.mediumReviewJobs', (snapshot) => { snapshot.recruitmentPipeline.mediumReviewJobs = 55377 }],
    ['recruitmentPipeline.unmatchedRows', (snapshot) => { snapshot.recruitmentPipeline.unmatchedRows = 164473 }],
    ['recruitmentPipeline.formalRelationCount', (snapshot) => { snapshot.recruitmentPipeline.formalRelationCount = 19296 }],
  ]

  for (const [path, mutate] of cases) {
    const snapshot = currentBaselineFixture()
    mutate(snapshot)
    assert.throws(
      () => assertCurrentBaseline(snapshot),
      new RegExp(`基线不一致 ${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`),
    )
  }
})

test('summary exposes the approved human-readable baseline', () => {
  assert.equal(
    formatSummary(currentBaselineFixture()),
    [
      '快照生成成功',
      '产业链 19/129',
      '高教（本科） 190/840',
      '职教 492/1302',
      '岗位 645/1356',
      '招聘有效唯一 239149',
      '当前批次 2014—2016',
    ].join('\n'),
  )
})

test('builder assembles the seven assets in canonical order without absolute paths', async () => {
  const snapshot = await buildDashboardSnapshot({
    workspaceRoot: logicalWorkspaceRoot,
    now: new Date('2026-07-27T01:02:03.000Z'),
  })

  assert.deepEqual(
    snapshot.assets.map(({ id }) => id),
    [
      'chains',
      'stages',
      'undergraduateMajors',
      'vocationalMajors',
      'industries',
      'positions',
      'recruitment',
    ],
  )
  assert.equal(asset(snapshot, 'chains').details.items.length, 19)
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
