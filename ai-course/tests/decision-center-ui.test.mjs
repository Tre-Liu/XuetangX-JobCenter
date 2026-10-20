import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const wait=async fn=>{for(let i=0;i<180;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Decision view not ready');};
function open(entry,hash){const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const downloads=[];const dom=new JSDOM(fs.readFileSync(new URL('../'+entry,import.meta.url),'utf8'),{url:'http://localhost/#'+hash,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};w.URL.createObjectURL=()=> 'blob:local-demo';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};}});return {dom,d:dom.window.document,errors,downloads};}
const click=(d,text)=>{const el=[...d.querySelectorAll('button')].find(e=>e.textContent.trim()===text||e.getAttribute('aria-label')===text);assert.ok(el,'Missing '+text);el.click();};
function setInput(w,el,value){Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new w.Event('input',{bubbles:true}));}
for(const entry of ['index.html','offline.html'])test(entry+' decision navigation, scope filtering, empty query, session and CSV export',async()=>{
 const {dom,d,errors,downloads}=open(entry,'decision/overview');const w=dom.window;
 try{
 await wait(()=>d.querySelector('.dc-overview'));assert.match(d.querySelector('.dc-overview').textContent,/5,047/);assert.equal(d.querySelector('.course-sidebar'),null);
 const scope=d.querySelector('[aria-label="班级范围"]');scope.value='current';scope.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(()=>!d.querySelector('[aria-label="教学班名称"]').textContent.includes('机电2301班'));
 click(d,'AI点评');await wait(()=>d.querySelector('[role="dialog"]'));assert.match(d.querySelector('[role="dialog"]').textContent,/课程运行点评/);click(d,'关闭弹窗');
 click(d,'应用洞察诊断');await wait(()=>d.querySelector('.dc-insights'));assert.match(d.querySelector('.dc-insights').textContent,/学生高频问题/);
 const app=d.querySelector('[role="tab"][aria-selected="true"]');assert.equal(app.textContent,'24H智能学伴');
 const topicButton=d.querySelector('.dc-knowledge-rank button');const topic=topicButton.querySelector('strong').textContent;const topicCount=topicButton.querySelector('b').textContent.replace(' 次','');topicButton.click();await wait(()=>d.querySelector('.dc-details'));assert.equal(d.querySelector('.dc-topic-filter').textContent,'知识点：'+topic);assert.ok(d.querySelector('.dc-details-panel header').textContent.includes(topicCount));
 click(d,'应用洞察诊断');await wait(()=>d.querySelector('.dc-insights'));
 d.querySelector('.dc-rank-list button').click();await wait(()=>d.querySelector('.dc-details'));assert.equal(d.querySelector('[aria-label="AI应用"]').value,'24H智能学伴');assert.ok(d.querySelector('[aria-label="搜索提问者姓名或问答内容"]').value);assert.ok(d.querySelector('.dc-detail-table tbody tr'));
 click(d,'重置条件');await wait(()=>d.querySelector('[aria-label="搜索提问者姓名或问答内容"]').value==='');
 d.querySelector('.dc-detail-table .dc-link').click();await wait(()=>d.querySelector('.dc-conversation'));assert.match(d.querySelector('.dc-conversation').textContent,/AI回答/);click(d,'关闭弹窗');
 click(d,'下一页');await wait(()=>d.querySelector('.dc-pagination b').textContent.startsWith('2 /'));
 click(d,'数据导出');assert.equal(downloads.at(-1),'课程AI交流明细.csv');
 const search=d.querySelector('[aria-label="搜索提问者姓名或问答内容"]');setInput(w,search,'绝无此问题');await new Promise(r=>setTimeout(r,15));d.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>d.querySelector('.dc-empty'));assert.equal(d.querySelector('.dc-detail-table'),null);
 click(d,'教学数据下载');await wait(()=>d.querySelector('.dc-download-grid'));const buttons=[...d.querySelectorAll('.dc-download-card button')];assert.equal(buttons.length,4);for(const b of buttons)b.click();assert.equal(downloads.length,5);assert.deepEqual(errors,[]);
 }finally{w.close();}
});

test('decision page navigation preserves selected teaching version',async()=>{
 const {dom,d}=open('index.html','workspace?class=plc-2026-autumn-02');
 try{await wait(()=>d.querySelector('.project-page'));assert.equal(d.querySelector('.course-version-context').textContent,'V2.2');click(d,'AI决策中心');await wait(()=>d.querySelector('.dc-overview'));assert.match(dom.window.location.hash,/class=plc-2026-autumn-02/);
 for(const name of ['应用洞察诊断','AI明细监控','教学数据下载']){click(d,name);await wait(()=>d.querySelector('.dc-sidebar [aria-current="page"]').textContent===name);assert.match(dom.window.location.hash,/class=plc-2026-autumn-02/);assert.equal(d.querySelector('.course-version-context').textContent,'V2.2');}
 click(d,'课程模型');await wait(()=>d.querySelector('.project-page'));assert.equal(dom.window.location.hash,'#workspace?class=plc-2026-autumn-02');assert.equal(d.querySelector('.course-version-context').textContent,'V2.2');
 }finally{dom.window.close();}
});
