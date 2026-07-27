import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateSnapshot } from '../scripts/build-snapshot.mjs'
import { main, parseArgs } from '../scripts/refresh-data.mjs'
import { SOURCE_REGISTRY } from '../scripts/source-registry.mjs'
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
  const previous = `${JSON.stringify(validSnapshotFixture)}\n`
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

test('CLI rejects Excel and CSV output paths before building and preserves their contents', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'dashboard-output-sources-'))
  const candidates = ['custom-output.xlsx', 'custom-output.csv']

  for (const relativePath of candidates) {
    const output = join(workspace, relativePath)
    await mkdir(dirname(output), { recursive: true })
    const previous = `source:${relativePath}`
    await writeFile(output, previous)

    await assert.rejects(
      () => main(
        ['--workspace-root', workspace, '--output', output],
        {
          buildSnapshot: async () => {
            throw new Error('不应构建快照')
          },
          log: () => {},
        },
      ),
      /--output.*必须使用 \.json 扩展名/,
    )
    assert.equal(await readFile(output, 'utf8'), previous)
  }
})

test('CLI rejects a JSON output equal to or inside a registered manifest source', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'dashboard-output-manifests-'))
  const manifestCandidate = SOURCE_REGISTRY
    .find((source) => source.id === 'recruitmentManifests')
    .candidates[0]
  const manifestDirectory = join(workspace, manifestCandidate)
  const manifest = join(manifestDirectory, 'year=2014', 'part-00000.json')
  await mkdir(dirname(manifest), { recursive: true })
  const previous = '{"manifest":true}\n'
  await writeFile(manifest, previous)

  for (const output of [manifestDirectory, manifest]) {
    await assert.rejects(
      () => main(
        ['--workspace-root', workspace, '--output', output],
        {
          buildSnapshot: async () => {
            throw new Error('不应构建快照')
          },
          log: () => {},
        },
      ),
      /--output.*不得等于或位于已登记数据源内/,
    )
  }
  assert.equal(await readFile(manifest, 'utf8'), previous)
})

test('CLI rejects a new output whose symlinked parent resolves inside a registered source', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'dashboard-output-parent-symlink-'))
  const manifestCandidate = SOURCE_REGISTRY
    .find((source) => source.id === 'recruitmentManifests')
    .candidates[0]
  const manifestDirectory = join(workspace, manifestCandidate)
  const outputAlias = join(workspace, 'apparently-safe-output')
  await mkdir(manifestDirectory, { recursive: true })
  await symlink(manifestDirectory, outputAlias, 'dir')

  await assert.rejects(
    () => main(
      ['--workspace-root', workspace, '--output', join(outputAlias, 'new-snapshot.json')],
      {
        buildSnapshot: async () => {
          throw new Error('不应构建快照')
        },
        log: () => {},
      },
    ),
    /--output.*不得等于或位于已登记数据源内/,
  )
})

test('CLI rejects an existing output symlink whose target is a registered source file', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'dashboard-output-file-symlink-'))
  const manifestCandidate = SOURCE_REGISTRY
    .find((source) => source.id === 'recruitmentManifests')
    .candidates[0]
  const sourceFile = join(workspace, manifestCandidate, 'source-snapshot.json')
  const outputAlias = join(workspace, 'apparently-safe-snapshot.json')
  const previous = `${JSON.stringify(validSnapshotFixture)}\n`
  await mkdir(dirname(sourceFile), { recursive: true })
  await writeFile(sourceFile, previous)
  await symlink(sourceFile, outputAlias, 'file')

  await assert.rejects(
    () => main(
      ['--workspace-root', workspace, '--output', outputAlias],
      {
        buildSnapshot: async () => currentBaselineFixture(),
        log: () => {},
      },
    ),
    /--output.*不得等于或位于已登记数据源内/,
  )
  assert.equal(await readFile(sourceFile, 'utf8'), previous)
})

test('CLI protects registered sources when the workspace root itself is a symlink', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dashboard-output-workspace-symlink-'))
  const workspace = join(root, 'physical-workspace')
  const workspaceAlias = join(root, 'workspace-alias')
  const manifestCandidate = SOURCE_REGISTRY
    .find((source) => source.id === 'recruitmentManifests')
    .candidates[0]
  const manifestDirectory = join(workspace, manifestCandidate)
  await mkdir(manifestDirectory, { recursive: true })
  await symlink(workspace, workspaceAlias, 'dir')

  await assert.rejects(
    () => main(
      [
        '--workspace-root',
        workspaceAlias,
        '--output',
        join(manifestDirectory, 'physical-snapshot.json'),
      ],
      {
        buildSnapshot: async () => {
          throw new Error('不应构建快照')
        },
        log: () => {},
      },
    ),
    /--output.*不得等于或位于已登记数据源内/,
  )
})

test('CLI protects a registered source candidate that is itself a symlink', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dashboard-output-source-symlink-'))
  const workspace = join(root, 'workspace')
  const physicalSource = join(root, 'physical-source')
  const manifestCandidate = SOURCE_REGISTRY
    .find((source) => source.id === 'recruitmentManifests')
    .candidates[0]
  const candidateAlias = join(workspace, manifestCandidate)
  await mkdir(dirname(candidateAlias), { recursive: true })
  await mkdir(physicalSource, { recursive: true })
  await symlink(physicalSource, candidateAlias, 'dir')

  await assert.rejects(
    () => main(
      [
        '--workspace-root',
        workspace,
        '--output',
        join(physicalSource, 'physical-snapshot.json'),
      ],
      {
        buildSnapshot: async () => {
          throw new Error('不应构建快照')
        },
        log: () => {},
      },
    ),
    /--output.*不得等于或位于已登记数据源内/,
  )
})

test('CLI resolves safe non-source symlink parents while retaining JSON overwrite rules', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'dashboard-output-safe-symlink-'))
  const physicalOutputDirectory = join(workspace, 'physical-output')
  const outputAlias = join(workspace, 'output-alias')
  await mkdir(physicalOutputDirectory, { recursive: true })
  await symlink(physicalOutputDirectory, outputAlias, 'dir')

  const freshOutput = join(outputAlias, 'nested', 'fresh.json')
  await main(
    ['--workspace-root', workspace, '--output', freshOutput],
    {
      buildSnapshot: async () => currentBaselineFixture(),
      log: () => {},
    },
  )
  assert.equal(
    JSON.parse(await readFile(join(physicalOutputDirectory, 'nested', 'fresh.json'), 'utf8'))
      .assets[0].primaryValue,
    19,
  )

  const arbitraryOutput = join(outputAlias, 'arbitrary.json')
  await writeFile(join(physicalOutputDirectory, 'arbitrary.json'), '{"arbitrary":true}\n')
  await assert.rejects(
    () => main(
      ['--workspace-root', workspace, '--output', arbitraryOutput],
      {
        buildSnapshot: async () => {
          throw new Error('不应构建快照')
        },
        log: () => {},
      },
    ),
    /已存在的自定义输出不是有效的驾驶舱快照/,
  )

  const validOutput = join(outputAlias, 'existing.json')
  await writeFile(
    join(physicalOutputDirectory, 'existing.json'),
    `${JSON.stringify(validSnapshotFixture)}\n`,
  )
  await main(
    ['--workspace-root', workspace, '--output', validOutput],
    {
      buildSnapshot: async () => currentBaselineFixture(),
      log: () => {},
    },
  )
  assert.equal(
    JSON.parse(await readFile(join(physicalOutputDirectory, 'existing.json'), 'utf8'))
      .assets[0].primaryValue,
    19,
  )
})

test('CLI rejects an output below a broken symlink with an explicit Chinese error', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'dashboard-output-broken-symlink-'))
  const brokenAlias = join(workspace, 'broken-output')
  await symlink(join(workspace, 'missing-target'), brokenAlias, 'dir')

  await assert.rejects(
    () => main(
      [
        '--workspace-root',
        workspace,
        '--output',
        join(brokenAlias, 'nested', 'snapshot.json'),
      ],
      {
        buildSnapshot: async () => {
          throw new Error('不应构建快照')
        },
        log: () => {},
      },
    ),
    /输出路径.*符号链接.*无法解析/,
  )
})

test('CLI rejects arbitrary existing JSON and preserves it', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'dashboard-output-existing-'))
  const output = join(workspace, 'custom.json')
  const previous = '{"arbitrary":true}\n'
  await writeFile(output, previous)

  await assert.rejects(
    () => main(
      ['--workspace-root', workspace, '--output', output],
      {
        buildSnapshot: async () => {
          throw new Error('不应构建快照')
        },
        log: () => {},
      },
    ),
    /已存在的自定义输出不是有效的驾驶舱快照/,
  )
  assert.equal(await readFile(output, 'utf8'), previous)
})

test('CLI allows a new JSON output and overwrites an existing valid snapshot', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'dashboard-output-valid-'))
  const existing = join(workspace, 'existing.json')
  const fresh = join(workspace, 'fresh.json')
  await writeFile(existing, `${JSON.stringify(validSnapshotFixture)}\n`)

  for (const output of [existing, fresh]) {
    await main(
      ['--workspace-root', workspace, '--output', output],
      {
        buildSnapshot: async () => currentBaselineFixture(),
        log: () => {},
      },
    )
    const written = JSON.parse(await readFile(output, 'utf8'))
    assert.equal(written.schemaVersion, 1)
    assert.equal(
      written.assets.find((asset) => asset.id === 'chains').primaryValue,
      19,
    )
  }
})
