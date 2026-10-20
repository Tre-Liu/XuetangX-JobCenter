import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
import {ABILITY_KEY} from '../src/ability/model.mjs';
for(const entry of ['index.html','offline.html'])test(`${entry}: ability search, tags, difficulty and associations persist without altering project data`,async()=>{
 const html=fs.readFileSync(new URL(`../${entry}`,import.meta.url),'utf8');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/#ability',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});}});const w=dom.window,d=w.document;
 const wait=async(fn)=>{for(let i=0;i<150;i++){if(fn())return;await new Promise(r=>setTimeout(r,15));}assert.fail('ability UI state not reached');};
 const button=text=>[...d.querySelectorAll('button')].find(x=>x.textContent.trim()===text);
 const input=(label,value)=>{const el=d.querySelector(`[aria-label="${label}"]`);const proto=el.tagName==='TEXTAREA'?w.HTMLTextAreaElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 try{
 await wait(()=>d.querySelector('[data-ability-id]'));const projects=w.localStorage.getItem('ai-course-projects-v1');assert.match(d.querySelector('.ag-summary').textContent,/8能力模块40能力目标24关联知识点5关联岗位/);
 input('搜索能力目标','不存在');await wait(()=>d.querySelector('.ag-no-results'));button('重置筛选').click();await wait(()=>d.querySelector('[data-ability-id="ab-electrical-3"]'));
 d.querySelector('[data-ability-id="ab-electrical-3"]').click();await wait(()=>button('编辑目标'));button('编辑目标').click();await wait(()=>d.querySelector('[aria-label="能力目标名称"]'));
 input('能力目标名称','  ');button('保存修改').click();await wait(()=>d.querySelector('[role="alert"]'));assert.match(d.querySelector('[role="alert"]').textContent,/请输入能力目标名称/);
 input('能力目标名称','教师修订控制电路目标');input('新增目标标签','综合实训');await wait(()=>!d.querySelector('[aria-label="添加标签"]').disabled);d.querySelector('[aria-label="添加标签"]').click();d.querySelector('[aria-label="L5 综合"]').click();button('素养能力目标').click();
 await wait(()=>d.querySelector('.ag-category-options .selected.quality'));
 const pickers=d.querySelectorAll('.ag-relation-picker');for(const picker of pickers)for(const box of picker.querySelectorAll('input[type="checkbox"]'))if(box.checked)box.click();
 await wait(()=>[...d.querySelectorAll('.ag-relation-picker h4')].every(x=>x.textContent.includes('已选 0')));button('保存修改').click();await wait(()=>button('编辑目标'));
 const saved=JSON.parse(w.localStorage.getItem(ABILITY_KEY));const a=saved.abilities.find(x=>x.id==='ab-electrical-3');assert.equal(a.title,'教师修订控制电路目标');assert.equal(a.level,5);assert.equal(a.category,'quality');assert.ok(a.tags.includes('综合实训'));for(const k of ['jobIds','requirementIds','knowledgeIds'])assert.deepEqual(a[k],[]);assert.equal(w.localStorage.getItem('ai-course-projects-v1'),projects);
 d.querySelector('[aria-label="关闭能力详情"]').click();await wait(()=>!d.querySelector('.ag-detail'));button('列表').click();await wait(()=>d.querySelector('.ag-table'));assert.equal(d.querySelectorAll('.ag-table tbody tr').length,40);
 d.querySelector('.ag-filters button:last-child').click();await wait(()=>d.querySelectorAll('.ag-table tbody tr').length===9);
 assert.deepEqual(errors,[]);
 const reloaded=new JSDOM(html,{url:'http://localhost/#ability',runScripts:'dangerously',virtualConsole:vc,beforeParse(r){r.structuredClone=structuredClone;r.matchMedia=()=>({matches:false});r.localStorage.setItem(ABILITY_KEY,JSON.stringify(saved));}});
 try{for(let i=0;i<150&&!reloaded.window.document.querySelector('[data-ability-id="ab-electrical-3"]');i++)await new Promise(r=>setTimeout(r,15));assert.match(reloaded.window.document.querySelector('[data-ability-id="ab-electrical-3"]').textContent,/教师修订控制电路目标/);assert.deepEqual(errors,[]);}finally{reloaded.window.close();}
 }finally{w.close();}
});
