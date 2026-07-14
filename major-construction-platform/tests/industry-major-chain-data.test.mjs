import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'
import * as industryMajorChainQuery from '../src/app/industry-major-chain-query.js'

const {
  filterIndustryMajors,
  getIndustryMajorProfile,
} = industryMajorChainQuery

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
  const vocationalCostEngineeringMajors = filterIndustryMajors(data, 'vocational', '工程造价')
  assert.ok(vocationalCostEngineeringMajors.length > 0)
  assert.ok(vocationalCostEngineeringMajors.every((major) => major.uiLevel === 'vocational'))
})

test('civil engineering preserves its audited exact chain mapping', () => {
  const profile = getIndustryMajorProfile(data, '普通本科', '081001')
  assert.equal(profile.major.name, '土木工程')
  assert.deepEqual(profile.relations.map((relation) => [
    profile.chains.find((chain) => chain.id === relation.chainId).name,
    relation.stage,
    relation.node,
  ]), [['基础设施与城市建设产业链', '中游', '基础设施建设与房地产开发']])
})

test('cost engineering preserves its audited exact undergraduate mapping', () => {
  const profile = getIndustryMajorProfile(data, '普通本科', '120105')
  assert.equal(profile.major.name, '工程造价')
  assert.deepEqual(profile.relations.map((relation) => [
    profile.chains.find((chain) => chain.id === relation.chainId).name,
    relation.stage,
    relation.node,
  ]), [['基础设施与城市建设产业链', '上游', '规划设计、建材与工程准备']])
})

test('source level remains part of the exact major identity', () => {
  const vocationalProfile = getIndustryMajorProfile(data, '高等职业教育专科', '440501')
  assert.equal(vocationalProfile.major.name, '工程造价')
  assert.equal(vocationalProfile.major.key, '高等职业教育专科:440501')
  assert.equal(getIndustryMajorProfile(data, '普通本科', '440501'), null)
})

const confirmedMajorState = (major, selectedChainIds, overrides = {}) => ({
  initialized: true,
  selectedChainIds,
  officialMajor: {
    level: major.uiLevel,
    sourceLevel: major.sourceLevel,
    code: major.code,
    name: major.name,
  },
  ...overrides,
})

test('stored initialization drops stale-only chain IDs', () => {
  const sanitize = industryMajorChainQuery.sanitizeIndustryResearchStoredState
  const major = data.majors.find((item) => item.key === '普通本科:081001')
  const state = sanitize(data, confirmedMajorState(major, ['removed-fixed-demo-chain']))
  assert.deepEqual(state.selectedChainIds, [])
  assert.equal(state.initialized, false)
})

test('stored initialization keeps only valid confirmed chain IDs for its major', () => {
  const sanitize = industryMajorChainQuery.sanitizeIndustryResearchStoredState
  const major = data.majors.find((item) => item.key === '普通本科:081001')
  const validChainId = data.relations.find((relation) => relation.majorKey === major.key).chainId
  const state = sanitize(data, confirmedMajorState(major, [validChainId, 'removed-fixed-demo-chain']))
  assert.deepEqual(state.selectedChainIds, [validChainId])
  assert.equal(state.initialized, true)
})

test('pending and unmatched stored majors never initialize', () => {
  const sanitize = industryMajorChainQuery.sanitizeIndustryResearchStoredState
  const validChainId = data.chains[0].id
  for (const key of ['普通本科:081008T', '普通本科:082801']) {
    const major = data.majors.find((item) => item.key === key)
    const state = sanitize(data, confirmedMajorState(major, [validChainId]))
    assert.deepEqual(state.selectedChainIds, [])
    assert.equal(state.initialized, false)
  }
})

test('legacy stored major resolves without sourceLevel only when UI level and code are unique', () => {
  const sanitize = industryMajorChainQuery.sanitizeIndustryResearchStoredState
  const major = data.majors.find((item) => item.key === '普通本科:081001')
  const validChainId = data.relations.find((relation) => relation.majorKey === major.key).chainId
  const legacyState = confirmedMajorState(major, [validChainId])
  delete legacyState.officialMajor.sourceLevel
  const state = sanitize(data, legacyState)
  assert.deepEqual(state.selectedChainIds, [validChainId])
  assert.equal(state.initialized, true)
})

test('ambiguous or unresolvable legacy stored majors never initialize', () => {
  const sanitize = industryMajorChainQuery.sanitizeIndustryResearchStoredState
  const sharedChain = {
    id: 'chain-current',
    name: '当前产业链',
    stages: [{ stage: '上游', node: '当前节点', sourceEvidence: '', formationBasis: '' }],
  }
  const ambiguousData = {
    majors: [
      { key: '层次甲:123456', uiLevel: 'vocational', sourceLevel: '层次甲', code: '123456', name: '同码专业甲', matchStatus: '已匹配' },
      { key: '层次乙:123456', uiLevel: 'vocational', sourceLevel: '层次乙', code: '123456', name: '同码专业乙', matchStatus: '已匹配' },
    ],
    chains: [sharedChain],
    relations: [
      { majorKey: '层次甲:123456', chainId: sharedChain.id, order: 1 },
      { majorKey: '层次乙:123456', chainId: sharedChain.id, order: 1 },
    ],
  }
  const baseState = {
    initialized: true,
    selectedChainIds: [sharedChain.id],
    officialMajor: { level: 'vocational', code: '123456', name: '旧专业' },
  }
  assert.equal(sanitize(ambiguousData, baseState).initialized, false)
  assert.equal(sanitize(ambiguousData, {
    ...baseState,
    officialMajor: { ...baseState.officialMajor, code: '999999' },
  }).initialized, false)
})
