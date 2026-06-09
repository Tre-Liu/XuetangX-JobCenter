import fs from 'node:fs/promises'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputDir = new URL('../outputs/prd/', import.meta.url)
const outputPath = new URL('../outputs/prd/一期功能清单_v1.xlsx', import.meta.url)
const previewDir = new URL('../outputs/prd/phase1_function_inventory_v1_render/', import.meta.url)

const headers = ['模块', '一级功能', '二级功能', '功能描述', '备注']

const rows = [
  ['岗位中心', '岗位中心首页', '进入岗位中心后展示岗位建设总览，包括已建设岗位数、岗位能力项数、典型工作任务数、课程关联数等核心指标。', '闭环总入口'],
  ['岗位中心', '岗位列表查询', '支持按岗位名称、岗位群、产业链节点、职业编码、能力关键词等条件查询岗位。', '查'],
  ['岗位中心', '岗位列表筛选', '支持按岗位状态、建设来源、所属专业、是否已关联课程、是否已完成能力项拆解等条件筛选。', '查'],
  ['岗位中心', '岗位列表排序', '支持按更新时间、岗位热度、能力项数量、课程关联数量排序，便于优先处理重点岗位。', '查'],
  ['岗位中心', '岗位新增', '支持从空白表单新增岗位，填写岗位名称、岗位群、关联职业、职业编码、产业链节点、岗位说明等信息。', '增'],
  ['岗位中心', '岗位复制创建', '支持复制已有岗位生成新岗位草稿，用于相似岗位快速建设。', '增'],
  ['岗位中心', '岗位详情查看', '支持查看岗位基础信息、典型工作任务、岗位能力项、调研来源、课程关联情况。', '查'],
  ['岗位中心', '岗位状态管理', '支持将岗位标记为草稿、待完善、已发布、停用等状态。', '改'],
  ['岗位中心', '岗位删除', '支持删除草稿岗位；已被课程或调研成果引用的岗位需先解除引用或执行停用。', '删；避免误删业务资产'],
  ['岗位中心', '岗位批量删除', '支持批量删除未发布、未关联课程的岗位草稿，并进行二次确认。', '删'],
  ['岗位中心', '岗位批量导出', '支持导出岗位列表及关联能力项，用于评审、归档或线下校对。', '一期可先导出 Excel'],
  ['岗位中心', '岗位建设进度提示', '按岗位提示基础信息、任务、能力项、课程关联的完整度。', '用于推动闭环完成'],
  ['岗位中心', '岗位与专业关联', '支持将岗位关联到专业、专业群或建设方向，明确该岗位服务的专业建设对象。', '闭环对象定位'],
  ['岗位中心', '岗位与产业链节点关联', '支持岗位挂接产业链、产业环节、岗位群，为后续图谱和调研统计提供结构。', '来源于既有产业链口径'],
  ['岗位中心', '岗位看板统计', '按专业、产业链、岗位群统计岗位建设数量、能力项数量和课程覆盖情况。', '查；管理视角'],

  ['模版导入岗位', '导入入口', '在岗位中心提供“模版导入岗位”入口，支持用户上传标准岗位模版文件。', '一期重点能力'],
  ['模版导入岗位', '模版下载', '提供标准岗位导入模版下载，字段包含岗位基础信息、典型任务、能力项、课程建议关联等。', '建议用现有字段模版扩展'],
  ['模版导入岗位', '导入文件选择', '支持选择 xlsx 文件并展示文件名、大小、上传时间。', '增'],
  ['模版导入岗位', '导入字段校验', '校验必填字段、字段类型、职业编码格式、能力项类别等内容。', '防止脏数据入库'],
  ['模版导入岗位', '导入重复校验', '按岗位名称、职业编码、所属专业等规则识别重复岗位。', '可选择跳过、覆盖或生成新版本'],
  ['模版导入岗位', '导入预览', '导入前展示解析结果，包括成功记录、异常记录、重复记录。', '查'],
  ['模版导入岗位', '异常明细查看', '支持查看每行异常原因，并定位到具体字段。', '查；便于用户修正'],
  ['模版导入岗位', '确认导入', '用户确认后将校验通过的岗位写入岗位中心，并生成导入批次记录。', '增'],
  ['模版导入岗位', '部分导入', '允许仅导入校验通过的数据，异常数据保留在导入结果中供下载修正。', '提高可用性'],
  ['模版导入岗位', '导入结果下载', '支持下载带错误提示的结果文件，便于线下修订后再次导入。', '闭环到再次导入'],
  ['模版导入岗位', '导入批次列表', '展示历史导入批次、导入人、导入时间、成功数、失败数、状态。', '查'],
  ['模版导入岗位', '导入批次详情', '支持查看某次导入生成或更新了哪些岗位。', '查；可追溯'],
  ['模版导入岗位', '导入回滚', '对刚导入且未被引用的数据支持批次回滚。', '删/撤销；可作为一期可选'],

  ['岗位内容编辑', '基础信息编辑', '支持编辑岗位名称、岗位别名、岗位群、职业名称、职业编码、产业链节点、岗位层级等字段。', '改'],
  ['岗位内容编辑', '岗位描述编辑', '支持维护岗位定义、岗位职责、任职要求、工作内容、职业路径等文本内容。', '改'],
  ['岗位内容编辑', '典型工作任务新增', '支持为岗位新增典型工作任务，填写任务名称、任务描述、任务场景、输出成果。', '增'],
  ['岗位内容编辑', '典型工作任务编辑', '支持编辑任务名称、描述、任务顺序和关联能力项。', '改'],
  ['岗位内容编辑', '典型工作任务删除', '支持删除未被能力项或课程引用的任务；已引用任务需提示影响范围。', '删'],
  ['岗位内容编辑', '岗位能力项新增', '支持新增岗位能力项，包含能力名称、类别、定义、来源、重要程度。', '增；类别建议为知识/技能/素养'],
  ['岗位内容编辑', '岗位能力项编辑', '支持编辑能力项名称、类别、定义、等级要求和适用任务。', '改'],
  ['岗位内容编辑', '岗位能力项删除', '支持删除未被课程关联使用的能力项；已被课程引用时提示先解除关联。', '删；闭环约束'],
  ['岗位内容编辑', '任务关联能力项', '支持在典型工作任务下挂接多个岗位能力项，形成任务到能力的结构化关系。', '业务核心'],
  ['岗位内容编辑', '能力项分类维护', '支持按知识、技能、素养管理能力项，后续可扩展能力等级和指标。', '一期先保持简单'],
  ['岗位内容编辑', '内容保存草稿', '编辑过程中支持保存草稿，不影响已发布岗位内容。', '改'],
  ['岗位内容编辑', '内容发布', '编辑完成后发布岗位内容，供调研结果、课程关联和成果页使用。', '闭环节点'],
  ['岗位内容编辑', '变更记录', '记录岗位内容的编辑人、编辑时间、变更字段和版本。', '可作为一期简化记录'],
  ['岗位内容编辑', '编辑校验', '发布前校验必填信息、任务数量、能力项数量和课程关联情况。', '保障闭环完整'],

  ['岗位调研模块', '调研任务新增', '支持创建岗位调研任务，填写调研主题、专业/专业群、产业方向、调研对象、负责人和时间范围。', '增'],
  ['岗位调研模块', '调研任务列表', '支持查看调研任务列表、任务状态、负责人、覆盖岗位数和更新时间。', '查'],
  ['岗位调研模块', '调研任务编辑', '支持编辑未完成调研任务的名称、范围、对象和负责人。', '改'],
  ['岗位调研模块', '调研任务删除', '支持删除未产生岗位数据的调研任务；已有数据的任务建议归档。', '删/归档'],
  ['岗位调研模块', '岗位样本录入', '支持手动录入岗位样本，包括岗位名称、企业、地区、岗位职责、任职要求、薪资、学历等。', '增'],
  ['岗位调研模块', '岗位样本导入', '支持批量导入岗位样本，作为岗位中心建设的数据来源。', '增'],
  ['岗位调研模块', '岗位样本查询', '支持按岗位名称、企业、地区、能力关键词、调研任务查询岗位样本。', '查'],
  ['岗位调研模块', '岗位样本编辑', '支持修改岗位样本字段，并记录样本来源和更新时间。', '改'],
  ['岗位调研模块', '岗位样本删除', '支持删除错误或重复样本；已被岗位中心采用的样本需提示影响。', '删'],
  ['岗位调研模块', '调研数据去重', '按岗位名称、企业、地区、职责相似度识别重复样本并支持合并。', '一期可先做规则去重'],
  ['岗位调研模块', '调研结果汇总', '按岗位、地区、企业、能力关键词汇总岗位调研结果。', '查/分析'],
  ['岗位调研模块', '岗位画像生成', '基于调研样本生成岗位画像草稿，包括职责、要求、任务和能力项建议。', '可先做半自动'],
  ['岗位调研模块', '调研结果转岗位', '支持将调研结果中的岗位沉淀到岗位中心，形成可维护岗位资产。', '关键闭环：调研 -> 岗位中心'],
  ['岗位调研模块', '调研任务归档', '调研完成后归档任务，保留样本和结果用于追溯。', '闭环沉淀'],

  ['课程关联岗位能力项模块', '课程库查询', '支持查询课程名称、课程类型、所属专业、课程负责人等基础信息。', '查；如无课程库需先维护简表'],
  ['课程关联岗位能力项模块', '课程新增', '支持新增课程基础信息，包含课程名称、课程编码、课程类型、学时学分、所属专业。', '增'],
  ['课程关联岗位能力项模块', '课程编辑', '支持编辑课程基础信息和课程目标。', '改'],
  ['课程关联岗位能力项模块', '课程删除', '未被岗位能力项引用的课程支持删除；已建立关联时需先解除关联。', '删'],
  ['课程关联岗位能力项模块', '岗位能力项选择', '支持从岗位中心选择已发布岗位及其能力项作为课程关联对象。', '闭环输入'],
  ['课程关联岗位能力项模块', '课程关联能力项新增', '支持为课程新增关联的岗位能力项，并填写支撑强度、支撑章节、教学活动或实训项目。', '增；核心功能'],
  ['课程关联岗位能力项模块', '课程关联能力项编辑', '支持修改课程与能力项之间的支撑强度、说明和证据材料。', '改'],
  ['课程关联岗位能力项模块', '课程关联能力项删除', '支持解除课程与岗位能力项的关联，并记录操作日志。', '删'],
  ['课程关联岗位能力项模块', '按课程查看覆盖能力', '从课程视角查看该课程支撑的岗位、典型任务和能力项。', '查'],
  ['课程关联岗位能力项模块', '按岗位查看课程支撑', '从岗位能力项视角查看哪些课程支撑该能力项。', '查'],
  ['课程关联岗位能力项模块', '能力覆盖矩阵', '以矩阵形式展示课程与岗位能力项之间的覆盖关系。', '一期可做基础矩阵'],
  ['课程关联岗位能力项模块', '未覆盖能力识别', '自动列出尚未被任何课程支撑的岗位能力项。', '闭环检查'],
  ['课程关联岗位能力项模块', '低支撑能力提示', '对仅有弱关联或缺少证据的能力项进行提示。', '一期可作为规则提示'],
  ['课程关联岗位能力项模块', '关联结果导出', '支持导出课程-岗位能力项关联表，用于教研评审和培养方案论证。', '输出闭环'],
  ['课程关联岗位能力项模块', '关联版本记录', '记录课程关联能力项的维护版本，便于后续与培养方案比对。', '可作为一期简化记录'],

  ['业务闭环支撑', '闭环链路总览', '展示岗位调研、岗位中心、岗位编辑、课程关联之间的数据流转关系。', '建议保留，便于验收讲清楚'],
  ['业务闭环支撑', '数据来源追溯', '岗位详情中可查看该岗位来自哪个调研任务、导入批次或手动创建。', '闭环可信度'],
  ['业务闭环支撑', '引用关系校验', '删除岗位、任务、能力项、课程前检查是否被下游模块引用。', '保证数据一致性'],
  ['业务闭环支撑', '完整度检查', '按岗位检查基础信息、任务、能力项、课程关联是否齐全。', '可作为发布前检查'],
  ['业务闭环支撑', '成果页查看', '支持将已发布岗位、能力项和课程关联结果在成果页中展示。', '闭环输出'],
]

const closureRows = [
  ['1', '岗位调研模块', '采集岗位样本、形成调研结果、沉淀岗位画像草稿。', '提供岗位来源'],
  ['2', '模版导入岗位', '通过标准模版批量导入岗位、任务和能力项。', '补充岗位来源'],
  ['3', '岗位中心', '统一管理岗位资产，完成查询、维护、状态和建设进度管理。', '承接调研和导入结果'],
  ['4', '岗位内容编辑', '完善岗位基础信息、典型任务和岗位能力项。', '把岗位变成结构化资产'],
  ['5', '课程关联岗位能力项模块', '将课程与岗位能力项建立支撑关系，并识别未覆盖能力。', '把外部岗位需求传导到课程建设'],
  ['6', '成果查看/导出', '输出岗位库、能力项库、课程能力覆盖矩阵和未覆盖能力清单。', '形成一期业务闭环'],
]

const moduleMap = {
  岗位中心: '岗位建设中心',
  模版导入岗位: '岗位建设中心',
  岗位内容编辑: '岗位建设中心',
  岗位调研模块: '岗位分析',
  课程关联岗位能力项模块: '课程关联岗位能力项',
  业务闭环支撑: '业务闭环支撑',
}

const tableRows = rows.map(([primary, secondary, description, note]) => [
  moduleMap[primary] || primary,
  primary,
  secondary,
  description,
  note,
])

const workbook = Workbook.create()
const sheet = workbook.worksheets.add('一期功能清单')
const lastRow = tableRows.length + 2

sheet.getRange('A1:E1').merge()
sheet.getRange('A1').values = [['一期功能清单 v1']]
sheet.getRange('A2:E2').values = [headers]
sheet.getRange(`A3:E${lastRow}`).values = tableRows

let cursor = 3
for (const primary of [...new Set(tableRows.map((row) => row[1]))]) {
  const count = tableRows.filter((row) => row[1] === primary).length
  if (count > 1) sheet.getRange(`A${cursor}:A${cursor + count - 1}`).merge()
  if (count > 1) sheet.getRange(`B${cursor}:B${cursor + count - 1}`).merge()
  cursor += count
}

sheet.getRange('A1:E1').format = {
  font: { bold: true, size: 18, color: '#17233a' },
  fill: { color: '#eaf2ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
}

sheet.getRange('A2:E2').format = {
  font: { bold: true, color: '#17233a', size: 11 },
  fill: { color: '#2450a5' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
  wrapText: true,
}

sheet.getRange(`A3:E${lastRow}`).format = {
  font: { color: '#253854', size: 10 },
  verticalAlignment: 'top',
  wrapText: true,
}

sheet.getRange(`A3:A${lastRow}`).format = {
  font: { bold: true, color: '#174ea6', size: 11 },
  fill: { color: '#edf5ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
  wrapText: true,
}

sheet.getRange(`B3:B${lastRow}`).format = {
  font: { bold: true, color: '#1f2f52', size: 10 },
  fill: { color: '#f5f8ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
  wrapText: true,
}

sheet.getRange(`C3:C${lastRow}`).format = {
  font: { bold: true, color: '#1f2f52', size: 10 },
  fill: { color: '#fbfdff' },
  verticalAlignment: 'top',
  wrapText: true,
}

sheet.getRange(`E3:E${lastRow}`).format = {
  font: { color: '#5f6f89', size: 10 },
  fill: { color: '#fbfcff' },
  verticalAlignment: 'top',
  wrapText: true,
}

sheet.getRange('A:A').format.columnWidthPx = 170
sheet.getRange('B:B').format.columnWidthPx = 170
sheet.getRange('C:C').format.columnWidthPx = 210
sheet.getRange('D:D').format.columnWidthPx = 540
sheet.getRange('E:E').format.columnWidthPx = 220

const closure = workbook.worksheets.add('业务闭环判断')
closure.getRange('A1:D1').merge()
closure.getRange('A1').values = [['一期业务闭环判断']]
closure.getRange('A2:D2').values = [['顺序', '模块', '闭环作用', '产出/备注']]
closure.getRange('A3:D8').values = closureRows
closure.getRange('A10:D10').merge()
closure.getRange('A10').values = [['结论：这五个模块可以形成一期业务闭环。建议一期闭环口径定义为“岗位来源采集/导入 -> 岗位资产建设 -> 任务与能力项结构化 -> 课程支撑关系建立 -> 覆盖缺口输出”。其中课程关联模块放入一期后，产品价值会更完整，但需要保证至少有基础课程库和能力项发布机制，否则课程关联只能停留在演示态。']]

closure.getRange('A1:D1').format = {
  font: { bold: true, size: 18, color: '#17233a' },
  fill: { color: '#eaf2ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
}
closure.getRange('A2:D2').format = {
  font: { bold: true, color: '#17233a', size: 11 },
  fill: { color: '#2450a5' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
}
closure.getRange('A3:D8').format = {
  font: { color: '#253854', size: 10 },
  verticalAlignment: 'top',
  wrapText: true,
}
closure.getRange('A10:D10').format = {
  font: { bold: true, color: '#253854', size: 11 },
  fill: { color: '#fff7e6' },
  verticalAlignment: 'middle',
  wrapText: true,
}
closure.getRange('A:A').format.columnWidthPx = 70
closure.getRange('B:B').format.columnWidthPx = 210
closure.getRange('C:C').format.columnWidthPx = 420
closure.getRange('D:D').format.columnWidthPx = 280

await fs.mkdir(previewDir, { recursive: true })
for (const renderSpec of [
  { sheetName: '一期功能清单', range: 'A1:E30', file: '一期功能清单_1.png' },
  { sheetName: '一期功能清单', range: `A31:E${lastRow}`, file: '一期功能清单_2.png' },
  { sheetName: '业务闭环判断', range: 'A1:D10', file: '业务闭环判断.png' },
]) {
  const rendered = await workbook.render({
    sheetName: renderSpec.sheetName,
    range: renderSpec.range,
    scale: 1,
  })
  await fs.writeFile(new URL(renderSpec.file, previewDir), Buffer.from(await rendered.arrayBuffer()))
}

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
})
console.log(errors.ndjson)

await fs.mkdir(outputDir, { recursive: true })
const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)
console.log(outputPath.pathname)
