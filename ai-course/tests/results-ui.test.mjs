import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('成果页面未进入期望状态');};
test('查看成果页导航、返回、菜单关闭与课程草稿保持一致',async()=>{
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};}});const d=dom.window.document;
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 try{await wait(()=>button('建设成果展示'));await wait(()=>dom.window.localStorage.getItem('ai-course-projects-v1'));const draft=dom.window.localStorage.getItem('ai-course-projects-v1');
 button('建设成果展示').click();await wait(()=>d.querySelector('[role="menu"]'));d.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!d.querySelector('[role="menu"]'));
 button('建设成果展示').click();await wait(()=>button('查看成果页'));button('查看成果页').click();await wait(()=>d.querySelector('.result-dark'));
 assert.match(d.querySelector('.result-intro').textContent,/电气控制与PLC/);assert.ok(d.querySelector('.result-source-note').textContent.includes('模拟'));
 button('知识模型').click();await wait(()=>d.querySelector('.result-page-knowledge'));assert.ok(d.querySelector('[aria-label="搜索知识点"]'));
 button('课程概述').click();await wait(()=>d.querySelector('.result-overview-layout'));assert.ok(d.querySelector('.result-resource-metrics'));
 button('AI应用').click();await wait(()=>d.querySelector('.result-app-grid'));button('实验指导').click();await wait(()=>d.querySelector('.result-application-tabs .active').textContent==='实验指导');d.querySelector('.result-app-grid button').click();await wait(()=>d.querySelector('.modal'));assert.match(d.querySelector('.modal').textContent,/模拟/);button('关闭').click();await wait(()=>!d.querySelector('.modal'));
 d.querySelector('[aria-label="返回课程编辑"]').click();await wait(()=>button('建设成果展示'));assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),draft);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('独立HTML支持成果页直达，图片内嵌',async()=>{
 const dom=new JSDOM(html,{url:'file:///demo/index.html#results/home',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});
 try{await wait(()=>dom.window.document.querySelector('.result-dark'));assert.match(dom.window.document.querySelector('.result-course-cover img').src,/^data:image\/png;base64,/);}finally{dom.window.close();}
});
test('成果首页上滑进入详情，详情正常滚动且到顶部下滑返回',async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/#results/home',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});
 const d=dom.window.document;const wheel=(target,deltaY)=>target.dispatchEvent(new dom.window.WheelEvent('wheel',{deltaY,bubbles:true,cancelable:true}));
 try{await wait(()=>d.querySelector('.result-dark'));let portal=d.querySelector('.results-portal');await new Promise(r=>setTimeout(r,50));
 Object.defineProperties(portal,{scrollHeight:{configurable:true,value:1600},clientHeight:{configurable:true,value:800}});
 wheel(d.querySelector('.result-intro'),100);assert.ok(d.querySelector('.result-dark'),'长首页先正常滚动');portal.scrollTop=800;
 wheel(d.querySelector('.result-intro'),100);await wait(()=>d.querySelector('.result-page-overview'));assert.equal(portal.scrollTop,0);
 await new Promise(r=>setTimeout(r,750));portal.scrollTop=120;wheel(d.querySelector('.result-overview-content'),-100);assert.ok(d.querySelector('.result-page-overview'),'正文尚未到顶部时保持滚动');
 portal.scrollTop=0;d.querySelector('.result-resource-list button').click();await wait(()=>d.querySelector('.modal'));wheel(d.querySelector('.modal'),-100);assert.ok(d.querySelector('.result-page-overview'),'弹窗内滚动不切页');d.querySelector('.modal footer button').click();await wait(()=>!d.querySelector('.modal'));
 wheel(d.querySelector('.result-overview-content'),-100);await wait(()=>d.querySelector('.result-dark'));
 await new Promise(r=>setTimeout(r,750));portal.scrollTop=800;const start=new dom.window.Event('touchstart',{bubbles:true});Object.defineProperty(start,'touches',{value:[{clientX:200,clientY:500}]});d.querySelector('.result-intro').dispatchEvent(start);
 const end=new dom.window.Event('touchend',{bubbles:true,cancelable:true});Object.defineProperty(end,'changedTouches',{value:[{clientX:205,clientY:300}]});d.querySelector('.result-intro').dispatchEvent(end);await wait(()=>d.querySelector('.result-page-overview'));
 await new Promise(r=>setTimeout(r,750));const reverseStart=new dom.window.Event('touchstart',{bubbles:true});Object.defineProperty(reverseStart,'touches',{value:[{clientX:200,clientY:200}]});d.querySelector('.result-overview-content').dispatchEvent(reverseStart);const reverseEnd=new dom.window.Event('touchend',{bubbles:true,cancelable:true});Object.defineProperty(reverseEnd,'changedTouches',{value:[{clientX:200,clientY:400}]});d.querySelector('.result-overview-content').dispatchEvent(reverseEnd);await wait(()=>d.querySelector('.result-dark'));
 [...d.querySelectorAll('button')].find(b=>b.textContent==='知识模型').click();await wait(()=>d.querySelector('.result-page-knowledge'));await new Promise(r=>setTimeout(r,750));wheel(d.querySelector('.result-chart'),-100);assert.ok(d.querySelector('.result-page-knowledge'),'图谱滚轮保留缩放');wheel(d.querySelector('.result-header'),-100);await wait(()=>d.querySelector('.result-dark'));await new Promise(r=>setTimeout(r,750));portal.scrollTop=800;wheel(d.querySelector('.result-intro'),100);await wait(()=>d.querySelector('.result-page-knowledge'));
 }finally{dom.window.close();}
});
