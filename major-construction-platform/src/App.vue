<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import { applyAbilityEdit, deleteAbilityReferencesFromTasks } from './utils/job-ability-editor.js'
import {
  AI_JOB_CENTER_SUMMARY,
  COURSE_NODES,
  INDUSTRY_CHAINS,
  INDUSTRY_CHAIN_RELATIONS,
  INDUSTRY_NODES,
  JOB_INDUSTRY_RELATIONS,
  type JobAbility,
  type JobCard,
  type JobTask,
  JOB_CARDS,
  getJobDetail,
} from './mock/job-center'
import {
  DEMAND_JOB_ROWS,
  DEMAND_KPIS,
  DEMAND_SKILL_BARS,
  DEMAND_TREND,
  FORECAST_DIRECTIONS,
  FORECAST_NEW_JOBS,
  FORECAST_TRAINING_TABLE,
  JOB_RESEARCH_TABS,
  PORTRAIT_COMPETENCY_MAP_CONFIGS,
  PORTRAIT_JOB_DETAILS,
  PORTRAIT_INSIGHTS,
  PORTRAIT_JOB_PROFILES,
  RESEARCH_JOB_CANDIDATES,
  getCertificateDetail,
  getCompanyDetail,
  getPortraitJobDetail,
  type ResearchJobCandidate,
  type JobResearchTabKey,
} from './mock/job-research'
import {
  REPORT_DEFAULT_FORM,
  REPORT_DEFAULT_MAJOR,
  REPORTS,
  REPORT_CONTENT,
  REPORT_DIMENSIONS,
  REPORT_INDUSTRY_OPTIONS,
  REPORT_TOC,
  REPORT_TYPE_OPTIONS,
  type ResearchReportItem,
  type ReportTocItem,
} from './mock/research-report'
import {
  courseDiagnosisStates,
  decisionCenterMenuGroups,
  decisionCenterOverview,
  decisionImprovementPage,
  governancePlaceholderPages,
  planAnalysisStates,
  type DecisionGroupKey,
  type DecisionPageKey,
  type DecisionFlowStatus,
} from './mock/decision-center'

const topModules = [
  { label: '人才方案管理', icon: '▣' },
  { label: '专业引擎', icon: '✦' },
  { label: '岗位中心', icon: '◎' },
  { label: '专业模型', icon: '✣' },
  { label: '决策中心', icon: 'AI' },
  { label: '建设成果展示', icon: '♥', outline: true },
  { label: '成员', icon: '♙' }
]

const courseTopModules = [
  { label: '知识库', icon: '▤' },
  { label: '课程模型', icon: '✣', active: true },
  { label: 'AI应用', icon: '✦' },
  { label: '决策中心', icon: 'AI' },
  { label: '建设成果展示', icon: '♥', outline: true },
  { label: '成员', icon: '♙' }
]

const resultsPortalNav = [
  { label: '首页', active: true },
  { label: '培养方案' },
  { label: '岗位中心' },
  { label: '课程体系' },
  { label: '课程群图谱' },
  { label: 'AI工具箱' },
  { label: '智能体' },
  { label: '资源地图' }
]
const abilityTemplateColumns = ['能力项名称', '能力类别', '能力项定义'] as const
const abilityTemplateFilename = '岗位能力项导入模板.xlsx'
const abilityCategoryOptions = ['知识', '技能', '素养'] as const
type AbilityCategoryOption = (typeof abilityCategoryOptions)[number]
type AbilityEditForm = {
  name: string
  category: AbilityCategoryOption
  definition: string
}
type ParsedAbilityImportResult = {
  abilities: JobAbility[]
  errors: string[]
}

const cloneJobAbility = (ability: JobAbility): JobAbility => ({
  name: ability.name,
  category: ability.category,
  definition: ability.definition
})

const buildAbilityTemplateWorkbook = () => {
  const workbook = XLSX.utils.book_new()
  const rows = [
    ['填写说明', '请保留首行表头；能力类别仅支持“知识 / 技能 / 素养”；同一个模板内能力项名称不能重复。', '导入时将按你选择的“增量添加 / 覆盖现有”方式写入当前岗位能力项。'],
    [...abilityTemplateColumns],
    ['BIM协同建模', '技能', '能够使用BIM软件完成建筑、结构、机电模型协同建模与碰撞检查。'],
    ['现场协同沟通', '素养', '能与设计、施工、监理和构件生产人员协作完成智能建造项目交付。'],
    ['智能建造施工流程', '知识', '理解BIM深化、装配式施工、智慧工地实施、检测监测和数字化运维流程。']
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 56 }]
  workbook.Workbook = {
    Views: [{ RTL: false }]
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, '岗位能力项')
  return workbook
}

const parseAbilityImportWorkbook = async (file: File, jobName: string): Promise<ParsedAbilityImportResult> => {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!worksheet) {
    return { abilities: [], errors: ['未读取到工作表，请检查上传文件。'] }
  }

  const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
    header: 1,
    raw: false,
    defval: ''
  })
  const headerIndex = rawRows.findIndex((row) =>
    abilityTemplateColumns.every((header, columnIndex) => String(row[columnIndex] ?? '').trim() === header)
  )

  if (headerIndex === -1) {
    return { abilities: [], errors: ['未找到模板表头，请使用“下载模板”生成的标准模板填写。'] }
  }

  const abilities: JobAbility[] = []
  const errors: string[] = []
  const nameSet = new Set<string>()
  const defaultDefinition = `支撑${jobName}完成典型工作任务的关键能力项。`

  rawRows.slice(headerIndex + 1).forEach((row, index) => {
    const rowNumber = headerIndex + index + 2
    const name = String(row[0] ?? '').trim()
    const category = String(row[1] ?? '').trim() as AbilityCategoryOption
    const definition = String(row[2] ?? '').trim()
    const isEmptyRow = !name && !category && !definition

    if (isEmptyRow) return

    if (!name) {
      errors.push(`第 ${rowNumber} 行缺少“能力项名称”。`)
      return
    }
    if (!abilityCategoryOptions.includes(category)) {
      errors.push(`第 ${rowNumber} 行“能力类别”无效，请填写：知识 / 技能 / 素养。`)
      return
    }
    if (nameSet.has(name)) {
      errors.push(`第 ${rowNumber} 行能力项名称“${name}”重复，请在模板中去重。`)
      return
    }

    nameSet.add(name)
    abilities.push({
      name,
      category,
      definition: definition || defaultDefinition
    })
  })

  if (abilities.length === 0 && errors.length === 0) {
    errors.push('未解析到可导入的能力项，请至少填写一行数据。')
  }

  return { abilities, errors }
}
const resultsMenuActions = [
  { label: '查看成果页', icon: '◎', primary: true },
  { label: '编辑成果页', icon: '✎' },
  { label: '门户设置', icon: '⌁' },
  { label: '复制链接', icon: '□' }
]
const currentViewParam = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('view')
  : ''
const isResultsPortal = currentViewParam === 'results-portal'
const isCourseModelView = currentViewParam === 'course-model'
const isJobCompetencyMapView = currentViewParam === 'job-competency-map'
const sideItems = ['培养目标', '毕业要求', '课程管理', '支撑矩阵', '学生管理']
const talentSubsystemItems = [
  { key: 'research', label: '人才培养方案调研', icon: '⌕' },
  { key: 'compare', label: '人才培养方案比对', icon: '⇄' }
]
const talentGoalOverview =
  "坚持“扎根辽西、服务辽宁、对接产业、面向一线”的服务面向定位，主动融入辽宁现代化产业体系，精准对接区域产业发展布局，培养能够践行社会主义核心价值观，传承与创新技能文明，德智体美劳全面发展；具有较高的科学文化水平，良好的人文素养、科学素养、数字素养、职业道德；爱岗敬业的职业精神和精益求精的工匠精神；一定的国际视野；掌握较为系统的智能建造工程基础理论知识和技术技能；具备一定的技术研发与改造、工艺设计、技术实践能力；能够从事科技成果、实验成果转化，能够生产加工中高端产品、提供中高端服务；能够解决较复杂问题、进行较复杂操作；具有复合岗位胜任力、跨领域协作力；具有一定的创新能力，具有较强的就业创业能力和可持续发展能力，具备职业综合素质和行动能力，面向房屋建筑、土木工程建筑等行业的土木建筑工程技术人员、项目管理工程技术人员、建筑信息模型技术员等职业，能够从事装配式建筑设计与生产、智能建造技术与装备应用、智慧工地与数字化运维等工作的高端技能人才。"
const talentGoals = [
  "能够践行社会主义核心价值观，传承与创新技能文明，德智体美劳全面发展，具有坚定的理想信念和深厚的家国情怀",
  "具备良好的人文底蕴、科学精神与数字思维，能够适应建筑行业数字化、智能化转型发展需求",
  "具备爱岗敬业的职业精神、精益求精的工匠精神和诚实守信的职业道德，恪守工程伦理与行业规范",
  "具有一定的国际视野，能够跟踪智能建造领域国际前沿技术，具备终身学习和可持续发展的能力",
  "系统掌握装配式建筑设计与生产、智能建造技术与装备、智慧工地与数字化运维等三个岗位群所需的建筑力学、建筑结构、BIM技术、智能测量、自动控制等基础理论知识和技术技能",
  "具备智能建造施工工艺优化、建筑机器人应用方案设计、BIM深化设计等技术研发与改造能力，能够将新技术、新工艺、新材料、新设备在工程实践中转化应用",
  "能够完成装配式混凝土构件深化设计、智慧工地平台部署、建筑结构智能检测等中高端技术服务工作，提供高质量的智能建造解决方案",
  "能够解决大型复杂建筑工程中的施工技术难题、危大工程专项方案编制、智能检测数据判读等较复杂问题，熟练操作建筑机器人、无人机等智能装备",
  "能够胜任装配式深化设计、智能建造施工、智慧工地管理等复合岗位，具备多专业协同和跨领域团队协作能力",
  "具有技术改进、工艺创新、管理优化的创新能力，具备较强的就业竞争力和自主创业潜力",
  "面向房屋建筑业、土木工程建筑业等行业的土木建筑工程技术人员、项目管理工程技术人员、建筑信息模型技术员等职业，能够从事装配式建筑设计与生产、智能建造技术与装备应用、智慧工地与数字化运维等工作的高端技能人才"
]
const graduationOverview =
  "本专业毕业要求依据智能建造工程专业教学标准、国家职业技能标准及行业企业岗位能力要求，围绕素质、知识、能力三类共30项要求展开，强调价值塑造、工程基础、BIM与智能装备应用、智慧工地管理、智能检测监测、绿色安全施工、跨专业协作和终身学习能力的系统达成。"
const graduationRequirementSourceItems = [
  {
    code: 'R1',
    text: '素质要求：理想信念与家国情怀',
    children: ["坚定拥护中国共产党领导和中国特色社会主义制度，以习近平新时代中国特色社会主义思想为指导，践行社会主义核心价值观，具有坚定的理想信念、深厚的爱国情感和中华民族自豪感；"]
  },
  {
    code: 'R2',
    text: '素质要求：法规标准与安全质量意识',
    children: ["掌握与本专业对应职业活动相关的国家法律、行业规定，掌握绿色生产、环境保护、安全防护、质量管理等相关知识与技能，具有质量意识、环保意识、安全意识和创新思维；"]
  },
  {
    code: 'R3',
    text: '素质要求：职业道德与社会责任',
    children: ["具有良好的职业道德、职业素养和职业荣誉感,诚实守信、爱岗敬业,遵守职业道德准则行为规范,具备社会责任感和担当精神；"]
  },
  {
    code: 'R4',
    text: '素质要求：劳动素养与工匠精神',
    children: ["具有智能建造工程技术人员的劳动素养，弘扬劳模精神、劳动精神、工匠精神，崇尚劳动、尊重劳动、热爱劳动；"]
  },
  {
    code: 'R5',
    text: '素质要求：团队合作与协同沟通',
    children: ["具有较强的集体意识和团队合作意识，能够在多专业协作中有效沟通、协同工作；"]
  },
  {
    code: 'R6',
    text: '素质要求：自主学习与产业适应',
    children: ["具有自主学习和终身学习的意识，能够主动适应建筑行业技术迭代和产业升级；"]
  },
  {
    code: 'R7',
    text: '素质要求：科学态度与创新思维',
    children: ["具有理论联系实际、实事求是的科学态度和严谨的工作作风，具有批判性思维、创新思维、创业意识；"]
  },
  {
    code: 'R8',
    text: '素质要求：身心健康与人文素养',
    children: ["具有良好的身心素质和人文素养。并达到国家大学生体质测试合格标准,养成良好的运动习惯,卫生习惯和行为习惯；"]
  },
  {
    code: 'R9',
    text: '素质要求：美育素养与审美能力',
    children: ["具有一定的美育素质、文化修养和审美素质，至少形成1项艺术特长或爱好。"]
  },
  {
    code: 'R10',
    text: '知识要求：数学物理与信息技术基础',
    children: ["掌握支撑本专业学习和可持续发展的数学（高等数学、线性代数、概率论与数理统计）、物理、信息技术（含人工智能基础）等文化基础知识；"]
  },
  {
    code: 'R11',
    text: '知识要求：工程制图结构与材料基础',
    children: ["掌握建筑制图与CAD、建筑构造与识图、建筑材料、建筑力学、建筑结构、土力学与地基基础等专业基础理论知识；"]
  },
  {
    code: 'R12',
    text: '知识要求：BIM测量与智能装备知识',
    children: ["掌握建筑信息模型（BIM）基础与应用、智能测量技术、智能机械与机器人等数字化与智能化技术知识；"]
  },
  {
    code: 'R13',
    text: '知识要求：施工组织质量安全与计价知识',
    children: ["掌握智能建造施工技术、高层建筑施工、建筑施工组织、建筑工程质量与安全管理、建筑工程计量与计价等施工与管理知识；"]
  },
  {
    code: 'R14',
    text: '知识要求：智能检测监测与项目管理知识',
    children: ["掌握智能检测与监测技术、工程项目智慧管理、建筑抗震等专业核心知识；"]
  },
  {
    code: 'R15',
    text: '知识要求：装配式建筑与数智化设计知识',
    children: ["掌握装配式建筑结构设计、装配式建筑构件生产与管理、结构数智化设计等装配式方向专业知识；"]
  },
  {
    code: 'R16',
    text: '知识要求：自动控制无人机与数据分析知识',
    children: ["掌握自动控制与人工智能、无人机智能建造应用、建筑大数据分析与可视化等智能装备与数据分析方向专业知识；"]
  },
  {
    code: 'R17',
    text: '知识要求：建筑物联网与智慧运维知识',
    children: ["掌握建筑物联网技术、建筑智能化与智慧运维等智慧运维方向专业知识；"]
  },
  {
    code: 'R18',
    text: '知识要求：绿色建造与法规标准知识',
    children: ["熟悉绿色建造、节能环保、安全生产、工程建设法律法规等相关政策与标准。"]
  },
  {
    code: 'R19',
    text: '能力要求：表达沟通与跨文化交流能力',
    children: ["具备良好的语言表达能力、文字表达能力、沟通合作能力，具有一定的国际视野和跨文化交流能力；"]
  },
  {
    code: 'R20',
    text: '能力要求：探究学习与职业规划能力',
    children: ["具有探究学习、终身学习和可持续发展的能力，能够适应新技术、新岗位的要求，具备职业生涯规划能力；"]
  },
  {
    code: 'R21',
    text: '能力要求：复杂工程问题识别分析能力',
    children: ["具有较强的分析问题和解决问题的能力，能够识别、分析并解决智能建造工程中的复杂技术问题；"]
  },
  {
    code: 'R22',
    text: '能力要求：BIM物联网与人工智能集成能力',
    children: ["具有较强的整合知识和综合运用知识的能力，能够将BIM、物联网、人工智能等技术集成应用于工程实践；"]
  },
  {
    code: 'R23',
    text: '能力要求：数字工具与智慧平台应用能力',
    children: ["具备适应建筑行业数字化和智能化发展需求的数字技能，能够熟练使用BIM软件、智能检测设备、智慧管理平台等数字化工具；"]
  },
  {
    code: 'R24',
    text: '能力要求：构件拆分与深化设计能力',
    children: ["具有运用建筑结构与构造知识并借助深化设计软件进行构件深化设计的能力，能够完成装配式混凝土构件拆分与配筋深化；"]
  },
  {
    code: 'R25',
    text: '能力要求：施工计算与专项方案编制能力',
    children: ["具有施工计算、临时支撑设计、检算的能力，能够编制危大工程专项施工方案并进行技术论证；"]
  },
  {
    code: 'R26',
    text: '能力要求：智能化施工策划与指导能力',
    children: ["具有进行智能化施工项目策划、编制智能化施工方案、指导智能化施工的能力；"]
  },
  {
    code: 'R27',
    text: '能力要求：智慧工地项目综合管控能力',
    children: ["具有设计开发智能化施工工艺与方法、进行项目信息化管理的能力，能够应用智慧工地平台进行进度、质量、安全、成本综合管控；"]
  },
  {
    code: 'R28',
    text: '能力要求：智能检测数据分析与判断能力',
    children: ["具有选择智能化检测设备、编制工程质量检测方案、对采集数据进行分析与判断并提出解决办法的能力；"]
  },
  {
    code: 'R29',
    text: '能力要求：绿色安全质量与法规应用能力',
    children: ["具有绿色施工、安全防护、质量管理、节能减排意识及正确应用建设工程法律法规的能力；"]
  },
  {
    code: 'R30',
    text: '能力要求：国际视野创新与数字化管理能力',
    children: ["具有一定的国际视野、创新能力及适应建筑业数字化转型升级的数字化应用与管理能力。"]
  }
]
const graduationSourceChildren = (...indexes: number[]) =>
  indexes.flatMap((index) => graduationRequirementSourceItems[index]?.children ?? [])
const graduationRequirements = [
  {
    code: 'R1',
    text: '价值塑造与职业素养',
    children: graduationSourceChildren(0, 2, 3, 7, 8)
  },
  {
    code: 'R2',
    text: '工程法规与绿色安全素养',
    children: graduationSourceChildren(1, 17, 28)
  },
  {
    code: 'R3',
    text: '工程基础与智能建造专业知识',
    children: graduationSourceChildren(9, 10, 11, 12, 13)
  },
  {
    code: 'R4',
    text: '装配式建筑与智慧运维方向知识',
    children: graduationSourceChildren(14, 15, 16)
  },
  {
    code: 'R5',
    text: '沟通协作与终身发展',
    children: graduationSourceChildren(4, 5, 6, 18, 19)
  },
  {
    code: 'R6',
    text: '复杂工程问题与数字工具应用',
    children: graduationSourceChildren(20, 21, 22)
  },
  {
    code: 'R7',
    text: '装配式深化设计与智能化施工',
    children: graduationSourceChildren(23, 24, 25)
  },
  {
    code: 'R8',
    text: '智慧工地管理、智能检测与创新发展',
    children: graduationSourceChildren(26, 27, 29)
  }
]
const talentCourses = [
  ["B260001", "思想道德与法治", "", "马克思主义学院", "3", "公共必修", "第2学期", "2"],
  ["B260002", "中国近现代史纲要", "", "马克思主义学院", "3", "公共必修", "第1学期", "2"],
  ["B260003", "马克思主义基本原理", "", "马克思主义学院", "3", "公共必修", "第4学期", "2"],
  ["B260004", "毛泽东思想和中国特色社会主义理论体系概论", "", "马克思主义学院", "3", "公共必修", "第3学期", "2"],
  ["B260005", "习近平新时代中国特色社会主义思想概论", "", "马克思主义学院", "3", "公共必修", "第6学期", "2"],
  ["B260006", "“四史”概论", "", "马克思主义学院", "1", "公共必修", "第5学期", "2"],
  ["B260007-（1-8）", "形势与政策（1-8）", "", "马克思主义学院", "2", "公共必修", "第1-8学期", "2"],
  ["B260008", "大学生心理健康教育", "", "心理健康教育与咨询中心", "2", "公共必修", "第1学期", "2"],
  ["B260009", "高等数学A-1", "", "基础教研部", "3", "公共必修", "第1学期", "2"],
  ["B260010", "高等数学A-2", "", "基础教研部", "4", "公共必修", "第2学期", "2"],
  ["B260013", "线性代数", "", "基础教研部", "2", "公共必修", "第2学期", "2"],
  ["B260014", "概率论与数理统计", "", "基础教研部", "3", "公共必修", "第3学期", "2"],
  ["B260015", "大学物理", "", "基础教研部", "3", "公共必修", "第2学期", "2"],
  ["B260016", "大学物理实验", "", "基础教研部", "2", "公共必修", "第3学期", "2"],
  ["B260017", "大学英语1/小语种外语1", "", "基础教研部", "4", "公共必修", "第1学期", "2"],
  ["B260018", "大学英语2/小语种外语2", "", "基础教研部", "4", "公共必修", "第2学期", "2"],
  ["B260019", "军事理论", "", "基础教研部", "2", "公共必修", "第1学期", "2"],
  ["B260020", "国家安全教育", "", "基础教研部", "1", "公共必修", "第1-8学期", "2"],
  ["B260021-（1-4）", "体育（1-4）", "", "体育教研部", "4", "公共必修", "第1学期、第2学期、第3学期、第4学期", "2"],
  ["B260022", "劳动教育理论与实践", "", "素质教育教研部", "2", "公共必修", "第1-8学期", "3"],
  ["B260023", "大学生职业生涯规划", "", "创新创业学院", "1", "公共必修", "第1学期", "2"],
  ["B260024", "大学生就业指导", "", "创新创业学院", "1", "公共必修", "第5学期", "2"],
  ["B260025", "创新创业基础", "", "创新创业学院", "2", "公共必修", "第4学期", "2"],
  ["B260026", "信息技术与人工智能基础", "", "信息工程学院", "3", "公共必修", "第1学期", "2"],
  ["B261301", "建筑力学", "", "建筑工程学院", "3", "专业基础必修", "第2学期", "3"],
  ["B261302", "建筑制图与CAD", "", "建筑工程学院", "2", "专业基础必修", "第3学期", "3"],
  ["B261303", "建筑构造与识图", "", "建筑工程学院", "2", "专业基础必修", "第3学期", "3"],
  ["B261304", "建筑材料", "", "建筑工程学院", "2", "专业基础必修", "第3学期", "3"],
  ["B261305", "建筑结构", "", "建筑工程学院", "3", "专业基础必修", "第3学期", "3"],
  ["B261306", "建筑信息模型基础", "建筑信息模型基础-智能体", "建筑工程学院", "2", "专业基础必修", "第3学期", "3"],
  ["B261307", "智能测量技术", "智能测量技术-智能体", "建筑工程学院", "3", "专业基础必修", "第4学期", "3"],
  ["B261308", "土力学与地基基础", "", "建筑工程学院", "2", "专业基础必修", "第4学期", "3"],
  ["B261309", "建筑抗震", "", "建筑工程学院", "2", "专业核心必修", "第4学期", "4"],
  ["B261310", "建筑工程计量与计价", "", "建筑工程学院", "2", "专业核心必修", "第5学期", "4"],
  ["B261311", "智能建造施工技术", "智能建造施工技术-智能体", "建筑工程学院", "3", "专业核心必修", "第5学期", "4"],
  ["B261312", "建筑工程质量与安全管理", "", "建筑工程学院", "2", "专业核心必修", "第5学期", "4"],
  ["B261313", "智能检测与监测技术", "智能检测与监测技术-智能体", "建筑工程学院", "3", "专业核心必修", "第5学期", "4"],
  ["B261314", "智能机械与机器人", "智能机械与机器人-智能体", "建筑工程学院", "2", "专业核心必修", "第5学期", "4"],
  ["B261315", "建筑信息模型应用", "建筑信息模型应用-智能体", "建筑工程学院", "3", "专业核心必修", "第6学期", "4"],
  ["B261316", "建筑施工组织", "", "建筑工程学院", "3", "专业核心必修", "第6学期", "4"],
  ["B261317", "工程项目智慧管理", "工程项目智慧管理-智能体", "建筑工程学院", "3", "专业核心必修", "第6学期", "4"],
  ["B261318", "高层建筑施工", "", "建筑工程学院", "3", "专业核心必修", "第6学期", "4"],
  ["B261319", "Python程序设计基础", "", "建筑工程学院", "2", "专业拓展选修", "第4学期", "3"],
  ["B261320", "装配式深化设计协同与应用", "装配式深化设计协同与应用-智能体", "建筑工程学院", "2", "专业拓展选修", "第4学期", "3"],
  ["B261321", "无人机智能建造应用", "无人机智能建造应用-智能体", "建筑工程学院", "2", "专业拓展选修", "第4学期", "3"],
  ["B261322", "建筑机器人操作与维护", "建筑机器人操作与维护-智能体", "建筑工程学院", "2", "专业拓展选修", "第4学期", "3"],
  ["B261323", "结构数智化设计", "结构数智化设计-智能体", "建筑工程学院", "2", "专业拓展选修", "第4学期", "3"],
  ["B261324", "5G与物联网在智慧工地应用", "5G与物联网在智慧工地应用-智能体", "建筑工程学院", "2", "专业拓展选修", "第4学期", "3"],
  ["B261325", "装配式建筑结构设计", "装配式建筑结构设计-智能体", "建筑工程学院", "2", "专业拓展选修", "第5学期", "3"],
  ["B261326", "建筑元宇宙与VR/AR可视化", "建筑元宇宙与VR/AR可视化-智能体", "建筑工程学院", "2", "专业拓展选修", "第5学期", "3"],
  ["B261327", "装配式建筑构件生产与管理", "装配式建筑构件生产与管理-智能体", "建筑工程学院", "2", "专业拓展选修", "第5学期", "3"],
  ["B261328", "工程大数据与云计算", "工程大数据与云计算-智能体", "建筑工程学院", "2", "专业拓展选修", "第5学期", "3"],
  ["B261329", "自动控制与人工智能", "自动控制与人工智能-智能体", "建筑工程学院", "2", "专业拓展选修", "第5学期", "3"],
  ["B261330", "绿色建造与节能技术", "", "建筑工程学院", "2", "专业拓展选修", "第5学期", "3"],
  ["B261331", "建筑物联网技术", "建筑物联网技术-智能体", "建筑工程学院", "2", "专业拓展选修", "第5学期", "3"],
  ["B261332", "钢结构BIM深化设计", "钢结构BIM深化设计-智能体", "建筑工程学院", "2", "专业拓展选修", "第5学期", "3"],
  ["B261333", "建筑智能化与智慧运维", "建筑智能化与智慧运维-智能体", "建筑工程学院", "2", "专业拓展选修", "第6学期", "3"],
  ["B261334", "建筑智能运维与设施管理", "建筑智能运维与设施管理-智能体", "建筑工程学院", "2", "专业拓展选修", "第6学期", "3"],
  ["B261335", "建筑大数据分析与可视化", "建筑大数据分析与可视化-智能体", "建筑工程学院", "2", "专业拓展选修", "第6学期", "3"],
  ["B261336", "区块链与建筑产业互联网", "", "建筑工程学院", "2", "专业拓展选修", "第6学期", "3"],
  ["B261337", "多层框架结构BIM深化设计", "多层框架结构BIM深化设计-智能体", "建筑工程学院", "1", "集中实践必修", "第6学期", "3"],
  ["B261338", "装配式混凝土构件深化设计", "装配式混凝土构件深化设计-智能体", "建筑工程学院", "1", "集中实践必修", "第7学期", "3"],
  ["B261339", "危大工程专项施工方案编制", "", "建筑工程学院", "1", "集中实践必修", "第7学期", "3"],
  ["B261340", "智慧工地平台部署与管理", "智慧工地平台部署与管理-智能体", "建筑工程学院", "1", "集中实践必修", "第7学期", "3"],
  ["B261341", "建筑结构智能检测与健康监测", "建筑结构智能检测与健康监测-智能体", "建筑工程学院", "1", "集中实践必修", "第7学期", "3"],
  ["B260027", "军事训练", "", "基础教研部", "3", "集中实践必修", "第1学期", "3"],
  ["B260028", "社会实践", "", "团委、各学院", "1", "集中实践必修", "第4学期", "3"],
  ["B260029", "入学教育", "", "各学院", "1", "集中实践必修", "第1学期", "3"],
  ["B260030", "毕业教育", "", "各学院", "1", "集中实践必修", "第8学期", "3"],
  ["B260031", "认识实习", "", "各学院", "1", "集中实践必修", "第1学期", "3"],
  ["B260032", "岗位实习", "", "各学院", "24", "集中实践必修", "第7学期、第8学期", "3"],
  ["B260033", "毕业设计", "", "各学院", "8", "集中实践必修", "第8学期", "3"],
  ["B260034", "创新创业实践", "", "教务处、各学院", "2", "第二课堂", "第8学期", "3"],
  ["B260035", "综合素养", "", "相关单位", "2", "第二课堂", "第8学期", "2"]
]
const courseModelTitle = '概率论与数理统计-wjl-智能体'
const courseModelMenuGroups = [
  {
    title: '知识模型',
    items: [
      { label: '知识图谱', desc: '通过图的形式表达知识点关系', icon: '✣', active: true }
    ]
  },
  {
    title: '能力模型',
    items: [
      { label: '能力图谱', desc: '基于课程目标建课程能力模型', icon: '♙', active: false }
    ]
  },
  {
    title: '问题模型',
    items: [
      { label: '问题图谱', desc: '解决问题和决策时的关键工具', icon: '☷', active: false },
      { label: '问答对', desc: '提炼关键问题，补充特定知识', icon: '▣', active: false }
    ]
  },
  {
    title: '素质模型',
    items: [
      { label: '素质图谱', desc: '将抽象育人目标具象化', icon: '✤', active: false }
    ]
  },
  {
    title: '增强知识库',
    items: [
      { label: '增强知识库', desc: '增强知识库', icon: '◈', active: false }
    ]
  }
]
type CourseMemberRow = {
  account: string
  name: string
  college: string
  role: string
  system?: boolean
}
type CoursePermissionType = 'all' | 'check' | 'none'
type CourseRolePermissionRow = {
  firstMenu: string
  secondMenu: string
  view: CoursePermissionType
  manage: CoursePermissionType
  download: CoursePermissionType
  scope: string
}
type CourseAbilityCategory = '知识' | '技能' | '素养'
type CourseAbilityCategoryMap = Record<CourseAbilityCategory, string[]>
type CourseAbilityJobOption = {
  id: string
  name: string
  chain: string
  node: string
  abilities: CourseAbilityCategoryMap
}
type CourseNodeAbilityRelation = {
  jobId: string
  jobName: string
  chain: string
  node: string
  abilities: CourseAbilityCategoryMap
}
const courseMemberRows: CourseMemberRow[] = [
  { account: 'mr1758626', name: '梅蕊', college: '体育学院不是体育学院', role: '超级管理员', system: true },
  { account: 'wangyunceshi2', name: '王云测试2', college: '计算机学院', role: '普通管理员', system: true },
  { account: '20200312', name: '汪老师', college: '总指挥部', role: '普通管理员', system: true },
  { account: 'huoyuting123', name: '霍玉婷', college: '计算机学院', role: '普通管理员', system: true },
  { account: 'wangyun', name: '王云', college: '体育学院不是体育学院', role: '超级管理员', system: true },
  { account: 'shiwei', name: '施维-黄河', college: '保卫处', role: '超级管理员', system: true },
  { account: 'wangxiaozhang', name: '汪校长', college: '哈利波特学院', role: '普通管理员', system: true },
]
const courseSystemRoles = ['超级管理员', '普通管理员', '使用者', '评审专家']
const courseCustomRoles = ['仅查看', '查看全部管理资源']
const courseRolePermissionRows: CourseRolePermissionRow[] = [
  { firstMenu: '知识库', secondMenu: '—', view: 'all', manage: 'all', download: 'none', scope: '*本人”包括本人关联的资源和上传的文件' },
  { firstMenu: '课程模型', secondMenu: '知识图谱/问题图谱/能力图谱/问答对', view: 'check', manage: 'check', download: 'check', scope: '—' },
  { firstMenu: '课程模型', secondMenu: '开放图谱到班级', view: 'all', manage: 'all', download: 'none', scope: '*本人”包括本人为主讲或协同的教学班' },
  { firstMenu: 'AI应用', secondMenu: '24小时智能学伴', view: 'check', manage: 'check', download: 'none', scope: '—' },
  { firstMenu: 'AI应用', secondMenu: '智能批改', view: 'all', manage: 'all', download: 'none', scope: '他人共享的规则仅可查看，不可修改' },
  { firstMenu: 'AI应用', secondMenu: '智能体协作', view: 'all', manage: 'all', download: 'none', scope: '共享智能体的相关权限需在智能体中设置' },
  { firstMenu: 'AI应用', secondMenu: '教学百宝箱', view: 'all', manage: 'all', download: 'none', scope: '他人共享的工具仅可查看使用，不可编辑调整' },
  { firstMenu: 'AI应用', secondMenu: '指令库', view: 'all', manage: 'all', download: 'none', scope: '*本人”是指本人创建的指令' },
  { firstMenu: 'AI应用', secondMenu: '开放AI应用', view: 'all', manage: 'all', download: 'none', scope: '*本人”包括本人为主讲或协同的教学班' },
  { firstMenu: '决策中心', secondMenu: '—', view: 'all', manage: 'all', download: 'all', scope: '*本人”包括本人为主讲或协同的教学班，班级列表依赖数据更新时间，最晚隔日生效' },
]
const courseKnowledgeLevels = [
  { label: '一级', count: 1, tone: 'purple' },
  { label: '二级', count: 9, tone: 'blue' },
  { label: '三级', count: 29, tone: 'green' },
  { label: '四级', count: 82, tone: 'cyan' },
  { label: '五级', count: 89, tone: 'teal' },
  { label: '思政点', count: 1, tone: 'pink' }
]
const courseKnowledgeNodes = [
  { label: '概率论与\n数理统计', x: 50, y: 52, level: 'root' },
  { label: '概率论基础', x: 45, y: 29, level: 'major', count: 8 },
  { label: '随机变量\n的数字特征', x: 52, y: 39, level: 'major', count: 6 },
  { label: '一维随机\n变量', x: 70, y: 35, level: 'major', count: 8 },
  { label: '参数估计', x: 74, y: 55, level: 'major' },
  { label: '数理统计\n基础', x: 56, y: 70, level: 'major' },
  { label: '大数定律\n与中心极限定理', x: 41, y: 68, level: 'major' },
  { label: '多维随机\n变量', x: 30, y: 48, level: 'major', count: 6 },
  { label: '条件概率与独立性', x: 42, y: 13, level: 'leaf', count: 10 },
  { label: '概率的定义与性质', x: 51, y: 12, level: 'leaf', count: 8 },
  { label: '随机变量的分布函数', x: 83, y: 26, level: 'leaf', count: 6 },
  { label: '点估计', x: 88, y: 52, level: 'leaf', count: 4 },
  { label: '区间估计', x: 82, y: 68, level: 'leaf', count: 8 },
  { label: '方差分析', x: 66, y: 78, level: 'leaf', count: 5 },
  { label: '中心极限定理', x: 50, y: 80, level: 'leaf', count: 10 },
  { label: '假设检验原理', x: 35, y: 78, level: 'leaf', count: 6 },
  { label: '二维均匀与正态分布', x: 20, y: 55, level: 'leaf', count: 4 },
  { label: '随机事件与样本空间', x: 28, y: 28, level: 'leaf', count: 8 }
]
const courseDetailTabs = ['知识点详情', '岗位能力', '学习内容', '知识点关系', '习题', '教材']
const courseAbilityCategories: CourseAbilityCategory[] = ['知识', '技能', '素养']
const createEmptyCourseAbilityMap = (): CourseAbilityCategoryMap => ({ 知识: [], 技能: [], 素养: [] })
const cloneCourseAbilityMap = (abilities: CourseAbilityCategoryMap): CourseAbilityCategoryMap => ({
  知识: [...abilities.知识],
  技能: [...abilities.技能],
  素养: [...abilities.素养]
})
const hasCourseAbilities = (abilities: CourseAbilityCategoryMap) =>
  courseAbilityCategories.some((category) => abilities[category].length > 0)
const courseJobAbilityOptions: CourseAbilityJobOption[] = PORTRAIT_JOB_DETAILS.map((job) => {
  const abilities = createEmptyCourseAbilityMap()
  for (const group of job.abilityGroups) {
    abilities[group.label] = [...group.items]
  }
  return {
    id: job.id,
    name: job.name,
    chain: job.chain,
    node: job.node,
    abilities
  }
})
const researchPlanResults = [
  {
    id: 'plan-sjzu-smart-construction-2025',
    name: '沈阳建筑大学智能建造工程专业人才培养方案',
    year: '2025',
    school: '沈阳建筑大学',
    major: '智能建造工程',
    type: '本科',
    pages: 54,
    updatedAt: '2025-06',
    keywords: ['2025年沈建大智能建造人培', '智能建造工程', 'BIM智慧工地'],
    summary: '围绕BIM正向设计、装配式建造、智慧工地与智能检测监测构建工程化实践课程体系。'
  },
  {
    id: 'plan-dlut-civil-smart-2024',
    name: '大连理工大学土木工程智能建造方向人才培养方案',
    year: '2024',
    school: '大连理工大学',
    major: '土木工程（智能建造方向）',
    type: '本科',
    pages: 58,
    updatedAt: '2024-11',
    keywords: ['2024年大工智能建造方向', '土木工程', '结构监测'],
    summary: '以工程力学、结构设计、智能测量与结构健康监测为主线，强化复杂工程问题解决能力。'
  },
  {
    id: 'plan-lncc-prefab-2025',
    name: '辽宁建筑职业学院装配式建筑工程技术人才培养方案',
    year: '2025',
    school: '辽宁建筑职业学院',
    major: '装配式建筑工程技术',
    type: '高职专科',
    pages: 46,
    updatedAt: '2025-05',
    summary: '面向构件深化、生产排程、装配施工和质量验收岗位，设置项目化实训与校企评价。'
  },
  {
    id: 'plan-hljcc-smart-site-2024',
    name: '黑龙江建筑职业技术学院智能建造技术专业人才培养方案',
    year: '2024',
    school: '黑龙江建筑职业技术学院',
    major: '智能建造技术',
    type: '高职专科',
    pages: 44,
    updatedAt: '2024-09',
    summary: '突出智慧工地平台、物联网设备接入、安全质量数据治理和现场协同管理能力。'
  },
  {
    id: 'plan-cqjz-bim-2024',
    name: '重庆建筑工程职业学院建筑信息模型技术人才培养方案',
    year: '2024',
    school: '重庆建筑工程职业学院',
    major: '建筑信息模型技术',
    type: '高职专科',
    pages: 42,
    updatedAt: '2024-08',
    summary: '围绕BIM建模、管线综合、碰撞检查、工程量提取和数字化交付建立能力递进。'
  },
  {
    id: 'plan-sdcc-smart-survey-2023',
    name: '山东城市建设职业学院智能测绘工程技术人才培养方案',
    year: '2024',
    school: '山东城市建设职业学院',
    major: '智能测绘工程技术',
    type: '高职专科',
    pages: 40,
    updatedAt: '2024-06',
    summary: '聚焦无人机航测、三维激光扫描、点云处理、施工放样和工程测量成果审核。'
  }
]
const compareModules = [
  {
    name: '培养目标',
    score: '86%',
    status: '需补强',
    source: '本地方案已覆盖建筑工程基础、施工管理和数字素养，但对BIM深化设计、智慧工地和智能检测监测等岗位能力表述偏弱。',
    target: '对标方案围绕BIM正向设计、装配式建筑、智慧工地平台部署、智能测量与三维扫描、结构健康监测和建筑机器人应用设置培养面向。',
    advice: '建议把服务辽宁建筑业数字化转型、面向智能建造工程技术人员和建筑信息模型技术员的定位写入培养目标，并要求学生形成可验收的工程成果物。'
  },
  {
    name: '毕业要求',
    score: '78%',
    status: '建议修订',
    source: '毕业要求覆盖价值塑造、工程基础和职业素养，但BIM模型交付、装配式构件深化、现场数据采集和安全质量闭环等可观测指标不足。',
    target: '对标方案把复杂工程问题拆解为建筑识图、BIM深化设计、构件深化与生产排程、智慧工地数据治理、智能检测监测和工程协同交付等指标。',
    advice: '建议将毕业要求整合为8类左右，每类设置2到4个二级指标，并为每个指标绑定课程任务、项目成果物和评价证据。'
  },
  {
    name: '课程体系',
    score: '82%',
    status: '可优化',
    source: '课程体系已有建筑制图、建筑材料、施工技术和工程管理基础，但智能建造岗位模块之间的先修关系和项目贯通还不够清晰。',
    target: '对标方案形成“工程基础-BIM深化设计-装配式构件深化-智慧工地平台部署-智能检测监测-数字化交付”的课程链。',
    advice: '建议新增或强化BIM深化设计实训、装配式建筑深化设计、智能测量与三维扫描、智慧工地平台应用、结构健康监测、建筑机器人应用等课程模块。'
  },
  {
    name: '实践教学',
    score: '74%',
    status: '差异明显',
    source: '实践环节以课程实验、认识实习和岗位实习为主，BIM协同、构件深化、智慧工地设备接入和智能检测监测的综合项目偏少。',
    target: '对标方案按“基础认知-专项技能-工程综合-岗位实战”递进，要求完成BIM模型、构件清单、点云成果、智慧工地看板和监测分析报告。',
    advice: '建议重排为BIM建模实训、装配式构件深化实训、智能测量与三维扫描实训、智慧工地平台部署实训、结构健康监测与建筑机器人应用综合项目。'
  },
  {
    name: '支撑矩阵',
    score: '80%',
    status: '需对齐',
    source: '矩阵已覆盖培养目标与毕业要求，但部分课程只标注支撑关系，缺少强弱支撑、成果物类型和考核证据。',
    target: '对标方案将培养目标、毕业要求、课程目标、典型工作任务和工程成果物连成闭环，区分强支撑、一般支撑与达成评价。',
    advice: '建议在矩阵中增加支撑强度、课程任务、成果物、评价方式四个字段，用BIM模型、施工方案、监测报告和平台看板作为证据。'
  }
]
const compareEditorSeed = `# 人才培养方案修订稿

## 培养目标
面向辽宁建筑业数字化转型和智能建造产业链，培养掌握建筑工程基础、BIM深化设计、装配式建造、智慧工地平台部署、智能检测监测和建筑机器人应用能力的高素质技术技能人才。

## 毕业要求优化
1. 能够识读建筑与结构施工图，完成BIM模型创建、碰撞检查、工程量提取和数字化交付。
2. 能够完成装配式构件深化、生产排程、现场装配协同和质量验收资料整理。
3. 能够部署智慧工地平台，接入物联设备，开展安全质量数据分析、风险预警和整改闭环。
4. 能够使用智能测量与三维扫描、结构健康监测和建筑机器人等技术完成工程现场任务。
5. 具备工程伦理、安全生产、绿色建造、团队协作和持续学习能力。`
const compareEditorDraftTitle = (module: (typeof compareModules)[number]) => {
  if (module.name === '培养目标') return '培养目标修订稿'
  if (module.name === '毕业要求') return '毕业要求修订稿'
  if (module.name === '课程体系') return '课程体系修订稿'
  return `${module.name}修订稿`
}
const buildCompareEditorDraft = (module: (typeof compareModules)[number]) => `# ${compareEditorDraftTitle(module)}

## 当前方案
${module.source}

## 对标方案
${module.target}

## 修订内容
${module.advice}`
const defaultCompareEditorContents = compareModules.reduce<Record<string, string>>((drafts, module) => {
  drafts[module.name] = buildCompareEditorDraft(module)
  return drafts
}, {})
const matrixGoals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const matrixRows: Array<{ code: string; label: string; title: string; goals: number[] }> = [
  { code: 'R1', label: '毕业要求 R1', title: '价值塑造与职业素养', goals: [1, 2, 3, 4] },
  { code: 'R2', label: '毕业要求 R2', title: '工程法规与绿色安全素养', goals: [2, 3, 6, 8, 10] },
  { code: 'R3', label: '毕业要求 R3', title: '工程基础与智能建造专业知识', goals: [2, 5, 7, 8, 11] },
  { code: 'R4', label: '毕业要求 R4', title: '装配式建筑与智慧运维方向知识', goals: [5, 6, 7, 9, 11] },
  { code: 'R5', label: '毕业要求 R5', title: '沟通协作与终身发展', goals: [3, 4, 9, 10, 11] },
  { code: 'R6', label: '毕业要求 R6', title: '复杂工程问题与数字工具应用', goals: [5, 6, 8, 10, 11] },
  { code: 'R7', label: '毕业要求 R7', title: '装配式深化设计与智能化施工', goals: [5, 6, 7, 8, 9, 11] },
  { code: 'R8', label: '毕业要求 R8', title: '智慧工地管理、智能检测与创新发展', goals: [6, 7, 8, 9, 10, 11] }
]
const jobSideItems = ['产业调研', '产业调研报告', '岗位建设中心']
type IndustryResearchTabKey = 'chain' | 'region' | 'policy' | 'company'
type IndustrySankeyStageKey = 'upstream' | 'midstream' | 'downstream'
type IndustrySankeyNode = {
  id: string
  stage: IndustrySankeyStageKey
  name: string
  meta: string
  note: string
}
type IndustrySankeyLink = {
  source: string
  target: string
  value: number
  fromColor: string
  toColor: string
}
const INDUSTRY_RESEARCH_TABS: Array<{ key: IndustryResearchTabKey; label: string }> = [
  { key: 'chain', label: '产业链图谱' },
  { key: 'region', label: '区域产业分析' },
  { key: 'policy', label: '产业政策库' },
  { key: 'company', label: '产业企业库' }
]
const industrySankeyStages: Array<{ key: IndustrySankeyStageKey; label: string; summary: string; accent: string; stats: string }> = [
  { key: 'upstream', label: '上游', summary: 'BIM数据与工程装备', accent: '#5b7cfa', stats: '5类资源节点 / 188家供给企业' },
  { key: 'midstream', label: '中游', summary: '平台服务与工程实施', accent: '#28c7bd', stats: '5类平台节点 / 42类核心岗位' },
  { key: 'downstream', label: '下游', summary: '施工检测与智慧运维', accent: '#ff7048', stats: '5类场景簇 / 482个落地项目' }
]
const industrySankeyNodes: IndustrySankeyNode[] = [
  { id: 'compute', stage: 'upstream', name: 'BIM标准与工程数据', meta: '48家企业', note: '模型标准 / 工程资料' },
  { id: 'collection', stage: 'upstream', name: '智能测绘与空间数据', meta: '56家企业', note: '三维激光 / 无人机' },
  { id: 'edge', stage: 'upstream', name: '建筑物联网终端', meta: '34家企业', note: '摄像头 / 网关 / 传感器' },
  { id: 'corpus', stage: 'upstream', name: '装配式构件数据', meta: '29类数据', note: '构件库 / 生产参数' },
  { id: 'security', stage: 'upstream', name: '工程质量安全数据', meta: '21家服务商', note: '检测 / 监测 / 验收' },
  { id: 'governance', stage: 'midstream', name: 'BIM协同与算量平台', meta: '12类岗位', note: '建模 / 审查 / 算量' },
  { id: 'devtrain', stage: 'midstream', name: '智慧工地管理平台', meta: '18类岗位', note: '进度 / 质量 / 安全' },
  { id: 'deploy', stage: 'midstream', name: '装配式设计生产服务', meta: '16类岗位', note: '深化 / 拆分 / 排程' },
  { id: 'agent', stage: 'midstream', name: '建筑机器人与智能装备', meta: '11类岗位', note: '路径 / 联调 / 施工' },
  { id: 'mlops', stage: 'midstream', name: '工程数据治理与平台实施', meta: '9类岗位', note: '配置 / 看板 / 交付' },
  { id: 'vision', stage: 'downstream', name: '智能建造施工场景', meta: '132个项目', note: '现场组织 / 装备协同' },
  { id: 'education', stage: 'downstream', name: '智能检测监测场景', meta: '96个项目', note: '结构健康 / 缺陷识别' },
  { id: 'govern', stage: 'downstream', name: '绿色建造与节能管理', meta: '64个项目', note: '低碳施工 / 能耗分析' },
  { id: 'service', stage: 'downstream', name: '智慧运维与城市更新', meta: '118个项目', note: '运维工单 / 既有建筑' },
  { id: 'edgeapp', stage: 'downstream', name: '工程交付与资料归档', meta: '72个项目', note: '竣工模型 / 交付文档' }
]
const industrySankeyLinks: IndustrySankeyLink[] = [
  { source: 'compute', target: 'devtrain', value: 22, fromColor: '#6b8dff', toColor: '#73ddd3' },
  { source: 'compute', target: 'deploy', value: 24, fromColor: '#6b8dff', toColor: '#63c7f6' },
  { source: 'collection', target: 'governance', value: 26, fromColor: '#73ddd3', toColor: '#28c7bd' },
  { source: 'collection', target: 'devtrain', value: 14, fromColor: '#73ddd3', toColor: '#63c7f6' },
  { source: 'edge', target: 'deploy', value: 18, fromColor: '#6b8dff', toColor: '#63c7f6' },
  { source: 'edge', target: 'mlops', value: 11, fromColor: '#6b8dff', toColor: '#7ac9ff' },
  { source: 'corpus', target: 'agent', value: 17, fromColor: '#8f7cff', toColor: '#63c7f6' },
  { source: 'security', target: 'governance', value: 19, fromColor: '#ffb16a', toColor: '#28c7bd' },
  { source: 'security', target: 'mlops', value: 13, fromColor: '#ffb16a', toColor: '#7ac9ff' },
  { source: 'governance', target: 'vision', value: 11, fromColor: '#28c7bd', toColor: '#ff9c7b' },
  { source: 'governance', target: 'govern', value: 9, fromColor: '#28c7bd', toColor: '#ff9c7b' },
  { source: 'devtrain', target: 'vision', value: 14, fromColor: '#63c7f6', toColor: '#ff9c7b' },
  { source: 'devtrain', target: 'education', value: 16, fromColor: '#63c7f6', toColor: '#ffb16a' },
  { source: 'deploy', target: 'service', value: 18, fromColor: '#63c7f6', toColor: '#ff9c7b' },
  { source: 'deploy', target: 'edgeapp', value: 17, fromColor: '#63c7f6', toColor: '#ffb16a' },
  { source: 'agent', target: 'education', value: 20, fromColor: '#7f86ff', toColor: '#ffb16a' },
  { source: 'agent', target: 'govern', value: 15, fromColor: '#7f86ff', toColor: '#ff9c7b' },
  { source: 'agent', target: 'service', value: 22, fromColor: '#7f86ff', toColor: '#ff9c7b' },
  { source: 'mlops', target: 'vision', value: 12, fromColor: '#7ac9ff', toColor: '#ff9c7b' },
  { source: 'mlops', target: 'edgeapp', value: 10, fromColor: '#7ac9ff', toColor: '#ffb16a' }
]
const industrySankeyNodeLayout = {
  width: 1180,
  height: 500,
  cardWidth: 230,
  cardHeight: 68,
  startY: 74,
  rowGap: 90,
  columnX: {
    upstream: 34,
    midstream: 475,
    downstream: 916
  } satisfies Record<IndustrySankeyStageKey, number>
}
const industrySankeyColumns = industrySankeyStages.map((stage) => ({
  ...stage,
  nodes: industrySankeyNodes.filter((node) => node.stage === stage.key)
}))
const industrySankeyNodePositions = new Map(
  industrySankeyNodes.map((node) => {
    const columnNodes = industrySankeyNodes.filter((item) => item.stage === node.stage)
    const rowIndex = columnNodes.findIndex((item) => item.id === node.id)
    return [
      node.id,
      {
        x: industrySankeyNodeLayout.columnX[node.stage],
        y: industrySankeyNodeLayout.startY + rowIndex * industrySankeyNodeLayout.rowGap
      }
    ]
  })
)
const industrySankeyPaths = industrySankeyLinks.map((link, index) => {
  const source = industrySankeyNodePositions.get(link.source)!
  const target = industrySankeyNodePositions.get(link.target)!
  const startX = source.x + industrySankeyNodeLayout.cardWidth
  const endX = target.x
  const startY = source.y + industrySankeyNodeLayout.cardHeight / 2
  const endY = target.y + industrySankeyNodeLayout.cardHeight / 2
  const bend = (endX - startX) * 0.42
  return {
    ...link,
    gradientId: `industry-sankey-gradient-${index}`,
    strokeWidth: 7 + link.value * 1.2,
    d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`
  }
})
const industryChainInsights = [
  { label: '价值流判断', text: '上游围绕BIM标准、工程数据、测绘与物联终端形成数据底座，中游以BIM协同、智慧工地和建筑机器人平台完成工程化服务，下游面向施工、检测、运维场景释放价值。' },
  { label: '建设切入点', text: '专业建设应把BIM深化、装配式构件生产、智慧工地管理和智能检测监测作为主轴，再向智能测绘、建筑机器人和绿色智慧运维延展。' },
  { label: '企业反馈', text: '建筑企业更看重工程识图、现场组织、BIM协同、质量安全和设备联调能力，需要学生能在真实项目中完成模型、数据、现场和交付闭环。' }
]
const industryChainSuggestions = [
  { index: '1', title: '以BIM协同与智慧工地作为专业主线', desc: '围绕BIM深化、模型审查、智慧工地平台和项目数字化管理组织真实工程任务。' },
  { index: '2', title: '补齐装配式与智能施工装备能力', desc: '把构件深化、生产排程、建筑机器人、无人机和智能测量纳入综合实训。' },
  { index: '3', title: '面向检测监测与绿色运维做交付', desc: '以结构健康监测、质量数据分析、建筑能耗与智慧运维形成可验收项目成果。' }
]
const industryRegionCards = [
  { name: '辽宁沈阳-大连建筑产业带', field: '智慧工地 / 装配式建造 / 工程软件', desc: '对接区域施工总包、构件厂、工程数字化服务商，沉淀智慧工地和BIM深化项目。' },
  { name: '京津冀建设科技产业带', field: 'BIM平台 / 数字孪生 / 工程咨询', desc: '对接工程软件、设计院和大型央企项目，支撑BIM协同与项目数字化管理岗位。' },
  { name: '长三角智能建造产业带', field: '建筑机器人 / 智能检测 / 绿色运维', desc: '引入机器人施工、结构健康监测和建筑节能运维案例，强化装备应用与数据分析能力。' },
  { name: '东北老工业基地更新场景', field: '城市更新 / 既有建筑改造 / 运维管理', desc: '围绕厂房改造、基础设施维护和既有建筑智慧运维，设计校企合作与实训项目。' }
]
const industryPolicyItems = [
  { date: '2025年2月', title: '辽宁省建筑业数字化转型行动方案', level: '省级', tag: 'green', desc: '提出推进智慧工地、工程数据治理、装配式建筑和绿色建造示范项目。' },
  { date: '2024年9月', title: '智能建造试点城市建设经验推广清单', level: '国家级', tag: 'blue', desc: '鼓励在设计、生产、施工、运维全流程推广智能建造场景和复合型岗位。' },
  { date: '2024年5月', title: '《关于推动智能建造与建筑工业化协同发展的指导意见》', level: '国家级', tag: 'blue', desc: '强调BIM、装配式建筑、智能装备、智慧工地和建筑产业互联网协同应用。' },
  { date: '2023年3月', title: '《数字中国建设整体布局规划》', level: '国家级', tag: 'blue', desc: '推动数字基础设施、数据资源体系和产业数字化，为建筑业数字化提供政策基础。' }
]
const industryCompanyItems = [
  { name: '中国建筑', field: '房屋建筑 / 基础设施 / 智能建造', jobs: '智能建造施工技术员、智慧工地管理工程师', advice: '施工现场数字化管理项目课' },
  { name: '广联达', field: 'BIM平台 / 工程造价 / 智慧工地', jobs: 'BIM深化设计工程师、智慧建造平台实施顾问', advice: 'BIM协同与智慧工地平台实训' },
  { name: '品茗科技', field: '智慧工地 / 安全管理 / 施工平台', jobs: '智慧工地安全物联专员、工程项目数字化管理员', advice: '安全物联与项目看板实训' },
  { name: '中建科技', field: '装配式建筑 / 绿色建造', jobs: '装配式建筑深化设计师、装配式构件生产工艺员', advice: '装配式构件深化与生产实训' },
  { name: '沈阳远大智能工业', field: '建筑工业化 / 智能装备', jobs: '建筑机器人应用工程师、构件质量检测员', advice: '智能装备应用和构件检测实训' },
  { name: '盈建科/构力科技', field: '结构设计软件 / 工程计算', jobs: '结构健康监测工程师、参数化建筑设计技术员', advice: '结构数智化设计与监测项目' }
]
type EngineSectionKey = 'knowledge' | 'agent' | 'assistant' | 'prompt'
const engineMenuItems = [
  {
    key: 'agent',
    title: '智能体协作',
    subtitle: '情景对话实训',
    icon: '▦',
  },
  {
    key: 'assistant',
    title: '专业智助师',
    subtitle: '个性化问答学习',
    icon: '◌',
  },
  {
    key: 'prompt',
    title: '指令库',
    subtitle: '',
    icon: '◍',
    separated: true,
  },
]
const engineSectionPanels: Record<EngineSectionKey, {
  sectionLabel: string
  primaryAction: string
  secondaryAction?: string
  tertiaryAction?: string
  groupLabel: string
  addLabel: string
  cards: Array<{
    name: string
    type: string
    tone: 'green' | 'purple' | 'blue'
    icon: string
    description: string
  }>
}> = {
  knowledge: {
    sectionLabel: '知识库',
    primaryAction: '＋ 新增知识集',
    secondaryAction: '导入专业资料',
    tertiaryAction: '⌘ 知识权限',
    groupLabel: '专业知识资产',
    addLabel: '添加知识资源',
    cards: [
      { name: '专业知识库', type: '知识集', tone: 'blue', icon: '▱', description: '沉淀专业知识点、术语与案例素材' },
      { name: '课程知识图谱', type: '知识集', tone: 'green', icon: '✣', description: '支撑课程模型中的知识点关系建设' },
      { name: '岗位能力知识库', type: '知识集', tone: 'purple', icon: '◎', description: '沉淀岗位能力、任务和课程映射知识' },
      { name: '企业案例资源库', type: '案例库', tone: 'green', icon: '▣', description: '汇总企业案例、项目任务书和交付文档' },
    ],
  },
  agent: {
    sectionLabel: '智能体协作',
    primaryAction: '＋ 创建智能体',
    secondaryAction: '添加第三方智能体',
    tertiaryAction: '⌘ 分组配置',
    groupLabel: '未分类',
    addLabel: '添加智能体',
    cards: [
      { name: '知识小精灵', type: '智能体', tone: 'green', icon: '✦', description: '根据学习内容推荐知识片段' },
      { name: 'AI陪练', type: '智能体', tone: 'purple', icon: '▰', description: '基于学习内容出自测题，加强记忆' },
      { name: 'AI回复', type: '智能体', tone: 'green', icon: '☷', description: '讨论区智能答疑，自动回复学习问题' },
      { name: 'AI生成PPT', type: '扣子智能体', tone: 'purple', icon: 'PPT', description: '专业PPT制作助手，精准梳理大纲...' },
      { name: '智慧专业领航员', type: '智能体', tone: 'blue', icon: 'AI', description: '全面解答本专业相关问题' },
    ],
  },
  assistant: {
    sectionLabel: '专业智助师',
    primaryAction: '＋ 创建智助师',
    secondaryAction: '批量分配场景',
    tertiaryAction: '⌘ 能力配置',
    groupLabel: '教学问答场景',
    addLabel: '添加智助师',
    cards: [
      { name: '课程答疑助教', type: '智助师', tone: 'blue', icon: 'AI', description: '围绕课程知识点进行即时答疑与引导学习' },
      { name: '实训项目教练', type: '智助师', tone: 'green', icon: '◈', description: '针对项目任务给出实施步骤和排错建议' },
      { name: '岗位面试顾问', type: '智助师', tone: 'purple', icon: '☰', description: '模拟岗位面试提问，辅助学生做表达训练' },
      { name: '作业讲评老师', type: '智助师', tone: 'green', icon: '▤', description: '根据提交内容输出点评意见和改进建议' },
    ],
  },
  prompt: {
    sectionLabel: '指令库',
    primaryAction: '＋ 新建指令',
    secondaryAction: '导入指令模板',
    tertiaryAction: '⌘ 分类管理',
    groupLabel: '常用教学指令',
    addLabel: '添加指令',
    cards: [
      { name: '知识点拆解模板', type: '指令', tone: 'blue', icon: '◍', description: '把课程知识点拆解为定义、公式、案例与练习' },
      { name: '岗位任务生成器', type: '指令', tone: 'green', icon: '▣', description: '根据岗位名称自动整理典型工作任务和能力点' },
      { name: '课堂问答增强器', type: '指令', tone: 'purple', icon: '✦', description: '生成分层提问，支持启发式课堂互动' },
      { name: '课程思政植入模板', type: '指令', tone: 'green', icon: '☷', description: '把职业素养、安全规范和工程伦理融入教学内容' },
    ],
  },
}
const activeResultsPortalTab = ref('首页')
const currentModule = ref(isCourseModelView ? '课程模型' : '人才方案管理')
const activeDecisionGroup = ref<DecisionGroupKey>('hub')
const activeDecisionPage = ref<DecisionPageKey>('overview')
const activeDecisionPlanModeTab = ref('培养方案诊断分析')
const activeDecisionPlanTab = ref('综合评分')
const activeDecisionCourseTab = ref('课程诊断分析')
const decisionPlanStatus = ref<DecisionFlowStatus>('pending')
const decisionCourseStatus = ref<DecisionFlowStatus>('pending')
const decisionImprovementState = ref<'default' | 'refreshing' | 'empty' | 'warning'>('default')
const activeTalentSection = ref('培养目标')
const activeTalentSubsystem = ref('')
const engineActiveSection = ref<EngineSectionKey>('agent')
const talentPlanCreated = ref(false)
const courseModelOpen = ref(isCourseModelView)
const courseGraphEditing = ref(false)
const courseNodeMenu = ref({ open: false, left: 0, top: 0, label: '' })
const courseKnowledgeDrawerOpen = ref(false)
const courseDetailActiveTab = ref('知识点详情')
const selectedCourseNodeLabel = computed(() => courseNodeMenu.value.label || '离散型随机变量')
const courseDetailLastSavedAt = ref('2026-05-25 14:06')
const courseAbilityDialogOpen = ref(false)
const courseAbilityJobSearch = ref('')
const selectedCourseAbilityJobId = ref('')
const courseAbilityDraft = ref<CourseAbilityCategoryMap>(createEmptyCourseAbilityMap())
const courseAbilityDraftsByJob = ref<Record<string, CourseAbilityCategoryMap>>({})
const courseNodeAbilityRelations = ref<Record<string, CourseNodeAbilityRelation[]>>({})
const currentJobSection = ref('岗位建设中心')
const currentJobResearchTab = ref<JobResearchTabKey>('portrait')
const currentJobIndustryTab = ref<IndustryResearchTabKey>('chain')
const currentJobResearchMode = ref<'industry' | 'job'>('industry')
const currentReportView = ref<'library' | 'create' | 'generating' | 'editor' | 'preview'>('library')
const reportSearchText = ref('')
const reportRows = ref<ResearchReportItem[]>(REPORTS.map((report) => ({ ...report })))
const activeReportId = ref(REPORTS[0]?.id ?? 1)
const reportForm = ref({ ...REPORT_DEFAULT_FORM })
const currentEnginePanel = computed(() => engineSectionPanels[engineActiveSection.value])
type ReportTocEditorItem = {
  id: string
  title: string
  children: ReportTocEditorItem[]
}

const createReportTocId = () => `toc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const buildReportTocRows = (items: ReportTocItem[]): ReportTocEditorItem[] =>
  items.map((item) => ({
    id: createReportTocId(),
    title: item.title,
    children: buildReportTocRows(item.children ?? []),
  }))

const reportTocRows = ref<ReportTocEditorItem[]>(buildReportTocRows(REPORT_TOC))
const selectedReportDimensions = ref(REPORT_DIMENSIONS.map((item) => item.key))
const reportEditorContent = ref(REPORT_CONTENT)
const reportEditableRef = ref<HTMLElement | null>(null)
const reportLastSaveTime = ref('--')
const hoverKey = ref('')
const selectedGraphJobId = ref('')
const activeGraphTaskIndex = ref(0)
const activeResultsPortalJobCardIndex = ref(0)
const selectedJobId = ref('')
const addJobDialogOpen = ref(false)
const addJobSearch = ref('')
const selectedCandidateIds = ref<string[]>([])
const addedJobCards = ref<JobCard[]>([])
const templateJobsImported = ref(false)
const removedJobIds = ref<string[]>([])
const manualJobCourseIds = ref<Record<string, string[]>>({})
const courseDialogOpen = ref(false)
const courseSearch = ref('')
const taskDialogOpen = ref(false)
const taskDialogMode = ref<'create' | 'edit'>('create')
const editingTaskIndex = ref<number | null>(null)
type JobBasicEditForm = {
  name: string
  occupation: string
  occupationCode: string
  level: string
  chainIndustry: string
  relatedCompanies: string
  groupName: string
  salaryRange: string
  demandLevel: string
  demandVolume: string
  education: string
  experience: string
  careerPath: string
  workSummary: string
  requirements: string
}
type JobBasicOverride = Partial<JobBasicEditForm>
const basicInfoDialogOpen = ref(false)
const jobBasicOverrides = ref<Record<string, JobBasicOverride>>({})
const abilityImportDialogOpen = ref(false)
const abilityImportFileInput = ref<HTMLInputElement | null>(null)
const abilityImportMode = ref<'append' | 'replace'>('append')
const abilityImportFileName = ref('')
const abilityImportDraft = ref<JobAbility[]>([])
const abilityImportErrors = ref<string[]>([])
const abilityEditDialogOpen = ref(false)
const editingAbilityName = ref('')
const abilityDeleteConfirmOpen = ref(false)
const deletingAbilityName = ref('')
const abilityForm = ref<AbilityEditForm>({
  name: '',
  category: '知识',
  definition: ''
})
const basicInfoForm = ref<JobBasicEditForm>({
  name: '',
  occupation: '',
  occupationCode: '',
  level: '',
  chainIndustry: '',
  relatedCompanies: '',
  groupName: '',
  salaryRange: '',
  demandLevel: '',
  demandVolume: '',
  education: '',
  experience: '',
  careerPath: '',
  workSummary: '',
  requirements: ''
})
const taskForm = ref({
  name: '',
  description: '',
  abilities: [] as string[]
})
const editableTasksByJobId = ref<Record<string, JobTask[]>>({})
const editableAbilitiesByJobId = ref<Record<string, JobAbility[]>>({})
const activeDetailTab = ref('basic')
const activeMapTaskIndex = ref(0)
const selectedPortraitJobId = ref('')
const selectedCertificateId = ref('')
const selectedCompanyId = ref('')
const courseMemberDialogOpen = ref(false)
const courseMemberDialogTab = ref<'members' | 'roles'>('members')
const selectedCourseRoleName = ref(courseSystemRoles[0])
const cultivateCreateDialogOpen = ref(false)
const cultivateFileInput = ref<HTMLInputElement | null>(null)
const selectedCultivateFileName = ref('')
const researchSearchForm = ref({
  keyword: '',
  school: '',
  major: '',
  year: ''
})
const researchHasSearched = ref(false)
const selectedResearchPlanId = ref('')
const compareSourceFileName = ref('2026级智能建造工程专业人才培养方案.pdf')
const compareTargetMode = ref('system')
const selectedCompareSystemPlanId = ref('plan-sjzu-smart-construction-2025')
const compareTargetFileName = ref('2025年沈建大智能建造工程人培.pdf')
const compareReferenceFiles = ref<string[]>([])
const compareStarted = ref(false)
const compareLoading = ref(false)
const compareExportStatus = ref('')
const activeCompareModuleName = ref(compareModules[0].name)
const compareEditorContents = ref<Record<string, string>>({ ...defaultCompareEditorContents })
let compareLoadingTimer: number | undefined
let decisionPlanTimer: number | undefined
let decisionCourseTimer: number | undefined
const abilityMapGraphRef = ref<HTMLElement | null>(null)
const abilityMapBox = ref({ width: 1, height: 1 })
const abilityLinePaths = ref<Array<{ key: string; d: string }>>([])
const graphCanvasRef = ref<HTMLElement | null>(null)
const resultsPortalGraphRef = ref<HTMLElement | null>(null)
const resultsGraphCanvasRef = ref<HTMLElement | null>(null)
const graphLineBox = ref({ width: 1, height: 1 })
const resultsPortalGraphLineBox = ref({ width: 1, height: 1 })
const graphMeasuredLinks = ref<GraphMeasuredLink[]>([])
const resultsPortalGraphMeasuredLinks = ref<GraphMeasuredLink[]>([])
const graphAbilityMapRef = ref<HTMLElement | null>(null)
const resultsGraphAbilityMapRef = ref<HTMLElement | null>(null)
const graphAbilityMapBox = ref({ width: 1, height: 1 })
const resultsGraphAbilityMapBox = ref({ width: 1, height: 1 })
const graphAbilityLinePaths = ref<Array<{ key: string; d: string; active?: boolean }>>([])
const resultsGraphAbilityLinePaths = ref<Array<{ key: string; d: string; active?: boolean }>>([])
const portraitCompetencyMapRef = ref<HTMLElement | null>(null)
const portraitCompetencyMapBox = ref({ width: 1, height: 1 })
const portraitCompetencyLinePaths = ref<Array<{ key: string; d: string; active?: boolean }>>([])
const activePortraitCompetencyTaskIndex = ref(0)

type GraphLayoutLink = {
  key: string
  fromKey: string
  toKey: string
  keys: string[]
  curve?: number
}
type GraphMeasuredLink = GraphLayoutLink & { d: string }
type PortraitCompetencyTask = {
  name: string
  description: string
  abilities: string[]
}
type PortraitCompetencyNode = {
  name: string
  category: '知识' | '技能' | '素养'
  tone: 'knowledge' | 'skill' | 'quality'
  marker: string
}
type GraphLayoutJobGroup = {
  key: string
  name: string
  count: number
  top: number
  height: number
  tone: string
  jobs: Array<JobCard & { row: number; key: string; top: number }>
}

const abilityCategories = ['知识', '技能', '素养'] as const
const defaultPortraitJobDetail = PORTRAIT_JOB_DETAILS[0]!
const portraitCompetencyCategoryMeta: Record<(typeof abilityCategories)[number], { tone: PortraitCompetencyNode['tone']; marker: string }> = {
  知识: { tone: 'knowledge', marker: '知' },
  技能: { tone: 'skill', marker: '技' },
  素养: { tone: 'quality', marker: '素' }
}
const getPortraitCompetencyAbilityGroups = (job: typeof defaultPortraitJobDetail) =>
  PORTRAIT_COMPETENCY_MAP_CONFIGS[job.id]?.abilityGroups ?? job.abilityGroups

const buildPortraitTaskDescription = (taskName: string, jobName: string, nodeName: string) => {
  if (taskName.includes('方案') || taskName.includes('设计')) {
    return `围绕${nodeName}场景梳理目标需求、关键环节与交付边界，形成适用于“${jobName}”岗位的任务方案与执行路径。`
  }
  if (taskName.includes('部署') || taskName.includes('接入') || taskName.includes('联调')) {
    return `完成“${taskName}”相关环境配置、模块接入与联调验证，确保岗位工作流能够稳定运行并满足业务要求。`
  }
  if (taskName.includes('优化') || taskName.includes('调优') || taskName.includes('分析') || taskName.includes('复盘')) {
    return `围绕“${taskName}”识别影响效果的关键因素，通过数据分析、参数迭代和结果复核持续提升任务质量。`
  }
  if (taskName.includes('文档') || taskName.includes('验收') || taskName.includes('交付')) {
    return `输出“${taskName}”所需的过程记录、验收说明和交付文档，支撑项目复盘、质量追踪与团队协同。`
  }
  return `围绕“${taskName}”完成任务拆解、过程执行、质量校验与结果闭环，体现“${jobName}”岗位在${nodeName}方向的核心能力要求。`
}

const portraitTaskAbilityKeywordRules = [
  {
    task: ['需求', '策划', '准备', '分析'],
    ability: ['认知', '识图', '规范', '标准', '合同', '需求', '策划', '图纸', '资料', '项目管理', '工程计量']
  },
  {
    task: ['方案', '设计', '编制', '深化', '配置'],
    ability: ['BIM', '设计', '建模', '方案', '构件', '参数化', '平台', '权限', '工艺', '路径', '模型']
  },
  {
    task: ['现场', '实施', '联调', '部署', '接入', '调试'],
    ability: ['现场', '设备', '联调', '接入', '传感器', '测量', '机器人', '无人机', '智能装备', '物联', '巡检']
  },
  {
    task: ['数据', '复核', '质量', '验收', '检测', '监测', '评价'],
    ability: ['数据', '质量', '检测', '监测', '风险', '预警', '复核', '判读', '清洗', '治理', '验收']
  },
  {
    task: ['交付', '文档', '复盘', '优化', '培训'],
    ability: ['交付', '文档', '培训', '复盘', '改进', '协同', '沟通', '成本', '留痕', '学习', '服务']
  }
]

const scorePortraitAbilityForTask = (taskName: string, abilityName: string, fallbackIndex: number) => {
  const ruleScore = portraitTaskAbilityKeywordRules.reduce((score, rule) => {
    const taskMatches = rule.task.some((keyword) => taskName.includes(keyword))
    if (!taskMatches) return score
    return score + rule.ability.filter((keyword) => abilityName.includes(keyword)).length * 4
  }, 0)

  return ruleScore + (fallbackIndex % 3)
}

const distributePortraitAbilitiesAcrossTasks = (job: typeof defaultPortraitJobDetail) => {
  const taskNames = job.tasks.length ? job.tasks : ['岗位综合任务']
  const taskAbilityMap = Object.fromEntries(taskNames.map((taskName) => [taskName, [] as string[]]))
  const allAbilityNames = getPortraitCompetencyAbilityGroups(job).flatMap((group) => group.items)
  const coveredAbilityNames = new Set<string>()

  allAbilityNames.forEach((abilityName, index) => {
    const taskName = taskNames.reduce((bestTask, currentTask, taskIndex) => {
      const bestScore = scorePortraitAbilityForTask(bestTask, abilityName, index)
      const currentScore = scorePortraitAbilityForTask(currentTask, abilityName, index + taskIndex)
      return currentScore > bestScore ? currentTask : bestTask
    }, taskNames[index % taskNames.length])

    taskAbilityMap[taskName].push(abilityName)
    coveredAbilityNames.add(abilityName)
  })

  allAbilityNames.forEach((abilityName, index) => {
    if (coveredAbilityNames.has(abilityName)) return
    const taskName = taskNames[index % taskNames.length]
    taskAbilityMap[taskName].push(abilityName)
    coveredAbilityNames.add(abilityName)
  })

  return taskAbilityMap
}

const buildPortraitCompetencyTasks = (job: typeof defaultPortraitJobDetail): PortraitCompetencyTask[] => {
  const competencyConfig = PORTRAIT_COMPETENCY_MAP_CONFIGS[job.id]
  if (competencyConfig) {
    return job.tasks.map((taskName) => ({
      name: taskName,
      description: buildPortraitTaskDescription(taskName, job.name, job.node),
      abilities: competencyConfig.taskAbilities[taskName] ?? []
    }))
  }

  const taskAbilityMap = distributePortraitAbilitiesAcrossTasks(job)

  return job.tasks.map((taskName) => {
    return {
      name: taskName,
      description: buildPortraitTaskDescription(taskName, job.name, job.node),
      abilities: Array.from(new Set(taskAbilityMap[taskName] ?? []))
    }
  })
}

const interleavePortraitCompetencyNodes = (job: typeof defaultPortraitJobDetail): PortraitCompetencyNode[] => {
  const groups = abilityCategories.map((category) => ({
    category,
    items: getPortraitCompetencyAbilityGroups(job).find((group) => group.label === category)?.items ?? []
  }))
  const maxLength = Math.max(...groups.map((group) => group.items.length), 0)
  const nodes: PortraitCompetencyNode[] = []

  for (let index = 0; index < maxLength; index += 1) {
    for (const group of groups) {
      const name = group.items[index]
      if (!name) continue
      nodes.push({
        name,
        category: group.category,
        tone: portraitCompetencyCategoryMeta[group.category].tone,
        marker: portraitCompetencyCategoryMeta[group.category].marker
      })
    }
  }

  return nodes
}
const graphColumns = {
  chain: { left: 2, width: 20, xIn: 2, xOut: 22 },
  industry: { left: 26, width: 21, xIn: 26, xOut: 47 },
  job: { left: 51, width: 29, xIn: 51, xOut: 80 },
  course: { left: 84, width: 14, xIn: 84, xOut: 98 }
}
const graphCanvasHeight = 1440
const graphGroupTones = ['cyan', 'violet', 'teal', 'indigo', 'amber', 'blue'] as const

const jobCardsForBuild = computed<JobCard[]>(() => {
  const removedSet = new Set(removedJobIds.value)
  const jobs = templateJobsImported.value
    ? JOB_CARDS.filter((job) => !removedSet.has(job.id))
    : []
  for (const job of addedJobCards.value) {
    if (!jobs.some((item) => item.id === job.id)) {
      jobs.push(job)
    }
  }
  return jobs.map((job) => {
    const override = jobBasicOverrides.value[job.id]
    const nextAbilityCount = abilityCountForJob(job)
    if (!override) {
      return {
        ...job,
        abilityCount: nextAbilityCount
      }
    }
    return {
      ...job,
      name: override.name ?? job.name,
      occupation: override.occupation ?? job.occupation,
      occupationCode: override.occupationCode ?? job.occupationCode,
      groupName: override.groupName ?? job.groupName,
      abilityCount: nextAbilityCount
    }
  })
})
const decisionCenterStateKey = 'decision-center-state'
const decisionGroupKeys = new Set<DecisionGroupKey>(decisionCenterMenuGroups.map((group) => group.key))
const decisionPageKeys = new Set<DecisionPageKey>(
  decisionCenterMenuGroups.flatMap((group) => group.items.map((item) => item.key))
)
const decisionPlanModeTabs = new Set(planAnalysisStates.pending.modeTabs)
const decisionPlanTabs = new Set(planAnalysisStates.result.topTabs)
const decisionCourseTabs = new Set([
  ...courseDiagnosisStates.pending.modeTabs,
  ...courseDiagnosisStates.result.topTabs
])
const decisionFlowStatuses = new Set<DecisionFlowStatus>(['pending', 'loading', 'result', 'warning'])
const decisionImprovementStates = new Set(['default', 'refreshing', 'empty', 'warning'] as const)
const activeDecisionPlaceholderPage = computed(() => {
  if (activeDecisionPage.value === 'improvement') return null
  if (!(activeDecisionPage.value in governancePlaceholderPages)) return null
  return governancePlaceholderPages[activeDecisionPage.value as keyof typeof governancePlaceholderPages]
})
const decisionImprovementDefaultState = computed(() => decisionImprovementPage.states.default)
const activeDecisionImprovementState = computed(() => decisionImprovementPage.states[decisionImprovementState.value])
const activeDecisionPlanPendingMode = computed(() => {
  return planAnalysisStates.pending.modePanels[activeDecisionPlanModeTab.value] ?? planAnalysisStates.pending.modePanels[planAnalysisStates.pending.modeTabs[0]]
})
const activeDecisionPlanResultPanel = computed(() => {
  return planAnalysisStates.result.panels[activeDecisionPlanTab.value] ?? planAnalysisStates.result.panels[planAnalysisStates.result.topTabs[0]]
})
const activeDecisionCoursePendingPanel = computed(() => {
  return courseDiagnosisStates.pending.panels[activeDecisionCourseTab.value] ?? courseDiagnosisStates.pending.panels[courseDiagnosisStates.pending.modeTabs[0]]
})
const activeDecisionCourseResultPanel = computed(() => {
  return courseDiagnosisStates.result.panels[activeDecisionCourseTab.value] ?? courseDiagnosisStates.result.panels[courseDiagnosisStates.result.topTabs[0]]
})
const clearDecisionPlanTimer = () => {
  if (decisionPlanTimer !== undefined) {
    window.clearTimeout(decisionPlanTimer)
    decisionPlanTimer = undefined
  }
}
const clearDecisionCourseTimer = () => {
  if (decisionCourseTimer !== undefined) {
    window.clearTimeout(decisionCourseTimer)
    decisionCourseTimer = undefined
  }
}
const persistDecisionState = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    decisionCenterStateKey,
    JSON.stringify({
      active: currentModule.value === '决策中心',
      group: activeDecisionGroup.value,
      page: activeDecisionPage.value,
      planModeTab: activeDecisionPlanModeTab.value,
      planTab: activeDecisionPlanTab.value,
      courseTab: activeDecisionCourseTab.value,
      improvementState: decisionImprovementState.value,
      planStatus: decisionPlanStatus.value,
      courseStatus: decisionCourseStatus.value
    })
  )
}
const restoreDecisionState = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(decisionCenterStateKey)
  if (!raw) return false
  try {
    const saved = JSON.parse(raw) as {
      active?: boolean
      group?: DecisionGroupKey
      page?: DecisionPageKey
      planModeTab?: string
      planTab?: string
      courseTab?: string
      improvementState?: 'default' | 'refreshing' | 'empty' | 'warning'
      planStatus?: DecisionFlowStatus
      courseStatus?: DecisionFlowStatus
    }
    activeDecisionGroup.value = saved.group && decisionGroupKeys.has(saved.group) ? saved.group : 'hub'
    activeDecisionPage.value = saved.page && decisionPageKeys.has(saved.page) ? saved.page : 'overview'
    activeDecisionPlanModeTab.value = saved.planModeTab && decisionPlanModeTabs.has(saved.planModeTab)
      ? saved.planModeTab
      : '培养方案诊断分析'
    activeDecisionPlanTab.value = saved.planTab && decisionPlanTabs.has(saved.planTab) ? saved.planTab : '综合评分'
    activeDecisionCourseTab.value = saved.courseTab && decisionCourseTabs.has(saved.courseTab)
      ? saved.courseTab
      : '课程诊断分析'
    decisionImprovementState.value = saved.improvementState && decisionImprovementStates.has(saved.improvementState)
      ? saved.improvementState
      : 'default'
    const restoredPlanStatus = saved.planStatus && decisionFlowStatuses.has(saved.planStatus)
      ? saved.planStatus
      : 'pending'
    const restoredCourseStatus = saved.courseStatus && decisionFlowStatuses.has(saved.courseStatus)
      ? saved.courseStatus
      : 'pending'
    decisionPlanStatus.value = restoredPlanStatus === 'loading' ? 'pending' : restoredPlanStatus
    decisionCourseStatus.value = restoredCourseStatus === 'loading' ? 'pending' : restoredCourseStatus
    return saved.active === true
  } catch {
    window.localStorage.removeItem(decisionCenterStateKey)
    return false
  }
}
if (!isCourseModelView && restoreDecisionState()) {
  currentModule.value = '决策中心'
}
const hasBuildData = computed(() => jobCardsForBuild.value.length > 0)
const existingJobIds = computed(() => new Set(jobCardsForBuild.value.map((job) => job.id)))
const abilitiesForId = (jobId: string) => editableAbilitiesByJobId.value[jobId] ?? getJobDetail(jobId).abilities
const editableJobAbilitiesForId = (jobId: string) => abilitiesForId(jobId).map(cloneJobAbility)
const abilityCountForJob = (job: JobCard) => abilitiesForId(job.id).length
const totalTasks = computed(() =>
  jobCardsForBuild.value.reduce(
    (sum, job) => sum + (editableTasksByJobId.value[job.id]?.length ?? job.taskCount),
    0
  )
)
const totalAbilities = computed(() => jobCardsForBuild.value.reduce((sum, job) => sum + abilityCountForJob(job), 0))
const selectedJob = computed(() => jobCardsForBuild.value.find((job) => job.id === selectedJobId.value))
const jobDetailForId = (jobId: string) => {
  const detail = getJobDetail(jobId)
  const override = jobBasicOverrides.value[jobId] ?? {}
  return {
    ...detail,
    tasks: editableTasksByJobId.value[jobId] ?? detail.tasks,
    abilities: abilitiesForId(jobId),
    careerPath: override.careerPath ?? detail.careerPath,
    workSummary: override.workSummary ?? detail.workSummary,
    requirements: override.requirements ?? detail.requirements,
    relatedCompanies: override.relatedCompanies ?? detail.relatedCompanies,
    demandLevel: override.demandLevel ?? detail.demandLevel,
    demandVolume: override.demandVolume ?? detail.demandVolume,
    salaryRange: override.salaryRange ?? detail.salaryRange,
    education: override.education ?? detail.education,
    experience: override.experience ?? detail.experience
  }
}
const selectedJobDetail = computed(() => jobDetailForId(selectedJobId.value))
const cloneJobTask = (task: JobTask): JobTask => ({
  name: task.name,
  description: task.description,
  abilities: [...task.abilities]
})
const jobTasksForId = (jobId: string) => editableTasksByJobId.value[jobId] ?? getJobDetail(jobId).tasks
const editableJobTasksForId = (jobId: string) => (editableTasksByJobId.value[jobId] ?? getJobDetail(jobId).tasks).map(cloneJobTask)
const selectedJobTasks = computed(() => jobTasksForId(selectedJobId.value))
const taskCountForJob = (job: JobCard) => editableTasksByJobId.value[job.id]?.length ?? job.taskCount
const defaultCourseIdsForJob = (jobId: string) =>
  COURSE_NODES.filter((course) => course.jobIds.includes(jobId)).map((course) => course.id)
const courseIdsForJob = (jobId: string) => {
  const manualIds = manualJobCourseIds.value[jobId]
  if (manualIds) return manualIds

  const isTemplateJob = JOB_CARDS.some((job) => job.id === jobId)
  const isRemovedTemplateRelation = removedJobIds.value.includes(jobId)
  return templateJobsImported.value && isTemplateJob && !isRemovedTemplateRelation
    ? defaultCourseIdsForJob(jobId)
    : []
}
const selectedJobCourseIds = computed(() => (selectedJob.value ? courseIdsForJob(selectedJob.value.id) : []))
const selectedJobCourses = computed(() =>
  COURSE_NODES.filter((course) => selectedJobCourseIds.value.includes(course.id))
)
const defaultJobLevel = '初级 / 中级'
const chainIndustryForJob = (job?: JobCard) => {
  if (!job) return '-'
  const node = INDUSTRY_NODES.find((item) => item.id === job.industryNodeId)
  const chain = node ? INDUSTRY_CHAINS.find((item) => item.id === node.chainId) : null
  if (!node || !chain) return '-'
  return `${chain.name} - ${node.name}`
}
const selectedJobLevel = computed(() =>
  jobBasicOverrides.value[selectedJobId.value]?.level ?? defaultJobLevel
)
const selectedJobChainIndustry = computed(() =>
  jobBasicOverrides.value[selectedJobId.value]?.chainIndustry ?? chainIndustryForJob(selectedJob.value)
)
const displayBasicValue = (value: string) => value.trim() || '-'
const filteredCourseCandidates = computed(() => {
  const keyword = courseSearch.value.trim().toLowerCase()
  return COURSE_NODES.filter((course) => {
    if (!keyword) return true
    return [course.name, course.id].join(' ').toLowerCase().includes(keyword)
  })
})
const courseJobAbilityOptionMap = new Map(courseJobAbilityOptions.map((option) => [option.id, option]))
const selectedCourseNodeAbilityRelations = computed(
  () => courseNodeAbilityRelations.value[selectedCourseNodeLabel.value] ?? []
)
const selectedCourseNodeAbilityCount = computed(() =>
  selectedCourseNodeAbilityRelations.value.reduce((sum, relation) =>
    sum + courseAbilityCategories.reduce((categorySum, category) => categorySum + relation.abilities[category].length, 0), 0)
)
const filteredCourseJobAbilityOptions = computed(() => {
  const keyword = courseAbilityJobSearch.value.trim().toLowerCase()
  return courseJobAbilityOptions.filter((option) => {
    if (!keyword) return true
    const searchText = [
      option.name,
      option.chain,
      option.node,
      ...courseAbilityCategories.flatMap((category) => option.abilities[category])
    ].join(' ').toLowerCase()
    return searchText.includes(keyword)
  })
})
const selectedCourseAbilityJobOption = computed(() => {
  if (!selectedCourseAbilityJobId.value) return null
  return courseJobAbilityOptionMap.get(selectedCourseAbilityJobId.value) ?? null
})
const courseAbilityPickerKey = computed(() => selectedCourseAbilityJobId.value || 'empty')
const courseAbilityTotalDraftCount = computed(() =>
  Object.values(courseAbilityDraftsByJob.value).reduce(
    (sum, abilities) => sum + courseAbilityCategories.reduce((categorySum, category) => categorySum + abilities[category].length, 0),
    0
  )
)
const courseAbilityDraftCount = computed(() =>
  courseAbilityCategories.reduce((sum, category) => sum + courseAbilityDraft.value[category].length, 0)
)
const selectedPortraitJobDetail = computed(() => {
  if (!selectedPortraitJobId.value) return null
  return getPortraitJobDetail(selectedPortraitJobId.value) ?? null
})
const selectedCertificateDetail = computed(() => getCertificateDetail(selectedCertificateId.value))
const selectedCompanyDetail = computed(() => getCompanyDetail(selectedCompanyId.value))
const portraitCompetencyMapJobId = computed(() => {
  if (!isJobCompetencyMapView || typeof window === 'undefined') return PORTRAIT_JOB_DETAILS[0]?.id ?? 'job-model-deploy'

  const jobId = new URLSearchParams(window.location.search).get('job') ?? ''
  return PORTRAIT_JOB_PROFILES.some((job) => job.id === jobId)
    ? jobId
    : (PORTRAIT_JOB_DETAILS[0]?.id ?? 'job-model-deploy')
})
const portraitCompetencyJobDetail = computed(() => getPortraitJobDetail(portraitCompetencyMapJobId.value) ?? defaultPortraitJobDetail)
const portraitCompetencyTasks = computed(() => buildPortraitCompetencyTasks(portraitCompetencyJobDetail.value))
const activePortraitCompetencyTask = computed(
  () => portraitCompetencyTasks.value[activePortraitCompetencyTaskIndex.value] ?? portraitCompetencyTasks.value[0]
)
const portraitCompetencyNodes = computed(() => interleavePortraitCompetencyNodes(portraitCompetencyJobDetail.value))
const portraitCompetencyAbilityLookup = computed(() =>
  new Map(portraitCompetencyNodes.value.map((node) => [node.name, node]))
)
const portraitCompetencyActiveAbilityNames = computed(() => new Set(activePortraitCompetencyTask.value?.abilities ?? []))
const portraitCompetencySidebarItems = computed(() =>
  (activePortraitCompetencyTask.value?.abilities ?? []).map((name) => ({
    name,
    category: portraitCompetencyAbilityLookup.value.get(name)?.category ?? '知识',
    tone: portraitCompetencyAbilityLookup.value.get(name)?.tone ?? 'knowledge'
  }))
)
const portraitCompetencyCategoryStats = computed(() =>
  abilityCategories.map((category) => ({
    category,
    total: getPortraitCompetencyAbilityGroups(portraitCompetencyJobDetail.value).find((group) => group.label === category)?.items.length ?? 0,
    tone: portraitCompetencyCategoryMeta[category].tone
  }))
)
const activeResearchTab = computed(
  () => JOB_RESEARCH_TABS.find((tab) => tab.key === currentJobResearchTab.value) ?? JOB_RESEARCH_TABS[0]
)
const activeIndustryTab = computed(
  () => INDUSTRY_RESEARCH_TABS.find((tab) => tab.key === currentJobIndustryTab.value) ?? INDUSTRY_RESEARCH_TABS[0]
)
const filteredReportRows = computed(() => {
  const keyword = reportSearchText.value.trim().toLowerCase()
  if (!keyword) return reportRows.value
  return reportRows.value.filter((report) =>
    [report.title, report.type, report.industry, report.region, report.major].join(' ').toLowerCase().includes(keyword)
  )
})
const reportStats = computed(() => [
  { label: '报告总数', value: reportRows.value.length, unit: '份', tone: 'green', icon: '▣' },
  { label: '已完成', value: reportRows.value.filter((report) => report.status === 'done').length, unit: '份', tone: 'blue', icon: '✓' },
  { label: '草稿', value: reportRows.value.filter((report) => report.status === 'draft').length, unit: '份', tone: 'orange', icon: '✎' },
  { label: '本月生成', value: 3, unit: '份', tone: 'pink', icon: '▤' }
])
const activeReport = computed(() => reportRows.value.find((report) => report.id === activeReportId.value) ?? reportRows.value[0])
const selectedReportDimensionItems = computed(() =>
  REPORT_DIMENSIONS.filter((dimension) => selectedReportDimensions.value.includes(dimension.key))
)
const portraitPageSize = 12
const currentPortraitPage = ref(1)
const portraitPageCount = computed(() => Math.max(1, Math.ceil(PORTRAIT_JOB_PROFILES.length / portraitPageSize)))
const paginatedPortraitJobs = computed(() => {
  const start = (currentPortraitPage.value - 1) * portraitPageSize
  return PORTRAIT_JOB_PROFILES.slice(start, start + portraitPageSize)
})
const portraitPageNumbers = computed(() =>
  Array.from({ length: portraitPageCount.value }, (_, index) => index + 1)
)
const filteredJobCandidates = computed(() => {
  const keyword = addJobSearch.value.trim().toLowerCase()
  if (!keyword) return RESEARCH_JOB_CANDIDATES

  return RESEARCH_JOB_CANDIDATES.filter((candidate) =>
    [
      candidate.name,
      candidate.groupName,
      candidate.occupation,
      candidate.occupationCode,
      candidate.industryNode,
      candidate.chain,
      ...candidate.keywords
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  )
})
const selectedAddCount = computed(
  () => selectedCandidateIds.value.filter((id) => !existingJobIds.value.has(id)).length
)
const activeTalentSubsystemMeta = computed(() =>
  talentSubsystemItems.find((item) => item.key === activeTalentSubsystem.value)
)
const filteredResearchPlanResults = computed(() => {
  const keyword = researchSearchForm.value.keyword.trim().toLowerCase()
  const school = researchSearchForm.value.school.trim().toLowerCase()
  const major = researchSearchForm.value.major.trim().toLowerCase()
  const year = researchSearchForm.value.year.trim()

  return researchPlanResults.filter((plan) => {
    const haystack = `${plan.name} ${plan.school} ${plan.major} ${plan.year} ${plan.keywords?.join(' ') ?? ''}`.toLowerCase()
    return (!keyword || haystack.includes(keyword))
      && (!school || plan.school.toLowerCase().includes(school))
      && (!major || plan.major.toLowerCase().includes(major))
      && (!year || plan.year === year)
  })
})
const selectedResearchPlan = computed(() =>
  researchPlanResults.find((plan) => plan.id === selectedResearchPlanId.value)
)
const selectedCompareSystemPlan = computed(() =>
  researchPlanResults.find((plan) => plan.id === selectedCompareSystemPlanId.value) ?? researchPlanResults[0]
)
const compareTargetPlanName = computed(() =>
  compareTargetMode.value === 'system'
    ? selectedCompareSystemPlan.value.name
    : compareTargetFileName.value
)
const activeCompareModule = computed(() =>
  compareModules.find((module) => module.name === activeCompareModuleName.value) ?? compareModules[0]
)
const activeCompareEditorContent = computed({
  get: () =>
    compareEditorContents.value[activeCompareModuleName.value]
      ?? buildCompareEditorDraft(activeCompareModule.value)
      ?? compareEditorSeed,
  set: (value: string) => {
    compareEditorContents.value = {
      ...compareEditorContents.value,
      [activeCompareModuleName.value]: value
    }
  }
})
const courseRolePermissionRenderRows = computed(() => {
  return courseRolePermissionRows.map((row, index) => {
    const previous = courseRolePermissionRows[index - 1]
    const showFirstMenu = !previous || previous.firstMenu !== row.firstMenu
    if (!showFirstMenu) {
      return {
        ...row,
        showFirstMenu: false,
        firstMenuRowspan: 0
      }
    }

    let firstMenuRowspan = 1
    for (let i = index + 1; i < courseRolePermissionRows.length; i += 1) {
      if (courseRolePermissionRows[i].firstMenu !== row.firstMenu) break
      firstMenuRowspan += 1
    }
    return {
      ...row,
      showFirstMenu: true,
      firstMenuRowspan
    }
  })
})
const coursePermissionTextMap: Record<CoursePermissionType, string> = {
  all: '全部',
  check: '✓',
  none: '—'
}
const coursePermissionText = (type: CoursePermissionType) => coursePermissionTextMap[type]
const buildGraphLayout = (jobs: JobCard[], getCourseIds: (jobId: string) => string[]) => {
  const chainById = new Map(INDUSTRY_CHAINS.map((chain) => [chain.id, chain]))
  const industryById = new Map(INDUSTRY_NODES.map((industry) => [industry.id, industry]))
  const activeJobIds = new Set(jobs.map((job) => job.id))
  const originalJobOrder = new Map(jobs.map((job, index) => [job.id, index]))
  const originalChainOrder = new Map(INDUSTRY_CHAINS.map((chain, index) => [chain.id, index]))
  const originalIndustryOrder = new Map(INDUSTRY_NODES.map((industry, index) => [industry.id, index]))
  const uniqueRelationKeys = new Set<string>()
  const activeJobIndustryRelations = JOB_INDUSTRY_RELATIONS
    .filter((relation) => activeJobIds.has(relation.jobId) && industryById.has(relation.industryNodeId))
    .filter((relation) => {
      const key = `${relation.industryNodeId}:${relation.jobId}`
      if (uniqueRelationKeys.has(key)) return false
      uniqueRelationKeys.add(key)
      return true
    })

  for (const job of jobs) {
    const hasRelation = activeJobIndustryRelations.some((relation) => relation.jobId === job.id)
    if (!hasRelation && industryById.has(job.industryNodeId)) {
      activeJobIndustryRelations.push({ industryNodeId: job.industryNodeId, jobId: job.id })
    }
  }

  const activeIndustryIds = new Set(activeJobIndustryRelations.map((relation) => relation.industryNodeId))
  const uniqueChainRelationKeys = new Set<string>()
  const activeIndustryChainRelations = INDUSTRY_CHAIN_RELATIONS
    .filter((relation) => activeIndustryIds.has(relation.industryNodeId) && chainById.has(relation.chainId))
    .filter((relation) => {
      const key = `${relation.chainId}:${relation.industryNodeId}`
      if (uniqueChainRelationKeys.has(key)) return false
      uniqueChainRelationKeys.add(key)
      return true
    })

  for (const industryId of activeIndustryIds) {
    const hasRelation = activeIndustryChainRelations.some((relation) => relation.industryNodeId === industryId)
    const industry = industryById.get(industryId)
    if (!hasRelation && industry && chainById.has(industry.chainId)) {
      activeIndustryChainRelations.push({ chainId: industry.chainId, industryNodeId: industryId })
    }
  }

  const activeChainIds = new Set(activeIndustryChainRelations.map((relation) => relation.chainId))
  const topForIndex = (index: number, count: number, start = 7, end = 93) =>
    count <= 1 ? 50 : start + (index / (count - 1)) * (end - start)
  const relatedIndustryIdsForJob = (jobId: string) =>
    activeJobIndustryRelations
      .filter((relation) => relation.jobId === jobId)
      .map((relation) => relation.industryNodeId)
  const relatedChainIdsForIndustry = (industryNodeId: string) =>
    activeIndustryChainRelations
      .filter((relation) => relation.industryNodeId === industryNodeId)
      .map((relation) => relation.chainId)
  const relatedChainIdsForJob = (jobId: string) =>
    Array.from(new Set(
      relatedIndustryIdsForJob(jobId).flatMap((industryNodeId) => relatedChainIdsForIndustry(industryNodeId))
    ))
  const industryOrderForJob = (job: JobCard) => {
    const indexes = relatedIndustryIdsForJob(job.id)
      .map((industryId) => originalIndustryOrder.get(industryId) ?? Number.MAX_SAFE_INTEGER)
    return indexes.length === 0 ? Number.MAX_SAFE_INTEGER : Math.min(...indexes)
  }

  const chainNodes = INDUSTRY_CHAINS
    .filter((chain) => activeChainIds.has(chain.id))
    .sort((a, b) => (originalChainOrder.get(a.id) ?? 0) - (originalChainOrder.get(b.id) ?? 0))
    .map((chain, index, list) => ({
      ...chain,
      key: `chain:${chain.id}`,
      top: topForIndex(index, list.length, 12, 88)
    }))
  const industryNodes = INDUSTRY_NODES
    .filter((industry) => activeIndustryIds.has(industry.id))
    .sort((a, b) => (originalIndustryOrder.get(a.id) ?? 0) - (originalIndustryOrder.get(b.id) ?? 0))
    .map((industry, index, list) => ({
      ...industry,
      key: `industry:${industry.id}`,
      top: topForIndex(index, list.length, 8, 92)
    }))
  const orderedJobs = [...jobs]
    .sort((a, b) => {
      const industryDiff = industryOrderForJob(a) - industryOrderForJob(b)
      if (industryDiff !== 0) return industryDiff
      return (originalJobOrder.get(a.id) ?? 0) - (originalJobOrder.get(b.id) ?? 0)
    })
    .map((job, index, list) => ({
      ...job,
      row: index,
      key: `job:${job.id}`,
      top: topForIndex(index, list.length, 6, 94)
    }))
  const groupedJobs = Array.from(
    orderedJobs.reduce((groups, job) => {
      const currentGroup = groups.get(job.groupName)
      if (currentGroup) {
        currentGroup.jobs.push(job)
      } else {
        groups.set(job.groupName, { name: job.groupName, jobs: [job] })
      }
      return groups
    }, new Map<string, { name: string; jobs: typeof orderedJobs }>())
      .values()
  )
  const groupGapPx = 26
  const groupShellHeightPx = 72
  const groupJobHeightPx = 56
  const groupJobGapPx = 10
  const desiredGroupHeights = groupedJobs.map(
    (group) => groupShellHeightPx + group.jobs.length * groupJobHeightPx + Math.max(group.jobs.length - 1, 0) * groupJobGapPx
  )
  const totalDesiredHeight =
    desiredGroupHeights.reduce((sum, height) => sum + height, 0) + Math.max(groupedJobs.length - 1, 0) * groupGapPx
  const effectiveCanvasHeight = Math.max(graphCanvasHeight, Math.ceil(totalDesiredHeight / 0.88))
  const groupStartPx = effectiveCanvasHeight * 0.06
  const groupAvailablePx = effectiveCanvasHeight * 0.88
  const groupScale = totalDesiredHeight > groupAvailablePx ? groupAvailablePx / totalDesiredHeight : 1
  let groupCursorPx = groupStartPx
  const jobGroups: GraphLayoutJobGroup[] = groupedJobs.map((group, index) => {
    const heightPx = desiredGroupHeights[index] * groupScale
    const result = {
      key: `job-group:${group.name}:${index}`,
      name: group.name,
      count: group.jobs.length,
      top: (groupCursorPx / effectiveCanvasHeight) * 100,
      height: (heightPx / effectiveCanvasHeight) * 100,
      tone: graphGroupTones[index % graphGroupTones.length],
      jobs: group.jobs
    }
    groupCursorPx += heightPx + (groupedJobs.length === 1 ? 0 : groupGapPx * groupScale)
    return result
  })

  const rowCount = Math.max(orderedJobs.length, 1)
  const jobRowById = new Map(orderedJobs.map((job) => [job.id, job.row]))
  const jobById = new Map(orderedJobs.map((job) => [job.id, job]))
  const activeCourseRelations = COURSE_NODES.map((course) => ({
    ...course,
    jobIds: jobs
      .filter((job) => getCourseIds(job.id).includes(course.id))
      .map((job) => job.id)
  })).filter((course) => course.jobIds.length > 0)

  const courseWithAverage = activeCourseRelations.map((course) => {
    const linkedRows = course.jobIds
      .map((jobId) => jobRowById.get(jobId))
      .filter((value): value is number => value !== undefined)
    const averageRow =
      linkedRows.length === 0
        ? rowCount / 2
        : linkedRows.reduce((sum, item) => sum + item, 0) / linkedRows.length
    return { ...course, averageRow }
  }).sort((a, b) => a.averageRow - b.averageRow)

  const courseNodes = courseWithAverage.map((course, index) => ({
    key: `course:${course.id}`,
    id: course.id,
    name: course.name,
    top: courseWithAverage.length === 1 ? 50 : 9 + (index / (courseWithAverage.length - 1)) * 82
  }))

  const links: GraphLayoutLink[] = []

  for (const relation of activeIndustryChainRelations) {
    const chainKey = `chain:${relation.chainId}`
    const industryKey = `industry:${relation.industryNodeId}`
    links.push({
      key: `chain-industry-${relation.chainId}-${relation.industryNodeId}`,
      fromKey: chainKey,
      toKey: industryKey,
      keys: [chainKey, industryKey]
    })
  }

  for (const relation of activeJobIndustryRelations) {
    const industryKey = `industry:${relation.industryNodeId}`
    const jobKey = `job:${relation.jobId}`
    links.push({
      key: `industry-job-${relation.industryNodeId}-${relation.jobId}`,
      fromKey: industryKey,
      toKey: jobKey,
      keys: [
        industryKey,
        jobKey,
        ...relatedChainIdsForIndustry(relation.industryNodeId).map((chainId) => `chain:${chainId}`)
      ].filter(Boolean)
    })
  }

  for (const course of courseNodes) {
    const sourceCourse = activeCourseRelations.find((item) => item.id === course.id)
    if (!sourceCourse) continue
    sourceCourse.jobIds.forEach((jobId, index) => {
      const jobRow = jobRowById.get(jobId)
      const job = jobById.get(jobId)
      if (jobRow === undefined || !job) return
      const industryKeys = relatedIndustryIdsForJob(job.id).map((industryId) => `industry:${industryId}`)
      const chainKeys = relatedChainIdsForJob(job.id).map((chainId) => `chain:${chainId}`)
      const jobKey = `job:${jobId}`
      const courseKey = `course:${course.id}`

      links.push({
        key: `job-course-${jobId}-${course.id}`,
        fromKey: jobKey,
        toKey: courseKey,
        keys: [
          jobKey,
          courseKey,
          ...industryKeys,
          ...chainKeys
        ].filter(Boolean),
        curve: index % 2 === 0 ? 4 : -4
      })
    })
  }

  return {
    canvasHeight: effectiveCanvasHeight,
    chains: chainNodes,
    industries: industryNodes,
    jobGroups,
    jobs: orderedJobs,
    courses: courseNodes,
    links
  }
}
const graphLayout = computed(() => buildGraphLayout(jobCardsForBuild.value, courseIdsForJob))
const resultsPortalGraphLayout = computed(() => buildGraphLayout(JOB_CARDS, defaultCourseIdsForJob))
const graphLineViewBox = computed(() => `0 0 ${graphLineBox.value.width} ${graphLineBox.value.height}`)
const resultsPortalGraphLineViewBox = computed(
  () => `0 0 ${resultsPortalGraphLineBox.value.width} ${resultsPortalGraphLineBox.value.height}`
)
const resultsPortalCourseCount = computed(() => resultsPortalGraphLayout.value.courses.length)
const resultsPortalHeroMetrics = computed(() => {
  const linkedAgentCount = talentCourses.filter((course) => course[2]).length

  return [
    { label: '专业课程', value: talentCourses.length, icon: '▣' },
    { label: '建设岗位', value: JOB_CARDS.length, icon: '◎' },
    { label: '知识点', value: Math.round(talentCourses.length * 2.5), icon: '▥' },
    { label: 'AI工具', value: Math.max(6, Math.round(linkedAgentCount / 3)), icon: 'AI' },
    { label: '智能体', value: linkedAgentCount, icon: '◇' },
    { label: '专业资源', value: Math.round(talentCourses.length * 0.65), icon: '▤' }
  ]
})
const resultsPortalJobCards = computed(() =>
  JOB_CARDS.map((job, index) => {
    const industry = INDUSTRY_NODES.find((item) => item.id === job.industryNodeId)
    const chain = INDUSTRY_CHAINS.find((item) => item.id === industry?.chainId)
    const detail = getJobDetail(job.id)
    const courseCount = defaultCourseIdsForJob(job.id).length
    const matchRate = Math.min(94, 76 + Math.round((job.taskCount + job.abilityCount + courseCount * 2) / 4) + (index % 3))

    return {
      ...job,
      chainName: chain?.name ?? '智能建造产业链',
      industryName: industry?.name ?? 'BIM协同设计与算量平台',
      salaryRange: detail.salaryRange,
      education: detail.education,
      courseCount,
      matchRate,
      summary: `${job.groupName}覆盖${industry?.name ?? '智能建造工程场景'}方向，适合沉淀为专业岗位能力与课程映射卡片。`
    }
  })
)
const activeResultsPortalJobCard = computed(
  () => resultsPortalJobCards.value[activeResultsPortalJobCardIndex.value] ?? resultsPortalJobCards.value[0]
)
const showResultsPortalJobCard = (index: number) => {
  const total = resultsPortalJobCards.value.length
  if (total === 0) return
  activeResultsPortalJobCardIndex.value = (index + total) % total
}
const focusResultsPortalJobCard = (jobId: string) => {
  const index = resultsPortalJobCards.value.findIndex((job) => job.id === jobId)
  if (index >= 0) activeResultsPortalJobCardIndex.value = index
}
const resultsPortalKpis = computed(() => [
  { label: '建设岗位', value: JOB_CARDS.length, unit: '个', icon: '◎', featured: true },
  { label: '典型工作任务', value: JOB_CARDS.reduce((sum, job) => sum + job.taskCount, 0), unit: '项', icon: '▤' },
  { label: '岗位能力项', value: JOB_CARDS.reduce((sum, job) => sum + job.abilityCount, 0), unit: '项', icon: '✦', featured: true },
  { label: '关联课程', value: resultsPortalCourseCount.value, unit: '门', icon: '▣' },
  { label: '岗课匹配度', value: 86, unit: '%', icon: '◇', featured: true }
])
const resultsPortalInsights = [
  { label: '关联产业链', value: '智能建造产业链', detail: '覆盖BIM协同、装配式建造、智慧工地、智能检测监测与绿色运维等关键链路。' },
  { label: '朝阳产业', value: '高成长', detail: '建筑业数字化转型和智能建造试点推动岗位需求持续扩张。' },
  { label: '开设趋势', value: '持续上升', detail: '近三年智能建造、BIM、智慧工地相关课程与实训基地建设热度上行。' },
  { label: '就业规模', value: '约 12.6 万人', detail: '产业内相关岗位容量充足，BIM深化、智慧工地和智能检测方向最集中。' }
]
const resultsPortalPath = [
  { step: '01', label: '产业链定位', detail: '锁定智能建造基础资源、数字化平台、场景应用三条关键链路。' },
  { step: '02', label: '岗位群聚焦', detail: '突出BIM深化、智慧工地、智能检测、建筑机器人等高频岗位群。' },
  { step: '03', label: '任务能力拆解', detail: '按典型工作任务沉淀知识、技能、素养能力项。' },
  { step: '04', label: '课程资源反哺', detail: '将岗位能力映射到课程体系与实训项目。' }
]
const selectedGraphJob = computed(() =>
  [...jobCardsForBuild.value, ...JOB_CARDS].find((job) => job.id === selectedGraphJobId.value)
)
const selectedGraphAbilityTitle = computed(() => `「${selectedGraphJob.value?.name ?? '岗位'}岗位」岗位能力图谱`)
const selectedGraphIndustry = computed(() =>
  INDUSTRY_NODES.find((industry) => industry.id === selectedGraphJob.value?.industryNodeId)
)
const selectedGraphChain = computed(() =>
  INDUSTRY_CHAINS.find((chain) => chain.id === selectedGraphIndustry.value?.chainId)
)
const selectedGraphIndustryJobs = computed(() => {
  const industryId = selectedGraphIndustry.value?.id
  if (!industryId) return []

  return (isResultsPortal ? JOB_CARDS : jobCardsForBuild.value).filter(
    (job) => job.industryNodeId === industryId
  )
})
const selectedGraphIndustryCourseCount = computed(() => {
  const courseIds = new Set<string>()
  for (const job of selectedGraphIndustryJobs.value) {
    const ids = isResultsPortal ? defaultCourseIdsForJob(job.id) : courseIdsForJob(job.id)
    ids.forEach((id) => courseIds.add(id))
  }
  return courseIds.size
})
const selectedGraphJobDetail = computed(() => jobDetailForId(selectedGraphJobId.value))
const selectedGraphJobTasks = computed(() => jobTasksForId(selectedGraphJobId.value))
const activeGraphTask = computed(() => selectedGraphJobTasks.value[activeGraphTaskIndex.value])
const activeGraphAbilityNames = computed(() => new Set(activeGraphTask.value?.abilities ?? []))
const graphAbilityGroups = computed(() =>
  abilityCategories.map((category) => ({
    category,
    abilities: selectedGraphJobDetail.value.abilities.filter((ability) => ability.category === category)
  }))
)
const activeGraphKeys = computed(() => {
  if (!hoverKey.value) return new Set<string>()
  const keys = new Set<string>([hoverKey.value])
  const layout = isResultsPortal ? resultsPortalGraphLayout.value : graphLayout.value
  for (const link of layout.links) {
    if (link.keys.includes(hoverKey.value)) {
      link.keys.forEach((key) => keys.add(key))
    }
  }
  return keys
})
const activeGraphLinkKeys = computed(() => {
  if (!hoverKey.value) return new Set<string>()

  const layout = isResultsPortal ? resultsPortalGraphLayout.value : graphLayout.value
  const keys = activeGraphKeys.value
  return new Set(
    layout.links
      .filter(
        (link) =>
          link.keys.includes(hoverKey.value) ||
          (keys.has(link.fromKey) && keys.has(link.toKey))
      )
      .map((link) => link.key)
  )
})
const activeTask = computed(() => selectedJobTasks.value[activeMapTaskIndex.value])
const activeAbilityNames = computed(() => new Set(activeTask.value?.abilities ?? []))
const groupedAbilities = computed(() =>
  abilityCategories.map((category) => ({
    category,
    abilities: selectedJobDetail.value.abilities.filter((ability) => ability.category === category)
  }))
)
const radarGridPolygons = computed(() => [0.25, 0.5, 0.75, 1].map((level) => radarPoints(level)))
const radarPolygon = computed(() => radarPoints(1, selectedJobDetail.value.suitability.map((item) => item.score / 100)))
const radarAxes = computed(() =>
  selectedJobDetail.value.suitability.map((_, index) => ({
    x1: 150,
    y1: 150,
    ...radarPoint(index, 1)
  }))
)
const portraitRadarLabels = ['知识基础', '工程实践', '工具平台', '业务场景', '交付协作']

const isGraphActive = (key: string) => hoverKey.value !== '' && activeGraphKeys.value.has(key)
const isGraphDimmed = (key: string) => hoverKey.value !== '' && !activeGraphKeys.value.has(key)
const graphNodeStyle = (left: number, width: number, top: number) => ({
  left: `${left}%`,
  width: `${width}%`,
  top: `${top}%`
})
const graphGroupStyle = (left: number, width: number, top: number, height: number) => ({
  left: `${left}%`,
  width: `${width}%`,
  top: `${top}%`,
  height: `${height}%`
})
const graphLinkPath = (fromX: number, fromY: number, toX: number, toY: number, curve = 0) => {
  const handle = Math.max(34, Math.min(96, Math.abs(toX - fromX) * 0.48))
  return `M ${fromX} ${fromY} C ${fromX + handle} ${fromY + curve}, ${toX - handle} ${toY - curve}, ${toX} ${toY}`
}
const measureGraphLinks = (root: HTMLElement, links: GraphLayoutLink[]) => {
  const rootRect = root.getBoundingClientRect()
  if (rootRect.width === 0 || rootRect.height === 0) {
    return { box: { width: 1, height: 1 }, links: [] as GraphMeasuredLink[] }
  }

  const nodeByKey = new Map(
    Array.from(root.querySelectorAll<HTMLElement>('[data-graph-key]')).map((element) => [
      element.dataset.graphKey ?? '',
      element
    ])
  )
  const measuredLinks = links.flatMap((link) => {
    const fromElement = nodeByKey.get(link.fromKey)
    const toElement = nodeByKey.get(link.toKey)
    if (!fromElement || !toElement) return []

    const fromRect = fromElement.getBoundingClientRect()
    const toRect = toElement.getBoundingClientRect()
    const fromX = fromRect.right - rootRect.left
    const fromY = fromRect.top + fromRect.height / 2 - rootRect.top
    const toX = toRect.left - rootRect.left
    const toY = toRect.top + toRect.height / 2 - rootRect.top
    return [{
      ...link,
      d: graphLinkPath(fromX, fromY, toX, toY, link.curve)
    }]
  })

  return {
    box: { width: rootRect.width, height: rootRect.height },
    links: measuredLinks
  }
}
const measureGraphAbilityLinks = (root: HTMLElement) => {
  const rootRect = root.getBoundingClientRect()
  const taskElement = root.querySelector<HTMLElement>(
    `[data-graph-map-task-index="${activeGraphTaskIndex.value}"]`
  )
  if (!taskElement || rootRect.width === 0 || rootRect.height === 0) {
    return { box: { width: 1, height: 1 }, links: [] as Array<{ key: string; d: string; active?: boolean }> }
  }

  const taskRect = taskElement.getBoundingClientRect()
  const fromX = taskRect.right - rootRect.left
  const fromY = taskRect.top + taskRect.height / 2 - rootRect.top
  const activeNames = activeGraphAbilityNames.value
  const links = Array.from(root.querySelectorAll<HTMLElement>('[data-graph-map-ability]'))
    .filter((element) => activeNames.has(element.dataset.graphMapAbility ?? ''))
    .map((element) => {
      const rect = element.getBoundingClientRect()
      const toX = rect.left - rootRect.left
      const toY = rect.top + rect.height / 2 - rootRect.top
      const midX = (fromX + toX) / 2
      return {
        key: `${activeGraphTaskIndex.value}-${element.dataset.graphMapAbility}`,
        d: `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`,
        active: true
      }
    })

  return {
    box: { width: rootRect.width, height: rootRect.height },
    links
  }
}
const measurePortraitCompetencyLines = (root: HTMLElement) => {
  const rootRect = root.getBoundingClientRect()
  const taskElement = root.querySelector<HTMLElement>(
    `[data-portrait-competency-task-index="${activePortraitCompetencyTaskIndex.value}"]`
  )
  if (!taskElement || rootRect.width === 0 || rootRect.height === 0) {
    return { box: { width: 1, height: 1 }, links: [] as Array<{ key: string; d: string; active?: boolean }> }
  }

  const taskRect = taskElement.getBoundingClientRect()
  const fromX = taskRect.left + taskRect.width / 2 - rootRect.left
  const fromY = taskRect.bottom - rootRect.top
  const activeNames = portraitCompetencyActiveAbilityNames.value
  const links = Array.from(root.querySelectorAll<HTMLElement>('[data-portrait-competency-ability]'))
    .filter((element) => activeNames.has(element.dataset.portraitCompetencyAbility ?? ''))
    .map((element) => {
      const rect = element.getBoundingClientRect()
      const toX = rect.left + rect.width / 2 - rootRect.left
      const toY = rect.top - rootRect.top
      const midY = fromY + Math.max(48, (toY - fromY) * 0.42)
      return {
        key: `${activePortraitCompetencyTaskIndex.value}-${element.dataset.portraitCompetencyAbility}`,
        d: `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`,
        active: true
      }
    })

  return {
    box: { width: rootRect.width, height: rootRect.height },
    links
  }
}
const updateGraphLines = async () => {
  await nextTick()
  if (typeof window === 'undefined') return

  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

  if (graphCanvasRef.value) {
    const measured = measureGraphLinks(graphCanvasRef.value, graphLayout.value.links)
    graphLineBox.value = measured.box
    graphMeasuredLinks.value = measured.links
  } else {
    graphMeasuredLinks.value = []
  }

  if (resultsGraphCanvasRef.value) {
    const measured = measureGraphLinks(resultsGraphCanvasRef.value, resultsPortalGraphLayout.value.links)
    resultsPortalGraphLineBox.value = measured.box
    resultsPortalGraphMeasuredLinks.value = measured.links
  } else {
    resultsPortalGraphMeasuredLinks.value = []
  }
}
const updateGraphAbilityLines = async () => {
  await nextTick()
  if (typeof window === 'undefined') return

  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

  if (graphAbilityMapRef.value) {
    const measured = measureGraphAbilityLinks(graphAbilityMapRef.value)
    graphAbilityMapBox.value = measured.box
    graphAbilityLinePaths.value = measured.links
  } else {
    graphAbilityLinePaths.value = []
  }

  if (resultsGraphAbilityMapRef.value) {
    const measured = measureGraphAbilityLinks(resultsGraphAbilityMapRef.value)
    resultsGraphAbilityMapBox.value = measured.box
    resultsGraphAbilityLinePaths.value = measured.links
  } else {
    resultsGraphAbilityLinePaths.value = []
  }
}
const updatePortraitCompetencyLines = async () => {
  await nextTick()
  if (typeof window === 'undefined') return

  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

  if (portraitCompetencyMapRef.value) {
    const measured = measurePortraitCompetencyLines(portraitCompetencyMapRef.value)
    portraitCompetencyMapBox.value = measured.box
    portraitCompetencyLinePaths.value = measured.links
  } else {
    portraitCompetencyLinePaths.value = []
  }
}
const graphModeKey = computed(() => selectedGraphJobId.value ? `ability-${selectedGraphJobId.value}` : 'industry')
const refreshGraphModeLines = () => {
  if (selectedGraphJobId.value) {
    updateGraphAbilityLines()
  } else {
    updateGraphLines()
  }
}
const scrollResultsPortalGraphIntoView = async () => {
  await nextTick()
  if (typeof window === 'undefined') return

  window.requestAnimationFrame(() => {
    resultsPortalGraphRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
const openGraphAbility = (jobId: string, shouldScroll = false) => {
  focusResultsPortalJobCard(jobId)
  selectedGraphJobId.value = jobId
  activeGraphTaskIndex.value = 0
  hoverKey.value = ''
  updateGraphAbilityLines()
  if (shouldScroll) scrollResultsPortalGraphIntoView()
}
const selectGraphAbilityTask = (index: number) => {
  activeGraphTaskIndex.value = index
  updateGraphAbilityLines()
}
const closeGraphAbility = () => {
  selectedGraphJobId.value = ''
  activeGraphTaskIndex.value = 0
  updateGraphLines()
}
function radarPoint(index: number, value = 1) {
  const total = selectedJobDetail.value.suitability.length
  const angle = (-90 + (360 / total) * index) * (Math.PI / 180)
  const radius = 96 * value
  return {
    x: 150 + Math.cos(angle) * radius,
    y: 150 + Math.sin(angle) * radius
  }
}
function radarPoints(level: number, values?: number[]) {
  return selectedJobDetail.value.suitability
    .map((_, index) => {
      const point = radarPoint(index, values ? values[index] : level)
      return `${point.x},${point.y}`
    })
    .join(' ')
}
function portraitRadarPoint(index: number, total: number, value = 1) {
  const angle = (-90 + (360 / total) * index) * (Math.PI / 180)
  const radius = 92 * value
  return {
    x: 140 + Math.cos(angle) * radius,
    y: 140 + Math.sin(angle) * radius
  }
}
function portraitRadarPoints(values: number[]) {
  return values
    .map((value, index) => {
      const point = portraitRadarPoint(index, values.length, value / 100)
      return `${point.x},${point.y}`
    })
    .join(' ')
}
function portraitRadarGridPoints(level: number) {
  return portraitRadarLabels
    .map((_, index) => {
      const point = portraitRadarPoint(index, portraitRadarLabels.length, level)
      return `${point.x},${point.y}`
    })
    .join(' ')
}
const radarLabelStyle = (index: number) => {
  const point = radarPoint(index, 1.24)
  return {
    left: `${(point.x / 300) * 100}%`,
    top: `${(point.y / 300) * 100}%`
  }
}
const portraitRadarLabelStyle = (index: number) => {
  const point = portraitRadarPoint(index, portraitRadarLabels.length, 1.22)
  return {
    left: `${(point.x / 280) * 100}%`,
    top: `${(point.y / 280) * 100}%`
  }
}
const openJobDetail = (jobId: string) => {
  selectedJobId.value = jobId
  activeDetailTab.value = 'basic'
  activeMapTaskIndex.value = 0
}
const openPortraitJobDialog = (jobId: string) => {
  selectedPortraitJobId.value = jobId
  selectedCertificateId.value = ''
  selectedCompanyId.value = ''
}
const buildStandaloneViewUrl = (
  view: string,
  extraParams: Record<string, string> = {}
) => {
  if (typeof window === 'undefined') {
    const query = new URLSearchParams({ view, ...extraParams })
    return `?${query.toString()}`
  }

  const url = new URL('./index.html', window.location.href)
  url.search = ''
  url.searchParams.set('view', view)
  Object.entries(extraParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return url.toString()
}
const openStandaloneView = (urlString: string) => {
  if (typeof window === 'undefined') return
  const opened = window.open(urlString, '_blank')
  if (opened) {
    opened.opener = null
    return
  }
  window.location.href = urlString
}
const portraitCompetencyMapUrl = (jobId: string) => {
  return buildStandaloneViewUrl('job-competency-map', { job: jobId })
}
const openPortraitCompetencyMap = (jobId: string) => {
  openStandaloneView(portraitCompetencyMapUrl(jobId))
}
const closePortraitJobDialog = () => {
  selectedPortraitJobId.value = ''
  selectedCertificateId.value = ''
  selectedCompanyId.value = ''
}
const openCertificateDialog = (certificateId: string) => {
  selectedCertificateId.value = certificateId
}
const closeCertificateDialog = () => {
  selectedCertificateId.value = ''
}
const openCompanyDialog = (companyId: string) => {
  selectedCompanyId.value = companyId
}
const closeCompanyDialog = () => {
  selectedCompanyId.value = ''
}
const selectPortraitCompetencyTask = (index: number) => {
  activePortraitCompetencyTaskIndex.value = index
  updatePortraitCompetencyLines()
}
const setPortraitCompetencyBodyMode = (enabled: boolean) => {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('competency-map-body', enabled)
}
const closePortraitCompetencyMapView = () => {
  if (typeof window === 'undefined') return

  const fallback = new URL(window.location.href)
  fallback.searchParams.delete('view')
  fallback.searchParams.delete('job')
  window.location.href = fallback.toString()
}
const openCultivateGoalDialog = () => {
  selectedCultivateFileName.value = ''
  cultivateCreateDialogOpen.value = true
}
const closeCultivateGoalDialog = () => {
  cultivateCreateDialogOpen.value = false
}
const triggerCultivateImport = () => {
  cultivateFileInput.value?.click()
}
const handleCultivateFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  selectedCultivateFileName.value = input.files?.[0]?.name ?? ''
}
const startManualCultivateEntry = () => {
  closeCultivateGoalDialog()
  currentModule.value = '人才方案管理'
  activeTalentSubsystem.value = ''
  talentPlanCreated.value = true
  activeTalentSection.value = '培养目标'
}
const openCourseMemberDialog = (tab: 'members' | 'roles' = 'members') => {
  courseMemberDialogTab.value = tab
  courseMemberDialogOpen.value = true
}
const closeCourseMemberDialog = () => {
  courseMemberDialogOpen.value = false
}
const handleCourseTopNavClick = (label: string) => {
  if (label === '成员') {
    openCourseMemberDialog('members')
    return
  }
  if (label === '决策中心') {
    openDecisionCenter()
  }
}
const selectTalentSection = (item: string) => {
  courseModelOpen.value = false
  activeTalentSubsystem.value = ''
  activeTalentSection.value = item
}
const closeCourseNodeMenu = () => {
  courseNodeMenu.value.open = false
}
const closeCourseKnowledgeDrawer = () => {
  courseKnowledgeDrawerOpen.value = false
  closeCourseAbilityDialog()
}
const formatCourseSaveTime = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
const saveCourseKnowledgeDrawer = () => {
  courseDetailLastSavedAt.value = formatCourseSaveTime()
  closeCourseKnowledgeDrawer()
}
const toggleCourseGraphEdit = () => {
  courseGraphEditing.value = !courseGraphEditing.value
  closeCourseNodeMenu()
  if (!courseGraphEditing.value) closeCourseKnowledgeDrawer()
}
const openCourseNodeMenu = (node: (typeof courseKnowledgeNodes)[number], event: MouseEvent) => {
  if (!courseGraphEditing.value) return
  if (courseKnowledgeDrawerOpen.value) return
  event.stopPropagation()
  courseNodeMenu.value = {
    open: true,
    left: node.x,
    top: node.y,
    label: node.label.replace(/\n/g, '')
  }
}
const openCourseKnowledgeDrawer = () => {
  courseKnowledgeDrawerOpen.value = true
  courseDetailActiveTab.value = '知识点详情'
  closeCourseNodeMenu()
}
const applyCourseNodeAbilityRelations = (nextRelations: CourseNodeAbilityRelation[]) => {
  const nodeKey = selectedCourseNodeLabel.value
  const nextMap = { ...courseNodeAbilityRelations.value }
  if (nextRelations.length === 0) {
    delete nextMap[nodeKey]
  } else {
    nextMap[nodeKey] = nextRelations
  }
  courseNodeAbilityRelations.value = nextMap
}
const buildCourseAbilityDraftsFromRelations = (relations: CourseNodeAbilityRelation[]) =>
  relations.reduce<Record<string, CourseAbilityCategoryMap>>((drafts, relation) => {
    drafts[relation.jobId] = cloneCourseAbilityMap(relation.abilities)
    return drafts
  }, {})
const closeCourseAbilityDialog = () => {
  courseAbilityDialogOpen.value = false
  courseAbilityJobSearch.value = ''
  selectedCourseAbilityJobId.value = ''
  courseAbilityDraft.value = createEmptyCourseAbilityMap()
  courseAbilityDraftsByJob.value = {}
}
const pickCourseAbilityJob = (jobId: string) => {
  const option = courseJobAbilityOptionMap.get(jobId)
  if (!option) return
  selectedCourseAbilityJobId.value = jobId
  courseAbilityDraft.value = cloneCourseAbilityMap(
    courseAbilityDraftsByJob.value[jobId] ?? createEmptyCourseAbilityMap()
  )
}
const openCourseAbilityDialog = () => {
  courseAbilityDialogOpen.value = true
  courseAbilityJobSearch.value = ''
  courseAbilityDraftsByJob.value = buildCourseAbilityDraftsFromRelations(selectedCourseNodeAbilityRelations.value)
  const firstJobId = selectedCourseNodeAbilityRelations.value[0]?.jobId ?? courseJobAbilityOptions[0]?.id ?? ''
  if (firstJobId) pickCourseAbilityJob(firstJobId)
}
const toggleCourseAbilityDraftItem = (category: CourseAbilityCategory, ability: string) => {
  if (!selectedCourseAbilityJobId.value) return
  const selected = new Set(courseAbilityDraft.value[category])
  if (selected.has(ability)) {
    selected.delete(ability)
  } else {
    selected.add(ability)
  }
  const nextDraft = {
    ...courseAbilityDraft.value,
    [category]: [...selected]
  }
  courseAbilityDraft.value = nextDraft
  courseAbilityDraftsByJob.value = {
    ...courseAbilityDraftsByJob.value,
    [selectedCourseAbilityJobId.value]: cloneCourseAbilityMap(nextDraft)
  }
}
const saveCourseAbilityRelations = () => {
  const nextRelations = Object.entries(courseAbilityDraftsByJob.value)
    .map(([jobId, abilities]) => {
      const option = courseJobAbilityOptionMap.get(jobId)
      if (!option || !hasCourseAbilities(abilities)) return null
      return {
        jobId: option.id,
        jobName: option.name,
        chain: option.chain,
        node: option.node,
        abilities: cloneCourseAbilityMap(abilities)
      } satisfies CourseNodeAbilityRelation
    })
    .filter((relation): relation is CourseNodeAbilityRelation => relation !== null)
  applyCourseNodeAbilityRelations(nextRelations)
  closeCourseAbilityDialog()
}
const removeCourseAbilityRelation = (jobId: string) => {
  const relations = selectedCourseNodeAbilityRelations.value.filter((relation) => relation.jobId !== jobId)
  applyCourseNodeAbilityRelations(relations)
}
const removeCourseAbilityItem = (jobId: string, category: CourseAbilityCategory, ability: string) => {
  const relations = selectedCourseNodeAbilityRelations.value.map((relation) => {
    if (relation.jobId !== jobId) return relation
    return {
      ...relation,
      abilities: {
        ...relation.abilities,
        [category]: relation.abilities[category].filter((item) => item !== ability)
      }
    }
  }).filter((relation) => hasCourseAbilities(relation.abilities))
  applyCourseNodeAbilityRelations(relations)
}
const courseModelUrl = computed(() => {
  return buildStandaloneViewUrl('course-model')
})
const openCourseModelPage = () => {
  closeCourseMemberDialog()
  openStandaloneView(courseModelUrl.value)
}
const openDecisionCenter = () => {
  closeCourseMemberDialog()
  courseModelOpen.value = false
  currentModule.value = '决策中心'
  restoreDecisionState()
}
const selectDecisionPage = (group: DecisionGroupKey, page: DecisionPageKey) => {
  activeDecisionGroup.value = group
  activeDecisionPage.value = page
  persistDecisionState()
}
const runDecisionPlanAnalysis = (nextStatus: Extract<DecisionFlowStatus, 'warning' | 'result'>) => {
  clearDecisionPlanTimer()
  decisionPlanStatus.value = 'loading'
  persistDecisionState()
  decisionPlanTimer = window.setTimeout(() => {
    decisionPlanStatus.value = nextStatus
    decisionPlanTimer = undefined
    persistDecisionState()
  }, 900)
}
const startDecisionPlanAnalysis = () => {
  runDecisionPlanAnalysis('warning')
}
const continueDecisionPlanAnalysis = () => {
  runDecisionPlanAnalysis('result')
}
const restartDecisionPlanAnalysis = () => {
  clearDecisionPlanTimer()
  decisionPlanStatus.value = 'pending'
  persistDecisionState()
}
const runDecisionCourseAnalysis = (nextStatus: Extract<DecisionFlowStatus, 'warning' | 'result'>) => {
  clearDecisionCourseTimer()
  decisionCourseStatus.value = 'loading'
  persistDecisionState()
  decisionCourseTimer = window.setTimeout(() => {
    decisionCourseStatus.value = nextStatus
    decisionCourseTimer = undefined
    persistDecisionState()
  }, 900)
}
const startDecisionCourseAnalysis = () => {
  runDecisionCourseAnalysis('warning')
}
const continueDecisionCourseAnalysis = () => {
  runDecisionCourseAnalysis('result')
}
const restartDecisionCourseAnalysis = () => {
  clearDecisionCourseTimer()
  decisionCourseStatus.value = 'pending'
  persistDecisionState()
}
const openTalentSubsystem = (key: string) => {
  courseModelOpen.value = false
  currentModule.value = '人才方案管理'
  activeTalentSubsystem.value = key
}
const setEngineSection = (key: EngineSectionKey) => {
  engineActiveSection.value = key
}
const resetResearchScroll = () => {
  nextTick(() => {
    document.querySelector<HTMLElement>('.talent-research-page')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  })
}
const searchResearchPlans = () => {
  researchHasSearched.value = true
  selectedResearchPlanId.value = ''
  resetResearchScroll()
}
const searchResearchSuggestion = (keyword: string) => {
  researchSearchForm.value = {
    ...researchSearchForm.value,
    keyword
  }
  searchResearchPlans()
}
const openResearchPlanPreview = (planId: string) => {
  selectedResearchPlanId.value = planId
  resetResearchScroll()
}
const closeResearchPlanPreview = () => {
  selectedResearchPlanId.value = ''
  resetResearchScroll()
}
const resetCompareScroll = () => {
  nextTick(() => {
    document.querySelector<HTMLElement>('.talent-compare-page')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  })
}
const clearCompareLoadingTimer = () => {
  if (compareLoadingTimer !== undefined) {
    window.clearTimeout(compareLoadingTimer)
    compareLoadingTimer = undefined
  }
}
const simulateSourcePlanUpload = () => {
  compareSourceFileName.value = '本地上传-智能建造工程专业人才培养方案.pdf'
  compareExportStatus.value = ''
}
const chooseCompareTargetMode = (mode: string) => {
  compareTargetMode.value = mode
  compareExportStatus.value = ''
}
const simulateTargetPlanUpload = () => {
  compareTargetMode.value = 'upload'
  compareTargetFileName.value = '被比对-智能建造工程专业标杆人才培养方案.pdf'
  compareExportStatus.value = ''
}
const simulateReferenceFileImport = () => {
  compareReferenceFiles.value = [
    '辽宁智能建造产业链调研报告.pdf',
    '智能建造工程专业岗位能力分析报告.docx'
  ]
  compareExportStatus.value = ''
}
const startTalentPlanCompare = () => {
  clearCompareLoadingTimer()
  compareStarted.value = false
  compareLoading.value = true
  activeCompareModuleName.value = compareModules[0].name
  compareExportStatus.value = ''
  resetCompareScroll()
  compareLoadingTimer = window.setTimeout(() => {
    compareLoading.value = false
    compareStarted.value = true
    compareLoadingTimer = undefined
    resetCompareScroll()
  }, 900)
}
const resetTalentPlanCompare = () => {
  clearCompareLoadingTimer()
  compareLoading.value = false
  compareStarted.value = false
  activeCompareModuleName.value = compareModules[0].name
  compareEditorContents.value = { ...defaultCompareEditorContents }
  compareExportStatus.value = ''
  resetCompareScroll()
}
const selectCompareModuleForEdit = (moduleName: string) => {
  activeCompareModuleName.value = moduleName
  compareExportStatus.value = ''
}
const insertCompareEditorSnippet = (type: string) => {
  const module = activeCompareModule.value
  const snippets: Record<string, string> = {
    heading: `\n\n## ${module.name}优化建议\n`,
    table: `\n\n| 模块 | 当前方案 | 对标方案 | 修订建议 |\n| --- | --- | --- | --- |\n| ${module.name} | 当前模块内容待增强 | 对标方案表达更完整 | 根据比对建议补充修订 |\n`,
    advice: `\n\n建议补充：${module.advice}\n`
  }
  activeCompareEditorContent.value += snippets[type] ?? ''
}
const exportComparePdf = () => {
  compareExportStatus.value = '已生成：新版人才培养方案（比对修订稿）.pdf'
}
const backToJobCenter = () => {
  selectedJobId.value = ''
}
const selectModule = (label: string) => {
  if (label === '成员') {
    openCourseMemberDialog('members')
    return
  }
  if (label === '建设成果展示') return
  if (label === '决策中心') {
    openDecisionCenter()
    return
  }
  closeCourseMemberDialog()
  courseModelOpen.value = false
  currentModule.value = label
  if (label === '专业引擎' && !engineActiveSection.value) {
    engineActiveSection.value = 'agent'
  }
  if (label !== '人才方案管理') {
    activeTalentSubsystem.value = ''
  }
  closePortraitJobDialog()
  if (label !== '岗位中心') {
    selectedJobId.value = ''
  }
}
const resultsPortalUrl = computed(() => {
  return buildStandaloneViewUrl('results-portal')
})
const openResultsPortal = () => {
  openStandaloneView(resultsPortalUrl.value)
}
const selectJobSection = (item: string) => {
  currentJobSection.value = item
  if (item === '产业调研') currentJobResearchMode.value = 'industry'
  if (item === '产业调研报告') currentReportView.value = 'library'
  selectedJobId.value = ''
  activeDetailTab.value = 'basic'
  closePortraitJobDialog()
}
const selectJobIndustryTab = (tabKey: IndustryResearchTabKey) => {
  currentModule.value = '岗位中心'
  currentJobSection.value = '产业调研'
  currentJobResearchMode.value = 'industry'
  currentJobIndustryTab.value = tabKey
  selectedJobId.value = ''
  closePortraitJobDialog()
}
const selectJobResearchTab = (tabKey: JobResearchTabKey) => {
  currentModule.value = '岗位中心'
  currentJobSection.value = '产业调研'
  currentJobResearchMode.value = 'job'
  currentJobResearchTab.value = tabKey
  currentPortraitPage.value = 1
  selectedJobId.value = ''
  closePortraitJobDialog()
}
const setPortraitPage = (page: number) => {
  currentPortraitPage.value = Math.min(Math.max(page, 1), portraitPageCount.value)
}
const openReportLibrary = () => {
  currentModule.value = '岗位中心'
  currentJobSection.value = '产业调研报告'
  currentReportView.value = 'library'
  selectedJobId.value = ''
  closePortraitJobDialog()
}
const openReportCreate = () => {
  currentJobSection.value = '产业调研报告'
  currentReportView.value = 'create'
  activeReportId.value = 0
  reportForm.value = { ...REPORT_DEFAULT_FORM }
  selectedReportDimensions.value = REPORT_DIMENSIONS.map((item) => item.key)
  reportTocRows.value = buildReportTocRows(REPORT_TOC)
  reportEditorContent.value = REPORT_CONTENT
}
const editReport = (report: ResearchReportItem) => {
  currentReportView.value = 'editor'
  activeReportId.value = report.id
  reportForm.value = {
    title: report.title,
    type: report.type,
    industry: report.industry,
    region: report.region,
  }
  reportEditorContent.value = REPORT_CONTENT
}
const previewReport = (report?: ResearchReportItem) => {
  if (report) activeReportId.value = report.id
  currentReportView.value = 'preview'
  reportEditorContent.value = REPORT_CONTENT
}
const copyReport = (report: ResearchReportItem) => {
  const nextId = Math.max(...reportRows.value.map((item) => item.id), 0) + 1
  reportRows.value = [
    ...reportRows.value,
    {
      ...report,
      id: nextId,
      title: `${report.title}（副本）`,
      status: 'draft',
      date: new Date().toISOString().slice(0, 10),
    },
  ]
}
const deleteReport = (reportId: number) => {
  reportRows.value = reportRows.value.filter((report) => report.id !== reportId)
}
const toggleReportDimension = (key: string) => {
  selectedReportDimensions.value = selectedReportDimensions.value.includes(key)
    ? selectedReportDimensions.value.filter((item) => item !== key)
    : [...selectedReportDimensions.value, key]
}
const reportSectionChineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const reportTocDisplayNum = (path: number[]) => {
  if (path.length === 1) {
    return `${reportSectionChineseNums[path[0]] ?? path[0] + 1}、`
  }
  return path.map((index) => index + 1).join('.')
}
const updateReportTocTree = (
  rows: ReportTocEditorItem[],
  targetId: string,
  updater: (node: ReportTocEditorItem) => ReportTocEditorItem
): ReportTocEditorItem[] =>
  rows.map((row) => {
    if (row.id === targetId) return updater(row)
    if (!row.children.length) return row
    return { ...row, children: updateReportTocTree(row.children, targetId, updater) }
  })

const removeReportTocTreeNode = (rows: ReportTocEditorItem[], targetId: string): ReportTocEditorItem[] =>
  rows
    .filter((row) => row.id !== targetId)
    .map((row) =>
      row.children.length
        ? { ...row, children: removeReportTocTreeNode(row.children, targetId) }
        : row
    )

const addReportTocChapter = () => {
  reportTocRows.value = [
    ...reportTocRows.value,
    { id: createReportTocId(), title: '新增章节', children: [{ id: createReportTocId(), title: '新增小节', children: [] }] },
  ]
}
const removeReportTocNode = (tocId: string) => {
  if (reportTocRows.value.length <= 1) return
  reportTocRows.value = removeReportTocTreeNode(reportTocRows.value, tocId)
}
const updateReportTocTitle = (tocId: string, title: string) => {
  reportTocRows.value = updateReportTocTree(reportTocRows.value, tocId, (toc) => ({
    ...toc,
    title,
  }))
}
const canAddReportTocChild = (depth: number) => depth < 3
const reportTocPlaceholder = (depth: number) => {
  if (depth === 1) return '新增小节'
  if (depth === 2) return '新增条目'
  return '新增内容'
}
const addReportTocChild = (tocId: string, depth: number) => {
  if (!canAddReportTocChild(depth)) return
  reportTocRows.value = updateReportTocTree(reportTocRows.value, tocId, (toc) => ({
    ...toc,
    children: [...toc.children, { id: createReportTocId(), title: reportTocPlaceholder(depth), children: [] }],
  }))
}
const removeReportTocChild = (tocId: string) => {
  if (reportTocRows.value.length <= 1) return
  reportTocRows.value = removeReportTocTreeNode(reportTocRows.value, tocId)
}
const serializeReportToc = (rows: ReportTocEditorItem[]): ReportTocItem[] =>
  rows.map((row) => ({
    title: row.title,
    children: row.children.length ? serializeReportToc(row.children) : undefined,
  }))
const reportTocRootRows = computed(() =>
  reportTocRows.value.map((node, index) => ({
    id: node.id,
    title: node.title,
    num: node.title === '数据来源说明' ? '' : reportTocDisplayNum([index]),
    path: [index],
    depth: 1,
    children: node.children,
  }))
)
const reportTocChildRows = (children: ReportTocEditorItem[], path: number[]) =>
  children.map((node, index) => ({
    id: node.id,
    title: node.title,
    num: reportTocDisplayNum([...path, index]),
    path: [...path, index],
    depth: path.length + 1,
    children: node.children,
  }))
const generateReportPreview = () => {
  currentReportView.value = 'generating'
  window.setTimeout(() => {
    reportEditorContent.value = REPORT_CONTENT
    currentReportView.value = 'editor'
  }, 900)
}
const updateReportEditorContent = (event: Event) => {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  reportEditorContent.value = target.innerHTML
}
const captureReportEditorContent = () => {
  if (reportEditableRef.value) {
    reportEditorContent.value = reportEditableRef.value.innerHTML
  }
}
const saveReport = () => {
  captureReportEditorContent()
  const now = new Date()
  reportLastSaveTime.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
const exportReportAds = () => {
  const title = activeReport.value?.title ?? reportForm.value.title
  const adsData = {
    _format: 'ADS',
    _version: '1.0',
    _description: '专业群产业调研分析数据标准文件',
    _generated: new Date().toISOString(),
    metadata: {
      reportTitle: title,
      reportType: activeReport.value?.type ?? reportForm.value.type,
      industry: activeReport.value?.industry ?? reportForm.value.industry,
      region: activeReport.value?.region ?? reportForm.value.region,
      majorGroup: activeReport.value?.major ?? REPORT_DEFAULT_MAJOR,
      institution: '示范院校',
      date: activeReport.value?.date ?? new Date().toISOString().slice(0, 10),
    },
    dimensions: selectedReportDimensionItems.value,
    tocStructure: serializeReportToc(reportTocRows.value),
  }
  const blob = new Blob([JSON.stringify(adsData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title.replace(/[/\\?%*:|"<>]/g, '_')}.ads`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
const nextFrame = () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

const buildReportExportNode = (title: string, contentHtml: string) => {
  const exportShell = document.createElement('div')
  exportShell.className = 'report-export-shell'
  exportShell.setAttribute('aria-hidden', 'true')
  const exportDoc = document.createElement('article')
  exportDoc.className = 'report-preview-doc report-export-doc'
  exportDoc.innerHTML = contentHtml
  const footer = document.createElement('p')
  footer.className = 'report-export-footer'
  footer.textContent = `${title}｜专业群产业调研分析平台自动生成`
  exportDoc.appendChild(footer)
  exportShell.appendChild(exportDoc)
  document.body.appendChild(exportShell)
  return exportShell
}
const printReportPdf = async () => {
  captureReportEditorContent()
  const title = activeReport.value?.title ?? reportForm.value.title
  const contentHtml = reportEditableRef.value?.innerHTML?.trim() || reportEditorContent.value
  const exportShell = buildReportExportNode(title, contentHtml)
  try {
    await nextFrame()
    await nextFrame()
    await new Promise((resolve) => window.setTimeout(resolve, 140))
    const exportDoc = exportShell.querySelector('.report-export-doc') as HTMLElement | null
    if (!exportDoc) return
    const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const jsPDFCtor = (jsPdfModule as { jsPDF?: any; default?: any }).jsPDF
      ?? (jsPdfModule as { default?: { jsPDF?: any } }).default?.jsPDF
      ?? (jsPdfModule as { default?: any }).default
    const canvas = await html2canvas(exportDoc, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      windowWidth: exportDoc.scrollWidth,
      windowHeight: exportDoc.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    })
    const pdf = new jsPDFCtor({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const marginX = 10
    const marginTop = 10
    const marginBottom = 12
    const usableWidth = pageWidth - marginX * 2
    const usableHeight = pageHeight - marginTop - marginBottom
    const pageHeightPx = Math.floor((canvas.width * usableHeight) / usableWidth)
    let renderedHeight = 0
    let pageIndex = 0
    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight)
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeight
      const ctx = pageCanvas.getContext('2d')
      if (!ctx) break
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(
        canvas,
        0,
        renderedHeight,
        canvas.width,
        sliceHeight,
        0,
        0,
        pageCanvas.width,
        pageCanvas.height,
      )
      const imageData = pageCanvas.toDataURL('image/jpeg', 0.98)
      if (pageIndex > 0) pdf.addPage()
      const imageHeight = (sliceHeight * usableWidth) / canvas.width
      pdf.addImage(imageData, 'JPEG', marginX, marginTop, usableWidth, imageHeight, undefined, 'FAST')
      renderedHeight += sliceHeight
      pageIndex += 1
    }
    pdf.save(`${title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`)
  } finally {
    exportShell.remove()
  }
}
const openAddJobDialog = () => {
  addJobSearch.value = ''
  selectedCandidateIds.value = []
  addJobDialogOpen.value = true
}
const closeAddJobDialog = () => {
  addJobDialogOpen.value = false
}
const resetTaskForm = () => {
  taskDialogMode.value = 'create'
  editingTaskIndex.value = null
  taskForm.value = {
    name: '',
    description: '',
    abilities: []
  }
}
const openTaskDialog = (task?: JobTask, index?: number) => {
  if (task && typeof index === 'number') {
    taskDialogMode.value = 'edit'
    editingTaskIndex.value = index
    taskForm.value = {
      name: task.name,
      description: task.description,
      abilities: [...task.abilities]
    }
  } else {
    resetTaskForm()
  }
  taskDialogOpen.value = true
}
const openNewTaskDialog = () => openTaskDialog()
const closeTaskDialog = () => {
  taskDialogOpen.value = false
  resetTaskForm()
}
const openCourseDialog = () => {
  courseSearch.value = ''
  courseDialogOpen.value = true
}
const closeCourseDialog = () => {
  courseDialogOpen.value = false
}
const resetAbilityImportDialog = () => {
  abilityImportMode.value = 'append'
  abilityImportFileName.value = ''
  abilityImportDraft.value = []
  abilityImportErrors.value = []
  if (abilityImportFileInput.value) {
    abilityImportFileInput.value.value = ''
  }
}
const openAbilityImportDialog = () => {
  resetAbilityImportDialog()
  abilityImportDialogOpen.value = true
}
const closeAbilityImportDialog = () => {
  abilityImportDialogOpen.value = false
  resetAbilityImportDialog()
}
const triggerAbilityImportFileSelect = () => {
  abilityImportFileInput.value?.click()
}
const downloadAbilityTemplate = () => {
  const workbook = buildAbilityTemplateWorkbook()
  XLSX.writeFile(workbook, abilityTemplateFilename)
}
const handleAbilityImportFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file || !selectedJob.value) return

  abilityImportFileName.value = file.name
  const result = await parseAbilityImportWorkbook(file, selectedJob.value.name)
  abilityImportDraft.value = result.abilities
  abilityImportErrors.value = result.errors
}
const abilityImportReady = computed(() => abilityImportDraft.value.length > 0 && abilityImportErrors.value.length === 0)
const abilityImportDuplicateCount = computed(() => {
  const existingNames = new Set(selectedJobDetail.value.abilities.map((ability) => ability.name))
  return abilityImportDraft.value.filter((ability) => existingNames.has(ability.name)).length
})
const abilityImportAddCount = computed(() => abilityImportDraft.value.length - abilityImportDuplicateCount.value)
const abilityEditDuplicateName = computed(() => {
  const draftName = abilityForm.value.name.trim()
  if (!draftName) return false
  return selectedJobDetail.value.abilities.some(
    (ability) => ability.name === draftName && ability.name !== editingAbilityName.value
  )
})
const abilityEditReady = computed(() =>
  abilityForm.value.name.trim() !== '' &&
  abilityForm.value.definition.trim() !== '' &&
  !abilityEditDuplicateName.value
)
const abilityImportSummary = computed(() => {
  if (!abilityImportFileName.value) return ''
  if (abilityImportErrors.value.length > 0) {
    return `已读取文件：${abilityImportFileName.value}，但还有 ${abilityImportErrors.value.length} 个填写问题需要修正。`
  }
  if (abilityImportMode.value === 'replace') {
    return `已解析 ${abilityImportDraft.value.length} 条能力项，导入后将直接覆盖当前岗位现有能力项。`
  }
  return `已解析 ${abilityImportDraft.value.length} 条能力项，其中可新增 ${abilityImportAddCount.value} 条，重复 ${abilityImportDuplicateCount.value} 条将在增量导入时跳过。`
})
const applyAbilityImport = () => {
  const jobId = selectedJobId.value
  if (!jobId || !abilityImportReady.value) return

  const imported = abilityImportDraft.value.map(cloneJobAbility)
  let nextAbilities: JobAbility[]

  if (abilityImportMode.value === 'replace') {
    nextAbilities = imported
  } else {
    const existing = editableJobAbilitiesForId(jobId)
    const existingNames = new Set(existing.map((ability) => ability.name))
    nextAbilities = [
      ...existing,
      ...imported.filter((ability) => !existingNames.has(ability.name))
    ]
  }

  editableAbilitiesByJobId.value = {
    ...editableAbilitiesByJobId.value,
    [jobId]: nextAbilities
  }
  closeAbilityImportDialog()
}
const openAbilityDialog = (ability: JobAbility) => {
  editingAbilityName.value = ability.name
  abilityForm.value = {
    name: ability.name,
    category: ability.category as AbilityCategoryOption,
    definition: ability.definition
  }
  abilityEditDialogOpen.value = true
}
const closeAbilityDialog = () => {
  abilityEditDialogOpen.value = false
  editingAbilityName.value = ''
  abilityForm.value = {
    name: '',
    category: '知识',
    definition: ''
  }
}
const saveAbilityDialog = () => {
  const jobId = selectedJobId.value
  if (!jobId || !abilityEditReady.value || !editingAbilityName.value) return

  const result = applyAbilityEdit({
    abilities: editableJobAbilitiesForId(jobId),
    tasks: editableJobTasksForId(jobId),
    originalName: editingAbilityName.value,
    nextAbility: {
      name: abilityForm.value.name.trim(),
      category: abilityForm.value.category,
      definition: abilityForm.value.definition.trim()
    }
  })

  editableAbilitiesByJobId.value = {
    ...editableAbilitiesByJobId.value,
    [jobId]: result.abilities
  }
  editableTasksByJobId.value = {
    ...editableTasksByJobId.value,
    [jobId]: result.tasks
  }
  closeAbilityDialog()
}
const requestDeleteAbility = (abilityName: string) => {
  deletingAbilityName.value = abilityName
  abilityDeleteConfirmOpen.value = true
}
const closeAbilityDeleteConfirm = () => {
  abilityDeleteConfirmOpen.value = false
  deletingAbilityName.value = ''
}
const confirmDeleteAbility = () => {
  const jobId = selectedJobId.value
  if (!jobId || !deletingAbilityName.value) return
  const deletedAbilityName = deletingAbilityName.value
  const nextAbilities = editableJobAbilitiesForId(jobId).filter(
    (ability) => ability.name !== deletedAbilityName
  )
  const nextTasks = deleteAbilityReferencesFromTasks(editableJobTasksForId(jobId), deletedAbilityName)

  editableAbilitiesByJobId.value = {
    ...editableAbilitiesByJobId.value,
    [jobId]: nextAbilities
  }
  editableTasksByJobId.value = {
    ...editableTasksByJobId.value,
    [jobId]: nextTasks
  }
  closeAbilityDeleteConfirm()
}
const createBasicInfoForm = (): JobBasicEditForm => {
  const job = selectedJob.value
  const detail = selectedJobDetail.value
  return {
    name: job?.name ?? '',
    occupation: job?.occupation ?? '',
    occupationCode: job?.occupationCode ?? '',
    level: selectedJobLevel.value,
    chainIndustry: selectedJobChainIndustry.value,
    relatedCompanies: detail.relatedCompanies,
    groupName: job?.groupName ?? '',
    salaryRange: detail.salaryRange,
    demandLevel: detail.demandLevel,
    demandVolume: detail.demandVolume,
    education: detail.education,
    experience: detail.experience,
    careerPath: detail.careerPath,
    workSummary: detail.workSummary,
    requirements: detail.requirements
  }
}
const openBasicInfoDialog = () => {
  if (!selectedJob.value) return
  basicInfoForm.value = createBasicInfoForm()
  basicInfoDialogOpen.value = true
}
const closeBasicInfoDialog = () => {
  basicInfoDialogOpen.value = false
}
const normalizeDemandVolume = () => {
  basicInfoForm.value.demandVolume = basicInfoForm.value.demandVolume.replace(/[^\d,]/g, '')
}
const basicInfoFormReady = computed(() => {
  const form = basicInfoForm.value
  return form.name.trim() !== ''
    && form.occupation.trim() !== ''
    && /^[0-9-]+$/.test(form.occupationCode.trim())
})
const saveBasicInfo = () => {
  const job = selectedJob.value
  if (!job || !basicInfoFormReady.value) return

  const form = basicInfoForm.value
  jobBasicOverrides.value = {
    ...jobBasicOverrides.value,
    [job.id]: {
      name: form.name.trim(),
      occupation: form.occupation.trim(),
      occupationCode: form.occupationCode.trim(),
      level: form.level.trim(),
      chainIndustry: form.chainIndustry.trim(),
      relatedCompanies: form.relatedCompanies.trim(),
      groupName: form.groupName.trim(),
      salaryRange: form.salaryRange.trim(),
      demandLevel: form.demandLevel.trim(),
      demandVolume: form.demandVolume.trim(),
      education: form.education.trim(),
      experience: form.experience.trim(),
      careerPath: form.careerPath.trim(),
      workSummary: form.workSummary.trim(),
      requirements: form.requirements.trim()
    }
  }
  hoverKey.value = ''
  closeBasicInfoDialog()
}
const importTaskTemplate = () => {
  taskForm.value = {
    name: '模型推理性能优化',
    description: '基于业务并发量和响应时延要求，完成模型推理服务压测、参数调优与资源配置优化。',
    abilities: ['模型推理流程理解', '性能监控与日志分析', '容器资源配置'].filter((abilityName) =>
      taskAbilityOptions.value.some((ability) => ability.name === abilityName)
    )
  }
}
const taskFormReady = computed(() => taskForm.value.name.trim() !== '' && taskForm.value.description.trim() !== '')
const taskAbilityOptions = computed(() => selectedJobDetail.value.abilities.map((ability) => ({
  name: ability.name,
  category: ability.category
})))
const toggleTaskAbility = (abilityName: string) => {
  const selected = new Set(taskForm.value.abilities)
  if (selected.has(abilityName)) {
    selected.delete(abilityName)
  } else {
    selected.add(abilityName)
  }
  taskForm.value = {
    ...taskForm.value,
    abilities: Array.from(selected)
  }
}
const saveManualTask = () => {
  const jobId = selectedJobId.value
  if (!jobId || !taskFormReady.value) return

  const nextTask: JobTask = {
    name: taskForm.value.name.trim(),
    description: taskForm.value.description.trim(),
    abilities: taskForm.value.abilities.length > 0 ? [...taskForm.value.abilities] : ['待关联能力项']
  }
  const nextTasks = editableJobTasksForId(jobId)
  if (taskDialogMode.value === 'edit' && editingTaskIndex.value !== null) {
    nextTasks.splice(editingTaskIndex.value, 1, nextTask)
  } else {
    nextTasks.push(nextTask)
  }

  editableTasksByJobId.value = { ...editableTasksByJobId.value, [jobId]: nextTasks }
  closeTaskDialog()
}
const deleteJobTask = (index: number) => {
  const jobId = selectedJobId.value
  if (!jobId) return

  const nextTasks = editableJobTasksForId(jobId)
  nextTasks.splice(index, 1)
  editableTasksByJobId.value = { ...editableTasksByJobId.value, [jobId]: nextTasks }
  if (activeMapTaskIndex.value >= nextTasks.length) {
    activeMapTaskIndex.value = Math.max(0, nextTasks.length - 1)
  }
}
const importTemplateJobs = () => {
  templateJobsImported.value = true
  removedJobIds.value = []
  manualJobCourseIds.value = {}
  editableTasksByJobId.value = {}
  editableAbilitiesByJobId.value = {}
  selectedCandidateIds.value = []
  selectedJobId.value = ''
  activeDetailTab.value = 'basic'
  addJobDialogOpen.value = false
  closeCourseDialog()
}
const removeJobFromBuild = (jobId: string) => {
  addedJobCards.value = addedJobCards.value.filter((job) => job.id !== jobId)
  if (templateJobsImported.value && JOB_CARDS.some((job) => job.id === jobId)) {
    removedJobIds.value = Array.from(new Set([...removedJobIds.value, jobId]))
  }
  const { [jobId]: _removed, ...restCourseRelations } = manualJobCourseIds.value
  manualJobCourseIds.value = restCourseRelations
  const { [jobId]: _removedTasks, ...restEditableTasks } = editableTasksByJobId.value
  editableTasksByJobId.value = restEditableTasks
  const { [jobId]: _removedAbilities, ...restAbilities } = editableAbilitiesByJobId.value
  editableAbilitiesByJobId.value = restAbilities
  const { [jobId]: _removedBasicInfo, ...restBasicInfo } = jobBasicOverrides.value
  jobBasicOverrides.value = restBasicInfo
  hoverKey.value = ''
  if (selectedJobId.value === jobId) {
    selectedJobId.value = ''
    activeDetailTab.value = 'basic'
    closeBasicInfoDialog()
    closeTaskDialog()
    closeCourseDialog()
  }
}
const toggleSelectedJobCourse = (courseId: string) => {
  const job = selectedJob.value
  if (!job) return

  const next = new Set(courseIdsForJob(job.id))
  if (next.has(courseId)) {
    next.delete(courseId)
  } else {
    next.add(courseId)
  }
  manualJobCourseIds.value = {
    ...manualJobCourseIds.value,
    [job.id]: Array.from(next)
  }
  hoverKey.value = ''
}
const addSelectedJobCourse = (courseId: string) => {
  const job = selectedJob.value
  if (!job || selectedJobCourseIds.value.includes(courseId)) return

  manualJobCourseIds.value = {
    ...manualJobCourseIds.value,
    [job.id]: [...courseIdsForJob(job.id), courseId]
  }
  hoverKey.value = ''
  closeCourseDialog()
}
const removeSelectedJobCourse = (courseId: string) => {
  const job = selectedJob.value
  if (!job) return

  manualJobCourseIds.value = {
    ...manualJobCourseIds.value,
    [job.id]: courseIdsForJob(job.id).filter((id) => id !== courseId)
  }
  hoverKey.value = ''
}
const isCandidateSelected = (candidateId: string) => selectedCandidateIds.value.includes(candidateId)
const toggleCandidate = (candidate: ResearchJobCandidate) => {
  if (existingJobIds.value.has(candidate.id)) return
  selectedCandidateIds.value = isCandidateSelected(candidate.id)
    ? selectedCandidateIds.value.filter((id) => id !== candidate.id)
    : [...selectedCandidateIds.value, candidate.id]
}
const addSelectedJobs = () => {
  const candidates = RESEARCH_JOB_CANDIDATES.filter(
    (candidate) => selectedCandidateIds.value.includes(candidate.id) && !existingJobIds.value.has(candidate.id)
  )
  if (candidates.length === 0) return

  addedJobCards.value = [
    ...addedJobCards.value,
    ...candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      groupId: `research-${candidate.industryNodeId}`,
      groupName: candidate.groupName,
      occupation: candidate.occupation,
      occupationCode: candidate.occupationCode,
      taskCount: candidate.taskCount,
      abilityCount: candidate.abilityCount,
      industryNodeId: candidate.industryNodeId
    }))
  ]
  selectedCandidateIds.value = []
  addJobDialogOpen.value = false
}

const detailTabs = [
  { key: 'basic', label: '基本信息' },
  { key: 'tasks', label: '典型工作任务' },
  { key: 'abilities', label: '岗位能力项' },
  { key: 'map', label: '岗位能力图谱' }
]

const updateAbilityLines = async () => {
  await nextTick()
  const root = abilityMapGraphRef.value
  if (!root || activeDetailTab.value !== 'map') {
    abilityLinePaths.value = []
    return
  }

  const rootRect = root.getBoundingClientRect()
  const taskElement = root.querySelector<HTMLElement>(
    `[data-map-task-index="${activeMapTaskIndex.value}"]`
  )

  if (!taskElement || rootRect.width === 0 || rootRect.height === 0) {
    abilityLinePaths.value = []
    return
  }

  const taskRect = taskElement.getBoundingClientRect()
  const fromX = taskRect.right - rootRect.left
  const fromY = taskRect.top + taskRect.height / 2 - rootRect.top
  const abilityElements = Array.from(root.querySelectorAll<HTMLElement>('[data-map-ability]'))
  const activeNames = activeAbilityNames.value

  abilityMapBox.value = {
    width: rootRect.width,
    height: rootRect.height
  }
  abilityLinePaths.value = abilityElements
    .filter((element) => activeNames.has(element.dataset.mapAbility ?? ''))
    .map((element) => {
      const rect = element.getBoundingClientRect()
      const toX = rect.left - rootRect.left
      const toY = rect.top + rect.height / 2 - rootRect.top
      const midX = (fromX + toX) / 2
      return {
        key: `${activeMapTaskIndex.value}-${element.dataset.mapAbility}`,
        d: `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`
      }
    })
}

watch([activeDetailTab, activeMapTaskIndex, selectedJobId], updateAbilityLines, { flush: 'post' })
watch(
  [graphLayout, resultsPortalGraphLayout, currentModule, currentJobSection, selectedJobId, activeResultsPortalTab, selectedGraphJobId],
  updateGraphLines,
  { flush: 'post' }
)
watch([selectedGraphJobId, activeGraphTaskIndex], updateGraphAbilityLines, { flush: 'post' })
watch([portraitCompetencyMapJobId, activePortraitCompetencyTaskIndex], updatePortraitCompetencyLines, { flush: 'post' })
watch(
  [currentModule, activeDecisionGroup, activeDecisionPage, activeDecisionPlanModeTab, activeDecisionPlanTab, activeDecisionCourseTab, decisionImprovementState, decisionPlanStatus, decisionCourseStatus],
  () => {
    persistDecisionState()
  }
)
watch(filteredCourseJobAbilityOptions, (options) => {
  if (!courseAbilityDialogOpen.value) return
  const hasSelectedJob = options.some((option) => option.id === selectedCourseAbilityJobId.value)
  if (hasSelectedJob) return
  if (options.length === 0) {
    selectedCourseAbilityJobId.value = ''
    courseAbilityDraft.value = createEmptyCourseAbilityMap()
    return
  }
  pickCourseAbilityJob(options[0].id)
})

onMounted(() => {
  setPortraitCompetencyBodyMode(isJobCompetencyMapView)
  window.addEventListener('resize', updateAbilityLines)
  window.addEventListener('resize', updateGraphLines)
  window.addEventListener('resize', updateGraphAbilityLines)
  window.addEventListener('resize', updatePortraitCompetencyLines)
  updateAbilityLines()
  updateGraphLines()
  updateGraphAbilityLines()
  updatePortraitCompetencyLines()
})

onBeforeUnmount(() => {
  setPortraitCompetencyBodyMode(false)
  clearCompareLoadingTimer()
  clearDecisionPlanTimer()
  clearDecisionCourseTimer()
  window.removeEventListener('resize', updateAbilityLines)
  window.removeEventListener('resize', updateGraphLines)
  window.removeEventListener('resize', updateGraphAbilityLines)
  window.removeEventListener('resize', updatePortraitCompetencyLines)
})
</script>

<template>
  <main v-if="isResultsPortal" class="results-portal-shell">
    <header class="results-portal-topbar">
      <div class="results-logo-card">
        <img src="/xuetang-online-logo.svg" alt="学堂在线">
      </div>
      <nav class="results-portal-nav" aria-label="成果页导航">
        <button
          v-for="item in resultsPortalNav"
          :key="item.label"
          class="results-nav-item"
          :class="{ active: activeResultsPortalTab === item.label }"
          type="button"
          @click="activeResultsPortalTab = item.label"
        >
          {{ item.label }}
        </button>
      </nav>
      <div class="results-user">
        <div class="avatar small-avatar">
          <span></span>
        </div>
        <strong>Tre_Liu</strong>
        <button type="button" aria-label="退出成果页">↪</button>
      </div>
    </header>

    <section v-if="activeResultsPortalTab === '首页'" class="results-hero">
      <h1>智能建造工程专业</h1>
      <div class="results-summary-card">
        <p>
          智能建造工程专业面向建筑业数字化转型与绿色低碳建造需求，聚焦BIM协同设计、智慧工地管理、装配式建造、智能检测监测与建筑机器人应用等核心方向，培养具备工程识图、数字建模、施工组织、智能装备应用和项目协同管理能力的高素质技术技能人才。
        </p>
        <div class="results-metric-grid">
          <article v-for="item in resultsPortalHeroMetrics" :key="item.label">
            <span>{{ item.icon }}</span>
            <strong>{{ item.value }}</strong>
            <em>{{ item.label }}</em>
          </article>
        </div>
      </div>
    </section>

    <section
      v-else-if="activeResultsPortalTab === '岗位中心'"
      class="results-job-center"
      aria-labelledby="results-job-title"
    >
      <div class="results-section-head">
        <span>岗位中心</span>
        <h2 id="results-job-title">岗位建设成果</h2>
      </div>

      <section class="results-job-card-switcher" aria-label="关联岗位卡片">
        <div class="results-job-card-toolbar">
          <div>
            <span>关联岗位卡片</span>
            <h3>该专业下的关联岗位</h3>
          </div>
          <div class="results-job-card-controls">
            <button
              type="button"
              class="results-carousel-button"
              aria-label="查看上一个关联岗位"
              @click="showResultsPortalJobCard(activeResultsPortalJobCardIndex - 1)"
            >
              ‹
            </button>
            <strong>{{ activeResultsPortalJobCardIndex + 1 }} / {{ resultsPortalJobCards.length }}</strong>
            <button
              type="button"
              class="results-carousel-button"
              aria-label="查看下一个关联岗位"
              @click="showResultsPortalJobCard(activeResultsPortalJobCardIndex + 1)"
            >
              ›
            </button>
          </div>
        </div>

        <div class="results-job-card-window">
          <div
            class="results-job-card-track"
            :style="{ transform: `translateX(-${activeResultsPortalJobCardIndex * 100}%)` }"
          >
            <article
              v-for="card in resultsPortalJobCards"
              :key="card.id"
              class="results-job-linked-card"
              :class="{ active: activeResultsPortalJobCard?.id === card.id }"
              :aria-hidden="activeResultsPortalJobCard?.id !== card.id"
            >
              <div class="results-linked-card-main">
                <span>岗位群 · {{ card.groupName }}</span>
                <h3>{{ card.name }}</h3>
                <p>{{ card.summary }}</p>
                <div class="results-linked-card-tags">
                  <span>产业链：{{ card.chainName }}</span>
                  <span>产业节点：{{ card.industryName }}</span>
                  <span>{{ card.occupation }}</span>
                </div>
              </div>
              <div class="results-linked-card-side">
                <dl>
                  <div>
                    <dt>典型任务</dt>
                    <dd>{{ card.taskCount }}<em>项</em></dd>
                  </div>
                  <div>
                    <dt>能力项</dt>
                    <dd>{{ card.abilityCount }}<em>项</em></dd>
                  </div>
                  <div>
                    <dt>关联课程</dt>
                    <dd>{{ card.courseCount }}<em>门</em></dd>
                  </div>
                  <div>
                    <dt>岗课匹配</dt>
                    <dd>{{ card.matchRate }}<em>%</em></dd>
                  </div>
                </dl>
                <p>{{ card.salaryRange }} · {{ card.education }}</p>
                <button type="button" @click="openGraphAbility(card.id, true)">查看岗位能力图谱</button>
              </div>
            </article>
          </div>
        </div>

        <div class="results-job-card-dots" aria-label="岗位卡片切换">
          <button
            v-for="(card, index) in resultsPortalJobCards"
            :key="card.id"
            type="button"
            :class="{ active: activeResultsPortalJobCardIndex === index }"
            :aria-label="`查看${card.name}`"
            @click="showResultsPortalJobCard(index)"
          />
        </div>
      </section>

      <div class="results-job-insights results-job-insight-strip">
        <div v-for="item in resultsPortalInsights" :key="item.label" class="results-job-insight-item">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <p>{{ item.detail }}</p>
        </div>
      </div>

      <div class="results-job-kpis">
        <article
          v-for="item in resultsPortalKpis"
          :key="item.label"
          :class="{ featured: item.featured }"
        >
          <span>{{ item.icon }}</span>
          <strong>{{ item.value }}<em>{{ item.unit }}</em></strong>
          <p>{{ item.label }}</p>
        </article>
      </div>

      <div class="results-job-path results-job-path-text" aria-label="岗位建设路径">
        <strong>岗位建设路径</strong>
        <ol>
          <li v-for="item in resultsPortalPath" :key="item.step">
            <span>{{ item.step }}</span>
            <h3>{{ item.label }}</h3>
            <p>{{ item.detail }}</p>
          </li>
        </ol>
      </div>

      <section ref="resultsPortalGraphRef" class="results-portal-graph">
        <div class="results-section-head compact" :class="{ 'graph-ability-title-row': selectedGraphJobId }">
          <template v-if="selectedGraphJobId">
            <button
              type="button"
              class="graph-back-button"
              @click="closeGraphAbility"
            >
              返回产业图谱
            </button>
            <h3>{{ selectedGraphAbilityTitle }}</h3>
          </template>
          <template v-else>
            <span>岗位产业图谱</span>
            <h3>产业链 - 产业节点 - 岗位 - 课程图谱</h3>
          </template>
        </div>
        <Transition name="graph-mode" mode="out-in" @after-enter="refreshGraphModeLines">
          <div v-if="selectedGraphJobId" :key="graphModeKey" class="graph-mode-panel">
            <div class="graph-ability-headings">
              <div>产业信息</div>
              <div>岗位</div>
              <div>典型工作任务</div>
              <div>能力项</div>
            </div>

            <div class="graph-ability-view">
              <div class="graph-ability-summary graph-ability-industry-node">
                <span>产业信息</span>
                <strong>{{ selectedGraphChain?.name ?? '智能建造产业链' }}</strong>
                <p>{{ selectedGraphIndustry?.name ?? 'BIM协同设计与算量平台' }}</p>
                <div>
                  <em>{{ selectedGraphIndustryJobs.length }} 个相关岗位</em>
                  <em>{{ selectedGraphIndustryCourseCount }} 门关联课程</em>
                </div>
              </div>

              <div ref="resultsGraphAbilityMapRef" class="graph-ability-map">
                <svg
                  class="graph-ability-lines"
                  :viewBox="`0 0 ${resultsGraphAbilityMapBox.width} ${resultsGraphAbilityMapBox.height}`"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    v-for="link in resultsGraphAbilityLinePaths"
                    :key="link.key"
                    :d="link.d"
                    class="graph-ability-link active"
                  />
                </svg>

                <div class="graph-ability-job-node">
                  <span>岗位</span>
                  <strong>{{ selectedGraphJob?.name ?? '岗位' }}</strong>
                  <p>{{ selectedGraphJobDetail.salaryRange }} · {{ selectedGraphJobDetail.education }}</p>
                </div>

                <div class="graph-ability-tasks">
                  <button
                    v-for="(task, index) in selectedGraphJobTasks"
                    :key="`${task.name}-${index}`"
                    type="button"
                    :data-graph-map-task-index="index"
                    :class="{ active: activeGraphTaskIndex === index }"
                    @click="selectGraphAbilityTask(index)"
                  >
                    <span>任务 {{ index + 1 }}</span>
                    <strong>{{ task.name }}</strong>
                  </button>
                </div>

                <div class="graph-ability-columns">
                  <section v-for="group in graphAbilityGroups" :key="group.category">
                    <h4>{{ group.category }}</h4>
                    <p
                      v-for="ability in group.abilities"
                      :key="ability.name"
                      :data-graph-map-ability="ability.name"
                      :class="{
                        active: activeGraphAbilityNames.has(ability.name),
                        dimmed: !activeGraphAbilityNames.has(ability.name)
                      }"
                    >
                      {{ ability.name }}
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
          <div v-else :key="graphModeKey" class="graph-mode-panel">
            <div class="graph-headings">
              <div>
                <span>产业链</span>
                <strong>{{ INDUSTRY_CHAINS.length }}</strong>
              </div>
              <div>
                <span>产业节点</span>
                <strong>{{ INDUSTRY_NODES.length }}</strong>
              </div>
              <div>
                <span>岗位群 / 岗位</span>
                <strong>{{ resultsPortalGraphLayout.jobGroups.length }} / {{ JOB_CARDS.length }}</strong>
              </div>
              <div>
                <span>课程</span>
                <strong>{{ resultsPortalGraphLayout.courses.length }}</strong>
              </div>
            </div>
            <div class="graph-canvas" ref="resultsGraphCanvasRef" :style="{ height: `${resultsPortalGraphLayout.canvasHeight}px` }">
              <svg class="graph-lines" :viewBox="resultsPortalGraphLineViewBox" preserveAspectRatio="none" aria-hidden="true">
                <path
                  v-for="link in resultsPortalGraphMeasuredLinks"
                  :key="link.key"
                  :d="link.d"
                  class="graph-link"
                  :class="{
                    active: hoverKey !== '' && activeGraphLinkKeys.has(link.key),
                    dimmed: hoverKey !== '' && !activeGraphLinkKeys.has(link.key)
                  }"
                />
              </svg>

          <button
            v-for="chain in resultsPortalGraphLayout.chains"
            :key="chain.key"
            class="graph-entity chain-node"
            :class="{ active: isGraphActive(chain.key), dimmed: isGraphDimmed(chain.key) }"
            :style="graphNodeStyle(graphColumns.chain.left, graphColumns.chain.width, chain.top)"
            :data-graph-key="chain.key"
            @mouseenter="hoverKey = chain.key"
            @mouseleave="hoverKey = ''"
            @focus="hoverKey = chain.key"
            @blur="hoverKey = ''"
          >
            <span>{{ chain.name }}</span>
          </button>

          <button
            v-for="industry in resultsPortalGraphLayout.industries"
            :key="industry.key"
            class="graph-entity industry-node"
            :class="{ active: isGraphActive(industry.key), dimmed: isGraphDimmed(industry.key) }"
            :style="graphNodeStyle(graphColumns.industry.left, graphColumns.industry.width, industry.top)"
            :data-graph-key="industry.key"
            @mouseenter="hoverKey = industry.key"
            @mouseleave="hoverKey = ''"
            @focus="hoverKey = industry.key"
            @blur="hoverKey = ''"
          >
            <span>{{ industry.name }}</span>
          </button>

          <div class="graph-job-groups">
            <div
              v-for="group in resultsPortalGraphLayout.jobGroups"
              :key="group.key"
              :class="['graph-job-group', `group-accent-${group.tone}`]"
              :style="graphGroupStyle(graphColumns.job.left, graphColumns.job.width, group.top, group.height)"
            >
              <div class="graph-job-group-header">
                <span class="graph-job-group-title">{{ group.name }}</span>
                <em>{{ group.count }}个岗位</em>
              </div>
              <div class="graph-job-group-jobs">
                <button
                  v-for="job in group.jobs"
                  :key="job.key"
                  class="graph-entity job-node graph-group-job"
                  :class="{ active: isGraphActive(job.key), dimmed: isGraphDimmed(job.key) }"
                  :data-graph-key="job.key"
                  :data-graph-job="job.id"
                  @mouseenter="hoverKey = job.key"
                  @mouseleave="hoverKey = ''"
                  @focus="hoverKey = job.key"
                  @blur="hoverKey = ''"
                  @click.stop="openGraphAbility(job.id)"
                >
                  <span>{{ job.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            v-for="course in resultsPortalGraphLayout.courses"
            :key="course.key"
            class="graph-entity course-node"
            :class="{ active: isGraphActive(course.key), dimmed: isGraphDimmed(course.key) }"
            :style="graphNodeStyle(graphColumns.course.left, graphColumns.course.width, course.top)"
            :data-graph-key="course.key"
            @mouseenter="hoverKey = course.key"
            @mouseleave="hoverKey = ''"
            @focus="hoverKey = course.key"
            @blur="hoverKey = ''"
          >
            <span>{{ course.name }}</span>
          </button>
            </div>
          </div>
        </Transition>
      </section>
    </section>

    <section v-else class="results-empty-panel">
      <span>{{ activeResultsPortalTab }}</span>
      <h2>{{ activeResultsPortalTab }}</h2>
    </section>
  </main>

  <main v-else-if="isJobCompetencyMapView" class="competency-map-page-shell">
    <header class="competency-map-page-header">
      <button type="button" class="competency-map-back-button" @click="closePortraitCompetencyMapView">
        ‹ 返回
      </button>
      <div class="competency-map-page-title">
        <span>{{ portraitCompetencyJobDetail.name }}</span>
        <h1>岗位能力图谱</h1>
      </div>
    </header>

    <div class="competency-map-page-layout">
      <section class="competency-map-main-panel">
        <article class="competency-map-job-hero">
          <div class="competency-map-job-card">
            <h2>{{ portraitCompetencyJobDetail.name }}</h2>
            <div class="competency-map-salary-row">
              <strong>{{ portraitCompetencyJobDetail.salary }}</strong>
              <span>{{ portraitCompetencyJobDetail.salaryUnit }}</span>
            </div>
            <div class="competency-map-meta-row">
              <span>{{ portraitCompetencyJobDetail.education }}</span>
              <span>{{ portraitCompetencyJobDetail.experience }}</span>
              <span>{{ portraitCompetencyJobDetail.careerPath }}</span>
            </div>
            <div class="competency-map-tag-row">
              <span>{{ portraitCompetencyJobDetail.node }}</span>
              <span>{{ portraitCompetencyJobDetail.level }}</span>
              <span>需求量 {{ portraitCompetencyJobDetail.demand }}</span>
            </div>
          </div>
        </article>

        <section ref="portraitCompetencyMapRef" class="competency-map-board">
          <svg
            class="competency-map-lines"
            :viewBox="`0 0 ${portraitCompetencyMapBox.width} ${portraitCompetencyMapBox.height}`"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              v-for="link in portraitCompetencyLinePaths"
              :key="link.key"
              :d="link.d"
              class="competency-map-link"
            />
          </svg>

          <div class="competency-task-row">
            <button
              v-for="(task, index) in portraitCompetencyTasks"
              :key="`${task.name}-${index}`"
              type="button"
              class="competency-task-card"
              :class="{ active: activePortraitCompetencyTaskIndex === index, dimmed: activePortraitCompetencyTaskIndex !== index }"
              :data-portrait-competency-task-index="index"
              @click="selectPortraitCompetencyTask(index)"
            >
              <span>任务 {{ index + 1 }}</span>
              <strong>{{ task.name }}</strong>
            </button>
          </div>

          <div class="competency-ability-grid">
            <article
              v-for="node in portraitCompetencyNodes"
              :key="node.name"
              class="competency-ability-card"
              :class="[
                `tone-${node.tone}`,
                {
                  active: portraitCompetencyActiveAbilityNames.has(node.name),
                  dimmed: !portraitCompetencyActiveAbilityNames.has(node.name)
                }
              ]"
              :data-portrait-competency-ability="node.name"
            >
              <div class="competency-ability-marker">{{ node.marker }}</div>
              <strong>{{ node.name }}</strong>
            </article>
          </div>
        </section>
      </section>

      <aside class="competency-map-sidebar">
        <section class="competency-side-card">
          <div class="competency-side-head">
            <h3>统计概览</h3>
          </div>
          <div class="competency-stat-grid">
            <article>
              <strong>{{ portraitCompetencyTasks.length }}</strong>
              <span>典型工作任务</span>
            </article>
            <article>
              <strong>{{ portraitCompetencyNodes.length }}</strong>
              <span>能力项总数</span>
            </article>
          </div>
          <div class="competency-legend-list">
            <p
              v-for="item in portraitCompetencyCategoryStats"
              :key="item.category"
              :class="`tone-${item.tone}`"
            >
              <span></span>{{ item.category }} {{ item.total }}
            </p>
          </div>
        </section>

        <section class="competency-side-card">
          <div class="competency-side-head">
            <h3>任务详情</h3>
          </div>
          <div class="competency-task-detail">
            <span>任务描述</span>
            <p>{{ activePortraitCompetencyTask?.description }}</p>
            <strong>关联能力项（{{ portraitCompetencySidebarItems.length }}）</strong>
            <div class="competency-related-list">
              <article
                v-for="item in portraitCompetencySidebarItems"
                :key="`${activePortraitCompetencyTask?.name}-${item.name}`"
              >
                <em :class="`tone-${item.tone}`">{{ item.category }}</em>
                <span>{{ item.name }}</span>
              </article>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </main>

  <main v-else class="app-shell">
    <aside class="dock">
      <div class="avatar">
        <span></span>
      </div>
      <div class="dock-spacer"></div>
      <button class="orb" aria-label="AI assistant">
        <span class="new-badge">NEW</span>
      </button>
      <button class="dock-icon" aria-label="download">⇩</button>
      <button class="dock-icon small" aria-label="new">▣</button>
      <div class="old-link">返回旧版</div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="brand">
          <span class="ai-mark">AI</span>
          <strong>{{ courseModelOpen ? courseModelTitle : '人工智能专业' }}</strong>
        </div>

        <nav v-if="courseModelOpen" class="module-nav course-top-nav" aria-label="课程导航">
          <button
            v-for="item in courseTopModules"
            :key="item.label"
            class="module-tab"
            :class="{ active: item.active, outline: item.outline, utility: item.label === '成员' }"
            type="button"
            @click="handleCourseTopNavClick(item.label)"
          >
            <span class="tab-icon">{{ item.icon }}</span>
            {{ item.label }}
          </button>
        </nav>

        <nav v-else class="module-nav" aria-label="主导航">
          <template v-for="item in topModules" :key="item.label">
            <div
              v-if="item.label === '建设成果展示'"
              class="module-tab-menu"
            >
              <button
                class="module-tab outline"
                type="button"
                @click="selectModule(item.label)"
              >
                <span class="tab-icon">{{ item.icon }}</span>
                {{ item.label }}
              </button>
              <div class="results-menu-popover" role="menu">
                <button
                  v-for="action in resultsMenuActions"
                  :key="action.label"
                  type="button"
                  role="menuitem"
                  @click="action.primary ? openResultsPortal() : undefined"
                >
                  <span>{{ action.icon }}</span>
                  {{ action.label }}
                </button>
              </div>
            </div>
            <button
              v-else
              class="module-tab"
              :class="{ active: currentModule === item.label, utility: item.label === '成员' }"
              type="button"
              @click="selectModule(item.label)"
            >
              <span class="tab-icon">{{ item.icon }}</span>
              {{ item.label }}
            </button>
          </template>
        </nav>
      </header>

      <div
        class="content-area"
        :class="{
          'job-content-area': currentModule === '岗位中心',
          'engine-content-area': currentModule === '专业引擎',
          'decision-content-area': currentModule === '决策中心',
          'course-model-content-area': courseModelOpen
        }"
      >
        <template v-if="courseModelOpen">
          <aside class="course-model-sidebar">
            <button class="course-sidebar-collapse" type="button" aria-label="收起侧边栏">‹</button>
            <template v-for="group in courseModelMenuGroups" :key="group.title">
              <div class="course-menu-group-title">{{ group.title }}</div>
              <button
                v-for="item in group.items"
                :key="`${group.title}-${item.label}`"
                class="course-menu-item"
                :class="{ active: item.active }"
                type="button"
              >
                <span>{{ item.icon }}</span>
                <strong>{{ item.label }}</strong>
                <em>{{ item.desc }}</em>
              </button>
            </template>
            <div class="course-sidebar-bottom">
              <button class="course-open-button" type="button">◎ 开放图谱到班级</button>
              <a>管理资源</a>
            </div>
          </aside>

          <section
            class="course-model-board"
            :class="{ editing: courseGraphEditing }"
            @click="closeCourseNodeMenu"
          >
            <aside class="course-knowledge-card">
              <h3>知识点总量（条）</h3>
              <strong>210</strong>
              <label>
                <span>⌕</span>
                <input placeholder="搜索" readonly>
              </label>
              <div class="course-level-list">
                <p
                  v-for="level in courseKnowledgeLevels"
                  :key="level.label"
                  :class="`tone-${level.tone}`"
                >
                  <span></span>
                  {{ level.label }}({{ level.count }})
                </p>
              </div>
              <div class="course-relation-legend">
                <p><i></i>先后修</p>
                <p><i class="dashed"></i>相关</p>
                <p><span class="orange-dot"></span>关联学习内容(0个)</p>
                <p><span class="yellow-dot"></span>关联习题(0个)</p>
              </div>
              <footer>
                <button type="button">☰ 目录</button>
                <button type="button">⇩ 下载</button>
              </footer>
            </aside>

            <section class="course-graph-stage" aria-label="知识图谱框架">
              <div class="course-graph-toolbar">
                <button v-if="courseGraphEditing" class="course-setting-button" type="button">✣ 图谱设置</button>
                <button type="button">⌘⌄</button>
                <button type="button">✣⌄</button>
                <button
                  class="course-edit-button"
                  :class="{ active: courseGraphEditing }"
                  type="button"
                  @click.stop="toggleCourseGraphEdit"
                >
                  {{ courseGraphEditing ? '× 退出编辑' : '✎ 编辑' }}
                </button>
              </div>
              <div class="course-orbit-bg"></div>
              <svg class="course-graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M50 52 C47 42, 45 34, 45 29"></path>
                <path d="M50 52 C51 46, 52 42, 52 39"></path>
                <path d="M50 52 C59 45, 66 39, 70 35"></path>
                <path d="M50 52 C59 53, 69 54, 74 55"></path>
                <path d="M50 52 C54 60, 56 66, 56 70"></path>
                <path d="M50 52 C46 60, 43 65, 41 68"></path>
                <path d="M50 52 C42 50, 34 49, 30 48"></path>
                <path d="M45 29 C44 22, 43 17, 42 13"></path>
                <path d="M45 29 C48 22, 50 16, 51 12"></path>
                <path d="M70 35 C76 31, 80 28, 83 26"></path>
                <path d="M74 55 C80 54, 85 53, 88 52"></path>
                <path d="M74 55 C78 60, 81 65, 82 68"></path>
                <path d="M56 70 C61 73, 64 76, 66 78"></path>
                <path d="M41 68 C39 73, 37 76, 35 78"></path>
                <path d="M30 48 C26 51, 23 53, 20 55"></path>
                <path d="M30 48 C29 39, 28 32, 28 28"></path>
              </svg>
              <button
                v-for="node in courseKnowledgeNodes"
                :key="node.label"
                class="course-graph-node"
                :class="[node.level, { selected: courseNodeMenu.label === node.label.replace(/\n/g, '') }]"
                :style="{ left: `${node.x}%`, top: `${node.y}%` }"
                type="button"
                @click="openCourseNodeMenu(node, $event)"
              >
                <span v-if="node.count">{{ node.count }}</span>
                <strong>{{ node.label }}</strong>
              </button>
              <div
                v-if="courseGraphEditing && courseNodeMenu.open"
                class="course-node-context-menu"
                :style="{ left: `calc(${courseNodeMenu.left}% + 34px)`, top: `calc(${courseNodeMenu.top}% - 10px)` }"
                @click.stop
              >
                <button type="button" @click="openCourseKnowledgeDrawer">▤ 查看详情</button>
                <button type="button">⌘ 查看节点关系</button>
                <button type="button">↗ 展开节点</button>
                <button type="button">⌫ 删除节点</button>
              </div>
              <div v-if="courseGraphEditing" class="course-edit-rail" aria-label="图谱编辑工具">
                <span class="mini-avatar"></span>
                <button type="button">⌘</button>
                <button type="button">⌬</button>
                <button type="button">⌁</button>
                <button type="button">⌗</button>
                <button type="button">↶</button>
                <button type="button">⌫</button>
              </div>
              <div class="course-zoom-control">
                <button type="button">⌖</button>
                <button type="button">−</button>
                <div><span></span></div>
                <button type="button">＋</button>
                <strong>100%</strong>
              </div>
            </section>
            <div
              v-if="courseKnowledgeDrawerOpen"
              class="course-drawer-backdrop"
              @click="closeCourseKnowledgeDrawer"
            ></div>
            <aside
              v-if="courseKnowledgeDrawerOpen"
              class="course-detail-drawer"
              @click.stop
            >
              <header class="course-detail-tabs">
                <div class="course-detail-tab-strip">
                  <button
                    v-for="tab in courseDetailTabs"
                    :key="tab"
                    :class="{ active: courseDetailActiveTab === tab }"
                    type="button"
                    @click="courseDetailActiveTab = tab"
                  >
                    {{ tab }}
                  </button>
                </div>
                <div class="course-detail-tab-meta">
                  <span class="drawer-save-time">{{ courseDetailLastSavedAt }} 已保存</span>
                  <button class="drawer-icon-button" type="button" aria-label="知识点状态">◎</button>
                  <button class="drawer-close" type="button" @click="closeCourseKnowledgeDrawer">×</button>
                </div>
              </header>
              <section class="course-detail-body">
                <template v-if="courseDetailActiveTab === '岗位能力'">
                  <h3>岗位能力关联</h3>
                  <p class="drawer-helper">可将岗位能力按岗位与知识、技能、素养进行关联，支撑课程知识点与岗位要求对齐。</p>
                  <div v-if="selectedCourseNodeAbilityRelations.length === 0" class="course-job-ability-empty">
                    <p>当前知识点暂未关联岗位能力</p>
                    <button class="primary-action compact" type="button" @click="openCourseAbilityDialog">关联岗位能力</button>
                  </div>
                  <template v-else>
                    <div class="course-job-ability-actions">
                      <p>已关联 {{ selectedCourseNodeAbilityCount }} 项岗位能力</p>
                      <button class="secondary-action" type="button" @click="openCourseAbilityDialog">＋ 继续关联</button>
                    </div>
                    <article
                      v-for="relation in selectedCourseNodeAbilityRelations"
                      :key="relation.jobId"
                      class="course-job-ability-relation"
                    >
                      <header>
                        <div>
                          <h4>{{ relation.jobName }}</h4>
                          <p>{{ relation.chain }} / {{ relation.node }}</p>
                        </div>
                        <button type="button" @click="removeCourseAbilityRelation(relation.jobId)">解除关联</button>
                      </header>
                      <div class="course-job-ability-category-grid">
                        <section v-for="category in courseAbilityCategories" :key="category">
                          <h5>
                            {{ category }}
                            <em>{{ relation.abilities[category].length }}</em>
                          </h5>
                          <div v-if="relation.abilities[category].length > 0" class="course-ability-tags">
                            <button
                              v-for="ability in relation.abilities[category]"
                              :key="ability"
                              type="button"
                              @click="removeCourseAbilityItem(relation.jobId, category, ability)"
                            >
                              {{ ability }}
                              <span>×</span>
                            </button>
                          </div>
                          <p v-else class="course-job-ability-empty-mini">暂无已选能力</p>
                        </section>
                      </div>
                    </article>
                  </template>
                </template>
                <template v-else-if="courseDetailActiveTab === '学习内容'">
                  <h3>学习内容</h3>
                  <p class="drawer-helper">暂以框架占位，后续可关联教材章节、微课资源和学习活动。</p>
                </template>
                <template v-else-if="courseDetailActiveTab === '知识点关系'">
                  <h3>知识点关系</h3>
                  <p class="drawer-helper">展示先后修、相关、包含等知识点关系。</p>
                </template>
                <template v-else-if="courseDetailActiveTab === '习题'">
                  <h3>习题</h3>
                  <p class="drawer-helper">展示与该知识点关联的练习题、测验题和考核任务。</p>
                </template>
                <template v-else-if="courseDetailActiveTab === '教材'">
                  <h3>教材</h3>
                  <p class="drawer-helper">展示教材、章节与参考资料。</p>
                </template>
                <template v-else>
                  <label class="course-detail-field">
                    <span>* 知识点名称</span>
                    <textarea :value="selectedCourseNodeLabel" readonly></textarea>
                  </label>
                  <label class="course-detail-field">
                    <span>知识点名称（英文）</span>
                    <textarea placeholder="请输入知识点英文名称" readonly></textarea>
                  </label>
                  <label class="course-detail-field large">
                    <span>知识说明</span>
                    <div class="course-editor-panel">
                      <div class="course-editor-tools">▣　⌘　▦　∑　|∑|</div>
                    </div>
                  </label>
                  <label class="course-detail-field">
                    <span>知识点标签</span>
                    <input readonly>
                  </label>
                  <div class="course-tag-panel">
                    <button class="active" type="button">重点</button>
                    <button type="button">难点</button>
                    <button type="button">重难点</button>
                    <button type="button">＋ 新建分类</button>
                  </div>
                </template>
              </section>
              <footer class="course-detail-footer">
                <button class="danger" type="button">删除</button>
                <div>
                  <button type="button" @click="closeCourseKnowledgeDrawer">取消</button>
                  <button class="primary" type="button" @click="saveCourseKnowledgeDrawer">保存</button>
                </div>
              </footer>
            </aside>
          </section>
        </template>

        <template v-else-if="currentModule === '决策中心'">
          <aside class="decision-sidebar">
            <section
              v-for="group in decisionCenterMenuGroups"
              :key="group.key"
              class="decision-side-group"
            >
              <header class="decision-side-group-title">
                <span>{{ group.icon }}</span>
                <strong>{{ group.title }}</strong>
              </header>
              <button
                v-for="item in group.items"
                :key="item.key"
                class="decision-side-item"
                :class="{ active: activeDecisionPage === item.key }"
                type="button"
                @click="selectDecisionPage(group.key, item.key)"
              >
                {{ item.label }}
              </button>
            </section>
          </aside>

          <section class="canvas-card decision-center-card">
            <template v-if="activeDecisionPage === 'overview'">
              <header class="decision-overview-head">
                <div>
                  <span>专业决策中枢</span>
                  <h2>{{ decisionCenterOverview.title }}</h2>
                </div>
                <button class="decision-version-switch" type="button">
                  {{ decisionCenterOverview.version }}
                </button>
              </header>

              <section class="decision-stage-shell">
                <div class="decision-stage-guides">
                  <span v-for="label in decisionCenterOverview.guideLabels" :key="label">{{ label }}</span>
                </div>
                <div class="decision-stage-orbit"></div>
                <div class="decision-stage-cloud">{{ decisionCenterOverview.heroValue }}</div>
                <div class="decision-stage-platform">
                  <article v-for="card in decisionCenterOverview.graduationCards" :key="card.label">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}</strong>
                  </article>
                </div>
                <div class="decision-stage-courses">
                  <span v-for="badge in decisionCenterOverview.courseBadges" :key="badge">{{ badge }}</span>
                </div>
                <div class="decision-stage-resources">
                  <article v-for="card in decisionCenterOverview.resourceCards" :key="card.label">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}</strong>
                  </article>
                </div>
              </section>
            </template>

            <template v-else-if="activeDecisionPage === 'plan-analysis'">
              <section v-if="decisionPlanStatus === 'pending'" class="decision-report decision-report-pending">
                <div class="decision-report-heading">
                  <span>专业建设治理</span>
                  <h2>{{ planAnalysisStates.pending.title }}</h2>
                  <p>{{ activeDecisionPlanPendingMode.summary }}</p>
                </div>
                <nav class="decision-report-tabs compact">
                  <button
                    v-for="tab in planAnalysisStates.pending.modeTabs"
                    :key="tab"
                    :class="{ active: tab === activeDecisionPlanModeTab }"
                    type="button"
                    @click="activeDecisionPlanModeTab = tab"
                  >
                    {{ tab }}
                  </button>
                </nav>
                <article class="decision-score-card decision-summary-card">
                  <span>当前方案</span>
                  <strong>{{ activeDecisionPlanPendingMode.currentPlan.name }}</strong>
                  <p>{{ activeDecisionPlanPendingMode.currentPlan.version }}</p>
                </article>
                <div class="decision-check-list">
                  <article v-for="item in activeDecisionPlanPendingMode.checks" :key="item">{{ item }}</article>
                </div>
                <button class="primary-action" type="button" @click="startDecisionPlanAnalysis">
                  {{ planAnalysisStates.pending.cta }}
                </button>
              </section>

              <section v-else-if="decisionPlanStatus === 'loading'" class="decision-report decision-report-loading">
                <div class="decision-report-heading">
                  <span>专业建设治理</span>
                  <h2>{{ planAnalysisStates.loading.heading }}</h2>
                </div>
                <div class="decision-loading-steps">
                  <article v-for="step in planAnalysisStates.loading.steps" :key="step">{{ step }}</article>
                </div>
              </section>

              <section v-else-if="decisionPlanStatus === 'warning'" class="decision-report decision-report-warning">
                <div class="decision-report-heading">
                  <span>专业建设治理</span>
                  <h2>{{ planAnalysisStates.warning.title }}</h2>
                  <p>{{ planAnalysisStates.warning.summary }}</p>
                </div>
                <div class="decision-check-list">
                  <article v-for="item in planAnalysisStates.warning.alerts" :key="item" class="decision-alert-card">
                    {{ item }}
                  </article>
                </div>
                <div class="decision-warning-actions">
                  <button class="outline-action" type="button" @click="restartDecisionPlanAnalysis">返回校验页</button>
                  <button class="primary-action" type="button" @click="continueDecisionPlanAnalysis">
                    {{ planAnalysisStates.warning.continueAction }}
                  </button>
                </div>
              </section>

              <section v-else class="decision-report decision-report-result">
                <header class="decision-report-toolbar">
                  <button class="outline-action" type="button">{{ planAnalysisStates.result.historyAction }}</button>
                  <button class="outline-action" type="button" @click="restartDecisionPlanAnalysis">重新方案分析</button>
                </header>
                <nav class="decision-report-tabs">
                  <button
                    v-for="tab in planAnalysisStates.result.topTabs"
                    :key="tab"
                    :class="{ active: activeDecisionPlanTab === tab }"
                    type="button"
                    @click="activeDecisionPlanTab = tab"
                  >
                    {{ tab }}
                  </button>
                </nav>
                <div class="decision-result-panel">
                  <article v-for="card in activeDecisionPlanResultPanel.cards" :key="card.label" class="decision-score-card">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}</strong>
                    <p>{{ card.note }}</p>
                  </article>
                </div>
                <div class="decision-check-list decision-insight-grid">
                  <article>
                    <strong>{{ activeDecisionPlanResultPanel.title }}</strong>
                    <p>{{ activeDecisionPlanResultPanel.summary }}</p>
                  </article>
                  <article v-for="item in activeDecisionPlanResultPanel.insights" :key="item">{{ item }}</article>
                </div>
              </section>
            </template>

            <template v-else-if="activeDecisionPage === 'course-diagnosis'">
              <section v-if="decisionCourseStatus === 'pending'" class="decision-report decision-report-pending">
                <div class="decision-report-heading">
                  <span>专业建设治理</span>
                  <h2>{{ courseDiagnosisStates.pending.title }}</h2>
                  <p>{{ activeDecisionCoursePendingPanel.summary }}</p>
                </div>
                <nav class="decision-report-tabs compact">
                  <button
                    v-for="tab in courseDiagnosisStates.pending.modeTabs"
                    :key="tab"
                    :class="{ active: activeDecisionCourseTab === tab }"
                    type="button"
                    @click="activeDecisionCourseTab = tab"
                  >
                    {{ tab }}
                  </button>
                </nav>
                <article class="decision-score-card decision-summary-card">
                  <span>当前方案</span>
                  <strong>{{ activeDecisionCoursePendingPanel.currentPlan.name }}</strong>
                  <p>{{ activeDecisionCoursePendingPanel.currentPlan.version }}</p>
                </article>
                <div class="decision-check-list">
                  <article v-for="item in activeDecisionCoursePendingPanel.checks" :key="item">{{ item }}</article>
                </div>
                <button class="primary-action" type="button" @click="startDecisionCourseAnalysis">
                  {{ courseDiagnosisStates.pending.cta }}
                </button>
              </section>

              <section v-else-if="decisionCourseStatus === 'loading'" class="decision-report decision-report-loading">
                <div class="decision-report-heading">
                  <span>专业建设治理</span>
                  <h2>{{ courseDiagnosisStates.loading.heading }}</h2>
                </div>
                <div class="decision-loading-steps">
                  <article v-for="step in courseDiagnosisStates.loading.steps" :key="step">{{ step }}</article>
                </div>
              </section>

              <section v-else-if="decisionCourseStatus === 'warning'" class="decision-report decision-report-warning">
                <div class="decision-report-heading">
                  <span>专业建设治理</span>
                  <h2>{{ courseDiagnosisStates.warning.title }}</h2>
                  <p>{{ courseDiagnosisStates.warning.summary }}</p>
                </div>
                <div class="decision-check-list">
                  <article v-for="item in courseDiagnosisStates.warning.alerts" :key="item" class="decision-alert-card">
                    {{ item }}
                  </article>
                </div>
                <div class="decision-warning-actions">
                  <button class="outline-action" type="button" @click="restartDecisionCourseAnalysis">返回校验页</button>
                  <button class="primary-action" type="button" @click="continueDecisionCourseAnalysis">
                    {{ courseDiagnosisStates.warning.continueAction }}
                  </button>
                </div>
              </section>

              <section v-else class="decision-report decision-report-result">
                <header class="decision-report-toolbar">
                  <button class="outline-action" type="button">{{ courseDiagnosisStates.result.historyAction }}</button>
                  <button class="outline-action" type="button" @click="restartDecisionCourseAnalysis">
                    {{ courseDiagnosisStates.result.restudyAction }}
                  </button>
                </header>
                <div class="decision-report-heading">
                  <span>专业建设治理</span>
                  <h2>{{ activeDecisionCourseResultPanel.title }}</h2>
                  <p>{{ activeDecisionCourseResultPanel.summary }}</p>
                </div>
                <nav class="decision-report-tabs compact">
                  <button
                    v-for="tab in courseDiagnosisStates.result.topTabs"
                    :key="tab"
                    :class="{ active: activeDecisionCourseTab === tab }"
                    type="button"
                    @click="activeDecisionCourseTab = tab"
                  >
                    {{ tab }}
                  </button>
                </nav>
                <div class="decision-result-panel">
                  <article v-for="card in activeDecisionCourseResultPanel.cards" :key="card.label" class="decision-score-card">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}</strong>
                    <p>{{ card.note }}</p>
                  </article>
                </div>
                <div class="decision-check-list decision-insight-grid">
                  <article v-for="item in activeDecisionCourseResultPanel.insights" :key="item">{{ item }}</article>
                </div>
              </section>
            </template>

            <template v-else-if="activeDecisionPlaceholderPage">
              <section class="decision-placeholder-page">
                <header class="decision-report-heading">
                  <span>决策中心</span>
                  <h2>{{ activeDecisionPlaceholderPage.title }}</h2>
                  <p>{{ activeDecisionPlaceholderPage.summary }}</p>
                </header>
                <div class="decision-result-panel">
                  <article
                    v-for="metric in activeDecisionPlaceholderPage.metrics"
                    :key="metric.label"
                    class="decision-score-card"
                  >
                    <span>{{ metric.label }}</span>
                    <strong>{{ metric.value }}</strong>
                    <p>{{ metric.note }}</p>
                  </article>
                </div>
                <div class="decision-check-list decision-placeholder-grid">
                  <article>
                    <strong>{{ activeDecisionPlaceholderPage.analysisTitle }}</strong>
                    <p v-for="item in activeDecisionPlaceholderPage.analysisPoints" :key="item">{{ item }}</p>
                  </article>
                  <article>
                    <strong>{{ activeDecisionPlaceholderPage.insightTitle }}</strong>
                    <p>{{ activeDecisionPlaceholderPage.insightText }}</p>
                  </article>
                </div>
              </section>
            </template>

            <template v-else-if="activeDecisionPage === 'improvement'">
              <section class="decision-improvement-page">
                <header class="decision-improvement-header">
                  <div>
                    <span>专业质量监控</span>
                    <h2>{{ decisionImprovementPage.headerMeta.title }}</h2>
                    <p>{{ decisionImprovementPage.headerMeta.summary }}</p>
                  </div>
                  <div class="decision-improvement-meta" aria-label="分析辅助信息">
                    <div v-for="item in decisionImprovementPage.headerMeta.meta" :key="item.label">
                      <span>{{ item.label }}</span>
                      <strong>{{ item.value }}</strong>
                    </div>
                  </div>
                </header>

                <nav
                  class="decision-improvement-state-switcher"
                  :aria-label="decisionImprovementPage.stateSwitcher.ariaLabel"
                >
                  <button
                    v-for="option in decisionImprovementPage.stateSwitcher.options"
                    :key="option.value"
                    :aria-pressed="decisionImprovementState === option.value"
                    :class="{ active: decisionImprovementState === option.value }"
                    type="button"
                    @click="decisionImprovementState = option.value"
                  >
                    <strong>{{ option.label }}</strong>
                    <span>{{ option.note }}</span>
                  </button>
                </nav>

                <section v-if="decisionImprovementState === 'default'" class="decision-improvement-default">
                  <section class="decision-improvement-hero">
                    <article
                      v-for="signal in decisionImprovementDefaultState.heroSignals"
                      :key="signal.label"
                      class="decision-improvement-signal"
                    >
                      <span>{{ signal.label }}</span>
                      <strong>{{ signal.value }}</strong>
                      <p>{{ signal.note }}</p>
                    </article>
                  </section>

                  <article class="decision-improvement-headline">
                    <strong>本轮核心判断</strong>
                    <p>{{ decisionImprovementDefaultState.headlineSummary }}</p>
                  </article>

                  <section class="decision-improvement-matrix">
                    <header>
                      <span>重矩阵证据区</span>
                      <h3>岗位 / 技术到课程整改映射</h3>
                    </header>
                    <div class="decision-improvement-matrix-grid">
                      <article
                        v-for="item in decisionImprovementDefaultState.evidenceMatrix"
                        :key="`${item.trend}-${item.courses}`"
                        class="decision-improvement-matrix-row"
                      >
                        <div>
                          <span>岗位趋势</span>
                          <strong>{{ item.trend }}</strong>
                        </div>
                        <div>
                          <span>能力要求</span>
                          <p>{{ item.ability }}</p>
                        </div>
                        <div>
                          <span>关联课程</span>
                          <p>{{ item.courses }}</p>
                        </div>
                        <div>
                          <span>当前缺口</span>
                          <p>{{ item.gap }}</p>
                        </div>
                        <div>
                          <span>整改动作</span>
                          <strong>{{ item.action }}</strong>
                        </div>
                        <div>
                          <span>实训补强</span>
                          <p>{{ item.training }}</p>
                        </div>
                      </article>
                    </div>
                  </section>

                  <section class="decision-improvement-actions">
                    <article class="decision-improvement-action-card">
                      <header>
                        <span>课程整改</span>
                        <h3>课程调整建议</h3>
                      </header>
                      <div class="decision-improvement-list">
                        <article v-for="item in decisionImprovementDefaultState.courseAdjustments" :key="item.course">
                          <strong>{{ item.course }}</strong>
                          <p>{{ item.change }}</p>
                          <span>{{ item.reason }} · {{ item.priority }}优先级</span>
                        </article>
                      </div>
                    </article>

                    <article class="decision-improvement-action-card">
                      <header>
                        <span>实训补强</span>
                        <h3>新增实训模块</h3>
                      </header>
                      <div class="decision-improvement-list">
                        <article v-for="item in decisionImprovementDefaultState.trainingAdditions" :key="item.name">
                          <strong>{{ item.name }}</strong>
                          <p>{{ item.focus }}</p>
                          <span>{{ item.format }} · {{ item.duration }}</span>
                        </article>
                      </div>
                    </article>

                    <article class="decision-improvement-action-card">
                      <header>
                        <span>资源补强</span>
                        <h3>配套资源建议</h3>
                      </header>
                      <div class="decision-improvement-list">
                        <article
                          v-for="item in decisionImprovementDefaultState.resourceRecommendations"
                          :key="item.resource"
                        >
                          <strong>{{ item.resource }}</strong>
                          <p>{{ item.purpose }}</p>
                          <span>{{ item.type }} · {{ item.owner }}</span>
                        </article>
                      </div>
                    </article>
                  </section>

                  <section class="decision-improvement-timeline">
                    <header>
                      <span>交付节奏</span>
                      <h3>建议落地时间线</h3>
                    </header>
                    <div class="decision-improvement-timeline-grid">
                      <article
                        v-for="item in decisionImprovementDefaultState.deliveryTimeline"
                        :key="`${item.phase}-${item.window}`"
                        class="decision-improvement-timeline-card"
                      >
                        <strong>{{ item.phase }}</strong>
                        <span>{{ item.window }}</span>
                        <p>{{ item.deliverables }}</p>
                      </article>
                    </div>
                  </section>
                </section>

                <section v-else-if="decisionImprovementState === 'refreshing'" class="decision-improvement-state-card">
                  <strong>{{ decisionImprovementPage.states.refreshing.title }}</strong>
                  <p>{{ decisionImprovementPage.states.refreshing.message }}</p>
                  <div class="decision-warning-actions">
                    <button class="outline-action" type="button" @click="decisionImprovementState = 'empty'">
                      {{ decisionImprovementPage.states.refreshing.secondaryAction }}
                    </button>
                    <button class="primary-action" type="button" @click="decisionImprovementState = 'default'">
                      {{ decisionImprovementPage.states.refreshing.primaryAction }}
                    </button>
                  </div>
                </section>

                <section v-else-if="decisionImprovementState === 'empty'" class="decision-improvement-state-card">
                  <strong>{{ decisionImprovementPage.states.empty.title }}</strong>
                  <p>{{ decisionImprovementPage.states.empty.description }}</p>
                  <div class="decision-warning-actions">
                    <button class="primary-action" type="button" @click="decisionImprovementState = 'refreshing'">
                      {{ decisionImprovementPage.states.empty.cta }}
                    </button>
                  </div>
                </section>

                <section v-else-if="decisionImprovementState === 'warning'" class="decision-improvement-state-card">
                  <strong>{{ decisionImprovementPage.states.warning.title }}</strong>
                  <div class="decision-check-list">
                    <article
                      v-for="flag in decisionImprovementPage.states.warning.warningFlags"
                      :key="flag"
                      class="decision-alert-card"
                    >
                      {{ flag }}
                    </article>
                  </div>
                  <div class="decision-warning-actions">
                    <button class="outline-action" type="button" @click="decisionImprovementState = 'refreshing'">
                      {{ decisionImprovementPage.states.warning.secondaryAction }}
                    </button>
                    <button class="primary-action" type="button" @click="decisionImprovementState = 'default'">
                      {{ decisionImprovementPage.states.warning.primaryAction }}
                    </button>
                  </div>
                </section>
              </section>
            </template>
          </section>
        </template>

        <aside v-if="currentModule === '人才方案管理'" class="section-menu">
          <div class="section-title-icon">♚</div>
          <h1>人才方案管理</h1>
          <button class="version-select">2026版本⌄</button>
          <button
            v-for="item in sideItems"
            :key="item"
            class="side-button"
            :class="{ selected: activeTalentSubsystem === '' && activeTalentSection === item }"
            type="button"
            @click="selectTalentSection(item)"
          >
            {{ item }}
          </button>
          <div class="talent-subsystem-spacer"></div>
          <div class="talent-subsystem-entry-group">
            <button
              v-for="item in talentSubsystemItems"
              :key="item.key"
              class="talent-subsystem-entry"
              :class="{ selected: activeTalentSubsystem === item.key }"
              type="button"
              @click="openTalentSubsystem(item.key)"
            >
              <span>{{ item.icon }}</span>
              {{ item.label }}
            </button>
          </div>
        </aside>

        <section v-if="currentModule === '人才方案管理'" class="canvas-card">
          <div v-if="activeTalentSubsystem === 'research'" class="talent-subsystem-page talent-research-page">
            <header class="talent-subsystem-head">
              <span>人才方案管理 / 子系统</span>
              <h2>人才培养方案调研</h2>
            </header>

            <section v-if="!selectedResearchPlan" class="talent-research-home">
              <div class="talent-research-search-card">
                <h3>人才培养方案调研</h3>
                <p>搜索全国优秀职业院校人培方案，支持按学校、专业和年份快速定位。</p>
                <div class="research-master-search">
                  <input
                    v-model="researchSearchForm.keyword"
                    placeholder="输入专业关键词如：智能建造、BIM、装配式建筑"
                    @keyup.enter="searchResearchPlans"
                  >
                  <button type="button" @click="searchResearchPlans">✦ 开始调研</button>
                </div>
                <div class="research-suggestion-row">
                  <strong>猜你想搜：</strong>
                  <button type="button" @click="searchResearchSuggestion('2025年沈建大智能建造人培')">2025年沈建大智能建造人培</button>
                  <button type="button" @click="searchResearchSuggestion('2024年大工智能建造方向')">2024年大工智能建造方向</button>
                </div>
                <span class="research-count">已收录 235 篇院校人才培养方案</span>
              </div>

              <section v-if="researchHasSearched" class="research-results-panel">
                <div class="research-results-head">
                  <div>
                    <h3>搜索结果</h3>
                    <span>共找到 {{ filteredResearchPlanResults.length }} 个人才培养方案</span>
                  </div>
                  <button type="button" @click="researchHasSearched = false">收起结果</button>
                </div>
                <div class="research-result-list">
                  <div v-if="filteredResearchPlanResults.length === 0" class="research-empty-result">
                    暂无匹配的人才培养方案，请调整学校、专业或年份后重试。
                  </div>
                  <button
                    v-for="plan in filteredResearchPlanResults"
                    :key="plan.id"
                    type="button"
                    class="research-result-card"
                    @click="openResearchPlanPreview(plan.id)"
                  >
                    <div>
                      <strong>{{ plan.name }}</strong>
                      <p>{{ plan.summary }}</p>
                      <span>{{ plan.school }} · {{ plan.major }} · {{ plan.type }}</span>
                    </div>
                    <dl>
                      <div><dt>年份</dt><dd>{{ plan.year }}</dd></div>
                      <div><dt>页数</dt><dd>{{ plan.pages }}页</dd></div>
                      <div><dt>更新</dt><dd>{{ plan.updatedAt }}</dd></div>
                    </dl>
                  </button>
                </div>
              </section>
            </section>

            <section v-else class="research-preview-page">
              <div class="research-preview-head">
                <button type="button" @click="closeResearchPlanPreview">‹ 返回结果</button>
                <div>
                  <span>{{ selectedResearchPlan.school }} · {{ selectedResearchPlan.year }}</span>
                  <h3>{{ selectedResearchPlan.name }}</h3>
                </div>
              </div>
              <div class="pdf-preview-shell">
                <aside class="pdf-preview-meta">
                  <h4>PDF预览</h4>
                  <p>{{ selectedResearchPlan.summary }}</p>
                  <dl>
                    <div><dt>学校</dt><dd>{{ selectedResearchPlan.school }}</dd></div>
                    <div><dt>专业</dt><dd>{{ selectedResearchPlan.major }}</dd></div>
                    <div><dt>年份</dt><dd>{{ selectedResearchPlan.year }}</dd></div>
                    <div><dt>页数</dt><dd>{{ selectedResearchPlan.pages }}页</dd></div>
                  </dl>
                </aside>
                <div class="pdf-preview-document">
                  <div class="pdf-toolbar"><span>100%</span><span>第 1 / {{ selectedResearchPlan.pages }} 页</span><button>下载</button></div>
                  <article class="pdf-preview-page">
                    <header>
                      <span>{{ selectedResearchPlan.school }}</span>
                      <strong>{{ selectedResearchPlan.year }}级</strong>
                    </header>
                    <h4>{{ selectedResearchPlan.name }}</h4>
                    <p>一、专业名称与代码</p>
                    <p>{{ selectedResearchPlan.major }}，面向区域产业发展和数字化转型需要，培养能够胜任岗位任务的高素质技术技能人才。</p>
                    <p>二、培养目标</p>
                    <p>本方案围绕职业岗位能力、课程体系、实践教学与毕业要求进行系统设计。</p>
                  </article>
                </div>
              </div>
            </section>
          </div>

          <div v-else-if="activeTalentSubsystem === 'compare'" class="talent-subsystem-page talent-compare-page">
            <header class="talent-subsystem-head">
              <span>人才方案管理 / 子系统</span>
              <h2>人才培养方案比对</h2>
            </header>

            <section v-if="!compareStarted && !compareLoading" class="compare-setup-panel">
              <div class="compare-step-header">
                <span>01</span>
                <div>
                  <h3>选择两份人才培养方案</h3>
                  <p>支持本地 PDF 与系统内方案组合比对，也可以两份都使用上传文件演示。</p>
                </div>
              </div>

              <div class="compare-upload-grid">
                <article class="compare-upload-card">
                  <div class="compare-card-head">
                    <span>本地人才培养方案</span>
                    <strong>主方案</strong>
                  </div>
                  <button class="compare-file-drop" type="button" @click="simulateSourcePlanUpload">
                    <span>PDF</span>
                    <strong>选择或拖入本地文件</strong>
                    <em>{{ compareSourceFileName }}</em>
                  </button>
                  <div class="compare-file-chip">
                    <span>已选择</span>
                    <strong>{{ compareSourceFileName }}</strong>
                  </div>
                </article>

                <article class="compare-upload-card">
                  <div class="compare-card-head">
                    <span>被比对人才培养方案</span>
                    <strong>对标方案</strong>
                  </div>
                  <div class="compare-mode-switch" aria-label="被比对方案来源">
                    <button
                      type="button"
                      :class="{ selected: compareTargetMode === 'system' }"
                      @click="chooseCompareTargetMode('system')"
                    >
                      系统内人培
                    </button>
                    <button
                      type="button"
                      :class="{ selected: compareTargetMode === 'upload' }"
                      @click="simulateTargetPlanUpload"
                    >
                      主动上传PDF
                    </button>
                  </div>
                  <select
                    v-if="compareTargetMode === 'system'"
                    v-model="selectedCompareSystemPlanId"
                    class="compare-system-select"
                  >
                    <option
                      v-for="plan in researchPlanResults.slice(0, 4)"
                      :key="plan.id"
                      :value="plan.id"
                    >
                      {{ plan.year }} · {{ plan.school }} · {{ plan.major }}
                    </option>
                  </select>
                  <button v-else class="compare-file-drop compact" type="button" @click="simulateTargetPlanUpload">
                    <span>PDF</span>
                    <strong>上传被比对方案</strong>
                    <em>{{ compareTargetFileName }}</em>
                  </button>
                  <div class="compare-file-chip">
                    <span>当前对标</span>
                    <strong>{{ compareTargetPlanName }}</strong>
                  </div>
                </article>
              </div>

              <section class="compare-reference-import">
                <div class="compare-reference-copy">
                  <span class="compare-reference-icon" aria-hidden="true"></span>
                  <div>
                    <h3>导入本地文件</h3>
                    <p>可补充导入产业调研报告、专业分析报告、岗位需求报告等材料，作为后续比对建议的参考依据。</p>
                  </div>
                </div>
                <button type="button" data-compare-reference-import @click="simulateReferenceFileImport">
                  <span>＋</span>
                  导入本地文件
                </button>
                <div class="compare-reference-files">
                  <span v-if="compareReferenceFiles.length === 0">支持 PDF / Word / Excel，本次演示会自动载入两份模拟材料</span>
                  <template v-else>
                    <strong v-for="file in compareReferenceFiles" :key="file">{{ file }}</strong>
                  </template>
                </div>
              </section>

              <div class="compare-start-row">
                <button class="compare-start-button" type="button" @click="startTalentPlanCompare">开始比对</button>
              </div>
            </section>

            <section v-else-if="compareLoading" class="compare-loading-panel">
              <div class="compare-loading-orbit">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <h3>比对中</h3>
              <p>正在解析两份人才培养方案，按培养目标、毕业要求、课程体系和支撑矩阵生成建议。</p>
            </section>

            <section v-else class="compare-workbench">
              <div class="compare-summary-strip">
                <div>
                  <span>主方案</span>
                  <strong>{{ compareSourceFileName }}</strong>
                </div>
                <span class="compare-vs">VS</span>
                <div>
                  <span>对标方案</span>
                  <strong>{{ compareTargetPlanName }}</strong>
                </div>
                <button type="button" @click="resetTalentPlanCompare">重新选择</button>
              </div>

              <div class="compare-main-grid">
                <section class="compare-module-results">
                  <div class="compare-section-title">
                    <span>02</span>
                    <div>
                      <h3>模块比对结果</h3>
                      <p>按培养目标、毕业要求、课程体系、实践教学和支撑矩阵给出修订建议。</p>
                    </div>
                  </div>
                  <article
                    v-for="module in compareModules"
                    :key="module.name"
                    class="compare-module-card"
                    :class="{ selected: activeCompareModuleName === module.name }"
                    role="button"
                    tabindex="0"
                    :data-compare-module="module.name"
                    @click="selectCompareModuleForEdit(module.name)"
                    @keydown.enter.prevent="selectCompareModuleForEdit(module.name)"
                    @keydown.space.prevent="selectCompareModuleForEdit(module.name)"
                  >
                    <header>
                      <div>
                        <strong>{{ module.name }}</strong>
                        <span>{{ module.status }}</span>
                      </div>
                      <em>{{ module.score }}</em>
                    </header>
                    <dl>
                      <div>
                        <dt>当前方案</dt>
                        <dd>{{ module.source }}</dd>
                      </div>
                      <div>
                        <dt>对标方案</dt>
                        <dd>{{ module.target }}</dd>
                      </div>
                    </dl>
                    <p><strong>比对建议</strong>{{ module.advice }}</p>
                  </article>
                </section>

                <section class="compare-editor-panel">
                  <div class="compare-section-title compact">
                    <span>03</span>
                    <div>
                      <h3 data-compare-editor-title>{{ activeCompareModule.name }}编辑器</h3>
                      <p>正在编辑「{{ activeCompareModule.name }}」模块，定稿后导出新的 PDF。</p>
                    </div>
                  </div>
                  <div class="compare-editor-toolbar" aria-label="文本编辑工具">
                    <label>
                      字号
                      <select>
                        <option>小四</option>
                        <option>四号</option>
                        <option>小三</option>
                      </select>
                    </label>
                    <button type="button"><strong>B</strong></button>
                    <button type="button" @click="insertCompareEditorSnippet('heading')">标题</button>
                    <button type="button" @click="insertCompareEditorSnippet('table')">插入表格</button>
                    <button type="button" @click="insertCompareEditorSnippet('advice')">插入建议</button>
                  </div>
                  <textarea v-model="activeCompareEditorContent" class="compare-editor-area" aria-label="人才培养方案修订稿"></textarea>
                  <footer class="compare-editor-footer">
                    <span v-if="compareExportStatus" class="compare-export-status">{{ compareExportStatus }}</span>
                    <button type="button" @click="exportComparePdf">导出新PDF</button>
                  </footer>
                </section>
              </div>
            </section>
          </div>

          <div v-else-if="activeTalentSubsystem" class="talent-subsystem-page">
            <header class="talent-subsystem-head">
              <span>人才方案管理 / 子系统</span>
              <h2>{{ activeTalentSubsystemMeta?.label }}</h2>
            </header>
            <section class="talent-subsystem-placeholder">
              <div class="subsystem-icon">{{ activeTalentSubsystemMeta?.icon }}</div>
              <h3>{{ activeTalentSubsystemMeta?.label }}</h3>
              <p>子系统入口已打开，后续将在这里继续设计完整流程、数据视图和交互细节。</p>
            </section>
          </div>

          <div v-else-if="!talentPlanCreated" class="empty-state">
            <div class="empty-illustration">
              <div class="hill"></div>
              <div class="box">
                <span class="box-face front"></span>
                <span class="box-face side"></span>
                <span class="box-face top"></span>
              </div>
              <div class="plane"></div>
              <span class="tree tree-left"></span>
              <span class="tree tree-mid"></span>
              <span class="tree tree-right"></span>
            </div>
            <button class="primary-action" @click="openCultivateGoalDialog">
              <span>＋</span>
              创建培养目标
            </button>
          </div>

          <div v-else class="talent-plan-page">
            <header class="talent-panel-head">
              <h2>{{ activeTalentSection }}</h2>
              <button type="button" class="edit-link">✎ 编辑</button>
            </header>

            <section v-if="activeTalentSection === '培养目标'" class="talent-section-body narrow">
              <h3>培养目标概述</h3>
              <p class="talent-overview">{{ talentGoalOverview }}</p>
              <h3>培养目标</h3>
              <div class="goal-list">
                <div v-for="(goal, index) in talentGoals" :key="goal" class="goal-row">
                  <strong>目标{{ index + 1 }}</strong>
                  <span>{{ goal }}</span>
                </div>
              </div>
            </section>

            <section v-else-if="activeTalentSection === '毕业要求'" class="talent-section-body narrow">
              <h3>毕业要求概述</h3>
              <p class="talent-overview">{{ graduationOverview }}</p>
              <h3>毕业要求</h3>
              <div class="requirement-list">
                <article v-for="item in graduationRequirements" :key="item.code" class="requirement-group">
                  <div class="requirement-main">
                    <strong>{{ item.code }}</strong>
                    <span>{{ item.text }}</span>
                  </div>
                  <div
                    v-for="(child, childIndex) in item.children"
                    :key="`${item.code}-${childIndex}`"
                    class="requirement-child"
                  >
                    <strong>{{ item.code }}.{{ childIndex + 1 }}</strong>
                    <span>{{ child }}</span>
                  </div>
                </article>
              </div>
            </section>

            <section v-else-if="activeTalentSection === '课程管理'" class="talent-section-body full">
              <div class="talent-tabs">
                <button class="selected" type="button">全部教务课程({{ talentCourses.length }})</button>
                <button type="button">按课程类型</button>
                <button type="button">按开课学期</button>
              </div>
              <div class="talent-toolbar">
                <div class="search-control"><span>⌕</span><input value="" placeholder="搜索课程名称/代码/ID" readonly><button>搜索</button></div>
                <button class="select-control" type="button">课程类型　全部⌄</button>
                <button class="select-control" type="button">开课学期　全部⌄</button>
                <button class="clear-button" type="button">清空</button>
                <div class="toolbar-spacer"></div>
                <button class="outline-action" type="button">▣ 批量分配课程成员</button>
                <button class="outline-action" type="button">▣ 批量导入</button>
                <button class="outline-action" type="button">＋ 添加课程</button>
              </div>
              <table class="talent-table talent-course-table">
                <thead>
                  <tr><th><input type="checkbox"></th><th>课程代码</th><th>课程名称</th><th>关联的AI课</th><th>课程团队</th><th>课程学分</th><th>课程类型</th><th>开课学期</th><th>课程目标</th><th>操作</th></tr>
                </thead>
                <tbody>
                  <tr v-for="course in talentCourses" :key="course[0]">
                    <td><input type="checkbox"></td>
                    <td>{{ course[0] }}</td>
                    <td><a>{{ course[1] }}</a></td>
                    <td>
                      <button
                        v-if="course[2]"
                        class="ai-course-link"
                        type="button"
                        @click="openCourseModelPage"
                      >
                        <span class="ai-course">AI</span>{{ course[2] }}
                      </button>
                      <span v-else>⌕</span>
                    </td>
                    <td>{{ course[3] }}</td>
                    <td>{{ course[4] }}</td>
                    <td>{{ course[5] }}</td>
                    <td>{{ course[6] }}</td>
                    <td><a>{{ course[7] }}</a></td>
                    <td><a>移除</a><a>编辑</a></td>
                  </tr>
                </tbody>
              </table>
              <div class="pagination"><button>‹</button><button class="active">1</button><button>2</button><button>›</button><span>◎</span><span>跳至</span><input value="1" readonly><span>页</span></div>
            </section>

            <section v-else-if="activeTalentSection === '支撑矩阵'" class="talent-section-body full">
              <div class="matrix-title"><strong>培养目标与毕业要求支撑矩阵</strong><span>勾选表示该毕业要求对培养目标形成直接或重要支撑</span></div>
              <table class="talent-table talent-matrix-table">
                <thead>
                  <tr><th>毕业要求 \ 培养目标</th><th v-for="goal in matrixGoals" :key="goal">目标{{ goal }}</th></tr>
                </thead>
                <tbody>
                  <tr v-for="row in matrixRows" :key="row.code">
                    <th><strong>{{ row.label }}</strong><span>{{ row.title }}</span></th>
                    <td v-for="goal in matrixGoals" :key="`${row.code}-${goal}`">
                      <span v-if="row.goals.includes(goal)" class="matrix-check">✓</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section v-else class="talent-section-body full">
              <h3>2026级全部学生(0)</h3>
              <div class="talent-toolbar compact-toolbar">
                <div class="search-control"><span>⌕</span><input value="" placeholder="搜索学生姓名/学号" readonly><button>搜索</button></div>
              </div>
              <table class="talent-table student-table">
                <thead><tr><th>学生姓名</th><th>学号</th><th>入学年份</th><th>所属院系</th><th>所修专业</th><th>已修学分/应修学分/总学分</th></tr></thead>
                <tbody><tr><td colspan="6" class="empty-cell">暂无数据</td></tr></tbody>
              </table>
              <div class="pagination"><button>‹</button><button class="active">1</button><button>›</button><span>◎</span><span>跳至</span><input value="1" readonly><span>页</span></div>
            </section>
          </div>

          <button class="support-avatar" aria-label="智能助手">
            <span class="face">👩‍💻</span>
          </button>
        </section>

        <template v-else-if="currentModule === '专业引擎'">
          <aside class="engine-module-menu">
            <button class="engine-collapse" type="button" aria-label="收起侧边栏">‹</button>

            <button
              class="engine-knowledge-card"
              :class="{ active: engineActiveSection === 'knowledge' }"
              type="button"
              @click="setEngineSection('knowledge')"
            >
              <div class="engine-knowledge-icon">▱</div>
              <div>
                <h1>知识库</h1>
                <p>专业知识库</p>
              </div>
            </button>

            <nav class="engine-side-nav" aria-label="专业引擎菜单">
              <button
                v-for="item in engineMenuItems"
                :key="item.key"
                type="button"
                class="engine-side-item"
                :class="{ active: engineActiveSection === item.key, separated: item.separated }"
                @click="setEngineSection(item.key as EngineSectionKey)"
              >
                <span>{{ item.icon }}</span>
                <strong>{{ item.title }}</strong>
                <em v-if="item.subtitle">{{ item.subtitle }}</em>
              </button>
            </nav>

            <div class="engine-side-footer">
              <button type="button">✦ 开放 AI 应用</button>
              <div>
                <p><span>使用情况</span><strong>0个班级正在使用</strong></p>
                <p><span>已连接</span><strong>1个知识库⌄</strong></p>
              </div>
            </div>
          </aside>

          <section class="engine-board">
            <div class="engine-actions">
              <button
                v-if="currentEnginePanel.tertiaryAction"
                class="engine-outline-action"
                type="button"
              >
                {{ currentEnginePanel.tertiaryAction }}
              </button>
              <button
                v-if="currentEnginePanel.secondaryAction"
                class="engine-outline-action"
                type="button"
              >
                {{ currentEnginePanel.secondaryAction }}
              </button>
              <button class="engine-primary-action" type="button">{{ currentEnginePanel.primaryAction }}</button>
            </div>

            <div class="engine-group-label">{{ currentEnginePanel.sectionLabel }} / {{ currentEnginePanel.groupLabel }}</div>

            <div class="engine-agent-grid">
              <article
                v-for="agent in currentEnginePanel.cards"
                :key="`${engineActiveSection}-${agent.name}`"
                class="engine-agent-card"
              >
                <div class="engine-agent-avatar" :class="`tone-${agent.tone}`">
                  {{ agent.icon }}
                </div>
                <div class="engine-agent-body">
                  <h2>
                    {{ agent.name }}
                    <span :class="`tone-${agent.tone}`">{{ agent.type }}</span>
                  </h2>
                  <p>{{ agent.description }}</p>
                </div>
                <span class="engine-agent-arrow">›</span>
              </article>

              <button class="engine-add-agent" type="button">
                <span>＋</span>
                <strong>{{ currentEnginePanel.addLabel }}</strong>
              </button>
            </div>
          </section>
        </template>

        <template v-else-if="currentModule === '岗位中心'">
          <aside class="job-module-menu">
            <div class="job-module-title-icon">◎</div>
            <h1>岗位中心</h1>
            <template v-for="item in jobSideItems" :key="item">
              <button
                class="job-menu-button"
                :class="{ selected: currentJobSection === item }"
                @click="selectJobSection(item)"
              >
                {{ item }}
              </button>
              <div
                v-if="item === '产业调研'"
                class="job-sub-menu"
                :class="{ open: currentJobSection === '产业调研' }"
              >
                <div class="job-sub-title">产业布局</div>
                <button
                  v-for="tab in INDUSTRY_RESEARCH_TABS"
                  :key="tab.key"
                  class="job-sub-button"
                  :class="{ selected: currentJobSection === '产业调研' && currentJobResearchMode === 'industry' && currentJobIndustryTab === tab.key }"
                  @click.stop="selectJobIndustryTab(tab.key)"
                >
                  {{ tab.label }}
                </button>
                <div class="job-sub-title">岗位分析</div>
                <button
                  v-for="tab in JOB_RESEARCH_TABS"
                  :key="tab.key"
                  class="job-sub-button"
                  :class="{ selected: currentJobSection === '产业调研' && currentJobResearchMode === 'job' && currentJobResearchTab === tab.key }"
                  @click.stop="selectJobResearchTab(tab.key)"
                >
                  {{ tab.label }}
                </button>
              </div>
              <div
                v-else-if="item === '产业调研报告'"
                class="job-sub-menu"
                :class="{ open: currentJobSection === '产业调研报告' }"
              >
                <button
                  class="job-sub-button"
                  :class="{ selected: currentJobSection === '产业调研报告' }"
                  @click.stop="openReportLibrary"
                >
                  报告生成
                </button>
              </div>
            </template>
          </aside>

          <section class="canvas-card job-center-card">
            <div v-if="currentJobSection === '产业调研'" class="job-research-page">
              <header class="research-title-row">
                <div>
                  <span>{{ currentJobResearchMode === 'industry' ? '产业调研 / 产业布局' : '产业调研 / 岗位分析' }}</span>
                  <h2>{{ currentJobResearchMode === 'industry' ? activeIndustryTab.label : activeResearchTab.label }}</h2>
                </div>
                <button class="research-chain-select">当前产业链：智能建造产业链⌄</button>
              </header>

              <template v-if="currentJobResearchMode === 'industry'">
                <template v-if="currentJobIndustryTab === 'chain'">
                  <section class="research-ai-strip industry-layout-summary">
                    <div class="research-ai-badge">AI</div>
                    <h3>产业链结构分析</h3>
                    <ul>
                      <li>智能建造产业链按<strong>BIM数据与工程装备</strong>、<strong>平台服务与工程实施</strong>、<strong>施工检测与智慧运维</strong>形成价值流转，中游承担工程数据转项目交付的关键转换职能。</li>
                      <li>岗位需求最集中在中游的<strong>BIM协同、智慧工地、装配式深化与平台实施</strong>，也是智能建造工程专业最适合组织课程、实训和项目闭环的环节。</li>
                      <li>下游智能施工、结构健康监测、绿色建造和智慧运维场景快速放量，推动岗位从单点软件操作转向<strong>工程交付型复合岗位</strong>。</li>
                      <li>建议围绕“工程数据采集 → BIM协同建模 → 智慧工地实施 → 检测运维交付”组织产业认知、岗位画像和课程矩阵，形成从认知到实操的完整培养路径。</li>
                    </ul>
                  </section>

                  <section class="research-card industry-layout-card">
                    <div class="research-card-head">
                      <h3>智能建造产业链桑基图谱</h3>
                      <span>参考开源桑基图的节点-权重组织方式，按上游、中游、下游梳理产业价值流</span>
                    </div>
                    <div class="industry-sankey-legend">
                      <span
                        v-for="stage in industrySankeyStages"
                        :key="stage.key"
                        :class="stage.key === 'upstream' ? 'up' : stage.key === 'midstream' ? 'mid' : 'down'"
                      >
                        {{ stage.label }}：{{ stage.summary }}
                      </span>
                    </div>
                    <div class="industry-sankey-kpis">
                      <article v-for="stage in industrySankeyStages" :key="`${stage.key}-metric`" :class="`tone-${stage.key}`">
                        <span>{{ stage.label }}</span>
                        <strong>{{ stage.stats }}</strong>
                      </article>
                    </div>
                    <div class="industry-sankey-board">
                      <svg
                        class="industry-sankey-svg"
                        :viewBox="`0 0 ${industrySankeyNodeLayout.width} ${industrySankeyNodeLayout.height}`"
                        preserveAspectRatio="xMidYMid meet"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            v-for="path in industrySankeyPaths"
                            :id="path.gradientId"
                            :key="path.gradientId"
                            gradientUnits="userSpaceOnUse"
                            :x1="industrySankeyNodePositions.get(path.source)?.x"
                            :y1="industrySankeyNodePositions.get(path.source)?.y"
                            :x2="industrySankeyNodePositions.get(path.target)?.x"
                            :y2="industrySankeyNodePositions.get(path.target)?.y"
                          >
                            <stop offset="0%" :stop-color="path.fromColor" stop-opacity="0.42" />
                            <stop offset="100%" :stop-color="path.toColor" stop-opacity="0.22" />
                          </linearGradient>
                        </defs>
                        <g v-for="column in industrySankeyColumns" :key="`${column.key}-stage`" class="industry-sankey-stage-label">
                          <text
                            :x="industrySankeyNodeLayout.columnX[column.key] + industrySankeyNodeLayout.cardWidth / 2"
                            y="26"
                            text-anchor="middle"
                            class="industry-sankey-stage-title"
                          >
                            {{ column.label }}
                          </text>
                          <text
                            :x="industrySankeyNodeLayout.columnX[column.key] + industrySankeyNodeLayout.cardWidth / 2"
                            y="46"
                            text-anchor="middle"
                            class="industry-sankey-stage-summary"
                          >
                            {{ column.summary }}
                          </text>
                        </g>
                        <path
                          v-for="path in industrySankeyPaths"
                          :key="`${path.source}-${path.target}`"
                          class="industry-sankey-link"
                          :d="path.d"
                          :stroke="`url(#${path.gradientId})`"
                          :stroke-width="path.strokeWidth"
                        />
                        <g
                          v-for="node in industrySankeyNodes"
                          :key="node.id"
                          class="industry-sankey-node"
                          :class="`stage-${node.stage}`"
                          :transform="`translate(${industrySankeyNodePositions.get(node.id)?.x}, ${industrySankeyNodePositions.get(node.id)?.y})`"
                        >
                          <rect class="industry-sankey-node-card" :width="industrySankeyNodeLayout.cardWidth" :height="industrySankeyNodeLayout.cardHeight" rx="12" ry="12" />
                          <rect class="industry-sankey-node-accent" width="5" :height="industrySankeyNodeLayout.cardHeight - 20" x="10" y="10" rx="3" ry="3" />
                          <text class="industry-sankey-node-title" :x="industrySankeyNodeLayout.cardWidth / 2" y="30" text-anchor="middle">
                            {{ node.name }}
                          </text>
                          <text class="industry-sankey-node-meta" :x="industrySankeyNodeLayout.cardWidth / 2" y="50" text-anchor="middle">
                            {{ node.meta }} · {{ node.note }}
                          </text>
                        </g>
                      </svg>
                    </div>
                    <div class="industry-chain-info-grid">
                      <article v-for="item in industryChainInsights" :key="item.label">
                        <h4>{{ item.label }}</h4>
                        <p>{{ item.text }}</p>
                      </article>
                    </div>
                  </section>

                  <div class="industry-list-grid">
                    <section class="research-card">
                      <div class="research-card-head">
                        <h3>代表企业</h3>
                        <span>按产业链环节归类</span>
                      </div>
                      <div class="industry-list-block">
                        <h4>上游企业</h4>
                        <ul>
                          <li>广联达：BIM标准、工程数据与造价数字化平台</li>
                          <li>南方测绘：智能测绘、三维激光与空间数据采集</li>
                          <li>海康威视：智慧工地视频物联与现场感知终端</li>
                        </ul>
                        <h4>中游企业</h4>
                        <ul>
                          <li>中国建筑：智能建造工程实施与项目总承包</li>
                          <li>中建科技：装配式建筑、构件生产与绿色建造</li>
                          <li>品茗科技：智慧工地、安全管理与施工数字化平台</li>
                        </ul>
                        <h4>下游企业</h4>
                        <ul>
                          <li>沈阳远大智能工业：建筑工业化与智能装备应用</li>
                          <li>盈建科/构力科技：结构设计软件与BIM协同工具</li>
                          <li>中建八局东北公司：智慧工地与城市更新项目场景</li>
                        </ul>
                      </div>
                    </section>

                    <section class="research-card">
                      <div class="research-card-head">
                        <h3>核心岗位</h3>
                        <span>按上中下游能力需求拆分</span>
                      </div>
                      <div class="industry-list-block">
                        <h4>上游岗位</h4>
                        <ul>
                          <li>智能测量工程师</li>
                          <li>三维激光扫描建模师</li>
                          <li>建筑物联网集成工程师</li>
                        </ul>
                        <h4>中游岗位</h4>
                        <ul>
                          <li>BIM深化设计工程师</li>
                          <li>智慧建造平台实施顾问</li>
                          <li>装配式建筑深化设计师</li>
                        </ul>
                        <h4>下游岗位</h4>
                        <ul>
                          <li>智能建造施工技术员</li>
                          <li>结构健康监测工程师</li>
                          <li>建筑智能运维工程师</li>
                        </ul>
                      </div>
                    </section>
                  </div>

                  <section class="research-card">
                    <div class="research-card-head">
                      <h3>产业链建设建议</h3>
                      <span>服务岗位画像与实训项目设计</span>
                    </div>
                    <div class="industry-suggestion-row">
                      <article v-for="item in industryChainSuggestions" :key="item.index">
                        <strong>{{ item.index }}</strong>
                        <span>{{ item.title }}</span>
                        <p>{{ item.desc }}</p>
                      </article>
                    </div>
                  </section>
                </template>

                <template v-else-if="currentJobIndustryTab === 'region'">
                  <section class="research-tip">
                    <span class="tip-icon">i</span>
                    <p>围绕智能建造产业链的企业集聚、岗位需求和工程场景落地情况，识别区域产业优势与专业建设合作方向。</p>
                  </section>
                  <section class="demand-kpi-grid industry-kpi-grid">
                    <article><span>覆盖省份</span><strong>31</strong><em>全国样本</em></article>
                    <article><span>企业样本</span><strong>12,680</strong><em>智能建造相关企业</em></article>
                    <article><span>重点城市</span><strong>18</strong><em>产业集聚城市</em></article>
                    <article><span>合作线索</span><strong>52</strong><em>企业项目 / 实训基地</em></article>
                  </section>
                  <section class="research-card">
                    <div class="research-card-head">
                      <h3>区域合作方向</h3>
                      <span>按产业集聚区识别专业建设任务</span>
                    </div>
                    <div class="industry-region-grid">
                      <article v-for="item in industryRegionCards" :key="item.name">
                        <strong>{{ item.name }}</strong>
                        <span>{{ item.field }}</span>
                        <p>{{ item.desc }}</p>
                      </article>
                    </div>
                  </section>
                </template>

                <template v-else-if="currentJobIndustryTab === 'policy'">
                  <section class="policy-toolbar">
                    <label>政策级别：</label>
                    <select><option>全部</option><option>国家级</option><option>省级</option><option>市级</option></select>
                    <label>关键词：</label>
                    <input placeholder="搜索政策标题..." />
                    <button>⌕ 搜索</button>
                  </section>
                  <section class="research-ai-strip policy-ai-summary">
                    <div class="research-ai-badge">AI</div>
                    <h3>政策趋势解读</h3>
                    <ul>
                      <li>智能建造政策重点聚焦数字设计、智能生产、智能施工和智慧运维一体化推进。</li>
                      <li>BIM报建审查、智慧工地监管和建筑机器人应用成为工程建设数字化转型的重要抓手。</li>
                      <li>建议密切跟踪智能建造试点、装配式建筑、绿色低碳建造等政策动向，及时调整课程与实训项目。</li>
                    </ul>
                  </section>
                  <section class="research-card policy-timeline-card">
                    <div class="research-card-head">
                      <h3>产业政策库</h3>
                      <span>点击政策查看影响分析</span>
                    </div>
                    <div class="policy-timeline">
                      <button v-for="item in industryPolicyItems" :key="item.title" class="policy-timeline-item" type="button">
                        <span>{{ item.date }}</span>
                        <strong>{{ item.title }}</strong>
                        <p>{{ item.desc }}<em class="policy-level" :class="item.tag">{{ item.level }}</em></p>
                      </button>
                    </div>
                  </section>
                </template>

                <template v-else>
                  <section class="research-tip">
                    <span class="tip-icon">i</span>
                    <p>产业企业库沉淀智能建造产业链代表企业、技术方向、招聘岗位和校企合作建议，用于支撑专业对接产业链。</p>
                  </section>
                  <section class="research-card">
                    <div class="research-card-head">
                      <h3>产业企业库</h3>
                      <span>代表企业、产业环节与岗位方向</span>
                    </div>
                    <div class="industry-enterprise-grid">
                      <article v-for="item in industryCompanyItems" :key="item.name">
                        <strong>{{ item.name }}</strong>
                        <span>{{ item.field }}</span>
                        <p>对接岗位：{{ item.jobs }}</p>
                        <em>合作建议：{{ item.advice }}</em>
                      </article>
                    </div>
                  </section>
                </template>
              </template>

              <template v-else-if="currentJobResearchTab === 'portrait'">
                <section class="research-tip">
                  <span class="tip-icon">i</span>
                  <p>
                    本页面提供智能建造产业链核心岗位的
                    <strong>能力画像分析</strong>
                    ，用于支撑岗位能力依据、课程体系与岗位要求的深度耦合。
                  </p>
                </section>

                <section class="research-search-hero">
                  <div class="hero-heading">
                    <span>⌕</span>
                    <div>
                      <h3>岗位搜索引擎</h3>
                      <p>输入岗位名称、技能关键词或产业链环节，快速获取岗位画像与能力分析</p>
                    </div>
                  </div>
                  <div class="research-search-box">
                    <span>⌕</span>
                    <input value="BIM深化设计工程师、智慧工地、智能检测监测" readonly />
                    <button>搜索</button>
                  </div>
                </section>

                <section class="research-ai-strip">
                  <div class="research-ai-badge">AI</div>
                  <h3>岗位画像洞察</h3>
                  <ul>
                    <li v-for="item in PORTRAIT_INSIGHTS" :key="item">{{ item }}</li>
                  </ul>
                </section>

                <section class="research-card">
                  <div class="research-card-head">
                    <h3>岗位列表</h3>
                    <span>共 {{ PORTRAIT_JOB_PROFILES.length }} 个岗位画像，点击卡片查看详情</span>
                  </div>
                  <div class="portrait-profile-grid">
                    <button
                      v-for="job in paginatedPortraitJobs"
                      :key="job.id"
                      class="portrait-profile-card"
                      :data-portrait-job="job.id"
                      @click="openPortraitJobDialog(job.id)"
                    >
                      <h4>{{ job.name }}</h4>
                      <div class="profile-meta">
                        <strong>{{ job.salary }}</strong>
                        <span>需求量 {{ job.demand }}</span>
                        <span>{{ job.level }}</span>
                      </div>
                      <p>{{ job.chain }}</p>
                      <div class="tags">
                        <span v-for="skill in job.skills" :key="skill">{{ skill }}</span>
                      </div>
                    </button>
                  </div>
                  <div v-if="portraitPageCount > 1" class="pagination portrait-pagination">
                    <button type="button" :disabled="currentPortraitPage === 1" @click="setPortraitPage(currentPortraitPage - 1)">‹</button>
                    <button
                      v-for="page in portraitPageNumbers"
                      :key="page"
                      type="button"
                      :class="{ active: currentPortraitPage === page }"
                      @click="setPortraitPage(page)"
                    >
                      {{ page }}
                    </button>
                    <button type="button" :disabled="currentPortraitPage === portraitPageCount" @click="setPortraitPage(currentPortraitPage + 1)">›</button>
                    <span>共 {{ portraitPageCount }} 页</span>
                  </div>
                </section>
              </template>

              <template v-else-if="currentJobResearchTab === 'demand'">
                <section class="research-tip">
                  <span class="tip-icon">i</span>
                  <p>
                    基于招聘平台与企业样本数据，跟踪智能建造工程专业相关岗位的
                    <strong>需求规模、薪资走势、技能热度</strong>
                    和城市分布变化。
                  </p>
                </section>

                <section class="demand-kpi-grid">
                  <article v-for="item in DEMAND_KPIS" :key="item.label">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <em>{{ item.trend }}</em>
                  </article>
                </section>

                <div class="research-two-col">
                  <section class="research-card">
                    <div class="research-card-head">
                      <h3>岗位需求月度趋势</h3>
                      <span>近12个月招聘需求指数</span>
                    </div>
                    <div class="trend-bars">
                      <div v-for="item in DEMAND_TREND" :key="item.month">
                        <i :style="{ height: `${item.value * 1.05}px` }"></i>
                        <span>{{ item.month }}</span>
                      </div>
                    </div>
                  </section>

                  <section class="research-card">
                    <div class="research-card-head">
                      <h3>技能需求热度</h3>
                      <span>岗位描述中的高频能力</span>
                    </div>
                    <div class="skill-bar-list">
                      <div v-for="item in DEMAND_SKILL_BARS" :key="item.name">
                        <span>{{ item.name }}</span>
                        <strong>{{ item.value }}%</strong>
                        <i><em :style="{ width: `${item.value}%` }"></em></i>
                      </div>
                    </div>
                  </section>
                </div>

                <section class="research-card">
                  <div class="research-card-head">
                    <h3>热门岗位招聘明细</h3>
                    <span>按需求增长排序</span>
                  </div>
                  <table class="research-table">
                    <thead>
                      <tr>
                        <th>岗位名称</th>
                        <th>招聘需求</th>
                        <th>薪资区间</th>
                        <th>增长趋势</th>
                        <th>重点城市</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in DEMAND_JOB_ROWS" :key="row.name">
                        <td>{{ row.name }}</td>
                        <td>{{ row.demand }}</td>
                        <td>{{ row.salary }}</td>
                        <td><strong>{{ row.growth }}</strong></td>
                        <td>{{ row.city }}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              </template>

              <template v-else>
                <section class="research-ai-strip forecast-strip">
                  <div class="research-ai-badge">AI</div>
                  <h3>新岗位新技术预判</h3>
                  <ul>
                    <li>未来三年智能建造工程专业将重点受到BIM+数字孪生工地、建筑机器人、结构健康监测和低碳建造影响。</li>
                    <li>建筑机器人应用工程师、结构健康监测工程师、建筑数据治理工程师将成为新增岗位建设重点。</li>
                    <li>建议提前将BIM深化、智慧工地、智能检测、建筑物联网和绿色建造纳入课程与实训项目。</li>
                  </ul>
                </section>

                <section class="research-card">
                  <div class="research-card-head">
                    <h3>新兴技术方向</h3>
                    <span>技术成熟度、产业影响与人才缺口综合研判</span>
                  </div>
                  <div class="forecast-direction-grid">
                    <article v-for="item in FORECAST_DIRECTIONS" :key="item.name">
                      <div>
                        <h4>{{ item.name }}</h4>
                        <span>{{ item.stage }}</span>
                      </div>
                      <p>{{ item.impact }}</p>
                      <div class="forecast-major-recommend">
                        <strong>推荐专业</strong>
                        <div class="tags major-tags">
                          <span v-for="major in item.majors" :key="major">{{ major }}</span>
                        </div>
                      </div>
                    </article>
                  </div>
                </section>

                <section class="research-card">
                  <div class="research-card-head">
                    <h3>新岗位 × 专业匹配</h3>
                    <span>面向智能建造工程专业的岗位建设建议</span>
                  </div>
                  <div class="forecast-job-grid">
                    <article v-for="job in FORECAST_NEW_JOBS" :key="job.name">
                      <h4>{{ job.name }}</h4>
                      <div>
                        <span>紧缺度：{{ job.urgency }}</span>
                        <strong>{{ job.salary }}</strong>
                      </div>
                      <p>对口专业：{{ job.matchedMajor }}</p>
                      <div class="tags">
                        <span v-for="skill in job.skills" :key="skill">{{ skill }}</span>
                      </div>
                    </article>
                  </div>
                </section>

                <section class="research-card">
                  <div class="research-card-head">
                    <h3>人才培养方向建议</h3>
                    <span>新技术方向与课程、专业的对应关系</span>
                  </div>
                  <table class="research-table">
                    <thead>
                      <tr>
                        <th>技术方向</th>
                        <th>建议课程</th>
                        <th>对口专业</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in FORECAST_TRAINING_TABLE" :key="row.direction">
                        <td>{{ row.direction }}</td>
                        <td>{{ row.course }}</td>
                        <td>{{ row.major }}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              </template>
            </div>

            <div v-else-if="currentJobSection === '产业调研报告'" class="job-research-page report-generate-page">
              <header class="research-title-row">
                <div>
                  <span>岗位中心 / 产业调研报告</span>
                  <h2>报告生成</h2>
                </div>
                <button class="research-chain-select">当前产业链：智能建造产业链⌄</button>
              </header>

              <section class="research-tip">
                <span class="tip-icon">i</span>
                <p>
                  本页面支持
                  <strong>一键生成专业群产业调研分析报告</strong>
                  ，自动整合产业、岗位、专业、课程等数据，用于材料撰写、方案修订和建设论证。
                </p>
              </section>

              <template v-if="currentReportView === 'library'">
                <section class="report-kpi-grid">
                  <article v-for="item in reportStats" :key="item.label" :class="`tone-${item.tone}`">
                    <span>{{ item.icon }}</span>
                    <div>
                      <strong>{{ item.value }}</strong>
                      <em>{{ item.label }} / {{ item.unit }}</em>
                    </div>
                  </article>
                </section>

                <section class="research-card">
                  <div class="research-card-head report-card-head">
                    <h3>报告库管理</h3>
                    <div class="report-management-toolbar">
                      <label class="report-search">
                        <span>⌕</span>
                        <input v-model="reportSearchText" placeholder="搜索报告标题、类型或产业链" />
                      </label>
                      <button class="primary-action compact" @click="openReportCreate">＋ 新建报告</button>
                    </div>
                  </div>
                  <table class="research-table report-table">
                    <thead>
                      <tr>
                        <th>报告标题</th>
                        <th>报告类型</th>
                        <th>产业链</th>
                        <th>区域</th>
                        <th>生成日期</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="report in filteredReportRows" :key="report.id">
                        <td><strong>{{ report.title }}</strong></td>
                        <td><span class="report-type-tag">{{ report.type }}</span></td>
                        <td>{{ report.industry }}</td>
                        <td>{{ report.region }}</td>
                        <td>{{ report.date }}</td>
                        <td><span class="report-status" :class="report.status">{{ report.status === 'done' ? '已完成' : '草稿' }}</span></td>
                        <td>
                          <div class="report-action-buttons">
                            <button title="编辑" @click="editReport(report)">✎</button>
                            <button title="预览下载" @click="previewReport(report)">⇩</button>
                            <button title="复制" @click="copyReport(report)">□</button>
                            <button title="删除" @click="deleteReport(report.id)">⌫</button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              </template>

              <template v-else-if="currentReportView === 'create'">
                <div class="report-toolbar report-toolbar-split">
                  <button class="secondary-action" @click="currentReportView = 'library'">‹ 返回报告库</button>
                  <button class="primary-action compact" @click="generateReportPreview">AI 生成报告</button>
                </div>

                <div class="report-form-layout">
                  <aside class="report-side-stack">
                    <section class="research-card report-form-card">
                      <div class="research-card-head"><h3>报告参数</h3><span>生成前基础配置</span></div>
                      <label class="report-field">
                        <span>报告标题</span>
                        <input v-model="reportForm.title" />
                      </label>
                      <label class="report-field">
                        <span>报告类型</span>
                        <select v-model="reportForm.type">
                          <option v-for="type in REPORT_TYPE_OPTIONS" :key="type">{{ type }}</option>
                        </select>
                      </label>
                      <label class="report-field">
                        <span>产业方向</span>
                        <select v-model="reportForm.industry">
                          <option v-for="industry in REPORT_INDUSTRY_OPTIONS" :key="industry">{{ industry }}</option>
                        </select>
                      </label>
                      <label class="report-field">
                        <span>参考文件上传</span>
                        <input type="file" multiple />
                      </label>
                    </section>

                    <section class="research-card report-dimension-panel">
                      <div class="research-card-head report-card-head">
                        <h3>选择报告维度</h3>
                        <div class="report-head-actions">
                          <span>按需勾选生成内容</span>
                        </div>
                      </div>
                      <div class="report-dimension-grid">
                        <button
                          v-for="dimension in REPORT_DIMENSIONS"
                          :key="dimension.key"
                          class="report-dimension-card"
                          :class="{ selected: selectedReportDimensions.includes(dimension.key) }"
                          @click="toggleReportDimension(dimension.key)"
                        >
                          <span>{{ selectedReportDimensions.includes(dimension.key) ? '✓' : '' }}</span>
                          <strong>{{ dimension.title }}</strong>
                          <em>{{ dimension.desc }}</em>
                        </button>
                      </div>
                    </section>
                  </aside>

                  <section class="report-main-stack report-toc-workspace">
                    <section class="research-card report-form-card report-toc-card">
                      <div class="research-card-head report-card-head">
                        <h3>目录结构</h3>
                        <button class="secondary-action compact" @click="addReportTocChapter">＋ 新增章</button>
                      </div>
                      <div class="report-toc-tree report-toc-outline">
                        <article v-for="toc in reportTocRootRows" :key="toc.id">
                          <div class="report-toc-row report-toc-row-chapter">
                            <span class="report-toc-index">{{ toc.num }}</span>
                            <input :value="toc.title" @input="updateReportTocTitle(toc.id, ($event.target as HTMLInputElement).value)" />
                            <div class="report-toc-actions">
                              <button title="新增内容" @click="addReportTocChild(toc.id, toc.depth)">＋</button>
                              <button title="删除章节" @click="removeReportTocNode(toc.id)">⌫</button>
                            </div>
                          </div>
                          <div class="report-toc-children">
                            <template v-for="child in reportTocChildRows(toc.children, toc.path)" :key="child.id">
                              <div class="report-toc-row report-toc-row-child">
                                <span class="report-toc-index">{{ child.num }}</span>
                                <input :value="child.title" @input="updateReportTocTitle(child.id, ($event.target as HTMLInputElement).value)" />
                                <div class="report-toc-actions">
                                  <button v-if="canAddReportTocChild(child.depth)" title="新增内容" @click="addReportTocChild(child.id, child.depth)">＋</button>
                                  <button title="删除内容" @click="removeReportTocChild(child.id)">×</button>
                                </div>
                              </div>
                              <div v-if="child.children.length" class="report-toc-children report-toc-children-deep">
                                <div
                                  v-for="grandchild in reportTocChildRows(child.children, child.path)"
                                  :key="grandchild.id"
                                  class="report-toc-row report-toc-row-leaf"
                                >
                                  <span class="report-toc-index">{{ grandchild.num }}</span>
                                  <input :value="grandchild.title" @input="updateReportTocTitle(grandchild.id, ($event.target as HTMLInputElement).value)" />
                                  <button title="删除条目" @click="removeReportTocChild(grandchild.id)">×</button>
                                </div>
                              </div>
                            </template>
                          </div>
                        </article>
                      </div>
                    </section>
                  </section>
                </div>
              </template>

              <template v-else-if="currentReportView === 'generating'">
                <section class="research-card report-generating-card">
                  <div class="report-loading-mark">AI</div>
                  <h3>正在生成产业调研报告</h3>
                  <p>正在整合产业布局、岗位画像、招聘需求、新技术预判、目录结构与维度配置。</p>
                  <div class="report-loading-bar"><span></span></div>
                </section>
              </template>

              <template v-else-if="currentReportView === 'editor'">
                <div class="report-toolbar">
                  <button class="secondary-action" @click="currentReportView = 'create'">‹ 返回配置</button>
                  <button class="primary-action compact" @click="saveReport">保存</button>
                  <button class="secondary-action" @click="printReportPdf">导出 PDF</button>
                </div>
                <section class="research-card">
                  <div class="research-card-head"><h3>报告预览</h3><span>点击正文可直接编辑，保存后可导出 PDF</span></div>
                  <div
                    ref="reportEditableRef"
                    class="report-preview-doc full editable"
                    contenteditable="true"
                    @blur="updateReportEditorContent"
                    v-html="reportEditorContent"
                  ></div>
                  <p class="report-editor-meta">字数统计：{{ reportEditorContent.length }} 字 ｜ 最后保存：{{ reportLastSaveTime }}</p>
                </section>
              </template>

              <template v-else>
                <div class="report-toolbar">
                  <button class="secondary-action" @click="currentReportView = 'editor'">‹ 返回编辑</button>
                  <button class="primary-action compact" @click="printReportPdf">确认下载 PDF</button>
                  <button class="secondary-action" @click="exportReportAds">导出 ADS</button>
                </div>
                <section class="research-card">
                  <div class="research-card-head"><h3>报告预览（PDF 版式）</h3><span>{{ activeReport?.title }}</span></div>
                  <div class="report-preview-doc full" v-html="reportEditorContent"></div>
                </section>
              </template>
            </div>

            <div v-else-if="!selectedJob" class="job-page">
            <header class="job-toolbar">
              <div class="ai-summary">
                <div class="summary-icon">AI</div>
                <div>
                  <h2>岗位中心智能总结</h2>
                  <p v-if="hasBuildData">
                    {{ AI_JOB_CENTER_SUMMARY.text }} 已搭建
                    <strong>{{ jobCardsForBuild.length }}</strong>
                    个岗位，梳理
                    <strong>{{ totalTasks }}</strong>
                    项典型工作任务，沉淀
                    <strong>{{ totalAbilities }}</strong>
                    个岗位能力点。
                  </p>
                  <p v-else>
                    当前岗位建设中心暂无岗位数据。可通过添加岗位、模版导入或AI建岗完成初始化，导入后将自动生成产业岗位课程图谱与岗位列表。
                  </p>
                </div>
              </div>

              <div class="job-actions">
                <button class="secondary-action" @click="openAddJobDialog">＋ 添加岗位</button>
                <button class="primary-action compact">AI建岗</button>
              </div>
            </header>

            <template v-if="hasBuildData">
            <section class="graph-panel">
              <div class="panel-title-row" :class="{ 'graph-ability-title-row': selectedGraphJobId }">
                <template v-if="selectedGraphJobId">
                  <button
                    type="button"
                    class="graph-back-button light"
                    @click="closeGraphAbility"
                  >
                    返回产业图谱
                  </button>
                  <h3>{{ selectedGraphAbilityTitle }}</h3>
                </template>
                <template v-else>
                  <h3>产业岗位课程图谱</h3>
                  <span>智能建造工程专业课程与岗位、产业节点、产业链关系</span>
                </template>
              </div>

              <div class="graph-board">
                <div v-if="!selectedGraphJobId" class="graph-headings">
                  <div>
                    <span>产业链</span>
                    <strong>{{ INDUSTRY_CHAINS.length }}</strong>
                  </div>
                  <div>
                    <span>产业节点</span>
                    <strong>{{ INDUSTRY_NODES.length }}</strong>
                  </div>
                  <div>
                    <span>岗位群 / 岗位</span>
                    <strong>{{ graphLayout.jobGroups.length }} / {{ jobCardsForBuild.length }}</strong>
                  </div>
                  <div>
                    <span>课程</span>
                    <strong>{{ graphLayout.courses.length }}</strong>
                  </div>
                </div>
                <div v-else class="graph-ability-headings light">
                  <div>产业信息</div>
                  <div>岗位</div>
                  <div>典型工作任务</div>
                  <div>能力项</div>
                </div>

                <div v-if="selectedGraphJobId" class="graph-ability-view light">
                  <div class="graph-ability-summary graph-ability-industry-node">
                    <span>产业信息</span>
                    <strong>{{ selectedGraphChain?.name ?? '智能建造产业链' }}</strong>
                    <p>{{ selectedGraphIndustry?.name ?? 'BIM协同设计与算量平台' }}</p>
                    <div>
                      <em>{{ selectedGraphIndustryJobs.length }} 个相关岗位</em>
                      <em>{{ selectedGraphIndustryCourseCount }} 门关联课程</em>
                    </div>
                  </div>

                  <div ref="graphAbilityMapRef" class="graph-ability-map">
                    <svg
                      class="graph-ability-lines"
                      :viewBox="`0 0 ${graphAbilityMapBox.width} ${graphAbilityMapBox.height}`"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        v-for="link in graphAbilityLinePaths"
                        :key="link.key"
                        :d="link.d"
                        class="graph-ability-link active"
                      />
                    </svg>

                    <div class="graph-ability-job-node">
                      <span>岗位</span>
                      <strong>{{ selectedGraphJob?.name ?? '岗位' }}</strong>
                      <p>{{ selectedGraphJobDetail.salaryRange }} · {{ selectedGraphJobDetail.education }}</p>
                    </div>

                    <div class="graph-ability-tasks">
                      <button
                        v-for="(task, index) in selectedGraphJobTasks"
                        :key="`${task.name}-${index}`"
                        type="button"
                        :data-graph-map-task-index="index"
                        :class="{ active: activeGraphTaskIndex === index }"
                        @click="selectGraphAbilityTask(index)"
                      >
                        <span>任务 {{ index + 1 }}</span>
                        <strong>{{ task.name }}</strong>
                      </button>
                    </div>

                    <div class="graph-ability-columns">
                      <section v-for="group in graphAbilityGroups" :key="group.category">
                        <h4>{{ group.category }}</h4>
                        <p
                          v-for="ability in group.abilities"
                          :key="ability.name"
                          :data-graph-map-ability="ability.name"
                          :class="{
                            active: activeGraphAbilityNames.has(ability.name),
                            dimmed: !activeGraphAbilityNames.has(ability.name)
                          }"
                        >
                          {{ ability.name }}
                        </p>
                      </section>
                    </div>
                  </div>
                </div>

                <div v-else class="graph-canvas" ref="graphCanvasRef" :style="{ height: `${graphLayout.canvasHeight}px` }">
                  <svg class="graph-lines" :viewBox="graphLineViewBox" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      v-for="link in graphMeasuredLinks"
                      :key="link.key"
                      :d="link.d"
                      class="graph-link"
                      :class="{
                        active: hoverKey !== '' && activeGraphLinkKeys.has(link.key),
                        dimmed: hoverKey !== '' && !activeGraphLinkKeys.has(link.key)
                      }"
                    />
                  </svg>

                  <button
                    v-for="chain in graphLayout.chains"
                    :key="chain.key"
                    class="graph-entity chain-node"
                    :class="{ active: isGraphActive(chain.key), dimmed: isGraphDimmed(chain.key) }"
                    :style="graphNodeStyle(graphColumns.chain.left, graphColumns.chain.width, chain.top)"
                    :data-graph-key="chain.key"
                    @mouseenter="hoverKey = chain.key"
                    @mouseleave="hoverKey = ''"
                    @focus="hoverKey = chain.key"
                    @blur="hoverKey = ''"
                    @click.stop="hoverKey = chain.key"
                  >
                    <span>{{ chain.name }}</span>
                  </button>

                  <button
                    v-for="industry in graphLayout.industries"
                    :key="industry.key"
                    class="graph-entity industry-node"
                    :class="{ active: isGraphActive(industry.key), dimmed: isGraphDimmed(industry.key) }"
                    :style="graphNodeStyle(graphColumns.industry.left, graphColumns.industry.width, industry.top)"
                    :data-graph-key="industry.key"
                    @mouseenter="hoverKey = industry.key"
                    @mouseleave="hoverKey = ''"
                    @focus="hoverKey = industry.key"
                    @blur="hoverKey = ''"
                    @click.stop="hoverKey = industry.key"
                  >
                    <span>{{ industry.name }}</span>
                  </button>

                  <div class="graph-job-groups">
                    <div
                      v-for="group in graphLayout.jobGroups"
                      :key="group.key"
                      :class="['graph-job-group', `group-accent-${group.tone}`]"
                      :style="graphGroupStyle(graphColumns.job.left, graphColumns.job.width, group.top, group.height)"
                    >
                      <div class="graph-job-group-header">
                        <span class="graph-job-group-title">{{ group.name }}</span>
                        <em>{{ group.count }}个岗位</em>
                      </div>
                      <div class="graph-job-group-jobs">
                        <button
                          v-for="job in group.jobs"
                          :key="job.key"
                          class="graph-entity job-node graph-group-job"
                          :class="{ active: isGraphActive(job.key), dimmed: isGraphDimmed(job.key) }"
                          :data-graph-key="job.key"
                          :data-graph-job="job.id"
                          @mouseenter="hoverKey = job.key"
                          @mouseleave="hoverKey = ''"
                          @focus="hoverKey = job.key"
                          @blur="hoverKey = ''"
                          @click.stop="openGraphAbility(job.id)"
                        >
                          <span>{{ job.name }}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    v-for="course in graphLayout.courses"
                    :key="course.key"
                    class="graph-entity course-node"
                    :class="{ active: isGraphActive(course.key), dimmed: isGraphDimmed(course.key) }"
                    :style="graphNodeStyle(graphColumns.course.left, graphColumns.course.width, course.top)"
                    :data-graph-key="course.key"
                    @mouseenter="hoverKey = course.key"
                    @mouseleave="hoverKey = ''"
                    @focus="hoverKey = course.key"
                    @blur="hoverKey = ''"
                    @click.stop="hoverKey = course.key"
                  >
                    <span>{{ course.name }}</span>
                  </button>
                </div>
              </div>
            </section>

            <section class="job-list-panel">
              <div class="panel-title-row">
                <h3>岗位列表</h3>
                <span>点击岗位卡片进入岗位编辑，可删除岗位取消专业关联</span>
              </div>

              <div class="job-grid">
                <article
                  v-for="job in jobCardsForBuild"
                  :key="job.id"
                  class="job-card"
                  role="button"
                  tabindex="0"
                  @click="openJobDetail(job.id)"
                  @keydown.enter="openJobDetail(job.id)"
                  @keydown.space.prevent="openJobDetail(job.id)"
                >
                  <button
                    class="job-delete-button"
                    :aria-label="`删除${job.name}`"
                    @click.stop="removeJobFromBuild(job.id)"
                  >
                    删除
                  </button>
                  <div class="job-card-head">
                    <h4>{{ job.name }}</h4>
                    <span>{{ job.groupName }}</span>
                  </div>
                  <div class="job-metrics">
                    <div>
                      <strong>{{ taskCountForJob(job) }}</strong>
                      <span>典型任务</span>
                    </div>
                    <div>
                      <strong>{{ job.abilityCount }}</strong>
                      <span>岗位能力</span>
                    </div>
                  </div>
                  <p
                    class="occupation-code"
                    :data-tooltip="`所属职业：${job.occupation}（${job.occupationCode}）`"
                  >
                    <span>所属职业：{{ job.occupation }}（{{ job.occupationCode }}）</span>
                  </p>
                </article>
              </div>
            </section>
            </template>

            <section v-else class="job-init-panel">
              <div class="job-init-visual">
                <span>AI</span>
                <i></i>
              </div>
              <h3>暂无岗位建设数据</h3>
              <p>
                当前专业尚未初始化岗位、典型工作任务、岗位能力项与课程关系。可先添加岗位，或通过模版导入载入智能建造工程专业示例数据。
              </p>
              <div class="job-init-actions">
                <button class="secondary-action" @click="openAddJobDialog">＋ 添加岗位</button>
                <button class="primary-action compact" @click="importTemplateJobs">模版导入</button>
              </div>
              <div class="job-init-steps">
                <article>
                  <strong>1</strong>
                  <span>导入岗位模板</span>
                  <p>生成产业链、产业节点、岗位和课程关系。</p>
                </article>
                <article>
                  <strong>2</strong>
                  <span>维护岗位详情</span>
                  <p>补充任务、能力项、证书与企业信息。</p>
                </article>
                <article>
                  <strong>3</strong>
                  <span>形成建设图谱</span>
                  <p>用于后续课程体系和人才培养方案联动。</p>
                </article>
              </div>
            </section>
          </div>

            <div v-else class="detail-page">
            <header class="detail-header">
              <button class="back-button" @click="backToJobCenter">‹</button>
              <div>
                <h2>{{ selectedJob.name }}</h2>
              </div>
            </header>

            <div class="detail-layout">
              <aside class="detail-tabs">
                <h3>岗位详情</h3>
                <button
                  v-for="tab in detailTabs"
                  :key="tab.key"
                  :class="{ active: activeDetailTab === tab.key }"
                  @click="activeDetailTab = tab.key"
                >
                  {{ tab.label }}
                </button>
              </aside>

              <section class="detail-content">
                <div v-if="activeDetailTab === 'basic'" class="detail-section">
                  <div class="section-head">
                    <h3>基本信息</h3>
                    <div class="head-actions">
                      <button class="ai-fill-button">✦ AI补全</button>
                      <button class="secondary-action" @click="openBasicInfoDialog">编辑基本信息</button>
                    </div>
                  </div>
                  <div class="info-grid">
                    <div><span>岗位名称</span><strong>{{ displayBasicValue(selectedJob.name) }}</strong></div>
                    <div><span>所属职业</span><strong>{{ displayBasicValue(selectedJob.occupation) }}</strong></div>
                    <div><span>职业编码</span><strong>{{ displayBasicValue(selectedJob.occupationCode) }}</strong></div>
                    <div><span>岗位层级</span><strong>{{ displayBasicValue(selectedJobLevel) }}</strong></div>
                    <div><span>岗位所属产业链-产业</span><strong>{{ displayBasicValue(selectedJobChainIndustry) }}</strong></div>
                    <div><span>岗位关联企业</span><strong>{{ displayBasicValue(selectedJobDetail.relatedCompanies) }}</strong></div>
                    <div><span>所属岗位群</span><strong>{{ displayBasicValue(selectedJob.groupName) }}</strong></div>
                    <div><span>薪资范围</span><strong>{{ displayBasicValue(selectedJobDetail.salaryRange) }}</strong></div>
                    <div><span>需求等级</span><strong>{{ displayBasicValue(selectedJobDetail.demandLevel) }}</strong></div>
                    <div><span>需求量</span><strong>{{ displayBasicValue(selectedJobDetail.demandVolume) }}</strong></div>
                    <div><span>学历要求</span><strong>{{ displayBasicValue(selectedJobDetail.education) }}</strong></div>
                    <div><span>经验要求</span><strong>{{ displayBasicValue(selectedJobDetail.experience) }}</strong></div>
                  </div>
                  <div class="rich-block course-link-block">
                    <div class="course-link-head">
                      <h4>关联课程</h4>
                      <button class="secondary-action" @click="openCourseDialog">＋ 增加课程</button>
                    </div>
                    <p class="course-link-note">关联课程将同步展示到产业岗位课程图谱中，可按岗位建设需要增删维护。</p>
                    <div v-if="selectedJobCourses.length > 0" class="course-relation-list">
                      <article v-for="course in selectedJobCourses" :key="course.id">
                        <div>
                          <strong>{{ course.name }}</strong>
                          <span>课程编码：{{ course.id }}</span>
                        </div>
                        <button @click="removeSelectedJobCourse(course.id)">删除</button>
                      </article>
                    </div>
                    <p v-if="selectedJobCourseIds.length === 0" class="course-empty-tip">
                      暂无关联课程，请点击“增加课程”进行关联。
                    </p>
                  </div>
                  <div class="rich-block">
                    <h4>职业发展路径</h4>
                    <p>{{ displayBasicValue(selectedJobDetail.careerPath) }}</p>
                  </div>
                  <div class="rich-block">
                    <h4>工作内容概述</h4>
                    <p>{{ displayBasicValue(selectedJobDetail.workSummary) }}</p>
                  </div>
                  <div class="rich-block">
                    <h4>任职条件</h4>
                    <p>{{ displayBasicValue(selectedJobDetail.requirements) }}</p>
                  </div>
                </div>

                <div v-else-if="activeDetailTab === 'tasks'" class="detail-section">
                  <div class="section-head">
                    <h3>典型工作任务</h3>
                    <div class="head-actions">
                      <button class="secondary-action">✦ AI生成</button>
                      <button class="primary-action compact" @click="openNewTaskDialog">手动添加</button>
                    </div>
                  </div>
                  <input class="detail-search" placeholder="输入名称搜索" />
                  <div class="task-list">
                    <article
                      v-for="(task, index) in selectedJobTasks"
                      :key="`${task.name}-${index}`"
                      class="task-item"
                    >
                      <div>
                        <h4>{{ task.name }}</h4>
                        <p>{{ task.description }}</p>
                        <div class="tags">
                          <span v-for="ability in task.abilities" :key="ability">{{ ability }}</span>
                        </div>
                      </div>
                      <div class="row-actions">
                        <button
                          type="button"
                          class="text-action danger"
                          aria-label="删除典型工作任务"
                          @click.stop="deleteJobTask(index)"
                        >
                          删除
                        </button>
                        <button
                          type="button"
                          class="text-action"
                          aria-label="编辑典型工作任务"
                          @click.stop="openTaskDialog(task, index)"
                        >
                          编辑
                        </button>
                      </div>
                    </article>
                  </div>
                </div>

                <div v-else-if="activeDetailTab === 'abilities'" class="detail-section">
                  <div class="section-head">
                    <h3>能力项列表 <em>{{ selectedJobDetail.abilities.length }}</em></h3>
                    <div class="head-actions">
                      <button class="secondary-action" @click="openAbilityImportDialog">模版导入</button>
                    </div>
                  </div>
                  <input class="detail-search" placeholder="输入能力项名称进行搜索" />
                  <table class="detail-table">
                    <thead>
                      <tr>
                        <th>能力项名称</th>
                        <th>能力类别</th>
                        <th>能力项定义</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="ability in selectedJobDetail.abilities" :key="ability.name">
                        <td>{{ ability.name }}</td>
                        <td>{{ ability.category }}</td>
                        <td>{{ ability.definition }}</td>
                        <td>
                          <button class="link-action action-button" type="button" @click.stop="openAbilityDialog(ability)">编辑</button>
                          <button class="danger-action action-button" type="button" @click="requestDeleteAbility(ability.name)">删除</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else-if="activeDetailTab === 'map'" class="detail-section">
                  <h3>岗位能力图谱</h3>
                  <div class="ability-map">
                    <div class="map-center">
                      <strong>{{ selectedJob.name }}</strong>
                      <span>{{ selectedJobDetail.salaryRange }}</span>
                      <small>{{ selectedJobDetail.education }}　需求量 {{ selectedJobDetail.demandVolume }}</small>
                    </div>

                    <div ref="abilityMapGraphRef" class="ability-map-graph">
                      <svg
                        class="ability-map-lines"
                        :viewBox="`0 0 ${abilityMapBox.width} ${abilityMapBox.height}`"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          v-for="link in abilityLinePaths"
                          :key="link.key"
                          :d="link.d"
                          class="ability-map-link"
                          :class="{ active: true }"
                        />
                      </svg>

                      <div class="map-tasks">
                        <button
                          v-for="(task, index) in selectedJobTasks"
                          :key="task.name"
                          :data-map-task-index="index"
                          :class="{ active: activeMapTaskIndex === index }"
                          @click="activeMapTaskIndex = index"
                        >
                          <span>任务 {{ index + 1 }}</span>
                          <strong>{{ task.name }}</strong>
                        </button>
                      </div>

                      <div class="ability-columns map-ability-columns">
                        <section
                          v-for="group in groupedAbilities"
                          :key="group.category"
                        >
                          <h4>{{ group.category }}</h4>
                          <p
                            v-for="ability in group.abilities"
                            :key="ability.name"
                            :data-map-ability="ability.name"
                            :class="{
                              active: activeAbilityNames.has(ability.name),
                              dimmed: !activeAbilityNames.has(ability.name)
                            }"
                          >
                            {{ ability.name }}
                          </p>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="detail-section">
                  <div class="section-head">
                    <h3>适岗度评价要求</h3>
                    <button class="primary-action compact">编辑</button>
                  </div>
                  <div class="suitability-layout">
                    <div class="radar-card">
                      <h4>岗位基准画像</h4>
                      <div class="radar-visual">
                        <svg viewBox="0 0 300 300" aria-label="岗位基准画像雷达图">
                          <polygon
                            v-for="polygon in radarGridPolygons"
                            :key="polygon"
                            :points="polygon"
                            class="radar-grid-polygon"
                          />
                          <line
                            v-for="(axis, index) in radarAxes"
                            :key="index"
                            :x1="axis.x1"
                            :y1="axis.y1"
                            :x2="axis.x"
                            :y2="axis.y"
                            class="radar-axis"
                          />
                          <polygon :points="radarPolygon" class="radar-value-polygon" />
                          <circle
                            v-for="(domain, index) in selectedJobDetail.suitability"
                            :key="domain.name"
                            :cx="radarPoint(index, domain.score / 100).x"
                            :cy="radarPoint(index, domain.score / 100).y"
                            r="4"
                            class="radar-dot"
                          />
                        </svg>
                        <span
                          v-for="(domain, index) in selectedJobDetail.suitability"
                          :key="domain.name"
                          :style="radarLabelStyle(index)"
                        >
                          {{ domain.name }}
                        </span>
                      </div>
                      <p>适岗度计算综合岗位能力掌握程度、目标掌握程度与能力域权重。</p>
                    </div>
                    <div class="domain-list">
                      <article v-for="domain in selectedJobDetail.suitability" :key="domain.name">
                        <h4>{{ domain.name }}</h4>
                        <span>查看关联能力项 ›</span>
                        <p>岗位基准要求 <strong>{{ domain.score }}</strong></p>
                        <p>权重 <strong>{{ domain.weight }}</strong>%</p>
                      </article>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
          </section>
        </template>
      </div>
    </section>

    <div
      v-if="courseAbilityDialogOpen"
      class="dialog-backdrop"
      @click.self="closeCourseAbilityDialog"
    >
      <section class="course-ability-dialog" role="dialog" aria-modal="true" aria-labelledby="course-ability-dialog-title">
        <header class="dialog-header">
          <div>
            <span>课程模型 / 岗位能力</span>
            <h2 id="course-ability-dialog-title">关联岗位能力</h2>
          </div>
          <button class="dialog-close" type="button" aria-label="关闭岗位能力关联弹窗" @click="closeCourseAbilityDialog">×</button>
        </header>
        <div class="course-ability-dialog-body">
          <aside class="course-ability-job-panel">
            <div class="add-job-search course-ability-search">
              <span>⌕</span>
              <input v-model="courseAbilityJobSearch" placeholder="搜索岗位名称、产业链或能力关键词" />
            </div>
            <div class="course-ability-job-list">
              <button
                v-for="job in filteredCourseJobAbilityOptions"
                :key="job.id"
                type="button"
                :class="{ active: selectedCourseAbilityJobId === job.id }"
                @click="pickCourseAbilityJob(job.id)"
              >
                <strong>{{ job.name }}</strong>
                <span>{{ job.chain }} / {{ job.node }}</span>
              </button>
              <p v-if="filteredCourseJobAbilityOptions.length === 0">未找到匹配岗位</p>
            </div>
          </aside>
          <div :key="courseAbilityPickerKey" class="course-ability-picker-panel">
            <template v-if="selectedCourseAbilityJobOption">
              <header>
                <h4>{{ selectedCourseAbilityJobOption.name }}</h4>
                <p>{{ selectedCourseAbilityJobOption.chain }} / {{ selectedCourseAbilityJobOption.node }}</p>
              </header>
              <div class="course-ability-picker-groups">
                <section v-for="category in courseAbilityCategories" :key="category">
                  <h5>{{ category }}</h5>
                  <label
                    v-for="ability in selectedCourseAbilityJobOption.abilities[category]"
                    :key="ability"
                    class="course-ability-choice"
                  >
                    <input
                      type="checkbox"
                      :checked="courseAbilityDraft[category].includes(ability)"
                      @change="toggleCourseAbilityDraftItem(category, ability)"
                    />
                    <span>{{ ability }}</span>
                  </label>
                </section>
              </div>
            </template>
            <p v-else class="course-ability-picker-empty">请先在左侧选择岗位</p>
          </div>
        </div>
        <footer class="dialog-footer">
          <span class="course-ability-selected-count">已选 {{ courseAbilityTotalDraftCount }} 项能力</span>
          <div>
            <button class="secondary-action" type="button" @click="closeCourseAbilityDialog">取消</button>
            <button
              class="primary-action compact"
              type="button"
              :disabled="!selectedCourseAbilityJobOption || courseAbilityTotalDraftCount === 0"
              @click="saveCourseAbilityRelations"
            >
              确认关联
            </button>
          </div>
        </footer>
      </section>
    </div>

    <div
      v-if="courseMemberDialogOpen"
      class="dialog-backdrop course-member-dialog-backdrop"
      @click.self="closeCourseMemberDialog"
    >
      <section class="course-member-dialog" role="dialog" aria-modal="true" aria-label="课程成员管理">
        <header class="course-member-dialog-header">
          <div class="course-member-dialog-tabs" role="tablist" aria-label="成员管理标签">
            <button
              type="button"
              role="tab"
              :aria-selected="courseMemberDialogTab === 'members'"
              :class="{ active: courseMemberDialogTab === 'members' }"
              @click="courseMemberDialogTab = 'members'"
            >
              成员列表
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="courseMemberDialogTab === 'roles'"
              :class="{ active: courseMemberDialogTab === 'roles' }"
              @click="courseMemberDialogTab = 'roles'"
            >
              角色列表
            </button>
          </div>
          <button class="course-member-dialog-close" type="button" aria-label="关闭成员弹窗" @click="closeCourseMemberDialog">
            ×
          </button>
        </header>

        <section v-if="courseMemberDialogTab === 'members'" class="course-member-panel">
          <div class="course-member-toolbar">
            <p><strong>AI成员</strong><span>共{{ courseMemberRows.length }}人</span></p>
            <button type="button" class="course-member-add-button">
              <span>＋</span>
              新增成员
            </button>
          </div>
          <div class="course-member-table-wrap">
            <table class="course-member-table">
              <thead>
                <tr>
                  <th>工号/学号</th>
                  <th>姓名</th>
                  <th>所属学院</th>
                  <th>角色</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in courseMemberRows" :key="member.account">
                  <td>{{ member.account }}</td>
                  <td>{{ member.name }}</td>
                  <td>{{ member.college }}</td>
                  <td>
                    <span>{{ member.role }}</span>
                    <em v-if="member.system" class="course-member-system-tag">系统</em>
                  </td>
                  <td class="course-member-actions">
                    <a>编辑</a>
                    <a>删除</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else class="course-role-panel">
          <div class="course-role-layout">
            <aside class="course-role-sidebar">
              <div class="course-role-group">
                <h4>系统角色</h4>
                <button
                  v-for="role in courseSystemRoles"
                  :key="role"
                  type="button"
                  class="course-role-item"
                  :class="{ active: selectedCourseRoleName === role }"
                  @click="selectedCourseRoleName = role"
                >
                  <span>{{ role }}</span>
                  <em>⋮</em>
                </button>
              </div>
              <div class="course-role-group">
                <h4>自定义角色</h4>
                <button
                  v-for="role in courseCustomRoles"
                  :key="role"
                  type="button"
                  class="course-role-item"
                  :class="{ active: selectedCourseRoleName === role }"
                  @click="selectedCourseRoleName = role"
                >
                  <span>{{ role }}</span>
                  <em>⋮</em>
                </button>
              </div>
              <button type="button" class="course-role-add-button">＋ 添加角色</button>
            </aside>

            <div class="course-role-content">
              <h3>{{ selectedCourseRoleName }}</h3>
              <div class="course-role-table-wrap">
                <table class="course-role-table">
                  <thead>
                    <tr>
                      <th>一级菜单</th>
                      <th>二级菜单</th>
                      <th>查看</th>
                      <th>管理 <span class="course-role-head-hint">?</span></th>
                      <th>下载</th>
                      <th>权限数据范围说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, index) in courseRolePermissionRenderRows" :key="`${row.firstMenu}-${row.secondMenu}-${index}`">
                      <td v-if="row.showFirstMenu" :rowspan="row.firstMenuRowspan">{{ row.firstMenu }}</td>
                      <td>{{ row.secondMenu }}</td>
                      <td>
                        <span class="course-permission-chip" :class="`is-${row.view}`">
                          {{ coursePermissionText(row.view) }}
                        </span>
                      </td>
                      <td>
                        <span class="course-permission-chip" :class="`is-${row.manage}`">
                          {{ coursePermissionText(row.manage) }}
                        </span>
                      </td>
                      <td>
                        <span class="course-permission-chip" :class="`is-${row.download}`">
                          {{ coursePermissionText(row.download) }}
                        </span>
                      </td>
                      <td>{{ row.scope }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>

    <div v-if="cultivateCreateDialogOpen" class="dialog-backdrop" @click.self="closeCultivateGoalDialog">
      <section class="cultivate-create-dialog" role="dialog" aria-modal="true" aria-labelledby="cultivate-create-title">
        <header class="dialog-header">
          <div>
            <span>人才方案管理 / 培养目标</span>
            <h2 id="cultivate-create-title">创建培养目标</h2>
          </div>
          <button class="dialog-close" aria-label="关闭创建培养目标弹窗" @click="closeCultivateGoalDialog">×</button>
        </header>

        <div class="cultivate-create-body">
          <button class="create-mode-card import-mode" @click="triggerCultivateImport">
            <span class="mode-icon">AI</span>
            <strong>智能导入</strong>
            <em>上传已有方案、专业标准或Word/PDF文件，系统自动识别并生成培养目标草稿。</em>
          </button>
          <button class="create-mode-card manual-mode" @click="startManualCultivateEntry">
            <span class="mode-icon">✎</span>
            <strong>手工录入</strong>
            <em>进入空白录入流程，手动填写培养目标、毕业要求与相关说明。</em>
          </button>
        </div>

        <p v-if="selectedCultivateFileName" class="selected-file-tip">
          已选择文件：{{ selectedCultivateFileName }}
        </p>
        <input
          ref="cultivateFileInput"
          class="visually-hidden-file"
          type="file"
          accept=".doc,.docx,.pdf,.xls,.xlsx"
          @change="handleCultivateFileChange"
        />
      </section>
    </div>

    <div v-if="addJobDialogOpen" class="dialog-backdrop" @click.self="closeAddJobDialog">
      <section class="add-job-dialog" role="dialog" aria-modal="true" aria-labelledby="add-job-title">
        <header class="dialog-header">
          <div>
            <span>产业调研 / 岗位分析</span>
            <h2 id="add-job-title">添加岗位</h2>
          </div>
          <button class="dialog-close" aria-label="关闭添加岗位弹窗" @click="closeAddJobDialog">×</button>
        </header>

        <div class="template-import-strip">
          <div>
            <strong>模版导入</strong>
            <p>一键导入智能建造工程专业岗位建设示例数据，展示完整岗位图谱、岗位列表与详情内容。</p>
          </div>
          <button class="primary-action compact" @click="importTemplateJobs">模版导入</button>
        </div>

        <div class="add-job-search">
          <span>⌕</span>
          <input
            v-model="addJobSearch"
            placeholder="搜索岗位名称、职业编码、产业节点或能力关键词"
          />
        </div>

        <div class="candidate-summary">
          <p>从产业调研沉淀的岗位中选择，添加后进入岗位建设中心继续维护任务、能力与课程关系。</p>
          <strong>已选 {{ selectedAddCount }} 个</strong>
        </div>

        <div class="candidate-list">
          <button
            v-for="candidate in filteredJobCandidates"
            :key="candidate.id"
            class="candidate-card"
            :class="{
              selected: isCandidateSelected(candidate.id),
              disabled: existingJobIds.has(candidate.id)
            }"
            :disabled="existingJobIds.has(candidate.id)"
            @click="toggleCandidate(candidate)"
          >
            <span class="candidate-check">
              {{ existingJobIds.has(candidate.id) || isCandidateSelected(candidate.id) ? '✓' : '' }}
            </span>
            <div class="candidate-main">
              <h3>{{ candidate.name }}</h3>
              <p>{{ candidate.chain }} / {{ candidate.industryNode }}</p>
              <div class="candidate-tags">
                <span>{{ candidate.groupName }}</span>
                <span>职业编码：{{ candidate.occupationCode }}</span>
                <span>{{ candidate.salary }}</span>
                <span>需求量 {{ candidate.demand }}</span>
              </div>
            </div>
            <em>{{ existingJobIds.has(candidate.id) ? '已添加' : '可添加' }}</em>
          </button>
        </div>

        <footer class="dialog-footer">
          <button class="secondary-action" @click="closeAddJobDialog">取消</button>
          <button class="primary-action compact" :disabled="selectedAddCount === 0" @click="addSelectedJobs">
            添加到岗位建设中心
          </button>
        </footer>
      </section>
    </div>

    <div
      v-if="basicInfoDialogOpen && selectedJob"
      class="dialog-backdrop"
      @click.self="closeBasicInfoDialog"
    >
      <section class="job-basic-dialog" role="dialog" aria-modal="true" aria-labelledby="job-basic-dialog-title">
        <header class="dialog-header">
          <div>
            <span>岗位详情 / 基本信息</span>
            <h2 id="job-basic-dialog-title">编辑基本信息</h2>
          </div>
          <button class="dialog-close" aria-label="关闭编辑基本信息弹窗" @click="closeBasicInfoDialog">×</button>
        </header>

        <div class="job-basic-dialog-body">
          <section class="job-basic-form-card">
            <h3>基础字段</h3>
            <div class="job-basic-form-grid">
              <label class="task-form-field required">
                <span>岗位名称</span>
                <input v-model="basicInfoForm.name" maxlength="30" placeholder="请输入岗位名称" />
                <em>{{ basicInfoForm.name.length }}/30</em>
              </label>
              <label class="task-form-field required">
                <span>所属职业</span>
                <input v-model="basicInfoForm.occupation" maxlength="40" placeholder="请输入或选择所属职业" />
                <em>{{ basicInfoForm.occupation.length }}/40</em>
              </label>
              <label class="task-form-field required">
                <span>职业编码</span>
                <input
                  v-model="basicInfoForm.occupationCode"
                  maxlength="20"
                  placeholder="如：2-02-10-09"
                />
                <em>仅支持数字和短横线</em>
              </label>
              <label class="task-form-field">
                <span>岗位层级</span>
                <select v-model="basicInfoForm.level">
                  <option>初级 / 中级</option>
                  <option>中级 / 高级</option>
                  <option>高级</option>
                  <option>不限</option>
                </select>
              </label>
              <label class="task-form-field wide">
                <span>岗位所属产业链-产业</span>
                <input v-model="basicInfoForm.chainIndustry" maxlength="60" placeholder="请输入产业链与产业节点" />
                <em>{{ basicInfoForm.chainIndustry.length }}/60</em>
              </label>
              <label class="task-form-field">
                <span>所属岗位群</span>
                <input v-model="basicInfoForm.groupName" maxlength="30" placeholder="请输入岗位群" />
              </label>
              <label class="task-form-field wide">
                <span>岗位关联企业</span>
                <input v-model="basicInfoForm.relatedCompanies" maxlength="80" placeholder="多个企业可用顿号或逗号分隔" />
                <em>{{ basicInfoForm.relatedCompanies.length }}/80</em>
              </label>
              <label class="task-form-field">
                <span>薪资范围</span>
                <input v-model="basicInfoForm.salaryRange" maxlength="20" placeholder="如：10K-18K" />
              </label>
              <label class="task-form-field">
                <span>需求等级</span>
                <select v-model="basicInfoForm.demandLevel">
                  <option>高</option>
                  <option>中</option>
                  <option>低</option>
                  <option>待评估</option>
                </select>
              </label>
              <label class="task-form-field">
                <span>需求量</span>
                <input
                  v-model="basicInfoForm.demandVolume"
                  inputmode="numeric"
                  maxlength="12"
                  placeholder="请输入数字"
                  @input="normalizeDemandVolume"
                />
                <em>仅支持数字和逗号</em>
              </label>
              <label class="task-form-field">
                <span>学历要求</span>
                <select v-model="basicInfoForm.education">
                  <option>不限</option>
                  <option>中专及以上</option>
                  <option>大专及以上</option>
                  <option>本科及以上</option>
                  <option>硕士及以上</option>
                </select>
              </label>
              <label class="task-form-field">
                <span>经验要求</span>
                <select v-model="basicInfoForm.experience">
                  <option>不限</option>
                  <option>应届 / 经验不限</option>
                  <option>1年以内</option>
                  <option>1-3年</option>
                  <option>3-5年</option>
                  <option>5年以上</option>
                </select>
              </label>
            </div>
          </section>

          <section class="job-basic-form-card">
            <h3>岗位描述</h3>
            <div class="job-basic-form-grid single">
              <label class="task-form-field">
                <span>职业发展路径</span>
                <textarea v-model="basicInfoForm.careerPath" maxlength="200" placeholder="请输入职业发展路径"></textarea>
                <em>{{ basicInfoForm.careerPath.length }}/200</em>
              </label>
              <label class="task-form-field">
                <span>工作内容概述</span>
                <textarea v-model="basicInfoForm.workSummary" maxlength="200" placeholder="请输入工作内容概述"></textarea>
                <em>{{ basicInfoForm.workSummary.length }}/200</em>
              </label>
              <label class="task-form-field">
                <span>任职条件</span>
                <textarea v-model="basicInfoForm.requirements" maxlength="200" placeholder="请输入任职条件"></textarea>
                <em>{{ basicInfoForm.requirements.length }}/200</em>
              </label>
            </div>
          </section>
        </div>

        <footer class="dialog-footer">
          <span class="dialog-form-tip">必填项为空或职业编码格式不正确时无法保存。</span>
          <div>
            <button class="secondary-action" @click="closeBasicInfoDialog">取消</button>
            <button class="primary-action compact" :disabled="!basicInfoFormReady" @click="saveBasicInfo">
              保存基本信息
            </button>
          </div>
        </footer>
      </section>
    </div>

    <div
      v-if="courseDialogOpen && selectedJob"
      class="dialog-backdrop"
      @click.self="closeCourseDialog"
    >
      <section class="course-dialog" role="dialog" aria-modal="true" aria-labelledby="course-dialog-title">
        <header class="dialog-header">
          <div>
            <span>岗位详情 / 关联课程</span>
            <h2 id="course-dialog-title">增加关联课程</h2>
          </div>
          <button class="dialog-close" aria-label="关闭增加关联课程弹窗" @click="closeCourseDialog">×</button>
        </header>

        <div class="add-job-search">
          <span>⌕</span>
          <input v-model="courseSearch" placeholder="搜索课程名称或课程编码" />
        </div>

        <div class="course-candidate-list">
          <button
            v-for="course in filteredCourseCandidates"
            :key="course.id"
            :disabled="selectedJobCourseIds.includes(course.id)"
            :class="{ selected: selectedJobCourseIds.includes(course.id) }"
            @click="addSelectedJobCourse(course.id)"
          >
            <div>
              <strong>{{ course.name }}</strong>
              <span>课程编码：{{ course.id }}</span>
            </div>
            <em>{{ selectedJobCourseIds.includes(course.id) ? '已关联' : '添加' }}</em>
          </button>
        </div>

        <footer class="dialog-footer">
          <button class="secondary-action" @click="closeCourseDialog">关闭</button>
        </footer>
      </section>
    </div>

    <div
      v-if="taskDialogOpen && selectedJob"
      class="dialog-backdrop"
      @click.self="closeTaskDialog"
    >
      <section class="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <header class="dialog-header">
          <div>
            <span>岗位详情 / 典型工作任务</span>
            <h2 id="task-dialog-title">{{ taskDialogMode === 'edit' ? '编辑典型工作任务' : '添加典型工作任务' }}</h2>
          </div>
          <button class="dialog-close" aria-label="关闭添加典型工作任务弹窗" @click="closeTaskDialog">×</button>
        </header>

        <div v-if="taskDialogMode === 'create'" class="template-import-strip">
          <div>
            <strong>模版导入</strong>
            <p>导入当前岗位常见任务模板后，可继续修改任务名称、任务描述与关联能力项。</p>
          </div>
          <button class="primary-action compact" @click="importTaskTemplate">模版导入</button>
        </div>

        <div class="task-dialog-body">
          <label class="task-form-field">
            <span>任务名称</span>
            <input v-model="taskForm.name" placeholder="请输入典型工作任务名称" />
          </label>

          <label class="task-form-field">
            <span>任务描述</span>
            <textarea v-model="taskForm.description" placeholder="请输入任务详情、工作流程或交付要求"></textarea>
          </label>

          <label class="task-form-field">
            <span>关联能力项</span>
            <div class="task-ability-picker">
              <label
                v-for="ability in taskAbilityOptions"
                :key="ability.name"
                class="task-ability-choice"
              >
                <input
                  type="checkbox"
                  :checked="taskForm.abilities.includes(ability.name)"
                  @change="toggleTaskAbility(ability.name)"
                />
                <span>{{ ability.name }}</span>
                <em>{{ ability.category }}</em>
              </label>
            </div>
          </label>
        </div>

        <footer class="dialog-footer">
          <button class="secondary-action" @click="closeTaskDialog">取消</button>
          <button class="primary-action compact" :disabled="!taskFormReady" @click="saveManualTask">
            保存任务
          </button>
        </footer>
      </section>
    </div>

    <div
      v-if="abilityImportDialogOpen && selectedJob"
      class="dialog-backdrop"
      @click.self="closeAbilityImportDialog"
    >
      <section class="course-dialog ability-import-dialog" role="dialog" aria-modal="true" aria-labelledby="ability-import-title">
        <header class="dialog-header">
          <div>
            <span>岗位详情 / 岗位能力项</span>
            <h2 id="ability-import-title">模版导入</h2>
          </div>
          <button class="dialog-close" aria-label="关闭能力项导入弹窗" @click="closeAbilityImportDialog">×</button>
        </header>

        <div class="template-import-strip">
          <div>
            <strong>批量导入岗位能力项</strong>
            <p>支持 Excel 模板下载、填写上传，并可选择按“增量添加”或“覆盖现有”方式写入当前岗位能力项。</p>
          </div>
          <button class="secondary-action" @click="downloadAbilityTemplate">下载模板</button>
        </div>

        <div class="task-dialog-body ability-import-body">
          <section class="job-basic-form-card">
            <h3>1. 上传模板</h3>
            <label class="task-form-field">
              <span>模板文件</span>
              <input
                ref="abilityImportFileInput"
                class="visually-hidden-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                @change="handleAbilityImportFileChange"
              />
              <div class="ability-import-upload">
                <button class="secondary-action" type="button" @click="triggerAbilityImportFileSelect">选择文件</button>
                <p>支持 `.xlsx / .xls / .csv`，表头需包含：能力项名称、能力类别、能力项定义。</p>
              </div>
            </label>
            <p v-if="abilityImportFileName" class="selected-file-tip">已选择：{{ abilityImportFileName }}</p>
            <p v-if="abilityImportSummary" class="ability-import-summary">{{ abilityImportSummary }}</p>
            <ul v-if="abilityImportErrors.length" class="ability-import-errors">
              <li v-for="error in abilityImportErrors" :key="error">{{ error }}</li>
            </ul>
          </section>

          <section class="job-basic-form-card">
            <h3>2. 导入方式</h3>
            <div class="ability-import-mode-grid">
              <label class="ability-import-mode-card" :class="{ active: abilityImportMode === 'append' }">
                <input v-model="abilityImportMode" type="radio" value="append" />
                <div>
                  <strong>增量添加</strong>
                  <p>仅新增模板中的新能力项；若与现有能力项同名，将自动跳过，不影响原有内容。</p>
                </div>
              </label>
              <label class="ability-import-mode-card danger" :class="{ active: abilityImportMode === 'replace' }">
                <input v-model="abilityImportMode" type="radio" value="replace" />
                <div>
                  <strong>覆盖现有</strong>
                  <p>使用模板内容替换当前岗位全部能力项，请在确认模板完整后再执行。</p>
                </div>
              </label>
            </div>
          </section>
        </div>

        <footer class="dialog-footer">
          <p class="dialog-form-tip">当前岗位：{{ selectedJob.name }}</p>
          <div>
            <button class="secondary-action" @click="closeAbilityImportDialog">取消</button>
            <button class="primary-action compact" :disabled="!abilityImportReady" @click="applyAbilityImport">
              开始导入
            </button>
          </div>
        </footer>
      </section>
    </div>

    <div
      v-if="abilityEditDialogOpen && selectedJob"
      class="dialog-backdrop"
      @click.self="closeAbilityDialog"
    >
      <section class="course-dialog ability-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="ability-edit-title">
        <header class="dialog-header">
          <div>
            <span>岗位详情 / 岗位能力项</span>
            <h2 id="ability-edit-title">编辑能力项</h2>
          </div>
          <button class="dialog-close" aria-label="关闭编辑能力项弹窗" @click="closeAbilityDialog">×</button>
        </header>

        <div class="task-dialog-body">
          <section class="job-basic-form-card">
            <div class="job-basic-form-grid single">
              <label class="task-form-field required">
                <span>能力项名称</span>
                <input v-model="abilityForm.name" maxlength="30" placeholder="请输入能力项名称" />
                <em v-if="abilityEditDuplicateName" class="field-error-text">当前岗位下已存在同名能力项，请调整名称。</em>
              </label>

              <label class="task-form-field required">
                <span>能力类别</span>
                <select v-model="abilityForm.category">
                  <option v-for="option in abilityCategoryOptions" :key="option" :value="option">{{ option }}</option>
                </select>
              </label>

              <label class="task-form-field required">
                <span>能力项定义</span>
                <textarea v-model="abilityForm.definition" maxlength="200" placeholder="请输入能力项定义"></textarea>
                <em>保存后将同步更新典型工作任务中的关联能力项名称。</em>
              </label>
            </div>
          </section>
        </div>

        <footer class="dialog-footer">
          <span class="dialog-form-tip">能力项名称、类别、定义为必填项；改名后会同步更新当前岗位任务中的关联引用。</span>
          <div>
            <button class="secondary-action" @click="closeAbilityDialog">取消</button>
            <button class="primary-action compact" :disabled="!abilityEditReady" @click="saveAbilityDialog">保存能力项</button>
          </div>
        </footer>
      </section>
    </div>

    <div
      v-if="abilityDeleteConfirmOpen"
      class="dialog-backdrop nested-dialog"
      @click.self="closeAbilityDeleteConfirm"
    >
      <section class="course-dialog confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="ability-delete-confirm-title">
        <header class="dialog-header">
          <div>
            <span>岗位详情 / 岗位能力项</span>
            <h2 id="ability-delete-confirm-title">确认删除能力项</h2>
          </div>
          <button class="dialog-close" aria-label="关闭删除确认弹窗" @click="closeAbilityDeleteConfirm">×</button>
        </header>
        <div class="confirm-dialog-body">
          <p class="confirm-dialog-text">确认删除「{{ deletingAbilityName }}」吗？</p>
          <p class="confirm-dialog-warning">删除后数据不可恢复。</p>
        </div>
        <footer class="dialog-footer">
          <button class="secondary-action" @click="closeAbilityDeleteConfirm">取消</button>
          <button class="primary-action compact danger" @click="confirmDeleteAbility">确认删除</button>
        </footer>
      </section>
    </div>

    <div
      v-if="selectedPortraitJobId && selectedPortraitJobDetail"
      class="dialog-backdrop"
      @click.self="closePortraitJobDialog"
    >
      <section class="portrait-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="portrait-job-title">
        <header class="dialog-header portrait-dialog-header">
          <div>
            <span>岗位画像分析 / 岗位详情</span>
            <div class="portrait-title-row">
              <h2 id="portrait-job-title">{{ selectedPortraitJobDetail.name }}</h2>
              <p class="portrait-data-source">
                数据来源：来源于BOSS直聘、智联招聘等招聘网站，共2176条同类型岗位招聘数据汇总数据
              </p>
            </div>
          </div>
          <div class="dialog-header-actions">
            <button class="secondary-action" @click="openPortraitCompetencyMap(selectedPortraitJobDetail.id)">岗位能力图谱</button>
            <button class="dialog-close" aria-label="关闭岗位画像详情" @click="closePortraitJobDialog">×</button>
          </div>
        </header>

        <div class="portrait-detail-body">
          <section class="portrait-summary-block">
            <div>
              <strong>{{ selectedPortraitJobDetail.salary }}</strong>
              <span>{{ selectedPortraitJobDetail.salaryUnit }}</span>
            </div>
            <dl>
              <div>
                <dt>学历要求</dt>
                <dd>{{ selectedPortraitJobDetail.education }}</dd>
              </div>
              <div>
                <dt>经验要求</dt>
                <dd>{{ selectedPortraitJobDetail.experience }}</dd>
              </div>
              <div>
                <dt>岗位层级</dt>
                <dd>{{ selectedPortraitJobDetail.level }}</dd>
              </div>
              <div>
                <dt>职业路径</dt>
                <dd>{{ selectedPortraitJobDetail.careerPath }}</dd>
              </div>
            </dl>
            <p>{{ selectedPortraitJobDetail.summary }}</p>
            <div class="portrait-modal-tags">
              <span v-for="tag in selectedPortraitJobDetail.tags" :key="tag">{{ tag }}</span>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>三维能力分析</h3>
            <div class="portrait-ability-grid">
              <article
                v-for="group in selectedPortraitJobDetail.abilityGroups"
                :key="group.key"
                :class="`ability-${group.key}`"
              >
                <header>
                  <span>{{ group.label }}</span>
                  <em>{{ group.items.length }}项</em>
                </header>
                <p v-for="item in group.items" :key="item">{{ item }}</p>
              </article>
            </div>

            <div class="portrait-radar-card">
              <div class="portrait-radar-visual">
                <svg viewBox="0 0 280 280" aria-label="知识技能素养能力雷达图">
                  <polygon
                    v-for="level in [0.25, 0.5, 0.75, 1]"
                    :key="level"
                    :points="portraitRadarGridPoints(level)"
                    class="portrait-radar-grid"
                  />
                  <line
                    v-for="(_, index) in portraitRadarLabels"
                    :key="index"
                    x1="140"
                    y1="140"
                    :x2="portraitRadarPoint(index, portraitRadarLabels.length).x"
                    :y2="portraitRadarPoint(index, portraitRadarLabels.length).y"
                    class="portrait-radar-axis"
                  />
                  <polygon
                    v-for="series in selectedPortraitJobDetail.radarSeries"
                    :key="series.label"
                    :points="portraitRadarPoints(series.values)"
                    :style="{ stroke: series.color, fill: `${series.color}1c` }"
                    class="portrait-radar-area"
                  />
                </svg>
                <span
                  v-for="(label, index) in portraitRadarLabels"
                  :key="label"
                  :style="portraitRadarLabelStyle(index)"
                >
                  {{ label }}
                </span>
              </div>
              <div class="portrait-radar-legend">
                <span
                  v-for="series in selectedPortraitJobDetail.radarSeries"
                  :key="series.label"
                  :style="{ '--legend-color': series.color }"
                >
                  {{ series.label }}
                </span>
              </div>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>典型工作任务</h3>
            <div class="portrait-task-grid">
              <span v-for="task in selectedPortraitJobDetail.tasks" :key="task">{{ task }}</span>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>推荐职业资格证书</h3>
            <div class="certificate-chip-row">
              <button
                v-for="certificate in selectedPortraitJobDetail.certificates"
                :key="certificate.id"
                :data-certificate-id="certificate.id"
                @click="openCertificateDialog(certificate.id)"
              >
                <span>♙</span>
                <strong>{{ certificate.name }}</strong>
                <em>{{ certificate.level }}</em>
              </button>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>对接专业</h3>
            <div class="portrait-major-row">
              <span v-for="major in selectedPortraitJobDetail.majors" :key="major">{{ major }}</span>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>相关企业</h3>
            <div class="portrait-company-grid">
              <button
                v-for="company in selectedPortraitJobDetail.companies"
                :key="company.id"
                :data-company-id="company.id"
                @click="openCompanyDialog(company.id)"
              >
                <span class="company-icon">▦</span>
                <span class="portrait-company-body">
                  <strong>{{ company.name }}</strong>
                  <em>{{ company.industry }} · {{ company.location }}</em>
                  <span class="portrait-company-tags">
                    <span v-for="tag in company.tags" :key="tag" class="company-tag">{{ tag }}</span>
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>

    <div
      v-if="selectedCertificateDetail"
      class="dialog-backdrop nested-dialog"
      @click.self="closeCertificateDialog"
    >
      <section class="certificate-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="certificate-title">
        <header class="dialog-header">
          <div>
            <span>推荐职业资格证书</span>
            <h2 id="certificate-title">{{ selectedCertificateDetail.name }}</h2>
          </div>
          <button class="dialog-close" aria-label="关闭证书详情" @click="closeCertificateDialog">×</button>
        </header>

        <div class="certificate-detail-body">
          <section class="certificate-hero">
            <div class="certificate-medal">♙</div>
            <div>
              <h3>{{ selectedCertificateDetail.level }}</h3>
              <span>{{ selectedCertificateDetail.category }}</span>
            </div>
            <p>{{ selectedCertificateDetail.summary }}</p>
            <div class="portrait-modal-tags certificate-tags">
              <span v-for="tag in selectedCertificateDetail.tags" :key="tag">{{ tag }}</span>
            </div>
          </section>

          <section class="certificate-info-grid">
            <div><span>颁发机构</span><strong>{{ selectedCertificateDetail.issuer }}</strong></div>
            <div><span>有效期</span><strong>{{ selectedCertificateDetail.validPeriod }}</strong></div>
            <div><span>通过率</span><strong>{{ selectedCertificateDetail.passRate }}</strong></div>
            <div><span>薪资加成</span><strong>{{ selectedCertificateDetail.salaryBoost }}</strong></div>
            <div class="wide"><span>报考条件</span><strong>{{ selectedCertificateDetail.requirements }}</strong></div>
          </section>

          <section class="portrait-dialog-section">
            <h3>考试科目</h3>
            <div class="certificate-exam-list">
              <span v-for="item in selectedCertificateDetail.examItems" :key="item">✓ {{ item }}</span>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>适用岗位</h3>
            <div class="portrait-major-row">
              <span v-for="job in selectedCertificateDetail.fitJobs" :key="job">{{ job }}</span>
            </div>
          </section>
        </div>
      </section>
    </div>

    <div
      v-if="selectedCompanyDetail"
      class="dialog-backdrop nested-dialog"
      @click.self="closeCompanyDialog"
    >
      <section class="company-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="company-title">
        <header class="dialog-header">
          <div>
            <span>相关企业</span>
            <h2 id="company-title">{{ selectedCompanyDetail.name }}</h2>
          </div>
          <button class="dialog-close" aria-label="关闭企业详情" @click="closeCompanyDialog">×</button>
        </header>

        <div class="company-detail-body">
          <section class="company-overview">
            <h3>{{ selectedCompanyDetail.fullName }}</h3>
            <div class="portrait-modal-tags company-tags">
              <span v-for="tag in selectedCompanyDetail.tags" :key="tag">{{ tag }}</span>
            </div>
            <p>{{ selectedCompanyDetail.summary }}</p>
          </section>

          <section class="company-info-grid">
            <div v-for="field in selectedCompanyDetail.fields" :key="field.label">
              <span>{{ field.label }}</span>
              <strong>{{ field.value }}</strong>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>核心产品</h3>
            <div class="portrait-major-row">
              <span v-for="product in selectedCompanyDetail.products" :key="product">{{ product }}</span>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>技术方向</h3>
            <div class="portrait-major-row green">
              <span v-for="direction in selectedCompanyDetail.directions" :key="direction">{{ direction }}</span>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>主要招聘岗位</h3>
            <div class="portrait-major-row muted">
              <span v-for="job in selectedCompanyDetail.jobs" :key="job">{{ job }}</span>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>校企合作</h3>
            <div class="company-cooperation-grid">
              <div v-for="item in selectedCompanyDetail.cooperation" :key="item.label">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  </main>
</template>
