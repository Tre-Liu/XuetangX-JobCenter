import test from 'node:test';
import assert from 'node:assert/strict';
import { applyKnowledgeMatches, suggestKnowledgeMatches } from '../src/generation/knowledge-matching.mjs';
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

test('every task receives available defaults, prioritizing exact matches and limiting to three',()=>{
 const nodes={nodes:[...graph.nodes,{id:'c',level:4,name:'设备操作'},{id:'d',level:4,name:'质量检查'}]};
 const tasks={stages:[{tasks:[{id:'first',title:'完成质量检查',contents:[]},{id:'second',title:'制定计划',contents:[]}]}]};
 const selected=suggestKnowledgeMatches(tasks,nodes);
 assert.deepEqual(selected.first,['d','a','b']);
 assert.deepEqual(selected.second,['a','b','c']);
 assert.deepEqual(suggestKnowledgeMatches(project,graph),{t1:['a','b'],t2:['a','b']});
 assert.deepEqual(suggestKnowledgeMatches(project,{nodes:[graph.nodes[0]]}),{t1:[],t2:[]});
});
