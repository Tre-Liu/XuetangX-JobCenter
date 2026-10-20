import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { getJobDetail, JOB_CARDS } from '../src/mock/job-center.ts'

const vue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('Vue competency fallback preserves the existing BIM shared task references', () => {
  const source = vue.slice(vue.indexOf('const portraitTaskAbilityKeywordRules ='), vue.indexOf('const buildPortraitCompetencyTasks ='))
  const detail = getJobDetail('job-bim-modeler')
  const job = { id: 'job-bim-modeler', tasks: detail.tasks.map(task => task.name) }
  const groups = ['知识', '技能', '素养'].map(category => ({ label: category, items: detail.abilities.filter(node => node.category === category).map(node => node.name) }))
  const sandbox = vm.createContext({ getJobDetail, JOB_CARDS, getPortraitCompetencyAbilityGroups: () => groups, job })
  vm.runInContext(ts.transpile(`${source}\nglobalThis.relations = distributePortraitAbilitiesAcrossTasks(job)`, { target: ts.ScriptTarget.ES2020 }), sandbox)
  assert.ok(sandbox.relations['岗位任务策划与资料准备'].includes('跨专业协同沟通'))
  assert.ok(sandbox.relations['智能建造现场协同实施'].includes('跨专业协同沟通'))
  assert.ok(sandbox.relations['数字模型与现场数据处理'].includes('工程数据采集与校核'))
  assert.ok(sandbox.relations['质量安全检查与效果评价'].includes('工程数据采集与校核'))
})

test('standalone task allocation preserves all shared references supplied by its task template', () => {
  const source = html.slice(html.indexOf('const distributeStaticPortraitAbilitiesAcrossTasks ='), html.indexOf('const getStaticTaskLabel ='))
  const sandbox = vm.createContext({ tasks: [{ name: '模型校核', abilities: ['质量意识'] }, { name: '成果交付', abilities: ['质量意识'] }], abilities: { 知识: ['模型标准'], 技能: ['校核'], 素养: ['质量意识'] } })
  vm.runInContext(`${source}\nglobalThis.result = distributeStaticPortraitAbilitiesAcrossTasks(tasks, abilities)`, sandbox)
  assert.ok(sandbox.result[0].abilities.includes('质量意识'))
  assert.ok(sandbox.result[1].abilities.includes('质量意识'))
  assert.equal(new Set(sandbox.result.flatMap(task => task.abilities)).size, 3)
})

test('standalone BIM template supplies shared knowledge, skill and quality requirements', () => {
  const source = html.slice(html.indexOf('const staticGroupTaskSeeds ='), html.indexOf('const staticPortraitDetails ='))
  const job = { id: 'job-bim-modeler', name: 'BIM建模工程师', groupName: 'BIM深化设计与数字建模岗位群', industryNodeId: 'node-bim-platform', taskCount: 5 }
  const sandbox = vm.createContext({ staticJobs: [job], staticIndustries: [{ id: 'node-bim-platform', chainId: 'chain', name: 'BIM平台' }], staticChains: [{ id: 'chain', name: '建筑数字化产业链' }] })
  vm.runInContext(`${source}\nglobalThis.detail = buildStaticJobDetail(staticJobs[0], 0)`, sandbox)
  const tasks = sandbox.detail.tasks
  assert.equal(tasks.filter(task => task.abilities.includes('建筑信息模型标准')).length, 3)
  assert.equal(tasks.filter(task => task.abilities.includes('BIM模型创建与校核')).length, 2)
  assert.equal(tasks.filter(task => task.abilities.includes('规范化交付意识')).length, 5)
  assert.ok(tasks.every(task => task.relationBasis.includes('待核验')))
})
