import {
  assertRecruitmentManifest,
  COUNT_FIELD_MAP,
  discoverManifestFiles,
  readValidatedManifestSet,
} from '../lib/recruitment-manifests.mjs'

export { discoverManifestFiles }

const TARGET_YEARS = { firstYear: 2014, lastYear: 2025 }

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

export function sumRecruitmentManifests(manifests) {
  const pipeline = Object.fromEntries(Object.values(COUNT_FIELD_MAP).map((field) => [field, 0]))
  const completedYears = new Set()

  for (const manifest of manifests) {
    assertRecruitmentManifest(manifest)
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

export async function collectRecruitment({ workspaceRoot, resolvedSource, fileSystem }) {
  const { manifests, modifiedAt } = await readValidatedManifestSet(
    resolvedSource.absolutePath,
    { ...(fileSystem ? { fileSystem } : {}) },
  )
  const pipeline = sumRecruitmentManifests(manifests)
  const warning = formatRecruitmentWarning(pipeline.completedYears)

  return {
    asset: buildRecruitmentAsset(pipeline),
    pipeline,
    sources: [{
      id: resolvedSource.id,
      assetId: resolvedSource.assetId,
      relativePath: resolvedSource.relativePath,
      selectedCandidate: true,
      modifiedAt,
      grain: resolvedSource.grain,
      status: 'in_progress',
      notes: warning ? [warning] : [],
    }],
    warnings: warning ? [warning] : [],
  }
}
