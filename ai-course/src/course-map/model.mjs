import {projectJobRelations} from '../generation/project-job-relations.mjs';
export const dimensions={chain:'产业链',segment:'产业环节',role:'岗位',workTask:'岗位工作任务',major:'专业',course:'课程',project:'课程项目',activity:'项目任务',ability:'能力项',knowledge:'知识点'};
const key=(kind,...parts)=>JSON.stringify([kind,...parts]);
const named=value=>typeof value==='string'&&value.trim()&&!value.startsWith('请输入');
export function courseConnectedGraph({rootId,nodes,edges}){
 const ids=new Set(nodes.map(n=>n.id)),valid=edges.filter(e=>ids.has(e.from)&&ids.has(e.to));
 const neighbors=new Map();for(const e of valid){for(const [a,b] of [[e.from,e.to],[e.to,e.from]]){if(!neighbors.has(a))neighbors.set(a,[]);neighbors.get(a).push(b);}}
 const connected=new Set(ids.has(rootId)?[rootId]:[]),queue=[...connected];
 for(let i=0;i<queue.length;i++)for(const id of neighbors.get(queue[i])||[])if(!connected.has(id)){connected.add(id);queue.push(id);}
 return {rootId,nodes:nodes.filter(n=>connected.has(n.id)),edges:valid.filter(e=>connected.has(e.from)&&connected.has(e.to))};
}
export function buildCourseMap({course,projects=[],knowledge={nodes:[]},knowledgeEnabled=true}){
 const nodes=new Map(),edges=new Map();
 const add=(kind,id,title,extra={})=>{if(!id||!named(title))return null;const nodeId=key(kind,id);if(!nodes.has(nodeId))nodes.set(nodeId,{id:nodeId,kind,title,...extra});return nodeId;};
 const link=(from,to,label)=>{if(from&&to&&from!==to){const id=key('edge',from,to);edges.set(id,{id,from,to,label});}};
 const rootId=add('course',course.id,course.title,{description:'当前课程 · 全部关联链路'});
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
  for(const ability of design?.abilities||[]){const a=add('ability',ability.id,ability.title,{description:ability.category,source:[source,ability.locator].filter(Boolean).join(' · ')});if(a){abilities.set(ability.id,a);link(p,a,'关联能力');}}
  for(const stage of project.stages||[])for(const task of stage.tasks||[]){
   const t=add('activity',task.id?key(project.id,task.id):null,task.title,{description:named(stage.title)?stage.title:undefined,source:'当前项目阶段与任务'});link(p,t,'包含任务');
   for(const id of task.learningActivity?.abilityIds||[])link(t,abilities.get(id),'支撑能力');
   for(const content of task.contents||[]){
    if(content.abilityId)link(t,abilities.get(content.abilityId),'关联能力');
    if(knowledgeEnabled&&content.knowledgeNodeId){const point=knownPoints.get(content.knowledgeNodeId);if(point){const k=add('knowledge',point.id,point.name,{description:point.description,source:'项目任务已关联的课程知识点'});link(t||p,k,'关联知识点');}}
   }
  }
 }
 return courseConnectedGraph({rootId,nodes:[...nodes.values()],edges:[...edges.values()]});
}
