import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { sanitizeIndustryResearchStoredState } from '../src/app/industry-major-chain-query.js'

const dataContext = { globalThis: {} }
vm.runInNewContext(await readFile(new URL('../industry-major-chain-data.js', import.meta.url), 'utf8'), dataContext)
const data = dataContext.globalThis.INDUSTRY_MAJOR_CHAIN_DATA
const helperPath = new URL('../src/data/industry-major-selection.js', import.meta.url)
const getHelper = async () => {
  const context = { globalThis: {} }
  try { vm.runInNewContext(await readFile(helperPath, 'utf8'), context) } catch (error) { if (error.code !== 'ENOENT') throw error }
  assert.ok(context.globalThis.IndustryMajorSelection, 'shared multi-major selection helper is available')
  return context.globalThis.IndustryMajorSelection
}
const identity = major => ({ level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code })

test('multi-major restore supports legacy storage, deduplicates identities and keeps same codes at different levels', async () => {
  const api = await getHelper()
  const catalogue = [{ key: 'a:123456', code: '123456', sourceLevel: 'a', uiLevel: 'vocational' }, { key: 'b:123456', code: '123456', sourceLevel: 'b', uiLevel: 'vocational' }]
  const a = identity(catalogue[0]), b = identity(catalogue[1])
  assert.equal(api.restore(catalogue, { officialMajor: a }).length, 1)
  assert.equal(api.restore(catalogue, { officialMajors: [a, b, a, { ...a, code: 'missing' }] }).length, 2)
  assert.equal(api.restore(catalogue, { officialMajors: [], officialMajor: a }).length, 0)
})

test('merged chains keep one row per chain and all contributing major evidence', async () => {
  const api = await getHelper()
  const groups = [{ major: { key: 'a', name: '专业甲' }, chains: [{ id: 'x', node: '环节甲', evidence: '依据甲', jobCount: 100 }] }, { major: { key: 'b', name: '专业乙' }, chains: [{ id: 'x', node: '环节乙', evidence: '依据乙', jobCount: 100 }, { id: 'y', node: '环节丙' }] }]
  const result = api.mergeChains(groups)
  assert.equal(result.length, 2)
  assert.equal(result[0].matchedMajors.length, 2)
  assert.equal(result[0].matchedMajors[1].evidence, '依据乙')
  assert.equal(result[0].jobCount, 100, 'overlapping chain totals are not added')
  assert.match(result[0].node, /环节甲.*环节乙/)
})

test('stored multi-major chains are validated against every confirmed major', () => {
  const first = data.majors.find(major => major.matchStatus === '未匹配')
  const relation = data.relations[0]
  const second = data.majors.find(major => major.key === relation.majorKey)
  const sanitized = sanitizeIndustryResearchStoredState(data, { initialized: true, officialMajor: identity(first), officialMajors: [identity(first), identity(second)], selectedChainIds: [relation.chainId, 'invalid'] })
  assert.equal(sanitized.initialized, true)
  assert.deepEqual(sanitized.selectedChainIds, [relation.chainId])
})
