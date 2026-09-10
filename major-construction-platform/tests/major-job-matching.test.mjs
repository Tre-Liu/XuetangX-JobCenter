import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { sanitizeIndustryResearchStoredState } from '../src/app/industry-major-chain-query.js'
const scope = { globalThis: {} }
const data = readFileSync(new URL('../industry-major-chain-data.js', import.meta.url), 'utf8')
vm.runInNewContext(data, scope)
const dataset = scope.globalThis.INDUSTRY_MAJOR_CHAIN_DATA
const major = dataset.majors.find(m => m.name === '政治学与行政学')
test('opted-in unmatched major initializes by job names without chain selection', () => {
 const state = sanitizeIndustryResearchStoredState(dataset, { initialized:true, matchingMode:'job-name', officialMajor:{level:major.uiLevel,sourceLevel:major.sourceLevel,code:major.code}, selectedChainIds:[] })
 assert.equal(state.initialized,true)
 assert.equal(state.matchingMode,'job-name')
 assert.ok(state.matchedJobs.length >= 12)
 assert.ok(state.matchedJobs.some(job => job.name === '政策研究助理'))
})
test('disabled fallback and invalid major cannot initialize', () => {
 assert.equal(sanitizeIndustryResearchStoredState(dataset, {initialized:true,officialMajor:{level:major.uiLevel,sourceLevel:major.sourceLevel,code:major.code}}).initialized,false)
 assert.equal(sanitizeIndustryResearchStoredState(dataset, {initialized:true, matchingMode:'job-name',officialMajor:{level:'undergraduate',code:'invalid'}}).initialized,false)
})
test('chain-backed majors reject job-name fallback without valid selected chains', () => {
 const m = dataset.majors.find(m=>m.name==='土木工程')
 const result = sanitizeIndustryResearchStoredState(dataset, {initialized:true,matchingMode:'job-name',officialMajor:{level:m.uiLevel,sourceLevel:m.sourceLevel,code:m.code},selectedChainIds:[]})
 assert.equal(result.initialized,false)
})
test('matching produces distinct occupation pools and handles missing major', () => {
 assert.deepEqual(globalThis.MAJOR_JOB_MATCHING.match(null),[])
 const education = globalThis.MAJOR_JOB_MATCHING.match({name:'学前教育',code:'040106'})
 assert.ok(education.some(job=>job.name==='幼儿教师'))
 assert.equal(education.some(job=>job.name==='BIM建模工程师'),false)
 assert.equal(new Set(education.map(job=>job.name)).size,education.length)
})
test('standalone readers and renderer restore job mode and drop chain switcher', () => {
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
 const code=html.slice(html.indexOf('        const readStaticJobNameState ='),html.indexOf('        const staticResearchUninitializedHtml ='))
 const context={MAJOR_JOB_MATCHING:globalThis.MAJOR_JOB_MATCHING,staticIndustryResearchStateKey:'test',staticEscapeText:s=>s,localStorage:{getItem:()=>JSON.stringify({initialized:true,matchingMode:'job-name',officialMajor:{name:major.name,code:major.code},selectedChainIds:[]})}}
 vm.createContext(context)
 vm.runInContext(code+'; globalThis.result = {ready: readStaticIndustryResearchInitialized(), html: staticMatchedMajorJobsHtml()}',context)
 assert.equal(context.result.ready,true)
 assert.match(context.result.html,/政策研究助理/)
 assert.doesNotMatch(context.result.html,/BIM建模/)
})
test('all static entry scripts parse and matching assets exist', () => {
 for(const file of ['index.html','industry-research-admin.html']){
  const html=readFileSync(new URL('../'+file,import.meta.url),'utf8')
  for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
   if(!/type="module"/.test(match[1])) new vm.Script(match[2],{filename:file})
  }
  const asset=html.match(/src="([^"]*major-job-matching.js)"/)[1]
  assert.ok(readFileSync(new URL(asset,new URL('../'+file,import.meta.url)),'utf8').includes('MAJOR_JOB_MATCHING'))
 }
})
test('matched occupations include stable simulated task and ability counts', () => {
 const jobs=globalThis.MAJOR_JOB_MATCHING.match(major)
 assert.ok(jobs.every(job=>Number.isInteger(job.taskCount) && job.taskCount > 0 && Number.isInteger(job.abilityCount) && job.abilityCount >= job.taskCount))
 assert.ok(new Set(jobs.map(job=>job.taskCount)).size > 1)
 assert.deepEqual(jobs,globalThis.MAJOR_JOB_MATCHING.match(major))
})
test('static job results use a three-column table', () => {
 const html=readFileSync(new URL('../industry-research-admin.html',import.meta.url),'utf8')
 assert.match(html,/<th[^>]*>岗位名称<\/th>/)
 assert.match(html,/<th[^>]*>岗位典型工作任务数<\/th>/)
 assert.match(html,/<th[^>]*>岗位能力项数<\/th>/)
 assert.match(html,/id="jobMatchLoading"[^>]*role="status"/)
})
test('per-job effectiveness survives stored-state normalization', () => {
 const jobs=globalThis.MAJOR_JOB_MATCHING.match(major)
 const state=sanitizeIndustryResearchStoredState(dataset,{initialized:true,matchingMode:'job-name',officialMajor:{level:major.uiLevel,sourceLevel:major.sourceLevel,code:major.code},disabledJobIds:[jobs[0].id]})
 assert.equal(state.matchedJobs[0].enabled,false)
 assert.equal(state.matchedJobs[1].enabled,true)
})
test('turning off matching cancels loading and cannot publish late results', () => {
 const html=readFileSync(new URL('../industry-research-admin.html',import.meta.url),'utf8')
 const cancel=html.match(/    const cancelJobMatching = \(\) => \{[\s\S]*?\n    \};/)[0]
 const handler=html.match(/    document.querySelector\('#jobNameMatching'\).addEventListener\('change', event => \{[\s\S]*?\n    \}\);/)[0]
 const timers=new Map();let next=0;let change
 const snapshots=[]
 const ctx={document:{querySelector:()=>({addEventListener:(_,fn)=>{change=fn}})},setTimeout:fn=>{timers.set(++next,fn);return next},clearTimeout:id=>timers.delete(id),snapshots}
 vm.createContext(ctx)
 vm.runInContext(`let jobMatchingLoading=false;let jobNameMatchingEnabled=false;let jobMatchingTimer;const activeChains=[];const confirmedInitMajor={name:'政治学与行政学'};const persistSelection=()=>snapshots.push({loading:jobMatchingLoading,enabled:jobNameMatchingEnabled});const render=()=>{};`+cancel+handler,ctx)
 change({target:{checked:true}})
 assert.equal(snapshots.at(-1).loading,true)
 assert.equal(timers.size,1)
 change({target:{checked:false}})
 assert.equal(timers.size,0)
 assert.equal(snapshots.at(-1).enabled,false)
 assert.equal(snapshots.at(-1).loading,false)
})
