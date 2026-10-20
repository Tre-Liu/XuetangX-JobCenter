import {useEffect, useMemo, useRef, useState} from 'react';
import {Icon} from '../components/Icon';
import {createVersion, equalAbilityWeights, parseRoster, resolveMappings, validateVersion} from './versions.mjs';
import './version-create.css';

const modes = [
 {id:'quick',icon:'sparkle',title:'快速创建',description:'沿用全课程能力与知识，自动配置教学模拟题和权重。'},
 {id:'copy',icon:'project-stack',title:'复制已有版本',description:'复用成熟配置，独立生成智能体与指令，重新开始评价。'},
 {id:'custom',icon:'settings',title:'自定义创建',description:'按教学需要选择能力、知识和考核内容，导入学生名单。'},
];
const steps = ['基本信息','能力与知识','考核与规则','学生名单'];
const equalWeights = equalAbilityWeights;
const weightTotal = (ids,weights) => ids.reduce((total,id)=>total+Number(weights[id] || 0),0);
function suggestMetadata(mode,versions,source,startAt) {
 const labels=versions.map(version=>/^v?(\d+)(?:\.(\d+))?$/i.exec(version.versionLabel?.trim() || '')).filter(Boolean).map(match=>[Number(match[1]),Number(match[2] || 0)]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
 const latest=labels[0];const versionLabel=latest?`V${latest[0]}.${latest[1]+1}`:'V1.0';
 const names=new Set(versions.map(version=>version.name));
 if(mode==='copy'){
  const prefix=`${source?.name || '课程版本'}-副本`;let name=prefix,index=2;
  while(names.has(name))name=`${prefix}${index++}`;
  return {name,versionLabel};
 }
 const date=new Date(startAt);const prefix=`${date.getFullYear()}${date.getMonth()>=6?'秋':'春'}-新增班`;
 let index=versions.length+1,name=`${prefix}${String(index).padStart(2,'0')}`;
 while(names.has(name))name=`${prefix}${String(++index).padStart(2,'0')}`;
 return {name,versionLabel};
}
function initialDraft(catalog) {
 const now=new Date();const end=new Date(now);end.setMonth(end.getMonth()+4);
 const date=value=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
 const abilityIds=catalog.abilities.map(item=>item.id), questionIds=catalog.questions.map(item=>item.id);
 return {name:'',versionLabel:'',semester:`${now.getFullYear()}年${now.getMonth()<7?'春季':'秋季'}学期`,startAt:date(now),endAt:date(end),abilityIds,knowledgeIds:catalog.knowledge.map(item=>item.id),questionIds,abilityWeights:equalWeights(abilityIds),assessmentWeights:equalWeights(questionIds),rules:{threshold:60,missing:'exclude',aggregation:'weighted'},students:[]};
}

export function VersionCreateDialog({versions=[],catalog,onCreate,onClose}) {
 const [mode,setMode]=useState(null), [step,setStep]=useState(0);
 const [draft,setDraft]=useState(()=>initialDraft(catalog));
 const [baseId,setBaseId]=useState(versions[0]?.id || ''), [copyStudents,setCopyStudents]=useState(false);
 const [errors,setErrors]=useState([]), [saving,setSaving]=useState(false);
 const [rosterText,setRosterText]=useState(''), [rosterErrors,setRosterErrors]=useState([]), [rosterImported,setRosterImported]=useState(false);
 const dialog=useRef(null), fileInput=useRef(null), metadataEdited=useRef({name:false,versionLabel:false});
 const baseVersion=versions.find(item=>item.id===baseId);
 const update=patch=>{setDraft(previous=>({...previous,...patch}));setErrors([]);};
 const knowledgeById=useMemo(()=>new Map(catalog.knowledge.map(item=>[item.id,item])),[catalog]);
 const questionById=useMemo(()=>new Map(catalog.questions.map(item=>[item.id,item])),[catalog]);
 const mappings=useMemo(()=>resolveMappings(draft,catalog),[draft,catalog]);
 const eligibleQuestions=catalog.questions.filter(question=>question.abilityIds.some(id=>draft.abilityIds.includes(id))&&question.knowledgeIds.some(id=>draft.knowledgeIds.includes(id)));
 const abilityTotal=weightTotal(draft.abilityIds,draft.abilityWeights), assessmentTotal=weightTotal(draft.questionIds,draft.assessmentWeights);
 useEffect(()=>{
  const previous=document.activeElement;dialog.current?.focus();
  const handle=event=>{
   if(event.key==='Escape'){event.preventDefault();onClose();}
   if(event.key==='Tab'){
    const controls=[...dialog.current.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(element=>!element.disabled && element.getAttribute('type')!=='hidden' && element.getClientRects().length>0);
    if(!controls.length){event.preventDefault();return;}
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){event.preventDefault();first.focus();}
   }
  };
  document.addEventListener('keydown',handle);
  const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.removeEventListener('keydown',handle);document.body.style.overflow=previousOverflow;previous?.focus?.();};
 },[onClose]);
 const suggestedFields=(next,source)=>Object.fromEntries(Object.entries(suggestMetadata(next,versions,source,draft.startAt)).filter(([field])=>!metadataEdited.current[field]));
 const editMetadata=(field,value)=>{metadataEdited.current[field]=true;update({[field]:value});};
 const copyConfiguration=source=>{
  if(!source)return;
  update({...suggestedFields('copy',source),abilityIds:[...source.abilityIds],knowledgeIds:[...source.knowledgeIds],questionIds:[...source.questionIds],abilityWeights:{...source.abilityWeights},assessmentWeights:{...source.assessmentWeights},rules:{...source.rules},students:[]});
  setCopyStudents(false);
 };
 const chooseMode=next=>{setMode(next);setStep(0);setErrors([]);if(next!=='custom'){setRosterText('');setRosterErrors([]);setRosterImported(false);}if(next==='copy')copyConfiguration(baseVersion);else if(next==='quick'){const defaults=initialDraft(catalog);update({...suggestedFields('quick'),abilityIds:defaults.abilityIds,knowledgeIds:defaults.knowledgeIds,questionIds:defaults.questionIds,abilityWeights:defaults.abilityWeights,assessmentWeights:defaults.assessmentWeights,rules:defaults.rules,students:[]});}};
 const toggleAbility=id=>{
  const ids=draft.abilityIds.includes(id)?draft.abilityIds.filter(value=>value!==id):[...draft.abilityIds,id];
  const knowledgeIds=[...new Set(catalog.abilities.filter(item=>ids.includes(item.id)).flatMap(item=>item.knowledgeIds))];
  const questionIds=catalog.questions.filter(item=>item.abilityIds.some(value=>ids.includes(value))).map(item=>item.id);
  update({abilityIds:ids,knowledgeIds,questionIds,abilityWeights:equalWeights(ids),assessmentWeights:equalWeights(questionIds)});
 };
 const toggleKnowledge=id=>{
  const knowledgeIds=draft.knowledgeIds.includes(id)?draft.knowledgeIds.filter(value=>value!==id):[...draft.knowledgeIds,id];
  const questionIds=catalog.questions.filter(question=>question.abilityIds.some(value=>draft.abilityIds.includes(value))&&question.knowledgeIds.some(value=>knowledgeIds.includes(value))).map(question=>question.id);
  update({knowledgeIds,questionIds,assessmentWeights:equalWeights(questionIds)});
 };
 const toggleQuestion=id=>{
  const ids=draft.questionIds.includes(id)?draft.questionIds.filter(value=>value!==id):[...draft.questionIds,id];
  update({questionIds:ids,assessmentWeights:equalWeights(ids)});
 };
 const basicErrors=()=>[
  ...(!draft.name.trim()?['请填写版本名称。']:[]),...(!draft.versionLabel.trim()?['请填写版本号。']:[]),
  ...(!draft.semester.trim()?['请填写学期。']:[]),...(!draft.startAt||!draft.endAt?['请选择运行起止日期。']:draft.startAt>=draft.endAt?['结束日期须晚于开始日期。']:[]),
 ];
 const nextStep=()=>{
  const nextErrors=step===0?basicErrors():step===1?(!draft.abilityIds.length?['至少选择一项能力目标。']:!draft.knowledgeIds.length?['至少选择一个知识点。']:[]):step===2?[...validateVersion(draft,catalog),...(draft.rules.threshold===''?['请填写达标阈值。']:[]),...(Math.abs(assessmentTotal-100)>.01?['考核权重需合计100%。']:[])]:[];
  if(nextErrors.length){setErrors(nextErrors);return;}setErrors([]);setStep(step+1);
 };
 const editRoster=text=>{setRosterText(text);setRosterErrors([]);setRosterImported(false);update({students:[]});};
 const importRoster=()=>{
  const parsed=parseRoster(rosterText);setRosterErrors(parsed.errors);
  if(parsed.errors.length){setRosterImported(false);update({students:[]});return;}
  update({students:parsed.students});setRosterImported(true);
 };
 const uploadRoster=async event=>{
  const file=event.target.files?.[0];if(!file)return;
  editRoster('');
  try{const text=await file.text();editRoster(text);const parsed=parseRoster(text);setRosterErrors(parsed.errors);if(!parsed.errors.length){update({students:parsed.students});setRosterImported(true);}}
  catch(error){setRosterErrors([`无法读取名单文件：${error.message || '请重新选择CSV文件'}`]);}
  event.target.value='';
 };
 const submit=async event=>{
  event?.preventDefault();if(saving||!mode)return;
  if(mode==='custom'&&step<3){nextStep();return;}
  let nextErrors=basicErrors();
  if(draft.rules.threshold==='')nextErrors.push('请填写达标阈值。');
  if(mode==='copy'&&!baseVersion)nextErrors.push('请选择要复制的版本。');
  if(mode==='custom'&&(rosterErrors.length||(rosterText.trim()&&!rosterImported)))nextErrors.push('请先解析导入名单并修正所有错误，或清空名单。');
  if(nextErrors.length){setErrors(nextErrors);return;}
  try{
   const nextDraft={...draft,copyStudents,students:mode==='copy'?(copyStudents?structuredClone(baseVersion.students):[]):draft.students};
   const version=createVersion({mode,baseVersion:mode==='copy'?baseVersion:undefined,draft:nextDraft,catalog});
   nextErrors=validateVersion(version,catalog);if(nextErrors.length){setErrors(nextErrors);return;}
   setSaving(true);setErrors([]);await onCreate(version);
  }catch(error){setErrors([error.message || '版本未保存，请重试。已保留当前填写内容。']);}
  finally{setSaving(false);}
 };
 const basicFields=<div className="vc-fields">
  <label>版本名称 <span>*</span><input required autoComplete="off" aria-label="版本名称" placeholder="如：2026秋季 · 实训提升班" value={draft.name} onChange={event=>editMetadata('name',event.target.value)}/></label>
  <label>版本号 <span>*</span><input required autoComplete="off" aria-label="版本号" placeholder="如：V1.0" value={draft.versionLabel} onChange={event=>editMetadata('versionLabel',event.target.value)}/></label>
  <label className="vc-field-wide">学期 <span>*</span><input required aria-label="版本学期" value={draft.semester} onChange={event=>update({semester:event.target.value})}/></label>
  <label>开始日期 <span>*</span><input required type="date" aria-label="版本开始日期" value={draft.startAt} onChange={event=>update({startAt:event.target.value})}/></label>
  <label>结束日期 <span>*</span><input required type="date" aria-label="版本结束日期" min={draft.startAt} value={draft.endAt} onChange={event=>update({endAt:event.target.value})}/></label>
 </div>;
 const mappingPreview=<details className="vc-mappings"><summary><Icon name="tree" size={16}/>查看能力 → 知识 → 考核匹配（{mappings.length}项）</summary><div className="vc-mapping-list">{mappings.map(mapping=>{
  const ability=catalog.abilities.find(item=>item.id===mapping.abilityId);
  const module=catalog.modules.find(item=>item.id===mapping.moduleId);
  return <article key={mapping.abilityId}><strong>{ability?.title || mapping.abilityId}</strong><span>{module?.title || '模块未关联'} · {mapping.abilityId}</span><p>知识：{mapping.knowledgeIds.map(id=>knowledgeById.get(id)?.title || id).join('、') || '未关联'}</p><p>考核：{mapping.questionIds.map(id=>questionById.get(id)?.title || id).join('、') || '未关联'}</p></article>;
 })}</div></details>;
 return <div className="vc-overlay" onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className="vc-dialog" role="dialog" aria-modal="true" aria-labelledby="vc-title" tabIndex={-1} ref={dialog}>
   <header className="vc-header"><div><span className="vc-eyebrow">COURSE VERSION</span><h2 id="vc-title">创建课程版本</h2><p>独立配置教学安排，持续观察能力达成。</p></div><button type="button" className="vc-icon-button" aria-label="关闭创建版本" onClick={onClose}><Icon name="close" size={22}/></button></header>
   <form className="vc-form" noValidate onSubmit={submit}>
    <div className="vc-body">
     {!mode?<><div className="vc-mode-intro"><Icon name="classroom" size={30}/><div><h3>从适合的方式开始</h3><p>每个版本拥有独立名单、考核规则与评价记录。</p></div></div><div className="vc-mode-grid">{modes.map(item=><button key={item.id} type="button" className="vc-mode-card" onClick={()=>chooseMode(item.id)} disabled={item.id==='copy'&&!versions.length}><span className="vc-mode-icon"><Icon name={item.icon} size={25}/></span><strong>{item.title}</strong><p>{item.description}</p><span className="vc-mode-action">{item.id==='copy'&&!versions.length?'暂无可复制版本':'开始创建'}<Icon name="arrow" size={16}/></span></button>)}</div><p className="vc-source-note">教学模拟题与本地原型配置会明确标注；导入名单保持未评价。</p></>:<>
      <div className="vc-selected-mode"><span><Icon name={modes.find(item=>item.id===mode).icon}/>{modes.find(item=>item.id===mode).title}</span><button type="button" onClick={()=>{setMode(null);setErrors([]);}}>更换创建方式</button></div>
      {mode==='custom'&&<ol className="vc-steps" aria-label="自定义创建步骤">{steps.map((title,index)=><li key={title} className={step===index?'active':step>index?'complete':''} aria-current={step===index?'step':undefined}><span>{step>index?<Icon name="check" size={13}/>:index+1}</span>{title}</li>)}</ol>}
      {(mode!=='custom'||step===0)&&<><h3 className="vc-section-title">基本信息</h3>{basicFields}</>}
      {mode==='quick'&&<div className="vc-quick-summary"><Icon name="sparkle" size={24}/><div><strong>全课程配置已就绪</strong><p>{draft.abilityIds.length}项能力 · {draft.knowledgeIds.length}个知识点 · {draft.questionIds.length}道教学模拟题</p><p>权重均分 · 达标阈值60% · 缺失成绩排除 · 空学生名单</p></div></div>}
      {mode==='copy'&&<div className="vc-copy-panel"><label>复制来源<select aria-label="复制来源版本" value={baseId} onChange={event=>{setBaseId(event.target.value);copyConfiguration(versions.find(item=>item.id===event.target.value));}}>{versions.map(item=><option key={item.id} value={item.id}>{item.name} · {item.versionLabel}</option>)}</select></label>{baseVersion&&<><p>{baseVersion.abilityIds.length}项能力 · {baseVersion.knowledgeIds.length}个知识点 · {baseVersion.questionIds.length}道考核题</p><label className="vc-check"><input type="checkbox" checked={copyStudents} onChange={event=>setCopyStudents(event.target.checked)}/>同时复制学生名单（{baseVersion.students.length}人）</label><div className="vc-notice"><Icon name="info" size={17}/><span>仅复用配置与所选名单，成绩记录始终为空；智能体与指令会生成独立ID。</span></div></>}</div>}
      {mode==='custom'&&step===1&&<><div className="vc-section-heading"><h3>选择能力目标</h3><button type="button" onClick={()=>{const defaults=initialDraft(catalog);update({abilityIds:defaults.abilityIds,knowledgeIds:defaults.knowledgeIds,questionIds:defaults.questionIds,abilityWeights:defaults.abilityWeights,assessmentWeights:defaults.assessmentWeights});}}>选择全课程</button></div><p className="vc-help">按显式ID自动关联知识和教学模拟题，可继续调整知识范围。</p><div className="vc-module-grid">{catalog.modules.map(module=><fieldset key={module.id}><legend>{module.title}</legend>{catalog.abilities.filter(ability=>ability.moduleId===module.id).map(ability=><label className="vc-check" key={ability.id}><input type="checkbox" checked={draft.abilityIds.includes(ability.id)} onChange={()=>toggleAbility(ability.id)}/><span>{ability.title}<small>{ability.code || ability.id}</small></span></label>)}</fieldset>)}</div><h3 className="vc-section-title">关联知识点 · {draft.knowledgeIds.length}个</h3><div className="vc-knowledge-grid">{catalog.knowledge.map(item=><label className="vc-check" key={item.id}><input type="checkbox" checked={draft.knowledgeIds.includes(item.id)} onChange={()=>toggleKnowledge(item.id)}/>{item.title}</label>)}</div>{mappingPreview}</>}
      {mode==='custom'&&step===2&&<><div className="vc-notice"><Icon name="info" size={17}/><span>以下题目均为教学模拟题；选择题目不会生成学生成绩。</span></div><div className="vc-section-heading"><h3>考核题目与权重</h3><button type="button" onClick={()=>update({assessmentWeights:equalWeights(draft.questionIds)})}>均分考核权重</button></div><div className="vc-total" data-valid={Math.abs(assessmentTotal-100)<.01}>已选{draft.questionIds.length}题 · 权重合计 {assessmentTotal.toFixed(2)}%</div><div className="vc-question-list">{eligibleQuestions.map(question=><article key={question.id}><label className="vc-check"><input type="checkbox" checked={draft.questionIds.includes(question.id)} onChange={()=>toggleQuestion(question.id)}/><strong>{question.title}</strong></label><p>{question.stem}</p><span className="vc-question-meta">教学模拟 · {question.kind} · 满分{question.maxScore}分 · {question.id}</span>{draft.questionIds.includes(question.id)&&<label className="vc-weight">考核权重<input aria-label={`${question.title}考核权重`} type="number" min="0.01" max="100" step="0.01" value={draft.assessmentWeights[question.id] ?? ''} onChange={event=>update({assessmentWeights:{...draft.assessmentWeights,[question.id]:event.target.value===''?'':Number(event.target.value)}})}/>%</label>}</article>)}</div><div className="vc-section-heading"><h3>能力权重</h3><button type="button" onClick={()=>update({abilityWeights:equalWeights(draft.abilityIds)})}>均分能力权重</button></div><div className="vc-total" data-valid={Math.abs(abilityTotal-100)<.01}>能力权重合计 {abilityTotal.toFixed(2)}%</div><div className="vc-weight-list">{catalog.abilities.filter(item=>draft.abilityIds.includes(item.id)).map(item=><label key={item.id}><span>{item.title}</span><input aria-label={`${item.title}能力权重`} type="number" min="0.01" max="100" step="0.01" value={draft.abilityWeights[item.id] ?? ''} onChange={event=>update({abilityWeights:{...draft.abilityWeights,[item.id]:event.target.value===''?'':Number(event.target.value)}})}/><span>%</span></label>)}</div><h3 className="vc-section-title">达成规则</h3><div className="vc-fields"><label>达标阈值（%）<input aria-label="达标阈值" type="number" min="0" max="100" value={draft.rules.threshold} onChange={event=>update({rules:{...draft.rules,threshold:event.target.value===''?'':Number(event.target.value)}})}/></label><label>缺失成绩<select aria-label="缺失成绩处理" value={draft.rules.missing} onChange={event=>update({rules:{...draft.rules,missing:event.target.value}})}><option value="exclude">排除未评价项</option><option value="zero">缺失项计0分</option></select></label><label className="vc-field-wide">聚合方式<select aria-label="能力聚合方式" value={draft.rules.aggregation} onChange={event=>update({rules:{...draft.rules,aggregation:event.target.value}})}><option value="weighted">按权重加权平均</option><option value="minimum">取最低达成值</option></select></label></div>{mappingPreview}</>}
      {mode==='custom'&&step===3&&<><div className="vc-section-heading"><h3>学生名单</h3><span>{draft.students.length}人</span></div><p className="vc-help">选填，可创建空班级。支持UTF-8 CSV或粘贴表格，必填学号、姓名；选填院系、班级。学号重复或行内容有误须全部修正后导入。</p><div className="vc-roster-tools"><input hidden type="file" accept=".csv,text/csv,text/plain" ref={fileInput} onChange={uploadRoster}/><button type="button" className="vc-secondary" onClick={()=>fileInput.current.click()}><Icon name="cloud" size={17}/>上传CSV</button><button type="button" className="vc-text-button" onClick={()=>editRoster('')}>清空名单</button></div><label className="vc-roster-label">粘贴名单<textarea aria-label="粘贴学生名单" rows={6} placeholder={'学号,姓名,院系,班级\n2026001,张同学,智能制造学院,实训一班'} value={rosterText} onChange={event=>editRoster(event.target.value)}/></label><button type="button" className="vc-secondary" disabled={!rosterText.trim()} onClick={importRoster}>解析并导入名单</button>{rosterErrors.length>0&&<div className="vc-errors" role="alert"><strong>名单未导入</strong><ul>{rosterErrors.map((error,index)=><li key={index}>{error}</li>)}</ul></div>}{rosterImported&&<div className="vc-roster-preview"><strong><Icon name="check" size={17}/>已解析{draft.students.length}人 · 全部未评价</strong><div className="vc-table-scroll"><table><thead><tr><th>学号</th><th>姓名</th><th>院系</th><th>班级</th></tr></thead><tbody>{draft.students.map(student=><tr key={student.studentNo}><td>{student.studentNo}</td><td>{student.name}</td><td>{student.department || '—'}</td><td>{student.className || '—'}</td></tr>)}</tbody></table></div></div>}<div className="vc-notice"><Icon name="info" size={17}/><span>仅导入名单，评价记录为空。创建后可在版本设置中调整配置。</span></div></>}
      {mode!=='custom'&&mappingPreview}
     </>}
     {errors.length>0&&<div className="vc-errors" role="alert"><strong>请检查以下内容</strong><ul>{errors.map((error,index)=><li key={index}>{error}</li>)}</ul></div>}
    </div>
    <footer className="vc-footer"><span>{mode==='custom'?`第${step+1}步 / 共4步`:mode?'配置独立保存至此浏览器':'选择一种方式开始创建'}</span><div><button type="button" className="vc-secondary" onClick={mode==='custom'&&step>0?()=>{setStep(step-1);setErrors([]);}:onClose}>{mode==='custom'&&step>0?'上一步':'取消'}</button>{mode&&(mode==='custom'&&step<3?<button key="vc-next-step" type="button" className="vc-primary" onClick={event=>{event.preventDefault();nextStep();}}>下一步<Icon name="arrow" size={16}/></button>:<button key="vc-create-version" type="submit" className="vc-primary" disabled={saving}>{saving?'正在保存…':'创建版本'}{!saving&&<Icon name="plus" size={17}/>}</button>)}</div></footer>
   </form>
  </section>
 </div>;
}
export default VersionCreateDialog;
