import test from 'node:test';
import assert from 'node:assert/strict';
import { gate, sampleContext, catalog, draftRole, draftCourseTask, defaultDesign, generateProject } from '../src/generation/model.mjs';
test('course and task names drive editable teaching content without inventing a job source',()=>{
 const role=draftCourseTask(sampleContext,'  工业视觉检测  ','  零件缺陷检测  '),task=role.tasks[0];
 assert.equal(role.name,'');
 assert.equal(role.source.courseName,'工业视觉检测');
 assert.equal(task.title,'零件缺陷检测');
 assert.match(task.description,/工业视觉检测/);
 assert.match(task.description,/零件缺陷检测/);
 assert.ok(task.abilities.every(a=>a.origin==='generated-draft'));
 const other=draftCourseTask(sampleContext,'产品质量管理','零件缺陷检测');
 assert.notEqual(task.abilities[0].title,other.tasks[0].abilities[0].title);
 task.description='教师修订：先比较样本，再记录缺陷。';
 const design=defaultDesign(role,task);
 const project=generateProject({context:sampleContext,role,task,abilities:task.abilities,design,confirmed:true});
 assert.equal(project.title,'零件缺陷检测');
 assert.match(project.learningDesign.courseGoal,/工业视觉检测/);
 assert.equal(project.learningDesign.sourceTask.description,task.description);
 assert.match(project.learningDesign.explanation,/教师修订/);
 for(const [course,name] of [['  ','检测'],['课程','  ']])assert.throws(()=>draftCourseTask(sampleContext,course,name),/课程名称和项目任务名称/);
});
test('a valid official major is required while the training plan remains optional',()=>{
 for(const context of [{},{planId:'xc-2025',planMajor:'460305'},{major:'',planId:''},{major:'invented'}]) assert.equal(gate(context).ready,false);
 assert.equal(gate({major:'460305'}).ready,true);
 assert.equal(gate({...sampleContext,planMajor:'other'}).ready,false);
 assert.equal(gate({...sampleContext,modelEnabled:false}).ready,true);
 assert.equal(gate(sampleContext).ready,true);
});
test('manual role drafts with an official major and never claim reference provenance',()=>{
 const r=draftRole(sampleContext,'质检员','检测工件');
 assert.equal(r.origin,'generated-draft');assert.equal(r.tasks[0].abilities.length,3);
 assert.ok(r.tasks[0].abilities.every(a=>a.origin==='generated-draft'));
});
test('pedagogical conversion preserves selected sources, evidence and review boundary',()=>{
 const role=catalog[0], task=role.tasks[0], abilities=task.abilities.slice(0,3), design=defaultDesign(role,task);
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities,design,confirmed:false}),/审阅/);
 const p=generateProject({context:sampleContext,role,task,abilities,design,confirmed:true});
 assert.equal(p.stages.length,6);
 assert.ok(p.stages.every(s=>s.hours===undefined));
 assert.deepEqual(p.learningDesign.abilities.map(a=>a.id),abilities.map(a=>a.id));
 const mapped=p.stages.flatMap(s=>s.tasks.flatMap(t=>t.learningActivity.abilityIds));
 for(const a of abilities)assert.ok(mapped.includes(a.id));
 assert.ok(p.stages.every(s=>s.tasks.every(t=>t.learningActivity.evidence&&t.learningActivity.criteria)));
 assert.equal(p.learningDesign.sourceTask.id,task.id);
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities,design:{...design,problem:''},confirmed:true}),/核心问题/);
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities:[{id:'invented'}],design,confirmed:true}),/能力/);
});

test('manual drafts validate cleared teaching conditions and preserve their draft origin',()=>{
 const role=draftRole(sampleContext,'视觉质检员','零件表面缺陷检测'),task=role.tasks[0],abilities=task.abilities;
 const design=defaultDesign(role,task);
 assert.doesNotThrow(()=>generateProject({context:sampleContext,role,task,abilities,design,confirmed:true}));
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities,design:{...design,object:''},confirmed:true}),/工作对象/);
 design.object='教学零件样本';design.tools='视觉检测系统与缺陷样本库';
 const p=generateProject({context:sampleContext,role,task,abilities,design,confirmed:true});
 assert.equal(p.learningDesign.role.origin,'generated-draft');
 assert.equal(p.learningDesign.role.source.file,undefined);
 assert.throws(()=>generateProject({context:{...sampleContext,planId:'different'},role,task,abilities,design,confirmed:true}),/不匹配/);
 for(const hours of [6,7,11,12,19,120]){
  const generated=generateProject({context:sampleContext,role,task,abilities,design:{...design,hours},confirmed:true});
  assert.equal(generated.learningDesign.hours,undefined);
  assert.ok(generated.stages.every(s=>s.hours===undefined));
  assert.ok(generated.stages.every(s=>s.tasks.every(t=>!t.description.includes('课时'))));
 }
});

 test('official major without a plan supports project creation while selected links constrain references',()=>{
 const reference=catalog[0];
 for(const context of [{major:'460305'},sampleContext]){
  for(const role of [reference,draftRole(context,'质检员','检测工件')]){
   const task=role.tasks[0],design={...defaultDesign(role,task),object:'教学工件',tools:'检测工具与记录表'};
   const project=generateProject({context,role,task,abilities:task.abilities,design,confirmed:true});
   assert.equal(project.stages.length,6);
   assert.deepEqual(project.learningDesign.context,context);
   assert.equal(project.learningDesign.role.origin,role.origin);
  }
 }
 const task=reference.tasks[0],design=defaultDesign(reference,task);
 for(const context of [{major:'460306'},{major:'460305',planId:'other',planMajor:'460305'}]) assert.throws(()=>generateProject({context,role:reference,task,abilities:task.abilities,design,confirmed:true}),/不匹配/);
 });

test('generation cannot bypass missing or invented official majors',()=>{
 for(const context of [{},{major:'invented'}]) {
  assert.throws(()=>draftRole(context,'质检员','检测'),/官方专业/);
  assert.throws(()=>draftCourseTask(context,'课程','任务'),/官方专业/);
  const role=catalog[0],task=role.tasks[0];
  assert.throws(()=>generateProject({context,role,task,abilities:task.abilities,design:defaultDesign(role,task),confirmed:true}),/官方专业/);
 }
});

// These checks catch invented reference provenance and abilities leaking between source tasks.
test('teacher supplied roles preserve separate tasks and start with no invented abilities',async()=>{
 const model=await import('../src/generation/model.mjs');
 assert.equal(typeof model.inputRole,'function');
 const role=model.inputRole(sampleContext,'  视觉质检员  ','样本采集\n\n缺陷复核');
 assert.equal(role.name,'视觉质检员');
 assert.equal(role.origin,'teacher-input');
 assert.deepEqual(role.tasks.map(t=>t.title),['样本采集','缺陷复核']);
 assert.ok(role.tasks.every(t=>t.abilities.length===0));
 assert.equal(new Set(role.tasks.map(t=>t.id)).size,2);
 assert.throws(()=>model.inputRole(sampleContext,'  ','检测'),/岗位名称/);
 assert.throws(()=>model.inputRole(sampleContext,'质检员','  '),/典型工作任务/);
});
test('generated roles have editable multi-task drafts and preserve course input without reference claims',async()=>{
 const model=await import('../src/generation/model.mjs');
 assert.equal(typeof model.draftCourseRole,'function');
 const role=model.draftCourseRole(sampleContext,'工业视觉检测','零件质检');
 assert.ok(role.name.trim());assert.notEqual(role.name,'工业视觉检测');
 assert.equal(role.origin,'generated-draft');assert.equal(role.source.courseName,'工业视觉检测');
 assert.equal(role.source.file,undefined);
 assert.ok(role.tasks.length>1);
 const allIds=role.tasks.flatMap(t=>t.abilities.map(a=>a.id));
 assert.equal(new Set(allIds).size,allIds.length);
 const task=role.tasks[1];
 const design={...defaultDesign(role,task),object:'教学零件',tools:'视觉检测设备'};
 const result=generateProject({context:sampleContext,role,task,abilities:[task.abilities[0]],design,confirmed:true});
 assert.equal(result.learningDesign.sourceTask.id,task.id);
 assert.deepEqual(result.learningDesign.abilities.map(a=>a.id),[task.abilities[0].id]);
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities:role.tasks[0].abilities,design,confirmed:true}),/能力/);
});

test('simulation and custom roles have complete usable teaching defaults',async()=>{
 const {demoRolesForMajor}=await import('../src/generation/demo-roles.mjs');
 const {designError,inputRole}=await import('../src/generation/model.mjs');
 const roles=[...demoRolesForMajor('080901'),inputRole({major:'080901'},'实训指导员','课程页面组件开发')];
 for(const role of roles)for(const task of role.tasks){
  const design=defaultDesign(role,task,'Web应用开发');
  assert.equal(designError(design),'',`${role.name} / ${task.title}`);
  assert.match(design.object,new RegExp(task.title));
  assert.match(design.tools,/Web应用开发/);
 }
});
