import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const outputDir = resolve(projectRoot, 'output/robotics-training-plan-job-analysis');
const artifactPath = resolve(outputDir, 'artifact.json');
const analysisPath = resolve(outputDir, 'analysis_data.json');

mkdirSync(outputDir, { recursive: true });

function imageDataUri(fileName) {
  const filePath = resolve(outputDir, 'evidence', fileName);
  return `data:image/jpeg;base64,${readFileSync(filePath).toString('base64')}`;
}

const jobs = [
  {
    rank: 1,
    name: '机器人调试工程师',
    jobIds: 'IC-L3-1309；IC-L3-815',
    relation: '直接相关',
    occupation: '机器人工程技术人员；工业机器人系统运维员',
    occupationCode: '2-02-38-10；6-31-07-01',
    taskCount: 5,
    tasks: '机器人系统安装与现场调试；机器人编程与离线仿真；机器人应用系统集成与联调；机器人生产线虚拟调试；机器人系统运行维护与故障诊断',
    knowledge: '电气原理与装配规范；PLC、运动控制与工业通信；机器人控制器、驱动器与接口；数字仿真与系统测试',
    ability: '识图装配与接线；程序编制与仿真；参数设置、坐标标定与联调；系统测试；故障诊断与维护',
    quality: '安全操作；遵章执行；认真严谨；跨专业协同；记录可追溯',
    requiredAnchors: 10,
    electiveAnchors: 2,
    anchors: '机器人驱动与控制、电气控制与PLC、运动控制系统、工业控制网络、机器人操作系统；驱动/PLC/运动控制综合实训、机器人工程综合实训I/II、机器人建模与仿真综合实训；制造系统智能诊断技术（选修）',
    coverage: '强',
    gap: '现场需求分析、整线验收、运维报告与客户交付仍未形成明确的必修考核闭环。',
    evidence: '岗位库原始记录 + 校正后的岗位—职业关系 + 职业大典/职业标准/教学标准多源归并'
  },
  {
    rank: 2,
    name: '服务机器人应用技术员',
    jobIds: 'IC-L3-1308',
    relation: '直接相关',
    occupation: '服务机器人应用技术员',
    occupationCode: '4-04-05-07',
    taskCount: 5,
    tasks: '分析应用场景需求并提出方案；适配、安装、调试环境感知/运动控制/人机交互系统；参数调测与部署；运行监测、分析、优化与维护；技术咨询与服务',
    knowledge: '环境感知；运动控制；人机交互；机器人操作系统；应用部署与运维',
    ability: '场景需求分析；系统适配安装；参数调测与部署；运行监测优化；故障排除与技术服务',
    quality: '安全与服务意识；用户沟通；持续改进；规范记录；责任意识',
    requiredAnchors: 6,
    electiveAnchors: 3,
    anchors: '机器人视觉原理、运动控制系统、机器人操作系统、机器人技术基础、机器人工程综合实训I/II；具身智能机器人、物联网技术、模式识别与机器学习（选修）',
    coverage: '中强',
    gap: '面向家用、医疗、公共服务的场景需求、人机交互安全和客户现场服务训练不足。',
    evidence: '岗位库原始记录 + 职业名称直接命中 + 职业大典第217物理页主要工作任务'
  },
  {
    rank: 3,
    name: '自动控制工程师/技术员',
    jobIds: 'IC-L3-1326',
    relation: '直接相关',
    occupation: '当前表为电子元器件工程技术人员；建议复核自动控制工程技术人员',
    occupationCode: '现2-02-09-02；建议复核2-02-07-07',
    taskCount: 5,
    tasks: '自动化控制系统设计、调试与优化；控制方案制定和样机测试；生产线设备巡检与故障排除；跨职能沟通与持续改进；跟踪技术趋势并提出方案',
    knowledge: '自动控制理论；现代控制理论；运动控制；PLC；工业控制网络',
    ability: '控制方案设计；系统调试与优化；样机测试；巡检和故障处理；跨团队技术协同',
    quality: '安全；质量；创新；协作；持续学习',
    requiredAnchors: 9,
    electiveAnchors: 1,
    anchors: '自动控制理论、现代控制理论、电气控制与PLC、运动控制系统、工业控制网络、机器人驱动与控制；自动控制理论课程设计、PLC/运动控制综合设计与实训；智能控制（选修）',
    coverage: '强',
    gap: '岗位内容高度相关，但当前岗位—职业映射字段存在明显口径冲突，应先复核职业编码。',
    evidence: '岗位库原始任务 + 19条产业链匹配表第392行 + 职业大典自动控制工程技术人员任务语义校验'
  },
  {
    rank: 4,
    name: '工业视觉系统运维员',
    jobIds: 'IC-L3-1306',
    relation: '直接相关',
    occupation: '工业视觉系统运维员（建议校正）',
    occupationCode: '源字段4-04-05-01；建议校正6-31-07-02',
    taskCount: 9,
    tasks: '视觉硬件选型调试维护；采像打光；视觉精度与坐标标定；视觉系统与主控软件集成；图像特征确认与质量判断；样例程序验证；硬件更换后的重置调试',
    knowledge: '成像与光源；视觉标定；工业通信；图像质量评价；设备维护',
    ability: '相机/镜头/光源选型；标定；视觉程序验证；系统集成；故障诊断与恢复',
    quality: '精确严谨；质量意识；安全操作；快速响应；跨部门协同',
    requiredAnchors: 3,
    electiveAnchors: 3,
    anchors: '机器人视觉原理、工业控制网络、机器人工程综合实训II；深度学习、模式识别与机器学习、制造系统智能诊断技术（选修）',
    coverage: '中',
    gap: '缺少工业相机/镜头/光源选型、手眼标定、视觉通信和现场运维的成体系必修训练。',
    evidence: '岗位库原始任务 + 职业大典第562—563物理页；岗位主数据职业字段待校正'
  },
  {
    rank: 5,
    name: '机器视觉工程师',
    jobIds: 'IC-L3-155',
    relation: '邻近相关',
    occupation: '人工智能工程技术人员',
    occupationCode: '2-02-38-01',
    taskCount: 5,
    tasks: '图像/视频算法研发；复杂环境性能评估与调优；需求转化和产品落地；技术文档维护；跟踪前沿技术',
    knowledge: '图像处理；深度学习；视觉模型评测；产品需求；算法工程化',
    ability: '数据处理；目标检测/分类/跟踪模型开发；性能调优；产品集成；技术文档',
    quality: '创新；跨团队协作；工程伦理；学习能力；结果负责',
    requiredAnchors: 1,
    electiveAnchors: 4,
    anchors: '机器人视觉原理；深度学习、模式识别与机器学习、Python程序设计与应用、数据分析与信息可视化（选修）',
    coverage: '中弱',
    gap: '除机器人视觉原理外，算法、数据、部署和性能调优主要依赖选修，不能保证所有毕业生形成岗位能力。',
    evidence: '岗位库岗位画像 + 匹配表第537行/明细第700行 + 培养方案课程表'
  },
  {
    rank: 6,
    name: '嵌入式软件开发',
    jobIds: 'IC-L3-1305',
    relation: '邻近相关',
    occupation: '嵌入式系统设计工程技术人员；计算机软件工程技术人员',
    occupationCode: '2-02-10-06；2-02-10-03',
    taskCount: 5,
    tasks: '嵌入式系统设计、编码、调试与维护；开发工具与平台选型；软件架构与模块划分；开发文档和技术报告；产品技术支持',
    knowledge: '嵌入式架构；C/Python；接口与操作系统；软件测试；版本管理',
    ability: '编码调试；平台选型；模块设计；软硬件联调；文档与维护',
    quality: '严谨；版本纪律；协作；服务意识；持续学习',
    requiredAnchors: 2,
    electiveAnchors: 4,
    anchors: '机器人操作系统、微控制器综合设计与实训；C语言程序设计、Python程序设计与应用、嵌入式系统、计算机仿真与虚拟仪器（选修）',
    coverage: '中弱',
    gap: '关键编程与嵌入式课程为选修，且软件工程、自动测试、版本管理与持续集成未明确进入培养规格。',
    evidence: '岗位库原始任务 + 匹配明细第491—492行 + 职业大典第50物理页'
  },
  {
    rank: 7,
    name: '嵌入式硬件开发',
    jobIds: 'IC-L3-1304；IC-L3-1332',
    relation: '邻近相关',
    occupation: '嵌入式系统设计工程技术人员；电子元器件工程技术人员',
    occupationCode: '2-02-10-06；2-02-09-02',
    taskCount: 5,
    tasks: '硬件架构与电路设计；元器件选型；样机调试；软硬件联合调试；技术规范与设计文档',
    knowledge: '电路、模拟/数字电子、电力电子；微控制器；嵌入式系统；PCB/EMC与可靠性',
    ability: '原理图与PCB设计；器件选型；样机调试；接口联调；技术文档',
    quality: '质量与可靠性；成本意识；严谨；协作；标准化',
    requiredAnchors: 5,
    electiveAnchors: 2,
    anchors: '电路、模拟电子技术、数字电子技术、电力电子技术、微控制器综合设计与实训；嵌入式系统、单片机原理与接口技术（选修）',
    coverage: '中',
    gap: '缺少PCB设计、EMC、可靠性验证和面向量产的硬件测试规范。',
    evidence: '岗位库两条原始记录 + 匹配明细第493—496行 + 职业大典第50物理页'
  },
  {
    rank: 8,
    name: '机电工程师',
    jobIds: 'IC-L3-578；IC-L3-794',
    relation: '邻近相关',
    occupation: '机械制造工程技术人员（当前匹配表）',
    occupationCode: '2-02-07-02',
    taskCount: 5,
    tasks: '机电设备设计、安装、调试与维护；安全检查；生产技术问题与自动化改造；设备选型与供应商协同；操作培训和技术文档',
    knowledge: '机械、电气、控制与设备安全；工艺和设备全生命周期',
    ability: '设备设计装调；维护诊断；技术改造；设备评估；培训与文档',
    quality: '安全；质量；协调；责任；持续改进',
    requiredAnchors: 8,
    electiveAnchors: 1,
    anchors: '工程制图、电路、模拟/数字电子技术、电气控制与PLC、运动控制系统、金工实习、电子设计与工程实践；装备自动化工程设计（选修）',
    coverage: '中强',
    gap: '机械设计、机械装配工艺和设备全生命周期管理深度不足，适合作为邻近岗位而非核心毕业去向。',
    evidence: '岗位库两条原始记录 + 19条产业链匹配表合并岗位 + 培养方案课程表'
  }
];

const robotTasks = [
  {
    order: 1,
    task: '机器人系统安装与现场调试',
    knowledge: '电气布局/原理图、机械装配与测量、控制器/驱动器/I/O接口、系统集成流程',
    ability: '识图装配、器件选型、装配接线与上电检查、参数设置/坐标标定/现场联调',
    quality: '安全操作、遵章执行、认真严谨、精益求精',
    planAnchors: '电路；电气控制与PLC；机器人驱动与控制；PLC/驱动综合实训；机器人工程综合实训I',
    judgment: '已覆盖但需补齐现场验收和记录'
  },
  {
    order: 2,
    task: '机器人编程与离线仿真',
    knowledge: '坐标与指令、PLC/通信/运动控制、离线建模与仿真、代码版本与系统开发',
    ability: '现场程序编制、PLC/HMI/电机程序调试、仿真系统搭建与真机验证、版本管理',
    quality: '严谨验证、遵守变更规程、安全边界、持续优化',
    planAnchors: '机器人操作系统；电气控制与PLC；运动控制系统；机器人建模与仿真综合实训；C/Python（选修）',
    judgment: '课程可支撑，版本管理与软件测试偏弱'
  },
  {
    order: 3,
    task: '机器人应用系统集成与联调',
    knowledge: '需求与解决方案、工控机/网络接口、I/O和通信、稳定性/兼容性/安全测试',
    ability: '设备选型与通信方案、机械电气集成、功能组件部署、系统联调/测试/报告',
    quality: '规程、安全、接口清单与参数一致、跨专业交付责任',
    planAnchors: '工业控制网络；机器人操作系统；机器人技术基础；机器人工程综合实训I/II；毕业设计',
    judgment: '主体覆盖，端到端需求—验收链需强化'
  },
  {
    order: 4,
    task: '机器人生产线虚拟调试',
    knowledge: '数字孪生建模、离线仿真、系统架构与性能需求、兼容性和配置测试',
    ability: '模型搭建、半实物虚拟调试、仿真验证与问题修正、测试报告',
    quality: '精益求精、数据支撑、版本规程、虚实切换安全',
    planAnchors: '机器人建模与仿真综合实训；计算机仿真与虚拟仪器（选修）；数字化工厂（选修）；机器人工程综合实训II',
    judgment: '实践基础存在，但数字孪生路径依赖选修'
  },
  {
    order: 5,
    task: '机器人系统运行维护与故障诊断',
    knowledge: '机械/电控/驱动系统、传感器测试、运行数据监测、维护保养与报告规范',
    ability: '机械电气检查、零位校准/保养、参数采集与状态监测、故障维修与报告',
    quality: '爱护设备、安全停机隔离、如实记录、闭环执行',
    planAnchors: '机器人驱动与控制；运动控制系统；工业控制网络；毕业实习；制造系统智能诊断技术（选修）',
    judgment: '故障诊断课程为选修，运维实训和报告考核不足'
  }
];

const planIssues = [
  { severity: '高', location: '第14—15页', issue: 'Z01081425B 同时用于“数字信号处理”和“微控制器综合设计与实训”', impact: '课程主键冲突，课程—毕业要求—岗位任务关系会串项', action: '为其中一门课重新编制唯一代码，并同步矩阵、进程表和系统主数据' },
  { severity: '高', location: '第14—15页', issue: 'Z01081430B 同时用于“具身智能机器人”和“毕业实习”', impact: '选修课与集中实践无法区分', action: '更正课程代码并复核学分、学期和课程性质' },
  { severity: '高', location: '第14—15页', issue: 'Z01081431B 同时用于“嵌入式系统”和“机器人工程专业综合实训II”', impact: '软件方向课程与核心实训关系错误', action: '拆分代码，并重新校验课程—毕业要求矩阵' },
  { severity: '高', location: '第14—15页', issue: 'Z01081432B 同时用于“数字化工厂”和“毕业设计”', impact: '毕业出口环节可能被选修课覆盖', action: '优先修正并检查教务系统中的历史代码' },
  { severity: '中', location: '第13、18页', issue: '“物理实验”代码分别出现 X01271006B 与 X01271406B', impact: '同一课程前后不一致', action: '以教务主数据为准统一全文' },
  { severity: '中', location: '第13、19页', issue: '“科研实践”代码分别出现 X01081412B 与 N01081412B', impact: '课程归属平台和主键不确定', action: '核对课程归属后统一代码' },
  { severity: '高', location: '岗位匹配表第392行', issue: '“自动控制工程师/技术员”当前映射为电子元器件工程技术人员', impact: '职业语义与岗位任务不一致，影响职业标准引用', action: '优先复核 2-02-07-07 自动控制工程技术人员' },
  { severity: '高', location: '岗位主数据 IC-L3-1306', issue: '“工业视觉系统运维员”源字段为计算机程序设计员', impact: '无法正确调用工业视觉系统运维职业任务', action: '复核并建议校正为 6-31-07-02' }
];

const revisedGoals = [
  '培养目标1（复杂工程问题与专业基础）：毕业5年左右，能够综合运用数学、自然科学、工程基础以及机器人结构、控制、感知、软件和系统集成知识，识别、分析并解决机器人工程及相关领域的复杂工程问题。',
  '培养目标2（机器人应用系统全流程工程能力）：能够面向工业机器人、服务机器人及智能装备应用场景，承担需求分析、系统方案与器件选型、机械电气与软件集成、机器人/PLC编程、仿真与虚拟调试、现场联调、测试验收、运行维护和技术服务等工作，并在实践中持续改进系统性能与交付质量。',
  '培养目标3（创新、规范与责任）：能够跟踪机器人、智能感知、具身智能和数字化制造等技术发展，合理选择和使用现代工程工具开展设计开发与创新；在产品与系统全生命周期中遵守法律法规、技术标准、工程伦理和职业规范，统筹考虑安全、质量、经济、环境与可持续发展。',
  '培养目标4（协同、管理与发展）：具备健康身心、人文素养、国际视野和社会责任感，能够在机械、电气、控制、软件、工艺和用户等多方参与的工程项目中进行沟通协作、技术文档表达和项目管理，并通过自主学习与终身学习适应岗位和技术变化。'
];

const revisedSpecifications = [
  { id: '1', name: '工程知识', text: '能够将数学、自然科学、计算、工程基础以及机器人结构、控制、感知、软件与系统集成知识用于解决机器人工程领域复杂工程问题。', jobs: '全部岗位的知识基础' },
  { id: '2', name: '问题分析', text: '能够结合应用场景需求、系统运行数据、故障现象、技术文献和标准规范，识别并表达机器人系统在结构、控制、感知、通信与软件接口等环节的关键问题，比较可行方案并形成有效结论。', jobs: '需求分析、故障诊断、性能调优' },
  { id: '3', name: '设计/开发解决方案', text: '能够面向工业、服务及智能装备场景，完成机器人应用系统需求分析、总体方案、设备与器件选型、机械电气接口、控制与软件功能、工艺流程以及安全方案设计，并通过图纸、程序、接口清单和技术方案等形式表达。', jobs: '系统方案、设备选型、嵌入式软硬件设计' },
  { id: '4', name: '研究与试验', text: '能够针对机器人系统性能、视觉精度、运动控制、接口兼容性和运行可靠性设计试验，安全搭建测试环境，采集、分析和解释数据，形成测试、验证或故障分析结论。', jobs: '样机测试、视觉标定、系统测试、故障分析' },
  { id: '5', name: '现代工具', text: '能够选择并使用CAD/EDA、PLC与机器人编程、机器人操作系统、工业通信、机器视觉、仿真与数字孪生、数据分析和诊断工具，开展系统设计、虚拟调试、现场联调、性能测试和运行监测，并理解工具局限。', jobs: '编程仿真、视觉、嵌入式、运维' },
  { id: '6', name: '工程与可持续发展', text: '能够分析机器人产品和应用系统在全生命周期内对人员安全、数据与网络安全、环境、资源、经济和社会的影响，提出符合可持续发展要求的工程措施并承担相应责任。', jobs: '现场安装、服务机器人、系统运维' },
  { id: '7', name: '工程伦理和职业规范', text: '理解并遵守机器人相关法律法规、技术标准、质量规范和安全操作规程，具备风险识别、停机隔离、变更复核、如实记录和保护用户权益的职业责任。', jobs: '装调、运维、视觉系统、客户服务' },
  { id: '8', name: '个人和团队', text: '能够在机械、电气、控制、软件、工艺、质量和用户等多学科、多角色团队中承担成员或负责人角色，完成任务分工、接口协调、问题闭环和技术交付。', jobs: '系统集成、产品开发、技术支持' },
  { id: '9', name: '沟通与文档', text: '能够编制和使用需求说明、系统方案、工程图纸、程序与版本说明、接口清单、调试记录、测试验收报告、运维报告和用户操作文档，并与业界同行、客户及公众进行有效沟通。', jobs: '全部岗位的交付文档' },
  { id: '10', name: '项目管理', text: '能够在机器人工程项目中运用工程管理与经济决策方法，开展任务分解、进度与资源安排、成本质量控制、风险管理、供应商协同和交付验收。', jobs: '系统集成、设备选型、项目交付' },
  { id: '11', name: '终身学习', text: '能够根据机器人、智能感知、具身智能、工业软件和数字化制造等技术变化以及个人职业发展需要，持续获取新知识、评价新工具并更新工程实践能力。', jobs: '视觉算法、嵌入式、智能维护等快速变化岗位' }
];

const actions = [
  { priority: 'P0', action: '清理课程代码与岗位—职业主数据', change: '修复6处课程代码问题，并复核自动控制、工业视觉两个岗位的职业编码。', result: '保证课程、岗位、职业和证据关联主键可靠。' },
  { priority: 'P0', action: '把系统集成与现场调试设为毕业能力主线', change: '在机器人工程综合实训I/II中明确“需求—方案—选型—装配—编程—联调—测试—验收—文档”完整项目。', result: '直接支撑机器人调试和自动控制岗位。' },
  { priority: 'P1', action: '补强工业视觉应用必修内容', change: '将相机/镜头/光源选型、采像打光、视觉/手眼标定、视觉通信、精度验证和故障排除纳入必修课或限定选修+独立实训。', result: '由“懂视觉原理”提升到“能交付工业视觉系统”。' },
  { priority: 'P1', action: '建立嵌入式软硬件限定选修路径', change: 'C语言、Python、嵌入式系统、单片机接口至少形成一条必选组合，并加入版本管理、测试、软硬件联调、PCB/EMC和可靠性训练。', result: '避免关键岗位能力完全取决于自由选课。' },
  { priority: 'P1', action: '强化运行维护与故障诊断', change: '将制造系统智能诊断技术调整为限定选修或并入综合实训，增加状态采集、故障树、预防维护、参数备份与恢复。', result: '补齐机器人调试、服务机器人和视觉运维的后半链条。' },
  { priority: 'P1', action: '统一工程文档与质量评价', change: '所有综合实训统一产出需求说明、方案、图纸/接口清单、程序版本、调试记录、测试验收和运维报告，并纳入评分量规。', result: '把培养规格9、7、10转化为可评价证据。' },
  { priority: 'P2', action: '形成企业复核闭环', change: '用3—5家机器人/自动化企业的岗位说明书复核任务与K/A/Q，关系表逐条记录文件、页码、原文和审核状态。', result: '将当前标准候选升级为企业可用的岗位能力模型。' }
];

const sources = [
  {
    id: 'src_plan',
    label: '河南工业大学机器人工程专业人才培养方案（19页PDF）',
    href: 'https://cee.haut.edu.cn/info/1014/10971.htm',
    query: {
      description: '逐页读取培养目标、毕业要求、课程—毕业要求矩阵、核心课程、教学进程和集中实践环节。',
      language: 'document review',
      executed_at: '2026-08-20',
      tables_used: ['培养目标（第1—2页）', '毕业要求（第2—5页）', '课程与毕业要求矩阵（第7—9页）', '教学进程计划表（第11—19页）'],
      filters: ['仅使用机器人工程专业方案正文', '课程锚点仅计能在方案中直接定位的命名课程或实践环节'],
      metric_definitions: ['必修锚点数=对指定岗位任务有直接内容支撑且课程性质为必修的命名课程/实践数量', '选修锚点数=对指定岗位任务有直接内容支撑且课程性质为选修的命名课程数量；两者均不是匹配度']
    }
  },
  {
    id: 'src_jobs',
    label: '本地岗位库岗位画像快照',
    path: 'job_profile_excerpt.json',
    query: {
      description: '从岗位画像快照中按8个岗位名称抽取11条原始岗位记录，保留岗位编号、工作概述和岗位职责，并按岗位名称归并重复记录。',
      language: 'JSON filter',
      executed_at: '2026-08-20',
      tables_used: ['position_profile/source_rows.json'],
      filters: ['岗位名称属于本次机器人工程培养方案分析的8个候选岗位', '重复岗位按岗位名称归并但保留全部岗位编号'],
      metric_definitions: ['相关岗位数=归并后的不同岗位名称数', '原始岗位记录数=岗位画像快照中命中的未归并记录数']
    }
  },
  {
    id: 'src_match',
    label: '19条产业链岗位—职业匹配表',
    path: 'job_occupation_excerpt.json',
    query: {
      description: '使用主表和不合并明细核验岗位编号、产业链位置、职业名称、职业编码和匹配依据。',
      language: 'XLSX review',
      executed_at: '2026-08-20',
      tables_used: ['岗位-职业匹配表', '匹配明细（不合并）', '职业字典（本表使用）'],
      filters: ['机器人、自动控制、机器视觉、嵌入式和机电相关岗位'],
      metric_definitions: ['直接相关=岗位典型任务与培养方案专业定位及必修课程/实践主线直接对应', '邻近相关=培养方案具备支撑基础但关键岗位能力依赖选修或专业深度不足']
    }
  },
  {
    id: 'src_catalog',
    label: '中华人民共和国职业分类大典（2022年版）',
    href: 'https://www.osta.org.cn/career',
    query: {
      description: '核验机器人工程技术人员、服务机器人应用技术员、自动控制工程技术人员、嵌入式系统设计工程技术人员、工业机器人系统运维员和工业视觉系统运维员的职业边界与主要工作任务。',
      language: 'PDF review',
      executed_at: '2026-08-20',
      tables_used: ['第42、50、96、217、562—563物理页'],
      filters: ['仅引用职业定义和主要工作任务'],
      metric_definitions: []
    }
  },
  {
    id: 'src_standard',
    label: '机器人工程技术人员国家职业标准及机器人类专业教学标准',
    path: 'standard_evidence_excerpt.json',
    query: {
      description: '从职业功能、工作内容、技能要求、相关知识、职业守则和专业教学标准的典型工作任务/教学要求中拆解机器人调试岗位的K/A/Q候选。',
      language: 'document mapping',
      executed_at: '2026-08-20',
      tables_used: ['机器人工程技术人员国家职业标准第7、12、14—18页', '260304_机器人技术第4—6页', '460304_智能机器人技术第4—6页', '460305_工业机器人技术第4—6页'],
      filters: ['不得用教学标准覆盖职业标准原始要求', 'K/A/Q为多源归并候选并保留企业复核状态'],
      metric_definitions: []
    }
  },
  {
    id: 'src_analysis',
    label: '本次培养方案—岗位任务规则化分析',
    path: 'analysis_data.json',
    query: {
      description: '以岗位为单位，把岗位任务与培养方案课程/实践锚点进行人工可解释映射；不计算匹配百分比。',
      language: 'rule-based review',
      executed_at: '2026-08-20',
      tables_used: ['岗位画像快照', '岗位—职业匹配表', '培养方案', '职业大典', '职业标准/教学标准'],
      filters: ['直接相关与邻近相关仅表示证据层级', '企业原始岗位说明书缺失的任务与K/A/Q均标为候选'],
      metric_definitions: ['关系层级依据=岗位任务与培养定位、必修课程/实践、官方职业任务的共同支撑情况', '课程锚点数是可定位证据数量，不是能力达成度或匹配度']
    }
  }
];

// Portable artifact validation treats a source with a `query` object as a SQL-backed
// source. These inputs are files/documents, so the reader source objects expose only
// safe relative paths or official URLs. Full review metadata remains in analysis_data.json.
const portableSources = sources.map(({ query: _query, ...source }) => source);

const evidenceHtml = `
  <section style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#17304f;padding:8px">
    <h2 style="font-size:24px;margin:0 0 8px">真实培养方案截图</h2>
    <p style="margin:0 0 18px;color:#5f7088">以下由河南工业大学机器人工程专业人才培养方案PDF第1、14、15页直接渲染，不是示意图。</p>
    ${[
      ['plan-p1.jpg', '第1页：专业定位与培养目标'],
      ['plan-p14.jpg', '第14页：专业必修与选修课程'],
      ['plan-p15.jpg', '第15页：专业集中实践环节']
    ].map(([file, caption]) => `<figure style="margin:0 0 18px"><img src="${imageDataUri(file)}" alt="${caption}" style="display:block;max-width:100%;height:auto;margin:auto"/><figcaption style="margin-top:8px;text-align:center;color:#5f7088">${caption}</figcaption></figure>`).join('')}
  </section>`;

const headline = [{ related_jobs: 8, direct_jobs: 4, adjacent_jobs: 4, code_issues: 6 }];

const jobAnchorRows = jobs.map((job) => ({
  岗位: job.name,
  必修锚点: job.requiredAnchors,
  选修锚点: job.electiveAnchors,
  关系层级: job.relation,
  覆盖判断: job.coverage,
  任务数: job.taskCount,
  岗位编号: job.jobIds,
  关联职业: job.occupation,
  主要缺口: job.gap
}));

const jobRows = jobs.map((job) => ({
  序号: job.rank,
  岗位名称: job.name,
  岗位编号: job.jobIds,
  关系层级: job.relation,
  关联职业: `${job.occupation}（${job.occupationCode}）`,
  典型工作任务: job.tasks,
  知识K: job.knowledge,
  能力A: job.ability,
  素养Q: job.quality,
  课程实践锚点: job.anchors,
  覆盖判断: job.coverage,
  主要缺口: job.gap,
  证据说明: job.evidence
}));

const robotTaskRows = robotTasks.map((row) => ({
  序号: row.order,
  典型工作任务: row.task,
  知识K: row.knowledge,
  能力A: row.ability,
  素养Q: row.quality,
  培养方案锚点: row.planAnchors,
  判断: row.judgment
}));

const planIssueRows = planIssues.map((row, index) => ({
  严重度序: index + 1,
  严重度: row.severity,
  定位: row.location,
  问题: row.issue,
  影响: row.impact,
  建议动作: row.action
}));

const specificationRows = revisedSpecifications.map((row) => ({
  序号: Number(row.id),
  名称: row.name,
  建议文本: row.text,
  主要支撑岗位任务: row.jobs
}));

const actionRows = actions.map((row) => ({
  优先级: row.priority,
  动作: row.action,
  具体调整: row.change,
  预期结果: row.result
}));

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function valuesSql(rows, columns, alias) {
  const tuples = rows.map((row) => `  (${columns.map((column) => sqlLiteral(row[column])).join(', ')})`).join(',\n');
  const identifiers = columns.map((column) => `"${column.replaceAll('"', '""')}"`).join(', ');
  return `SELECT *\nFROM (VALUES\n${tuples}\n) AS ${alias}(${identifiers});`;
}

function datasetSource(id, label, rows, columns, description, metricDefinitions = []) {
  return {
    id,
    label,
    query: {
      engine: 'DuckDB',
      language: 'sql',
      executed_at: '2026-08-20',
      description,
      sql: valuesSql(rows, columns, id.replaceAll('-', '_')),
      tables_used: [],
      filters: ['本次培养方案—岗位任务人工可解释分析快照'],
      metric_definitions: metricDefinitions
    }
  };
}

const headlineSource = datasetSource('query-headline', '岗位关系汇总', headline, ['related_jobs', 'direct_jobs', 'adjacent_jobs', 'code_issues'], '对归并后的岗位关系和培养方案代码问题进行汇总。', [
  'related_jobs=归并后的不同岗位名称数',
  'direct_jobs=与专业定位及必修课程/实践主线直接对应的岗位数',
  'adjacent_jobs=关键能力依赖选修或专业深度不足的岗位数',
  'code_issues=培养方案课程代码复用或前后不一致项数'
]);
const anchorSource = datasetSource('query-job-anchors', '岗位课程与实践锚点', jobAnchorRows, Object.keys(jobAnchorRows[0]), '逐岗位列出可在培养方案中直接定位的必修和选修课程/实践锚点。', [
  '必修锚点=直接支撑岗位任务且课程性质为必修的命名课程或实践数量',
  '选修锚点=直接支撑岗位任务且课程性质为选修的命名课程数量；不是匹配度'
]);
const jobsSource = datasetSource('query-jobs', '岗位任务与K/A/Q明细', jobRows, Object.keys(jobRows[0]), '归并岗位库任务、岗位—职业关系、职业文件和培养方案锚点。');
const robotTasksSource = datasetSource('query-robot-tasks', '机器人调试任务能力证据链', robotTaskRows, Object.keys(robotTaskRows[0]), '对机器人调试工程师五项典型任务拆解知识、能力、素养和培养方案锚点。');
const issuesSource = datasetSource('query-plan-issues', '培养方案与岗位映射质量问题', planIssueRows, Object.keys(planIssueRows[0]), '汇总课程代码复用、前后不一致和岗位职业编码冲突。');
const specificationsSource = datasetSource('query-specifications', '培养规格修订稿', specificationRows, Object.keys(specificationRows[0]), '在保留11项毕业要求框架的前提下写入岗位任务和工程交付要求。');
const actionsSource = datasetSource('query-actions', '培养方案修订动作', actionRows, Object.keys(actionRows[0]), '把培养目标和培养规格修订落实到课程、实训、评价和企业复核。');

const manifest = {
  version: 1,
  surface: 'report',
  title: '机器人工程本科培养方案与岗位任务能力关系分析',
  description: '基于河南工业大学机器人工程专业人才培养方案、本地岗位库、岗位—职业匹配表、职业大典和职业标准的可追溯分析。',
  generatedAt: new Date().toISOString(),
  sources: portableSources,
  cards: [
    { id: 'card_jobs', dataset: 'headline', source: headlineSource, description: '归并岗位库重复记录后的不同岗位名称数。', metrics: [{ label: '相关岗位', field: 'related_jobs', format: 'number' }] },
    { id: 'card_direct', dataset: 'headline', source: headlineSource, description: '岗位任务与专业定位及必修课程/实践主线直接对应。', metrics: [{ label: '直接相关', field: 'direct_jobs', format: 'number' }] },
    { id: 'card_adjacent', dataset: 'headline', source: headlineSource, description: '具备支撑基础，但关键能力依赖选修或深度不足。', metrics: [{ label: '邻近相关', field: 'adjacent_jobs', format: 'number' }] },
    { id: 'card_issues', dataset: 'headline', source: headlineSource, description: '培养方案中需先修复的课程代码复用或前后不一致项。', metrics: [{ label: '课程代码问题', field: 'code_issues', format: 'number' }] }
  ],
  charts: [
    {
      id: 'chart_job_anchors',
      title: '各岗位可直接定位的课程与实践锚点数',
      subtitle: '必修与选修分开计数；用于展示证据结构，不代表岗位匹配度或能力达成度。',
      type: 'horizontalStackedBar',
      intent: 'composition',
      question: '每个相关岗位的课程与实践证据由多少必修和选修锚点构成？',
      rationale: '堆叠横向条形图可同时比较岗位间证据数量和必修/选修构成，长岗位名称也易于阅读。',
      dataset: 'job_anchors',
      source: anchorSource,
      encodings: {
        x: { field: '岗位', type: 'nominal', label: '岗位' },
        y: { fields: ['必修锚点', '选修锚点'], type: 'quantitative', label: '命名课程/实践数量' },
        tooltip: [
          { field: '关系层级', type: 'text', label: '关系层级' },
          { field: '覆盖判断', type: 'text', label: '覆盖判断' },
          { field: '任务数', type: 'quantitative', label: '任务数' }
        ]
      },
      valueFormat: 'number',
      layout: '12'
    }
  ],
  tables: [
    {
      id: 'table_jobs', title: '相关岗位、典型工作任务与K/A/Q', subtitle: '岗位任务优先采用岗位库原始职责；K/A/Q为职业文件和培养方案归并候选，企业原文缺失处需复核。', dataset: 'jobs', source: jobsSource, layout: '12', density: 'compact', defaultSort: { field: '序号', direction: 'asc' },
      columns: [
        { field: '序号', label: '序号', type: 'number' }, { field: '岗位名称', label: '岗位' }, { field: '岗位编号', label: '岗位编号' }, { field: '关系层级', label: '关系' },
        { field: '关联职业', label: '关联职业' }, { field: '典型工作任务', label: '典型工作任务' }, { field: '知识K', label: '知识K' }, { field: '能力A', label: '能力A' }, { field: '素养Q', label: '素养Q' },
        { field: '课程实践锚点', label: '培养方案锚点' }, { field: '覆盖判断', label: '覆盖' }, { field: '主要缺口', label: '主要缺口' }
      ]
    },
    {
      id: 'table_robot_tasks', title: '机器人调试工程师任务—能力—课程证据链', subtitle: '五项任务来自岗位库与职业大典/职业标准/教学标准多源归并，不把教学标准误当企业招聘原文。', dataset: 'robot_tasks', source: robotTasksSource, layout: '12', density: 'compact', defaultSort: { field: '序号', direction: 'asc' },
      columns: [
        { field: '序号', label: '序号', type: 'number' }, { field: '典型工作任务', label: '典型工作任务' }, { field: '知识K', label: '知识K' }, { field: '能力A', label: '能力A' }, { field: '素养Q', label: '素养Q' }, { field: '培养方案锚点', label: '课程/实践锚点' }, { field: '判断', label: '判断' }
      ]
    },
    {
      id: 'table_plan_issues', title: '修订前置的数据质量问题', subtitle: '先解决主键和职业编码冲突，再进入课程—岗位关系落库。', dataset: 'plan_issues', source: issuesSource, layout: '12', density: 'compact', defaultSort: { field: '严重度序', direction: 'asc' },
      columns: [
        { field: '严重度序', label: '序', type: 'number' }, { field: '严重度', label: '严重度' }, { field: '定位', label: '定位' }, { field: '问题', label: '问题' }, { field: '影响', label: '影响' }, { field: '建议动作', label: '建议动作' }
      ]
    },
    {
      id: 'table_specs', title: '建议修订的培养规格（以11项毕业要求表述）', subtitle: '保留工程教育认证常用的11项框架，重点把岗位任务、工程交付和可评价证据写进去。', dataset: 'specifications', source: specificationsSource, layout: '12', density: 'compact', defaultSort: { field: '序号', direction: 'asc' },
      columns: [
        { field: '序号', label: '序号', type: 'number' }, { field: '名称', label: '培养规格' }, { field: '建议文本', label: '可直接使用的建议文本' }, { field: '主要支撑岗位任务', label: '主要支撑岗位任务' }
      ]
    },
    {
      id: 'table_actions', title: '课程与实施层修订动作', subtitle: '优先级P0为落库和修订前置项，P1为本轮培养方案应完成项，P2为企业证据闭环。', dataset: 'actions', source: actionsSource, layout: '12', density: 'compact', defaultSort: { field: '优先级', direction: 'asc' },
      columns: [
        { field: '优先级', label: '优先级' }, { field: '动作', label: '修订动作' }, { field: '具体调整', label: '具体调整' }, { field: '预期结果', label: '预期结果' }
      ]
    }
  ],
  blocks: [
    { id: 'title', type: 'markdown', body: '# 机器人工程本科培养方案与岗位任务能力关系分析', layout: '12' },
    { id: 'summary', type: 'markdown', body: `## 执行摘要\n\n- 本次从本地岗位库的11条原始记录中归并出8个与机器人工程本科培养方案有证据关系的岗位：4个直接相关、4个邻近相关。\n- 现有方案对“控制—PLC—运动控制—机器人驱动—综合实训”主线支撑较强，机器人调试工程师和自动控制工程师/技术员是最清晰的技术出口。\n- 服务机器人、工业视觉运维有专业基础，但场景需求、人机交互安全、工业视觉选型/标定和运维闭环不足。机器视觉、嵌入式软硬件主要依赖选修，不能保证所有毕业生形成岗位能力。\n- 不建议推翻现有4项培养目标和11项毕业要求框架；建议把“需求—方案—选型—装配—编程—仿真—联调—测试—验收—运维—文档”写入培养目标2及毕业要求3、5、7、9、10。\n- 修订前必须先修复培养方案中的课程代码冲突和两个岗位的职业编码问题，否则课程—岗位—职业关系落库会串项。`, layout: '12' },
    { id: 'metrics', type: 'metric-strip', cardIds: ['card_jobs', 'card_direct', 'card_adjacent', 'card_issues'], layout: '12' },
    { id: 'method', type: 'markdown', body: `## 判断口径与证据边界\n\n**直接相关**：岗位典型任务与专业定位相符，且能在必修课程或集中实践中找到连续支撑。**邻近相关**：具备基础，但关键能力依赖选修或专业深度不足。\n\n本报告不计算匹配百分比。岗位库中的工作职责作为岗位任务起点；岗位—职业关系以校正表为准；职业边界和主要任务使用职业大典/职业标准；K/A/Q由任务、职业要求和培养方案拆解后形成候选。没有企业岗位说明书原文的部分均保留“需企业复核”边界。`, layout: '12' },
    { id: 'anchor_heading', type: 'markdown', body: '## 岗位的课程与实践证据结构\n\n图中只统计能在培养方案中直接点名定位的课程和实践环节，目的是判断“支撑来自必修还是选修”，不是岗位匹配分数。', layout: '12' },
    { id: 'anchor_chart', type: 'chart', chartId: 'chart_job_anchors', layout: '12' },
    { id: 'jobs_heading', type: 'markdown', body: '## 相关岗位、典型工作任务与能力项\n\n建议将机器人调试、服务机器人应用、自动控制、工业视觉运维作为专业培养的核心岗位方向；将机器视觉、嵌入式软硬件和机电工程作为可通过模块化选修形成的拓展岗位方向。', layout: '12' },
    { id: 'jobs_table', type: 'table', tableId: 'table_jobs', layout: '12' },
    { id: 'robot_heading', type: 'markdown', body: '## 核心岗位样例：机器人调试工程师全链条\n\n该岗位在库中有两条源记录，并已通过关系表连接到“机器人工程技术人员”和“工业机器人系统运维员”。五项任务同时保留职业大典、职业标准和教学标准证据，适合作为本轮培养方案修订的主岗位样例。', layout: '12' },
    { id: 'robot_table', type: 'table', tableId: 'table_robot_tasks', layout: '12' },
    { id: 'plan_screenshots', type: 'html', body: evidenceHtml, layout: '12' },
    { id: 'quality_heading', type: 'markdown', body: '## 修订前置：先修复课程代码和职业映射\n\n这些问题不是文字润色，而是主键与口径问题。若不先处理，课程—毕业要求—岗位任务—职业标准的关系会在系统中出现错误连接。', layout: '12' },
    { id: 'quality_table', type: 'table', tableId: 'table_plan_issues', layout: '12' },
    { id: 'assessment', type: 'markdown', body: `## 现有培养目标与培养规格的判断\n\n### 已有优势\n\n- 培养目标已覆盖复杂工程问题、工程创新、职业伦理、团队协作、项目管理和终身学习，11项毕业要求框架完整。\n- 必修课程已形成自动控制、PLC、运动控制、驱动控制、工业网络、机器人操作系统和综合实训的工程主线。\n- 实践教学占总学分33.4%，具有把岗位任务嵌入课程项目的结构条件。\n\n### 需要修订的关键点\n\n- 培养目标2仍停留在“设计、开发、生产和维护”概括表达，未写清系统集成、现场调试、测试验收、运行维护和技术服务的完整链条。\n- 毕业要求3和5强调方案与工具，但未明确器件选型、接口集成、PLC/机器人编程、视觉标定、虚拟调试、现场联调及验收文档。\n- 毕业要求7、9、10尚未把安全停机隔离、变更复核、调试/运维记录、接口清单、测试验收和项目交付转化为可评价成果。\n- 机器视觉与嵌入式岗位所需的核心课程主要是选修，专业不能据此宣称所有毕业生都具备相应岗位胜任力。`, layout: '12' },
    { id: 'goals', type: 'markdown', body: `## 建议修订后的培养目标（可直接使用）\n\n${revisedGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n\n')}`, layout: '12' },
    { id: 'spec_heading', type: 'markdown', body: '## 建议修订后的培养规格\n\n为保持原方案和工程教育认证口径连续，建议保留11项毕业要求名称，重写其专业化内涵，并在下一步继续拆成可观测的指标点和课程考核证据。', layout: '12' },
    { id: 'spec_table', type: 'table', tableId: 'table_specs', layout: '12' },
    { id: 'actions_heading', type: 'markdown', body: '## 从文本修订落到课程与考核\n\n培养目标和培养规格只有与课程模块、综合项目、成果物和评价量规联动才可落地。建议按下表推进。', layout: '12' },
    { id: 'actions_table', type: 'table', tableId: 'table_actions', layout: '12' },
    { id: 'sources_note', type: 'markdown', body: `## 来源与复核说明\n\n- 培养方案：河南工业大学机器人工程专业人才培养方案，19页PDF，重点使用第1—5、7—9、14—16页。\n- 岗位：本地岗位库岗位画像快照；同名记录按岗位名称归并并保留岗位编号。\n- 岗位—职业：19条产业链岗位—职业匹配表，重点使用主表第392、532—537行及明细第491—496、693—700行。\n- 职业任务：中华人民共和国职业分类大典（2022年版）第42、50、96、217、562—563物理页。\n- 机器人调试K/A/Q：机器人工程技术人员国家职业标准及260304、460304、460305三份机器人类专业教学标准。\n\n**复核边界**：岗位库当前缺少企业岗位说明书原文和结构化任务—能力关系表，因此除岗位库原始职责外，其余K/A/Q均是标准证据支持的培养候选，进入正式培养方案前应由专业教师和企业专家联合复核。`, layout: '12' }
  ]
};

const snapshot = {
  version: 1,
  status: 'ready',
  generatedAt: new Date().toISOString(),
  datasets: {
    headline,
    job_anchors: jobAnchorRows,
    jobs: jobRows,
    robot_tasks: robotTaskRows,
    plan_issues: planIssueRows,
    specifications: specificationRows,
    actions: actionRows
  }
};

const artifact = {
  surface: 'report',
  manifest,
  snapshot,
  sources: portableSources,
  package_info: {
    title: manifest.title,
    snapshot_note: '2026-08-20本地文件分析快照；不连接实时岗位或教务系统。'
  }
};

const analysisData = {
  generatedAt: snapshot.generatedAt,
  scope: {
    program: '河南工业大学机器人工程专业人才培养方案',
    rawJobRecords: 11,
    distinctJobs: jobs.length,
    directJobs: jobs.filter((job) => job.relation === '直接相关').length,
    adjacentJobs: jobs.filter((job) => job.relation === '邻近相关').length,
    rule: '只分直接相关/邻近相关，不计算匹配百分比；课程锚点数不是能力达成度。'
  },
  jobs,
  robotTasks,
  planIssues,
  revisedGoals,
  revisedSpecifications,
  actions,
  sources
};

writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
writeFileSync(analysisPath, `${JSON.stringify(analysisData, null, 2)}\n`, 'utf8');
writeFileSync(resolve(outputDir, 'job_profile_excerpt.json'), `${JSON.stringify({
  source: 'outputs/019f7e5b-0d35-7c91-a1ff-e290f4069b8a/source_rows.json',
  selected_record_count: 11,
  selected_jobs: jobs.map((job) => ({ job_name: job.name, job_ids: job.jobIds, raw_tasks: job.tasks }))
}, null, 2)}\n`, 'utf8');
writeFileSync(resolve(outputDir, 'job_occupation_excerpt.json'), `${JSON.stringify({
  source: '19条产业链岗位与职业匹配表.xlsx',
  row_references: ['岗位-职业匹配表!392', '岗位-职业匹配表!532:537', '匹配明细（不合并）!491:496', '匹配明细（不合并）!693:700'],
  selected_jobs: jobs.map((job) => ({ job_name: job.name, job_ids: job.jobIds, occupation: job.occupation, occupation_code: job.occupationCode }))
}, null, 2)}\n`, 'utf8');
writeFileSync(resolve(outputDir, 'standard_evidence_excerpt.json'), `${JSON.stringify({
  sources: ['中华人民共和国职业分类大典（2022年版）', '机器人工程技术人员国家职业标准', '260304_机器人技术', '460304_智能机器人技术', '460305_工业机器人技术'],
  robot_debug_tasks: robotTasks,
  evidence_rule: '职业边界和任务优先使用职业大典/职业标准；教学标准只用于补充培养要求；K/A/Q为需企业复核的候选。'
}, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ artifactPath, analysisPath, jobs: jobs.length, blocks: manifest.blocks.length }, null, 2));
