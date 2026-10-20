import {DEMO_REVISION} from '../src/manufacturing-projects.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {seedProject} from '../src/project.mjs';
test('new projects include editable driving question and uploaded explanation defaults',()=>{
 const p=seedProject();
 assert.equal(p.drivingQuestion.role.length>0,true);
 assert.equal(p.explanation.type,'image');
 assert.equal(p.explanation.assets.image.name,'智能制造项目流程.png');
});

import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const wait=async predicate=>{for(let i=0;i<150;i++){if(predicate())return;await new Promise(r=>setTimeout(r,10));}assert.fail('description UI did not reach expected state');};
test('description edits persist, cancellation is isolated, media deletion and preview use the saved state',async()=>{
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const fixture={id:'p',title:'产线改进',description:'产线项目',stages:[],sequential:true};
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem(DEMO_REVISION,'done');w.localStorage.setItem('ai-course-projects-v1',JSON.stringify([fixture]));}});
 const d=dom.window.document;
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const saved=()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0];
 try{
  await wait(()=>d.querySelector('.project-title'));d.querySelector('.project-title').click();await wait(()=>d.querySelector('.driving-question textarea'));
  const fields=[...d.querySelectorAll('.driving-question textarea')];
  assert.deepEqual(fields.map(n=>n.maxLength),[200,500,500,1000]);
  for(const [i,value] of ['工程师','自动化产线','质量波动','如何提升质量稳定性？'].entries()){
   Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(fields[i],value);
   fields[i].dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  }
  await wait(()=>d.querySelector('.field-count').textContent.includes('1000'));
  button('确定').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(saved().drivingQuestion.role,'工程师');assert.equal(saved().drivingQuestion.outline,'如何提升质量稳定性？');
  assert.match(d.querySelector('.question-summary').textContent,/质量波动/);
  assert.equal(d.querySelector('.question-summary h3'),null);
  assert.equal(d.querySelector('.project-description-panel .question-summary'),null);
  assert.ok(d.querySelector('.project-description-panel').compareDocumentPosition(d.querySelector('.project-question-panel'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  button('视频讲解').click();await wait(()=>d.querySelector('video'));
  button('删除').click();await wait(()=>d.querySelector('.explanation-upload'));
  assert.equal(saved().explanation.assets.video,null);
  d.querySelector('.hero-actions button:nth-child(2)').click();await wait(()=>d.querySelector('.project-preview'));
  assert.match(d.querySelector('.project-preview').textContent,/暂无讲解素材/);
  assert.equal(d.querySelector('.project-preview .explanation-types'),null);
  assert.equal(d.querySelector('.project-preview .question-summary h3'),null);
  assert.match(d.querySelector('.project-preview .project-question-panel').textContent,/质量波动/);
  assert.ok(d.querySelector('.project-preview .project-description-panel').compareDocumentPosition(d.querySelector('.project-preview .project-question-panel'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  button('退出预览').click();await wait(()=>d.querySelector('.project-title'));
  button('AI 生成框架').click();await wait(()=>button('开始生成'));
  assert.equal(d.querySelectorAll('.driving-question textarea').length,4);
  assert.equal(d.querySelector('[aria-label="角色"]').value,'工程师');
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(saved().drivingQuestion.role,'工程师');
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
