import references from './catalog.json' with {type:'json'};
import { id, createProject, createStage, createTask } from '../project.mjs';
export const catalog=references;
export const sampleContext={major:'460305',majorName:'工业机器人技术',planId:'xc-2025',planMajor:'460305',planName:'许昌职业技术学院 · 2025级人培',origin:'local-example'};
export function gate(c){
 const mismatch=!!c.major&&!!c.planId&&c.planMajor!==c.major;
 const checks=[{name:'课程关联专业（选填）',ok:!!c.major,detail:c.majorName||'未关联，可直接下一步'}, {name:'专业人才培养方案（选填）',ok:!!c.planId&&!mismatch,detail:mismatch?'人培专业与课程专业不一致，请重新选择或清空':c.planId?c.planName:'未关联，可直接下一步'}];
 return {checks,ready:!mismatch};
}
export function draftRole(context,name,work){
 if(!gate(context).ready)throw Error('人培专业与课程专业不一致，请重新选择或清空');
 if(!name.trim()||!work.trim())throw Error('请填写岗位名称和主要工作');
 return {id:id(),name:name.trim(),major:context.major,planId:context.planId,origin:'generated-draft',source:{note:'根据教师输入进行本地规则辅助，未调用 AI，需补充岗位调研证据'},tasks:[{id:id(),title:work.trim(),abilities:[['知识',`能说明“${work.trim()}”所需的作业要求与质量标准`],['技能',`能按要求开展“${work.trim()}”并记录实施结果`],['素养','能履行分工职责，如实记录问题并与团队协作改进']].map(([category,title])=>({id:id(),category,title,origin:'generated-draft'}))}]};
}
export const taskTypes={
 '基础型':{scaffold:'提供分步引导、操作手册、检查表和示范；先模仿再独立执行',transfer:'更换一个工作条件，借助检查表独立完成相同类型任务'},
 '综合型':{scaffold:'提供工作要求和参考资料，以启发性问题支持跨环节方案设计，逐步撤去操作提示',transfer:'改变任务条件并综合运用多项技能，比较方案并说明取舍'},
 '创新型':{scaffold:'提供开放问题和资源边界，由学生提出目标和评价标准，教师在关键节点引导讨论',transfer:'提出新的改进方向，自主制定验证方案并用证据解释创新价值'}
};
export function defaultDesign(role,task){
 const robot=role.origin==='reference';
 return {taskType:'综合型',courseGoal:'运用岗位知识与技能完成工作任务，形成有证据的质量判断与协作反思能力（待对照课程标准）',title:robot?'工业机器人工作站操作与验收':`${task.title}实践项目`,hours:12,learners:'已学习专业基础知识的二年级学生',prerequisites:robot?'已完成机器人安全操作与示教器入门训练':'具备相关基础知识，教师在实施前完成技能诊断',problem:robot?'如何在规定作业要求下完成机器人参数设置与操作，并用运行记录证明工作站能够安全、稳定运行？':`如何完成“${task.title}”，并用可检查的成果证明符合工作要求？`,object:robot?'教学用工业机器人工作站':'与岗位对应的教学任务对象（请具体填写）',content:task.title,tools:robot?'示教器、离线仿真软件、设备操作手册':'岗位常用工具、操作规范与学习资源（请具体填写）',organization:'3人一组，轮换操作、记录与检查角色',product:robot?'操作方案、参数记录、运行验证记录与交接说明':'任务成果、过程记录与交接说明',environment:robot?'校内机器人实训室；先仿真，教师检查安全条件后实操':'校内实训环境，按教学条件简化工作规模',scaffold:'提供引导问题、操作手册与质量检查表；逐步减少提示',criteria:'按任务书逐项核对功能与质量要求；过程记录可追溯，发现问题后完成复测',transfer:'更换作业条件后独立调整方案，说明调整依据'};
}
export function designError(d){
 for(const [k,label] of Object.entries({title:'项目名称',courseGoal:'课程学习目标',learners:'学情',prerequisites:'先备知识',problem:'核心问题',object:'工作对象',content:'工作内容',tools:'工具与资源',organization:'组织方式',product:'成果',environment:'学习环境',scaffold:'学习支持',criteria:'验收标准',transfer:'迁移任务'}))if(!d[k]?.trim()||d[k].includes('请具体填写'))return `请填写${label}`;
 if(!Number.isInteger(Number(d.hours))||Number(d.hours)<6||Number(d.hours)>120)return '本模板课时请输入 6—120 的整数；其他课时可在生成后调整阶段';
 return '';
}
export function generateProject({context,role,task,abilities,design,confirmed}){
 if(!gate(context).ready)throw Error('人培专业与课程专业不一致，请重新选择或清空');
 if((context.major&&role.major!==context.major)||(context.planId&&role.planId!==context.planId))throw Error('岗位与当前专业、人培不匹配');
 if(!role.tasks.some(t=>t.id===task.id))throw Error('请选择该岗位的工作任务');
 if(!abilities.length||abilities.some(a=>!a.title?.trim()||!task.abilities.some(x=>x.id===a.id)))throw Error('请选择有效的岗位能力');
 const err=designError(design);if(err)throw Error(err);
 if(!confirmed)throw Error('请先审阅并确认转化草稿');
 const p=createProject(design.title,design.problem);
 p.learningDesign={...structuredClone(design),hours:Number(design.hours),context:structuredClone(context),role:structuredClone(role),sourceTask:{id:task.id,title:task.title},abilities:structuredClone(abilities),method:'学习型工作任务 · 教学性改造 v1',review:'教师已确认教学草稿；岗位来源仍保留原证据状态',engine:'local-rules',createdAt:new Date().toISOString()};
 const phases=[
 ['明确任务与获取信息',`分析${design.object}的工作要求`,'需要解决什么问题，哪些信息还不完整？','任务分析单与资料来源记录',`说明“${design.problem}”的目标、约束和信息依据`],
 ['制定工作计划',`制定${task.title}的实施计划`,'如何安排步骤、分工、资源与检查点？','工作计划与资源清单',`步骤覆盖“${design.content}”，分工与${design.hours}课时条件相符`],
 ['方案决策',`论证${design.object}的实施方案`,'备选方案为何适合当前条件？','方案比较与决策记录',`说明工具选用及方案依据，落实${design.environment}`],
 ['实施与过程记录',`完成${design.content}`,'执行中出现偏差时如何定位和调整？',design.product,`按计划实施，结合能力目标记录操作及调整依据；${design.criteria}`],
 ['检查与质量控制',`检验${design.object}的工作成果`,'哪些证据能够证明任务符合要求？','质量检查表、问题清单与复测记录',design.criteria],
 ['评价反馈与迁移',`交接成果并完成迁移挑战`,'经验能否用于变化后的工作条件？','成果说明、反思记录与迁移方案',design.transfer]
 ];
 const remaining=Number(design.hours)-6, weights=[1,1,1,5,2,2];
 const extras=weights.map(w=>Math.floor(remaining*w/12));
 const order=weights.map((w,i)=>({i,fraction:remaining*w/12-extras[i]})).sort((a,b)=>b.fraction-a.fraction);
 for(let j=0,n=remaining-extras.reduce((a,b)=>a+b,0);j<n;j++)extras[order[j].i]++;
 p.stages=phases.map(([name,title,question,evidence,criteria],i)=>{
  const s=createStage(name);s.hours=1+extras[i];
  const t=createTask(title);
  const mapped=i===0?abilities.filter(a=>a.category==='知识'):i===3?abilities.filter(a=>a.category==='技能'):i===5?abilities:abilities.filter(a=>a.category==='素养');
  t.learningActivity={question,evidence,criteria,abilityIds:mapped.map(a=>a.id),support:design.scaffold};
  t.contents=mapped.map(a=>({id:id(),type:'目标',title:a.title,abilityId:a.id,scored:false}));s.tasks=[t];return s;
 });return p;
}
