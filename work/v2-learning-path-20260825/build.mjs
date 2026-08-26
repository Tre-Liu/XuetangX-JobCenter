import fs from 'node:fs/promises'
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool'

const sourcePath = '/Users/liuhongzhe/Desktop/讯飞比赛/需求/【V2】新增需求功能清单.xlsx'
const outputDir = '/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/v2-learning-path-20260825'
const outputPath = `${outputDir}/【V2】新增需求功能清单_补充学习路径.xlsx`

const input = await FileBlob.load(sourcePath)
const workbook = await SpreadsheetFile.importXlsx(input)
const detail = workbook.worksheets.getItem('功能清单')
const summary = workbook.worksheets.getItem('需求汇总')

const currentRows = detail.getRange('A7:F45').values
const insertAfter = currentRows.findIndex((row) => row[2] === '理论与实训双路径生成')
if (insertAfter < 0) throw new Error('未找到“理论与实训双路径生成”，无法确定新增需求位置。')

const newRequirement = [
  0,
  '学习路径',
  '学习任务前驱后继关系与路径自动规划',
  '客户新增',
  '建立学习任务、知识点和技能点之间的前驱—后继依赖关系；当学生选择目标知识点或技能点时，智能体结合其已掌握能力与前置要求，自动规划由基础到目标的个性化学习路径，并根据后续学习结果动态调整。',
  'P0',
]

const updatedRows = [...currentRows]
updatedRows.splice(insertAfter + 1, 0, newRequirement)
updatedRows.forEach((row, index) => { row[0] = index + 1 })

detail.getRange('A45:F45').copyTo(detail.getRange('A46:F46'), 'all')
detail.getRange('A7:F46').values = updatedRows
detail.getRange('A46:F46').format.rowHeightPx = 52

const existingTable = detail.tables.items[0]
const tableStyle = existingTable?.style
if (existingTable) existingTable.delete()
const updatedTable = detail.tables.add('A6:F46', true, 'FeatureListTable')
if (tableStyle) updatedTable.style = tableStyle
updatedTable.showFilterButton = true

detail.getRange('B3').values = [[40]]
detail.getRange('D3').values = [[18]]
detail.getRange('F3').values = [[6]]

detail.getRange('D7:D46').dataValidation = { rule: { type: 'list', values: ['客户新增', '业务细化', '原需求已有'] } }
detail.getRange('F7:F46').dataValidation = { rule: { type: 'list', values: ['P0', 'P1', 'P2'] } }
detail.getRange('D7:D46').conditionalFormats.deleteAll()
detail.getRange('D7:D46').conditionalFormats.add('containsText', { text: '客户新增', format: { fill: '#E7F5EB', font: { color: '#207A3B', bold: true } } })
detail.getRange('D7:D46').conditionalFormats.add('containsText', { text: '业务细化', format: { fill: '#FFF4D6', font: { color: '#8A5A00', bold: true } } })
detail.getRange('D7:D46').conditionalFormats.add('containsText', { text: '原需求已有', format: { fill: '#EDF1F5', font: { color: '#536273' } } })
detail.getRange('F7:F46').conditionalFormats.deleteAll()
detail.getRange('F7:F46').conditionalFormats.add('containsText', { text: 'P0', format: { fill: '#FDE9E7', font: { color: '#B42318', bold: true } } })
detail.getRange('F7:F46').conditionalFormats.add('containsText', { text: 'P1', format: { fill: '#FFF4D6', font: { color: '#8A5A00', bold: true } } })
detail.getRange('F7:F46').conditionalFormats.add('containsText', { text: 'P2', format: { fill: '#EDF1F5', font: { color: '#536273' } } })

summary.getRange('B4:B6').formulas = [
  ["=COUNTIF('功能清单'!$D$7:$D$46,A4)"],
  ["=COUNTIF('功能清单'!$D$7:$D$46,A5)"],
  ["=COUNTIF('功能清单'!$D$7:$D$46,A6)"],
]
summary.getRange('E4:E6').formulas = [
  ["=COUNTIF('功能清单'!$F$7:$F$46,D4)"],
  ["=COUNTIF('功能清单'!$F$7:$F$46,D5)"],
  ["=COUNTIF('功能清单'!$F$7:$F$46,D6)"],
]

summary.getRange('A1:E1').unmerge()
summary.getRange('A1:E1').merge()
summary.getRange('A1').values = [['需求分类与首期建议']]
summary.getRange('A1:E1').format = {
  fill: '#163A5F',
  font: { bold: true, color: '#FFFFFF', size: 18 },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
}
summary.getRange('A1:E1').format.rowHeightPx = 42

summary.getRange('A9:E9').unmerge()
summary.getRange('A9:E9').merge()
summary.getRange('A9').values = [['建议首期重点实现']]
summary.getRange('A9:E9').format = {
  fill: '#DCEAF6',
  font: { bold: true, color: '#163A5F', size: 12 },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
}
summary.getRange('A9:E9').format.rowHeightPx = 26

summary.getRange('A18:C18').copyTo(summary.getRange('A19:C19'), 'all')
summary.getRange('A11:C19').values = [
  [1, '主流程顺序调整', '岗位分析→理论/实训→面试→诊断'],
  [2, '岗位解析与能力拆解过程', '展示来源、解析步骤和图谱生成过程'],
  [3, '学习型工作任务生成', '形成任务情境、步骤、知识技能和评价'],
  [4, '理论/实训双路径', '同一岗位任务生成两类学习入口'],
  [5, '学习任务路径自动规划', '建立前驱后继关系，按目标知识/技能点生成学习路径'],
  [6, '自适应难度习题', '答错降阶、答对升阶并诊断错因'],
  [7, '多Agent人机协同实训', '学生与Agent分工、审核和合并产物'],
  [8, '实训多模态交互', '代码、图像、数据集和结果交互'],
  [9, '个人记忆呈现', '在我的学习中展示长期记忆与能力变化'],
]
summary.getRange('A19:C19').format.rowHeightPx = 28

await fs.mkdir(outputDir, { recursive: true })
const detailPreview = await workbook.render({ sheetName: '功能清单', range: 'A1:F47', scale: 1, format: 'png' })
await fs.writeFile(`${outputDir}/功能清单-preview.png`, new Uint8Array(await detailPreview.arrayBuffer()))
const summaryPreview = await workbook.render({ sheetName: '需求汇总', range: 'A1:E20', scale: 1.2, format: 'png' })
await fs.writeFile(`${outputDir}/需求汇总-preview.png`, new Uint8Array(await summaryPreview.arrayBuffer()))

const detailCheck = await workbook.inspect({
  kind: 'table',
  range: '功能清单!A14:F21',
  include: 'values,formulas',
  tableMaxRows: 10,
  tableMaxCols: 6,
  maxChars: 6000,
})
const summaryCheck = await workbook.inspect({
  kind: 'table',
  range: '需求汇总!A3:E19',
  include: 'values,formulas',
  tableMaxRows: 20,
  tableMaxCols: 5,
  maxChars: 10000,
})
const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
  maxChars: 3000,
})

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)
console.log(JSON.stringify({ outputPath, detail: detailCheck.ndjson, summary: summaryCheck.ndjson, errors: formulaErrors.ndjson }, null, 2))
