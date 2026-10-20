import {useEffect,useMemo,useRef,useState} from 'react';
import {Icon} from '../components/Icon';
import {resolveMappings,validateVersion} from './versions.mjs';
import './version-configuration.css';

const sections=[['basic','基本配置','settings'],['rules','能力权重与规则','target'],['ai','智能体与AI指令库','robot']];
const clone=value=>JSON.parse(JSON.stringify(value));
const fingerprint=value=>JSON.stringify(value);
const finiteWeight=value=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):0;
const errorText=error=>error?.message||String(error||'保存失败，请重试');

export function VersionConfiguration({classroom,catalog,onSave}){
 const [draft,setDraft]=useState(()=>clone(classroom));
 const [baseline,setBaseline]=useState(()=>clone(classroom));
 const [section,setSection]=useState('basic');
 const [query,setQuery]=useState('');
 const [instructionId,setInstructionId]=useState(classroom.instructions?.[0]?.id||'');
 const [errors,setErrors]=useState([]);
 const [success,setSuccess]=useState('');
 const [saving,setSaving]=useState(false);
 const revision=useRef(0);
 const pending=useRef(null);
 const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{
  const isSavedDraft=pending.current?.id===classroom.id&&pending.current.snapshot===fingerprint(classroom);
  if(!isSavedDraft){revision.current+=1;pending.current=null;setSuccess('');}
  setDraft(clone(classroom));setBaseline(clone(classroom));setErrors([]);setSaving(false);
  setQuery('');setInstructionId(classroom.instructions?.[0]?.id||'');
 },[classroom]);
 const abilityById=useMemo(()=>new Map(catalog.abilities.map(item=>[item.id,item])),[catalog]);
 const moduleById=useMemo(()=>new Map(catalog.modules.map(item=>[item.id,item])),[catalog]);
 const knowledgeById=useMemo(()=>new Map(catalog.knowledge.map(item=>[item.id,item])),[catalog]);
 const questionById=useMemo(()=>new Map(catalog.questions.map(item=>[item.id,item])),[catalog]);
 const abilityIds=draft.abilityIds||[];
 const mappings=useMemo(()=>resolveMappings(draft,catalog),[draft,catalog]);
 const matchedKnowledge=new Set(mappings.flatMap(item=>item.knowledgeIds));
 const matchedQuestions=new Set(mappings.flatMap(item=>item.questionIds));
 const total=abilityIds.reduce((sum,id)=>sum+finiteWeight(draft.abilityWeights?.[id]),0);
 const dirty=fingerprint(draft)!==fingerprint(baseline);
 const search=query.trim().toLowerCase();
 const instructions=(draft.instructions||[]).filter(item=>!search||[item.abilityId,abilityById.get(item.abilityId)?.title,item.title,item.prompt].join(' ').toLowerCase().includes(search));
 const selectedInstruction=instructions.find(item=>item.id===instructionId)||instructions[0];
 const update=patch=>{setDraft(current=>({...current,...patch}));setErrors([]);setSuccess('');};
 const updateRule=(key,value)=>update({rules:{...draft.rules,[key]:value}});
 const updateAgent=(id,patch)=>update({agents:(draft.agents||[]).map(item=>item.id===id?{...item,...patch}:item)});
 const updateInstruction=(id,patch)=>update({instructions:(draft.instructions||[]).map(item=>item.id===id?{...item,...patch}:item)});
 function normalize(){
  if(!abilityIds.length)return;
  const positive=abilityIds.map(id=>finiteWeight(draft.abilityWeights?.[id]));
  const sum=positive.reduce((a,b)=>a+b,0);
  const raw=positive.map(value=>sum?value/sum*10000:10000/abilityIds.length);
  const units=raw.map(Math.floor);
  const order=raw.map((value,index)=>({index,remainder:value-units[index]})).sort((a,b)=>b.remainder-a.remainder||a.index-b.index);
  let remainder=10000-units.reduce((a,b)=>a+b,0);
  for(let index=0;index<remainder;index++)units[order[index%order.length].index]+=1;
  update({abilityWeights:Object.fromEntries(abilityIds.map((id,index)=>[id,units[index]/100]))});
 }
 function cancel(){setDraft(clone(baseline));setErrors([]);setSuccess('');}
 async function save(event){
  event.preventDefault();if(saving)return;
  const candidate=clone(draft);
  candidate.name=candidate.name?.trim()||'';
  candidate.versionLabel=candidate.versionLabel?.trim()||'';
  const inputErrors=[];
  if(abilityIds.some(id=>candidate.abilityWeights?.[id]===''||!Number.isFinite(Number(candidate.abilityWeights?.[id]))))inputErrors.push('请填写所有能力目标的有效权重。');
  if(candidate.rules?.threshold===''||!Number.isFinite(Number(candidate.rules?.threshold)))inputErrors.push('请填写有效的达成阈值。');
  if(inputErrors.length){setErrors(inputErrors);setSuccess('');return;}
  candidate.abilityWeights=Object.fromEntries(abilityIds.map(id=>[id,Number(candidate.abilityWeights?.[id])]));
  candidate.rules={...candidate.rules,threshold:Number(candidate.rules?.threshold)};
  const validation=validateVersion(candidate,catalog);
  if(validation.length){setErrors(validation);setSuccess('');return;}
  if(typeof onSave!=='function'){setErrors(['当前版本尚未连接保存操作。']);return;}
  const currentRevision=revision.current;
  pending.current={id:candidate.id,snapshot:fingerprint(candidate)};
  setSaving(true);setErrors([]);setSuccess('');
  try{
   const operation=onSave(clone(candidate));
   if(operation?.id===candidate.id&&typeof operation?.then!=='function')pending.current.snapshot=fingerprint(operation);
   const result=await operation;
   if(!mounted.current||currentRevision!==revision.current)return;
   if(result===false||result?.ok===false||result?.success===false)throw new Error(result?.error||result?.message||'保存未成功，请重试');
   const saved=result?.id===candidate.id?result:candidate;
   setBaseline(clone(saved));setDraft(clone(saved));setSuccess('当前版本配置已保存，能力达成分析按新权重与规则计算。');
  }catch(error){
   if(mounted.current&&currentRevision===revision.current)setErrors([`保存失败：${errorText(error)}。输入已保留。`]);
  }finally{
   if(mounted.current&&currentRevision===revision.current){setSaving(false);pending.current=null;}
  }
 }
 return <form className="vcfg-panel" onSubmit={save} noValidate aria-label="当前版本配置">
  <header className="vcfg-header"><div><h2><Icon name="settings" size={20}/>版本配置</h2><p>{classroom.versionLabel} · 仅配置当前版本</p></div><span className={`vcfg-draft-state ${dirty?'is-dirty':''}`}>{dirty?'有未保存修改':'已保存配置'}</span></header>
  <div className="vcfg-summary" aria-label="当前版本关联数量"><span><strong>{abilityIds.length}</strong> 能力目标</span><span><strong>{matchedKnowledge.size}</strong> 关联知识点</span><span><strong>{matchedQuestions.size}</strong> 关联考核题</span></div>
  <div className="vcfg-navigation" role="group" aria-label="版本配置视角">{sections.map(([id,title,icon])=><button key={id} type="button" aria-pressed={section===id} className={section===id?'active':''} onClick={()=>setSection(id)} disabled={saving}><Icon name={icon} size={16}/>{title}</button>)}</div>
  <fieldset className="vcfg-fields" disabled={saving}>
   {section==='basic'&&<section className="vcfg-section" aria-label="基本配置"><h3>基本配置</h3><div className="vcfg-field-grid">
    <label>班级名称<input aria-label="版本班级名称" value={draft.name||''} maxLength={80} onChange={event=>update({name:event.target.value})}/></label>
    <label>版本号<input aria-label="版本号" value={draft.versionLabel||''} maxLength={40} onChange={event=>update({versionLabel:event.target.value})}/></label>
    <label>运行开始时间<input aria-label="版本运行开始时间" type="datetime-local" value={(draft.startAt||'').slice(0,16)} onChange={event=>update({startAt:event.target.value})}/></label>
    <label>运行结束时间<input aria-label="版本运行结束时间" type="datetime-local" value={(draft.endAt||'').slice(0,16)} onChange={event=>update({endAt:event.target.value})}/></label>
   </div><p className="vcfg-note">学生名单、成绩证据及能力关联沿用当前版本；调整权重和规则后保存，数据统计会重新计算。</p><MappingPreview mappings={mappings} abilityById={abilityById} moduleById={moduleById} knowledgeById={knowledgeById} questionById={questionById}/></section>}
   {section==='rules'&&<section className="vcfg-section" aria-label="能力权重与规则"><div className="vcfg-section-heading"><h3>能力目标权重</h3><div className="vcfg-weight-actions"><span className={Math.abs(total-100)>.001?'vcfg-total-invalid':''}>合计 {Number(total.toFixed(2))}% / 100%</span><button type="button" className="vcfg-button" onClick={normalize} disabled={!abilityIds.length}>归一化至100%</button></div></div>
    <p className="vcfg-note">所有选中目标的权重须大于0，且合计100%。归一化按当前比例分配；全部为0时平均分配。</p>
    <div className="vcfg-weight-list">{abilityIds.length?abilityIds.map(id=>{const ability=abilityById.get(id);return <label className="vcfg-weight-row" key={id}><div><strong>{ability?.title||id}</strong><span>{moduleById.get(ability?.moduleId)?.title||'未关联模块'} · {ability?.code||id}</span></div><div className="vcfg-percent-input"><input type="number" min="0" max="100" step="0.01" aria-label={`${ability?.title||id}权重`} value={draft.abilityWeights?.[id]??''} onChange={event=>update({abilityWeights:{...draft.abilityWeights,[id]:event.target.value===''?'':Number(event.target.value)}})}/><span>%</span></div></label>;}):<p className="vcfg-empty">当前版本未选择能力目标。</p>}</div>
    <h3 className="vcfg-rules-title">达成计算规则</h3><div className="vcfg-field-grid vcfg-rule-grid">
     <label>达成阈值（%）<input aria-label="达成阈值" type="number" min="0" max="100" step="1" value={draft.rules?.threshold??''} onChange={event=>updateRule('threshold',event.target.value===''?'':Number(event.target.value))}/></label>
     <label>缺失成绩处理<select aria-label="缺失成绩处理" value={draft.rules?.missing||'exclude'} onChange={event=>updateRule('missing',event.target.value)}><option value="exclude">排除缺失成绩</option><option value="zero">缺失成绩计0</option></select></label>
     <label>能力聚合方式<select aria-label="能力聚合方式" value={draft.rules?.aggregation||'weighted'} onChange={event=>updateRule('aggregation',event.target.value)}><option value="weighted">加权平均</option><option value="minimum">最低项</option></select></label>
    </div><p className="vcfg-note">{draft.rules?.missing==='zero'?'已有评价学生的缺失项按0计入计算，完全没有成绩的学生保持“未评价”；覆盖率按实际证据统计。':'缺失项不计入成绩分母，无证据的目标保持“未评价”。'} {draft.rules?.aggregation==='minimum'?'最低项聚合使用可评价项的最低值。':'加权平均先聚合题目成绩，再按目标权重计算模块与综合值。'}</p>
    <MappingPreview mappings={mappings} abilityById={abilityById} moduleById={moduleById} knowledgeById={knowledgeById} questionById={questionById}/>
   </section>}
   {section==='ai'&&<section className="vcfg-section" aria-label="智能体与AI指令库"><div className="vcfg-service-note"><Icon name="info" size={18}/><span>未接入运行服务 · 这里保存本版本的智能体与AI指令配置。</span></div>
    <h3>版本智能体 <span className="vcfg-count">{draft.agents?.length||0}</span></h3><div className="vcfg-agent-list">{draft.agents?.length?draft.agents.map(agent=><details className="vcfg-agent" key={agent.id}><summary><Icon name="robot" size={17}/><strong>{agent.name||'未命名智能体'}</strong><span>配置 · 未启用</span></summary><div className="vcfg-agent-fields"><label>智能体名称<input aria-label={`智能体${agent.id}名称`} value={agent.name||''} maxLength={80} onChange={event=>updateAgent(agent.id,{name:event.target.value})}/></label><label>智能体指令<textarea aria-label={`智能体${agent.id}指令`} rows={5} value={agent.prompt||''} onChange={event=>updateAgent(agent.id,{prompt:event.target.value})}/></label><p className="vcfg-id">{{teacher:'教学助教',student:'学习助手',evaluation:'能力评价助手'}[agent.role]||'版本智能体'} · ID：{agent.id}</p></div></details>):<p className="vcfg-empty">当前版本暂无智能体配置。</p>}</div>
    <div className="vcfg-section-heading vcfg-instruction-heading"><h3>AI指令库 <span className="vcfg-count">{draft.instructions?.length||0}</span></h3><label className="vcfg-search"><Icon name="search" size={16}/><input aria-label="搜索AI指令" type="search" placeholder="搜索能力、名称或指令" value={query} onChange={event=>setQuery(event.target.value)}/></label></div>
    {instructions.length?<div className="vcfg-instruction-layout"><div className="vcfg-instruction-list" role="group" aria-label="选择能力指令">{instructions.map(item=><button type="button" key={item.id} className={selectedInstruction?.id===item.id?'active':''} aria-pressed={selectedInstruction?.id===item.id} onClick={()=>setInstructionId(item.id)}><strong>{abilityById.get(item.abilityId)?.title||item.abilityId}</strong><span>{item.title||'未命名指令'}</span></button>)}</div><div className="vcfg-instruction-editor"><p className="vcfg-id">能力ID：{selectedInstruction.abilityId}</p><label>指令名称<input aria-label="AI指令名称" value={selectedInstruction.title||''} maxLength={80} onChange={event=>updateInstruction(selectedInstruction.id,{title:event.target.value})}/></label><label>AI指令<textarea aria-label="AI指令内容" rows={8} value={selectedInstruction.prompt||''} onChange={event=>updateInstruction(selectedInstruction.id,{prompt:event.target.value})}/></label><p className="vcfg-id">指令ID：{selectedInstruction.id}</p></div></div>:<p className="vcfg-empty">{query?'暂无匹配的能力指令。':'当前版本暂无AI指令配置。'}</p>}
   </section>}
  </fieldset>
  {errors.length>0&&<div className="vcfg-errors" role="alert"><strong>配置未保存</strong><ul>{errors.map((error,index)=><li key={index}>{error}</li>)}</ul></div>}
  {success&&<p className="vcfg-success" role="status"><Icon name="check" size={17}/>{success}</p>}
  <footer className="vcfg-footer"><p>{saving?'正在保存当前版本…':dirty?'修改尚未保存':'配置仅保存在本浏览器'}</p><div><button type="button" className="vcfg-button" onClick={cancel} disabled={saving||!dirty}>取消修改</button><button type="submit" className="vcfg-button vcfg-primary" disabled={saving||!dirty}>{saving?'保存中…':'保存配置'}</button></div></footer>
 </form>;
}

function MappingPreview({mappings,abilityById,moduleById,knowledgeById,questionById}){
 return <details className="vcfg-mapping"><summary><Icon name="tree" size={17}/>查看能力—知识—考核关联 <span>{mappings.length} 个目标</span></summary><p className="vcfg-note">根据所选数据的显式ID关联；题目为教学模拟题。</p><div className="vcfg-mapping-list">{mappings.length?mappings.map(mapping=><article key={mapping.abilityId}><h4>{abilityById.get(mapping.abilityId)?.title||mapping.abilityId}</h4><p className="vcfg-id">{moduleById.get(mapping.moduleId)?.title||'未关联模块'} · {mapping.abilityId}</p><div className="vcfg-association"><span>知识点</span><div>{mapping.knowledgeIds.length?mapping.knowledgeIds.map(id=><span className="vcfg-tag" key={id} title={id}>{knowledgeById.get(id)?.title||id}<small>{id}</small></span>):<em>未关联</em>}</div></div><div className="vcfg-association"><span>考核题</span><div>{mapping.questionIds.length?mapping.questionIds.map(id=><span className="vcfg-tag vcfg-question-tag" key={id} title={questionById.get(id)?.stem||id}>{questionById.get(id)?.title||id}<small>{id}</small></span>):<em>未关联</em>}</div></div></article>):<p className="vcfg-empty">当前版本暂无能力关联。</p>}</div></details>;
}
