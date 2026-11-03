import test from 'node:test';
import assert from 'node:assert/strict';
import * as layout from '../src/knowledge-layout.ts';
import {nodes} from '../src/course-data.ts';

const graph=[
 {id:'root',name:'课程',parentId:null,x:0,y:0},
 {id:'a',name:'章节一',parentId:'root',x:10,y:20},
 {id:'a1',name:'知识点一',parentId:'a',x:30,y:40},
 {id:'a2',name:'知识点二',parentId:'a',x:30,y:60},
 {id:'b',name:'章节二',parentId:'root',x:10,y:80},
];
test('every view preserves node identity, hierarchy and input coordinates',()=>{
 const original=JSON.stringify(graph);
 for(const mode of ['custom','tree','network','ring']){
  const result=layout.layoutKnowledgeNodes(graph,mode,new Set(['root','a']));
  assert.deepEqual(result.map(n=>[n.id,n.parentId,n.name]),graph.map(n=>[n.id,n.parentId,n.name]));
  assert.ok(result.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)));
 }
 assert.equal(JSON.stringify(graph),original);
});
test('tree separates sibling branches and puts descendants after their parents',()=>{
 const result=layout.layoutKnowledgeNodes(graph,'tree',new Set(['root','a']));
 const [root,a,a1,a2,b]=result;
 assert.ok(a.x>root.x&&a1.x>a.x&&a2.x>a.x);
 assert.ok(a1.y<a.y&&a2.y>a.y&&b.y>a2.y);
 assert.ok(a2.y-a1.y>=56);
});
test('ring and network produce distinct geometry and distribute chapters around the root',()=>{
 const network=layout.layoutKnowledgeNodes(graph,'network',new Set(['root','a']));
 const ring=layout.layoutKnowledgeNodes(graph,'ring',new Set(['root','a']));
 assert.notDeepEqual(network.map(n=>[n.x,n.y]),ring.map(n=>[n.x,n.y]));
 for(const result of [network,ring])assert.ok(Math.hypot(result[1].x,result[1].y)>150);
});
test('fully expanded ring keeps every rectangular card separated',()=>{
 const result=layout.layoutKnowledgeNodes(nodes,'ring',new Set(nodes.map(n=>n.id)));
 for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++){
  const a=result[i],b=result[j],width=(a.id==='root'?124:148)/2+(b.id==='root'?124:148)/2;
  assert.ok(Math.abs(a.x-b.x)>=width+12||Math.abs(a.y-b.y)>=54,`${a.id} overlaps ${b.id}`);
 }
});
