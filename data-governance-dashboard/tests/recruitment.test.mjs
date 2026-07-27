import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  stat,
  utimes,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  collectRecruitment,
  discoverManifestFiles,
  formatRecruitmentWarning,
  sumRecruitmentManifests,
} from '../scripts/collectors/recruitment.mjs'
import { resolveAllSources, resolveSource } from '../scripts/lib/readers.mjs'
import { SOURCE_REGISTRY } from '../scripts/source-registry.mjs'

const countFields = [
  'source_rows',
  'valid_unique_rows',
  'duplicate_rows',
  'invalid_rows',
  'formally_matched_jobs',
  'medium_review_jobs',
  'unmatched_rows',
  'formal_relation_count',
]

function counts(overrides = {}) {
  return {
    source_rows: 10,
    valid_unique_rows: 8,
    duplicate_rows: 1,
    invalid_rows: 1,
    formally_matched_jobs: 2,
    medium_review_jobs: 3,
    unmatched_rows: 3,
    formal_relation_count: 2,
    ...overrides,
  }
}

function workspaceRootForRealManifests() {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const checkoutRoot = dirname(projectRoot)
  return basename(dirname(checkoutRoot)) === '.worktrees'
    ? dirname(dirname(checkoutRoot))
    : checkoutRoot
}

async function writeManifest(root, year, part, manifest) {
  const directory = join(root, `year=${year}`)
  await mkdir(directory, { recursive: true })
  const path = join(directory, `part-${part}.json`)
  await writeFile(path, JSON.stringify(manifest), 'utf8')
  return path
}

const recruitmentDefinition = (candidates) => ({
  id: 'recruitmentManifests',
  assetId: 'recruitment',
  kind: 'manifest-directory',
  candidates,
  required: true,
  grain: '招聘记录',
})

test('manifest discovery selects only sorted year part files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'recruitment-manifests-'))
  await writeManifest(root, 2016, '00010', {})
  await writeManifest(root, 2014, '00001', {})
  await writeManifest(root, 2016, '00002', {})
  await mkdir(join(root, 'year=2016-summary'), { recursive: true })
  await writeFile(join(root, 'year=2016-summary', 'part-00000.json'), '{}')
  await writeFile(join(root, 'year=2016', 'part-summary.json'), '{}')
  await writeFile(join(root, 'year=2016', 'summary.json'), '{}')

  assert.deepEqual(
    (await discoverManifestFiles(root)).map((path) => path.replace(root, '')),
    [
      '/year=2014/part-00001.json',
      '/year=2016/part-00002.json',
      '/year=2016/part-00010.json',
    ],
  )
})

test('source resolution skips an empty preferred manifest candidate for a valid fallback', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'recruitment-source-empty-'))
  await mkdir(join(workspace, 'preferred'), { recursive: true })
  await writeManifest(join(workspace, 'fallback'), 2014, '00000', {
    year: 2014,
    completed: true,
    counts: counts(),
  })

  const resolved = await resolveSource(
    workspace,
    recruitmentDefinition(['preferred', 'fallback']),
  )

  assert.equal(resolved.relativePath, 'fallback')
})

test('source resolution skips an invalid preferred manifest candidate for a valid fallback', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'recruitment-source-invalid-'))
  await writeManifest(join(workspace, 'preferred'), 2014, '00000', {
    year: 2014,
    completed: false,
    counts: counts(),
  })
  await writeManifest(join(workspace, 'fallback'), 2016, '00000', {
    year: 2016,
    completed: true,
    counts: counts(),
  })

  const resolved = await resolveSource(
    workspace,
    recruitmentDefinition(['preferred', 'fallback']),
  )

  assert.equal(resolved.relativePath, 'fallback')
})

test('source resolution rejects when every manifest candidate is empty or invalid', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'recruitment-source-none-'))
  await mkdir(join(workspace, 'preferred'), { recursive: true })
  await writeManifest(join(workspace, 'fallback'), 2014, '00000', {
    year: 2014,
    completed: true,
    counts: counts({ invalid_rows: 0 }),
  })

  await assert.rejects(
    () => resolveSource(
      workspace,
      recruitmentDefinition(['preferred', 'fallback']),
    ),
    /招聘清单候选均无效.*preferred.*fallback/,
  )
})

test('source resolution rejects a manifest whose year differs from its directory', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'recruitment-source-year-'))
  await writeManifest(join(workspace, 'preferred'), 2014, '00000', {
    year: 2015,
    completed: true,
    counts: counts(),
  })

  await assert.rejects(
    () => resolveSource(
      workspace,
      recruitmentDefinition(['preferred']),
    ),
    /year=2014.*清单 year 2015.*一致/,
  )
})

test('manifest summation maps every count field and uses sorted unique completed years', () => {
  const pipeline = sumRecruitmentManifests([
    { year: 2016, completed: true, counts: counts() },
    { year: 2014, completed: true, counts: counts({
      source_rows: 2,
      valid_unique_rows: 2,
      duplicate_rows: 0,
      invalid_rows: 0,
      formally_matched_jobs: 0,
      medium_review_jobs: 1,
      unmatched_rows: 1,
      formal_relation_count: 0,
    }) },
    { year: 2016, completed: true, counts: counts({
      source_rows: 3,
      valid_unique_rows: 3,
      duplicate_rows: 0,
      invalid_rows: 0,
      formally_matched_jobs: 1,
      medium_review_jobs: 1,
      unmatched_rows: 1,
      formal_relation_count: 1,
    }) },
  ])

  assert.deepEqual(pipeline, {
    inputRows: 15,
    validUniqueRows: 13,
    duplicateRows: 1,
    invalidRows: 1,
    formallyMatchedJobs: 3,
    mediumReviewJobs: 5,
    unmatchedRows: 5,
    formalRelationCount: 3,
    completedYears: [2014, 2016],
  })
})

test('manifest summation rejects a nonnegative-integer violation for every count field', () => {
  for (const field of countFields) {
    assert.throws(
      () => sumRecruitmentManifests([{ year: 2016, completed: true, counts: counts({ [field]: -1 }) }]),
      new RegExp(`${field}.*非负整数`),
    )
    assert.throws(
      () => sumRecruitmentManifests([{ year: 2016, completed: true, counts: counts({ [field]: 1.5 }) }]),
      new RegExp(`${field}.*非负整数`),
    )
  }
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, completed: true, counts: { source_rows: 10 } }]),
    /valid_unique_rows.*非负整数/,
  )
})

test('manifest summation rejects count totals that do not reconcile', () => {
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, completed: true, counts: counts({ invalid_rows: 0 }) }]),
    /有效唯一.*重复.*无效.*输入/,
  )
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, completed: true, counts: counts({ unmatched_rows: 4 }) }]),
    /招聘结果分类.*有效唯一/,
  )
})

test('manifest summation rejects missing and false completion flags', () => {
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, counts: counts() }]),
    /year=2016.*completed.*true/,
  )
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, completed: false, counts: counts() }]),
    /year=2016.*completed.*true/,
  )
})

test('recruitment warning is based on actual completed years and lists noncontiguous gaps', () => {
  assert.equal(
    formatRecruitmentWarning([2014, 2015, 2016]),
    '招聘匹配当前仅发现 2014—2016 完成清单，2017—2025 未计入当前成果。',
  )
  assert.equal(formatRecruitmentWarning([2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]), undefined)
  assert.equal(
    formatRecruitmentWarning([2014, 2016, 2018]),
    '招聘匹配当前仅发现 2014, 2016, 2018 完成清单，2015, 2017, 2019—2025 未计入当前成果。',
  )
})

test('collector reports an in-progress asset from discovered manifests without a zero-denominator rate', async () => {
  const root = await mkdtemp(join(tmpdir(), 'recruitment-collector-'))
  const firstManifest = await writeManifest(root, 2014, '00000', { year: 2014, completed: true, counts: counts({
    source_rows: 2,
    valid_unique_rows: 2,
    duplicate_rows: 0,
    invalid_rows: 0,
    formally_matched_jobs: 0,
    medium_review_jobs: 1,
    unmatched_rows: 1,
    formal_relation_count: 0,
  }) })
  const newestManifest = await writeManifest(root, 2015, '00000', { year: 2015, completed: true, counts: counts({
    source_rows: 3,
    valid_unique_rows: 3,
    duplicate_rows: 0,
    invalid_rows: 0,
    formally_matched_jobs: 1,
    medium_review_jobs: 1,
    unmatched_rows: 1,
    formal_relation_count: 1,
  }) })
  const lastManifest = await writeManifest(root, 2016, '00000', { year: 2016, completed: true, counts: counts() })
  await utimes(firstManifest, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-01T00:00:00.000Z'))
  await utimes(newestManifest, new Date('2026-03-01T00:00:00.000Z'), new Date('2026-03-01T00:00:00.000Z'))
  await utimes(lastManifest, new Date('2026-02-01T00:00:00.000Z'), new Date('2026-02-01T00:00:00.000Z'))

  const result = await collectRecruitment({
    workspaceRoot: root,
    resolvedSource: {
      id: 'recruitmentManifests',
      assetId: 'recruitment',
      absolutePath: root,
      relativePath: 'fixture/manifests',
      grain: '招聘记录',
    },
  })

  assert.deepEqual(result.pipeline.completedYears, [2014, 2015, 2016])
  assert.deepEqual(result.asset, {
    id: 'recruitment',
    label: '招聘信息',
    primaryValue: 13,
    totalValue: 15,
    coverageRate: 13 / 15,
    status: 'in_progress',
    definition: '有效唯一招聘记录数 ÷ 当前已处理输入记录数',
    grain: '招聘记录',
    sourceIds: ['recruitmentManifests'],
    supportingMetrics: [
      { label: '正式匹配招聘', value: 3 },
      { label: '中置信待复核', value: 5 },
      { label: '未匹配', value: 5 },
      { label: '当前批次', value: '2014—2016' },
    ],
  })
  assert.deepEqual(result.warnings, [
    '招聘匹配当前仅发现 2014—2016 完成清单，2017—2025 未计入当前成果。',
  ])
  assert.deepEqual(result.sources, [{
    id: 'recruitmentManifests',
    assetId: 'recruitment',
    relativePath: 'fixture/manifests',
    selectedCandidate: true,
    modifiedAt: '2026-03-01T00:00:00.000Z',
    grain: '招聘记录',
    status: 'in_progress',
    notes: result.warnings,
  }])

})

test('collector rejects when the consumed manifest source set changes during reading', async () => {
  const root = await mkdtemp(join(tmpdir(), 'recruitment-source-race-'))
  await writeManifest(root, 2014, '00000', {
    year: 2014,
    completed: true,
    counts: counts(),
  })
  let mutated = false
  const fileSystem = {
    readdir,
    stat,
    readFile: async (path, encoding) => {
      const value = await readFile(path, encoding)
      if (!mutated) {
        mutated = true
        await writeManifest(root, 2015, '00000', {
          year: 2015,
          completed: true,
          counts: counts(),
        })
      }
      return value
    },
  }

  await assert.rejects(
    () => collectRecruitment({
      workspaceRoot: root,
      resolvedSource: {
        id: 'recruitmentManifests',
        assetId: 'recruitment',
        absolutePath: root,
        relativePath: 'fixture/manifests',
        grain: '招聘记录',
      },
      fileSystem,
    }),
    /招聘清单源文件集合在读取期间发生变化/,
  )
})

test('read-only recruitment collector matches the approved 2014—2016 manifest baseline', async () => {
  const workspaceRoot = workspaceRootForRealManifests()
  const resolvedSources = await resolveAllSources(
    workspaceRoot,
    SOURCE_REGISTRY.filter((source) => source.id === 'recruitmentManifests'),
  )
  const result = await collectRecruitment({
    workspaceRoot,
    resolvedSource: resolvedSources.recruitmentManifests,
  })

  assert.deepEqual(result.pipeline, {
    inputRows: 240034,
    validUniqueRows: 239149,
    duplicateRows: 53,
    invalidRows: 832,
    formallyMatchedJobs: 19297,
    mediumReviewJobs: 55378,
    unmatchedRows: 164474,
    formalRelationCount: 19297,
    completedYears: [2014, 2015, 2016],
  })
  assert.deepEqual(result.warnings, [
    '招聘匹配当前仅发现 2014—2016 完成清单，2017—2025 未计入当前成果。',
  ])
  assert.equal(result.sources.length, 1)
  assert.equal(result.sources[0].id, 'recruitmentManifests')
})
