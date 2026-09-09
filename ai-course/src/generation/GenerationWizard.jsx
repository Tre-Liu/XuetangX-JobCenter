import {KnowledgeMatching} from './KnowledgeMatching';
import {applyKnowledgeMatches,suggestKnowledgeMatches} from './knowledge-matching.mjs';
import {useKnowledgeEnabled} from '../knowledge/availability.mjs';
import {demoRolesForMajor} from './demo-roles.mjs';
import {ConversationPrompt} from './Conversation';
import {chains,cmsHref} from '../cms/config.mjs';
import {resolveCourseContext} from './major-context.mjs';
import { TaskDescription, TextDescription } from '../components/TaskDescription';
import { JobCompetencyMap } from './JobCompetencyMap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { id } from '../project.mjs';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { catalog, gate, inputRole, draftCourseRole, draftRole, defaultDesign, designError, generateProject } from './model.mjs';
import './generation.css';
const steps=['课程关联','岗位与任务','教学化转化','知识点匹配','审阅项目'];
const prompts=[
 '先确认课程已关联的**专业**。\n\n专业信息已从课程 CMS 带入，确认后即可继续。',
 '接下来，确定本项目的**岗位、典型工作任务与能力项**。\n\n1. **选择岗位**：从产业岗位中选择，也可以自定义岗位。\n2. **选择典型工作任务**：选择该岗位下的一个任务。\n3. **勾选能力项**：确定本项目需要培养的知识、技能与素养。',
 '已根据岗位任务整理出**教学草稿**。\n\n请结合教学条件，完善学习目标、实施条件与成果要求，再生成项目预览。',
 '接下来，确认是否**匹配知识图谱中的相关知识点**。\n\n1. **匹配相关知识点**：逐任务查看并调整候选知识点。\n2. **暂不匹配**：先生成任务，之后再补充关联。\n\n所选内容会保留知识图谱关联，供项目学习与评价使用。',
 '项目草稿已整理完成。\n\n请检查各阶段和任务，确认后将**覆盖当前项目**。'
];
const readContext=courseId=>{try{return JSON.parse(localStorage.getItem('ai-course-context-v2:'+courseId))||{};}catch{return {};}};
export function LearningBrief({design,title,showGraph=true,onChange,cmsConfig}){
 return <div className="learning-brief"><TextDescription label="项目说明" placeholder="点击填写项目说明：说明核心问题、学情与先备条件，以及项目成果。" text={typeof design.explanation==='string'?design.explanation:[design.problem&&`核心问题：${design.problem}`, [design.learners,design.prerequisites].filter(Boolean).length&&`学情与先备条件：${[design.learners,design.prerequisites].filter(Boolean).join('；')}`, design.product&&`项目成果：${design.product}`].filter(Boolean).join('\n\n')} onChange={onChange}/>{showGraph&&<JobCompetencyMap cmsConfig={cmsConfig} key={`${design.role.id}-${design.sourceTask?.id}`} design={design} title={title}/>}<details className="learning-provenance"><summary>查看来源与教学设计</summary><div className="learning-provenance-body"><div className="learning-grid">{[['任务类型',design.taskType||'综合型'],['课程学习目标',design.courseGoal],['工作任务',design.sourceTask.title],['工作对象',design.object],['工作内容',design.content],['工具与资源',design.tools],['组织方式',design.organization],['学习环境',design.environment],['学习支持',design.scaffold],['验收标准',design.criteria],['迁移挑战',design.transfer]].map(([name,value])=><p key={name}><b>{name}</b>{value}</p>)}</div><p className="gen-source">{design.role.origin==='reference'?`${design.role.source.school} · ${design.role.source.file} · ${design.role.source.locator}；来源岗位：${design.role.originalRole}`:design.role.source?.note||'教师输入岗位 · 本地辅助草稿，需补充岗位调研证据'}</p><p className="gen-source">{design.review}。教学设计由本地规则转化，非在线 AI 结果。</p></div></details></div>;
}

export function GenerationWizard({onClose,onCreate,courseName,courseId='local-course',courseMajor=null,cmsConfig=null,graph={nodes:[]},resources=[]}){
 const [step,setStep]=useState(0),[context]=useState(()=>resolveCourseContext({...(!courseMajor?{}:readContext(courseId)),planId:'',planMajor:'',planName:''},courseMajor)),[role,setRole]=useState(null),[task,setTask]=useState(null),[selected,setSelected]=useState([]),[query,setQuery]=useState(''),[manual,setManual]=useState(false),[design,setDesign]=useState(null),[loading,setLoading]=useState(''),[error,setError]=useState('');
 const [revealedStep,setRevealedStep]=useState(null);
 const [preview,setPreview]=useState(null);
 const knowledgeEnabled=useKnowledgeEnabled();
 const [requestedMatchChoice,setMatchChoice]=useState(null),[matches,setMatches]=useState({});
 const hasKnowledge=knowledgeEnabled&&graph.nodes.some(node=>node.level>1);
 const matchChoice=hasKnowledge?requestedMatchChoice:'no';
 // A review draft is stable while editing or revisiting steps; new inputs invalidate it.
 useEffect(()=>{setPreview(null);setMatches({});setMatchChoice(null);},[role,task,selected,design]);
 const promptReady=revealedStep===step;
 const finishPrompt=useCallback(()=>setRevealedStep(step),[step]);
 const [customRoles,setCustomRoles]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('ai-course-custom-roles-v1:'+courseId));return Array.isArray(saved)?saved.filter(r=>r?.id&&Array.isArray(r.tasks)):[];}catch{return [];}});
 const [adding,setAdding]=useState(false),[generator,setGenerator]=useState(false),[jobName,setJobName]=useState(''),[jobTasks,setJobTasks]=useState(''),[name,setName]=useState(courseName||''),[direction,setDirection]=useState('');
 useEffect(()=>{try{localStorage.setItem('ai-course-custom-roles-v1:'+courseId,JSON.stringify(customRoles));}catch{}},[customRoles,courseId]);
 const saveRole=r=>{setRole(r);if(r.origin!=='reference')setCustomRoles(items=>items.map(item=>item.id===r.id?r:item));setDesign(null);setError('');};
 const resetSelection=()=>{setRole(null);setTask(null);setSelected([]);setDesign(null);setError('');};
 const customList=customRoles.filter(r=>r.major===context.major&&(!context.planId||r.planId===context.planId));
 const createCustom=()=>{try{const r=generator?draftCourseRole(context,name,direction):inputRole(context,jobName,jobTasks);setCustomRoles(items=>[...items,r]);pick(r);setAdding(false);setJobName('');setJobTasks('');}catch(e){setError(e.message);}};
 const patchTask=changes=>{const updated={...task,...changes};setTask(updated);saveRole({...role,tasks:role.tasks.map(t=>t.id===updated.id?updated:t)});};
 const status=gate(context);
 const matchedRoles=useMemo(()=>gate(context).ready?[...catalog,...demoRolesForMajor(context.major)].filter(r=>r.major===context.major&&(!context.planId||r.planId===context.planId)):[],[context]);
 const recommendedRole=matchedRoles[0]||null;
 const prompt=prompts[step]+(step===1&&recommendedRole?`\n4. 根据所选专业，推荐岗位：**${recommendedRole.name}**，可在下方切换其他岗位。`:'');
 const roles=matchedRoles.filter(r=>r.name.includes(query.trim()));
 const abilities=task?.abilities.filter(a=>selected.includes(a.id))||[];
 const pick=r=>{setRole(r);setTask(null);setSelected([]);setDesign(null);setError('');};
 const pickTask=t=>{if(task?.id===t.id)return;setTask(t);setSelected(t.abilities.map(a=>a.id));setDesign(null);setError('');};
 const patch=(key,value)=>{setDesign(d=>({...d,[key]:value}));};
 const updateAbilities=items=>{
  const updated={...task,abilities:items};
  setTask(updated);
  saveRole({...role,tasks:role.tasks.map(t=>t.id===updated.id?updated:t)});
  setError('');
 };
 const addAbility=category=>{
  const ability={id:id(),category,title:'',origin:'teacher-input',locator:'教师补充'};
  updateAbilities([...task.abilities,ability]);
  setSelected(ids=>[...ids,ability.id]);
 };
 const removeAbility=abilityId=>{
  updateAbilities(task.abilities.filter(a=>a.id!==abilityId));
  setSelected(ids=>ids.filter(value=>value!==abilityId));
 };

 const pending=useRef(null),workspace=useRef(null),current=useRef(null),taskPicker=useRef(null),abilityPicker=useRef(null);
 const reveal=element=>{element?.focus({preventScroll:true});element?.scrollIntoView?.({block:'start',behavior:'smooth'});};
 const reject=(message,element)=>{setError(message);reveal(element);};
 // The default role is selected before the streamed prompt mounts the task picker.
 // Wait for that section to appear, then guide the next selection into view.
 useEffect(()=>{
  if(step!==1||loading||!promptReady||!role)return;
  reveal(taskPicker.current);
 },[step,loading,promptReady,role?.id]);
 useEffect(()=>{if(step===1&&task)reveal(abilityPicker.current);},[task?.id]);
 useEffect(()=>()=>clearTimeout(pending.current),[]);
 useEffect(()=>{if(!loading)current.current?.scrollIntoView?.({block:'start',behavior:'smooth'});},[step,loading]);
 const transition=(message,action,delay=800)=>{
  if(pending.current!==null)return;
  setError('');setLoading(message);setRevealedStep(null);
  pending.current=setTimeout(()=>{
   try{action();}catch(e){setError(e.message);}
   finally{pending.current=null;setLoading('');}
  },delay);
 };
 const previous=()=>{
  if(pending.current!==null)return;
  if(!step)return onClose();
  transition(`正在返回${steps[step-1]}…`,()=>setStep(step-1),500);
 };
 const next=()=>{
  if(pending.current!==null)return;
  setError('');
  if(step===0){
   if(!status.ready)return setError(status.error);
   transition('正在整理课程关联与参考岗位…',()=>{
    try{localStorage.setItem('ai-course-context-v2:'+courseId,JSON.stringify(context));}catch{}
    if(!role&&!manual&&recommendedRole)pick(recommendedRole);
    setStep(1);
   });
  }else if(step===1){
   if(!role)return setError('请先选择或添加一个岗位');
   if(!role.name.trim())return setError('请填写岗位名称');
   if(!task||!task.title.trim())return reject('请选择并填写一个典型工作任务',taskPicker.current);
   if(!abilities.length)return reject('请至少选择一项岗位能力',abilityPicker.current);
   if(abilities.some(a=>!a.title.trim()))return reject('请补全已选能力的描述',abilityPicker.current);
   transition('正在整理工作任务与能力，准备教学化转化…',()=>{
    setDesign(d=>d||defaultDesign(role,task,courseName));setStep(2);
   });
  }else if(step===2){
   const msg=designError(design);if(msg)return setError(msg);
   transition('正在生成项目阶段与学习任务预览…',()=>{if(!preview){const generated=generateProject({context,role,task,abilities,design,confirmed:true});setPreview(generated);setMatches(suggestKnowledgeMatches(generated,graph));}setStep(3);},1000);
  }else if(step===3){
   if(!matchChoice)return setError('请选择是否匹配相关知识点');
   if(matchChoice==='yes'&&!knowledgeEnabled)return setError('当前暂无可用知识点，请选择暂不匹配');
   transition('正在整理知识点关联…',()=>{setPreview(p=>applyKnowledgeMatches(p,matches,graph,resources,matchChoice==='yes'&&knowledgeEnabled));setStep(4);});
  }else{
   transition('正在覆盖当前项目…',()=>onCreate(applyKnowledgeMatches(preview,matches,graph,resources,matchChoice==='yes'&&knowledgeEnabled)));
  }
 };
 const editReviewTask=(stageId,taskId,description)=>setPreview(p=>({...p,stages:p.stages.map(s=>s.id===stageId?{...s,tasks:s.tasks.map(t=>t.id===taskId?{...t,description}:t)}:s)}));
 return <Modal title="从岗位工作任务生成学习项目" wide className="generation-modal conversation-modal" onClose={onClose} footer={<>{error&&<p className="form-error gen-footer-error" role="alert">{error}</p>}{step===4&&<span className="gen-footer-note">生成结果将覆盖当前项目数据，可继续编辑</span>}<button className="outlined" disabled={!!loading} onClick={previous}>{step?'上一步':'取消'}</button><button className="primary" disabled={!!loading||!promptReady||(step===0&&!status.ready)} onClick={next}>{loading?'处理中…':step===4?'确认并覆盖当前项目':'确认'}<Icon name="check" size={16}/></button></>}>
 <div className="gen-stepper" aria-label="项目生成步骤">{steps.map((s,i)=><div key={s} aria-current={i===step?'step':undefined} className={i===step?'current':i<step?'done':''}><span>{i<step?'✓':`0${i+1}`}</span>{s}</div>)}</div>
 <div className={`gen-workspace conversation-workspace${loading?' is-loading':''}`} ref={workspace} aria-busy={!!loading}>

 <section className="gen-main">
 {!loading&&<div ref={current} className={step===1?'gen-role-prompt':undefined}><ConversationPrompt key={step} onComplete={finishPrompt}>{prompt}</ConversationPrompt></div>}
 {(loading||promptReady)&&<div className="conversation-input-card">{loading?<div className="gen-loading" role="status" aria-live="polite"><span className="gen-loading-spinner" aria-hidden="true"/><strong>{loading}</strong><p>请稍候，即将完成</p></div>:<>
 {step===0&&<><div className="gen-section-title"><div><h3>关联课程信息</h3><p>{courseMajor?.code?'沿用 AI 课已关联的专业筛选参考岗位。':'当前课程尚未关联专业，请前往课程 CMS 配置。'}</p></div><span className={`gen-status ${status.ready?'ready':''}`}>{status.ready?'可继续':context.major?'请调整关联':'请选择专业'}</span></div>
 {cmsConfig&&<div className="conversation-context">产教模型已开启 · {chains.filter(chain=>cmsConfig.chainIds.includes(chain.id)).map(chain=>chain.name).join("、")}</div>}
 <div className="gen-checks">{status.checks.map(s=><div key={s.name}><span className={s.ok?'passed':''}>{s.ok?'✓':'—'}</span><div><strong>{s.name}</strong><p>{s.detail}</p></div></div>)}</div>
 <div className="gen-notice">{courseMajor?.code?'专业来自课程 CMS 配置，此处不可更改。':'在课程 CMS 配置专业后才可继续。'}</div>
 <div className="gen-form-grid gen-context-grid">
 {courseMajor?.code?<label className="span-2">课程已关联专业<input aria-label="课程已关联专业" disabled value={`${context.major} · ${context.majorName}`}/><small className="major-path">已关联 · 不可更改</small></label>:<div className="gen-empty">课程尚未配置专业，<a href={cmsHref(cmsConfig||{major:null})}>前往课程 CMS 配置</a></div>}
 </div></>}
 {step===1&&<><div className="gen-section-title"><div><h3>选择岗位、典型工作任务与能力项</h3><p>先选择岗位，再选其中一个典型工作任务，最后勾选本项目需要的能力项。</p></div></div>
 <section className="gen-substep gen-role-picker" aria-label="选择岗位"><div className="gen-mode">{[[false,'选择产业岗位'],[true,'自定义岗位']].map(([value,label])=><button key={label} className={manual===value?'active':''} onClick={()=>{if(manual===value)return;setManual(value);setAdding(false);if(!value&&recommendedRole)pick(recommendedRole);else resetSelection();}}>{label}</button>)}</div>
 <h4 className="gen-pick-heading"><span>1</span>选择岗位</h4>
 {!manual?<><input aria-label="搜索岗位" className="gen-search" placeholder="搜索产业岗位" value={query} onChange={e=>setQuery(e.target.value)}/><div className="gen-role-list">{roles.map(r=><button className={role?.id===r.id?'selected':''} aria-pressed={role?.id===r.id} key={r.id} onClick={()=>{if(role?.id!==r.id)pick(r);}}><Icon name="users"/><strong>{r.name}</strong>{r.id===recommendedRole?.id&&<span className="gen-recommended-badge">推荐</span>}<small>{r.tasks.length} 个典型工作任务 · {r.origin==='simulation'?'模拟数据':'人培参考'}</small></button>)}{!roles.length&&<div className="gen-empty"><strong>没有找到相应岗位</strong><p>可换一个关键词，或到“自定义岗位”中自主添加岗位。</p><button className="outlined" onClick={()=>{setManual(true);resetSelection();}}>自定义岗位</button></div>}</div></>:<>
 <div className="gen-custom-heading"><p>自主添加岗位及典型工作任务，保存后可再次选择。</p><button className="outlined" onClick={()=>{setAdding(true);setGenerator(false);setError('');}}><Icon name="plus" size={16}/>添加岗位</button></div>
 {adding&&<div className="gen-manual">
 <div className="gen-section-title"><h4>{generator?'辅助生成岗位':'添加自定义岗位'}</h4><button className="gen-add-ability" onClick={()=>{setGenerator(v=>!v);setError('');}}>{generator?'返回自主填写':'辅助生成岗位'}</button></div>
 {generator?<><div className="gen-form-grid"><label>课程名称<input aria-label="课程名称" value={name} onChange={e=>setName(e.target.value)}/></label><label>工作方向<input aria-label="工作方向" value={direction} placeholder="如：工业视觉检测" onChange={e=>setDirection(e.target.value)}/></label></div><p className="gen-source">生成岗位名称、典型工作任务及能力草稿，保存后可修改。当前为本地规则辅助，尚未接入在线 AI。</p></>:<div className="gen-form-grid"><label className="span-2">岗位名称<input aria-label="新增岗位名称" value={jobName} placeholder="如：视觉检测技术员" onChange={e=>setJobName(e.target.value)}/></label><label className="span-2">典型工作任务<textarea aria-label="新增典型工作任务" rows={3} value={jobTasks} placeholder={'每行填写一个典型工作任务，例如：\n检测样本采集与标注\n零件表面缺陷检测'} onChange={e=>setJobTasks(e.target.value)}/></label></div>}
 <div className="gen-custom-actions"><button className="outlined" onClick={()=>setAdding(false)}>取消添加</button><button className="primary" disabled={generator?(!name.trim()||!direction.trim()):(!jobName.trim()||!jobTasks.trim())} onClick={createCustom}>{generator?'生成并添加岗位':'保存岗位'}</button></div>
 </div>}
 <div className="gen-role-list">{customList.map(r=><button className={role?.id===r.id?'selected':''} key={r.id} onClick={()=>{if(role?.id!==r.id)pick(r);}}><Icon name="users"/><strong>{r.name||'未命名岗位'}</strong><small>{r.tasks.length} 个典型工作任务 · {r.origin==='teacher-input'?'自主填写':'辅助草稿'}</small></button>)}{!customList.length&&!adding&&<div className="gen-empty">暂无自定义岗位，点击“添加岗位”开始填写。</div>}</div>
 </>}</section>
 {role&&<div className="gen-task-picker gen-substep" ref={taskPicker} tabIndex={-1} aria-label="选择典型工作任务">
 {manual&&<label className="gen-role-edit">岗位名称<input aria-label="编辑岗位名称" value={role.name} onChange={e=>saveRole({...role,name:e.target.value})}/></label>}
 <div className="gen-task-heading"><h4 className="gen-pick-heading"><span>2</span>选择一个典型工作任务</h4>{manual&&<button className="gen-add-ability" onClick={()=>{const t={id:id(),title:'',description:'',abilities:[]};saveRole({...role,tasks:[...role.tasks,t]});pickTask(t);}}><Icon name="plus" size={14}/>添加典型工作任务</button>}</div>
 <div className="gen-task-options" role="radiogroup" aria-label="典型工作任务">{role.tasks.map(t=><label key={t.id} className={task?.id===t.id?'selected':''}><input type="radio" name="typical-work-task" checked={task?.id===t.id} onChange={()=>pickTask(t)}/><strong>{t.title||'未命名典型工作任务'}</strong><small>{t.abilities.length} 项能力</small></label>)}</div>
 {!task&&<p className="gen-source">请选择一个典型工作任务，查看并选择其能力项。</p>}
 </div>}
 {task&&<div className="gen-task-source gen-substep" ref={abilityPicker} tabIndex={-1} aria-label="选择能力项">
  <h4 className="gen-pick-heading"><span>3</span>选择能力项</h4>
  <div className="gen-section-title"><h4>{task.title||'请填写典型工作任务'}</h4></div>
  {role.origin==='simulation'&&<p className="gen-source">{role.source.note}</p>}
  {role.origin==='reference'&&<p className="gen-source">{`${role.source.school} · ${role.source.file} · ${role.source.locator}。来源岗位：${role.originalRole}。当前名称为历史匹配结果。`}</p>}
  {manual&&<><label className="gen-role-edit">典型工作任务名称<input aria-label="编辑典型工作任务" value={task.title} placeholder="请输入典型工作任务" onChange={e=>patchTask({title:e.target.value})}/></label><TextDescription text={task.description||''} onChange={description=>patchTask({description})}/>{!task.abilities.length&&<button className="outlined" disabled={!task.title.trim()||!role.name.trim()} onClick={()=>{const generated=draftRole(context,role.name,task.title).tasks[0].abilities;updateAbilities(generated);setSelected(generated.map(a=>a.id));}}>辅助生成能力项</button>}</>}
  {['知识','技能','素养'].map(c=><div key={c} className="gen-abilities">
   <div className="gen-abilities-heading"><h4>{c}<small>{task.abilities.filter(a=>a.category===c).length} 项</small></h4><button type="button" className="gen-add-ability" onClick={()=>addAbility(c)}><Icon name="plus" size={14}/>添加{c}</button></div>
   {task.abilities.filter(a=>a.category===c).map((a,i)=><div className="gen-ability" key={a.id}>
    <input type="checkbox" aria-label={`选择${c}第${i+1}项`} checked={selected.includes(a.id)} onChange={e=>{setSelected(ids=>e.target.checked?[...ids,a.id]:ids.filter(x=>x!==a.id));setDesign(null);setError('');}}/>
    {role.origin==='reference'&&a.origin!=='teacher-input'?<span className="gen-ability-content">{a.title}<small>{a.id} · {a.locator}</small></span>:<input className="gen-ability-content" aria-label={`${c}能力草稿`} placeholder={`请输入${c}能力描述`} autoFocus={a.origin==='teacher-input'} value={a.title} onChange={e=>updateAbilities(task.abilities.map(x=>x.id===a.id?{...x,title:e.target.value}:x))}/>}
    <button type="button" className="gen-remove-ability" aria-label={`删除${c}第${i+1}项`} onClick={()=>removeAbility(a.id)}>删除</button>
   </div>)}
   {!task.abilities.some(a=>a.category===c)&&<p className="gen-source">暂无{c}项，可点击“添加{c}”补充。</p>}
  </div>)}
  <div className="gen-selection">已选 {abilities.length} 项能力 · 将关联到学习活动与评价</div>
 </div>}</>}

 {step===2&&design&&<><div className="gen-section-title"><div><h3>{manual?'完善项目任务的教学设计':'把岗位要求转化为可学习的任务'}</h3><p>已自动填入教学草稿，请结合本班学情和实训条件调整。</p></div></div><div className="gen-conversion"><span>{task.title}</span><Icon name="arrow"/><strong>学习情境 + 核心问题 + 可评价成果</strong></div><div className="gen-form-grid"><label className="span-2">项目名称<input value={design.title} onChange={e=>patch('title',e.target.value)}/></label><label>课程学习目标<input value={design.courseGoal} onChange={e=>patch('courseGoal',e.target.value)}/></label><label className="span-2">先备知识与技能<input value={design.prerequisites} onChange={e=>patch('prerequisites',e.target.value)}/></label><label className="span-2">驱动学习的核心问题<textarea rows={2} value={design.problem} onChange={e=>patch('problem',e.target.value)}/></label></div><h4 className="gen-subtitle">重构工作六要素</h4><div className="gen-form-grid">{[['object','工作对象'],['content','工作内容'],['tools','工具、方法与资源'],['organization','组织与分工'],['product','产品 / 服务成果'],['environment','学习环境与实施条件']].map(([k,label])=><label key={k}>{label}<textarea rows={2} value={design[k]} onChange={e=>patch(k,e.target.value)}/></label>)}</div><h4 className="gen-subtitle">学习支持与评价</h4><div className="gen-form-grid">{[['scaffold','支持与难度调整'],['criteria','成果验收标准'],['transfer','迁移与挑战']].map(([k,label])=><label key={k} className={k==='transfer'?'span-2':''}>{label}<textarea rows={2} value={design[k]} onChange={e=>patch(k,e.target.value)}/></label>)}</div></>}
 {step===3&&preview&&<KnowledgeMatching project={preview} graph={graph} enabled={knowledgeEnabled} choice={matchChoice} onChoice={setMatchChoice} selections={matches} onSelections={setMatches}/>}
 {step===4&&preview&&<><div className="gen-section-title"><div><h3>{preview.title}</h3><p>{preview.stages.length} 个阶段 · {abilities.length} 项能力</p></div><span className="gen-tag">待教师确认</span></div><LearningBrief cmsConfig={cmsConfig} design={preview.learningDesign} onChange={explanation=>setPreview(p=>({...p,learningDesign:{...p.learningDesign,explanation}}))}/><div className="gen-preview-stages">{preview.stages.map((s,i)=><details key={s.id} open={i===0}><summary><span>0{i+1}</span><strong>{s.title}</strong></summary><h4>{s.tasks[0].title}</h4><TaskDescription task={s.tasks[0]} design={preview.learningDesign} stage={s} onChange={description=>editReviewTask(s.id,s.tasks[0].id,description)}/><p className="gen-source">关联知识点：{s.tasks[0].contents.filter(c=>c.knowledgeNodeId).map(c=>c.title).join("；")||"暂未关联"}</p><p className="gen-source">关联能力：{s.tasks[0].learningActivity.abilityIds.map(a=>abilities.find(x=>x.id===a)?.title).join('；')||'过程性活动，按工作计划和质量要求评价'}</p></details>)}</div></>}

 </>}</div>}</section></div></Modal>;
}
