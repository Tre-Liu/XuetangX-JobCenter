import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
const context = vm.createContext({})
vm.runInContext(await readFile(new URL('../src/industry-domain/model.js', import.meta.url), 'utf8'), context)
try { vm.runInContext(await readFile(new URL('../src/industry-domain/node-detail.js', import.meta.url), 'utf8'), context) } catch (error) { if (error.code !== 'ENOENT') throw error }
const build = input => { assert.equal(typeof context.IndustryNodeDetail?.buildData, 'function'); return context.IndustryNodeDetail.buildData(input) }
const chain = '智能建造产业链'
const node = { id: 'construction', name: '智能施工产业', stage: 'downstream', enterpriseCount: 286, techFields: ['现场调度'] }
test('detail preserves graph counts, includes all related groups and current membership', () => {
  const groups = context.IndustryDomain.definitions
  const jobs = [{id:'a', name:'机器人操作员', groupName:groups[2][0]}, {id:'b', name:'工地管理员', groupName:groups[3][0]}]
  const companies = [{name:'企业 A', creditCode:'A', industry:node.name}, {name:'企业 A', creditCode:'A', industry:node.name}, {name:'其他企业', industry:'装配式建筑产业'}]
  const result = build({node, chain, jobs, membership:{a:groups[3][0]}, companies})
  assert.equal(result.enterpriseCount, 286)
  assert.equal(result.groups.length, 2)
  assert.equal(result.groups[0].members.length, 0)
  assert.equal(result.groups[1].members.length, 2)
  assert.equal(result.companies.length, 1)
  assert.equal(result.companies[0].matchLabel, '环节关联')
  assert.equal(result.stageLabel, '下游')
})
test('groups respect the selected chain and unknown nodes have honest empty states', () => {
  assert.equal(build({node, chain:'绿色低碳建造产业链'}).groups.length, 0)
  const result = build({node:{id:'custom', name:'新环节', stage:'upstream', enterpriseCount:0}, chain})
  assert.equal(result.enterpriseCount, 0)
  assert.equal(result.groups.length, 0)
  assert.equal(result.companies.length, 0)
})
test('design business matches are marked as related business instead of direct node relations', () => {
  const result = build({node:{...node,id:'design',name:'建筑设计产业'}, chain, companies:[
    {name:'设计软件企业', products:'结构设计软件、工程计算与协同设计工具', industry:'工程软件与数据服务产业'},
    {name:'施工企业', products:'智慧工地项目', industry:'智能施工产业'}
  ]})
  assert.equal(result.companies.length, 1)
  assert.equal(result.companies[0].matchLabel, '业务相关')
})
