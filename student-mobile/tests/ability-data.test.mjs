import test from 'node:test';
import assert from 'node:assert/strict';
import { abilities, flattenAbilities, abilityCounts, abilityPath } from '../src/ability-data.ts';
test('截图中的核心节点恰好为2个知识点与9个视频，分组7+2',()=>{const a=flattenAbilities().find(a=>a.id==='model');assert.deepEqual(abilityCounts(a),{knowledge:2,units:9});assert.deepEqual(a.groups.map(g=>g.units.length),[7,2])});
test('上级聚合4个知识点11个单元，空节点不制造资源',()=>{assert.deepEqual(abilityCounts(abilities[0]),{knowledge:4,units:11});assert.deepEqual(abilityCounts(flattenAbilities().find(a=>a.id==='switching')),{knowledge:0,units:0})});
test('节点ID唯一，搜索路径能还原完整层级',()=>{const all=flattenAbilities();assert.equal(new Set(all.map(a=>a.id)).size,all.length);assert.deepEqual(abilityPath('model').map(a=>a.id),['linear','basics','model']);assert.deepEqual(abilityPath('missing'),[])});
