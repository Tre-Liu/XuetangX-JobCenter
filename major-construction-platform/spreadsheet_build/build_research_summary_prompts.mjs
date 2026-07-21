import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'
import {
  RESEARCH_SUMMARY_PAGE_CONFIGS,
  RESEARCH_SUMMARY_PAGE_KEYS,
  RESEARCH_SUMMARY_SYSTEM_PROMPT,
  buildFallbackResearchSummary,
} from '../src/app/research-summary-core.js'
import { RESEARCH_SUMMARY_PAGE_NAMES, buildResearchSummaryContext } from '../src/app/research-summary-contexts.js'

const outputDir = fileURLToPath(new URL('../outputs/019f6a57-a0d3-7ad1-a6af-3a5be21110df/', import.meta.url))
const outputPath = `${outputDir}/产业调研九页面AI总结提示词.xlsx`

const colors = {
  navy: '#17345F',
  blue: '#2F6BFF',
  paleBlue: '#EAF1FF',
  paleCyan: '#EAFBFA',
  palePurple: '#F3EDFF',
  ink: '#1B2B46',
  muted: '#61718B',
  line: '#DCE5F2',
  white: '#FFFFFF',
  green: '#0E9F75',
}

const pageInputFields = {
  'industry-chain': 'subject，facts（企业/节点/阶段），groups.产业阶段，groups.产业节点',
  'industry-region': 'subject（产业链/省/市/区），facts（覆盖省份/企业/城市），groups.区域排名',
  'industry-policy': 'subject（当前产业链），facts（政策数/层级/日期），groups.政策条目',
  'industry-company': 'subject（当前分类），facts（总量/分类数），groups.代表企业',
  'professional-map': 'subject（专业），facts（省份/最多布点/匹配样本），groups.布点与匹配',
  'professional-trend': 'subject（专业），facts（院校/招生/撤销），groups.历年趋势',
  'job-portrait': 'subject（岗位或岗位群），facts（岗位/任务/能力/证书），groups.代表岗位',
  'job-demand': 'subject（岗位群），facts（样本/薪资/城市），groups.热门岗位/技能/趋势',
  'job-forecast': 'subject（岗位群），facts（方向/新岗位/紧缺），groups.技术/岗位/课程映射',
}

const pagePrompt = (pageKey) => {
  const config = RESEARCH_SUMMARY_PAGE_CONFIGS[pageKey]
  return [
    `任务：研判“${RESEARCH_SUMMARY_PAGE_NAMES[pageKey]}”当前页面反映的发展状态。`,
    `判断维度：${config.focus}`,
    '只输出自然语言判断，数字保留在页面 KPI 和图表；不输出括号证据或孤立统计标签。',
    '只写产业或岗位的最终研判，禁止把数据标准化、清洗、去重、来源关系、覆盖量、待映射和统计口径当作结论。',
    '四条依次为总体研判、结构特征、机会与问题、建设启示。',
    'title 必须直接使用输入 subject，不附加分析类型、分隔符或其他说明。',
    '数据边界：只使用输入中的 subject、facts、groups 和 constraints，不使用外部知识补写事实。',
    `建设启示：围绕“${config.recommendation}”给出可执行建议。`,
    '输出规则：只输出 JSON，title 使用当前对象名称且不超过 40 字，items 固定 4 条，每条不超过 140 字，不输出 Markdown 或 HTML。',
  ].join('\n')
}

const sampleFacts = {
  'industry-chain': [{ label: '产业企业', value: 32403, evidence: '当前产业企业资产库' }, { label: '细分节点', value: 109, evidence: '覆盖上中下游' }, { label: '产业阶段', value: 3, evidence: '上游、中游、下游' }],
  'industry-region': [{ label: '覆盖省份', value: 31, evidence: '全国样本' }, { label: '重点城市', value: 18, evidence: '产业集聚城市' }],
  'industry-policy': [{ label: '政策数量', value: 9, evidence: '当前产业链' }, { label: '政策层级', value: 2, evidence: '国家与地方' }],
  'industry-company': [{ label: '企业库总量', value: 30, evidence: '当前页面企业资产' }, { label: '当前分类企业', value: 18, evidence: '不受搜索与分页影响' }],
  'professional-map': [{ label: '覆盖省份', value: 14, evidence: '专业布点排名样本' }, { label: '最高布点', value: '广东42所', evidence: '当前排名第一' }],
  'professional-trend': [{ label: '2025年全国开设院校', value: '356所', evidence: '较上期新增45所' }, { label: '年度招生规模', value: '5.8万人', evidence: '同比增长8.4%' }],
  'job-portrait': [{ label: '岗位', value: '12个', evidence: '当前岗位画像库' }, { label: '典型工作任务', value: '68项', evidence: '页面统计' }],
  'job-demand': [{ label: '岗位样本', value: 12680, evidence: '变化 +18%' }, { label: '重点城市', value: 18, evidence: '沈阳/大连/北京/天津' }],
  'job-forecast': [{ label: '技术方向', value: 8, evidence: '当前新技术方向' }, { label: '新岗位', value: 8, evidence: '当前预测岗位' }],
}

const sampleSubjects = {
  'industry-chain': '人工智能产业链',
  'industry-region': '智能建造产业链 / 辽宁',
  'industry-policy': '智能建造产业链',
  'industry-company': '智能建造产业链',
  'professional-map': '智能建造工程专业',
  'professional-trend': '智能建造工程专业',
  'job-portrait': '智能建造工程岗位群',
  'job-demand': '智能建造工程岗位群',
  'job-forecast': '智能建造工程岗位群',
}

const sampleGroups = {
  'industry-chain': [
    { name: '产业阶段', items: [{ name: '上游', stage: 'upstream', enterpriseCount: 10926 }, { name: '中游', stage: 'midstream', enterpriseCount: 6487 }, { name: '下游', stage: 'downstream', enterpriseCount: 16962 }] },
    { name: '产业节点', items: [{ name: '云计算服务', stage: 'upstream', enterpriseCount: 5302 }, { name: '数据分析', stage: 'midstream', enterpriseCount: 3096 }, { name: '消费电子设备', stage: 'downstream', enterpriseCount: 4022 }] },
  ],
  'industry-region': [{ name: '区域排名', items: [{ name: '辽宁', count: 286 }, { name: '北京', count: 214 }, { name: '天津', count: 152 }] }],
  'industry-policy': [{ name: '政策条目', items: [{ title: '智能建造与建筑工业化协同发展', level: '国家级', summary: '数字化、工业化、绿色化协同推进' }, { title: '建筑业数字化转型行动方案', level: '地方级', summary: '推广BIM和智慧工地' }] }],
  'industry-company': [{ name: '代表企业', items: [{ name: '甲企业', products: 'BIM协同设计平台' }, { name: '乙企业', products: '智慧工地施工管理平台' }, { name: '丙企业', products: '数字孪生运维平台' }] }],
  'professional-map': [{ name: '省份布点', items: [{ province: '广东', count: 42 }, { province: '江苏', count: 35 }] }, { name: '区域匹配', items: [{ region: '华南', industryShare: 28, majorShare: 18 }, { region: '东北', industryShare: 12, majorShare: 19 }] }],
  'professional-trend': [{ name: '历年开设', items: [{ year: 2019, count: 35 }, { year: 2022, count: 168 }, { year: 2025, count: 356 }] }],
  'job-portrait': [{ name: '代表岗位', items: [{ name: 'BIM建模工程师', level: '初级' }, { name: '装配式建筑深化设计师', level: '中级' }, { name: '建筑机器人应用工程师', level: '中级' }] }],
  'job-demand': [{ name: '热门岗位', items: [{ name: 'BIM深化设计工程师', demand: 96 }, { name: '智慧工地工程师', demand: 88 }] }, { name: '高频技能', items: [{ name: 'BIM协同', value: 92 }, { name: '施工数据分析', value: 86 }] }, { name: '近12月趋势', items: [{ month: '1月', value: 62 }, { month: '12月', value: 106 }] }],
  'job-forecast': [{ name: '技术方向', items: [{ name: '建筑机器人', stage: '快速发展' }, { name: '数字孪生', stage: '规模应用' }] }, { name: '新岗位', items: [{ name: '建筑机器人运维工程师', urgency: '高' }, { name: '数字孪生应用工程师', urgency: '高' }] }, { name: '课程映射', items: [{ direction: '建筑机器人', course: '智能施工装备' }] }],
}

const workbook = Workbook.create()
const guide = workbook.worksheets.add('使用说明')
const prompts = workbook.worksheets.add('九页面提示词')
const dictionary = workbook.worksheets.add('字段字典')
const examples = workbook.worksheets.add('输出示例')

const titleStyle = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, size: 18 },
  verticalAlignment: 'center',
}
const headerStyle = {
  fill: colors.blue,
  font: { bold: true, color: colors.white, size: 10 },
  verticalAlignment: 'center',
  wrapText: true,
  borders: { preset: 'outside', style: 'thin', color: colors.blue },
}
const bodyStyle = {
  font: { color: colors.ink, size: 10 },
  verticalAlignment: 'top',
  wrapText: true,
  borders: { insideHorizontal: { style: 'thin', color: colors.line } },
}

for (const sheet of [guide, prompts, dictionary, examples]) sheet.showGridLines = false

guide.mergeCells('A1:F2')
guide.getRange('A1').values = [['产业调研九页面 AI 总结提示词']]
guide.getRange('A1:F2').format = titleStyle
guide.getRange('A4:B9').values = [
  ['项目', '说明'],
  ['适用范围', '产业链图谱、区域产业分析、产业政策库、产业企业库、专业布点分析、专业开设趋势、岗位画像分析、招聘需求趋势、新岗位新技术。'],
  ['调用方式', '浏览器把当前页面 JSON 发送到 /api/research-summary；服务端调用 Responses API 结构化输出。'],
  ['失败策略', '未配置密钥、超时、拒答、结构错误或 file:// 模式时，立即使用当前页面数据生成本地兜底总结。'],
  ['输出原则', '固定输出总体研判、结构特征、机会与问题、建设启示四条；总结只保留自然语言结论，数字继续由页面 KPI 和图表展示。'],
  ['安全要求', 'OPENAI_API_KEY 只保存在服务端环境变量；浏览器和 Excel 均不包含密钥。'],
]
guide.getRange('A4:B4').format = headerStyle
guide.getRange('A5:B9').format = bodyStyle
guide.getRange('D4:E7').values = [
  ['运行参数', '值'],
  ['页面数', null],
  ['默认接口', 'https://api.openai.com/v1/responses'],
  ['默认模型', 'gpt-5.6-luna'],
]
guide.getRange('E5').formulas = [["=COUNTA('九页面提示词'!A5:A13)"]]
guide.getRange('D4:E4').format = headerStyle
guide.getRange('D5:E7').format = { ...bodyStyle, fill: colors.paleBlue }
guide.mergeCells('A10:F10')
guide.getRange('A10').values = [['系统提示词']]
guide.getRange('A10:F10').format = { ...headerStyle, fill: colors.green }
guide.mergeCells('A11:F16')
guide.getRange('A11').values = [[RESEARCH_SUMMARY_SYSTEM_PROMPT]]
guide.getRange('A11:F16').format = { ...bodyStyle, fill: colors.paleCyan, font: { color: colors.ink, size: 11 } }
guide.getRange('A1:F16').format.wrapText = true
guide.getRange('A1:F16').format.verticalAlignment = 'top'
guide.getRange('A1:F2').format.verticalAlignment = 'center'
guide.getRange('A1:A16').format.columnWidth = 20
guide.getRange('B1:B16').format.columnWidth = 58
guide.getRange('C1:C16').format.columnWidth = 3
guide.getRange('D1:D16').format.columnWidth = 18
guide.getRange('E1:E16').format.columnWidth = 38
guide.getRange('F1:F16').format.columnWidth = 3
guide.getRange('A4:F4').format.rowHeight = 28
guide.getRange('A5:F9').format.rowHeight = 44
guide.getRange('A11:F16').format.rowHeight = 24

prompts.mergeCells('A1:I2')
prompts.getRange('A1').values = [['九页面专用提示词清单']]
prompts.getRange('A1:I2').format = titleStyle
prompts.mergeCells('A3:I3')
prompts.getRange('A3').values = [['每行对应一个页面；提示词与页面数据上下文组合后发送给模型。']]
prompts.getRange('A3:I3').format = { fill: colors.paleBlue, font: { color: colors.muted, italic: true, size: 10 } }
const promptRows = RESEARCH_SUMMARY_PAGE_KEYS.map((pageKey, index) => {
  const config = RESEARCH_SUMMARY_PAGE_CONFIGS[pageKey]
  return [index + 1, pageKey, RESEARCH_SUMMARY_PAGE_NAMES[pageKey], config.title, config.focus, pagePrompt(pageKey), config.recommendation, pageInputFields[pageKey], 'JSON：{ title, items[4] }']
})
prompts.getRange('A4:I13').values = [[
  '序号', '页面键', '页面名称', '分析类型', '分析重点', '页面专用提示词', '专业建设建议方向', '输入关键字段', '输出要求',
], ...promptRows]
prompts.getRange('A4:I4').format = headerStyle
prompts.getRange('A5:I13').format = bodyStyle
prompts.getRange('A5:I13').conditionalFormats.add('expression', {
  formula: '=MOD(ROW(),2)=1',
  format: { fill: colors.paleBlue },
})
prompts.freezePanes.freezeRows(4)
const promptWidths = [7, 20, 18, 20, 34, 82, 44, 48, 30]
promptWidths.forEach((width, index) => prompts.getRangeByIndexes(0, index, 13, 1).format.columnWidth = width)
prompts.getRange('A5:I13').format.rowHeight = 112
prompts.getRange('A4:I4').format.rowHeight = 32

dictionary.mergeCells('A1:F2')
dictionary.getRange('A1').values = [['当前页面 JSON 字段字典']]
dictionary.getRange('A1:F2').format = titleStyle
const dictionaryRows = [
  ['pageKey', 'string', '是', '枚举 9 项', '当前页面唯一键', 'industry-chain'],
  ['pageName', 'string', '是', '≤40 字', '页面中文名称', '产业链图谱'],
  ['subject', 'string', '是', '≤80 字', '当前选择的产业链、地区、专业或岗位群', '智能建造产业链 / 辽宁'],
  ['facts[].label', 'string', '是', '≤40 字', '页面 KPI 或事实名称', '企业样本'],
  ['facts[].value', 'string | number', '是', '≤120 字', '页面 KPI 或事实值', '12680'],
  ['facts[].evidence', 'string', '否', '≤180 字', '口径、来源或补充证据', '按企业统一身份去重'],
  ['groups[].name', 'string', '是', '≤40 字', '当前页面列表或图表分组名', '产业节点'],
  ['groups[].items[]', 'object', '是', '每组≤12项', '当前列表、排名、趋势或映射条目', '{ name, count }'],
  ['constraints[]', 'string', '否', '≤8项', '页面特有数据口径与限制', '企业数与关系数不得混用'],
  ['dataVersion', 'string', '是', '≤100 字', '当前数据内容哈希，用于缓存失效', '1x2ab3'],
  ['output.title', 'string', '是', '1–40 字', '当前对象名称，不附加分析类型', '智能建造产业链'],
  ['output.items', 'string[]', '是', '固定4项，每项≤140字', '总体研判、结构特征、机会与问题、建设启示', '["产业链已形成跨环节协同…"]'],
]
dictionary.getRange('A4:F16').values = [['JSON 路径', '类型', '必填', '边界', '含义', '示例'], ...dictionaryRows]
dictionary.getRange('A4:F4').format = headerStyle
dictionary.getRange('A5:F16').format = bodyStyle
dictionary.freezePanes.freezeRows(4)
const dictionaryWidths = [24, 18, 9, 24, 54, 42]
dictionaryWidths.forEach((width, index) => dictionary.getRangeByIndexes(0, index, 16, 1).format.columnWidth = width)
dictionary.getRange('A5:F16').format.rowHeight = 44

examples.mergeCells('A1:H2')
examples.getRange('A1').values = [['本地兜底输出示例（9 页面）']]
examples.getRange('A1:H2').format = titleStyle
const exampleRows = RESEARCH_SUMMARY_PAGE_KEYS.map((pageKey) => {
  const context = buildResearchSummaryContext(pageKey, {
    subject: sampleSubjects[pageKey],
    facts: sampleFacts[pageKey],
    groups: sampleGroups[pageKey],
  })
  const summary = buildFallbackResearchSummary(context)
  return [RESEARCH_SUMMARY_PAGE_NAMES[pageKey], sampleSubjects[pageKey], summary.title, ...summary.items, summary.source]
})
examples.getRange('A4:H13').values = [['页面', '当前对象', '标题', '总体研判', '结构特征', '机会与问题', '建设启示', '来源'], ...exampleRows]
examples.getRange('A4:H4').format = headerStyle
examples.getRange('A5:H13').format = bodyStyle
examples.getRange('H5:H13').format = { ...bodyStyle, fill: colors.palePurple, font: { bold: true, color: colors.green, size: 10 } }
examples.freezePanes.freezeRows(4)
const exampleWidths = [20, 30, 34, 46, 46, 52, 52, 14]
exampleWidths.forEach((width, index) => examples.getRangeByIndexes(0, index, 13, 1).format.columnWidth = width)
examples.getRange('A5:H13').format.rowHeight = 72

await fs.mkdir(outputDir, { recursive: true })

const promptInspection = await workbook.inspect({
  kind: 'table',
  range: "'九页面提示词'!A4:I13",
  include: 'values,formulas',
  tableMaxRows: 12,
  tableMaxCols: 9,
  maxChars: 7000,
})
console.log(promptInspection.ndjson)

const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
})
console.log(formulaErrors.ndjson)

for (const [sheetName, range, fileName] of [
  ['使用说明', 'A1:F16', 'preview-guide.png'],
  ['九页面提示词', 'A1:I13', 'preview-prompts.png'],
  ['字段字典', 'A1:F16', 'preview-dictionary.png'],
  ['输出示例', 'A1:H13', 'preview-examples.png'],
]) {
  const preview = await workbook.render({ sheetName, range, scale: 1.25, format: 'png' })
  await fs.writeFile(`${outputDir}/${fileName}`, new Uint8Array(await preview.arrayBuffer()))
}

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)
console.log(outputPath)
