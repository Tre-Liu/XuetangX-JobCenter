import {seedInteractionDraft} from './fixtures/course-draft.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM,VirtualConsole} from 'jsdom';
import {CONFIG_KEY,configHash,fromHash,normalizeConfig,matchChains} from '../src/cms/config.mjs';
const enabled=normalizeConfig({major:{code:'460305'},chainIds:[matchChains('460305')[0].id],industryEnabled:true});
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const cmsHTML=fs.readFileSync(new URL('../cms/index.html',import.meta.url),'utf8');
const wait=async fn=>{for(let i=0;i<500;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}assert.fail('CMS UI state not reached');};
function mount({cms=false,file=false,config,hash='',storage={}}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='not-implemented'&&/navigation/i.test(e.message))return;errors.push(e.message);});
 const url=file?new URL(cms?'../cms/index.html':'../index.html',import.meta.url).href+hash:'http://localhost/'+(cms?'cms/index.html':'')+hash;
 const dom=new JSDOM(cms?cmsHTML:html,{url,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;seedInteractionDraft(w);w.matchMedia=()=>({matches:true});if(!file){if(config)w.localStorage.setItem(CONFIG_KEY,JSON.stringify(config));for(const [key,value]of Object.entries(storage))w.localStorage.setItem(key,JSON.stringify(value));}}});
 const d=dom.window.document,button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const input=(el,value)=>{Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 return {dom,d,button,input,errors};
}
async function chooseRole(d){await wait(()=>d.querySelector('.gen-role-list>button'));const role=d.querySelector('.gen-role-list>button');role.click();await wait(()=>role.getAttribute('aria-pressed')==='true'&&d.querySelector('.gen-task-picker'));}
async function chooseTask(d){await chooseRole(d);d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelector('.gen-ability input:checked'));}
test('CMS standalone script is self contained; saved major and model transfer through file navigation',async()=>{
 assert.doesNotMatch(cmsHTML,/<script[^>]+src=|<script[^>]+type="module"/);
 new vm.Script(cmsHTML.match(/<script>([\s\S]*?)<\/script>/)[1]);
 const cms=mount({cms:true,file:true,hash:configHash(enabled)});let course;
 try{await wait(()=>cms.button('管理'));const link=cms.d.querySelector('.cms-page-heading a');
  assert.equal(fromHash(new URL(link.href).hash).industryEnabled,true);
  course=mount({file:true,hash:new URL(link.href).hash});await wait(()=>course.button('AI 生成框架'));
  assert.equal(course.button('AI 生成框架').getAttribute('aria-haspopup'),'menu');
  course.button('AI 生成框架').click();await wait(()=>course.d.querySelector('[aria-label="岗位任务驱动"]'));
  course.d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>course.d.querySelector('[aria-label="课程已关联专业"]'));
  assert.equal(course.d.querySelector('[aria-label="课程已关联专业"]').textContent,'工业机器人技术');assert.deepEqual(cms.errors,[]);assert.deepEqual(course.errors,[]);
 }finally{cms.dom.window.close();course?.dom.window.close();}
});
test('course confirms major before chain matching; cancel preserves existing association',async()=>{
 const {dom,d,button,input,errors}=mount({cms:true});
 try{await wait(()=>button('管理'));button('管理').click();await wait(()=>button('产教模型'));button('产教模型').click();await wait(()=>!d.querySelector('#cms-industry').hidden);
  assert.equal(d.querySelectorAll('.cms-chain').length,0);assert.equal(d.querySelectorAll('[role="switch"]').length,0);assert.match(d.querySelector('.cms-pending').textContent,/待关联专业/);
  button('关联专业').click();await wait(()=>d.querySelector('.cms-major-modal'));
  assert.equal(button('确定').disabled,true);button('职教').click();input(d.querySelector('[aria-label="搜索官方专业"]'),'460305');await wait(()=>d.querySelectorAll('.cms-major-results input').length===1);
  d.querySelector('.cms-major-results input').click();await wait(()=>!button('确定').disabled);assert.equal(d.querySelectorAll('.cms-chain').length,0);
  button('取消').click();await wait(()=>!d.querySelector('.cms-major-modal'));assert.equal(d.querySelectorAll('.cms-chain').length,0);
  button('关联专业').click();await wait(()=>button('职教'));button('职教').click();input(d.querySelector('[aria-label="搜索官方专业"]'),'460305');await wait(()=>d.querySelectorAll('.cms-major-results input').length===1);d.querySelector('.cms-major-results input').click();await wait(()=>!button('确定').disabled);button('确定').click();await wait(()=>d.querySelectorAll('.cms-chain').length===2);
  assert.equal(d.querySelector('[role="switch"]'),null);assert.doesNotMatch(d.querySelector('#cms-industry').textContent,/规则推荐 · 待人工确认|启用产教模型|至少确认一条/);d.querySelector('.cms-chain input').click();await wait(()=>d.querySelector('.cms-chain input').checked);
  button('保存并返回课程').click();await wait(()=>JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).industryEnabled);
  d.querySelector('.cms-chain input').click();await wait(()=>!d.querySelector('.cms-chain input').checked);button('保存并返回课程').click();await wait(()=>JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).industryEnabled===false);
  button('重新关联专业').click();await wait(()=>button('本科'));button('本科').click();input(d.querySelector('[aria-label="搜索官方专业"]'),'010101');await wait(()=>d.querySelectorAll('.cms-major-results input').length===1);d.querySelector('.cms-major-results input').click();await new Promise(r=>setTimeout(r,20));button('确定').click();await wait(()=>!d.querySelector('.cms-major-modal'));
  assert.ok(d.querySelector('[aria-label="按岗位名称匹配"]'));assert.equal(d.querySelectorAll('.cms-chain').length,0);assert.match(d.querySelector('#cms-industry .cms-empty').textContent,/暂无匹配推荐/);
  button('查看全部产业链').click();await wait(()=>d.querySelectorAll('.cms-chain').length===19);button('保存并返回课程').click();await wait(()=>JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).major.code==='010101');assert.deepEqual(JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).chainIds,[]);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('live CMS disable closes the job framework wizard and restores direct topic generation',async()=>{
 const {dom,d,button,errors}=mount({config:enabled});
 try{await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await chooseTask(d);
  d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelector('.gen-ability'));button('下一步：生成项目框架').click();await wait(()=>d.querySelector('.gen-loading'));
  assert.ok(!d.querySelector('[aria-label="生成对话记录"]'));
  dom.window.localStorage.setItem(CONFIG_KEY,JSON.stringify({...enabled,chainIds:[],industryEnabled:false}));dom.window.dispatchEvent(new dom.window.StorageEvent('storage',{key:CONFIG_KEY}));
  await wait(()=>!d.querySelector('.modal'));assert.equal(button('AI 生成框架').hasAttribute('aria-haspopup'),false);
  button('AI 生成框架').click();await wait(()=>button('开始生成'));assert.equal(d.querySelectorAll('.conversation-message').length,0);assert.equal(d.querySelectorAll('[role="menuitem"]').length,0);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('ordinary framework confirmation has no conversation and cancellation preserves project',async()=>{
 const {dom,d,button,errors}=mount();
 try{await wait(()=>button('AI 生成框架')&&dom.window.localStorage.getItem('ai-course-projects-v1'));const original=dom.window.localStorage.getItem('ai-course-projects-v1');
  button('AI 生成框架').click();await wait(()=>button('开始生成'));
  assert.equal(d.querySelectorAll('.conversation-message,.gen-stepper,.modal input').length,0);
  assert.equal(d.querySelectorAll('.modal .driving-question textarea').length,4);
  assert.match(d.querySelector('.generation-notes').textContent,/覆盖当前项目/);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),original);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('CMS tabs show one panel at a time and preserve unsaved chain selection',async()=>{
 const {dom,d,button}=mount({cms:true,config:enabled});
 try{await wait(()=>button('管理'));button('管理').click();await wait(()=>d.querySelector('[role="tab"]'));
  assert.equal(d.querySelector('#cms-basic').hidden,false);assert.equal(d.querySelector('#cms-industry').hidden,true);
  button('产教模型').click();await wait(()=>!d.querySelector('#cms-industry').hidden);assert.equal(d.querySelector('#cms-basic').hidden,true);
  const unchecked=[...d.querySelectorAll('.cms-chain input')].find(el=>!el.checked);unchecked.click();await wait(()=>unchecked.checked);
  button('基础信息').click();await wait(()=>!d.querySelector('#cms-basic').hidden);
  button('产教模型').click();await wait(()=>!d.querySelector('#cms-industry').hidden);assert.equal(d.querySelectorAll('.cms-chain input:checked').length,2);
  assert.equal(d.querySelectorAll('[role="tabpanel"]:not([hidden])').length,1);
  button('产教模型').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));await wait(()=>!d.querySelector('#cms-basic').hidden);
  assert.equal(d.activeElement.id,'cms-basic-tab');assert.equal(d.querySelector('#cms-basic-tab').getAttribute('aria-selected'),'true');
 }finally{dom.window.close();}
});

test('job wizard immediately shows the associated major and selection columns',async()=>{
 const {dom,d,button,errors}=mount({config:enabled});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();
  await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();
  await wait(()=>d.querySelector('.framework-generation-modal .gen-role-list'));
  assert.equal(d.querySelector('.generation-modal h2').textContent,'生成项目框架');
  assert.equal(d.querySelector('[aria-label="课程已关联专业"]').textContent,'工业机器人技术');
  assert.ok(d.querySelector('[aria-label="搜索岗位"]'));
  assert.equal(d.querySelectorAll('.framework-selection-column').length,1);
  assert.equal(d.querySelectorAll('.gen-ability input:checked').length,0);
  assert.equal(button('下一步：生成项目框架').disabled,true);
  assert.equal(d.querySelector('.current-prompt,.conversation-markdown,.conversation-input-card,.gen-stepper,.driving-question'),null);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

for(const file of [false,true])test(`job wizard disables Next until a capability is selected (${file?'file':'http'})`,async()=>{
 const {dom,d,button,errors}=mount({file,config:enabled,hash:file?configHash(enabled):''});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();
  await chooseTask(d);
  assert.equal(d.querySelectorAll('.gen-task-options input:checked').length,1);
  await wait(()=>d.querySelector('.gen-ability'));
  assert.equal(d.querySelectorAll('.gen-ability input:checked').length,d.querySelectorAll('.gen-ability input[type=checkbox]').length);
  for(const checkbox of d.querySelectorAll('.gen-ability input[type=checkbox]')){checkbox.click();await wait(()=>!checkbox.checked);}
  await wait(()=>button('下一步：生成项目框架').disabled);
  button('下一步：生成项目框架').click();assert.equal(d.querySelector('.gen-loading'),null);
  d.querySelector('.gen-ability input[type=checkbox]').click();await wait(()=>!button('下一步：生成项目框架').disabled);
  button('下一步：生成项目框架').click();await wait(()=>d.querySelector('.knowledge-matching')&&button('确认生成')&&!button('确认生成').disabled);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('framework wizard preserves manual knowledge selections on return and commits only the target task',async()=>{
 const {dom,d,button,errors}=mount({config:enabled});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await chooseTask(d);
  button('下一步：生成项目框架').click();await wait(()=>d.querySelector('.gen-loading[role="status"]'));
  assert.equal(d.querySelector('.gen-loading input,.gen-conversion-process'),null);
  await wait(()=>d.querySelector('.knowledge-match-task'));
  assert.equal(d.querySelectorAll('.knowledge-match-chip').length,0,'knowledge matching starts empty');
  assert.equal(d.querySelectorAll('.knowledge-stage-nav button').length,6);
  const taskId=d.querySelector('.knowledge-match-task').dataset.taskId;
  const task=()=>d.querySelector(`.knowledge-match-task[data-task-id="${taskId}"]`);
  const chip=()=>task()?.querySelector('.knowledge-match-chip');
  const openPicker=async()=>{task().querySelector('.gen-graph-picker').click();await wait(()=>d.querySelector('.knowledge-picker-drawer input'));};
  await openPicker();
  const first=d.querySelector('.knowledge-picker-drawer input[type="checkbox"]');
  const name=first.getAttribute('aria-label');
  const pickerInput=()=>d.querySelector(`.knowledge-picker-drawer input[aria-label="${name}"]`);
  first.click();await wait(()=>pickerInput().checked);
  d.querySelector('.knowledge-picker-drawer .outlined').click();await wait(()=>!d.querySelector('.knowledge-picker-drawer'));
  assert.equal(chip(),null,'cancel does not commit picker draft');
  await openPicker();assert.equal(pickerInput().checked,false);
  d.querySelector('.knowledge-picker-drawer').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!d.querySelector('.knowledge-picker-drawer'));
  assert.ok(d.querySelector('.generation-modal'),'Escape closes only the knowledge picker');
  assert.equal(d.activeElement,task().querySelector('.gen-graph-picker'));
  const otherTask=d.querySelectorAll('.knowledge-match-task')[1]?.textContent;
  await openPicker();pickerInput().click();await wait(()=>pickerInput().checked);
  button('确定关联').click();await wait(()=>!d.querySelector('.knowledge-picker-drawer'));
  assert.ok(chip());assert.match(chip().textContent,new RegExp(name.slice(2)));
  assert.equal(d.querySelectorAll('.knowledge-match-task')[1]?.textContent,otherTask,'only the target task changes');
  assert.match(d.querySelector('.knowledge-stage-nav button[aria-current="step"]').textContent,/1\s*(?:个)?知识点/);
  await wait(()=>!button('上一步').disabled);button('上一步').click();await wait(()=>d.querySelector('.gen-task-source input'));
  button('下一步：生成项目框架').click();await wait(()=>d.querySelector('.knowledge-match-task'));
  assert.ok(chip(),'returning to the same generated framework retains manual choices');
  chip().querySelector('input[type=checkbox]').click();await wait(()=>!chip());
  await wait(()=>!button('上一步').disabled);button('上一步').click();await wait(()=>d.querySelector('.gen-task-source input'));
  button('下一步：生成项目框架').click();await wait(()=>d.querySelector('.knowledge-match-task'));
  assert.equal(chip(),null,'an explicitly cleared task remains empty after return');
  await openPicker();assert.equal(pickerInput().checked,false);pickerInput().click();await wait(()=>pickerInput().checked);button('确定关联').click();await wait(()=>!d.querySelector('.knowledge-picker-drawer'));
  d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').click();await wait(()=>d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').checked);
  await wait(()=>!button('确认生成').disabled);button('确认生成').click();await wait(()=>button('确认覆盖'));button('确认覆盖').click();await wait(()=>!d.querySelector('.generation-modal'));
  assert.equal(d.querySelectorAll('.stage').length,6);assert.equal(d.querySelectorAll('.task-description-summary').length,15);
  await wait(()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0].stages.length===6);
  const project=JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0];
  const linked=project.stages.flatMap(stage=>stage.tasks).filter(item=>item.contents.some(content=>content.knowledgeNodeId));
  assert.equal(linked.length,1);assert.equal(linked[0].id,taskId);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('CMS landing filters four tiers and cultivation hides model and persists disabled state',async()=>{
 const {dom,d,button,errors}=mount({cms:true,config:enabled});
 try{
  await wait(()=>button('管理'));
  const filter=d.querySelector('[aria-label="筛选AI课档位"]');
  assert.deepEqual([...filter.options].slice(1).map(o=>o.textContent),['卓越课','精品课','精品培育课','培育课']);
  filter.value='培育课';filter.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,20));button('查询').click();await wait(()=>!button('管理'));
  assert.match(d.body.textContent,/暂无符合筛选条件/);button('清空').click();await wait(()=>button('管理'));
  button('管理').click();await wait(()=>d.querySelector('[aria-label="AI课档位"]'));
  const tier=d.querySelector('[aria-label="AI课档位"]');tier.value='培育课';tier.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
  await wait(()=>!button('产教模型'));assert.equal(d.querySelector('#cms-industry'),null);assert.equal(button('前往产教模型配置'),undefined);
  button('保存并返回课程').click();await wait(()=>JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).tier==='培育课');assert.equal(JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).industryEnabled,false);
  tier.value='精品培育课';tier.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await wait(()=>button('产教模型'));assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('job-name fallback saves disabled jobs and activates file course entry',async()=>{
 const cfg=normalizeConfig({major:{code:'010102'}});
 const {dom,d,button,errors}=mount({cms:true,config:cfg});let course;
 try{
  await wait(()=>button('管理'));button('管理').click();await wait(()=>button('产教模型'));button('产教模型').click();
  const toggle=d.querySelector('[aria-label="按岗位名称匹配"]');assert.ok(toggle);toggle.click();
  await wait(()=>d.querySelectorAll('.cms-job-table tbody tr').length>0);
  const rows=d.querySelectorAll('.cms-job-table tbody tr');assert.equal(rows.length,6);
  rows[0].querySelector('input').click();await wait(()=>!rows[0].querySelector('input').checked);
  button('保存并返回课程').click();await wait(()=>JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).matchingMode==='job-name');
  const saved=JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY));assert.equal(saved.disabledJobIds.length,1);assert.equal(saved.industryEnabled,true);
  course=mount({file:true,hash:configHash(saved)});await wait(()=>course.button('AI 生成框架'));
  assert.equal(course.button('AI 生成框架').getAttribute('aria-haspopup'),'menu');
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();course?.dom.window.close();}
});

test('job-name course filters disabled jobs and allows adding real task content',async()=>{
 let config=normalizeConfig({major:{code:'010102'},matchingMode:'job-name'});
 config=normalizeConfig({...config,disabledJobIds:[config.matchedJobs[0].id]});
 const {dom,d,button,input,errors}=mount({file:true,hash:configHash(config)});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();
  await chooseRole(d);
  assert.equal(d.querySelectorAll('.gen-role-list button').length,5);assert.doesNotMatch(d.querySelector('.gen-role-list').textContent,/逻辑学教学助理/);
  await wait(()=>d.querySelector('[aria-label="添加典型工作任务"]'));d.querySelector('[aria-label="添加典型工作任务"]').click();await wait(()=>d.querySelector('[aria-label="编辑典型工作任务"]'));
  input(d.querySelector('[aria-label="编辑典型工作任务"]'),'论证材料核验');await wait(()=>d.querySelector('[aria-label="编辑典型工作任务"]').value==='论证材料核验');assert.equal(button('辅助生成能力项'),undefined);assert.equal(d.querySelectorAll('.gen-ability').length,0);
  d.querySelectorAll('.gen-role-list button')[1].click();await wait(()=>!d.querySelector('.gen-task-source'));await chooseRole(d);d.querySelector('.gen-task-options input[type=radio]').click();await wait(()=>d.querySelector('[aria-label="编辑典型工作任务"]'));assert.equal(d.querySelector('[aria-label="编辑典型工作任务"]').value,'论证材料核验');assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

for(const storage of [
 {'ai-course-knowledge-enabled-v1':false},
 {'ai-course-knowledge-v1':{nodes:[{id:'root',level:1,name:'课程'}],links:[]}}
])test(`two-step wizard skips unavailable knowledge and confirms replacement (${Object.keys(storage)[0]})`,async()=>{
 const {dom,d,button,errors}=mount({config:enabled,storage});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await chooseRole(d);
  d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelector('.gen-task-source input'));button('下一步：生成项目框架').click();await wait(()=>d.querySelector('.knowledge-matching'));
  assert.equal(button('智能匹配').disabled,true);assert.equal(d.querySelectorAll('.knowledge-match-chip').length,0);
  d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').click();await wait(()=>d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').checked);
  await wait(()=>!button('确认生成').disabled);button('确认生成').click();await wait(()=>button('确认覆盖'));button('确认覆盖').click();await wait(()=>!d.querySelector('.generation-modal'));
  await wait(()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0].stages.length===6);
  const project=JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0];
  assert.equal(project.stages.length,6);assert.ok(project.stages.every(s=>s.tasks.every(t=>t.contents.length===0)));assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('cultural fallback displays usable task demos despite old numeric drafts',async()=>{
 const config=normalizeConfig({major:{code:'010101'},matchingMode:'job-name'});
 const job=config.matchedJobs[0];assert.equal(job.name,'文化研究助理');assert.equal(job.taskCount,3);assert.equal(job.abilityCount,27);
 const {dom,d,button,errors}=mount({config,storage:{'ai-course-custom-roles-v1:local-smart-manufacturing':[{...job,major:'010101',tasks:[{id:'old-444',title:'444',abilities:[]}]}]}});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await chooseRole(d);
  assert.equal(d.querySelectorAll('.gen-task-options input').length,3);assert.doesNotMatch(d.querySelector('.gen-task-options').textContent,/444/);
  assert.match(d.querySelector('.gen-task-options').textContent,/地方文化专题资料检索与整理/);
  d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelectorAll('.gen-ability input:checked').length===9);
  assert.equal(d.querySelector('.gen-task-source textarea,.gen-task-source input[type=text],.gen-task-source .gen-section-title,.gen-task-source .gen-ability small'),null);
  button('下一步：生成项目框架').click();await wait(()=>d.querySelector('.knowledge-matching'));assert.equal(d.querySelector('[role="alert"]'),null);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('job generation persists appended tasks and replaces only after explicit confirmation',async()=>{
 const {dom,d,button,errors}=mount({config:enabled});
 const saved=()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'));
 const openReview=async()=>{
  button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();
  await chooseTask(d);
  button('下一步：生成项目框架').click();await wait(()=>button('确认生成'));
 };
 try{
  await wait(()=>button('AI 生成框架')&&saved()?.length);
  const before=saved(),target=before[0];
  await openReview();button('确认生成').click();await wait(()=>!d.querySelector('.generation-modal'));
  await wait(()=>saved()[0].stages.length===target.stages.length+6);
  const appended=saved();assert.equal(appended.length,before.length);assert.deepEqual(appended.slice(1),before.slice(1));
  assert.equal(appended[0].stages.length,target.stages.length+6);
  assert.deepEqual(appended[0].stages.slice(0,target.stages.length),target.stages);
  assert.equal(appended[0].title,target.title);
  await openReview();assert.equal(d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').checked,false);
  d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').click();await wait(()=>d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').checked);
  button('确认生成').click();await wait(()=>button('确认覆盖'));
  assert.deepEqual(saved(),appended);
  button('取消覆盖').click();await wait(()=>!button('确认覆盖'));assert.deepEqual(saved(),appended);
  button('确认生成').click();await wait(()=>button('确认覆盖'));button('确认覆盖').click();
  await wait(()=>!d.querySelector('.generation-modal'));
  await wait(()=>saved()[0].stages.length===6);
  const replaced=saved();assert.equal(replaced[0].id,target.id);assert.equal(replaced[0].stages.length,6);
  assert.equal(replaced[0].stages.some(s=>target.stages.some(old=>old.id===s.id)),false);
  assert.deepEqual(replaced.slice(1),before.slice(1));assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
