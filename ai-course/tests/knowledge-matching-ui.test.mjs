import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {JSDOM,VirtualConsole} from 'jsdom';

const project={id:'project',stages:[
 {id:'first',title:'明确任务',tasks:[{id:'t1',title:'分析安全要求',description:'安全要求',contents:[]},{id:'t2',title:'调查实施条件',contents:[]}]},
 {id:'second',title:'制定计划',tasks:[{id:'t3',title:'制定实施计划',contents:[]}]}
]};
const graph={nodes:[{id:'root',name:'课程',level:1},...Array.from({length:12},(_,i)=>({id:`k${i}`,name:i===0?'安全要求':`控制知识${i}`,level:i===0?2:3,parentId:i===0?'root':'k0'}))]};
const bundle=await build({stdin:{contents:`import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{KnowledgeMatching}from'./src/generation/KnowledgeMatching.jsx';function App(){const[selections,setSelections]=useState(window.fixture.selections||{});const[enabled,setEnabled]=useState(window.fixture.enabled!==false);window.changeAvailability=setEnabled;return <KnowledgeMatching project={window.fixture.project} graph={window.fixture.graph} enabled={enabled} choice="yes" onChoice={()=>{}} selections={selections} onSelections={value=>{window.selections=value;window.selectionCalls++;setSelections(value);}} onBusyChange={value=>window.busy.push(value)}/>;}window.root=createRoot(document.getElementById('root'));window.root.render(<App/>);`,resolveDir:fileURLToPath(new URL('..',import.meta.url)),loader:'jsx'},bundle:true,write:false,format:'iife',jsx:'automatic',loader:{'.css':'empty','.png':'dataurl'},define:{'process.env.NODE_ENV':'"production"'}});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function mount(fixture={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(`<button id="outside">外部操作</button><div id="root"></div><script>${bundle.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.fixture={project,graph,...fixture};w.selections=fixture.selections||{};w.selectionCalls=0;w.busy=[];w.HTMLElement.prototype.scrollIntoView=function(){};}});
 const d=dom.window.document;
 const wait=async predicate=>{for(let i=0;i<300;i++){if(predicate())return;await pause(10);}assert.fail('Knowledge matching state not reached: '+errors.join('; '));};
 const button=name=>[...d.querySelectorAll('button')].find(node=>node.textContent.trim()===name);
 await wait(()=>d.querySelector('#root')?.children.length);
 return {dom,d,wait,button,errors};
}

// This catches eager matching, cross-stage writes, and duplicate pending jobs.
test('smart match is explicit, waits visibly and changes only the selected stage',async()=>{
 const {dom,d,wait,button,errors}=await mount();
 try{
  assert.deepEqual(dom.window.selections,{});
  assert.equal(d.querySelectorAll('.knowledge-match-chip').length,0);
  assert.equal(d.querySelectorAll('.knowledge-stage-nav button').length,2);
  assert.match(d.querySelector('.knowledge-stage-nav button').textContent,/0 个知识点/);
  const trigger=button('智能匹配');assert.ok(trigger);
  trigger.click();trigger.click();await wait(()=>d.querySelector('.knowledge-matching-loading'));
  assert.match(d.querySelector('[role="status"]').textContent,/正在为当前阶段匹配知识点/);
  assert.ok([...d.querySelectorAll('.knowledge-stage-nav button,.knowledge-task-add')].every(node=>node.disabled));
  assert.equal(dom.window.selectionCalls,0);assert.equal(dom.window.busy.at(-1),true);
  await wait(()=>dom.window.selectionCalls===1&&dom.window.busy.at(-1)===false&&!d.querySelector('.knowledge-matching-loading'));
  assert.equal(dom.window.selections.t1.length,10);assert.equal(dom.window.selections.t2.length,10);assert.equal(dom.window.selections.t3,undefined);
  assert.equal(dom.window.busy.at(-1),false);
  assert.match(d.querySelector('.knowledge-stage-nav button').textContent,/20 个知识点/);
  d.querySelectorAll('.knowledge-stage-nav button')[1].click();await wait(()=>d.querySelectorAll('.knowledge-stage-nav button')[1].getAttribute('aria-current')==='step');
  button('智能匹配').click();await wait(()=>dom.window.selections.t3?.length===10);
  assert.equal(dom.window.selections.t1.length,10);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

// This catches a rerun silently replacing a teacher's choices or deliberate clear.
test('manual picker edits and removals survive repeated stage matching',async()=>{
 const {dom,d,wait,button,errors}=await mount();
 try{
  const open=d.querySelector('[data-task-id="t1"] .knowledge-task-add');open.focus();open.click();
  await wait(()=>d.querySelector('.knowledge-picker-dialog'));
  const select=d.querySelector('[aria-label="选择控制知识11"]');select.click();
  await wait(()=>select.checked);button('确定关联').click();await wait(()=>!d.querySelector('.knowledge-picker-dialog'));
  assert.equal(d.activeElement,open);
  button('智能匹配').click();await wait(()=>dom.window.selections.t2?.length===10&&!d.querySelector('.knowledge-matching-loading'));
  assert.deepEqual([...dom.window.selections.t1],['k11']);
  d.querySelector('[data-task-id="t1"] .gen-match-nodes input[type=checkbox]').click();await wait(()=>dom.window.selections.t1.length===0);
  button('智能匹配').click();await wait(()=>d.querySelector('.knowledge-matching-loading'));await wait(()=>!d.querySelector('.knowledge-matching-loading'));
  assert.deepEqual([...dom.window.selections.t1],[]);assert.equal(dom.window.selections.t2.length,10);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

// This catches a pending timeout committing after the graph becomes unavailable.
test('availability changes cancel pending matches and empty graphs remain usable',async()=>{
 const {dom,d,wait,button}=await mount();
 try{
  button('智能匹配').click();await wait(()=>d.querySelector('.knowledge-matching-loading'));
  dom.window.changeAvailability(false);await wait(()=>!d.querySelector('.knowledge-matching-loading'));
  await pause(1500);assert.equal(dom.window.selectionCalls,0);assert.equal(dom.window.busy.at(-1),false);
  assert.equal(button('智能匹配').disabled,true);assert.match(d.querySelector('.knowledge-matching').textContent,/暂无可用知识点/);
 }finally{dom.window.close();}
 const empty=await mount({graph:{nodes:[graph.nodes[0]]}});
 try{assert.equal(empty.button('智能匹配').disabled,true);assert.equal(empty.d.querySelectorAll('.knowledge-match-chip').length,0);}finally{empty.dom.window.close();}
});

// This catches writes or a stuck footer state after closing the wizard.
test('unmount cancels pending matching and releases the parent busy state',async()=>{
 const {dom,d,wait,button}=await mount();
 try{
  button('智能匹配').click();await wait(()=>d.querySelector('.knowledge-matching-loading'));
  dom.window.root.unmount();await pause(1500);
  assert.equal(dom.window.selectionCalls,0);assert.equal(dom.window.busy.at(-1),false);
 }finally{dom.window.close();}
});

// This catches descendant auto-selection, lost cancel drafts and max-limit bypasses.
test('picker keeps independent selections, caps ten and discards canceled edits',async()=>{
 const {dom,d,wait,button,errors}=await mount();
 try{
  const open=d.querySelector('[data-task-id="t1"] .knowledge-task-add');open.focus();open.click();await wait(()=>d.querySelector('.knowledge-picker-dialog'));
  d.querySelector('[aria-label="选择安全要求"]').click();await wait(()=>d.querySelector('[aria-label="选择安全要求"]').checked);
  assert.equal(d.querySelector('[aria-label="选择控制知识1"]').checked,false);
  for(let i=1;i<=9;i++)d.querySelector(`[aria-label="选择控制知识${i}"]`).click();
  await wait(()=>d.querySelectorAll('.knowledge-picker-selected li').length===10);
  assert.equal(d.querySelector('[aria-label="选择控制知识10"]').disabled,true);
  d.querySelector('.knowledge-picker-selected li button').click();await wait(()=>d.querySelectorAll('.knowledge-picker-selected li').length===9);
  assert.equal(d.querySelector('[aria-label="选择控制知识10"]').disabled,false);
  d.querySelector('.knowledge-picker-dialog').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  await wait(()=>!d.querySelector('.knowledge-picker-dialog'));assert.equal(d.activeElement,open);assert.equal(dom.window.selectionCalls,0);
  open.click();await wait(()=>d.querySelector('.knowledge-picker-dialog'));assert.equal(d.querySelectorAll('.knowledge-picker-selected li').length,0);
  button('取消').click();await wait(()=>!d.querySelector('.knowledge-picker-dialog'));assert.equal(dom.window.selectionCalls,0);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

// This catches searching that loses a node's ancestors or clears the draft.
test('picker searches knowledge names while preserving hierarchy and selected draft',async()=>{
 const {dom,d,wait,button}=await mount();
 try{
  d.querySelector('[data-task-id="t1"] .knowledge-task-add').click();await wait(()=>d.querySelector('.knowledge-picker-dialog'));
  d.querySelector('[aria-label="选择控制知识2"]').click();
  const search=d.querySelector('[aria-label="搜索知识点"]');assert.ok(search);
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(search,'控制知识11');search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await wait(()=>d.querySelectorAll('.knowledge-picker-tree input[type=checkbox]').length===2);
  assert.ok(d.querySelector('[aria-label="选择安全要求"]'));assert.ok(d.querySelector('[aria-label="选择控制知识11"]'));
  assert.match(d.querySelector('.knowledge-picker-selected li').textContent,/控制知识2/);
  d.querySelector('[aria-label="选择控制知识11"]').click();button('确定关联').click();await wait(()=>dom.window.selections.t1?.length===2);
  assert.deepEqual([...dom.window.selections.t1],['k2','k11']);
 }finally{dom.window.close();}
});

// This catches a matched level-four leaf remaining hidden inside a closed ancestor.
test('searching a level-four knowledge point expands its complete ancestor path',async()=>{
 const deepGraph={nodes:[{id:'course',name:'课程',level:1},{id:'chapter',name:'安全规范',level:2,parentId:'course'},{id:'section',name:'控制回路',level:3,parentId:'chapter'},{id:'leaf',name:'安全联锁检查',level:4,parentId:'section'},{id:'other-leaf',name:'其他检查',level:4,parentId:'section'}]};
 const {dom,d,wait,button}=await mount({graph:deepGraph});
 try{
  d.querySelector('[data-task-id="t1"] .knowledge-task-add').click();await wait(()=>d.querySelector('.knowledge-picker-dialog'));
  const search=d.querySelector('[aria-label="搜索知识点"]');
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(search,'安全联锁');search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await wait(()=>d.querySelectorAll('.knowledge-picker-tree input[type=checkbox]').length===3);
  const leaf=d.querySelector('[aria-label="选择安全联锁检查"]');
  assert.equal(Boolean(leaf.closest('details:not([open])')),false,'a matching leaf must be visible through all ancestor groups');
  leaf.click();button('确定关联').click();await wait(()=>dom.window.selections.t1?.length===1);
  assert.deepEqual([...dom.window.selections.t1],['leaf']);
 }finally{dom.window.close();}
});

// This catches scroll events from an unfinished smooth navigation selecting the wrong stage.
test('stage navigation keeps its target during smooth scrolling and follows user wheel scrolling',async()=>{
 const {dom,d,wait}=await mount();
 try{
  const viewport=d.querySelector('.knowledge-stage-viewport'),sections=d.querySelectorAll('.knowledge-stage-section'),nav=d.querySelectorAll('.knowledge-stage-nav button');
  // JSDOM has no layout engine; supply only the geometry consumed by the real scroll handler.
  Object.defineProperty(viewport,'clientHeight',{value:400});
  Object.defineProperty(sections[0],'offsetTop',{value:0});Object.defineProperty(sections[1],'offsetTop',{value:700});
  nav[1].click();await wait(()=>nav[1].getAttribute('aria-current')==='step');
  viewport.scrollTop=100;viewport.dispatchEvent(new dom.window.Event('scroll',{bubbles:true}));await pause(20);
  assert.equal(nav[1].getAttribute('aria-current'),'step','intermediate smooth-scroll positions must not change the selected stage');
  viewport.dispatchEvent(new dom.window.WheelEvent('wheel',{deltaY:-100,bubbles:true}));
  viewport.scrollTop=20;viewport.dispatchEvent(new dom.window.Event('scroll',{bubbles:true}));await wait(()=>nav[0].getAttribute('aria-current')==='step');
  viewport.scrollTop=750;viewport.dispatchEvent(new dom.window.Event('scroll',{bubbles:true}));await wait(()=>nav[1].getAttribute('aria-current')==='step');
 }finally{dom.window.close();}
});
