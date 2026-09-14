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
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;if(config)w.localStorage.setItem('ai-course-cms-v1:local-smart-manufacturing',JSON.stringify(config));w.localStorage.setItem('ai-course-projects-v1',JSON.stringify([project]));}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('岗位图谱未到达预期状态');};
 await wait(()=>d.querySelector('.learning-brief'));
 await wait(()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0].knowledgeLimitVersion===1);
 return {dom,d,wait,errors,project};
}
test('existing saved projects show selected abilities and expand industry ancestry without changing data',async()=>{
 const {dom,d,wait,errors,project}=await mount(catalog[0]);
 try{
  const graph=d.querySelector('[aria-label="岗位能力图谱"]');assert.ok(graph,'学习说明应展示岗位能力图谱');
  assert.match(graph.textContent,/工业机器人工作站操作与验收/);assert.match(graph.textContent,/D2：工业机器人操作/);assert.match(graph.textContent,/机器人操作工/);
  const before=dom.window.localStorage.getItem('ai-course-projects-v1');
  assert.equal(d.querySelector('.competency-abilities'),null);assert.equal(d.querySelector('.competency-ancestry'),null);
  d.querySelector('[aria-label="展开相关能力项"]').click();await wait(()=>d.querySelector('.competency-abilities'));
  assert.equal(d.querySelectorAll('.competency-ability').length,3);
  for(const a of project.learningDesign.abilities)assert.ok(d.querySelector('.competency-abilities').textContent.includes(a.title));
  d.querySelector('[aria-label="展开产业环节与产业链"]').click();await wait(()=>d.querySelector('.competency-ancestry'));
  assert.match(d.querySelector('.competency-ancestry').textContent,/机器人本体制造与系统集成/);assert.match(d.querySelector('.competency-ancestry').textContent,/机器人产业链/);assert.match(d.querySelector('.competency-ancestry').textContent,/待复核/);
  d.querySelector('[aria-label="收起相关能力项"]').click();await wait(()=>!d.querySelector('.competency-abilities'));
  assert.ok(d.querySelector('.competency-ancestry'));
  d.querySelector('[aria-label="收起产业环节与产业链"]').click();await wait(()=>!d.querySelector('.competency-ancestry'));
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),before);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('manual roles show missing industry mapping instead of inheriting sample ancestry',async()=>{
 const {dom,d,wait,errors}=await mount(draftRole(sampleContext,'视觉检测员','检查零件外观'));
 try{
  assert.ok(d.querySelector('[aria-label="岗位能力图谱"]'));
  d.querySelector('[aria-label="展开产业环节与产业链"]').click();await wait(()=>d.querySelector('.competency-ancestry'));
  assert.match(d.querySelector('.competency-ancestry').textContent,/暂未关联产业环节与产业链/);
  assert.doesNotMatch(d.querySelector('.competency-ancestry').textContent,/机器人产业链/);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('saved CMS chains appear on old manual projects and react to configuration changes',async()=>{
 const {chains,CONFIG_KEY}=await import('../src/cms/config.mjs');
 const config={major:{code:'460305'},chainIds:[chains[0].id,chains[1].id]};
 const {dom,d,wait}=await mount(draftRole(sampleContext,'前端开发工程师','课程页面组件开发'),config);
 try{
 d.querySelector('[aria-label="展开产业环节与产业链"]').click();await wait(()=>d.querySelector('.competency-course-chains'));
 for(const chain of chains.slice(0,2))assert.ok(d.querySelector('.competency-course-chains').textContent.includes(chain.name));
 assert.equal(d.querySelector('.competency-missing'),null);
 assert.equal(d.querySelector('.competency-segment'),null);
 dom.window.localStorage.setItem(CONFIG_KEY,JSON.stringify({...config,chainIds:[]}));
 dom.window.dispatchEvent(new dom.window.Event('course-config'));
 await wait(()=>d.querySelector('.competency-missing'));
 assert.equal(d.querySelector('.competency-course-chains'),null);
 }finally{dom.window.close();}
});

test('existing cultural demo projects show simulated industry ancestry on expansion',async()=>{
 const {jobTaskDemos}=await import('../src/generation/job-task-demos.mjs');
 const role={id:'major-job:010101:1',name:'文化研究助理',origin:'simulation',major:'010101',planId:''};
 role.tasks=jobTaskDemos(role);
 const {dom,d,wait,errors}=await mount(role,undefined,{major:'010101',majorName:'哲学',planId:''});
 try{
  d.querySelector('[aria-label="展开产业环节与产业链"]').click();
  await wait(()=>d.querySelector('.competency-ancestry'));
  const ancestry=d.querySelector('.competency-ancestry').textContent;
  assert.match(ancestry,/文化内容与公共文化服务产业链/);
  assert.match(ancestry,/文化资源调查与研究/);
  assert.match(ancestry,/模拟数据/);
  assert.doesNotMatch(ancestry,/暂未关联/);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
