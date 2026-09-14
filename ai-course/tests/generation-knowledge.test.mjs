import test from 'node:test';
import assert from 'node:assert/strict';
import { applyKnowledgeMatches, suggestKnowledgeMatches, migrateGeneratedKnowledgeLimit } from '../src/generation/knowledge-matching.mjs';
const graph={nodes:[{id:'root',level:1,name:'课程'},{id:'a',level:2,name:'制造基础'},{id:'b',level:3,name:'传感器'}]};
const project={stages:[{id:'s',tasks:[{id:'t1',contents:[{id:'old',abilityId:'ability',title:'能力目标'}],learningActivity:{abilityIds:['ability']}},{id:'t2',contents:[]}]}]};
test('confirmed matches use graph IDs per task and preserve ability metadata',()=>{
 const result=applyKnowledgeMatches(project,{'t1':['a','a','root','missing'],'t2':['b']},graph,[],true);
 assert.deepEqual(result.stages[0].tasks.map(t=>t.contents.map(c=>c.knowledgeNodeId)),[['a'],['b']]);
 assert.deepEqual(result.stages[0].tasks[0].learningActivity.abilityIds,['ability']);
 assert.equal(project.stages[0].tasks[0].contents[0].id,'old');
});
test('skip and unavailable graph create no knowledge content',()=>{
 for(const enabled of [false])assert.ok(applyKnowledgeMatches(project,{t1:['a']},graph,[],enabled).stages[0].tasks.every(t=>t.contents.length===0));
 assert.ok(applyKnowledgeMatches(project,{},graph,[],true).stages[0].tasks.every(t=>t.contents.length===0));
});

test('every task receives available defaults, selecting all eligible graph nodes',()=>{
 const nodes={nodes:[...graph.nodes,{id:'c',level:4,name:'设备操作'},{id:'d',level:4,name:'质量检查'}]};
 const tasks={stages:[{tasks:[{id:'first',title:'完成质量检查',contents:[]},{id:'second',title:'制定计划',contents:[]}]}]};
 const selected=suggestKnowledgeMatches(tasks,nodes);
 assert.deepEqual(selected.first,['d','a','b','c']);
 assert.deepEqual(selected.second,['a','b','c','d']);
 assert.deepEqual(suggestKnowledgeMatches(project,graph),{t1:['a','b'],t2:['a','b']});
 assert.deepEqual(suggestKnowledgeMatches(project,{nodes:[graph.nodes[0]]}),{t1:[],t2:[]});
});

import {jobTaskDemos,withJobTaskDemos} from '../src/generation/job-task-demos.mjs';
test('cultural job examples replace numeric placeholders and retain meaningful authored tasks',()=>{
 const names=['文化研究助理','文博讲解员','文化项目策划','文献整理专员','展览策划助理','文化遗产保护助理'];
 const all=[];
 for(const [i,name] of names.entries()){
  const job={id:`major-job:010101:${i+1}`,name};
  const demos=jobTaskDemos(job);assert.equal(demos.length,3);
  assert.ok(demos.every(t=>t.abilities.length===9&&t.origin==='simulation'));
  all.push(...demos.flatMap(t=>[t.id,...t.abilities.map(a=>a.id)]));
  const authored={id:'authored',title:'教师补充的专题调查',abilities:[]};
  const saved={tasks:[{id:'old',title:'444',abilities:[]},authored]};
  const result=withJobTaskDemos(job,'010101',saved);
  assert.equal(result.tasks.length,4);assert.ok(result.tasks.includes(authored));
  assert.ok(!result.tasks.some(t=>t.title==='444'));assert.equal(saved.tasks.length,2);
  assert.deepEqual(withJobTaskDemos(job,'010101',result),result);
 }
 assert.equal(new Set(all).size,all.length);
});

test('saved generated projects migrate to ten knowledge links once and retain authored content',()=>{
 const contents=Array.from({length:120},(_,i)=>({id:`c${i}`,source:'knowledge',knowledgeNodeId:`n${i}`}));
 const resource={id:'resource',source:'unit',resourceId:'r'};
 const original={learningDesign:{abilities:[{id:'ability'}]},stages:[{tasks:[{id:'t',description:'教师修改的任务说明',contents:[...contents,resource]}]}]};
 const migrated=migrateGeneratedKnowledgeLimit(original);
 assert.equal(migrated.stages[0].tasks[0].contents.length,11);
 assert.deepEqual(migrated.stages[0].tasks[0].contents.slice(0,10),contents.slice(0,10));
 assert.equal(migrated.stages[0].tasks[0].contents.at(-1),resource);
 assert.equal(migrated.stages[0].tasks[0].description,'教师修改的任务说明');
 assert.equal(migrated.learningDesign,original.learningDesign);
 assert.equal(original.stages[0].tasks[0].contents.length,121);
 assert.equal(migrateGeneratedKnowledgeLimit(migrated),migrated);
 const manual={stages:original.stages};assert.equal(migrateGeneratedKnowledgeLimit(manual),manual);
});
