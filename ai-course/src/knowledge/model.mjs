import seed from './seed.json' with { type: 'json' };
export function createKnowledgeGraph(){
 const nodes=[{id:'root',name:'智能制造',level:1,desc:'以数据驱动、网络协同与智能决策为核心，连接设计、生产、运营与服务的智能制造知识体系。'}];const links=[];
 seed.modules.forEach((m,i)=>{
  const moduleId=`m${i}`;nodes.push({id:moduleId,name:m.name,parentId:'root',level:2,desc:`围绕${m.name}，学习${m.topics.map(t=>t.name).join('、')}。`});
  m.topics.forEach((t,j)=>{
   const topicId=`${moduleId}-t${j}`;nodes.push({id:topicId,name:t.name,parentId:moduleId,level:3,desc:`${t.name}包括${t.points.map(p=>p.name).join('、')}。`});
   t.points.forEach((p,k)=>nodes.push({...p,id:`${topicId}-p${k}`,parentId:topicId,level:4,design:p.ideology?seed.ideologyDesigns[p.ideology]:'',prerequisite:k>0?t.points[k-1].name:t.prerequisite}));
  });
 });
 const nameMap=new Map(nodes.map(n=>[n.name,n.id]));
 for(const n of nodes){if(n.parentId)links.push({source:n.parentId,target:n.id,type:'层级'});if(n.prerequisite&&nameMap.has(n.prerequisite))links.push({source:nameMap.get(n.prerequisite),target:n.id,type:'先后修'});if(n.related&&nameMap.has(n.related))links.push({source:n.id,target:nameMap.get(n.related),type:'相关'});}
 return {nodes,links,source:seed.source};
}
export function graphStats(graph){return {total:graph.nodes.length,levels:[1,2,3,4].map(level=>graph.nodes.filter(n=>n.level===level).length),ideology:graph.nodes.filter(n=>n.ideology).length};}
export function descendants(graph,id){const found=graph.nodes.filter(n=>n.parentId===id);return found.flatMap(n=>[n,...descendants(graph,n.id)]);}
export function updateKnowledgeNode(graph,id,patch){const name=patch.name?.trim();if(!name)throw new Error('知识点名称不能为空');if(graph.nodes.some(n=>n.id!==id&&n.name===name))throw new Error('已存在同名知识点');return {...graph,nodes:graph.nodes.map(n=>n.id===id?{...n,...patch,name}:n)};}

export const KNOWLEDGE_STORAGE = 'ai-course-knowledge-v1';
export function loadKnowledgeGraph(){
 try{const graph=JSON.parse(localStorage.getItem(KNOWLEDGE_STORAGE));if(graph?.nodes?.length&&Array.isArray(graph.links)&&graph.nodes.every(node=>node.id&&node.name&&node.level))return graph;}catch{}
 return createKnowledgeGraph();
}
