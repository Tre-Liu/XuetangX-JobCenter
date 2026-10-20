import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
const context = vm.createContext({})
vm.runInContext(readFileSync(new URL('../industry-major-chain-data.js', import.meta.url), 'utf8'), context)
const source = new URL('../src/industry-domain/availability.js', import.meta.url)
vm.runInContext(readFileSync(source, 'utf8'), context)
const enabled = state => context.IndustryDomainAvailability.hasJobGroups(context.INDUSTRY_MAJOR_CHAIN_DATA, state)
const data = context.INDUSTRY_MAJOR_CHAIN_DATA
const matched = data.majors.find(m => m.matchStatus === '已匹配' && data.relations.some(r => r.majorKey === m.key))
const unmatched = data.majors.find(m => !data.relations.some(r => r.majorKey === m.key))
const stateFor = major => ({ initialized: true, officialMajor: { level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code }, selectedChainIds: data.relations.filter(r => r.majorKey === major.key).map(r => r.chainId) })
test('unmatched, job-name, uninitialized and stale selections never enable job groups', () => {
  assert.equal(enabled({}), false)
  assert.equal(enabled(stateFor(unmatched)), false)
  assert.equal(enabled({ ...stateFor(unmatched), matchingMode: 'job-name', selectedChainIds: stateFor(matched).selectedChainIds }), false)
  assert.equal(enabled({ ...stateFor(matched), initialized: false }), false)
  assert.equal(enabled({ ...stateFor(matched), selectedChainIds: ['stale-chain'] }), false)
})
test('confirmed CMS chain enables job groups, including legacy major identity without sourceLevel', () => {
  assert.equal(enabled(stateFor(matched)), true)
  const state = stateFor(matched)
  delete state.officialMajor.sourceLevel
  assert.equal(enabled(state), true)
})

let Panel
const panelContext = vm.createContext({
  HTMLElement: class {},
  customElements: { get: () => undefined, define: (_, panel) => { Panel = panel } },
  IndustryDomain: {},
})
vm.runInContext(readFileSync(new URL('../src/industry-domain/business-panels.js', import.meta.url), 'utf8'), panelContext)
test('disabled panels remove groups and block membership edits while retaining course calibration', async () => {
  const panel = new Panel()
  panel.state = { membership: {}, targets: {} }
  panel.querySelectorAll = () => []
  panel.coursePanel = () => 'course calibration'
  for (const kind of ['group', 'groups', 'trends', 'applications', 'resource', 'recruitment']) {
    panel.data = { kind, jobGroupsEnabled: false }
    panel.innerHTML = 'stale group content'
    panel.render()
    assert.equal(panel.innerHTML, '')
  }
  panel.data = { kind: 'courses', jobGroupsEnabled: false }
  panel.render()
  assert.equal(panel.innerHTML, 'course calibration')
  await panel.change({ target: { hasAttribute: attr => attr === 'data-membership', dataset: { membership: 'job-a' }, value: 'group-b' } })
  assert.deepEqual(Object.keys(panel.state.membership), [])
  panel.data.jobGroupsEnabled = true
  panel.data.kind = 'group-overview'
  panel.groupOverview = () => 'group overview'
  panel.render()
  assert.equal(panel.innerHTML, 'group overview')
})


test('top group overview includes ungrouped jobs in all jobs and switches to a selected group', async () => {
  const group = { name: 'BIM岗位群', industry: '建筑', field: '数字建模', stages: ['设计'], nodes: ['BIM设计'], members: [{ id: 'a', name: '建模师', demand: 10, salary: '10K–20K' }], demand: 10, salary: 15 }
  panelContext.IndustryDomain.groups = () => [group]
  panelContext.IndustryDomain.number = Number
  panelContext.IndustryDomain.salary = () => 15
  panelContext.IndustryDomain.abilities = () => []
  const panel = new Panel()
  panel.state = { membership: {}, relations: {} }
  const ungrouped = { id: 'ungrouped', name: '工程数据专员', demand: 7, salary: '10K–20K' }
  panel.data = { kind: 'group-overview', jobs: [...group.members, ungrouped], group: '' }
  assert.match(panel.groupOverview(), /data-group-filter="" aria-pressed="true">全部岗位<span>2<\/span>/)
  assert.doesNotMatch(panel.groupOverview(), /portrait-group-info|ib-metrics|<h4>全部岗位<\/h4>/)
  assert.match(panel.groupOverview(), /导出全部岗位群/)
  assert.deepEqual(Array.from(panel.groupExport()), [group])
  panel.data.group = group.name
  assert.match(panel.groupOverview(), /<b>1<\/b> 群内岗位/)
  assert.match(panel.groupOverview(), /<b>10<\/b> 汇总需求/)
  assert.match(panel.groupOverview(), /数字建模/)
  assert.match(panel.groupOverview(), /BIM设计/)
  assert.match(panel.groupOverview(), /portrait-group-info/)
  assert.equal(panel.groupExport(), group)
  const events = []
  panel.emit = (action, detail) => events.push({ action, ...detail })
  assert.match(panel.groupOverview(), /aria-pressed="true"/ )
  assert.doesNotMatch(panel.groupOverview(), /<select/)
  panel.click({ target: { closest: () => ({ dataset: { groupFilter: '' } }) } })
  assert.deepEqual(events, [{ action: 'group-filter', group: '' }])
  panel.data.group = ''
  assert.doesNotMatch(panel.groupOverview(), /portrait-group-info|ib-metrics/)
})

test('clearing the group filter keeps jobs without membership and jobs removed from their group', () => {
  const modelContext = vm.createContext({})
  vm.runInContext(readFileSync(new URL('../src/industry-domain/model.js', import.meta.url), 'utf8'), modelContext)
  const model = modelContext.IndustryDomain
  const name = model.definitions[0][0]
  const jobs = [{ id: 'a', groupName: name }, { id: 'b', groupName: '' }, { id: 'c', groupName: name }]
  const state = { membership: { c: '' } }
  assert.deepEqual(Array.from(model.filterJobs(jobs, { group: name }, state), job => job.id), ['a'])
  assert.deepEqual(Array.from(model.filterJobs(jobs, { group: '' }, state), job => job.id), ['a', 'b', 'c'])
})

test('group export produces JSON with selected members or the full group collection', async () => {
  const groups = [{ name: 'BIM岗位群', members: [{ id: 'a' }] }, { name: '装配岗位群', members: [{ id: 'b' }] }]
  panelContext.IndustryDomain.groups = () => groups
  panelContext.Blob = Blob
  let blob, filename, clicked = false
  panelContext.URL = { createObjectURL: value => { blob = value; return 'blob:test' }, revokeObjectURL() {} }
  panelContext.setTimeout = fn => fn()
  panelContext.document = { createElement: () => ({ set download(value) { filename = value }, click() { clicked = true } }) }
  const panel = new Panel()
  panel.state = { membership: {} }
  for (const group of ['', 'BIM岗位群']) {
    panel.data = { kind: 'group-overview', group, jobs: [] }
    panel.click({ target: { closest: () => ({ dataset: { export: 'group' } }) } })
    assert.equal(clicked, true)
    assert.equal(filename, `${group || '全部岗位群'}.json`)
    assert.deepEqual(JSON.parse(await blob.text()), group ? groups[0] : groups)
  }
})
