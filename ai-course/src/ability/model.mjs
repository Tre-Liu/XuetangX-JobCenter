export const ABILITY_KEY='ai-course-plc-abilities-v1';
export const categories={knowledge:{label:'知识能力目标',short:'知识',icon:'book'},skill:{label:'技能能力目标',short:'技能',icon:'settings'},quality:{label:'素养能力目标',short:'素养',icon:'plant'}};
export const levels=['识记','理解','应用','分析','综合'];
const jobs=[['job-electric','电气装调技术员','设备安装与电气调试'],['job-plc','PLC程序设计员','控制程序设计与验证'],['job-debug','自动化设备调试员','系统联调与验收'],['job-maintain','电气设备维护员','故障诊断与维护'],['job-quality','设备质量检验员','性能检测与交付']].map(([id,title,description])=>({id,title,description}));
const requirements=[['gr1','1.1 工程基础','运用电工、电子与自动控制知识解释设备工作原理。'],['gr2','2.1 问题分析','识别电气控制问题，依据图纸、数据和测试记录分析原因。'],['gr3','3.2 方案设计','针对控制需求设计可验证的程序与电气控制方案。'],['gr4','4.1 工具应用','使用编程、仿真和测量工具完成控制系统调试。'],['gr5','5.1 职业规范','遵守操作规程、质量要求与工程职业伦理。'],['gr6','6.2 沟通协作','在团队中清晰记录、交流技术信息并完成交接。'],['gr7','7.1 持续改进','根据反馈优化方案，迁移所学解决新问题。']].map(([id,title,description])=>({id,title,description}));
const knowledgeNames=['低压电器与符号','电气原理图识读','电机正反转与互锁','PLC组成与扫描周期','输入输出地址分配','PLC硬件组态','常开常闭触点与线圈','置位复位与自保持','定时器与计数器','顺序控制与状态机','功能块与数据类型','模拟量采集与量程转换','传感器接线与选型','变频器参数与控制','气动执行机构','工业通信与网络组态','HMI变量与画面设计','报警与事件记录','程序监控与信号追踪','故障树与排查方法','测试用例与验收规范','程序版本与备份','电气作业安全规程','工程文档与交接'];
const knowledge=knowledgeNames.map((title,i)=>({id:`kp${i+1}`,title,resources:[{id:`kp${i+1}-video`,title:`${title} · 教师讲解`,type:'视频',duration:`${8+i%9}:30`},{id:`kp${i+1}-practice`,title:`${title} · 实训任务单`,type:'图文',duration:'1份'}]}));
// All relationships below are explicitly authored teaching simulations, not enterprise observations.
const specs=[
 ['electrical','电气控制基础','book',[0,3],[0,1,4],[
 ['识读低压电器及电气符号','knowledge',1,'能够识别接触器、继电器与保护器件，并解释其在控制线路中的作用。','完成12种常用器件识别与符号配对，提交识别记录。',[1,2]],
 ['分析电机启停与互锁原理','knowledge',2,'能够说明自保持、停止优先与正反转互锁，分析典型线路的动作过程。','准确解释3种线路动作顺序，标出互锁触点。',[2,3]],
 ['绘制电机正反转控制电路','skill',3,'根据电机正反转需求绘制主回路和控制回路，准确标注端子及器件编号。','交付一套图纸，经同伴复核无漏标且互锁完整。',[2,3]],
 ['核验电气接线与保护配置','skill',3,'依据图纸逐点检查端子、导线和保护配置，记录不一致项并完成闭环。','提交20个端子核查表和缺陷整改记录。',[1,2,23]],
 ['遵守断电核查与授权操作规范','quality',3,'在实训接线、检查和试车中遵守授权操作流程，如实记录风险与检查结果。','提交断电核查清单，关键检查项经教师签认。',[23,24]]]],
 ['plc','PLC认知与组态','simulation',[1,2],[0,3,4],[
 ['解释PLC扫描周期与运行机制','knowledge',2,'能够区分输入采样、程序执行和输出刷新，解释扫描周期对逻辑响应的影响。','利用时序图解释2个输入输出案例。',[4,7]],
 ['规划I/O点位与地址分配','skill',3,'依据设备输入输出清单分配PLC地址，区分常闭信号的正常状态与故障状态。','提交8点DI、4点DO分配表，无地址冲突。',[5,13]],
 ['完成PLC硬件组态与下载','skill',3,'选择匹配的CPU与模块，设置网络地址，完成编译、下载与在线状态核查。','保存组态截图、编译结果与连接检查记录。',[4,6,16]],
 ['分析失电与上电初始状态','knowledge',4,'依据电路与PLC信号解释失电、上电及复位时的设备状态，识别意外启动风险。','完成4种恢复场景的状态分析表。',[4,5,23]],
 ['维护点位表与组态版本一致性','quality',3,'按统一命名更新点位表、程序与组态版本，在团队交接前完成交叉复核。','提交版本对应表，点位和程序注释一致。',[5,22,24]]]],
 ['logic','基本指令与逻辑','graph',[1,2],[1,2,3],[
 ['辨析触点、线圈及置位复位指令','knowledge',2,'理解常开常闭触点、输出线圈和置位复位的执行语义，辨析重复线圈的风险。','完成10道逻辑轨迹题并解释关键状态。',[7,8]],
 ['编写启停自保持与电机互锁程序','skill',3,'依据启停与正反转要求编写梯形图，设置停止优先与互锁条件并验证输出行为。','5组输入序列全部通过，保存梯形图与轨迹。',[3,7,8]],
 ['应用定时器实现延时启停','skill',3,'选择适当定时器实现2秒启动预警和5秒无料停机，处理条件撤销后的计时清零。','提交预警、停机与中断后重启的6项记录。',[8,9]],
 ['应用计数器实现工件计数','skill',3,'利用边沿触发和计数器记录工件数量，避免持续信号导致重复计数。','100件模拟输入计数100件，差值0件。',[7,9,13]],
 ['执行程序互审与规范注释','quality',3,'在程序设计与复核中遵守统一命名，明确注释逻辑意图并记录同伴评审意见。','提交两轮评审意见与对应修订记录。',[7,22,24]]]],
 ['sequence','顺序控制与功能块','tree',[1,2],[1,2,6],[
 ['构建设备顺序控制状态模型','knowledge',4,'将设备动作分解为停止、预警、运行与故障状态，明确每条转移的触发条件。','提交状态转移表，覆盖所有正常与异常路径。',[10,11]],
 ['设计分拣设备顺序控制程序','skill',4,'将检测、判断、推料和回位组织成可复位的顺序程序，校验互锁与动作超时。','模拟200件分拣，提交动作轨迹和故障复测表。',[9,10,13,15]],
 ['封装可复用电机控制功能块','skill',5,'封装启停、互锁、故障与反馈接口，明确输入输出和内部状态并在两个实例中复用。','交付接口说明及两实例独立运行的验证结果。',[8,10,11]],
 ['分析死锁与异常恢复路径','knowledge',4,'根据状态轨迹识别无法转移、重复执行与异常恢复缺陷，并给出修订方案。','复现并修复3个异常场景，保留前后轨迹。',[10,19,20]],
 ['依据反馈持续优化控制方案','quality',4,'基于测试和评审反馈调整设计，对每次修改说明原因、影响与复测结果。','提交包含问题、修改和复测的3条改进记录。',[21,22,24]]]],
 ['field','传感检测与执行','settings',[0,2],[0,2,3],[
 ['比较光电与电感传感器工作原理','knowledge',2,'解释光电和电感式传感器适用条件，根据工件材质、距离与环境选择检测方案。','完成两种工件检测方案及选型说明。',[12,13]],
 ['实现模拟量采集与工程值转换','skill',4,'依据4—20mA量程完成原始值到工程值的转换，处理越限与断线输入。','5个标定点转换正确，提交越限测试结果。',[11,12]],
 ['配置变频器与PLC启停联动','skill',3,'设置电机参数及控制方式，核验运行使能与故障反馈，完成PLC联动验证。','提交参数表及6项联动测试记录。',[5,14]],
 ['校验气缸到位信号与动作超时','skill',4,'核验气缸伸出和回位信号，设置动作互锁与超时报警，复测未到位场景。','3项异常注入用例通过，保存信号轨迹。',[9,13,15]],
 ['如实记录设备参数与测试异常','quality',3,'在参数调整与测试中保存原始数据，完整记录异常、操作者及复测情况。','交付参数变更日志及未经覆盖的原始测试表。',[18,21,24]]]],
 ['hmi','通信与人机交互','chats',[1,2],[2,3,5],[
 ['解释PLC通信与HMI数据交互','knowledge',2,'说明PLC、HMI间变量地址与数据类型对应关系，辨析断线和变量失配表现。','完成10个变量的地址与数据类型配对。',[11,16,17]],
 ['设计设备监控画面与操作权限','skill',4,'设计状态、参数和操作区，区分查看与修改权限，避免误操作按钮产生歧义。','交付3个画面，操作与权限用例全部通过。',[16,17,23]],
 ['配置报警与事件追踪','skill',3,'依据故障类型配置报警编号与确认机制，记录时间、原因、处置和恢复状态。','交付8类报警表及触发、确认、恢复记录。',[17,18]],
 ['诊断PLC与HMI通信故障','skill',4,'按照电源、网络、地址与变量映射顺序排查通信故障，记录证据后复测连接。','定位3个预置故障并提交排查路径。',[16,17,20]],
 ['清晰表达操作信息并开展交接','quality',3,'采用一致术语展示设备状态，以操作员可理解的步骤说明报警处理与交接要点。','提交操作指南，经同伴按步骤完成1次操作。',[17,18,24]]]],
 ['debug','系统联调与诊断','target',[2,3],[1,3,6],[
 ['制定联调步骤与功能测试用例','knowledge',4,'将控制要求转换为输入、步骤、预期输出和通过判据，覆盖正常、边界和异常。','编制20项用例并逐条对应控制需求。',[19,20,21]],
 ['执行逐点校验与空载联调','skill',3,'核对现场输入输出与监控表，完成方向、互锁和停止逻辑的空载验证。','交付12点核验表及空载联调记录。',[5,19,21]],
 ['定位并修复复位后误启动缺陷','skill',4,'通过状态追踪复现复位后误启动，分析残留状态并修订恢复逻辑后复测。','保留缺陷复现轨迹、修改版本和回归记录。',[8,10,19,20]],
 ['验证系统响应与计数一致性','skill',5,'基于20项功能用例和100件投料记录综合验证设备逻辑，核对响应及计数差异。','20/20用例通过，100件计数差0件，保留原始记录。',[9,19,21]],
 ['协作排查故障并保持证据完整','quality',4,'在联调中明确操作者、观察者与记录者职责，以证据支持判断，保留失败用例。','交付分工表与含失败、修订、复测的闭环报告。',[20,21,24]]]],
 ['delivery','质量验收与交付','flag',[2,4],[4,5,6],[
 ['解读验收判据与交付要求','knowledge',2,'理解功能、记录和版本一致性的验收要求，区分教学阈值与设备安全认证。','完成验收要求清单，并标记证据与责任人。',[21,23,24]],
 ['组织功能验收与缺陷闭环','skill',4,'按照任务书组织验收，对失败项记录问题、整改、复测和签认，形成闭环清单。','提交20项验收表，每个缺陷均有复测记录。',[20,21]],
 ['整理程序备份与工程交付包','skill',3,'核对程序、图纸、参数、测试表及操作说明版本，打包可追溯的工程交付资料。','交付5类文件，版本号、点位表与程序一致。',[22,24]],
 ['汇报控制方案并解释证据','quality',4,'围绕需求、设计、实施与验证进行汇报，清晰表达未解决的问题及适用边界。','完成8分钟成果汇报和3项技术问答。',[21,24]],
 ['迁移控制方案到新工况','skill',5,'将单入口输送控制迁移到双入口场景，重新分配地址、分析冲突并补充验证用例。','交付双入口方案、更新点位表和新增5项用例。',[5,10,11,21]]]]
];
export function createAbilityModel(){
 const modules=specs.map(([id,title,icon])=>({id,title,icon}));
 const abilities=specs.flatMap(([moduleId,, ,jobIndices,reqIndices,rows],mi)=>rows.map(([title,category,level,description,evidence,kps],i)=>({id:`ab-${moduleId}-${i+1}`,code:`CO${String(mi*5+i+1).padStart(2,'0')}`,moduleId,title,category,level,description,evidence,tags:category==='quality'?['职业规范','团队协作']:category==='skill'?['实训目标','可评价']:['课程基础','理解应用'],jobIds:jobIndices.map(j=>jobs[j].id),requirementIds:reqIndices.slice(0,category==='quality'?3:2).map(j=>requirements[j].id),knowledgeIds:kps.map(j=>`kp${j}`),source:'teaching-simulation'})));
 return {version:1,courseName:'电气控制与PLC',source:'课程教学模拟数据；非企业实测或学校正式毕业要求',modules,abilities,jobs,requirements,knowledge};
}
export function filterAbilities(model,{search='',category='all',moduleId='all'}={}){const q=search.trim().toLowerCase();return model.abilities.filter(a=>(category==='all'||a.category===category)&&(moduleId==='all'||a.moduleId===moduleId)&&(!q||[a.title,a.code,a.description,...a.tags,...model.jobs.filter(j=>a.jobIds.includes(j.id)).map(j=>j.title),...model.knowledge.filter(k=>a.knowledgeIds.includes(k.id)).map(k=>k.title)].join(' ').toLowerCase().includes(q)));}
export function validateAbility(a){if(!a.title.trim())return '请输入能力目标名称';if(!categories[a.category])return '请选择目标分类';if(!Number.isInteger(a.level)||a.level<1||a.level>5)return '请选择目标难度';return '';}
export function saveAbilityModel(storage,model){storage.setItem(ABILITY_KEY,JSON.stringify(model));}
export function loadAbilityModel(storage){const seed=createAbilityModel();try{const saved=JSON.parse(storage.getItem(ABILITY_KEY));if(saved?.version===1&&Array.isArray(saved.abilities)){seed.abilities=seed.abilities.map(a=>{const edited=saved.abilities.find(x=>x.id===a.id);return edited&&!validateAbility(edited)?{...a,...edited}:a;});}}catch{}return seed;}
