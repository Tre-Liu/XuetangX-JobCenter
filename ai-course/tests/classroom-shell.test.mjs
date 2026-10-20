import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const wait=async fn=>{for(let i=0;i<150;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Classroom navigation did not reach expected state');};
test('class card opens class detail tabs, while teaching button opens course workspace',async()=>{
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/#classes',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;}});
 const d=dom.window.document;
 try{
  await wait(()=>d.querySelector('.class-card'));
  assert.equal(d.querySelector('[aria-label="资源库"]').disabled,true);
  assert.equal(d.querySelector('[aria-label="AI空间"]').disabled,true);
  const title=d.querySelector('.class-card h3').textContent;
  d.querySelector('.class-card h3').click();await wait(()=>d.querySelector('.class-detail'));
  assert.ok(d.querySelector('.class-detail-header').textContent.includes(title));
  assert.equal(d.querySelectorAll('.class-detail [role="tab"]').length,9);
  assert.equal(d.querySelector('.class-detail [role="tab"][aria-selected="true"]').textContent,'教学日志');
  const expected=['教学日志','教学内容','讨论区','公告','成绩单','数据统计','成员管理','设置','分组'];
  assert.deepEqual([...d.querySelectorAll('.class-detail [role="tab"]')].map(b=>b.textContent),expected);
  for(const name of expected){
   [...d.querySelectorAll('.class-detail [role="tab"]')].find(b=>b.textContent===name).click();
   await wait(()=>d.querySelector('.class-detail [role="tab"][aria-selected="true"]').textContent===name);
   assert.equal(d.querySelector('[role="tabpanel"]').getAttribute('aria-labelledby'),d.querySelector('[role="tab"][aria-selected="true"]').id);
  }
  [...d.querySelectorAll('.class-detail [role="tab"]')].find(b=>b.textContent==='教学日志').click();
  await wait(()=>d.querySelector('.cd-log'));
  assert.equal(d.querySelector('.topbar'),null);
  assert.match(d.querySelector('.class-detail').textContent,/全部日志/);
  d.querySelector('[aria-label="返回课程班级"]').click();await wait(()=>d.querySelector('.class-card'));
  d.querySelector('.class-teach-button').click();await wait(()=>d.querySelector('.project-page'));
  assert.equal(d.querySelector('.class-detail'),null);
  assert.equal(dom.window.location.hash,'#workspace');
  d.querySelector('[aria-label="课程班级"]').click();await wait(()=>d.querySelector('.class-card'));
  const input=d.querySelector('[aria-label="搜索课程"]');
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'没有这门课程');
  input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));await wait(()=>!d.querySelector('.class-card'));
  assert.match(d.querySelector('.classroom-list').textContent,/暂无匹配课程/);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('class detail hash survives reload and browser navigation returns to the workspace',async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/#class/smart-manufacturing-2026-autumn?tab=members',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});
 try{
  await wait(()=>dom.window.document.querySelector('.class-detail'));
  assert.equal(dom.window.document.querySelector('[role="tab"][aria-selected="true"]').textContent,'成员管理');
  dom.window.location.hash='class/smart-manufacturing-2026-autumn?tab=groups';
  await wait(()=>dom.window.document.querySelector('[role="tab"][aria-selected="true"]').textContent==='分组');
  dom.window.location.hash='workspace';await wait(()=>dom.window.document.querySelector('.project-page'));
 }finally{dom.window.close();}
});

test('version cards search independently and keep selected class when changing tabs and reloading',async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/#classes',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});
 const d=dom.window.document;
 try{
  await wait(()=>d.querySelector('.class-card'));
  assert.equal(d.querySelectorAll('.class-card').length,6);
  const cards=[...d.querySelectorAll('.class-card')];
  assert.equal(new Set(cards.map(card=>card.dataset.classId)).size,6);
  const chosen=cards[3];const title=chosen.querySelector('h3').textContent;const version=chosen.querySelector('.class-version-badge').textContent;
  chosen.click();await wait(()=>d.querySelector('.class-detail'));
  assert.ok(d.querySelector('.class-detail-header').textContent.includes(title));
  assert.ok(d.querySelector('.class-detail-header').textContent.includes(version));
  [...d.querySelectorAll('[role="tab"]')].find(b=>b.textContent==='设置').click();
  await wait(()=>d.querySelector('[aria-label="当前版本配置"]'));
  assert.equal(d.querySelector('[aria-label="版本班级名称"]').value,title);
  assert.ok(dom.window.location.hash.includes(chosen.dataset.classId));
  const deepLink=dom.window.location.href;
  const reloaded=new JSDOM(html,{url:deepLink,runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});
  try{await wait(()=>reloaded.window.document.querySelector('[aria-label="当前版本配置"]'));assert.equal(reloaded.window.document.querySelector('[aria-label="版本班级名称"]').value,title);}finally{reloaded.window.close();}
  dom.window.location.hash='class/'+cards[1].dataset.classId+'?tab=members';
  await wait(()=>d.querySelector('.class-detail-header').textContent.includes(cards[1].querySelector('h3').textContent));
  await wait(()=>d.querySelector('.cd-members'));
  d.querySelector('[aria-label="返回课程班级"]').click();await wait(()=>d.querySelector('.class-card'));
  const input=d.querySelector('[aria-label="搜索课程"]');Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'V2.0');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await wait(()=>d.querySelectorAll('.class-card').length===1);
  assert.equal(d.querySelector('.class-version-badge').textContent,'V2.0');
 }finally{dom.window.close();}
});

test('workspace knowledge and ability navigation retain the selected version across reload',async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/#classes',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});const d=dom.window.document;
 try{
  await wait(()=>d.querySelectorAll('.class-card').length===6);const card=d.querySelectorAll('.class-card')[1],id=card.dataset.classId;card.querySelector('.class-teach-button').click();await wait(()=>d.querySelector('.topbar'));
  [...d.querySelectorAll('.topbar nav button')].find(b=>b.textContent==='知识库').click();await wait(()=>dom.window.location.hash.startsWith('#knowledge-base'));
  assert.ok(dom.window.location.hash.includes(id));assert.equal(d.querySelector('.course-version-context').textContent,'V2.2');
  [...d.querySelectorAll('.topbar nav button')].find(b=>b.textContent==='课程模型').click();
  await wait(()=>d.querySelector('.nav-item'));
  [...d.querySelectorAll('.nav-item')].find(b=>b.textContent.includes('能力图谱')).click();await wait(()=>dom.window.location.hash.startsWith('#ability'));assert.ok(dom.window.location.hash.includes(id));
  const reload=new JSDOM(html,{url:dom.window.location.href,runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});try{await wait(()=>reload.window.document.querySelector('.course-version-context'));assert.equal(reload.window.document.querySelector('.course-version-context').textContent,'V2.2');}finally{reload.window.close();}
 }finally{dom.window.close();}
});
