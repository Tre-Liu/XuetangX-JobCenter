import {useId, useMemo, useState} from 'react';
import {Icon} from '../components/Icon';
import {ResultChart} from '../results/ResultChart';
import {calculateAttainment, exportAttainmentCsv, parseAssessmentRecords, resolveMappings} from './versions.mjs';
import './version-analytics.css';

const hasValue = value => typeof value === 'number' && Number.isFinite(value);
const meetsThreshold=(value,threshold)=>hasValue(value)&&value>=Number(threshold)-1e-9;
const percent = value => hasValue(value) ? `${value.toFixed(1)}%` : '未评价';
const sourceLabel = source => ({'teaching-simulation':'教学模拟',demo:'教学模拟',imported:'导入记录','imported-assessment':'导入考核成绩',manual:'教师录入','teacher-entered':'教师录入'}[source] || source || '来源未填写');
const titleOf = item => item?.title || item?.name || item?.id;

function AssessmentImportForm({classroom,catalog,onImportRecords,onClose,onImported}) {
 const [text,setText]=useState('');
 const [errors,setErrors]=useState([]);
 const [busy,setBusy]=useState(false);
 const questions=catalog.questions.filter(question=>classroom.questionIds.includes(question.id));
 const [chosenQuestion,setChosenQuestion]=useState(questions[0]?.id||'');
 const fileId=useId();
 const question=questions.find(item=>item.id===chosenQuestion)||questions[0];
 const csvCell=value=>`"${String(value??'').replaceAll('"','""')}"`;
 const template=`学号,试题ID,得分,满分,日期\n${csvCell(classroom.students[0]?.studentNo)},${csvCell(question?.id)},,${question?.maxScore||100},`;
 const readFile=async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  setBusy(true);setErrors([]);
  try{setText(await file.text());}
  catch(error){setErrors([`读取CSV失败：${error.message||'请重新选择文件'}`]);}
  finally{setBusy(false);event.target.value='';}
 };
 const submit=async event=>{
  event.preventDefault();setErrors([]);
  const parsed=parseAssessmentRecords(text,classroom,catalog);
  if(parsed.errors.length){setErrors(parsed.errors);return;}
  if(!parsed.records.length){setErrors(['请填写至少一条有效考核成绩。']);return;}
  setBusy(true);
  try{await onImportRecords(parsed.records);onImported(parsed.records.length);onClose();}
  catch(error){setErrors([`保存失败：${error.message||'请重试'}。输入已保留。`]);}
  finally{setBusy(false);}
 };
 return <form className="va-import-panel" aria-label="导入当前版本考核成绩" onSubmit={submit}>
  <div className="va-import-heading"><h3><Icon name="book" size={18}/>导入考核成绩</h3><button type="button" onClick={onClose} disabled={busy} aria-label="关闭考核成绩导入"><Icon name="close" size={18}/></button></div>
  <p className="va-import-instructions">CSV必填列：学号、试题ID、得分、满分；日期选填。学号和试题ID须属于当前版本；满分大于0，得分须在0至满分之间。任一行不通过校验，整批不导入。</p>
  <div className="va-import-tools"><label className="va-import-file" htmlFor={fileId}><Icon name="attachment" size={16}/>上传CSV<input type="file" id={fileId} aria-label="上传考核成绩CSV" accept=".csv,text/csv" disabled={busy} onChange={readFile}/></label><label className="va-template-question">模板试题<select aria-label="选择成绩模板试题" value={question?.id||''} onChange={event=>setChosenQuestion(event.target.value)} disabled={busy}>{questions.map(item=><option key={item.id} value={item.id}>{item.title} · {item.id}</option>)}</select></label></div>
  <div className="va-template-preview"><code>{template}</code><button type="button" disabled={busy} onClick={()=>{setText(template);setErrors([]);}}>填入空白模板</button></div>
  <p className="va-template-note">模板使用当前版本首位学生学号与所选试题ID，得分留空，请填写实际成绩。</p>
  <label className="va-import-text">粘贴或修改CSV<textarea aria-label="粘贴考核成绩CSV" placeholder="学号,试题ID,得分,满分,日期" rows={6} value={text} disabled={busy} onChange={event=>{setText(event.target.value);setErrors([]);}} spellCheck={false}/></label>
  {errors.length>0&&<div className="va-import-errors" role="alert"><strong>未导入，请修正以下问题：</strong><ul>{errors.map((error,index)=><li key={index}>{error}</li>)}</ul></div>}
  <div className="va-import-footer"><p>只有点击“确认导入”并保存成功后，成绩才进入当前版本；来源标记为“导入考核成绩”。</p><div><button type="button" disabled={busy} onClick={onClose}>取消</button><button type="submit" className="va-import-confirm" disabled={busy||!text.trim()}>{busy?'处理中…':'确认导入'}</button></div></div>
 </form>;
}

export function Radar({title, rows, threshold, studentView, compact = false, currentLabel, comparisonLabel='班级均值', showValues=true}) {
 const evaluated = rows.filter(row => hasValue(row.value));
 const missing = rows.filter(row => !hasValue(row.value));
 const showMean = studentView && evaluated.length > 0 && evaluated.every(row => hasValue(row.classMean));
 const option = useMemo(() => ({
  animation:false,
  color:['#3985f4','#a28bea','#ebbc62'],
  tooltip:{trigger:'item',renderMode:'richText'},
  legend:{bottom:1,left:'center',textStyle:{fontSize:11,color:'#7b8ba4'},itemWidth:13,itemHeight:7},
  radar:{center:['50%','44%'],radius:compact?'53%':'55%',splitNumber:4,
   indicator:evaluated.map(row=>({name:row.title,max:100})),
   axisName:{color:'#637797',fontSize:11,formatter:name=>name.length>8?`${name.slice(0,7)}…`:name},
   splitArea:{areaStyle:{color:['#f8fbff','#f0f5fd']}},
   splitLine:{lineStyle:{color:'#dce6f5'}},axisLine:{lineStyle:{color:'#dce6f5'}}},
  series:[{type:'radar',symbolSize:5,data:[
   {name:currentLabel||(studentView?'学生达成度':'班级达成度'),value:evaluated.map(row=>row.value),areaStyle:{opacity:.15},lineStyle:{width:2}},
   ...(showMean?[{name:comparisonLabel,value:evaluated.map(row=>row.classMean),areaStyle:{opacity:.06},lineStyle:{width:2}}]:[]),
   ...(hasValue(threshold)?[{name:'达标阈值',value:evaluated.map(()=>threshold),symbol:'none',lineStyle:{type:'dashed',width:1.5},areaStyle:{opacity:0}}]:[])
  ]}]
 }),[rows,threshold,studentView,compact,currentLabel,comparisonLabel]);
 return <div className="va-radar-content">
  {evaluated.length>=3?<div className="va-chart-shell" aria-label={`${title}，${evaluated.length}项已有评价`}><ResultChart option={option} className="va-radar"/></div>:<div className="va-chart-empty"><Icon name="graph" size={38}/><strong>{evaluated.length?'已评价维度不足3项':'暂无评价证据'}</strong><p>{evaluated.length?'雷达需要至少3项已评价能力，请查看下方数值。':'提交与当前版本考核题目关联的成绩后展示达成分析。'}</p></div>}
  {showValues&&<div className="va-axis-values" aria-label={`${title}数值`}>{rows.map(row=><div key={row.id} className={!hasValue(row.value)?'va-axis-missing':''}><span>{row.title}</span><strong>{percent(row.value)}</strong>{studentView&&<small>{comparisonLabel} {percent(row.classMean)}</small>}</div>)}</div>}
  {missing.length>0&&<p className="va-chart-note">{missing.length}项未评价，未绘制为零分轴。</p>}
  {studentView&&!showMean&&evaluated.length>=3&&<p className="va-chart-note">部分维度无班级均值，均值数值见列表。</p>}
 </div>;
}

function Evidence({ability, classroom, catalog, studentId}) {
 const questions = new Map(catalog.questions.map(question=>[question.id,question]));
 const knowledge = new Map(catalog.knowledge.map(item=>[item.id,item]));
 const students = new Map(classroom.students.map(student=>[student.id,student]));
 const abilityModel = catalog.abilities.find(item=>item.id===ability.id);
 const mapping = resolveMappings(classroom,catalog).find(item=>item.abilityId===ability.id);
 const relatedQuestions = catalog.questions.filter(question=>mapping?.questionIds.includes(question.id));
 const records = ability.evidence.filter(record=>!studentId||record.studentId===studentId);
 const rules = classroom.rules;
 return <div className="va-evidence">
  <div className="va-evidence-summary"><div><span>目标ID</span><strong>{ability.id}</strong></div><div><span>目标权重</span><strong>{ability.weight}%</strong></div><div><span>证据记录</span><strong>{records.length}条</strong></div><div><span>评价覆盖率</span><strong>{percent(ability.coverage)}</strong></div></div>
  <p className="va-formula"><Icon name="info" size={16}/><span>子能力达成度 = Σ（题目得分率 × 考核权重）÷ 纳入计算的考核权重总和，题目得分率 = 得分 ÷ 满分 × 100%。缺失题目{rules.missing==='zero'?'按规则计0；学生完全无评分证据仍为未评价':'排除，不进入权重分母'}。{!studentId&&' 班级值为已有评价学生的均值。'}</span></p>
  <p className="va-formula-text">{rules.aggregation==='minimum'?'模块与综合值取正权重能力的最低值。':'模块与综合值按正目标权重汇总，分母为纳入计算的目标权重总和。'} 达标阈值 {percent(rules.threshold)}。</p>
  <div className="va-related"><span>显式关联知识</span><div>{(abilityModel?.knowledgeIds||[]).filter(id=>classroom.knowledgeIds.includes(id)).length?(abilityModel?.knowledgeIds||[]).filter(id=>classroom.knowledgeIds.includes(id)).map(id=><span key={id}>{titleOf(knowledge.get(id))||id}<small>{id}</small></span>):<span>未关联知识点</span>}</div></div>
  <div className="va-related"><span>考核权重依据</span><div>{relatedQuestions.length?relatedQuestions.map(question=><span key={question.id}>{titleOf(question)}<small>{question.id} · 权重 {classroom.assessmentWeights[question.id]??'未配置'}%</small></span>):<span>未关联考核题目</span>}</div></div>
  {records.length?<div className="va-records">{records.map((record,index)=>{
   const question=questions.get(record.questionId),student=students.get(record.studentId);
   const rate=hasValue(record.score)&&hasValue(record.maxScore)&&record.maxScore>0?record.score/record.maxScore*100:null;
   const scoredIds=new Set(records.filter(item=>item.studentId===record.studentId).map(item=>item.questionId));
   const denominator=relatedQuestions.filter(item=>rules.missing==='zero'||scoredIds.has(item.id)).reduce((sum,item)=>sum+Number(classroom.assessmentWeights[item.id]??1),0);
   return <article key={record.id||`${record.studentId}-${record.questionId}-${index}`} className="va-record"><header><strong>{student?.name||record.studentId}<small>{student?.studentNo||record.studentId}</small></strong><span>{sourceLabel(record.source)}</span></header><h4>{titleOf(question)||record.questionId}</h4><p className="va-record-id">题目ID：{record.questionId}</p><dl><div><dt>原始成绩 / 满分</dt><dd>{record.score} / {record.maxScore}</dd></div><div><dt>题目得分率</dt><dd>{percent(rate)}</dd></div><div><dt>考核权重</dt><dd>{classroom.assessmentWeights[record.questionId]??'未配置'}%</dd></div><div><dt>该生本能力权重分母</dt><dd>{denominator.toFixed(2)}</dd></div><div><dt>记录日期</dt><dd>{record.date||'未填写'}</dd></div></dl><p>知识点：{question?.knowledgeIds?.length?question.knowledgeIds.map(id=>`${titleOf(knowledge.get(id))||id}（${id}）`).join('、'):'未关联'}</p><p className="va-record-id">记录ID：{record.id||'未填写'}</p></article>;
  })}</div>:<p className="va-no-evidence">{hasValue(ability.value)?'该能力暂无直接评分证据，按本版本缺失计0规则纳入计算。':'该能力暂无学生评价记录，保留未评价状态。'}</p>}
 </div>;
}

export function VersionAnalytics({classroom, catalog, onImportRecords, afterRadar, heading='能力达成分析', RadarComponent=Radar, renderOverview, showRanking=true, initialView='class'}) {
 const [view,setView]=useState(initialView);
 const [chosenStudent,setChosenStudent]=useState('');
 const [chosenModule,setChosenModule]=useState('');
 const [expanded,setExpanded]=useState('');
 const [notice,setNotice]=useState('');
 const [importOpen,setImportOpen]=useState(false);
 const id=useId();
 const students=classroom.students||[];
 const studentId=view==='student'?(students.find(student=>student.id===chosenStudent)?.id||students[0]?.id):undefined;
 const result=useMemo(()=>calculateAttainment(classroom,catalog,studentId),[classroom,catalog,studentId]);
 const selectedModule=result.modules.find(module=>module.id===chosenModule)||result.modules[0];
 const children=result.abilities.filter(ability=>ability.moduleId===selectedModule?.id);
 const ranking=[...result.abilities].sort((a,b)=>hasValue(a.value)&&hasValue(b.value)?b.value-a.value:hasValue(a.value)?-1:hasValue(b.value)?1:0);
 const threshold=classroom.rules.threshold;
 const evaluated=result.abilities.filter(ability=>hasValue(ability.value));
 const passed=evaluated.filter(ability=>meetsThreshold(ability.value,threshold)).length;
 const exportCsv=()=>{
  try{
   const csv=exportAttainmentCsv(classroom,catalog,studentId);
   const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
   const link=document.createElement('a');link.href=url;
   link.download=`${classroom.name||'课程版本'}-${classroom.versionLabel||classroom.id}-${studentId?students.find(student=>student.id===studentId)?.studentNo||studentId:'班级'}-能力达成.csv`.replace(/[\\/:*?"<>|]/g,'-');
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setNotice('能力达成CSV已导出，包含来源、权重、分母和规则。');
  }catch(error){setNotice(`导出失败：${error.message||'请重试'}`);}
 };
 return <div className="version-analytics">
  {renderOverview&&renderOverview({result,view,studentId,students,threshold,ranking,onViewChange:value=>{setView(value);setExpanded('');setNotice('');},onStudentChange:value=>{setChosenStudent(value);setExpanded('');setNotice('');},onExport:exportCsv,onImport:()=>{setImportOpen(true);setNotice('');},importAvailable:!!onImportRecords&&!!students.length&&!!classroom.questionIds.length})}
  {renderOverview&&importOpen&&<AssessmentImportForm key={classroom.id} classroom={classroom} catalog={catalog} onImportRecords={onImportRecords} onClose={()=>setImportOpen(false)} onImported={count=>setNotice(`已导入${count}条考核成绩，来源为导入考核成绩。`)}/>}
  {renderOverview&&!students.length&&<div className="va-empty-roster"><Icon name="users" size={30}/><div><strong>尚未添加学生</strong><p>添加名单与考核成绩后开展分析。</p></div></div>}
  {!renderOverview&&<>
  <div className="va-toolbar"><div><h2><Icon name="chart" size={21}/>{heading}</h2><p>依据当前版本的能力、考核题目与学生成绩计算</p></div><div className="va-toolbar-actions"><button type="button" className="va-import-trigger" aria-expanded={importOpen} onClick={()=>{setImportOpen(true);setNotice('');}} disabled={!onImportRecords||!students.length||!classroom.questionIds.length}><Icon name="plus" size={17}/>导入考核成绩</button><button type="button" className="va-export" onClick={exportCsv} disabled={view==='student'&&!studentId}><Icon name="download" size={17}/>导出CSV</button></div></div>
  <div className="va-source-note"><Icon name="info" size={17}/><p>{classroom.isDemo?'当前版本标记为教学模拟示例。':'学生名单与成绩仅来自当前版本已保存的记录。'} 课程能力与考核题目为教学模拟模型；每条成绩的实际来源见证据明细。</p></div>
  {importOpen&&<AssessmentImportForm key={classroom.id} classroom={classroom} catalog={catalog} onImportRecords={onImportRecords} onClose={()=>setImportOpen(false)} onImported={count=>setNotice(`已导入${count}条考核成绩，来源为导入考核成绩。`)}/>}
  <div className="va-controls"><div role="group" aria-label="能力达成分析视角" className="va-view-switch">{[['class','班级视角'],['student','学生视角']].map(([value,label])=><button type="button" key={value} aria-pressed={view===value} onClick={()=>{setView(value);setExpanded('');setNotice('');}}>{label}</button>)}</div>{view==='student'&&<label className="va-student-select">学生<select aria-label="选择分析学生" value={studentId||''} disabled={!students.length} onChange={event=>{setChosenStudent(event.target.value);setExpanded('');setNotice('');}}>{!students.length&&<option value="">暂无学生</option>}{students.map(student=><option key={student.id} value={student.id}>{student.name} · {student.studentNo||student.id}{student.source==='teaching-simulation'?'（模拟）':''}</option>)}</select></label>}<span className="va-threshold">达标阈值 <strong>{percent(threshold)}</strong></span></div>
  <div className="va-metrics"><div><span>综合达成度</span><strong>{percent(result.overall)}</strong><small>{classroom.rules.aggregation==='minimum'?'最低值聚合':'目标权重聚合'}</small></div><div><span>评价覆盖率</span><strong>{percent(result.coverage)}</strong><small>缺失证据单独统计</small></div><div><span>已评价学生</span><strong>{result.evaluatedStudentCount}<em> / {result.studentCount}</em></strong><small>本版本学生名单</small></div><div><span>达标能力</span><strong>{passed}<em> / {result.abilities.length}</em></strong><small>{evaluated.length}项已评价</small></div></div>
  {!students.length?<div className="va-empty-roster"><Icon name="users" size={32}/><div><strong>尚未添加学生</strong><p>在版本设置中添加或导入学生名单。名单导入后仍需考核成绩，才能计算能力达成度。</p></div></div>:!result.evaluatedStudentCount&&<div className="va-empty-roster"><Icon name="book" size={30}/><div><strong>{view==='student'?'该学生暂无评价记录':'名单已就绪，暂无评价记录'}</strong><p>未导入成绩的学生与能力保持“未评价”，不自动生成成绩。</p></div></div>}
  <div className="va-radar-grid"><section className="va-panel"><div className="va-panel-header"><h3>主能力模块雷达</h3><span>{result.modules.length}个模块</span></div><RadarComponent title="主能力模块" rows={result.modules} threshold={threshold} studentView={view==='student'} compact={RadarComponent!==Radar}/></section><section className="va-panel"><div className="va-panel-header"><h3>子能力雷达</h3><select aria-label="选择子能力模块" value={selectedModule?.id||''} onChange={event=>setChosenModule(event.target.value)} disabled={!result.modules.length}>{!result.modules.length&&<option value="">未配置模块</option>}{result.modules.map(module=><option key={module.id} value={module.id}>{module.title}</option>)}</select></div><RadarComponent title={selectedModule?.title||'子能力'} rows={children} threshold={threshold} studentView={view==='student'} compact/></section></div>
  </>}
  {afterRadar}
  {showRanking&&<section className="va-panel va-ranking"><div className="va-panel-header"><h3>能力达成排名</h3><span>按已评价达成度排序</span></div><div className="va-ranking-legend"><span>当前达成度</span><span>班级均值</span><span>证据与计算依据</span></div>{ranking.length?ranking.map((ability,index)=>{
   const isExpanded=expanded===ability.id;
   const panelId=`${id}-evidence-${ability.id}`;
   const difference=hasValue(ability.value)&&hasValue(ability.classMean)?ability.value-ability.classMean:null;
   return <div className="va-ranking-item" key={ability.id}><button type="button" className="va-ranking-row" aria-expanded={isExpanded} aria-controls={panelId} aria-label={`${isExpanded?'收起':'查看'}${ability.title}评价证据`} onClick={()=>setExpanded(isExpanded?'':ability.id)}><span className="va-rank-number">{hasValue(ability.value)?index+1:'—'}</span><div className="va-rank-title"><strong>{ability.title}</strong><small>{catalog.modules.find(module=>module.id===ability.moduleId)?.title||ability.moduleId} · 权重 {ability.weight}% · 覆盖 {percent(ability.coverage)}</small><div className="va-progress" aria-hidden="true"><i style={{width:`${hasValue(ability.value)?Math.max(0,Math.min(100,ability.value)):0}%`}}/></div></div><div className="va-rank-score"><strong className={!hasValue(ability.value)?'va-unevaluated':meetsThreshold(ability.value,threshold)?'va-pass':'va-below'}>{percent(ability.value)}</strong><small>{!hasValue(ability.value)?'无评价证据':meetsThreshold(ability.value,threshold)?'达标':'待提升'}</small></div><div className="va-rank-mean"><span>班级均值</span><strong>{percent(ability.classMean)}</strong>{view==='student'&&hasValue(difference)&&<small>{difference>0?'+':''}{difference.toFixed(1)}个百分点</small>}</div><span className="va-evidence-toggle">{isExpanded?'收起证据':'查看证据'}<Icon name={isExpanded?'up':'down'} size={16}/></span></button>{isExpanded&&<div id={panelId}><Evidence ability={ability} classroom={classroom} catalog={catalog} studentId={studentId}/></div>}</div>;
  }):<div className="va-no-evidence">当前版本尚未配置能力目标，请在版本设置中配置。</div>}</section>}
  <p className="va-export-note">CSV导出范围：{view==='student'?'所选学生':'当前班级'}。包含能力ID、成绩来源、权重、计算分母和缺失规则；缺失达成度标为“未评价”，教学模拟数据按来源标明。</p>
  {notice&&<p className="va-notice" role="status">{notice}</p>}
 </div>;
}
