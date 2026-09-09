import {findMajor} from './major-context.mjs';
import { taskDescription } from '../task-description.mjs';
import references from './catalog.json' with {type:'json'};
import { id, createProject, createStage, createTask } from '../project.mjs';
export const catalog=references;
export const sampleContext={major:'460305',majorName:'工业机器人技术',planId:'xc-2025',planMajor:'460305',planName:'许昌职业技术学院 · 2025级人培',origin:'local-example'};
export function gate(c){
 const major=findMajor(c.major);
 const mismatch=!!c.major&&!!c.planId&&c.planMajor!==c.major;
 const error=!major?'请先选择一个官方专业':mismatch?'人培专业与课程专业不一致，请重新选择或清空':'';
 const checks=[{name:'课程关联专业',ok:!!major,detail:major?c.majorName||major.name:'尚未关联，请选择官方专业'}, {name:'专业人才培养方案（选填）',ok:!!c.planId&&!mismatch,detail:mismatch?error:c.planId?c.planName:'未关联，可直接下一步'}];
 return {checks,ready:!error,error};
}
export function draftRole(context,name,work){
 if(!gate(context).ready)throw Error(gate(context).error);
 if(!name.trim()||!work.trim())throw Error('请填写岗位名称和主要工作');
 return {id:id(),name:name.trim(),major:context.major,planId:context.planId,origin:'generated-draft',source:{note:'根据教师输入进行本地规则辅助，未调用 AI，需补充岗位调研证据'},tasks:[{id:id(),title:work.trim(),abilities:[['知识',`能说明“${work.trim()}”所需的作业要求与质量标准`],['技能',`能按要求开展“${work.trim()}”并记录实施结果`],['素养','能履行分工职责，如实记录问题并与团队协作改进']].map(([category,title])=>({id:id(),category,title,origin:'generated-draft'}))}]};
}
export function draftCourseTask(context,courseName,taskName){
 if(!gate(context).ready)throw Error(gate(context).error);
 const course=courseName.trim(),title=taskName.trim();
 if(!course||!title)throw Error('请填写课程名称和项目任务名称');
 const description=[`任务情境：在《${course}》课程中，以“${title}”为项目任务，结合教师提供的案例和任务书开展实践。`,`学习目标：理解“${title}”涉及的课程知识，能制定方案、实施任务并说明结果依据。`,`实施步骤：阅读任务书并明确要求；查阅《${course}》相关资料；制定步骤与分工；完成“${title}”并记录过程；检查成果，交流反思并改进。`,`成果与评价：提交“${title}”的任务成果、过程记录和反思说明；从知识运用、过程规范、成果质量与协作表现进行评价。`,`学习准备与支持：复习《${course}》相关基础知识；准备任务书、课程资料和记录表，按课堂条件确定工具与资源；教师提供示范和检查清单。`].join('\n\n');
 return {id:id(),name:'',major:context.major,planId:context.planId,origin:'course-task-draft',source:{courseName:course,taskName:title,note:`依据教师输入的课程《${course}》与项目任务“${title}”生成本地规则草稿；未调用在线 AI，未关联岗位调研证据`},tasks:[{id:id(),title,description,abilities:[['知识',`能解释《${course}》中与“${title}”相关的概念、方法和评价要求`],['技能',`能运用《${course}》所学方法制定“${title}”的实施方案，完成任务并记录和检查结果`],['素养',`能在“${title}”中履行分工职责，规范使用课程资源，如实记录问题并协作改进`]].map(([category,title])=>({id:id(),category,title,origin:'generated-draft'}))}]};
}
export const taskTypes={
 '基础型':{scaffold:'提供分步引导、操作手册、检查表和示范；先模仿再独立执行',transfer:'更换一个工作条件，借助检查表独立完成相同类型任务'},
 '综合型':{scaffold:'提供工作要求和参考资料，以启发性问题支持跨环节方案设计，逐步撤去操作提示',transfer:'改变任务条件并综合运用多项技能，比较方案并说明取舍'},
 '创新型':{scaffold:'提供开放问题和资源边界，由学生提出目标和评价标准，教师在关键节点引导讨论',transfer:'提出新的改进方向，自主制定验证方案并用证据解释创新价值'}
};
export function defaultDesign(role,task,courseName='本课程'){
 if(role.origin==='course-task-draft'){
  const course=role.source.courseName;
  return {taskType:'综合型',title:task.title,courseGoal:`运用《${course}》的相关知识与方法完成“${task.title}”，能够解释方案、记录过程并评价成果`,learners:'正在学习本课程的学生，按课堂诊断结果调整难度',prerequisites:`复习《${course}》中与“${task.title}”相关的基础知识与方法`,problem:`如何运用《${course}》所学完成“${task.title}”，并以过程记录和成果证明达到任务要求？`,object:`“${task.title}”任务书指定的案例与实践对象`,content:task.title,tools:`《${course}》课程资料、任务书、过程记录表及课堂配套工具`,organization:'3人一组，轮换实施、记录与检查角色',product:`“${task.title}”任务成果、过程记录与反思说明`,environment:`《${course}》课堂或配套实践环境，实施前由教师确认资源与条件`,scaffold:'提供示范、任务检查清单与反馈，按学生完成情况逐步减少提示',criteria:'依据任务书核对知识运用、过程规范、成果质量与协作表现；评价结论附过程证据',transfer:`改变“${task.title}”的一个条件，运用课程方法调整方案并说明依据`,explanation:task.description};
 }
 const robot=role.origin==='reference';
 return {taskType:'综合型',courseGoal:`运用《${courseName}》的相关知识与技能完成“${task.title}”，解释实施方案、记录工作过程，并依据成果证据开展评价与反思`,title:robot?'工业机器人工作站操作与验收':`${task.title}实践项目`,learners:'已学习专业基础知识的二年级学生',prerequisites:robot?'已完成机器人安全操作与示教器入门训练':'具备相关基础知识，教师在实施前完成技能诊断',problem:robot?'如何在规定作业要求下完成机器人参数设置与操作，并用运行记录证明工作站能够安全、稳定运行？':`如何完成“${task.title}”，并用可检查的成果证明符合工作要求？`,object:robot?'教学用工业机器人工作站':`“${task.title}”任务书指定的教学案例、输入材料与待交付成果`,content:task.title,tools:robot?'示教器、离线仿真软件、设备操作手册':`《${courseName}》课程资料、“${task.title}”任务书、岗位操作规范、配套实训工具与过程记录表`,organization:'3人一组，轮换操作、记录与检查角色',product:robot?'操作方案、参数记录、运行验证记录与交接说明':'任务成果、过程记录与交接说明',environment:robot?'校内机器人实训室；先仿真，教师检查安全条件后实操':'校内实训环境，按教学条件简化工作规模',scaffold:'提供引导问题、操作手册与质量检查表；逐步减少提示',criteria:'按任务书逐项核对功能与质量要求；过程记录可追溯，发现问题后完成复测',transfer:'更换作业条件后独立调整方案，说明调整依据'};
}
export function designError(d){
 for(const [k,label] of Object.entries({title:'项目名称',courseGoal:'课程学习目标',learners:'学情',prerequisites:'先备知识',problem:'核心问题',object:'工作对象',content:'工作内容',tools:'工具与资源',organization:'组织方式',product:'成果',environment:'学习环境',scaffold:'学习支持',criteria:'验收标准',transfer:'迁移任务'}))if(!d[k]?.trim()||d[k].includes('请具体填写'))return `请填写${label}`;
 return '';
}
export function generateProject({context,role,task,abilities,design,confirmed}){
 if(!gate(context).ready)throw Error(gate(context).error);
 if((context.major&&role.major!==context.major)||(context.planId&&role.planId!==context.planId))throw Error('岗位与当前专业、人培不匹配');
 if(!role.tasks.some(t=>t.id===task.id))throw Error('请选择该岗位的工作任务');
 if(!abilities.length||abilities.some(a=>!a.title?.trim()||!task.abilities.some(x=>x.id===a.id)))throw Error('请选择有效的岗位能力');
 const err=designError(design);if(err)throw Error(err);
 if(!confirmed)throw Error('请先审阅并确认转化草稿');
 const p=createProject(design.title,design.problem);
 p.learningDesign={...structuredClone(design),context:structuredClone(context),role:structuredClone(role),sourceTask:{id:task.id,title:task.title,...(typeof task.description==='string'?{description:task.description}:{})},abilities:structuredClone(abilities),method:'学习型工作任务 · 教学性改造 v1',review:'教师已确认教学草稿；岗位来源仍保留原证据状态',engine:'local-rules',createdAt:new Date().toISOString()};
 const phases=[
 ['明确任务与获取信息',`分析${design.object}的工作要求`,'需要解决什么问题，哪些信息还不完整？','任务分析单与资料来源记录',`说明“${design.problem}”的目标、约束和信息依据`],
 ['制定工作计划',`制定${task.title}的实施计划`,'如何安排步骤、分工、资源与检查点？','工作计划与资源清单','计划覆盖主要工作环节，分工明确，资源与时间安排可行，关键检查点有对应负责人'],
 ['方案决策',`论证${design.object}的实施方案`,'备选方案为何适合当前条件？','方案比较与决策记录',`说明工具选用及方案依据，落实${design.environment}`],
 ['实施与过程记录',`完成${design.content}`,'执行中出现偏差时如何定位和调整？',design.product,`按计划实施，结合能力目标记录操作及调整依据；${design.criteria}`],
 ['检查与质量控制',`检验${design.object}的工作成果`,'哪些证据能够证明任务符合要求？','质量检查表、问题清单与复测记录',design.criteria],
 ['评价反馈与迁移',`交接成果并完成迁移挑战`,'经验能否用于变化后的工作条件？','成果说明、反思记录与迁移方案',design.transfer]
 ];
 delete p.learningDesign.hours;
 p.stages=phases.map(([name,title,question,evidence,criteria],i)=>{
  const s=createStage(name);
  const t=createTask(title);
  const mapped=i===0?abilities.filter(a=>a.category==='知识'):i===3?abilities.filter(a=>a.category==='技能'):i===5?abilities:abilities.filter(a=>a.category==='素养');
  t.learningActivity={question,evidence,criteria,abilityIds:mapped.map(a=>a.id),support:design.scaffold};
  t.description=taskDescription(t,p.learningDesign,s);
  t.contents=mapped.map(a=>({id:id(),type:'目标',title:a.title,abilityId:a.id,scored:false}));s.tasks=[t];return s;
 });return p;
}

export function inputRole(context,name,work){
 if(!gate(context).ready)throw Error(gate(context).error);
 if(!name.trim())throw Error('请填写岗位名称');
 const titles=work.split('\n').map(t=>t.trim()).filter(Boolean);
 if(!titles.length)throw Error('请填写至少一个典型工作任务');
 return {id:id(),name:name.trim(),major:context.major,planId:context.planId,origin:'teacher-input',source:{note:'教师自定义岗位与典型工作任务，尚未关联岗位调研证据'},tasks:titles.map(title=>({id:id(),title,description:'',abilities:[]}))};
}
export function draftCourseRole(context,courseName,direction){
 if(!gate(context).ready)throw Error(gate(context).error);
 const course=courseName.trim(),field=direction.trim();
 if(!course||!field)throw Error('请填写课程名称和工作方向');
 const role=inputRole(context,`${field}技术员`,[`${field}需求分析与方案制定`,`${field}实施与过程记录`,`${field}成果检查与交接`].join('\n'));
 return {...role,origin:'generated-draft',source:{courseName:course,direction:field,note:`依据课程《${course}》和工作方向“${field}”生成的本地规则草稿，未调用在线 AI，岗位名称与任务需教师修订确认`},tasks:role.tasks.map(task=>({...draftCourseTask(context,course,task.title).tasks[0],id:task.id}))};
}
