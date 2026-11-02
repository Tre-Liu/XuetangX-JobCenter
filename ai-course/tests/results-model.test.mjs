import test from 'node:test';
import assert from 'node:assert/strict';
import {buildResultsModel} from '../src/results/model.mjs';
test('课岗指标按同一任务的明确关联计算，去重且不跨任务、课程或岗位补齐',async()=>{
 const {buildCourseJobMetrics}=await import('../src/results/model.mjs');
 assert.equal(typeof buildCourseJobMetrics,'function','应提供已保存课岗关联的统计');
 const knowledge={nodes:[{id:'root',level:1},{id:'k1',level:2},{id:'k2',level:3},{id:'k3',level:4},{id:'k1',level:2}]};
 const design={role:{id:'r1',name:'电气装调'},abilities:[{id:'a1',title:'识图'},{id:'a2',title:'接线'}]};
 const project={id:'p1',learningDesign:design,stages:[{tasks:[
  {id:'t1',learningActivity:{abilityIds:['a1','a1','missing']},contents:[{knowledgeNodeId:'k1'},{knowledgeNodeId:'k1'},{knowledgeNodeId:'removed'},{knowledgeNodeId:'root'}]},
  {id:'t2',learningActivity:{abilityIds:['a2']},contents:[]},
  {id:'t3',contents:[{knowledgeNodeId:'k2'}]},
  {id:'t4',contents:[{abilityId:'a1'},{knowledgeNodeId:'k1'}]}
 ]}]};
 const orphan={...project,id:'orphan',learningDesign:{...design,role:null},stages:[{tasks:[{learningActivity:{abilityIds:['a2']},contents:[{knowledgeNodeId:'k3'}]}]}]};
 const foreign={...orphan,id:'foreign',courseId:'other',learningDesign:design};
 const args={courseId:'current-course',knowledge,projects:[project,orphan,foreign]},before=JSON.stringify(args);
 assert.deepEqual(buildCourseJobMetrics(args),{knowledgeTotal:3,knowledgeMatched:1,knowledgeRate:33.3,abilityTotal:2,abilityMatched:1,abilityRate:50,roles:1,relations:1});
 assert.equal(JSON.stringify(args),before);
 const appended=structuredClone(project);appended.stages.push({learningDesign:{role:{id:'r2',name:'设备维护'},abilities:[{id:'a1',title:'识图'}]},tasks:[{contents:[{abilityId:'a1'},{knowledgeNodeId:'k2'}]}]});
 assert.deepEqual(buildCourseJobMetrics({...args,projects:[appended]}),{knowledgeTotal:3,knowledgeMatched:2,knowledgeRate:66.7,abilityTotal:3,abilityMatched:2,abilityRate:66.7,roles:2,relations:2});
 assert.deepEqual(buildCourseJobMetrics({...args,knowledgeEnabled:false}),{knowledgeTotal:0,knowledgeMatched:0,knowledgeRate:null,abilityTotal:2,abilityMatched:0,abilityRate:null,roles:1,relations:0});
 assert.deepEqual(buildCourseJobMetrics({knowledge:{nodes:[]},projects:[]}),{knowledgeTotal:0,knowledgeMatched:0,knowledgeRate:null,abilityTotal:0,abilityMatched:0,abilityRate:null,roles:0,relations:0});
});
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
