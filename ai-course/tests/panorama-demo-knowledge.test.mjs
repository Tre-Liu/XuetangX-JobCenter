import test from 'node:test';
import assert from 'node:assert/strict';
import {withPanoramaDemoKnowledge} from '../src/course-map/demo-knowledge.mjs';
import {traceCourseChain} from '../src/course-map/model.mjs';
import {layoutCoursePanorama} from '../src/course-map/layout.mjs';

const fixture=()=>({rootId:'course',nodes:[
 {id:'course',kind:'course',title:'电气控制与PLC'},
 {id:'p',kind:'project',title:'输送线控制'}, {id:'a',kind:'activity',title:'编写启停互锁与报警程序'},
 {id:'other',kind:'project',title:'网页开发'}, {id:'web',kind:'activity',title:'设计页面组件'},
 {id:'saved',kind:'knowledge',title:'PLC扫描周期'}
],edges:[{id:'cp',from:'course',to:'p'},{id:'pa',from:'p',to:'a'},{id:'co',from:'course',to:'other'},{id:'ow',from:'other',to:'web'},{id:'ak',from:'a',to:'saved'}]});

test('PLC panorama has at least 120 unique knowledge dots without modifying saved data',()=>{
 const graph=fixture(),before=structuredClone(graph),result=withPanoramaDemoKnowledge(graph);
 assert.deepEqual(graph,before);
 const points=result.nodes.filter(n=>n.kind==='knowledge');
 assert.ok(points.length>=120);assert.equal(new Set(points.map(n=>n.title)).size,points.length);
 assert.equal(result.nodes.find(n=>n.title==='PLC扫描周期').id,'saved');
 assert.ok(points.filter(n=>n.id!=='saved').every(n=>n.origin==='simulation'&&n.source&&n.review==='待业务复核'));
 assert.deepEqual(withPanoramaDemoKnowledge(result),result);
 assert.ok(layoutCoursePanorama(result).boxes.filter(n=>n.kind==='knowledge').every(n=>n.point));
 const selected=points.find(n=>n.title==='启停自保持逻辑');
 const focus=traceCourseChain(result,selected.id);
 assert.ok(focus.nodeIds.has('a')&&focus.nodeIds.has('p'));assert.ok(!focus.nodeIds.has('web')&&!focus.nodeIds.has('other'));
 assert.ok(!result.edges.some(e=>e.origin==='simulation'&&e.from==='web'));
});

test('knowledge availability and unrelated or empty courses are respected',()=>{
 const graph=fixture();assert.deepEqual(withPanoramaDemoKnowledge(graph,{enabled:false}),graph);
 graph.nodes[0].title='文化研究';assert.deepEqual(withPanoramaDemoKnowledge(graph),graph);
 assert.deepEqual(withPanoramaDemoKnowledge({rootId:'course',nodes:[{id:'course',kind:'course',title:'电气控制与PLC'}],edges:[]}).nodes.length,1);
});
