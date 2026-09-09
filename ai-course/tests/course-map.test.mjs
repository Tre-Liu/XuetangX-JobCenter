import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCourseMap,courseConnectedGraph} from '../src/course-map/model.mjs';
import {layoutCourseMap} from '../src/course-map/layout.mjs';
import {catalog,sampleContext,generateProject,defaultDesign} from '../src/generation/model.mjs';
const course={id:'current-course',title:'智能制造岗位项目课程'};
const project=()=>generateProject({context:sampleContext,role:catalog[0],task:catalog[0].tasks[0],abilities:catalog[0].tasks[0].abilities,design:defaultDesign(catalog[0],catalog[0].tasks[0]),confirmed:true});
const associationFixture=()=>({id:'p',title:'关联项目',learningDesign:{sourceTask:{id:'work',title:'岗位任务'},abilities:[{id:'a',title:'操作能力',category:'技能'},{id:'b',title:'检查能力',category:'技能'}]},stages:[{title:'实施',tasks:[
 {id:'t1',title:'操作任务',learningActivity:{abilityIds:['a']},contents:[{knowledgeNodeId:'k1'},{knowledgeNodeId:'deleted'}]},
 {id:'t2',title:'检查任务',contents:[{abilityId:'b'},{knowledgeNodeId:'k2'}]},
 {id:'t3',title:'独立知识任务',contents:[{knowledgeNodeId:'k3'}]}
]}]});
const associationKnowledge={nodes:[{id:'k1',name:'操作知识'},{id:'k2',name:'检查知识'},{id:'k3',name:'独立知识'},{id:'unused',name:'未关联知识'}]};
test('occupational abilities belong below the work task and connect only to knowledge saved on their learning activities',()=>{
 const p=associationFixture(),before=structuredClone(p),graph=buildCourseMap({course,projects:[p],knowledge:associationKnowledge});
 const node=title=>graph.nodes.find(n=>n.title===title),has=(a,b)=>graph.edges.some(e=>e.from===node(a)?.id&&e.to===node(b)?.id);
 assert.ok(has('岗位任务','操作能力'),'work task owns its abilities');
 assert.ok(has('岗位任务','检查能力'));
 assert.ok(has('操作任务','操作知识'));
 assert.ok(has('操作能力','操作知识'),'ability-to-knowledge relation is derived from the same activity');
 assert.ok(has('检查能力','检查知识'),'legacy content ability IDs also map knowledge');
 assert.ok(!has('操作能力','检查知识'));assert.ok(!has('检查能力','独立知识'));
 assert.equal(graph.nodes.filter(n=>n.kind==='knowledge').length,3);
 const layout=layoutCourseMap(graph),work=layout.boxes.find(n=>n.kind==='workTask');
 for(const ability of layout.boxes.filter(n=>n.kind==='ability')){assert.equal(ability.x,work.x);assert.ok(ability.y>work.y+work.h);}
 const activity=layout.boxes.find(n=>n.kind==='activity');
 assert.ok(layout.boxes.filter(n=>n.kind==='knowledge').every(n=>n.x>activity.x));
 assert.deepEqual(p,before);
 assert.equal(buildCourseMap({course,projects:[p],knowledge:associationKnowledge,knowledgeEnabled:false}).nodes.filter(n=>n.kind==='knowledge').length,0);
});
test('shared abilities do not illuminate knowledge from sibling tasks or projects',async()=>{
 const {traceCourseChain}=await import('../src/course-map/model.mjs');
 const p=associationFixture();p.stages[0].tasks[1].learningActivity={abilityIds:['a']};
 const other=structuredClone(p);other.id='other';other.title='其他项目';other.learningDesign.sourceTask={id:'other-work',title:'其他岗位任务'};other.stages[0].tasks=[{id:'t4',title:'其他项目任务',learningActivity:{abilityIds:['a']},contents:[{knowledgeNodeId:'k4'}]}];
 const graph=buildCourseMap({course,projects:[p,other],knowledge:{nodes:[...associationKnowledge.nodes,{id:'k4',name:'其他项目知识'}]}});
 const focused=title=>{const result=traceCourseChain(graph,graph.nodes.find(n=>n.title===title).id);return graph.nodes.filter(n=>result.nodeIds.has(n.id)).map(n=>n.title);};
 assert.ok(focused('操作任务').includes('操作知识'));
 for(const title of ['检查知识','其他项目知识','检查任务','其他项目'])assert.ok(!focused('操作任务').includes(title),title);
 assert.ok(focused('岗位任务').includes('检查知识'));assert.ok(!focused('岗位任务').includes('其他项目知识'));
 for(const title of ['操作知识','检查知识','其他项目知识','关联项目','其他项目'])assert.ok(focused('操作能力').includes(title),title);
 for(const title of ['岗位任务','操作能力','操作任务','关联项目',course.title])assert.ok(focused('操作知识').includes(title),title);
 assert.ok(!focused('操作知识').includes('其他项目'),'knowledge focus must respect the activity that establishes its ability relation');
});
test('course map includes only available dimensions and explicit knowledge associations',()=>{
 const p=project();p.stages[0].tasks[0].contents.push({id:'c',knowledgeNodeId:'linked'});
 const before=structuredClone(p);
 const graph=buildCourseMap({course,projects:[p],knowledge:{nodes:[{id:'linked',name:'已关联知识点'},{id:'unrelated',name:'无关知识点'}]}});
 for(const kind of ['course','project','major','chain','segment','role','workTask','activity','ability','knowledge'])assert.ok(graph.nodes.some(n=>n.kind===kind),kind);
 for(const kind of ['trainingGoal','graduationRequirement','courseGoal'])assert.ok(!graph.nodes.some(n=>n.kind===kind));
 assert.ok(!graph.nodes.some(n=>n.title==='无关知识点'));
 assert.ok(graph.nodes.some(n=>n.review?.includes('复核')));
 assert.equal(graph.nodes.filter(n=>n.kind==='ability').length,6);
 const ids=new Set(graph.nodes.map(n=>n.id));assert.equal(ids.size,graph.nodes.length);
 assert.ok(graph.edges.every(e=>ids.has(e.from)&&ids.has(e.to)));
 assert.deepEqual(p,before);
 assert.ok(!buildCourseMap({course,projects:[p],knowledge:{nodes:[{id:'linked',name:'已关联知识点'}]},knowledgeEnabled:false}).nodes.some(n=>n.kind==='knowledge'));
});
test('missing data hides whole dimensions without placeholders, goals or fabricated chain mappings',()=>{
 const p={id:'plain',title:'设备实训',stages:[]};
 assert.deepEqual(buildCourseMap({course,projects:[p]}).nodes.map(n=>n.kind),['course','project']);
 const generated=project();generated.learningDesign.role={id:'custom',name:'教师岗位',origin:'generated-draft'};
 assert.ok(!buildCourseMap({course,projects:[generated]}).nodes.some(n=>['chain','segment'].includes(n.kind)));
 generated.learningDesign.role.industryRelations=[{chain_id:'partial',chain_name:'仅有产业链'}];
 const partial=buildCourseMap({course,projects:[generated]});assert.ok(partial.nodes.some(n=>n.kind==='chain'));assert.ok(!partial.nodes.some(n=>n.kind==='segment'));
});
test('course boundary excludes foreign projects, and traversal removes disconnected nodes and dangling edges',()=>{
 const a=project(),b=project();b.courseId='another-course';
 const graph=buildCourseMap({course,projects:[a,b]});assert.equal(graph.nodes.filter(n=>n.kind==='project').length,1);
 const root=graph.rootId;
 const filtered=courseConnectedGraph({rootId:root,nodes:[...graph.nodes,{id:'unrelated-major',kind:'major'}],edges:[...graph.edges,{from:'unrelated-major',to:'missing'}]});
 assert.ok(!filtered.nodes.some(n=>n.id==='unrelated-major'));
 assert.ok(!filtered.edges.some(e=>e.to==='missing'));
 const second=structuredClone(a);second.id='second';
 const shared=buildCourseMap({course,projects:[a,second]});assert.equal(shared.nodes.filter(n=>n.kind==='role').length,1);assert.equal(shared.nodes.filter(n=>n.kind==='chain').length,1);
});

const focusFixture=()=>{
 const kinds={major:'major',course:'course',chainA:'chain',segmentA:'segment',roleA:'role',workA:'workTask',projectA:'project',taskA:'activity',siblingA:'activity',shared:'ability',pointA:'knowledge',chainB:'chain',roleB:'role',workB:'workTask',projectB:'project',taskB:'activity'};
 const pairs=[['major','course'],['course','projectA'],['course','projectB'],['chainA','segmentA'],['segmentA','roleA'],['roleA','workA'],['workA','projectA'],['projectA','taskA'],['projectA','siblingA'],['taskA','shared'],['taskA','pointA'],['projectA','shared'],['chainB','roleB'],['roleB','workB'],['workB','projectB'],['projectB','taskB'],['taskB','shared']];
 return {rootId:'course',nodes:Object.entries(kinds).map(([id,kind])=>({id,kind})),edges:pairs.map(([from,to])=>({id:`${from}->${to}`,from,to}))};
};
test('work-task focus lights the full industry-to-project chain plus course ancestry without lighting sibling projects',async()=>{
 const {traceCourseChain}=await import('../src/course-map/model.mjs');const graph=focusFixture(),before=structuredClone(graph);
 const focus=traceCourseChain(graph,'workA');
 for(const id of ['chainA','segmentA','roleA','workA','projectA','taskA','siblingA','shared','pointA','course','major'])assert.ok(focus.nodeIds.has(id),id);
 for(const id of ['projectB','taskB','chainB','roleB','workB'])assert.ok(!focus.nodeIds.has(id),id);
 for(const id of ['chainA->segmentA','workA->projectA','course->projectA','major->course','taskA->pointA'])assert.ok(focus.edgeIds.has(id),id);
 assert.ok(!focus.edgeIds.has('course->projectB'));assert.deepEqual(graph,before);
});
test('activity focus does not fan out through ancestors or shared downstream abilities; course restores all',async()=>{
 const {traceCourseChain}=await import('../src/course-map/model.mjs');const graph=focusFixture();
 const focus=traceCourseChain(graph,'taskA');
 for(const id of ['taskA','projectA','workA','roleA','segmentA','chainA','course','major','shared','pointA'])assert.ok(focus.nodeIds.has(id),id);
 for(const id of ['siblingA','taskB','projectB'])assert.ok(!focus.nodeIds.has(id),id);
 assert.ok(!focus.edgeIds.has('projectA->shared'),'do not light a shortcut bypassing the selected activity');
 const all=traceCourseChain(graph,'course');assert.equal(all.nodeIds.size,graph.nodes.length);assert.equal(all.edgeIds.size,graph.edges.length);
 assert.deepEqual(traceCourseChain(graph,'removed-node'),all);
 const shared=traceCourseChain(graph,'shared');assert.ok(shared.nodeIds.has('taskB'));assert.ok(shared.nodeIds.has('taskA'));assert.ok(!shared.nodeIds.has('siblingA'));
});
