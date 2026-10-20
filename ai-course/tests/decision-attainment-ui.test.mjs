import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
const wait=async fn=>{for(let i=0;i<200;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Attainment UI not ready');};
function open(entry,hash='decision/insights'){const errors=[],downloads=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(fs.readFileSync(new URL('../'+entry,import.meta.url),'utf8'),{url:'http://localhost/#'+hash,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};w.URL.createObjectURL=()=> 'blob:demo-attainment';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};}});return {dom,d:dom.window.document,errors,downloads};}
function select(w,d,label,value){const el=d.querySelector(`[aria-label="${label}"]`);assert.ok(el,label);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));}
for(const entry of ['index.html','offline.html'])test(entry+' teaching insights integrates students, radar, evidence, class comparison and exports',async()=>{
 const {dom,d,errors,downloads}=open(entry);const w=dom.window;
 try{
 await wait(()=>d.querySelector('.va-ranking-row'));assert.deepEqual([...d.querySelectorAll('.dc-sidebar button')].map(b=>b.textContent),['智能运行概览','教学分析助手','能力评估引擎','能力发展分析','学生表现分析','学生综合画像','学生个人画像','学生学情预警','应用洞察诊断','AI明细监控','教学数据下载']);assert.equal(d.querySelector('.dc-sidebar [aria-current="page"]').textContent,'应用洞察诊断');assert.ok(d.querySelector('.dc-insight-question-panel'));assert.equal(d.querySelector('.dc-attainment h1'),null);assert.equal(d.querySelector('.va-toolbar h2').textContent,'评价概况');assert.equal(d.querySelector('[aria-label="选择能力分析班级"]').value,'plc-2026-autumn-02');assert.equal(d.querySelectorAll('.va-radar-grid .va-chart-shell').length,2);
 assert.match(d.querySelector('.dca-comparison').textContent,/班级均值对比/);assert.ok(d.querySelectorAll('.dca-compare-table tbody tr').length>=3);
 assert.equal(d.querySelectorAll('.dca-compare-table tbody tr').length,5);assert.deepEqual([...d.querySelectorAll('.dca-compare-table th')].map(e=>e.textContent),['能力','当前均值','对比均值','差值（百分点）']);assert.ok(!d.querySelector('.dca-comparison').textContent.includes('教学模拟'));assert.equal(d.querySelectorAll('.dca-comparison .va-axis-values').length,0);assert.equal(d.querySelector('.dca-compare-table small'),null);
 select(w,d,'筛选班级对比模块','all');await wait(()=>d.querySelector('.dca-comparison-footer'));assert.equal(d.querySelectorAll('.dca-compare-table tbody tr').length,5);d.querySelector('.dca-comparison-footer button').click();await wait(()=>d.querySelectorAll('.dca-compare-table tbody tr').length===30);assert.equal(d.querySelector('.dca-comparison-footer button').textContent,'收起');select(w,d,'筛选班级对比模块','electrical');await wait(()=>d.querySelectorAll('.dca-compare-table tbody tr').length===5);select(w,d,'筛选班级对比模块','all');await wait(()=>d.querySelector('.dca-comparison-footer button')?.textContent==='查看全部');assert.equal(d.querySelectorAll('.dca-compare-table tbody tr').length,5);

 [...d.querySelectorAll('.va-view-switch button')].find(b=>b.textContent==='学生视角').click();await wait(()=>d.querySelector('[aria-label="选择分析学生"]'));const thresholdRow=[...d.querySelectorAll('.va-ranking-row')].find(r=>r.querySelector('.va-rank-score strong').textContent==='60.0%');assert.ok(thresholdRow);assert.match(thresholdRow.querySelector('.va-rank-score').textContent,/达标/);const students=d.querySelector('[aria-label="选择分析学生"]').options;assert.equal(students.length,8);select(w,d,'选择分析学生',students[1].value);await wait(()=>d.querySelector('[aria-label="选择分析学生"]').value===students[1].value);
 assert.ok(d.querySelector('.va-rank-mean small')?.textContent.includes('个百分点'));d.querySelector('.va-ranking-row').click();await wait(()=>d.querySelector('.va-record'));assert.match(d.querySelector('.va-evidence').textContent,/原始成绩.*满分/s);assert.match(d.querySelector('.va-evidence').textContent,/考核权重|权重分母/);assert.match(d.querySelector('.va-evidence').textContent,/题目ID|记录ID/);assert.match(d.querySelector('.va-evidence').textContent,/\u674e\u660a/);
 d.querySelector('.va-export').click();assert.ok(downloads.at(-1).includes('D1002'));
 select(w,d,'选择子能力模块','plc');await wait(()=>d.querySelector('[aria-label="选择子能力模块"]').value==='plc');
 [...d.querySelectorAll('[aria-label="班级对比能力层级"] button')].find(b=>b.textContent==='子能力').click();await wait(()=>d.querySelector('[aria-label="筛选班级对比模块"]'));select(w,d,'筛选班级对比模块','electrical');await wait(()=>d.querySelectorAll('.dca-compare-table tbody tr').length===5);
 d.querySelector('.dca-comparison .dc-export').click();assert.ok(downloads.at(-1).includes('班级均值对比.csv'));
 select(w,d,'选择对比班级','smart-manufacturing-2026-autumn');await wait(()=>d.querySelector('.dca-class-pair').textContent.includes('V3.0'));assert.ok([...d.querySelectorAll('.dca-compare-table tbody tr')].every(r=>r.textContent.includes('未评价')));
 select(w,d,'选择能力分析班级','smart-manufacturing-2026-autumn');await wait(()=>d.querySelector('.va-empty-roster'));assert.match(d.querySelector('.va-empty-roster').textContent,/尚未添加学生/);assert.match(d.querySelector('.va-metrics').textContent,/未评价/);assert.equal(d.querySelector('.va-import-trigger').disabled,true);assert.match(w.location.hash,/class=smart-manufacturing-2026-autumn/);
 d.querySelector('.dc-sidebar button').click();await wait(()=>d.querySelector('.dc-overview'));[...d.querySelectorAll('.dc-sidebar button')].find(b=>b.textContent==='应用洞察诊断').click();await wait(()=>d.querySelector('.va-empty-roster'));assert.equal(d.querySelector('[aria-label="选择能力分析班级"]').value,'smart-manufacturing-2026-autumn');
 assert.equal(w.localStorage.getItem('ai-course-class-versions-v1'),null);assert.deepEqual(errors,[]);
 }finally{w.close();}
});
test('explicit selected class remains empty instead of silently taking another class scores',async()=>{
 const {dom,d,errors}=open('index.html','decision/insights?class=smart-manufacturing-2026-autumn');try{await wait(()=>d.querySelector('.va-empty-roster'));assert.equal(d.querySelector('[aria-label="选择能力分析班级"]').value,'smart-manufacturing-2026-autumn');assert.match(d.querySelector('.va-metrics').textContent,/未评价/);assert.deepEqual(errors,[]);}finally{dom.window.close();}
});

test('same-page explicit class changes replace the analysis scope',async()=>{
 const {dom,d}=open('index.html','decision/insights?class=plc-2026-autumn-02');try{await wait(()=>d.querySelector('.va-ranking-row'));dom.window.location.hash='decision/insights?class=smart-manufacturing-2026-autumn';await wait(()=>d.querySelector('[aria-label="选择能力分析班级"]').value==='smart-manufacturing-2026-autumn'&&d.querySelector('.va-empty-roster'));assert.match(d.querySelector('.va-metrics').textContent,/未评价/);}finally{dom.window.close();}
});

// Bookmarked URLs from the previous layout must resolve into the existing analysis page.
test('legacy ability URL resolves to integrated teaching insights with screenshot navigation groups',async()=>{
 const {dom,d,errors}=open('index.html','decision/attainment?class=plc-2026-autumn-02');
 try{await wait(()=>d.querySelector('.va-ranking-row')&&dom.window.location.hash==='#decision/insights?class=plc-2026-autumn-02');assert.equal(d.querySelector('.dc-sidebar [aria-current="page"]').textContent,'应用洞察诊断');assert.equal(d.querySelectorAll('.dc-sidebar button').length,11);assert.ok(d.querySelector('.dc-insight-question-panel'));assert.equal(dom.window.location.hash,'#decision/insights?class=plc-2026-autumn-02');assert.deepEqual(errors,[]);}finally{dom.window.close();}
});
