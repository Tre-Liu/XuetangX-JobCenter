import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputDir = fileURLToPath(new URL('.', import.meta.url))

const rows = [
  {
    chain: '数据要素与数字经济产业链',
    value: '以数据采集、治理、流通和应用为主线，将分散数据转化为可用资产，支撑行业决策与数字服务增值。',
    entry: '围绕数据治理、数据要素流通、数据产品开发和合规应用，建设可追溯的数据项目实训。',
    feedback: '企业需要学生同时理解业务与数据，能完成采集清洗、质量校验、指标建模和合规交付。',
    suggestions: [
      ['建设数据治理项目', '以真实业务数据训练采集、清洗、标准化和质检。'],
      ['设计数据产品实训', '围绕专题库、指标服务和分析看板形成交付成果。'],
      ['强化合规与安全', '将授权、脱敏、审计和数据使用边界纳入评价。']
    ]
  },
  {
    chain: '高端装备与智能制造产业链',
    value: '从核心部件、控制系统到整机制造与运维服务形成价值闭环，重点通过智能化提升质量、效率和柔性。',
    entry: '以数控加工、激光应用、设备联网、MES执行和预测维护为切口，建设智能产线实训。',
    feedback: '企业看重机械、电气、自动化融合能力，要求学生能识图装调、优化工艺并快速排查设备故障。',
    suggestions: [
      ['搭建智能产线项目', '贯通工艺设计、加工、装配、检测和生产执行。'],
      ['强化装备联调能力', '训练机械装配、电气接线、参数设置和故障诊断。'],
      ['引入设备数据应用', '用状态数据开展效率分析、质量追溯和预测维护。']
    ]
  },
  {
    chain: '基础设施与城市建设产业链',
    value: '贯通规划、设计、施工、交付和运营，以工程建设形成公共服务与城市空间，并在运维阶段持续释放价值。',
    entry: '围绕数字设计、智慧施工、城市更新和基础设施运维，建设真实工程任务驱动的综合实训。',
    feedback: '企业需要学生理解图纸与施工组织，能管控质量安全、协调资源并使用数字平台完成过程交付。',
    suggestions: [
      ['建设工程项目任务库', '覆盖勘察、设计、施工、验收和运维典型任务。'],
      ['强化智慧建造应用', '融合BIM、物联监测、进度协同和质量追溯。'],
      ['布局城市更新实训', '围绕调查、检测、改造和设施运维组织项目。']
    ]
  },
  {
    chain: '医药生物与医疗健康产业链',
    value: '连接研发、原料、生产、诊断治疗与健康服务，以安全有效和全程质量追溯实现产品与服务价值。',
    entry: '围绕药品生产、医疗器械、体外诊断、医疗数字化和质量管理建设规范化实训。',
    feedback: '企业重视法规意识、洁净操作、质量记录和验证能力，要求学生严格按流程完成生产与检测。',
    suggestions: [
      ['建设医药质量项目', '训练原料验收、过程控制、检验和放行记录。'],
      ['强化器械检测实训', '围绕性能测试、校准、风险分析和注册资料。'],
      ['融合医疗数字化', '开展医疗数据治理、系统配置和应用支持任务。']
    ]
  },
  {
    chain: '新能源与电力装备产业链',
    value: '从材料器件、发电装备到储能、电网与能源服务协同，实现清洁能源生产、输配、消纳和稳定运行。',
    entry: '以光伏、风电、储能、电力电子和能源管理为重点，建设源网荷储协同实训。',
    feedback: '企业需要学生掌握电气安全、设备接线、参数调试和运行分析，能依据数据判断系统异常。',
    suggestions: [
      ['搭建源网荷储平台', '贯通发电、储能、负荷预测和能量调度。'],
      ['强化电力装备联调', '训练接线、保护配置、通信和故障排查。'],
      ['开展能源运营分析', '用运行数据评价效率、安全和经济性。']
    ]
  },
  {
    chain: '智能物联与消费电子产业链',
    value: '连接芯片、传感器、通信模组、智能终端与云端服务，以软硬件协同和用户体验实现持续增值。',
    entry: '围绕嵌入式开发、传感接入、无线通信、终端测试和物联网平台建设综合实训。',
    feedback: '企业偏好软硬件复合人才，要求学生能完成焊接装调、程序开发、通信联调和可靠性测试。',
    suggestions: [
      ['建设物联终端项目', '完成感知、控制、通信、云接入和应用展示。'],
      ['强化软硬件联调', '设置电路、固件、协议和平台协同故障任务。'],
      ['引入可靠性测试', '训练功能、功耗、环境适应和用户体验评价。']
    ]
  },
  {
    chain: '石油化工产业链',
    value: '以油气资源为起点，经炼化形成基础化学品和高附加值产品，并通过供应链服务连接终端市场。',
    entry: '以化工工艺、设备仪表、生产控制、安全环保和数字化工厂为主线建设流程实训。',
    feedback: '企业首先看重安全纪律和规范操作，也要求学生读懂流程图、监控参数并处理常见工艺异常。',
    suggestions: [
      ['建设化工流程仿真', '训练开停车、参数调节、物料平衡和异常处置。'],
      ['强化安全环保实训', '覆盖风险辨识、作业许可、泄漏处置和排放控制。'],
      ['开展设备仪表联动', '训练泵阀、换热设备、仪表和控制回路协同。']
    ]
  },
  {
    chain: '汽车与智能网联汽车产业链',
    value: '贯通材料、零部件、整车制造、车载软件与出行服务，智能化价值由车端、路端和云端协同形成。',
    entry: '围绕汽车电子、智能感知、网联通信、整车测试和轻量化技术建设跨专业实训。',
    feedback: '企业需要学生兼具机械、电气和软件基础，能按标准完成装调、诊断、测试和数据分析。',
    suggestions: [
      ['建设整车诊断项目', '训练传感、控制、通信和故障码分析。'],
      ['开展智能驾驶测试', '围绕感知、定位、决策和场景验证组织实训。'],
      ['强化车路云协同', '连接车载终端、路侧设备和云平台数据。']
    ]
  },
  {
    chain: '食品饮料产业链',
    value: '连接农产品与原辅料、加工制造、包装冷链和品牌渠道，以食品安全、稳定品质和市场响应实现价值。',
    entry: '围绕食品工艺、质量检测、智能生产、包装设计和冷链追溯建设生产型实训。',
    feedback: '企业重视卫生规范、过程控制和质量记录，要求学生能操作设备、判断异常并保障批次一致性。',
    suggestions: [
      ['建设食品生产项目', '贯通配方、加工、灌装、包装和清洁消毒。'],
      ['强化安全检测能力', '训练取样、微生物检测、理化分析和结果判定。'],
      ['建立全程追溯任务', '关联原料批次、工艺参数、检验和冷链数据。']
    ]
  },
  {
    chain: '新一代信息基础设施产业链',
    value: '由通信网络、数据中心、服务器、云计算和边缘节点共同提供连接与算力，是数字产业运行底座。',
    entry: '以5G、光通信、服务器、云平台、IDC运维和边缘计算为重点建设云网协同实训。',
    feedback: '企业需要学生会网络部署、设备配置、监控运维和故障定位，并具备安全与节能意识。',
    suggestions: [
      ['搭建云网协同环境', '贯通网络接入、算力资源、云服务和边缘节点。'],
      ['强化数据中心运维', '训练服务器部署、监控、备份、能耗和应急处置。'],
      ['开展通信故障排查', '设置链路、设备、协议和业务层典型故障。']
    ]
  },
  {
    chain: '绿色环保与资源循环产业链',
    value: '通过污染监测治理、节能降碳和废弃物资源化降低环境成本，并把再生资源重新送回生产体系。',
    entry: '围绕大气、水、固废治理、碳管理和资源循环利用建设监测治理一体化实训。',
    feedback: '企业需要学生能规范采样检测、操作治理设备、分析运行数据并编制合规记录与报告。',
    suggestions: [
      ['建设污染治理项目', '覆盖监测、工艺选择、设备运行和达标评价。'],
      ['开展碳管理实训', '训练排放核算、减排方案、监测和绩效复盘。'],
      ['强化资源循环应用', '围绕分类、再生处理、品质评价和产品利用。']
    ]
  },
  {
    chain: '新材料产业链',
    value: '从材料设计、制备、检测到中试量产和场景验证，材料性能决定下游产品的功能、可靠性与成本。',
    entry: '以配方设计、材料制备、性能测试、工艺优化和应用验证为主线建设研发型实训。',
    feedback: '企业重视实验规范、设备操作、数据分析和失效判断，要求学生持续记录并复现实验条件。',
    suggestions: [
      ['建设材料研发项目', '贯通配方、制备、表征、测试和性能优化。'],
      ['强化中试放大认知', '训练工艺窗口、质量波动和批次稳定性分析。'],
      ['开展应用验证任务', '以终端场景评价材料性能、可靠性和成本。']
    ]
  },
  {
    chain: '空天装备与低空经济产业链',
    value: '贯通关键部件、飞行器制造、运行保障和低空应用服务，装备可靠性与安全运营共同创造价值。',
    entry: '以无人机、航电飞控、任务载荷、低空运营和维修保障为重点建设场景实训。',
    feedback: '企业需要学生遵守空域和安全规范，能完成装调检测、任务规划、飞行操作和基础维护。',
    suggestions: [
      ['建设低空任务项目', '围绕巡检、测绘、物流等场景组织任务规划。'],
      ['强化飞行器装调', '训练结构、动力、航电、飞控和载荷联调。'],
      ['落实运行安全管理', '覆盖空域申请、风险评估、应急和飞行记录。']
    ]
  },
  {
    chain: '机器人产业链',
    value: '连接核心部件、本体制造、系统集成、场景应用和运维服务，最终价值取决于工艺适配与稳定运行。',
    entry: '围绕机械结构、运动控制、机器视觉、编程调试和系统集成建设机器人应用实训。',
    feedback: '企业需要学生兼具机械、电气和软件能力，能完成安装标定、任务编排、安全调试和维护。',
    suggestions: [
      ['建设机器人工作站', '贯通选型、安装、编程、联调和节拍优化。'],
      ['强化视觉与控制', '训练识别定位、轨迹规划和运动控制协同。'],
      ['对接行业应用场景', '围绕搬运、焊接、装配和巡检形成交付项目。']
    ]
  },
  {
    chain: '人工智能产业链',
    value: '以数据、算法、模型和算力平台为基础，通过视觉、语音及行业应用把智能能力转化为产品与服务。',
    entry: '围绕数据处理、模型训练评测、工程部署和视觉语音应用建设端到端项目。',
    feedback: '企业关注数据、模型与工程协同能力，要求学生能评估效果、定位问题并理解业务使用边界。',
    suggestions: [
      ['建设端到端AI项目', '贯通数据、训练、评测、部署和应用反馈。'],
      ['强化模型工程能力', '训练版本管理、性能优化、监控和迭代。'],
      ['落实负责任应用', '将隐私、公平、可解释和安全边界纳入评价。']
    ]
  },
  {
    chain: '半导体与集成电路产业链',
    value: '贯通材料、设备、芯片设计、晶圆制造、封装测试和终端应用，技术密度与良率决定产业价值。',
    entry: '以芯片设计认知、半导体工艺、封装测试、设备维护和洁净生产建设实训。',
    feedback: '企业重视精细操作、工艺纪律、静电与洁净规范，要求学生能分析测试数据和良率异常。',
    suggestions: [
      ['建设芯片制造认知线', '贯通设计、晶圆工艺、封装和测试关键环节。'],
      ['强化封装测试实训', '训练装片、键合、检测、分选和失效分析。'],
      ['落实洁净生产规范', '把静电防护、污染控制和工艺记录纳入考核。']
    ]
  },
  {
    chain: '纺织产业链',
    value: '从纤维、纺纱、织造、染整到服装家纺和品牌渠道，品质、交期与绿色生产共同影响价值实现。',
    entry: '围绕智能纺织生产、染整工艺、质量检测、数字设计和绿色制造建设实训。',
    feedback: '企业需要学生掌握设备操作、工艺调整、色差与质量控制，并能快速响应小批量订单。',
    suggestions: [
      ['建设纺织生产项目', '贯通纺纱、织造、染整、检测和订单交付。'],
      ['强化质量与色彩控制', '训练纱线、面料性能检测和色差管理。'],
      ['推进绿色制造实训', '围绕节水、节能、清洁生产和废料回用。']
    ]
  },
  {
    chain: '新型显示与虚拟现实产业链',
    value: '连接显示材料、面板模组、终端设备、内容制作和交互应用，以视觉体验和场景服务形成价值。',
    entry: '围绕显示检测、光学调校、三维内容、交互开发和虚拟现实应用建设融合实训。',
    feedback: '企业需要学生理解光电与软件协同，能完成测试校准、内容适配、交互联调和体验优化。',
    suggestions: [
      ['建设显示检测项目', '训练亮度、色彩、均匀性和可靠性测试。'],
      ['开展虚拟内容制作', '贯通三维建模、场景搭建、动画和资源优化。'],
      ['强化交互体验开发', '围绕空间定位、交互逻辑和用户测试迭代。']
    ]
  },
  {
    chain: '软件与数字安全产业链',
    value: '从基础软件、开发工具到行业应用和安全服务，持续通过研发、交付、运维和防护保障数字业务运行。',
    entry: '围绕国产软件应用、安全开发、网络防护、区块链和系统运维建设攻防结合实训。',
    feedback: '企业需要学生具备编码、需求、测试和安全意识，能发现漏洞、处置事件并编写规范文档。',
    suggestions: [
      ['建设安全开发项目', '贯通需求、编码、测试、发布和漏洞修复。'],
      ['开展网络攻防实训', '训练资产识别、风险验证、监测和应急响应。'],
      ['强化国产软件适配', '围绕部署迁移、兼容测试和运维支持组织任务。']
    ]
  }
]

const charCount = (value) => [...value].length
const violations = []
for (const [index, row] of rows.entries()) {
  for (const key of ['value', 'entry', 'feedback']) {
    if (charCount(row[key]) > 100) violations.push(`第${index + 1}行 ${key} 超过100字：${charCount(row[key])}`)
  }
  for (const [suggestionIndex, [title, content]] of row.suggestions.entries()) {
    if (charCount(title) > 25) violations.push(`第${index + 1}行 建议${suggestionIndex + 1}标题超过25字：${charCount(title)}`)
    if (charCount(content) > 50) violations.push(`第${index + 1}行 建议${suggestionIndex + 1}内容超过50字：${charCount(content)}`)
  }
}
if (rows.length !== 19) violations.push(`产业链数量不是19：${rows.length}`)
if (violations.length) throw new Error(violations.join('\n'))

const workbook = Workbook.create()
const sheet = workbook.worksheets.add('产业链内容表')
sheet.showGridLines = false

sheet.getRange('A1:J1').merge()
sheet.getRange('A1').values = [['19条标准产业链内容生成表']]
sheet.getRange('A2:J2').merge()
sheet.getRange('A2').values = [['名单及顺序来源：产业链标准化成果 industry_chain_standardization_summary.csv。所有段落与建议均已按字符数上限校验。']]

const headers = [
  '产业链', '价值流判断', '建设切入点', '企业反馈',
  '建议1标题', '建议1内容', '建议2标题', '建议2内容', '建议3标题', '建议3内容'
]
sheet.getRange('A3:J3').values = [headers]

const matrix = rows.map((row) => [
  row.chain,
  row.value,
  row.entry,
  row.feedback,
  row.suggestions[0][0], row.suggestions[0][1],
  row.suggestions[1][0], row.suggestions[1][1],
  row.suggestions[2][0], row.suggestions[2][1]
])
sheet.getRange('A4:J22').values = matrix

sheet.getRange('A1:J1').format = {
  fill: '#2F6BFF',
  font: { bold: true, color: '#FFFFFF', size: 16 },
  horizontalAlignment: 'center',
  verticalAlignment: 'center'
}
sheet.getRange('A1:J1').format.rowHeight = 34

sheet.getRange('A2:J2').format = {
  fill: '#EAF1FF',
  font: { color: '#34507A', size: 10 },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
  wrapText: true
}
sheet.getRange('A2:J2').format.rowHeight = 30

sheet.getRange('A3:J3').format = {
  fill: '#DCE8FF',
  font: { bold: true, color: '#173B73', size: 10 },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  wrapText: true,
  borders: { preset: 'all', style: 'thin', color: '#AEC4E8' }
}
sheet.getRange('A3:J3').format.rowHeight = 32

sheet.getRange('A4:J22').format = {
  font: { color: '#24344D', size: 10 },
  horizontalAlignment: 'left',
  verticalAlignment: 'top',
  wrapText: true,
  borders: {
    insideHorizontal: { style: 'thin', color: '#DCE5F2' },
    bottom: { style: 'thin', color: '#B8C9E2' }
  }
}
sheet.getRange('A4:A22').format = {
  fill: '#F1F6FF',
  font: { bold: true, color: '#2759A5', size: 10 },
  horizontalAlignment: 'left',
  verticalAlignment: 'top',
  wrapText: true,
  borders: {
    insideHorizontal: { style: 'thin', color: '#DCE5F2' },
    bottom: { style: 'thin', color: '#B8C9E2' }
  }
}
sheet.getRange('A:A').format.columnWidth = 23
sheet.getRange('B:D').format.columnWidth = 34
sheet.getRange('E:E').format.columnWidth = 20
sheet.getRange('F:F').format.columnWidth = 27
sheet.getRange('G:G').format.columnWidth = 20
sheet.getRange('H:H').format.columnWidth = 27
sheet.getRange('I:I').format.columnWidth = 20
sheet.getRange('J:J').format.columnWidth = 27
sheet.getRange('A4:J22').format.rowHeight = 80

sheet.freezePanes.freezeRows(3)
sheet.freezePanes.freezeColumns(1)

const table = sheet.tables.add('A3:J22', true, 'IndustryChainInsightsTable')
table.style = 'TableStyleMedium2'
table.showFilterButton = true
table.showBandedRows = true

const inspect = await workbook.inspect({
  kind: 'table',
  range: '产业链内容表!A1:J22',
  include: 'values,formulas',
  tableMaxRows: 22,
  tableMaxCols: 10,
  maxChars: 12000
})
await fs.writeFile(`${outputDir}inspect-summary.ndjson`, inspect.ndjson, 'utf8')

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan'
})
await fs.writeFile(`${outputDir}formula-errors.ndjson`, errors.ndjson, 'utf8')

const preview = await workbook.render({
  sheetName: '产业链内容表',
  range: 'A1:J22',
  scale: 0.8,
  format: 'png'
})
await fs.writeFile(`${outputDir}preview.png`, new Uint8Array(await preview.arrayBuffer()))

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(`${outputDir}19条标准产业链内容表.xlsx`)

const lengthSummary = rows.map((row, index) => ({
  row: index + 1,
  chain: row.chain,
  value: charCount(row.value),
  entry: charCount(row.entry),
  feedback: charCount(row.feedback),
  suggestionTitles: row.suggestions.map(([title]) => charCount(title)),
  suggestionContents: row.suggestions.map(([, content]) => charCount(content))
}))
await fs.writeFile(`${outputDir}length-check.json`, JSON.stringify(lengthSummary, null, 2), 'utf8')

console.log(JSON.stringify({ rows: rows.length, violations, output: `${outputDir}19条标准产业链内容表.xlsx` }, null, 2))
