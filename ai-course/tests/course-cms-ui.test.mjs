import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM,VirtualConsole} from 'jsdom';
import {CONFIG_KEY,configHash,fromHash,normalizeConfig,matchChains} from '../src/cms/config.mjs';
const enabled=normalizeConfig({major:{code:'460305'},chainIds:[matchChains('460305')[0].id],industryEnabled:true});
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const cmsHTML=fs.readFileSync(new URL('../cms/index.html',import.meta.url),'utf8');
const wait=async fn=>{for(let i=0;i<500;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}assert.fail('CMS conversation UI state not reached');};
function mount({cms=false,file=false,config,hash='',storage={}}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type==='not-implemented'&&/navigation/i.test(e.message))return;errors.push(e.message);});
 const url=file?new URL(cms?'../cms/index.html':'../index.html',import.meta.url).href+hash:'http://localhost/'+(cms?'cms/index.html':'')+hash;
 const dom=new JSDOM(cms?cmsHTML:html,{url,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});if(!file){if(config)w.localStorage.setItem(CONFIG_KEY,JSON.stringify(config));for(const [key,value]of Object.entries(storage))w.localStorage.setItem(key,JSON.stringify(value));}}});
 const d=dom.window.document,button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const input=(el,value)=>{Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 return {dom,d,button,input,errors};
}
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
  assert.equal(course.d.querySelector('[aria-label="课程已关联专业"]').textContent,'工业机器人技术 · 460305');assert.deepEqual(cms.errors,[]);assert.deepEqual(course.errors,[]);
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
test('live CMS disable closes stale job conversation and restores direct topic generation',async()=>{
 const {dom,d,button,errors}=mount({config:enabled});
 try{await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>button('确认')&&!button('确认').disabled);
  d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelector('.gen-ability'));button('确认').click();await wait(()=>d.querySelector('.gen-loading'));
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
  assert.equal(d.querySelectorAll('.conversation-message,.gen-stepper,.modal input,.modal textarea').length,0);
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

test('job wizard shows current Markdown before revealing controls without history',async()=>{
 const {dom,d,button,errors}=mount({config:enabled});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();
  await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();
  await wait(()=>d.querySelector('.current-prompt'));
  assert.ok(!d.querySelector('.conversation-input-card'),'controls wait for Markdown');
  assert.equal(button('确认').disabled,true);
  await wait(()=>d.querySelector('[aria-label="搜索岗位"]'));
  assert.equal(d.querySelectorAll('.conversation-markdown ol li').length,4);
  assert.ok(d.querySelector('.conversation-markdown strong'));
  assert.equal(d.querySelectorAll('.gen-stepper>div').length,2);
  assert.ok(!d.querySelector('.conversation-history'),'history is removed');assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

for(const file of [false,true])test(`job wizard keeps blocking feedback beside Next and focuses the missing selection (${file?'file':'http'})`,async()=>{
 const {dom,d,button,errors}=mount({file,config:enabled,hash:file?configHash(enabled):''});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();
  await wait(()=>button('确认')&&!button('确认').disabled);await wait(()=>d.querySelector('.gen-role-list button'));
  d.querySelector('.gen-role-list button').click();await wait(()=>d.querySelector('.gen-task-options'));
  assert.equal(d.querySelectorAll('.gen-task-options input:checked').length,1);
  await wait(()=>d.querySelector('.gen-ability'));
  assert.equal(d.querySelectorAll('.gen-ability input:checked').length,d.querySelectorAll('.gen-ability input[type=checkbox]').length);
  for(const checkbox of d.querySelectorAll('.gen-ability input[type=checkbox]')){checkbox.click();await new Promise(r=>setTimeout(r,10));}
  button('确认').click();await wait(()=>d.querySelector('[role="alert"]'));
  assert.match(d.querySelector('.modal > footer [role="alert"]').textContent,/岗位能力/);
  assert.equal(d.activeElement,d.querySelector('.gen-task-source'));
  d.querySelector('.gen-ability input[type=checkbox]').click();await wait(()=>!d.querySelector('[role="alert"]'));
  button('确认').click();await wait(()=>d.querySelector('.gen-match-tasks')&&button('确认')&&!button('确认').disabled);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('two-step wizard preserves matches on return, accepts graph nodes and creates directly',async()=>{
 const {dom,d,button,errors}=mount({config:enabled});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>d.querySelector('.gen-task-options input'));
  d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelector('.gen-ability input'));button('确认').click();await wait(()=>d.querySelector('.gen-conversion-process'));
  assert.equal(d.querySelector('.generation-modal footer button.primary').disabled,true);assert.equal(d.querySelector('.gen-loading input'),null);
  await wait(()=>d.querySelector('.gen-match-nodes input'));
  assert.equal(d.querySelectorAll('.gen-stepper>div').length,2);
  assert.ok([...d.querySelectorAll('.gen-match-nodes input')].every(el=>el.checked));
  assert.match(d.querySelector('.gen-process-record').textContent,/课程学习目标.*工作对象.*迁移与挑战/s);
  const first=d.querySelector('.gen-match-nodes input'),name=first.getAttribute('aria-label');first.click();await wait(()=>!d.querySelector(`.gen-match-stage:first-child > details:first-of-type input[aria-label="${name}"]`));
  const drawerInput=()=>d.querySelector(`.knowledge-picker-drawer input[aria-label="${name.replace('匹配','选择')}"]`);
  d.querySelector('.gen-graph-picker').click();await wait(drawerInput);
  assert.equal(drawerInput().checked,false);
  drawerInput().click();await wait(()=>drawerInput().checked);
  d.querySelector('.knowledge-picker-drawer .outlined').click();await wait(()=>!d.querySelector('.knowledge-picker-drawer'));
  assert.equal(d.querySelector(`.gen-match-stage:first-child > details:first-of-type input[aria-label="${name}"]`),null,'cancel must preserve saved selection');
  d.querySelector('.gen-graph-picker').click();await wait(drawerInput);
  assert.equal(drawerInput().checked,false);
  d.querySelector('.knowledge-picker-drawer').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!d.querySelector('.knowledge-picker-drawer'));
  assert.ok(d.querySelector('.generation-modal'),'Escape closes only the drawer');
  assert.ok(d.activeElement===d.querySelector('.gen-graph-picker'),'focus returns to the selector button');
  button('上一步').click();await wait(()=>d.querySelector('.gen-task-source input'));button('确认').click();await wait(()=>d.querySelector('.gen-match-nodes input'));
  assert.equal(d.querySelector(`.gen-match-stage:first-child > details:first-of-type input[aria-label="${name}"]`),null);
  const otherTask=d.querySelectorAll('.gen-match-stage>details')[1].textContent;
  d.querySelector('.gen-graph-picker').click();await wait(drawerInput);
  drawerInput().click();await wait(()=>drawerInput().checked);
  button('确认选择').click();await wait(()=>!d.querySelector('.knowledge-picker-drawer'));
  assert.ok(d.querySelector(`.gen-match-stage:first-child > details:first-of-type input[aria-label="${name}"]`).checked);
  assert.equal(d.querySelectorAll('.gen-match-stage>details')[1].textContent,otherTask,'only the target task changes');
  button('确认').click();await wait(()=>!d.querySelector('.generation-modal'));
  assert.equal(d.querySelectorAll('.stage').length,6);assert.equal(d.querySelector('.gen-preview-stages'),null);
  assert.equal(d.querySelectorAll('.task-description-summary').length,15);assert.ok(d.querySelectorAll('.content-row').length>3);assert.deepEqual(errors,[]);
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
  await wait(()=>button('确认')&&!button('确认').disabled);await wait(()=>d.querySelector('.gen-role-list button'));
  assert.equal(d.querySelectorAll('.gen-role-list button').length,5);assert.doesNotMatch(d.querySelector('.gen-role-list').textContent,/逻辑学教学助理/);
  await wait(()=>button('添加典型工作任务'));button('添加典型工作任务').click();await wait(()=>d.querySelector('[aria-label="编辑典型工作任务"]'));
  input(d.querySelector('[aria-label="编辑典型工作任务"]'),'论证材料核验');await wait(()=>d.querySelector('[aria-label="编辑典型工作任务"]').value==='论证材料核验');assert.equal(button('辅助生成能力项'),undefined);assert.equal(d.querySelectorAll('.gen-ability').length,0);
  d.querySelectorAll('.gen-role-list button')[1].click();await wait(()=>!d.querySelector('.gen-task-options input'));d.querySelector('.gen-role-list button').click();await wait(()=>d.querySelector('.gen-task-options input'));assert.equal(d.querySelector('[aria-label="编辑典型工作任务"]').value,'论证材料核验');assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

for(const storage of [
 {'ai-course-knowledge-enabled-v1':false},
 {'ai-course-knowledge-v1':{nodes:[{id:'root',level:1,name:'课程'}],links:[]}}
])test(`two-step wizard skips unavailable knowledge and creates without a review (${Object.keys(storage)[0]})`,async()=>{
 const {dom,d,button,errors}=mount({config:enabled,storage});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>d.querySelector('.gen-task-options input'));
  d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelector('.gen-task-source input'));button('确认').click();await wait(()=>button('暂不匹配'));
  assert.ok(button('暂不匹配').classList.contains('primary'));assert.equal(button('匹配相关知识点').disabled,true);
  button('确认').click();await wait(()=>!d.querySelector('.generation-modal'));
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
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>d.querySelector('.gen-task-options input'));
  assert.equal(d.querySelectorAll('.gen-task-options input').length,3);assert.doesNotMatch(d.querySelector('.gen-task-options').textContent,/444/);
  assert.match(d.querySelector('.gen-task-options').textContent,/地方文化专题资料检索与整理/);
  d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelectorAll('.gen-ability input:checked').length===9);
  assert.equal(d.querySelector('.gen-task-source textarea,.gen-task-source input[type=text],.gen-task-source .gen-section-title,.gen-task-source .gen-ability small'),null);
  button('确认').click();await wait(()=>button('暂不匹配'));assert.equal(d.querySelector('[role="alert"]'),null);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
