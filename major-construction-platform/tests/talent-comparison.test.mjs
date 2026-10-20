import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
await import('../src/talent-plan/data.js')
await import('../src/talent-plan/model.js')
await import('../src/talent-compare/research-data.js')
await import('../src/talent-compare/model.js')
await import('../src/talent-compare/icons.js')
await import('../src/talent-compare/views.js')
const C = globalThis.TalentComparisonModel
const plans = globalThis.TalentPlanResearchData.plans

test('comparison uses the complete research catalog and searches school, major and year', () => {
  assert.equal(plans.length, 6)
  assert.equal(C.filterPlans(plans, '沈阳 2025', '').length, 1)
  assert.equal(C.filterPlans(plans, '沈阳', '高职专科').length, 0)
  assert.equal(C.filterPlans(plans, '', '高职专科').length, 4)
})
test('selection has two ordered roles and never duplicates or silently replaces a plan', () => {
  assert.deepEqual(C.toggleSelection(['a'], 'b'), ['a', 'b'])
  assert.deepEqual(C.toggleSelection(['a', 'b'], 'c'), ['a', 'b'])
  assert.deepEqual(C.toggleSelection(['a', 'b'], 'a'), ['b'])
  assert.match(C.validate(plans[0], plans[0]), /同一/)
  assert.match(C.validate(plans[0], undefined), /选择/)
})
test('report changes with both selected records and preserves direction and provenance', () => {
  const a = C.buildReport(plans[0], plans[1]), b = C.buildReport(plans[2], plans[3])
  assert.equal(a.source.id, plans[0].id)
  assert.equal(a.target.id, plans[1].id)
  assert.notDeepEqual(a.metrics, b.metrics)
  assert.match(a.basis, /测算/)
  assert.ok(a.sections.goals.differences.length)
  assert.equal(C.buildReport(plans[1], plans[0]).metrics.credits.delta, -a.metrics.credits.delta)
})
test('missing numeric values remain unavailable while a valid zero remains zero', () => {
  const a = { id: 'local', name: '本地方案', profile: { goals: ['目标'], requirements: [], indicators: null, courses: [{name:'课程A',credits:null,category:'专业核心课程',semester:null}] } }
  const b = { id: 'zero', name: '零学分方案', profile: { goals: [], requirements: [], indicators: 0, courses: [{name:'课程A',credits:0,category:'专业核心课程',semester:0}] } }
  const r = C.buildReport(a,b)
  assert.equal(r.metrics.credits.source, null)
  assert.equal(r.metrics.credits.target, 0)
  assert.equal(r.metrics.credits.delta, null)
  assert.equal(C.formatValue(null), '未提取')
  assert.equal(C.formatValue(0), '0')
})
test('national standard uses the saved official text and warns on level mismatch', () => {
  const standard = C.standards[0]
  assert.equal(standard.code, '440304')
  assert.equal(standard.profile.requirements.length, 16)
  assert.equal(standard.profile.courses.length, 7)
  assert.equal(C.buildReport(plans[0],standard).metrics.credits.target,null)
  assert.match(C.buildReport(plans[0],standard).applicability, /高职专科/)
  assert.ok(standard.url.startsWith('https://www.moe.gov.cn/'))
})
test('local text uses real parsed chapters and does not fabricate credits', () => {
  const record = C.fromParsed({fileName:'本地方案.txt',text:'培养目标\n能够掌握BIM建模。\n毕业要求\n1.具备团队协作能力。\n2.具备创新意识。\n课程设置\n建筑信息模型应用'}, 1)
  assert.equal(record.name, '本地方案')
  assert.equal(record.profile.goals.length,1)
  assert.equal(record.profile.requirements.length,2)
  assert.equal(C.buildReport(record,plans[0]).metrics.credits.source,null)
  assert.equal(C.buildReport(record,plans[0]).metrics.core.source,null)
  assert.deepEqual(C.buildReport(record,plans[0]).changes,{added:[],removed:[]})
  assert.match(C.buildReport(record,plans[0]).sections.core.join(''),/未提取/)
})
test('HTML export escapes input, contains every report section and source limits', () => {
  const r = C.buildReport({...plans[0],name:'<script>alert(1)</script>'},plans[1])
  const html=C.exportHtml(r)
  assert.doesNotMatch(html, /<script>alert/)
  assert.match(html,/&lt;script&gt;/)
  for(const text of ['培养目标分析','毕业要求分析','课程学分变化趋势','核心课程分析','整体分析','测算']) assert.ok(html.includes(text))
})
test('shared renderer covers all report charts and keeps visible copy formal', () => {
  const V=globalThis.TalentComparisonViews
  const state={selected:[],standardId:'',mode:'plan',query:'',level:'',uploads:[],message:''}
  const empty=V.selection(state)
  assert.match(empty,/开始分析对比/)
  assert.match(empty,/data-tc="start"[^>]*disabled/)
  assert.match(empty,/与国标比对/)
  state.report=C.buildReport(plans[0],plans[1])
  const html=V.report(state)
  for(const chart of ['radar','requirements','total','categories','core']) assert.ok(html.includes(`data-chart="${chart}"`))
  assert.equal((html.match(/data-section=/g)||[]).length,6)
  assert.match(html,/相同点/)
  assert.match(html,/差异点/)
  for(const page of [empty,html,V.history([]),V.details(state.report,'source')])assert.doesNotMatch(page,/演示|demo|模拟数据|示例数据|测试数据/i)
})
test('corrupted saved reports are excluded before they reach the renderer',()=>{
  assert.deepEqual(C.readHistory('[{"id":"bad","source":{},"a":{}}]'),[])
  assert.deepEqual(C.readHistory('not json'),[])
  const r=C.buildReport(plans[0],plans[1])
  assert.equal(C.readHistory(JSON.stringify([r])).length,1)
  assert.deepEqual(C.readHistory(JSON.stringify([{...r,sections:{}}])),[])
  assert.deepEqual(C.readHistory(JSON.stringify([{...r,schemaVersion:0}])),[])
})
test('Chinese IME composition is not interrupted by filtering rerenders',async()=>{
  let Controller
  const sandbox={HTMLElement:class{},TalentComparisonModel:C,TalentComparisonViews:globalThis.TalentComparisonViews,customElements:{get(){return false},define(name,type){Controller=type}}}
  vm.runInNewContext(await readFile(new URL('../src/talent-compare/element.js',import.meta.url),'utf8'),sandbox)
  const element=new Controller();let renders=0
  element.render=()=>{renders++};element.querySelector=()=>null
  const target={matches:()=>true,value:'shen',selectionStart:4}
  element.onInput({target,isComposing:true})
  assert.equal(renders,0)
  target.value='沈阳';element.onInput({target,isComposing:false,type:'compositionend'})
  assert.equal(renders,1)
  assert.equal(element.state.query,'沈阳')
})
test('identical uploaded content does not produce invented directional differences',()=>{
  const a=C.fromParsed({fileName:'甲.txt',text:'培养目标\n具有职业素养、创新意识和质量管理能力。\n毕业要求\n掌握专业知识。'},1)
  const b={...a,id:'upload-2',name:'乙'}
  const r=C.buildReport(a,b)
  assert.match(r.sections.goals.differences[0],/未识别到.*差异/)
  assert.doesNotMatch(r.sections.goals.differences[0],/更突出/)
})
test('Vue and standalone mount the shared comparison renderer', async () => {
  const read = f => readFile(new URL('../'+f,import.meta.url),'utf8')
  const [app,html,bridge] = await Promise.all(['src/App.vue','index.html','src/components/TalentComparison.vue'].map(read))
  assert.match(app, /<TalentComparison/)
  assert.match(html, /<talent-comparison/)
  for(const file of ['research-data','model','icons','views','element']) {
    assert.ok(html.includes(`./src/talent-compare/${file}.js`))
    assert.ok(bridge.includes(`../talent-compare/${file}.js`))
  }
})
