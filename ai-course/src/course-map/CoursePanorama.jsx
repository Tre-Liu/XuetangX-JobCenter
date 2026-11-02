import {useMemo,useState,useRef,useEffect} from 'react';
import {Briefcase,FileText,Target,CaretDown,ArrowCounterClockwise} from '@phosphor-icons/react';
import {Icon} from '../components/Icon';
import {useKnowledgeEnabled} from '../knowledge/availability.mjs';
import {buildCourseMap,panoramaGraph,traceCourseChain} from './model.mjs';
import {layoutCoursePanorama} from './layout.mjs';
import './course-panorama.css';
import {withPanoramaDemoAbilities} from './demo-abilities.mjs';
import {withPanoramaDemoKnowledge} from './demo-knowledge.mjs';
const currentCourse={id:'current-course',title:'电气控制与PLC'};
const symbols={role:Briefcase,project:FileText,activity:Target};
export function CoursePanorama({projects,knowledge,cmsConfig,course=currentCourse,theme='light'}){
 const knowledgeEnabled=useKnowledgeEnabled();
 const graph=useMemo(()=>withPanoramaDemoAbilities(withPanoramaDemoKnowledge(panoramaGraph(buildCourseMap({course,projects,knowledge,knowledgeEnabled,cmsConfig})),{enabled:knowledgeEnabled})),[course,projects,knowledge,knowledgeEnabled,cmsConfig]);
 const [expandedRoles,setExpandedRoles]=useState(new Set()),[selected,setSelected]=useState(null),[zoom,setZoom]=useState(null),[available,setAvailable]=useState(1200);
 const viewport=useRef(null);
 useEffect(()=>{const el=viewport.current;const measure=()=>{if(el?.clientWidth)setAvailable(el.clientWidth);};measure();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;observer?.observe(el);return()=>observer?.disconnect();},[]);
 const active=graph.nodes.find(n=>n.id===selected),hasFocus=!!active&&active.id!==graph.rootId;
 const layout=useMemo(()=>layoutCoursePanorama(graph,{expandedRoles,selectedKnowledge:active?.kind==='knowledge'?active.id:null}),[graph,expandedRoles,active?.id,active?.kind]);
 const focus=useMemo(()=>traceCourseChain(graph,active?.id||graph.rootId),[graph,active?.id]);
 const scale=zoom??Math.min(1,Math.max(.65,(available-40)/layout.width));
 const choose=id=>{
  // Knowledge focus can reveal a card implicitly; keep it visible when its ability is chosen.
  const owners=layout.boxes.filter(node=>node.id===id&&node.kind==='ability').map(node=>node.ownerId);
  if(owners.length)setExpandedRoles(previous=>new Set([...previous,...owners]));
  setSelected(previous=>previous===id?null:id);
 };
 const reset=()=>setSelected(null);
 const renderNode=(node,origin={x:0,y:0})=>{
  const Symbol=symbols[node.kind],category=node.description==='技能'?'skill':node.description==='素养'?'quality':'knowledge';
  const related=!hasFocus||focus.nodeIds.has(node.id),isSelected=node.id===active?.id;
  const state=`${isSelected?' is-selected':''}${related?' is-related':' is-dimmed'}`;
  return <div key={node.displayKey||node.id} className={`panorama-entity entity-${node.kind}${state}`} style={{left:node.x-origin.x,top:node.y-origin.y,width:node.w,height:node.h}}>
   <button type="button" className={`panorama-node tone-${node.kind}${node.point?' panorama-point category-'+category:''}${state}`} aria-label={node.title} data-node-id={node.id} data-kind={node.kind} title={node.title} aria-pressed={isSelected} onClick={()=>choose(node.id)}>
    {Symbol&&<span className="panorama-card-icon"><Symbol size={19}/></span>}
    {node.point?<span className="panorama-point-tooltip" role="tooltip">{node.title}</span>:<span className="panorama-node-copy">
     {node.eyebrow&&<span className="panorama-node-meta"><span>{node.eyebrow}</span></span>}
     <strong>{node.title}</strong>{node.subtitle&&<small title={node.subtitle}>{node.subtitle}</small>}
    </span>}
   </button>
   {node.kind==='role'&&node.abilityCount>0&&<button type="button" className="panorama-expand" aria-label={`${node.expanded?'收起':'展开'}${node.title}的能力项`} aria-expanded={node.expanded} onClick={()=>{setExpandedRoles(previous=>{const next=new Set(previous);if(node.expanded)next.delete(node.id);else next.add(node.id);return next;});if(active?.kind==='knowledge')reset();}}>{node.expanded?'收起':'展开'}能力项（{node.abilityCount}）<CaretDown size={13}/></button>}
  </div>;
 };
 return <section className={`course-panorama${hasFocus?' has-focus':''}`} data-theme={theme==='dark'?'dark':'light'} aria-label="课岗关联图谱">
  <div className="panorama-viewport" ref={viewport} role="region" aria-label={`${course.title}课岗关联画布，可滚动`} tabIndex={0} onClick={event=>{if(!event.target.closest('button'))reset();}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();reset();}}}>
   {!layout.boxes.length?<div className="panorama-empty"><Icon name="graph" size={36}/><h2>暂无课岗关联</h2><p>项目关联岗位、实践任务或知识点后，可在此查看关联路径。</p></div>:<div className="panorama-sized" style={{width:layout.width*scale,height:layout.height*scale}}>
    <div className="panorama-world" style={{width:layout.width,height:layout.height,transform:`scale(${scale})`}}>
     <svg className="panorama-edges" width={layout.width} height={layout.height} aria-hidden="true">{layout.paths.map(path=>{
      const hot=!hasFocus||path.sourceEdgeIds.every(id=>focus.edgeIds.has(id));
      const showAbility=path.abilityLink&&hasFocus&&['ability','knowledge'].includes(active.kind)&&hot;
      if(path.abilityLink&&!showAbility)return null;
      return <path key={path.key} d={path.d} data-edge-id={path.id} data-from={path.from} data-to={path.to} className={`edge-${path.tone} ${hot?'is-hot':'is-dimmed'}`}/>;
     })}</svg>
     {layout.labels.map(label=><div className="panorama-lane-label" key={label.kind} style={{left:label.x,top:label.y}}>{label.title}</div>)}
     {layout.groups.map(group=><section key={group.id} className={`panorama-group tone-${group.kind}${group.chainId&&hasFocus?(focus.nodeIds.has(group.chainId)?' is-related':' is-dimmed'):''}`} data-chain-id={group.chainId} aria-label={group.chainTitle?`${group.chainTitle}的产业环节`:group.title||'知识点集合'} style={{left:group.x,top:group.y,width:group.w,height:group.h}}>
      {group.title&&<h3>{group.title}</h3>}
      {group.chainId&&layout.boxes.filter(node=>node.groupId===group.id).map(node=>renderNode(node,group))}
     </section>)}
     {layout.boxes.filter(node=>!node.groupId).map(node=>renderNode(node))}
     {layout.annotations.map(item=><div key={item.id} className={`panorama-category-label${hasFocus&&!focus.nodeIds.has(item.ownerId)?' is-dimmed':''}`} style={{left:item.x,top:item.y}}>{item.title}</div>)}
    </div>
   </div>}
  </div>
  <div className="panorama-tools" aria-label="图谱缩放">
   {hasFocus&&<button className="panorama-reset" onClick={reset}><ArrowCounterClockwise size={14}/>恢复全图</button>}
   <button aria-label="缩小图谱" disabled={scale<=.5} onClick={()=>setZoom(Math.max(.5,scale-.1))}><Icon name="minus-circle" size={17}/></button><span>{Math.round(scale*100)}%</span><button aria-label="放大图谱" disabled={scale>=1.5} onClick={()=>setZoom(Math.min(1.5,scale+.1))}><Icon name="plus-circle" size={17}/></button><button onClick={()=>{setZoom(null);if(viewport.current){viewport.current.scrollTop=0;viewport.current.scrollLeft=0;}}}>适应画布</button>
  </div>
 </section>;
}
