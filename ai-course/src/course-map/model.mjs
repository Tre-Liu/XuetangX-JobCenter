import {projectJobRelations} from '../generation/project-job-relations.mjs';
export const dimensions={chain:'产业链',segment:'产业环节',role:'岗位',workTask:'岗位工作任务',major:'专业',course:'课程',project:'课程项目',activity:'项目任务',ability:'岗位能力项',knowledge:'知识点'};
const key=(kind,...parts)=>JSON.stringify([kind,...parts]);
const named=value=>typeof value==='string'&&value.trim()&&!value.startsWith('请输入');
export function courseConnectedGraph({rootId,nodes,edges}){
 const ids=new Set(nodes.map(n=>n.id)),valid=edges.filter(e=>ids.has(e.from)&&ids.has(e.to));
 const neighbors=new Map();for(const e of valid){for(const [a,b] of [[e.from,e.to],[e.to,e.from]]){if(!neighbors.has(a))neighbors.set(a,[]);neighbors.get(a).push(b);}}
 const connected=new Set(ids.has(rootId)?[rootId]:[]),queue=[...connected];
 for(let i=0;i<queue.length;i++)for(const id of neighbors.get(queue[i])||[])if(!connected.has(id)){connected.add(id);queue.push(id);}
 return {rootId,nodes:nodes.filter(n=>connected.has(n.id)),edges:valid.filter(e=>connected.has(e.from)&&connected.has(e.to))};
}
export function buildCourseMap({course,projects=[],knowledge={nodes:[]},knowledgeEnabled=true,cmsConfig}){
 const nodes=new Map(),edges=new Map();
 const add=(kind,id,title,extra={})=>{if(!id||!named(title))return null;const nodeId=key(kind,id);if(!nodes.has(nodeId))nodes.set(nodeId,{id:nodeId,kind,title,...extra});return nodeId;};
 const link=(from,to,label,context={})=>{if(from&&to&&from!==to){const id=key('edge',from,to),previous=edges.get(id);const edge={id,from,to,label,...context};for(const field of ['activityIds','projectIds'])if(context[field])edge[field]=[...new Set([...(previous?.[field]||[]),...context[field]])];edges.set(id,edge);}};
 const rootId=add('course',course.id,course.title,{description:'当前课程 · 全部关联链路'});
 const {courseChains,courseMajor}=projectJobRelations({},cmsConfig);
 const cmsMajor=add('major',courseMajor?.code,courseMajor?.name,{source:'课程 CMS 已保存专业'});link(cmsMajor,rootId,'开设课程');
 for(const chain of courseChains){const c=add('chain',chain.id,chain.name,{source:'课程 CMS 已选产业链'});link(c,cmsMajor,'专业关联');}
 const knownPoints=new Map((knowledge.nodes||[]).map(n=>[n.id,n]));
 for(const project of projects){
  if(project.courseId&&project.courseId!==course.id)continue;
  const p=add('project',project.id,project.title,{description:project.description,source:'当前课程保存的项目'});if(!p)continue;link(rootId,p,'包含项目');
  const design=project.learningDesign,context=design?.context;
  const major=add('major',context?.major,context?.majorName,{description:context?.planName,source:'项目保存的课程专业关联'});link(major,rootId,'开设课程');
  const {task,role,paths}=projectJobRelations(project);
  const source=[role?.source?.school,role?.source?.file,role?.source?.locator,role?.source?.note].filter(Boolean).join(' · ');
  const r=add('role',role?.id,role?.name,{description:role?.originalRole,source,review:role?.origin==='reference'?'人培匹配 · 待复核':undefined});
  const work=add('workTask',task?.id,task?.title,{source});link(r,work,'承担任务');link(work||r,p,'转化为项目');
  if(r)for(const path of paths){
   if(path.job_id&&path.job_id!==role.id)continue;
   const evidence=[path.source,path.match_basis].filter(Boolean).join(' · ');
   const c=add('chain',path.chain_id,path.chain_name,{source:evidence,review:path.review_status});
   const seg=add('segment',path.industry_node_id?key(path.chain_id||'',path.industry_node_id):null,path.chain_node_name,{description:path.chain_node_stage,source:evidence,review:path.review_status});
   link(c,seg||r,seg?'包含环节':'关联岗位');link(seg,r,'关联岗位');
  }
  const abilities=new Map();
  for(const ability of design?.abilities||[]){const a=add('ability',ability.id,ability.title,{description:ability.category,source:[source,ability.locator].filter(Boolean).join(' · ')});if(a){abilities.set(ability.id,a);link(work||p,a,work?'所需岗位能力':'关联岗位能力',{projectIds:[p]});}}
  for(const stage of project.stages||[])for(const task of stage.tasks||[]){
   const t=add('activity',task.id?key(project.id,task.id):null,task.title,{description:named(stage.title)?stage.title:undefined,source:'当前项目阶段与任务'});link(p,t,'包含任务');
   const taskAbilities=new Set([...(task.learningActivity?.abilityIds||[]),...(task.contents||[]).map(c=>c.abilityId)].map(id=>abilities.get(id)).filter(Boolean));
   for(const a of taskAbilities)link(t,a,'支撑岗位能力',{activityIds:[t],projectIds:[p]});
   for(const content of task.contents||[]){
    if(knowledgeEnabled&&content.knowledgeNodeId){const point=knownPoints.get(content.knowledgeNodeId);if(point){const k=add('knowledge',point.id,point.name,{description:point.description,source:'项目任务已关联的课程知识点'});link(t||p,k,'关联知识点');for(const a of taskAbilities)link(a,k,'通过项目任务关联知识点',{activityIds:[t],projectIds:[p]});}}
   }
  }
 }
 return courseConnectedGraph({rootId,nodes:[...nodes.values()],edges:[...edges.values()]});
}

// Walk each direction independently: reaching a shared course/ability must not
// turn traversal around and accidentally illuminate unrelated sibling branches.
export function traceCourseChain(graph,selectedId){
 const ids=new Set(graph.nodes.map(n=>n.id));
 if(!ids.has(selectedId)||selectedId===graph.rootId)return {nodeIds:ids,edgeIds:new Set(graph.edges.map(e=>e.id))};
 const incoming=new Map(),outgoing=new Map();
 for(const edge of graph.edges){
  if(!ids.has(edge.from)||!ids.has(edge.to))continue;
  if(!incoming.has(edge.to))incoming.set(edge.to,[]);incoming.get(edge.to).push(edge);
  if(!outgoing.has(edge.from))outgoing.set(edge.from,[]);outgoing.get(edge.from).push(edge);
 }
 const nodeIds=new Set([selectedId]),edgeIds=new Set();
 // Scope ability cross-links to the activities that establish the relation.
 // Shared ability nodes must not fan out into another task or project's knowledge.
 const kinds=new Map(graph.nodes.map(n=>[n.id,n.kind]));
 const scope=new Set([selectedId]),queue=[selectedId];
 if(kinds.get(selectedId)==='knowledge')for(const e of incoming.get(selectedId)||[])if(kinds.get(e.from)==='activity'){scope.add(e.from);queue.push(e.from);}
 for(let i=0;i<queue.length;i++)for(const e of outgoing.get(queue[i])||[]){if(kinds.get(e.to)==='ability'||kinds.get(e.from)==='ability')continue;if(!scope.has(e.to)){scope.add(e.to);queue.push(e.to);}}
 const activityScope=new Set([...scope].filter(id=>kinds.get(id)==='activity'));
 const projectScope=new Set([...scope].filter(id=>kinds.get(id)==='project'));
 for(const id of activityScope)for(const e of incoming.get(id)||[])if(kinds.get(e.from)==='project')projectScope.add(e.from);
 const allowed=edge=>kinds.get(selectedId)==='ability'||(
  (!edge.activityIds||edge.activityIds.some(id=>activityScope.has(id)))&&
  (!edge.projectIds||edge.projectIds.some(id=>projectScope.has(id)))
 );
 const walk=(seeds,index,endpoint)=>{
  const visited=new Set(seeds),queue=[...seeds];
  for(let i=0;i<queue.length;i++)for(const edge of index.get(queue[i])||[]){
   if(!allowed(edge))continue;
   edgeIds.add(edge.id);const id=edge[endpoint];nodeIds.add(id);
   if(!visited.has(id)){visited.add(id);queue.push(id);}
  }
  return visited;
 };
 const descendants=walk([selectedId],outgoing,'to');
 walk([selectedId,...graph.nodes.filter(n=>n.kind==='project'&&descendants.has(n.id)).map(n=>n.id)],incoming,'from');
 return {nodeIds,edgeIds};
}
