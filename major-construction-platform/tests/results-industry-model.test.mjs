import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { JOB_CARDS, getJobDetail } from '../src/mock/job-center.ts'

const source = await readFile(new URL('../src/results-home/industry-model.js', import.meta.url), 'utf8').catch(() => '')
const context = {}
vm.runInNewContext(source, context)
const fixture = {
  chains: [{ id: 'c1', name: '基础' }, { id: 'c2', name: '应用' }],
  industries: [{ id: 'i1', name: '数字平台', chainId: 'c1' }],
  chainRelations: [{ chainId: 'c1', industryNodeId: 'i1' }, { chainId: 'c2', industryNodeId: 'i1' }],
  jobRelations: [{ jobId: 'j1', industryNodeId: 'i1' }, { jobId: 'j1', industryNodeId: 'i1' }, { jobId: 'gone', industryNodeId: 'i1' }],
  jobs: [{ id: 'j1', name: 'BIM工程师', jdText: '负责BIM应用。', industryNodeId: 'i1', abilities: [{ name: 'BIM建模', category: '技能' }, { name: 'BIM协同', category: '技能' }] }]
}
test('多链归属不重复累计岗位，桑基图中间节点流量守恒', () => {
  assert.ok(context.ResultsIndustryModel, '共享模型应可加载')
  const model = context.ResultsIndustryModel.build(fixture)
  assert.equal(model.jobs.length, 1)
  assert.equal(model.relations.length, 1)
  const graph = context.ResultsIndustryModel.sankey(model)
  assert.equal(graph.links.filter(l => l.target === 'industry:i1').reduce((n,l) => n+l.value, 0), 1)
  assert.equal(graph.links.filter(l => l.source === 'industry:i1').reduce((n,l) => n+l.value, 0), 1)
})
test('关键词依据岗位描述提取，保留关联岗位ID', () => {
  assert.ok(context.ResultsIndustryModel)
  const model = context.ResultsIndustryModel.build(fixture)
  assert.equal(model.words.find(w => w.name === 'BIM').value, 1)
  assert.equal(model.words.find(w => w.name === 'BIM').jobIds[0], 'j1')
})
test('空资料不生成虚构的岗位、能力或词频', () => {
  assert.ok(context.ResultsIndustryModel)
  const model = context.ResultsIndustryModel.build({})
  assert.equal(model.jobs.length, 0)
  assert.equal(model.words.length, 0)
  assert.equal(context.ResultsIndustryModel.sankey(model).links.length, 0)
})
test('桑基图连线引用图表实际使用的节点 ID', () => {
  const graph = context.ResultsIndustryModel.sankey(context.ResultsIndustryModel.build(fixture))
  for (const link of graph.links) {
    assert.ok(graph.nodes.some(n => (n.id || n.name) === link.source), `来源节点 ${link.source} 必须可寻址`)
    assert.ok(graph.nodes.some(n => (n.id || n.name) === link.target), `目标节点 ${link.target} 必须可寻址`)
  }
})
test('双入口共用档案与专业岗位源保持一致，能力定义不丢失', async () => {
  const archive = {}
  vm.runInNewContext(await readFile(new URL('../src/results-home/industry-data.js', import.meta.url), 'utf8'), archive)
  const model = context.ResultsIndustryModel.build(archive.ResultsIndustryData)
  assert.deepEqual(Array.from(model.jobs, j => j.id), JOB_CARDS.map(j => j.id))
  for (const job of model.jobs) {
    assert.equal(JSON.stringify(job.abilities), JSON.stringify(getJobDetail(job.id).abilities))
    assert.equal(JSON.stringify(job.tasks.map(t=>t.abilities)), JSON.stringify(getJobDetail(job.id).tasks.map(t=>t.abilities)))
  }
})
test('产业全景企业指标按档案名称去重，不累加各节点企业数量', () => {
  const model=context.ResultsIndustryModel.build({...fixture,industryOverview:{
    stages:[{key:'upstream',label:'上游'}],nodes:[{id:'n1',name:'数字平台',stage:'upstream'}],links:[],
    companies:[{name:'同一企业',industry:'数字平台'},{name:'同一企业',industry:'数字平台'}],
    jobNodeMap:{i1:['n1']}
  }})
  assert.equal(model.overview.companies.length,1)
  assert.equal(model.overview.nodes[0].jobs.length,1)
})

const multiChainFixture = {
  chains: [{ id: 'c1', name: '资源链', description: '资源供给与装备支撑。' }, { id: 'c2', name: '服务链', description: '工程服务与交付。' }, { id: 'empty', name: '待完善产业链' }],
  industries: [{ id: 'i1', name: '资源', chainId: 'c1' }, { id: 'i2', name: '服务', chainId: 'c2' }],
  jobs: [{ id: 'j1', name: '资源工程师', industryNodeId: 'i1' }, { id: 'j2', name: '服务工程师', industryNodeId: 'i2' }],
  industryOverview: {
    stages: [{ key: 'upstream', label: '上游' }, { key: 'midstream', label: '中游' }],
    nodes: [{ id: 'n1', name: '原料', stage: 'upstream' }, { id: 'n2', name: '平台', stage: 'midstream' }, { id: 'shared', name: '共享服务', stage: 'midstream' }],
    companies: [{ name: '共同企业', industry: '原料' }, { name: '共同企业', industry: '平台' }, { name: '另一企业', industry: '平台' }],
    links: [{ source: 'n1', target: 'shared', value: 1 }, { source: 'n2', target: 'shared', value: 2 }, { source: 'n1', target: 'n2', value: 3 }],
    jobNodeMap: { i1: ['n1', 'shared'], i2: ['n2', 'shared'] }
  }
}
test('切换产业链仅统计所属节点、企业和去重岗位，共享节点的岗位不串链', () => {
  const model = context.ResultsIndustryModel.build(multiChainFixture)
  const first = context.ResultsIndustryModel.chainView(model, 'c1')
  const second = context.ResultsIndustryModel.chainView(model, 'c2')
  assert.equal(first.chain.name, '资源链')
  assert.equal(first.chain.description, '资源供给与装备支撑。')
  assert.deepEqual(Array.from(first.nodes, n => n.id), ['n1', 'shared'])
  assert.deepEqual(Array.from(second.nodes, n => n.id), ['n2', 'shared'])
  assert.deepEqual(Array.from(first.jobs, j => j.id), ['j1'])
  assert.deepEqual(Array.from(second.nodes.find(n => n.id === 'shared').jobs, j => j.id), ['j2'])
  assert.equal(first.companies.length, 1)
  assert.equal(second.companies.length, 2)
  assert.equal(first.links.length, 1)
  assert.equal(second.links.length, 1)
})
test('无匹配资料的产业链保持空状态，不回退到其他链或全部数据', () => {
  const model = context.ResultsIndustryModel.build(multiChainFixture)
  for (const id of ['empty', 'missing']) {
    const view = context.ResultsIndustryModel.chainView(model, id)
    assert.equal(view.nodes.length, 0)
    assert.equal(view.companies.length, 0)
    assert.equal(view.jobs.length, 0)
    assert.equal(view.links.length, 0)
  }
})
test('相关行业按当前链节点的行业映射去重，缺失映射不以阶段数代替', () => {
  const config = structuredClone(multiChainFixture)
  config.industryOverview.nodes[0].nationalIndustries = ['C 制造业', 'I 信息传输、软件和信息技术服务业']
  config.industryOverview.nodes[1].nationalIndustries = ['E 建筑业']
  config.industryOverview.nodes[2].nationalIndustries = ['C 制造业']
  const model = context.ResultsIndustryModel.build(config)
  assert.deepEqual(Array.from(context.ResultsIndustryModel.chainView(model, 'c1').relatedIndustries), ['C 制造业', 'I 信息传输、软件和信息技术服务业'])
  assert.deepEqual(Array.from(context.ResultsIndustryModel.chainView(model, 'c2').relatedIndustries), ['E 建筑业', 'C 制造业'])
  assert.equal(context.ResultsIndustryModel.chainView(model, 'empty').relatedIndustries.length, 0)
})
