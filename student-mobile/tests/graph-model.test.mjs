import test from 'node:test';
import assert from 'node:assert/strict';
import { childCount, visibleNodes, readPositions, moveNode } from '../src/graph-model.ts';
const graph = [{id:'root',parentId:null,x:0,y:0},{id:'a',parentId:'root',x:10,y:10},{id:'b',parentId:'a',x:20,y:20}];
test('数字按直接下级计算，与资源数无关，叶子为零',()=>{assert.equal(childCount(graph,'root'),1);assert.equal(childCount(graph,'a'),1);assert.equal(childCount(graph,'b'),0)});
test('折叠父节点隐藏整个分支，展开恢复',()=>{assert.deepEqual(visibleNodes(graph,new Set(['root'])).map(n=>n.id),['root','a']);assert.equal(visibleNodes(graph,new Set(['root','a'])).length,3)});
test('移动只改变目标节点，按缩放转换位移',()=>{const original={a:{x:10,y:20}};const moved=moveNode(original,'a',{x:10,y:20},40,-20,2);assert.deepEqual(moved.a,{x:30,y:10});assert.deepEqual(original.a,{x:10,y:20})});
test('读取布局剔除非法坐标与未知节点，损坏缓存回退',()=>{assert.deepEqual(readPositions('{bad',graph),{});assert.deepEqual(readPositions('{"a":{"x":5,"y":6},"b":{"x":"x","y":2},"alien":{"x":0,"y":0}}',graph),{a:{x:5,y:6}})});
