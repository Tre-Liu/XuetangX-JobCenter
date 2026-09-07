import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { GraphicComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { graphPositions } from './layout.mjs';
echarts.use([GraphChart,SVGRenderer,GraphicComponent]);
const wrap=(name,size=5)=>name.length<=size?name:name.slice(0,size)+'\n'+(name.length>size*2?name.slice(size,size*2-1)+'…':name.slice(size));
export function GraphCanvas({graph,expanded,level,relation,selected,onSelect,zoom,pan,setPan}){
 const element=useRef(null),chart=useRef(null),latest=useRef(onSelect),drag=useRef(null);latest.current=onSelect;
 useEffect(()=>{const c=echarts.init(element.current,null,{renderer:'svg',width:element.current.clientWidth||1100,height:element.current.clientHeight||850});chart.current=c;c.on('click',p=>{if(p.data?.nodeId)latest.current(p.data.nodeId);});return()=>{c.dispose();chart.current=null;};},[]);
 useEffect(()=>{
  const el=element.current;const render=()=>{
   const w=el.clientWidth||1100,h=el.clientHeight||850;const {positions,nodes,center,radius}=graphPositions(graph,w,h,expanded,level);const scale=Math.min(1.05,Math.max(.78,h/900));const ids=new Set(nodes.map(n=>n.id));
   const visibleLinks=graph.links.filter(l=>ids.has(l.source)&&ids.has(l.target)&&(l.type==='层级'||l.type===relation));
   const colors={1:['#9785ff','#7c66fa'],2:['#6992ff','#4577ff'],3:['#7debd1','#30c5a8'],4:['#acdfff','#68b9ff']};
   const data=nodes.map(n=>{const palette=colors[n.level],count=graph.nodes.filter(v=>v.parentId===n.id).length;const isSelected=selected===n.id;const size=([0,99,67,41,30][n.level])*scale;
    return {id:n.id,nodeId:n.id,name:n.name,...positions[n.id],symbolSize:size,
     itemStyle:{color:new echarts.graphic.RadialGradient(.38,.3,.8,[{offset:0,color:palette[0]},{offset:1,color:palette[1]}]),borderColor:isSelected?'#ffffff':n.level===3?'#a9f3e0':'#c4d4ff',borderWidth:n.level===1?0:2,shadowBlur:n.level===1?24:13,shadowColor:n.level===1?'#9388ed99':n.level===2?'#96b0ff77':'#83e8d86b',shadowOffsetY:n.level===1?9:1},
     label:n.level<=2?{show:true,position:'inside',color:'#fff',fontSize:(n.level===1?14:12)*scale,lineHeight:15*scale,formatter:wrap(n.name,n.level===1?8:5)}:{show:true,position:'bottom',distance:-size*.80,formatter:n.level===3?`{count|${count}}\n{name|${n.name}}`:`{count| }\n{name|${wrap(n.name,7)}}`,rich:{count:{color:'#fff',fontSize:14*scale,lineHeight:26*scale},name:{color:isSelected?'#2166ff':'#828a97',fontSize:12*scale,lineHeight:23*scale,backgroundColor:isSelected?'#eef3ff':'transparent',padding:[0,3]}}},
     emphasis:{scale:1.08,itemStyle:{borderColor:'#fff',borderWidth:3}},z:n.level===1?5:3};});
   const ring=(r,width,color,lineDash)=>({type:'circle',silent:true,z:-5,shape:{cx:center.x,cy:center.y,r:radius*r},style:{fill:'transparent',stroke:color,lineWidth:width,...(lineDash?{lineDash}:{} )}});
   chart.current?.resize({width:w,height:h});chart.current?.setOption({animation:false,graphic:[{type:'circle',silent:true,z:-6,shape:{cx:center.x,cy:center.y,r:radius*.70},style:{fill:'#fff'}},ring(.70,65,'#fff'),ring(.87,15,'#ffffff8c'),ring(.79,19,'#dfe7ff',[2,4]),ring(.14,13,'#dfdcff90'),ring(.166,1.5,'#bdb4ff')],series:[{type:'graph',layout:'none',left:0,top:0,right:0,bottom:0,roam:false,draggable:false,silent:false,coordinateSystem:null,
    data:[...data,{id:'__min',x:0,y:0,symbolSize:0,label:{show:false},silent:true},{id:'__max',x:w,y:h,symbolSize:0,label:{show:false},silent:true}],
    links:visibleLinks.map(l=>({source:l.source,target:l.target,lineStyle:{color:l.type==='相关'?'#ffa441':l.type==='先后修'?'#759aff':'#d1daed',width:1.15,opacity:.9,type:l.type==='相关'?'dashed':'solid'},symbol:l.type==='先后修'?['none','arrow']:['none','circle'],symbolSize:l.type==='层级'?[0,4]:[0,5]})),lineStyle:{curveness:0},edgeSymbolSize:4,emphasis:{focus:'adjacency'},label:{show:true}}]},true);
  };render();const observer=new ResizeObserver(render);observer.observe(el);return()=>observer.disconnect();
 },[graph,expanded,level,relation,selected]);
 return <div className="kg-pan-surface" onPointerDown={e=>{if(e.button===0)drag.current={x:e.clientX,y:e.clientY,origin:pan};}} onPointerMove={e=>{if(drag.current&&e.buttons===1){const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;if(Math.abs(dx)+Math.abs(dy)>6)setPan({x:drag.current.origin.x+dx,y:drag.current.origin.y+dy});}}} onPointerUp={()=>{drag.current=null;}} onPointerLeave={()=>{drag.current=null;}}><div className="kg-world" style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom/100})`}}><div ref={element} className="kg-echart" role="img" aria-label="智能制造知识图谱，可通过目录选择和查看各级知识点"/></div></div>;
}
