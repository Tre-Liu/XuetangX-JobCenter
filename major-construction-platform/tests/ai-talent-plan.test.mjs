import test from 'node:test'
import assert from 'node:assert/strict'
await import('../src/talent-plan/data.js')
await import('../src/talent-plan/model.js')
const M = globalThis.TalentPlanModel, D = globalThis.TalentPlanData
const draft = () => { const d=M.createDraft('existing'); d.jobIds=D.jobs.slice(0,2).map(j=>j.id); d.courseIds=D.courses.filter(c=>c.jobIds.includes(d.jobIds[0])).map(c=>c.id); return d }
test('source snapshot retains all existing jobs, tasks, abilities and courses with unique IDs',()=>{
 assert.equal(new Set(D.jobs.map(j=>j.id)).size,D.jobs.length); assert.equal(D.courses.length,74)
 for(const j of D.jobs) { assert.ok(j.tasks.length); assert.ok(j.abilities.length); assert.ok(j.sourceFile) }
 assert.ok(D.courses.every(c=>c.hours===null))
})
test('parsing is content based, preserves original text and handles varied section numbering',()=>{
 const text='一、专业名称\n智能建造工程\n二、专业代码\n240302\n六、培养目标及规格\n培养数字建造人才。\n七、课程设置\n建筑信息模型应用\n十二、毕业要求\n完成课程与实习。'
 const result=M.parseText(text)
 assert.equal(result.text,text); assert.match(result.chapters.goals,/数字建造人才/); assert.match(result.chapters.requirements,/完成课程/); assert.equal(result.recognized,5)
 assert.equal(M.parseText('没有章节的原始资料').recognized,0)
})
test('file validation rejects unsupported, empty and over-limit files',()=>{
 assert.match(M.validateFile({name:'x.exe',size:3}),/PDF/)
 assert.match(M.validateFile({name:'x.pdf',size:0}),/空/)
 assert.match(M.validateFile({name:'x.pdf',size:31*1024*1024}),/30/)
 assert.equal(M.validateFile({name:'x.DOCX',size:64}),'')
})
test('draft cannot advance without a source, a job or a course',()=>{
 const d=M.createDraft('upload'); assert.ok(M.validateStep(d,1))
 d.source={text:'源正文',chapters:{},recognized:0};assert.equal(M.validateStep(d,1),'')
 assert.ok(M.validateStep(d,2)); d.jobIds=[D.jobs[0].id];assert.equal(M.validateStep(d,2),'')
 assert.ok(M.validateStep(d,3))
})
test('matching creates candidates only; no candidate counts as confirmed coverage',()=>{
 const d=draft();d.relations=M.match(d)
 assert.ok(d.relations.length); assert.equal(M.metrics(d).covered,0)
 assert.ok(d.relations.every(r=>!r.confirmed && r.reason && r.abilityIds.length))
})
test('re-matching preserves valid manual relations and removes deleted course references',()=>{
 const d=draft(); const job=D.jobs[0];
 d.relations=[{jobId:job.id,courseId:d.courseIds[0],abilityIds:[job.abilities[0].id],confirmed:true,reason:'人工确认',manual:true}]
 const next=M.match(d); assert.ok(next.some(r=>r.confirmed && r.manual));assert.equal(M.metrics({...d,relations:next}).covered,1)
 d.courseIds=[];assert.deepEqual(M.match(d),[])
})
test('coverage counts distinct valid abilities and never exceeds its denominator',()=>{
 const d=draft(),j=D.jobs[0],r={jobId:j.id,courseId:d.courseIds[0],confirmed:true,abilityIds:[j.abilities[0].id,'not-an-ability']}
 d.relations=[r,{...r}];const m=M.metrics(d)
 assert.equal(m.covered,1);assert.ok(m.total>1);assert.ok(m.coverage<=100)
})
test('generation keeps uploaded content and selected jobs and courses, using actual credit totals',()=>{
 const d=draft();d.source={text:'原始原文',chapters:{goals:'原方案独有目标'},recognized:1}
 d.chapters=M.generate(d)
 assert.match(d.chapters.goals,/原方案独有目标/);assert.match(d.chapters.requirements,new RegExp(D.jobs[0].name))
 assert.ok(!M.chapterDefs(d).some(c=>c.id==='occupation')); assert.equal(d.chapters.occupation,undefined)
 for(const id of d.courseIds)assert.ok(d.chapters.courses.includes(D.courses.find(c=>c.id===id).name))
 assert.match(d.chapters.schedule,/学时待补充/)
})
test('references are explicit and duplicate insertion is prevented',()=>{
 const d=draft();d.chapters=M.generate(d);M.insertReference(d,'goals','gb-goals');M.insertReference(d,'goals','gb-goals')
 assert.equal(d.citations.length,1);assert.match(d.chapters.goals,/440304/)
})
test('result is an immutable snapshot independent of further draft edits',()=>{
 const d=draft();d.chapters=M.generate(d);d.generated=true
 const result=M.snapshot(d);const original=result.chapters.goals
 d.chapters.goals='后续修订';d.jobIds=[]
 assert.equal(result.chapters.goals,original);assert.ok(result.jobIds.length)
})
test('persistence validates corrupt state and independent result copies',()=>{
 const storage={getItem:()=>'{bad json'};assert.deepEqual(M.load(storage),{version:1,draft:null,results:[]})
 const restored=M.sanitize({version:1,draft:{jobIds:['not-valid'],courseIds:['x'],chapters:{}},results:[]})
 assert.deepEqual(restored.draft.jobIds,[]);assert.deepEqual(restored.draft.courseIds,[])
})
test('exports escape untrusted text while preserving plain content and source metadata',()=>{
 const d=draft();d.chapters={name:'<img src=x onerror=alert(1)>',goals:'内容'}
 const html=M.exportHtml(d);assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;img/);assert.match(html,/内容/)
})

test('only non-undergraduate levels have occupational orientation chapters and exports',()=>{
 const d=draft(); d.level='普通本科';d.chapters=M.generate(d);assert.doesNotMatch(M.exportHtml(d),/职业面向/);
 d.level='高职专科';d.chapters=M.generate(d);assert.ok(M.chapterDefs(d).some(c=>c.id==='occupation'));assert.ok(d.chapters.occupation)
})
test('engineering undergraduate template uses the 2024 graduation structure and traceable chapter rules',()=>{
 const d=draft();d.templateId='engineering-2024'
 assert.equal(M.engineeringOutcomes.length,11)
 const defs=M.chapterDefs(d);assert.ok(defs.some(c=>c.id==='support'));assert.ok(defs.some(c=>c.id==='students'))
 assert.ok(defs.some(c=>c.title==='评价与持续改进'));assert.ok(!defs.some(c=>c.title==='职业面向'))
 assert.match(M.chapterRules(d,'requirements').join(' '),/4.3/)
 const text=M.generate(d);assert.match(text.requirements,/工程与可持续发展/);assert.match(text.goals,/5年/)
 assert.match(text.courses,/15%/);assert.match(text.courses,/20%/);assert.doesNotMatch(text.courses,/至少.*30%/)
})
test('regeneration reapplies existing citations without losing manual text or duplicating references',()=>{
 const d=draft();d.mode='standard';d.chapters=M.generate(d);M.insertReference(d,'goals','eng-goals')
 M.regenerate(d);assert.match(d.chapters.goals,/参考依据/);assert.equal(d.citations.length,1)
 d.editedChapterIds=['goals'];d.chapters.goals+='\n校本内容';M.regenerate(d)
 assert.match(d.chapters.goals,/校本内容/);assert.equal((d.chapters.goals.match(/【参考依据/g)||[]).length,1)
})
test('replacing a source clears old generation, citations and edited chapter markers',()=>{
 const d=draft();d.chapters={goals:'上次人工目标'};d.editedChapterIds=['goals'];d.citations=[{referenceId:'eng-goals'}];d.generated=true
 M.replaceSource(d,{text:'新来源目标',chapters:{goals:'新来源目标'},recognized:1})
 assert.deepEqual(d.chapters,{});assert.deepEqual(d.editedChapterIds,[]);assert.deepEqual(d.citations,[]);assert.equal(d.generated,false)
 assert.match(M.generate(d).goals,/新来源目标/);assert.doesNotMatch(M.generate(d).goals,/上次人工目标/)
})
test('malformed nested persistence recovers safely without passing wrong types into renderers',()=>{
 const state=M.sanitize({version:1,draft:{name:42,source:{text:42},history:[null,{},3],citations:[null],editedChapterIds:{}},results:[null,3]})
 assert.equal(typeof state.draft.name,'string');assert.equal(state.draft.source,null);assert.deepEqual(state.draft.history,[])
 assert.equal(M.validateStep(state.draft,1).includes('上传'),true)
})
test('merging older windows preserves archived results and forks conflicting edits',()=>{
 const a=draft();a.chapters=M.generate(a);a.generated=true;a.updatedAt='2026-10-15T11:00:00Z'
 const archived=M.snapshot(a),latest={version:1,draft:a,results:[archived]}
 const stale={version:1,draft:{...M.copy(a),updatedAt:'2026-10-15T10:00:00Z'},results:[]}
 const merged=M.mergeState(stale,latest,'2026-10-15T10:00:00Z')
 assert.equal(merged.results.length,1);assert.equal(merged.results[0].id,archived.id)
 assert.notEqual(merged.draft.id,a.id);assert.ok(merged.drafts.some(d=>d.id===a.id))
})
test('confirming or rematching relations invalidates previously generated document statistics',async()=>{
 let ElementClass
 globalThis.HTMLElement=class{}
 globalThis.customElements={get:()=>false,define:(_name,cls)=>{ElementClass=cls}}
 await import('../src/talent-plan/element.js')
 for(const action of ['confirm-all','rematch']) {
  const el=new ElementClass(),d=draft();d.relations=M.match(d);d.generated=true
  el.state={draft:d};el.contains=()=>true;el.save=()=>true;el.render=()=>{};el.log=()=>{}
  await el.click({target:{closest:()=>({dataset:{tp:action},disabled:false,matches:()=>false})},stopPropagation(){}})
  assert.equal(d.generated,false,action)
 }
 delete globalThis.HTMLElement;delete globalThis.customElements
})
test('imported duration, schedule and quality facts remain in generated documents',()=>{
 const d=draft();d.templateId='engineering-2024';d.source=M.parseText('一、修业年限\n基本学制四年。\n二、教学进程安排\n第一学期：语文108学时，数学144学时。\n三、质量保障\n原方案每学年开展一次课程评价。')
 d.chapters=M.generate(d);assert.match(d.chapters.duration,/基本学制四年/);assert.match(d.chapters.schedule,/语文108学时/);assert.match(d.chapters.quality,/每学年/)
 assert.match(M.exportHtml(d),/数学144学时/)
})
test('chapter parser recognizes the engineering template headings and detects original course hours',()=>{
 const result=M.parseText('05 学生发展与学业支持\n支持措施\n09 毕业要求支撑矩阵\n支撑表\n12 支持条件\n校内设施\n13 评价与持续改进\n年度评价')
 assert.equal(result.recognized,4);assert.equal(result.chapters.students,'支持措施');assert.equal(result.chapters.quality,'年度评价')
 const d=draft();d.source={text:'第六学期：建筑信息模型应用48学时。'};const c=D.courses.find(c=>c.name==='建筑信息模型应用')
 assert.equal(M.courseHours(d,c),48)
 d.courseIds=[c.id];assert.match(M.generate(d).schedule,/48学时（原文识别/)
})

test('new courses survive reload, contribute credits and remain scoped to their plan',()=>{
 const d=draft(),before=M.metrics(d).credits
 const c=M.addCourse(d,{code:'NEW001',name:'数字施工实践',type:'专业必修',credits:'2.5',semester:'第3学期',college:'建筑学院'})
 assert.ok(d.courseIds.includes(c.id));assert.equal(M.metrics(d).credits,before+2.5)
 assert.deepEqual(c.jobIds,[]);assert.equal(c.source,'用户录入，待教务核对')
 const restored=M.load({getItem:()=>JSON.stringify({version:1,draft:d,results:[M.snapshot(d)]})})
 assert.ok(M.selectedCourses(restored.draft).some(x=>x.name==='数字施工实践'))
 assert.ok(M.selectedCourses(restored.results[0]).some(x=>x.code==='NEW001'))
 assert.ok(!M.selectedCourses({...M.createDraft(),courseIds:[c.id]}).length)
 assert.match(M.generate(restored.draft).courses,/数字施工实践/)
})
test('new courses require complete valid fields and reject duplicate course codes',()=>{
 const d=draft(),valid={code:'NEW002',name:'课程',type:'专业必修',credits:'2',semester:'第1学期',college:'建筑学院'}
 for(const credits of ['', '-1','NaN','Infinity'])assert.throws(()=>M.addCourse(d,{...valid,credits}),/学分/)
 assert.throws(()=>M.addCourse(d,{...valid,name:'  '}),/名称/)
 assert.throws(()=>M.addCourse(d,{...valid,code:D.courses[0].code}),/代码.*存在/)
 assert.equal(d.customCourses.length,0)
 M.addCourse(d,valid);assert.throws(()=>M.addCourse(d,valid),/代码.*存在/)
})
