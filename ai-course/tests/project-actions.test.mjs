import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const fixtures=[
 {id:'a',title:'项目甲',description:'甲说明',stages:[{id:'s',title:'保留阶段',tasks:[{id:'t',title:'保留任务',contents:[]}]}],sequential:true},
 {id:'b',title:'项目乙',description:'乙说明',icon:'project-circles',titleEn:'Project B',descriptionEn:'Description B',stages:[],sequential:true},
];
const wait=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Project actions did not reach expected state');};
function mount(projects=fixtures){
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem('ai-course-projects-v1',JSON.stringify(projects));}});
 const d=dom.window.document;
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const saved=()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'));
 const fill=(selector,value)=>{const node=d.querySelector(selector);Object.getOwnPropertyDescriptor(node.tagName==='TEXTAREA'?dom.window.HTMLTextAreaElement.prototype:dom.window.HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 const menu=async name=>{d.querySelector(`[aria-label="${name}的更多操作"]`).click();await wait(()=>d.querySelector('.project-actions-menu'));};
 return {dom,d,button,saved,fill,menu,errors};
}

test('sidebar edits the chosen project metadata without changing another project or its contents',async()=>{
 const {dom,d,button,saved,fill,menu,errors}=mount();
 try{
  await wait(()=>d.querySelector('.project-hero'));
  assert.ok(d.querySelector('[aria-label="项目乙的更多操作"]'),'each sidebar project needs actions');
  await menu('项目乙');button('编辑').click();await wait(()=>d.querySelector('#project-title'));
  assert.equal(d.querySelector('#project-title').value,'项目乙');
  assert.equal(d.querySelector('#project-title-en').value,'Project B');
  assert.equal(d.querySelector('#project-description-en').value,'Description B');
  assert.equal(d.querySelector('[aria-label="圆环图标"]').getAttribute('aria-pressed'),'true');
  fill('#project-title','临时修改');button('取消').click();await wait(()=>!d.querySelector('.modal'));
  assert.deepEqual(saved(),fixtures);
  await menu('项目乙');button('编辑').click();await wait(()=>d.querySelector('#project-title'));
  fill('#project-title',' ');await wait(()=>button('确定').disabled);
  fill('#project-title','乙的新名称');fill('#project-description','乙的新说明');fill('#project-title-en','Updated B');fill('#project-description-en','Updated description');
  d.querySelector('[aria-label="三角图标"]').click();await wait(()=>!button('确定').disabled);
  button('确定').click();await wait(()=>!d.querySelector('.modal'));
  assert.deepEqual(saved()[0],fixtures[0]);
  assert.deepEqual(saved()[1],{...fixtures[1],title:'乙的新名称',description:'乙的新说明',titleEn:'Updated B',descriptionEn:'Updated description',icon:'project-triangle'});
  assert.match(d.querySelector('.project-title').textContent,/项目甲/);
  d.querySelectorAll('.projects-nav .nav-item')[1].click();await wait(()=>d.querySelector('.project-title').textContent.includes('乙的新名称'));
  assert.match(d.querySelector('.hero-info').textContent,/乙的新说明/);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('project deletion requires confirmation, targets the selected menu and keeps an empty list after reload',async()=>{
 const {dom,d,button,saved,menu,errors}=mount();let empty;
 try{
  await wait(()=>d.querySelector('.project-hero'));
  assert.ok(d.querySelector('[aria-label="项目乙的更多操作"]'),'each sidebar project needs actions');
  await menu('项目乙');
  d.querySelector('[role="menu"]').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  await wait(()=>!d.querySelector('[role="menu"]'));
  assert.equal(d.activeElement.getAttribute('aria-label'),'项目乙的更多操作');
  await menu('项目乙');d.querySelector('.project-hero').dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true}));await wait(()=>!d.querySelector('[role="menu"]'));
  await menu('项目乙');button('删除').click();await wait(()=>d.querySelector('.modal'));
  assert.match(d.querySelector('.modal-body').textContent,/项目乙.*删除后不可恢复/);
  assert.equal(d.activeElement,button('取消'),'confirmation should focus the visible cancel action');
  assert.deepEqual(saved(),fixtures);button('取消').click();await wait(()=>!d.querySelector('.modal'));
  assert.deepEqual(saved(),fixtures);
  await menu('项目乙');button('删除').click();await wait(()=>d.querySelector('.modal'));button('确定').click();
  await wait(()=>saved().length===1);assert.deepEqual(saved(),[fixtures[0]]);assert.match(d.querySelector('.project-title').textContent,/项目甲/);
  await menu('项目甲');button('删除').click();await wait(()=>d.querySelector('.modal'));button('确定').click();
  await wait(()=>d.querySelector('.empty-projects'));assert.deepEqual(saved(),[]);assert.equal(d.querySelector('.project-hero'),null);assert.deepEqual(errors,[]);
  empty=mount(saved());await wait(()=>empty.d.querySelector('.empty-projects'));assert.deepEqual(empty.saved(),[]);
  empty.d.querySelector('.add-project').click();await wait(()=>empty.d.querySelector('#project-title'));
  empty.fill('#project-title','重新创建');empty.fill('#project-description','新说明');await wait(()=>!empty.button('确定').disabled);empty.button('确定').click();
  await wait(()=>empty.d.querySelector('.project-hero'));assert.equal(empty.saved().length,1);assert.equal(empty.saved()[0].title,'重新创建');assert.deepEqual(empty.errors,[]);
 }finally{dom.window.close();empty?.dom.window.close();}
});

test('deleting the active project switches to a surviving project',async()=>{
 const {dom,d,button,saved,menu,errors}=mount();
 try{
  await wait(()=>d.querySelector('.project-hero'));
  assert.ok(d.querySelector('[aria-label="项目甲的更多操作"]'),'each sidebar project needs actions');
  await menu('项目甲');button('删除').click();await wait(()=>d.querySelector('.modal'));button('确定').click();
  await wait(()=>d.querySelector('.project-title')?.textContent.includes('项目乙'));
  assert.deepEqual(saved(),[fixtures[1]]);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('generation replaces only the current project stages and persists its identity',async()=>{
 const {dom,d,button,saved,errors}=mount();let reloaded;
 try{
  await wait(()=>d.querySelector('.project-hero'));
  button('AI 生成框架').click();await wait(()=>button('开始生成'));
  assert.equal(d.querySelectorAll('.conversation-message').length,0);
  assert.equal(d.querySelector('.current-project').textContent,'项目甲');
  button('开始生成').click();
  await wait(()=>!d.querySelector('.modal'));
  assert.equal(saved().length,2);
  assert.equal(saved()[0].id,'a');assert.equal(saved()[0].title,'项目甲');assert.equal(saved()[0].description,'甲说明');
  assert.equal(saved()[0].stages.length,3);
  assert.ok(saved()[0].stages.every(s=>s.id!=='s'));
  assert.deepEqual(saved()[1],fixtures[1]);
  reloaded=mount(saved());await wait(()=>reloaded.d.querySelector('.project-hero'));
  assert.deepEqual(reloaded.saved(),saved());
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();reloaded?.dom.window.close();}
});
