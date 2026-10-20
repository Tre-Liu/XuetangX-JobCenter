import test from 'node:test';
import assert from 'node:assert/strict';
import {createDecisionData,filterSessions,summarizeSessions,buildInsight,toCSV} from '../src/decision/model.mjs';
const data=createDecisionData();
test('decision totals reconcile across applications, trend, questions and unique roster',()=>{
 const s=summarizeSessions(data.sessions,data.classes);
 assert.equal(s.uses,s.applications.reduce((n,a)=>n+a.value,0));
 assert.equal(s.uses,s.trend.reduce((n,d)=>n+d.uses,0));
 assert.equal(s.uses,data.sessions.reduce((n,r)=>n+r.turns.length,0));
 assert.equal(s.users,new Set(data.sessions.map(r=>r.userId)).size);
 assert.ok(s.students<=s.enrolled);assert.ok(s.uses>1500);
 for(const row of data.sessions){assert.ok(data.classes.some(c=>c.id===row.classId));assert.ok(row.source.includes('模拟'));}
});
test('class, app, role, type, keyword and date filters intersect without changing source',()=>{
 const c=data.classes[0];const before=JSON.stringify(data);
 const rows=filterSessions(data.sessions,{classId:c.id,app:'24H智能学伴',role:'学生',type:'自由问答',query:'PLC',start:'2026-10-01',end:'2026-10-11'});
 assert.ok(rows.length);
 for(const r of rows){assert.equal(r.classId,c.id);assert.equal(r.role,'学生');assert.ok(r.date>='2026-10-01'&&r.date<='2026-10-11');for(const t of r.turns){assert.equal(t.type,'自由问答');assert.ok(`${r.name} ${t.question} ${t.answer}`.toLowerCase().includes('plc'));}}
 assert.equal(JSON.stringify(data),before);
 const insight=buildInsight(rows);assert.equal(insight.types.reduce((n,r)=>n+r.value,0),summarizeSessions(rows,[c]).uses);
});
test('empty scopes keep safe zero metrics and enrolled denominator',()=>{
 const s=summarizeSessions([],data.classes);assert.equal(s.uses,0);assert.equal(s.minutes,0);assert.equal(s.studentRate,0);assert.ok(s.enrolled>0);assert.deepEqual(buildInsight([]).questions,[]);
});
test('CSV quotes commas, newlines and formula text safely',()=>{
 const csv=toCSV(['姓名','问题'],[['张同学','PLC,计时\n问题'],['=1+1','"反馈"']]);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"PLC,计时\n问题"'));assert.ok(csv.includes("'="));assert.ok(csv.includes('""反馈""'));
});
test('knowledge drilldown exactly preserves app, topic and question-type counts',()=>{
 const scoped=filterSessions(data.sessions,{app:'24H智能学伴',type:'自由问答'});
 for(const k of buildInsight(scoped).knowledge){
  const rows=filterSessions(data.sessions,{app:'24H智能学伴',type:'自由问答',topic:k.name});
  assert.equal(summarizeSessions(rows,data.classes).uses,k.value,k.name);
  assert.ok(rows.every(r=>r.turns.every(t=>t.topic===k.name)));
 }
});
