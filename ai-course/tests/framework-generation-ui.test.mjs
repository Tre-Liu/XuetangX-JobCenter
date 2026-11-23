import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {JSDOM,VirtualConsole} from 'jsdom';

const bundle=await build({stdin:{contents:`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {GenerationWizard} from './src/generation/GenerationWizard.jsx';function Test(){const [open,setOpen]=useState(true);return open?<GenerationWizard courseName="电气控制与PLC" courseMajor={{code:'460305',name:'工业机器人技术'}} graph={{nodes:[{id:'root',level:1,name:'课程'},{id:'n1',level:2,name:'安全操作'}]}} onClose={()=>setOpen(false)} onCreate={(value,mode)=>{window.created=value;window.mode=mode;setOpen(false)}}/>:null}createRoot(document.getElementById('root')).render(<Test/>);`,resolveDir:fileURLToPath(new URL('..',import.meta.url)),loader:'jsx'},bundle:true,format:'iife',write:false,jsx:'automatic',loader:{'.css':'empty','.png':'dataurl','.gif':'dataurl','.webm':'dataurl','.mp4':'dataurl'},define:{'process.env.NODE_ENV':'"production"'}});
const wait=async fn=>{for(let i=0;i<600;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}assert.fail('framework UI state not reached');};
function mount(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(`<div id="root"></div><script>${bundle.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false});}});
 return {dom,d:dom.window.document,errors};
}
async function chooseTask(d){
 await wait(()=>d.querySelector('.gen-role-list>button'));
 d.querySelector('.gen-role-list>button').click();
 await wait(()=>d.querySelector('.gen-task-options input[type="radio"]'));
 d.querySelector('.gen-task-options input[type="radio"]').click();
 await wait(()=>d.querySelector('.gen-ability input:checked'));
}
test('selection progressively reveals jobs, tasks and capabilities and resets downstream choices',async()=>{
 const {dom,d,errors}=mount();
 try{await wait(()=>d.querySelector('.gen-role-list>button'));
  const next=[...d.querySelectorAll('footer button')].find(b=>b.textContent==='下一步：生成项目框架');
  assert.equal(d.querySelectorAll('.framework-selection-column').length,1);
  assert.equal(d.querySelector('.gen-role-list [aria-pressed="true"]'),null);
  assert.equal(next.disabled,true);
  d.querySelector('.gen-role-list>button').click();
  await wait(()=>d.querySelector('.gen-task-picker'));
  assert.equal(d.querySelectorAll('.framework-selection-column').length,2);
  assert.equal(d.querySelector('.gen-task-options input:checked'),null);
  assert.equal(next.disabled,true);
  d.querySelector('.gen-task-options input[type="radio"]').click();
  await wait(()=>d.querySelector('.gen-ability input:checked'));
  assert.equal(d.querySelectorAll('.framework-selection-column').length,3);
  assert.equal(next.disabled,false);
  const checks=[...d.querySelectorAll('.gen-ability input')];
  for(const check of checks){check.click();await new Promise(r=>setTimeout(r,0));}
  assert.equal(next.disabled,true);
  checks[0].click();await wait(()=>!next.disabled);
  d.querySelectorAll('.gen-role-list>button')[1].click();
  await wait(()=>!d.querySelector('.gen-task-source'));
  assert.equal(next.disabled,true);
  assert.equal(d.querySelector('.gen-task-options input:checked'),null);
  assert.match(d.querySelector('[aria-label="课程已关联专业"]').textContent,/工业机器人技术/);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('generation waits in the full loading view and initial knowledge results stay empty',async()=>{
 const {dom,d,errors}=mount();
 try{await chooseTask(d);
  const next=[...d.querySelectorAll('button')].find(b=>b.textContent==='下一步：生成项目框架');next.click();next.click();
  await wait(()=>d.querySelector('.gen-loading'));
  assert.ok(d.querySelector('.framework-loading-orb'));
  assert.equal(d.querySelector('.gen-loading input'),null);
  await confirmTasks(d);await wait(()=>d.querySelector('.gen-match-layout'));
  assert.equal(d.querySelectorAll('.gen-match-nodes input').length,0);
  assert.equal(dom.window.created,undefined);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('closing the loading view requires confirmation and discards generation',async()=>{
 const {dom,d}=mount();
 try{await chooseTask(d);
  [...d.querySelectorAll('button')].find(b=>b.textContent==='下一步：生成项目框架').click();
  await wait(()=>d.querySelector('.gen-loading'));
  d.querySelector('[aria-label="关闭弹窗"]').click();
  await wait(()=>d.querySelector('.framework-close-confirm'));
  assert.match(d.querySelector('.framework-close-confirm').textContent,/关闭后不会保存本次生成的任务/);
  assert.ok(d.querySelector('.generation-modal'));
  button(d,'确认关闭').click();await wait(()=>!d.querySelector('.generation-modal'));
  await new Promise(r=>setTimeout(r,2300));
  assert.equal(dom.window.created,undefined);assert.equal(d.querySelector('.generation-modal'),null);
 }finally{dom.window.close();}
});

async function review(d){
 await chooseTask(d);
 [...d.querySelectorAll('button')].find(b=>b.textContent==='下一步：生成项目框架').click();
 await confirmTasks(d);await wait(()=>d.querySelector('.gen-match-layout'));
}
async function confirmTasks(d){await wait(()=>button(d,'确认任务，匹配知识点'));button(d,'确认任务，匹配知识点').click();}
const button=(d,text)=>[...d.querySelectorAll('button')].find(b=>b.textContent===text);
test('default append submits without destructive confirmation',async()=>{
 const {dom,d}=mount();
 try{await review(d);
  assert.equal(d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]')?.checked,false);
  button(d,'确认生成').click();await wait(()=>dom.window.created);
  assert.equal(dom.window.mode,'append');
 }finally{dom.window.close();}
});
test('replace requires explicit second confirmation and cancellation preserves review',async()=>{
 const {dom,d}=mount();
 try{await review(d);
  assert.ok(d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]'));
  d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').click();await wait(()=>d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').checked);
  button(d,'确认生成').click();await wait(()=>d.querySelector('.framework-replace-confirm'));
  assert.equal(dom.window.created,undefined);
  assert.match(d.querySelector('.framework-replace-confirm').textContent,/无法恢复/);
  button(d,'取消覆盖').click();await wait(()=>!d.querySelector('.framework-replace-confirm'));
  assert.ok(d.querySelector('.gen-match-layout'));
  assert.equal(d.querySelector('input[role="switch"][aria-label="覆盖原有任务"]').checked,true);
  button(d,'确认生成').click();await wait(()=>d.querySelector('.framework-replace-confirm'));
  d.querySelector('.framework-replace-confirm').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  await wait(()=>!d.querySelector('.framework-replace-confirm'));
  assert.ok(d.querySelector('.gen-match-layout'));
  button(d,'确认生成').click();await wait(()=>d.querySelector('.framework-replace-confirm'));
  button(d,'确认覆盖').click();button(d,'确认覆盖')?.click();
  await wait(()=>dom.window.created);assert.equal(dom.window.mode,'replace');
 }finally{dom.window.close();}
});

// Catch lost drafts and commits that race the close confirmation.
test('Escape during generation asks before closing and continuing preserves the draft',async()=>{
 const {dom,d}=mount();
 try{await chooseTask(d);
  button(d,'下一步：生成项目框架').click();await wait(()=>d.querySelector('.gen-loading'));
  d.querySelector('.generation-modal').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  await wait(()=>d.querySelector('.framework-close-confirm'));
  await new Promise(r=>setTimeout(r,2300));
  assert.equal(dom.window.created,undefined);
  button(d,'继续生成').click();await confirmTasks(d);await wait(()=>d.querySelector('.gen-match-layout'));
  assert.equal(d.querySelector('.framework-close-confirm'),null);
  d.querySelector('input[role="switch"]').click();
  d.querySelector('.generation-modal [aria-label="关闭弹窗"]').click();
  await wait(()=>d.querySelector('.framework-close-confirm'));
  d.querySelector('.framework-close-confirm').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  await wait(()=>!d.querySelector('.framework-close-confirm'));
  assert.equal(d.querySelector('input[role="switch"]').checked,true);
  assert.ok(d.querySelector('.gen-match-layout'));
 }finally{dom.window.close();}
});
test('pending submission cannot save while close confirmation is open',async()=>{
 const {dom,d}=mount();
 try{await review(d);
  button(d,'确认生成').click();await wait(()=>d.querySelector('.gen-loading'));
  d.querySelector('.generation-modal [aria-label="关闭弹窗"]').click();
  await wait(()=>d.querySelector('.framework-close-confirm'));
  await new Promise(r=>setTimeout(r,650));
  assert.equal(dom.window.created,undefined);
  button(d,'确认关闭').click();await wait(()=>!d.querySelector('.generation-modal'));
  assert.equal(dom.window.created,undefined);
 }finally{dom.window.close();}
});

// Catches bypassing task approval, blank names, and losing edits before commit.
test('task names must be confirmed before knowledge matching and persist through return and submission',async()=>{
 const {dom,d,errors}=mount();
 try{await chooseTask(d);button(d,'下一步：生成项目框架').click();
  await wait(()=>!d.querySelector('.gen-loading')&&d.querySelector('.framework-summary'));
  assert.ok(d.querySelector('[aria-label="确认生成任务"]'));
  assert.equal(d.querySelector('.knowledge-matching'),null);
  assert.equal(button(d,'智能匹配'),undefined);
  assert.equal(dom.window.created,undefined);
  const name=d.querySelector('[aria-label="任务名称 1.1"]');
  const setName=value=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(name,value);name.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
  setName('   ');await wait(()=>button(d,'确认任务，匹配知识点').disabled);
  setName('  核对设备安全与任务要求  ');await wait(()=>!button(d,'确认任务，匹配知识点').disabled);
  button(d,'确认任务，匹配知识点').click();await wait(()=>d.querySelector('.knowledge-matching'));
  assert.equal(d.querySelector('.knowledge-match-task h4').textContent,'核对设备安全与任务要求');
  assert.equal(d.querySelectorAll('.gen-match-nodes input').length,0);
  button(d,'上一步').click();await wait(()=>d.querySelector('[aria-label="任务名称 1.1"]'));
  assert.equal(d.querySelector('[aria-label="任务名称 1.1"]').value,'核对设备安全与任务要求');
  button(d,'确认任务，匹配知识点').click();await wait(()=>d.querySelector('.knowledge-matching'));
  button(d,'确认生成').click();await wait(()=>dom.window.created);
  assert.equal(dom.window.created.stages[0].tasks[0].title,'核对设备安全与任务要求');
  assert.equal(dom.window.mode,'append');assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

// Catches removing the final stage/task and losing structural edits at confirmation.
test('task confirmation adds and removes stages and tasks while enforcing minimums',async()=>{
 const {dom,d,errors}=mount();
 const stages=()=>d.querySelectorAll('.framework-task-confirmation [aria-current="step"]');
 const selected=()=>d.querySelector('.framework-task-confirmation [aria-current="step"]');
 const names=()=>d.querySelectorAll('.framework-task-name input');
 try{await chooseTask(d);button(d,'下一步：生成项目框架').click();
  await wait(()=>d.querySelector('[aria-label="确认生成任务"]'));
  assert.ok(button(d,'新增阶段'),'stage addition is available before knowledge matching');
  button(d,'新增阶段').click();await wait(()=>d.querySelector('.framework-summary-count').textContent.includes('7 个项目阶段'));
  assert.equal(stages().length,1);assert.match(selected().textContent,/新增阶段/);assert.equal(names().length,1);
  assert.equal(button(d,'删除任务').disabled,true);
  button(d,'新增任务').click();await wait(()=>names().length===2);
  const name=names()[1];Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(name,'核验接口异常日志');name.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await wait(()=>names()[1].value==='核验接口异常日志');
  button(d,'删除任务').click();await wait(()=>names().length===1);
  assert.equal(names()[0].value,'核验接口异常日志','only the requested task is deleted');
  for(let count=7;count>1;count--){button(d,'删除阶段').click();await wait(()=>d.querySelector('.framework-summary-count').textContent.includes(`${count-1} 个项目阶段`));}
  assert.equal(button(d,'删除阶段').disabled,true);button(d,'删除阶段').click();
  assert.match(d.querySelector('.framework-summary-count').textContent,/1 个项目阶段/);
  while(names().length>1){const count=names().length;button(d,'删除任务').click();await wait(()=>names().length===count-1);}
  assert.equal(button(d,'删除任务').disabled,true);button(d,'删除任务').click();assert.equal(names().length,1);
  const lastName=names()[0].value;
  button(d,'确认任务，匹配知识点').click();await wait(()=>d.querySelector('.knowledge-matching'));
  assert.equal(d.querySelectorAll('.knowledge-stage-nav button').length,1);assert.equal(d.querySelectorAll('.knowledge-match-task').length,1);
  button(d,'上一步').click();await wait(()=>d.querySelector('[aria-label="确认生成任务"]'));
  assert.equal(names().length,1);assert.equal(names()[0].value,lastName);
  button(d,'新增任务').click();await wait(()=>names().length===2);
  button(d,'确认任务，匹配知识点').click();await wait(()=>d.querySelector('.knowledge-matching'));
  button(d,'确认生成').click();await wait(()=>dom.window.created);
  assert.equal(dom.window.created.stages.length,1);assert.equal(dom.window.created.stages[0].tasks.length,2);
  assert.ok(dom.window.created.stages.every(stage=>stage.tasks.length>=1));assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

// Catches position-based edits detaching task contents and losing order at save.
test('stage and task reordering preserves identities, selections and saved order',async()=>{
 const {dom,d,errors}=mount();
 const control=label=>d.querySelector(`button[aria-label="${label}"]`);
 const stageButtons=()=>[...d.querySelectorAll('.framework-task-confirmation nav>button')];
 const taskInputs=()=>[...d.querySelectorAll('.framework-task-name input')];
 try{await chooseTask(d);button(d,'下一步：生成项目框架').click();await wait(()=>d.querySelector('[aria-label="确认生成任务"]'));
  assert.ok(control('下移阶段'),'stage reorder controls are available');
  const originalStages=stageButtons().map(item=>item.textContent),firstTasks=taskInputs().map(item=>({id:item.id,title:item.value}));
  assert.equal(control('上移阶段').disabled,true);assert.equal(control('上移任务 1.1').disabled,true);assert.equal(control('下移任务 1.2').disabled,true);
  control('下移任务 1.1').click();await wait(()=>taskInputs()[1].id===firstTasks[0].id);
  assert.deepEqual(taskInputs().map(item=>item.id),[firstTasks[1].id,firstTasks[0].id]);
  control('上移任务 1.2').click();await wait(()=>taskInputs()[0].id===firstTasks[0].id);
  control('下移任务 1.1').click();await wait(()=>taskInputs()[1].id===firstTasks[0].id);
  control('下移阶段').click();await wait(()=>stageButtons()[1].getAttribute('aria-current')==='step');
  assert.deepEqual(stageButtons().map(item=>item.textContent.slice(2)),[originalStages[1],originalStages[0],...originalStages.slice(2)].map(text=>text.slice(2)));
  assert.equal(taskInputs()[0].id,firstTasks[1].id,'moving a stage carries its tasks');
  control('上移阶段').click();await wait(()=>stageButtons()[0].getAttribute('aria-current')==='step');
  control('下移阶段').click();await wait(()=>stageButtons()[1].getAttribute('aria-current')==='step');
  stageButtons().at(-1).click();await wait(()=>stageButtons().at(-1).getAttribute('aria-current')==='step');assert.equal(control('下移阶段').disabled,true);
  stageButtons()[1].click();await wait(()=>taskInputs()[0]?.id===firstTasks[1].id);
  const taskId=firstTasks[1].id.replace('framework-task-','');
  button(d,'确认任务，匹配知识点').click();await wait(()=>d.querySelector('.knowledge-matching'));
  const matchTask=d.querySelector(`[data-task-id="${taskId}"]`);matchTask.querySelector('.gen-graph-picker').click();await wait(()=>d.querySelector('.knowledge-picker-drawer input[type=checkbox]'));
  d.querySelector('.knowledge-picker-drawer input[type=checkbox]').click();await wait(()=>!button(d,'确定关联').disabled);button(d,'确定关联').click();await wait(()=>d.querySelector('.knowledge-match-chip'));
  button(d,'上一步').click();await wait(()=>d.querySelector('[aria-label="确认生成任务"]'));stageButtons()[1].click();await wait(()=>control('上移阶段')&&!control('上移阶段').disabled);
  control('上移阶段').click();await wait(()=>stageButtons()[0].getAttribute('aria-current')==='step');
  button(d,'确认任务，匹配知识点').click();await wait(()=>d.querySelector('.knowledge-matching'));
  assert.ok(d.querySelector(`[data-task-id="${taskId}"] .knowledge-match-chip`),'knowledge selection follows task identity after reordering');
  button(d,'确认生成').click();await wait(()=>dom.window.created);
  assert.equal(dom.window.created.stages[0].tasks[0].id,taskId);assert.equal(dom.window.created.stages[0].tasks[1].title,firstTasks[0].title);
  assert.ok(dom.window.created.stages[0].tasks[0].contents.some(item=>item.knowledgeNodeId==='n1'));assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
