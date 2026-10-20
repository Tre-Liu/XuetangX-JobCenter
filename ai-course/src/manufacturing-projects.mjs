import {createProject,createStage,createTask} from './project.mjs';
import {addManufacturingEvaluation,migrateManufacturingEvaluation} from './manufacturing-evaluation.mjs';
export const MANUFACTURING_COURSE='电气控制与PLC';
export const DEMO_REVISION='plc-projects-2026-10-10-v2';
export const PROJECTS_KEY='ai-course-projects-v1';
export const BACKUP_KEY='ai-course-projects-before-plc-2026-10-10';
const phases=['明确任务与获取信息','制定工作计划','方案决策','实施与过程记录','检查与质量控制','评价反馈与迁移'];
const source={origin:'teaching-simulation',note:'按制造实训场景编制的教学模拟数据；设备配置、订单、故障和验收样例均非企业实测。阈值为本项目教学任务书要求。',courseReference:'https://www.yrcti.edu.cn/kcsz/info/1330/2194.htm'};
const specs=[{
 key:'conveyor',title:'输送线启停与电机互锁控制',role:'制造车间电气装调技术员',work:'输送线电气控制安装与调试',
 scenario:'某机加工车间将零件由加工区送至检验区。教学台采用24 V DC控制、0.37 kW三相异步电动机与变频器，输送速度0.12 m/s；强电安装由具备资质的教师指导，学生先完成仿真。',
 status:'原继电器线路存在重复启动、故障复位后误启动风险；需改为PLC控制。教学订单为100件铝合金支架，启动预警2 s、无料延时停机5 s，急停由独立安全回路切断驱动使能。',
 question:'如何完成输送线PLC改造，使启动、停止、互锁、堵料报警和故障恢复均可验证，并确保上电或复位后不会自行启动？',
 setup:'PLC采用S7-1200 CPU 1214C DC/DC/DC；DI 8点：I0.0启动、I0.1停止回路正常、I0.2安全回路反馈、I0.3入口光电、I0.4出口光电、I0.5驱动就绪、I0.6复位、I0.7手自动选择；DO 4点：Q0.0运行使能、Q0.1绿灯、Q0.2红灯、Q0.3蜂鸣器。停止与安全反馈采用失电识别。',
 criteria:'启动预警2 s；停止指令后PLC运行输出在100 ms内撤销（仅为逻辑响应要求，不代表机械停止距离）；无料5 s停机；入口触发后10 s未到出口报警。上电、急停释放、故障复位均需重新启动。功能用例20项全部通过，连续100件无误计数。',
 sample:'验收样例：20项用例首轮18项通过，整改“复位后误启动”“延时停机计时未清零”后20/20通过；模拟100件投料，出口累计100件，计数差0件；逻辑响应记录60、70、80 ms，最大80 ms。',
 groups:[
 [['识读输送工艺与启停要求','列出预警、无料、堵料与复位条件，区分普通控制和独立安全回路。','需求与验收表'],['核查电气台与控制点位','逐点核对DI 8点、DO 4点；确认驱动使能端子、电源及安全反馈。断电检查后由教师批准上电。','I/O核查表与风险清单']],
 [['编制I/O与地址分配表','按指定地址绘制接线草图，标明常闭回路与失电状态。','I/O分配表'],['安排装调分工与检查节点','3人轮换接线核查、程序编制和记录；设断电检查、空载试车、带件验证三处签认。','分工与检查计划'],['准备状态表与计时记录模板','建立停止、预警、运行、故障状态表，预置20项测试用例。','状态表与用例清单']],
 [['比较自保持与状态机控制方案','比较重复启动、断电恢复与报警处理方式，说明选择状态机的依据。','方案比较表'],['评审互锁与安全边界','检查停止优先、禁止自动重启与安全反馈逻辑；急停功能不得依靠普通PLC软件实现。','互锁评审记录']],
 [['编写启停互锁与报警程序','编写2 s预警、5 s无料、10 s堵料逻辑；仿真检验状态转换。','程序V1与仿真记录'],['完成逐点校验与空载联调','核验现场信号与监控表；完成方向确认，记录预警和输出撤销时间。','逐点校验及空载记录'],['带件试运行与异常复测','执行100件任务，记录出口计数；注入停止、堵料、驱动未就绪并复测恢复流程。','试运行与异常日志']],
 [['执行20项功能验收','按同一输入序列检查启动、停止、复位、上电状态；保存每项输入输出轨迹。','20项验收表'],['整改计时与恢复逻辑缺陷','复现复位误启动、计时未清零问题，先写复现步骤再修改，复测相应用例。','整改闭环单'],['核对100件计数与交付版本','核对投料、出口与程序版本；任何差异均逐件追溯。','计数核对表与交付清单']],
 [['汇报输送线控制改造成果','展示接线图、程序、20项测试与100件记录，解释独立安全回路的边界。','交接包'],['迁移到双入口输送场景','增加第二入口检测，重新分配地址并提出防重复计数方案，补充测试。','迁移方案与反思']]]
},{
 key:'sorting',title:'金属与非金属工件自动分拣',role:'自动化设备调试技术员',work:'工件分拣设备程序设计与调试',
 scenario:'零部件车间需将金属件与非金属件分流。教学台采用24 V DC控制、入口光电、电感式金属传感器、双作用气缸和两料箱；气源设定0.50 MPa，输送速度0.10 m/s，按单件节拍运行。',
 status:'模拟批次200件：金属120件、非金属80件；首轮分拣金属正确116件、非金属正确77件，正确率193/200=96.5%。入口到检测位0.30 m，需消除传感器抖动和气缸未回位时继续送料的问题。',
 question:'如何建立检测、判别、分流与计数顺序，使200件正确率达到99%以上，并在气压低、气缸超时或料箱满时可靠暂停？',
 setup:'DI 10点：I0.0启动、I0.1停止正常、I0.2安全反馈、I0.3入口光电、I0.4金属检测、I0.5气缸伸出、I0.6气缸缩回、I0.7气压正常、I1.0金属箱满、I1.1非金属箱满；DO 5点：Q0.0输送使能、Q0.1推料阀、Q0.2绿灯、Q0.3红灯、Q0.4蜂鸣器。',
 criteria:'检测信号稳定确认50 ms；气缸动作超时1.0 s报警；气压低于0.40 MPa暂停（压力开关判定）；未缩回不得放行下一件。200件分拣正确率≥99%，两类合计计数200件，逐件记录可追溯；目标节拍≤6 s/件。',
 sample:'验收样例：调试后金属119/120正确，非金属79/80正确，合计198/200=99.0%；错误2件单独登记，不写成零缺陷。200件总用时1160 s，平均5.8 s/件（含正常等待、不含故障注入）；低压、超时、满箱各3次测试均触发暂停，须人工确认复位。',
 groups:[
 [['分析分拣订单与首轮错分记录','核对120件金属与80件非金属，计算96.5%首轮正确率并分类7条错误记录。','订单与错误分析表'],['检查传感器位置和气动条件','测量0.30 m间距，核查0.50 MPa气源、0.40 MPa开关与气缸限位；独立确认安全回路。','布局尺寸与风险表']],
 [['分配检测与执行I/O地址','编制10点输入、5点输出表，区分信号有效电平与报警状态。','I/O与接线表'],['规划单件追踪与计数方法','建立工件编号、类别、检测、去向字段；禁止靠总计数掩盖错分。','逐件追踪模板'],['安排分组调试与批次计划','先空载再10件试分，最后200件；安排观察、编程、数据复核职责。','批次与分工计划']],
 [['比较固定延时与位置检测方案','0.30/0.10=3 s仅作理论到达时间；比较打滑、启停影响，选择传感器事件触发。','方案比较与计算表'],['确定分拣状态与互锁规则','定义待料、检测、推料、回位和报警状态；确认50 ms滤波、1.0 s超时及满箱处理。','状态转移与评审表']],
 [['编写单件检测与推料程序','完成上升沿计数、金属确认和回位互锁；在仿真中检查重复脉冲。','程序V1与仿真轨迹'],['校验传感器并进行10件试分','金属与非金属各5件，记录识别距离和动作时间，优化传感器安装位置。','10件试分记录'],['运行200件批次并注入故障','保存逐件分类与用时，另做低压、超时、满箱各3次测试，不混入正常节拍统计。','200件台账与故障日志']],
 [['计算正确率与平均节拍','核对119+79=198件正确，198/200=99.0%，1160/200=5.8 s/件；保留2件错分。','批次统计与验收表'],['追溯错分并复测联锁','定位2件错分的传感器时序，修正后用同类样件复测，不篡改原200件批次结果。','错分整改与复测记录'],['核对计数平衡与异常恢复','检查投入=两箱计数+在途+剔除；确认回位、气压恢复和满箱清除后仍须人工启动。','计数平衡与恢复检查表']],
 [['交付分拣系统与批次证据','交付程序、I/O表、逐件数据及验收报告，说明99%指标与错分限制。','交接包'],['迁移到三类工件识别','增加颜色传感器，提出三类识别、地址扩展和误判复核方案。','扩展方案与反思']]]
},{
 key:'assembly',title:'双工位气动装配线联调与故障诊断',role:'制造产线电气维护技术员',work:'装配线顺序控制联调与故障排查',
 scenario:'教学装配线模拟套筒与销轴装配：A站定位夹紧，B站气缸压装与到位确认。控制电压24 V DC，气源0.50 MPa；仅做低力教学压装，到位信号不等于真实压装力或质量检测。',
 status:'模拟首轮50循环平均节拍14.8 s；出现3次夹紧超时、2次工位握手滞留。需完善工位就绪、请求、完成及释放握手；验收批次60套，换型时不得沿用未确认参数。',
 question:'如何完成双工位顺序控制与联调，在保持夹紧、回位和工位握手互锁的条件下缩短节拍，并用故障复现记录验证恢复流程？',
 setup:'DI 14点：I0.0启动、I0.1停止正常、I0.2安全反馈、I0.3 A站有料、I0.4夹紧到位、I0.5松开到位、I0.6 B站有料、I0.7压装上位、I1.0压装下位、I1.1气压正常、I1.2转运原位、I1.3转运到位、I1.4复位、I1.5手自动；DO 8点：Q0.0夹紧、Q0.1松开、Q0.2转运进、Q0.3转运退、Q0.4压装下、Q0.5压装上、Q0.6绿灯、Q0.7报警。双线圈输出禁止同时有效。',
 criteria:'夹紧/松开超时1.2 s、转运超时2.0 s、压装超时1.5 s；夹紧到位及B站有料均有效才可压装；连续60套平均节拍≤13 s。急停、低压、到位丢失、握手超时四类故障各3次验证，恢复后不得自动续动。仅验收到位与顺序，不声称压装力和成品质量合格。',
 sample:'验收样例：首轮50循环总740 s，平均14.8 s；优化后60套总756 s，平均12.6 s，平均节拍缩短(14.8−12.6)/14.8≈14.9%。四类故障共12次注入，12次报警并阻断运行，人工复位后需重新启动；以上为不同批次教学模拟比较。',
 groups:[
 [['分析装配工艺与设备边界','绘制A站夹紧、转运、B站压装流程，明确到位检测不能证明压装质量。','工艺与验收边界表'],['复核首轮节拍与故障台账','核对50循环740 s与5次故障记录，区分夹紧超时和握手滞留。','基线统计与故障分类表']],
 [['编制双工位I/O和互锁表','分配14点输入、8点输出，列出双线圈互斥、到位与气压前提。','I/O及互锁矩阵'],['制定握手信号与联调顺序','定义就绪、请求、完成、释放以及超时；先单站后双站再带件。','握手时序与联调计划'],['准备60套样件与故障用例','编制批次编号，配置四类故障各3次测试；分工操作、监护和记录。','批次和故障用例表']],
 [['比较串行与条件并行时序','只在转运区无冲突时提前备料；禁止夹紧未到位、压装未上位时转运。','时序方案比较表'],['评审超时参数与恢复策略','确认1.2/2.0/1.5 s超时；设计断电、急停后人工确认与手动回原位流程。','参数与恢复评审记录']],
 [['编写工位状态机与握手程序','使用明确状态与单次握手沿；实现超时报警、状态复位及互斥输出。','程序与时序轨迹'],['完成单站校验与双站联调','核对限位实际状态，再联调请求/完成/释放；记录握手滞留复现与修正。','单站与双站联调表'],['运行60套并记录每循环节拍','按样件编号保存循环时间和异常；故障注入单独测试，不计入正常节拍756 s。','60套节拍与故障台账']],
 [['验证互锁及12次故障响应','急停、低压、到位丢失、握手超时各3次，保存阻断输出和人工恢复证据。','12次故障验收表'],['计算节拍改善并说明批次差异','计算756/60=12.6 s与14.9%缩短幅度；解释两批数量不同，不能直接比较总用时。','节拍比较及边界说明'],['核查交接参数和机械状态','核对程序版本、超时值、原位条件与气路图；列出缺少压装力检测的限制。','交付检查清单']],
 [['汇报装配线联调与诊断结果','展示互锁、握手、节拍与故障证据，交付维护与恢复操作说明。','联调验收与维护包'],['迁移到换型生产场景','更换套筒高度，提出参数确认、限位复核和试装流程，补充质量检测需求。','换型方案与反思']]]
}];
export function simulationData(key){
 if(key==='conveyor')return {source,tests:Array.from({length:20},(_,i)=>({caseId:`C${String(i+1).padStart(2,'0')}`,firstPass:i<18,finalPass:true})),batch:{input:100,output:100},logicResponseMs:[60,70,80]};
 if(key==='sorting')return {source,batch:Array.from({length:200},(_,i)=>{const material=i<120?'金属':'非金属';const correct=![47,153].includes(i);return {pieceId:`S${String(i+1).padStart(3,'0')}`,material,destination:correct?material:(material==='金属'?'非金属':'金属'),correct,cycleSeconds:[5.6,5.8,6.0,5.8][i%4]};}),faults:['低压','气缸超时','满箱'].flatMap(type=>Array.from({length:3},(_,i)=>({type,trial:i+1,paused:true,manualRestartRequired:true})))};
 return {source,baselineCycles:Array.from({length:50},(_,i)=>({cycle:i+1,seconds:i%2?15:14.6})),acceptanceCycles:Array.from({length:60},(_,i)=>({cycle:i+1,seconds:[12.2,12.6,13.0][i%3]})),faults:['急停','低压','到位丢失','握手超时'].flatMap(type=>Array.from({length:3},(_,i)=>({type,trial:i+1,blocked:true,manualRestartRequired:true})))};
}
export function manufacturingProjects(graph={nodes:[]}){
 const knowledgeNames=['PLC硬件组态','IEC 61131-3编程','顺序控制设计','工业传感器选型','PLC虚拟调试','机械安全风险评估','功能安全基础'];
 const points=graph.nodes.filter(n=>n.level>1&&knowledgeNames.includes(n.name));
 return specs.map(spec=>{
  const p=createProject(spec.title,spec.question);p.id='plc-demo-'+spec.key;p.demoRevision=DEMO_REVISION;p.knowledgeLimitVersion=1;p.provenance=source;p.simulationData=simulationData(spec.key);
  p.drivingQuestion={role:spec.role,scenario:spec.scenario,status:spec.status,outline:spec.question};
  const abilities=[['知识','识读电气图并解释PLC扫描、状态转换与互锁条件'],['技能',`完成${spec.work}，保存程序、I/O校验与故障复测证据`],['素养','执行断电核查和授权操作，如实记录异常，与同伴交叉复核']].map(([category,title],i)=>({id:`${p.id}-ability-${i}`,category,title,origin:'teaching-simulation'}));
  const role={id:`${p.id}-role`,name:spec.role,origin:'teaching-simulation',source,industryRelations:[]};
  p.learningDesign={title:p.title,taskType:'综合型',problem:spec.question,learners:'机电类专业二年级学生',prerequisites:'已完成电工基础、低压电器识读和PLC基本指令练习；教师实施前进行技能诊断。',courseGoal:`运用《${MANUFACTURING_COURSE}》完成${spec.work}，用可复核数据解释控制逻辑与验收结论。`,object:spec.scenario,content:spec.work,tools:'PLC、编程软件、24 V教学台、万用表、设备手册和过程记录表。'+spec.setup,organization:'3人一组，轮换编程、操作与记录复核；上电及动作试验由教师确认。',environment:'校内制造自动化实训室，先仿真后实操。急停和安全防护通过独立安全回路实现。',product:'电气图、I/O表、PLC程序、过程台账、验收与故障复测报告、交接说明。',scaffold:'提供设备手册、I/O核查表与测试用例，教师在上电、联调和验收节点检查。',criteria:spec.criteria,transfer:spec.groups[5][1][1],role,sourceTask:{id:`${p.id}-work`,title:spec.work},abilities,method:'学习型工作任务 · 六阶段教学化转化',engine:'authored-teaching-simulation',review:'按教学任务书编制，实施前由教师核查设备与参数',explanation:[`核心问题：${spec.question}`,'学情与先备条件：机电类专业二年级；已完成电工与PLC基础，3人一组轮换角色。',`设备与I/O：${spec.setup}`,`项目验收：${spec.criteria}`,`预置数据样例：${spec.sample}`,'评价：功能与指标40分、程序及图纸25分、证据与复测20分、协作交接15分；安全核查未通过不得进入实操。',`项目成果：电气图、PLC程序、逐项验收记录与交接包。\n数据说明：${source.note}`].join('\n\n')};
  p.stages=spec.groups.map((group,i)=>{const stage=createStage(phases[i]);stage.id=`${p.id}-stage-${i}`;stage.tasks=group.map(([title,steps,evidence],j)=>{const task=createTask(title);task.id=`${stage.id}-task-${j}`;const category=i===0||i===2?'知识':i===5?'素养':'技能';const mapped=abilities.filter(a=>a.category===category);task.learningActivity={steps,evidence,goal:`能够${title}，提交可复核的${evidence}`,criteria:i===4?spec.criteria:'记录与任务输入一致，附版本、操作者与复核结果；异常保留原始记录。',abilityIds:mapped.map(a=>a.id)};task.description=[`任务情境：在“${p.title}”中开展“${title}”。`,`学习目标：${task.learningActivity.goal}。`,`实施步骤：${steps}`,`成果与评价：提交${evidence}。${task.learningActivity.criteria}`,`学习准备与支持：${p.learningDesign.prerequisites} ${p.learningDesign.scaffold}`].join('\n\n');task.contents=points.filter(n=>i===0?['工业传感器选型','机械安全风险评估'].includes(n.name):i===1?n.name==='PLC硬件组态':i===2?n.name==='顺序控制设计':i===3?['IEC 61131-3编程','PLC虚拟调试'].includes(n.name):i===4?n.name==='功能安全基础':n.name==='顺序控制设计').map(n=>({id:`${task.id}-${n.id}`,title:n.name,type:'目标',source:'knowledge',knowledgeNodeId:n.id,scored:true}));return task;});return stage;});return p;
 }).map(p=>addManufacturingEvaluation(p,p.id.slice('plc-demo-'.length)));
}
// Replace the previous course demo once, retaining a complete recovery copy.
// After migration, edits and an intentionally empty project list survive refresh.
export function loadManufacturingProjects(storage,graph){
 const raw=storage.getItem(PROJECTS_KEY);let saved;
 try{saved=JSON.parse(raw);}catch{}
 const valid=Array.isArray(saved)&&saved.every(p=>typeof p.title==='string'&&Array.isArray(p.stages));
 if(storage.getItem(DEMO_REVISION)==='done'&&valid)return migrateManufacturingEvaluation(storage,saved,raw);
 if(raw!==null&&!storage.getItem(BACKUP_KEY))storage.setItem(BACKUP_KEY,raw);
 const projects=manufacturingProjects(graph);
 storage.setItem(PROJECTS_KEY,JSON.stringify(projects));storage.setItem(DEMO_REVISION,'done');return migrateManufacturingEvaluation(storage,projects,raw);
}
