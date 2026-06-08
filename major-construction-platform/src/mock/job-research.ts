import {
  COURSE_NODES as SMART_CONSTRUCTION_COURSES,
  INDUSTRY_CHAINS as SMART_CONSTRUCTION_CHAINS,
  INDUSTRY_NODES as SMART_CONSTRUCTION_INDUSTRIES,
  JOB_CARDS as SMART_CONSTRUCTION_JOBS,
  getJobDetail as getSmartConstructionJobDetail
} from './job-center'

export type JobResearchTabKey = 'portrait' | 'demand' | 'forecast'

export interface JobResearchTab {
  key: JobResearchTabKey
  label: string
}

export interface ResearchJobCandidate {
  id: string
  name: string
  groupName: string
  occupation: string
  occupationCode: string
  taskCount: number
  abilityCount: number
  industryNodeId: string
  industryNode: string
  chain: string
  salary: string
  demand: string
  keywords: string[]
}

export interface PortraitAbilityGroup {
  key: 'knowledge' | 'skill' | 'quality'
  label: '知识' | '技能' | '素养'
  items: string[]
}

export interface PortraitCertificateSummary {
  id: string
  name: string
  level: string
}

export interface PortraitCompanySummary {
  id: string
  name: string
  industry: string
  location: string
  tags: string[]
}

export interface PortraitJobDetail {
  id: string
  name: string
  salary: string
  salaryUnit: string
  education: string
  experience: string
  level: string
  demand: string
  careerPath: string
  chain: string
  node: string
  tags: string[]
  summary: string
  abilityGroups: PortraitAbilityGroup[]
  radarSeries: Array<{ label: string; values: number[]; color: string }>
  tasks: string[]
  certificates: PortraitCertificateSummary[]
  majors: string[]
  companies: PortraitCompanySummary[]
}

export interface PortraitCompetencyMapConfig {
  abilityGroups: PortraitAbilityGroup[]
  taskAbilities: Record<string, string[]>
}

export interface CertificateDetail {
  id: string
  name: string
  level: string
  category: string
  summary: string
  tags: string[]
  issuer: string
  validPeriod: string
  passRate: string
  salaryBoost: string
  requirements: string
  examItems: string[]
  fitJobs: string[]
}

export interface CompanyDetail {
  id: string
  name: string
  fullName: string
  tags: string[]
  summary: string
  fields: Array<{ label: string; value: string }>
  products: string[]
  directions: string[]
  jobs: string[]
  cooperation: Array<{ label: string; value: string }>
}

export const JOB_RESEARCH_TABS: JobResearchTab[] = [
  { key: 'portrait', label: '岗位画像分析' },
  { key: 'demand', label: '招聘需求趋势' },
  { key: 'forecast', label: '新岗位新技术预判' }
]

export const PORTRAIT_HOT_JOBS = [
  'BIM深化设计工程师',
  '智慧工地管理工程师',
  '建筑机器人应用工程师',
  '结构健康监测工程师',
  '装配式建筑深化设计师',
  '智能测量工程师'
]

export const PORTRAIT_INSIGHTS = [
  'BIM深化设计、智慧工地管理、智能检测监测三类岗位需求最集中，是智能建造工程专业当前岗位建设的主轴。',
  '智慧工地管理工程师、BIM深化设计工程师和建筑机器人应用工程师对BIM协同、工程数据、现场联调能力要求突出。',
  '装配式构件生产、三维激光扫描、结构健康监测正在从单点技术岗位转向“模型+设备+现场”复合交付岗位。',
  '建议课程体系重点补强BIM深化设计、智能建造施工技术、智慧工地平台、智能检测监测和建筑物联网综合实训。'
]

export const PORTRAIT_MAPPING = SMART_CONSTRUCTION_INDUSTRIES.map((node) => {
  const chain = SMART_CONSTRUCTION_CHAINS.find((item) => item.id === node.chainId)
  const jobs = SMART_CONSTRUCTION_JOBS.filter((job) => job.industryNodeId === node.id)
  const jobIds = new Set(jobs.map((job) => job.id))
  const courses = SMART_CONSTRUCTION_COURSES.filter((course) => course.jobIds.some((jobId) => jobIds.has(jobId)))

  return {
    chain: chain?.name ?? '智能建造产业链',
    node: node.name,
    jobs: jobs.map((job) => job.name),
    courses: courses.map((course) => course.name)
  }
})

export const PORTRAIT_JOB_PROFILES = SMART_CONSTRUCTION_JOBS.map((job) => {
  const detail = getSmartConstructionJobDetail(job.id)
  const industry = SMART_CONSTRUCTION_INDUSTRIES.find((node) => node.id === job.industryNodeId)
  return {
    id: job.id,
    name: job.name,
    salary: detail.salaryRange,
    demand: detail.demandVolume,
    level: job.taskCount >= 6 ? '中级' : '初中级',
    chain: industry?.name ?? '智能建造产业链',
    skills: detail.abilities.slice(0, 4).map((ability) => ability.name)
  }
})

export const PORTRAIT_JOB_DETAILS: PortraitJobDetail[] = [
  {
    id: 'job-model-deploy',
    name: 'AI模型部署工程师',
    salary: '10K-18K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '中级',
    demand: '18,640',
    careerPath: '模型部署工程师→MLOps工程师→AI平台架构师→智能产品技术负责人',
    chain: '人工智能产业链',
    node: 'AI算法开发与部署',
    tags: ['AI算法开发与部署', '核心', '需求量 18,640'],
    summary:
      '负责将训练完成的机器学习、深度学习或大模型能力部署到业务系统，完成模型服务化、接口联调、性能监控、版本迭代和上线运维。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['机器学习模型推理流程', 'Linux与容器基础', '模型格式与转换规范', 'MLOps生命周期', 'API接口与服务协议']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['Python工程开发', '模型服务部署', 'Docker镜像构建', 'ONNX模型转换', '性能监控与问题定位']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['数据安全与合规意识', '跨团队协作', '服务稳定性责任心', '问题闭环意识', '规范化交付意识']
      }
    ],
    radarSeries: [
      { label: '知识', values: [88, 80, 84, 86, 78], color: '#326fff' },
      { label: '技能', values: [82, 90, 76, 80, 86], color: '#20bfb8' },
      { label: '素养', values: [76, 84, 90, 82, 88], color: '#8b52e8' }
    ],
    tasks: ['模型服务化方案设计', '模型部署与接口联调', '推理性能优化', '模型上线运维', '业务效果回收与迭代', '部署文档编制'],
    certificates: [
      { id: 'cert-ai-engineer', name: '人工智能工程技术人员专业技术证书', level: '中级' },
      { id: 'cert-python-ai', name: 'Python人工智能应用开发证书', level: '专项' },
      { id: 'cert-cloud-ai', name: '云上AI应用部署证书', level: '高级' }
    ],
    majors: ['人工智能技术应用', '软件技术', '大数据技术', '计算机应用技术'],
    companies: [
      { id: 'company-baidu', name: '百度智能云', industry: 'AI平台', location: '北京海淀', tags: ['大模型平台', '云服务'] },
      { id: 'company-iflytek', name: '科大讯飞', industry: '智能语音', location: '安徽合肥', tags: ['认知大模型', '教育AI'] },
      { id: 'company-sensetime', name: '商汤科技', industry: '计算机视觉', location: '上海徐汇', tags: ['视觉算法', 'AI平台'] }
    ]
  },
  {
    id: 'job-vision',
    name: '工业视觉检测工程师',
    salary: '9K-16K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '中级',
    demand: '12,870',
    careerPath: '视觉检测工程师→视觉项目工程师→智能制造解决方案经理',
    chain: '人工智能产业链',
    node: '机器视觉与智能感知',
    tags: ['机器视觉与智能感知', '制造场景', '需求量 12,870'],
    summary:
      '面向工业质检、装配识别和产线缺陷检测场景，负责图像采集、标定、算法调试、现场部署和质量数据回收。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['工业视觉成像原理', '图像采集与标定知识', '缺陷检测算法基础', '产线工艺流程认知', '质量管理基础']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['相机与光源选型', '图像数据标注', '视觉模型训练', '检测阈值调优', '现场联调与验收']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['质量意识', '现场沟通能力', '问题定位耐心', '安全生产意识', '持续改善意识']
      }
    ],
    radarSeries: [
      { label: '知识', values: [82, 88, 78, 86, 84], color: '#326fff' },
      { label: '技能', values: [88, 84, 82, 86, 80], color: '#20bfb8' },
      { label: '素养', values: [90, 82, 78, 86, 84], color: '#8b52e8' }
    ],
    tasks: ['视觉检测方案确认', '图像采集与标定', '缺陷样本标注', '检测模型调试', '产线部署与验收'],
    certificates: [
      { id: 'cert-vision', name: '机器视觉应用开发职业技能等级证书', level: '中级' },
      { id: 'cert-ai-engineer', name: '人工智能工程技术人员专业技术证书', level: '中级' }
    ],
    majors: ['人工智能技术应用', '智能制造装备技术', '工业机器人技术', '计算机应用技术'],
    companies: [
      { id: 'company-hikvision', name: '海康威视', industry: '机器视觉', location: '浙江杭州', tags: ['工业视觉', '智能物联'] },
      { id: 'company-dahua', name: '大华股份', industry: '智能视觉', location: '浙江杭州', tags: ['视觉检测', '边缘智能'] },
      { id: 'company-megvii', name: '旷视科技', industry: '计算机视觉', location: '北京海淀', tags: ['视觉算法', '智能制造'] }
    ]
  },
  {
    id: 'job-data-analyst',
    name: 'AI数据分析师',
    salary: '8K-15K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '初中级',
    demand: '15,220',
    careerPath: 'AI数据分析师→数据治理工程师→数据产品经理→智能运营负责人',
    chain: '数据服务产业链',
    node: '数据采集治理与分析服务',
    tags: ['数据采集治理与分析服务', '高增长', '需求量 15,220'],
    summary:
      '围绕AI应用的数据采集、清洗、指标分析和可视化表达，支撑模型训练、业务洞察与智能决策落地。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['数据统计基础', '数据治理流程', '指标体系设计', '机器学习数据需求', '数据隐私合规知识']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['Python数据分析', 'SQL查询与建模', '数据清洗处理', '可视化看板制作', '业务指标诊断']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['业务理解能力', '数据敏感度', '严谨验证意识', '沟通表达能力', '持续优化意识']
      }
    ],
    radarSeries: [
      { label: '知识', values: [86, 82, 88, 76, 84], color: '#326fff' },
      { label: '技能', values: [90, 84, 86, 82, 80], color: '#20bfb8' },
      { label: '素养', values: [82, 88, 86, 84, 80], color: '#8b52e8' }
    ],
    tasks: ['数据需求拆解', '数据采集与清洗', '指标建模分析', '可视化看板交付', '分析报告复盘'],
    certificates: [
      { id: 'cert-data-analyst', name: '数据分析处理工程技术人员证书', level: '中级' },
      { id: 'cert-python-ai', name: 'Python人工智能应用开发证书', level: '专项' }
    ],
    majors: ['人工智能技术应用', '大数据技术', '软件技术', '信息安全技术应用'],
    companies: [
      { id: 'company-alibaba-cloud', name: '阿里云', industry: '云计算与数据服务', location: '浙江杭州', tags: ['数据智能', '云平台'] },
      { id: 'company-baidu', name: '百度智能云', industry: 'AI平台', location: '北京海淀', tags: ['大模型平台', '云服务'] },
      { id: 'company-iflytek', name: '科大讯飞', industry: '智能语音', location: '安徽合肥', tags: ['认知大模型', '教育AI'] }
    ]
  },
  {
    id: 'job-system-ops',
    name: '智能系统运维工程师',
    salary: '9K-17K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '中级',
    demand: '11,540',
    careerPath: '智能系统运维工程师→平台运维工程师→MLOps运维负责人',
    chain: '人工智能产业链',
    node: '模型运维与智能系统集成',
    tags: ['模型运维与智能系统集成', '稳定交付', '需求量 11,540'],
    summary:
      '负责模型服务、智能终端和行业AI系统的运行监控、版本维护、异常定位与交付保障，是企业AI项目落地后的关键保障岗位。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['Linux系统基础', '网络与服务协议', '模型服务运行机制', '日志与监控指标体系', '常见运维安全规范']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['服务部署与更新', '日志监控分析', '故障回滚处理', '脚本化运维', '接口联调排错']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['稳定性责任意识', '值守协同能力', '故障响应速度', '文档沉淀习惯', '持续复盘意识']
      }
    ],
    radarSeries: [
      { label: '知识', values: [82, 84, 80, 88, 78], color: '#326fff' },
      { label: '技能', values: [86, 88, 84, 80, 82], color: '#20bfb8' },
      { label: '素养', values: [90, 84, 88, 82, 86], color: '#8b52e8' }
    ],
    tasks: ['模型服务巡检', '告警响应与问题定位', '版本发布与回滚', '设备运行监控', '运维文档沉淀'],
    certificates: [
      { id: 'cert-cloud-ai', name: '云上AI应用部署证书', level: '高级' },
      { id: 'cert-ai-engineer', name: '人工智能工程技术人员专业技术证书', level: '中级' }
    ],
    majors: ['人工智能技术应用', '物联网应用技术', '软件技术', '计算机应用技术'],
    companies: [
      { id: 'company-alibaba-cloud', name: '阿里云', industry: '云计算与数据服务', location: '浙江杭州', tags: ['云平台', '智能运维'] },
      { id: 'company-hikvision', name: '海康威视', industry: '机器视觉', location: '浙江杭州', tags: ['智能物联', '边缘设备'] },
      { id: 'company-baidu', name: '百度智能云', industry: 'AI平台', location: '北京海淀', tags: ['模型服务', '云监控'] }
    ]
  },
  {
    id: 'job-agent-developer',
    name: '智能体应用开发工程师',
    salary: '13K-24K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '中高级',
    demand: '8,960',
    careerPath: '智能体应用开发工程师→AI应用架构师→企业智能化解决方案负责人',
    chain: '人工智能产业链',
    node: 'AI算法开发与部署',
    tags: ['AI算法开发与部署', '高增长', '需求量 8,960'],
    summary:
      '围绕企业知识库、客服、办公自动化和业务流程场景，负责智能体设计、工具调用、知识库接入和效果优化。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['大模型提示机制', 'RAG知识库原理', '业务流程拆解思路', '接口服务组织方式', '应用评测基本方法']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['Agent编排配置', 'API集成调试', '知识库接入', '提示词优化', '效果验证复盘']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['业务理解能力', '跨角色协同能力', '交付结果意识', '持续优化意识', '用户体验敏感度']
      }
    ],
    radarSeries: [
      { label: '知识', values: [86, 90, 84, 80, 78], color: '#326fff' },
      { label: '技能', values: [88, 84, 82, 90, 80], color: '#20bfb8' },
      { label: '素养', values: [84, 86, 90, 88, 82], color: '#8b52e8' }
    ],
    tasks: ['智能体流程设计', '知识库与工具接入', '提示词与规则调优', '场景验收测试', '业务效果复盘'],
    certificates: [
      { id: 'cert-python-ai', name: 'Python人工智能应用开发证书', level: '专项' },
      { id: 'cert-ai-engineer', name: '人工智能工程技术人员专业技术证书', level: '中级' }
    ],
    majors: ['人工智能技术应用', '软件技术', '计算机应用技术', '现代文秘'],
    companies: [
      { id: 'company-baidu', name: '百度智能云', industry: 'AI平台', location: '北京海淀', tags: ['知识库', '智能体'] },
      { id: 'company-iflytek', name: '科大讯飞', industry: '智能语音', location: '安徽合肥', tags: ['星火大模型', '办公智能'] },
      { id: 'company-alibaba-cloud', name: '阿里云', industry: '云计算与数据服务', location: '浙江杭州', tags: ['应用编排', '企业服务'] }
    ]
  },
  {
    id: 'job-multimodal-app',
    name: '多模态AI应用工程师',
    salary: '11K-20K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '中级',
    demand: '7,420',
    careerPath: '多模态AI应用工程师→AIGC项目经理→行业智能内容平台主管',
    chain: '人工智能产业链',
    node: '机器视觉与智能感知',
    tags: ['机器视觉与智能感知', '规模扩张', '需求量 7,420'],
    summary:
      '负责图文音视频等多模态能力在营销、教育、政务和电商场景中的集成落地，关注内容生成、审核与体验优化。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['多模态模型基础', '内容生成工作流', '版权与内容安全规则', '图像理解与标注基础', '行业场景表达规范']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['提示词设计', '多模态接口调用', '内容质检配置', '场景脚本开发', '生成结果调优']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['内容风险意识', '审美与表达能力', '用户反馈敏感度', '跨团队沟通能力', '质量复核习惯']
      }
    ],
    radarSeries: [
      { label: '知识', values: [84, 86, 82, 78, 80], color: '#326fff' },
      { label: '技能', values: [88, 84, 82, 80, 86], color: '#20bfb8' },
      { label: '素养', values: [82, 90, 84, 86, 88], color: '#8b52e8' }
    ],
    tasks: ['多模态场景接入', '生成流程设计', '内容审核规则配置', '结果调优复核', '应用效果分析'],
    certificates: [
      { id: 'cert-python-ai', name: 'Python人工智能应用开发证书', level: '专项' },
      { id: 'cert-vision', name: '机器视觉应用开发职业技能等级证书', level: '中级' }
    ],
    majors: ['人工智能技术应用', '数字媒体技术', '融媒体技术与运营', '软件技术'],
    companies: [
      { id: 'company-iflytek', name: '科大讯飞', industry: '智能语音', location: '安徽合肥', tags: ['AIGC', '教育AI'] },
      { id: 'company-sensetime', name: '商汤科技', industry: '计算机视觉', location: '上海徐汇', tags: ['多模态', '行业智能'] },
      { id: 'company-baidu', name: '百度智能云', industry: 'AI平台', location: '北京海淀', tags: ['生成式AI', '内容应用'] }
    ]
  },
  {
    id: 'job-ai-compliance',
    name: 'AI数据合规专员',
    salary: '9K-16K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '初中级',
    demand: '6,780',
    careerPath: 'AI数据合规专员→数据治理工程师→AI安全与合规顾问',
    chain: '数据服务产业链',
    node: 'AI数据标注与质检服务',
    tags: ['AI数据标注与质检服务', '政策驱动', '需求量 6,780'],
    summary:
      '负责训练数据来源审查、脱敏处理、质量抽检、合规留档和应用上线前的数据风险识别，是企业合规交付的重要支撑角色。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['数据安全基础规范', '隐私保护与脱敏方法', '训练数据质量标准', 'AI备案与记录要求', '内容审核原则']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['数据脱敏处理', '质检抽样检查', '合规文档编写', '问题数据归档', '风险清单维护']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['规则意识', '严谨审校能力', '风险敏感度', '保密意识', '责任心']
      }
    ],
    radarSeries: [
      { label: '知识', values: [88, 84, 86, 82, 80], color: '#326fff' },
      { label: '技能', values: [84, 86, 82, 88, 78], color: '#20bfb8' },
      { label: '素养', values: [90, 88, 86, 92, 84], color: '#8b52e8' }
    ],
    tasks: ['训练数据来源核查', '脱敏规则执行', '质量抽检与复核', '合规报告归档', '上线前风险提示'],
    certificates: [
      { id: 'cert-data-analyst', name: '数据分析处理工程技术人员证书', level: '中级' },
      { id: 'cert-ai-engineer', name: '人工智能工程技术人员专业技术证书', level: '中级' }
    ],
    majors: ['大数据技术', '信息安全技术应用', '人工智能技术应用', '软件技术'],
    companies: [
      { id: 'company-alibaba-cloud', name: '阿里云', industry: '云计算与数据服务', location: '浙江杭州', tags: ['数据治理', '合规'] },
      { id: 'company-baidu', name: '百度智能云', industry: 'AI平台', location: '北京海淀', tags: ['数据安全', '平台治理'] },
      { id: 'company-iflytek', name: '科大讯飞', industry: '智能语音', location: '安徽合肥', tags: ['教育数据', '内容安全'] }
    ]
  },
  {
    id: 'job-edge-ai-deploy',
    name: '端侧AI部署工程师',
    salary: '12K-22K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '中高级',
    demand: '7,830',
    careerPath: '端侧AI部署工程师→边缘智能工程师→智能终端解决方案经理',
    chain: '智能物联产业链',
    node: '边缘智能与物联网应用',
    tags: ['边缘智能与物联网应用', '快速落地', '需求量 7,830'],
    summary:
      '负责将轻量模型部署到摄像头、工控网关、机器人和移动终端设备中，完成设备接入、推理优化和现场联调。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['边缘设备架构基础', '模型压缩量化原理', '终端推理框架认知', '传感器与接口协议', '现场网络与安全基础']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['模型转换部署', '边缘推理调优', '设备接入联调', '终端日志排查', '性能压测验证']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['现场协同能力', '硬件适配耐心', '稳定性意识', '交付闭环意识', '安全规范意识']
      }
    ],
    radarSeries: [
      { label: '知识', values: [84, 88, 82, 80, 78], color: '#326fff' },
      { label: '技能', values: [90, 86, 88, 82, 84], color: '#20bfb8' },
      { label: '素养', values: [84, 82, 88, 86, 90], color: '#8b52e8' }
    ],
    tasks: ['边缘模型适配', '终端部署与调试', '设备接入验证', '推理性能优化', '现场问题复盘'],
    certificates: [
      { id: 'cert-cloud-ai', name: '云上AI应用部署证书', level: '高级' },
      { id: 'cert-ai-engineer', name: '人工智能工程技术人员专业技术证书', level: '中级' }
    ],
    majors: ['人工智能技术应用', '物联网应用技术', '智能产品开发与应用', '工业机器人技术'],
    companies: [
      { id: 'company-hikvision', name: '海康威视', industry: '机器视觉', location: '浙江杭州', tags: ['边缘AI', '终端设备'] },
      { id: 'company-dahua', name: '大华股份', industry: '智能视觉', location: '浙江杭州', tags: ['设备接入', '视频物联'] },
      { id: 'company-sensetime', name: '商汤科技', industry: '计算机视觉', location: '上海徐汇', tags: ['边缘部署', '视觉平台'] }
    ]
  },
  {
    id: 'job-ai-evaluator',
    name: 'AI应用评测工程师',
    salary: '10K-18K',
    salaryUnit: '/月',
    education: '大专及以上',
    experience: '1-3年',
    level: '中级',
    demand: '6,210',
    careerPath: 'AI应用评测工程师→模型安全测试工程师→AI质量负责人',
    chain: '人工智能产业链',
    node: '模型运维与智能系统集成',
    tags: ['模型运维与智能系统集成', '风险刚需', '需求量 6,210'],
    summary:
      '围绕模型效果、提示注入、内容安全和业务可用性开展评测工作，为AI应用上线提供质量依据和风险分级结论。',
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: ['软件测试基础', 'AI评测维度框架', '提示注入与内容安全认知', '风险分级原则', '测试数据设计方法']
      },
      {
        key: 'skill',
        label: '技能',
        items: ['评测用例编写', '自动化测试执行', '模型效果记录', '问题归因分析', '评测报告输出']
      },
      {
        key: 'quality',
        label: '素养',
        items: ['严谨验证意识', '异常敏感度', '客观记录习惯', '风险提示意识', '沟通反馈能力']
      }
    ],
    radarSeries: [
      { label: '知识', values: [84, 88, 86, 80, 82], color: '#326fff' },
      { label: '技能', values: [86, 84, 82, 88, 80], color: '#20bfb8' },
      { label: '素养', values: [88, 86, 84, 90, 82], color: '#8b52e8' }
    ],
    tasks: ['评测方案制定', '测试样例设计', '自动化执行与记录', '问题归因与分级', '评测报告提交'],
    certificates: [
      { id: 'cert-ai-engineer', name: '人工智能工程技术人员专业技术证书', level: '中级' },
      { id: 'cert-python-ai', name: 'Python人工智能应用开发证书', level: '专项' }
    ],
    majors: ['人工智能技术应用', '软件测试技术', '信息安全技术应用', '软件技术'],
    companies: [
      { id: 'company-baidu', name: '百度智能云', industry: 'AI平台', location: '北京海淀', tags: ['模型评测', '质量分析'] },
      { id: 'company-megvii', name: '旷视科技', industry: '计算机视觉', location: '北京海淀', tags: ['模型调优', '风险验证'] },
      { id: 'company-alibaba-cloud', name: '阿里云', industry: '云计算与数据服务', location: '浙江杭州', tags: ['平台评测', '应用测试'] }
    ]
  }
]

export const CERTIFICATE_DETAILS: CertificateDetail[] = [
  {
    id: 'cert-ai-engineer',
    name: '人工智能工程技术人员专业技术证书',
    level: '中级',
    category: '专业技术证书',
    summary: '面向AI工程化、模型部署、数据处理和智能应用交付能力的综合认证。',
    tags: ['模型部署', '工程化', '数据安全'],
    issuer: '中国电子学会',
    validPeriod: '3年',
    passRate: '62%',
    salaryBoost: '+16%',
    requirements: '大专及以上学历，计算机、人工智能、软件或相关专业，具备AI应用开发或部署项目经验。',
    examItems: ['机器学习基础', '模型部署实践', '数据安全与合规', 'AI应用项目交付', '算法工程化'],
    fitJobs: ['AI模型部署工程师', '工业视觉检测工程师', 'AIGC应用工程师']
  },
  {
    id: 'cert-python-ai',
    name: 'Python人工智能应用开发证书',
    level: '专项',
    category: '职业技能证书',
    summary: '认证Python数据处理、AI应用开发、接口封装和自动化脚本开发能力。',
    tags: ['Python', '数据分析', 'AI应用'],
    issuer: '工业和信息化人才交流中心',
    validPeriod: '3年',
    passRate: '68%',
    salaryBoost: '+12%',
    requirements: '掌握Python基础语法、常用数据处理库与至少一个AI应用项目实践。',
    examItems: ['Python工程基础', '数据处理与可视化', '机器学习应用', '接口调用与部署', '项目综合实训'],
    fitJobs: ['AI模型部署工程师', 'AI数据分析师']
  },
  {
    id: 'cert-cloud-ai',
    name: '云上AI应用部署证书',
    level: '高级',
    category: '厂商认证',
    summary: '面向云平台AI服务、模型部署、资源监控和运维交付的能力认证。',
    tags: ['云平台', 'MLOps', '运维'],
    issuer: '云计算产业人才认证联盟',
    validPeriod: '2年',
    passRate: '55%',
    salaryBoost: '+18%',
    requirements: '具备Linux、Docker、云资源管理和模型服务部署经验。',
    examItems: ['云资源配置', '模型服务部署', '容器化交付', '日志监控', '故障回滚'],
    fitJobs: ['AI模型部署工程师', '智能系统运维工程师']
  },
  {
    id: 'cert-vision',
    name: '机器视觉应用开发职业技能等级证书',
    level: '中级',
    category: '职业技能等级证书',
    summary: '针对工业视觉采集、标定、缺陷检测和现场联调能力的职业技能认证。',
    tags: ['机器视觉', '工业质检', '现场调试'],
    issuer: '智能制造职业教育评价组织',
    validPeriod: '3年',
    passRate: '60%',
    salaryBoost: '+14%',
    requirements: '熟悉工业相机、光源、图像处理基础和制造现场安全规范。',
    examItems: ['图像采集标定', '缺陷检测流程', '视觉模型调试', '产线联调', '质量验收'],
    fitJobs: ['工业视觉检测工程师', 'AI产品实施顾问']
  },
  {
    id: 'cert-data-analyst',
    name: '数据分析处理工程技术人员证书',
    level: '中级',
    category: '专业技术证书',
    summary: '认证数据采集、清洗、建模、分析报告和数据可视化交付能力。',
    tags: ['数据治理', '指标建模', '可视化'],
    issuer: '中国商业联合会数据分析专业委员会',
    validPeriod: '3年',
    passRate: '64%',
    salaryBoost: '+13%',
    requirements: '具备统计基础、SQL、Python数据分析和业务指标拆解能力。',
    examItems: ['统计分析基础', 'SQL数据查询', 'Python数据处理', '指标体系设计', '分析报告表达'],
    fitJobs: ['AI数据分析师', '数据治理工程师']
  }
]

export const COMPANY_DETAILS: CompanyDetail[] = [
  {
    id: 'company-glodon',
    name: '广联达',
    fullName: '广联达科技股份有限公司',
    tags: ['BIM平台', '工程造价', '智慧工地'],
    summary: '广联达面向工程建设全过程提供BIM协同、数字造价、智慧工地和项目管理平台，是智能建造工程专业对接建筑数字化平台的重要企业样本。',
    fields: [
      { label: '所在地区', value: '北京海淀' },
      { label: '所属行业', value: '建筑数字化平台 / 工程软件' },
      { label: '企业规模', value: '大型上市公司' },
      { label: '成立时间', value: '1998年' },
      { label: '年均招聘', value: '约3500人/年' },
      { label: '产业链环节', value: '中游-BIM协同与智慧工地平台' }
    ],
    products: ['BIM协同平台', '数字造价平台', '智慧工地平台', '工程项目管理系统'],
    directions: ['BIM深化设计', '工程项目智慧管理', '工程数据治理', '智慧工地平台实施'],
    jobs: ['BIM深化设计工程师', '智慧建造平台实施顾问', '工程项目数字化管理员'],
    cooperation: [
      { label: '合作类型', value: '课程资源共建 / 平台实训' },
      { label: '合作详情', value: '共建BIM协同、智慧工地看板和项目数字化管理综合实训。' }
    ]
  },
  {
    id: 'company-china-construction',
    name: '中国建筑',
    fullName: '中国建筑集团有限公司',
    tags: ['房屋建筑', '基础设施', '智能建造'],
    summary: '中国建筑在大型房建、市政和基础设施项目中持续推进智能建造、装配式施工、智慧工地和绿色建造应用。',
    fields: [
      { label: '所在地区', value: '全国' },
      { label: '所属行业', value: '房屋建筑 / 基础设施' },
      { label: '企业规模', value: '大型央企' },
      { label: '成立时间', value: '1982年' },
      { label: '年均招聘', value: '约20000人/年' },
      { label: '产业链环节', value: '下游-智能建造工程实施' }
    ],
    products: ['智慧工地项目', '装配式施工体系', '绿色施工示范工程', '数字建造管理'],
    directions: ['智能施工', '装配式建造', '项目数字化管理', '质量安全智慧监管'],
    jobs: ['智能建造施工技术员', '智慧工地管理工程师', '绿色施工管理工程师'],
    cooperation: [
      { label: '合作类型', value: '实训基地 / 项目案例' },
      { label: '合作详情', value: '引入施工现场数字化管理、安全质量巡检和智能施工组织项目案例。' }
    ]
  },
  {
    id: 'company-pm',
    name: '品茗科技',
    fullName: '品茗科技股份有限公司',
    tags: ['智慧工地', '安全管理', '施工平台'],
    summary: '品茗科技聚焦施工企业数字化、智慧工地、安全管理和工程项目平台，适合支撑智慧工地管理岗位群建设。',
    fields: [
      { label: '所在地区', value: '浙江杭州' },
      { label: '所属行业', value: '智慧工地 / 建筑施工软件' },
      { label: '企业规模', value: '上市公司' },
      { label: '成立时间', value: '2011年' },
      { label: '年均招聘', value: '约1200人/年' },
      { label: '产业链环节', value: '中游-智慧工地管理平台' }
    ],
    products: ['智慧工地平台', '安全计算软件', '项目管理平台', '施工现场物联系统'],
    directions: ['智慧工地实施', '安全物联', '项目看板配置', '质量安全数据分析'],
    jobs: ['智慧工地安全物联专员', '工程项目数字化管理员', '智能检测数据分析师'],
    cooperation: [
      { label: '合作类型', value: '软件平台 / 安全物联实训' },
      { label: '合作详情', value: '共建现场数据采集、安全预警、劳务实名制和项目看板实训任务。' }
    ]
  },
  {
    id: 'company-cctc',
    name: '中建科技',
    fullName: '中建科技集团有限公司',
    tags: ['装配式建筑', '绿色建造', '建筑工业化'],
    summary: '中建科技围绕装配式建筑、绿色建造和建筑工业化开展设计、生产、施工一体化服务，是装配式岗位群的重要企业样本。',
    fields: [
      { label: '所在地区', value: '全国' },
      { label: '所属行业', value: '装配式建筑 / 建筑工业化' },
      { label: '企业规模', value: '大型央企子公司' },
      { label: '成立时间', value: '2015年' },
      { label: '年均招聘', value: '约1800人/年' },
      { label: '产业链环节', value: '上游-装配式构件生产与数字工厂' }
    ],
    products: ['装配式构件', 'PC工厂管理', '装配式深化设计', '绿色建筑产品'],
    directions: ['装配式深化设计', '构件生产工艺', '构件质量检测', '绿色建造'],
    jobs: ['装配式建筑深化设计师', '装配式构件生产工艺员', '装配式构件质量检测员'],
    cooperation: [
      { label: '合作类型', value: '构件厂参观 / 生产工艺项目' },
      { label: '合作详情', value: '建设构件深化、生产排产、质量检测和装配施工一体化项目。' }
    ]
  },
  {
    id: 'company-yuanda',
    name: '沈阳远大智能工业',
    fullName: '沈阳远大智能工业集团股份有限公司',
    tags: ['建筑工业化', '智能装备', '装配式构件'],
    summary: '沈阳远大智能工业具有建筑工业化和智能装备基础，可为辽宁区域智能建造、构件生产和建筑机器人应用提供本地企业样本。',
    fields: [
      { label: '所在地区', value: '辽宁沈阳' },
      { label: '所属行业', value: '建筑工业化 / 智能装备' },
      { label: '企业规模', value: '大型制造企业' },
      { label: '成立时间', value: '1993年' },
      { label: '年均招聘', value: '约900人/年' },
      { label: '产业链环节', value: '上游-智能装备与构件生产' }
    ],
    products: ['装配式建筑产品', '建筑工业化装备', '智能制造产线', '工程配套设备'],
    directions: ['建筑机器人应用', '构件质量检测', '智能装备联调', '构件生产管理'],
    jobs: ['建筑机器人应用工程师', '装配式构件质量检测员', '装配式构件生产工艺员'],
    cooperation: [
      { label: '合作类型', value: '区域企业实训 / 设备联调' },
      { label: '合作详情', value: '围绕建筑工业化装备、构件检测和智能施工设备设计本地化实训项目。' }
    ]
  },
  {
    id: 'company-pkpm',
    name: '盈建科/构力科技',
    fullName: '北京盈建科软件股份有限公司 / 中国建筑科学研究院构力科技',
    tags: ['结构设计', '工程计算', 'BIM协同'],
    summary: '盈建科与构力科技长期服务建筑结构设计、工程计算和BIM协同场景，可支撑结构数智化设计和结构健康监测岗位建设。',
    fields: [
      { label: '所在地区', value: '北京' },
      { label: '所属行业', value: '结构设计软件 / 工程计算' },
      { label: '企业规模', value: '行业软件企业' },
      { label: '成立时间', value: '2000年前后' },
      { label: '年均招聘', value: '约600人/年' },
      { label: '产业链环节', value: '中游-工程设计软件与检测监测' }
    ],
    products: ['结构设计软件', 'BIM协同工具', '工程计算平台', '结构分析服务'],
    directions: ['参数化建筑设计', '结构健康监测', 'BIM协同设计', '工程数据复核'],
    jobs: ['结构健康监测工程师', '参数化建筑设计技术员', 'BIM深化设计工程师'],
    cooperation: [
      { label: '合作类型', value: '结构数智化设计 / 监测项目' },
      { label: '合作详情', value: '共建结构设计复核、BIM协同出图和监测数据分析项目。' }
    ]
  }
]

export const PORTRAIT_COMPETENCY_MAP_CONFIGS: Record<string, PortraitCompetencyMapConfig> = {
  'job-model-deploy': {
    abilityGroups: [
      {
        key: 'knowledge',
        label: '知识',
        items: [
          '机器学习模型推理流程', 'Linux与容器基础', '模型格式与转换规范', 'MLOps生命周期', 'API接口与服务协议',
          '深度学习训练-推理链路', 'GPU与CPU异构算力基础', '模型压缩与量化原理', '批处理与流式推理模式', '向量检索与Embedding基础',
          '微服务架构基础', '云原生部署基础', '服务网关与负载均衡原理', '常见消息队列机制', '配置中心与服务注册原理',
          '灰度发布与蓝绿发布策略', '可观测性指标体系', 'Prometheus监控原理', '日志链路追踪基础', '缓存与数据库调用机制',
          '高并发接口设计原则', '模型版本治理规范', '数据特征一致性原则', '特征工程上线规范', '隐私计算与脱敏基础',
          'AI安全与模型风险基础', '服务容灾与高可用设计', '资源调度与弹性伸缩原理', '边缘部署架构认知', '推理加速引擎基础',
          '服务性能压测方法', '交付文档与变更管理规范', '行业业务流程认知'
        ]
      },
      {
        key: 'skill',
        label: '技能',
        items: [
          'Python工程开发', '模型服务部署', 'Docker镜像构建', 'ONNX模型转换', '性能监控与问题定位',
          'FastAPI服务封装', '推理接口联调', 'TensorRT推理优化', 'TorchScript模型导出', '容器编排配置',
          'CI/CD流水线配置', 'Nginx网关配置', 'Prometheus指标接入', 'Grafana监控看板搭建', '日志检索与告警配置',
          '服务灰度发布', '版本回滚处理', '环境变量与密钥管理', '依赖冲突排查', '多环境部署脚本编写',
          '接口压测执行', 'GPU资源调优', '模型量化压缩', '批处理任务调度', '缓存策略配置',
          '数据库连接调优', '异常链路排查', '部署文档编制', '跨系统联调测试', '云主机资源配置',
          '对象存储接入', '消息队列接入', '边缘终端模型下发', '服务SLA巡检'
        ]
      },
      {
        key: 'quality',
        label: '素养',
        items: [
          '数据安全与合规意识', '跨团队协作', '服务稳定性责任心', '问题闭环意识', '规范化交付意识',
          '变更风险意识', '故障响应敏捷性', '持续复盘意识', '用户场景理解', '工程质量意识',
          '文档沉淀习惯', '成本控制意识', '时效管理能力', '主动沟通意识', '线上值守责任感',
          '压力下决策能力', '多任务协同能力', '客户需求翻译能力', '结果导向意识', '持续学习意识',
          '标准化执行意识', '安全保密意识', '版本留痕意识', '现场支持配合度', '异常预警敏感度',
          '交付边界意识', '接口协同意识', '沟通表达能力', '技术伦理意识', '稳定发布心态',
          '系统思维', '资源统筹意识', '质量复核习惯'
        ]
      }
    ],
    taskAbilities: {
      模型服务化方案设计: [
        '机器学习模型推理流程', '微服务架构基础', '服务网关与负载均衡原理', '高并发接口设计原则',
        'Python工程开发', 'FastAPI服务封装', 'Nginx网关配置', '部署文档编制',
        '用户场景理解', '规范化交付意识', '交付边界意识', '沟通表达能力'
      ],
      模型部署与接口联调: [
        'Linux与容器基础', '模型格式与转换规范', 'API接口与服务协议', '配置中心与服务注册原理',
        '模型服务部署', 'Docker镜像构建', '推理接口联调', '跨系统联调测试',
        '跨团队协作', '问题闭环意识', '服务意识', '现场支持配合度'
      ],
      推理性能优化: [
        'GPU与CPU异构算力基础', '模型压缩与量化原理', '批处理与流式推理模式', '推理加速引擎基础',
        'TensorRT推理优化', '接口压测执行', 'GPU资源调优', '模型量化压缩',
        '成本控制意识', '持续复盘意识', '结果导向意识', '系统思维'
      ],
      模型上线运维: [
        '可观测性指标体系', 'Prometheus监控原理', '日志链路追踪基础', '服务容灾与高可用设计',
        'Prometheus指标接入', 'Grafana监控看板搭建', '日志检索与告警配置', '服务SLA巡检',
        '服务稳定性责任心', '异常预警敏感度', '线上值守责任感', '标准化执行意识'
      ],
      业务效果回收与迭代: [
        '向量检索与Embedding基础', '数据特征一致性原则', '特征工程上线规范', '行业业务流程认知',
        '缓存策略配置', '数据库连接调优', '异常链路排查', '对象存储接入',
        '用户场景理解', '客户需求翻译能力', '持续学习意识', '技术伦理意识'
      ],
      部署文档编制: [
        'MLOps生命周期', '模型版本治理规范', '交付文档与变更管理规范', 'AI安全与模型风险基础',
        '版本回滚处理', '多环境部署脚本编写', '环境变量与密钥管理', 'CI/CD流水线配置',
        '文档沉淀习惯', '安全保密意识', '版本留痕意识', '质量复核习惯'
      ]
    }
  }
}

const buildSmartConstructionPortraitDetail = (id: string): PortraitJobDetail | null => {
  const job = SMART_CONSTRUCTION_JOBS.find((item) => item.id === id)
  if (!job) return null

  const detail = getSmartConstructionJobDetail(id)
  const industry = SMART_CONSTRUCTION_INDUSTRIES.find((node) => node.id === job.industryNodeId)
  const chain = SMART_CONSTRUCTION_CHAINS.find((item) => item.id === industry?.chainId)
  const groupedAbilities = {
    knowledge: detail.abilities.filter((ability) => ability.category === '知识').map((ability) => ability.name),
    skill: detail.abilities.filter((ability) => ability.category === '技能').map((ability) => ability.name),
    quality: detail.abilities.filter((ability) => ability.category === '素养').map((ability) => ability.name)
  }

  return {
    id: job.id,
    name: job.name,
    salary: detail.salaryRange,
    salaryUnit: '/月',
    education: detail.education,
    experience: detail.experience,
    level: job.taskCount >= 6 ? '中级' : '初中级',
    demand: detail.demandVolume,
    careerPath: detail.careerPath,
    chain: chain?.name ?? '智能建造产业链',
    node: industry?.name ?? '智能建造工程场景',
    tags: [industry?.name ?? '智能建造', job.groupName, `需求量 ${detail.demandVolume}`],
    summary: detail.workSummary,
    abilityGroups: [
      { key: 'knowledge', label: '知识', items: groupedAbilities.knowledge },
      { key: 'skill', label: '技能', items: groupedAbilities.skill },
      { key: 'quality', label: '素养', items: groupedAbilities.quality }
    ],
    radarSeries: [
      { label: '知识', values: [86, 82, 88, 80, 84], color: '#326fff' },
      { label: '技能', values: [88, 90, 84, 86, 82], color: '#20bfb8' },
      { label: '素养', values: [84, 86, 82, 88, 90], color: '#8b52e8' }
    ],
    tasks: detail.tasks.map((task) => task.name),
    certificates: [
      { id: 'cert-bim', name: '建筑信息模型技术员职业技能证书', level: '中级' },
      { id: 'cert-smart-site', name: '智慧工地应用能力证书', level: '专项' }
    ],
    majors: ['智能建造工程', '建筑工程', '土木工程', '工程造价'],
    companies: [
      { id: 'company-glodon', name: '广联达', industry: '建筑数字化平台', location: '北京海淀', tags: ['BIM', '智慧工地'] },
      { id: 'company-china-construction', name: '中国建筑', industry: '房屋建筑与基础设施', location: '全国', tags: ['智能建造', '工程总承包'] },
      { id: 'company-pkpm', name: '盈建科/构力科技', industry: '结构设计与工程软件', location: '北京', tags: ['结构设计', 'BIM协同'] }
    ]
  }
}

export const getPortraitJobDetail = (id: string) =>
  PORTRAIT_JOB_DETAILS.find((job) => job.id === id) ?? buildSmartConstructionPortraitDetail(id)

export const getCertificateDetail = (id: string) =>
  CERTIFICATE_DETAILS.find((certificate) => certificate.id === id)

export const getCompanyDetail = (id: string) =>
  COMPANY_DETAILS.find((company) => company.id === id)

export const RESEARCH_JOB_CANDIDATES: ResearchJobCandidate[] = SMART_CONSTRUCTION_JOBS.map((job) => {
  const detail = getSmartConstructionJobDetail(job.id)
  const industry = SMART_CONSTRUCTION_INDUSTRIES.find((node) => node.id === job.industryNodeId)
  const chain = SMART_CONSTRUCTION_CHAINS.find((item) => item.id === industry?.chainId)

  return {
    id: job.id,
    name: job.name,
    groupName: job.groupName,
    occupation: job.occupation,
    occupationCode: job.occupationCode,
    taskCount: job.taskCount,
    abilityCount: job.abilityCount,
    industryNodeId: job.industryNodeId,
    industryNode: industry?.name ?? '智能建造工程场景',
    chain: chain?.name ?? '智能建造产业链',
    salary: detail.salaryRange,
    demand: detail.demandVolume,
    keywords: detail.abilities.slice(0, 4).map((ability) => ability.name)
  }
})

export const DEMAND_KPIS = [
  { label: '近12月岗位需求', value: '126,480', trend: '+22.8%' },
  { label: '高频招聘岗位', value: '48', trend: '+12' },
  { label: '平均薪资', value: '10.6K', trend: '+9.5%' },
  { label: '企业样本', value: '1,860', trend: '+28.2%' }
]

export const DEMAND_TREND = [
  { month: '1月', value: 58 },
  { month: '2月', value: 62 },
  { month: '3月', value: 73 },
  { month: '4月', value: 69 },
  { month: '5月', value: 82 },
  { month: '6月', value: 88 },
  { month: '7月', value: 92 },
  { month: '8月', value: 86 },
  { month: '9月', value: 96 },
  { month: '10月', value: 104 },
  { month: '11月', value: 112 },
  { month: '12月', value: 121 }
]

export const DEMAND_JOB_ROWS = [
  { name: 'BIM深化设计工程师', demand: '16,420', salary: '8K-15K', growth: '+22%', city: '沈阳 / 大连 / 北京' },
  { name: '智慧工地管理工程师', demand: '14,860', salary: '9K-16K', growth: '+26%', city: '沈阳 / 天津 / 青岛' },
  { name: '智能建造施工技术员', demand: '13,780', salary: '7K-13K', growth: '+19%', city: '沈阳 / 大连 / 长春' },
  { name: '结构健康监测工程师', demand: '10,960', salary: '9K-17K', growth: '+24%', city: '北京 / 大连 / 上海' },
  { name: '建筑机器人应用工程师', demand: '9,830', salary: '10K-18K', growth: '+31%', city: '沈阳 / 苏州 / 深圳' },
  { name: '建筑数据治理工程师', demand: '8,740', salary: '9K-16K', growth: '+28%', city: '北京 / 沈阳 / 杭州' }
]

export const DEMAND_SKILL_BARS = [
  { name: 'BIM建模与深化设计', value: 94 },
  { name: '智慧工地平台应用', value: 88 },
  { name: '智能测量与三维扫描', value: 82 },
  { name: '智能检测监测数据分析', value: 78 },
  { name: '装配式构件深化与生产', value: 74 },
  { name: '建筑机器人与设备联调', value: 68 }
]

export const FORECAST_DIRECTIONS = [
  {
    name: '建筑机器人协同施工',
    stage: '快速落地',
    impact: '测量机器人、喷涂机器人、巡检机器人进入施工现场，推动设备联调、工艺适配和安全协同岗位增长。',
    jobs: ['建筑机器人应用工程师', '智能建造施工技术员'],
    majors: ['智能建造工程', '建筑工程', '机电一体化技术']
  },
  {
    name: 'BIM+数字孪生工地',
    stage: '高增探索',
    impact: '施工进度、质量、安全、物资和设备数据与BIM模型联动，带来数字化项目管理与平台实施岗位。',
    jobs: ['智慧工地管理工程师', '工程项目数字化管理员'],
    majors: ['智能建造工程', '工程管理', '建筑信息模型技术']
  },
  {
    name: '结构健康智能监测',
    stage: '规模扩张',
    impact: '桥梁、厂房、超高层和装配式建筑运维阶段持续接入传感监测，检测数据分析岗位需求上升。',
    jobs: ['结构健康监测工程师', '智能检测数据分析师'],
    majors: ['智能建造工程', '土木工程', '测绘工程']
  },
  {
    name: '装配式构件数字工厂',
    stage: '政策驱动',
    impact: '构件深化设计、生产排程、质量追溯和现场吊装协同进一步数据化，构件生产工艺与质量检测岗位持续扩张。',
    jobs: ['装配式构件生产工艺员', '装配式构件质量检测员'],
    majors: ['智能建造工程', '建筑工程', '智能制造工程']
  },
  {
    name: '低碳建造与能耗管理',
    stage: '风险刚需',
    impact: '绿色施工、能耗监测、碳排核算逐步进入项目管理要求，绿色建造与建筑能耗管理岗位形成新增长点。',
    jobs: ['绿色施工管理工程师', '建筑能耗与碳管理专员'],
    majors: ['智能建造工程', '建筑环境与能源应用工程', '工程管理']
  },
  {
    name: '无人机与三维扫描巡检',
    stage: '场景深化',
    impact: '无人机航测、三维激光扫描和实景建模成为施工巡检、土方计量和竣工交付的重要数据来源。',
    jobs: ['无人机智能建造应用工程师', '三维激光扫描建模师'],
    majors: ['智能建造工程', '测绘工程', '无人机应用技术']
  }
]

export const FORECAST_NEW_JOBS = [
  { name: '建筑机器人应用工程师', urgency: '高', salary: '10K-18K', matchedMajor: '智能建造工程', skills: ['设备联调', '施工工艺适配', '安全协同'] },
  { name: '智慧工地管理工程师', urgency: '高', salary: '9K-16K', matchedMajor: '智能建造工程', skills: ['平台配置', '进度质量安全联动', '数据看板'] },
  { name: '结构健康监测工程师', urgency: '中高', salary: '9K-17K', matchedMajor: '智能建造工程', skills: ['传感监测', '数据判读', '风险预警'] },
  { name: '建筑数据治理工程师', urgency: '中高', salary: '9K-16K', matchedMajor: '智能建造工程', skills: ['BIM数据标准', '模型校核', '数据质量'] },
  { name: '建筑能耗与碳管理专员', urgency: '中', salary: '7K-13K', matchedMajor: '智能建造工程', skills: ['能耗监测', '碳排核算', '绿色施工'] },
  { name: '三维激光扫描建模师', urgency: '中', salary: '7K-14K', matchedMajor: '智能建造工程', skills: ['点云处理', '实景建模', '竣工交付'] }
]

export const FORECAST_TRAINING_TABLE = [
  { direction: '建筑机器人协同施工', course: '智能机械与机器人、智能建造施工技术', major: '智能建造工程' },
  { direction: 'BIM+数字孪生工地', course: '建筑信息模型应用、工程项目智慧管理', major: '智能建造工程' },
  { direction: '结构健康智能监测', course: '智能检测与监测技术、建筑结构智能检测与健康监测', major: '智能建造工程' },
  { direction: '装配式构件数字工厂', course: '装配式建筑构件生产与管理、装配式深化设计协同与应用', major: '智能建造工程' },
  { direction: '低碳建造与能耗管理', course: '绿色建造与节能技术、建筑智能化与智慧运维', major: '智能建造工程' },
  { direction: '无人机与三维扫描巡检', course: '无人机智能建造应用、智能测量技术', major: '智能建造工程' }
]
