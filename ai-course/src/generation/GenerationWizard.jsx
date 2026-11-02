import {withJobTaskDemos} from './job-task-demos.mjs';
import {KnowledgeMatching} from './KnowledgeMatching';
import {applyKnowledgeMatches} from './knowledge-matching.mjs';
import {useKnowledgeEnabled} from '../knowledge/availability.mjs';
import {demoRolesForMajor} from './demo-roles.mjs';
import {cmsHref} from '../cms/config.mjs';
import {resolveCourseContext} from './major-context.mjs';
import { TextDescription } from '../components/TaskDescription';
import { useEffect, useMemo, useRef, useState } from 'react';
import { id } from '../project.mjs';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { catalog, gate, inputRole, defaultDesign, designError, generateProject } from './model.mjs';
import './generation.css';
import './framework-generation.css';
import frameworkOrb from './assets/framework-orb.gif?inline';
const generationMessages=[
 '正在拟定学习项目名称…',
 '正在将岗位能力要求转化为学习目标…',
 '正在梳理开展项目所需的基础知识与技能…',
 '正在提炼引导项目探究的核心问题…',
 '正在明确项目涉及的工作对象与材料…',
 '正在组织项目的主要工作内容…',
 '正在梳理项目所需的工具、方法与学习资源…',
 '正在设计小组协作方式与角色分工…',
 '正在明确项目需要交付的成果…',
 '正在梳理项目开展所需的环境与条件…',
 '正在设计学习支持与分层任务…',
 '正在制定成果质量与过程评价标准…',
 '正在设计拓展应用与进阶挑战…'
];
function FrameworkLoading({confirming=false,mode='append'}){
 const [phase,setPhase]=useState(0);
 useEffect(()=>{if(confirming)return;const timer=setInterval(()=>setPhase(value=>Math.min(value+1,generationMessages.length-1)),260);return()=>clearInterval(timer);},[confirming]);
 return <div className="gen-loading framework-loading" role="status" aria-live="polite"><img className="framework-loading-orb" src={frameworkOrb} width="100" height="100" alt=""/><strong className="framework-loading-message" key={phase}>{confirming?(mode==='replace'?'正在覆盖当前项目框架…':'正在追加项目阶段与任务…'):generationMessages[phase]}</strong></div>;
}
const readContext=courseId=>{try{return JSON.parse(localStorage.getItem('ai-course-context-v2:'+courseId))||{};}catch{return {};}};
export function LearningBrief({design,onChange}){
 const explanation=typeof design.explanation==='string'?design.explanation:[design.problem&&`核心问题：${design.problem}`, [design.learners,design.prerequisites].filter(Boolean).length&&`学情与先备条件：${[design.learners,design.prerequisites].filter(Boolean).join('；')}`, design.product&&`项目成果：${design.product}`].filter(Boolean).join('\n\n');
 return <div className="learning-brief">
  <TextDescription label="项目说明" placeholder="点击填写项目说明：说明核心问题、学情与先备条件，以及项目成果。" text={explanation.replaceAll('按制造实训场景编制的教学模拟数据','按制造实训场景编制的教学任务数据')} onChange={onChange}/>
 </div>;
}

export function LearningRelations({design}){
 if(!design)return null;
 const abilities=(design.abilities||[]).filter(ability=>ability.title?.trim());
 return <dl className="learning-relations" aria-label="任务关联信息">
  <div><dt>关联岗位</dt><dd>{design.role?.name||'未关联'}</dd></div>
  <div><dt>典型工作任务</dt><dd>{design.sourceTask?.title||'未关联'}</dd></div>
  <div className="learning-relations-abilities"><dt>能力项</dt><dd>{abilities.length?<ul>{abilities.map((ability,index)=><li key={ability.id||index}>{ability.category&&<span className="learning-ability-category">{ability.category}</span>}{ability.title}</li>)}</ul>:'未关联'}</dd></div>
 </dl>;
}

export function GenerationWizard({project,onClose,onCreate,courseName,courseId='local-course',courseMajor=null,cmsConfig=null,graph={nodes:[]},resources=[]}){
 const [step,setStep]=useState(0),[context]=useState(()=>resolveCourseContext({...(!courseMajor?{}:readContext(courseId)),planId:'',planMajor:'',planName:''},courseMajor));
 const [role,setRole]=useState(null),[task,setTask]=useState(null),[selected,setSelected]=useState([]),[query,setQuery]=useState(''),[manual,setManual]=useState(false);
 const [preview,setPreview]=useState(null),[loading,setLoading]=useState(''),[error,setError]=useState(''),[matchingBusy,setMatchingBusy]=useState(false);
 const [generationMode,setGenerationMode]=useState('append'),[confirmReplace,setConfirmReplace]=useState(false);
 const [confirmClose,setConfirmClose]=useState(false);
 const closeGuard=useRef({required:false,requested:false,deferred:null});
 closeGuard.current.required=!!loading||!!preview;
 const [matches,setMatches]=useState({}),[requestedMatchChoice,setMatchChoice]=useState(null);
 const knowledgeEnabled=useKnowledgeEnabled();
 const hasKnowledge=knowledgeEnabled&&graph.nodes.some(node=>node.level>1&&node.name?.trim());
 const matchChoice=hasKnowledge?(requestedMatchChoice||'yes'):'no';
 useEffect(()=>{setPreview(null);setMatches({});setMatchChoice(null);},[role,task,selected]);
 const [customRoles,setCustomRoles]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('ai-course-custom-roles-v1:'+courseId));return Array.isArray(saved)?saved.filter(r=>r?.id&&Array.isArray(r.tasks)):[];}catch{return [];}});
 const [adding,setAdding]=useState(false),[jobName,setJobName]=useState(''),[jobTasks,setJobTasks]=useState('');
 useEffect(()=>{try{localStorage.setItem('ai-course-custom-roles-v1:'+courseId,JSON.stringify(customRoles));}catch{}},[customRoles,courseId]);
 const status=gate(context);
 const matchedRoles=useMemo(()=>cmsConfig?.matchingMode==='job-name'?cmsConfig.matchedJobs.filter(job=>!cmsConfig.disabledJobIds.includes(job.id)).map(job=>withJobTaskDemos(job,context.major,customRoles.find(r=>r.id===job.id))):status.ready?[...catalog,...demoRolesForMajor(context.major)].filter(r=>r.major===context.major&&(!context.planId||r.planId===context.planId)):[],[context,cmsConfig,customRoles]);
 const recommendedRole=matchedRoles[0]||null;
 const roles=(manual?customRoles.filter(r=>!r.id.startsWith('major-job:')&&r.major===context.major):matchedRoles).filter(r=>r.name.includes(query.trim()));
 const abilities=task?.abilities.filter(a=>selected.includes(a.id))||[];
 const pick=r=>{setRole(r);setTask(null);setSelected([]);setError('');};
 const pickTask=t=>{if(task?.id===t.id)return;setTask(t);setSelected(t.abilities.map(a=>a.id));setError('');};
 const saveRole=r=>{setRole(r);if(r.origin!=='reference')setCustomRoles(items=>items.some(item=>item.id===r.id)?items.map(item=>item.id===r.id?r:item):[...items,r]);setError('');};
 const patchTask=changes=>{const updated={...task,...changes};setTask(updated);saveRole({...role,tasks:role.tasks.map(t=>t.id===updated.id?updated:t)});};
 const createCustom=()=>{try{const r=inputRole(context,jobName,jobTasks);setCustomRoles(items=>[...items,r]);pick(r);setAdding(false);setJobName('');setJobTasks('');}catch(e){setError(e.message);}};
 const pending=useRef(null),taskPicker=useRef(null),abilityPicker=useRef(null);
 useEffect(()=>()=>clearTimeout(pending.current),[]);
 const reject=(message,element)=>{setError(message);element?.focus({preventScroll:true});element?.scrollIntoView?.({block:'nearest',behavior:'smooth'});};
 const discard=()=>{clearTimeout(pending.current);pending.current=null;closeGuard.current.deferred=null;onClose();};
 const close=()=>{if(closeGuard.current.required){closeGuard.current.requested=true;setConfirmClose(true);}else discard();};
 const continueGeneration=()=>{closeGuard.current.requested=false;setConfirmClose(false);const resume=closeGuard.current.deferred;closeGuard.current.deferred=null;resume?.();};
 const transition=(message,action,delay)=>{if(pending.current!==null)return;setError('');setLoading(message);const finish=()=>{if(closeGuard.current.requested){closeGuard.current.deferred=finish;return;}try{action();}catch(e){setError(e.message);}finally{pending.current=null;setLoading('');}};pending.current=setTimeout(finish,delay);};
 const submit=()=>{if(pending.current!==null||matchingBusy)return;setConfirmReplace(false);transition('confirming',()=>onCreate(applyKnowledgeMatches(preview,matches,graph,resources,matchChoice==='yes'&&hasKnowledge),generationMode),500);};
 const next=()=>{
  if(pending.current!==null||matchingBusy)return;
  if(step===1){if(generationMode==='replace')setConfirmReplace(true);else submit();return;}
  if(!status.ready)return setError(status.error);
  if(!role)return setError('请先选择或添加一个岗位');
  if(!role.name.trim())return setError('请填写岗位名称');
  if(!task||!task.title.trim())return reject('请选择并填写一个典型工作任务',taskPicker.current);
  if(!abilities.length)return reject('请至少选择一项已有岗位能力；当前任务无能力项时，请选择其他任务',abilityPicker.current);
  if(abilities.some(a=>!a.title.trim()))return reject('已选能力缺少描述，请选择其他有效能力项',abilityPicker.current);
  if(preview){setStep(1);setError('');return;}
  const draft=defaultDesign(role,task,courseName),msg=designError(draft);if(msg)return setError(msg);
  transition('generating',()=>{const generated=generateProject({context,role,task,abilities,design:project?.drivingQuestion?.outline?{...draft,problem:project.drivingQuestion.outline}:draft,confirmed:true});generated.drivingQuestion=project?.drivingQuestion||{};generated.explanation=project?.explanation;setPreview(generated);setMatches({});setStep(1);},2100);
 };
 const busy=!!loading||matchingBusy;
 return <><div style={{display:'contents'}} inert={confirmReplace||confirmClose||undefined}><Modal title="生成项目框架" wide className="generation-modal framework-generation-modal" onClose={close} footer={!loading&&<>{error&&<p className="form-error gen-footer-error" role="alert">{error}</p>}{step===1&&<button className="framework-back" disabled={busy} onClick={()=>{setStep(0);setError('');}}>上一步</button>}{step===1&&<label className="framework-overwrite-toggle" title="关闭时追加新任务；开启后覆盖原有任务"><input type="checkbox" role="switch" aria-label="覆盖原有任务" checked={generationMode==='replace'} disabled={busy} onChange={event=>setGenerationMode(event.target.checked?'replace':'append')}/><span className="framework-toggle-track" aria-hidden="true"><span/></span><span>覆盖原有任务</span></label>}<button className="outlined" disabled={busy} onClick={close}>取消</button><button className="primary" disabled={busy||(step===0&&(!status.ready||!role||!task||!abilities.length||abilities.some(a=>!a.title.trim())))} onClick={next}>{step===0?'下一步：生成项目框架':'确认生成'}</button></>}>
 {loading?<FrameworkLoading confirming={loading==='confirming'} mode={generationMode}/>:step===1&&preview?<>
  <div className="framework-summary"><span>岗位任务</span><strong>{task.title}</strong><span className="framework-summary-count">{preview.stages.length} 个项目阶段 · {preview.stages.reduce((sum,stage)=>sum+stage.tasks.length,0)} 个任务</span></div>
  <KnowledgeMatching project={preview} graph={graph} enabled={knowledgeEnabled} choice={matchChoice} onChoice={setMatchChoice} selections={matches} onSelections={setMatches} onBusyChange={setMatchingBusy}/>
 </>:<>
  <div className="framework-major">{courseMajor?.code?<><span>关联专业</span><strong aria-label="课程已关联专业">{context.majorName}</strong><small>已关联</small></>:<div className="gen-empty">课程尚未关联专业，<a href={cmsHref(cmsConfig||{major:null})}>前往关联专业</a></div>}</div>
  <div className={`framework-selection-layout ${task?'has-task':role?'has-role':'jobs-only'}`}>
   <section className="framework-selection-column gen-role-picker" aria-label="选择岗位">
    <h3>选择岗位</h3>
    <div className="framework-job-search"><Icon name="search" size={18}/><input aria-label="搜索岗位" placeholder="搜索岗位" value={query} onChange={event=>setQuery(event.target.value)}/></div>

    {manual&&<div className="gen-custom-heading"><button className="framework-add-role" onClick={()=>{setAdding(true);setError('');}}><Icon name="plus" size={14}/>添加岗位</button></div>}
    {adding&&<div className="gen-manual"><h4>添加自定义岗位</h4><label>岗位名称<input aria-label="新增岗位名称" value={jobName} onChange={event=>setJobName(event.target.value)}/></label><label>典型工作任务<textarea aria-label="新增典型工作任务" rows={3} placeholder="每行填写一个典型工作任务" value={jobTasks} onChange={event=>setJobTasks(event.target.value)}/></label><div className="gen-custom-actions"><button className="outlined" onClick={()=>setAdding(false)}>取消添加</button><button className="primary" disabled={!jobName.trim()||!jobTasks.trim()} onClick={createCustom}>保存岗位</button></div></div>}
    <div className="gen-role-list">{roles.map(r=><button className={role?.id===r.id?'selected':''} aria-pressed={role?.id===r.id} key={r.id} onClick={()=>{if(role?.id!==r.id)pick(r);}}><Icon name="ai" size={18} weight="fill"/><strong>{r.name||'未命名岗位'}</strong>{!manual&&r.id===recommendedRole?.id&&<span className="gen-recommended-badge">推荐</span>}</button>)}{!roles.length&&!adding&&<div className="gen-empty">{manual?'暂无自定义岗位，点击“添加岗位”开始填写。':'没有找到相应岗位，可更换关键词或添加自定义岗位。'}</div>}</div>
    <div className="gen-mode">{[[false,'选择产业岗位'],[true,'自定义岗位']].map(([value,label])=><button key={label} className={manual===value?'active':''} onClick={()=>{if(manual===value)return;setManual(value);setAdding(false);setQuery('');setError('');setRole(null);setTask(null);setSelected([]);}}>{label}</button>)}</div>
   </section>
   {role&&<section className="framework-selection-column gen-task-picker" ref={taskPicker} tabIndex={-1} aria-label="选择典型工作任务">
    <div className="gen-task-heading"><h3>选择岗位典型工作任务</h3>{role&&(manual||cmsConfig?.matchingMode==='job-name')&&<button className="gen-add-ability" aria-label="添加典型工作任务" onClick={()=>{const t={id:id(),title:'',description:'',abilities:[]};saveRole({...role,tasks:[...role.tasks,t]});pickTask(t);}}><Icon name="plus" size={14}/></button>}</div>
    {manual&&role&&<label className="gen-role-edit">岗位名称<input aria-label="编辑岗位名称" value={role.name} onChange={event=>saveRole({...role,name:event.target.value})}/></label>}
    <div className="gen-task-options" role="radiogroup" aria-label="典型工作任务">{role?.tasks.map((t,index)=><label key={t.id} className={task?.id===t.id?'selected':''}><input type="radio" name="typical-work-task" checked={task?.id===t.id} onChange={()=>pickTask(t)}/><span className="framework-task-number">{String(index+1).padStart(2,'0')}·</span>{!t.abilities.length&&task?.id===t.id?<input aria-label="编辑典型工作任务" placeholder="请输入典型工作任务" value={t.title} onChange={event=>patchTask({title:event.target.value})}/>:<strong>{t.title||'未命名典型工作任务'}</strong>}</label>)}</div>
    {!role&&<p className="framework-column-empty">请先选择岗位</p>}{role&&!role.tasks.length&&<p className="framework-column-empty">暂无典型工作任务，请添加后继续。</p>}
   </section>}
   {task&&<section className="framework-selection-column gen-task-source" ref={abilityPicker} tabIndex={-1} aria-label="选择能力项"><h3>选择能力项</h3>
    {task?['知识','技能','素养'].map(category=><div key={category} className="gen-abilities"><h4>{category} · {task.abilities.filter(a=>a.category===category).length} 项</h4>{task.abilities.filter(a=>a.category===category).map((ability,index)=><label className="gen-ability" key={ability.id}><input type="checkbox" aria-label={`选择${category}第${index+1}项`} checked={selected.includes(ability.id)} onChange={event=>{const checked=event.target.checked;setSelected(values=>checked?[...values,ability.id]:values.filter(value=>value!==ability.id));setError('');}}/><span className="gen-ability-content">{ability.title}</span></label>)}{!task.abilities.some(a=>a.category===category)&&<p className="framework-column-empty">暂无已有{category}项</p>}</div>):<p className="framework-column-empty">请选择典型工作任务，查看对应能力项。</p>}
   </section>}
  </div>
 </>}
 </Modal></div>
 {confirmClose&&<Modal title="确认关闭生成？" className="framework-replace-confirm framework-close-confirm" onClose={continueGeneration} footer={<><button className="outlined" onClick={continueGeneration}>{loading?'继续生成':'继续编辑'}</button><button className="danger" onClick={discard}>确认关闭</button></>}>
  <div className="framework-replace-warning" role="alert"><Icon name="info" size={28}/><div><strong>关闭后不会保存本次生成的任务</strong><p>本次生成的任务及相关配置将被丢弃，当前项目已保存的内容不受影响。</p></div></div>
 </Modal>}
 {confirmReplace&&<Modal title="确认覆盖项目框架？" className="framework-replace-confirm" onClose={()=>setConfirmReplace(false)} footer={<><button className="outlined" onClick={()=>setConfirmReplace(false)}>取消覆盖</button><button className="danger" onClick={submit}>确认覆盖</button></>}>
  <div className="framework-replace-warning" role="alert"><Icon name="info" size={28}/><div><strong>原有任务将被替换，且无法恢复</strong><p>覆盖后，当前项目的原有阶段、任务及任务内容和配置将被本次生成结果替换。请确认已保留需要的内容。</p></div></div>
 </Modal>}
 </>;
}
