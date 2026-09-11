import test from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {resolveCourseContext} from '../src/generation/major-context.mjs';

test('course binding overrides stale draft values and discards a conflicting plan',()=>{
 const bound={code:'460305',name:'工业机器人技术'};
 assert.deepEqual(resolveCourseContext({major:'080901',majorName:'旧专业',planId:'old',planMajor:'080901',planName:'旧人培'},bound),{major:'460305',majorName:'工业机器人技术'});
 assert.equal(resolveCourseContext({major:'080901'}).majorName,'计算机科学与技术');
 assert.equal(resolveCourseContext({},null).major,'');
});

const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {GenerationWizard} from './src/generation/GenerationWizard.jsx';createRoot(document.getElementById('root')).render(React.createElement(GenerationWizard,{...window.fixture,courseName:'测试课程',onClose:()=>{},onModeChange:()=>{},onCreate:()=>{}}));`,resolveDir:fileURLToPath(new URL('..',import.meta.url)),loader:'jsx'},bundle:true,format:'iife',write:false,jsx:'automatic',loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'}});
async function mount(fixture,saved={}){
 const dom=new JSDOM(`<div id="root"></div><script>${bundle.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`,{url:'http://localhost/',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});w.fixture=fixture;for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,JSON.stringify(v));}});
 const d=dom.window.document;
 const wait=async f=>{for(let i=0;i<600;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Major picker did not reach expected state');};
 const button=text=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
 const change=(input,value)=>{Object.getOwnPropertyDescriptor(input.tagName==='SELECT'?dom.window.HTMLSelectElement.prototype:dom.window.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new dom.window.Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 await wait(()=>d.querySelector('.generation-modal'));
 await wait(()=>d.querySelector('.conversation-input-card')); // Form appears only after the Markdown prompt finishes.
 return {dom,d,wait,button,change};
}
test('bound course locks its major even when another major is present in saved drafts',async()=>{
 const {dom,d,button}=await mount({courseId:'bound',courseMajor:{code:'460305',name:'工业机器人技术'}},{'ai-course-context-v2:bound':{major:'080901'},'ai-course-context-v1':{major:'080901'}});
 try{
  const locked=d.querySelector('[aria-label="课程已关联专业"]');
  assert.equal(locked.textContent,'工业机器人技术 · 460305');
  assert.equal(d.querySelector('[aria-label="选择官方专业"]'),null);
  assert.equal(button('确认').disabled,false);
 }finally{dom.window.close();}
});
test('unbound course ignores stale draft majors and directs configuration to CMS',async()=>{
 const {dom,d,button}=await mount({courseId:'unbound',courseMajor:null},{'ai-course-context-v2:unbound':{major:'460305'}});
 try{assert.equal(button('确认').disabled,true);assert.equal(d.querySelector('[aria-label="选择官方专业"]'),null);assert.match(d.querySelector('.gen-empty').textContent,/前往关联专业/);}finally{dom.window.close();}
});

test('recommended job is highlighted and selected by default without overriding manual choices',async()=>{
 const {dom,d,wait,button,change}=await mount({courseId:'recommendation',courseMajor:{code:'080901',name:'计算机科学与技术'}});
 try{
  await wait(()=>d.querySelector('.gen-role-list'));
  assert.match(d.querySelector('.conversation-markdown')?.textContent||'',/推荐岗位.*前端开发工程师/s);
  assert.match(d.querySelector('.gen-role-list .selected')?.textContent||'',/前端开发工程师/);
  assert.equal(d.querySelectorAll('[name="typical-work-task"]:checked').length,0);
  const backend=()=>[...d.querySelectorAll('.gen-role-list button')].find(b=>b.textContent.includes('后端开发工程师'));
  backend().click();await wait(()=>d.querySelector('.gen-role-list .selected')?.textContent.includes('后端开发工程师'));
  change(d.querySelector('[aria-label="搜索岗位"]'),'前端');await wait(()=>d.querySelectorAll('.gen-role-list button').length===1);
  assert.equal(d.querySelector('.gen-role-list .selected'),null);
  change(d.querySelector('[aria-label="搜索岗位"]'),'');await wait(()=>backend());
  assert.match(d.querySelector('.gen-role-list .selected').textContent,/后端开发工程师/);
  await wait(()=>d.querySelector('.gen-role-list'));
  assert.match(d.querySelector('.gen-role-list .selected').textContent,/后端开发工程师/);
  button('自定义岗位').click();await wait(()=>d.querySelector('.gen-custom-heading'));
  assert.equal(d.querySelector('.gen-recommendation'),null);
 }finally{dom.window.close();}
});
