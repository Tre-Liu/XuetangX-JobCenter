import {calculateAttainment,resolveMappings} from '../classrooms/versions.mjs';
import {toCSV} from './model.mjs';
const valuePresent=n=>typeof n==='number'&&Number.isFinite(n);
const round=n=>Math.round(n*100)/100;
function relativeWeights(ids,weights){const ordered=[...ids].sort();const total=ordered.reduce((n,id)=>n+Number(weights?.[id]??1),0);return ordered.map(id=>[id,total?Math.round(Number(weights?.[id]??1)/total*1e6):0]);}
function signature(version,catalog,id,level){
 const mappings=resolveMappings(version,catalog).filter(m=>level==='abilities'?m.abilityId===id:m.moduleId===id);
 return JSON.stringify({missing:version.rules.missing,aggregation:level==='modules'?version.rules.aggregation:'weighted',abilities:level==='modules'?relativeWeights(mappings.map(m=>m.abilityId),version.abilityWeights):null,mappings:mappings.sort((a,b)=>a.abilityId.localeCompare(b.abilityId)).map(m=>({id:m.abilityId,knowledge:[...m.knowledgeIds].sort(),questions:relativeWeights(m.questionIds,version.assessmentWeights)}))});
}
function classInfo(classroom,result){return {id:classroom.id,name:classroom.name,version:classroom.versionLabel,semester:classroom.semester,students:result.studentCount,evaluated:result.evaluatedStudentCount,coverage:result.coverage,source:classroom.isDemo?'教学模拟':classroom.source||'已保存的班级记录',recordSources:[...new Set(result.abilities.flatMap(a=>a.evidence.map(r=>r.source||'未填写')))].join('；'),rules:{...classroom.rules}};}
export function compareClassMeans(current,reference,catalog,{level='modules',moduleId='all'}={}){
 const a=calculateAttainment(current,catalog),b=reference?calculateAttainment(reference,catalog):null;
 const referenceRows=new Map((b?.[level]||[]).map(r=>[r.id,r]));const rows=a[level].filter(r=>level!=='abilities'||moduleId==='all'||r.moduleId===moduleId).map(r=>{
 const ref=referenceRows.get(r.id);const comparable=!!reference&&signature(current,catalog,r.id,level)===signature(reference,catalog,r.id,level);
 const status=!reference?'未选择':!ref?'未配置':!valuePresent(r.value)||!valuePresent(ref.value)?'未评价':!comparable?'口径不同':'可比';
 return {id:r.id,title:r.title,moduleId:r.moduleId,current:valuePresent(r.value)?r.value:null,reference:valuePresent(ref?.value)?ref.value:null,difference:status==='可比'?round(r.value-ref.value):null,status};
 });
 return {level,moduleId,current:classInfo(current,a),reference:reference?classInfo(reference,b):null,rows};
}
export function comparisonCSV(result){const a=result.current,b=result.reference;const value=n=>valuePresent(n)?round(n):'未评价';return toCSV(['能力层级','能力ID','能力名称','当前班级ID','当前班级','当前版本','当前来源','当前成绩来源','当前已评价学生','当前学生总数','当前缺失规则','当前聚合规则','对比班级ID','对比班级','对比版本','对比来源','对比成绩来源','对比已评价学生','对比学生总数','对比缺失规则','对比聚合规则','当前班级均值(%)','对比班级均值(%)','差值(百分点)','可比状态'],result.rows.map(r=>[result.level==='modules'?'主能力':'子能力',r.id,r.title,a.id,a.name,a.version,a.source,a.recordSources,a.evaluated,a.students,a.rules.missing,a.rules.aggregation,b?.id||'',b?.name||'',b?.version||'',b?.source||'',b?.recordSources||'',b?.evaluated??'',b?.students??'',b?.rules.missing||'',b?.rules.aggregation||'',value(r.current),value(r.reference),r.difference===null?'—':r.difference,r.status]));}
