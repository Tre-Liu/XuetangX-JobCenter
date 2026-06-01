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

type DecisionPlaceholderPage = {
  title: string
  summary: string
  metrics: Array<{ label: string; value: string; note: string }>
  analysisTitle: string
  analysisPoints: string[]
  insightTitle: string
  insightText: string
}

type DecisionCurrentPlanCard = {
  name: string
  version: string
  action: string
}

type DecisionPendingMode = {
  summary: string
  currentPlan: DecisionCurrentPlanCard
  checks: string[]
}

type DecisionResultPanel = {
  title: string
  summary: string
  cards: Array<{ label: string; value: string; note: string }>
  insights: string[]
}

type PlanAnalysisStateMap = {
  pending: {
    status: 'pending'
    modeTabs: string[]
    title: string
    cta: string
    checks: string[]
    currentPlan: DecisionCurrentPlanCard
    modePanels: Record<string, DecisionPendingMode>
  }
  loading: {
    status: 'loading'
    heading: string
    steps: string[]
  }
  warning: {
    status: 'warning'
    title: string
    summary: string
    alerts: string[]
    continueAction: string
  }
  result: {
    status: 'result'
    topTabs: string[]
    score: number
    radarAverage: number
    restudyAction: string
    historyAction: string
    panels: Record<string, DecisionResultPanel>
  }
}

type CourseDiagnosisStateMap = {
  pending: {
    status: 'pending'
    modeTabs: string[]
    title: string
    cta: string
    summary: string
    checks: string[]
    currentPlan: DecisionCurrentPlanCard
    panels: Record<string, DecisionPendingMode>
  }
  loading: {
    status: 'loading'
    heading: string
    steps: string[]
  }
  warning: {
    status: 'warning'
    title: string
    summary: string
    alerts: string[]
    continueAction: string
  }
  result: {
    status: 'result'
    topTabs: string[]
    keyMetrics: string[]
    historyAction: string
    restudyAction: string
    panels: Record<string, DecisionResultPanel>
  }
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

export const planAnalysisStates: PlanAnalysisStateMap = {
  pending: {
    status: 'pending',
    modeTabs: ['培养方案诊断分析', '培养方案对比分析'],
    title: '计算机科学与技术专业【2026版】培养方案智能评析报告',
    cta: '开始分析',
    currentPlan: {
      name: '计算机科学与技术（专业建设）',
      version: '2026版',
      action: '切换培养方案'
    },
    checks: [
      '12门关联教学课程',
      '12门课程设置了课程类型',
      '12门课程设置了开课学期',
      '12门课程设置了学分',
      '课程与毕业要求关联矩阵不完整'
    ],
    modePanels: {
      培养方案诊断分析: {
        summary: '基于毕业目标、毕业要求及课程结构数据，对本专业人才培养方案进行多维度智能化分析。',
        currentPlan: {
          name: '计算机科学与技术（专业建设）',
          version: '2026版',
          action: '切换培养方案'
        },
        checks: [
          '12门关联教学课程',
          '12门课程设置了课程类型',
          '12门课程设置了开课学期',
          '12门课程设置了学分',
          '课程与毕业要求关联矩阵不完整'
        ]
      },
      培养方案对比分析: {
        summary: '对比现行版与拟修订版培养方案，识别课程结构调整、能力覆盖增减与资源投入变化。',
        currentPlan: {
          name: '2024版 vs 2026版培养方案',
          version: '对比模式',
          action: '切换对比对象'
        },
        checks: [
          '已装载两版培养方案课程清单',
          '已对齐毕业要求与指标点结构',
          '已完成课程学分差异映射',
          '已检测方案重合课程 9 门',
          '拟修订版新增课程仍缺少资源映射'
        ]
      }
    }
  },
  loading: {
    status: 'loading',
    heading: '培养方案智能解析中',
    steps: ['扫描培养目标', '比对毕业要求', '分析课程体系', '生成治理建议']
  },
  warning: {
    status: 'warning',
    title: '培养方案分析预警',
    summary: '检测到当前方案数据尚不完整，可先补齐关键映射后再继续生成正式报告。',
    alerts: ['缺少课程关联', '缺少学分设置', '缺少毕业要求映射', '缺少关联教学资源'],
    continueAction: '仍继续生成报告'
  },
  result: {
    status: 'result',
    topTabs: ['综合评分', '数据概览', '培养目标智能评析', '毕业要求智能评析', '课程体系智能评析'],
    score: 62,
    radarAverage: 7.2,
    restudyAction: '重新方案分析',
    historyAction: '历史分析',
    panels: {
      综合评分: {
        title: '方案综合评分',
        summary: '综合评估培养目标、毕业要求与课程体系之间的整体一致性与可执行度。',
        cards: [
          { label: '综合评分', value: '62', note: '整体合格，建议重点整改' },
          { label: '结构完整度', value: '68%', note: '顶层架构较完整' },
          { label: '课程支撑度', value: '55%', note: '课程支撑仍有缺口' }
        ],
        insights: ['培养目标与课程体系已有主干结构，但课程对毕业要求的支撑仍偏弱。', '建议优先补齐课程与毕业要求矩阵，再处理资源映射问题。']
      },
      数据概览: {
        title: '核心数据概览',
        summary: '从目标、毕业要求、课程与学分四个维度快速查看方案关键数据。',
        cards: [
          { label: '培养目标', value: '6 个', note: '定位面向 AI 新工科' },
          { label: '毕业要求', value: '7 项', note: '覆盖工程认证主线' },
          { label: '课程总数', value: '12 门', note: '以前两学年为主' },
          { label: '总学分', value: '65 分', note: '结构以专业必修为主' }
        ],
        insights: ['目前课程数量能够支撑基本培养目标，但选修与拓展层仍偏薄。', '建议为新增目标补足对应课程与资源投放。']
      },
      培养目标智能评析: {
        title: '培养目标智能评析',
        summary: '聚焦培养目标的定位契合度、表述清晰度和 OBE 可追踪性。',
        cards: [
          { label: '定位契合度', value: '8.2/10', note: '应用型新工科方向明确' },
          { label: '能力结构完整性', value: '7.6/10', note: '工程能力覆盖较好' },
          { label: 'OBE可追踪性', value: '6.8/10', note: '与毕业要求映射仍需加强' }
        ],
        insights: ['目标体系覆盖工程能力、管理领导与终身学习，整体符合应用型人才培养。', '建议进一步补强复杂工程问题与社会责任类表述。']
      },
      毕业要求智能评析: {
        title: '毕业要求智能评析',
        summary: '查看毕业要求对培养目标的支撑均衡性与关键薄弱项。',
        cards: [
          { label: '高强度支撑', value: '7 条', note: '集中在 R1 / R4 / R7' },
          { label: '中强度支撑', value: '8 条', note: '分布较分散' },
          { label: '低强度支撑', value: '7 条', note: '跨文化与协作偏弱' }
        ],
        insights: ['“复杂工程问题”与“工程管理”支撑较集中，但团队协作与跨文化沟通仍有缺口。', '建议在课程设计或综合实践中强化 R5、R6 相关成果产出。']
      },
      课程体系智能评析: {
        title: '课程体系智能评析',
        summary: '聚焦学分结构、开课节奏与课程对毕业要求的整体覆盖。',
        cards: [
          { label: '学期平均开课数', value: '3 门', note: '开课节奏较均衡' },
          { label: '学期平均学分', value: '16.25', note: '负荷集中在前两学年' },
          { label: '覆盖率', value: '31.1404%', note: '毕业要求覆盖仍偏低' }
        ],
        insights: ['课程体系结构可运行，但覆盖率和资源映射完整度仍不足。', '建议优先为薄弱毕业要求补充课程或重构现有课程目标。']
      }
    }
  }
}

export const courseDiagnosisStates: CourseDiagnosisStateMap = {
  pending: {
    status: 'pending',
    modeTabs: ['课程诊断分析', '课程交叉分析'],
    title: '课程体系分析',
    cta: '开始分析',
    summary: '课程体系信息校验结果',
    currentPlan: {
      name: '计算机科学与技术（专业建设）',
      version: '2026版',
      action: '切换培养方案'
    },
    checks: [
      '已完成培养方案课程体系数据检测，可直接进行诊断分析',
      '12门课程设置了课程类型',
      '12门课程设置了开课学期',
      '12门课程设置了学分',
      '课程与毕业要求关联矩阵不完整'
    ],
    panels: {
      课程诊断分析: {
        summary: '校验课程体系设置完整性，并评估课程对毕业要求、学分结构与开课节奏的支撑情况。',
        currentPlan: {
          name: '计算机科学与技术（专业建设）',
          version: '2026版',
          action: '切换培养方案'
        },
        checks: [
          '已完成培养方案课程体系数据检测，可直接进行诊断分析',
          '12门课程设置了课程类型',
          '12门课程设置了开课学期',
          '12门课程设置了学分',
          '课程与毕业要求关联矩阵不完整'
        ]
      },
      课程交叉分析: {
        summary: '识别课程之间的能力交叉、重复建设风险与课程边界模糊问题。',
        currentPlan: {
          name: '课程体系交叉视图',
          version: '2026版',
          action: '切换课程群'
        },
        checks: [
          '已识别高交叉课程对 3 组',
          '已检出重复能力覆盖 8 项',
          '已标记边界模糊课程 2 门',
          '已生成交叉风险课程清单',
          '交叉分析仍缺少部分课程资源标签'
        ]
      }
    }
  },
  loading: {
    status: 'loading',
    heading: '课程体系智能诊断中',
    steps: ['校验课程设置', '测算学分结构', '识别交叉覆盖', '生成课程建议']
  },
  warning: {
    status: 'warning',
    title: '课程体系诊断预警',
    summary: '当前课程体系存在关键字段缺失，建议先补齐学分与映射关系，再对分析结果做正式解读。',
    alerts: ['缺少学分结构', '缺少课程类型', '缺少课程与毕业要求映射'],
    continueAction: '仍继续诊断'
  },
  result: {
    status: 'result',
    topTabs: ['课程诊断分析', '课程交叉分析'],
    keyMetrics: ['毕业要求覆盖率', '学期平均开设课程数（门）', '学期平均学分（含实践）'],
    historyAction: '历史分析',
    restudyAction: '重新课程分析',
    panels: {
      课程诊断分析: {
        title: '课程体系诊断',
        summary: '围绕课程覆盖、学分分布与指标达成，给出课程体系当前健康度。',
        cards: [
          { label: '毕业要求覆盖率', value: '31.1404%', note: '主干要求仍需补强' },
          { label: '学期平均开课数', value: '3 门', note: '开课节奏稳定' },
          { label: '学期平均学分', value: '16.25', note: '实践学分仍可提升' }
        ],
        insights: ['课程诊断结果表明，课程总量可支撑运行，但高阶能力课程比例偏低。', '建议围绕薄弱指标点引入项目制课程或综合实践。']
      },
      课程交叉分析: {
        title: '课程交叉分析',
        summary: '查看课程间重复覆盖、能力交叉与资源冗余风险。',
        cards: [
          { label: '高交叉课程对', value: '3 组', note: '集中在算法与数据基础' },
          { label: '重复能力项', value: '8 项', note: '工程工具与基础统计偏多' },
          { label: '优化优先级', value: '2 门', note: '建议优先梳理课程边界' }
        ],
        insights: ['当前课程群在基础能力上存在重复建设，但综合项目承载仍不足。', '建议将重复内容下沉到共享模块，把高级能力转移到项目课程。']
      }
    }
  }
}

export const decisionImprovementPage = {
  headerMeta: {
    title: '专业改进建议',
    summary: '基于实时招聘数据、行业动态与课程运行情况，形成岗位趋势、课程调整与实训补强建议。',
    meta: [
      { label: '数据周期', value: '近30天' },
      { label: '覆盖岗位数', value: '28 个' },
      { label: '最近更新时间', value: '2026-06-01 09:30' }
    ]
  },
  states: {
    default: {
      heroSignals: [{ label: '新增岗位', value: '3 个', note: '智能体开发、AIGC应用、多模态数据处理' }],
      headlineSummary:
        'AIGC 应用工程师、智能体开发与多模态处理成为新增需求高点，建议优先调整人工智能导论、Python 程序设计、数据库原理，并补入提示工程与智能体工作流实训。',
      evidenceMatrix: [
        {
          trend: '智能体开发',
          ability: '工作流编排 / 提示工程 / 工具调用',
          courses: 'Python 程序设计 / 人工智能导论',
          gap: '现有课程缺少 Agent 工作流内容',
          action: '增补章节',
          training: '智能体工作流搭建实训'
        }
      ],
      courseAdjustments: [
        {
          course: '人工智能导论',
          change: '增补提示工程与智能体工作流章节',
          reason: '新增岗位能力要求已超过现有课程覆盖范围',
          priority: '高'
        }
      ],
      trainingAdditions: [
        {
          name: '智能体开发实训',
          focus: '工作流编排、工具调用与多智能体协作',
          format: '项目制实训',
          duration: '12 学时'
        }
      ],
      resourceRecommendations: [
        {
          resource: 'Agent 工作流案例库',
          type: '案例资源',
          purpose: '支撑人工智能导论与 Python 程序设计课程调改',
          owner: '专业负责人 / 课程团队'
        }
      ],
      deliveryTimeline: [
        {
          phase: '本学期',
          window: '2026 年 9 月前',
          deliverables: '完成课程章节增补、实训脚本联调与试运行'
        }
      ]
    },
    refreshing: {
      message: '正在同步招聘数据与行业动态，请稍候...'
    },
    empty: {
      title: '开始生成专业改进建议',
      cta: '开始分析'
    },
    warning: {
      warningFlags: ['岗位样本不足', '课程映射未补全']
    }
  }
} as const

const decisionPlaceholderPages: Record<
  Exclude<DecisionPageKey, 'overview' | 'plan-analysis' | 'course-diagnosis'>,
  DecisionPlaceholderPage
> = {
  'outcome-analysis': {
    title: '专业达成度分析',
    summary: '聚焦阶段达成率、核心课程达成度与薄弱指标点，形成阶段性质量画像。',
    metrics: [
      { label: '阶段达成率', value: '84%', note: '较上轮提升 3%' },
      { label: '核心课程达成度', value: '76%', note: '数据库与离散数学偏弱' },
      { label: '薄弱指标点', value: '3 项', note: '集中在工程实践能力' }
    ],
    analysisTitle: '阶段达成分析',
    analysisPoints: ['核心课程总体可控，但工程实践类达成度波动较大。', '薄弱指标点主要分布在项目设计与跨团队协作能力。'],
    insightTitle: 'AI改进建议',
    insightText: '优先对达成度连续低于 80% 的课程增加过程性评价，并将项目实践纳入课程目标考核。'
  },
  'student-analysis': {
    title: '学生培养分析',
    summary: '基于学生画像、学业风险与能力成长曲线，识别关键培养断点。',
    metrics: [
      { label: '重点学生画像', value: '4 类', note: '基础薄弱与应用偏科最明显' },
      { label: '学业风险预警', value: '12 人', note: '集中在二年级上学期' },
      { label: '能力成长曲线', value: '平稳', note: '工程实践提升较慢' }
    ],
    analysisTitle: '学生成长分析',
    analysisPoints: ['学生能力增长总体平稳，但实践能力与表达能力提升速度不一致。', '高风险学生多与课程衔接不顺和实践支持不足相关。'],
    insightTitle: 'AI改进建议',
    insightText: '针对高风险学生建立专项辅导名单，并在关键课程前置补足工程工具与基础能力训练。'
  },
  improvement: {
    title: '专业改进建议',
    summary: '汇总培养方案、课程体系与达成分析结果，形成面向整改落地的任务单。',
    metrics: [
      { label: '整改优先级', value: '3 项', note: '优先处理课程映射缺口' },
      { label: '课程优化建议', value: '6 条', note: '含课程重构与资源补强' },
      { label: '资源补强建议', value: '4 条', note: '聚焦实践与 AI 工具' }
    ],
    analysisTitle: '整改任务建议',
    analysisPoints: ['建议先补齐毕业要求映射，再优化重复课程内容。', '资源侧优先增加项目课程案例库与 AI 应用工具支持。'],
    insightTitle: 'AI改进建议',
    insightText: '将整改任务按“本学期可落地 / 下学年规划”拆分，优先推进高影响、低依赖项。'
  },
  'ai-course': {
    title: 'AI课程运行',
    summary: '跟踪 AI 课程数量、调用次数与班级覆盖，判断 AI 课程运行活跃度。',
    metrics: [
      { label: 'AI课数量', value: '3 门', note: '均已接入课程模型' },
      { label: '调用次数', value: '393 次', note: '近 30 天增长明显' },
      { label: '使用覆盖班级', value: '6 个', note: '集中在前两学年' }
    ],
    analysisTitle: '运行趋势分析',
    analysisPoints: ['AI 课程调用主要集中在概统与离散数学两门课程。', '晚间与作业高峰时段使用最密集。'],
    insightTitle: 'AI改进建议',
    insightText: '优先为调用活跃课程补强问答对与智能体资源，并扩大到更多班级试点。'
  },
  'insight-diagnosis': {
    title: '应用洞察诊断',
    summary: '分析活跃工具、高频场景与异常波动，识别教学应用的真实采用情况。',
    metrics: [
      { label: '活跃工具', value: '8 个', note: '智能批改与学伴最高频' },
      { label: '高频场景', value: '4 类', note: '作业辅导与案例学习为主' },
      { label: '异常使用波动', value: '2 次', note: '集中在考试前后' }
    ],
    analysisTitle: '场景使用分析',
    analysisPoints: ['工具使用高度集中在少数课程和少数教师。', '异常波动多与阶段性考核和集中作业发布相关。'],
    insightTitle: 'AI改进建议',
    insightText: '围绕高频场景沉淀标准化模板，并针对低活跃课程组织一次定向培训。'
  },
  'runtime-monitor': {
    title: '运行监控',
    summary: '从运行健康度、趋势波动与关键节点预警三个维度监测系统运行情况。',
    metrics: [
      { label: '运行健康度', value: '92%', note: '整体稳定' },
      { label: '近7日趋势', value: '平稳', note: '高峰期无异常抖动' },
      { label: '关键节点预警', value: '1 条', note: '资源同步延迟待处理' }
    ],
    analysisTitle: '运行态势分析',
    analysisPoints: ['系统整体运行健康，但资源同步链路仍有偶发延迟。', '关键节点预警主要出现在批量分析后的资源写回阶段。'],
    insightTitle: 'AI改进建议',
    insightText: '对分析结果写回链路增加重试与告警策略，并在高峰时段预留更多缓冲资源。'
  }
}

export const governancePlaceholderPages = decisionPlaceholderPages
