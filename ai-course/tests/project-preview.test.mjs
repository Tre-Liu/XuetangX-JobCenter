import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('preview is an inline read-only board; exit preserves draft and collapse state',async()=>{
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Preview did not reach expected state');};
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 try{
  await wait(()=>button('预览'));
  d.querySelector('[aria-label="收起阶段1"]').click();await wait(()=>d.querySelector('[aria-label="展开阶段1"]'));
  const before=dom.window.localStorage.getItem('ai-course-projects-v1');
  button('预览').click();await wait(()=>d.querySelector('.project-preview-board'));
  assert.equal(d.querySelector('.modal'),null);assert.equal(d.querySelector('.project-hero'),null);
  assert.equal(d.querySelectorAll('.preview-stage').length,2);assert.equal(d.querySelectorAll('.preview-task-card').length,2);
  assert.equal(d.querySelectorAll('.preview-stage-connector').length,1);
  assert.match(d.querySelector('.preview-stage').textContent,/机器人轨迹编程/);
  assert.equal(d.querySelectorAll('.preview-score').length,2);
  assert.match(d.querySelector('.preview-empty-content').textContent,/暂无任务内容/);
  assert.equal(d.querySelector('.preview .add-content'),null);
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),before);
  button('退出预览').click();await wait(()=>button('预览'));
  assert.ok(d.querySelector('[aria-label="展开阶段1"]'));
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),before);
  button('发布项目').click();await wait(()=>button('查看发布预览'));
  button('查看发布预览').click();await wait(()=>d.querySelector('.project-preview-board'));
  assert.equal(d.querySelector('.modal'),null);
  button('退出预览').click();await wait(()=>button('预览'));
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('empty previews and resource tags use current project data without modifying it',async()=>{
 const projects=[{id:'empty',title:'空项目',description:'空项目说明',stages:[],sequential:true},{id:'resources',title:'资源项目',description:'资源项目说明',stages:[{id:'stage',title:'含学习资源',collapsed:true,tasks:[{id:'task',title:'核验材料',collapsed:true,contents:[{id:'resource',title:'旧资源名',type:'学习单元',source:'unit',resourceId:'course-resource-industry-report-2025',resourceKind:'图文',scored:true},{id:'file',title:'本地资料.pdf',type:'拓展学习',source:'file',scored:false}]}]}],sequential:true}];
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem('ai-course-projects-v1',JSON.stringify(projects));}});
 const d=dom.window.document;const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Expected preview state; main contains: '+d.querySelector('main').textContent.slice(0,500));};
 try{
  await wait(()=>button('预览'));button('预览').click();await wait(()=>d.querySelector('.preview-empty-project'));
  assert.equal(d.querySelectorAll('.preview-stage').length,0);
  d.querySelectorAll('.projects-nav .nav-item')[1].click();await wait(()=>button('预览'));
  button('预览').click();await wait(()=>d.querySelector('.preview-kind'));
  assert.equal(d.querySelector('.preview-kind').textContent,'图文');
  assert.match(d.querySelector('.preview-task-card').textContent,/2025行业发展报告&人才需求预测报告/);
  assert.equal(d.querySelectorAll('.preview-score').length,1);assert.equal(d.querySelectorAll('.preview-unscored').length,1);
  assert.equal(d.querySelectorAll('.preview-stage-connector').length,0);
  assert.deepEqual(JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1')),projects);
 }finally{dom.window.close();}
});

test('preview switches between the steps and course-rooted panorama without editing the draft',async()=>{
 const {catalog,sampleContext,defaultDesign,generateProject}=await import('../src/generation/model.mjs');
 const role=catalog[0],task=role.tasks[0];
 const project=generateProject({context:sampleContext,role,task,abilities:task.abilities,design:defaultDesign(role,task),confirmed:true});
 project.title='教师修改后的工作站项目';
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem('ai-course-projects-v1',JSON.stringify([project]));}});
 const d=dom.window.document;const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Preview perspective did not reach expected state');};
 try{
  await wait(()=>button('预览'));
  assert.equal(!!d.querySelector('.project-job-relations'),false,'old relationship cards must be removed from editing');
  const before=dom.window.localStorage.getItem('ai-course-projects-v1');
  button('预览').click();await wait(()=>d.querySelector('.project-preview-board'));
  const tabs=[...d.querySelectorAll('.preview-view-tabs [role="tab"]')];
  assert.deepEqual(tabs.map(t=>t.textContent.trim()),['项目步骤','岗位关联图谱']);
  assert.equal(tabs[0].getAttribute('aria-selected'),'true');
  const panels=[...d.querySelectorAll('.project-preview>[role="tabpanel"]')];
  assert.deepEqual(panels.map(p=>p.hidden),[false,true]);
  assert.equal(!!d.querySelector('.project-job-relations'),false);
  tabs[1].click();await wait(()=>tabs[1].getAttribute('aria-selected')==='true');
  assert.deepEqual(panels.map(p=>p.hidden),[true,false]);
  const graph=panels[1].querySelector('.course-panorama');assert.ok(graph,'use the professional panorama layout');
  assert.match(graph.textContent,/教师修改后的工作站项目/);
  assert.match(graph.textContent,/D2：工业机器人操作/);
  assert.match(graph.textContent,/机器人操作工/);
  assert.match(graph.textContent,/机器人产业链/);
  assert.match(graph.textContent,/机器人本体制造与系统集成/);
  assert.match(graph.textContent,/待复核/);
  assert.equal(graph.querySelectorAll('[data-kind="ability"]').length,6);
  assert.equal(graph.querySelectorAll('[data-kind="course"]').length,1);
  assert.equal(graph.querySelectorAll('.graph-toggle').length,0);
  assert.doesNotMatch(graph.textContent,/培养目标|毕业要求|课程目标/);
  const node=graph.querySelector('[data-kind="role"]');node.click();await wait(()=>node.getAttribute('aria-pressed')==='true');
  assert.match(graph.querySelector('[aria-label="节点详情"]').textContent,/机器人操作工/);
  tabs[1].dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
  await wait(()=>tabs[0].getAttribute('aria-selected')==='true');
  assert.equal(d.activeElement,tabs[0]);
  assert.equal(d.querySelectorAll('.preview-stage').length,6);
  tabs[1].click();await wait(()=>!panels[1].hidden);assert.equal(graph.querySelector('[data-kind="role"]').getAttribute('aria-pressed'),'true');
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),before);
  button('退出预览').click();await wait(()=>button('预览'));
  button('预览').click();await wait(()=>d.querySelector('.preview-view-tabs'));
  assert.equal(d.querySelector('.preview-view-tabs [role="tab"]').getAttribute('aria-selected'),'true');
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
