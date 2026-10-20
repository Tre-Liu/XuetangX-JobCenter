import {useMemo,useState,useRef,useEffect} from 'react';
import {Icon} from '../components/Icon';
import {useKnowledgeEnabled} from '../knowledge/availability.mjs';
import {buildCourseMap,panoramaGraph,traceCourseChain} from './model.mjs';
import {layoutCoursePanorama} from './layout.mjs';
import './course-panorama.css';
import {withPanoramaDemoAbilities} from './demo-abilities.mjs';
const currentCourse={id:'current-course',title:'电气控制与PLC'};
export function CoursePanorama({projects,knowledge,cmsConfig,course=currentCourse}){
 const knowledgeEnabled=useKnowledgeEnabled();
 const graph=useMemo(()=>withPanoramaDemoAbilities(panoramaGraph(buildCourseMap({course,projects,knowledge,knowledgeEnabled,cmsConfig}))),[course,projects,knowledge,knowledgeEnabled,cmsConfig]);
 const [expandedRole,setExpandedRole]=useState(null),[expandedActivity,setExpandedActivity]=useState(null);
 const [expandedIndustry,setExpandedIndustry]=useState(null),[expandedCourse,setExpandedCourse]=useState(false);
 const [abilityKnowledge,setAbilityKnowledge]=useState(null);
 const [selected,setSelected]=useState(graph.rootId),[zoom,setZoom]=useState(1),[available,setAvailable]=useState(1200);
 const viewport=useRef(null);
 useEffect(()=>{const el=viewport.current;const measure=()=>{if(el?.clientWidth)setAvailable(el.clientWidth);};measure();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;observer?.observe(el);return()=>observer?.disconnect();},[]);
 const active=graph.nodes.find(n=>n.id===selected)||graph.nodes.find(n=>n.id===graph.rootId);
 const selectedKnowledge=active?.kind==='knowledge'?active.id:active?.kind==='ability'?abilityKnowledge:null;
 const layout=useMemo(()=>layoutCoursePanorama(graph,{expandedRole,expandedActivity,expandedIndustry,expandedCourse,selectedKnowledge}),[graph,expandedRole,expandedActivity,expandedIndustry,expandedCourse,selectedKnowledge]);
 const focus=useMemo(()=>traceCourseChain(graph,active?.id),[graph,active?.id]);
 const directIds=new Set(graph.edges.filter(e=>e.from===active?.id||e.to===active?.id).flatMap(e=>[e.from,e.to]));
 const directEdgeIds=new Set(graph.edges.filter(e=>e.from===active?.id||e.to===active?.id).map(e=>e.id));
 const scale=zoom??Math.min(1,Math.max(.25,(available-24)/layout.width));
 const choose=id=>{const kind=graph.nodes.find(n=>n.id===id)?.kind;if(kind==='knowledge')setAbilityKnowledge(selected===id?null:id);else if(kind!=='ability'||selected===id)setAbilityKnowledge(null);setSelected(previous=>previous===id?graph.rootId:id);};
 const linkedKnowledge=new Set(graph.edges.filter(e=>graph.nodes.find(n=>n.id===e.from)?.kind==='ability'&&graph.nodes.find(n=>n.id===e.to)?.kind==='knowledge').map(e=>e.from));
 const roleExpandable=id=>traceCourseChain(graph,id).nodeIds.size>0&&graph.nodes.some(n=>n.kind==='ability'&&traceCourseChain(graph,id).nodeIds.has(n.id));
 const activityExpandable=id=>graph.edges.some(e=>e.from===id&&graph.nodes.find(n=>n.id===e.to)?.kind==='knowledge');
 return <section className="course-panorama" aria-label="课程关联全景图谱">
  <header className="panorama-head"><div><h2>课程关联全景图谱</h2><p>以“{course.title}”为起点，点击节点点亮上下游链路，再次点击恢复全图</p></div><div className="panorama-zoom" aria-label="图谱缩放"><button aria-label="缩小图谱" disabled={scale<=.25} onClick={()=>setZoom(Math.max(.25,scale-.1))}><Icon name="minus-circle" size={17}/></button><span>{Math.round(scale*100)}%</span><button aria-label="放大图谱" disabled={scale>=1.5} onClick={()=>setZoom(Math.min(1.5,scale+.1))}><Icon name="plus-circle" size={17}/></button><button onClick={()=>setZoom(null)}>适应画布</button></div></header>
  <div className="panorama-viewport" ref={viewport} role="region" aria-label="课程关联链路画布，可滚动" tabIndex={0} onClick={event=>{if(!event.target.closest('button'))setSelected(graph.rootId);}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setSelected(graph.rootId);}}}>
   <div className="panorama-sized" style={{width:layout.width*scale,height:layout.height*scale}}>
    <div className="panorama-world" style={{width:layout.width,height:layout.height,transform:`scale(${scale})`}}>
     <svg className="panorama-edges" width={layout.width} height={layout.height} aria-hidden="true">{layout.paths.map(path=><path key={path.id} d={path.d} data-edge-id={path.id} className={(focus.edgeIds.has(path.id)||(path.displayLink&&focus.nodeIds.has(path.from)&&focus.nodeIds.has(path.to)))?`is-hot${active?.id!==graph.rootId&&directEdgeIds.has(path.id)?' is-direct-edge':''}`:'is-dimmed'}/>)}</svg>
     {layout.labels.map(label=><div className={`panorama-lane-label tone-${label.kind}`} key={label.kind} style={{left:label.x,top:label.y}}>{label.title}</div>)}
     {layout.groups.map(group=><section key={group.id} className={`panorama-group tone-${group.kind}`} aria-label={group.title|| (group.kind==='ability-region'?'岗位任务与能力区':'知识点区')} style={{left:group.x,top:group.y,width:group.w,height:group.h}}>{group.title&&<h3>{group.title}</h3>}{group.kind==='ability-region'&&<><div className="panorama-point-legend"><span><i className="category-knowledge"/>知识</span><span><i className="category-skill"/>技能</span><span><i className="category-quality"/>素养</span></div><p>明亮：有关联 · 暗色：暂无关联</p></>}</section>)}
     {layout.boxes.map(node=>{
      const point=['ability','knowledge'].includes(node.kind),expandable=node.kind==='role'?roleExpandable(node.id):node.kind==='course'?graph.nodes.some(n=>n.kind==='project'):node.kind==='activity'&&activityExpandable(node.id);
      const opened=node.kind==='role'?expandedRole===node.id:node.kind==='course'?expandedCourse:expandedActivity===node.id;
      const category=node.description==='技能'?'skill':node.description==='素养'?'quality':'knowledge';
      const related=focus.nodeIds.has(node.id)&&(node.kind!=='ability'||active?.id===node.id||linkedKnowledge.has(node.id));
      return <div key={node.id} className="panorama-entity" style={{left:node.x,top:node.y,width:node.w,height:node.h}}><button key={node.id} type="button" className={`panorama-node tone-${node.kind}${point?' panorama-point category-'+category:''}${node.id===active?.id?' is-selected':''}${related?' is-related'+(active?.id!==graph.rootId&&directIds.has(node.id)&&node.id!==active?.id?' is-direct':''):' is-dimmed'}${node.id===graph.rootId?' is-root':''}`} aria-label={point?node.title:undefined} data-node-id={node.id} data-kind={node.kind} title={node.title} aria-pressed={active?.id===node.id} onClick={()=>choose(node.id)} style={{width:node.w,height:node.h}}>
      {['course','major','chain'].includes(node.kind)&&<span className="panorama-kicker">{node.kind==='course'?'当前课程':node.kind==='major'?'关联专业':'产业链'}</span>}
      {point?<span className="panorama-point-tooltip" role="tooltip">{node.title}</span>:<strong>{node.title}</strong>}{!point&&node.kind!=='major'&&node.description&&<small>{node.description}</small>}
      {!point&&node.review&&<em>{node.review.includes('复核')&&!node.review.includes('已复核')?'待复核':node.review}</em>}
     </button>{expandable&&<button type="button" className="panorama-expand" aria-label={`${opened?'收起':'展开'}${node.title}的${node.kind==='role'?'能力项':node.kind==='course'?'课程项目':'知识点'}`} aria-expanded={opened} onClick={()=>{if(node.kind==='role')setExpandedRole(opened?null:node.id);else if(node.kind==='course'){setExpandedCourse(!opened);if(opened)setExpandedActivity(null);}else setExpandedActivity(opened?null:node.id);setSelected(node.id);}}><span aria-hidden="true">{opened?'‹':'›'}</span></button>}{node.kind==='role'&&graph.edges.some(e=>e.to===node.id&&['chain','segment'].includes(graph.nodes.find(n=>n.id===e.from)?.kind))&&<button type="button" className="panorama-expand panorama-expand-left" aria-label={`${expandedIndustry===node.id?'收起':'展开'}${node.title}的产业关联`} aria-expanded={expandedIndustry===node.id} onClick={()=>{setExpandedIndustry(expandedIndustry===node.id?null:node.id);setSelected(node.id);}}><span aria-hidden="true">{expandedIndustry===node.id?'›':'‹'}</span></button>}</div>;
     })}
    </div>
   </div>
  </div>

 </section>;
}
