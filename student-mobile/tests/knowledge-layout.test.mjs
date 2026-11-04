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
test('tree branches to both sides of the centred root and keeps descendants on their parent side',()=>{
 const result=layout.layoutKnowledgeNodes(graph,'tree',new Set(['root','a']));
 const [root,a,a1,a2,b]=result;
 assert.deepEqual([root.x,root.y],[0,0]);
 assert.ok(a.x>0&&b.x<0);
 assert.ok(a1.x>a.x&&a2.x>a.x);
 assert.ok(a1.y<a.y&&a2.y>a.y);
 assert.ok(a2.y-a1.y>=56);
});
test('ring and network produce distinct geometry and distribute chapters around the root',()=>{
 const network=layout.layoutKnowledgeNodes(graph,'network',new Set(['root','a']));
 const ring=layout.layoutKnowledgeNodes(graph,'ring',new Set(['root','a']));
 assert.notDeepEqual(network.map(n=>[n.x,n.y]),ring.map(n=>[n.x,n.y]));
 for(const result of [network,ring])assert.ok(Math.hypot(result[1].x,result[1].y)>150);
});
test('ring chapter centres follow a circle and expanded descendants continue outwards',()=>{
 const result=layout.layoutKnowledgeNodes(nodes,'ring',new Set(nodes.map(n=>n.id)));
 const chapters=result.filter(n=>n.parentId==='root');
 const radii=chapters.map(n=>Math.hypot(n.x,n.y));
 assert.ok(Math.max(...radii)-Math.min(...radii)<.001);
 for(const n of result.filter(n=>n.parentId&&n.parentId!=='root')){
  const parent=result.find(p=>p.id===n.parentId);
  assert.ok(Math.hypot(n.x,n.y)>Math.hypot(parent.x,parent.y)+100);
 }
});
test('tree and ring distinguish chapter cards from deeper knowledge points',()=>{
 const [root,chapter,point]=graph;
 assert.equal(layout.knowledgeNodeAppearance(root,graph,'tree').shape,'pill');
 assert.equal(layout.knowledgeNodeAppearance(chapter,graph,'tree').shape,'pill');
 assert.equal(layout.knowledgeNodeAppearance(point,graph,'tree').shape,'text');
 assert.equal(layout.knowledgeNodeAppearance(root,graph,'ring').shape,'card');
 assert.equal(layout.knowledgeNodeAppearance(chapter,graph,'ring').shape,'card');
 assert.equal(layout.knowledgeNodeAppearance(point,graph,'ring').shape,'glow');
});
test('fully expanded ring separates chapter cards and point labels',()=>{
 const result=layout.layoutKnowledgeNodes(nodes,'ring',new Set(nodes.map(n=>n.id)));
 const box=n=>!n.parentId?{w:160,h:48}:n.parentId==='root'?{w:200,h:46}:{w:190,h:56};
 for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++){
  const a=result[i],b=result[j],sa=box(a),sb=box(b);
  assert.ok(Math.abs(a.x-b.x)>=(sa.w+sb.w)/2+12||Math.abs(a.y-b.y)>=(sa.h+sb.h)/2+12,`${a.id} overlaps ${b.id}`);
 }
});
