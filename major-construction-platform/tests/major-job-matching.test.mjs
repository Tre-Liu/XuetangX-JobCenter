import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { JSDOM } from '../../platform-cms/node_modules/jsdom/lib/api.js'
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
test('standalone readers restore initialized job-name mode', () => {
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
 const code=html.slice(html.indexOf('        const readStaticJobNameState ='),html.indexOf('        const staticResearchUninitializedHtml ='))
 const context={IndustryMajorSelection:globalThis.IndustryMajorSelection,window:{INDUSTRY_MAJOR_CHAIN_DATA:dataset},MAJOR_JOB_MATCHING:globalThis.MAJOR_JOB_MATCHING,staticIndustryResearchStateKey:'test',staticEscapeText:s=>s,localStorage:{getItem:()=>JSON.stringify({initialized:true,matchingMode:'job-name',officialMajor:{name:major.name,code:major.code,level:major.uiLevel,sourceLevel:major.sourceLevel},selectedChainIds:[]})}}
 context.IndustryCmsBridge = { read: () => JSON.parse(context.localStorage.getItem()) }
 vm.createContext(context)
 vm.runInContext(code+'; globalThis.result = {ready: readStaticIndustryResearchInitialized(), jobs: readStaticJobNameState().matchedJobs}',context)
 assert.equal(context.result.ready,true)
 assert.ok(context.result.jobs.some(job=>job.name === '政策研究助理'))
 assert.equal(context.result.jobs.some(job=>job.name.includes('BIM建模')),false)
})
test('all static entry scripts parse and matching assets exist', () => {
 for(const file of ['index.html','industry-research-admin.html']){
  const html=readFileSync(new URL('../'+file,import.meta.url),'utf8')
  for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
   if(!/type="module"/.test(match[1])) new vm.Script(match[2],{filename:file})
  }
  if (file === 'index.html') {
    const asset=html.match(/src="([^"]*major-job-matching.js)"/)[1]
    assert.ok(readFileSync(new URL(asset,new URL('../'+file,import.meta.url)),'utf8').includes('MAJOR_JOB_MATCHING'))
  }
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
test('generated compatibility CMS cancels actual pending matching when turned off', () => {
 const sourceUrl = new URL('../industry-research-admin.html', import.meta.url)
 const html = readFileSync(sourceUrl, 'utf8')
 const dom = new JSDOM(html, { url: 'https://school.test/industry-research-admin.html?entry=industry', runScripts: 'outside-only' })
 const timers = new Map(); let next = 0
 dom.window.setTimeout = fn => { timers.set(++next, fn); return next }
 dom.window.clearTimeout = id => timers.delete(id)
 dom.window.localStorage.setItem('major-construction-platform:industry-research', JSON.stringify({ officialMajor: { level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code }, selectedChainIds: [] }))
 try {
  for (const script of dom.window.document.scripts) {
    if (script.type === 'module') continue
    const code = script.hasAttribute('src') ? readFileSync(new URL(script.getAttribute('src'), sourceUrl), 'utf8') : script.textContent
    vm.runInContext(code, dom.getInternalVMContext())
  }
  const toggle = dom.window.document.querySelector('#jobNameMatching')
  toggle.click()
  assert.equal(dom.window.document.querySelector('#jobMatchLoading').hidden, false)
  assert.equal(timers.size, 1)
  toggle.click()
  assert.equal(timers.size, 0)
  assert.equal(dom.window.document.querySelector('#jobMatchLoading').hidden, true)
  assert.equal(dom.window.document.querySelector('#jobMatchResults').hidden, true)
 } finally { dom.window.close() }
})
test('job-name mode preserves all four original job analysis renderers', () => {
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
 const renderer=html.slice(html.indexOf("        const researchHtml = (tab = 'portrait')"),html.indexOf("        const industryHtml = (tab = 'chain')"))
 const context={researchTabs:[['portrait','岗位画像分析'],['demand','招聘需求趋势'],['forecast','新岗位新技术'],['analysis','岗培优化建议']],researchTabPurposes:{},demandHtml:()=>'<div>demand-original</div>',forecastBody:'<div>forecast-original</div>',staticAiAnalysisPageHtml:()=>'<div>analysis-original</div>',portraitBody:()=>'<div>portrait-original</div>',readStaticJobNameState:()=>({matchingMode:'job-name'}),staticMatchedMajorJobsHtml:()=>'<table>admin-only</table>',readStaticIndustryResearchInitialized:()=>true,staticResearchBriefHtml:()=>'',staticResearchUninitializedHtml:()=>'',staticCurrentIndustryChainTabs:()=>'',shellStart:()=>'',shellEnd:''}
 vm.createContext(context)
 vm.runInContext(renderer+`; globalThis.pages=['portrait','demand','forecast','analysis'].map(tab=>researchHtml(tab))`,context)
 for(const [i,name] of ['portrait','demand','forecast','analysis'].entries()) {
  assert.match(context.pages[i],new RegExp(name+'-original'))
  assert.doesNotMatch(context.pages[i],/admin-only/)
 }
})
