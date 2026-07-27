import test from 'node:test'
import assert from 'node:assert/strict'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from '../scripts/refresh-data.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const projectParent = resolve(projectRoot, '..')
const logicalWorkspaceRoot = basename(dirname(projectParent)) === '.worktrees'
  ? resolve(projectParent, '../..')
  : projectParent

test('CLI accepts explicit workspace, output, and check mode', () => {
  assert.deepEqual(
    parseArgs(['--workspace-root', './fixture', '--output', './out.json', '--check']),
    {
      workspaceRoot: resolve('./fixture'),
      output: resolve('./out.json'),
      check: true,
    },
  )
})

test('CLI defaults to the logical repository root in main and linked worktrees', () => {
  assert.deepEqual(parseArgs([]), {
    workspaceRoot: logicalWorkspaceRoot,
    output: undefined,
    check: false,
  })
})

test('CLI rejects unknown and valueless options', () => {
  assert.throws(() => parseArgs(['--unknown']), /未知参数: --unknown/)
  assert.throws(() => parseArgs(['--workspace-root']), /--workspace-root 缺少路径/)
  assert.throws(() => parseArgs(['--workspace-root', '--check']), /--workspace-root 缺少路径/)
  assert.throws(() => parseArgs(['--output']), /--output 缺少路径/)
  assert.throws(() => parseArgs(['--output', '--check']), /--output 缺少路径/)
})
