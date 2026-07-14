import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'

const source = await readFile(new URL('../industry-major-chain-data.js', import.meta.url), 'utf8')
const context = { globalThis: {} }
vm.runInNewContext(source, context)
const data = context.globalThis.INDUSTRY_MAJOR_CHAIN_DATA

test('generated industry-major dataset has the audited workbook totals', () => {
  assert.equal(data.stats.majorCount, 2142)
  assert.equal(data.stats.undergraduateCount, 840)
  assert.equal(data.stats.vocationalCount, 1302)
  assert.equal(data.stats.chainCount, 19)
  assert.equal(data.stats.stageCount, 57)
  assert.equal(data.stats.relationCount, 791)
})

test('every confirmed relation references an imported major and chain', () => {
  const majorKeys = new Set(data.majors.map((major) => major.key))
  const chainIds = new Set(data.chains.map((chain) => chain.id))
  assert.ok(data.relations.every((relation) => majorKeys.has(relation.majorKey)))
  assert.ok(data.relations.every((relation) => chainIds.has(relation.chainId)))
})

test('pending and unmatched majors have no confirmed relation rows', () => {
  const relatedMajorKeys = new Set(data.relations.map((relation) => relation.majorKey))
  assert.ok(data.majors
    .filter((major) => major.matchStatus !== '已匹配')
    .every((major) => !relatedMajorKeys.has(major.key)))
})
