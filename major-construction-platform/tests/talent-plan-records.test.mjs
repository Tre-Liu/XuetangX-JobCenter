import test from 'node:test'
import assert from 'node:assert/strict'
await import('../src/talent-plan/data.js')
await import('../src/talent-plan/model.js')
await import('../src/talent-plan/views.js')
const M=globalThis.TalentPlanModel,V=globalThis.TalentPlanViews
const leader={id:'lead-1',name:'专业负责人',role:'professional-lead'}
const member={id:'member-1',name:'专业成员',role:'member'}
const state=()=>({version:1,draft:M.createDraft('standard'),results:[]})
let Workbench
const fileBoundary={download(){},async exportDocx(){return new Blob(['document'])}}
globalThis.TalentPlanFiles=fileBoundary
globalThis.HTMLElement=class{}
globalThis.customElements={get:()=>false,define:(_name,cls)=>Workbench=cls}
await import('../src/talent-plan/element.js')
const click=(el,action,id)=>el.click({target:{closest:()=>({dataset:{tp:action,id},disabled:false,matches:()=>false})},stopPropagation(){}})
const panel=()=>{
 const el=new Workbench();el.state=state();let raw=JSON.stringify(el.state)
 el.storage={getItem:()=>raw,setItem:(_key,value)=>raw=value};el.lastSavedStamp=el.state.draft.updatedAt
 el.contains=()=>true;el.render=()=>{};el.renderNotice=()=>{};el.navigate=()=>{};el.querySelector=()=>null;el.getAttribute=()=>null
 return {el,reload:()=>M.load(el.storage)}
}

test('records migrate legacy operations without inventing actors or timestamps and keep more than 80 events',()=>{
 const d=M.createDraft();d.history=Array.from({length:95},(_,i)=>({title:'旧操作'+i,detail:'原始详情',at:'2026-10-01T00:00:00.000Z'}))
 const migrated=M.sanitize({version:1,draft:d,results:[]})
 assert.equal(typeof M.planRecord,'function')
 const activity=M.planRecord(migrated,d.id).activity
 assert.equal(activity.length,95);assert.deepEqual(activity[0].actor,{id:'',name:'',role:''});assert.equal(activity[0].at,d.history[0].at)
 assert.equal(M.actorLabel(activity[0].actor),'未记录')
 assert.equal(M.planRecord(M.sanitize(migrated),d.id).activity.length,95)
})

test('only a professional lead can create or edit a release note and each successful save records its actual actor',()=>{
 const s=state(),id=s.draft.id
 assert.equal(typeof M.saveRevision,'function')
 assert.throws(()=>M.saveRevision(s,id,{title:'变更说明',content:'课程调整'},member),/专业负责人/)
 assert.throws(()=>M.saveRevision(s,id,{title:' ',content:'课程调整'},leader),/标题/)
 assert.throws(()=>M.saveRevision(s,id,{title:'变更说明',content:' '},leader),/内容/)
 const note=M.saveRevision(s,id,{title:'课程结构优化',version:'2026.1',content:'新增实践课程'},leader)
 assert.equal(M.planRecord(s,id).revisionNotes.length,1)
 assert.equal(M.planRecord(s,id).activity[0].actor.id,leader.id)
 M.saveRevision(s,id,{...note,content:'新增实践课程，并调整学分',expectedUpdatedAt:note.updatedAt},leader)
 assert.equal(M.planRecord(s,id).revisionNotes.length,1)
 assert.equal(M.planRecord(s,id).activity.length,2)
 assert.equal(M.planRecord(s,id).activity.at(-1).before.content,'新增实践课程')
 assert.equal(M.planRecord(M.sanitize(s),id).revisionNotes[0].content,'新增实践课程，并调整学分')
})

test('existing-plan metadata persists independently and operation filters stay inside the requested plan',()=>{
 const s=state(),id=s.draft.id
 assert.equal(typeof M.appendActivity,'function')
 M.saveRevision(s,'existing',{title:'原方案修订说明',content:'补充课程考核要求'},leader)
 M.appendActivity(s,id,{type:'import',action:'解析本地人才培养方案',module:'方案解析',object:'培养方案.pdf',detail:'识别 3 个章节'},member)
 M.appendActivity(s,id,{type:'edit',action:'修改方案信息',module:'方案解析',object:'方案名称',before:'旧名',after:'新名'},leader)
 assert.equal(M.activityList(s,id,{keyword:'培养方案.pdf',type:'import'}).length,1)
 assert.equal(M.activityList(s,id,{keyword:'培养方案.pdf',type:'edit'}).length,0)
 assert.equal(M.activityList(s,'existing',{}).length,1)
 assert.equal(M.planRecord(M.sanitize(s),'existing').revisionNotes.length,1)
})

test('merging windows unions event identities and preserves deleted-plan records without leaking them to another plan',()=>{
 const original=state(),id=original.draft.id,left=M.copy(original),right=M.copy(original)
 assert.equal(typeof M.appendActivity,'function')
 M.appendActivity(left,id,{type:'edit',action:'修改章节',module:'方案正文',object:'培养目标'},leader)
 M.appendActivity(right,id,{type:'import',action:'导入方案',module:'方案解析',object:'文件'},member)
 const merged=M.mergeState(left,right,left.draft.updatedAt)
 assert.equal(M.activityList(merged,id,{}).length,2)
 assert.equal(M.activityList(M.mergeState(merged,right,merged.draft.updatedAt),id,{}).length,2)
 right.deletedPlanIds=[id];right.draft=null
 const deleted=M.mergeState(merged,right,merged.draft.updatedAt)
 assert.equal(deleted.draft,null);assert.equal(M.activityList(deleted,id,{}).length,2)
 const next=M.createDraft();deleted.draft=next;assert.equal(M.activityList(deleted,next.id,{}).length,0)
})

test('all four card kinds have release notes and recent activity with escaped content and honest empty states',()=>{
 const s=state();s.drafts=[M.createDraft()];s.results=[M.snapshot(s.draft)]
 assert.equal(typeof M.appendActivity,'function')
 for(let i=0;i<3;i++)M.appendActivity(s,s.draft.id,{type:'edit',action:'操作'+i,module:'正文',detail:'<script>bad</script>'},leader)
 const html=V.home({state:s,identity:leader})
 assert.equal((html.match(/data-tp="open-revisions"/g)||[]).length,4)
 assert.equal((html.match(/data-tp="open-activity"/g)||[]).length,4)
 assert.match(html,/暂无操作记录/);assert.doesNotMatch(html,/操作0/);assert.match(html,/操作2/)
 assert.doesNotMatch(html,/<script>bad<\/script>/)
})

test('release-note dialog exposes editing only to the responsible role while operation records remain read only',()=>{
 const s=state();assert.equal(typeof V.recordDialog,'function')
 M.saveRevision(s,s.draft.id,{title:'优化内容',content:'新增实践课程'},leader)
 const base={state:s,recordDialog:{kind:'revisions',planId:s.draft.id},recordError:''}
 const editable=V.recordDialog({...base,identity:leader}),readonly=V.recordDialog({...base,identity:member})
 assert.match(editable,/data-tp="new-revision"/);assert.match(editable,/data-tp="edit-revision"/)
 assert.doesNotMatch(readonly,/data-tp="(?:new|edit|save)-revision"/);assert.match(readonly,/只读/)
 const activity=V.recordDialog({...base,identity:leader,recordDialog:{kind:'activity',planId:s.draft.id,keyword:'',type:''}})
 assert.match(activity,/data-record-search/);assert.match(activity,/data-record-filter/);assert.doesNotMatch(activity,/data-tp="save-revision"/)
 for(const html of [editable,readonly,activity])assert.doesNotMatch(html,/演示|Demo|demo|模拟数据|示例数据|测试数据/)
})

test('revision save rejects direct member actions and rolls back note and activity if storage fails',async()=>{
 const {el,reload}=panel(),id=el.draft.id
 el.recordDialog={kind:'revisions',planId:id};el.revisionDraft={title:'修订说明',content:'课程变化',version:''};el.identityContext=member
 await click(el,'save-revision');assert.equal(M.planRecord(reload(),id).revisionNotes.length,0);assert.match(el.recordError,/专业负责人/)
 el.identityContext=leader;el.storage.setItem=()=>{throw new Error('quota')}
 await click(el,'save-revision');assert.equal(M.planRecord(el.state,id).revisionNotes.length,0);assert.equal(M.planRecord(el.state,id).activity.length,0);assert.ok(el.revisionDraft);assert.match(el.recordError,/未保存/)
})

test('successful revision saves persist without changing an unrelated active draft and stale editors cannot overwrite',async()=>{
 const {el,reload}=panel(),stamp=el.draft.updatedAt
 el.recordDialog={kind:'revisions',planId:'existing'};el.revisionDraft={title:'修订说明',content:'课程变化',version:''}
 await click(el,'save-revision')
 assert.equal(M.planRecord(reload(),'existing').revisionNotes.length,1);assert.equal(el.draft.updatedAt,stamp)
 const note=M.planRecord(el.state,'existing').revisionNotes[0]
 el.revisionDraft={...note,expectedUpdatedAt:'2000-01-01T00:00:00.000Z',content:'旧窗口修改'}
 await click(el,'save-revision');assert.match(el.recordError,/另一窗口/);assert.equal(M.planRecord(reload(),'existing').revisionNotes[0].content,'课程变化')
})

test('plan creation, field edits and job association log once after success; reads and no-op field changes do not',async()=>{
 const {el,reload}=panel();el.start('standard');const id=el.draft.id
 assert.equal(M.activityList(reload(),id,{}).length,1)
 const change=(field,value)=>el.change({target:{dataset:{field},value,matches:()=>false}})
 change('name','新方案');change('name','新方案')
 el.change({target:{dataset:{job:'job-bim-deepening'},type:'checkbox',checked:true,matches:()=>false}})
 assert.deepEqual(M.activityList(reload(),id,{}).map(a=>a.type).sort(),['associate','create','edit'])
 await click(el,'open-activity',id);assert.equal(M.activityList(reload(),id,{}).length,3)
})

test('deletion preserves the deleted plan audit trail without attributing deletion to the active draft',async()=>{
 const {el,reload}=panel(),active=el.draft.id,other=M.createDraft();el.state.drafts=[other]
 const previous=globalThis.confirm;globalThis.confirm=()=>true
 try{await click(el,'delete-plan',other.id)}finally{globalThis.confirm=previous}
 assert.equal(M.activityList(reload(),other.id,{}).at(0)?.type,'delete')
 assert.equal(M.activityList(reload(),active,{}).length,0)
})

test('saving release notes cannot record a failed unrelated content operation as successful',async()=>{
 const {el,reload}=panel(),id=el.draft.id,write=el.storage.setItem
 el.storage.setItem=()=>{throw new Error('quota')}
 el.change({target:{dataset:{field:'name'},value:'尚未保存的方案名',matches:()=>false}})
 assert.equal(M.activityList(reload(),id,{}).length,0)
 el.storage.setItem=write;el.recordDialog={kind:'revisions',planId:'existing'};el.revisionDraft={title:'修订说明',content:'本次调整',version:''}
 await click(el,'save-revision')
 assert.equal(M.activityList(reload(),id,{}).length,0)
 assert.notEqual(reload().draft.name,'尚未保存的方案名')
 assert.equal(M.activityList(reload(),'existing',{}).length,1)
})

test('archives and resumed revisions have independent records with explicit source links',async()=>{
 const {el,reload}=panel(),id=el.draft.id
 el.draft.chapters=M.generate(el.draft);el.draft.generated=true
 M.appendActivity(el.state,id,{type:'edit',action:'调整培养目标',module:'方案正文'},leader)
 await click(el,'publish')
 const archived=el.state.results[0]
 assert.equal(M.planRecord(reload(),archived.id).sourcePlanId,id)
 assert.equal(M.activityList(reload(),archived.id,{}).length,1)
 assert.equal(M.activityList(reload(),archived.id,{keyword:'调整培养目标'}).length,0)
 el.viewResult=archived;await click(el,'revise-result')
 assert.notEqual(el.draft.id,id);assert.notEqual(el.draft.id,archived.id)
 assert.equal(M.planRecord(reload(),el.draft.id).sourcePlanId,archived.id)
 assert.equal(M.activityList(reload(),el.draft.id,{}).length,1)
 assert.equal(M.activityList(reload(),archived.id,{}).length,1)
})

test('multiple body inputs are grouped into one completed edit and persist the original and final text',async()=>{
 const {el,reload}=panel(),id=el.draft.id;el.chapter='goals';el.editing=true;el.draft.chapters.goals='原文'
 const input=value=>el.input({target:{dataset:{},matches:selector=>selector==='[data-editor]',isContentEditable:false,value}})
 input('第一段');input('第一段和第二段');clearTimeout(el.saveTimer)
 assert.equal(M.activityList(el.state,id,{}).length,0)
 await click(el,'toggle-edit')
 const activity=M.activityList(reload(),id,{type:'edit'})
 assert.equal(activity.length,1);assert.equal(activity[0].before.正文,'原文');assert.equal(activity[0].after.正文,'第一段和第二段')
})

test('Escape closes the record dialog and returns focus to its own card action',()=>{
 const {el}=panel(),id=el.draft.id;let focused=false,prevented=false
 el.recordDialog={kind:'revisions',planId:id};el.recordReturn={action:'open-revisions',id};el.revisionDraft={title:'未保存'}
 el.querySelectorAll=()=>[{dataset:{tp:'open-revisions',id},focus(){focused=true}}]
 el.keydown({key:'Escape',preventDefault(){prevented=true}})
 assert.equal(el.recordDialog,null);assert.equal(el.revisionDraft,null);assert.ok(focused);assert.ok(prevented)
})

test('host identity changes enforce the member restriction and fixed contexts hide the preview switch',()=>{
 const {el}=panel();const attrs={'actor-id':'teacher-12','actor-name':'任课教师','actor-role':'member','identity-preview':'false'}
 el.getAttribute=key=>attrs[key]||null;el.recordDialog={kind:'revisions',planId:el.draft.id}
 assert.equal(el.identity.id,'teacher-12');assert.equal(M.canEditRevisions(el.identity),false)
 const html=V.recordDialog(el);assert.doesNotMatch(html,/data-record-role/);assert.doesNotMatch(html,/data-tp="new-revision"/);assert.match(html,/任课教师/)
 el.change({target:{value:'professional-lead',dataset:{},matches:selector=>selector==='[data-record-role]'}})
 assert.equal(el.identity.role,'member')
})

test('a concurrent content branch keeps its completed edit and archive provenance on the new branch',async()=>{
 const {el,reload}=panel();el.chapter='goals';el.draft.chapters=M.generate(el.draft);el.draft.generated=true;el.draft.chapters.goals='共同原文';el.save()
 const oldId=el.draft.id;el.trackChapterChange();el.draft.chapters.goals='本窗口内容'
 const remote=reload();remote.draft.chapters.goals='另一窗口内容';remote.draft.updatedAt='2030-01-01T00:00:00.000Z';el.storage.setItem(M.storageKey,JSON.stringify(remote))
 assert.equal(el.save(),true);const branchId=el.draft.id;assert.notEqual(branchId,oldId)
 el.flushChapterActivity();el.save()
 assert.equal(M.activityList(reload(),oldId,{keyword:'保存章节编辑'}).length,0)
 assert.equal(M.activityList(reload(),branchId,{keyword:'保存章节编辑'})[0].after.正文,'本窗口内容')
 const nextRemote=reload();nextRemote.draft.updatedAt='2031-01-01T00:00:00.000Z';nextRemote.draft.chapters.goals='再次远端更新';el.storage.setItem(M.storageKey,JSON.stringify(nextRemote))
 await click(el,'publish')
 const archived=el.state.results.at(-1)
 assert.equal(archived.chapters.goals,'本窗口内容');assert.equal(M.planRecord(reload(),archived.id).sourcePlanId,el.draft.id)
 assert.equal(M.activityList(reload(),archived.id,{})[0].before.来源方案,el.draft.id)
})

test('failed deletion restores pending changes so a later successful save retains their audit events',async()=>{
 const {el,reload}=panel(),id=el.draft.id,other=M.createDraft(),write=el.storage.setItem;el.state.drafts=[other]
 el.storage.setItem=()=>{throw new Error('quota')}
 el.change({target:{dataset:{field:'name'},value:'待重试保存',matches:()=>false}})
 const previous=globalThis.confirm;globalThis.confirm=()=>true
 try{await click(el,'delete-plan',other.id)}finally{globalThis.confirm=previous}
 el.storage.setItem=write;el.save()
 assert.equal(reload().draft.name,'待重试保存');assert.equal(M.activityList(reload(),id,{type:'edit'}).length,1)
 assert.equal(M.activityList(reload(),other.id,{type:'delete'}).length,0)
})

test('reopening a stale revision refreshes the note so a user can resolve an edit conflict',async()=>{
 const {el,reload}=panel();M.saveRevision(el.state,'existing',{title:'原始标题',content:'原文'},leader);el.save()
 const old=M.planRecord(el.state,'existing').revisionNotes[0]
 const remote=reload();M.saveRevision(remote,'existing',{...old,content:'远端新内容'},leader);el.storage.setItem(M.storageKey,JSON.stringify(remote))
 el.recordDialog={kind:'revisions',planId:'existing'};el.revisionDraft={...old,content:'本地修改',expectedUpdatedAt:old.updatedAt};await click(el,'save-revision')
 assert.match(el.recordError,/另一窗口/)
 await click(el,'open-revisions','existing');await click(el,'edit-revision',old.id)
 assert.equal(el.revisionDraft.content,'远端新内容')
 el.revisionDraft.content='合并后的内容';await click(el,'save-revision')
 assert.equal(M.planRecord(reload(),'existing').revisionNotes[0].content,'合并后的内容')
})

test('identity switches close an editing batch under its original actor before recording the next member change',()=>{
 const {el,reload}=panel(),id=el.draft.id;el.chapter='goals';el.identityContext=leader;el.draft.chapters.goals='原文'
 el.trackChapterChange();el.draft.chapters.goals='负责人修改';el.save()
 el.change({target:{value:'member',dataset:{},matches:selector=>selector==='[data-record-role]'}})
 const first=M.activityList(reload(),id,{type:'edit'})[0]
 assert.equal(first?.actor.id,'lead-1');assert.equal(first.after.正文,'负责人修改')
 el.trackChapterChange();el.draft.chapters.goals='成员后续修改';el.flushChapterActivity();el.save()
 const second=M.activityList(reload(),id,{type:'edit'})[0]
 assert.equal(second.actor.role,'member');assert.equal(second.before.正文,'负责人修改')
})

test('asynchronous Word export keeps its initiating actor even if the visible identity changes before completion',async()=>{
 const {el,reload}=panel(),id=el.draft.id;el.identityContext=leader;el.draft.chapters=M.generate(el.draft);el.save()
 const previous=fileBoundary.exportDocx;let complete
 fileBoundary.exportDocx=()=>new Promise(resolve=>{complete=resolve})
 try{
  const pending=click(el,'export-docx')
  el.identityContext=member;complete(new Blob(['document']));await pending
  const activity=M.activityList(reload(),id,{type:'export'})
  assert.equal(activity.length,1);assert.equal(activity[0].actor.id,'lead-1');assert.equal(activity[0].actor.role,'professional-lead')
 }finally{fileBoundary.exportDocx=previous}
})

test('operation details show readable business changes without exposing storage identifiers or altering archive data',()=>{
 const s=state(),actor={id:'local-professional-lead',name:'专业负责人',role:'professional-lead'}
 M.saveRevision(s,'existing',{title:'课程修订',version:'2026版',content:'新增实践课程'},actor)
 const job=globalThis.TalentPlanData.jobs[0],course=globalThis.TalentPlanData.courses[0]
 M.appendActivity(s,'existing',{type:'associate',action:'确认课程关系',module:'课程设置',before:{sourcePlanId:s.draft.id},after:{jobId:job.id,courseId:course.id,abilityIds:[job.abilities[0].id],confirmed:true}},actor)
 const original=JSON.stringify(M.planRecord(s,'existing'))
 const html=V.recordDialog({state:s,identity:actor,recordDialog:{kind:'activity',planId:'existing',keyword:'',type:''}})
 const visible=html.replace(/<[^>]*>/g,'')
 for(const label of ['修订标题：课程修订','适用版本：2026版','修订内容：新增实践课程','来源方案：'+s.draft.name,'岗位：'+job.name,'课程：'+course.name,'已确认：是'])assert.ok(visible.includes(label),label)
 assert.match(visible,new RegExp(job.abilities[0].name))
 assert.doesNotMatch(visible,/记录编号|方案编号|操作人标识|activity-|local-professional-lead|sourcePlanId|jobId|courseId|abilityIds|"title"|"version"|"content"/)
 assert.equal(JSON.stringify(M.planRecord(s,'existing')),original)
 assert.match(original,/local-professional-lead/);assert.match(original,/activity-/)
})

test('initial revision notes populate existing plans once without overwriting authored notes or fabricating activity',()=>{
 const s=state();delete s.draft.revisionNotesPolicy
 const old=M.createDraft();delete old.revisionNotesPolicy;s.drafts=[old];s.results=[{...M.snapshot(old),savedAt:'2026-03-01T00:00:00.000Z'}]
 M.saveRevision(s,'existing',{title:'用户保留的说明',content:'已确认内容'},leader)
 const before=M.copy(M.planRecord(s,'existing')),ids=['existing',s.draft.id,old.id,s.results[0].id]
 assert.equal(typeof M.initializeRevisionNotes,'function')
 assert.equal(M.initializeRevisionNotes(s),true)
 for(const id of ids){const record=M.planRecord(s,id);assert.equal(record.revisionNotes.filter(n=>n.provenance?.kind==='generated-revision-scenario').length,3);assert.equal(record.activity.length,id==='existing'?1:0)}
 assert.ok(M.planRecord(s,s.results[0].id).revisionNotes.every(n=>Date.parse(n.createdAt)<Date.parse(s.results[0].savedAt)))
 assert.deepEqual(M.planRecord(s,'existing').revisionNotes[0],before.revisionNotes[0])
 const restored=M.sanitize(s);assert.equal(M.initializeRevisionNotes(restored),false)
 assert.equal(M.planRecord(restored,'existing').revisionNotes.length,4)
 assert.ok(M.planRecord(restored,s.draft.id).revisionNotes.every(n=>n.createdBy.name&&n.version&&n.createdAt&&n.content))
 assert.doesNotMatch(M.planRecord(restored,s.draft.id).revisionNotes.map(n=>[n.title,n.version,n.content,n.createdBy.name].join(' ')).join(' '),/演示|Demo|demo|模拟|示例|测试数据/)
})

test('new blank drafts and subsequent plans do not acquire generated revision history after refresh or stale merges',()=>{
 const s=state(),newId=s.draft.id
 assert.equal(typeof M.initializeRevisionNotes,'function')
 assert.equal(M.initializeRevisionNotes(s),true)
 assert.equal(M.planRecord(s,newId).revisionNotes.length,0)
 const stale=M.copy(s);delete stale.revisionNoteSeedVersion
 const later=M.createDraft();s.draft=later
 const merged=M.mergeState(s,stale,later.updatedAt),restored=M.sanitize(merged)
 assert.equal(restored.revisionNoteSeedVersion,1);assert.equal(M.initializeRevisionNotes(restored),false)
 assert.equal(M.planRecord(restored,later.id).revisionNotes.length,0)
})

test('generated notes stay editable by the lead with provenance retained and only actual edits add activity',()=>{
 const s=state();assert.equal(typeof M.initializeRevisionNotes,'function');M.initializeRevisionNotes(s)
 const seeded=M.planRecord(s,'existing').revisionNotes[0],before=M.copy(seeded.provenance)
 assert.throws(()=>M.saveRevision(s,'existing',{...seeded,content:'成员不能修改'},member),/专业负责人/)
 M.saveRevision(s,'existing',{...seeded,content:'负责人补充的修订范围'},leader)
 const restored=M.sanitize(s),note=M.planRecord(restored,'existing').revisionNotes.find(n=>n.id===seeded.id)
 assert.deepEqual(note.provenance,before);assert.equal(note.content,'负责人补充的修订范围')
 assert.equal(M.activityList(restored,'existing',{}).length,1)
 assert.equal(M.activityList(restored,'existing',{})[0].actor.id,'lead-1')
})

test('shared workbench initializes and persists existing release notes once without changing plan content',()=>{
 const s=state();delete s.draft.revisionNotesPolicy
 let raw=JSON.stringify(s),writes=0
 const prior={storage:globalThis.localStorage,add:globalThis.addEventListener,remove:globalThis.removeEventListener}
 globalThis.localStorage={getItem:()=>raw,setItem:(_key,value)=>{raw=value;writes++}}
 globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{}
 const open=()=>{const el=new Workbench();el.getAttribute=()=>null;el.addEventListener=()=>{};el.render=()=>{};el.connectedCallback();return el}
 try{
  const el=open(),planBefore=M.sanitize(s).draft
  assert.equal(M.planRecord(el.state,s.draft.id).revisionNotes.length,3)
  assert.deepEqual(el.state.draft,planBefore);assert.equal(M.activityList(el.state,s.draft.id).length,0)
  open();assert.equal(writes,1);assert.equal(M.load(globalThis.localStorage).revisionNoteSeedVersion,1)
 }finally{globalThis.localStorage=prior.storage;globalThis.addEventListener=prior.add;globalThis.removeEventListener=prior.remove}
})

test('missing revision source data leaves initialization pending for the next valid load',()=>{
 const s=state(),data=globalThis.TalentPlanData,presets=data.revisionNotePresets
 try{
  delete data.revisionNotePresets
  assert.equal(M.initializeRevisionNotes(s),false);assert.equal(s.revisionNoteSeedVersion,undefined)
 }finally{data.revisionNotePresets=presets}
 assert.equal(M.initializeRevisionNotes(s),true);assert.equal(M.planRecord(s,'existing').revisionNotes.length,3)
})

test('an initialization marker without any generated notes recovers eligible plans without changing authored records or activity',()=>{
 const s=state();delete s.draft.revisionNotesPolicy;s.revisionNoteSeedVersion=1
 M.saveRevision(s,'existing',{title:'已有修订说明',content:'保留已填写内容'},leader)
 const before=M.copy(M.planRecord(s,'existing'))
 assert.equal(M.initializeRevisionNotes(s),true)
 assert.equal(M.planRecord(s,'existing').revisionNotes.length,4)
 assert.deepEqual(M.planRecord(s,'existing').revisionNotes[0],before.revisionNotes[0])
 assert.deepEqual(M.planRecord(s,'existing').activity,before.activity)
 assert.equal(M.planRecord(s,s.draft.id).revisionNotes.length,3)
 assert.equal(M.initializeRevisionNotes(s),false)
 const fresh=state();fresh.revisionNoteSeedVersion=1;fresh.existingPlanHidden=true
 assert.equal(M.initializeRevisionNotes(fresh),false)
 const partial=state();partial.revisionNoteSeedVersion=1;partial.planRecords={existing:M.copy(M.planRecord(s,'existing'))}
 delete partial.draft.revisionNotesPolicy
 assert.equal(M.initializeRevisionNotes(partial),false);assert.equal(M.planRecord(partial,partial.draft.id).revisionNotes.length,0)
})
