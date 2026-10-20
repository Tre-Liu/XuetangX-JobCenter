import {useEffect,useRef} from 'react';
import * as echarts from 'echarts';
export function ResultChart({option,onSelect,className=''}){const ref=useRef();useEffect(()=>{if(!ref.current||!ref.current.clientWidth)return;const chart=echarts.init(ref.current,null,{renderer:'svg'});chart.setOption(option);if(onSelect)chart.on('click',p=>onSelect(p.data));const observer=new ResizeObserver(()=>chart.resize());observer.observe(ref.current);return()=>{observer.disconnect();chart.dispose();};},[option,onSelect]);return <div ref={ref} className={`result-chart ${className}`} role="img" aria-label="课程模型可视化"/>;}
export function treeData(model,type='knowledge'){
 if(type==='quality')return {name:model.courseName,children:model.qualities.map(q=>({name:q.name,itemStyle:{color:q.color},children:q.items.map(name=>({name,itemStyle:{color:q.color}}))}))};
 if(type==='ability')return {name:model.courseName,children:[...new Set(model.skills.map(s=>s.category||'课程能力'))].map(category=>({name:category,children:model.skills.filter(s=>(s.category||'课程能力')===category).map(s=>({name:s.name,id:s.id}))}))};
 const children=id=>model.knowledge.filter(n=>n.parentId===id).map(n=>({name:n.name,id:n.id,value:Math.max(1,model.resources.filter(r=>r.knowledgeNodeIds?.includes(n.id)).length),children:children(n.id)}));return {name:model.courseName,children:children('root')};
}
export function graphOption(model,search='',zoom=1){const nodes=model.graph.nodes.filter(n=>!search||n.level===1||n.name.includes(search));const ids=new Set(nodes.map(n=>n.id));return {tooltip:{formatter:p=>p.data.name||''},series:[{type:'graph',layout:'force',roam:true,zoom:zoom*.7,force:{repulsion:150,edgeLength:45,gravity:.12},data:nodes.map(n=>({id:n.id,name:n.name,category:n.level,symbolSize:n.level===1?90:n.level===2?61:n.level===3?35:24,itemStyle:{color:n.level===1?'#5075fa':n.level===2?'#60cfd4':'#8ae1e1',borderColor:'#c6f6f6',borderWidth:4},label:{show:n.level<=2||!!search,color:'white',fontSize:n.level===1?15:10,formatter:p=>p.name.length>8?p.name.slice(0,8)+'…':p.name}})),links:model.graph.links.filter(l=>ids.has(l.source)&&ids.has(l.target)),lineStyle:{color:'#accafa',opacity:.55,width:1.5},emphasis:{focus:'adjacency',label:{show:true}},animationDuration:500}]};}
export function qualityOption(model,zoom=1){
 const data=[{id:'course',name:model.courseName,x:1000,y:940,symbolSize:[235,44],itemStyle:{color:'#ff743f'},label:{fontWeight:600}}];const links=[];
 const branches=[{x:280,y:570,leaves:[[110,420],[180,300],[300,180],[435,350]]},{x:710,y:445,leaves:[[485,255],[650,160],[750,75],[845,240],[935,320]]},{x:1210,y:350,leaves:[[1050,220],[1160,65],[1260,15],[1430,140],[1300,290]]},{x:1630,y:605,leaves:[[1475,420],[1565,270],[1695,320],[1855,390],[1830,475]]}];
 model.qualities.forEach((q,i)=>{const b=branches[i];data.push({id:'q'+i,name:q.name,x:b.x,y:b.y,symbolSize:[210,40],itemStyle:{color:q.color}});links.push({source:'course',target:'q'+i,lineStyle:{color:q.color,width:5,curveness:i<2?.25:-.25}});q.items.forEach((name,j)=>{data.push({id:`q${i}-${j}`,name,x:b.leaves[j][0],y:b.leaves[j][1],symbolSize:[name.length*14+24,34],itemStyle:{color:q.color}});links.push({source:'q'+i,target:`q${i}-${j}`,lineStyle:{color:q.color,width:1.5,curveness:j<2?.15:-.15}});});});
 return {tooltip:{},series:[{type:'graph',layout:'none',roam:true,zoom,left:'9%',right:'12%',top:'9%',bottom:'12%',data,links,symbol:'roundRect',label:{show:true,color:'white',fontSize:13},emphasis:{focus:'adjacency'}}]};
}
export function treeOption(model,type,zoom=1){if(type==='quality')return qualityOption(model,zoom);return {tooltip:{},series:[{type:'tree',data:[treeData(model,type)],top:'8%',left:'13%',bottom:'10%',right:'30%',roam:true,zoom,orient:type==='quality'?'BT':'LR',layout:'orthogonal',symbol:type==='quality'?'circle':'roundRect',symbolSize:type==='quality'?12:[16,9],initialTreeDepth:type==='quality'?-1:2,expandAndCollapse:true,label:{position:'right',fontSize:type==='quality'?15:13,width:type==='quality'?145:185,overflow:'break',lineHeight:20,color:type==='quality'?'#dc713b':'#455d86',backgroundColor:'#ffffffed',padding:[10,14],borderColor:'#bdd5f8',borderWidth:1,borderRadius:6},lineStyle:{color:type==='quality'?'#ff9955':'#bcd5fa',width:type==='quality'?3:4,curveness:.5},leaves:{label:{position:'right'}},emphasis:{focus:'descendant'}}]};}
export function sunburstData(model){const colors=['#5276f5','#8c7df2','#21bda9','#009ea9','#6e9afa','#59c4de','#8a73da','#20b6af'];const convert=(node,color,depth)=>({...node,fullName:node.name,name:node.name.length>4?node.name.slice(0,4)+'…':node.name,itemStyle:{color},label:{show:depth<2},children:node.children?.map(n=>convert(n,color,depth+1))});return treeData(model).children.map((n,i)=>convert(n,colors[i%colors.length],0));}

// Equal-size isometric plates preserve the four model categories. Render from
// the bottom up so their translucent faces read as suspended layers, not a funnel.
export function modelLayersOption(rows,appearance={}){
 const palettes=appearance.palettes||[['#c2b9ff','#987ae3','#b7a2ff','#7a5dcc'],['#8ddfee','#62a8ed','#80c6f4','#447ed5'],['#9be4dd','#27baa9','#72dcd2','#20a59d'],['#a4c7fa','#5c85e6','#92b6f4','#4c73d2']];
 return {animation:false,series:[{type:'custom',coordinateSystem:'none',silent:true,data:[3,2,1,0].map(i=>[i]),renderItem:(params,api)=>{
  const i=api.value(0),w=api.getWidth(),h=api.getHeight(),cx=w*.265,cy=h*(.27+i*.17),rx=w*(appearance.plateWidth||.235),ry=Math.min(h*.12,w*.105),depth=Math.max(6,Math.min(12,h*.021)),c=palettes[i];
  const top=[cx,cy-ry],right=[cx+rx,cy],bottom=[cx,cy+ry],left=[cx-rx,cy];
  const gradient=(a,b,x=0,y=0,x2=1,y2=1)=>({type:'linear',x,y,x2,y2,colorStops:[{offset:0,color:a},{offset:1,color:b}]});
  return {type:'group',children:[
   {type:'polygon',shape:{points:[left,bottom,[cx,cy+ry+depth],[cx-rx,cy+depth]]},style:{fill:gradient(c[2],c[1]),stroke:c[2],lineWidth:1,shadowBlur:12,shadowColor:'#14265e25',shadowOffsetY:9}},
   {type:'polygon',shape:{points:[bottom,right,[cx+rx,cy+depth],[cx,cy+ry+depth]]},style:{fill:gradient(c[1],c[3]),stroke:c[2],lineWidth:1}},
   {type:'polygon',shape:{points:[top,right,bottom,left]},style:{fill:gradient(c[0],c[1]),opacity:.86,stroke:c[2],lineWidth:2}},
   {type:'polygon',shape:{points:[[cx,cy],[cx+rx*.52,cy+ry*.48],bottom,[cx-rx*.52,cy+ry*.48]]},style:{fill:'#e1faff',opacity:.09,stroke:'#e7faff50',lineWidth:1}},
   {type:'line',shape:{x1:cx+rx*.86,y1:h*(.30+i*.17),x2:w*.625,y2:h*(.30+i*.17)},style:{stroke:c[2],lineWidth:1.4,lineDash:[4,3],opacity:.9}},
   {type:'circle',shape:{cx:w*.625,cy:h*(.30+i*.17),r:3.5},style:{fill:c[2]}},
   {type:'text',style:{x:cx,y:cy+ry*.33,text:rows[i][0],fill:'#f1f8ff',font:`600 ${w<450?13:18}px Arial,"PingFang SC","Microsoft YaHei",sans-serif`,align:'center',verticalAlign:'middle'}}
  ]};
 }}]};
}
