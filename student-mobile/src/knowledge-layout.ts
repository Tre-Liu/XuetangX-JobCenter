import type { PositionedNode } from './graph-model';

export type KnowledgeViewMode='custom'|'tree'|'network'|'ring';
export const knowledgeViewModes=[
 {id:'custom',name:'自定义视图',description:'按课程预设布局查看'},
 {id:'tree',name:'树状视图',description:'逐层梳理知识结构'},
 {id:'network',name:'网状视图',description:'探索知识节点关联'},
 {id:'ring',name:'环状视图',description:'围绕课程展开章节'},
] as const;

const branchColors=['#36bdbd','#779bfb','#9c83ee','#42c881','#8a83e8','#e1bf3b','#65b8f1','#b28bea'];
export function knowledgeNodeAppearance(node:PositionedNode,nodes:PositionedNode[],mode:KnowledgeViewMode){
 const root=!node.parentId,chapter=nodes.find(n=>n.id===node.parentId)?.parentId===null;
 let branch=node;while(branch.parentId){const parent=nodes.find(n=>n.id===branch.parentId);if(!parent||!parent.parentId)break;branch=parent;}
 const index=nodes.filter(n=>n.parentId===nodes.find(n=>!n.parentId)?.id).findIndex(n=>n.id===branch.id);
 const color=root?'#588cff':branchColors[Math.max(0,index)%branchColors.length];
 return {shape:mode==='tree'?(root||chapter?'pill':'text'):mode==='ring'?(root||chapter?'card':'glow'):'orb',color:mode==='tree'?'#4e7cff':color,root,chapter} as const;
}
export function knowledgeNodeBox(node:PositionedNode,mode:KnowledgeViewMode,nodes:PositionedNode[]){
 const {root,chapter}=knowledgeNodeAppearance(node,nodes,mode);
 if(mode==='tree')return {w:root?138:chapter?184:208,h:root?38:chapter?34:30};
 if(mode==='ring')return {w:root?160:chapter?200:190,h:root?48:chapter?46:56};
 return {w:root?88:154,h:root?88:mode==='network'?104:84};
}

// All presets share the original identities and relationships. They do not create new links.
export function layoutKnowledgeNodes<T extends PositionedNode>(nodes:T[],mode:KnowledgeViewMode,expanded:Set<string>):T[]{
 const root=nodes.find(n=>!n.parentId);
 if(!root)return [];
 const children=(id:string)=>nodes.filter(n=>n.parentId===id);
 const chapters=children(root.id),positions=new Map<string,{x:number;y:number}>([[root.id,{x:0,y:0}]]);
 if(mode==='tree'){
  const weight=(id:string):number=>expanded.has(id)&&children(id).length?children(id).reduce((sum,n)=>sum+weight(n.id),0):1;
  const arrange=(id:string,depth:number,top:number,side:number)=>{
   const span=weight(id)*64;
   positions.set(id,{x:side*(245+(depth-1)*270),y:top+span/2});
   let next=top;
   children(id).forEach(n=>{arrange(n.id,depth+1,next,side);next+=weight(n.id)*64});
  };
  const half=Math.ceil(chapters.length/2);
  [chapters.slice(0,half),chapters.slice(half)].forEach((sideNodes,i)=>{
   let top=-sideNodes.reduce((sum,n)=>sum+weight(n.id),0)*32;
   sideNodes.forEach(n=>{arrange(n.id,1,top,i===0?1:-1);top+=weight(n.id)*64});
  });
 }else if(mode==='custom'){
  const anchors=[[-90,-165],[100,-190],[-115,-45],[115,-30],[-105,105],[105,115],[-95,235],[105,235]];
  chapters.forEach((chapter,i)=>{
   const [x,y]=anchors[i%anchors.length];positions.set(chapter.id,{x,y});
   const siblings=children(chapter.id),direction=x<0?-1:1;
   siblings.forEach((n,j)=>positions.set(n.id,{x:x+direction*(125+j%2*55),y:y+(j-(siblings.length-1)/2)*88}));
  });
 }else if(mode==='ring'){
  const weight=(id:string):number=>children(id).length?children(id).reduce((sum,n)=>sum+weight(n.id),0):1;
  const total=chapters.reduce((sum,n)=>sum+weight(n.id),0);
  const occupied=[{x:0,y:0,...knowledgeNodeBox(root,mode,nodes)}];
  const sectors=new Map<string,{start:number;sweep:number}>();
  let angle=-Math.PI/2;
  chapters.forEach(chapter=>{
   const sweep=Math.PI*2*weight(chapter.id)/total,middle=angle+sweep/2;
   const point={x:Math.cos(middle)*310,y:Math.sin(middle)*310};
   positions.set(chapter.id,point);sectors.set(chapter.id,{start:angle+sweep*.08,sweep:sweep*.84});
   occupied.push({...point,...knowledgeNodeBox(chapter,mode,nodes)});angle+=sweep;
  });
  const arrange=(parentId:string,depth:number,start:number,sweep:number)=>{
   const siblings=children(parentId),totalWeight=siblings.reduce((sum,n)=>sum+weight(n.id),0);
   let cursor=start;
   siblings.forEach((node,i)=>{
    const part=sweep*weight(node.id)/totalWeight,a=cursor+part/2,box=knowledgeNodeBox(node,mode,nodes);
    let radius=310+(depth-1)*290+(i%2)*90;
    let point={x:Math.cos(a)*radius,y:Math.sin(a)*radius};
    // Move along the same ray instead of flattening circles into vertical columns.
    while(occupied.some(other=>Math.abs(point.x-other.x)<(box.w+other.w)/2+12&&Math.abs(point.y-other.y)<(box.h+other.h)/2+12)){
     radius+=80;point={x:Math.cos(a)*radius,y:Math.sin(a)*radius};
    }
    positions.set(node.id,point);occupied.push({...point,...box});
    arrange(node.id,depth+1,cursor+part*.08,part*.84);cursor+=part;
   });
  };
  chapters.forEach(chapter=>{const sector=sectors.get(chapter.id)!;arrange(chapter.id,2,sector.start,sector.sweep)});
 }else{
  chapters.forEach((chapter,i)=>{
   const angle=-Math.PI/2+i*Math.PI*2/chapters.length;
   const rx=140,ry=205;
   positions.set(chapter.id,{x:Math.cos(angle)*rx,y:Math.sin(angle)*ry});
   const siblings=children(chapter.id);
   siblings.forEach((n,j)=>{
    const a=angle+(j-(siblings.length-1)/2)*.25;
    positions.set(n.id,{x:Math.cos(a)*(rx+180+(j%2)*25),y:Math.sin(a)*(ry+160+(j%2)*35)});
   });
  });
 }
 return nodes.map(n=>({...n,...positions.get(n.id)}));
}
