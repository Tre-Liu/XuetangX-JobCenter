import {useMemo,useState,useRef,useEffect} from 'react';
import {Icon} from '../components/Icon';
import {useKnowledgeEnabled} from '../knowledge/availability.mjs';
import {buildCourseMap,traceCourseChain} from './model.mjs';
import {layoutCourseMap} from './layout.mjs';
import './course-panorama.css';
const currentCourse={id:'current-course',title:'智能制造岗位项目课程'};
export function CoursePanorama({projects,knowledge,cmsConfig,course=currentCourse}){
 const knowledgeEnabled=useKnowledgeEnabled();
 const graph=useMemo(()=>buildCourseMap({course,projects,knowledge,knowledgeEnabled,cmsConfig}),[course,projects,knowledge,knowledgeEnabled,cmsConfig]);
 const layout=useMemo(()=>layoutCourseMap(graph),[graph]);
 const [selected,setSelected]=useState(graph.rootId),[zoom,setZoom]=useState(null),[available,setAvailable]=useState(1200);
 const viewport=useRef(null);
 useEffect(()=>{const el=viewport.current;const measure=()=>{if(el?.clientWidth)setAvailable(el.clientWidth);};measure();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;observer?.observe(el);return()=>observer?.disconnect();},[]);
 const active=graph.nodes.find(n=>n.id===selected)||graph.nodes.find(n=>n.id===graph.rootId);
 const focus=useMemo(()=>traceCourseChain(graph,active?.id),[graph,active?.id]);
 const scale=zoom??Math.min(1,Math.max(.5,(available-24)/layout.width));
 const choose=id=>setSelected(previous=>previous===id?graph.rootId:id);
 return <section className="course-panorama" aria-label="课程关联全景图谱">
  <header className="panorama-head"><div><h2>课程关联全景图谱</h2><p>以“{course.title}”为起点，点击节点点亮上下游链路，再次点击恢复全图</p></div><div className="panorama-zoom" aria-label="图谱缩放"><button aria-label="缩小图谱" disabled={scale<=.5} onClick={()=>setZoom(Math.max(.5,scale-.1))}><Icon name="minus-circle" size={17}/></button><span>{Math.round(scale*100)}%</span><button aria-label="放大图谱" disabled={scale>=1.5} onClick={()=>setZoom(Math.min(1.5,scale+.1))}><Icon name="plus-circle" size={17}/></button><button onClick={()=>setZoom(null)}>适应画布</button></div></header>
  <div className="panorama-viewport" ref={viewport} role="region" aria-label="课程关联链路画布，可滚动" tabIndex={0} onClick={event=>{if(!event.target.closest('button'))setSelected(graph.rootId);}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();setSelected(graph.rootId);}}}>
   <div className="panorama-sized" style={{width:layout.width*scale,height:layout.height*scale}}>
    <div className="panorama-world" style={{width:layout.width,height:layout.height,transform:`scale(${scale})`}}>
     <svg className="panorama-edges" width={layout.width} height={layout.height} aria-hidden="true">{layout.paths.map(path=><path key={path.id} d={path.d} data-edge-id={path.id} className={focus.edgeIds.has(path.id)?'is-hot':'is-dimmed'}/>)}</svg>
     {layout.labels.map(label=><div className={`panorama-lane-label tone-${label.kind}`} key={label.kind} style={{left:label.x,top:label.y}}>{label.title}</div>)}
     {layout.boxes.map(node=><button key={node.id} type="button" className={`panorama-node tone-${node.kind}${node.id===active?.id?' is-selected':''}${focus.nodeIds.has(node.id)?' is-related':' is-dimmed'}${node.id===graph.rootId?' is-root':''}`} data-node-id={node.id} data-kind={node.kind} title={node.title} aria-pressed={active?.id===node.id} onClick={()=>choose(node.id)} style={{left:node.x,top:node.y,width:node.w,height:node.h}}>
      {['course','major','chain'].includes(node.kind)&&<span className="panorama-kicker">{node.kind==='course'?'当前课程':node.kind==='major'?'关联专业':'产业链'}</span>}
      <strong>{node.title}</strong>{node.kind!=='major'&&node.description&&<small>{node.description}</small>}
      {node.review&&<em>{node.review.includes('复核')&&!node.review.includes('已复核')?'待复核':node.review}</em>}
     </button>)}
    </div>
   </div>
  </div>

 </section>;
}
