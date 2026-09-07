import { id } from '../project.mjs';

// Metadata transcribed from the user's course-resource screenshot; no file payload is supplied.
export const courseResources = [{
 id: 'course-resource-industry-report-2025',
 name: '2025行业发展报告&人才需求预测报告',
 kind: '图文',
 knowledgeNodeIds: [],
 provenance: '用户提供的关联课程资源截图（2026-09-07）',
}];

export function nodeResources(nodeId, resources) {
 return resources.filter(resource => resource.knowledgeNodeIds?.includes(nodeId));
}
export function isLinked(task, source, item) {
 return task.contents.some(content => source === 'knowledge'
  ? content.knowledgeNodeId === item.id || (!content.knowledgeNodeId && content.type === '目标' && content.title === item.name)
  : content.resourceId === item.id);
}
export function associateContents(task, source, selectedIds, graph, resources) {
 const result = { ...task, contents: [...task.contents] };
 const addResource = resource => {
  if (!isLinked(result, 'unit', resource)) result.contents.push({id:id(),title:resource.name,type:'学习单元',scored:true,source:'unit',resourceId:resource.id,resourceKind:resource.kind});
 };
 if (source === 'knowledge') {
  for (const node of graph.nodes.filter(node => node.level > 1 && selectedIds.includes(node.id))) {
   if (!isLinked(result, 'knowledge', node)) result.contents.push({id:id(),title:node.name,type:'目标',scored:true,source:'knowledge',knowledgeNodeId:node.id});
   // Only the selected node's direct resources are included; descendants are not selected implicitly.
   nodeResources(node.id, resources).forEach(addResource);
  }
 } else if (source === 'unit') resources.filter(resource => selectedIds.includes(resource.id)).forEach(addResource);
 return result;
}
export function resolveProjectContents(project, graph, resources) {
 const resolve = content => {
  const item = content.knowledgeNodeId
   ? graph.nodes.find(node => node.id === content.knowledgeNodeId)
   : resources.find(resource => resource.id === content.resourceId);
  return item ? {...content, title: item.name} : content;
 };
 return {
  ...project,
  stages: project.stages.map(stage => ({
   ...stage,
   tasks: stage.tasks.map(task => ({...task, contents: task.contents.map(resolve)})),
  })),
 };
}
