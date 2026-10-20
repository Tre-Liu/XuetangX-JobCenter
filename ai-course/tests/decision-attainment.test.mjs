import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVersionCatalog,createVersion,parseRoster,calculateAttainment} from '../src/classrooms/versions.mjs';
import {compareClassMeans,comparisonCSV} from '../src/decision/attainment.mjs';
const catalog=buildVersionCatalog();
function version(id,scores){const abilityIds=catalog.abilities.slice(0,5).map(a=>a.id);const v=createVersion({catalog,id,draft:{name:id,versionLabel:'V1',abilityIds,students:parseRoster('学号,姓名\n001,甲\n002,乙').students}});v.records=v.students.flatMap((s,i)=>v.questionIds.map(q=>({id:`${id}-${s.id}-${q}`,studentId:s.id,questionId:q,score:scores[i],maxScore:100,date:'2026-10-12',source:'manual'})));return v;}
test('class comparison aligns IDs, uses class means and produces reproducible differences',()=>{
 const a=version('A',[80,60]),b=version('B',[90,70]);const result=compareClassMeans(a,b,catalog);assert.ok(result.rows.length);for(const row of result.rows){assert.equal(row.current,70);assert.equal(row.reference,80);assert.equal(row.difference,-10);assert.equal(row.status,'可比');}
 const sub=compareClassMeans(a,b,catalog,{level:'abilities',moduleId:catalog.abilities[0].moduleId});assert.equal(sub.rows.length,5);assert.ok(sub.rows.every(r=>r.difference===-10));
});
test('missing scores and unconfigured dimensions stay missing instead of zero',()=>{
 const a=version('A',[80,60]),b=version('B',[90,70]);b.records=[];
 assert.ok(compareClassMeans(a,b,catalog).rows.every(r=>r.reference===null&&r.difference===null&&r.status==='未评价'));
 b.abilityIds=[];const result=compareClassMeans(a,b,catalog,{level:'abilities'});assert.ok(result.rows.every(r=>r.reference===null&&r.status==='未配置'));assert.equal(calculateAttainment(a,catalog).overall,70);
});
test('different question scope or missing rules disables arithmetic comparison',()=>{
 const a=version('A',[80,60]),b=version('B',[90,70]);const before=JSON.stringify(a);b.questionIds=b.questionIds.slice(1);
 const result=compareClassMeans(a,b,catalog,{level:'abilities'});assert.ok(result.rows.some(r=>r.status==='口径不同'&&r.difference===null));assert.equal(JSON.stringify(a),before);
 b.rules.missing='zero';assert.ok(compareClassMeans(a,b,catalog).rows.every(r=>r.status==='口径不同'));
});
test('comparison CSV retains both class identities, source, counts, rules and missing state',()=>{
 const a=version('=A',[80,60]),b=version('B',[90,70]);const csv=comparisonCSV(compareClassMeans(a,b,catalog));assert.ok(csv.startsWith('\uFEFF'));for(const label of ['来源','能力ID','当前班级','对比班级','已评价学生','缺失规则','可比'])assert.ok(csv.includes(label),label);assert.ok(csv.includes("'=A"));
});
