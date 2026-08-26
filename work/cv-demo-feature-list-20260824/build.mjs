import fs from 'node:fs/promises'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputDir = '/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/cv-demo-feature-list-20260824'
const outputPath = `${outputDir}/参赛Demo客户新增需求功能清单.xlsx`

const rows = [
  [1, '全流程', '岗位—学习—面试主流程重构', '客户新增', '将推荐业务顺序调整为“岗位分析→理论学习/实训学习→模拟面试→能力诊断→证书/岗位推荐”。各模块仍可独立进入。', 'P0', '客户反馈第1条'],
  [2, '岗位分析', '多源岗位数据分析', '客户新增', '综合产业数据、专业数据、职业标准、企业招聘信息和岗位说明书分析目标岗位。', 'P1', '客户反馈第2条'],
  [3, '岗位分析', '岗位典型工作任务解析', '原需求已有', '从职业标准和企业岗位要求中提取典型工作任务，并形成结构化岗位任务。', 'P0', 'Word：岗位模块1'],
  [4, '岗位分析', '岗位解析过程可视化', '客户新增', '展示“数据读取→岗位任务识别→能力拆解→知识技能提取→图谱生成”的完整解析过程，而不是直接展示结果。', 'P0', '客户反馈第2条'],
  [5, '岗位分析', '岗位任务详情', '原需求已有', '展示任务名称、任务描述、工作步骤、输入条件、输出成果、工具链和质量标准。', 'P0', 'Word：岗位模块1'],
  [6, '能力图谱', '岗位能力结构化拆解', '原需求已有', '按“工作任务→能力单元→知识点/技能点/素养点”拆解岗位能力。', 'P0', 'Word：岗位模块2'],
  [7, '能力图谱', '能力拆解过程呈现', '客户新增', '展示每个能力点从哪个岗位任务、标准条目或招聘要求中解析而来，并支持人工确认和调整。', 'P0', '客户反馈第2条'],
  [8, '能力图谱', '岗位能力图谱交互', '原需求已有', '支持完整图谱展示、节点展开、路径聚焦、能力详情和来源依据查看。', 'P0', 'Word：岗位模块3'],
  [9, '教学转化', '学习型工作任务自动生成', '客户新增', '将企业岗位工作任务转化为符合教学规律、可以由学生完成的学习型工作任务。', 'P0', '客户反馈第2条'],
  [10, '教学转化', '学习任务结构化设计', '客户新增', '每项学习任务包含任务名称、任务情境、任务描述、学习目标、任务步骤、知识点、技能点、学习资源、学习产物和评价规则。', 'P0', '客户反馈第2条'],
  [11, '教学转化', '原始任务与学习任务溯源', '业务细化', '展示学习任务来源于哪项岗位任务、职业标准或企业要求，保留完整转化关系。', 'P1', '围绕反馈第2条补充'],
  [12, '学习路径', '理论与实训双路径生成', '客户新增', '针对同一项岗位任务，同时生成“理论学习”和“真实岗位任务实训”两条学习路径。', 'P0', '客户反馈第2条'],
  [13, '理论学习', '岗位知识点关联学习', '原需求已有', '知识点关联教材原页、案例、代码、图解和操作内容，并可返回对应岗位任务。', 'P0', 'Word：专业核心课1、3'],
  [14, '理论学习', '理论—岗位即时映射', '原需求已有', '学完理论知识后，自动说明其在真实计算机视觉岗位任务中的应用场景。', 'P1', 'Word：专业核心课3'],
  [15, '理论学习', '自适应难度习题链', '客户新增', '学生答错后推送低阶题、前置知识题；答对后推送高阶题、迁移题或岗位情境题。', 'P0', '客户反馈第4条'],
  [16, '理论学习', '错因诊断与补偿学习', '业务细化', '判断学生属于概念不清、前置知识缺失、审题错误还是应用能力不足，并推送对应内容。', 'P1', '围绕反馈第4条补充'],
  [17, '学习陪伴', '心理陪伴与分级鼓励', '原需求已有', '根据答题结果、用时、重试次数和学习状态提供鼓励、提示和难度调整说明。', 'P1', 'Word：专业核心课1'],
  [18, '实训学习', '真实岗位任务实训', '原需求已有', '将岗位典型任务转化为可操作的实训项目，挂载数据集、代码框架、工具和评测脚本。', 'P0', 'Word：实践课程1'],
  [19, '实训学习', '工作任务自动拆分', '客户新增', '将一个真实岗位任务拆分为需求分析、数据处理、算法开发、测试验证、部署交付等子任务。', 'P0', '客户反馈第3条'],
  [20, '人机协同', '学生与Agent任务分工', '客户新增', '学生负责其中一个或多个关键子任务，其他子任务由不同角色Agent完成。', 'P0', '客户反馈第3条'],
  [21, '人机协同', '多角色程序员Agent团队', '原需求已有', '配置需求分析、架构设计、算法开发、测试验证、部署运维等Agent角色。', 'P0', 'Word：实践课程2'],
  [22, '人机协同', 'Agent任务状态与产物展示', '业务细化', '展示各Agent的任务、输入、执行状态、输出产物和协作关系。', 'P1', '围绕反馈第3条补充'],
  [23, '人机协同', '学生审核与调度Agent', '原需求已有', '学生可以向Agent分派任务、补充要求、查看产物、驳回修改和确认合并。', 'P1', 'Word：实践课程2'],
  [24, '实训指导', '实训过程智能指导', '客户新增', '学生遇到问题时，AI根据当前任务、代码、数据和产物提供分级提示，而不是直接给出完整答案。', 'P0', '客户反馈第3条'],
  [25, '多模态交互', '理论与实训多模态交互', '客户新增', '理论或实训过程不再局限于纯文本，可通过图片、代码、数据、语音和视频等方式与智能体交互。', 'P1', '客户反馈第5条'],
  [26, '多模态交互', '代码交互', '业务细化', '支持代码编辑、运行结果查看、错误日志分析和代码修改建议。', 'P0', '围绕反馈第5条补充'],
  [27, '多模态交互', '数据集与视觉结果交互', '业务细化', '支持查看数据样本、标注结果、检测框、分割结果和错误样本。', 'P1', '围绕反馈第5条补充'],
  [28, '多模态交互', '语音与视频交互', '业务细化', '支持语音提问、语音讲解、视频关键帧分析和学生语音汇报。', 'P2', '围绕反馈第5条补充'],
  [29, '实训评价', '实训产物自动评价', '原需求已有', '根据代码、模型指标、测试记录、项目文档和答辩表现评价任务完成情况。', 'P0', 'Word：实践课程3'],
  [30, '能力画像', '学习证据统一归档', '原需求已有', '将理论检测、实训产物、面试表现等数据写入统一学生能力画像。', 'P0', 'Word：实践课程3'],
  [31, '模拟面试', '多角色岗位面试', '原需求已有', '由算法、工程实践、系统设计等面试官Agent开展岗位模拟面试。', 'P0', 'Word：岗位模块4'],
  [32, '模拟面试', '自适应追问', '原需求已有', '根据学生回答动态调整问题难度和追问深度。', 'P1', 'Word：岗位模块4'],
  [33, '面试诊断', '学生优缺点分析', '原需求已有', '对照岗位能力图谱分析学生知识薄弱点、技能短板和岗位胜任情况。', 'P0', 'Word：岗位模块4'],
  [34, '成长推荐', '个性化补强任务推荐', '原需求已有', '根据学习和面试诊断结果，推荐需要补学的理论内容、学习任务和实训项目。', 'P1', 'Word：岗位模块5'],
  [35, '证书推荐', '技能证书智能推荐', '客户新增', '推荐人社、工信、行业企业及科大讯飞相关技能证书，并说明推荐依据。', 'P1', '客户反馈第6条'],
  [36, '证书推荐', '证书能力差距分析', '业务细化', '将学生能力画像与证书考核要求对比，给出缺口和备考路径。', 'P1', '围绕反馈第6条补充'],
  [37, '就业推荐', '实时真实岗位接入', '客户新增', '接入招聘数据，展示真实企业、岗位名称、工作地点、发布时间和来源链接。', 'P1', '客户反馈第6条'],
  [38, '就业推荐', '真实岗位智能推荐', '客户新增', '根据学生已验证能力、面试表现和求职意向推荐适合的真实岗位。', 'P1', '客户反馈第6条'],
  [39, '个人记忆', '学生长期记忆管理', '客户新增', '持续记录学生目标、知识掌握、技能短板、错题规律、学习偏好和指导效果。', 'P1', '客户反馈第7条'],
  [40, '我的学习', '智能体记忆呈现', '客户新增', '在“我的学习”中展示智能体记住的内容、能力变化、薄弱点和近期学习重点。', 'P1', '客户反馈第7条'],
  [41, '我的学习', '学习证据时间线', '业务细化', '按时间展示教材学习、测验、实训、面试和能力变化证据。', 'P1', '围绕反馈第7条补充'],
  [42, '个人记忆', '记忆查看与删除', '业务细化', '学生可以查看、修改或删除智能体记忆，避免错误记忆长期影响推荐。', 'P2', '围绕反馈第7条补充'],
  [43, '全生命周期', '学生成长全景档案', '客户新增', '汇总岗位目标、学习进度、实训成果、面试诊断、证书规划和就业推荐。', 'P1', '客户反馈第6条'],
]

const workbook = Workbook.create()
const detail = workbook.worksheets.add('功能清单')
const summary = workbook.worksheets.add('需求汇总')

detail.showGridLines = false
detail.mergeCells('A1:G1')
detail.mergeCells('A2:G2')
detail.getRange('A1').values = [['参赛 Demo 需求分类功能清单']]
detail.getRange('A2').values = [['分类口径：客户7条反馈=客户新增；Word及客户反馈均未明确、为业务落地补充=业务细化｜2026-08-24']]
detail.getRange('A4:F4').values = [['功能总数', rows.length, '客户新增', rows.filter((row) => row[3] === '客户新增').length, '业务细化', rows.filter((row) => row[3] === '业务细化').length]]
detail.getRange('A7:G7').values = [['序号', '功能模块', '功能名称', '需求分类', '功能说明', '优先级', '来源说明']]
detail.getRange(`A8:G${7 + rows.length}`).values = rows

detail.getRange('A1:G1').format = {
  fill: '#163A5F',
  font: { bold: true, color: '#FFFFFF', size: 18 },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
}
detail.getRange('A1:G1').format.rowHeightPx = 42
detail.getRange('A2:G2').format = {
  fill: '#EAF1F8',
  font: { color: '#49657F', size: 10 },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
}
detail.getRange('A2:G2').format.rowHeightPx = 28
detail.getRange('A4:F4').format = {
  fill: '#F3F7FB',
  font: { color: '#29445E', bold: true, size: 10 },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  borders: { preset: 'outside', style: 'thin', color: '#BCD0E2' },
}
detail.getRange('B4').format = { fill: '#DCEAF6', font: { color: '#163A5F', bold: true, size: 14 }, horizontalAlignment: 'center' }
detail.getRange('D4').format = { fill: '#E7F5EB', font: { color: '#207A3B', bold: true, size: 14 }, horizontalAlignment: 'center' }
detail.getRange('F4').format = { fill: '#FFF4D6', font: { color: '#8A5A00', bold: true, size: 14 }, horizontalAlignment: 'center' }
detail.getRange('A7:G7').format = {
  fill: '#2E648F',
  font: { bold: true, color: '#FFFFFF', size: 10 },
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
  wrapText: true,
}
detail.getRange('A7:G7').format.rowHeightPx = 30
detail.getRange(`A8:G${7 + rows.length}`).format = {
  font: { color: '#243746', size: 10 },
  verticalAlignment: 'center',
  wrapText: true,
  borders: { insideHorizontal: { style: 'thin', color: '#DFE7EE' } },
}
detail.getRange(`A8:A${7 + rows.length}`).format.horizontalAlignment = 'center'
detail.getRange(`B8:B${7 + rows.length}`).format.horizontalAlignment = 'center'
detail.getRange(`D8:D${7 + rows.length}`).format.horizontalAlignment = 'center'
detail.getRange(`F8:F${7 + rows.length}`).format.horizontalAlignment = 'center'
detail.getRange(`G8:G${7 + rows.length}`).format.horizontalAlignment = 'center'
detail.getRange(`A8:G${7 + rows.length}`).format.rowHeightPx = 44
detail.getRange('A1:A50').format.columnWidthPx = 54
detail.getRange('B1:B50').format.columnWidthPx = 112
detail.getRange('C1:C50').format.columnWidthPx = 230
detail.getRange('D1:D50').format.columnWidthPx = 92
detail.getRange('E1:E50').format.columnWidthPx = 560
detail.getRange('F1:F50').format.columnWidthPx = 72
detail.getRange('G1:G50').format.columnWidthPx = 180

detail.getRange(`D8:D${7 + rows.length}`).dataValidation = { rule: { type: 'list', values: ['客户新增', '业务细化', '原需求已有'] } }
detail.getRange(`F8:F${7 + rows.length}`).dataValidation = { rule: { type: 'list', values: ['P0', 'P1', 'P2'] } }
detail.getRange(`D8:D${7 + rows.length}`).conditionalFormats.add('containsText', { text: '客户新增', format: { fill: '#E7F5EB', font: { color: '#207A3B', bold: true } } })
detail.getRange(`D8:D${7 + rows.length}`).conditionalFormats.add('containsText', { text: '业务细化', format: { fill: '#FFF4D6', font: { color: '#8A5A00', bold: true } } })
detail.getRange(`D8:D${7 + rows.length}`).conditionalFormats.add('containsText', { text: '原需求已有', format: { fill: '#EDF1F5', font: { color: '#536273' } } })
detail.getRange(`F8:F${7 + rows.length}`).conditionalFormats.add('containsText', { text: 'P0', format: { fill: '#FDE9E7', font: { color: '#B42318', bold: true } } })
detail.getRange(`F8:F${7 + rows.length}`).conditionalFormats.add('containsText', { text: 'P1', format: { fill: '#FFF4D6', font: { color: '#8A5A00', bold: true } } })
detail.getRange(`F8:F${7 + rows.length}`).conditionalFormats.add('containsText', { text: 'P2', format: { fill: '#EDF1F5', font: { color: '#536273' } } })
detail.tables.add(`A7:G${7 + rows.length}`, true, 'FeatureListTable')
detail.freezePanes.freezeRows(7)

summary.showGridLines = false
summary.mergeCells('A1:F1')
summary.mergeCells('A2:F2')
summary.getRange('A1').values = [['需求分类与首期建议']]
summary.getRange('A2').values = [['统计数据引用“功能清单”工作表，修改清单后可自动更新']]
summary.getRange('A4:B4').values = [['需求分类', '数量']]
summary.getRange('A5:A7').values = [['客户新增'], ['业务细化'], ['原需求已有']]
summary.getRange('B5:B7').formulas = [
  ["=COUNTIF('功能清单'!$D$8:$D$50,A5)"],
  ["=COUNTIF('功能清单'!$D$8:$D$50,A6)"],
  ["=COUNTIF('功能清单'!$D$8:$D$50,A7)"],
]
summary.getRange('D4:E4').values = [['优先级', '数量']]
summary.getRange('D5:D7').values = [['P0'], ['P1'], ['P2']]
summary.getRange('E5:E7').formulas = [
  ["=COUNTIF('功能清单'!$F$8:$F$50,D5)"],
  ["=COUNTIF('功能清单'!$F$8:$F$50,D6)"],
  ["=COUNTIF('功能清单'!$F$8:$F$50,D7)"],
]
summary.mergeCells('A10:F10')
summary.getRange('A10').values = [['建议首期重点实现']]
summary.getRange('A11:C19').values = [
  ['序号', '重点功能', '建议范围'],
  [1, '主流程顺序调整', '岗位分析→理论/实训→面试→诊断'],
  [2, '岗位解析与能力拆解过程', '展示来源、解析步骤和图谱生成过程'],
  [3, '学习型工作任务生成', '形成任务情境、步骤、知识技能和评价'],
  [4, '理论/实训双路径', '同一岗位任务生成两类学习入口'],
  [5, '自适应难度习题', '答错降阶、答对升阶并诊断错因'],
  [6, '多Agent人机协同实训', '学生与Agent分工、审核和合并产物'],
  [7, '实训多模态交互', '代码、图像、数据集和结果交互'],
  [8, '个人记忆呈现', '在我的学习中展示长期记忆与能力变化'],
]
summary.mergeCells('A21:F21')
summary.getRange('A21').values = [['来源说明']]
summary.mergeCells('A22:F23')
summary.getRange('A22').values = [['需求基线：/Users/liuhongzhe/Desktop/讯飞比赛/人工智能智能体v1.docx\n分类口径：“客户新增”指客户7条反馈直接提出的内容；“业务细化”指Word和7条反馈均未明确、为业务可落地而自主补充的内容；Word已明确的功能归入“原需求已有”。']]

summary.getRange('A1:F1').format = { fill: '#163A5F', font: { bold: true, color: '#FFFFFF', size: 18 }, horizontalAlignment: 'left', verticalAlignment: 'center' }
summary.getRange('A1:F1').format.rowHeightPx = 42
summary.getRange('A2:F2').format = { fill: '#EAF1F8', font: { color: '#49657F', size: 10 }, horizontalAlignment: 'left', verticalAlignment: 'center' }
summary.getRange('A2:F2').format.rowHeightPx = 28
summary.getRange('A4:B4').format = { fill: '#2E648F', font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center' }
summary.getRange('D4:E4').format = { fill: '#2E648F', font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center' }
summary.getRange('A5:B7').format = { fill: '#F7FAFC', font: { color: '#29445E' }, verticalAlignment: 'center', borders: { insideHorizontal: { style: 'thin', color: '#DFE7EE' }, outside: { style: 'thin', color: '#BCD0E2' } } }
summary.getRange('D5:E7').format = { fill: '#F7FAFC', font: { color: '#29445E' }, verticalAlignment: 'center', borders: { insideHorizontal: { style: 'thin', color: '#DFE7EE' }, outside: { style: 'thin', color: '#BCD0E2' } } }
summary.getRange('B5:B7').format = { font: { bold: true, color: '#163A5F', size: 13 }, horizontalAlignment: 'center' }
summary.getRange('E5:E7').format = { font: { bold: true, color: '#163A5F', size: 13 }, horizontalAlignment: 'center' }
summary.getRange('A10:F10').format = { fill: '#DCEAF6', font: { bold: true, color: '#163A5F', size: 12 }, horizontalAlignment: 'left', verticalAlignment: 'center' }
summary.getRange('A11:C11').format = { fill: '#2E648F', font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center', verticalAlignment: 'center' }
summary.getRange('A12:C19').format = { font: { color: '#243746', size: 10 }, wrapText: true, verticalAlignment: 'center', borders: { insideHorizontal: { style: 'thin', color: '#DFE7EE' } } }
summary.getRange('A12:A19').format.horizontalAlignment = 'center'
summary.getRange('A21:F21').format = { fill: '#EDF1F5', font: { bold: true, color: '#536273' }, horizontalAlignment: 'left' }
summary.getRange('A22:F23').format = { fill: '#FAFBFC', font: { color: '#536273', size: 9 }, wrapText: true, verticalAlignment: 'top', borders: { preset: 'outside', style: 'thin', color: '#D5DEE6' } }
summary.getRange('A22:F23').format.rowHeightPx = 46
summary.getRange('A1:A23').format.columnWidthPx = 62
summary.getRange('B1:B23').format.columnWidthPx = 250
summary.getRange('C1:C23').format.columnWidthPx = 520
summary.getRange('D1:D23').format.columnWidthPx = 90
summary.getRange('E1:E23').format.columnWidthPx = 90
summary.getRange('F1:F23').format.columnWidthPx = 90
summary.freezePanes.freezeRows(2)

await fs.mkdir(outputDir, { recursive: true })

const detailPreview = await workbook.render({ sheetName: '功能清单', range: 'A1:G50', scale: 1, format: 'png' })
await fs.writeFile(`${outputDir}/功能清单-preview.png`, new Uint8Array(await detailPreview.arrayBuffer()))
const summaryPreview = await workbook.render({ sheetName: '需求汇总', range: 'A1:F23', scale: 1.2, format: 'png' })
await fs.writeFile(`${outputDir}/需求汇总-preview.png`, new Uint8Array(await summaryPreview.arrayBuffer()))

const xlsx = await SpreadsheetFile.exportXlsx(workbook)
await xlsx.save(outputPath)

const detailCheck = await workbook.inspect({
  kind: 'table',
  range: '功能清单!A7:G14',
  include: 'values,formulas',
  tableMaxRows: 12,
  tableMaxCols: 7,
  maxChars: 5000,
})
const summaryCheck = await workbook.inspect({
  kind: 'table',
  range: '需求汇总!A4:E8',
  include: 'values,formulas',
  tableMaxRows: 8,
  tableMaxCols: 5,
  maxChars: 4000,
})
const formulaErrors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
  maxChars: 3000,
})

console.log(JSON.stringify({ outputPath, detail: detailCheck.ndjson, summary: summaryCheck.ndjson, errors: formulaErrors.ndjson }, null, 2))
