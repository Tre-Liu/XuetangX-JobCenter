import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterIndustryMajors,
  getIndustryMajorProfile,
} from '../src/app/industry-major-chain-query.js'

const source = await readFile(new URL('../industry-major-chain-data.js', import.meta.url), 'utf8')
const vueSource = await readFile(new URL('../src/data/industry-major-chain-data.ts', import.meta.url), 'utf8')
const context = { globalThis: {} }
vm.runInNewContext(source, context)
const data = context.globalThis.INDUSTRY_MAJOR_CHAIN_DATA

test('Vue artifact parses serialized JSON behind the dataset type boundary', () => {
  assert.match(vueSource, /JSON\.parse\(/)
  assert.match(vueSource, /as IndustryMajorChainDataset/)
  assert.doesNotMatch(vueSource, /: IndustryMajorChainDataset = \{"stats"/)
})

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

test('artificial intelligence returns only its confirmed AI midstream relation', () => {
  const profile = getIndustryMajorProfile(data, '普通本科', '080717T')
  assert.equal(profile.major.name, '人工智能')
  assert.deepEqual(profile.relations.map((relation) => [
    profile.chains.find((chain) => chain.id === relation.chainId).name,
    relation.stage,
    relation.node,
  ]), [['人工智能产业链', '中游', '智能感知、语音视觉与平台工具']])
})

test('pending and unmatched majors return an empty confirmed relation set', () => {
  const pending = getIndustryMajorProfile(data, '普通本科', '081008T')
  const unmatched = getIndustryMajorProfile(data, '普通本科', '082801')
  assert.equal(pending.major.matchStatus, '待人工研判')
  assert.equal(pending.relations.length, 0)
  assert.equal(unmatched.major.matchStatus, '未匹配')
  assert.equal(unmatched.relations.length, 0)
})

test('major search filters by UI group, code, and name', () => {
  assert.ok(filterIndustryMajors(data, 'undergraduate', '080717T').some((major) => major.name === '人工智能'))
  assert.ok(filterIndustryMajors(data, 'vocational', '工程造价').every((major) => major.uiLevel === 'vocational'))
})
