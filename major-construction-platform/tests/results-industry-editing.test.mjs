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
test('自定义类型改变词云大小，但保留实际词频和岗位关联',()=>{
 const words=api.countWords(api.build(config).jobs,[{name:'BIM',type:'small'},{name:'C++',type:'large'},{name:'无人机',type:'medium'}])
 assert.deepEqual(Array.from(words,w=>[w.name,w.type,w.value,Array.from(w.jobIds)]),[['BIM','small',3,['a','b']],['C++','large',1,['a']],['无人机','medium',0,[]]])
 const placed=api.layoutWords(words,288,520,(text,size)=>text.length*size)
 assert.equal(placed.length,3)
 const size=name=>placed.find(w=>w.name===name).fontSize
 assert.ok(size('C++')>size('无人机')&&size('无人机')>size('BIM'))
})
test('词条存储兼容旧名称列表，并读取名称类型配置和显式空列表',async()=>{
 let stored={terms:[' BIM ','C++','BIM','']}
 context.localStorage={getItem:()=>JSON.stringify(stored)}
 vm.runInNewContext(await readFile(new URL('../src/results-home/industry-editor.js',import.meta.url),'utf8'),context)
 const read=()=>JSON.parse(JSON.stringify(context.ResultsIndustryEditor.read(api.build(config)).terms))
 assert.deepEqual(read(),['BIM','C++'])
 stored={terms:[{name:' BIM ',type:'large'},{name:'C++',type:'small'},{name:'无人机',type:'invalid'},null,{name:''},{name:'BIM',type:'medium'}]}
 assert.deepEqual(read(),[{name:'BIM',type:'large'},{name:'C++',type:'small'},{name:'无人机',type:'medium'}])
 stored={terms:[]};assert.deepEqual(read(),[])
})
