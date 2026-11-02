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
  await wait(()=>d.querySelector('.gen-match-layout'));
  assert.equal(d.querySelectorAll('.gen-match-nodes input').length,0);
  assert.equal(dom.window.created,undefined);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('closing the loading view cancels project generation',async()=>{
 const {dom,d}=mount();
 try{await chooseTask(d);
  [...d.querySelectorAll('button')].find(b=>b.textContent==='下一步：生成项目框架').click();
  await wait(()=>d.querySelector('.gen-loading'));
  d.querySelector('[aria-label="关闭弹窗"]').click();await wait(()=>!d.querySelector('.generation-modal'));
  await new Promise(r=>setTimeout(r,2300));
  assert.equal(dom.window.created,undefined);assert.equal(d.querySelector('.generation-modal'),null);
 }finally{dom.window.close();}
});

async function review(d){
 await chooseTask(d);
 [...d.querySelectorAll('button')].find(b=>b.textContent==='下一步：生成项目框架').click();
 await wait(()=>d.querySelector('.gen-match-layout'));
}
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
