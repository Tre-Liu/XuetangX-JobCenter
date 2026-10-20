import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVersionCatalog,loadVersions,calculateAttainment} from '../src/classrooms/versions.mjs';
import {selectDevelopmentAxes,buildStudentProfiles,developmentEvidenceCount} from '../src/decision/development.mjs';
import {decisionRadarOption} from '../src/decision/radar.mjs';
const catalog=buildVersionCatalog();const versions=loadVersions(undefined,catalog);const classroom=versions.find(v=>v.id==='plc-2026-autumn-02');
test('development radar samples twelve stable abilities across modules and retains actual weighted values',()=>{
 const result=calculateAttainment(classroom,catalog);const axes=selectDevelopmentAxes(result);assert.equal(axes.length,12);assert.equal(new Set(axes.map(a=>a.moduleId)).size,6);for(const row of axes)assert.equal(row.value,result.abilities.find(a=>a.id===row.id).value);
 const option=decisionRadarOption(axes,{});assert.equal(option.radar.indicator.length,12);assert.deepEqual(option.series[0].data[0].value,option.radar.indicator.map(a=>axes.find(row=>row.id===a.name).value));assert.match(option.radar.axisName.formatter(axes[0].id),/能力1/);assert.match(option.radar.axisName.formatter(axes[0].id),/%/);
});
test('missing grades remain unevaluated, profile totals and evidence counts use saved assessment records',()=>{
 const empty={...classroom,records:[]};const result=calculateAttainment(empty,catalog);assert.ok(selectDevelopmentAxes(result).every(a=>a.value===null));assert.equal(decisionRadarOption(selectDevelopmentAxes(result),{}).radar.indicator.length,0);
 const profiles=buildStudentProfiles(classroom,catalog);assert.equal(profiles.length,classroom.students.length);profiles.forEach(p=>assert.equal(p.overall,calculateAttainment(classroom,catalog,p.id).overall));assert.equal(developmentEvidenceCount(calculateAttainment(classroom,catalog)),classroom.records.length);
});
test('default sample grades have differentiated ability profiles and saved teacher records are preserved',()=>{
 const values=calculateAttainment(classroom,catalog).modules.map(m=>m.value);assert.ok(Math.max(...values)-Math.min(...values)>8);assert.ok(classroom.students.some(s=>s.name==='李昊'));assert.ok(classroom.records.every(r=>r.score>=0&&r.score<=r.maxScore&&r.source==='teaching-simulation'));
 const storage={getItem:()=>JSON.stringify({schema:1,versions:[{...classroom,records:[]} ]})};assert.deepEqual(loadVersions(storage,catalog)[0].records,[]);
});
