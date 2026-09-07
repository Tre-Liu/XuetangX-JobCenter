import test from 'node:test';
import assert from 'node:assert/strict';
import { gate, sampleContext, catalog, draftRole, defaultDesign, generateProject } from '../src/generation/model.mjs';
test('optional course links allow empty and partial contexts but reject conflicting selections',()=>{
 for(const context of [{},{major:'460305'},{planId:'xc-2025',planMajor:'460305'},{major:'',planId:''}]) assert.equal(gate(context).ready,true);
 assert.equal(gate({...sampleContext,planMajor:'other'}).ready,false);
 assert.equal(gate({...sampleContext,modelEnabled:false}).ready,true);
 assert.equal(gate(sampleContext).ready,true);
});
test('manual role drafts accept missing course links and never claim reference provenance',()=>{
 const r=draftRole({},'质检员','检测工件');
 assert.equal(r.origin,'generated-draft');assert.equal(r.tasks[0].abilities.length,3);
 assert.ok(r.tasks[0].abilities.every(a=>a.origin==='generated-draft'));
});
test('pedagogical conversion preserves selected sources, hours, evidence and review boundary',()=>{
 const role=catalog[0], task=role.tasks[0], abilities=task.abilities.slice(0,3), design=defaultDesign(role,task);
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities,design,confirmed:false}),/审阅/);
 const p=generateProject({context:sampleContext,role,task,abilities,design,confirmed:true});
 assert.equal(p.stages.length,6);
 assert.equal(p.stages.reduce((n,s)=>n+s.hours,0),design.hours);
 assert.deepEqual(p.learningDesign.abilities.map(a=>a.id),abilities.map(a=>a.id));
 const mapped=p.stages.flatMap(s=>s.tasks.flatMap(t=>t.learningActivity.abilityIds));
 for(const a of abilities)assert.ok(mapped.includes(a.id));
 assert.ok(p.stages.every(s=>s.tasks.every(t=>t.learningActivity.evidence&&t.learningActivity.criteria)));
 assert.equal(p.learningDesign.sourceTask.id,task.id);
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities,design:{...design,problem:''},confirmed:true}),/核心问题/);
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities:[{id:'invented'}],design,confirmed:true}),/能力/);
});

test('manual drafts require concrete teaching conditions and preserve their draft origin',()=>{
 const role=draftRole(sampleContext,'视觉质检员','零件表面缺陷检测'),task=role.tasks[0],abilities=task.abilities;
 const design=defaultDesign(role,task);
 assert.throws(()=>generateProject({context:sampleContext,role,task,abilities,design,confirmed:true}),/工作对象/);
 design.object='教学零件样本';design.tools='视觉检测系统与缺陷样本库';
 const p=generateProject({context:sampleContext,role,task,abilities,design,confirmed:true});
 assert.equal(p.learningDesign.role.origin,'generated-draft');
 assert.equal(p.learningDesign.role.source.file,undefined);
 assert.throws(()=>generateProject({context:{...sampleContext,planId:'different'},role,task,abilities,design,confirmed:true}),/不匹配/);
 for(const hours of [6,7,11,12,19,120]){
  const generated=generateProject({context:sampleContext,role,task,abilities,design:{...design,hours},confirmed:true});
  assert.equal(generated.stages.reduce((n,s)=>n+s.hours,0),hours);
  assert.ok(generated.stages.every(s=>s.hours>=1));
 }
});

 test('empty and partial course links support project creation while selected links still constrain references',()=>{
 const reference=catalog[0];
 for(const context of [{},{major:'460305'},{planId:'xc-2025',planMajor:'460305'},{major:'',planId:''}]){
  for(const role of [reference,draftRole(context,'质检员','检测工件')]){
   const task=role.tasks[0],design={...defaultDesign(role,task),object:'教学工件',tools:'检测工具与记录表'};
   const project=generateProject({context,role,task,abilities:task.abilities,design,confirmed:true});
   assert.equal(project.stages.length,6);
   assert.deepEqual(project.learningDesign.context,context);
   assert.equal(project.learningDesign.role.origin,role.origin);
  }
 }
 const task=reference.tasks[0],design=defaultDesign(reference,task);
 for(const context of [{major:'other'},{planId:'other'}]) assert.throws(()=>generateProject({context,role:reference,task,abilities:task.abilities,design,confirmed:true}),/不匹配/);
 });
