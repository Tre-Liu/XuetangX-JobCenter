import { useEffect, useMemo, useRef, useState } from 'react';
import { PlusIcon, MinusIcon, Crosshair2Icon, Share2Icon, ReaderIcon } from '@radix-ui/react-icons';
import { BottomSheet, useKeyboard } from './mobile';
import { nodes, customViewNodes, findNodes, type KnowledgeNode } from './course-data';
import { childCount, visibleNodes } from './graph-model';
import GraphDirectory from './GraphDirectory';
import GraphHeader from './GraphHeader';
export default function GraphView(){
 const canvas=useRef<HTMLCanvasElement>(null),wrap=useRef<HTMLDivElement>(null);
 const [view,setView]=useState({x:0,y:0,z:1});
 const [selected,setSelected]=useState<KnowledgeNode|null>(null),[directory,setDirectory]=useState(false);
 const [showResources,setShowResources]=useState(false);
 const [expanded,setExpanded]=useState(()=>new Set(['root']));
 const keyboard=useKeyboard();
 const pointers=useRef(new Map<number,{x:number;y:number}>());
 const movement=useRef({x:0,y:0,moved:false});
 const [size,setSize]=useState({w:393,h:690});
 const placed=useMemo(()=>{const anchors=[[-90,-165],[100,-190],[-115,-45],[115,-30],[-105,105],[105,115],[-95,235],[105,235]];return customViewNodes.map(n=>{if(n.id==='root')return {...n,x:0,y:0};const index=Number(n.id.split('-')[1]),[x,y]=anchors[index];if(n.parentId==='root')return {...n,x,y};const parent=customViewNodes.find(p=>p.id===n.parentId)!;return {...n,x:x+n.x-parent.x,y:y+n.y-parent.y}})},[]);
 const visible=useMemo(()=>visibleNodes(placed,expanded),[placed,expanded]);
 useEffect(()=>{const obs=new ResizeObserver(([e])=>{if(e.contentRect.width&&e.contentRect.height)setSize({w:e.contentRect.width,h:e.contentRect.height})});if(wrap.current)obs.observe(wrap.current);return()=>obs.disconnect()},[]);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
  const dpr=window.devicePixelRatio||1;el.width=size.w*dpr;el.height=size.h*dpr;ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,size.w,size.h);
  ctx.translate(size.w/2+view.x,size.h*.46+view.y);ctx.scale(view.z,view.z);
  ctx.strokeStyle='#cbd3e6';ctx.lineWidth=.8;ctx.setLineDash([2,3]);
  visible.forEach(n=>{const p=visible.find(p=>p.id===n.parentId);if(p){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);ctx.stroke()}});ctx.setLineDash([]);
  visible.forEach(n=>{
   const root=n.id==='root',chapter=n.parentId==='root',index=Number(n.id.split('-')[1]);
   const r=root?32:chapter?14:10,color=root?'#6275ff':index<3?'#49c4c9':index<6?'#9a77ef':'#7d7cf1';
   if(root){ctx.strokeStyle='#ccd3fb';ctx.lineWidth=1.3;[38,42].forEach((radius,i)=>{ctx.beginPath();ctx.arc(n.x,n.y,radius,.2+i*.7,Math.PI*1.75+i*.7);ctx.stroke()})}
   ctx.shadowColor=color+'80';ctx.shadowBlur=root?15:7;
   const gradient=ctx.createRadialGradient(n.x-3,n.y-5,1,n.x,n.y,r);gradient.addColorStop(0,root?'#9caaff':index<3?'#92e0df':'#b9a5ff');gradient.addColorStop(1,color);
   ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   if(selected?.id===n.id){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(n.x,n.y,r+4,0,Math.PI*2);ctx.stroke()}
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='white';ctx.font=root?'600 18px "PingFang SC",sans-serif':'600 12px "PingFang SC",sans-serif';
   if(root){ctx.fillText('电路',n.x,n.y-10);ctx.fillText('原理',n.x,n.y+11)}else{
    const count=childCount(nodes,n.id);if(count)ctx.fillText(String(count),n.x,n.y);
    ctx.font='11px "PingFang SC",sans-serif';const label=n.name.length>11?n.name.slice(0,10)+'…':n.name;
    const width=ctx.measureText(label).width+16,labelY=n.y+r+16;
    if(chapter){ctx.fillStyle=index<3?'#d9f0f2':'#e8e1ff';ctx.strokeStyle=index<3?'#c0e4e9':'#d9cdf8';ctx.lineWidth=.8;ctx.beginPath();ctx.roundRect(n.x-width/2,labelY-11,width,22,11);ctx.fill();ctx.stroke()}
    ctx.fillStyle=index<3?'#408e99':'#7164aa';ctx.fillText(label,n.x,labelY);
   }
  });
 },[view,size,visible,selected]);
 const zoom=(delta:number)=>setView(v=>({...v,z:Math.min(2.2,Math.max(.45,v.z+delta))}));
 function hit(clientX:number,clientY:number){const b=canvas.current!.getBoundingClientRect();const x=((clientX-b.left)*size.w/b.width-size.w/2-view.x)/view.z,y=((clientY-b.top)*size.h/b.height-size.h*.46-view.y)/view.z;return [...visible].reverse().find(n=>Math.hypot(n.x-x,n.y-y)<(n.id==='root'?39:29));}
 function locate(n:KnowledgeNode){keyboard.hide();setDirectory(false);setExpanded(prev=>{const next=new Set(prev);let p=n.parentId;while(p){next.add(p);p=nodes.find(a=>a.id===p)?.parentId||null}return next});const point=placed.find(p=>p.id===n.id)!;setView({x:-point.x,y:-point.y,z:1});setShowResources(false);setSelected(n);}
 function toggleBranch(){if(!selected)return;setExpanded(prev=>{const next=new Set(prev);if(next.has(selected.id))next.delete(selected.id);else next.add(selected.id);return next});setSelected(null);}
 const related=selected?nodes.filter(n=>n.parentId===selected.id||n.id===selected.parentId):[];
 return <div className="graph-view" ref={wrap}>
  <canvas ref={canvas} role="img" aria-label="电路原理知识图谱，可拖动和缩放；使用目录查看全部知识点" style={{width:'100%',height:'100%',touchAction:'none'}}
   onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});movement.current={x:e.clientX,y:e.clientY,moved:false};}}
   onPointerMove={e=>{const prev=pointers.current.get(e.pointerId);if(!prev)return;const next={x:e.clientX,y:e.clientY};if(Math.hypot(next.x-movement.current.x,next.y-movement.current.y)>5)movement.current.moved=true;
    const b=e.currentTarget.getBoundingClientRect();const dx=(next.x-prev.x)*size.w/b.width,dy=(next.y-prev.y)*size.h/b.height;
    if(pointers.current.size===2){movement.current.moved=true;const other=[...pointers.current.entries()].find(([id])=>id!==e.pointerId)![1];const before=Math.hypot(prev.x-other.x,prev.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);if(before>0)setView(v=>({...v,z:Math.min(2.2,Math.max(.45,v.z*after/before))}));}
    else if(movement.current.moved)setView(v=>({...v,x:v.x+dx,y:v.y+dy}));pointers.current.set(e.pointerId,next);}}
   onPointerCancel={e=>{pointers.current.delete(e.pointerId);movement.current.moved=true;}}
   onPointerUp={e=>{pointers.current.delete(e.pointerId);if(movement.current.moved)return;const n=hit(e.clientX,e.clientY);if(n){keyboard.hide();setShowResources(false);setSelected(n)}}}
   onWheel={e=>zoom(e.deltaY>0?-.08:.08)} />
  <GraphHeader type="知识图谱" noun="知识点" onDirectory={()=>{keyboard.hide();setDirectory(true)}}/>
  <div className="graph-tools"><button aria-label="缩小" onClick={()=>zoom(-.15)}><MinusIcon/></button><span>{Math.round(view.z*100)}%</span><button aria-label="放大" onClick={()=>zoom(.15)}><PlusIcon/></button><i/><button aria-label="回到中心" onClick={()=>setView({x:0,y:0,z:1})}><Crosshair2Icon/></button></div>
  <div className="graph-hint">数字表示下级节点数 · 点击节点查看关联</div>
  <GraphDirectory open={directory} onOpenChange={setDirectory} title="知识点目录" course="电路原理" noun="知识点" items={findNodes('').map(n=>({id:n.id,name:n.name,keywords:n.en,parentId:n.parentId,kinds:n.resources,description:`${childCount(nodes,n.id)} 个下级节点`}))} onLocate={id=>locate(nodes.find(n=>n.id===id)!)}/>
  <BottomSheet open={!!selected} onOpenChange={o=>{if(!o)setSelected(null)}} title={selected?.name||'知识点详情'} description="知识点详情" snap={.84}>
   {selected&&<div className="entity-detail">
    <div className="knowledge-detail-stats"><article><ReaderIcon/><div><span>关联学习内容</span><b>{selected.resources.length}<small> 项</small></b></div><button onClick={()=>setShowResources(!showResources)}>{showResources?'收起':'查看内容'}</button></article><article><Share2Icon/><div><span>学习记录</span><b>待同步</b></div><button onClick={()=>{const point=placed.find(p=>p.id===selected.id)!;setView({x:-point.x,y:-point.y,z:1});setSelected(null)}}>定位节点</button></article></div>
    {showResources&&<section className="knowledge-resource-card"><h3>学习内容</h3>{selected.resources.length?selected.resources.map((name,i)=><p key={i}><ReaderIcon/>{name}<small>资源待同步</small></p>):<p>暂无关联学习内容</p>}</section>}
    <section className="knowledge-intro"><h3>知识点介绍</h3><p>暂无知识点介绍</p></section>
    <div className="entity-actions"><span>{childCount(nodes,selected.id)?`${childCount(nodes,selected.id)} 个下级节点`:'无下级节点'}</span><button className="sheet-close" onClick={()=>setSelected(null)}>关闭详情</button>{childCount(nodes,selected.id)>0&&<button className="branch-action" onClick={toggleBranch}><Share2Icon/>{expanded.has(selected.id)?'收起节点':'展开节点'}</button>}</div><section className="relation-card"><h3>相关知识点</h3><div className="relation-diagram"><button className="relation-entity current" onClick={()=>setSelected(selected)}><span/>{selected.name}</button>{related.length?<div className="relation-children">{related.map(n=><button className="relation-entity" key={n.id} onClick={()=>locate(n)}><span/>{n.name}<small>{n.id===selected.parentId?'上级节点':'下级节点'}</small></button>)}</div>:<p className="empty">暂无关联知识点</p>}</div></section></div>}
  </BottomSheet>
 </div>;
}
