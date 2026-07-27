import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateSnapshot } from '../scripts/build-snapshot.mjs'
import { main, parseArgs } from '../scripts/refresh-data.mjs'
import {
  currentBaselineFixture,
  validSnapshotFixture,
} from './helpers/snapshot-fixture.mjs'

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

test('CLI check mode validates an injected snapshot without changing existing output', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-check-mode-'))
  const output = join(dir, 'snapshot.json')
  const previous = '{"previous":true}\n'
  await writeFile(output, previous)

  await main(
    ['--workspace-root', dir, '--output', output, '--check'],
    {
      buildSnapshot: async () => currentBaselineFixture(),
      log: () => {},
    },
  )

  assert.equal(await readFile(output, 'utf8'), previous)
})

test('CLI preserves existing output when build or validation fails', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-failed-refresh-'))
  const output = join(dir, 'snapshot.json')
  const previous = '{"previous":true}\n'
  await writeFile(output, previous)

  const invalidSnapshot = structuredClone(validSnapshotFixture)
  invalidSnapshot.assets.find(({ id }) => id === 'positions').totalValue = 5
  const failures = [
    {
      buildSnapshot: async () => {
        throw new Error('测试构建失败')
      },
      error: /测试构建失败/,
    },
    {
      buildSnapshot: async () => {
        validateSnapshot(invalidSnapshot)
        return invalidSnapshot
      },
      error: /岗位.*岗位总数 5/,
    },
  ]

  for (const failure of failures) {
    await assert.rejects(
      () => main(
        ['--workspace-root', logicalWorkspaceRoot, '--output', output],
        { buildSnapshot: failure.buildSnapshot, log: () => {} },
      ),
      failure.error,
    )
    assert.equal(await readFile(output, 'utf8'), previous)
  }
})
