import fs from 'node:fs/promises'
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool'

const outputPath = new URL('../outputs/function_inventory/岗位中心功能清单.xlsx', import.meta.url)
const previewDir = new URL('../outputs/function_inventory/render_check/', import.meta.url)

const headers = [
  '模块',
  '一级功能',
  '二级功能',
  '功能描述',
  '页面/入口',
  '交互/输出',
  '数据说明'
]

const groups = [
  {
    module: '全局框架',
    features: [
      {
        primary: '顶部导航',
        items: [
          ['岗位中心入口', '在“专业引擎”后增加“岗位中心”顶部入口，并保持与截图一致的选中态。', '顶部主导航', '点击进入岗位中心工作区。', '静态 index 与 Vite 页面均支持。'],
          ['主导航视觉一致性', '顶部品牌、模块按钮、建设成果展示、成员入口保持专业建设平台整体样式。', '全局顶部栏', '模块切换时高亮当前模块。', '沿用萧瑟专业建设520品牌。']
        ]
      },
      {
        primary: '岗位中心侧边栏',
        items: [
          ['岗位数据调研', '岗位中心左侧一级菜单，承载岗位数据采集、画像分析与趋势研判能力。', '岗位中心左侧菜单', '点击后展开“岗位分析”二级菜单。', '二级菜单包含岗位画像分析、招聘需求趋势、新岗位新技术预判。'],
          ['岗位建设中心', '岗位中心左侧一级菜单，承载岗位图谱、岗位列表、岗位详情维护等建设功能。', '岗位中心左侧菜单', '点击后进入岗位建设中心首页。', '当前默认建设数据为人工智能专业与人工智能产业链。']
        ]
      }
    ]
  },
  {
    module: '岗位数据调研',
    features: [
      {
        primary: '岗位分析 / 岗位画像分析',
        items: [
          ['浅色搜索区', '将原深色岗位搜索引擎改为浅色调，只保留搜索框与热门搜索。', '岗位数据调研-岗位画像分析', '展示搜索框、搜索按钮和热门岗位搜索标签。', '搜索区用于后续接入岗位画像检索接口。'],
          ['热门搜索', '展示核心热门岗位，点击后直接打开岗位画像详情弹窗。', '搜索区下方', '点击“AI模型部署工程师”等标签弹出详情。', '当前示例岗位包括AI模型部署工程师、工业视觉检测工程师、AI数据分析师。'],
          ['岗位画像洞察', '展示AI汇总洞察，说明岗位需求结构、薪资特征与课程建设建议。', '搜索区下方', '以AI提示条形式输出洞察文本。', '基于人工智能产业链模拟调研数据。'],
          ['岗位列表', '将“岗位画像列表”更名为“岗位列表”，展示岗位卡片。', '岗位画像分析主内容', '点击岗位卡片打开岗位画像详情。', '列表不再展示产业链-岗位映射图。'],
          ['岗位画像详情弹窗', '展示岗位名称、薪资、学历、经验、岗位层级、职业路径、岗位摘要、标签与能力分析。', '点击热门搜索或岗位卡片', '弹窗展示三维能力分析、典型任务、证书、专业、企业。', '标题区域增加招聘数据来源说明。'],
          ['数据来源说明', '在画像详情弹窗标题区域展示岗位画像数据来源。', '岗位画像详情弹窗顶部', '文案展示为招聘网站汇总来源。', '来源于BOSS直聘、智联招聘等招聘网站，共2176条同类型岗位招聘数据汇总数据。'],
          ['三维能力分析', '将原工具/技能/素养改为知识、技能、素养三类能力。', '岗位画像详情弹窗', '能力卡片展示每类至少多项能力，并配套雷达图。', '能力项可与岗位建设中心能力项保持映射。'],
          ['推荐职业资格证书', '展示岗位相关证书列表，点击可查看证书详情。', '岗位画像详情弹窗', '点击证书打开二级详情弹窗。', '证书详情包含等级、机构、有效期、通过率、考试科目、适用岗位等。'],
          ['相关企业', '展示岗位相关企业列表，点击可查看企业详情。', '岗位画像详情弹窗', '点击企业打开企业详情弹窗。', '企业详情包含企业简介、地区、行业、规模、核心产品、技术方向、招聘岗位和校企合作。']
        ]
      },
      {
        primary: '岗位分析 / 招聘需求趋势',
        items: [
          ['需求KPI', '展示近12月岗位需求、高频岗位、平均薪资、企业样本等关键指标。', '岗位数据调研-招聘需求趋势', '卡片化展示趋势指标。', '模拟招聘平台汇总数据。'],
          ['岗位需求月度趋势', '展示岗位需求指数的月度变化。', '招聘需求趋势页', '柱状趋势图呈现需求变化。', '后续可接入招聘数量时间序列。'],
          ['技能需求热度', '展示Python、MLOps、数据治理、计算机视觉等能力热度。', '招聘需求趋势页', '横向进度条展示技能热度。', '能力热度来源于招聘JD关键词统计。'],
          ['热门岗位招聘明细', '按需求增长展示岗位名称、招聘需求、薪资区间、增长趋势和重点城市。', '招聘需求趋势页', '表格输出岗位明细。', '用于支撑岗位建设优先级判断。']
        ]
      },
      {
        primary: '岗位分析 / 新岗位新技术预判',
        items: [
          ['AI预判总结', '汇总端侧大模型、多模态AIGC、AI数据合规、智能体应用等新方向。', '岗位数据调研-新岗位新技术预判', 'AI提示条展示趋势结论。', '面向未来岗位与课程建设研判。'],
          ['新兴技术方向', '展示技术方向、成熟度、产业影响与对应新岗位。', '新岗位新技术预判页', '卡片化呈现技术方向与岗位标签。', '用于发现新增岗位建设机会。'],
          ['人才培养方向建议', '将新技术方向关联建议课程、实训方向和对口专业。', '新岗位新技术预判页', '表格输出课程与实训建议。', '支持专业建设方案迭代。']
        ]
      }
    ]
  },
  {
    module: '岗位建设中心',
    features: [
      {
        primary: '建设首页',
        items: [
          ['岗位中心智能总结', '通栏展示AI总结，明确已搭建岗位数量、典型工作任务数量和岗位能力点数量。', '岗位建设中心首页顶部', 'AI总结随岗位列表数据动态统计。', '当前示例统计12个岗位、57项典型工作任务、120个岗位能力点。'],
          ['添加岗位', '点击后出现dialog，可搜索/选择岗位数据调研中的岗位并添加到建设中心。', '智能总结下方按钮', '弹窗支持搜索、选择、已添加禁用、确认添加。', '候选岗位来自岗位数据调研沉淀岗位。'],
          ['AI建岗入口', '提供AI自动建设岗位入口。', '智能总结下方按钮', '当前为入口按钮，后续可接入AI建岗流程。', '用于自动补全岗位、任务、能力、课程关系。']
        ]
      },
      {
        primary: '产业岗位课程图谱',
        items: [
          ['多对多关系图谱', '展示产业链、产业节点、岗位、课程之间的多对多关系。', '岗位建设中心首页', '节点纵向排列，线条连接上下游实体。', '课程节点已合并重复课程，岗位为独立岗位而非岗位群。'],
          ['节点合并', '相同产业链节点和重复课程按实体合并展示。', '图谱区域', '同名节点只显示一次，多条关系线连接到同一实体。', '避免重复实体造成视觉混乱。'],
          ['节点Hover高亮', '鼠标悬停实体节点时，高亮该实体及其关联线路。', '图谱区域', 'hover实体触发高亮，不以hover线为主。', '用于快速理解产业-岗位-课程关系。'],
          ['岗位计数', '图谱标题统计“岗位”数量，不使用“岗位群”命名。', '图谱列标题', '列标题展示产业链、产业节点、岗位、课程数量。', '岗位数量来自岗位卡片数据。']
        ]
      },
      {
        primary: '岗位列表',
        items: [
          ['岗位卡片', '展示岗位名称、典型工作任务数、岗位能力数、所属岗位群、关联职业和职业编码。', '岗位建设中心首页底部', '点击岗位进入岗位详情页。', '数据围绕人工智能产业链与人工智能专业准备。'],
          ['职业编码展示', '岗位卡片明确展示关联职业编码。', '岗位卡片底部', '卡片中展示职业名称和职业编码。', '满足图三“明确职业编码”的要求。']
        ]
      },
      {
        primary: '岗位详情页',
        items: [
          ['基本信息', '展示岗位名称、所属职业、职业编码、岗位层级、产业链、产业节点、关联企业、岗位群、薪资、需求等级、需求量、学历、经验、职业路径、工作内容、任职条件。', '岗位详情-基本信息', '左侧tab切换；基本信息可编辑入口。', '不展示岗位图片。'],
          ['典型工作任务', '展示岗位典型工作任务列表，含任务名称、任务描述、关联能力项标签和操作入口。', '岗位详情-典型工作任务', '支持AI生成、手动添加、编辑、删除入口。', '任务与能力项保持多对多关系。'],
          ['岗位能力项', '展示能力项列表，第二列为能力类别：知识、技能、素养。', '岗位详情-岗位能力项', '表格展示能力名称、类别、定义和操作。', '移除能力价值、五育目标字段。'],
          ['岗位能力图谱', '展示岗位、典型工作任务和知识/技能/素养能力之间的关系。', '岗位详情-岗位能力图谱', '点击典型工作任务，高亮匹配能力项并绘制连线。', '每类能力至少15个，并与任务有匹配关系。'],
          ['适岗度评价要求', '展示岗位基准画像、能力域权重、岗位基准要求和关联能力项入口。', '岗位详情-适岗度评价要求', '支持编辑入口；左侧展示适岗度说明。', '能力域包括专业核心能力、通用工具运用等。']
        ]
      }
    ]
  },
  {
    module: '数据文档与研发交付',
    features: [
      {
        primary: '字段爬取模板',
        items: [
          ['基本信息Sheet', '整理岗位基本信息字段，便于研发爬取岗位主数据。', '岗位详情字段爬取模板.xlsx', '字段包含编码、名称、类型、是否必填、爬取说明、示例值。', '已按新功能补充岗位画像、证书、企业等字段。'],
          ['典型工作任务Sheet', '整理典型工作任务字段，并保留与能力项的关联字段。', '岗位详情字段爬取模板.xlsx', '任务编码关联岗位ID和能力项编码。', '支持一岗多任务、多任务多能力。'],
          ['岗位能力项Sheet', '整理岗位能力项字段，能力类别统一为知识、技能、素养。', '岗位详情字段爬取模板.xlsx', '能力项通过关联任务编码与典型工作任务建立关系。', '支持任务-能力多对多关系爬取。'],
          ['岗位画像详情Sheet', '整理岗位画像弹窗字段，覆盖能力分析、证书、专业、企业等内容。', '岗位详情字段爬取模板.xlsx', '记录雷达图、任务、证书、企业关系字段。', '用于岗位数据调研模块详情数据入库。'],
          ['证书详情Sheet', '整理点击推荐证书后的证书详情字段。', '岗位详情字段爬取模板.xlsx', '包含证书等级、颁发机构、有效期、考试科目、适用岗位。', '支撑证书库与岗位关联。'],
          ['企业详情Sheet', '整理点击相关企业后的企业详情字段。', '岗位详情字段爬取模板.xlsx', '包含企业简介、核心产品、技术方向、招聘岗位、校企合作。', '支撑企业库与岗位画像关联。']
        ]
      },
      {
        primary: '静态访问兼容',
        items: [
          ['index.html直接打开', '支持用户直接用Chrome打开index.html查看页面，不依赖Vite开发服务。', 'index.html', '内联静态脚本提供岗位中心页面和交互兜底。', '避免直接打开空白。'],
          ['构建校验', '每次关键页面修改后运行构建和静态脚本语法检查。', '开发交付流程', 'npm run build与内联脚本校验。', '确保localhost与静态index两种访问方式可用。']
        ]
      }
    ]
  }
]

const rows = []
const moduleSpans = []
const primarySpans = []
let cursor = 3

for (const group of groups) {
  const moduleStart = cursor
  for (const feature of group.features) {
    const primaryStart = cursor
    for (const item of feature.items) {
      rows.push([
        group.module,
        feature.primary,
        item[0],
        item[1],
        item[2],
        item[3],
        item[4]
      ])
      cursor += 1
    }
    primarySpans.push({ start: primaryStart, end: cursor - 1 })
  }
  moduleSpans.push({ start: moduleStart, end: cursor - 1 })
}

const workbook = Workbook.create()
const sheet = workbook.worksheets.add('功能清单')
const lastRow = rows.length + 2

sheet.getRange('A1:G1').merge()
sheet.getRange('A1').values = [['岗位中心功能清单']]
sheet.getRange('A2:G2').values = [headers]
sheet.getRange(`A3:G${lastRow}`).values = rows

for (const span of moduleSpans) {
  if (span.end > span.start) sheet.getRange(`A${span.start}:A${span.end}`).merge()
}
for (const span of primarySpans) {
  if (span.end > span.start) sheet.getRange(`B${span.start}:B${span.end}`).merge()
}

sheet.getRange('A1:G1').format = {
  font: { bold: true, size: 18, color: '#17233a' },
  fill: { color: '#eaf2ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle'
}

sheet.getRange('A2:G2').format = {
  font: { bold: true, color: '#ffffff', size: 11 },
  fill: { color: '#326fff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
  wrapText: true
}

sheet.getRange(`A3:G${lastRow}`).format = {
  font: { color: '#253854', size: 10 },
  verticalAlignment: 'top',
  wrapText: true
}

sheet.getRange(`A3:A${lastRow}`).format = {
  font: { bold: true, color: '#174ea6', size: 11 },
  fill: { color: '#edf5ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
  wrapText: true
}

sheet.getRange(`B3:B${lastRow}`).format = {
  font: { bold: true, color: '#1f2f52', size: 10 },
  fill: { color: '#f5f8ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle',
  wrapText: true
}

sheet.getRange(`C3:C${lastRow}`).format = {
  font: { bold: true, color: '#2450a5', size: 10 },
  fill: { color: '#fbfdff' },
  verticalAlignment: 'top',
  wrapText: true
}

sheet.getRange('A:A').format.columnWidthPx = 130
sheet.getRange('B:B').format.columnWidthPx = 170
sheet.getRange('C:C').format.columnWidthPx = 180
sheet.getRange('D:D').format.columnWidthPx = 420
sheet.getRange('E:E').format.columnWidthPx = 190
sheet.getRange('F:F').format.columnWidthPx = 280
sheet.getRange('G:G').format.columnWidthPx = 320

const noteSheet = workbook.worksheets.add('清单说明')
noteSheet.getRange('A1:D1').merge()
noteSheet.getRange('A1').values = [['清单说明']]
noteSheet.getRange('A3:D8').values = [
  ['文档用途', '面向研发、产品和实施人员，用于拆解岗位中心阶段性功能范围。', '', ''],
  ['合并规则', '“模块”和“一级功能”按连续功能项合并单元格，二级功能逐项展开。', '', ''],
  ['范围说明', '清单覆盖岗位数据调研、岗位建设中心、岗位画像详情、证书详情、企业详情及数据文档交付。', '', ''],
  ['数据口径', '示例数据围绕人工智能专业与人工智能产业链准备。', '', ''],
  ['交付日期', '2026-05-25', '', ''],
  ['维护建议', '后续新增功能可继续按“模块-一级功能-二级功能”层级追加。', '', '']
]
noteSheet.getRange('A1:D1').format = {
  font: { bold: true, size: 16, color: '#17233a' },
  fill: { color: '#eaf2ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle'
}
noteSheet.getRange('A3:A8').format = {
  font: { bold: true, color: '#2450a5' },
  fill: { color: '#f4f8ff' },
  horizontalAlignment: 'center',
  verticalAlignment: 'middle'
}
noteSheet.getRange('B3:D8').merge({ across: true })
noteSheet.getRange('B3:D8').format = {
  font: { color: '#253854', size: 11 },
  verticalAlignment: 'middle',
  wrapText: true
}
noteSheet.getRange('A:A').format.columnWidthPx = 120
noteSheet.getRange('B:D').format.columnWidthPx = 260

await fs.mkdir(previewDir, { recursive: true })

for (const renderSpec of [
  { sheetName: '功能清单', range: 'A1:G28', file: '功能清单_上半部分.png' },
  { sheetName: '功能清单', range: `A29:G${lastRow}`, file: '功能清单_下半部分.png' },
  { sheetName: '清单说明', range: 'A1:D8', file: '清单说明.png' }
]) {
  const rendered = await workbook.render({
    sheetName: renderSpec.sheetName,
    range: renderSpec.range,
    scale: 1
  })
  await fs.writeFile(new URL(renderSpec.file, previewDir), Buffer.from(await rendered.arrayBuffer()))
}

const output = await SpreadsheetFile.exportXlsx(workbook)
await output.save(outputPath)
