import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
await import('../src/talent-plan/data.js')
await import('../src/talent-plan/standards.js')
await import('../src/talent-plan/model.js')
await import('../src/talent-plan/views.js')
const M=globalThis.TalentPlanModel,V=globalThis.TalentPlanViews
let Workbench
globalThis.HTMLElement=class{}
globalThis.customElements={get:()=>false,define:(_name,cls)=>Workbench=cls}
await import('../src/talent-plan/element.js')
const change=(el,key,value)=>el.change({target:{dataset:{field:key},value,matches:()=>false}})
const panel=()=>{const el=new Workbench();el.state={draft:M.createDraft()};el.save=()=>{};el.render=()=>{};return el}
test('standard selectors filter by level, keep direction editable and lock the derived code',()=>{
 const d=M.createDraft(),html=V.setup({state:{draft:d}})
 for(const key of ['major','region'])assert.match(html,new RegExp('<select[^>]*data-field="'+key+'"'))
 assert.match(html,/<input[^>]*data-field="direction"/)
 assert.match(html,/<input[^>]*data-field="code"[^>]*readonly/)
 assert.ok(M.majorOptions(d).some(x=>x.name==='智能建造工程'&&x.code==='240302'))
 assert.ok(M.majorOptions({...d,level:'普通本科'}).every(x=>x.level==='普通本科'))
})
test('major selection derives code, invalid choices cannot write and level changes clear incompatible majors',()=>{
 const el=panel();change(el,'major','240301');assert.equal(el.draft.code,'240301');assert.equal(el.draft.major,'建筑工程')
 change(el,'major','not-in-catalog');assert.equal(el.draft.code,'240301')
 change(el,'region','北京市');assert.equal(el.draft.region,'北京市');change(el,'region','任意地区');assert.equal(el.draft.region,'北京市')
 change(el,'level','普通本科');assert.equal(el.draft.major,'');assert.equal(el.draft.code,'')
 change(el,'major','081008T');assert.equal(el.draft.major,'智能建造');assert.equal(el.draft.code,'081008T')
 change(el,'direction','学校自定方向');assert.equal(el.draft.direction,'学校自定方向')
})
test('both entries load the same standard fields before the model',async()=>{
 for(const path of ['index.html','src/components/TalentPlanWorkspace.vue']){
 const text=await readFile(new URL('../'+path,import.meta.url),'utf8');assert.ok(text.indexOf('talent-plan/standards.js')<text.indexOf('talent-plan/model.js')&&text.includes('talent-plan/standards.js'))
 }
})
