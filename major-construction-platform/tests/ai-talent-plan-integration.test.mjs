import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
await import('../src/talent-plan/data.js')
await import('../src/talent-plan/model.js')
await import('../src/talent-plan/richtext.js')
await import('../src/talent-plan/views.js')
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8')
const [app,html,bridge,files,config]=await Promise.all(['src/App.vue','index.html','src/components/TalentPlanWorkspace.vue','src/talent-plan/files.js','vite.config.ts'].map(read))
test('Vue and file entry use exactly the same workflow scripts and retain workflow navigation without the archive menu item',()=>{
 for(const file of ['data','model','purify','richtext','files','views','element']){
  assert.ok(html.includes(`./src/talent-plan/${file}.js`));assert.ok(bridge.includes(`../talent-plan/${file}.js`))
 }
 for(const entry of [app,html]){assert.match(entry,/AI人培修制定/);assert.doesNotMatch(entry,/方案版本与归档/);assert.match(entry,/建设成果/);assert.match(entry,/ai-talent-plan/)}
 assert.match(config,/document-readers|talentVendorOutput/)
})
test('static entry keeps syntactically valid executable scripts and emits shared workflow markup',()=>{
 for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script)
 const sandbox={};const start=html.indexOf("const talentSubsystemBody = (key = 'research') => {"),end=html.indexOf('const talentSubsystemHtml =',start)
 assert.ok(start>0 && end>start)
 vm.runInNewContext(html.slice(start,end)+";result=talentSubsystemBody('ai');archived=talentSubsystemBody('results')",sandbox)
 assert.match(sandbox.result,/<talent-plan-workbench mode="workbench"/);assert.match(sandbox.archived,/mode="results"/)
})
test('engineering renderer follows its chapter definitions and escapes user-entered names',()=>{
 const M=globalThis.TalentPlanModel,V=globalThis.TalentPlanViews,d=M.createDraft('standard');d.templateId='engineering-2024';d.name='<script>bad</script>';d.chapters=M.generate(d)
 const s={state:{version:1,draft:d,results:[]},queries:{},chapter:'requirements',panel:'refs'}
 const setup=V.setup(s),editor=V.editor(s)
 assert.match(setup,/工程教育认证导向本科框架/);assert.match(editor,/GR11/);assert.match(editor,/评价与持续改进/)
 assert.doesNotMatch(editor,/<script>bad/);assert.match(editor,/&lt;script&gt;bad/);assert.doesNotMatch(editor,/>职业面向</)
})
test('new workflow visible copy contains formal business terms without demo identity labels',()=>{
 const M=globalThis.TalentPlanModel,V=globalThis.TalentPlanViews,d=M.createDraft('standard');d.jobIds=['job-bim-deepening'];d.courseIds=['B261315'];d.relations=M.match(d);d.chapters=M.generate(d)
 const s={state:{version:1,draft:d,results:[]},queries:{},chapter:'goals',panel:'refs'}
 for(const render of [V.home,V.setup,V.jobs,V.courses,V.matrix,V.review,V.editor,V.results])assert.doesNotMatch(render(s),/演示|Demo|demo|模拟数据|示例数据|测试数据/)
})
test('document readers use untransformed public assets on HTTP and bundled vendor scripts for file entry',()=>{
 assert.match(files,/document-readers/);assert.match(files,/vendor\/talent-plan/);assert.match(files,/location.protocol==='file:'/)
})
