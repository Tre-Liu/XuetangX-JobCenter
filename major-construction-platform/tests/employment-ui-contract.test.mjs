import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import '../src/employment/data.js'
import '../src/employment/model.js'
import '../src/employment/views.js'
const D=globalThis.EmploymentData,M=globalThis.EmploymentModel,V=globalThis.EmploymentViews

const analysisPanel=state=>{
  const html=V.render({state:M.filters(state),drawer:false,notice:''})
  const panels=[...html.matchAll(/<section[^>]*data-ea-analysis[^>]*>([\s\S]*?)<\/section>/g)]
  assert.equal(panels.length,1,'each page exposes one AI analysis panel')
  return {html,panel:panels[0][0],text:panels[0][1].replace(/<[^>]+>/g,' ')}
}
test('each employment page starts with its own AI analysis before the detailed charts',()=>{
  const contents=new Set()
  for(const [page,title]of D.pages){
    const {html,panel,text}=analysisPanel({page})
    assert.ok(text.includes(title));assert.match(text,/AI 分析/)
    assert.equal([...panel.matchAll(/<li>/g)].length,4)
    assert.ok(html.indexOf(panel)<html.indexOf('class="ea-kpis"')||!html.includes('class="ea-kpis"'))
    assert.ok(html.indexOf(panel)<html.indexOf('class="ea-card '))
    assert.doesNotMatch(html,/区域产业与岗位连接|就业观察/)
    contents.add(panel.match(/<ul>[\s\S]*<\/ul>/)[0])
  }
  assert.equal(contents.size,6,'page changes select different business conclusions')
})
test('AI analysis follows the cohort and region while retaining the full-cohort retention denominator',()=>{
  const a=analysisPanel({page:'overview',year:'2023',region:'all'}).text
  const b=analysisPanel({page:'overview',year:'2022',region:'outside'}).text
  assert.match(a,/2023届/);assert.match(a,/全部地域/);assert.match(a,/54\.2%/)
  assert.match(b,/2022届/);assert.match(b,/区外/);assert.match(b,/53\.3%/)
  assert.notEqual(a,b)
  const city=analysisPanel({page:'region',year:'2023',city:'巴彦淖尔'}).text
  assert.match(city,/巴彦淖尔/);assert.match(city,/样本不足/)
  assert.doesNotMatch(city,/1\.9%/)
})
test('AI analysis withholds conclusions based on suppressed graduate or employer samples',()=>{
  const records=D.records,employers=D.employers
  try{
    D.records=records.filter(r=>r.year==='2023').slice(0,5)
    D.employers=[]
    for(const [page]of D.pages){
      const {panel}=analysisPanel({page,year:'2023'})
      assert.match(panel,/样本不足/)
      assert.doesNotMatch(panel,/\d+(?:\.\d+)?%|NaN|undefined|Infinity|—%/)
    }
  }finally{D.records=records;D.employers=employers}
})

test('all cohort, region and page combinations render formal business copy and finite values',()=>{
  for(const year of ['2021','2022','2023','all'])for(const region of ['all','inner','outside'])for(const [page]of D.pages){
    const html=V.render({state:M.filters({year,region,page}),drawer:false,notice:''})
    assert.doesNotMatch(html,/NaN|undefined|Infinity|模拟数据|示例数据|测试数据|演示|demo/i,year+region+page)
    assert.doesNotMatch(html,/重置筛选|测算口径 · 待核验/)
    assert.ok(M.pageRows(M.summarize({year,region,page})).length>8)
  }
})
test('small-city UI and CSV suppress the same numeric percentage',()=>{
  const state=M.filters({page:'region',year:'2023',city:'巴彦淖尔'})
  const html=V.render({state,drawer:false,notice:''})
  assert.match(html,/巴彦淖尔[\s\S]*?1<small>人<\/small><\/strong><em>—<\/em>/)
  assert.match(html,/当前盟市/)
  assert.equal(M.pageRows(M.summarize(state)).find(r=>r.label==='盟市就业占比：巴彦淖尔').value,null)
})
test('overview archive includes the cross-cohort records needed to reproduce every comparison',()=>{
  const a=M.archive({page:'overview',year:'2023',region:'outside'})
  assert.equal(a.records.length,120);assert.equal(a.selectedRecordIds.length,44)
  assert.equal(a.comparisonRecords.length,336)
  for(const year of ['2021','2022','2023']){
    const employed=a.comparisonRecords.filter(r=>r.year===year&&r.status==='在职')
    const expected=M.metric(employed.filter(r=>r.province==='内蒙古').length,employed.length)
    assert.equal(a.pageRows.find(r=>r.label===year+'届跨届对比：留蒙就业比例').value,expected.value)
  }
})

const controller=()=>{
  let C
  class Host{
    constructor(){this.attrs={};this.events=[];this.handlers={}}
    getAttribute(k){return this.attrs[k]||null}
    setAttribute(k,v){const old=this.attrs[k];this.attrs[k]=v;if(this.started)this.attributeChangedCallback(k,old,v)}
    addEventListener(k,v){this.handlers[k]=v}
    removeEventListener(k){delete this.handlers[k]}
    dispatchEvent(e){this.events.push(e)}
    querySelector(){return {focus(){}}}
  }
  const location={href:'http://localhost/index.html?view=employment-analysis&employmentPage=career&employmentYear=2022&employmentRegion=outside',get search(){return new URL(this.href).search}}
  const context={EmploymentData:D,EmploymentModel:M,EmploymentViews:V,HTMLElement:Host,customElements:{get(){return false},define(n,c){C=c}},URL,URLSearchParams,location,history:{replaceState(a,b,url){location.href=String(url)}},document:{title:''},CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail}},addEventListener(){},removeEventListener(){},setTimeout,clearTimeout,CSS:{escape:s=>s}}
  vm.runInNewContext(readFileSync(new URL('../src/employment/element.js',import.meta.url),'utf8'),context)
  const el=new C();el.connectedCallback();return {el,location,context}
}
test('controller restores filters, navigates, clears city on cohort changes and updates the URL',()=>{
  const {el,location}=controller()
  assert.equal(el.state.page,'career');assert.equal(el.state.year,'2022');assert.equal(el.state.region,'all')
  el.navigate('region');assert.equal(el.state.region,'all')
  el.update({city:'包头'});assert.equal(new URL(location.href).searchParams.get('employmentCity'),'包头')
  el.change({target:{dataset:{eaFilter:'year'},value:'2021'}})
  assert.equal(el.state.year,'2021');assert.equal(el.state.city,'')
  el.navigate('education');assert.equal(new URL(location.href).searchParams.get('employmentPage'),'education')
  el.disconnectedCallback();assert.equal(Object.keys(el.handlers).length,0)
})
test('Escape closes the method dialog and consumes its key event',()=>{
  const {el}=controller();let prevented=false
  el.showMethod();assert.equal(el.drawer,true);assert.match(el.innerHTML,/inert aria-hidden="true"/)
  el.key({key:'Escape',preventDefault(){prevented=true}})
  assert.equal(el.drawer,false);assert.equal(prevented,true);el.disconnectedCallback()
})
