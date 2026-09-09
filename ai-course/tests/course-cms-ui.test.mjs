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
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const url=file?new URL(cms?'../cms/index.html':'../index.html',import.meta.url).href+hash:'http://localhost/'+(cms?'cms/index.html':'')+hash;
 const dom=new JSDOM(cms?cmsHTML:html,{url,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;if(!file){if(config)w.localStorage.setItem(CONFIG_KEY,JSON.stringify(config));for(const [key,value]of Object.entries(storage))w.localStorage.setItem(key,JSON.stringify(value));}}});
 const d=dom.window.document,button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const input=(el,value)=>{Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 return {dom,d,button,input,errors};
}
test('CMS standalone script is self contained; saved major and model transfer through file navigation',async()=>{
 assert.doesNotMatch(cmsHTML,/<script[^>]+src=|<script[^>]+type="module"/);
 new vm.Script(cmsHTML.match(/<script>([\s\S]*?)<\/script>/)[1]);
 const cms=mount({cms:true,file:true,hash:configHash(enabled)});let course;
 try{await wait(()=>cms.button('配置课程'));const link=cms.d.querySelector('.cms-page-heading a');
  assert.equal(fromHash(new URL(link.href).hash).industryEnabled,true);
  course=mount({file:true,hash:new URL(link.href).hash});await wait(()=>course.button('AI 生成框架'));
  assert.equal(course.button('AI 生成框架').getAttribute('aria-haspopup'),'menu');
  course.button('AI 生成框架').click();await wait(()=>course.d.querySelector('[aria-label="岗位任务驱动"]'));
  course.d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>course.d.querySelector('[aria-label="课程已关联专业"]'));
  assert.equal(course.d.querySelector('[aria-label="课程已关联专业"]').value,'460305 · 工业机器人技术');assert.deepEqual(cms.errors,[]);assert.deepEqual(course.errors,[]);
 }finally{cms.dom.window.close();course?.dom.window.close();}
});
test('course confirms major before chain matching; cancel preserves existing association',async()=>{
 const {dom,d,button,input,errors}=mount({cms:true});
 try{await wait(()=>button('配置课程'));button('配置课程').click();await wait(()=>button('产教模型'));button('产教模型').click();await wait(()=>!d.querySelector('#cms-industry').hidden);
  assert.equal(d.querySelectorAll('.cms-chain').length,0);assert.equal(d.querySelectorAll('[role="switch"]').length,0);assert.match(d.querySelector('.cms-pending').textContent,/待关联专业/);
  button('关联专业').click();await wait(()=>d.querySelector('.cms-major-modal'));
  assert.equal(button('确定').disabled,true);button('职教').click();input(d.querySelector('[aria-label="搜索官方专业"]'),'460305');await wait(()=>d.querySelectorAll('.cms-major-results input').length===1);
  d.querySelector('.cms-major-results input').click();await wait(()=>!button('确定').disabled);assert.equal(d.querySelectorAll('.cms-chain').length,0);
  button('取消').click();await wait(()=>!d.querySelector('.cms-major-modal'));assert.equal(d.querySelectorAll('.cms-chain').length,0);
  button('关联专业').click();await wait(()=>button('职教'));button('职教').click();input(d.querySelector('[aria-label="搜索官方专业"]'),'460305');await wait(()=>d.querySelectorAll('.cms-major-results input').length===1);d.querySelector('.cms-major-results input').click();await wait(()=>!button('确定').disabled);button('确定').click();await wait(()=>d.querySelectorAll('.cms-chain').length===2);
  assert.equal(d.querySelector('[role="switch"]'),null);assert.doesNotMatch(d.querySelector('#cms-industry').textContent,/规则推荐 · 待人工确认|启用产教模型|至少确认一条/);d.querySelector('.cms-chain input').click();await wait(()=>d.querySelector('.cms-chain input').checked);
  button('保存配置').click();await wait(()=>JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).industryEnabled);
  d.querySelector('.cms-chain input').click();await wait(()=>!d.querySelector('.cms-chain input').checked);button('保存配置').click();await wait(()=>JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).industryEnabled===false);
  button('重新关联专业').click();await wait(()=>button('本科'));button('本科').click();input(d.querySelector('[aria-label="搜索官方专业"]'),'010101');await wait(()=>d.querySelectorAll('.cms-major-results input').length===1);d.querySelector('.cms-major-results input').click();await new Promise(r=>setTimeout(r,20));button('确定').click();await wait(()=>!d.querySelector('.cms-major-modal'));
  assert.equal(d.querySelector('[role="switch"]'),null);assert.equal(d.querySelectorAll('.cms-chain').length,0);assert.match(d.querySelector('#cms-industry .cms-empty').textContent,/暂无匹配推荐/);
  button('查看全部产业链').click();await wait(()=>d.querySelectorAll('.cms-chain').length===19);button('保存配置').click();await wait(()=>JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).major.code==='010101');assert.deepEqual(JSON.parse(dom.window.localStorage.getItem(CONFIG_KEY)).chainIds,[]);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('live CMS disable closes stale job conversation and restores direct topic generation',async()=>{
 const {dom,d,button,errors}=mount({config:enabled});
 try{await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>button('下一步')&&!button('下一步').disabled);
  button('下一步').click();await wait(()=>d.querySelector('.gen-loading'));
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
 try{await wait(()=>button('配置课程'));button('配置课程').click();await wait(()=>d.querySelector('[role="tab"]'));
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
  assert.equal(button('下一步').disabled,true);
  await wait(()=>button('下一步')&&!button('下一步').disabled);button('下一步').click();
  await wait(()=>d.querySelector('.gen-stepper .current')?.textContent.includes('岗位与任务')&&!d.querySelector('.gen-loading'));
  assert.ok(!d.querySelector('.conversation-input-card'),'controls wait for Markdown');
  assert.ok(!d.querySelector('.conversation-history'),'history is removed');
  await wait(()=>d.querySelector('[aria-label="搜索岗位"]'));
  assert.equal(d.querySelectorAll('.conversation-markdown ol li').length,4);
  assert.ok(d.querySelector('.conversation-markdown strong'));
  button('上一步').click();await wait(()=>d.querySelector('[aria-label="课程已关联专业"]'));
  assert.ok(!d.querySelector('.conversation-history'),'history is removed');assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

for(const file of [false,true])test(`job wizard keeps blocking feedback beside Next and focuses the missing selection (${file?'file':'http'})`,async()=>{
 const {dom,d,button,errors}=mount({file,config:enabled,hash:file?configHash(enabled):''});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();
  await wait(()=>button('下一步')&&!button('下一步').disabled);button('下一步').click();await wait(()=>d.querySelector('.gen-role-list button'));
  d.querySelector('.gen-role-list button').click();await wait(()=>d.querySelector('.gen-task-options'));
  button('下一步').click();await wait(()=>d.querySelector('[role="alert"]'));
  assert.ok(d.querySelector('.modal > footer [role="alert"]'),'validation must remain beside Next outside the scrolling form');
  assert.match(d.querySelector('[role="alert"]').textContent,/典型工作任务/);
  assert.equal(d.activeElement,d.querySelector('.gen-task-picker'));
  d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelector('.gen-ability'));
  assert.equal(d.querySelectorAll('.gen-ability input:checked').length,d.querySelectorAll('.gen-ability input[type=checkbox]').length);
  for(const checkbox of d.querySelectorAll('.gen-ability input[type=checkbox]')){checkbox.click();await new Promise(r=>setTimeout(r,10));}
  button('下一步').click();await wait(()=>d.querySelector('[role="alert"]'));
  assert.match(d.querySelector('.modal > footer [role="alert"]').textContent,/岗位能力/);
  assert.equal(d.activeElement,d.querySelector('.gen-task-source'));
  d.querySelector('.gen-ability input[type=checkbox]').click();await wait(()=>!d.querySelector('[role="alert"]'));
  button('下一步').click();await wait(()=>button('下一步：知识点匹配')&&!button('下一步：知识点匹配').disabled);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('review explanations edit inline and survive back navigation and project creation',async()=>{
 const config=normalizeConfig({major:{code:'080901'},chainIds:[matchChains('080901')[0].id],industryEnabled:true});
 const {dom,d,button,input,errors}=mount({file:true,hash:configHash(config)});
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();
  await wait(()=>button('下一步')&&!button('下一步').disabled);button('下一步').click();await wait(()=>d.querySelector('.gen-role-list button'));
  d.querySelector('.gen-role-list button').click();await wait(()=>d.querySelector('.gen-task-options input'));d.querySelector('.gen-task-options input').click();await wait(()=>d.querySelector('.gen-ability input'));d.querySelector('.gen-ability input[type=checkbox]').click();
  button('下一步').click();await wait(()=>button('下一步：知识点匹配')&&!button('下一步：知识点匹配').disabled);
  for(const field of d.querySelectorAll('.gen-form-grid input,.gen-form-grid textarea'))assert.ok(field.value.trim());
  button('下一步：知识点匹配').click();await wait(()=>button('匹配相关知识点'));button('匹配相关知识点').click();await wait(()=>d.querySelector('.gen-match-nodes input'));if(!d.querySelector('.gen-match-nodes input').checked)d.querySelector('.gen-match-nodes input').click();await new Promise(r=>setTimeout(r,20));button('下一步').click();await wait(()=>d.querySelector('.gen-preview-stages'));
  const projectEditor=d.querySelector('textarea[aria-label="项目说明"]');assert.ok(projectEditor,'project explanation is editable in review');
  input(projectEditor,'教师修订的项目说明');await wait(()=>projectEditor.value==='教师修订的项目说明');
  const taskEditors=[...d.querySelectorAll('.gen-preview-stages textarea[aria-label="任务说明"]')];assert.equal(taskEditors.length,6);
  for(const [i,editor]of taskEditors.entries())input(editor,i===5?'':`教师修订第${i+1}阶段说明`);
  await wait(()=>d.querySelectorAll('.gen-preview-stages textarea')[0].value==='教师修订第1阶段说明');
  button('上一步').click();await wait(()=>d.querySelector('.gen-match-nodes input'));assert.equal(d.querySelector('.gen-match-nodes input').checked,true);button('下一步').click();await wait(()=>d.querySelector('.gen-preview-stages'));
  assert.equal(d.querySelector('textarea[aria-label="项目说明"]').value,'教师修订的项目说明');
  assert.equal(d.querySelectorAll('.gen-preview-stages textarea')[5].value,'');
  button('确认并覆盖当前项目').click();await wait(()=>!d.querySelector('.generation-modal'));
  assert.equal(d.querySelector('textarea[aria-label="项目说明"]').value,'教师修订的项目说明');
  const descriptions=[...d.querySelectorAll('textarea[aria-label="任务说明"]')];assert.equal(descriptions[0].value,'教师修订第1阶段说明');assert.equal(descriptions[5].value,'');assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
