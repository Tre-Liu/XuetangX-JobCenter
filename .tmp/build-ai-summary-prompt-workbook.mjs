import fs from 'node:fs/promises'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputDir = '/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/019fd4d9-976f-7970-8ae0-1e99774a400f'
const outputPath = `${outputDir}/产业调研八页面AI总结提示词-业务版.xlsx`
const previewDir = `${outputDir}/previews`

const colors = {
  navy: '#17365D',
  blue: '#2F6BFF',
  blueLight: '#EAF1FF',
  blueLighter: '#F5F8FF',
  green: '#00A67D',
  greenLight: '#EAF8F4',
  border: '#D6E0F2',
  text: '#24324A',
  muted: '#64748B',
  white: '#FFFFFF',
}

const pageConfigs = [
  ['产业链图谱', '当前选择的产业链', '当前产业链、产业环节、关键节点、代表企业、关联行业、代表岗位以及上下游关联关系。', '研判产业链完整度与发展阶段，分析上下游协同、关键节点、薄弱环节和专业建设承接方向。', '建议按关键产业节点组织岗位画像、课程和项目化实训。'],
  ['区域产业分析', '当前产业链与当前区域', '当前产业链、所选省市区、企业区域分布、重点城市与园区、产业环节分布、区域排名以及合作方向。', '研判区域集聚与扩散趋势，分析核心城市、区域梯度、合作优先区和实训基地布局方向。', '建议优先在企业与工程场景集聚区域拓展校企合作和实训基地。'],
  ['产业政策库', '当前选择的产业链', '政策名称、政策层级、发布单位、发布日期、政策主题、主要内容、产业影响以及实施任务。', '研判政策导向与演进重点，分析高频主题、层级联动、政策转化窗口和课程标准承接方向。', '建议把高频政策要求转化为课程标准和项目化实训任务。'],
  ['产业企业库', '当前产业分类', '代表企业、所在区域、所属产业环节、主要产品与服务、关联产业节点、典型岗位以及可用于校企合作的资源。', '研判企业生态与技术场景成熟度，分析企业类型、产业环节、合作资源和共建价值。', '建议优先选择岗位任务清晰、技术场景可教学且资源可共建的企业。'],
  ['岗位画像分析', '当前岗位群', '代表岗位、岗位层级、典型工作任务、能力要求、证书要求、薪资水平、需求热度以及所属产业环节。', '研判岗位演变与复合化方向，分析任务、能力、证书、层级结构和课程重组重点。', '建议按典型工作任务重组课程内容、能力训练和证书映射。'],
  ['招聘需求趋势', '当前岗位群', '招聘岗位数量、近一年需求变化、热门岗位、高频技能、薪资水平、重点招聘城市以及岗位间的增长差异。', '研判招聘需求增长、稳定或分化趋势，分析热门岗位、高频技能、城市薪资结构和培养优先级。', '建议优先建设需求增长快且课程可承接的岗位能力包。'],
  ['新岗位新技术', '当前岗位群', '新技术方向、技术应用阶段、衍生岗位、岗位紧缺程度、能力缺口、相关课程以及现有培养承接情况。', '研判技术成熟度与岗位衍生方向，分析紧缺岗位、能力缺口、课程滞后和提前布局重点。', '建议把高紧缺技术方向提前纳入课程和综合实训。'],
  ['岗培优化建议', '当前专业人才培养方案', '热门岗位与产业代表岗位、岗位核心能力、培养目标、毕业要求、课程体系、现有能力覆盖、培养差距以及新增或强化建议。', '对照岗位能力要求诊断培养目标、毕业要求和课程体系的承接情况，识别培养短板并提出一体化优化建议。', '建议同步优化培养目标、毕业要求、课程内容、项目化实训和岗位能力评价。'],
]

const standalonePagePrompt = ([pageName, analysisObject, pageInformation, focus, recommendation]) => [
  '你是一个产教结合专家。',
  `请阅读“${pageName}”页面中展示的业务信息，当前分析对象为${analysisObject}。`,
  `重点读取：${pageInformation}`,
  `判断维度：${focus}`,
  '请先形成研判结论，再选取页面信息作为依据，不要逐项复述页面指标。',
  '只根据当前页面展示的业务信息进行分析，不补写页面之外的事实；证据不足时使用审慎措辞。',
  '不要描述数据采集、清洗、去重、统计口径或系统处理过程，只输出可直接支撑决策的业务判断。',
  '数字继续由页面指标和图表展示，总结中不堆砌数字或附加孤立的统计标签。',
  `建设启示方向：${recommendation}`,
  '请输出当前分析对象名称，并依次给出四条内容：总体研判、结构特征、机会与问题、建设启示。每条不超过 140 字。',
].join('\n')

const outputExamples = [
  ['产业链图谱', 'industry-chain', '人工智能产业链', '人工智能产业链结构完整，已形成“上游基础底座—中游模型与感知工具—下游行业应用与AI服务”的全链条格局，下游是当前主要价值承载端。', '产业资源明显向下游集中，云计算服务是当前核心节点；中游相对薄弱，产业链的环节均衡度仍需提升。', '产业的主要增长机会在行业智能应用与AI服务规模化，核心短板是中游模型、感知与平台工具供给相对薄弱，可能制约下游场景的持续复制。', '建议按关键产业节点组织岗位画像、课程和项目化实训。', 'fallback'],
  ['区域产业分析', 'industry-region', '智能建造产业链 / 辽宁', '产业空间布局呈现以辽宁为核心、向其他区域梯度扩散的集聚格局。', '辽宁、北京、天津构成当前产业承载的主要区域层级，头部地区在企业、项目和服务资源上具有更强集聚效应。', '头部区域适合深化产教协同，次级区域更适合围绕特色工程场景形成差异化合作入口。', '建议优先在企业与工程场景集聚区域拓展校企合作和实训基地。', 'fallback'],
  ['产业政策库', 'industry-policy', '智能建造产业链', '政策导向正由单项技术推广转向数字化与BIM、智能施工、装配式与工业化协同推进。', '国家与地方政策形成上下联动，既明确产业发展方向，也通过行动方案推动区域和项目落地。', '政策重点已从方向倡导延伸到标准、示范和应用落地，课程标准与真实项目对接进入较明确的转化窗口。', '建议把高频政策要求转化为课程标准和项目化实训任务。', 'fallback'],
  ['产业企业库', 'industry-company', '智能建造产业链', '企业生态已由单一产品供给延伸至数字设计与BIM、智能施工与现场管理、智慧运维与绿色低碳等多类工程场景，产业服务呈现平台化与协同化趋势。', '代表企业同时覆盖工具平台、工程实施与场景服务，产业竞争力更多取决于跨环节交付能力。', '企业场景多样为校企合作提供了分层入口，但需要优先筛选岗位任务清晰、数据可教学和项目可复用的合作对象。', '建议优先选择岗位任务清晰、技术场景可教学且资源可共建的企业。', 'fallback'],
  ['岗位画像分析', 'job-portrait', '智能建造工程岗位群', '岗位需求已由数字设计与BIM延伸至装配建造、智能装备与物联等工程场景，呈现跨环节复合化发展。', '中级岗位构成当前主要就业入口，能力结构则由软件操作扩展到工程知识、数字工具与现场协同。', '智能装备、工程数据和全过程协同正在形成新的岗位增长点，人才培养需补足跨场景迁移能力。', '建议按典型工作任务重组课程内容、能力训练和证书映射。', 'fallback'],
  ['招聘需求趋势', 'job-demand', '智能建造工程岗位群', '招聘需求整体保持增长，市场正在持续释放数字化工程岗位机会。', 'BIM深化设计工程师、智慧工地工程师构成需求较强的岗位入口，BIM协同、施工数据分析等能力成为招聘筛选的关键条件。', '需求增长为专业扩容提供依据，但岗位之间增长速度不同，应避免按总体增幅平均配置课程资源。', '建议优先建设需求增长快且课程可承接的岗位能力包。', 'fallback'],
  ['新岗位新技术', 'job-forecast', '智能建造工程岗位群', '新技术正由试点探索走向加速应用，并持续衍生新的工程岗位。', '建筑机器人、数字孪生等技术方向正在对应形成建筑机器人运维工程师、数字孪生应用工程师等岗位，技术、任务与岗位分工的映射更加清晰。', '紧缺岗位增长快于课程承接速度，当前主要缺口在于师资更新、设备条件和跨技术综合实训。', '建议把高紧缺技术方向提前纳入课程和综合实训。', 'fallback'],
  ['岗培优化建议', 'training-optimization', '智能建造工程专业人才培养方案', '当前培养方案已覆盖工程基础与施工管理，但对BIM协同、智慧工地、智能装备、监测数据等热门岗位能力的承接仍需加强。', '培养差距主要集中在模型数据应用、现场物联管理、智能装备联调和跨岗位项目交付，培养目标、毕业要求与课程体系尚未形成完整映射。', '热门岗位和产业代表岗位为培养方案优化提供了明确依据，但若缺少真实项目、设备条件和岗位能力评价，新增内容容易停留在课程名称层面。', '建议同步调整培养目标和毕业要求，强化BIM深化、智慧工地、建筑机器人、智能检测监测、装配式建造与绿色智慧运维课程及综合实训。', 'fallback'],
]

const workbook = Workbook.create()

const applyBase = (sheet) => {
  sheet.showGridLines = false
}

const title = (sheet, range, text) => {
  const target = sheet.getRange(range)
  target.merge()
  target.values = [[text]]
  target.format = {
    fill: colors.navy,
    font: { name: 'Microsoft YaHei', size: 20, bold: true, color: colors.white },
    verticalAlignment: 'center',
    horizontalAlignment: 'left',
  }
  target.format.rowHeight = 38
}

const section = (sheet, range, text) => {
  const target = sheet.getRange(range)
  target.merge()
  target.values = [[text]]
  target.format = {
    fill: colors.blue,
    font: { name: 'Microsoft YaHei', size: 12, bold: true, color: colors.white },
    verticalAlignment: 'center',
    horizontalAlignment: 'left',
  }
  target.format.rowHeight = 26
}

const styleHeader = (range) => {
  range.format = {
    fill: colors.blue,
    font: { name: 'Microsoft YaHei', size: 10, bold: true, color: colors.white },
    wrapText: true,
    verticalAlignment: 'center',
    horizontalAlignment: 'left',
    borders: { preset: 'all', style: 'thin', color: colors.border },
  }
}

const styleBody = (range) => {
  range.format = {
    font: { name: 'Microsoft YaHei', size: 10, color: colors.text },
    wrapText: true,
    verticalAlignment: 'top',
    horizontalAlignment: 'left',
    borders: { preset: 'all', style: 'thin', color: colors.border },
  }
}

const promptSheet = workbook.worksheets.add('输入提示词')
applyBase(promptSheet)
title(promptSheet, 'A1:C2', '八个页面业务化 AI 总结提示词')
promptSheet.getRange('A3:C3').merge()
promptSheet.getRange('A3:C3').values = [['每个页面使用一条独立提示词，直接说明要读取的页面业务信息、分析重点和输出内容，不展示技术字段。']]
promptSheet.getRange('A3:C3').format = { fill: colors.blueLight, font: { color: colors.text, italic: true }, wrapText: true, verticalAlignment: 'center' }
promptSheet.getRange('A3:C3').format.rowHeight = 30

section(promptSheet, 'A5:C5', '八页面完整业务提示词')
promptSheet.getRange('A6:C14').values = [
  ['页面名称', '完整提示词', '需要读取的页面业务信息'],
  ...pageConfigs.map((config) => [config[0], standalonePagePrompt(config), config[2]]),
]
styleHeader(promptSheet.getRange('A6:C6'))
styleBody(promptSheet.getRange('A7:C14'))
promptSheet.getRange('B7:B14').format.font = { name: 'Microsoft YaHei', size: 10, color: colors.text }
for (let row = 7; row <= 14; row += 1) {
  promptSheet.getRange(`A${row}:C${row}`).format.fill = row % 2 === 0 ? colors.white : colors.blueLighter
  promptSheet.getRange(`A${row}:C${row}`).format.rowHeight = 145
}
promptSheet.getRange('A16:C17').merge()
promptSheet.getRange('A16:C17').values = [['使用方式：进入某个页面时，读取该页面已展示的业务内容，并使用对应页面的完整提示词生成顶部 AI 总结。']]
promptSheet.getRange('A16:C17').format = { fill: '#FFF7E6', font: { color: '#8A5200' }, wrapText: true, verticalAlignment: 'center' }
promptSheet.getRange('A16:C17').format.rowHeight = 30
promptSheet.getRange('A:A').format.columnWidth = 18
promptSheet.getRange('B:B').format.columnWidth = 105
promptSheet.getRange('C:C').format.columnWidth = 60
promptSheet.freezePanes.freezeRows(6)

const parameterSheet = workbook.worksheets.add('业务信息说明')
applyBase(parameterSheet)
title(parameterSheet, 'A1:D2', '八页面 AI 总结业务信息说明')

section(parameterSheet, 'A4:D4', '1. 通用分析原则')
parameterSheet.getRange('A5:B10').values = [
  ['原则', '说明'],
  ['结论优先', '先判断页面反映的业务状态，再选择页面信息作为依据，不按顺序复述指标。'],
  ['仅用页面信息', '只根据当前页面已展示的产业、专业、岗位、企业、政策等信息进行分析。'],
  ['审慎判断', '页面证据不足时使用审慎措辞，不补写页面之外的趋势、原因或发展阶段。'],
  ['业务表达', '不描述采集、清洗、统计或系统处理过程，只输出可用于决策的业务结论。'],
  ['固定结构', '依次输出总体研判、结构特征、机会与问题、建设启示四条内容。'],
]
styleHeader(parameterSheet.getRange('A5:B5'))
styleBody(parameterSheet.getRange('A6:B10'))
parameterSheet.getRange('A6:B10').format.rowHeight = 44

section(parameterSheet, 'A12:D12', '2. 各页面需要读取的业务信息')
parameterSheet.getRange('A13:D21').values = [
  ['页面', '当前分析对象', '需要读取的页面业务信息', '重点判断'],
  ...pageConfigs.map((config) => [config[0], config[1], config[2], config[3]]),
]
styleHeader(parameterSheet.getRange('A13:D13'))
styleBody(parameterSheet.getRange('A14:D21'))
for (let row = 14; row <= 21; row += 1) {
  parameterSheet.getRange(`A${row}:D${row}`).format.fill = row % 2 === 0 ? colors.blueLighter : colors.white
  parameterSheet.getRange(`A${row}:D${row}`).format.rowHeight = 64
}

section(parameterSheet, 'A24:D24', '3. 输出内容')
parameterSheet.getRange('A25:B30').values = [
  ['输出项', '业务含义'],
  ['当前分析对象', '当前页面选择的产业链、区域、专业、产业分类或岗位群。'],
  ['总体研判', '页面反映的整体状态、发展趋势或主要特征。'],
  ['结构特征', '页面中最重要的层级、区域、环节、岗位或资源结构。'],
  ['机会与问题', '值得关注的增长机会、短板、错位或潜在风险。'],
  ['建设启示', '面向专业建设、课程、实训、校企合作或人才培养的可执行建议。'],
]
styleHeader(parameterSheet.getRange('A25:B25'))
styleBody(parameterSheet.getRange('A26:B30'))
parameterSheet.getRange('A26:B30').format.rowHeight = 42
parameterSheet.getRange('A:A').format.columnWidth = 22
parameterSheet.getRange('B:B').format.columnWidth = 48
parameterSheet.getRange('C:C').format.columnWidth = 62
parameterSheet.getRange('D:D').format.columnWidth = 62
parameterSheet.freezePanes.freezeRows(3)

const outputSheet = workbook.worksheets.add('输出样例')
applyBase(outputSheet)
title(outputSheet, 'A1:F2', '八页面 AI 总结输出样例')
outputSheet.getRange('A3:F3').merge()
outputSheet.getRange('A3:F3').values = [['每个页面输出当前分析对象名称，以及总体研判、结构特征、机会与问题、建设启示四条业务结论。']]
outputSheet.getRange('A3:F3').format = { fill: colors.blueLight, font: { color: colors.text, italic: true }, wrapText: true, verticalAlignment: 'center' }
outputSheet.getRange('A3:F3').format.rowHeight = 30
outputSheet.getRange('A5:F13').values = [
  ['页面', '当前分析对象', '总体研判', '结构特征', '机会与问题', '建设启示'],
  ...outputExamples.map((item) => [item[0], item[2], item[3], item[4], item[5], item[6]]),
]
styleHeader(outputSheet.getRange('A5:F5'))
styleBody(outputSheet.getRange('A6:F13'))
for (let row = 6; row <= 13; row += 1) {
  outputSheet.getRange(`A${row}:F${row}`).format.fill = row % 2 === 0 ? colors.blueLighter : colors.white
  outputSheet.getRange(`A${row}:F${row}`).format.rowHeight = 95
}
outputSheet.getRange('A:A').format.columnWidth = 18
outputSheet.getRange('B:B').format.columnWidth = 28
outputSheet.getRange('C:E').format.columnWidth = 48
outputSheet.getRange('F:F').format.columnWidth = 42
outputSheet.freezePanes.freezeRows(5)

await fs.mkdir(outputDir, { recursive: true })
await fs.mkdir(previewDir, { recursive: true })

for (const sheetName of ['输入提示词', '业务信息说明', '输出样例']) {
  const preview = await workbook.render({ sheetName, autoCrop: 'all', scale: 1.25, format: 'png' })
  await fs.writeFile(`${previewDir}/${sheetName}.png`, new Uint8Array(await preview.arrayBuffer()))
}

const workbookCheck = await workbook.inspect({
  kind: 'workbook,sheet,table',
  maxChars: 12000,
  tableMaxRows: 8,
  tableMaxCols: 8,
  tableMaxCellChars: 300,
})
console.log(workbookCheck.ndjson)

const errorCheck = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
})
console.log(errorCheck.ndjson)

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)
console.log(`SAVED ${outputPath}`)
