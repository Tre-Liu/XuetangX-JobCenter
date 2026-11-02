import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('成果页面未进入期望状态');};
test('顶部课岗模型打开当前课程图谱，画布交互不跳页且保留草稿',async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/#results/overview',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}}),d=dom.window.document;
 const button=name=>[...d.querySelectorAll('.result-header .result-nav button')].find(b=>b.textContent.trim()===name);
 try{
  await wait(()=>button('课程概述'));
  assert.ok(button('课岗模型'),'顶部应提供课岗模型入口');
  await wait(()=>dom.window.localStorage.getItem('ai-course-projects-v1'));
  const draft=dom.window.localStorage.getItem('ai-course-projects-v1');
  button('课岗模型').click();await wait(()=>d.querySelector('.result-page-course-jobs .course-panorama'));
  assert.equal(dom.window.location.hash,'#results/course-jobs');
  assert.ok(button('课岗模型').classList.contains('active'));
  assert.equal(d.querySelector('.course-panorama').dataset.theme,'light');
  const summary=d.querySelector('[aria-label="课岗结合统计"]').textContent;
  assert.match(summary,/知识点与岗位能力匹配率.*岗位典型工作任务能力支撑率.*关联岗位/);
  d.querySelector('.panorama-expand').click();await wait(()=>d.querySelector('[data-kind="ability"]'));
  d.querySelector('[data-kind="knowledge"]').click();await wait(()=>d.querySelector('.course-panorama.has-focus'));
  assert.equal(d.querySelector('[aria-label="课岗结合统计"]').textContent,summary,'选择图谱节点不改变课程整体统计');
  d.querySelector('.panorama-viewport').dispatchEvent(new dom.window.WheelEvent('wheel',{deltaY:-150,bubbles:true,cancelable:true}));
  assert.equal(dom.window.location.hash,'#results/course-jobs');
  assert.doesNotMatch(d.querySelector('.result-page-course-jobs').textContent,/演示课程|教学演示|模拟数据|示例数据|测试数据|demo/i);
  button('课程概述').click();await wait(()=>d.querySelector('.result-overview-layout'));
  dom.window.location.hash='results/course-jobs';await wait(()=>d.querySelector('.result-page-course-jobs .course-panorama'));
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),draft);
 }finally{dom.window.close();}
});
test('查看成果页导航、返回、菜单关闭与课程草稿保持一致',async()=>{
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};}});const d=dom.window.document;
 const button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 try{await wait(()=>button('建设成果展示'));await wait(()=>dom.window.localStorage.getItem('ai-course-projects-v1'));const draft=dom.window.localStorage.getItem('ai-course-projects-v1');
 button('建设成果展示').click();await wait(()=>d.querySelector('[role="menu"]'));d.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!d.querySelector('[role="menu"]'));
 button('建设成果展示').click();await wait(()=>button('查看成果页'));button('查看成果页').click();await wait(()=>d.querySelector('.result-dark'));
 assert.match(d.querySelector('.result-intro').textContent,/电气控制与PLC/);assert.equal(d.querySelector('.result-source-note'),null);
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

test('成果页独立课岗图谱支持深色直达、关系交互与返回，保留教师草稿',async()=>{
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/#results/home',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};}});
 const d=dom.window.document,button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 try{
  await wait(()=>d.querySelector('.result-home-tabs'));
  const names=[...d.querySelectorAll('.result-home-tabs button')].map(b=>b.textContent.trim());
  assert.deepEqual(names,['首页','制造智库','制造智网','制造智控','课岗关联图谱','AI枢纽']);
  const draft=dom.window.localStorage.getItem('ai-course-projects-v1');
  button('课岗关联图谱').click();await wait(()=>d.querySelector('.result-relations-module .course-panorama'));
  assert.equal(dom.window.location.hash,'#results/relations');
  assert.equal(d.querySelector('.course-panorama').dataset.theme,'dark');
  assert.equal(d.querySelector('.result-home-tabs .active').textContent,'课岗关联图谱');
  assert.equal(d.querySelector('.result-intro'),null);
  d.querySelector('.panorama-expand').click();await wait(()=>d.querySelector('[data-kind="ability"]'));
  const point=d.querySelector('[data-kind="knowledge"]');assert.ok(point);point.click();await wait(()=>d.querySelector('.course-panorama.has-focus'));
  d.querySelector('.panorama-viewport').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!d.querySelector('.course-panorama.has-focus'));
  d.querySelector('.panorama-viewport').dispatchEvent(new dom.window.WheelEvent('wheel',{deltaY:-150,bubbles:true,cancelable:true}));
  assert.equal(dom.window.location.hash,'#results/relations','画布边界滚动不跳出独立图谱');
  assert.doesNotMatch(d.querySelector('.results-portal').textContent,/演示课程|模拟数据|示例数据|测试数据|demo/i);
  button('AI枢纽').click();await wait(()=>d.querySelector('.result-hub-cards'));assert.equal(dom.window.location.hash,'#results/home');
  dom.window.location.hash='results/relations';await wait(()=>d.querySelector('.result-relations-module'));
  assert.equal(d.querySelector('.course-panorama').dataset.theme,'dark');
  d.querySelector('[aria-label="返回课程编辑"]').click();await wait(()=>button('建设成果展示'));
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),draft);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('独立HTML可直接打开成果课岗关联图谱',async()=>{
 const dom=new JSDOM(html,{url:'file:///course/index.html#results/relations',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});
 try{await wait(()=>dom.window.document.querySelector('.result-relations-module'));assert.equal(dom.window.document.querySelector('.course-panorama').dataset.theme,'dark');}finally{dom.window.close();}
});

test('成果图谱依据已保存专业环节关系双向点亮，保持无关分支暗态',async()=>{
 const {CONFIG_KEY}=await import('../src/cms/config.mjs');
 const config={major:{code:'080717T'},chainIds:['chain-75155ff272']};
 const dom=new JSDOM(html,{url:'http://localhost/#results/relations',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;w.localStorage.setItem(CONFIG_KEY,JSON.stringify(config));}}),d=dom.window.document;
 try{
  await wait(()=>d.querySelectorAll('[data-kind="segment"]').length===3);
  await wait(()=>dom.window.localStorage.getItem('ai-course-projects-v1'));
  const draft=dom.window.localStorage.getItem('ai-course-projects-v1');
  const project=d.querySelector('[data-kind="project"][aria-label="金属与非金属工件自动分拣"]');
  const mid=d.querySelector('[data-kind="segment"][aria-label="智能感知、语音视觉与平台工具"]');
  project.click();await wait(()=>project.getAttribute('aria-pressed')==='true');
  assert.ok(mid.classList.contains('is-related'));
  assert.equal(d.querySelectorAll('[data-kind="segment"].is-dimmed').length,2);
  assert.equal(d.querySelectorAll('[data-kind="project"].is-related').length,1);
  const segmentId=mid.dataset.nodeId,projectId=project.dataset.nodeId;
  assert.ok([...d.querySelectorAll('.panorama-edges path.is-hot')].some(p=>p.dataset.from===segmentId&&p.dataset.to===projectId));
  assert.doesNotMatch(d.querySelector('.course-panorama').textContent,/待复核/);
  mid.click();await wait(()=>mid.getAttribute('aria-pressed')==='true');
  assert.ok(project.classList.contains('is-related'));
  assert.ok(d.querySelector('[data-kind="role"][aria-label="自动化设备调试技术员"]').classList.contains('is-related'));
  d.querySelector('.panorama-viewport').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!d.querySelector('.course-panorama.has-focus'));
  assert.equal(dom.window.localStorage.getItem('ai-course-projects-v1'),draft);
  assert.equal(dom.window.localStorage.getItem(CONFIG_KEY),JSON.stringify(config));
 }finally{dom.window.close();}
});
