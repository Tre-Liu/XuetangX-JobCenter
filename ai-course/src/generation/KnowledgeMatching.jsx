import {useEffect,useMemo,useRef,useState} from 'react';
import {Icon} from '../components/Icon';
import {KnowledgePicker} from './KnowledgePicker';
import {MAX_KNOWLEDGE_POINTS,suggestKnowledgeMatches} from './knowledge-matching.mjs';
import matchingImage from './assets/knowledge-matching.png?inline';
import emptyImage from './assets/knowledge-empty.png?inline';
import './knowledge-matching.css';

export function KnowledgeMatching({project,graph,enabled,choice,onChoice,selections,onSelections,onBusyChange}){
 const stages=project.stages;
 const [activeStage,setActiveStage]=useState(stages[0]?.id||null);
 const [picking,setPicking]=useState(null),[matching,setMatching]=useState(false);
 const pending=useRef(null),viewport=useRef(null),sectionRefs=useRef(new Map()),navigationTarget=useRef(null);
 const latest=useRef({selections,onSelections,onBusyChange});latest.current={selections,onSelections,onBusyChange};
 const nodes=useMemo(()=>enabled?graph.nodes.filter(node=>node.level>1&&node.name?.trim()):[],[enabled,graph.nodes]);
 const nodeMap=useMemo(()=>new Map(nodes.map(node=>[node.id,node])),[nodes]);
 const graphKey=nodes.map(node=>`${node.id}:${node.level}:${node.name}`).join('|');
 const sourceKey=`${enabled}:${choice}:${project.id}:${graphKey}`;
 const previousSource=useRef(sourceKey);
 const currentStage=stages.find(stage=>stage.id===activeStage)||stages[0];
 const currentTask=stages.flatMap(stage=>stage.tasks).find(task=>task.id===picking);
 const available=nodes.length>0&&choice!=='no';
 const validSelections=taskId=>[...new Set(selections[taskId]||[])].filter(id=>nodeMap.has(id)).slice(0,MAX_KNOWLEDGE_POINTS);
 useEffect(()=>{latest.current.onBusyChange?.(matching||!!picking);},[matching,picking]);
 useEffect(()=>()=>{clearTimeout(pending.current);latest.current.onBusyChange?.(false);},[]);
 // A graph update or availability switch invalidates work already in flight.
 useEffect(()=>{if(previousSource.current===sourceKey)return;previousSource.current=sourceKey;clearTimeout(pending.current);pending.current=null;setMatching(false);setPicking(null);},[sourceKey]);
 useEffect(()=>{if(!stages.some(stage=>stage.id===activeStage))setActiveStage(stages[0]?.id||null);},[stages,activeStage]);
 useEffect(()=>{if(!matching){navigationTarget.current=null;sectionRefs.current.get(activeStage)?.scrollIntoView?.({block:'start',behavior:'instant'});}},[matching]);
 const selectStage=stageId=>{
  if(pending.current!==null)return;
  navigationTarget.current=stageId;
  setActiveStage(stageId);
  sectionRefs.current.get(stageId)?.scrollIntoView?.({block:'start',behavior:'smooth'});
 };
 const syncStage=()=>{
  if(matching||!viewport.current?.clientHeight)return;
  if(navigationTarget.current){
   const target=sectionRefs.current.get(navigationTarget.current);
   if(target&&Math.abs(viewport.current.scrollTop-target.offsetTop)>2)return;
   navigationTarget.current=null;
  }
  const top=viewport.current.scrollTop+viewport.current.clientHeight*.25;
  let stageId=stages[0]?.id;
  for(const stage of stages){if((sectionRefs.current.get(stage.id)?.offsetTop||0)<=top)stageId=stage.id;}
  setActiveStage(stageId);
 };
 const matchStage=()=>{
  if(pending.current!==null||!available||!currentStage)return;
  const stage=currentStage;
  setMatching(true);
  pending.current=setTimeout(()=>{
   const suggestions=suggestKnowledgeMatches({stages:[stage]},graph);
   const next={...latest.current.selections};
   // An explicit key records a reviewed result, including a deliberate empty choice.
   for(const task of stage.tasks){if(!Object.hasOwn(next,task.id))next[task.id]=suggestions[task.id]||[];}
   latest.current.onSelections(next);
   pending.current=null;setMatching(false);
  },1400);
 };
 const remove=(taskId,nodeId)=>onSelections({...selections,[taskId]:validSelections(taskId).filter(id=>id!==nodeId)});
 return <div className="knowledge-matching gen-match-layout" aria-busy={matching}>
  <nav className="knowledge-stage-nav" aria-label="项目阶段">
   <h3>项目阶段</h3>
   {stages.map((stage,index)=><button key={stage.id} type="button" disabled={matching} aria-current={currentStage?.id===stage.id?'step':undefined} onClick={()=>selectStage(stage.id)}>
    <span className="knowledge-stage-number">{String(index+1).padStart(2,'0')}</span><span className="knowledge-stage-copy"><strong>{stage.title}</strong><small>{stage.tasks.length} 个任务</small></span><span className="knowledge-stage-total">{stage.tasks.reduce((total,task)=>total+validSelections(task.id).length,0)} 个知识点</span>
   </button>)}
  </nav>
  <section className="knowledge-task-panel" aria-label="任务关联知识点">
   <header className="knowledge-task-panel-heading"><h3>任务关联知识点</h3><button type="button" className="knowledge-smart-match" disabled={matching||!available||!currentStage?.tasks.length} onClick={matchStage}><Icon name="sparkle" size={16}/>智能匹配</button></header>
   {matching?<div className="knowledge-matching-loading gen-match-loading" role="status" aria-live="polite"><img src={matchingImage} width="187" height="124" alt=""/><strong>正在为当前阶段匹配知识点</strong><p>分析任务内容，并从课程知识图谱中查找相关知识点</p><div className="knowledge-match-progress" aria-hidden="true"><span/></div></div>:<div className="knowledge-stage-viewport" ref={viewport} onScroll={syncStage} onWheel={()=>{navigationTarget.current=null;}} onTouchMove={()=>{navigationTarget.current=null;}} onPointerDown={()=>{navigationTarget.current=null;}} onKeyDown={()=>{navigationTarget.current=null;}}>
    {!available&&<p className="knowledge-match-availability">{choice==='no'?'本次暂不匹配知识点，可直接确认生成项目框架。':'当前暂无可用知识点，可直接确认生成项目框架。'}</p>}
    {stages.map(stage=><section className="gen-match-stage knowledge-stage-section" data-stage-id={stage.id} key={stage.id} ref={element=>{if(element)sectionRefs.current.set(stage.id,element);else sectionRefs.current.delete(stage.id);}} aria-label={stage.title}>
     {stage.tasks.map(task=>{const selected=validSelections(task.id);return <article className="knowledge-match-task" data-task-id={task.id} key={task.id}>
      <header><h4>{task.title}</h4><button type="button" className="gen-graph-picker knowledge-task-add" disabled={!available} aria-haspopup="dialog" aria-expanded={picking===task.id} onClick={event=>{event.currentTarget.focus();setPicking(task.id);}}><Icon name="plus" size={14}/>关联知识点</button></header>
      <div className="gen-match-nodes knowledge-task-nodes">{selected.length?selected.map(nodeId=><label className="knowledge-match-chip knowledge-match-row" key={nodeId}><input type="checkbox" checked aria-label={`匹配${nodeMap.get(nodeId).name}`} onChange={()=>remove(task.id,nodeId)}/><span>{nodeMap.get(nodeId).name}</span></label>):<div className="knowledge-task-empty"><img src={emptyImage} alt=""/><p>暂无数据</p></div>}</div>
     </article>;})}
     {!stage.tasks.length&&<div className="knowledge-task-empty knowledge-stage-empty"><img src={emptyImage} alt=""/><p>当前阶段暂无任务</p></div>}
    </section>)}
   </div>}
  </section>
  {currentTask&&available&&!matching&&<KnowledgePicker task={currentTask} nodes={nodes} selected={selections[currentTask.id]||[]} onClose={()=>setPicking(null)} onConfirm={ids=>{onSelections({...selections,[currentTask.id]:ids});setPicking(null);}}/>}
 </div>;
}
