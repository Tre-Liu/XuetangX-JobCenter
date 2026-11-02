import {DEMO_REVISION} from '../src/manufacturing-projects.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
import {catalog,sampleContext,defaultDesign,generateProject,draftRole} from '../src/generation/model.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
async function mount(role,config,context=sampleContext){
 const task=role.tasks[0];const design={...defaultDesign(role,task),object:'教学工作站',tools:'操作手册'};
 const project=generateProject({context,role,task,abilities:task.abilities.slice(0,3),design,confirmed:true});
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;if(config)w.localStorage.setItem('ai-course-cms-v1:local-smart-manufacturing',JSON.stringify(config));w.localStorage.setItem(DEMO_REVISION,'done');w.localStorage.setItem('ai-course-projects-v1',JSON.stringify([project]));}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('岗位图谱未到达预期状态');};
 await wait(()=>d.querySelector('.learning-brief'));
 await wait(()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0].knowledgeLimitVersion===1);
 return {dom,d,wait,errors,project};
}
test('project overview annotates saved associations above the workspace tabs',async()=>{
 const {dom,d,errors,project}=await mount(catalog[0]);
 try{
  const before=dom.window.localStorage.getItem('ai-course-projects-v1');
  const relations=d.querySelector('.project-hero + [aria-label="任务关联信息"]');
  assert.ok(relations);
  assert.ok(relations.nextElementSibling.matches('.project-workspace-tabs'));
  assert.equal(d.querySelector('.learning-brief .learning-relations'),null);
  assert.equal(d.querySelector('.learning-brief .competency-map'),null);
  assert.equal(d.querySelector('.learning-provenance'),null);
  assert.ok(relations.textContent.includes(project.learningDesign.role.name));
  assert.ok(relations.textContent.includes(project.learningDesign.sourceTask.title));
  assert.equal(relations.querySelectorAll('li').length,3);
  for(const ability of project.learningDesign.abilities)assert.ok(relations.textContent.includes(ability.title));
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),before);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('manual roles keep their task annotations without inferred industry information',async()=>{
 const {dom,d,errors}=await mount(draftRole(sampleContext,'视觉检测员','检查零件外观'));
 try{
  const relations=d.querySelector('.learning-relations');
  assert.match(relations.textContent,/视觉检测员/);
  assert.match(relations.textContent,/检查零件外观/);
  assert.equal(d.querySelector('.competency-ancestry'),null);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('CMS configuration does not replace the saved project job and task annotations',async()=>{
 const {chains}=await import('../src/cms/config.mjs');
 const config={major:{code:'460305'},chainIds:[chains[0].id,chains[1].id]};
 const {dom,d}=await mount(draftRole(sampleContext,'前端开发工程师','课程页面组件开发'),config);
 try{
  assert.match(d.querySelector('.learning-relations').textContent,/前端开发工程师/);
  assert.match(d.querySelector('.learning-relations').textContent,/课程页面组件开发/);
  assert.equal(d.querySelector('.competency-course-chains'),null);
 }finally{dom.window.close();}
});
test('project preview includes the same read-only association annotations',async()=>{
 const {dom,d,wait,project}=await mount(catalog[0]);
 try{
  [...d.querySelectorAll('button')].find(button=>button.textContent.trim()==='预览').click();
  await wait(()=>d.querySelector('.project-preview-header + .learning-relations'));
  const relations=d.querySelector('.project-preview-header + .learning-relations');
  assert.ok(relations.textContent.includes(project.learningDesign.role.name));
  for(const ability of project.learningDesign.abilities)assert.ok(relations.textContent.includes(ability.title));
  assert.equal(d.querySelector('.preview-learning-design textarea'),null);
  assert.equal(d.querySelector('.preview-learning-design .competency-map'),null);
 }finally{dom.window.close();}
});
