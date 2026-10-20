import test from 'node:test';
import assert from 'node:assert/strict';
import {createAbilityModel, filterAbilities, saveAbilityModel, loadAbilityModel, validateAbility} from '../src/ability/model.mjs';

test('course objectives cover three categories and all associations reference explicit catalog IDs',()=>{
 const m=createAbilityModel();assert.equal(m.modules.length,8);assert.equal(m.abilities.length,40);
 assert.deepEqual(new Set(m.abilities.map(a=>a.category)),new Set(['knowledge','skill','quality']));
 for(const a of m.abilities){assert.ok(m.modules.some(x=>x.id===a.moduleId));assert.ok(a.level>=1&&a.level<=5);assert.ok(a.description.length>20);assert.ok(a.evidence.length>10);for(const [field,catalog] of [['jobIds','jobs'],['requirementIds','requirements'],['knowledgeIds','knowledge']]){assert.ok(a[field].length);for(const id of a[field])assert.ok(m[catalog].some(x=>x.id===id),`${a.id}: ${id}`);}}
});
test('search and category filtering intersect and include linked job names',()=>{
 const m=createAbilityModel();const found=filterAbilities(m,{search:'PLC程序设计员',category:'skill'});assert.ok(found.length>0);assert.ok(found.every(a=>a.category==='skill'&&a.jobIds.includes('job-plc')));assert.equal(filterAbilities(m,{search:'不存在的目标'}).length,0);
});
test('saved teacher edits and intentionally empty relations survive reload',()=>{
 const m=createAbilityModel();m.abilities[0]={...m.abilities[0],title:'教师修订的目标',jobIds:[],category:'quality',level:5};const data=new Map();const storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};saveAbilityModel(storage,m);const reloaded=loadAbilityModel(storage);assert.equal(reloaded.abilities[0].title,'教师修订的目标');assert.deepEqual(reloaded.abilities[0].jobIds,[]);assert.equal(reloaded.abilities[0].category,'quality');assert.equal(validateAbility({...reloaded.abilities[0],title:'  '}),'请输入能力目标名称');
});
