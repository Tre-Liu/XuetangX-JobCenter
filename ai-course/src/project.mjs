import {defaultExplanation} from './media/defaults.mjs';
export const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const createTask = (title='请输入任务名称') => ({id:id(),title,contents:[],collapsed:false});
export const createStage = (title='请输入阶段名称') => ({id:id(),title,tasks:[],collapsed:false});
export const createProject = (title='新项目',description='') => ({id:id(),title,description,stages:[],sequential:true});
export function projectStats(p){
 const tasks=p.stages.flatMap(s=>s.tasks); const content=tasks.flatMap(t=>t.contents);
 return {stages:p.stages.length,tasks:tasks.length,units:content.filter(c=>c.type==='学习单元').length,extensions:content.filter(c=>c.type==='拓展学习').length};
}
export function appendTemplate(p){
 for(const [name,titles] of [['项目认知与需求分析',['分析项目场景','明确任务目标与评价标准']],['方案设计与实践实施',['制定实施方案','完成实践任务']],['成果展示与反思改进',['提交与展示项目成果','开展评价与复盘']]]){
  const s=createStage(name); s.tasks=titles.map(createTask); p.stages.push(s);
 }
}
export function validateProject(p){
 if(!p.title.trim()) return '请填写项目名称';
 if(!p.stages.length) return '请先添加项目阶段';
 for(const s of p.stages){if(!s.title.trim())return '请填写阶段名称';if(!s.tasks.length)return '每个阶段至少需要一个任务'; if(s.tasks.some(t=>!t.title.trim()))return '请填写任务名称';}
 if(p.stages.some(s=>s.evaluation)){const evaluation=evaluationSummary(p);if(!evaluation.valid)return evaluation.issues[0];}
 return '';
}
export const evaluationCategories={knowledge:'知识目标',skill:'技能目标',quality:'素养目标'};
export const evaluationSubjects={teacher:'教师评价',self:'学生自评',peer:'同伴互评',agent:'智能体辅助评价'};
export function stageEvaluation(stage){
 const saved=stage.evaluation;
 return {goals:Object.fromEntries(Object.keys(evaluationCategories).map(key=>[key,Array.isArray(saved?.goals?.[key])?saved.goals[key]:[]])),activities:Array.isArray(saved?.activities)?saved.activities:[]};
}
export function validateEvaluationActivity(stage,activity){
 if(!activity.title?.trim())return '请填写评价活动名称';
 if(!stage.tasks.some(task=>task.id===activity.taskId))return '请关联本阶段的有效项目任务';
 const goals=Object.values(stageEvaluation(stage).goals).flat();
 if(!activity.goalIds?.length||activity.goalIds.some(goalId=>!goals.some(goal=>goal.id===goalId&&goal.title?.trim())))return '请关联有效的评价目标，已删除目标需重新配置';
 if(!activity.evidence?.trim())return '请填写成果证据';
 if(!activity.criteria?.trim())return '请填写评价标准';
 if(!activity.subjects?.length||activity.subjects.some(subject=>!evaluationSubjects[subject]))return '请选择有效的评价主体';
 if(activity.scored!==false&&(typeof activity.weight!=='number'||!Number.isFinite(activity.weight)||activity.weight<0||activity.weight>100||Math.abs(activity.weight*100-Math.round(activity.weight*100))>1e-7))return '成绩占比须为0至100的数值，最多保留两位小数';
 return '';
}
export function evaluationSummary(project){
 const issues=[];
 const stages=project.stages.map(stage=>{
  const evaluation=stageEvaluation(stage),goals=Object.values(evaluation.goals).flat();
  const stageIssues=[];
  for(const [category,label] of Object.entries(evaluationCategories))if(!evaluation.goals[category].some(goal=>goal.title?.trim()))stageIssues.push(`${stage.title}：${label}待配置`);
  if(!evaluation.activities.length)stageIssues.push(`${stage.title}：评价活动待配置`);
  for(const activity of evaluation.activities){const error=validateEvaluationActivity(stage,activity);if(error)stageIssues.push(`${stage.title} / ${activity.title||'未命名活动'}：${error}`);}
  const referenced=new Set(evaluation.activities.flatMap(activity=>activity.goalIds||[]));
  if(goals.some(goal=>!referenced.has(goal.id)))stageIssues.push(`${stage.title}：部分目标尚未关联评价活动`);
  const cents=evaluation.activities.reduce((sum,activity)=>sum+(activity.scored!==false&&Number.isFinite(activity.weight)?Math.round(activity.weight*100):0),0);
  issues.push(...stageIssues);
  return {stage,evaluation,weight:cents/100,cents,issues:stageIssues,complete:stageIssues.length===0};
 });
 const total=stages.reduce((sum,stage)=>sum+stage.cents,0)/100;
 if(!stages.length)issues.push('请先添加项目阶段');
 if(total!==100)issues.push(`计分活动成绩占比合计须为100%，当前为${total}%`);
 return {stages,total,activities:stages.reduce((sum,stage)=>sum+stage.evaluation.activities.length,0),configured:stages.filter(stage=>stage.complete).length,issues,valid:issues.length===0};
}
export function seedProject(){
 const p=createProject('项目1','项目1');p.drivingQuestion={role:'智能制造项目工程师',scenario:'在自动化产线中开展机器人轨迹编程与质量控制改进。',status:'产线需要优化运行效率，并提升产品质量的稳定性。',outline:'如何通过机器人轨迹优化与质量预测，形成可验证的产线改进方案？'};p.explanation=structuredClone(defaultExplanation); const s=createStage(); const t=createTask('明确任务目标');
 t.contents=[{id:id(),type:'目标',title:'机器人轨迹编程',scored:true},{id:id(),type:'目标',title:'质量预测',scored:true}]; s.tasks=[t];
 const s2=createStage();s2.tasks=[createTask()];p.stages=[s,s2];return p;
}
