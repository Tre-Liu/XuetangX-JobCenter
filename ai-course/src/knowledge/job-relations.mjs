// A relation is established only by knowledge and abilities saved on the same
// learning task. Stable IDs keep teacher deletions effective after renaming.
export function knowledgeJobRelationId(knowledgeId,roleId,workTaskId,abilityId){
 return JSON.stringify([knowledgeId,roleId,workTaskId||null,abilityId||null]);
}
export function knowledgeJobRelations(graph,projects,knowledgeId){
 if(!graph.nodes?.some(n=>n.id===knowledgeId))return [];
 const deleted=new Set(graph.deletedJobRelationIds||[]),rows=new Map();
 for(const project of [...projects,...(graph.demoJobProjects||[])]){
  const design=project.learningDesign,role=design?.role,workTask=design?.sourceTask;
  if(!role?.id||!role.name?.trim())continue;
  const abilities=new Map((design.abilities||[]).filter(a=>a.id&&a.title?.trim()).map(a=>[a.id,a]));
  for(const stage of project.stages||[])for(const task of stage.tasks||[]){
   if(!(task.contents||[]).some(c=>c.knowledgeNodeId===knowledgeId))continue;
   const ids=[...new Set([...(task.learningActivity?.abilityIds||[]),...(task.contents||[]).map(c=>c.abilityId)])].filter(id=>abilities.has(id));
   for(const abilityId of ids.length?ids:[null]){
    const id=knowledgeJobRelationId(knowledgeId,role.id,workTask?.id,abilityId);
    if(deleted.has(id))continue;
    if(!rows.has(id))rows.set(id,{id,role,workTask:workTask||null,ability:abilities.get(abilityId)||null,demo:project.origin==='simulated',sources:[]});
    const sources=rows.get(id).sources;
    if(!sources.some(s=>s.projectId===project.id&&s.stageId===stage.id&&s.taskId===task.id))sources.push({projectId:project.id,projectTitle:project.title,stageId:stage.id,stageTitle:stage.title,taskId:task.id,taskTitle:task.title});
   }
  }
 }
 return [...rows.values()];
}
export function removeKnowledgeJobRelation(graph,relationId){
 return {...graph,deletedJobRelationIds:[...new Set([...(graph.deletedJobRelationIds||[]),relationId])]};
}
