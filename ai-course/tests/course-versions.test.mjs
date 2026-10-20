import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVersionCatalog,loadVersions,createVersion,resolveMappings,parseRoster,validateVersion,calculateAttainment,exportAttainmentCsv,equalAbilityWeights,saveVersions} from '../src/classrooms/versions.mjs';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const catalog=buildVersionCatalog();
const single=()=>{const a=catalog.abilities[0],knowledgeIds=[...a.knowledgeIds];const questionIds=catalog.questions.filter(q=>q.abilityIds.includes(a.id)&&q.knowledgeIds.some(k=>knowledgeIds.includes(k))).map(q=>q.id);return createVersion({mode:'custom',catalog,id:'test-version',draft:{name:'测试版本',versionLabel:'V1.0',startAt:'2026-09-01T00:00',endAt:'2027-01-31T23:59',abilityIds:[a.id],knowledgeIds,questionIds,abilityWeights:{[a.id]:100},students:parseRoster('学号,姓名\n001,张三\n002,李四').students}});};
test('six distinct version seeds use explicit knowledge and question associations',()=>{
 const versions=loadVersions(storage(),catalog);assert.equal(versions.length,6);assert.equal(versions[0].id,'smart-manufacturing-2026-autumn');assert.equal(versions[0].members,0);
 const v=single();const [mapping]=resolveMappings(v,catalog);assert.deepEqual(mapping.knowledgeIds,catalog.abilities[0].knowledgeIds);assert.ok(mapping.questionIds.length);assert.deepEqual(validateVersion(v,catalog),[]);
 const changed={...v,knowledgeIds:[]};assert.equal(resolveMappings(changed,catalog)[0].questionIds.length,0);
});
test('copy isolates configuration, regenerates AI identities and never copies evidence',()=>{
 const base=loadVersions(storage(),catalog)[1];assert.ok(base.records.length);
 const copy=createVersion({mode:'copy',baseVersion:base,catalog,id:'copied',draft:{name:'复制班级',versionLabel:'V4.0'}});
 assert.equal(copy.students.length,0);assert.equal(copy.members,0);assert.deepEqual(copy.records,[]);assert.notEqual(copy.agents[0].id,base.agents[0].id);assert.notEqual(copy.instructions[0].id,base.instructions[0].id);
 copy.abilityWeights[copy.abilityIds[0]]=1;copy.agents[0].prompt='modified';assert.notEqual(base.abilityWeights[base.abilityIds[0]],1);assert.notEqual(base.agents[0].prompt,'modified');
 const withStudents=createVersion({mode:'copy',baseVersion:base,catalog,id:'copy-roster',draft:{name:'含名单',copyStudents:true,students:base.students}});assert.equal(withStudents.students.length,base.students.length);assert.deepEqual(withStudents.records,[]);
});
test('roster parser preserves leading zeros and quoted names, rejects duplicates and missing identity',()=>{
 const good=parseRoster('学号,姓名,院系,行政班\n001,"张,三",机电学院,机电1班\n002,李四,机电学院,机电2班');assert.deepEqual(good.errors,[]);assert.equal(good.students[0].studentNo,'001');assert.equal(good.students[0].name,'张,三');
 assert.ok(parseRoster('学号,姓名\n001,张三\n001,李四').errors.length);assert.ok(parseRoster('学号,姓名\n,张三').errors.length);
});
test('weights, date order, unknown associations and duplicate roster are validated',()=>{
 const v=single();assert.ok(validateVersion({...v,abilityWeights:{[v.abilityIds[0]]:0}},catalog).length);assert.ok(validateVersion({...v,endAt:'2026-01-01T00:00'},catalog).length);assert.ok(validateVersion({...v,knowledgeIds:['unknown']},catalog).length);assert.ok(validateVersion({...v,rules:{...v.rules,threshold:101}},catalog).length);
 assert.ok(validateVersion({...v,students:[v.students[0],v.students[0]]},catalog).length);assert.equal(Object.values(equalAbilityWeights(catalog.abilities.map(a=>a.id))).reduce((s,w)=>s+w,0),100);
});
test('attainment is reproducible with missing policies, latest attempt and classroom comparison',()=>{
 const v=single();const [q1,q2]=v.questionIds;
 assert.equal(calculateAttainment(v,catalog).overall,null);
 v.records=[{id:'old',studentId:v.students[0].id,questionId:q1,score:20,maxScore:100,date:'2026-10-01',source:'teaching-simulation'},{id:'new',studentId:v.students[0].id,questionId:q1,score:80,maxScore:100,date:'2026-10-02',source:'teaching-simulation'},{id:'second',studentId:v.students[0].id,questionId:q2,score:60,maxScore:100,date:'2026-10-02',source:'teaching-simulation'}];
 const result=calculateAttainment(v,catalog,v.students[0].id);assert.equal(result.overall,70);assert.equal(result.abilities[0].evidence.length,2);assert.equal(result.abilities[0].classMean,70);assert.equal(result.evaluatedStudentCount,1);assert.equal(calculateAttainment(v,catalog,v.students[1].id).overall,null);
 const zero=calculateAttainment({...v,rules:{...v.rules,missing:'zero'}},catalog,v.students[0].id);assert.equal(zero.overall,140/v.questionIds.length);assert.equal(calculateAttainment({...v,rules:{...v.rules,missing:'zero'}},catalog,v.students[1].id).overall,null);
});
test('CSV includes provenance and denominators while escaping formula-like user names',()=>{
 const v=single();v.name='=SUM(1,2)';const csv=exportAttainmentCsv(v,catalog);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'=SUM(1,2)"));assert.match(csv,/权重/);assert.match(csv,/满分/);assert.match(csv,/来源/);
 const s=storage();saveVersions(s,[v]);assert.equal(loadVersions(s,catalog)[0].id,v.id);assert.throws(()=>saveVersions({setItem(){throw Error('full');}},[v]),/full/);
});

test('assessment import uses roster and selected question IDs and rejects invalid scores atomically',async()=>{
 const {parseAssessmentRecords}=await import('../src/classrooms/versions.mjs');const v=single();
 const parsed=parseAssessmentRecords(`学号,试题ID,得分,满分,日期\n001,${v.questionIds[0]},45,50,2026-10-12`,v,catalog);assert.deepEqual(parsed.errors,[]);assert.equal(parsed.records[0].studentId,v.students[0].id);assert.equal(parsed.records[0].source,'imported-assessment');assert.equal(calculateAttainment({...v,records:parsed.records},catalog,v.students[0].id).overall,90);
 assert.ok(parseAssessmentRecords('学号,试题ID,得分,满分\n999,unknown,10,100',v,catalog).errors.length);assert.ok(parseAssessmentRecords(`学号,试题ID,得分,满分\n001,${v.questionIds[0]},101,100`,v,catalog).errors.length);
 assert.equal(parseAssessmentRecords(`学号,试题ID,得分,满分\n001,${v.questionIds[0]},10,100\n002,unknown,10,100`,v,catalog).records.length,0);
});

test('latest evidence compares instants, including nonpadded dates and timezone offsets',()=>{
 const v=single(),s=v.students[0].id,q=v.questionIds[0];
 const record=(id,date,score)=>({id,date,score,studentId:s,questionId:q,maxScore:100,source:'manual'});
 v.records=[record('old','2026-9-30',20),record('new','2026-10-12',90)];assert.equal(calculateAttainment(v,catalog,s).overall,90);
 v.records=[record('earlier','2026-10-12T08:00:00+08:00',20),record('later','2026-10-12T01:00:00Z',90)];assert.equal(calculateAttainment(v,catalog,s).overall,90);
});
test('class module and overall mean use student results when evidence coverage differs',()=>{
 const a=catalog.abilities[0],b=catalog.abilities[1],qa='version-question-kp1-1',qb='version-question-kp3-1';
 const v=createVersion({mode:'custom',catalog,id:'mean-test',draft:{name:'均值测试',versionLabel:'V1',abilityIds:[a.id,b.id],knowledgeIds:[...new Set([...a.knowledgeIds,...b.knowledgeIds])],questionIds:[qa,qb],abilityWeights:{[a.id]:50,[b.id]:50},students:parseRoster('学号,姓名\n1,甲\n2,乙').students}});
 const rec=(studentId,questionId,score)=>({id:studentId+questionId,studentId,questionId,score,maxScore:100,date:'2026-10-12',source:'manual'});v.records=[rec(v.students[0].id,qa,100),rec(v.students[0].id,qb,100),rec(v.students[1].id,qa,0)];
 assert.equal(calculateAttainment(v,catalog,v.students[0].id).overall,100);assert.equal(calculateAttainment(v,catalog,v.students[1].id).overall,0);const c=calculateAttainment(v,catalog);assert.equal(c.overall,50);assert.equal(c.modules[0].value,50);assert.equal(c.modules[0].classMean,50);
});
