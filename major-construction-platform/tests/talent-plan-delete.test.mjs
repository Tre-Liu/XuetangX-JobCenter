import test from 'node:test'
import assert from 'node:assert/strict'
await import('../src/talent-plan/data.js')
await import('../src/talent-plan/model.js')
await import('../src/talent-plan/views.js')
const M=globalThis.TalentPlanModel,V=globalThis.TalentPlanViews
let Workbench
const oldHTMLElement=globalThis.HTMLElement,oldElements=globalThis.customElements
 globalThis.HTMLElement=class{}
 globalThis.customElements={get:()=>false,define:(_name,cls)=>Workbench=cls}
await import('../src/talent-plan/element.js')
globalThis.HTMLElement=oldHTMLElement;globalThis.customElements=oldElements
const click=(el,action,id)=>el.click({target:{closest:()=>({dataset:{tp:action,id},disabled:false,matches:()=>false})},stopPropagation(){}})
const setup=()=>{
 const active=M.createDraft(),saved=M.createDraft(),result=M.snapshot(saved)
 active.source={text:'正文'}
 const state=M.sanitize({version:1,draft:active,drafts:[saved],results:[result]})
 let raw=JSON.stringify(state)
 const el=new Workbench();el.state=M.copy(state);el.storage={getItem:()=>raw,setItem:(_key,value)=>raw=value};el.lastSavedStamp=active.updatedAt
 el.contains=()=>true;el.render=()=>{};el.renderNotice=()=>{}
 return {el,active,saved,result,reload:()=>M.load(el.storage)}
}
test('all continuation cards expose separately labelled delete actions',()=>{
 const {el}=setup(),html=V.home(el)
 assert.equal((html.match(/data-tp="delete-plan"/g)||[]).length,4)
 assert.match(html,/aria-label="删除/)
})
test('cancel leaves all saved content intact',async()=>{
 const {el,reload}=setup(),before=JSON.stringify(el.state)
 const previous=globalThis.confirm;globalThis.confirm=()=>false
 try{await click(el,'delete-plan',el.state.draft.id);assert.equal(JSON.stringify(el.state),before);assert.equal(JSON.stringify(reload()),before)}finally{globalThis.confirm=previous}
})
test('confirmed deletion survives reload and stale-window saves without removing other plans',async()=>{
 const previous=globalThis.confirm;globalThis.confirm=()=>true
 try{
  for(const kind of ['active','saved','result','existing']){
   const {el,active,saved,result,reload}=setup(),stale=M.copy(el.state)
   const id=kind==='active'?active.id:kind==='saved'?saved.id:kind==='result'?result.id:'existing'
   await click(el,'delete-plan',id)
   const restored=reload(),merged=M.mergeState(stale,restored,active.updatedAt)
   for(const state of [restored,merged]){
    if(kind==='existing')assert.equal(state.existingPlanHidden,true)
    else {assert.notEqual(state.draft?.id,id);assert.ok(!state.drafts?.some(x=>x.id===id));assert.ok(!state.results.some(x=>x.id===id))}
    if(kind!=='result')assert.ok(state.results.some(x=>x.id===result.id))
    if(kind!=='active')assert.ok([state.draft,...(state.drafts||[])].some(x=>x?.id===active.id))
   }
   if(kind==='existing')assert.doesNotMatch(V.home({state:restored}),/class="tp-plan-card existing"/)
  }
 }finally{globalThis.confirm=previous}
})
test('storage failure preserves the card and reports the failed deletion',async()=>{
 const {el}=setup(),before=M.copy(el.state),previous=globalThis.confirm;globalThis.confirm=()=>true
 el.storage.setItem=()=>{throw new Error('quota')}
 try{await click(el,'delete-plan',el.state.draft.id);assert.deepEqual(el.state,before);assert.match(el.error,/删除未保存/)}finally{globalThis.confirm=previous}
})
