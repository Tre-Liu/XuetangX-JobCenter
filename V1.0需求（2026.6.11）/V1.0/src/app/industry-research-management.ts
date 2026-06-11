export type IndustryResearchChainRecommendation = {
  id: string
  name: string
  matchScore: number
  stageSummary: string
  reason: string
  evidenceTags: string[]
}

export const INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS: IndustryResearchChainRecommendation[] = [
  {
    id: 'smart-construction',
    name: '智能建造产业链',
    matchScore: 96,
    stageSummary: 'BIM 协同设计、装配式建造、智慧工地、智能检测、数字化运维',
    reason: '与智能建造工程专业的岗位能力、课程体系和区域建设项目数字化转型需求匹配度最高。',
    evidenceTags: ['BIM', '智慧工地', '数字化运维']
  },
  {
    id: 'construction-industrialization',
    name: '建筑工业化产业链',
    matchScore: 88,
    stageSummary: '构件深化设计、预制生产、运输吊装、装配施工、质量验收',
    reason: '覆盖装配式建筑项目的核心工序，适合支撑施工组织、质量检测和项目管理方向调研。',
    evidenceTags: ['装配式建筑', '预制构件', '质量验收']
  },
  {
    id: 'smart-city-infrastructure',
    name: '智慧城市基础设施产业链',
    matchScore: 82,
    stageSummary: '基础设施感知、城市数据平台、工程实施、运营维护、治理服务',
    reason: '可承接城市基础设施数字化建设场景，适合作为专业拓展方向和区域服务能力补充。',
    evidenceTags: ['城市更新', '基础设施', '运营维护']
  },
  {
    id: 'green-building-materials',
    name: '绿色建材产业链',
    matchScore: 79,
    stageSummary: '绿色材料研发、生产制造、检测认证、工程应用、循环利用',
    reason: '与绿色建造、建筑节能和低碳施工方向关联度较高，可作为专业可持续发展能力补充。',
    evidenceTags: ['绿色建造', '节能材料', '检测认证']
  },
  {
    id: 'engineering-digital-services',
    name: '工程数字化服务产业链',
    matchScore: 76,
    stageSummary: '工程数据采集、模型治理、项目协同、造价管控、交付咨询',
    reason: '支撑工程项目全过程数字化管理，适合连接 BIM、工程造价、项目管理和数字交付课程。',
    evidenceTags: ['工程咨询', '项目协同', '数字交付']
  },
  {
    id: 'intelligent-equipment-construction',
    name: '智能施工装备产业链',
    matchScore: 73,
    stageSummary: '装备研发、传感控制、现场作业、远程调度、维护服务',
    reason: '面向智能测量、自动化施工和现场装备运维场景，可拓展专业对智能装备应用能力的调研。',
    evidenceTags: ['智能装备', '现场作业', '远程调度']
  }
]
