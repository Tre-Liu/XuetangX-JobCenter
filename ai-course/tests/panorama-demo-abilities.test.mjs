import test from 'node:test';
import assert from 'node:assert/strict';
import {withPanoramaDemoAbilities} from '../src/course-map/demo-abilities.mjs';
import {traceCourseChain} from '../src/course-map/model.mjs';

test('view-only ability additions preserve saved nodes and edges and vary direct knowledge links',()=>{
 const nodes=[{id:'course',kind:'course',title:'课程'},{id:'role',kind:'role',title:'文化研究助理'},{id:'work',kind:'workTask',title:'专题资料检索'},{id:'project',kind:'project',title:'项目'},{id:'activity',kind:'activity',title:'任务'},...Array.from({length:6},(_,i)=>({id:'k'+i,kind:'knowledge',title:'知识'+i}))];
 const pairs=[['role','work'],['work','project'],['course','project'],['project','activity'],...Array.from({length:6},(_,i)=>['activity','k'+i])];
 const graph={rootId:'course',nodes,edges:pairs.map(([from,to])=>({id:from+'->'+to,from,to}))},before=structuredClone(graph);
 const result=withPanoramaDemoAbilities(graph);
 assert.deepEqual(graph,before);assert.deepEqual(result.nodes.slice(0,nodes.length),nodes);assert.deepEqual(result.edges.slice(0,graph.edges.length),graph.edges);
 const extras=result.nodes.filter(n=>n.kind==='ability');assert.equal(extras.length,24);
 for(const category of ['知识','技能','素养'])assert.equal(extras.filter(n=>n.description===category).length,8);
 assert.ok(extras.every(n=>n.origin==='simulation'&&n.review==='模拟数据'));
 const linked=new Set(result.edges.filter(e=>e.to.startsWith('k')&&e.origin==='simulation').map(e=>e.from));assert.equal(linked.size,15);
 const focus=traceCourseChain(result,'k0');const lit=extras.filter(n=>focus.nodeIds.has(n.id));assert.ok(lit.length>0&&lit.length<extras.length);
 assert.deepEqual(withPanoramaDemoAbilities({rootId:'course',nodes:[nodes[0]],edges:[]}).nodes,[nodes[0]]);
});

test('a selected knowledge point displays abilities from every associated role, grouped by role and task',async()=>{
 const {layoutCoursePanorama}=await import('../src/course-map/layout.mjs');
 const nodes=[{id:'course',kind:'course',title:'课程'},{id:'k',kind:'knowledge',title:'共享知识'},...['one','two','other'].flatMap(id=>[{id,kind:'role',title:id+'岗位'},{id:id+'task',kind:'workTask',title:id+'工作任务'},{id:id+'ability',kind:'ability',title:id+'能力'}])];
 const pairs=['one','two','other'].flatMap(id=>[[id,id+'task'],[id+'task',id+'ability']]);pairs.push(['oneability','k'],['twoability','k']);
 const graph={rootId:'course',nodes,edges:pairs.map(([from,to])=>({id:from+'->'+to,from,to}))};
 const layout=layoutCoursePanorama(graph,{expandedRole:'other',selectedKnowledge:'k'});
 assert.deepEqual(layout.boxes.filter(n=>n.kind==='ability').map(n=>n.id),['oneability','twoability']);
 assert.deepEqual(layout.groups.filter(n=>n.kind==='ability-role').map(n=>n.title),['one岗位','two岗位']);
 const tasks=layout.groups.filter(n=>n.kind==='ability');assert.equal(tasks.length,2);assert.ok(tasks[0].y+tasks[0].h<tasks[1].y);
 const manual=layoutCoursePanorama(graph,{expandedRole:'other'});assert.deepEqual(manual.boxes.filter(n=>n.kind==='ability').map(n=>n.id),['otherability']);
 assert.equal(layoutCoursePanorama(graph).boxes.filter(n=>n.kind==='ability').length,0);
});
