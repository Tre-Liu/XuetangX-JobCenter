import {withJobTaskDemos} from './job-task-demos.mjs';
import {KnowledgeMatching} from './KnowledgeMatching';
import {applyKnowledgeMatches,suggestKnowledgeMatches} from './knowledge-matching.mjs';
import {useKnowledgeEnabled} from '../knowledge/availability.mjs';
import {demoRolesForMajor} from './demo-roles.mjs';
import {ConversationPrompt,Markdown} from './Conversation';
import {cmsHref} from '../cms/config.mjs';
import {resolveCourseContext} from './major-context.mjs';
import { TextDescription } from '../components/TaskDescription';
import { JobCompetencyMap } from './JobCompetencyMap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { id } from '../project.mjs';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { catalog, gate, inputRole, defaultDesign, designError, generateProject } from './model.mjs';
import './generation.css';
const steps=['岗位与任务','知识点匹配'];
const prompts=[
 '接下来，确定本项目的**岗位、典型工作任务与能力项**。\n\n1. **选择岗位**：从产业岗位中选择，也可以自定义岗位。\n2. **选择典型工作任务**：默认选择该岗位下推荐的任务，可切换。\n3. **勾选已有能力项**：默认全选任务能力项，可取消不需要的知识、技能与素养。',
 '已完成教学化转化，请确认**知识点匹配**。\n\n1. **每个任务最多 10 个知识点**：默认勾选，可逐任务取消或从知识图谱重新选择节点。\n2. **确认生成**：确认后直接生成框架，覆盖当前项目。'
];
const designFields=[['title','项目名称'],['courseGoal','课程学习目标'],['prerequisites','先备知识与技能'],['problem','驱动学习的核心问题'],['object','工作对象'],['content','工作内容'],['tools','工具、方法与资源'],['organization','组织与分工'],['product','产品 / 服务成果'],['environment','学习环境与实施条件'],['scaffold','支持与难度调整'],['criteria','成果验收标准'],['transfer','迁移与挑战']];
const designMarkdown=d=>designFields.map(([key,label])=>`**${label}**：${d[key]}`).join('\n\n');
const readContext=courseId=>{try{return JSON.parse(localStorage.getItem('ai-course-context-v2:'+courseId))||{};}catch{return {};}};
export function LearningBrief({design,title,showGraph=true,onChange,cmsConfig}){
 return <div className="learning-brief"><TextDescription label="项目说明" placeholder="点击填写项目说明：说明核心问题、学情与先备条件，以及项目成果。" text={typeof design.explanation==='string'?design.explanation:[design.problem&&`核心问题：${design.problem}`, [design.learners,design.prerequisites].filter(Boolean).length&&`学情与先备条件：${[design.learners,design.prerequisites].filter(Boolean).join('；')}`, design.product&&`项目成果：${design.product}`].filter(Boolean).join('\n\n')} onChange={onChange}/>{showGraph&&<JobCompetencyMap cmsConfig={cmsConfig} key={`${design.role.id}-${design.sourceTask?.id}`} design={design} title={title}/>}<details className="learning-provenance"><summary>查看来源与教学设计</summary><div className="learning-provenance-body"><div className="learning-grid">{[['任务类型',design.taskType||'综合型'],['课程学习目标',design.courseGoal],['工作任务',design.sourceTask.title],['工作对象',design.object],['工作内容',design.content],['工具与资源',design.tools],['组织方式',design.organization],['学习环境',design.environment],['学习支持',design.scaffold],['验收标准',design.criteria],['迁移挑战',design.transfer]].map(([name,value])=><p key={name}><b>{name}</b>{value}</p>)}</div><p className="gen-source">{design.role.origin==='reference'?`${design.role.source.school} · ${design.role.source.file} · ${design.role.source.locator}；来源岗位：${design.role.originalRole}`:design.role.source?.note||'教师输入岗位 · 本地辅助草稿，需补充岗位调研证据'}</p><p className="gen-source">{design.review}。教学设计由本地规则转化，非在线 AI 结果。</p></div></details></div>;
}

export function GenerationWizard({onClose,onCreate,courseName,courseId='local-course',courseMajor=null,cmsConfig=null,graph={nodes:[]},resources=[]}){
 const [step,setStep]=useState(0),[context]=useState(()=>resolveCourseContext({...(!courseMajor?{}:readContext(courseId)),planId:'',planMajor:'',planName:''},courseMajor)),[role,setRole]=useState(null),[task,setTask]=useState(null),[selected,setSelected]=useState([]),[query,setQuery]=useState(''),[manual,setManual]=useState(false),[design,setDesign]=useState(null),[loading,setLoading]=useState(''),[error,setError]=useState('');
 const [revealedStep,setRevealedStep]=useState(null);
 const [preview,setPreview]=useState(null);
 const [conversion,setConversion]=useState('');
 const knowledgeEnabled=useKnowledgeEnabled();
 const [requestedMatchChoice,setMatchChoice]=useState(null),[matches,setMatches]=useState({});
 const hasKnowledge=knowledgeEnabled&&graph.nodes.some(node=>node.level>1);
 const matchChoice=hasKnowledge?(requestedMatchChoice||'yes'):'no';
 // A review draft is stable while editing or revisiting steps; new inputs invalidate it.
 useEffect(()=>{setPreview(null);setMatches({});setMatchChoice(null);},[role,task,selected]);
 const promptReady=revealedStep===step;
 const finishPrompt=useCallback(()=>setRevealedStep(step),[step]);
 const [customRoles,setCustomRoles]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('ai-course-custom-roles-v1:'+courseId));return Array.isArray(saved)?saved.filter(r=>r?.id&&Array.isArray(r.tasks)):[];}catch{return [];}});
 const [adding,setAdding]=useState(false),[jobName,setJobName]=useState(''),[jobTasks,setJobTasks]=useState('');
 useEffect(()=>{try{localStorage.setItem('ai-course-custom-roles-v1:'+courseId,JSON.stringify(customRoles));}catch{}},[customRoles,courseId]);
 const saveRole=r=>{setRole(r);if(r.origin!=='reference')setCustomRoles(items=>items.some(item=>item.id===r.id)?items.map(item=>item.id===r.id?r:item):[...items,r]);setDesign(null);setError('');};
 const resetSelection=()=>{setRole(null);setTask(null);setSelected([]);setDesign(null);setError('');};
 const customList=customRoles.filter(r=>!r.id.startsWith('major-job:')&&r.major===context.major&&(!context.planId||r.planId===context.planId));
 const createCustom=()=>{try{const r=inputRole(context,jobName,jobTasks);setCustomRoles(items=>[...items,r]);pick(r);setAdding(false);setJobName('');setJobTasks('');}catch(e){setError(e.message);}};
 const patchTask=changes=>{const updated={...task,...changes};setTask(updated);saveRole({...role,tasks:role.tasks.map(t=>t.id===updated.id?updated:t)});};
 const status=gate(context);
 const matchedRoles=useMemo(()=>cmsConfig?.matchingMode==='job-name'?cmsConfig.matchedJobs.filter(job=>!cmsConfig.disabledJobIds.includes(job.id)).map(job=>withJobTaskDemos(job,context.major,customRoles.find(r=>r.id===job.id))):gate(context).ready?[...catalog,...demoRolesForMajor(context.major)].filter(r=>r.major===context.major&&(!context.planId||r.planId===context.planId)):[],[context,cmsConfig,customRoles]);
 const recommendedRole=matchedRoles[0]||null;
 const prompt=prompts[step]+(step===0&&recommendedRole?`\n4. 根据所选专业，推荐岗位：**${recommendedRole.name}**，可在下方切换其他岗位。`:'');
 const roles=matchedRoles.filter(r=>r.name.includes(query.trim()));
 const abilities=task?.abilities.filter(a=>selected.includes(a.id))||[];
 const pick=r=>{const recommendedTask=r.tasks.find(t=>t.abilities?.length)||r.tasks[0]||null;setRole(r);setTask(recommendedTask);setSelected(recommendedTask?.abilities.map(a=>a.id)||[]);setDesign(null);setError('');};
 const pickTask=t=>{if(task?.id===t.id)return;setTask(t);setSelected(t.abilities.map(a=>a.id));setDesign(null);setError('');};
 // Only select abilities already attached to the source task; never create new ones.
 const initializedRole=useRef(false);
 useEffect(()=>{if(!initializedRole.current&&recommendedRole){initializedRole.current=true;pick(recommendedRole);}},[recommendedRole]);

 const pending=useRef(null),workspace=useRef(null),current=useRef(null),taskPicker=useRef(null),abilityPicker=useRef(null);
 const reveal=element=>{element?.focus({preventScroll:true});element?.scrollIntoView?.({block:'start',behavior:'smooth'});};
 const reject=(message,element)=>{setError(message);reveal(element);};
 // The default role is selected before the streamed prompt mounts the task picker.
 // Wait for that section to appear, then guide the next selection into view.
 useEffect(()=>{
  if(step!==0||loading||!promptReady||!role)return;
  reveal(taskPicker.current);
 },[step,loading,promptReady,role?.id]);
 useEffect(()=>{if(step===0&&task)reveal(abilityPicker.current);},[task?.id]);
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
   if(!role)return setError('请先选择或添加一个岗位');
   if(!role.name.trim())return setError('请填写岗位名称');
   if(!task||!task.title.trim())return reject('请选择并填写一个典型工作任务',taskPicker.current);
   if(!abilities.length)return reject('请至少选择一项已有岗位能力；当前任务无能力项时，请选择其他任务',abilityPicker.current);
   if(abilities.some(a=>!a.title.trim()))return reject('已选能力缺少描述，请选择其他有效能力项',abilityPicker.current);
   const draft=design||defaultDesign(role,task,courseName);
   const msg=designError(draft);if(msg)return setError(msg);
   const markdown=designMarkdown(draft);setDesign(draft);setConversion(markdown);
   transition('正在将岗位任务转化为学习项目…',()=>{
    if(!preview){const generated=generateProject({context,role,task,abilities,design:draft,confirmed:true});setPreview(generated);setMatches(suggestKnowledgeMatches(generated,graph));}
    setStep(1);
   },Math.ceil(markdown.length/24)*40+800);
  }else{
   transition('正在生成框架并覆盖当前项目…',()=>onCreate(applyKnowledgeMatches(preview,matches,graph,resources,matchChoice==='yes'&&hasKnowledge)));
  }
 };
 return <Modal title="从岗位工作任务生成学习项目" wide className="generation-modal conversation-modal" onClose={onClose} footer={<>{error&&<p className="form-error gen-footer-error" role="alert">{error}</p>}{step===1&&<span className="gen-footer-note">生成结果将覆盖当前项目数据，可继续编辑</span>}<button className="outlined" disabled={!!loading} onClick={previous}>{step?'上一步':'取消'}</button><button className="primary" disabled={!!loading||!promptReady||(step===0&&!status.ready)} onClick={next}>{loading?'处理中…':'确认'}<Icon name="check" size={16}/></button></>}>
 <div className="gen-stepper" aria-label="项目生成步骤">{steps.map((s,i)=><div key={s} aria-current={i===step?'step':undefined} className={i===step?'current':i<step?'done':''}><span>{i<step?'✓':`0${i+1}`}</span>{s}</div>)}</div>
 <div className={`gen-workspace conversation-workspace${loading?' is-loading':''}`} ref={workspace} aria-busy={!!loading}>

 <section className="gen-main">
 <div className="gen-basic-info gen-context-grid">{courseMajor?.code?<><span>关联专业</span><strong aria-label="课程已关联专业">{context.majorName} · {context.major}</strong></>:<div className="gen-empty">课程尚未关联专业，<a href={cmsHref(cmsConfig||{major:null})}>前往关联专业</a></div>}</div>
 {!loading&&<div ref={current} className={step===0?'gen-role-prompt':undefined}><ConversationPrompt key={step} onComplete={finishPrompt}>{prompt}</ConversationPrompt></div>}
 {(loading||promptReady)&&<div className="conversation-input-card">{loading?<div className="gen-loading" role="status" aria-live="polite"><span className="gen-loading-spinner" aria-hidden="true"/><strong>{loading}</strong>{step===0&&conversion?<div className="gen-conversion-process"><ConversationPrompt charsPerTick={24}>{conversion}</ConversationPrompt></div>:<p>请稍候，即将完成</p>}</div>:<>
 {step===0&&<>
 <section className="gen-substep gen-role-picker" aria-label="选择岗位"><div className="gen-mode">{[[false,'选择产业岗位'],[true,'自定义岗位']].map(([value,label])=><button key={label} className={manual===value?'active':''} onClick={()=>{if(manual===value)return;setManual(value);setAdding(false);if(!value&&recommendedRole)pick(recommendedRole);else resetSelection();}}>{label}</button>)}</div>
 <h4 className="gen-pick-heading"><span>1</span>选择岗位</h4>
 {!manual?<><input aria-label="搜索岗位" className="gen-search" placeholder="搜索产业岗位" value={query} onChange={e=>setQuery(e.target.value)}/><div className="gen-role-list">{roles.map(r=><button className={role?.id===r.id?'selected':''} aria-pressed={role?.id===r.id} key={r.id} onClick={()=>{if(role?.id!==r.id)pick(r);}}><Icon name="users"/><strong>{r.name}</strong>{r.id===recommendedRole?.id&&<span className="gen-recommended-badge">推荐</span>}<small>{r.tasks.length} 个典型工作任务 · {r.origin==='simulation'?'模拟数据':'人培参考'}</small></button>)}{!roles.length&&<div className="gen-empty"><strong>没有找到相应岗位</strong><p>可换一个关键词，或到“自定义岗位”中自主添加岗位。</p><button className="outlined" onClick={()=>{setManual(true);resetSelection();}}>自定义岗位</button></div>}</div></>:<>
 <div className="gen-custom-heading"><p>自主添加岗位及典型工作任务，保存后可再次选择。</p><button className="outlined" onClick={()=>{setAdding(true);setError('');}}><Icon name="plus" size={16}/>添加岗位</button></div>
 {adding&&<div className="gen-manual">
 <h4>添加自定义岗位</h4>
 <div className="gen-form-grid"><label className="span-2">岗位名称<input aria-label="新增岗位名称" value={jobName} onChange={e=>setJobName(e.target.value)}/></label><label className="span-2">典型工作任务<textarea aria-label="新增典型工作任务" rows={3} value={jobTasks} placeholder="每行填写一个典型工作任务" onChange={e=>setJobTasks(e.target.value)}/></label></div>
 <p className="gen-source">仅可选择已有能力项。新建任务尚未关联能力时，暂不能生成框架。</p>
 <div className="gen-custom-actions"><button className="outlined" onClick={()=>setAdding(false)}>取消添加</button><button className="primary" disabled={!jobName.trim()||!jobTasks.trim()} onClick={createCustom}>保存岗位</button></div>
 </div>}
 <div className="gen-role-list">{customList.map(r=><button className={role?.id===r.id?'selected':''} key={r.id} onClick={()=>{if(role?.id!==r.id)pick(r);}}><Icon name="users"/><strong>{r.name||'未命名岗位'}</strong><small>{r.tasks.length} 个典型工作任务 · {r.origin==='teacher-input'?'自主填写':'辅助草稿'}</small></button>)}{!customList.length&&!adding&&<div className="gen-empty">暂无自定义岗位，点击“添加岗位”开始填写。</div>}</div>
 </>}</section>
 {role&&<div className="gen-task-picker gen-substep" ref={taskPicker} tabIndex={-1} aria-label="选择典型工作任务">
 {manual&&<label className="gen-role-edit">岗位名称<input aria-label="编辑岗位名称" value={role.name} onChange={e=>saveRole({...role,name:e.target.value})}/></label>}
 {cmsConfig?.matchingMode==='job-name'&&!role.tasks.length&&<p className="gen-source">当前匹配仅提供岗位及模拟统计，请添加并确认典型工作任务。</p>}<div className="gen-task-heading"><h4 className="gen-pick-heading"><span>2</span>选择一个典型工作任务</h4>{(manual||cmsConfig?.matchingMode==='job-name')&&<button className="gen-add-ability" onClick={()=>{const t={id:id(),title:'',description:'',abilities:[]};saveRole({...role,tasks:[...role.tasks,t]});pickTask(t);}}><Icon name="plus" size={14}/>添加典型工作任务</button>}</div>
 <div className="gen-task-options" role="radiogroup" aria-label="典型工作任务">{role.tasks.map(t=><label key={t.id} className={task?.id===t.id?'selected':''}><input type="radio" name="typical-work-task" checked={task?.id===t.id} onChange={()=>pickTask(t)}/>{!t.abilities.length&&task?.id===t.id?<input aria-label="编辑典型工作任务" placeholder="请输入典型工作任务" value={t.title} onChange={e=>patchTask({title:e.target.value})}/>:<strong>{t.title||'未命名典型工作任务'}</strong>}<small>{t.abilities.length} 项能力</small></label>)}</div>
 {!task&&<p className="gen-source">请选择一个典型工作任务，查看并选择其能力项。</p>}
 </div>}
 {task&&<div className="gen-task-source gen-substep" ref={abilityPicker} tabIndex={-1} aria-label="选择能力项">
  <h4 className="gen-pick-heading"><span>3</span>选择能力项</h4>
  {['知识','技能','素养'].map(c=><div key={c} className="gen-abilities">
   <div className="gen-abilities-heading"><h4>{c}<small>{task.abilities.filter(a=>a.category===c).length} 项</small></h4></div>
   {task.abilities.filter(a=>a.category===c).map((a,i)=><div className="gen-ability" key={a.id}>
    <input type="checkbox" aria-label={`选择${c}第${i+1}项`} checked={selected.includes(a.id)} onChange={e=>{setSelected(ids=>e.target.checked?[...ids,a.id]:ids.filter(x=>x!==a.id));setDesign(null);setError('');}}/>
    <span className="gen-ability-content">{a.title}</span>
   </div>)}
   {!task.abilities.some(a=>a.category===c)&&<p className="gen-source">暂无已有{c}项。</p>}
  </div>)}
  <div className="gen-selection">已选 {abilities.length} 项能力 · 将关联到学习活动与评价</div>
 </div>}</>}

 {step===1&&preview&&<><details className="gen-process-record"><summary>查看教学化转化过程</summary><div className="conversation-markdown"><Markdown text={conversion}/></div></details><KnowledgeMatching project={preview} graph={graph} enabled={knowledgeEnabled} choice={matchChoice} onChoice={setMatchChoice} selections={matches} onSelections={setMatches}/></>}

 </>}</div>}</section></div></Modal>;
}
