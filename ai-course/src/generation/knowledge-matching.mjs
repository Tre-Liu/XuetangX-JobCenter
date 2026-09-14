import { associateContents } from '../resources/model.mjs';
export const MAX_KNOWLEDGE_POINTS = 10;
// Match only real graph nodes, independently for each teaching task.
export function applyKnowledgeMatches(project, selections, graph, resources, enabled) {
 return {...project,knowledgeLimitVersion:1,stages:project.stages.map(stage=>({...stage,tasks:stage.tasks.map(task=>{
  const clean={...task,contents:task.contents.filter(item=>!item.abilityId&&item.source!=='knowledge'&&item.source!=='unit')};
  return associateContents(clean,'knowledge',enabled?[...new Set(selections[task.id]||[])].filter(id=>graph.nodes.some(node=>node.id===id&&node.level>1)).slice(0,MAX_KNOWLEDGE_POINTS):[],graph,resources);
 })}))};
}
export function suggestKnowledgeMatches(project,graph){
 const nodes=graph.nodes.filter(node=>node.level>1&&node.name?.trim());
 return Object.fromEntries(project.stages.flatMap(stage=>stage.tasks.map(task=>{
  const text=[task.title,task.description,...(task.contents||[]).map(item=>item.title)].join(' ');
  const matched=nodes.filter(node=>node.name.length>1&&text.includes(node.name));
  return [task.id,[...new Set([...matched,...nodes].map(node=>node.id))].slice(0,MAX_KNOWLEDGE_POINTS)];
 })));
}

// Upgrade saved generated projects once, leaving manual content and later edits intact.
export function migrateGeneratedKnowledgeLimit(project) {
 if (!project.learningDesign || project.knowledgeLimitVersion === 1) return project;
 return {...project,knowledgeLimitVersion:1,stages:project.stages.map(stage=>({...stage,tasks:stage.tasks.map(task=>{
  let count=0;
  return {...task,contents:task.contents.filter(content=>{
   if (content.source !== 'knowledge' && !content.knowledgeNodeId) return true;
   return ++count <= MAX_KNOWLEDGE_POINTS;
  })};
 })}))};
}
