export type DecisionGroupKey = 'hub' | 'governance' | 'quality' | 'runtime'

export type DecisionPageKey =
  | 'overview'
  | 'plan-analysis'
  | 'course-diagnosis'
  | 'outcome-analysis'
  | 'student-analysis'
  | 'improvement'
  | 'ai-course'
  | 'insight-diagnosis'
  | 'runtime-monitor'

export type DecisionFlowStatus = 'pending' | 'loading' | 'result' | 'warning'

type DecisionMenuGroup = {
  key: DecisionGroupKey
  title: string
  icon: string
  items: Array<{ key: DecisionPageKey; label: string }>
}

type DecisionFlowState = {
  status: DecisionFlowStatus
}

type DecisionPlaceholderPage = {
  title: string
  metrics: string[]
}

export const decisionCenterMenuGroups: readonly DecisionMenuGroup[] = [
  {
    key: 'hub',
    title: '专业决策中枢',
    icon: '◈',
    items: [{ key: 'overview', label: '专业全局概览' }]
  },
  {
    key: 'governance',
    title: '专业建设治理',
    icon: '◫',
    items: [
      { key: 'plan-analysis', label: '培养方案分析' },
      { key: 'course-diagnosis', label: '课程体系诊断' }
    ]
  },
  {
    key: 'quality',
    title: '专业质量监控',
    icon: '◬',
    items: [
      { key: 'outcome-analysis', label: '专业达成度分析' },
      { key: 'student-analysis', label: '学生培养分析' },
      { key: 'improvement', label: '专业改进建议' }
    ]
  },
  {
    key: 'runtime',
    title: '专业运行数据',
    icon: '◭',
    items: [
      { key: 'ai-course', label: 'AI课程运行' },
      { key: 'insight-diagnosis', label: '应用洞察诊断' },
      { key: 'runtime-monitor', label: '运行监控' }
    ]
  }
] as const

export const decisionCenterOverview = {
  title: '专业全局概览',
  version: '2026版',
  heroValue: '6 个培养目标',
  guideLabels: ['培养目标', '毕业要求', '课程体系', '教学资源'],
  graduationCards: [
    { label: '毕业要求', value: 7 },
    { label: '毕业要求指标点', value: 12 }
  ],
  courseBadges: [
    'AI课：3门',
    '使用：393次',
    '12门课程',
    '概率论与数理统计-wjl-智能体',
    '离散数学-wjl',
    '数据库原理'
  ],
  resourceCards: [
    { label: '知识库资源', value: 10 },
    { label: '知识点', value: 284 },
    { label: '关联学习内容', value: 0 },
    { label: 'AI工具与智能体', value: 28 }
  ]
} as const

export const planAnalysisStates: Record<
  DecisionFlowStatus,
  DecisionFlowState & Record<string, string | string[] | number>
> = {
  pending: {
    status: 'pending',
    modeTabs: ['培养方案诊断分析', '培养方案对比分析'],
    title: '计算机科学与技术专业【2026版】培养方案智能评析报告',
    cta: '开始分析',
    checks: [
      '12门关联教学课程',
      '12门课程设置了课程类型',
      '12门课程设置了开课学期',
      '12门课程设置了学分',
      '课程与毕业要求关联矩阵不完整'
    ]
  },
  loading: {
    status: 'loading',
    heading: '培养方案智能解析中',
    steps: ['扫描培养目标', '比对毕业要求', '分析课程体系', '生成治理建议']
  },
  warning: {
    status: 'warning',
    alerts: ['缺少课程关联', '缺少学分设置', '缺少毕业要求映射', '缺少关联教学资源']
  },
  result: {
    status: 'result',
    topTabs: ['综合评分', '数据概览', '培养目标智能评析', '毕业要求智能评析', '课程体系智能评析'],
    score: 62,
    radarAverage: 7.2,
    restudyAction: '重新方案分析',
    historyAction: '历史分析'
  }
}

export const courseDiagnosisStates: Record<
  DecisionFlowStatus,
  DecisionFlowState & Record<string, string | string[]>
> = {
  pending: {
    status: 'pending',
    modeTabs: ['课程诊断分析', '课程交叉分析'],
    title: '课程体系分析',
    cta: '开始分析',
    summary: '课程体系信息校验结果'
  },
  loading: {
    status: 'loading',
    heading: '课程体系智能诊断中',
    steps: ['校验课程设置', '测算学分结构', '识别交叉覆盖', '生成课程建议']
  },
  warning: {
    status: 'warning',
    alerts: ['缺少学分结构', '缺少课程类型', '缺少课程与毕业要求映射']
  },
  result: {
    status: 'result',
    topTabs: ['课程诊断分析', '课程交叉分析'],
    keyMetrics: ['毕业要求覆盖率', '学期平均开设课程数（门）', '学期平均学分（含实践）']
  }
}

const decisionPlaceholderPages: Record<
  Exclude<DecisionPageKey, 'overview' | 'plan-analysis' | 'course-diagnosis'>,
  DecisionPlaceholderPage
> = {
  'outcome-analysis': {
    title: '专业达成度分析',
    metrics: ['阶段达成率', '核心课程达成度', '薄弱指标点']
  },
  'student-analysis': {
    title: '学生培养分析',
    metrics: ['学生画像', '学业风险', '能力成长曲线']
  },
  improvement: {
    title: '专业改进建议',
    metrics: ['整改优先级', '课程优化建议', '资源补强建议']
  },
  'ai-course': {
    title: 'AI课程运行',
    metrics: ['AI课数量', '调用次数', '使用覆盖班级']
  },
  'insight-diagnosis': {
    title: '应用洞察诊断',
    metrics: ['活跃工具', '高频场景', '异常使用波动']
  },
  'runtime-monitor': {
    title: '运行监控',
    metrics: ['运行健康度', '近7日趋势', '关键节点预警']
  }
}

export const governancePlaceholderPages = decisionPlaceholderPages
