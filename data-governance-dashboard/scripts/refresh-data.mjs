import { lstat, readFile, realpath } from 'node:fs/promises'
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  assertCurrentBaseline,
  buildDashboardSnapshot,
  formatSummary,
  validateSnapshot,
} from './build-snapshot.mjs'
import { writeJsonAtomically } from './lib/atomic-write.mjs'
import { SOURCE_REGISTRY } from './source-registry.mjs'

const DEFAULT_OUTPUT = fileURLToPath(
  new URL('../src/data/dashboard-snapshot.json', import.meta.url),
)

function defaultWorkspaceRoot() {
  const projectParent = resolve(fileURLToPath(new URL('../..', import.meta.url)))
  return basename(dirname(projectParent)) === '.worktrees'
    ? resolve(projectParent, '../..')
    : projectParent
}

function requirePath(args, index, option) {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${option} 缺少路径`)
  return value
}

export function parseArgs(args) {
  const options = {
    workspaceRoot: defaultWorkspaceRoot(),
    output: undefined,
    check: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--check') {
      options.check = true
    } else if (arg === '--workspace-root') {
      options.workspaceRoot = resolve(requirePath(args, index, arg))
      index += 1
    } else if (arg === '--output') {
      options.output = resolve(requirePath(args, index, arg))
      index += 1
    } else {
      throw new Error(`未知参数: ${arg}`)
    }
  }

  return options
}

function isEqualToOrInside(parentPath, candidatePath) {
  const pathFromParent = relative(parentPath, candidatePath)
  return pathFromParent === ''
    || (!pathFromParent.startsWith('..') && !isAbsolute(pathFromParent))
}

async function resolvePhysicalTargetPath(targetPath, context) {
  const missingSegments = []
  let currentPath = resolve(targetPath)

  while (true) {
    try {
      await lstat(currentPath)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`${context} ${currentPath} 无法检查: ${error.message}`)
      }
      const parentPath = dirname(currentPath)
      if (parentPath === currentPath) {
        throw new Error(`${context} ${targetPath} 缺少可解析的现有父目录`)
      }
      missingSegments.unshift(basename(currentPath))
      currentPath = parentPath
      continue
    }

    let physicalAncestor
    try {
      physicalAncestor = await realpath(currentPath)
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`${context}中的符号链接 ${currentPath} 无法解析`)
      }
      throw new Error(`${context} ${currentPath} 的物理位置无法解析: ${error.message}`)
    }
    return resolve(physicalAncestor, ...missingSegments)
  }
}

export async function assertSafeOutputDestination({ workspaceRoot, output }) {
  const outputPath = resolve(output)
  const defaultOutputPath = resolve(DEFAULT_OUTPUT)
  const registeredCandidates = SOURCE_REGISTRY.flatMap((source) =>
    source.candidates.map((candidate) => resolve(workspaceRoot, candidate)))
  const physicalOutputPath = await resolvePhysicalTargetPath(outputPath, '输出路径')
  const physicalRegisteredCandidates = await Promise.all(
    registeredCandidates.map((candidate) =>
      resolvePhysicalTargetPath(candidate, '已登记数据源路径')),
  )
  const protectedCandidates = [...registeredCandidates, ...physicalRegisteredCandidates]
  const outputAliases = [outputPath, physicalOutputPath]
  if (protectedCandidates.some((candidate) =>
    outputAliases.some((outputAlias) => isEqualToOrInside(candidate, outputAlias)))) {
    throw new Error('--output 不得等于或位于已登记数据源内')
  }
  if (extname(outputPath).toLowerCase() !== '.json') {
    throw new Error('--output 必须使用 .json 扩展名')
  }

  if (outputPath === defaultOutputPath) return outputPath

  let existing
  try {
    existing = await readFile(outputPath, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return outputPath
    throw new Error(`已存在的自定义输出不是有效的驾驶舱快照: ${error.message}`)
  }

  try {
    const snapshot = JSON.parse(existing)
    validateSnapshot(snapshot)
  } catch (error) {
    throw new Error(`已存在的自定义输出不是有效的驾驶舱快照: ${error.message}`)
  }
  return outputPath
}

export async function main(args = process.argv.slice(2), dependencies = {}) {
  const {
    buildSnapshot = buildDashboardSnapshot,
    checkBaseline = assertCurrentBaseline,
    writeSnapshot = writeJsonAtomically,
    summarize = formatSummary,
    log = console.log,
  } = dependencies
  const options = parseArgs(args)
  const output = options.check
    ? undefined
    : await assertSafeOutputDestination({
      workspaceRoot: options.workspaceRoot,
      output: options.output ?? DEFAULT_OUTPUT,
    })
  const snapshot = await buildSnapshot({
    workspaceRoot: options.workspaceRoot,
    now: new Date(),
  })

  if (options.check) {
    checkBaseline(snapshot)
    log(summarize(snapshot))
    return
  }

  await writeSnapshot(
    output,
    snapshot,
  )
  log(summarize(snapshot))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
