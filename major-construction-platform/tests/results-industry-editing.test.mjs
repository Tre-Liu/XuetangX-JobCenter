import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
const context = {}
vm.runInNewContext(await readFile(new URL('../src/results-home/industry-model.js', import.meta.url), 'utf8'), context)
const api=context.ResultsIndustryModel
const config={chains:[{id:'c',name:'产业链'}],industries:[{id:'i',chainId:'c'}],jobs:[{id:'a',name:'工程师',industryNodeId:'i',jdText:'BIM。BIM。C++应用。'},{id:'b',name:'未关联岗位',jdText:'BIM。'}]}
test('岗位候选仅来自模型匹配关系，显式空选择不能回退到全部岗位',()=>{
 const model=api.build(config)
 assert.deepEqual(Array.from(api.displayJobs(model,null),j=>j.id),['a'])
 assert.equal(api.displayJobs(model,[]).length,0)
 assert.deepEqual(Array.from(api.displayJobs(model,['b','a','gone']),j=>j.id),['a'])
})
test('自定义词条按字面内容统计真实提及，不推造零频词的岗位关联',()=>{
 const words=api.countWords(api.build(config).jobs,['C++','[','BIM','C++'])
 assert.deepEqual(Array.from(words,w=>[w.name,w.value,Array.from(w.jobIds)]),[['BIM',3,['a','b']],['C++',1,['a']],['[',0,[]]])
})
test('默认词云保持原词频与空档案行为，清空自定义词条保持空白',()=>{
 assert.ok(api.build(config).words.length)
 assert.equal(api.countWords(api.build(config).jobs,[]).length,0)
 assert.equal(api.build({}).words.length,0)
})
