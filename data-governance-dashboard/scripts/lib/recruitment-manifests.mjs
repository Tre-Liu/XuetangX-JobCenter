import * as nodeFileSystem from 'node:fs/promises'
import { basename, dirname, join, relative, sep } from 'node:path'

export const COUNT_FIELD_MAP = Object.freeze({
  source_rows: 'inputRows',
  valid_unique_rows: 'validUniqueRows',
  duplicate_rows: 'duplicateRows',
  invalid_rows: 'invalidRows',
  formally_matched_jobs: 'formallyMatchedJobs',
  medium_review_jobs: 'mediumReviewJobs',
  unmatched_rows: 'unmatchedRows',
  formal_relation_count: 'formalRelationCount',
})

function assertNonnegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`招聘清单 counts.${field} 必须是非负整数`)
  }
}

export function assertRecruitmentManifest(manifest, expectedYear) {
  if (!Number.isInteger(manifest?.year) || manifest.year < 1000 || manifest.year > 9999) {
    throw new Error('招聘清单 year 必须是四位整数年份')
  }
  if (expectedYear !== undefined && manifest.year !== expectedYear) {
    throw new Error(
      `招聘清单 year=${expectedYear} 下清单 year ${manifest.year} 必须与目录年份一致`,
    )
  }
  if (manifest.completed !== true) {
    throw new Error(`招聘清单 year=${manifest.year} 的 completed 必须为 true`)
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
  if (counts.formal_relation_count < counts.formally_matched_jobs) {
    throw new Error(
      `招聘关系数量不一致: 正式关系 ${counts.formal_relation_count} `
      + `不得少于正式匹配 ${counts.formally_matched_jobs}`,
    )
  }
}

export async function discoverManifestFiles(
  directory,
  fileSystem = nodeFileSystem,
) {
  const yearDirectories = (await fileSystem.readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^year=\d{4}$/.test(entry.name))
    .sort((left, right) => Number(left.name.slice(5)) - Number(right.name.slice(5)))

  const files = await Promise.all(yearDirectories.map(async (yearDirectory) => {
    const yearPath = join(directory, yearDirectory.name)
    const parts = await fileSystem.readdir(yearPath, { withFileTypes: true })
    return parts
      .filter((entry) => entry.isFile() && /^part-.*\.json$/.test(entry.name) && !entry.name.endsWith('-summary.json'))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => join(yearPath, entry.name))
  }))
  return files.flat()
}

function portableRelativePath(directory, filePath) {
  return relative(directory, filePath).split(sep).join('/')
}

async function describeManifestSet(directory, fileSystem) {
  const files = await discoverManifestFiles(directory, fileSystem)
  const entries = await Promise.all(files.map(async (filePath) => {
    const file = await fileSystem.stat(filePath)
    return {
      absolutePath: filePath,
      relativePath: portableRelativePath(directory, filePath),
      size: file.size,
      mtimeMs: file.mtimeMs,
      modifiedAt: file.mtime,
    }
  }))

  return {
    entries,
    fingerprint: JSON.stringify(
      entries.map(({ relativePath, size, mtimeMs }) => [relativePath, size, mtimeMs]),
    ),
  }
}

export async function readValidatedManifestSet(
  directory,
  { fileSystem = nodeFileSystem } = {},
) {
  const before = await describeManifestSet(directory, fileSystem)
  if (before.entries.length === 0) {
    throw new Error('招聘清单目录必须至少包含一个 year=YYYY/part-*.json')
  }

  const manifests = await Promise.all(before.entries.map(async (entry) => {
    let manifest
    try {
      manifest = JSON.parse(await fileSystem.readFile(entry.absolutePath, 'utf8'))
    } catch (error) {
      throw new Error(`招聘清单 ${entry.relativePath} 无法解析: ${error.message}`)
    }
    const yearDirectory = basename(dirname(entry.absolutePath))
    assertRecruitmentManifest(manifest, Number(yearDirectory.slice(5)))
    return manifest
  }))

  const after = await describeManifestSet(directory, fileSystem)
  if (before.fingerprint !== after.fingerprint) {
    throw new Error('招聘清单源文件集合在读取期间发生变化')
  }

  const modifiedAt = before.entries.reduce(
    (latest, entry) => entry.modifiedAt > latest ? entry.modifiedAt : latest,
    new Date(0),
  )
  return {
    manifests,
    modifiedAt: modifiedAt.toISOString(),
    fingerprint: before.fingerprint,
  }
}
