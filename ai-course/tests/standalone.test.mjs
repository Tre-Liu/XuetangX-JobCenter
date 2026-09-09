import {configHash,normalizeConfig,matchChains,CONFIG_KEY} from '../src/cms/config.mjs';
const enabledCMS=normalizeConfig({major:{code:'460305'},chainIds:[matchChains('460305')[0].id],industryEnabled:true});
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('double-click index contains runnable JavaScript and styles without a development server', () => {
 assert.doesNotMatch(html, /<script[^>]+src=/);
 assert.doesNotMatch(html, /<script[^>]+type="module"/);
 assert.match(html, /<style>/);
 const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script, 'index.html must contain the compiled application');
 new vm.Script(script);
});

test('standalone index mounts the course and supports adding a stage in a file-origin DOM', async () => {
 const { JSDOM, VirtualConsole } = await import('jsdom');
 const errors=[];
 const virtualConsole=new VirtualConsole();
 virtualConsole.on('jsdomError', e => errors.push(e.message));
 const dom=new JSDOM(html, {
  url: new URL('../index.html',import.meta.url).href,
  runScripts:'dangerously',
  virtualConsole,
  beforeParse(window){window.structuredClone=structuredClone;},
 });
 try {
  const waitFor=async predicate=>{
   for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,10));}
   assert.fail('standalone application did not reach the expected UI state');
  };
  const {document}=dom.window;
  await waitFor(()=>document.querySelector('.project-hero'));
  assert.match(document.querySelector('.course-name').textContent,/智能制造岗位项目课程/);
  assert.equal(document.querySelectorAll('.stage').length,2);
  document.querySelector('.add-stage').click();
  await waitFor(()=>document.querySelectorAll('.stage').length===3);
  assert.match(document.querySelector('.stats').textContent,/阶段3任务3/);
  assert.deepEqual(errors,[]);
 } finally {dom.window.close();}
});

test('offline knowledge graph renders its original data and opens a searched point', async () => {
 const {JSDOM,VirtualConsole}=await import('jsdom');
 const errors=[];const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:new URL('../index.html',import.meta.url).href,runScripts:'dangerously',virtualConsole,beforeParse(window){
  window.structuredClone=structuredClone;
  // JSDOM has no layout/resize or canvas font measurement. ECharts renders SVG.
  window.ResizeObserver=class {observe(){} disconnect(){}};
  window.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:text=>({width:String(text).length*7})});
 }});
 const wait=async predicate=>{for(let i=0;i<150;i++){if(predicate())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Graph UI did not reach expected state: '+errors.join('; '));};
 try{
  const d=dom.window.document;await wait(()=>d.querySelector('.nav-item'));
  [...d.querySelectorAll('.nav-item')].find(b=>b.textContent.includes('知识图谱')).click();
  await wait(()=>d.querySelector('.kg-echart svg'));
  assert.equal(d.querySelector('.kg-total').textContent,'121');
  const input=d.querySelector('.kg-search input');
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'工业机器人');
  input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await wait(()=>d.querySelector('.kg-results button'));
  d.querySelector('.kg-results button').click();await wait(()=>d.querySelector('.kg-detail h2'));
  assert.match(d.querySelector('.kg-detail h2').textContent,/工业机器人/);
  assert.ok(d.querySelector('.kg-detail-body').textContent.includes('知识说明'));
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('offline job project wizard inherits the linked major, overwrites the current project with sourced data', async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:new URL('../index.html',import.meta.url).href+configHash(enabledCMS),runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<500;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Wizard did not reach expected state');};
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 try{
  await wait(()=>button('AI 生成框架'));
  button('AI 生成框架').click();await wait(()=>d.querySelector('[role="menu"]'));
  assert.equal(d.querySelector('.modal'),null);
  assert.equal(d.querySelectorAll('[role="menuitem"]').length,2);
  d.querySelector('[role="menu"]').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  await wait(()=>!d.querySelector('[role="menu"]'));
  assert.equal(d.activeElement,button('AI 生成框架'));
  button('AI 生成框架').click();await wait(()=>d.querySelector('[role="menu"]'));
  d.body.dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true}));
  await wait(()=>!d.querySelector('[role="menu"]'));
  button('AI 生成框架').click();await wait(()=>d.querySelector('[role="menu"]'));
  d.querySelector('[aria-label="项目主题驱动"]').click();await wait(()=>button('开始生成'));
  assert.equal(d.querySelector('[role="menu"]'),null);
  assert.equal(d.querySelector('[aria-label="岗位任务模式"]'),null);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  button('AI 生成框架').click();await wait(()=>d.querySelector('[role="menu"]'));
  d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>d.querySelector('.generation-modal')&&button('确认')&&!button('确认').disabled);
  assert.equal(d.querySelector('[role="menu"]'),null);
  assert.equal(d.querySelector('[aria-label="岗位任务模式"]'),null);
  assert.equal(button('确认').disabled,false);
  assert.equal(d.querySelector('.gen-main input[type=checkbox]'),null);
  const selects=[...d.querySelectorAll('.gen-form-grid select')];
  assert.equal(d.querySelector('[aria-label="课程已关联专业"]').disabled,true);
  assert.equal(d.querySelector('[aria-label="课程已关联专业"]').value,'460305 · 工业机器人技术');
  assert.equal(selects.length,0);
  assert.ok(!d.querySelector('.generation-modal').textContent.includes('人培方案'));
  const advance=async(label,ready)=>{
   const trigger=button(label);trigger.click();trigger.click();
   await wait(()=>d.querySelector('.gen-loading[role="status"]'));
   assert.ok([...d.querySelectorAll('.generation-modal footer button')].every(b=>b.disabled));
   await wait(()=>ready()&&!d.querySelector('.conversation-markdown[aria-busy="true"]'));
   assert.equal(d.querySelector('.gen-loading'),null);
  };
  await advance('确认',()=>d.querySelector('.gen-role-list>button'));
  const promptItems=d.querySelectorAll('.gen-role-prompt .conversation-markdown ol li');
  assert.equal(promptItems.length,4,'recommendation is the fourth Markdown list item');
  assert.match(promptItems[3].textContent,/根据所选专业，推荐岗位：/);
  assert.equal(promptItems[3].querySelector('strong').textContent,d.querySelector('.gen-role-list>button strong').textContent);
  assert.equal(d.querySelector('aside.gen-recommendation'),null);
  button('确认').click();await wait(()=>d.querySelector('[role="alert"]'));
  assert.equal(d.querySelector('.gen-loading'),null,'invalid selections show an error immediately');
  d.querySelector('.gen-role-list>button').click();await new Promise(r=>setTimeout(r,30));
  assert.equal(!!d.querySelector('.gen-task-source'),false,'choosing a role must not implicitly choose its first task');
  d.querySelector('.gen-task-options input[type=radio]').click();await wait(()=>d.querySelectorAll('.gen-ability').length===6);
  assert.equal(d.querySelectorAll('.gen-ability input:checked').length,6,'all abilities are selected by default');
  d.querySelector('.gen-ability input[type=checkbox]').click();await new Promise(r=>setTimeout(r,20));
  await advance('确认',()=>d.querySelector('.gen-stepper .current')?.textContent.includes('教学化转化')&&button('确认'));
  await advance('上一步',()=>d.querySelector('.gen-role-list>button'));
  assert.equal(d.querySelectorAll('.gen-ability input[type=checkbox]:checked').length,5,'returning preserves manual deselection');
  await advance('确认',()=>d.querySelector('.gen-stepper .current')?.textContent.includes('教学化转化')&&button('确认'));
  await advance('确认',()=>button('暂不匹配'));
  button('暂不匹配').click();await new Promise(r=>setTimeout(r,20));
  await advance('确认',()=>button('确认并覆盖当前项目'));
  assert.equal(button('确认并覆盖当前项目').disabled,false);
  assert.equal(d.querySelector('.gen-review'),null);
  assert.doesNotMatch(d.querySelector('.generation-modal').textContent,/教师审阅要点|我已审阅岗位来源/);
  assert.equal(d.querySelectorAll('.gen-preview-stages>details').length,6);
  await advance('确认并覆盖当前项目',()=>!d.querySelector('.generation-modal'));
  assert.equal(d.querySelectorAll('.stage').length,6);
  assert.match(d.querySelector('.project-title').textContent,/工业机器人工作站操作与验收/);
  assert.equal(d.querySelectorAll('.projects-nav .nav-item').length,1);
  assert.match(d.querySelector('.learning-brief').textContent,/许昌职业技术学院/);
  assert.equal(d.querySelectorAll('textarea[aria-label="任务说明"]').length,6);
  d.querySelector('.task-title').click();await wait(()=>d.querySelector('.modal'));
  assert.equal(d.querySelectorAll('.modal textarea').length,0,'Task title dialog no longer edits explanation fields');
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  button('预览').click();await wait(()=>d.querySelector('.preview'));
  assert.equal(d.querySelectorAll('.preview-task-card .task-description-text').length,6);
  button('退出预览').click();await wait(()=>d.querySelector('.project-hero'));
  button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="项目主题驱动"]'));d.querySelector('[aria-label="项目主题驱动"]').click();await wait(()=>d.querySelector('.modal'));
  assert.equal(!!d.querySelector('.conversation-modal'),false);
  assert.equal(d.querySelector('[aria-label="岗位任务模式"]'),null);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  d.querySelector('.projects-nav .nav-item').click();await wait(()=>d.querySelectorAll('.stage').length===6);
  button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="项目主题驱动"]'));d.querySelector('[aria-label="项目主题驱动"]').click();await wait(()=>button('开始生成'));
  assert.equal(d.querySelector('.current-project').textContent,'工业机器人工作站操作与验收');
  button('开始生成').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(d.querySelectorAll('.stage').length,3);
  assert.equal(d.querySelectorAll('.task').length,6);
  assert.equal(d.querySelectorAll('.content-row').length,0);
  assert.equal(d.querySelectorAll('.projects-nav .nav-item').length,1);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('task content menu routes five sources, dismisses safely and saves into the selected task', async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Content menu did not reach expected state');};
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 try{
  await wait(()=>d.querySelector('.add-content'));
  d.querySelector('.add-content').click();await wait(()=>d.querySelector('[role="menu"]'));
  assert.equal(d.querySelectorAll('[role="menuitem"]').length,5);
  d.querySelector('[role="menu"]').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  await wait(()=>!d.querySelector('[role="menu"]'));
  assert.equal(d.activeElement,d.querySelector('.add-content'));
  for(const source of ['知识点','学习单元','知识库','云盘','本地文件']){
   d.querySelectorAll('.add-content')[1].click();await wait(()=>d.querySelector('[role="menu"]'));
   d.querySelector(`[role="menuitem"][aria-label="${source}"]`).click();await wait(()=>d.querySelector('.modal'));
   assert.equal(d.querySelector('[role="menu"]'),null);
   assert.equal(d.querySelector('.modal h2').textContent,source==='知识点'?'关联知识点':source==='学习单元'?'关联课程资源':`添加${source}`);
   button('取消').click();await wait(()=>!d.querySelector('.modal'));
  }
  d.querySelectorAll('.add-content')[1].click();await wait(()=>d.querySelector('[role="menu"]'));
  d.querySelector('[aria-label="学习单元"][role="menuitem"]').click();await wait(()=>d.querySelector('.association-table tbody input'));
  assert.equal(button('确定').disabled,true);
  d.querySelector('.association-table tbody input').click();await wait(()=>!button('确定').disabled);button('确定').click();await wait(()=>!d.querySelector('.modal'));
  const saved=JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0];
  assert.equal(saved.stages[0].tasks[0].contents.length,2);
  assert.equal(saved.stages[1].tasks[0].contents[0].title,'2025行业发展报告&人才需求预测报告');
  assert.ok(saved.stages[1].tasks[0].contents[0].resourceId);
  assert.equal(saved.stages[1].tasks[0].contents[0].scored,true);
  assert.equal(saved.stages[1].tasks[0].contents[0].source,'unit');
  assert.match(d.querySelector('.stats').textContent,/学习单元1/);
  d.querySelector('.add-content').click();await wait(()=>d.querySelector('[role="menu"]'));
  d.querySelector('.project-hero').dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true}));await wait(()=>!d.querySelector('[role="menu"]'));
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('association queries use graph data, retain selections across filters and prevent duplicate links',async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const {createKnowledgeGraph}=await import('../src/knowledge/model.mjs');const graph=createKnowledgeGraph();graph.nodes.find(n=>n.name==='智能制造定义与特征').name='教师修订知识点';
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem('ai-course-knowledge-v1',JSON.stringify(graph));}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<120;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Association did not reach expected state');};
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const setInput=async(selector,value)=>{const el=d.querySelector(selector);Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,15));};
 const choose=async(source)=>{d.querySelectorAll('.add-content')[1].click();await wait(()=>d.querySelector('[role="menu"]'));d.querySelector(`[role="menuitem"][aria-label="${source}"]`).click();await wait(()=>d.querySelector('.association-table'));};
 const query=async(name)=>{await setInput('.association-filters input',name);button('查询').click();await new Promise(r=>setTimeout(r,15));};
 try{
  await wait(()=>d.querySelector('.add-content'));await choose('知识点');
  assert.equal(d.querySelectorAll('.association-table tbody tr').length,120);
  assert.equal(button('确定').disabled,true);
  await query('教师修订知识点');assert.equal(d.querySelectorAll('.association-table tbody tr').length,1);
  d.querySelector('.association-table tbody input').click();await wait(()=>!button('确定').disabled);
  await query('制造系统基础');d.querySelector('.association-table tbody input').click();await wait(()=>d.querySelector('.association-selection').textContent.includes('2'));
  await query('不存在的知识点');assert.match(d.querySelector('.association-empty').textContent,/暂无匹配/);assert.equal(button('确定').disabled,false);
  button('确定').click();await wait(()=>!d.querySelector('.modal'));
  const saved=JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0];
  assert.equal(saved.stages[1].tasks[0].contents.length,2);assert.ok(saved.stages[1].tasks[0].contents.every(c=>c.knowledgeNodeId));
  await choose('知识点');await query('教师修订知识点');assert.equal(d.querySelector('.association-table tbody input').disabled,true);assert.equal(button('确定').disabled,true);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  await choose('学习单元');const select=d.querySelector('.association-filters select');select.value='视频';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,15));button('查询').click();await wait(()=>d.querySelector('.association-empty'));assert.equal(button('确定').disabled,true);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  await choose('知识点');await query('智能制造系统架构');d.querySelector('.association-table tbody input').click();await wait(()=>!button('确定').disabled);
  dom.window.localStorage.setItem('ai-course-knowledge-enabled-v1','false');dom.window.dispatchEvent(new dom.window.Event('ai-course-knowledge-availability'));
  await wait(()=>d.querySelector('.association-empty'));assert.equal(button('确定').disabled,true);assert.equal(d.querySelector('.association-selection'),null);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('new tasks are independent cards, receive focus and keep knowledge and units in the chosen card', async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom');
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Independent task flow did not reach expected state');};
 const saved=()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))[0];
 const confirm=()=>[...d.querySelectorAll('.modal button')].find(b=>b.textContent.trim()==='确定');
 try{
  await wait(()=>d.querySelector('.new-task')&&dom.window.localStorage.getItem('ai-course-projects-v1'));
  const original=saved();
  d.querySelector('.new-task').click();
  await wait(()=>d.querySelectorAll('.stage:first-child .task').length===2);
  const target=d.querySelectorAll('.stage:first-child .task')[1];
  assert.ok(d.activeElement===target.querySelector('.task-title'),'new task must be focused so its independent card is apparent');
  assert.equal(d.querySelector('.modal'),null);
  assert.equal(saved().stages[0].tasks[1].contents.length,0);
  d.querySelector('.new-task').click();
  await wait(()=>d.querySelectorAll('.stage:first-child .task').length===3);
  assert.equal(new Set(saved().stages[0].tasks.map(t=>t.id)).size,3);
  for(const [source,label] of [['knowledge','知识点'],['unit','学习单元']]){
   target.querySelector('.add-content').click();
   await wait(()=>d.querySelector(`[role="menuitem"][aria-label="${label}"]`));
   d.querySelector(`[role="menuitem"][aria-label="${label}"]`).click();
   await wait(()=>d.querySelector('.association-table tbody input'));
   d.querySelector('.association-table tbody input').click();
   await wait(()=>!confirm().disabled);confirm().click();
   await wait(()=>!d.querySelector('.modal'));
   assert.ok(saved().stages[0].tasks[1].contents.some(c=>c.source===source));
  }
  assert.equal(saved().stages[0].tasks.length,3);
  assert.equal(saved().stages[0].tasks[1].contents.length,2);
  assert.deepEqual(saved().stages[0].tasks[0],original.stages[0].tasks[0]);
  assert.equal(saved().stages[0].tasks[2].contents.length,0);
  assert.deepEqual(saved().stages[1],original.stages[1]);
  assert.equal(target.querySelectorAll('.content-row').length,2);
  target.querySelector('[aria-label="收起任务1-2"]').click();
  await wait(()=>!target.querySelector('.task-body'));
  assert.ok(d.querySelector('.stage:first-child .task .task-body'));
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('custom roles support independent task choices, teacher abilities and saved project provenance',async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const originals=[{id:'target',title:'待覆盖项目',description:'原说明',stages:[{id:'old-stage',title:'旧阶段',tasks:[]}],sequential:true},{id:'untouched',title:'其他项目',description:'保留说明',stages:[],sequential:true}];
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem(CONFIG_KEY,JSON.stringify(enabledCMS));w.localStorage.setItem('ai-course-projects-v1',JSON.stringify(originals));}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<500;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Custom role flow did not reach expected state');};
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const input=async(selector,value)=>{const el=d.querySelector(selector);assert.ok(el,selector);Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,20));};
 const chooseTask=async(index)=>{d.querySelectorAll('.gen-task-options input')[index].click();await new Promise(r=>setTimeout(r,20));};
 try{
  await wait(()=>button('AI 生成框架'));button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));
  d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>button('确认')&&!button('确认').disabled);button('确认').click();await wait(()=>button('自定义岗位'));
  button('自定义岗位').click();await wait(()=>button('添加岗位'));button('添加岗位').click();await wait(()=>button('保存岗位'));
  assert.ok(button('保存岗位').disabled);
  await input('[aria-label="新增岗位名称"]','视觉质检员');
  await input('[aria-label="新增典型工作任务"]','样本采集\n缺陷复核');button('保存岗位').click();await wait(()=>d.querySelectorAll('.gen-task-options input').length===2);
  assert.ok(!d.querySelector('.gen-task-source'));
  await chooseTask(0);assert.equal(d.querySelectorAll('.gen-ability').length,0);
  button('添加知识').click();await wait(()=>d.querySelector('[aria-label="知识能力草稿"]'));
  await input('[aria-label="知识能力草稿"]','能说明采集标准');
  await chooseTask(1);assert.equal(d.querySelectorAll('.gen-ability').length,0);
  button('添加技能').click();await wait(()=>d.querySelector('[aria-label="技能能力草稿"]'));
  await input('[aria-label="技能能力草稿"]','能复核缺陷并记录结果');
  await chooseTask(0);assert.equal(d.querySelector('[aria-label="知识能力草稿"]').value,'能说明采集标准');
  assert.equal(d.querySelectorAll('.gen-ability input:checked').length,1);
  await chooseTask(1);assert.equal(d.querySelector('[aria-label="技能能力草稿"]').value,'能复核缺陷并记录结果');
  d.querySelector('.gen-ability input[type=checkbox]').click();await new Promise(r=>setTimeout(r,20));
  button('确认').click();await wait(()=>d.querySelector('[role="alert"]'));
  d.querySelector('.gen-ability input[type=checkbox]').click();await new Promise(r=>setTimeout(r,20));
  await input('[aria-label="编辑岗位名称"]','视觉质量检验员');
  await input('[aria-label="编辑典型工作任务"]','零件缺陷复核');
  await input('.gen-task-source [aria-label="任务说明"]','教师修订：对照样本复核缺陷。');
  button('确认').click();await wait(()=>d.querySelector('.gen-stepper .current')?.textContent.includes('教学化转化')&&button('确认')&&!button('确认').disabled);
  for(const [label,value] of [['工作对象','教学零件样本'],['工具、方法与资源','视觉检测设备与记录表']]){
   const el=[...d.querySelectorAll('.gen-form-grid label')].find(l=>l.firstChild.textContent===label).querySelector('textarea');
   Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,20));
  }
  button('确认').click();await wait(()=>button('暂不匹配'));button('暂不匹配').click();await new Promise(r=>setTimeout(r,20));button('确认').click();await wait(()=>button('确认并覆盖当前项目')&&!button('确认并覆盖当前项目').disabled);button('确认并覆盖当前项目').click();await wait(()=>!d.querySelector('.generation-modal'));
  await wait(()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'))?.[0]?.learningDesign);
  const saved=JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'));
  const project=saved[0];
  assert.equal(saved.length,2);assert.equal(project.id,'target');assert.deepEqual(saved[1],originals[1]);
  assert.ok(project.stages.every(stage=>stage.id!=='old-stage'));
  const reload=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem(CONFIG_KEY,JSON.stringify(enabledCMS));w.localStorage.setItem('ai-course-projects-v1',JSON.stringify(saved));}});
  try{await wait(()=>reload.window.document.querySelector('.learning-brief'));assert.deepEqual(JSON.parse(reload.window.localStorage.getItem('ai-course-projects-v1')),saved);}finally{reload.window.close();}
  assert.equal(project.learningDesign.role.name,'视觉质量检验员');
  assert.equal(project.learningDesign.role.origin,'teacher-input');
  assert.equal(project.learningDesign.sourceTask.title,'零件缺陷复核');
  assert.equal(project.learningDesign.sourceTask.description,'教师修订：对照样本复核缺陷。');
  assert.deepEqual(project.learningDesign.abilities.map(a=>a.title),['能复核缺陷并记录结果']);
  assert.ok(project.stages.every(s=>s.tasks.every(t=>t.learningActivity.abilityIds.every(id=>id===project.learningDesign.abilities[0].id))));
  button('AI 生成框架').click();await wait(()=>d.querySelector('[aria-label="岗位任务驱动"]'));d.querySelector('[aria-label="岗位任务驱动"]').click();await wait(()=>button('确认')&&!button('确认').disabled);button('确认').click();await wait(()=>button('自定义岗位'));button('自定义岗位').click();await wait(()=>d.querySelector('.gen-role-list>button'));
  assert.match(d.querySelector('.gen-role-list').textContent,/视觉质量检验员/);
  d.querySelector('.gen-role-list>button').click();await wait(()=>d.querySelectorAll('.gen-task-options input').length===2);await chooseTask(1);
  assert.equal(d.querySelector('[aria-label="技能能力草稿"]').value,'能复核缺陷并记录结果');
  button('添加岗位').click();await wait(()=>button('辅助生成岗位'));button('辅助生成岗位').click();await wait(()=>button('生成并添加岗位'));
  assert.equal(d.querySelector('[aria-label="课程名称"]').value,'智能制造岗位项目课程');
  await input('[aria-label="工作方向"]','工业视觉检测');button('生成并添加岗位').click();await wait(()=>d.querySelectorAll('.gen-task-options input').length===3);
  assert.ok(!d.querySelector('.gen-task-source'));await chooseTask(2);
  assert.equal(d.querySelectorAll('.gen-ability').length,3);assert.equal(d.querySelectorAll('.gen-ability input:checked').length,3);
  assert.equal(d.querySelectorAll('.gen-role-list>button').length,2);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
