import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const wait=async f=>{for(let i=0;i<150;i++){if(f())return;await new Promise(r=>setTimeout(r,10));}assert.fail('AI project UI did not reach the expected state');};
function mount(storage={},setup=()=>{}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/#workspace',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;setup(w);for(const [key,value] of Object.entries(storage))w.localStorage.setItem(key,value);}});
 const d=dom.window.document,button=name=>[...d.querySelectorAll('button')].find(b=>b.textContent.trim()===name);
 const fill=(selector,value)=>{const n=d.querySelector(selector);Object.getOwnPropertyDescriptor(dom.window[n.tagName==='TEXTAREA'?'HTMLTextAreaElement':'HTMLInputElement'].prototype,'value').set.call(n,value);n.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
 const saved=()=>JSON.parse(dom.window.localStorage.getItem('ai-course-projects-v1'));
 return {dom,d,button,fill,saved,errors};
}
test('AI demo keeps six-stage learning and submits metadata only on explicit save',async()=>{
 const {dom,d,button,fill,saved,errors}=mount();
 try{
  await wait(()=>d.querySelector('.project-hero'));
  assert.equal(d.querySelectorAll('.projects-nav .ai-project-badge').length,0,'project badges must be hidden');
  [...d.querySelectorAll('.projects-nav .nav-item')].find(b=>b.textContent.includes('PLC故障诊断AI助手')).click();
  await wait(()=>button('项目详情'));button('项目详情').click();await wait(()=>d.querySelector('.ai-project-details'));
  assert.ok(d.querySelector('.ai-rich-view h2'));assert.ok(d.querySelectorAll('.ai-resource-card').length>=5);
  const before=saved().find(p=>p.projectType==='ai');assert.equal(before.stages.length,6);assert.ok(before.stages.every(s=>s.tasks.length>=2));
  button('编辑项目信息').click();await wait(()=>d.querySelector('.ai-info-editor'));
  fill('#ai-info-title','未保存标题');d.querySelector('[aria-label="项目简介富文本编辑器"]').innerHTML='<h2>未提交简介</h2>';
  d.querySelector('[aria-label="项目简介富文本编辑器"]').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert.deepEqual(saved().find(p=>p.id===before.id),before);button('取消').click();await wait(()=>!d.querySelector('.ai-info-editor'));
  assert.ok(!d.querySelector('.ai-rich-view').textContent.includes('未提交'));
  button('编辑项目信息').click();await wait(()=>d.querySelector('.ai-info-editor'));fill('#ai-info-title','已提交AI项目');
  const rich=d.querySelector('[aria-label="项目简介富文本编辑器"]');
  rich.innerHTML='<p>'+ '字'.repeat(5001) +'</p>';rich.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await wait(()=>d.querySelector('.ai-rich-counter').textContent.includes('已超出1个字符'));
  button('保存提交').click();await wait(()=>d.querySelector('[role="alert"]'));assert.match(d.querySelector('[role="alert"]').textContent,/最多输入 5000/);assert.equal(saved().find(p=>p.id===before.id).title,before.title);
  rich.innerHTML=before.info.html;rich.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  d.querySelector('[aria-label="全屏"]').click();await wait(()=>d.querySelector('.ai-rich-fullscreen'));
  rich.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!d.querySelector('.ai-rich-fullscreen'));assert.ok(d.querySelector('.ai-info-editor'),'Escape exits fullscreen without cancelling the draft');
  d.querySelector('[aria-label="项目教师端首页展示"]').click();
  button('保存提交').click();await wait(()=>!d.querySelector('.ai-info-editor'));
  const after=saved().find(p=>p.id===before.id);assert.equal(after.title,'已提交AI项目');assert.equal(after.info.visibility.teacher,false);assert.deepEqual(after.stages,before.stages);
  button('教师端首页预览').click();await wait(()=>d.querySelector('.ai-home-preview'));assert.match(d.querySelector('.ai-home-preview').textContent,/项目未设置/);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('new project form explicitly chooses AI type',async()=>{
 const {dom,d,button,fill,saved}=mount();try{await wait(()=>d.querySelector('.add-project'));d.querySelector('.add-project').click();await wait(()=>d.querySelector('#project-title'));assert.ok(button('AI项目'));button('AI项目').click();fill('#project-title','自建AI项目');fill('#project-description','学习项目描述');button('确定').click();await wait(()=>!d.querySelector('.modal'));assert.equal(saved().at(-1).projectType,'ai');assert.equal(saved().at(-1).title,'自建AI项目');}finally{dom.window.close();}
});

test('selecting the whole list changes its markers and supports undo and redo without saving',async()=>{
 const {dom,d,button,saved,errors}=mount();try{
  await wait(()=>d.querySelector('.project-hero'));
  [...d.querySelectorAll('.projects-nav .nav-item')].find(b=>b.textContent.includes('PLC故障诊断AI助手')).click();await wait(()=>button('编辑项目信息'));button('编辑项目信息').click();await wait(()=>d.querySelector('.ai-info-editor'));
  const before=saved(),rich=d.querySelector('[aria-label="项目简介富文本编辑器"]');
  rich.innerHTML='<ol><li>第一项</li><li>第二项</li></ol>';rich.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  const range=d.createRange();range.selectNodeContents(rich);const selection=dom.window.getSelection();selection.removeAllRanges();selection.addRange(range);rich.dispatchEvent(new dom.window.MouseEvent('mouseup',{bubbles:true}));
  d.querySelector('[aria-label="有序列表选项"]').click();await wait(()=>button('a. b. c.'));button('a. b. c.').click();await wait(()=>rich.querySelector('ol')?.style.listStyleType==='lower-alpha');
  assert.equal(rich.querySelectorAll('li').length,2);assert.equal(rich.textContent,'第一项第二项');
  d.querySelector('[aria-label="撤销"]').click();await wait(()=>rich.querySelector('ol')?.style.listStyleType==='');assert.equal(rich.querySelectorAll('li').length,2);
  d.querySelector('[aria-label="重做"]').click();await wait(()=>rich.querySelector('ol')?.style.listStyleType==='lower-alpha');
  rich.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true}));await wait(()=>rich.querySelector('ol')?.style.listStyleType==='');
  d.querySelector('[aria-label="插入链接"]').click();await wait(()=>d.querySelector('[aria-label="富文本链接地址"]'));
  const address=d.querySelector('[aria-label="富文本链接地址"]'),undoInput=new dom.window.KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true}),unchanged=rich.innerHTML;
  address.dispatchEvent(undoInput);assert.equal(undoInput.defaultPrevented,false,'URL input keeps its native undo shortcut');assert.equal(rich.innerHTML,unchanged);
  assert.deepEqual(saved(),before);assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('external resource editing validates URLs and survives a new page instance',async()=>{
 const {dom,d,button,fill,saved,errors}=mount();let persisted;
 try{await wait(()=>d.querySelector('.project-hero'));[...d.querySelectorAll('.projects-nav .nav-item')].find(b=>b.textContent.includes('PLC故障诊断AI助手')).click();await wait(()=>button('编辑项目信息'));button('编辑项目信息').click();await wait(()=>d.querySelector('.ai-info-editor'));
 const find=label=>d.querySelector(`[aria-label="${label}"]`);
 fill('[aria-label="链接地址：西门子工业支持 · 查找设备手册"]','javascript:alert(1)');button('保存提交').click();await wait(()=>d.querySelector('[role="alert"]'));assert.ok(d.querySelector('.ai-info-editor'));assert.equal(saved().find(p=>p.projectType==='ai').info.resources.find(r=>r.kind==='link').url,'https://support.industry.siemens.com/');
 fill('[aria-label="链接地址：西门子工业支持 · 查找设备手册"]','https://example.com/manual');find('西门子工业支持 · 查找设备手册学生端首页展示').click();
 fill('[aria-label="外部资源名称"]','教师补充链接');fill('[aria-label="外部资源链接"]','https://example.com/training');button('添加外部链接').click();await wait(()=>find('删除资源：教师补充链接'));button('保存提交').click();await wait(()=>!d.querySelector('.ai-info-editor'));
 button('学生端首页预览').click();await wait(()=>d.querySelector('.ai-home-preview'));assert.ok(!d.querySelector('.ai-home-preview').textContent.includes('西门子工业支持'));assert.match(d.querySelector('.ai-home-preview').textContent,/教师补充链接/);
 persisted=Object.fromEntries(Object.keys(dom.window.localStorage).map(k=>[k,dom.window.localStorage.getItem(k)]));assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
 const second=mount(persisted);try{await wait(()=>second.d.querySelector('.project-hero'));[...second.d.querySelectorAll('.projects-nav .nav-item')].find(b=>b.textContent.includes('PLC故障诊断AI助手')).click();await wait(()=>second.d.querySelector('.ai-resource-list'));assert.ok(second.d.querySelector('a[href="https://example.com/manual"]'));assert.equal(second.d.querySelectorAll('.projects-nav .ai-project-badge').length,0);}finally{second.dom.window.close();}
});

test('offline HTML entry exposes AI projects and read-only detail preview',async()=>{
 const offline=fs.readFileSync(new URL('../offline.html',import.meta.url),'utf8');const dom=new JSDOM(offline,{url:'http://localhost/offline.html#workspace',runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;}});try{const d=dom.window.document;await wait(()=>d.querySelector('.project-hero'));[...d.querySelectorAll('.projects-nav .nav-item')].find(b=>b.textContent.includes('PLC故障诊断AI助手')).click();await wait(()=>d.querySelector('.ai-project-details'));const preview=[...d.querySelectorAll('.hero-actions button')].find(b=>b.textContent.trim()==='预览');preview.click();await wait(()=>d.querySelector('.project-preview'));assert.ok(d.querySelector('.ai-project-details'));assert.equal(d.querySelector('.ai-info-editor'),null);assert.ok(![...d.querySelectorAll('button')].some(b=>b.textContent==='编辑项目信息'));}finally{dom.window.close();}
});

test('cancelling an attachment deletion keeps bytes, submitting deletion cleans the stored file',async()=>{
 const {indexedDB}=await import('fake-indexeddb');const {commitFiles,readAttachment}=await import('../src/ai-projects/files.mjs');const original=globalThis.indexedDB;globalThis.indexedDB=indexedDB;
 const resources=await commitFiles([{id:'ui-file',name:'保留的附件.txt',kind:'file',pendingFile:new Blob(['保存边界验证']),size:24,visibility:{teacher:true,student:true}}]);
 const storage={'plc-projects-2026-10-10-v2':'done','ai-course-ai-projects-2026-10-12':'done','ai-course-projects-v1':JSON.stringify([{id:'ui-ai',projectType:'ai',title:'附件测试AI项目',description:'验证提交边界',stages:[],info:{html:'<p>测试</p>',resources,visibility:{teacher:true,student:true}}}])};
 const {dom,d,button}=mount(storage,w=>{w.indexedDB=indexedDB;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};});
 try{await wait(()=>button('编辑项目信息'));button('编辑项目信息').click();await wait(()=>d.querySelector('.ai-info-editor'));d.querySelector('[aria-label="删除资源：保留的附件.txt"]').click();button('取消').click();await wait(()=>!d.querySelector('.ai-info-editor'));assert.equal(await (await readAttachment('ui-file')).text(),'保存边界验证');
 button('编辑项目信息').click();await wait(()=>d.querySelector('.ai-info-editor'));d.querySelector('[aria-label="删除资源：保留的附件.txt"]').click();await wait(()=>!d.querySelector('[aria-label="删除资源：保留的附件.txt"]'));button('保存提交').click();await wait(()=>!d.querySelector('.ai-info-editor'));await assert.rejects(readAttachment('ui-file'),/不存在/);
 }finally{dom.window.close();globalThis.indexedDB=original;}
});

test('failed AI demo marker write cannot replace a saved teacher project in the app',async()=>{
 const project={id:'teacher-saved',title:'教师保留项目',description:'已修订描述',stages:[]};const {dom,d,saved,errors}=mount({'plc-projects-2026-10-10-v2':'done','ai-course-projects-v1':JSON.stringify([project])},w=>{const original=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(key,value){if(key==='ai-course-ai-projects-2026-10-12')throw new w.DOMException('quota','QuotaExceededError');return original.call(this,key,value);};});
 try{await wait(()=>d.querySelector('.project-hero'));assert.match(d.querySelector('.project-hero').textContent,/教师保留项目/);assert.equal(d.querySelectorAll('.projects-nav .project-nav-row').length,1);assert.deepEqual(saved(),[project]);assert.deepEqual(errors,[]);}finally{dom.window.close();}
});
