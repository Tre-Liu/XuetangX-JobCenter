import test from 'node:test';
import assert from 'node:assert/strict';
import { knowledgeJobRelations, removeKnowledgeJobRelation } from '../src/knowledge/job-relations.mjs';

const fixture=()=>({
 graph:{nodes:[{id:'k1',name:'知识一'},{id:'k2',name:'知识二'}],links:[]},
 projects:[{id:'p1',title:'项目一',learningDesign:{role:{id:'r1',name:'设备调试员'},sourceTask:{id:'w1',title:'工作站调试'},abilities:[{id:'a1',title:'检查接线',category:'技能'},{id:'a2',title:'故障诊断',category:'知识'}]},stages:[{id:'s1',title:'实施',tasks:[
  {id:'t1',title:'检查任务',learningActivity:{abilityIds:['a1','a1']},contents:[{knowledgeNodeId:'k1'},{knowledgeNodeId:'k1'}]},
  {id:'t2',title:'诊断任务',learningActivity:{abilityIds:['a2']},contents:[{knowledgeNodeId:'k2'}]}
 ]}]}]
});
test('matches only exact knowledge and abilities in the same saved project task',()=>{
 const {graph,projects}=fixture(),rows=knowledgeJobRelations(graph,projects,'k1');
 assert.equal(rows.length,1);assert.equal(rows[0].role.name,'设备调试员');
 assert.equal(rows[0].workTask.title,'工作站调试');assert.equal(rows[0].ability.id,'a1');
 assert.deepEqual(rows[0].sources.map(s=>s.taskId),['t1']);
 assert.deepEqual(knowledgeJobRelations(graph,projects,'missing'),[]);
 projects[0].stages[0].tasks[0].contents=[];
 assert.deepEqual(knowledgeJobRelations(graph,projects,'k1'),[]);
});
test('deduplicates identical relationships while retaining all source tasks',()=>{
 const {graph,projects}=fixture();projects.push({...structuredClone(projects[0]),id:'p2',title:'项目二'});
 const rows=knowledgeJobRelations(graph,projects,'k1');assert.equal(rows.length,1);
 assert.deepEqual(rows[0].sources.map(s=>s.projectId),['p1','p2']);
});
test('deletion survives serialization and renames without deleting task knowledge or other relations',()=>{
 const {graph,projects}=fixture(),before=JSON.stringify(projects),row=knowledgeJobRelations(graph,projects,'k1')[0];
 const next=JSON.parse(JSON.stringify(removeKnowledgeJobRelation(graph,row.id)));
 assert.deepEqual(knowledgeJobRelations(next,projects,'k1'),[]);
 assert.equal(knowledgeJobRelations(next,projects,'k2').length,1);
 projects[0].learningDesign.abilities[0].title='改名';next.nodes[0].name='改名知识';
 assert.deepEqual(knowledgeJobRelations(next,projects,'k1'),[]);
 assert.equal(graph.deletedJobRelationIds,undefined);
 projects[0].learningDesign.abilities[0].title='检查接线';assert.equal(JSON.stringify(projects),before);
});
test('missing role never invents a match; missing ability remains explicitly incomplete',()=>{
 const {graph,projects}=fixture();projects[0].stages[0].tasks[0].learningActivity.abilityIds=[];
 assert.equal(knowledgeJobRelations(graph,projects,'k1')[0].ability,null);
 projects[0].learningDesign.role.name='';assert.deepEqual(knowledgeJobRelations(graph,projects,'k1'),[]);
});

test('offline drawer lists relations, deletes one and keeps it deleted after reload',async()=>{
 const {JSDOM,VirtualConsole}=await import('jsdom'),{readFileSync}=await import('node:fs');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const {graph,projects}=fixture();graph.nodes.forEach(n=>n.level=1);
 const stored=new Map([['ai-course-projects-v1',JSON.stringify(projects)],['ai-course-knowledge-v1',JSON.stringify(graph)]]);
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const mount=()=>new JSDOM(html,{url:new URL('../index.html',import.meta.url).href,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.structuredClone=structuredClone;w.ResizeObserver=class{observe(){}disconnect(){}};
  w.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:text=>({width:String(text).length*7})});
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,String(v))}});
 }});
 let dom=mount();
 const wait=async fn=>{for(let i=0;i<150;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}assert.fail('Knowledge relation UI timed out: '+errors.join(';'));};
 const open=async()=>{
  const d=dom.window.document;await wait(()=>d.querySelector('.nav-item'));
  [...d.querySelectorAll('.nav-item')].find(b=>b.textContent.includes('知识图谱')).click();await wait(()=>d.querySelector('[aria-label="搜索知识点"]'));
  const input=d.querySelector('[aria-label="搜索知识点"]');Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,'知识一');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await wait(()=>d.querySelector('.kg-results button'));d.querySelector('.kg-results button').click();await wait(()=>d.querySelector('.kg-detail'));
  const tab=[...d.querySelectorAll('.kg-detail nav button')].find(b=>b.textContent==='岗位关系');assert.ok(tab);tab.click();await wait(()=>d.querySelector('.kg-job-relations'));
 };
 try{
  await open();const d=dom.window.document;
  assert.equal(d.querySelectorAll('.kg-job-row').length,1);assert.match(d.querySelector('.kg-job-row').textContent,/设备调试员.*工作站调试.*检查接线.*项目一.*检查任务/);
  assert.doesNotMatch(d.querySelector('.kg-job-row').textContent,/故障诊断/);
  const before=stored.get('ai-course-projects-v1');d.querySelector('.kg-job-delete').click();await wait(()=>!d.querySelector('.kg-job-row'));
  assert.match(d.querySelector('.kg-job-relations').textContent,/暂无岗位关系/);assert.equal(stored.get('ai-course-projects-v1'),before);
  dom.window.close();dom=mount();await open();assert.equal(dom.window.document.querySelectorAll('.kg-job-row').length,0);
  assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});

test('default and saved graphs expose ten labeled demo relations without overwriting edits or deletions',async()=>{
 const {createKnowledgeGraph,loadKnowledgeGraph,KNOWLEDGE_STORAGE}=await import('../src/knowledge/model.mjs');
 const graph=createKnowledgeGraph(),names=['产品生命周期管理','产品结构与BOM','机器人轨迹编程','PLC与工业控制','质量预测'];
 for(const name of names){const point=graph.nodes.find(n=>n.name===name),rows=knowledgeJobRelations(graph,[],point.id);assert.equal(rows.length,2,name);assert.ok(rows.every(row=>row.demo));}
 const point=graph.nodes.find(n=>n.name===names[0]);
 const legacy={...graph,nodes:graph.nodes.map(n=>n.id===point.id?{...n,name:'教师修订PLM'}:n)};delete legacy.demoJobProjects;
 const oldStorage=globalThis.localStorage;
 try{
  globalThis.localStorage={getItem:key=>key===KNOWLEDGE_STORAGE?JSON.stringify(legacy):null};
  const loaded=loadKnowledgeGraph();assert.equal(loaded.nodes.find(n=>n.id===point.id).name,'教师修订PLM');
  const rows=knowledgeJobRelations(loaded,[],point.id);assert.equal(rows.length,2);
  const deleted=removeKnowledgeJobRelation(loaded,rows[0].id);
  globalThis.localStorage={getItem:()=>JSON.stringify(deleted)};
  assert.equal(knowledgeJobRelations(loadKnowledgeGraph(),[],point.id).length,1);
 }finally{if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;}
});
