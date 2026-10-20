import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
import * as model from '../src/project.mjs';
import {DEMO_REVISION,manufacturingProjects} from '../src/manufacturing-projects.mjs';

const goals={knowledge:[{id:'gk',title:'解释互锁原理'}],skill:[{id:'gs',title:'完成接线核查'}],quality:[{id:'gq',title:'保留原始记录'}]};
const activity=(id,weight)=>({id,title:'核查与汇报',taskId:'t',goalIds:['gk','gs','gq'],evidence:'核查表',criteria:'点位与图纸一致',weight,scored:true,subjects:['teacher','self']});
const fixture=()=>({id:'p',title:'输送线控制',description:'评价配置测试',stages:[{id:'s',title:'电路核查',tasks:[{id:'t',title:'核验电路',contents:[]},{id:'other',title:'编程调试',contents:[]}]}]});

test('evaluation totals exclude unscored work and use exact hundredths; blank stages stay pending',()=>{
 assert.equal(typeof model.evaluationSummary,'function','应提供阶段评价和占比汇总');
 const p=fixture();const before=JSON.stringify(p);
 assert.equal(model.evaluationSummary(p).valid,false);assert.equal(JSON.stringify(p),before);
 p.stages[0].evaluation={goals,activities:[activity('a',33.33),activity('b',33.33),activity('c',33.34),{...activity('formative',80),scored:false}]};
 let summary=model.evaluationSummary(p);assert.equal(summary.total,100);assert.equal(summary.stages[0].weight,100);assert.equal(summary.valid,true);
 p.stages[0].evaluation.activities[2].weight=33.33;summary=model.evaluationSummary(p);assert.equal(summary.total,99.99);assert.equal(summary.valid,false);
 p.stages[0].evaluation.activities[2].weight=40;assert.equal(model.evaluationSummary(p).valid,false);
});

test('removed tasks or goals and missing evaluation subjects are flagged, not rematched by title',()=>{
 assert.equal(typeof model.validateEvaluationActivity,'function');
 const p=fixture(),stage=p.stages[0];stage.evaluation={goals,activities:[activity('a',100)]};
 assert.equal(model.validateEvaluationActivity(stage,activity('a',100)),'');
 stage.tasks=stage.tasks.filter(t=>t.id!=='t');assert.match(model.validateEvaluationActivity(stage,activity('a',100)),/任务/);
 stage.tasks.push({id:'different-id',title:'核验电路',contents:[]});assert.match(model.validateEvaluationActivity(stage,activity('a',100)),/任务/);
 stage.tasks.push({id:'t',title:'核验电路',contents:[]});
 assert.match(model.validateEvaluationActivity(stage,{...activity('a',100),goalIds:['missing']}),/目标/);
 assert.match(model.validateEvaluationActivity(stage,{...activity('a',100),subjects:[]}),/主体/);
 for(const weight of ['',-1,NaN,Infinity,100.001,101])assert.match(model.validateEvaluationActivity(stage,activity('a',weight)),/占比/);
 assert.equal(model.validateEvaluationActivity(stage,{...activity('a',0),scored:false}),'');
 stage.evaluation.activities=[{...activity('a',100),subjects:[]}];assert.equal(model.evaluationSummary(p).valid,false);
});

const wait=async f=>{for(let i=0;i<160;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('评价视图未达到预期状态');};
function mount(entry,projects=[fixture()]){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(new URL(`../${entry}`,import.meta.url),'utf8'),{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem(DEMO_REVISION,'done');w.localStorage.setItem('ai-course-projects-v1',JSON.stringify(projects));}});
 const d=dom.window.document,button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const fill=(label,value)=>{const el=d.querySelector(`[aria-label="${label}"]`);assert.ok(el,label);Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:el.tagName==='SELECT'?dom.window.HTMLSelectElement.prototype:dom.window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 const saved=()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'));
 return {dom,d,button,fill,saved,errors};
}
for(const entry of ['index.html','offline.html'])test(`${entry}: existing PLC demos migrate to complete plans and retain edited evaluation after refresh`,async()=>{
 const projects=manufacturingProjects();projects.forEach(p=>p.stages.forEach(s=>delete s.evaluation));
 const app=mount(entry,projects);let reload;
 try{
  await wait(()=>app.button('评价总览'));app.button('评价总览').click();await wait(()=>app.d.querySelector('.evaluation-overview'));
  assert.match(app.d.querySelector('.evaluation-status').textContent,/已完整配置/);
  assert.match(app.d.querySelector('.evaluation-heading').textContent,/教学模拟评价方案/);
  assert.equal(app.d.querySelectorAll('.evaluation-table tbody tr').length,18);
  assert.equal(app.d.querySelectorAll('.evaluation-unconfigured').length,0);
  assert.equal(app.d.querySelectorAll('.evaluation-formative').length,3);
  assert.deepEqual([...app.d.querySelectorAll('.evaluation-metrics strong')].map(el=>el.textContent.replace(/\s/g,'')),['6/6','18项','100%/100%']);
  for(const project of app.saved())assert.equal(model.evaluationSummary(project).valid,true);
  app.button('编辑活动').click();await wait(()=>app.d.querySelector('[aria-label="评价活动名称"]'));
  app.fill('评价活动名称','教师调整后的需求答辩');app.button('保存活动').click();await wait(()=>!app.d.querySelector('.modal'));
  const saved=app.saved();assert.equal(saved[0].stages[0].evaluation.activities[0].title,'教师调整后的需求答辩');
  assert.equal(saved[0].stages[0].evaluation.source?.origin,'teaching-simulation','编辑评价后应保留方案来源');
  app.button('预览').click();await wait(()=>app.d.querySelector('.project-preview'));app.button('评价总览').click();await wait(()=>app.d.querySelector('.project-preview .evaluation-overview'));
  assert.equal(app.button('编辑活动'),undefined);assert.match(app.d.querySelector('.evaluation-overview').textContent,/教师调整后的需求答辩/);
  assert.deepEqual(app.saved(),saved);
  reload=mount(entry,saved);await wait(()=>reload.button('评价总览'));reload.button('评价总览').click();await wait(()=>reload.d.querySelector('.evaluation-overview'));
  assert.match(reload.d.querySelector('.evaluation-overview').textContent,/教师调整后的需求答辩/);
  assert.deepEqual(app.errors,[]);assert.deepEqual(reload.errors,[]);
 }finally{app.dom.window.close();reload?.dom.window.close();}
});
for(const entry of ['index.html','offline.html'])test(`${entry}: configure goals and activities, persist edits, enforce weights, preview read-only and delete`,async()=>{
 const app=mount(entry);let reload;const {dom,d,button,fill,saved,errors}=app;
 try{
  await wait(()=>button('预览'));assert.ok(button('评价总览'),'项目页应能打开评价总览');button('评价总览').click();await wait(()=>d.querySelector('.evaluation-overview'));
  assert.match(d.querySelector('.evaluation-overview').textContent,/待配置/);assert.equal(saved()[0].stages[0].evaluation,undefined);
  button('配置目标').click();await wait(()=>d.querySelector('[aria-label="知识目标"]'));
  fill('知识目标','解释互锁原理');fill('技能目标','完成接线核查');fill('素养目标','保留原始记录');button('保存目标').click();await wait(()=>!d.querySelector('.modal'));
  button('添加评价活动').click();await wait(()=>d.querySelector('[aria-label="评价活动名称"]'));
  fill('评价活动名称','电路核查与汇报');fill('关联项目任务','t');
  for(const goal of ['解释互锁原理','完成接线核查','保留原始记录'])d.querySelector(`[aria-label="关联目标：${goal}"]`).click();
  fill('成果证据','核查表与电路图');fill('评价标准','全部点位与图纸一致');fill('成绩占比','101');d.querySelector('[aria-label="教师评价"]').click();
  button('保存活动').click();await wait(()=>d.querySelector('[role="alert"]'));assert.equal(saved()[0].stages[0].evaluation.activities.length,0);
  fill('成绩占比','100');button('保存活动').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(saved()[0].stages[0].evaluation.activities[0].taskId,'t');assert.equal(saved()[0].stages[0].tasks[1].contents.length,0);
  assert.match(d.querySelector('.evaluation-status').textContent,/已完整配置/);
  button('编辑活动').click();await wait(()=>d.querySelector('[aria-label="评价活动名称"]'));fill('评价活动名称','未保存的名称');button('取消').click();await wait(()=>!d.querySelector('.modal'));assert.equal(saved()[0].stages[0].evaluation.activities[0].title,'电路核查与汇报');
  const before=JSON.stringify(saved());button('预览').click();await wait(()=>d.querySelector('.project-preview'));button('评价总览').click();await wait(()=>d.querySelector('.project-preview .evaluation-overview'));
  assert.match(d.querySelector('.project-preview .evaluation-overview').textContent,/电路核查与汇报/);assert.equal(button('添加评价活动'),undefined);assert.equal(d.querySelector('.evaluation-overview input'),null);assert.equal(JSON.stringify(saved()),before);
  const explanation=d.querySelector('.project-preview .project-description-panel');assert.ok(!explanation||explanation.closest('[hidden]'),'评价预览应独占内容区，讲解素材不得挤出评价表');
  button('退出预览').click();await wait(()=>button('预览'));button('评价总览').click();await wait(()=>d.querySelector('.evaluation-overview'));
  reload=mount(entry,saved());await wait(()=>reload.button('评价总览'));reload.button('评价总览').click();await wait(()=>reload.d.querySelector('.evaluation-overview'));assert.match(reload.d.querySelector('.evaluation-overview').textContent,/核查表与电路图/);
  reload.button('删除活动').click();await wait(()=>reload.button('确认删除活动'));reload.button('取消').click();await wait(()=>!reload.d.querySelector('.modal'));assert.equal(reload.saved()[0].stages[0].evaluation.activities.length,1);
  reload.button('删除活动').click();await wait(()=>reload.button('确认删除活动'));reload.button('确认删除活动').click();await wait(()=>!reload.d.querySelector('.modal'));assert.equal(reload.saved()[0].stages[0].evaluation.activities.length,0);assert.match(reload.d.querySelector('.evaluation-status').textContent,/待完善/);
  assert.deepEqual(errors,[]);assert.deepEqual(reload.errors,[]);
 }finally{dom.window.close();reload?.dom.window.close();}
});

for(const entry of ['index.html','offline.html'])test(`${entry}: rename preserves a goal ID but deletion followed by a same-name new goal invalidates old associations`,async()=>{
 const project=fixture();project.stages[0].evaluation={goals,activities:[activity('a',100)]};
 const {dom,d,button,fill,saved,errors}=mount(entry,[project]);
 try{
  await wait(()=>button('评价总览'));button('评价总览').click();await wait(()=>button('配置目标'));
  button('配置目标').click();await wait(()=>d.querySelector('[aria-label="知识目标"]'));fill('知识目标','解释安全互锁');button('保存目标').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(saved()[0].stages[0].evaluation.goals.knowledge[0].id,'gk');assert.match(d.querySelector('.evaluation-status').textContent,/已完整配置/);
  button('配置目标').click();await wait(()=>d.querySelector('[aria-label="知识目标"]'));
  const remove=d.querySelector('[aria-label="删除知识目标1"]');assert.ok(remove,'目标必须具有独立删除操作');remove.click();await wait(()=>!d.querySelector('[aria-label="知识目标"]'));
  button('添加知识目标').click();await wait(()=>d.querySelector('[aria-label="知识目标"]'));fill('知识目标','解释安全互锁');button('保存目标').click();await wait(()=>!d.querySelector('.modal'));
  assert.notEqual(saved()[0].stages[0].evaluation.goals.knowledge[0].id,'gk');assert.deepEqual(saved()[0].stages[0].evaluation.activities[0].goalIds,['gk','gs','gq']);assert.match(d.querySelector('.evaluation-status').textContent,/待完善/);assert.match(d.querySelector('.evaluation-linked-goals').textContent,/目标失效/);
  button('编辑活动').click();await wait(()=>button('移除失效关联'));button('移除失效关联').click();await wait(()=>!button('移除失效关联'));d.querySelector('[aria-label="关联目标：解释安全互锁"]').click();button('保存活动').click();await wait(()=>!d.querySelector('.modal'));assert.match(d.querySelector('.evaluation-status').textContent,/已完整配置/);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
