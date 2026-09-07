import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCourseMap,courseConnectedGraph} from '../src/course-map/model.mjs';
import {catalog,sampleContext,generateProject,defaultDesign} from '../src/generation/model.mjs';
const course={id:'current-course',title:'智能制造岗位项目课程'};
const project=()=>generateProject({context:sampleContext,role:catalog[0],task:catalog[0].tasks[0],abilities:catalog[0].tasks[0].abilities,design:defaultDesign(catalog[0],catalog[0].tasks[0]),confirmed:true});
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
