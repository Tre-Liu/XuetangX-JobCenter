import { associateContents } from '../resources/model.mjs';
// Match only real graph nodes, independently for each teaching task.
export function applyKnowledgeMatches(project, selections, graph, resources, enabled) {
 return {...project,stages:project.stages.map(stage=>({...stage,tasks:stage.tasks.map(task=>{
  const clean={...task,contents:task.contents.filter(item=>!item.abilityId&&item.source!=='knowledge'&&item.source!=='unit')};
  return associateContents(clean,'knowledge',enabled?(selections[task.id]||[]):[],graph,resources);
 })}))};
}
export function suggestKnowledgeMatches(project,graph){
 const nodes=graph.nodes.filter(node=>node.level>1&&node.name?.trim());
 return Object.fromEntries(project.stages.flatMap(stage=>stage.tasks.map(task=>{
  const text=[task.title,task.description,...(task.contents||[]).map(item=>item.title)].join(' ');
  const matched=nodes.filter(node=>node.name.length>1&&text.includes(node.name));
  return [task.id,[...new Set([...matched,...nodes].map(node=>node.id))]];
 })));
}
