import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const COUNT_FIELD_MAP = {
  source_rows: 'inputRows',
  valid_unique_rows: 'validUniqueRows',
  duplicate_rows: 'duplicateRows',
  invalid_rows: 'invalidRows',
  formally_matched_jobs: 'formallyMatchedJobs',
  medium_review_jobs: 'mediumReviewJobs',
  unmatched_rows: 'unmatchedRows',
  formal_relation_count: 'formalRelationCount',
}

const TARGET_YEARS = { firstYear: 2014, lastYear: 2025 }

function assertNonnegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`招聘清单 counts.${field} 必须是非负整数`)
  }
}

function assertManifest(manifest) {
  if (!Number.isInteger(manifest?.year) || manifest.year < 1000 || manifest.year > 9999) {
    throw new Error('招聘清单 year 必须是四位整数年份')
  }
  for (const field of Object.keys(COUNT_FIELD_MAP)) {
    assertNonnegativeInteger(manifest?.counts?.[field], field)
  }

  const counts = manifest.counts
  if (counts.valid_unique_rows + counts.duplicate_rows + counts.invalid_rows !== counts.source_rows) {
    throw new Error('招聘有效唯一 + 重复 + 无效必须等于输入记录')
  }
  if (counts.formally_matched_jobs + counts.medium_review_jobs + counts.unmatched_rows > counts.valid_unique_rows) {
    throw new Error('招聘结果分类不得大于有效唯一记录')
  }
}

function formatYearList(years) {
  const sorted = [...new Set(years)].sort((left, right) => left - right)
  if (!sorted.length) return ''

  const ranges = []
  let start = sorted[0]
  let end = start
  for (const year of sorted.slice(1)) {
    if (year === end + 1) {
      end = year
    } else {
      ranges.push(start === end ? String(start) : `${start}—${end}`)
      start = year
      end = year
    }
  }
  ranges.push(start === end ? String(start) : `${start}—${end}`)
  return ranges.join(', ')
}

export async function discoverManifestFiles(directory) {
  const yearDirectories = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^year=\d{4}$/.test(entry.name))
    .sort((left, right) => Number(left.name.slice(5)) - Number(right.name.slice(5)))

  const files = await Promise.all(yearDirectories.map(async (yearDirectory) => {
    const yearPath = join(directory, yearDirectory.name)
    const parts = await readdir(yearPath, { withFileTypes: true })
    return parts
      .filter((entry) => entry.isFile() && /^part-.*\.json$/.test(entry.name) && !entry.name.endsWith('-summary.json'))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => join(yearPath, entry.name))
  }))
  return files.flat()
}

export function sumRecruitmentManifests(manifests) {
  const pipeline = Object.fromEntries(Object.values(COUNT_FIELD_MAP).map((field) => [field, 0]))
  const completedYears = new Set()

  for (const manifest of manifests) {
    assertManifest(manifest)
    completedYears.add(manifest.year)
    for (const [manifestField, pipelineField] of Object.entries(COUNT_FIELD_MAP)) {
      pipeline[pipelineField] += manifest.counts[manifestField]
    }
  }

  return {
    ...pipeline,
    completedYears: [...completedYears].sort((left, right) => left - right),
  }
}

export function formatRecruitmentWarning(completedYears, { firstYear, lastYear } = TARGET_YEARS) {
  const actualYears = [...new Set(completedYears)].sort((left, right) => left - right)
  const completed = new Set(actualYears)
  const missingYears = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  ).filter((year) => !completed.has(year))
  if (!missingYears.length) return undefined

  const foundLabel = formatYearList(actualYears)
  const missingLabel = formatYearList(missingYears)
  if (!foundLabel) return `招聘匹配当前未发现完成清单，${missingLabel} 未计入当前成果。`
  return `招聘匹配当前仅发现 ${foundLabel} 完成清单，${missingLabel} 未计入当前成果。`
}

function buildRecruitmentAsset(pipeline) {
  const batch = formatYearList(pipeline.completedYears) || '未发现完成清单'
  return {
    id: 'recruitment',
    label: '招聘信息',
    primaryValue: pipeline.validUniqueRows,
    totalValue: pipeline.inputRows,
    ...(pipeline.inputRows ? { coverageRate: pipeline.validUniqueRows / pipeline.inputRows } : {}),
    status: 'in_progress',
    definition: '有效唯一招聘记录数 ÷ 当前已处理输入记录数',
    grain: '招聘记录',
    sourceIds: ['recruitmentManifests'],
    supportingMetrics: [
      { label: '正式匹配招聘', value: pipeline.formallyMatchedJobs },
      { label: '中置信待复核', value: pipeline.mediumReviewJobs },
      { label: '未匹配', value: pipeline.unmatchedRows },
      { label: '当前批次', value: batch },
    ],
  }
}

export async function collectRecruitment({ workspaceRoot, resolvedSource }) {
  const manifestFiles = await discoverManifestFiles(resolvedSource.absolutePath)
  const manifests = await Promise.all(manifestFiles.map(async (path) =>
    JSON.parse(await readFile(path, 'utf8')),
  ))
  const pipeline = sumRecruitmentManifests(manifests)
  const warning = formatRecruitmentWarning(pipeline.completedYears)
  const sourceDirectory = await stat(resolvedSource.absolutePath)

  return {
    asset: buildRecruitmentAsset(pipeline),
    pipeline,
    sources: [{
      id: resolvedSource.id,
      assetId: resolvedSource.assetId,
      relativePath: resolvedSource.relativePath,
      selectedCandidate: true,
      modifiedAt: sourceDirectory.mtime.toISOString(),
      grain: resolvedSource.grain,
      status: 'in_progress',
      notes: warning ? [warning] : [],
    }],
    warnings: warning ? [warning] : [],
  }
}
