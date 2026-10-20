import test from 'node:test';
import * as richModel from '../src/ai-projects/model.mjs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {addAiDemos,AI_DEMO_KEY,homeResources,safeExternalUrl,sanitizeRichHtml,validateFile,aiDemoProjects} from '../src/ai-projects/model.mjs';
const store=()=>{const data=new Map();return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};};
// Missing migration guards would resurrect deleted demos or replace a teacher's work.
 test('AI demo migration preserves edits, explicit deletion and custom-only courses',()=>{
 const storage=store(),teacher={id:'plc-demo-conveyor',title:'教师修订',stages:[]};const result=addAiDemos(storage,[teacher]);assert.equal(result.length,3);assert.deepEqual(result[0],teacher);assert.equal(storage.getItem(AI_DEMO_KEY),'done');assert.deepEqual(addAiDemos(storage,[]),[]);assert.deepEqual(addAiDemos(store(),[{id:'custom',title:'教师自建',stages:[]}]),[{id:'custom',title:'教师自建',stages:[]}]);
 });
 test('homepage project gate and resource gates both determine the displayed resources',()=>{
 const p={info:{visibility:{teacher:true,student:false},resources:[{id:'a',visibility:{teacher:true,student:true}},{id:'b',visibility:{teacher:false,student:true}},{id:'c',visibility:{teacher:true,student:false}}]}};assert.deepEqual(homeResources(p,'teacher').map(r=>r.id),['a','c']);assert.deepEqual(homeResources(p,'student'),[]);
 });
 test('rich text preserves readable formatting while removing active content and unsafe links',()=>{
 const dom=new JSDOM();try{const html=sanitizeRichHtml('<h2 onclick="alert(1)">简介</h2><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">坏链接</a><a href="https://example.com/">资料</a><ul><li><b>任务</b></li></ul>',dom.window.document);const n=dom.window.document.createElement('div');n.innerHTML=html;assert.equal(n.querySelector('h2').textContent,'简介');assert.equal(n.querySelectorAll('script,img,[onclick],[onerror]').length,0);assert.equal(n.querySelector('a').getAttribute('href'),null);assert.equal(n.querySelectorAll('a')[1].getAttribute('rel'),'noopener noreferrer');assert.equal(n.querySelector('li b').textContent,'任务');}finally{dom.window.close();}
 });
 test('uploads accept office PDF archives and videos but reject invalid files and excessive size',()=>{
 for(const name of ['视频.mp4','材料.docx','数据.xlsx','展示.pptx','任务.PDF','成果.zip','备份.rar'])assert.equal(validateFile({name,size:1024}), '');assert.ok(validateFile({name:'应用.exe',size:100}));assert.ok(validateFile({name:'视频.mp4',size:201*1024*1024}));assert.ok(validateFile({name:'空.pdf',size:0}));assert.equal(safeExternalUrl('javascript:alert(1)'), '');assert.equal(safeExternalUrl('https://user:pass@example.com/'), '');assert.equal(safeExternalUrl(' https://example.com '),'https://example.com/');
 });
 test('demo case attachments match the declared dataset split',()=>{
 const projects=aiDemoProjects();const diagnosis=decodeURIComponent(projects[0].info.resources.find(r=>r.name.endsWith('.csv')).url.split(',')[1]);const rows=diagnosis.trim().split('\n');assert.equal(rows.length,49);assert.equal(rows.filter(r=>r.includes(',训练,')).length,36);assert.equal(rows.filter(r=>r.includes(',验证,')).length,12);
 });
 test('rich text preserves editor formatting without retaining arbitrary CSS',()=>{const dom=new JSDOM();try{const output=sanitizeRichHtml('<p><span style="font-weight: bold; font-style: italic; background-image: url(https://example.com/a)">格式</span></p>',dom.window.document);const n=dom.window.document.createElement('div');n.innerHTML=output;assert.equal(n.querySelector('span').style.fontWeight,'bold');assert.equal(n.querySelector('span').style.fontStyle,'italic');assert.equal(n.querySelector('span').style.backgroundImage,'');}finally{dom.window.close();}});
 test('AI migration write failures retain loaded teacher projects',()=>{
 const data=new Map(),projects=[{id:'teacher-project',title:'教师修订',stages:[]}];const storage={getItem:k=>data.get(k)||null,setItem(k,v){if(k===AI_DEMO_KEY)throw Error('QuotaExceededError');data.set(k,v);}};
 assert.doesNotThrow(()=>addAiDemos(storage,projects));assert.deepEqual(addAiDemos(storage,projects),projects);assert.deepEqual(JSON.parse(data.get('ai-course-projects-v1')),projects);
 });
test('editor colors, alignment, heading levels and list styles survive safe saving',()=>{
 const dom=new JSDOM();try{
  const output=sanitizeRichHtml('<h1 style="text-align:center">标题</h1><p style="text-align:justify"><font color="#ff0000">红字</font><span style="color:rgb(0, 128, 0);background-color:#ffff00;text-decoration:line-through">标记</span></p><ol style="list-style-type:lower-alpha"><li>步骤</li></ol><p style="position:fixed;background-image:url(https://example.com);color:var(--secret)">正文</p>',dom.window.document);
  const n=dom.window.document.createElement('div');n.innerHTML=output;
  assert.equal(n.querySelector('h1')?.style.textAlign,'center');
  assert.equal(n.querySelector('p').style.textAlign,'justify');
  assert.equal(n.querySelector('p span').style.color,'rgb(255, 0, 0)');
  const mark=n.querySelectorAll('p span')[1];assert.equal(mark.style.backgroundColor,'rgb(255, 255, 0)');assert.equal(mark.style.textDecorationLine,'line-through');
  assert.equal(n.querySelector('ol').style.listStyleType,'lower-alpha');assert.equal(n.querySelectorAll('p')[1].getAttribute('style'),null);
 }finally{dom.window.close();}
});
test('whole-editor replacement requires the full DOM range including unselected images',()=>{
 const dom=new JSDOM();try{const d=dom.window.document,editor=d.createElement('div');editor.innerHTML='<h2>文字</h2><img src="data:image/png;base64,AAAA">';d.body.append(editor);
 const range=d.createRange();range.selectNodeContents(editor.querySelector('h2'));assert.equal(richModel.richSelectionCoversContents?.(range,editor),false);
 range.selectNode(editor.querySelector('h2'));assert.equal(richModel.richSelectionCoversContents?.(range,editor),false);
 range.selectNodeContents(editor);assert.equal(richModel.richSelectionCoversContents?.(range,editor),true);
 }finally{dom.window.close();}
});
