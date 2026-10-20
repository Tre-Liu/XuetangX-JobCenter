import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
const context = vm.createContext({})
vm.runInContext(await readFile(new URL('../src/industry-domain/model.js', import.meta.url), 'utf8'), context)
const M = context.IndustryDomain
const group = M.definitions[0][0], second = M.definitions[1][0]
const jobs = [
 {id:'a',name:'BIM A',groupName:group,demand:'9,500',salary:'10K–18K',level:'初级',education:'本科',experience:'1–3年',abilities:{知识:['模型规范'],技能:['模型校核']},skills:[]},
 {id:'b',name:'BIM B',groupName:group,demand:'1.2万',salary:'15K–21K',level:'中级',education:'本科',experience:'3–5年',abilities:{知识:['构件编码'],技能:['模型校核']},skills:[]},
 {id:'c',name:'构件 C',groupName:second,demand:80,salary:'8K–10K',level:'初级',education:'专科',experience:'应届',abilities:{素养:['安全']},skills:[]}
]
const courses = [{id:'course',name:'模型课程',jobIds:['a']}]
const state = {membership:{},relations:{}}
const ids = rows => Array.from(rows, r => r.id)
test('portrait card and dialog tags follow current membership and the same fallback rules', () => {
 const job = {...jobs[0], node:'BIM协同设计与算量平台', skills:['建模','校核','协同','归档']}
 assert.deepEqual(Array.from(M.portraitTags(job)), [`岗位群：${group}`, '产业环节：BIM协同设计与算量平台'])
 assert.deepEqual(Array.from(M.portraitTags(job, {a:second})), [`岗位群：${second}`, '产业环节：BIM协同设计与算量平台'])
 assert.deepEqual(Array.from(M.portraitTags(job, {}, false)), ['产业环节：BIM协同设计与算量平台','建模','校核','协同'])
 assert.deepEqual(Array.from(M.portraitTags({...job, groupName:'', node:''})), ['建模','校核','协同'])
 assert.deepEqual(Array.from(M.portraitTags(undefined)), [])
})
test('numeric demand sorting handles commas and 万 without mutating source order', () => {
 assert.deepEqual(ids(M.filterJobs(jobs,{sort:'demand'},state,courses)),['b','a','c'])
 assert.deepEqual(ids(jobs),['a','b','c'])
})
test('group, education, experience, salary, level and keyword filters intersect', () => {
 assert.deepEqual(ids(M.filterJobs(jobs,{group,education:'本科',experience:'3–5年',salary:'high',level:'中级',query:'校核'},state,courses)),['b'])
 assert.equal(M.filterJobs(jobs,{group,education:'专科'},state,courses).length,0)
})
test('moving and removing a member changes group aggregates without deleting the original job', () => {
 const overrides = {a:second,b:''}
 const groups = M.groups(jobs,overrides)
 assert.equal(groups[0].members.length,0)
 assert.equal(groups[1].demand,9580)
 assert.deepEqual(ids(M.filterJobs(jobs,{}, {membership:overrides},courses)),['a','b','c'])
 assert.equal(jobs[0].groupName,group)
})
test('course candidates do not count as confirmed ability coverage; confirmed relations drive matching rank', () => {
 assert.equal(M.coverage(jobs[0],courses,{}).percent,0)
 const edits = {[M.abilities(jobs[1])[0].key]:['course']}
 assert.equal(M.coverage(jobs[1],courses,edits).percent,50)
 assert.deepEqual(ids(M.filterJobs(jobs,{sort:'match'},{...state,relations:edits},courses)),['b','a','c'])
})
test('relation import validates all records before producing an update, rejects foreign IDs and duplicates', () => {
 const key=M.abilities(jobs[0])[0].key
 const source=[{key,courseIds:['course','course']}]
 assert.deepEqual(Array.from(M.validateRelations(source,jobs,courses)[key]),['course'])
 assert.throws(()=>M.validateRelations([...source,{key:'missing',courseIds:[]}],jobs,courses))
 assert.throws(()=>M.validateRelations([...source,...source],jobs,courses))
 assert.throws(()=>M.validateRelations([{key,courseIds:['missing']}],jobs,courses))
 assert.deepEqual(source[0].courseIds,['course','course'])
})
test('malformed or missing saved state falls back safely',()=>{
 for(const content of ['', 'not json', 'null']) assert.equal(Object.keys(M.load({getItem:()=>content}).membership).length,0)
})
test('industry-node entry filters to every related group instead of choosing one arbitrary group',()=>{
 const shared = M.definitions[2][3].find(node => M.definitions[3][3].includes(node))
 const rows = [{...jobs[0],groupName:M.definitions[2][0]},{...jobs[1],groupName:M.definitions[3][0]},jobs[2]]
 assert.deepEqual(ids(M.filterJobs(rows,{node:shared},state,courses)),['a','b'])
})
test('disabled job groups ignore stale group filters and hidden membership search terms', () => {
 const disabled = { group: 'stale-group', node: 'stale-node', groupsEnabled: false }
 assert.deepEqual(ids(M.filterJobs(jobs, disabled, state, courses)), ['a','b','c'])
 assert.equal(M.filterJobs(jobs, { groupsEnabled: false, query: 'hidden-membership' }, { ...state, membership: { a: 'hidden-membership' } }, courses).length, 0)
})
