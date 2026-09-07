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
 return '';
}
export function seedProject(){
 const p=createProject('项目1','项目1'); const s=createStage(); const t=createTask('明确任务目标');
 t.contents=[{id:id(),type:'目标',title:'机器人轨迹编程',scored:true},{id:id(),type:'目标',title:'质量预测',scored:true}]; s.tasks=[t];
 const s2=createStage();s2.tasks=[createTask()];p.stages=[s,s2];return p;
}
