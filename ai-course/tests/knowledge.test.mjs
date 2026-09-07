import test from 'node:test';
import assert from 'node:assert/strict';
import { createKnowledgeGraph, graphStats, descendants, updateKnowledgeNode } from '../src/knowledge/model.mjs';
test('reuses the original 121-node curriculum with valid hierarchy and relation endpoints',()=>{
 const graph=createKnowledgeGraph();assert.deepEqual(graphStats(graph).levels,[1,8,28,84]);
 assert.equal(graphStats(graph).total,121);
 const ids=new Set(graph.nodes.map(n=>n.id));assert.equal(ids.size,121);
 assert.ok(graph.nodes.every(n=>!n.parentId||ids.has(n.parentId)));
 assert.ok(graph.links.every(l=>ids.has(l.source)&&ids.has(l.target)));
});
test('topic expansion returns its actual three knowledge points',()=>{
 const graph=createKnowledgeGraph();const topic=graph.nodes.find(n=>n.name==='智能制造认知');
 assert.equal(descendants(graph,topic.id).length,3);
 assert.ok(descendants(graph,topic.id).some(n=>n.name==='智能制造系统架构'));
});
test('node edits preserve relationship identifiers and reject blank or duplicate names',()=>{
 const graph=createKnowledgeGraph(), node=graph.nodes.find(n=>n.level===4);const oldLinks=JSON.stringify(graph.links);
 assert.throws(()=>updateKnowledgeNode(graph,node.id,{name:' '}));
 assert.throws(()=>updateKnowledgeNode(graph,node.id,{name:'智能制造'}));
 const next=updateKnowledgeNode(graph,node.id,{name:'更新的知识点',desc:'教学说明'});
 assert.equal(next.nodes.find(n=>n.id===node.id).desc,'教学说明');assert.equal(JSON.stringify(next.links),oldLinks);
 assert.notEqual(graph.nodes.find(n=>n.id===node.id).name,'更新的知识点');
});

test('knowledge associations keep node IDs, include direct resources only and avoid duplicates', async()=>{
 const {associateContents,resolveProjectContents}=await import('../src/resources/model.mjs');
 const graph=createKnowledgeGraph();const module=graph.nodes.find(n=>n.level===2),child=graph.nodes.find(n=>n.parentId===module.id);
 const resources=[{id:'direct',name:'直接学习内容',kind:'图文',knowledgeNodeIds:[module.id]},{id:'child',name:'子节点视频',kind:'视频',knowledgeNodeIds:[child.id]}];
 const original={id:'task',contents:[]};const linked=associateContents(original,'knowledge',[module.id],graph,resources);
 assert.deepEqual(linked.contents.map(c=>c.knowledgeNodeId||c.resourceId),[module.id,'direct']);
 assert.equal(original.contents.length,0);
 assert.equal(associateContents(linked,'knowledge',[module.id],graph,resources).contents.length,2);
 assert.equal(associateContents(linked,'unit',['direct'],graph,resources).contents.length,2);
 const renamed=updateKnowledgeNode(graph,module.id,{name:'修改后的图谱名称'});
 assert.equal(resolveProjectContents({stages:[{tasks:[linked]}]},renamed,resources).stages[0].tasks[0].contents[0].title,'修改后的图谱名称');
});
