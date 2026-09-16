import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, MinusIcon, Crosshair2Icon, ReaderIcon } from '@radix-ui/react-icons';
import { abilities, abilityCounts, flattenAbilities, type Ability } from './ability-data';

type Point={x:number;y:number};
type Placed={node:Ability;x:number;y:number;parent?:string;color:number};
const WIDTH=210,HEIGHT=112,STEP=144;
function layout(expanded:Set<string>){
 const result:Placed[]=[];let row=0;
 const visit=(node:Ability,depth:number,parent?:string,color=0):Placed=>{
  const item={node,x:depth*265,y:0,parent,color};result.push(item);
  const children=(node.id==='course'||expanded.has(node.id))?node.children||[]:[];
  if(children.length){const placed=children.map((n,i)=>visit(n,depth+1,node.id,i%4));item.y=(placed[0].y+placed[placed.length-1].y)/2}
  else{item.y=row*STEP;row++}return item;
 };
 visit({id:'course',name:'电路原理',children:abilities},0);return result;
}
export default function AbilityCanvas({expanded,onExpanded,onSelect}:{expanded:Set<string>;onExpanded:(value:Set<string>)=>void;onSelect:(id:string)=>void}){
 const host=useRef<HTMLDivElement>(null),points=useRef(new Map<number,Point>()),gesture=useRef({x:0,y:0,moved:false});
 const [size,setSize]=useState({w:393,h:600});
 const [view,setView]=useState({x:16,y:80,z:.72});
 const placed=useMemo(()=>layout(expanded),[expanded]);
 const initialized=useRef(false);
 useEffect(()=>{const el=host.current;if(!el)return;const ob=new ResizeObserver(([entry])=>{const {width:w,height:h}=entry.contentRect;if(!w||!h)return;setSize({w,h});if(!initialized.current){initialized.current=true;setView({x:16,y:h/2-216*.72-56*.72-20,z:.72})}});ob.observe(el);return()=>ob.disconnect()},[]);
 const reset=()=>{const root=placed[0];setView({x:16,y:size.h/2-(root.y+HEIGHT/2)*.72-20,z:.72})};
 const scaleAt=(z:number,anchor:Point)=>setView(v=>{const next=Math.max(.4,Math.min(1.6,z));return {z:next,x:anchor.x-(anchor.x-v.x)*next/v.z,y:anchor.y-(anchor.y-v.y)*next/v.z}});
 const local=(x:number,y:number)=>{const b=host.current!.getBoundingClientRect();return {x:(x-b.left)*size.w/b.width,y:(y-b.top)*size.h/b.height}};
 const toggle=(item:Placed)=>{const next=new Set(expanded);next.has(item.node.id)?next.delete(item.node.id):next.add(item.node.id);const target=layout(next).find(n=>n.node.id===item.node.id)!;setView(v=>({...v,y:v.y+(item.y-target.y)*v.z}));onExpanded(next)};
 return <div className="ability-canvas-shell">
  <div className="ability-pan-area" ref={host} aria-label="能力图谱画布，可拖动和缩放"
   onPointerDown={e=>{points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.current.size===1)gesture.current={x:e.clientX,y:e.clientY,moved:false};else gesture.current.moved=true;}}
   onPointerMove={e=>{const prev=points.current.get(e.pointerId);if(!prev)return;const next={x:e.clientX,y:e.clientY};if(Math.hypot(next.x-gesture.current.x,next.y-gesture.current.y)>6){gesture.current.moved=true;e.currentTarget.setPointerCapture(e.pointerId)}
    if(points.current.size===2){const other=[...points.current.entries()].find(([id])=>id!==e.pointerId)![1];const a=local(prev.x,prev.y),b=local(next.x,next.y),o=local(other.x,other.y);const before=Math.hypot(a.x-o.x,a.y-o.y),after=Math.hypot(b.x-o.x,b.y-o.y);if(before>0)setView(v=>{const z=Math.max(.4,Math.min(1.6,v.z*after/before));return {z,x:(b.x+o.x)/2-((a.x+o.x)/2-v.x)*z/v.z,y:(b.y+o.y)/2-((a.y+o.y)/2-v.y)*z/v.z}})}
    else if(gesture.current.moved){const a=local(prev.x,prev.y),b=local(next.x,next.y);setView(v=>({...v,x:v.x+b.x-a.x,y:v.y+b.y-a.y}))}points.current.set(e.pointerId,next);}}
   onPointerUp={e=>{points.current.delete(e.pointerId)}} onPointerCancel={e=>{points.current.delete(e.pointerId);gesture.current.moved=true}}
   onClickCapture={e=>{if(gesture.current.moved){e.preventDefault();e.stopPropagation()}}}
   onWheel={e=>{scaleAt(view.z*(e.deltaY>0?.92:1.08),local(e.clientX,e.clientY))}}>
   <div className="ability-canvas-world" style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.z})`}}>
    <svg className="ability-connections" width="2000" height="15000" aria-hidden="true">{placed.filter(p=>p.parent).map(p=>{const parent=placed.find(n=>n.node.id===p.parent)!;const x=parent.x+WIDTH,y=parent.y+HEIGHT/2;return <path key={p.node.id} d={`M${x} ${y} C${x+30} ${y},${p.x-30} ${p.y+HEIGHT/2},${p.x} ${p.y+HEIGHT/2}`}/>})}</svg>
    {placed.map(item=>{const {node}=item;const counts=abilityCounts(node);const height=node.id==='course'?156:node.tag?112:82;return <article key={node.id} className={`ability-canvas-card color-${item.color} ${node.id==='course'?'course-card':''}`} style={{left:item.x,top:item.y+(HEIGHT-height)/2,width:WIDTH,height}}>
     {node.id==='course'?<div className="canvas-course"><strong>电路原理</strong><div className="canvas-course-stats"><span>能力点<small>示例</small><b>{flattenAbilities().length}</b></span><span>知识点<b>{counts.knowledge}</b></span><span>学习内容<b>{counts.units}</b></span></div></div>:<><button className="canvas-node-title" aria-label={`查看${node.name}`} onClick={()=>onSelect(node.id)}><strong>{node.name}</strong>{node.tag&&<span className="ability-tag">{node.tag}</span>}</button><button className="canvas-node-counts" aria-label={`${node.name}学习内容`} onClick={()=>onSelect(node.id)}><span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M1 6 8 2l7 4-7 4-7-4Zm3 2v4c2 2 6 2 8 0V8M14 7v5"/></svg>知识点: {counts.knowledge}个</span><span><ReaderIcon/>学习单元: {counts.units}个</span></button>{!!node.children?.length&&<button className="canvas-expand" aria-label={`${expanded.has(node.id)?'收起':'展开'}${node.name}`} aria-expanded={expanded.has(node.id)} onClick={()=>toggle(item)}>{expanded.has(node.id)?<ChevronDownIcon/>:<span>{node.children.length}</span>}</button>}</>}
    </article>})}
   </div>
  </div>
  <div className="ability-canvas-tools"><button aria-label="缩小能力图谱" onClick={()=>scaleAt(view.z-.12,{x:size.w/2,y:size.h/2})}><MinusIcon/></button><span>{Math.round(view.z*100)}%</span><button aria-label="放大能力图谱" onClick={()=>scaleAt(view.z+.12,{x:size.w/2,y:size.h/2})}><PlusIcon/></button><i/><button aria-label="回到能力图谱起点" onClick={reset}><Crosshair2Icon/></button></div>
  <p className="ability-canvas-hint">拖动画布 · 双指缩放 · 点击节点查看内容</p>
 </div>
}
