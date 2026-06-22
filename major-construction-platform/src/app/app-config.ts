import { PORTRAIT_JOB_DETAILS } from '../mock/job-research'

export const topModules = [
  { label: '人才方案管理', icon: '▣' },
  { label: '专业引擎', icon: '✦' },
  { label: '岗位中心', icon: '◎' },
  { label: '专业模型', icon: '✣' },
  { label: '决策中心', displayLabel: '智慧专业', icon: 'AI' },
  { label: '建设成果展示', icon: '♥', outline: true },
  { label: '成员', icon: '♙' }
]

export const courseTopModules = [
  { label: '知识库', icon: '▤' },
  { label: '课程模型', icon: '✣', active: true },
  { label: 'AI应用', icon: '✦' },
  { label: '决策中心', displayLabel: '智慧专业', icon: 'AI' },
  { label: '建设成果展示', icon: '♥', outline: true },
  { label: '成员', icon: '♙' }
]

export const resultsMenuActions = [
  { label: '查看成果页', icon: '◎', primary: true },
  { label: '编辑成果页', icon: '✎' },
  { label: '门户设置', icon: '⌁' },
  { label: '复制链接', icon: '□' }
]

export const sideItems = ['培养目标', '毕业要求', '课程管理', '支撑矩阵', '学生管理']

export const talentSubsystemItems = [
  { key: 'research', label: '人才培养方案调研', icon: '⌕' },
  { key: 'compare', label: '人才培养方案比对', icon: '⇄' }
]

export const courseModelTitle = '概率论与数理统计-wjl-智能体'

export const courseModelMenuGroups = [
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

export type CourseMemberRow = {
  account: string
  name: string
  college: string
  role: string
  system?: boolean
}

export type CoursePermissionType = 'all' | 'check' | 'none'

export type CourseRolePermissionRow = {
  firstMenu: string
  secondMenu: string
  view: CoursePermissionType
  manage: CoursePermissionType
  download: CoursePermissionType
  scope: string
}

export type CourseAbilityCategory = '知识' | '技能' | '素养'
export type CourseAbilityCategoryMap = Record<CourseAbilityCategory, string[]>

export type CourseAbilityJobOption = {
  id: string
  name: string
  chain: string
  node: string
  abilities: CourseAbilityCategoryMap
}

export type CourseNodeAbilityRelation = {
  jobId: string
  jobName: string
  chain: string
  node: string
  abilities: CourseAbilityCategoryMap
}

export const courseMemberRows: CourseMemberRow[] = [
  { account: 'mr1758626', name: '梅蕊', college: '体育学院不是体育学院', role: '超级管理员', system: true },
  { account: 'wangyunceshi2', name: '王云测试2', college: '计算机学院', role: '普通管理员', system: true },
  { account: '20200312', name: '汪老师', college: '总指挥部', role: '普通管理员', system: true },
  { account: 'huoyuting123', name: '霍玉婷', college: '计算机学院', role: '普通管理员', system: true },
  { account: 'wangyun', name: '王云', college: '体育学院不是体育学院', role: '超级管理员', system: true },
  { account: 'shiwei', name: '施维-黄河', college: '保卫处', role: '超级管理员', system: true },
  { account: 'wangxiaozhang', name: '汪校长', college: '哈利波特学院', role: '普通管理员', system: true },
]

export const courseSystemRoles = ['超级管理员', '普通管理员', '使用者', '评审专家']
export const courseCustomRoles = ['仅查看', '查看全部管理资源']

export const courseRolePermissionRows: CourseRolePermissionRow[] = [
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

export const courseKnowledgeLevels = [
  { label: '一级', count: 1, tone: 'purple' },
  { label: '二级', count: 9, tone: 'blue' },
  { label: '三级', count: 29, tone: 'green' },
  { label: '四级', count: 82, tone: 'cyan' },
  { label: '五级', count: 89, tone: 'teal' },
  { label: '思政点', count: 1, tone: 'pink' }
]

export const courseKnowledgeNodes = [
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

export const courseDetailTabs = ['知识点详情', '岗位能力', '学习内容', '知识点关系', '习题', '教材']
export const courseAbilityCategories: CourseAbilityCategory[] = ['知识', '技能', '素养']
export const createEmptyCourseAbilityMap = (): CourseAbilityCategoryMap => ({ 知识: [], 技能: [], 素养: [] })
export const cloneCourseAbilityMap = (abilities: CourseAbilityCategoryMap): CourseAbilityCategoryMap => ({
  知识: [...abilities.知识],
  技能: [...abilities.技能],
  素养: [...abilities.素养]
})
export const hasCourseAbilities = (abilities: CourseAbilityCategoryMap) =>
  courseAbilityCategories.some((category) => abilities[category].length > 0)

export const courseJobAbilityOptions: CourseAbilityJobOption[] = PORTRAIT_JOB_DETAILS.map((job) => {
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

export type EngineSectionKey = 'knowledge' | 'agent' | 'assistant' | 'prompt'

export const engineMenuItems = [
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

export const engineSectionPanels: Record<EngineSectionKey, {
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
