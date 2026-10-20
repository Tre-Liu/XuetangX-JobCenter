import {createAbilityModel,loadAbilityModel} from '../ability/model.mjs';
export function getVersionStorage(){try{return globalThis.localStorage;}catch{return null;}}
export const VERSION_STORAGE_KEY='ai-course-class-versions-v1';
export const defaultClassroom={id:'smart-manufacturing-2026-autumn',name:'2026秋-26年01班',versionLabel:'V3.0',semester:'2026年秋季学期',members:0,startAt:'2026-09-01T00:00',endAt:'2027-01-31T23:59',source:'本地原型班级示例'};
const clone=value=>JSON.parse(JSON.stringify(value));
const unique=items=>[...new Set(items)];
const round=value=>Math.round(value*100)/100;
export function equalAbilityWeights(ids){const base=Math.floor(10000/Math.max(1,ids.length));return Object.fromEntries(ids.map((id,i)=>[id,(base+(i<10000-base*ids.length?1:0))/100]));}
export function buildVersionCatalog(storage){
 const model=storage?loadAbilityModel(storage):createAbilityModel();
 const knowledge=model.knowledge.map(k=>({...k,moduleIds:unique(model.abilities.filter(a=>a.knowledgeIds.includes(k.id)).map(a=>a.moduleId))}));
 const questions=knowledge.flatMap(k=>['原理理解','情境应用'].map((kind,i)=>({id:`version-question-${k.id}-${i+1}`,title:`${k.title} · ${kind}`,stem:i?`结合${k.title}，说明一个检查或调试步骤，列出判断依据和验证记录。`:`解释${k.title}的核心原理，并说明相关信号、器件或状态的含义。`,kind,knowledgeIds:[k.id],abilityIds:model.abilities.filter(a=>a.knowledgeIds.includes(k.id)).map(a=>a.id),maxScore:100,source:'teaching-simulation'})));
 return {modules:model.modules,abilities:model.abilities,knowledge,questions};
}
function semester(startAt){const date=new Date(startAt);return Number.isFinite(date.getTime())?`${date.getFullYear()}年${date.getMonth()>=6?'秋':'春'}季学期`:'未设置学期';}
export function resolveMappings(version,catalog){
 const knowledgeSet=new Set(version.knowledgeIds||[]),questionSet=new Set(version.questionIds||[]);
 return catalog.abilities.filter(a=>version.abilityIds?.includes(a.id)).map(a=>{const knowledgeIds=a.knowledgeIds.filter(id=>knowledgeSet.has(id)&&catalog.knowledge.some(k=>k.id===id));return {abilityId:a.id,moduleId:a.moduleId,knowledgeIds,questionIds:catalog.questions.filter(q=>questionSet.has(q.id)&&q.abilityIds.includes(a.id)&&q.knowledgeIds.some(id=>knowledgeIds.includes(id))).map(q=>q.id)};});
}
export function createVersion({mode='quick',baseVersion=null,draft={},catalog=buildVersionCatalog(),id=`version-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}){
 const source=mode==='copy'&&baseVersion?clone(baseVersion):{};
 const abilityIds=unique(draft.abilityIds??source.abilityIds??catalog.abilities.map(a=>a.id));
 const knowledgeIds=unique(draft.knowledgeIds??source.knowledgeIds??catalog.abilities.filter(a=>abilityIds.includes(a.id)).flatMap(a=>a.knowledgeIds));
 const questionIds=unique(draft.questionIds??source.questionIds??catalog.questions.filter(q=>q.abilityIds.some(a=>abilityIds.includes(a))&&q.knowledgeIds.some(k=>knowledgeIds.includes(k))).map(q=>q.id));
 const students=clone(draft.students??(mode==='copy'&&!draft.copyStudents?[]:source.students??[]));
 const startAt=draft.startAt??source.startAt??defaultClassroom.startAt,endAt=draft.endAt??source.endAt??defaultClassroom.endAt;
 const version={...source,id,name:(draft.name??'新建课程版本').trim(),versionLabel:(draft.versionLabel??source.versionLabel??'V1.0').trim(),startAt,endAt,semester:draft.semester??semester(startAt),abilityIds,knowledgeIds,questionIds,abilityWeights:clone(draft.abilityWeights??source.abilityWeights??equalAbilityWeights(abilityIds)),assessmentWeights:clone(draft.assessmentWeights??source.assessmentWeights??equalAbilityWeights(questionIds)),rules:{threshold:60,missing:'exclude',aggregation:'weighted',...(source.rules||{}),...(draft.rules||{})},students,members:students.length,records:[],source:'本地课程版本配置',isDemo:false,createdAt:new Date().toISOString()};
 const roles=[['teacher','教学助教','根据本版本知识体系、能力目标与考核规则，协助教师设计教学活动。'],['student','学习助手','依据本版本能力目标提供学习提示，引用知识点ID，不代替学生提交考核成果。'],['evaluation','能力评价助手','依据本版本规则和实际评分证据解释达成度；没有证据时说明未评价，不能生成虚构成绩。']];
 version.agents=roles.map(([role,name,prompt])=>{const prior=source.agents?.find(a=>a.role===role);return {id:`${id}-agent-${role}`,role,name:prior?.name??name,prompt:prior?.prompt?.replace(`版本：${source.name}（${source.versionLabel}）`,`版本：${version.name}（${version.versionLabel}）`)??`${prompt}\n版本：${version.name}（${version.versionLabel}）\n能力目标ID：${abilityIds.join('、')}\n知识点ID：${knowledgeIds.join('、')}`,status:'configured'};});
 version.instructions=catalog.abilities.filter(a=>abilityIds.includes(a.id)).map(a=>{const prior=source.instructions?.find(i=>i.abilityId===a.id);return {id:`${id}-instruction-${a.id}`,abilityId:a.id,title:prior?.title??`${a.title} · 学习与评价指令`,prompt:prior?.prompt??`目标：${a.title}（${a.id}）\n学习：${a.description}\n依据知识点ID：${a.knowledgeIds.filter(k=>knowledgeIds.includes(k)).join('、')}\n证据：${a.evidence}\n只引用本版本已配置的试题与学生证据。缺失证据标记未评价。`};});
 return version;
}
export function validateVersion(version,catalog){
 const errors=[];
 if(!version.name?.trim())errors.push('请输入版本名称');if(!version.versionLabel?.trim())errors.push('请输入版本号');
 const start=new Date(version.startAt).getTime(),end=new Date(version.endAt).getTime();if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)errors.push('请选择有效的运行时间，结束时间须晚于开始时间');
 for(const [key,known,label] of [['abilityIds',catalog.abilities,'能力'],['knowledgeIds',catalog.knowledge,'知识点'],['questionIds',catalog.questions,'考核试题']]){const ids=version[key]||[];if(!ids.length)errors.push(`请至少选择一项${label}`);if(ids.some(id=>!known.some(item=>item.id===id))||unique(ids).length!==ids.length)errors.push(`${label}关联包含无效或重复ID`);}
 const weights=(version.abilityIds||[]).map(id=>Number(version.abilityWeights?.[id]));if(weights.some(w=>!Number.isFinite(w)||w<=0)||Math.abs(weights.reduce((s,w)=>s+w,0)-100)>.011)errors.push('已选能力权重须大于0且合计100%');
 if((version.questionIds||[]).some(id=>!Number.isFinite(Number(version.assessmentWeights?.[id]??1))||Number(version.assessmentWeights?.[id]??1)<=0))errors.push('考核试题权重须大于0');
 if(version.rules?.threshold===''||version.rules?.threshold===null||!Number.isFinite(Number(version.rules?.threshold))||Number(version.rules.threshold)<0||Number(version.rules.threshold)>100)errors.push('达成阈值须在0到100之间');
 if(!['exclude','zero'].includes(version.rules?.missing)||!['weighted','minimum'].includes(version.rules?.aggregation))errors.push('请选择有效的达成度测算规则');
 const students=version.students||[];if(students.some(s=>!s.studentNo?.trim()||!s.name?.trim()||!s.id))errors.push('学生须包含姓名和学号');if(unique(students.map(s=>s.studentNo?.trim())).length!==students.length||unique(students.map(s=>s.id)).length!==students.length)errors.push('学生名单存在重复学号');
 const validMappings=resolveMappings(version,catalog);if((version.questionIds||[]).some(id=>!validMappings.some(m=>m.questionIds.includes(id))))errors.push('考核试题须与已选能力及知识点关联');
 return errors;
}
function readDelimited(text){
 const delimiter=text.split(/\r?\n/,1)[0].includes('\t')?'\t':',';const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===delimiter||c==='\n'||c==='\r')){row.push(cell.trim());cell='';if(c!==delimiter){if(row.some(Boolean))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}else cell+=c;}
 if(quoted)throw Error('CSV引号未闭合');row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
export function parseRoster(text){
 try{const rows=readDelimited(String(text).replace(/^\uFEFF/,''));if(!rows.length)return {students:[],errors:[]};
 const names={studentNo:['学号','studentno','student_no','studentid','id'],name:['姓名','name','学生姓名'],department:['院系','学院','department'],className:['行政班','班级','classname','class']};
 const header=rows[0].map(x=>x.toLowerCase().replace(/\s/g,''));const fields=Object.fromEntries(Object.entries(names).map(([key,aliases])=>[key,header.findIndex(x=>aliases.includes(x))]));const hasHeader=fields.studentNo>=0||fields.name>=0;
 if(hasHeader&&(fields.studentNo<0||fields.name<0))return {students:[],errors:['表头必须同时包含“学号”和“姓名”']};if(!hasHeader){fields.studentNo=0;fields.name=1;fields.department=2;fields.className=3;}
 const errors=[],students=[],seen=new Set();for(const [i,row] of rows.slice(hasHeader?1:0).entries()){const no=(row[fields.studentNo]||'').trim(),name=(row[fields.name]||'').trim();const line=i+(hasHeader?2:1);if(!no||!name){errors.push(`第${line}行缺少学号或姓名`);continue;}if(seen.has(no)){errors.push(`第${line}行学号${no}重复`);continue;}seen.add(no);students.push({id:`student-${no}`,studentNo:no,name,department:row[fields.department]||'',className:row[fields.className]||'',source:'imported-roster'});}
 return {students,errors};}catch(error){return {students:[],errors:[error.message]};}
}
function seedVersions(catalog){
 const specs=[[defaultClassroom.id,defaultClassroom.name,'V3.0','2026-09-01T00:00','2027-01-31T23:59',40,0],['plc-2026-autumn-02','2026秋-26年02班','V2.2','2026-09-01T00:00','2027-01-31T23:59',30,8],['plc-2026-spring-01','2026春-26年01班','V2.1','2026-03-01T00:00','2026-06-30T23:59',25,6],['plc-2026-spring-02','2026春-26年02班','V2.0','2026-03-01T00:00','2026-06-30T23:59',20,6],['plc-2025-autumn-01','2025秋-25年01班','V1.1','2025-09-01T00:00','2026-01-31T23:59',15,4],['plc-2025-spring-01','2025春-25年01班','V1.0','2025-03-01T00:00','2025-06-30T23:59',10,4]];
 const names=['陈子涵','李昊','王俊杰','赵晨曦','周嘉宁','孙泽宇','吴思远','郑雨桐'];
 const moduleBases=[87,78,70,60,75,57,67,85];
 return specs.map(([id,name,versionLabel,startAt,endAt,count,size],vi)=>{
  const students=Array.from({length:size},(_,i)=>({id:`${id}-demo-student-${i+1}`,studentNo:`D${vi}${String(i+1).padStart(3,'0')}`,name:names[(i+vi-1+names.length)%names.length],department:'机电工程学院',className:name,source:'teaching-simulation'}));
  const v=createVersion({catalog,id,draft:{name,versionLabel,startAt,endAt,abilityIds:catalog.abilities.slice(0,count).map(a=>a.id),students}});v.source='教学模拟版本';v.isDemo=true;
  v.records=students.flatMap((s,si)=>v.questionIds.filter((q,qi)=>(qi+si)%11!==0).map((q,qi)=>{
   const question=catalog.questions.find(item=>item.id===q);const ability=catalog.abilities.find(a=>a.id===question.abilityIds[0]);const moduleIndex=catalog.modules.findIndex(m=>m.id===ability?.moduleId);
   // Only unsaved sample versions are seeded. Learner strengths, practical-task difficulty
   // and missing submissions create different profiles; saved teacher grades are never migrated.
   const variation=[...q].reduce((sum,char)=>sum+char.charCodeAt(0),0)%13-6;
   const profileScore=(moduleBases[moduleIndex]??70)+[-18,-10,-15,-8,0,5,10,14][si%8]+variation-(question.kind==='情境应用'?5:0)+(vi-1)*2;
   const score=si<2?55+(si*7+qi*3+vi*5)%45:Math.max(35,Math.min(98,Math.round(profileScore)));
   return {id:`${id}-evidence-${si}-${q}`,studentId:s.id,questionId:q,score,maxScore:100,date:`${startAt.slice(0,4)}-${Number(startAt.slice(5,7))>=7?'09':'05'}-${String(15+qi%14).padStart(2,'0')}`,source:'teaching-simulation'};
  }));return v;
 });
}
export function loadVersions(storage,catalog=buildVersionCatalog(storage)){
 try{const data=JSON.parse(storage?.getItem(VERSION_STORAGE_KEY)??'null');if(data?.schema===1&&Array.isArray(data.versions)&&data.versions.every(v=>v.id&&v.name&&Array.isArray(v.abilityIds)&&Array.isArray(v.students)&&Array.isArray(v.records)))return data.versions;}catch{}
 return seedVersions(catalog);
}
export function saveVersions(storage,versions){if(!storage)throw Error('当前浏览器无法保存版本，已保留当前输入');storage.setItem(VERSION_STORAGE_KEY,JSON.stringify({schema:1,versions}));}
export function readClassroom(hash=location.hash,versions=loadVersions(getVersionStorage())){
 const key=hash.startsWith('#class/')?hash.slice(7).split('?')[0]:new URLSearchParams(hash.split('?')[1]||'').get('class');return versions.find(v=>v.id===key)||versions.find(v=>v.id===defaultClassroom.id)||versions[0]||defaultClassroom;
}
function latestRecords(version,catalog){const studentIds=new Set(version.students.map(s=>s.id)),questionIds=new Set(version.questionIds.filter(id=>catalog.questions.some(q=>q.id===id)));const map=new Map();for(const r of version.records||[]){if(!studentIds.has(r.studentId)||!questionIds.has(r.questionId)||!Number.isFinite(r.score)||!Number.isFinite(r.maxScore)||r.maxScore<=0||r.score<0||r.score>r.maxScore)continue;const key=`${r.studentId}\0${r.questionId}`,old=map.get(key);const stamp=Date.parse(r.date),oldStamp=Date.parse(old?.date);if(!old||(Number.isFinite(stamp)?stamp:0)>=(Number.isFinite(oldStamp)?oldStamp:0))map.set(key,r);}return [...map.values()];}
const mean=values=>{const valid=values.filter(v=>v!==null&&Number.isFinite(v));return valid.length?valid.reduce((s,v)=>s+v,0)/valid.length:null;};
function aggregate(rows,rules){const valid=rows.filter(r=>r.value!==null&&Number.isFinite(r.value)&&r.weight>0);if(!valid.length)return null;if(rules.aggregation==='minimum')return Math.min(...valid.map(r=>r.value));return valid.reduce((s,r)=>s+r.value*r.weight,0)/valid.reduce((s,r)=>s+r.weight,0);}
export function calculateAttainment(version,catalog,studentId){
 const evidence=latestRecords(version,catalog),mappings=resolveMappings(version,catalog),population=version.students,scope=studentId?population.filter(s=>s.id===studentId):population;const evaluated=new Set(evidence.map(r=>r.studentId));const rules=version.rules;
 function valueForStudent(mapping,s){if(!evaluated.has(s.id)||!mapping.questionIds.length)return null;let numerator=0,denominator=0;for(const qid of mapping.questionIds){const record=evidence.find(r=>r.studentId===s.id&&r.questionId===qid),weight=Number(version.assessmentWeights[qid]??1);if(record){numerator+=record.score/record.maxScore*100*weight;denominator+=weight;}else if(rules.missing==='zero')denominator+=weight;}return denominator?numerator/denominator:null;}
 const abilities=mappings.map(mapping=>{const a=catalog.abilities.find(item=>item.id===mapping.abilityId);const records=evidence.filter(r=>scope.some(s=>s.id===r.studentId)&&mapping.questionIds.includes(r.questionId));return {id:a.id,title:a.title,moduleId:a.moduleId,weight:Number(version.abilityWeights[a.id]||0),value:mean(scope.map(s=>valueForStudent(mapping,s))),classMean:mean(population.map(s=>valueForStudent(mapping,s))),coverage:scope.length&&mapping.questionIds.length?records.length/(scope.length*mapping.questionIds.length)*100:0,evidence:records};});
 const studentAggregate=(student,moduleId)=>aggregate(mappings.filter(m=>!moduleId||m.moduleId===moduleId).map(m=>({value:valueForStudent(m,student),weight:Number(version.abilityWeights[m.abilityId]||0)})),rules);
 const modules=catalog.modules.filter(m=>abilities.some(a=>a.moduleId===m.id)).map(m=>({id:m.id,title:m.title,value:mean(scope.map(s=>studentAggregate(s,m.id))),classMean:mean(population.map(s=>studentAggregate(s,m.id)))}));
 const expected=mappings.reduce((sum,m)=>sum+m.questionIds.length*scope.length,0),actual=abilities.reduce((sum,a)=>sum+a.evidence.length,0);
 return {abilities,modules,overall:mean(scope.map(s=>studentAggregate(s))),coverage:expected?actual/expected*100:0,studentCount:scope.length,evaluatedStudentCount:scope.filter(s=>evaluated.has(s.id)).length};
}
export function exportAttainmentCsv(version,catalog,studentId){
 const result=calculateAttainment(version,catalog,studentId);const allEvidence=latestRecords(version,catalog),mapping=resolveMappings(version,catalog);const rows=[['版本ID','版本名称','版本号','学生范围','能力ID','能力名称','能力权重(%)','达成度(%)','班级均值(%)','证据覆盖率(%)','阈值(%)','缺失规则','聚合规则','记录ID','学生学号','学生姓名','试题ID','知识点ID','得分','满分','考核权重','纳入考核权重分母','日期','来源']];
 const label=studentId?version.students.find(s=>s.id===studentId)?.name||studentId:'班级';for(const a of result.abilities){for(const r of a.evidence.length?a.evidence:[null]){const q=catalog.questions.find(q=>q.id===r?.questionId),s=version.students.find(s=>s.id===r?.studentId);rows.push([version.id,version.name,version.versionLabel,label,a.id,a.title,a.weight,a.value===null?'未评价':round(a.value),a.classMean===null?'未评价':round(a.classMean),round(a.coverage),version.rules.threshold,version.rules.missing,version.rules.aggregation,r?.id||'',s?.studentNo||'',s?.name||'',q?.id||'',q?.knowledgeIds.join(';')||'',r?.score??'',r?.maxScore??'',r?version.assessmentWeights[r.questionId]??1:'',r?(mapping.find(m=>m.abilityId===a.id)?.questionIds||[]).filter(qid=>version.rules.missing==='zero'||allEvidence.some(e=>e.studentId===r.studentId&&e.questionId===qid)).reduce((sum,qid)=>sum+Number(version.assessmentWeights[qid]??1),0):'',r?.date||'',r?.source||'无评分证据']);}}
 const cell=value=>{let str=String(value??'');if(/^[\s]*[=+@-]/.test(str))str="'"+str;return '"'+str.replaceAll('"','""')+'"';};return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}

export function parseAssessmentRecords(text,version,catalog){
 try{const rows=readDelimited(String(text).replace(/^\uFEFF/,''));if(!rows.length)return {records:[],errors:['请粘贴或上传考核成绩']};const head=rows[0].map(x=>x.toLowerCase().replace(/\s/g,''));const aliases={studentNo:['学号','studentno','student_no'],questionId:['试题id','题目id','questionid','question_id'],score:['得分','成绩','score'],maxScore:['满分','maxscore','max_score'],date:['日期','时间','date']};const col=Object.fromEntries(Object.entries(aliases).map(([k,words])=>[k,head.findIndex(t=>words.includes(t))]));if(['studentNo','questionId','score','maxScore'].some(k=>col[k]<0))return {records:[],errors:['表头须包含学号、试题ID、得分、满分；日期选填']};const records=[],errors=[],seen=new Set();const selected=new Set(resolveMappings(version,catalog).flatMap(m=>m.questionIds));for(const [i,row] of rows.slice(1).entries()){const line=i+2,no=row[col.studentNo],qid=row[col.questionId],student=version.students.find(s=>s.studentNo===no);if(!student){errors.push(`第${line}行学号${no||'为空'}不在本版本名单中`);continue;}if(!selected.has(qid)){errors.push(`第${line}行试题${qid||'为空'}不在本版本的关联考核范围`);continue;}const score=Number(row[col.score]),maxScore=Number(row[col.maxScore]);if(row[col.score]===''||row[col.maxScore]===''||!Number.isFinite(score)||!Number.isFinite(maxScore)||maxScore<=0||score<0||score>maxScore){errors.push(`第${line}行得分/满分无效：满分须大于0，得分须在0至满分之间`);continue;}const date=row[col.date]||new Date().toISOString();if(!Number.isFinite(new Date(date).getTime())){errors.push(`第${line}行日期无效`);continue;}const key=`${student.id}:${qid}:${date}`;if(seen.has(key)){errors.push(`第${line}行同一学生、试题与日期重复`);continue;}seen.add(key);records.push({id:`${version.id}-import-${no}-${qid}-${date}`,studentId:student.id,questionId:qid,score,maxScore,date,source:'imported-assessment'});}
 if(!records.length&&!errors.length)errors.push('没有可导入的成绩行');return {records:errors.length?[]:records,errors};}catch(error){return {records:[],errors:[error.message]};}
}
