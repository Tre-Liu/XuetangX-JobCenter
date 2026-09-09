import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {catalog, sampleContext, defaultDesign, generateProject} from '../src/generation/model.mjs';

test('task explanation edits inline, persists line breaks and empty text, and previews read-only', async()=>{
 const role=catalog[0],task=role.tasks[0];
 const project=generateProject({context:sampleContext,role,task,abilities:task.abilities,design:defaultDesign(role,task),confirmed:true});
 delete project.stages[0].tasks[0].description;
 project.stages[0].tasks[0].learningActivity.support='教师自定义：提供工作站安全检查表';
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 async function mount(saved){
  const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem('ai-course-projects-v1',saved);}});
  const d=dom.window.document;
  const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Expected task explanation state');};
  await wait(()=>d.querySelector('.task-body'));
  return {dom,d,wait};
 }
 let state=await mount(JSON.stringify([project]));
 try{
  let {dom,d,wait}=state;
  let editor=d.querySelector('textarea[aria-label="任务说明"]');
  assert.ok(editor,'Task explanation must be directly editable');
  assert.match(editor.value,/学习目标/);assert.match(editor.value,/实施步骤/);assert.match(editor.value,/教师自定义：提供工作站安全检查表/);
  editor.focus();assert.equal(d.querySelector('.modal'),null);
  const revised='任务情境：核对工作站要求\n\n学习目标：识别安全约束\n成果：提交分析单 <不要转换为 HTML>';
  const change=value=>{Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(editor,value);editor.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
  change(revised);
  await wait(()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0].stages[0].tasks[0].description===revised);
  const stored=dom.window.localStorage.getItem('ai-course-projects-v1');
  dom.window.close();state=await mount(stored);({dom,d,wait}=state);
  editor=d.querySelector('textarea[aria-label="任务说明"]');assert.equal(editor.value,revised);
  [...d.querySelectorAll('button')].find(b=>b.textContent.trim()==='预览').click();
  await wait(()=>d.querySelector('.project-preview'));
  assert.equal(d.querySelector('.preview-task-card .task-description-text').textContent,revised);
  assert.equal(d.querySelector('.project-preview textarea'),null);
  [...d.querySelectorAll('button')].find(b=>b.textContent.trim()==='退出预览').click();
  await wait(()=>d.querySelector('textarea[aria-label="任务说明"]'));
  editor=d.querySelector('textarea[aria-label="任务说明"]');change('');
  await wait(()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0].stages[0].tasks[0].description==='');
  const empty=dom.window.localStorage.getItem('ai-course-projects-v1');dom.window.close();state=await mount(empty);
  assert.equal(state.d.querySelector('textarea[aria-label="任务说明"]').value,'');
 }finally{state.dom.window.close();}
});


test('project explanation replaces labels, preserves edits and clearing, and previews read-only', async()=>{
 const role=catalog[0],task=role.tasks[0];
 const project=generateProject({context:sampleContext,role,task,abilities:task.abilities,design:defaultDesign(role,task),confirmed:true});
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 let dom;
 const mount=async saved=>{
  dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem('ai-course-projects-v1',saved);}});
  await wait(()=>dom.window.document.querySelector('.learning-brief'));
 };
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Expected project explanation state');};
 const saved=()=>dom.window.localStorage.getItem('ai-course-projects-v1');
 const editor=()=>dom.window.document.querySelector('textarea[aria-label="项目说明"]');
 const change=value=>{Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(editor(),value);editor().dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 try{
  await mount(JSON.stringify([project]));
  assert.ok(editor(),'Project explanation must be directly editable');
  assert.equal(dom.window.document.querySelector('.learning-heading .gen-tag'),null);
  for(const text of [project.learningDesign.problem,project.learningDesign.learners,project.learningDesign.prerequisites,project.learningDesign.product])assert.ok(editor().value.includes(text));
  assert.ok(dom.window.document.querySelector('.competency-map'));
  const revised='核心问题：教师修改\n\n项目成果：提交记录 <保留文本>';
  change(revised);await wait(()=>JSON.parse(saved())[0].learningDesign.explanation===revised);
  let stored=saved();dom.window.close();await mount(stored);assert.equal(editor().value,revised);
  [...dom.window.document.querySelectorAll('button')].find(b=>b.textContent.trim()==='预览').click();
  await wait(()=>dom.window.document.querySelector('.project-preview'));
  assert.equal(dom.window.document.querySelector('.preview-learning-design .task-description-text').textContent,revised);
  assert.equal(dom.window.document.querySelector('.project-preview textarea'),null);
  [...dom.window.document.querySelectorAll('button')].find(b=>b.textContent.trim()==='退出预览').click();
  await wait(editor);change('');await wait(()=>JSON.parse(saved())[0].learningDesign.explanation==='');
  stored=saved();dom.window.close();await mount(stored);assert.equal(editor().value,'');
 }finally{dom?.window.close();}
});
