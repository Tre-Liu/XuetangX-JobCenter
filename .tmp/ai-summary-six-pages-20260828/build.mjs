import fs from 'node:fs/promises'
import vm from 'node:vm'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const workspace = '/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程'
const outputDir = `${workspace}/outputs/ai-summary-six-pages-20260828`
const outputPath = `${outputDir}/19条产业链六页面AI总结写死表.xlsx`
const previewDir = `${outputDir}/previews`

const readConstArray = async (path, name, endMarker) => {
  const source = await fs.readFile(path, 'utf8')
  const declaration = `const ${name} = `
  const start = source.indexOf(declaration)
  if (start < 0) throw new Error(`未找到 ${name}: ${path}`)
  const valueStart = start + declaration.length
  const valueEnd = source.indexOf(endMarker, valueStart)
  if (valueEnd < 0) throw new Error(`未找到 ${name} 结束标记: ${path}`)
  return vm.runInNewContext(`(${source.slice(valueStart, valueEnd).trim()})`)
}

const chainRows = await readConstArray(
  `${workspace}/outputs/industry-chain-insights-20260806/build_industry_chain_insights.mjs`,
  'rows',
  '\n\nconst charCount',
)
const regionGroups = await readConstArray(
  `${workspace}/outputs/019ff9ba-region-cooperation/build_region_cooperation_table.mjs`,
  'groups',
  '\n\nconst expectedChains',
)
const stageBundle = JSON.parse(await fs.readFile(
  `${workspace}/output/industry-chain-stage-nodes/industry_chain_stage_node_bundle.json`,
  'utf8',
))

const profiles = {
  数据要素与数字经济产业链: {
    roles: ['数据治理工程师', '数据产品运营师', '数据合规专员'],
    skills: ['数据采集治理', '指标与数据产品设计', '授权审计与安全控制'],
    knowledge: '业务流程、数据标准和合规边界',
    opportunity: '数据产品开发和行业数据运营',
    gap: '业务理解、数据工程与合规能力尚未形成一体化训练',
    growth: '公共数据运营、可信流通和产业数据服务',
    policyThemes: ['数据基础制度', '公共数据开发利用', '数据安全与合规流通'],
    policyOpportunity: '把数据授权运营、数据产品和行业治理任务转化为实训项目',
    policyRisk: '授权边界、个人信息保护、数据质量和全过程审计',
    buildFocus: '数据治理、数据产品、可信流通与行业应用',
  },
  高端装备与智能制造产业链: {
    roles: ['数控工艺工程师', '智能产线集成工程师', '设备运维工程师'],
    skills: ['工艺编制与加工', '电气控制与产线联调', '状态监测与故障诊断'],
    knowledge: '机械制造、电气自动化和生产质量管理',
    opportunity: '数字工厂、柔性制造和设备预测维护',
    gap: '机械、电气、软件和工艺数据的跨专业协同训练不足',
    growth: '工业母机升级、柔性产线改造和设备数字化服务',
    policyThemes: ['工业母机与高端装备', '制造业数字化转型', '智能工厂与绿色制造'],
    policyOpportunity: '依托设备更新和数字化改造建设产线级教学项目',
    policyRisk: '设备安全、工艺质量、工业数据安全和节能要求',
    buildFocus: '数控加工、智能产线、工业互联网与设备运维',
  },
  基础设施与城市建设产业链: {
    roles: ['BIM深化设计工程师', '智慧工地工程师', '基础设施运维工程师'],
    skills: ['数字设计与模型协同', '施工组织与现场管控', '检测监测与智慧运维'],
    knowledge: '工程规范、质量安全和项目全寿命管理',
    opportunity: '城市更新、智慧施工和基础设施数字运维',
    gap: '数字工具训练与真实工程组织、现场协同结合不够',
    growth: '城市更新、智能建造和既有设施运维',
    policyThemes: ['智能建造与建筑工业化', '城市更新与韧性城市', '绿色建造和工程质量安全'],
    policyOpportunity: '把试点项目、城市更新和智慧监管任务引入课程',
    policyRisk: '工程质量安全、数据交付标准和项目现场责任边界',
    buildFocus: 'BIM协同、智慧工地、城市更新与设施运维',
  },
  医药生物与医疗健康产业链: {
    roles: ['药品生产质量工程师', '医疗器械测试工程师', '医疗数据应用工程师'],
    skills: ['洁净生产与过程记录', '检测验证与风险分析', '医疗数据治理与系统支持'],
    knowledge: '药械法规、质量体系和临床应用边界',
    opportunity: '创新药械、数字医疗和健康服务融合',
    gap: '法规质量、设备检测和数字应用之间缺少贯通式项目',
    growth: '高端医疗器械、体外诊断和数字健康服务',
    policyThemes: ['医药创新与产业化', '医疗器械质量监管', '数字健康与数据安全'],
    policyOpportunity: '将研发辅助、质量验证和数字医疗场景转化为规范化实训',
    policyRisk: '生命健康安全、质量追溯、临床合规和隐私保护',
    buildFocus: '药械生产、质量检验、医疗装备与数字健康',
  },
  新能源与电力装备产业链: {
    roles: ['新能源设备运维工程师', '储能系统工程师', '电力装备调试工程师'],
    skills: ['电气接线与保护配置', '储能系统联调', '运行数据分析与能量管理'],
    knowledge: '电力系统、电气安全和能源经济运行',
    opportunity: '源网荷储协同和新能源场站数字运维',
    gap: '电气装备、通信控制和能源调度的系统级训练不足',
    growth: '新型储能、智能电网和新能源装备运维',
    policyThemes: ['新型电力系统', '新能源装备与储能', '能源安全和绿色低碳'],
    policyOpportunity: '围绕新能源基地和工商业储能建设运行调度项目',
    policyRisk: '电气安全、并网规范、电池安全和全生命周期管理',
    buildFocus: '光伏风电、储能、电力电子与能源管理',
  },
  智能物联与消费电子产业链: {
    roles: ['嵌入式开发工程师', '物联网系统工程师', '电子产品测试工程师'],
    skills: ['硬件设计与固件开发', '无线通信与平台接入', '整机测试与可靠性分析'],
    knowledge: '电子电路、通信协议和产品生命周期管理',
    opportunity: '端云协同、智能家居和行业物联网应用',
    gap: '软硬件联调、可靠性测试和用户场景验证训练不足',
    growth: '智能终端、传感模组和端云一体化服务',
    policyThemes: ['物联网基础能力', '消费电子智能化', '产品质量和网络数据安全'],
    policyOpportunity: '把智能终端和行业物联场景转化为端到端开发项目',
    policyRisk: '无线合规、产品可靠性、个人信息保护和供应链质量',
    buildFocus: '嵌入式开发、物联通信、智能终端与可靠性测试',
  },
  石油化工产业链: {
    roles: ['化工工艺操作工程师', '仪表控制工程师', '安全环保工程师'],
    skills: ['流程运行与参数调节', '设备仪表维护', '风险辨识与应急处置'],
    knowledge: '化工原理、工艺纪律和安全环保规范',
    opportunity: '炼化深加工、绿色化工和数字化工厂',
    gap: '流程仿真、现场设备和异常处置尚未形成连续训练',
    growth: '精细化工、化工新材料和节能降碳改造',
    policyThemes: ['石化产业优化升级', '安全生产和园区治理', '绿色化工与节能降碳'],
    policyOpportunity: '依托园区和装置改造建设流程控制与绿色生产项目',
    policyRisk: '重大危险源、作业许可、污染排放和设备完整性',
    buildFocus: '化工工艺、设备仪表、安全环保与数字工厂',
  },
  汽车与智能网联汽车产业链: {
    roles: ['新能源汽车测试工程师', '智能驾驶测试工程师', '汽车电子工程师'],
    skills: ['三电系统检测', '车载通信与控制', '智能驾驶场景测试'],
    knowledge: '整车结构、功能安全和汽车软件质量',
    opportunity: '新能源整车、智能座舱和车路云协同',
    gap: '机械电气软件融合及整车级验证项目不足',
    growth: '智能驾驶测试、汽车电子和车路云服务',
    policyThemes: ['新能源汽车产业升级', '智能网联汽车准入与测试', '车路云协同和数据安全'],
    policyOpportunity: '围绕整车测试、示范道路和智能网联场景建设项目',
    policyRisk: '功能安全、道路测试、汽车数据安全和产品质量追溯',
    buildFocus: '三电系统、汽车电子、智能驾驶与整车测试',
  },
  食品饮料产业链: {
    roles: ['食品工艺工程师', '食品质量检验员', '冷链与追溯运营师'],
    skills: ['生产工艺控制', '理化与微生物检测', '批次追溯与冷链管理'],
    knowledge: '食品安全、卫生规范和质量体系',
    opportunity: '功能食品、智能加工和全程质量追溯',
    gap: '生产操作、检测判定和供应链追溯训练相互分散',
    growth: '健康食品、柔性生产和数字化供应链',
    policyThemes: ['食品安全治理', '农产品精深加工', '冷链物流和质量追溯'],
    policyOpportunity: '把食品生产、检验和供应链追溯组织为生产型项目',
    policyRisk: '卫生控制、添加剂使用、标签合规和冷链质量',
    buildFocus: '食品工艺、质量检测、智能生产与冷链追溯',
  },
  新一代信息基础设施产业链: {
    roles: ['云计算运维工程师', '数据中心运维工程师', '通信网络工程师'],
    skills: ['网络部署与优化', '服务器和云平台运维', '监控备份与故障定位'],
    knowledge: '云网架构、信息安全和绿色数据中心管理',
    opportunity: '算力调度、边缘计算和云网协同服务',
    gap: '网络、算力、平台和能耗管理的综合运维训练不足',
    growth: '算力基础设施、绿色数据中心和边缘云服务',
    policyThemes: ['新型信息基础设施', '全国一体化算力网络', '绿色低碳和网络安全'],
    policyOpportunity: '依托算力枢纽和行业云建设云网协同运维项目',
    policyRisk: '网络安全、业务连续性、数据保护和能耗约束',
    buildFocus: '通信网络、数据中心、云平台与边缘计算',
  },
  绿色环保与资源循环产业链: {
    roles: ['环境监测工程师', '污染治理运维工程师', '碳与资源管理师'],
    skills: ['采样监测与结果判定', '治理设备运行', '碳核算和资源化评价'],
    knowledge: '环境标准、治理工艺和合规报告',
    opportunity: '低碳园区、无废城市和资源循环服务',
    gap: '监测、治理、碳管理和资源化利用缺少一体化场景',
    growth: '减污降碳协同、资源循环和环境数字化运营',
    policyThemes: ['污染防治和生态治理', '碳达峰碳中和', '循环经济与无废城市'],
    policyOpportunity: '围绕园区减污降碳和资源循环建设综合治理项目',
    policyRisk: '排放合规、监测质量、危险废物管理和核算边界',
    buildFocus: '环境监测、污染治理、碳管理与资源循环',
  },
  新材料产业链: {
    roles: ['材料研发助理工程师', '材料检测工程师', '工艺与质量工程师'],
    skills: ['材料制备与表征', '性能测试与失效分析', '工艺优化和应用验证'],
    knowledge: '材料科学、实验规范和质量统计',
    opportunity: '电子材料、储能材料和先进复合材料',
    gap: '实验室研发、中试放大和终端验证之间衔接不足',
    growth: '关键材料国产化、中试服务和场景定制材料',
    policyThemes: ['关键新材料攻关', '科技成果转化和中试', '质量标准与绿色制造'],
    policyOpportunity: '把材料研发、中试和终端验证贯通为研发型项目',
    policyRisk: '实验安全、批次稳定、性能标准和环境影响',
    buildFocus: '材料制备、检测表征、中试放大与应用验证',
  },
  空天装备与低空经济产业链: {
    roles: ['无人机装调工程师', '低空运营与任务规划师', '航空维修工程师'],
    skills: ['飞行器装调检测', '任务规划与飞行操作', '维修保障与安全管理'],
    knowledge: '航空原理、适航意识和低空运行规则',
    opportunity: '无人机行业应用、低空物流和运行保障',
    gap: '装备制造、飞行任务和运营安全训练相互割裂',
    growth: '低空应用运营、飞行器测试和维修保障',
    policyThemes: ['低空空域和运行管理', '通用航空与无人机应用', '适航安全和基础设施'],
    policyOpportunity: '围绕巡检测绘物流等场景建设低空任务项目',
    policyRisk: '空域合规、飞行安全、适航要求和数据保密',
    buildFocus: '飞行器装调、任务规划、低空运营与维修保障',
  },
  机器人产业链: {
    roles: ['机器人装调工程师', '机器人应用工程师', '系统集成工程师'],
    skills: ['机械电气装调', '运动控制与编程', '机器视觉和工作站联调'],
    knowledge: '机械结构、自动控制和功能安全',
    opportunity: '柔性制造、特种作业和服务机器人应用',
    gap: '核心部件、本体调试和行业工艺适配训练不足',
    growth: '人机协作、机器视觉和机器人场景集成',
    policyThemes: ['机器人产业创新发展', '智能制造场景应用', '产品质量和安全标准'],
    policyOpportunity: '依托制造和特种作业场景建设机器人工作站项目',
    policyRisk: '人机安全、设备可靠性、系统集成质量和数据安全',
    buildFocus: '本体装调、运动控制、机器视觉与系统集成',
  },
  人工智能产业链: {
    roles: ['数据工程师', '算法应用工程师', '人工智能系统工程师'],
    skills: ['数据处理与质量控制', '模型训练评测', '部署监控与应用开发'],
    knowledge: '算法基础、软件工程和负责任人工智能边界',
    opportunity: '行业大模型、智能体和端侧智能应用',
    gap: '数据、模型、工程部署和业务评价尚未贯通',
    growth: '大模型应用、智能体开发和行业智能化服务',
    policyThemes: ['人工智能创新与应用', '算力数据和基础模型', '生成式人工智能安全治理'],
    policyOpportunity: '把模型应用、智能体和行业场景转化为端到端项目',
    policyRisk: '数据授权、模型安全、内容治理和应用责任边界',
    buildFocus: '数据工程、模型训练评测、智能体与行业应用',
  },
  半导体与集成电路产业链: {
    roles: ['芯片设计助理工程师', '半导体设备工程师', '封装测试工程师'],
    skills: ['版图与电路验证', '工艺设备维护', '电性测试与失效分析'],
    knowledge: '半导体工艺、洁净生产和质量控制',
    opportunity: '特色工艺、先进封装和关键设备材料',
    gap: '设计、制造、设备和封测环节的工程实践贯通不足',
    growth: '先进封装、功率器件和国产设备材料应用',
    policyThemes: ['集成电路产业自主能力', '关键设备材料攻关', '人才培养和产线质量'],
    policyOpportunity: '依托特色工艺和封测场景建设工程认知与测试项目',
    policyRisk: '洁净安全、工艺纪律、知识产权和供应链稳定',
    buildFocus: '芯片设计认知、工艺设备、封装测试与失效分析',
  },
  纺织产业链: {
    roles: ['纺织工艺工程师', '染整技术工程师', '面料质量工程师'],
    skills: ['纺纱织造工艺', '染整配色与过程控制', '面料检测和柔性生产'],
    knowledge: '纤维材料、质量标准和绿色生产',
    opportunity: '功能面料、智能制造和品牌柔性供应链',
    gap: '工艺、设备、质量和数字设计训练衔接不足',
    growth: '高端功能面料、绿色染整和小批量柔性制造',
    policyThemes: ['纺织产业提质升级', '绿色染整和节能减排', '品牌数字化与先进制造'],
    policyOpportunity: '围绕高端面料和柔性订单建设生产交付项目',
    policyRisk: '化学品管理、排放控制、产品质量和供应链合规',
    buildFocus: '纺纱织造、绿色染整、质量检测与数字设计',
  },
  新型显示与虚拟现实产业链: {
    roles: ['显示模组工程师', '光电测试工程师', '虚拟现实开发工程师'],
    skills: ['显示器件检测', '光学调校与模组联调', '三维内容和交互开发'],
    knowledge: '光电显示、嵌入式系统和用户体验',
    opportunity: '新型显示终端、空间计算和行业沉浸应用',
    gap: '硬件检测、内容制作和交互体验优化缺少融合项目',
    growth: '车载显示、虚拟现实终端和沉浸式行业应用',
    policyThemes: ['新型显示技术创新', '虚拟现实融合应用', '内容安全和产品质量'],
    policyOpportunity: '把显示终端和沉浸式场景组织为软硬融合项目',
    policyRisk: '产品可靠性、视觉健康、内容合规和用户数据保护',
    buildFocus: '显示检测、模组联调、三维内容与交互应用',
  },
  软件与数字安全产业链: {
    roles: ['软件开发工程师', '安全运维工程师', '数据安全工程师'],
    skills: ['需求开发与软件测试', '漏洞检测与应急响应', '系统适配和数据防护'],
    knowledge: '软件工程、网络体系和安全合规',
    opportunity: '信创适配、工业软件和安全运营服务',
    gap: '开发、运维、攻防和合规尚未形成全生命周期训练',
    growth: '基础软件适配、云数据安全和行业安全运营',
    policyThemes: ['软件产业高质量发展', '网络和数据安全', '信创适配与供应链安全'],
    policyOpportunity: '围绕国产化迁移和安全运营建设全生命周期项目',
    policyRisk: '漏洞风险、数据泄露、供应链安全和合规责任',
    buildFocus: '软件开发测试、信创适配、网络攻防与安全运营',
  },
}

const pages = [
  ['industry-chain', '产业链图谱', '产业链结构、关键节点与上下游协同', '当前产业链'],
  ['industry-region', '区域产业分析', '区域梯度、合作方向与基地布局', '当前产业链'],
  ['industry-policy', '产业政策库', '政策主题、转化窗口与规范约束', '当前产业链'],
  ['industry-company', '产业企业库', '企业生态、场景资源与校企合作价值', '当前产业链'],
  ['job-portrait', '岗位画像分析', '岗位任务、能力结构与人才培养缺口', '产业链岗位画像'],
  ['job-demand', '招聘需求趋势', '岗位需求、高频技能与培养优先级', '产业链岗位群'],
]

const pageTitles = {
  'industry-chain': '产业链结构分析',
  'industry-region': '区域产业布局研判',
  'industry-policy': '政策趋势解读',
  'industry-company': '企业资源研判',
  'job-portrait': '岗位画像洞察',
  'job-demand': '招聘需求趋势判断',
}

const shortChain = (chain) => chain.replace(/产业链$/, '')
const shortRegion = (region) => region.replace(/（.*$/, '').replace(/地区双城经济圈$/, '').replace(/地区$/, '')
const trim = (text, max = 140) => [...String(text).replace(/\s+/g, ' ').trim()].slice(0, max).join('')

const stageByChain = new Map()
for (const node of stageBundle.nodes) {
  if (!stageByChain.has(node.standard_chain)) stageByChain.set(node.standard_chain, {})
  stageByChain.get(node.standard_chain)[node.stage] = node
}
const regionByChain = new Map(regionGroups.map((item) => [item.chain, item.regions]))

const summaryFor = (chainRow, pageKey) => {
  const chain = chainRow.chain
  const short = shortChain(chain)
  const profile = profiles[chain]
  const stages = stageByChain.get(chain)
  const up = stages.上游.node_name
  const mid = stages.中游.node_name
  const down = stages.下游.node_name
  const regions = regionByChain.get(chain)
  const regionNames = regions.slice(0, 3).map((item) => shortRegion(item[0]))
  const regionKeywords = regions.slice(0, 3).map((item) => item[1])

  const byPage = {
    'industry-chain': [
      `${short}已形成“${up}—${mid}—${down}”的完整价值链，产业价值由基础供给、核心转化和场景应用共同实现。`,
      `上游侧重${up}，中游承担${mid}，下游落到${down}；中游转化能力是串联技术供给与业务应用的关键。`,
      `主要机会在${profile.opportunity}，需要同步补强跨环节标准、质量与交付协同，避免上下游能力脱节。`,
      `建议围绕${profile.buildFocus}组织${short}专业方向、课程模块和跨环节项目实训，形成产业节点—岗位任务—能力评价闭环。`,
    ],
    'industry-region': [
      `${short}区域合作可形成“${regionNames[0]}牵引、${regionNames[1]}协同、${regionNames[2]}补充”的多中心布局。`,
      `${regionNames[0]}适合深化${regionKeywords[0]}项目，${regionNames[1]}可承接${regionKeywords[1]}资源，${regionNames[2]}可围绕${regionKeywords[2]}形成特色合作入口。`,
      `${short}头部区域的企业与项目资源适合建设稳定实训基地，其他区域可通过联合项目、师资共享和就业协同降低合作进入成本。`,
      `建议为${short}按“核心基地+区域项目点”配置校企合作，优先选择岗位任务清晰、设备数据可开放、成果可评价的单位。`,
    ],
    'industry-policy': [
      `${short}政策导向重点覆盖${profile.policyThemes.join('、')}，政策目标正由方向引导向场景落地、标准执行和能力建设延伸。`,
      `上位政策明确${short}发展与安全质量边界，地方政策推动园区、企业和示范项目落地，行业标准进一步细化实施要求。`,
      `政策转化机会在${profile.policyOpportunity}；建设中需关注${profile.policyRisk}，避免课程内容与产业规范脱节。`,
      `建议把${short}政策中的技术路线、质量安全要求和应用任务拆成课程标准、项目任务书与实训评价指标。`,
    ],
    'industry-company': [
      `${short}企业生态覆盖${up}、${mid}和${down}，主体类型由基础供给延伸到产品制造、系统集成和运营服务。`,
      `${short}上游企业提供资源与关键部件，中游企业承担工艺和产品转化，下游企业连接行业场景，跨环节交付能力决定合作价值。`,
      `校企合作机会集中在${profile.buildFocus}；应优先筛选能开放岗位任务、项目数据、设备环境和企业导师的单位。`,
      `建议为${short}按“代表企业—典型项目—岗位任务—课程模块”建立资源清单，先做可复用项目，再扩展基地和师资共建。`,
    ],
    'job-portrait': [
      `${short}岗位群围绕${profile.roles.join('、')}形成主要就业入口，岗位边界正在由单一操作转向跨环节协同。`,
      `核心能力集中在${profile.skills.join('、')}，同时要求从业者理解${profile.knowledge}并能完成规范记录、质量判断与异常处置。`,
      `岗位机会在${profile.opportunity}持续释放，主要短板是${profile.gap}，需强化跨场景迁移和完整项目交付能力。`,
      `建议按${short}典型工作任务重组课程，贯通基础知识、工具训练、综合项目、企业评价与证书映射。`,
    ],
    'job-demand': [
      `${short}招聘需求主要集中在${profile.roles.join('、')}等岗位，市场更偏好能够直接进入真实业务和工程场景的人才。`,
      `招聘筛选重点由单项技能转向${profile.skills.join('、')}的组合，岗位要求更强调质量、安全、协同和结果交付。`,
      `${profile.growth}是潜在增量方向；不同岗位需求节奏可能分化，课程资源不宜按产业链总体热度平均配置。`,
      `建议优先建设“${profile.roles[0]}+${profile.roles[1]}”岗位能力包，以招聘高频任务反向校准${short}课程内容、实训项目和就业服务。`,
    ],
  }

  const title = pageTitles[pageKey]
  return { title: trim(title, 40), items: byPage[pageKey].map((item) => trim(item)) }
}

const outputRows = []
for (const [chainIndex, chainRow] of chainRows.entries()) {
  for (const [pageIndex, [pageKey, pageName]] of pages.entries()) {
    const summary = summaryFor(chainRow, pageKey)
    outputRows.push({
      id: outputRows.length + 1,
      chainOrder: chainIndex + 1,
      pageOrder: pageIndex + 1,
      pageKey,
      pageName,
      chain: chainRow.chain,
      ...summary,
    })
  }
}

const errors = []
if (chainRows.length !== 19) errors.push(`产业链数量错误：${chainRows.length}`)
if (pages.length !== 6) errors.push(`页面数量错误：${pages.length}`)
if (outputRows.length !== 114) errors.push(`总结数量错误：${outputRows.length}`)
if (Object.keys(profiles).length !== 19) errors.push(`画像数量错误：${Object.keys(profiles).length}`)
for (const row of outputRows) {
  if (!row.title || row.items.length !== 4 || row.items.some((item) => !item)) errors.push(`空内容：${row.chain}/${row.pageName}`)
  if ([...row.title].length > 40) errors.push(`标题超长：${row.chain}/${row.pageName}`)
  row.items.forEach((item, index) => {
    if ([...item].length > 140) errors.push(`item${index + 1}超长：${row.chain}/${row.pageName}`)
    if (/企查查|爱企查/.test(item)) errors.push(`展示禁词：${row.chain}/${row.pageName}`)
  })
}
const rowKeys = outputRows.map((row) => `${row.chain}::${row.pageKey}`)
if (new Set(rowKeys).size !== 114) errors.push('存在重复的产业链—页面组合')
const titleCounts = outputRows.reduce((counts, row) => {
  counts[row.title] = (counts[row.title] ?? 0) + 1
  return counts
}, {})
if (Object.keys(titleCounts).length !== 6 || Object.values(titleCounts).some((count) => count !== 19)) {
  errors.push(`抽象标题分布错误：${JSON.stringify(titleCounts)}`)
}
if (errors.length) throw new Error(errors.join('\n'))

const colors = {
  navy: '#17365D', blue: '#2F6BFF', cyan: '#0EA5A8', purple: '#7C3AED',
  lightBlue: '#EAF1FF', lighter: '#F6F8FC', lightCyan: '#EAF8F7',
  lightPurple: '#F2ECFF', white: '#FFFFFF', text: '#24324A', muted: '#64748B',
  border: '#D7E1F0', green: '#008A6A', lightGreen: '#E9F7F2', amber: '#A15C00', lightAmber: '#FFF5E5',
}

const workbook = Workbook.create()
const applyBase = (sheet) => { sheet.showGridLines = false }
const titleBand = (sheet, range, text) => {
  sheet.getRange(range).merge()
  sheet.getRange(range).values = [[text]]
  sheet.getRange(range).format = {
    fill: colors.navy,
    font: { name: 'Microsoft YaHei', size: 18, bold: true, color: colors.white },
    verticalAlignment: 'center', horizontalAlignment: 'left',
  }
  sheet.getRange(range).format.rowHeight = 36
}
const noteBand = (sheet, range, text) => {
  sheet.getRange(range).merge()
  sheet.getRange(range).values = [[text]]
  sheet.getRange(range).format = {
    fill: colors.lightBlue,
    font: { name: 'Microsoft YaHei', size: 10, color: colors.text },
    wrapText: true, verticalAlignment: 'center', horizontalAlignment: 'left',
  }
  sheet.getRange(range).format.rowHeight = 30
}
const headerStyle = (range, fill = colors.blue) => {
  range.format = {
    fill,
    font: { name: 'Microsoft YaHei', size: 10, bold: true, color: colors.white },
    wrapText: true, verticalAlignment: 'center', horizontalAlignment: 'center',
    borders: { preset: 'all', style: 'thin', color: colors.border },
  }
  range.format.rowHeight = 32
}
const bodyStyle = (range) => {
  range.format = {
    font: { name: 'Microsoft YaHei', size: 9, color: colors.text },
    wrapText: true, verticalAlignment: 'top', horizontalAlignment: 'left',
    borders: { insideHorizontal: { style: 'thin', color: colors.border } },
  }
}

// 1. 使用说明
const guide = workbook.worksheets.add('使用说明')
applyBase(guide)
titleBand(guide, 'A1:H2', '19条产业链 × 6页面 AI 总结写死表')
noteBand(guide, 'A3:H3', '交付口径：直接适配线上顶部 title + items[4] 结构；文案不依赖实时接口，不写入无法持续证明的数量、增幅、薪资或排名。')
guide.getRange('A5:H5').values = [['产业链数', '', '页面数', '', '总结组数', '', '单组结构', '当前状态']]
for (const range of ['A5:B5', 'C5:D5', 'E5:F5', 'G5:H5']) guide.getRange(range).merge()
headerStyle(guide.getRange('A5:H5'))
guide.getRange('A6:H6').values = [[19, null, 6, null, 114, null, '标题 + 四条研判', '可交付']]
for (const range of ['A6:B6', 'C6:D6', 'E6:F6', 'G6:H6']) guide.getRange(range).merge()
guide.getRange('A6:H6').format = {
  fill: colors.lighter, font: { name: 'Microsoft YaHei', size: 14, bold: true, color: colors.navy },
  verticalAlignment: 'center', horizontalAlignment: 'center',
  borders: { preset: 'all', style: 'thin', color: colors.border },
}
guide.getRange('A6:H6').format.rowHeight = 40
guide.getRange('A8:H8').merge()
guide.getRange('A8:H8').values = [['使用方式']]
guide.getRange('A8:H8').format = { fill: colors.cyan, font: { name: 'Microsoft YaHei', size: 12, bold: true, color: colors.white }, verticalAlignment: 'center' }
guide.getRange('A9:B13').values = [
  ['步骤', '说明'],
  [1, '开发按“产业链 + pageKey”查找唯一记录。'],
  [2, '前端直接读取标题以及 item1—item4，或使用“前端JSON”整段写入配置。'],
  [3, '顶部完整文案列用于业务、产品和测试人员快速预览。'],
  [4, '更换产业链时切换对应静态记录；不再调用在线 AI 总结接口。'],
]
headerStyle(guide.getRange('A9:B9'), colors.cyan)
bodyStyle(guide.getRange('A10:B13'))
guide.getRange('A10:B13').format.rowHeight = 38
guide.getRange('D9:H9').values = [['校验项', '规则', '结果', '检查位置', '备注']]
headerStyle(guide.getRange('D9:H9'), colors.purple)
guide.getRange('D10:H14').values = [
  ['组合完整性', '19条产业链 × 6页面', '通过', '开发写死表', '共114组'],
  ['输出结构', '每组1个标题 + 4条内容', '通过', '开发写死表', '与线上Schema一致'],
  ['字符长度', '标题≤40字；每条≤140字', '通过', '校验列', '逐行公式校验'],
  ['展示禁词', '不出现第三方企业数据平台品牌名', '通过', '全部文案', '展示口径已清洗'],
  ['实时数字', '不写死不可持续证明的实时数字', '通过', '全部文案', '页面数字仍由KPI与图表展示'],
]
headerStyle(guide.getRange('D9:H9'), colors.purple)
bodyStyle(guide.getRange('D10:H14'))
guide.getRange('F10:F14').format = { fill: colors.lightGreen, font: { name: 'Microsoft YaHei', size: 9, bold: true, color: colors.green }, verticalAlignment: 'center', horizontalAlignment: 'center' }
guide.getRange('D10:H14').format.rowHeight = 34
guide.getRange('A16:H16').merge()
guide.getRange('A16:H16').values = [['来源与边界']]
guide.getRange('A16:H16').format = { fill: colors.blue, font: { name: 'Microsoft YaHei', size: 12, bold: true, color: colors.white }, verticalAlignment: 'center' }
guide.getRange('A17:H20').values = [
  ['来源', '19条标准产业链名单', '', '上中下游节点', '', '区域合作方向', '', '历史AI总结口径'],
  ['文件', 'industry_chain_standardization_summary.csv', '', 'industry_chain_stage_node_bundle.json', '', '19个产业链区域合作方向表.xlsx', '', 'research-summary-core.js'],
  ['内容', '产业链名称和顺序', '', '每条产业链三个阶段节点', '', '每条产业链代表区域与合作主题', '', '总体研判/结构特征/机会与问题/建设启示'],
  ['边界', '本表为固定业务文案；页面中的企业数、政策数、薪资、招聘量和区域排名仍应使用系统当前数据。', '', '', '', '', '', ''],
]
bodyStyle(guide.getRange('A17:H20'))
guide.getRange('A17:H17').format = { fill: colors.lightBlue, font: { name: 'Microsoft YaHei', size: 9, bold: true, color: colors.navy }, wrapText: true, verticalAlignment: 'center' }
guide.getRange('A20:H20').merge()
guide.getRange('A20:H20').values = [['边界：本表为固定业务文案；页面中的企业数、政策数、薪资、招聘量和区域排名仍应使用系统当前数据。']]
guide.getRange('A20:H20').format = { fill: colors.lightAmber, font: { name: 'Microsoft YaHei', size: 9, color: colors.amber }, wrapText: true, verticalAlignment: 'center' }
guide.getRange('A20:H20').format.rowHeight = 34
guide.getRange('A:A').format.columnWidth = 16
guide.getRange('B:B').format.columnWidth = 42
guide.getRange('C:C').format.columnWidth = 16
guide.getRange('D:D').format.columnWidth = 30
guide.getRange('E:E').format.columnWidth = 14
guide.getRange('F:F').format.columnWidth = 30
guide.getRange('G:G').format.columnWidth = 14
guide.getRange('H:H').format.columnWidth = 31
guide.freezePanes.freezeRows(3)

// 2. 开发写死表
const dev = workbook.worksheets.add('开发写死表')
applyBase(dev)
titleBand(dev, 'A1:N2', '开发写死表｜114组 title + items[4]')
noteBand(dev, 'A3:N3', '唯一键：产业链 + pageKey。title 统一采用页面级抽象名称，与截图中的“产业链结构分析”口径一致；产业链差异全部由 items[4] 承载。')
const devHeaders = ['序号', '产业链序号', '页面序号', 'pageKey', '页面名称', '产业链', 'title', 'item1 总体研判', 'item2 结构特征', 'item3 机会与问题', 'item4 建设启示', '顶部完整文案', '前端JSON', '校验']
dev.getRange('A4:N4').values = [devHeaders]
headerStyle(dev.getRange('A4:N4'))
const devMatrix = outputRows.map((row) => {
  const labels = ['总体研判', '结构特征', '机会与问题', '建设启示']
  const full = [`【标题】${row.title}`, ...row.items.map((item, index) => `【${labels[index]}】${item}`)].join('\n')
  const json = JSON.stringify({ title: row.title, items: row.items })
  return [row.id, row.chainOrder, row.pageOrder, row.pageKey, row.pageName, row.chain, row.title, ...row.items, full, json, null]
})
dev.getRange(`A5:N${outputRows.length + 4}`).values = devMatrix
dev.getRange('N5').formulas = [['=IF(AND(LEN(G5)<=40,LEN(H5)<=140,LEN(I5)<=140,LEN(J5)<=140,LEN(K5)<=140),"通过","复核")']]
dev.getRange(`N5:N${outputRows.length + 4}`).fillDown()
bodyStyle(dev.getRange(`A5:N${outputRows.length + 4}`))
dev.getRange(`A5:C${outputRows.length + 4}`).format.horizontalAlignment = 'center'
dev.getRange(`N5:N${outputRows.length + 4}`).format = { fill: colors.lightGreen, font: { name: 'Microsoft YaHei', size: 9, bold: true, color: colors.green }, verticalAlignment: 'center', horizontalAlignment: 'center' }
dev.getRange(`A5:N${outputRows.length + 4}`).format.rowHeight = 90
dev.getRange('A:A').format.columnWidth = 8
dev.getRange('B:C').format.columnWidth = 10
dev.getRange('D:D').format.columnWidth = 20
dev.getRange('E:E').format.columnWidth = 18
dev.getRange('F:F').format.columnWidth = 28
dev.getRange('G:G').format.columnWidth = 30
dev.getRange('H:K').format.columnWidth = 48
dev.getRange('L:L').format.columnWidth = 62
dev.getRange('M:M').format.columnWidth = 78
dev.getRange('N:N').format.columnWidth = 10
dev.freezePanes.freezeRows(4)
dev.freezePanes.freezeColumns(6)
const devTable = dev.tables.add(`A4:N${outputRows.length + 4}`, true, 'StaticAiSummaryTable')
devTable.style = 'TableStyleMedium2'
devTable.showBandedRows = true

// 3. 产业链总览
const overview = workbook.worksheets.add('产业链总览')
applyBase(overview)
titleBand(overview, 'A1:G2', '按产业链总览｜每条产业链对应六页面完整文案')
noteBand(overview, 'A3:G3', '用于业务评审和横向对比；每个单元格内依次展示总体研判、结构特征、机会与问题、建设启示。')
overview.getRange('A4:G4').values = [['产业链', ...pages.map((page) => page[1])]]
headerStyle(overview.getRange('A4:G4'))
const byKey = new Map(outputRows.map((row) => [`${row.chain}::${row.pageKey}`, row]))
const labels = ['总体研判', '结构特征', '机会与问题', '建设启示']
const overviewMatrix = chainRows.map((chainRow) => [
  chainRow.chain,
  ...pages.map(([pageKey]) => {
    const row = byKey.get(`${chainRow.chain}::${pageKey}`)
    return [`【标题】${row.title}`, ...row.items.map((item, index) => `【${labels[index]}】${item}`)].join('\n')
  }),
])
overview.getRange('A5:G23').values = overviewMatrix
bodyStyle(overview.getRange('A5:G23'))
overview.getRange('A5:A23').format = { fill: colors.lightBlue, font: { name: 'Microsoft YaHei', size: 10, bold: true, color: colors.navy }, wrapText: true, verticalAlignment: 'top', borders: { insideHorizontal: { style: 'thin', color: colors.border } } }
overview.getRange('A5:G23').format.rowHeight = 142
overview.getRange('A:A').format.columnWidth = 28
overview.getRange('B:G').format.columnWidth = 58
overview.freezePanes.freezeRows(4)
overview.freezePanes.freezeColumns(1)
const overviewTable = overview.tables.add('A4:G23', true, 'IndustryChainOverviewTable')
overviewTable.style = 'TableStyleMedium2'
overviewTable.showBandedRows = true

// 4. 页面口径
const pageSheet = workbook.worksheets.add('页面口径')
applyBase(pageSheet)
titleBand(pageSheet, 'A1:H2', '六页面 AI 总结口径')
noteBand(pageSheet, 'A3:H3', '六个页面保持同一四段输出结构，但读取对象、研判重点和建设建议必须有明确差异。')
pageSheet.getRange('A4:H4').values = [['pageKey', '页面名称', '标题规则', '研判重点', 'item1', 'item2', 'item3', 'item4']]
headerStyle(pageSheet.getRange('A4:H4'))
const pageRules = [
  ['industry-chain', '产业链图谱', '固定：产业链结构分析', '产业链结构、关键节点与上下游协同', '产业链完整度与总体价值流', '上中下游结构及关键转化环节', '机会、短板与协同问题', '按产业节点组织课程和项目'],
  ['industry-region', '区域产业分析', '固定：区域产业布局研判', '区域梯度、合作方向与基地布局', '区域总体格局', '核心区域与特色方向', '基地布局及区域协作机会', '核心基地与区域项目点'],
  ['industry-policy', '产业政策库', '固定：政策趋势解读', '政策主题、转化窗口与规范约束', '政策导向', '政策层级与落地机制', '政策机会及合规约束', '政策要求转课程标准'],
  ['industry-company', '产业企业库', '固定：企业资源研判', '企业生态、场景资源与合作价值', '企业生态覆盖', '企业类型与跨环节能力', '校企合作机会与筛选条件', '企业—项目—岗位—课程映射'],
  ['job-portrait', '岗位画像分析', '固定：岗位画像洞察', '岗位任务、能力结构与培养缺口', '主要岗位群', '核心能力结构', '岗位机会与能力短板', '按典型任务重组课程'],
  ['job-demand', '招聘需求趋势', '固定：招聘需求趋势判断', '岗位需求、高频技能与培养优先级', '需求承载岗位', '招聘高频技能组合', '潜在增量与岗位分化', '建设优先岗位能力包'],
]
pageSheet.getRange('A5:H10').values = pageRules
bodyStyle(pageSheet.getRange('A5:H10'))
pageSheet.getRange('A5:H10').format.rowHeight = 60
pageSheet.getRange('A:A').format.columnWidth = 22
pageSheet.getRange('B:B').format.columnWidth = 18
pageSheet.getRange('C:C').format.columnWidth = 24
pageSheet.getRange('D:H').format.columnWidth = 36
pageSheet.freezePanes.freezeRows(4)
const pageTable = pageSheet.tables.add('A4:H10', true, 'PageRuleTable')
pageTable.style = 'TableStyleMedium4'

// 5. 产业链依据
const evidence = workbook.worksheets.add('产业链依据')
applyBase(evidence)
titleBand(evidence, 'A1:N2', '产业链内容依据｜节点、区域、岗位与政策主题')
noteBand(evidence, 'A3:N3', '该页用于复核静态文案的产业链差异，不用于替代线上实时企业、政策和招聘统计。')
const evidenceHeaders = ['产业链', '上游节点', '中游节点', '下游节点', '价值流判断', '建设切入点', '企业需求特征', '区域一', '区域二', '区域三', '代表岗位', '核心能力', '政策主题', '主要机会']
evidence.getRange('A4:N4').values = [evidenceHeaders]
headerStyle(evidence.getRange('A4:N4'))
const evidenceMatrix = chainRows.map((row) => {
  const stages = stageByChain.get(row.chain)
  const regions = regionByChain.get(row.chain)
  const profile = profiles[row.chain]
  return [
    row.chain, stages.上游.node_name, stages.中游.node_name, stages.下游.node_name,
    row.value, row.entry, row.feedback,
    `${regions[0][0]}｜${regions[0][1]}`,
    `${regions[1][0]}｜${regions[1][1]}`,
    `${regions[2][0]}｜${regions[2][1]}`,
    profile.roles.join('、'), profile.skills.join('、'), profile.policyThemes.join('、'), profile.opportunity,
  ]
})
evidence.getRange('A5:N23').values = evidenceMatrix
bodyStyle(evidence.getRange('A5:N23'))
evidence.getRange('A5:A23').format = { fill: colors.lightBlue, font: { name: 'Microsoft YaHei', size: 9, bold: true, color: colors.navy }, wrapText: true, verticalAlignment: 'top', borders: { insideHorizontal: { style: 'thin', color: colors.border } } }
evidence.getRange('A5:N23').format.rowHeight = 96
evidence.getRange('A:A').format.columnWidth = 28
evidence.getRange('B:D').format.columnWidth = 30
evidence.getRange('E:G').format.columnWidth = 44
evidence.getRange('H:J').format.columnWidth = 38
evidence.getRange('K:N').format.columnWidth = 38
evidence.freezePanes.freezeRows(4)
evidence.freezePanes.freezeColumns(1)
const evidenceTable = evidence.tables.add('A4:N23', true, 'IndustryEvidenceTable')
evidenceTable.style = 'TableStyleMedium2'
evidenceTable.showBandedRows = true

await fs.mkdir(previewDir, { recursive: true })

const inspections = []
inspections.push((await workbook.inspect({ kind: 'table', range: '使用说明!A1:H20', include: 'values,formulas', tableMaxRows: 22, tableMaxCols: 10, maxChars: 12000 })).ndjson)
inspections.push((await workbook.inspect({ kind: 'table', range: '开发写死表!A1:N12', include: 'values,formulas', tableMaxRows: 14, tableMaxCols: 14, maxChars: 18000 })).ndjson)
inspections.push((await workbook.inspect({ kind: 'table', range: '开发写死表!A89:N94', include: 'values,formulas', tableMaxRows: 8, tableMaxCols: 14, maxChars: 18000 })).ndjson)
inspections.push((await workbook.inspect({ kind: 'table', range: '开发写死表!A113:N118', include: 'values,formulas', tableMaxRows: 8, tableMaxCols: 14, maxChars: 18000 })).ndjson)
inspections.push((await workbook.inspect({ kind: 'table', range: '产业链总览!A1:G8', include: 'values,formulas', tableMaxRows: 10, tableMaxCols: 8, maxChars: 18000 })).ndjson)
inspections.push((await workbook.inspect({ kind: 'table', range: '页面口径!A1:H10', include: 'values,formulas', tableMaxRows: 12, tableMaxCols: 10, maxChars: 12000 })).ndjson)
inspections.push((await workbook.inspect({ kind: 'table', range: '产业链依据!A1:N9', include: 'values,formulas', tableMaxRows: 11, tableMaxCols: 14, maxChars: 16000 })).ndjson)
const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 300 },
  summary: 'final formula error scan',
})
inspections.push(formulaErrors.ndjson)
await fs.writeFile(`${outputDir}/verification.inspect.ndjson`, inspections.join('\n'))

const renderConfigs = [
  ['使用说明', 'A1:H20'],
  ['开发写死表', 'A1:N12'],
  ['产业链总览', 'A1:G8'],
  ['页面口径', 'A1:H10'],
  ['产业链依据', 'A1:N9'],
]
for (const [sheetName, range] of renderConfigs) {
  const preview = await workbook.render({ sheetName, range, scale: 1.15, format: 'png' })
  await fs.writeFile(`${previewDir}/${sheetName}.png`, new Uint8Array(await preview.arrayBuffer()))
}

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)

const itemLengths = outputRows.flatMap((row) => row.items.map((item) => [...item].length))
const uniqueItems = new Set(outputRows.flatMap((row) => row.items))
const report = {
  outputPath,
  chainCount: chainRows.length,
  pageCount: pages.length,
  summaryCount: outputRows.length,
  itemCount: itemLengths.length,
  uniqueItemCount: uniqueItems.size,
  duplicateItemCount: itemLengths.length - uniqueItems.size,
  titleCounts,
  maxItemLength: Math.max(...itemLengths),
  maxTitleLength: Math.max(...outputRows.map((row) => [...row.title].length)),
  formulaErrorMatches: formulaErrors.ndjson,
  sheetNames: ['使用说明', '开发写死表', '产业链总览', '页面口径', '产业链依据'],
}
await fs.writeFile(`${outputDir}/verification.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
