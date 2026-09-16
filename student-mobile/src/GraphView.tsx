import { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, MinusIcon, Crosshair2Icon, ListBulletIcon, ChevronRightIcon, ChevronDownIcon, Share2Icon, MagicWandIcon } from '@radix-ui/react-icons';
import { BottomSheet, KeyboardInput, useKeyboard } from './mobile';
import { nodes, customViewNodes, findNodes, type KnowledgeNode } from './course-data';
import { childCount, visibleNodes } from './graph-model';
export default function GraphView(){
 const canvas=useRef<HTMLCanvasElement>(null),wrap=useRef<HTMLDivElement>(null);
 const [view,setView]=useState({x:0,y:0,z:1});
 const [selected,setSelected]=useState<KnowledgeNode|null>(null),[directory,setDirectory]=useState(false),[query,setQuery]=useState('');
 const [custom,setCustom]=useState(false),[layoutMenu,setLayoutMenu]=useState(false);
 const [expanded,setExpanded]=useState(()=>new Set(['root']));
 const keyboard=useKeyboard();
 const pointers=useRef(new Map<number,{x:number;y:number}>());
 const movement=useRef({x:0,y:0,moved:false});
 const [size,setSize]=useState({w:393,h:690});
 const placed=custom?customViewNodes:nodes;
 const visible=useMemo(()=>visibleNodes(placed,expanded),[placed,expanded]);
 useEffect(()=>{const obs=new ResizeObserver(([e])=>{if(e.contentRect.width&&e.contentRect.height)setSize({w:e.contentRect.width,h:e.contentRect.height})});if(wrap.current)obs.observe(wrap.current);return()=>obs.disconnect()},[]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setLayoutMenu(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
  const dpr=window.devicePixelRatio||1;el.width=size.w*dpr;el.height=size.h*dpr;ctx.scale(dpr,dpr);
  const bg=ctx.createRadialGradient(20,0,0,150,100,size.h);bg.addColorStop(0,'#b2c7f5');bg.addColorStop(.45,'#e6f0ff');bg.addColorStop(1,'#f6f6ff');ctx.fillStyle=bg;ctx.fillRect(0,0,size.w,size.h);
  ctx.translate(size.w/2+view.x,size.h*.46+view.y);ctx.scale(view.z,view.z);
  ctx.strokeStyle='#aabce0';ctx.lineWidth=.8;ctx.setLineDash([2,3]);
  visible.forEach(n=>{const p=visible.find(p=>p.id===n.parentId);if(p){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);ctx.stroke()}});ctx.setLineDash([]);
  visible.forEach(n=>{
   const root=n.id==='root',r=root?34:22;const color=root?'#5970ff':n.status==='学习中'?'#45c2c6':'#658fdf';
   ctx.shadowColor=color;ctx.shadowBlur=root?17:8;
   const g=ctx.createRadialGradient(n.x-4,n.y-5,2,n.x,n.y,r);g.addColorStop(0,root?'#8196ff':n.status==='学习中'?'#7de2df':'#98bcf2');g.addColorStop(1,color);ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   if(selected?.id===n.id||root){ctx.strokeStyle='#7199e3';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(n.x,n.y,r+5,0,Math.PI*2);ctx.stroke();}
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='white';ctx.font=root?'18px sans-serif':'14px sans-serif';
   if(root){ctx.fillText('电路',n.x,n.y-10);ctx.fillText('原理',n.x,n.y+11)}else{const count=childCount(nodes,n.id);if(count)ctx.fillText(String(count),n.x,n.y);ctx.fillStyle='#536b8c';ctx.font='12px sans-serif';const label=n.name.length>16?n.name.slice(0,16)+'…':n.name;ctx.fillText(label,n.x,n.y+r+17);if(n.en){ctx.font='10px sans-serif';ctx.fillText(n.en.length>30?n.en.slice(0,30)+'…':n.en,n.x,n.y+r+33)}}
  });
 },[view,size,visible,selected]);
 const zoom=(delta:number)=>setView(v=>({...v,z:Math.min(2.2,Math.max(.45,v.z+delta))}));
 function hit(clientX:number,clientY:number){const b=canvas.current!.getBoundingClientRect();const x=((clientX-b.left)*size.w/b.width-size.w/2-view.x)/view.z,y=((clientY-b.top)*size.h/b.height-size.h*.46-view.y)/view.z;return [...visible].reverse().find(n=>Math.hypot(n.x-x,n.y-y)<(n.id==='root'?39:29));}
 function locate(n:KnowledgeNode){keyboard.hide();setDirectory(false);setExpanded(prev=>{const next=new Set(prev);let p=n.parentId;while(p){next.add(p);p=nodes.find(a=>a.id===p)?.parentId||null}return next});const point=placed.find(p=>p.id===n.id)!;setView({x:-point.x,y:-point.y,z:1});setSelected(n);}
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
   onPointerUp={e=>{pointers.current.delete(e.pointerId);if(movement.current.moved)return;const n=hit(e.clientX,e.clientY);if(n){keyboard.hide();setSelected(n)}}}
   onWheel={e=>zoom(e.deltaY>0?-.08:.08)} />
  <div className="graph-heading"><strong>电路原理</strong><span>{nodes.length-1} 个知识点 · 示例</span></div>
  <div className="graph-actions"><button className="view-trigger" aria-expanded={layoutMenu} onClick={()=>setLayoutMenu(!layoutMenu)}><MagicWandIcon/>{custom?'自定义视图':'默认视图'}<ChevronDownIcon/></button><button className="icon-button" aria-label="搜索知识点" onClick={()=>setDirectory(true)}><MagnifyingGlassIcon/></button></div>
  {layoutMenu&&<><button className="layout-dismiss" aria-label="关闭视图菜单" onClick={()=>setLayoutMenu(false)}/><div className="layout-menu" role="menu"><button role="menuitemradio" aria-checked={!custom} onClick={()=>{setCustom(false);setView({x:0,y:0,z:1});setLayoutMenu(false)}}>默认视图</button><button role="menuitemradio" aria-checked={custom} onClick={()=>{setCustom(true);setView({x:0,y:0,z:1});setLayoutMenu(false)}}>自定义视图</button></div></>}
  <div className="graph-tools"><button onClick={()=>setDirectory(true)}><ListBulletIcon/>目录</button><i/><button aria-label="缩小" onClick={()=>zoom(-.15)}><MinusIcon/></button><span>{Math.round(view.z*100)}%</span><button aria-label="放大" onClick={()=>zoom(.15)}><PlusIcon/></button><i/><button aria-label="回到中心" onClick={()=>setView({x:0,y:0,z:1})}><Crosshair2Icon/></button></div>
  <div className="graph-hint">数字表示下级节点数 · 点击节点查看关联</div>
  <BottomSheet open={directory} onOpenChange={o=>{keyboard.hide();setDirectory(o)}} title="知识点目录" description="电路原理 · 按名称搜索和定位知识点" snap={.78}>
   <button className="sheet-close" onClick={()=>{keyboard.hide();setDirectory(false)}}>关闭目录</button><div className="search-field"><MagnifyingGlassIcon/><KeyboardInput aria-label="搜索知识点名称" placeholder="搜索知识点名称" value={query} onChange={e=>setQuery(e.target.value)}/></div>
   <div className="node-list">{findNodes(query).map(n=><button key={n.id} onClick={()=>locate(n)}><span><b>{n.name}</b><small>{childCount(nodes,n.id)} 个下级节点</small></span><ChevronRightIcon/></button>)}{!findNodes(query).length&&<p className="empty">没有找到相关知识点</p>}</div>
  </BottomSheet>
  <BottomSheet open={!!selected} onOpenChange={o=>{if(!o)setSelected(null)}} title={selected?.name||'知识点详情'} description="相关知识点" snap={.49}>
   {selected&&<div className="entity-detail"><div className="entity-actions"><span>{childCount(nodes,selected.id)?`${childCount(nodes,selected.id)} 个下级节点`:'无下级节点'}</span><button className="sheet-close" onClick={()=>setSelected(null)}>关闭详情</button>{childCount(nodes,selected.id)>0&&<button className="branch-action" onClick={toggleBranch}><Share2Icon/>{expanded.has(selected.id)?'收起节点':'展开节点'}</button>}</div><section className="relation-card"><h3>相关知识点</h3><div className="relation-diagram"><button className="relation-entity current" onClick={()=>setSelected(selected)}><span/>{selected.name}</button>{related.length?<div className="relation-children">{related.map(n=><button className="relation-entity" key={n.id} onClick={()=>locate(n)}><span/>{n.name}<small>{n.id===selected.parentId?'上级节点':'下级节点'}</small></button>)}</div>:<p className="empty">暂无关联知识点</p>}</div></section></div>}
  </BottomSheet>
 </div>;
}
