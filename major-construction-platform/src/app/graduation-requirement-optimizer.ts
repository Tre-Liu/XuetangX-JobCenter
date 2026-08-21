import type {
  GraduationRequirement,
  GraduationRequirementDraft,
} from './graduation-requirement-editor'

export type GraduationJobMatch = {
  id: string
  name: string
  occupation: string | null
  tasks: string[]
  capabilities: string[]
  optimizedTitle: string
  optimizedRequirements: string[]
}

export type GraduationJobDetail = Pick<
  GraduationJobMatch,
  'id' | 'name' | 'occupation' | 'tasks' | 'capabilities'
>

export const GRADUATION_JOB_MATCHES: GraduationJobMatch[] = [
  {
    id: 'job-bim-deepening',
    name: 'BIM深化设计工程师',
    occupation: '建筑信息模型技术员',
    tasks: [
      '完成建筑与结构BIM模型深化、碰撞检查及问题闭环',
      '编制模型交付标准并完成多专业协同审查',
    ],
    capabilities: [
      'BIM深化设计与数字化交付能力',
      '多专业模型协同与问题解决能力',
    ],
    optimizedTitle: 'BIM深化设计与数字化交付能力',
    optimizedRequirements: [
      '能够依据工程图纸和项目标准完成建筑与结构BIM模型深化、碰撞检查及问题闭环，形成符合交付要求的模型成果。',
      '能够组织多专业模型协同审查，准确识别设计冲突并提出可实施的优化方案。',
    ],
  },
  {
    id: 'job-smart-site',
    name: '智慧工地实施工程师',
    occupation: null,
    tasks: [
      '完成智慧工地平台配置、物联设备接入与数据联调',
      '基于现场数据开展质量安全预警和整改闭环',
    ],
    capabilities: [
      '智慧工地平台部署与物联网集成能力',
      '现场数据分析与质量安全闭环管理能力',
    ],
    optimizedTitle: '智慧工地实施与现场闭环管理能力',
    optimizedRequirements: [
      '能够完成智慧工地平台配置、物联设备接入和数据联调，保障现场数据稳定采集与有效应用。',
      '能够分析进度、质量与安全数据，识别工程风险并推动预警、处置、复核全过程闭环。',
    ],
  },
  {
    id: 'job-prefabricated-design',
    name: '装配式建筑深化设计师',
    occupation: '土木建筑工程技术人员',
    tasks: [
      '完成装配式混凝土构件拆分、节点深化与生产图设计',
      '校核构件生产、运输、吊装条件并协同解决工程问题',
    ],
    capabilities: [
      '装配式构件拆分与节点深化能力',
      '设计生产施工一体化协同能力',
    ],
    optimizedTitle: '装配式构件深化与建造协同能力',
    optimizedRequirements: [
      '能够依据建筑与结构设计要求完成装配式构件拆分、节点深化和生产图设计，保证成果符合标准规范。',
      '能够综合校核构件生产、运输与吊装条件，协同设计、生产和施工团队解决实施问题。',
    ],
  },
  {
    id: 'job-smart-construction',
    name: '智能建造施工工程师',
    occupation: null,
    tasks: [
      '编制智能化施工方案并完成施工工艺参数优化',
      '完成建筑机器人及智能装备选型、联调与现场应用',
    ],
    capabilities: [
      '智能化施工方案设计与工艺优化能力',
      '建筑机器人及智能装备应用能力',
    ],
    optimizedTitle: '智能化施工与智能装备应用能力',
    optimizedRequirements: [
      '能够结合工程条件编制智能化施工方案，合理选择施工工艺并完成关键参数优化。',
      '能够完成建筑机器人及智能装备的选型、联调与现场应用，分析运行问题并提出改进措施。',
    ],
  },
  {
    id: 'job-structure-inspection',
    name: '建筑结构智能检测工程师',
    occupation: null,
    tasks: [
      '布设结构检测与健康监测传感设备并完成数据采集',
      '分析检测监测数据并编制结构状态评估报告',
    ],
    capabilities: [
      '结构智能检测与传感数据采集能力',
      '监测数据分析与工程状态评估能力',
    ],
    optimizedTitle: '结构智能检测与监测分析能力',
    optimizedRequirements: [
      '能够根据检测任务布设传感设备、实施结构检测与健康监测，并保证采集数据真实、完整和有效。',
      '能够运用数字工具分析检测监测数据，判断结构状态并形成依据充分、表达规范的评估报告。',
    ],
  },
  {
    id: 'job-digital-project',
    name: '工程数字化项目管理师',
    occupation: null,
    tasks: [
      '利用数字化平台协同管理进度、质量、安全与成本',
      '整合项目数据形成管理看板并支持现场决策',
    ],
    capabilities: [
      '工程项目数字化协同管理能力',
      '项目数据治理与辅助决策能力',
    ],
    optimizedTitle: '工程数字化协同与项目决策能力',
    optimizedRequirements: [
      '能够运用数字化平台协同管理工程进度、质量、安全和成本，推动项目任务按计划闭环交付。',
      '能够整合、治理和可视化项目数据，识别管理偏差并为工程决策提供可靠依据。',
    ],
  },
]

const cloneRequirement = (
  item: GraduationRequirement,
  index: number,
): GraduationRequirement => ({
  code: `R${index + 1}`,
  text: item.text,
  children: [...item.children],
})

const selectedJobs = (jobIds: readonly string[]) => jobIds
  .map((jobId) => GRADUATION_JOB_MATCHES.find((job) => job.id === jobId))
  .filter((job): job is GraduationJobMatch => Boolean(job))

const unique = (items: string[]) => [...new Set(items)]

export const getGraduationJobDetail = (jobId: string): GraduationJobDetail | null => {
  const job = GRADUATION_JOB_MATCHES.find((item) => item.id === jobId)
  if (!job) return null
  return {
    id: job.id,
    name: job.name,
    occupation: job.occupation,
    tasks: [...job.tasks],
    capabilities: [...job.capabilities],
  }
}

export const getGraduationJobPreview = (jobIds: readonly string[]) => {
  const jobs = selectedJobs(jobIds)
  return {
    jobNames: jobs.map((job) => job.name),
    tasks: unique(jobs.flatMap((job) => job.tasks)),
    capabilities: unique(jobs.flatMap((job) => job.capabilities)),
  }
}

export const optimizeGraduationRequirements = (
  current: GraduationRequirementDraft,
  jobIds: readonly string[],
): GraduationRequirementDraft => {
  const jobs = selectedJobs(jobIds)
  if (jobs.length === 0) {
    return {
      overview: current.overview,
      requirements: current.requirements.map(cloneRequirement),
    }
  }

  const foundationRequirements = current.requirements
    .slice(0, Math.min(5, current.requirements.length))
    .map(cloneRequirement)
  const professionalRequirements = jobs.map((job, index) => ({
    code: `R${foundationRequirements.length + index + 1}`,
    text: job.optimizedTitle,
    children: [...job.optimizedRequirements],
  }))
  const names = jobs.map((job) => job.name).join('、')

  return {
    overview: `本专业毕业要求在保留价值塑造、工程基础与持续发展要求的基础上，依据${jobs.length}个强相关岗位（${names}）的典型工作任务与核心能力进行AI优化，突出可实施、可评价和可追踪的岗位胜任要求。`,
    requirements: [...foundationRequirements, ...professionalRequirements]
      .map(cloneRequirement),
  }
}
