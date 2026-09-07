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

test('offline job project wizard allows optional links, creates a sourced project and preserves existing work', async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:new URL('../index.html',import.meta.url).href,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<150;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Wizard did not reach expected state');};
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 try{
  await wait(()=>button('AI 生成框架'));
  assert.ok(!d.querySelector('[aria-label="岗位任务模式"]'),'mode control belongs inside the dialog only');
  button('AI 生成框架').click();await wait(()=>d.querySelector('.modal'));
  const mode=()=>d.querySelector('.modal [role="switch"][aria-label="岗位任务模式"]');
  assert.ok(mode(),'generation dialog must contain the mode switch');
  assert.equal(mode().getAttribute('aria-checked'),'false');
  assert.equal(d.querySelector('.generation-modal'),null);
  assert.ok(button('开始生成'));
  mode().click();await wait(()=>d.querySelector('.generation-modal'));
  assert.equal(mode().getAttribute('aria-checked'),'true');
  mode().click();await wait(()=>button('开始生成'));
  assert.equal(d.querySelector('.generation-modal'),null);
  assert.equal(d.querySelectorAll('.modal').length,1);
  mode().click();await wait(()=>d.querySelector('.generation-modal'));
  assert.equal(button('下一步').disabled,false);
  assert.equal(d.querySelector('.gen-main input[type=checkbox]'),null);
  const selects=[...d.querySelectorAll('.gen-form-grid select')];
  assert.equal(selects.length,2);
  assert.ok(selects.every(s=>!s.disabled&&!s.required&&s.value===''));
  button('下一步').click();await wait(()=>d.querySelector('.gen-role-list>button'));
  d.querySelector('.gen-role-list>button').click();await wait(()=>d.querySelectorAll('.gen-ability').length===6);
  button('下一步').click();await wait(()=>button('生成转化预览'));button('生成转化预览').click();await wait(()=>button('确认并创建项目'));
  assert.equal(button('确认并创建项目').disabled,true);
  assert.equal(d.querySelectorAll('.gen-preview-stages>details').length,6);
  d.querySelector('.gen-review input').click();await wait(()=>!button('确认并创建项目').disabled);button('确认并创建项目').click();
  await wait(()=>!d.querySelector('.generation-modal'));
  assert.equal(d.querySelectorAll('.stage').length,6);
  assert.match(d.querySelector('.project-title').textContent,/工业机器人工作站操作与验收/);
  assert.equal(d.querySelectorAll('.projects-nav .nav-item').length,2);
  assert.match(d.querySelector('.learning-brief').textContent,/许昌职业技术学院/);
  d.querySelector('.task-title').click();await wait(()=>d.querySelector('textarea'));
  assert.equal(d.querySelectorAll('textarea').length,4);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  button('预览').click();await wait(()=>d.querySelector('.preview'));
  assert.equal(d.querySelectorAll('.preview .activity-brief').length,6);
  button('退出预览').click();await wait(()=>d.querySelector('.project-hero'));
  button('AI 生成框架').click();await wait(()=>d.querySelector('.modal'));
  assert.equal(d.querySelector('.generation-modal'),null);
  assert.equal(mode().getAttribute('aria-checked'),'false');
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  d.querySelector('.projects-nav .nav-item').click();await wait(()=>d.querySelectorAll('.stage').length===2);
  button('AI 生成框架').click();await wait(()=>button('开始生成'));
  assert.equal(d.querySelector('.current-project').textContent,'项目1');
  button('开始生成').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(d.querySelectorAll('.stage').length,5);
  assert.equal(d.querySelectorAll('.task').length,8);
  assert.equal(d.querySelectorAll('.content-row').length,2);
  assert.equal(d.querySelectorAll('.projects-nav .nav-item').length,2);
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
