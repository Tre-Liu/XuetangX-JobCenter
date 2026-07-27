import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  collectRecruitment,
  discoverManifestFiles,
  formatRecruitmentWarning,
  sumRecruitmentManifests,
} from '../scripts/collectors/recruitment.mjs'

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

async function writeManifest(root, year, part, manifest) {
  const directory = join(root, `year=${year}`)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, `part-${part}.json`), JSON.stringify(manifest), 'utf8')
}

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

test('manifest summation maps every count field and uses sorted unique completed years', () => {
  const pipeline = sumRecruitmentManifests([
    { year: 2016, counts: counts() },
    { year: 2014, counts: counts({
      source_rows: 2,
      valid_unique_rows: 2,
      duplicate_rows: 0,
      invalid_rows: 0,
      formally_matched_jobs: 0,
      medium_review_jobs: 1,
      unmatched_rows: 1,
      formal_relation_count: 0,
    }) },
    { year: 2016, counts: counts({
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
      () => sumRecruitmentManifests([{ year: 2016, counts: counts({ [field]: -1 }) }]),
      new RegExp(`${field}.*非负整数`),
    )
    assert.throws(
      () => sumRecruitmentManifests([{ year: 2016, counts: counts({ [field]: 1.5 }) }]),
      new RegExp(`${field}.*非负整数`),
    )
  }
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, counts: { source_rows: 10 } }]),
    /valid_unique_rows.*非负整数/,
  )
})

test('manifest summation rejects count totals that do not reconcile', () => {
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, counts: counts({ invalid_rows: 0 }) }]),
    /有效唯一.*重复.*无效.*输入/,
  )
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, counts: counts({ unmatched_rows: 4 }) }]),
    /招聘结果分类.*有效唯一/,
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
  await writeManifest(root, 2014, '00000', { year: 2014, completed: true, counts: counts({
    source_rows: 2,
    valid_unique_rows: 2,
    duplicate_rows: 0,
    invalid_rows: 0,
    formally_matched_jobs: 0,
    medium_review_jobs: 1,
    unmatched_rows: 1,
    formal_relation_count: 0,
  }) })
  await writeManifest(root, 2015, '00000', { year: 2015, completed: true, counts: counts({
    source_rows: 3,
    valid_unique_rows: 3,
    duplicate_rows: 0,
    invalid_rows: 0,
    formally_matched_jobs: 1,
    medium_review_jobs: 1,
    unmatched_rows: 1,
    formal_relation_count: 1,
  }) })
  await writeManifest(root, 2016, '00000', { year: 2016, completed: true, counts: counts() })

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
    modifiedAt: (await stat(root)).mtime.toISOString(),
    grain: '招聘记录',
    status: 'in_progress',
    notes: result.warnings,
  }])

  const empty = await collectRecruitment({
    workspaceRoot: root,
    resolvedSource: {
      id: 'recruitmentManifests',
      assetId: 'recruitment',
      absolutePath: await mkdtemp(join(tmpdir(), 'empty-recruitment-')),
      relativePath: 'fixture/empty-manifests',
      grain: '招聘记录',
    },
  })
  assert.equal(empty.asset.coverageRate, undefined)
  assert.equal(empty.asset.totalValue, 0)
  assert.equal(empty.asset.supportingMetrics.at(-1).value, '未发现完成清单')
})
