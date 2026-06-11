/**
 * 岗位中心 mock 数据。
 * 场景：智能建造工程专业围绕智能建造产业链进行岗位、任务、能力与课程关系梳理。
 */
export interface IndustryLane {
  id: string
  name: string
  total: number
}

export interface IndustryNode {
  id: string
  name: string
  chainId: string
}

export interface IndustryChainRelation {
  chainId: string
  industryNodeId: string
}

export interface JobIndustryRelation {
  industryNodeId: string
  jobId: string
}

export interface JobGroup {
  id: string
  name: string
  industryNodeId: string
  jobIds: string[]
}

export interface CourseNode {
  id: string
  code: string
  name: string
  jobIds: string[]
}

export interface JobCard {
  id: string
  name: string
  groupId: string
  groupName: string
  occupation: string
  occupationCode: string
  taskCount: number
  abilityCount: number
  industryNodeId: string
}

export interface GraphJobCourse {
  job: string
  course: string
}

export interface GraphIndustryGroup {
  industry: string
  relations: GraphJobCourse[]
}

export interface GraphChainGroup {
  chain: string
  chainCount: number
  industries: GraphIndustryGroup[]
}

export interface JobTask {
  name: string
  description: string
  abilities: string[]
}

export interface JobAbility {
  name: string
  category: '知识' | '技能' | '素养'
  definition: string
}

export interface SuitabilityDomain {
  name: string
  score: number
  weight: number
}

export interface JobDetail {
  careerPath: string
  workSummary: string
  requirements: string
  relatedCompanies: string
  demandLevel: string
  demandVolume: string
  salaryRange: string
  education: string
  experience: string
  tasks: JobTask[]
  abilities: JobAbility[]
  suitability: SuitabilityDomain[]
}

export const MIN_JOB_ABILITY_COUNT = 80

export const AI_JOB_CENTER_SUMMARY = {
  major: '智能建造工程',
  jobCount: 24,
  taskCount: 132,
  abilityCount: 1920,
  text:
    '该专业已围绕智能建造产业链完成岗位画像梳理，覆盖BIM深化设计、装配式建造、智能施工装备、智慧工地管理、智能检测监测与绿色智慧运维等关键就业方向。'
}

export const INDUSTRY_CHAINS: IndustryLane[] = [
  { id: 'chain-foundation', name: '智能建造基础资源与装备链', total: 8 },
  { id: 'chain-platform', name: '建筑数字化平台与工程服务链', total: 9 },
  { id: 'chain-application', name: '智能建造场景应用链', total: 7 }
]

export const INDUSTRY_NODES: IndustryNode[] = [
  { id: 'node-bim-data', name: 'BIM标准与工程数据资源', chainId: 'chain-foundation' },
  { id: 'node-smart-survey', name: '智能测绘与空间数据采集', chainId: 'chain-foundation' },
  { id: 'node-iot-sensing', name: '建筑物联网与传感终端', chainId: 'chain-foundation' },
  { id: 'node-prefab', name: '装配式构件生产与数字工厂', chainId: 'chain-foundation' },
  { id: 'node-bim-platform', name: 'BIM协同设计与算量平台', chainId: 'chain-platform' },
  { id: 'node-smart-site', name: '智慧工地管理平台', chainId: 'chain-platform' },
  { id: 'node-robotics', name: '建筑机器人与智能装备应用', chainId: 'chain-platform' },
  { id: 'node-monitoring', name: '智能检测监测与结构健康', chainId: 'chain-application' },
  { id: 'node-green-ops', name: '绿色建造与智慧运维场景', chainId: 'chain-application' }
]

export const INDUSTRY_CHAIN_RELATIONS: IndustryChainRelation[] = [
  { chainId: 'chain-foundation', industryNodeId: 'node-bim-data' },
  { chainId: 'chain-foundation', industryNodeId: 'node-smart-survey' },
  { chainId: 'chain-foundation', industryNodeId: 'node-iot-sensing' },
  { chainId: 'chain-foundation', industryNodeId: 'node-prefab' },
  { chainId: 'chain-platform', industryNodeId: 'node-bim-platform' },
  { chainId: 'chain-platform', industryNodeId: 'node-smart-site' },
  { chainId: 'chain-platform', industryNodeId: 'node-robotics' },
  { chainId: 'chain-platform', industryNodeId: 'node-bim-data' },
  { chainId: 'chain-application', industryNodeId: 'node-monitoring' },
  { chainId: 'chain-application', industryNodeId: 'node-green-ops' },
  { chainId: 'chain-application', industryNodeId: 'node-smart-site' },
  { chainId: 'chain-application', industryNodeId: 'node-prefab' }
]

export const JOB_GROUPS: JobGroup[] = [
  {
    id: 'group-bim-design',
    name: 'BIM深化设计与数字建模岗位群',
    industryNodeId: 'node-bim-platform',
    jobIds: ['job-bim-modeler', 'job-bim-deepening', 'job-parametric-design']
  },
  {
    id: 'group-prefab',
    name: '装配式设计生产岗位群',
    industryNodeId: 'node-prefab',
    jobIds: ['job-prefab-designer', 'job-component-production', 'job-prefab-quality']
  },
  {
    id: 'group-smart-construction',
    name: '智能施工与机器人应用岗位群',
    industryNodeId: 'node-robotics',
    jobIds: ['job-smart-construction-tech', 'job-construction-robot-operator', 'job-uav-construction']
  },
  {
    id: 'group-smart-site',
    name: '智慧工地管理岗位群',
    industryNodeId: 'node-smart-site',
    jobIds: ['job-smart-site-manager', 'job-project-digital-manager', 'job-safety-iot']
  },
  {
    id: 'group-monitoring',
    name: '智能检测监测岗位群',
    industryNodeId: 'node-monitoring',
    jobIds: ['job-structure-monitoring', 'job-smart-inspection', 'job-quality-data']
  },
  {
    id: 'group-survey',
    name: '智能测绘与数据采集岗位群',
    industryNodeId: 'node-smart-survey',
    jobIds: ['job-smart-survey', 'job-laser-scan', 'job-site-data-collector']
  },
  {
    id: 'group-green-ops',
    name: '绿色建造与智慧运维岗位群',
    industryNodeId: 'node-green-ops',
    jobIds: ['job-green-construction', 'job-building-smart-ops', 'job-energy-carbon']
  },
  {
    id: 'group-data-platform',
    name: '建筑数据治理与平台实施岗位群',
    industryNodeId: 'node-bim-data',
    jobIds: ['job-bim-data-governance', 'job-construction-platform-implementation', 'job-iot-device-integration']
  }
]

export const COURSE_NODES: CourseNode[] = [
  { id: 'course-bim-basic', code: 'ZNJZ-BIM-001', name: '建筑信息模型基础', jobIds: ['job-bim-modeler', 'job-bim-deepening', 'job-bim-data-governance'] },
  { id: 'course-bim-app', code: 'ZNJZ-BIM-002', name: '建筑信息模型应用', jobIds: ['job-bim-deepening', 'job-parametric-design', 'job-project-digital-manager'] },
  { id: 'course-smart-survey', code: 'ZNJZ-SUR-001', name: '智能测量技术', jobIds: ['job-smart-survey', 'job-laser-scan', 'job-site-data-collector'] },
  { id: 'course-smart-construction', code: 'ZNJZ-CON-001', name: '智能建造施工技术', jobIds: ['job-smart-construction-tech', 'job-construction-robot-operator', 'job-uav-construction'] },
  { id: 'course-quality-safety', code: 'ZNJZ-QS-001', name: '建筑工程质量与安全管理', jobIds: ['job-safety-iot', 'job-prefab-quality', 'job-quality-data'] },
  { id: 'course-monitoring', code: 'ZNJZ-MON-001', name: '智能检测与监测技术', jobIds: ['job-structure-monitoring', 'job-smart-inspection', 'job-quality-data'] },
  { id: 'course-robot', code: 'ZNJZ-ROB-001', name: '智能机械与机器人', jobIds: ['job-construction-robot-operator', 'job-smart-construction-tech', 'job-iot-device-integration'] },
  { id: 'course-smart-project', code: 'ZNJZ-PM-001', name: '工程项目智慧管理', jobIds: ['job-smart-site-manager', 'job-project-digital-manager', 'job-construction-platform-implementation'] },
  { id: 'course-prefab-design', code: 'ZNJZ-PFAB-001', name: '装配式深化设计协同与应用', jobIds: ['job-prefab-designer', 'job-bim-deepening', 'job-prefab-quality'] },
  { id: 'course-prefab-production', code: 'ZNJZ-PFAB-002', name: '装配式建筑构件生产与管理', jobIds: ['job-component-production', 'job-prefab-quality', 'job-prefab-designer'] },
  { id: 'course-iot-site', code: 'ZNJZ-IOT-001', name: '5G与物联网在智慧工地应用', jobIds: ['job-iot-device-integration', 'job-safety-iot', 'job-smart-site-manager'] },
  { id: 'course-green-ops', code: 'ZNJZ-OPS-001', name: '建筑智能化与智慧运维', jobIds: ['job-building-smart-ops', 'job-energy-carbon', 'job-green-construction'] }
]

const BASE_JOB_CARDS: JobCard[] = [
  { id: 'job-bim-modeler', name: 'BIM建模工程师', groupId: 'group-bim-design', groupName: 'BIM深化设计与数字建模岗位群', occupation: '建筑信息模型技术员', occupationCode: '4-04-05-04', taskCount: 5, abilityCount: 12, industryNodeId: 'node-bim-platform' },
  { id: 'job-bim-deepening', name: 'BIM深化设计工程师', groupId: 'group-bim-design', groupName: 'BIM深化设计与数字建模岗位群', occupation: '建筑信息模型技术员', occupationCode: '4-04-05-04', taskCount: 6, abilityCount: 14, industryNodeId: 'node-bim-platform' },
  { id: 'job-parametric-design', name: '参数化建筑设计技术员', groupId: 'group-bim-design', groupName: 'BIM深化设计与数字建模岗位群', occupation: '数字化设计技术员', occupationCode: '2-02-18-99', taskCount: 5, abilityCount: 11, industryNodeId: 'node-bim-platform' },
  { id: 'job-prefab-designer', name: '装配式建筑深化设计师', groupId: 'group-prefab', groupName: '装配式设计生产岗位群', occupation: '土木建筑工程技术人员', occupationCode: '2-02-18-03', taskCount: 6, abilityCount: 13, industryNodeId: 'node-prefab' },
  { id: 'job-component-production', name: '装配式构件生产工艺员', groupId: 'group-prefab', groupName: '装配式设计生产岗位群', occupation: '建筑构件生产技术员', occupationCode: '6-15-01-99', taskCount: 5, abilityCount: 10, industryNodeId: 'node-prefab' },
  { id: 'job-prefab-quality', name: '装配式构件质量检测员', groupId: 'group-prefab', groupName: '装配式设计生产岗位群', occupation: '建筑工程质量检测员', occupationCode: '4-08-05-03', taskCount: 5, abilityCount: 10, industryNodeId: 'node-prefab' },
  { id: 'job-smart-construction-tech', name: '智能建造施工技术员', groupId: 'group-smart-construction', groupName: '智能施工与机器人应用岗位群', occupation: '土木建筑工程技术人员', occupationCode: '2-02-18-03', taskCount: 7, abilityCount: 15, industryNodeId: 'node-robotics' },
  { id: 'job-construction-robot-operator', name: '建筑机器人应用工程师', groupId: 'group-smart-construction', groupName: '智能施工与机器人应用岗位群', occupation: '智能制造工程技术人员', occupationCode: '2-02-07-13', taskCount: 6, abilityCount: 12, industryNodeId: 'node-robotics' },
  { id: 'job-uav-construction', name: '无人机智能建造应用工程师', groupId: 'group-smart-construction', groupName: '智能施工与机器人应用岗位群', occupation: '无人机驾驶员', occupationCode: '4-99-00-00', taskCount: 5, abilityCount: 11, industryNodeId: 'node-robotics' },
  { id: 'job-smart-site-manager', name: '智慧工地管理工程师', groupId: 'group-smart-site', groupName: '智慧工地管理岗位群', occupation: '项目管理工程技术人员', occupationCode: '2-02-30-04', taskCount: 7, abilityCount: 15, industryNodeId: 'node-smart-site' },
  { id: 'job-project-digital-manager', name: '工程项目数字化管理员', groupId: 'group-smart-site', groupName: '智慧工地管理岗位群', occupation: '项目管理工程技术人员', occupationCode: '2-02-30-04', taskCount: 6, abilityCount: 13, industryNodeId: 'node-smart-site' },
  { id: 'job-safety-iot', name: '智慧工地安全物联专员', groupId: 'group-smart-site', groupName: '智慧工地管理岗位群', occupation: '安全工程技术人员', occupationCode: '2-02-28-03', taskCount: 5, abilityCount: 10, industryNodeId: 'node-smart-site' },
  { id: 'job-structure-monitoring', name: '结构健康监测工程师', groupId: 'group-monitoring', groupName: '智能检测监测岗位群', occupation: '建筑工程检测工程技术人员', occupationCode: '2-02-18-99', taskCount: 6, abilityCount: 13, industryNodeId: 'node-monitoring' },
  { id: 'job-smart-inspection', name: '智能检测数据分析师', groupId: 'group-monitoring', groupName: '智能检测监测岗位群', occupation: '检验检测工程技术人员', occupationCode: '2-02-29-11', taskCount: 5, abilityCount: 11, industryNodeId: 'node-monitoring' },
  { id: 'job-quality-data', name: '工程质量数据工程师', groupId: 'group-monitoring', groupName: '智能检测监测岗位群', occupation: '数据分析处理工程技术人员', occupationCode: '2-02-30-09', taskCount: 5, abilityCount: 11, industryNodeId: 'node-monitoring' },
  { id: 'job-smart-survey', name: '智能测量工程师', groupId: 'group-survey', groupName: '智能测绘与数据采集岗位群', occupation: '测绘工程技术人员', occupationCode: '2-02-02-02', taskCount: 6, abilityCount: 12, industryNodeId: 'node-smart-survey' },
  { id: 'job-laser-scan', name: '三维激光扫描建模师', groupId: 'group-survey', groupName: '智能测绘与数据采集岗位群', occupation: '测绘工程技术人员', occupationCode: '2-02-02-02', taskCount: 5, abilityCount: 10, industryNodeId: 'node-smart-survey' },
  { id: 'job-site-data-collector', name: '施工现场数据采集员', groupId: 'group-survey', groupName: '智能测绘与数据采集岗位群', occupation: '工程测量员', occupationCode: '4-08-03-04', taskCount: 5, abilityCount: 9, industryNodeId: 'node-smart-survey' },
  { id: 'job-green-construction', name: '绿色施工管理工程师', groupId: 'group-green-ops', groupName: '绿色建造与智慧运维岗位群', occupation: '环境保护工程技术人员', occupationCode: '2-02-27-02', taskCount: 5, abilityCount: 10, industryNodeId: 'node-green-ops' },
  { id: 'job-building-smart-ops', name: '建筑智能运维工程师', groupId: 'group-green-ops', groupName: '绿色建造与智慧运维岗位群', occupation: '智能楼宇管理员', occupationCode: '4-07-05-03', taskCount: 6, abilityCount: 12, industryNodeId: 'node-green-ops' },
  { id: 'job-energy-carbon', name: '建筑能耗与碳管理专员', groupId: 'group-green-ops', groupName: '绿色建造与智慧运维岗位群', occupation: '碳排放管理员', occupationCode: '4-09-07-04', taskCount: 5, abilityCount: 10, industryNodeId: 'node-green-ops' },
  { id: 'job-bim-data-governance', name: '建筑数据治理工程师', groupId: 'group-data-platform', groupName: '建筑数据治理与平台实施岗位群', occupation: '大数据工程技术人员', occupationCode: '2-02-10-11', taskCount: 6, abilityCount: 13, industryNodeId: 'node-bim-data' },
  { id: 'job-construction-platform-implementation', name: '智慧建造平台实施顾问', groupId: 'group-data-platform', groupName: '建筑数据治理与平台实施岗位群', occupation: '数字化解决方案设计师', occupationCode: '4-04-05-02', taskCount: 6, abilityCount: 12, industryNodeId: 'node-bim-data' },
  { id: 'job-iot-device-integration', name: '建筑物联网集成工程师', groupId: 'group-data-platform', groupName: '建筑数据治理与平台实施岗位群', occupation: '物联网工程技术人员', occupationCode: '2-02-10-10', taskCount: 6, abilityCount: 12, industryNodeId: 'node-iot-sensing' }
]

export const JOB_CARDS: JobCard[] = BASE_JOB_CARDS.map((job) => ({
  ...job,
  abilityCount: Math.max(MIN_JOB_ABILITY_COUNT, job.abilityCount)
}))

export const JOB_INDUSTRY_RELATIONS: JobIndustryRelation[] = [
  { industryNodeId: 'node-bim-platform', jobId: 'job-bim-modeler' },
  { industryNodeId: 'node-bim-data', jobId: 'job-bim-modeler' },
  { industryNodeId: 'node-bim-platform', jobId: 'job-bim-deepening' },
  { industryNodeId: 'node-prefab', jobId: 'job-bim-deepening' },
  { industryNodeId: 'node-bim-platform', jobId: 'job-parametric-design' },
  { industryNodeId: 'node-bim-data', jobId: 'job-parametric-design' },
  { industryNodeId: 'node-prefab', jobId: 'job-prefab-designer' },
  { industryNodeId: 'node-bim-platform', jobId: 'job-prefab-designer' },
  { industryNodeId: 'node-prefab', jobId: 'job-component-production' },
  { industryNodeId: 'node-iot-sensing', jobId: 'job-component-production' },
  { industryNodeId: 'node-prefab', jobId: 'job-prefab-quality' },
  { industryNodeId: 'node-monitoring', jobId: 'job-prefab-quality' },
  { industryNodeId: 'node-robotics', jobId: 'job-smart-construction-tech' },
  { industryNodeId: 'node-smart-site', jobId: 'job-smart-construction-tech' },
  { industryNodeId: 'node-robotics', jobId: 'job-construction-robot-operator' },
  { industryNodeId: 'node-iot-sensing', jobId: 'job-construction-robot-operator' },
  { industryNodeId: 'node-smart-survey', jobId: 'job-uav-construction' },
  { industryNodeId: 'node-robotics', jobId: 'job-uav-construction' },
  { industryNodeId: 'node-smart-site', jobId: 'job-smart-site-manager' },
  { industryNodeId: 'node-bim-data', jobId: 'job-smart-site-manager' },
  { industryNodeId: 'node-smart-site', jobId: 'job-project-digital-manager' },
  { industryNodeId: 'node-bim-platform', jobId: 'job-project-digital-manager' },
  { industryNodeId: 'node-smart-site', jobId: 'job-safety-iot' },
  { industryNodeId: 'node-iot-sensing', jobId: 'job-safety-iot' },
  { industryNodeId: 'node-monitoring', jobId: 'job-structure-monitoring' },
  { industryNodeId: 'node-iot-sensing', jobId: 'job-structure-monitoring' },
  { industryNodeId: 'node-monitoring', jobId: 'job-smart-inspection' },
  { industryNodeId: 'node-smart-survey', jobId: 'job-smart-inspection' },
  { industryNodeId: 'node-monitoring', jobId: 'job-quality-data' },
  { industryNodeId: 'node-bim-data', jobId: 'job-quality-data' },
  { industryNodeId: 'node-smart-survey', jobId: 'job-smart-survey' },
  { industryNodeId: 'node-bim-data', jobId: 'job-smart-survey' },
  { industryNodeId: 'node-smart-survey', jobId: 'job-laser-scan' },
  { industryNodeId: 'node-bim-platform', jobId: 'job-laser-scan' },
  { industryNodeId: 'node-smart-survey', jobId: 'job-site-data-collector' },
  { industryNodeId: 'node-smart-site', jobId: 'job-site-data-collector' },
  { industryNodeId: 'node-green-ops', jobId: 'job-green-construction' },
  { industryNodeId: 'node-smart-site', jobId: 'job-green-construction' },
  { industryNodeId: 'node-green-ops', jobId: 'job-building-smart-ops' },
  { industryNodeId: 'node-iot-sensing', jobId: 'job-building-smart-ops' },
  { industryNodeId: 'node-green-ops', jobId: 'job-energy-carbon' },
  { industryNodeId: 'node-bim-data', jobId: 'job-energy-carbon' },
  { industryNodeId: 'node-bim-data', jobId: 'job-bim-data-governance' },
  { industryNodeId: 'node-bim-platform', jobId: 'job-bim-data-governance' },
  { industryNodeId: 'node-bim-data', jobId: 'job-construction-platform-implementation' },
  { industryNodeId: 'node-smart-site', jobId: 'job-construction-platform-implementation' },
  { industryNodeId: 'node-iot-sensing', jobId: 'job-iot-device-integration' },
  { industryNodeId: 'node-smart-site', jobId: 'job-iot-device-integration' }
]

export const GRAPH_CHAIN_GROUPS: GraphChainGroup[] = [
  {
    chain: '智能建造基础资源与装备链',
    chainCount: 8,
    industries: [
      {
        industry: 'BIM标准与工程数据资源',
        relations: [
          { job: '建筑数据治理工程师', course: '建筑信息模型基础' },
          { job: '施工现场数据采集员', course: '智能测量技术' }
        ]
      },
      {
        industry: '智能测绘与空间数据采集',
        relations: [
          { job: '智能测量工程师', course: '智能测量技术' },
          { job: '三维激光扫描建模师', course: '建筑信息模型应用' }
        ]
      },
      {
        industry: '装配式构件生产与数字工厂',
        relations: [
          { job: '装配式构件生产工艺员', course: '装配式建筑构件生产与管理' },
          { job: '装配式构件质量检测员', course: '建筑工程质量与安全管理' }
        ]
      }
    ]
  },
  {
    chain: '建筑数字化平台与工程服务链',
    chainCount: 9,
    industries: [
      {
        industry: 'BIM协同设计与算量平台',
        relations: [
          { job: 'BIM建模工程师', course: '建筑信息模型基础' },
          { job: 'BIM深化设计工程师', course: '建筑信息模型应用' },
          { job: '参数化建筑设计技术员', course: '建筑信息模型应用' }
        ]
      },
      {
        industry: '智慧工地管理平台',
        relations: [
          { job: '智慧工地管理工程师', course: '工程项目智慧管理' },
          { job: '工程项目数字化管理员', course: '工程项目智慧管理' },
          { job: '智慧工地安全物联专员', course: '5G与物联网在智慧工地应用' }
        ]
      }
    ]
  },
  {
    chain: '智能建造场景应用链',
    chainCount: 7,
    industries: [
      {
        industry: '智能检测监测与结构健康',
        relations: [
          { job: '结构健康监测工程师', course: '智能检测与监测技术' },
          { job: '智能检测数据分析师', course: '智能检测与监测技术' }
        ]
      },
      {
        industry: '绿色建造与智慧运维场景',
        relations: [
          { job: '绿色施工管理工程师', course: '建筑智能化与智慧运维' },
          { job: '建筑智能运维工程师', course: '建筑智能化与智慧运维' },
          { job: '建筑能耗与碳管理专员', course: '建筑智能化与智慧运维' }
        ]
      }
    ]
  }
]

const STANDARD_ABILITY_TOPICS: Record<JobAbility['category'], string[]> = {
  知识: [
    '建筑工程项目全生命周期认知', '建筑制图与工程识图基础', '建筑构造与结构体系理解', '建筑材料与构件性能认知',
    '施工组织与工序逻辑知识', '工程质量验收规范知识', '安全生产法律法规知识', '绿色建造与节能标准知识',
    'BIM模型信息标准知识', 'BIM协同交付流程知识', '工程计量与造价基础知识', '装配式建筑体系知识',
    '构件深化设计规则知识', '智能测量与测绘基础知识', '三维激光点云基础知识', '无人机航测作业知识',
    '建筑机器人施工场景知识', '智能装备运行机理知识', '智慧工地平台架构知识', '物联网传感网络知识',
    '工程数据治理标准知识', '数据质量与主数据管理知识', '结构健康监测原理知识', '智能检测评价方法知识',
    '项目管理与进度控制知识', '工程合同与招采流程知识', '建筑智能化系统知识', '智慧运维业务流程知识',
    '碳排放核算基础知识', '数字孪生与可视化基础知识'
  ],
  技能: [
    'BIM模型创建与校核', 'BIM深化设计表达', '多专业模型协同检查', '构件族库维护',
    '工程量提取与复核', '施工图协同审查', '参数化建模配置', '装配式构件拆分',
    '构件生产数据整理', '施工工艺方案编制', '施工进度计划编排', '智慧工地平台配置',
    '现场物联设备接入', '传感器安装与联调', '智能测量数据采集', '点云数据处理',
    '无人机航线规划', '影像建模成果校核', '建筑机器人路径配置', '智能装备现场调试',
    '质量安全巡检记录', '检测监测数据判读', '结构风险预警分析', '工程数据清洗治理',
    '项目数据看板配置', '平台权限与流程配置', '交付文档编制', '技术培训与操作指导',
    '异常问题定位排查', '项目复盘与改进建议'
  ],
  素养: [
    '工程质量责任意识', '安全生产红线意识', '规范化交付意识', '数据真实完整意识',
    '跨专业协同沟通', '现场问题闭环意识', '数字化思维', '持续学习能力',
    '工匠精神与精益意识', '绿色低碳责任意识', '客户需求理解能力', '进度节点意识',
    '成本控制意识', '风险预判意识', '团队协作意识', '标准执行意识',
    '资料留痕意识', '设备安全操作意识', '隐私与数据安全意识', '创新改进意识',
    '复杂问题拆解能力', '抗压与应急响应能力', '职业道德与诚信意识', '成果复核习惯',
    '服务一线项目意识', '终身学习与职业发展意识'
  ]
}

const STANDARD_ABILITY_TARGETS: Record<JobAbility['category'], number> = {
  知识: 28,
  技能: 28,
  素养: 24
}

const buildStandardAbilityDefinition = (job: JobCard, category: JobAbility['category'], topic: string) => {
  if (category === '知识') {
    return `支撑${job.name}理解${topic.replace(/知识$/, '')}，用于判断岗位任务中的技术边界、规范要求和工程约束。`
  }
  if (category === '技能') {
    return `能够在${job.groupName}场景中完成${topic}，并形成可验收、可追溯的岗位工作成果。`
  }
  return `在${job.name}岗位工作中体现${topic}，保障项目协同、质量安全和持续改进。`
}

export const expandStandardJobAbilities = (job: JobCard, baseAbilities: JobAbility[]): JobAbility[] => {
  const abilitiesByName = new Map(baseAbilities.map((ability) => [ability.name, ability]))

  ;(Object.keys(STANDARD_ABILITY_TOPICS) as JobAbility['category'][]).forEach((category) => {
    const topics = STANDARD_ABILITY_TOPICS[category]
    let topicIndex = 0

    while (
      Array.from(abilitiesByName.values()).filter((ability) => ability.category === category).length <
      STANDARD_ABILITY_TARGETS[category]
    ) {
      const topic = topics[topicIndex % topics.length]
      const name = topicIndex < topics.length ? topic : `${topic}${Math.floor(topicIndex / topics.length) + 1}`
      abilitiesByName.set(name, {
        name,
        category,
        definition: buildStandardAbilityDefinition(job, category, topic)
      })
      topicIndex += 1
    }
  })

  return Array.from(abilitiesByName.values()).slice(0, Math.max(MIN_JOB_ABILITY_COUNT, abilitiesByName.size))
}

const STANDARD_TASK_ABILITY_KEYWORD_RULES = [
  {
    task: ['需求', '策划', '准备', '分析', '资料'],
    ability: ['认知', '识图', '规范', '标准', '合同', '需求', '策划', '图纸', '资料', '项目管理', '工程计量']
  },
  {
    task: ['方案', '设计', '编制', '模型', '深化', '配置'],
    ability: ['BIM', '设计', '建模', '方案', '构件', '参数化', '平台', '权限', '工艺', '路径', '模型']
  },
  {
    task: ['现场', '实施', '协同', '联调', '部署', '接入', '调试'],
    ability: ['现场', '设备', '联调', '接入', '传感器', '测量', '机器人', '无人机', '智能装备', '物联', '巡检']
  },
  {
    task: ['数据', '复核', '质量', '安全', '验收', '检测', '监测', '评价'],
    ability: ['数据', '质量', '安全', '检测', '监测', '风险', '预警', '复核', '判读', '清洗', '治理', '验收']
  },
  {
    task: ['交付', '文档', '复盘', '优化', '培训'],
    ability: ['交付', '文档', '培训', '复盘', '改进', '协同', '沟通', '成本', '留痕', '学习', '服务']
  }
]

const scoreStandardAbilityForTask = (taskName: string, abilityName: string, fallbackIndex: number) => {
  const matchedRuleScore = STANDARD_TASK_ABILITY_KEYWORD_RULES.reduce((score, rule) => {
    const taskMatched = rule.task.some((keyword) => taskName.includes(keyword))
    const abilityMatched = rule.ability.some((keyword) => abilityName.includes(keyword))
    return score + (taskMatched && abilityMatched ? 10 : 0)
  }, 0)

  return matchedRuleScore + (abilityName.length + fallbackIndex) % 5
}

const linkStandardAbilitiesToTasks = (tasks: JobTask[], abilities: JobAbility[]): JobTask[] => {
  const abilityNames = abilities.map((ability) => ability.name)
  const validAbilityNames = new Set(abilityNames)
  const taskAbilityMap = new Map(
    tasks.map((task) => [
      task.name,
      new Set(task.abilities.filter((abilityName) => validAbilityNames.has(abilityName)))
    ])
  )
  const coveredAbilityNames = new Set<string>()

  taskAbilityMap.forEach((taskAbilities) => {
    taskAbilities.forEach((abilityName) => coveredAbilityNames.add(abilityName))
  })

  abilityNames.forEach((abilityName, index) => {
    if (coveredAbilityNames.has(abilityName)) return

    const taskName = tasks.reduce((bestTaskName, task) => {
      const bestScore = scoreStandardAbilityForTask(bestTaskName, abilityName, index)
      const currentScore = scoreStandardAbilityForTask(task.name, abilityName, index)
      return currentScore > bestScore ? task.name : bestTaskName
    }, tasks[index % tasks.length].name)

    taskAbilityMap.get(taskName)?.add(abilityName)
    coveredAbilityNames.add(abilityName)
  })

  return tasks.map((task) => ({
    ...task,
    abilities: Array.from(taskAbilityMap.get(task.name) ?? [])
  }))
}

const buildSmartConstructionJobDetail = (job: JobCard): JobDetail => {
  const industry = INDUSTRY_NODES.find((node) => node.id === job.industryNodeId)
  const relatedCourses = COURSE_NODES.filter((course) => course.jobIds.includes(job.id)).map((course) => course.name)
  const courseText = relatedCourses.length ? relatedCourses.join('、') : '智能建造施工技术、工程项目智慧管理'
  const baseAbilities: JobAbility[] = [
    { name: '智能建造产业链认知', category: '知识', definition: '理解智能建造上游数据装备、中游平台服务、下游工程场景之间的价值流转关系。' },
    { name: '建筑工程识图与构造理解', category: '知识', definition: '掌握建筑构造、结构体系、施工工艺和专业图纸识读基础。' },
    { name: 'BIM模型应用与协同', category: '技能', definition: '能够基于BIM模型完成构件信息维护、专业协同、工程量提取和问题核查。' },
    { name: '智慧工地平台操作', category: '技能', definition: '能够使用智慧工地平台进行进度、质量、安全、设备和数据看板管理。' },
    { name: '工程数据采集与校核', category: '技能', definition: '能够采集现场数据、校核数据质量并形成可追溯的工程记录。' },
    { name: '质量安全与规范意识', category: '素养', definition: '遵守工程建设规范、质量验收标准和安全生产要求，具备风险预警意识。' },
    { name: '跨专业协同沟通', category: '素养', definition: '能够与设计、施工、监理、业主、设备和平台团队协作推进问题闭环。' },
    { name: '持续改进与数字化思维', category: '素养', definition: '关注新设备、新工艺、新平台和数据驱动管理方法，能持续优化岗位工作。' },
    { name: '工程资料归档', category: '技能', definition: '能够按项目管理要求整理模型、图纸、检测记录、平台报表和交付文档。' },
    { name: '施工组织与现场协调', category: '技能', definition: '能够根据施工计划协调人员、设备、材料和作业面，保障现场实施顺畅。' },
    { name: '设备联调与应用', category: '技能', definition: '能够完成智能测量、传感终端、检测设备或施工装备的基础联调与应用。' },
    { name: '数据质量意识', category: '素养', definition: '关注工程数据的准确性、完整性、时效性和可追溯性。' },
    { name: '问题分析与改进', category: '素养', definition: '能够基于现场问题、数据异常和交付反馈提出改进措施。' },
    { name: '沟通表达能力', category: '素养', definition: '能够清晰表达技术方案、现场问题、质量风险和协作需求。' }
  ]
  const expandedAbilities = expandStandardJobAbilities(job, baseAbilities)
  const baseTasks: JobTask[] = [
    {
      name: '岗位任务策划与资料准备',
      description: `根据项目阶段和${job.name}岗位职责，梳理图纸、模型、设备、平台账号和现场数据采集要求。`,
      abilities: ['智能建造产业链认知', '建筑工程识图与构造理解', '工程资料归档', '跨专业协同沟通']
    },
    {
      name: '数字模型与现场数据处理',
      description: '围绕模型、测量、传感、检测或平台数据进行采集、清洗、校核、标注和版本维护。',
      abilities: ['BIM模型应用与协同', '工程数据采集与校核', '智慧工地平台操作', '数据质量意识']
    },
    {
      name: '智能建造现场协同实施',
      description: '对接施工班组、设备厂商、平台服务商和项目管理团队，完成现场部署、调试、应用和问题闭环。',
      abilities: ['施工组织与现场协调', '设备联调与应用', '质量安全与规范意识', '跨专业协同沟通']
    },
    {
      name: '质量安全检查与效果评价',
      description: '依据标准规范和项目指标，检查交付成果质量、安全风险、数据完整性和应用成效。',
      abilities: ['质量安全与规范意识', '工程数据采集与校核', '问题分析与改进', '持续改进与数字化思维']
    },
    {
      name: '交付文档编制与复盘优化',
      description: '输出模型成果、检测记录、平台配置、施工日志、验收资料和项目复盘建议。',
      abilities: ['工程资料归档', 'BIM模型应用与协同', '沟通表达能力', '持续改进与数字化思维']
    }
  ]

  return {
    careerPath: `${job.name} → ${job.groupName.replace('岗位群', '骨干')} → 智能建造项目负责人 → 数字建造技术经理`,
    workSummary:
      `面向${industry?.name ?? '智能建造工程场景'}，负责${job.name}相关的方案编制、模型或数据处理、现场协同、质量安全控制和交付复盘，支撑建筑工程数字化、智能化和绿色化实施。`,
    requirements:
      `1. 熟悉建筑工程基础知识与施工现场流程；2. 掌握${courseText}等课程对应工具和方法；3. 能够使用BIM、智慧工地、智能测量或检测设备完成岗位任务；4. 具备质量安全意识、沟通协同能力和工程资料归档能力。`,
    relatedCompanies: '中国建筑、辽宁建工、沈阳远大、广联达、品茗科技、中建科技、鸿业科技、盈建科',
    demandLevel: job.taskCount >= 6 ? '高' : '中高',
    demandVolume: `${(job.taskCount * 1850 + job.abilityCount * 120).toLocaleString('zh-CN')}`,
    salaryRange: job.taskCount >= 6 ? '8K-16K' : '6K-12K',
    education: '本科及以上',
    experience: '应届-3年',
    tasks: linkStandardAbilitiesToTasks(baseTasks, expandedAbilities),
    abilities: expandedAbilities,
    suitability: [
      { name: '工程基础与规范', score: 86, weight: 25 },
      { name: '数字工具应用', score: 90, weight: 25 },
      { name: '现场实施能力', score: 88, weight: 25 },
      { name: '数据与质量意识', score: 84, weight: 15 },
      { name: '沟通协作素养', score: 82, weight: 10 }
    ]
  }
}

const SMART_CONSTRUCTION_JOB_DETAIL_BY_ID = Object.fromEntries(
  JOB_CARDS.map((job) => [job.id, buildSmartConstructionJobDetail(job)])
) as Record<string, JobDetail>

export const JOB_DETAIL_BY_ID: Record<string, JobDetail> = {
  'job-model-deploy': {
    careerPath: '模型部署工程师 → MLOps工程师 → AI平台架构师 → 智能产品技术负责人',
    workSummary:
      '负责将训练完成的机器学习、深度学习或大模型能力部署到生产环境，完成模型服务化、接口联调、性能监控、版本迭代和上线运维，保障人工智能应用稳定运行。',
    requirements:
      '1. 熟悉Python与Linux基础环境；2. 掌握模型推理服务部署、接口调试和日志排查；3. 了解Docker、FastAPI、ONNX、模型压缩等工具；4. 具备跨部门沟通、问题定位和持续优化意识。',
    relatedCompanies: '百度智能云、阿里云、科大讯飞、商汤科技、旷视科技、云从科技',
    demandLevel: '高',
    demandVolume: '18,640',
    salaryRange: '10K-18K',
    education: '大专及以上',
    experience: '1-3年',
    tasks: [
      {
        name: '模型服务化方案设计',
        description: '根据业务场景选择模型推理框架、接口协议和部署架构，形成上线方案。',
        abilities: [
          'AI应用业务场景认知',
          'API接口与服务协议',
          'MLOps流程与生命周期',
          '高可用部署架构知识',
          'FastAPI接口封装',
          '部署文档编写',
          '用户场景理解',
          '规范化交付意识',
          '沟通表达能力'
        ]
      },
      {
        name: '模型部署与接口联调',
        description: '完成模型文件转换、服务启动、API联调和异常排查。',
        abilities: [
          'Linux与容器基础',
          '容器镜像与运行时原理',
          '模型格式与转换规范',
          'Python工程开发',
          '模型服务部署',
          'Docker镜像构建',
          'ONNX模型转换',
          '接口联调与异常排查',
          '跨团队协作',
          '质量意识'
        ]
      },
      {
        name: '推理性能优化',
        description: '通过批处理、缓存、模型压缩或运行参数调优提升推理速度和资源利用率。',
        abilities: [
          '深度学习模型结构认知',
          'GPU/CPU推理资源基础',
          '模型压缩与量化原理',
          '数据预处理与特征规范',
          '推理性能压测',
          '服务日志分析',
          '资源利用率优化',
          '性能监控与问题定位',
          '成本意识',
          '复盘改进意识'
        ]
      },
      {
        name: '模型上线运维',
        description: '监控模型服务状态、响应时间、错误率和版本变更，保障系统稳定。',
        abilities: [
          '模型版本管理知识',
          '日志监控指标体系',
          '网络安全与访问控制基础',
          '高可用部署架构知识',
          'CI/CD流水线配置',
          '模型灰度发布',
          '模型回滚与版本切换',
          '数据库与缓存调用',
          '服务稳定性责任心',
          '风险预警意识'
        ]
      },
      {
        name: '业务效果回收与迭代',
        description: '收集线上预测结果和用户反馈，协同算法与产品团队迭代模型。',
        abilities: [
          '机器学习模型推理流程',
          '数据预处理与特征规范',
          'AI应用业务场景认知',
          '服务日志分析',
          '性能监控与问题定位',
          '资源利用率优化',
          '问题闭环意识',
          '用户场景理解',
          '持续学习意识',
          '技术伦理意识'
        ]
      },
      {
        name: '部署文档编制',
        description: '输出部署手册、接口说明、运维记录和版本说明。',
        abilities: [
          'API接口与服务协议',
          'MLOps流程与生命周期',
          '模型版本管理知识',
          '日志监控指标体系',
          '部署文档编写',
          '接口联调与异常排查',
          '规范化交付意识',
          '沟通表达能力',
          '保密意识',
          '客户响应意识'
        ]
      }
    ],
    abilities: [
      { name: '机器学习模型推理流程', category: '知识', definition: '理解训练、导出、推理、评估、上线的模型应用流程。' },
      { name: 'Linux与容器基础', category: '知识', definition: '掌握Linux命令、进程管理、端口排查和Docker基础概念。' },
      { name: '深度学习模型结构认知', category: '知识', definition: '理解CNN、Transformer、Embedding等常见模型结构与推理特征。' },
      { name: '模型格式与转换规范', category: '知识', definition: '了解PyTorch、ONNX、TensorRT等模型格式及转换注意事项。' },
      { name: 'API接口与服务协议', category: '知识', definition: '理解HTTP、RESTful、鉴权、请求响应结构和接口约定。' },
      { name: '容器镜像与运行时原理', category: '知识', definition: '理解镜像、容器、挂载、网络、端口映射和运行时隔离机制。' },
      { name: 'GPU/CPU推理资源基础', category: '知识', definition: '了解CPU、GPU、显存、批处理与并发对推理服务的影响。' },
      { name: '模型版本管理知识', category: '知识', definition: '理解模型版本、配置版本、代码版本与发布记录的对应关系。' },
      { name: '数据预处理与特征规范', category: '知识', definition: '理解输入数据清洗、归一化、编码和特征约束对推理结果的影响。' },
      { name: 'MLOps流程与生命周期', category: '知识', definition: '了解模型开发、部署、监控、回滚、迭代的全生命周期管理。' },
      { name: '日志监控指标体系', category: '知识', definition: '理解延迟、吞吐、错误率、资源使用率和业务命中率等监控指标。' },
      { name: '网络安全与访问控制基础', category: '知识', definition: '了解接口鉴权、访问控制、密钥管理和基础网络安全要求。' },
      { name: '模型压缩与量化原理', category: '知识', definition: '理解剪枝、蒸馏、量化等优化方法对速度、精度和资源的影响。' },
      { name: '高可用部署架构知识', category: '知识', definition: '了解负载均衡、多实例、健康检查和故障转移等高可用设计。' },
      { name: 'AI应用业务场景认知', category: '知识', definition: '理解模型服务在客服、质检、推荐、检测等业务场景中的应用边界。' },
      { name: 'Python工程开发', category: '技能', definition: '能够编写模型加载、数据预处理、接口封装和异常处理代码。' },
      { name: '模型服务部署', category: '技能', definition: '能够使用FastAPI、Docker等工具完成模型服务部署与调试。' },
      { name: '性能监控与问题定位', category: '技能', definition: '能够根据日志、监控指标定位模型服务异常和性能瓶颈。' },
      { name: 'FastAPI接口封装', category: '技能', definition: '能够使用FastAPI封装推理接口、参数校验、错误返回与文档说明。' },
      { name: 'Docker镜像构建', category: '技能', definition: '能够编写Dockerfile并完成依赖安装、镜像构建和容器运行。' },
      { name: 'ONNX模型转换', category: '技能', definition: '能够完成模型导出、格式转换、输入输出校验和基础兼容性测试。' },
      { name: '推理性能压测', category: '技能', definition: '能够设计并执行并发、延迟、吞吐和资源占用压测。' },
      { name: '服务日志分析', category: '技能', definition: '能够从运行日志、错误堆栈和请求链路中识别异常原因。' },
      { name: 'CI/CD流水线配置', category: '技能', definition: '能够配置自动构建、自动测试、镜像推送和部署流程。' },
      { name: '模型灰度发布', category: '技能', definition: '能够按流量、用户或场景进行模型灰度上线并观察效果。' },
      { name: '模型回滚与版本切换', category: '技能', definition: '能够在异常场景下完成模型版本回滚、配置恢复和服务验证。' },
      { name: '数据库与缓存调用', category: '技能', definition: '能够对接数据库、缓存或向量库完成推理依赖数据读取。' },
      { name: '接口联调与异常排查', category: '技能', definition: '能够与前后端、算法服务和业务系统联调接口并定位异常。' },
      { name: '资源利用率优化', category: '技能', definition: '能够通过批处理、缓存、并发配置和实例扩缩容提升资源效率。' },
      { name: '部署文档编写', category: '技能', definition: '能够输出部署步骤、接口说明、回滚方案和运维注意事项。' },
      { name: '数据安全与合规意识', category: '素养', definition: '在模型上线与数据调用过程中遵守隐私、安全和合规要求。' },
      { name: '跨团队协作', category: '素养', definition: '能与算法、产品、测试和运维人员协作完成上线交付。' },
      { name: '问题闭环意识', category: '素养', definition: '能够跟踪问题从发现、定位、处理到验证复盘的全过程。' },
      { name: '服务稳定性责任心', category: '素养', definition: '关注线上服务连续性，主动规避影响业务稳定运行的风险。' },
      { name: '持续学习意识', category: '素养', definition: '能够持续跟进模型部署框架、工具链和AI应用技术变化。' },
      { name: '用户场景理解', category: '素养', definition: '能够从业务目标和用户体验角度理解模型服务交付要求。' },
      { name: '质量意识', category: '素养', definition: '关注接口质量、模型输出质量、交付质量和验证完整性。' },
      { name: '风险预警意识', category: '素养', definition: '能够识别上线、资源、性能、安全等风险并提前预警。' },
      { name: '规范化交付意识', category: '素养', definition: '遵循命名、文档、版本、变更和发布流程规范完成交付。' },
      { name: '沟通表达能力', category: '素养', definition: '能够清晰表达方案、问题、风险和协作需求。' },
      { name: '成本意识', category: '素养', definition: '关注算力、存储、流量和人力成本，平衡性能与投入。' },
      { name: '复盘改进意识', category: '素养', definition: '能够从上线效果、故障处理和用户反馈中沉淀改进措施。' },
      { name: '客户响应意识', category: '素养', definition: '能够及时响应业务方和客户对模型服务质量的反馈。' },
      { name: '技术伦理意识', category: '素养', definition: '关注模型偏差、误用风险、透明性和AI应用伦理边界。' },
      { name: '保密意识', category: '素养', definition: '在模型文件、数据样本、接口密钥和业务信息处理中遵守保密要求。' }
    ],
    suitability: [
      { name: '专业核心能力', score: 90, weight: 40 },
      { name: '通用工具运用', score: 85, weight: 20 },
      { name: '工程/业务逻辑', score: 82, weight: 20 },
      { name: '职业素养/软技能', score: 86, weight: 10 },
      { name: '行业认知与标准', score: 78, weight: 10 }
    ]
  }
}

const DEFAULT_DETAIL = SMART_CONSTRUCTION_JOB_DETAIL_BY_ID[JOB_CARDS[0]?.id] ?? JOB_DETAIL_BY_ID['job-model-deploy']

export const getJobDetail = (jobId: string): JobDetail =>
  SMART_CONSTRUCTION_JOB_DETAIL_BY_ID[jobId] ?? JOB_DETAIL_BY_ID[jobId] ?? DEFAULT_DETAIL
