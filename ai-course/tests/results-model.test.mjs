import test from 'node:test';
import assert from 'node:assert/strict';
import {buildResultsModel} from '../src/results/model.mjs';
test('成果统计由当前课程计算，模拟资源口径一致，不修改草稿',()=>{
 const graph={nodes:[{id:'r',name:'课程',level:1},{id:'k',name:'轨迹规划',level:2,parentId:'r'},{id:'k2',name:'运动控制',level:3,parentId:'k'}],links:[]};
 const projects=[{id:'p',title:'机器人装调',stages:[{tasks:[{id:'t',title:'轨迹调试',contents:[{knowledgeNodeId:'k'}],learningActivity:{abilityIds:['a','b']}}]}]}];
 const before=JSON.stringify({graph,projects}); const m=buildResultsModel({graph,projects,resources:[],courseName:'测试课',knowledgeEnabled:true});
 assert.equal(m.knowledge.length,2);assert.equal(m.stats.knowledge,2);assert.equal(m.stats.tasks,1);assert.equal(m.stats.abilities,2);
 assert.equal(m.stats.resources,m.resources.length);assert.equal(m.modules[0].resourceCount,m.resources.length);assert.equal(m.stats.questions,m.questionGroups.reduce((s,g)=>s+g.items.length,0));assert.equal(m.stats.covered,1);assert.equal(m.stats.coverage,50);
 assert.ok(m.resources.every(r=>r.provenance==='模拟教学资源'));assert.equal(JSON.stringify({graph,projects}),before);
 const empty=buildResultsModel({graph,projects,resources:[],courseName:'测试课',knowledgeEnabled:false});assert.equal(empty.stats.knowledge,0);assert.equal(empty.stats.coverage,0);
});
test('教师资源与模拟资源分别保留来源，已删除项目不恢复',()=>{
 const m=buildResultsModel({graph:{nodes:[],links:[]},projects:[],resources:[{id:'real',name:'资料',kind:'图文',provenance:'用户截图'}],courseName:'课程',knowledgeEnabled:true});
 assert.equal(m.projects.length,0);assert.equal(m.resources.length,1);assert.equal(m.resources[0].provenance,'用户截图');assert.equal(m.stats.tasks,0);
});
