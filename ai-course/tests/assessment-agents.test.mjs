import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM, VirtualConsole} from 'jsdom';
import {associateContents, isLinked} from '../src/resources/model.mjs';
import {DEMO_REVISION} from '../src/manufacturing-projects.mjs';

test('agent associations preserve existing content, ignore unavailable IDs and prevent duplicates',()=>{
 const agents=[{id:'circuit',name:'电路图识别',kind:'图纸识别',description:'识别电气元件与回路',provenance:'教学模拟配置'}];
 const original={id:'t',contents:[{id:'k',title:'知识点',type:'目标'}]};
 const added=associateContents(original,'agent',['circuit','missing'],{nodes:[]},[],agents);
 assert.equal(added.contents.length,2);
 assert.equal(original.contents.length,1);
 assert.deepEqual({...added.contents[1],id:undefined},{id:undefined,title:'电路图识别',type:'智能体任务',scored:true,source:'agent',agentId:'circuit',agentKind:'图纸识别',provenance:'教学模拟配置'});
 assert.equal(isLinked(added,'agent',agents[0]),true);
 assert.equal(associateContents(added,'agent',['circuit'],{nodes:[]},[],agents).contents.length,2);
});

const fixture=[{id:'p',title:'输送线控制',description:'教学项目',stages:[{id:'s',title:'电路核查',tasks:[{id:'t1',title:'识读电路',contents:[]},{id:'t2',title:'核对点位',contents:[]}]}]}];
const wait=async f=>{for(let i=0;i<150;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('智能体流程未达到预期状态');};
function mount(entry,projects=fixture){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(new URL(`../${entry}`,import.meta.url),'utf8'),{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem(DEMO_REVISION,'done');w.localStorage.setItem('ai-course-projects-v1',JSON.stringify(projects));}});
 const d=dom.window.document,button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const saved=()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'));
 const picker=async()=>{d.querySelectorAll('.add-content')[1].click();await wait(()=>d.querySelector('[role="menu"]'));const entry=d.querySelector('[role="menuitem"][aria-label="评测智能体"]');assert.ok(entry,'菜单应包含评测智能体');entry.click();await wait(()=>d.querySelector('[aria-label="关联评测智能体"]'));};
 return {dom,d,button,saved,picker,errors};
}
for(const entry of ['index.html','offline.html'])test(`${entry}: select course agents only into the clicked task, retain labels in preview and after reload`,async()=>{
 const app=mount(entry);let reloaded;
 const {dom,d,button,saved,picker,errors}=app;
 try{
  await wait(()=>d.querySelector('.add-content'));
  await picker();assert.ok(button('确定').disabled);
  assert.ok(d.querySelectorAll('.association-table tbody tr').length>=4);
  d.querySelector('[aria-label="选择电路图识别"]').click();await wait(()=>!button('确定').disabled);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));assert.deepEqual(saved(),fixture);
  await picker();d.querySelector('[aria-label="选择电路图识别"]').click();d.querySelector('[aria-label="选择PLC梯形图检查"]').click();await wait(()=>!button('确定').disabled);button('确定').click();await wait(()=>!d.querySelector('.modal'));
  assert.equal(saved()[0].stages[0].tasks[0].contents.length,0);
  assert.equal(saved()[0].stages[0].tasks[1].contents.length,2);
  assert.ok(saved()[0].stages[0].tasks[1].contents.every(c=>c.source==='agent'&&c.agentId));
  assert.ok([...d.querySelectorAll('.content-row em')].every(tag=>tag.textContent==='智能体任务'));
  await picker();assert.ok(d.querySelector('[aria-label="选择电路图识别"]').disabled);assert.ok(button('确定').disabled);
  const input=d.querySelector('[aria-label="智能体名称"]');Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'不存在的智能体');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,10));button('查询').click();await wait(()=>d.querySelector('.association-empty'));assert.equal(d.querySelectorAll('.association-table tbody tr').length,0);
  button('取消').click();await wait(()=>!d.querySelector('.modal'));
  button('预览').click();await wait(()=>d.querySelector('.preview'));assert.equal([...d.querySelectorAll('.preview-task-contents')].filter(n=>n.textContent.includes('智能体任务')).length,1);
  button('退出预览').click();await wait(()=>d.querySelector('.content-row'));
  reloaded=mount(entry,saved());await wait(()=>reloaded.d.querySelectorAll('.content-row').length===2);assert.equal(reloaded.d.querySelector('.content-row em').textContent,'智能体任务');
  reloaded.d.querySelector('.content-row').click();await wait(()=>reloaded.d.querySelector('.modal'));assert.ok(reloaded.d.querySelector('.modal input').readOnly);reloaded.button('删除这条内容').click();await wait(()=>!reloaded.d.querySelector('.modal'));assert.equal(reloaded.saved()[0].stages[0].tasks[1].contents.length,1);
  assert.deepEqual(errors,[]);assert.deepEqual(reloaded.errors,[]);
 }finally{dom.window.close();reloaded?.dom.window.close();}
});
