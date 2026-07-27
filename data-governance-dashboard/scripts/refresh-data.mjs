import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  assertCurrentBaseline,
  buildDashboardSnapshot,
  formatSummary,
} from './build-snapshot.mjs'
import { writeJsonAtomically } from './lib/atomic-write.mjs'

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

export async function main(args = process.argv.slice(2), dependencies = {}) {
  const {
    buildSnapshot = buildDashboardSnapshot,
    checkBaseline = assertCurrentBaseline,
    writeSnapshot = writeJsonAtomically,
    summarize = formatSummary,
    log = console.log,
  } = dependencies
  const options = parseArgs(args)
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
    options.output ?? new URL('../src/data/dashboard-snapshot.json', import.meta.url),
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
