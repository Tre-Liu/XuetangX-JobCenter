import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM, VirtualConsole} from 'jsdom';
import {associateContents, isLinked, resolveProjectContents} from '../src/resources/model.mjs';
import {courseVirtualSimulations} from '../src/resources/virtual-simulations.mjs';
import {DEMO_REVISION} from '../src/manufacturing-projects.mjs';

test('simulation selection persists third-party metadata, deduplicates and ignores unknown resources',()=>{
 assert.equal(new Set(courseVirtualSimulations.map(item=>item.cover)).size,6);
 const task={id:'t',contents:[]};
 const added=associateContents(task,'simulation',['plc-sim-motor','missing'],{nodes:[]},[]);
 assert.equal(added.contents.length,1);
 const content=added.contents[0];
 assert.equal(content.type,'虚拟仿真实验');
 assert.equal(content.source,'simulation');
 assert.equal(content.simulationId,'plc-sim-motor');
 assert.equal(content.integration,'third-party');
 assert.ok(content.provenance);
 assert.equal(content.providerName,'启衡自动化');
 assert.ok(content.cover.startsWith('data:image/jpeg;base64,'));
 assert.equal(task.contents.length,0);
 assert.equal(isLinked(added,'simulation',{id:'plc-sim-motor'}),true);
 assert.equal(associateContents(added,'simulation',['plc-sim-motor'],{nodes:[]},[]).contents.length,1);
});

test('previously associated simulations show current enterprise and cover without altering saved drafts',()=>{
 const stored={id:'p',stages:[{id:'s',tasks:[{id:'t',contents:[{id:'old',simulationId:'plc-sim-motor',source:'simulation',title:'旧资源名称',integration:'third-party',cover:'data:image/svg+xml,old'}]}]}]};
 const resolved=resolveProjectContents(stored,{nodes:[]},[]).stages[0].tasks[0].contents[0];
 assert.equal(resolved.providerName,'启衡自动化');
 assert.equal(resolved.cover,courseVirtualSimulations[0].cover);
 assert.equal(stored.stages[0].tasks[0].contents[0].cover,'data:image/svg+xml,old');
});

const fixture=[{id:'p',title:'输送线控制',description:'教学项目',stages:[{id:'s',title:'电路核查',tasks:[{id:'t1',title:'识读电路',contents:[]},{id:'t2',title:'核对点位',contents:[]}]}]}];
const wait=async f=>{for(let i=0;i<150;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('虚仿资源流程未达到预期状态');};
function mount(entry,projects=fixture){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(new URL(`../${entry}`,import.meta.url),'utf8'),{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem(DEMO_REVISION,'done');w.localStorage.setItem('ai-course-projects-v1',JSON.stringify(projects));}});
 const d=dom.window.document,button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const saved=()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'));
 const picker=async()=>{d.querySelectorAll('.add-content')[1].click();await wait(()=>d.querySelector('[role="menu"]'));const item=d.querySelector('[role="menuitem"][aria-label="虚拟仿真实验"]');assert.ok(item,'菜单包含虚拟仿真实验');item.click();await wait(()=>d.querySelector('[aria-label="关联虚拟仿真实验"]'));};
 return {dom,d,button,saved,picker,errors};
}
for(const entry of ['index.html','offline.html'])test(`${entry}: cards, selection isolation, filtering, deduplication, preview and reload`,async()=>{
 const app=mount(entry);let reloaded;
 const {dom,d,button,saved,picker,errors}=app;
 try{
  await wait(()=>d.querySelector('.add-content'));await picker();
  assert.ok(button('确定').disabled);
  assert.ok(d.querySelectorAll('.simulation-card').length>=4);
  assert.doesNotMatch(d.querySelector('.modal').textContent,/三方/);
  for(const card of d.querySelectorAll('.simulation-card')){
   assert.ok(card.querySelector('img').src.startsWith('data:image/jpeg;base64,'));
   assert.ok(card.querySelector('h3').textContent);
   assert.match(card.textContent,/学习人数[\s\S]*\d/);
   assert.ok(card.querySelector('.simulation-provider').textContent.trim());
   assert.doesNotMatch(card.textContent,/三方/);
  }
  d.querySelector('.simulation-card input').click();await wait(()=>!button('确定').disabled);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));assert.deepEqual(saved(),fixture);
  await picker();const inputs=[...d.querySelectorAll('.simulation-card input')];inputs[0].click();inputs[1].click();await wait(()=>!button('确定').disabled);button('确定').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(saved()[0].stages[0].tasks[0].contents.length,0);
  const added=saved()[0].stages[0].tasks[1].contents;
  assert.equal(added.length,2);assert.ok(added.every(c=>c.simulationId&&c.integration==='third-party'&&c.providerName));
  assert.equal(d.querySelectorAll('.content-provider').length,2);
  await picker();assert.equal(d.querySelectorAll('.simulation-card input:disabled').length,2);assert.ok(button('确定').disabled);
  const input=d.querySelector('[aria-label="虚仿实验名称"]');Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'不存在的实验');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,10));button('查询').click();await wait(()=>d.querySelector('.association-empty'));assert.equal(d.querySelectorAll('.simulation-card').length,0);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  button('预览').click();await wait(()=>d.querySelector('.preview'));assert.equal(d.querySelectorAll('.preview .content-provider').length,2);
  reloaded=mount(entry,saved());await wait(()=>reloaded.d.querySelectorAll('.content-row').length===2);assert.equal(reloaded.d.querySelectorAll('.content-provider').length,2);
  reloaded.d.querySelector('.content-row').click();await wait(()=>reloaded.d.querySelector('.modal'));assert.ok(reloaded.d.querySelector('.modal input').readOnly);reloaded.button('删除这条内容').click();await wait(()=>!reloaded.d.querySelector('.modal'));assert.equal(reloaded.saved()[0].stages[0].tasks[1].contents.length,1);
  assert.deepEqual(errors,[]);assert.deepEqual(reloaded.errors,[]);
 }finally{dom.window.close();reloaded?.dom.window.close();}
});
