import type { PositionedNode } from './graph-model';

export type KnowledgeViewMode='custom'|'tree'|'network'|'ring';
export const knowledgeViewModes=[
 {id:'custom',name:'自定义视图',description:'按课程预设布局查看'},
 {id:'tree',name:'树状视图',description:'逐层梳理知识结构'},
 {id:'network',name:'网状视图',description:'探索知识节点关联'},
 {id:'ring',name:'环状视图',description:'围绕课程展开章节'},
] as const;

export function knowledgeNodeBox(node:PositionedNode,mode:KnowledgeViewMode){
 const root=!node.parentId;
 return mode==='tree'||mode==='ring'?{w:root?124:mode==='ring'?148:184,h:42}:{w:root?88:154,h:root?88:mode==='network'?104:84};
}

// All presets share the original identities and relationships. They do not create new links.
export function layoutKnowledgeNodes<T extends PositionedNode>(nodes:T[],mode:KnowledgeViewMode,expanded:Set<string>):T[]{
 const root=nodes.find(n=>!n.parentId);
 if(!root)return [];
 const children=(id:string)=>nodes.filter(n=>n.parentId===id);
 const chapters=children(root.id),positions=new Map<string,{x:number;y:number}>([[root.id,{x:0,y:0}]]);
 if(mode==='tree'){
  const weight=(id:string):number=>expanded.has(id)&&children(id).length?children(id).reduce((sum,n)=>sum+weight(n.id),0):1;
  const arrange=(id:string,depth:number,top:number)=>{
   const span=weight(id)*72;
   positions.set(id,{x:depth*230,y:top+span/2});
   let next=top;
   children(id).forEach(n=>{arrange(n.id,depth+1,next);next+=weight(n.id)*72});
  };
  arrange(root.id,0,-weight(root.id)*36);
 }else if(mode==='custom'){
  const anchors=[[-90,-165],[100,-190],[-115,-45],[115,-30],[-105,105],[105,115],[-95,235],[105,235]];
  chapters.forEach((chapter,i)=>{
   const [x,y]=anchors[i%anchors.length];positions.set(chapter.id,{x,y});
   const siblings=children(chapter.id),direction=x<0?-1:1;
   siblings.forEach((n,j)=>positions.set(n.id,{x:x+direction*(125+j%2*55),y:y+(j-(siblings.length-1)/2)*88}));
  });
 }else{
  chapters.forEach((chapter,i)=>{
   const angle=-Math.PI/2+i*Math.PI*2/chapters.length;
   // Portrait ellipses keep first-level labels readable in a phone viewport.
   const rx=mode==='ring'?154:140,ry=mode==='ring'?245:205;
   positions.set(chapter.id,{x:Math.cos(angle)*rx,y:Math.sin(angle)*ry});
   const siblings=children(chapter.id);
   siblings.forEach((n,j)=>{
    const a=angle+(j-(siblings.length-1)/2)*(mode==='ring'?.23:.25);
    positions.set(n.id,{x:Math.cos(a)*(rx+180+(j%2)*25),y:Math.sin(a)*(ry+160+(j%2)*35)});
   });
  });
 }
 if(mode==='ring'){
  // Reserve the course and chapter cards first, then place each fixed leaf beyond
  // occupied cards. Resolve against the full preset so expansion never moves siblings.
  const occupied=[root,...chapters].map(n=>({...positions.get(n.id)!,...knowledgeNodeBox(n,mode)}));
  nodes.filter(n=>n.parentId&&n.parentId!==root.id).forEach(n=>{
   const point=positions.get(n.id);if(!point)return;
   const box=knowledgeNodeBox(n,mode),direction=point.y<0?-1:1;
   while(occupied.some(other=>Math.abs(point.x-other.x)<(box.w+other.w)/2+12&&Math.abs(point.y-other.y)<(box.h+other.h)/2+12))point.y+=direction*(box.h+12);
   occupied.push({...point,...box});
  });
 }
 return nodes.map(n=>({...n,...positions.get(n.id)}));
}
