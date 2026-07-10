import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('generated AI chain bundle preserves the complete reconciled dataset', () => {
  const output = path.join(tmpdir(), `ai-industry-chain-${process.pid}.js`)

  try {
    execFileSync(process.execPath, [
      path.join(projectRoot, 'scripts/build-ai-industry-chain-data.mjs'),
      '--output', output,
    ], { cwd: projectRoot })

    const context = { window: {} }
    vm.runInNewContext(readFileSync(output, 'utf8'), context)
    const data = context.window.__AI_INDUSTRY_CHAIN_DATA__

    assert.equal(data.version, 1)
    assert.equal(data.meta.stageCount, 3)
    assert.equal(data.meta.nodeCount, 109)
    assert.equal(data.meta.sourceReportedCount, 33975)
    assert.equal(data.meta.sourceMembershipCount, 33961)
    assert.equal(data.meta.companyCount, 32403)
    assert.equal(data.companies.length, 32403)
    assert.equal(data.nodes.length, 109)
    assert.deepEqual(Array.from(data.stages, (item) => item.id), ['node-043', 'node-044', 'node-045'])
    assert.ok(data.companies.every((item) => item.name || item.creditCode))
    assert.ok(data.companies.every((item) => item.sources.length > 0))
    assert.ok(data.companies.some((item) => item.mappingStatus === 'pending'))
    assert.ok(Array.isArray(data.sankey.nodes) && data.sankey.nodes.length >= 3)
    assert.ok(Array.isArray(data.sankey.links) && data.sankey.links.length > 0)
    assert.ok(data.sankey.links.every((link) => link.value > 0))
    assert.ok(data.sankey.links.every((link) => (
      data.sankey.nodes.some((node) => node.id === link.source)
      && data.sankey.nodes.some((node) => node.id === link.target)
    )))
  } finally {
    rmSync(output, { force: true })
  }
})

test('generated AI chain bundle retains all source node families and province evidence', () => {
  const output = path.join(tmpdir(), `ai-industry-chain-shape-${process.pid}.js`)

  try {
    execFileSync(process.execPath, [
      path.join(projectRoot, 'scripts/build-ai-industry-chain-data.mjs'),
      '--output', output,
    ], { cwd: projectRoot })

    const context = { window: {} }
    vm.runInNewContext(readFileSync(output, 'utf8'), context)
    const data = context.window.__AI_INDUSTRY_CHAIN_DATA__
    const nodeNames = new Set(Array.from(data.nodes, (item) => item.name))

    for (const nodeName of ['云计算服务', '智能视觉算法', '数据分析']) {
      assert.ok(nodeNames.has(nodeName), `missing node ${nodeName}`)
    }
    assert.ok(data.provinces.some((item) => item.name === '广东省' && item.count > 0))
    assert.ok(data.quality.pendingCompanyCount > 0)
    assert.equal(
      data.nodes.reduce((sum, item) => sum + item.companyCount, 0) > data.meta.companyCount,
      true,
      'node memberships should preserve many-to-many company relationships',
    )
    assert.ok(data.sankey.nodes.every((node) => node.value > 0))
    assert.ok(new Set(data.sankey.nodes.map((node) => node.stage)).size >= 2)
  } finally {
    rmSync(output, { force: true })
  }
})
