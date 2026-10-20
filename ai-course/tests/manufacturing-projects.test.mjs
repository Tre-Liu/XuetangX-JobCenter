import test from 'node:test';
import assert from 'node:assert/strict';
import {manufacturingProjects,loadManufacturingProjects,PROJECTS_KEY,BACKUP_KEY,DEMO_REVISION} from '../src/manufacturing-projects.mjs';
import {createKnowledgeGraph} from '../src/knowledge/model.mjs';
import {validateProject,evaluationSummary} from '../src/project.mjs';
import {EVALUATION_BACKUP_KEY} from '../src/manufacturing-evaluation.mjs';
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('three complete manufacturing projects retain provenance, valid graph IDs and independent task identities',()=>{
 const graph=createKnowledgeGraph(),projects=manufacturingProjects(graph),ids=[];
 assert.equal(projects.length,3);
 for(const p of projects){assert.equal(validateProject(p),'');assert.equal(p.stages.length,6);assert.equal(p.stages.flatMap(s=>s.tasks).length,15);assert.match(p.provenance.note,/非企业实测/);for(const [key,max] of [['role',200],['scenario',500],['status',500],['outline',1000]])assert.ok(p.drivingQuestion[key].length<=max);for(const stage of p.stages){assert.ok(stage.tasks.length>=2&&stage.tasks.length<=3);for(const t of stage.tasks){ids.push(t.id);assert.match(t.description,/实施步骤/);for(const c of t.contents)assert.ok(graph.nodes.some(n=>n.id===c.knowledgeNodeId));}}}
 assert.equal(new Set(ids).size,45);
});
test('row data reconciles to stated batch quantities, accuracy and cycle totals',()=>{
 const [a,b,c]=manufacturingProjects();assert.equal(a.simulationData.tests.filter(t=>t.firstPass).length,18);assert.equal(a.simulationData.tests.filter(t=>t.finalPass).length,20);
 const rows=b.simulationData.batch;assert.equal(rows.length,200);assert.equal(rows.filter(r=>r.material==='金属').length,120);assert.equal(rows.filter(r=>r.correct).length,198);assert.equal(Math.round(rows.reduce((s,r)=>s+r.cycleSeconds,0)),1160);
 assert.equal(c.simulationData.baselineCycles.length,50);assert.equal(Math.round(c.simulationData.baselineCycles.reduce((s,r)=>s+r.seconds,0)),740);assert.equal(c.simulationData.acceptanceCycles.length,60);assert.equal(Math.round(c.simulationData.acceptanceCycles.reduce((s,r)=>s+r.seconds,0)),756);assert.equal(c.simulationData.faults.length,12);
});
test('manufacturing evaluation covers every task and goal with a complete 100 percent plan',()=>{
 const ids=[];
 for(const project of manufacturingProjects()){
  const summary=evaluationSummary(project);
  assert.equal(summary.valid,true,summary.issues.join('\n'));
  assert.equal(summary.configured,6);assert.equal(summary.total,100);assert.equal(summary.activities,18);
  assert.deepEqual(summary.stages.map(s=>s.weight),[10,10,15,30,25,10]);
  for(const stage of project.stages){
   assert.match(stage.evaluation.source.note,/教学模拟/);
   for(const task of stage.tasks)assert.ok(stage.evaluation.activities.some(a=>a.taskId===task.id&&a.scored));
   for(const activity of stage.evaluation.activities){ids.push(activity.id);assert.ok(activity.evidence.length>10);assert.ok(activity.criteria.length>20);}
  }
 }
 assert.equal(new Set(ids).size,ids.length);
});
test('existing unconfigured PLC demos gain evaluation once without replacing edited tasks or other projects',()=>{
 const storage=store(),projects=manufacturingProjects();
 projects.forEach(p=>p.stages.forEach(s=>delete s.evaluation));
 projects[0].title='教师调整的项目';projects[0].stages[0].tasks[0].id='teacher-task';
 projects[0].stages[0].tasks[0].title='教师补充现场信息核验';
 projects.push({id:'custom',title:'教师自建',stages:[{id:'custom-stage',title:'自建阶段',tasks:[]}]});
 storage.setItem(DEMO_REVISION,'done');storage.setItem(PROJECTS_KEY,JSON.stringify(projects));
 const loaded=loadManufacturingProjects(storage);
 assert.equal(storage.getItem(EVALUATION_BACKUP_KEY),JSON.stringify(projects));
 assert.equal(loaded[0].title,projects[0].title);assert.equal(loaded[0].stages[0].tasks[0].title,projects[0].stages[0].tasks[0].title);
 assert.equal(evaluationSummary(loaded[0]).valid,true);assert.equal(loaded[0].stages[0].evaluation.activities[0].taskId,'teacher-task');
 assert.deepEqual(loaded[3],projects[3]);
 delete loaded[0].stages[0].evaluation;storage.setItem(PROJECTS_KEY,JSON.stringify(loaded));
 assert.equal(loadManufacturingProjects(storage)[0].stages[0].evaluation,undefined);
});
test('regenerated demo task IDs and extra tasks use their own evidence while keeping stage weights',()=>{
 const storage=store(),[project]=manufacturingProjects();project.stages.forEach(s=>delete s.evaluation);
 const stage=project.stages[0];stage.id='regenerated-stage';stage.tasks.push({id:'extra-task',title:'复核安全授权单',contents:[],learningActivity:{evidence:'安全授权签认单',steps:'检查上电授权、监护人和签认时间。',criteria:'每次上电前由教师核对签认；缺少签字不得进入操作。'}});
 storage.setItem(DEMO_REVISION,'done');storage.setItem(PROJECTS_KEY,JSON.stringify([project]));
 const [loaded]=loadManufacturingProjects(storage),summary=evaluationSummary(loaded);
 assert.equal(summary.valid,true);assert.equal(summary.total,100);assert.equal(summary.stages[0].weight,10);
 const activity=loaded.stages[0].evaluation.activities.find(a=>a.taskId==='extra-task');
 assert.match(activity.title,/复核安全授权单/);assert.match(activity.evidence,/安全授权签认单/);assert.match(activity.criteria,/签认时间/);
});
test('evaluation migration preserves a partially edited plan and deliberately empty evaluation',()=>{
 const storage=store(),projects=manufacturingProjects();
 projects.forEach(p=>p.stages.forEach(s=>delete s.evaluation));
 projects[0].stages[0].evaluation={goals:{knowledge:[{id:'teacher-goal',title:'教师目标'}]},activities:[]};
 projects[1].stages[0].evaluation={};
 storage.setItem(DEMO_REVISION,'done');storage.setItem(PROJECTS_KEY,JSON.stringify(projects));
 const loaded=loadManufacturingProjects(storage);
 assert.deepEqual(loaded[0],projects[0]);assert.deepEqual(loaded[1],projects[1]);assert.equal(evaluationSummary(loaded[2]).valid,true);
});
test('course migration backs up old projects once and preserves edits or deliberate deletion thereafter',()=>{
 const storage=store(),original=JSON.stringify([{id:'old',title:'666',stages:[]}]);storage.setItem(PROJECTS_KEY,original);
 assert.equal(loadManufacturingProjects(storage).length,3);assert.equal(storage.getItem(BACKUP_KEY),original);assert.equal(storage.getItem(DEMO_REVISION),'done');
 const edited=loadManufacturingProjects(storage);edited[0].title='教师修订';storage.setItem(PROJECTS_KEY,JSON.stringify(edited));assert.equal(loadManufacturingProjects(storage)[0].title,'教师修订');
 storage.setItem(PROJECTS_KEY,'[]');assert.deepEqual(loadManufacturingProjects(storage),[]);assert.equal(storage.getItem(BACKUP_KEY),original);
});
