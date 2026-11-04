import type { PositionedNode } from './graph-model';
import { knowledgeNodeAppearance, knowledgeNodeBox, type KnowledgeViewMode } from './knowledge-layout';

type RenderNode=PositionedNode&{name:string};
function label(ctx:CanvasRenderingContext2D,text:string,width:number){
 if(ctx.measureText(text).width<=width)return text;
 let short=text;while(short.length>1&&ctx.measureText(short+'…').width>width)short=short.slice(0,-1);
 return short+'…';
}
function darken(color:string){return '#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*.68).toString(16).padStart(2,'0')).join('')}

export function paintKnowledgeStructure(ctx:CanvasRenderingContext2D,visible:RenderNode[],all:RenderNode[],expanded:Set<string>,mode:KnowledgeViewMode,selectedId?:string){
 const byId=new Map(visible.map(n=>[n.id,n]));
 const end=(node:RenderNode,toward:RenderNode)=>{
  const dx=toward.x-node.x,dy=toward.y-node.y,style=knowledgeNodeAppearance(node,all,mode),box=knowledgeNodeBox(node,mode,all);
  const t=style.shape==='glow'?26/Math.hypot(dx,dy):1/Math.max(Math.abs(dx)/(box.w/2),Math.abs(dy)/(box.h/2));
  return {x:node.x+dx*t,y:node.y+dy*t};
 };
 ctx.save();
 ctx.lineWidth=mode==='tree'?1.35:1;ctx.strokeStyle=mode==='tree'?'#b6cbff':'#d0d9e9';
 visible.forEach(n=>{
  const parent=byId.get(n.parentId||'');if(!parent)return;
  ctx.beginPath();
  if(mode==='tree'){
   const side=n.x>parent.x?1:-1,a=parent.x+side*knowledgeNodeBox(parent,mode,all).w/2,b=n.x-side*knowledgeNodeBox(n,mode,all).w/2;
   ctx.moveTo(a,parent.y);ctx.bezierCurveTo((a+b)/2,parent.y,(a+b)/2,n.y,b,n.y);
  }else{
   const a=end(parent,n),b=end(n,parent);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   [a,b].forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,Math.PI*2);ctx.fillStyle='#cbd5e7';ctx.fill()});return;
  }
  ctx.stroke();
 });
 visible.forEach(n=>{
  const style=knowledgeNodeAppearance(n,all,mode),box=knowledgeNodeBox(n,mode,all),selected=n.id===selectedId;
  const count=all.filter(child=>child.parentId===n.id).length,folded=count>0&&!expanded.has(n.id);
  ctx.save();ctx.textBaseline='middle';ctx.textAlign='center';
  if(style.shape==='pill'){
   ctx.fillStyle=style.root?'#4878ff':'#e7edff';ctx.beginPath();ctx.roundRect(n.x-box.w/2,n.y-box.h/2,box.w,box.h,box.h/2);ctx.fill();
   ctx.fillStyle=style.root?'#fff':'#6385e6';ctx.font=`${style.root?'500 16':'400 14'}px "PingFang SC",sans-serif`;
  }else if(style.shape==='card'){
   ctx.fillStyle=style.root?'#dbe7ff':style.color+'29';ctx.strokeStyle=style.color;ctx.lineWidth=1.7;
   ctx.beginPath();ctx.roundRect(n.x-box.w/2,n.y-box.h/2,box.w,box.h,6);ctx.fill();ctx.stroke();
   ctx.fillStyle=style.root?'#245bc4':darken(style.color);ctx.font=`600 ${style.root?20:15}px "PingFang SC",sans-serif`;
  }else if(style.shape==='glow'){
   [26,21,15].forEach((r,i)=>{ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);ctx.fillStyle=style.color+['14','1c','35'][i];ctx.fill()});
   ctx.fillStyle='#303640';ctx.font='400 14px "PingFang SC",sans-serif';
  }else{ctx.fillStyle='#303640';ctx.font='400 13px "PingFang SC",sans-serif';}
  if(selected){ctx.strokeStyle=style.color;ctx.lineWidth=1.6;ctx.beginPath();ctx.roundRect(n.x-box.w/2-4,n.y-box.h/2-4,box.w+8,box.h+8,8);ctx.stroke();}
  const badge=folded&&(style.shape==='pill'||style.shape==='card');
  ctx.fillText(label(ctx,n.name,box.w-(badge?42:16)),n.x-(badge?10:0),n.y);
  if(badge){
   const x=n.x+box.w/2-15;ctx.fillStyle=style.color;ctx.beginPath();ctx.arc(x,n.y,9,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#fff';ctx.font='11px sans-serif';ctx.fillText(String(count),x,n.y);
  }
  ctx.restore();
 });
 ctx.restore();
}
