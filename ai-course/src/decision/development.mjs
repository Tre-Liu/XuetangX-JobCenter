import {calculateAttainment} from '../classrooms/versions.mjs';
export const finite=n=>typeof n==='number'&&Number.isFinite(n);
export const developmentPercent=n=>finite(n)?n.toFixed(1)+'%':'未评价';
export function selectDevelopmentAxes(result,{level='abilities',moduleId='all',limit=12}={}){
 if(level==='modules')return result.modules.slice(0,limit);
 const rows=result.abilities.filter(a=>moduleId==='all'||a.moduleId===moduleId);
 if(rows.length<=limit)return rows;
 const groups=[...new Set(rows.map(a=>a.moduleId))].map(id=>rows.filter(a=>a.moduleId===id));
 const selected=groups.flatMap(g=>g.slice(0,Math.max(1,Math.floor(limit/groups.length)))).slice(0,limit);
 return [...selected,...rows.filter(a=>!selected.some(s=>s.id===a.id)).slice(0,limit-selected.length)];
}
export function developmentEvidenceCount(result){return new Set(result.abilities.flatMap(a=>a.evidence).map(r=>r.id||`${r.studentId}:${r.questionId}:${r.date}`)).size;}
export function buildStudentProfiles(classroom,catalog){return classroom.students.map(student=>{
 const result=calculateAttainment(classroom,catalog,student.id);const evaluated=result.abilities.filter(a=>finite(a.value));const weakest=[...evaluated].sort((a,b)=>a.value-b.value)[0];const strongest=[...evaluated].sort((a,b)=>b.value-a.value)[0];const below=evaluated.filter(a=>a.value<classroom.rules.threshold-1e-9);
 return {...student,overall:result.overall,coverage:result.coverage,evaluated:evaluated.length,below:below.length,weakest,strongest,needsAttention:finite(result.overall)&&(result.overall<classroom.rules.threshold||below.length>=3||result.coverage<80),result};
});}
