import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputDir = fileURLToPath(new URL('.', import.meta.url))
const outputPath = `${outputDir}/19个产业链区域合作方向表.xlsx`

const groups = [
  {
    chain: '数据要素与数字经济产业链',
    regions: [
      ['京津冀（北京—天津—雄安）', '公共数据 / 数据治理 / 要素流通', '对接公共数据运营、数据交易和政务数字化机构，共建数据治理、授权运营与合规流通实训项目。'],
      ['长三角（上海—杭州—苏州）', '数据产品 / 金融科技 / 产业互联网', '引入平台企业与数字服务商真实场景，开展指标建模、数据产品设计和产业数据分析项目。'],
      ['粤港澳大湾区（深圳—广州—东莞）', '跨境数据 / 数字贸易 / 智能终端数据', '围绕数字贸易、跨境合规和终端数据服务，共建数据安全、数据运营与应用开发课程案例。'],
      ['成渝地区双城经济圈', '大数据中心 / 城市治理 / 产业数字化', '联合算力中心和行业龙头，建设城市治理数据分析、产业数据中台与可视化决策实训。'],
    ],
  },
  {
    chain: '高端装备与智能制造产业链',
    regions: [
      ['东北老工业基地（沈阳—大连—长春）', '工业母机 / 装备运维 / 数字化改造', '对接机床、重型装备和汽车装备企业，开展设备装调、产线改造、状态监测与故障诊断实训。'],
      ['长三角（上海—苏锡常—宁波）', '工业互联网 / 精密制造 / 数字工厂', '引入精密制造与自动化集成项目，建设工艺优化、MES应用、质量追溯和数字孪生产线课程。'],
      ['粤港澳大湾区（深圳—东莞—佛山）', '机器人 / 电子装备 / 柔性制造', '联合机器人和电子装备企业，共建柔性产线、机器视觉、运动控制与系统集成实训基地。'],
      ['成渝地区双城经济圈', '航空装备 / 汽车装备 / 智能产线', '围绕航空与汽车制造场景，开展智能加工、装配检测、产线联调和预测性维护项目。'],
    ],
  },
  {
    chain: '基础设施与城市建设产业链',
    regions: [
      ['京津冀（北京—雄安—天津）', 'BIM协同 / 智慧工地 / 城市更新', '对接设计院、工程央企和新区项目，建设BIM协同、智慧施工、质量安全与数字交付实训。'],
      ['长三角（上海—南京—杭州）', '数字设计 / 绿色建造 / 智慧运维', '引入复杂工程和绿色建筑案例，开展数字设计、施工组织、能耗监测与智慧运维项目。'],
      ['粤港澳大湾区（广州—深圳—珠海）', '超高层 / 轨道交通 / 装配建造', '联合大型总包与轨道建设单位，训练装配施工、工程测量、进度协同和现场数字化管理。'],
      ['东北地区（沈阳—大连—哈尔滨）', '既有建筑 / 基础设施运维 / 寒地建造', '围绕老旧厂房、城市设施和寒地工程，共建检测鉴定、更新改造及设施运维实训项目。'],
    ],
  },
  {
    chain: '医药生物与医疗健康产业链',
    regions: [
      ['长三角（上海—苏州—杭州）', '创新药 / 生物医药 / 医疗器械', '对接研发机构、药企和器械企业，建设研发辅助、洁净生产、质量检验与注册合规实训。'],
      ['京津冀（北京—天津—石家庄）', '药物研发 / 高端器械 / 医药流通', '联合科研院所、制造企业与流通平台，开展药品质量、器械检测和冷链追溯项目。'],
      ['粤港澳大湾区（广州—深圳—珠海）', '生物技术 / 数字医疗 / 跨境健康', '引入生物技术与数字健康场景，建设医疗数据治理、产品测试和跨境健康服务课程案例。'],
      ['成渝地区双城经济圈', '中药现代化 / 医疗装备 / 健康服务', '围绕中药生产、医疗装备和健康管理，开展标准化生产、设备运维与数字健康实训。'],
    ],
  },
  {
    chain: '新能源与电力装备产业链',
    regions: [
      ['长三角（上海—常州—宁波）', '动力电池 / 光伏装备 / 新能源配套', '对接电池、光伏和电力电子企业，开展电芯检测、装备调试、质量追溯与安全管理实训。'],
      ['西北能源基地（西安—银川—乌鲁木齐）', '光伏 / 风电 / 储能电站', '围绕大型新能源基地，建设发电设备运维、储能系统联调和新能源场站数据分析项目。'],
      ['京津冀（北京—保定—张家口）', '新型电力系统 / 风电装备 / 氢能', '联合电网、装备和能源服务企业，训练源网荷储协同、设备监测与能源管理能力。'],
      ['成渝地区双城经济圈（成都—重庆—宜宾）', '动力电池 / 电力装备 / 储能应用', '依托电池与电气装备产业，共建电池制造检测、电力装备装调和工商业储能实训。'],
    ],
  },
  {
    chain: '智能物联与消费电子产业链',
    regions: [
      ['粤港澳大湾区（深圳—东莞—惠州）', '智能终端 / 传感模组 / 消费电子', '对接终端、模组和代工企业，开展嵌入式开发、整机装调、可靠性测试与供应链协同项目。'],
      ['长三角（上海—苏州—无锡）', '基础器件 / 物联平台 / 智能家居', '联合器件和平台企业，建设传感接入、无线通信、云端联动及智能家居系统实训。'],
      ['海峡西岸（厦门—福州—泉州）', '电子元器件 / 显示模组 / 智慧家居', '围绕元器件、模组和家居产品，开展产品装调、功能测试、质量管控与场景应用项目。'],
      ['成渝地区（重庆—成都—绵阳）', '终端制造 / 物联网 / 电子测试', '依托电子信息制造基地，共建智能终端生产、物联网应用开发和电子产品测试实训。'],
    ],
  },
  {
    chain: '石油化工产业链',
    regions: [
      ['环渤海（大连—盘锦—天津）', '炼化一体化 / 精细化工 / 化工新材料', '对接炼化与精细化工园区，建设流程仿真、设备仪表、质量检测和安全生产实训。'],
      ['长三角沿江（上海—南京—宁波）', '高端化学品 / 新材料 / 绿色化工', '联合化工与材料企业，开展工艺控制、绿色生产、产品检测和数字化工厂项目。'],
      ['粤港澳及粤西（广州—惠州—茂名）', '石化深加工 / 供应链 / 安全环保', '围绕大型石化基地，建设生产运行、仓储物流、风险辨识与环保治理综合实训。'],
      ['西北能源化工基地（榆林—鄂尔多斯—乌鲁木齐）', '煤化工 / 油气加工 / 节能降碳', '对接能源化工园区，开展工艺操作、设备维护、能效分析和异常处置项目。'],
    ],
  },
  {
    chain: '汽车与智能网联汽车产业链',
    regions: [
      ['长三角（上海—合肥—宁波）', '新能源整车 / 智能座舱 / 汽车电子', '对接整车与零部件企业，建设三电系统、智能座舱、整车诊断和质量检测实训。'],
      ['粤港澳大湾区（广州—深圳—佛山）', '新能源汽车 / 自动驾驶 / 车路云', '联合车企、传感器和平台企业，开展智能驾驶测试、车载通信及车路云协同项目。'],
      ['京津冀（北京—天津—保定）', '智能网联 / 汽车研发 / 核心零部件', '围绕研发验证与零部件制造，训练汽车电子、软件测试、装调诊断和试验评价能力。'],
      ['成渝地区双城经济圈', '整车制造 / 动力系统 / 智能测试', '依托整车和动力系统基地，共建生产装调、性能测试、故障诊断与智能制造实训。'],
    ],
  },
  {
    chain: '食品饮料产业链',
    regions: [
      ['长三角（上海—杭州—苏锡）', '功能食品 / 智能加工 / 新零售', '对接食品研发、智能工厂和零售平台，建设配方开发、品质检测、数字生产与营销项目。'],
      ['粤港澳大湾区（广州—佛山—东莞）', '饮料制造 / 预制食品 / 冷链流通', '联合食品饮料与冷链企业，开展生产操作、卫生控制、包装检测和冷链追溯实训。'],
      ['成渝地区（成都—重庆—眉山）', '调味品 / 休闲食品 / 供应链', '围绕特色食品产业，建设原料控制、加工工艺、质量检验和供应链运营项目。'],
      ['东北农业带（哈尔滨—长春—沈阳）', '粮油加工 / 乳制品 / 农产品深加工', '依托粮食和畜牧资源，开展农产品加工、食品安全、智能仓储与品牌化实训。'],
    ],
  },
  {
    chain: '新一代信息基础设施产业链',
    regions: [
      ['京津冀（北京—张家口—廊坊）', '算力中心 / 5G网络 / 云服务', '对接运营商、数据中心和云服务企业，建设网络部署、服务器运维、云资源管理与安全实训。'],
      ['长三角（上海—杭州—苏州）', '云计算 / 工业互联网 / 边缘计算', '引入云网协同和工业互联网场景，开展平台部署、边缘节点管理与应用运维项目。'],
      ['粤港澳大湾区（深圳—广州—东莞）', '通信设备 / 数据中心 / 智慧城市', '联合通信设备和数字基础设施企业，训练设备配置、网络优化、机房运维及城市物联接入。'],
      ['西部算力枢纽（贵阳—成渝—中卫）', '东数西算 / 绿色IDC / 算力调度', '围绕国家算力枢纽场景，共建绿色数据中心、算力资源调度和运维监控实训。'],
    ],
  },
  {
    chain: '绿色环保与资源循环产业链',
    regions: [
      ['长三角（上海—苏州—无锡）', '环境监测 / 节能服务 / 资源循环', '对接环保装备与节能服务企业，建设监测分析、节能诊断和再生资源利用项目。'],
      ['京津冀（北京—天津—唐山）', '大气治理 / 固废处置 / 低碳园区', '围绕工业城市治理需求，开展污染控制、固废资源化、碳核算与园区低碳运营实训。'],
      ['粤港澳大湾区（深圳—广州—佛山）', '水处理 / 无废城市 / 绿色供应链', '联合水务、环保和制造企业，建设水质监测、无废工厂和绿色供应链评价项目。'],
      ['长江中游（武汉—长沙—南昌）', '流域治理 / 环保装备 / 再生资源', '依托流域治理和环保制造场景，开展水环境调查、装备运维及资源回收利用实训。'],
    ],
  },
  {
    chain: '新材料产业链',
    regions: [
      ['长三角（上海—宁波—苏州）', '先进高分子 / 电子材料 / 复合材料', '对接材料研发与高端制造企业，建设材料制备、性能检测、工艺优化和应用验证项目。'],
      ['环渤海（北京—天津—山东）', '新型金属 / 化工新材料 / 功能材料', '联合科研院所和材料企业，开展成分分析、加工成形、质量评价与中试放大实训。'],
      ['粤港澳大湾区（深圳—东莞—佛山）', '电子材料 / 新能源材料 / 先进陶瓷', '围绕电子和新能源制造需求，共建材料检测、失效分析和产品应用验证平台。'],
      ['中西部材料基地（武汉—长沙—西安）', '光电材料 / 储能材料 / 稀有金属材料', '依托高校院所和制造基地，开展材料研发辅助、检测表征与工程化应用项目。'],
    ],
  },
  {
    chain: '空天装备与低空经济产业链',
    regions: [
      ['粤港澳大湾区（深圳—广州—珠海）', '无人机 / eVTOL / 低空运营', '对接无人机、飞行器和运营企业，建设装调测试、飞行任务、低空物流与运营管理实训。'],
      ['成渝地区双城经济圈', '航空整机 / 航电系统 / 试验检测', '联合航空制造与配套企业，开展结构装配、航电联调、质量检测和维修保障项目。'],
      ['西北航空产业带（西安—宝鸡）', '航空制造 / 发动机配套 / 复合材料', '依托航空科研制造资源，共建精密加工、装配检测、材料应用与质量控制实训。'],
      ['长三角（上海—南京—芜湖）', '商用航空 / 低空物流 / 适航服务', '围绕商用航空和低空场景，开展零部件制造、维修保障、适航认知与运营策划项目。'],
    ],
  },
  {
    chain: '机器人产业链',
    regions: [
      ['长三角（上海—苏州—宁波）', '工业机器人 / 核心部件 / 系统集成', '对接机器人本体和集成企业，建设机械装配、运动控制、离线编程及产线集成实训。'],
      ['粤港澳大湾区（深圳—东莞—佛山）', '服务机器人 / 机器视觉 / 柔性产线', '联合机器人与电子制造企业，开展视觉检测、人机协作和柔性制造应用项目。'],
      ['东北地区（沈阳—大连—哈尔滨）', '工业机器人 / 智能装备 / 焊接装配', '依托装备制造基础，共建机器人焊接、搬运、装配和设备维护实训基地。'],
      ['京津冀（北京—天津—唐山）', '特种机器人 / 控制算法 / 场景示范', '对接科研机构和应用单位，开展移动机器人、特种作业、控制调试与安全验证项目。'],
    ],
  },
  {
    chain: '人工智能产业链',
    regions: [
      ['京津冀（北京—天津—雄安）', '大模型 / 智能算力 / 政企应用', '对接模型企业、算力平台和政企场景，建设数据准备、模型应用、智能体开发与安全评测项目。'],
      ['长三角（上海—杭州—苏州）', 'AI平台 / 智能视觉 / 产业赋能', '联合算法与平台企业，开展视觉识别、模型部署、工业智能和数据标注治理实训。'],
      ['粤港澳大湾区（深圳—广州）', '终端智能 / 机器人 / 软件服务', '围绕智能终端和机器人场景，共建端侧模型、智能交互和行业应用开发项目。'],
      ['成渝地区双城经济圈', '计算机视觉 / 智能制造 / 城市治理', '依托软件和制造场景，开展视觉质检、智能决策及城市治理应用实训。'],
    ],
  },
  {
    chain: '半导体与集成电路产业链',
    regions: [
      ['长三角（上海—无锡—苏州—合肥）', '芯片设计 / 晶圆制造 / 封装测试', '对接设计、制造和封测企业，建设版图设计、工艺认知、设备维护与芯片测试实训。'],
      ['京津冀（北京—天津）', '集成电路设计 / 制造装备 / 核心材料', '联合科研院所和产业园区，开展EDA应用、设备装调、材料检测与工艺质量项目。'],
      ['粤港澳大湾区（深圳—东莞—珠海）', '芯片应用 / 封装测试 / 智能终端', '依托终端产业链，建设芯片选型、硬件验证、封装测试和产品可靠性实训。'],
      ['海峡西岸（厦门—泉州—福州）', '功率器件 / 化合物半导体 / 显示驱动', '对接特色工艺和器件企业，开展器件制造认知、电性测试与应用开发项目。'],
    ],
  },
  {
    chain: '纺织产业链',
    regions: [
      ['长三角（上海—苏州—绍兴—宁波）', '高端面料 / 印染升级 / 品牌服饰', '对接纺织、印染和品牌企业，建设面料开发、绿色染整、质量检测与数字设计项目。'],
      ['海峡西岸（泉州—厦门—福州）', '鞋服制造 / 运动科技 / 跨境电商', '联合鞋服与运动品牌企业，开展产品开发、智能制造、供应链及跨境运营实训。'],
      ['珠三角（广州—佛山—东莞）', '时尚设计 / 智能制造 / 柔性供应链', '围绕服装和家纺产业，建设数字打版、柔性生产、品质管理与品牌传播项目。'],
      ['中西部纺织带（武汉—南昌—郑州）', '棉纺织 / 产业协同 / 绿色生产', '对接承接产业转移的制造基地，开展纺纱织造、设备维护、节能降耗与生产管理实训。'],
    ],
  },
  {
    chain: '新型显示与虚拟现实产业链',
    regions: [
      ['长三角（上海—苏州—南京—合肥）', '新型显示 / OLED / 车载显示', '对接面板、材料和终端企业，建设显示制造、光电检测、模组装调与质量分析实训。'],
      ['粤港澳大湾区（深圳—广州—惠州）', '显示模组 / VR终端 / 内容生态', '联合硬件和内容企业，开展模组测试、VR设备开发、交互设计与场景内容制作项目。'],
      ['成渝地区双城经济圈', '面板制造 / 光学器件 / 沉浸应用', '围绕显示制造和数字内容，建设光学检测、设备运维及沉浸式应用开发实训。'],
      ['闽赣区域（厦门—福州—南昌）', 'LED显示 / 光电材料 / 显示驱动', '对接LED与光电企业，开展器件检测、驱动调试、模组集成和应用展示项目。'],
    ],
  },
  {
    chain: '软件与数字安全产业链',
    regions: [
      ['京津冀（北京—天津）', '基础软件 / 网络安全 / 信创', '对接基础软件、安全和信创企业，建设系统适配、漏洞检测、安全运维与攻防演练项目。'],
      ['长三角（上海—杭州—南京）', '工业软件 / 云安全 / 数据安全', '联合软件和制造企业，开展工业软件实施、云平台安全、数据防护与应急响应实训。'],
      ['粤港澳大湾区（深圳—广州）', '应用软件 / 终端安全 / 跨境数字服务', '围绕终端与互联网应用，建设软件开发测试、终端防护和跨境业务合规案例。'],
      ['成渝地区双城经济圈', '信息安全 / 嵌入式软件 / 行业解决方案', '依托软件产业与制造场景，开展安全测评、嵌入式开发和行业系统实施运维项目。'],
    ],
  },
]

const expectedChains = [
  '数据要素与数字经济产业链',
  '高端装备与智能制造产业链',
  '基础设施与城市建设产业链',
  '医药生物与医疗健康产业链',
  '新能源与电力装备产业链',
  '智能物联与消费电子产业链',
  '石油化工产业链',
  '汽车与智能网联汽车产业链',
  '食品饮料产业链',
  '新一代信息基础设施产业链',
  '绿色环保与资源循环产业链',
  '新材料产业链',
  '空天装备与低空经济产业链',
  '机器人产业链',
  '人工智能产业链',
  '半导体与集成电路产业链',
  '纺织产业链',
  '新型显示与虚拟现实产业链',
  '软件与数字安全产业链',
]

if (groups.length !== 19 || groups.some((group) => group.regions.length !== 4)) {
  throw new Error('区域合作方向必须严格为 19 条产业链 × 每条 4 个区域')
}
if (JSON.stringify(groups.map(({ chain }) => chain)) !== JSON.stringify(expectedChains)) {
  throw new Error('产业链名称或顺序与项目标准口径不一致')
}

const rows = groups.flatMap((group) =>
  group.regions.map(([region, keyword, description]) => [group.chain, region, keyword, description]),
).map((row, index) => [index + 1, ...row])

const duplicateKeys = rows
  .map((row) => `${row[1]}::${row[2]}`)
  .filter((key, index, all) => all.indexOf(key) !== index)
if (duplicateKeys.length > 0) throw new Error(`发现重复的产业链—区域组合：${duplicateKeys.join('、')}`)
if (rows.some((row) => row.slice(1).some((value) => !String(value).trim()))) {
  throw new Error('表格存在空字段')
}

const workbook = Workbook.create()
const sheet = workbook.worksheets.add('区域合作方向')
sheet.showGridLines = false
sheet.freezePanes.freezeRows(4)
sheet.freezePanes.freezeColumns(2)

sheet.mergeCells('A1:E1')
sheet.getRange('A1').values = [['19个产业链区域合作方向表']]
sheet.mergeCells('A2:E2')
sheet.getRange('A2').values = [[
  '编制口径：每条产业链配置 4 个代表性区域；蓝色关键词用于前端标签展示，简要说明用于校企合作、课程项目或实训基地任务描述。',
]]
sheet.getRange('A4:E4').values = [['序号', '产业链', '区域', '蓝色关键词', '简要说明']]
sheet.getRange(`A5:E${rows.length + 4}`).values = rows

const table = sheet.tables.add(`A4:E${rows.length + 4}`, true, 'RegionCooperationTable')
table.style = 'TableStyleMedium2'
table.showFilterButton = true
table.showBandedRows = false

sheet.getRange(`A1:E${rows.length + 4}`).format.font = {
  name: 'Microsoft YaHei',
  size: 10,
  color: '#344054',
}
sheet.getRange('A1:E1').format = {
  fill: '#315FF4',
  font: { name: 'Microsoft YaHei', size: 18, bold: true, color: '#FFFFFF' },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  rowHeight: 38,
}
sheet.getRange('A2:E2').format = {
  fill: '#EEF4FF',
  font: { name: 'Microsoft YaHei', size: 10, italic: true, color: '#475467' },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
  wrapText: true,
  rowHeight: 34,
  borders: { preset: 'outside', style: 'thin', color: '#C7D7FE' },
}
sheet.getRange('A4:E4').format = {
  fill: '#163B8F',
  font: { name: 'Microsoft YaHei', size: 11, bold: true, color: '#FFFFFF' },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  rowHeight: 28,
}

const dataRange = sheet.getRange(`A5:E${rows.length + 4}`)
dataRange.format = {
  verticalAlignment: 'center',
  wrapText: true,
  rowHeight: 48,
  borders: {
    insideHorizontal: { style: 'thin', color: '#E5EAF2' },
    bottom: { style: 'thin', color: '#D0D5DD' },
  },
}
sheet.getRange(`A5:A${rows.length + 4}`).format = {
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  numberFormat: '0',
}
sheet.getRange(`B5:C${rows.length + 4}`).format = {
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
  wrapText: true,
}
sheet.getRange(`D5:D${rows.length + 4}`).format = {
  fill: '#F0F6FF',
  font: { name: 'Microsoft YaHei', size: 10, bold: true, color: '#2E63D2' },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
  wrapText: true,
}
sheet.getRange(`E5:E${rows.length + 4}`).format = {
  font: { name: 'Microsoft YaHei', size: 10, color: '#475467' },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
  wrapText: true,
}

for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
  const startRow = 5 + groupIndex * 4
  const endRow = startRow + 3
  const fill = groupIndex % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
  sheet.getRange(`A${startRow}:C${endRow}`).format.fill = fill
  sheet.getRange(`E${startRow}:E${endRow}`).format.fill = fill
  sheet.getRange(`B${startRow}:B${endRow}`).format.font = {
    name: 'Microsoft YaHei',
    size: 10,
    bold: true,
    color: '#1D2939',
  }
  sheet.getRange(`A${endRow}:E${endRow}`).format.borders = {
    bottom: { style: 'medium', color: '#9DB4E5' },
  }
}

sheet.getRange(`A1:A${rows.length + 4}`).format.columnWidth = 8
sheet.getRange(`B1:B${rows.length + 4}`).format.columnWidth = 30
sheet.getRange(`C1:C${rows.length + 4}`).format.columnWidth = 33
sheet.getRange(`D1:D${rows.length + 4}`).format.columnWidth = 34
sheet.getRange(`E1:E${rows.length + 4}`).format.columnWidth = 64

const tableCheck = await workbook.inspect({
  kind: 'table',
  range: `区域合作方向!A1:E${rows.length + 4}`,
  include: 'values,formulas',
  tableMaxRows: 12,
  tableMaxCols: 5,
  maxChars: 8000,
})
console.log(tableCheck.ndjson)

const errorCheck = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
})
console.log(errorCheck.ndjson)

const preview = await workbook.render({
  sheetName: '区域合作方向',
  range: `A1:E${rows.length + 4}`,
  scale: 0.8,
  format: 'png',
})
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await preview.arrayBuffer()))

const exported = await SpreadsheetFile.exportXlsx(workbook)
await exported.save(outputPath)

console.log(JSON.stringify({
  outputPath,
  chainCount: groups.length,
  regionCount: rows.length,
  uniquePairCount: new Set(rows.map((row) => `${row[1]}::${row[2]}`)).size,
}))
