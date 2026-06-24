<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  NATIONAL_INDUSTRY_CHAIN_METRICS,
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
  aiHotJobAnalysisAdvice,
  aiSuggestionItems,
  courseDiagnosisStates,
  decisionCenterMenuGroups,
  decisionCenterOverview,
  decisionImprovementPage,
  governancePlaceholderPages,
  planAnalysisStates,
  type AiSuggestionItem,
  type DecisionGroupKey,
  type DecisionPageKey,
  type DecisionFlowStatus,
} from './mock/decision-center'
import {
  cloneCourseAbilityMap,
  courseAbilityCategories,
  courseCustomRoles,
  courseDetailTabs,
  courseKnowledgeLevels,
  courseKnowledgeNodes,
  courseMemberRows,
  courseModelMenuGroups,
  courseModelTitle,
  courseRolePermissionRows,
  courseSystemRoles,
  courseTopModules,
  createEmptyCourseAbilityMap,
  engineMenuItems,
  engineSectionPanels,
  hasCourseAbilities,
  resultsMenuActions,
  sideItems,
  talentSubsystemItems,
  topModules,
  type CourseAbilityCategory,
  type CourseAbilityCategoryMap,
  type CourseAbilityJobOption,
  type CourseNodeAbilityRelation,
  type CoursePermissionType,
  type EngineSectionKey,
} from './app/app-config'
import {
  INDUSTRY_RESEARCH_TABS,
  buildCompareEditorDraft,
  compareEditorSeed,
  compareModules,
  defaultCompareEditorContents,
  graduationOverview,
  graduationRequirements,
  industryChainInsights,
  industryChainSuggestions,
  industryCompanyItems,
  industryPolicyItems,
  industryPolicyKeywords,
  industryPolicyTrends,
  industryRegionCards,
  industrySankeyNodeLayout,
  industrySankeyNodes,
  industrySankeyPaths,
  industrySankeyStages,
  jobSideItems,
  matrixGoals,
  matrixRows,
  PROFESSIONAL_ANALYSIS_TABS,
  professionalDistributionPoints,
  professionalEnrollmentRows,
  professionalMapInsights,
  professionalMatchRegions,
  professionalProvinceRanks,
  professionalSchoolRows,
  professionalTrendDeltaRows,
  professionalTrendInsights,
  professionalTrendKpis,
  professionalTrendSchoolCounts,
  professionalTrendYears,
  researchPlanResults,
  talentCourses,
  talentGoalOverview,
  talentGoals,
  type IndustryResearchTabKey,
  type ProfessionalAnalysisTabKey,
} from './app/talent-industry-data'
import {
  INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS,
} from './app/industry-research-management'
import { studentCareerPlanData, type StudentPlanCourse } from './app/student-career-plan-data'
import {
  abilityCategoryOptions,
  downloadAbilityTemplateWorkbook,
  parseAbilityImportWorkbook,
  type AbilityCategoryOption,
} from './utils/ability-import'
import {
  buildStandaloneViewUrl,
  openStandaloneView,
} from './utils/standalone-view'
import {
  buildGraphLayout,
  type GraphLayoutLink,
} from './utils/graph-layout'
import chinaGeo from './china-geo.json'

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
const cmsProfessionalTabs = [
  { label: '基础信息' },
  { label: '共建课程管理' },
  { label: '知识库管理' },
  { label: 'AI应用管理' },
  { label: '课程模型管理' },
  { label: '成员管理' },
  { label: '主站开放管理' },
  { label: '数字人管理' },
  { label: '学习目标管理' },
  { label: '学习中心管理' },
  { label: 'K12学科配置管理' },
  { label: '产业调研', active: true }
]
const studentPlanTabs = studentCareerPlanData.tabs
type StudentPlanTab = (typeof studentCareerPlanData.tabs)[number]
type StudentCourseCard = {
  code: string
  name: string
  agent: string
  credits: string
  type: string
  semester: string
  target: string
  tone: string
  prerequisites: string
}
type AbilityEditForm = {
  name: string
  category: AbilityCategoryOption
  definition: string
}

const cloneJobAbility = (ability: JobAbility): JobAbility => ({
  name: ability.name,
  category: ability.category,
  definition: ability.definition
})
const currentViewParam = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('view')
  : ''
const currentTabParam = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('tab')
  : ''
const industryResearchStateKey = 'major-construction-platform:industry-research'
type IndustryResearchStoredState = {
  initialized?: boolean
  selectedChainIds?: string[]
  selectedAt?: string
}
const readIndustryResearchDemoInitialized = () => {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(industryResearchStateKey)
    if (!raw) return false
    const state = JSON.parse(raw) as IndustryResearchStoredState
    return state.initialized === true && Array.isArray(state.selectedChainIds) && state.selectedChainIds.length > 0
  } catch {
    return false
  }
}
const isResultsPortal = currentViewParam === 'results-portal'
const isStudentCareerPlanView = currentViewParam === 'student-career-plan'
const isIndustryResearchAdminView = currentViewParam === 'industry-research-admin'
const isCourseModelView = currentViewParam === 'course-model'
const isJobCompetencyMapView = currentViewParam === 'job-competency-map'
const isJobResearchView = currentViewParam === 'job-research'
const isJobIndustryView = currentViewParam === 'job-industry'
const initialJobResearchTab = JOB_RESEARCH_TABS.some((tab) => tab.key === currentTabParam)
  ? currentTabParam as JobResearchTabKey
  : 'portrait'
const initialJobIndustryTab = INDUSTRY_RESEARCH_TABS.some((tab) => tab.key === currentTabParam)
  ? currentTabParam as IndustryResearchTabKey
  : 'chain'
const activeResultsPortalTab = ref('首页')
const currentModule = ref(isCourseModelView ? '课程模型' : '岗位中心')
const activeDecisionGroup = ref<DecisionGroupKey>('hub')
const activeDecisionPage = ref<DecisionPageKey>('overview')
const activeDecisionPlanModeTab = ref('培养方案诊断分析')
const activeDecisionPlanTab = ref('综合评分')
const activeDecisionCourseTab = ref('课程诊断分析')
const decisionPlanStatus = ref<DecisionFlowStatus>('pending')
const decisionCourseStatus = ref<DecisionFlowStatus>('pending')
const decisionImprovementState = ref<'default' | 'refreshing' | 'empty' | 'warning'>('default')
const aiSuggestionPanelOpen = ref(false)
const activeAiAnalysisKey = ref<AiSuggestionItem['key'] | ''>('')
const industryResearchStatus = ref<'idle' | 'initializing' | 'ready'>('idle')
const selectedIndustryResearchChainIds = ref<string[]>([])
const industryResearchDemoInitialized = ref(readIndustryResearchDemoInitialized())
const industryResearchCurrentPage = ref(1)
const industryResearchPageSize = 3
const activeTalentSection = ref('培养目标')
const activeTalentSubsystem = ref('')
const activeStudentPlanTab = ref<StudentPlanTab>('培养目标')
const activeStudentPrompt = ref('查课程目标')
const studentAgentInput = ref('')
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
const currentJobSection = ref('产业调研')
const currentJobResearchTab = ref<JobResearchTabKey>(isJobResearchView ? initialJobResearchTab : 'portrait')
const currentJobIndustryTab = ref<IndustryResearchTabKey>(isJobIndustryView ? initialJobIndustryTab : 'chain')
const currentJobResearchMode = ref<'industry' | 'job'>(isJobResearchView ? 'job' : 'industry')
const currentProfessionalAnalysisTab = ref<ProfessionalAnalysisTabKey>('map')
const expandableJobMenuItems = ['产业调研'] as const
type ExpandableJobMenuItem = (typeof expandableJobMenuItems)[number]
const expandedJobMenus = ref<Record<ExpandableJobMenuItem, boolean>>({
  产业调研: true
})
const currentReportView = ref<'library' | 'create' | 'generating' | 'editor' | 'preview'>('library')
const selectedIndustryChain = ref('智能建造产业链')
const industryCompanySearchText = ref('')
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
const industrySankeyHoverId = ref('')
const industryChainViewMode = ref<'treemap' | 'sankey'>('treemap')
type IndustryStageKey = 'upstream' | 'midstream' | 'downstream'
type IndustryEntityDialogType = 'job' | 'chain' | 'industry'
type IndustryEntityEditForm = {
  entityType: IndustryEntityDialogType
  chainId: string
  industryId: string
  chainName: string
  chainDescription: string
  chainFocusTag: string
  industryName: string
  industryDescription: string
  industryChainId: string
  industryStage: IndustryStageKey
  industryKeyFields: string
  industryLeadSignals: string
}
type IndustryChainOverride = {
  name: string
  description: string
  focusTag: string
}
type IndustryNodeOverride = {
  name: string
  description: string
  chainId: string
  stage: IndustryStageKey
  keyFields: string
  leadSignals: string
}
const industryStageOptions: Array<{ value: IndustryStageKey; label: string }> = [
  { value: 'upstream', label: '上游' },
  { value: 'midstream', label: '中游' },
  { value: 'downstream', label: '下游' }
]
const defaultChainDescriptions: Record<string, string> = {
  'chain-foundation': '聚焦BIM数据、测绘感知、物联网终端与装配式构件等基础资源，为智能建造提供数据和装备底座。',
  'chain-platform': '承接工程软件、BIM协同、智慧工地平台和建筑机器人等数字化服务，连接资源供给与工程应用。',
  'chain-application': '面向检测监测、绿色建造、智慧运维等工程实施与运维场景，形成岗位需求落点。'
}
const defaultIndustryDescriptions: Record<string, string> = {
  'node-bim-data': '围绕BIM标准、工程数据资源和数据治理方法，支撑跨专业协同和平台实施。',
  'node-smart-survey': '覆盖智能测绘、点云采集、空间数据建模和现场数据回传等工作场景。',
  'node-iot-sensing': '面向建筑物联网、传感终端、视频感知和现场设备接入等基础能力。',
  'node-prefab': '连接装配式构件深化设计、数字工厂生产、质量追溯和施工装配应用。',
  'node-bim-platform': '聚焦BIM协同设计、算量算价、平台建模和项目数据协同应用。',
  'node-smart-site': '围绕智慧工地平台、安全物联、项目管理看板和现场数据联动展开。',
  'node-robotics': '覆盖建筑机器人、智能装备、无人机和现场自动化施工应用。',
  'node-monitoring': '面向结构健康监测、工程检测、质量数据分析和风险预警场景。',
  'node-green-ops': '聚焦绿色建造、建筑能耗、碳管理和智慧运维服务。'
}
const defaultIndustryKeyFields: Record<string, string> = {
  'node-bim-data': 'BIM标准、工程数据治理、模型交付',
  'node-smart-survey': '点云采集、无人机测绘、实景建模',
  'node-iot-sensing': '物联终端、视频感知、边缘采集',
  'node-prefab': '构件深化、数字工厂、质量追溯',
  'node-bim-platform': 'BIM协同、算量平台、工程数据联动',
  'node-smart-site': '智慧工地、项目看板、安全物联',
  'node-robotics': '建筑机器人、智能装备、无人机应用',
  'node-monitoring': '结构监测、智能检测、风险预警',
  'node-green-ops': '绿色建造、能耗管理、智慧运维'
}
const defaultIndustryLeadSignals: Record<string, string> = {
  'node-bim-data': '广联达、中建科技、工程数据平台实施需求',
  'node-smart-survey': '南方测绘、测绘装备企业、现场采集岗位需求',
  'node-iot-sensing': '海康威视建筑物联、传感终端集成需求',
  'node-prefab': '中建科技、装配式构件工厂、质量检测岗位需求',
  'node-bim-platform': '广联达、盈建科、BIM协同平台岗位需求',
  'node-smart-site': '品茗科技、智慧工地平台、安全物联岗位需求',
  'node-robotics': '沈阳远大智能工业、建筑机器人应用需求',
  'node-monitoring': '盈建科、工程检测机构、结构监测岗位需求',
  'node-green-ops': '绿色施工企业、智慧运维服务商、能耗管理需求'
}
const industryStageByChainId: Record<string, IndustryStageKey> = {
  'chain-foundation': 'upstream',
  'chain-platform': 'midstream',
  'chain-application': 'downstream'
}
const customIndustryChains = ref<Array<{ id: string; name: string; description: string; focusTag: string }>>([])
const customIndustryNodes = ref<Array<{ id: string; name: string; chainId: string; description: string; stage: IndustryStageKey; keyFields: string; leadSignals: string }>>([])
const industryChainOverrides = ref<Record<string, IndustryChainOverride>>({})
const industryNodeOverrides = ref<Record<string, IndustryNodeOverride>>({})
const slugifyCustomIndustry = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'custom'
const createCustomIndustryId = (prefix: string, name: string) => `${prefix}-${slugifyCustomIndustry(name)}`
const customIndustrySankeyNodes = computed(() =>
  customIndustryNodes.value.map((node) => ({
    id: `custom-${slugifyCustomIndustry(`${node.chainId}-${node.name}`)}`,
    stage: node.stage,
    name: node.name,
    enterpriseCount: 0,
    techFields: [node.keyFields || '关键技术待补充', node.leadSignals || '需求线索待补充']
  }))
)
const industrySankeyNodesForView = computed(() => [...industrySankeyNodes, ...customIndustrySankeyNodes.value])
const industryTreemapStagesForView = computed(() =>
  industrySankeyStages.map((stage) => {
    const nodes = industrySankeyNodesForView.value.filter((node) => node.stage === stage.key)
    const totalEnterpriseCount = nodes.reduce((sum, node) => sum + Math.max(node.enterpriseCount, 1), 0)
    return {
      ...stage,
      totalEnterpriseCount,
      nodes: nodes.map((node) => {
        const weightedCount = Math.max(node.enterpriseCount, 1)
        const share = totalEnterpriseCount > 0 ? weightedCount / totalEnterpriseCount : 0
        return {
          ...node,
          share,
          span: Math.max(4, Math.min(10, Math.round(share * 18)))
        }
      })
    }
  })
)
const industryTreemapNodeStyle = (node: (typeof industryTreemapStagesForView.value)[number]['nodes'][number]) => ({
  '--node-size': `${Math.max(88, Math.min(116, Math.round(86 + node.share * 60)))}px`,
  '--node-share': `${Math.round(node.share * 100)}%`
})
const formatIndustryStageNationalIndustries = (stageKey: string) =>
  NATIONAL_INDUSTRY_CHAIN_METRICS.stageDistributions[
    stageKey as keyof typeof NATIONAL_INDUSTRY_CHAIN_METRICS.stageDistributions
  ]?.industries.join(' / ') ?? ''
const industrySankeyNodePositionsForView = computed(() => {
  const nodes = industrySankeyNodesForView.value
  return new Map(
    nodes.map((node) => {
      const columnNodes = nodes.filter((item) => item.stage === node.stage)
      const maxRows = Math.max(...industrySankeyStages.map((stage) => nodes.filter((item) => item.stage === stage.key).length))
      const rowIndex = columnNodes.findIndex((item) => item.id === node.id)
      return [
        node.id,
        {
          x: industrySankeyNodeLayout.columnX[node.stage],
          y: industrySankeyNodeLayout.startY + ((maxRows - columnNodes.length) * industrySankeyNodeLayout.rowGap) / 2 + rowIndex * industrySankeyNodeLayout.rowGap
        }
      ]
    })
  )
})
const industrySankeyPathsForView = computed(() => {
  const basePaths = industrySankeyPaths.map((path) => {
    const source = industrySankeyNodePositionsForView.value.get(path.source)
    const target = industrySankeyNodePositionsForView.value.get(path.target)
    if (!source || !target) return path
    const startX = source.x + industrySankeyNodeLayout.cardWidth
    const endX = target.x
    const startY = source.y + industrySankeyNodeLayout.cardHeight / 2
    const endY = target.y + industrySankeyNodeLayout.cardHeight / 2
    const bend = (endX - startX) * 0.42
    return {
      ...path,
      d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`
    }
  })
  const customPaths = customIndustrySankeyNodes.value.flatMap((node, index) => {
    const sourceId = 'software'
    const targetId = 'construction'
    const links = [
      { source: sourceId, target: node.id, value: 8, fromColor: '#6b8dff', toColor: '#28c7bd' },
      { source: node.id, target: targetId, value: 8, fromColor: '#28c7bd', toColor: '#ff9c7b' }
    ]
    return links.map((link, linkIndex) => {
      const source = industrySankeyNodePositionsForView.value.get(link.source)
      const target = industrySankeyNodePositionsForView.value.get(link.target)
      const startX = (source?.x ?? 0) + industrySankeyNodeLayout.cardWidth
      const endX = target?.x ?? 0
      const startY = (source?.y ?? 0) + industrySankeyNodeLayout.cardHeight / 2
      const endY = (target?.y ?? 0) + industrySankeyNodeLayout.cardHeight / 2
      const bend = (endX - startX) * 0.42
      return {
        ...link,
        key: `${link.source}->${link.target}`,
        gradientId: `industry-sankey-custom-gradient-${index}-${linkIndex}`,
        strokeWidth: 5 + link.value * 0.75,
        d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`
      }
    })
  })
  return [...basePaths, ...customPaths]
})
const industrySankeyColumnsForView = computed(() =>
  industrySankeyStages.map((stage) => ({
    ...stage,
    nodes: industrySankeyNodesForView.value.filter((node) => node.stage === stage.key)
  }))
)
const industrySankeyNodeById = computed(() => new Map(industrySankeyNodesForView.value.map((node) => [node.id, node])))
const formatIndustrySankeyNodeMeta = (node: (typeof industrySankeyNodesForView.value)[number]) => ({
  count: Number.isFinite(node.enterpriseCount) && node.enterpriseCount > 0
    ? `代表企业 ${node.enterpriseCount.toLocaleString('zh-CN')}家`
    : '企业样本待补充',
  fields: node.techFields.length ? node.techFields.join(' / ') : '技术领域待补充'
})
const industrySankeyActiveLinkKeys = computed(() => {
  const hoverId = industrySankeyHoverId.value
  const active = new Set<string>()
  if (!hoverId) return active
  const hoveredLink = industrySankeyPathsForView.value.find((path) => path.key === hoverId)
  if (hoveredLink) {
    active.add(hoveredLink.key)
    return active
  }

  const hoveredNode = industrySankeyNodeById.value.get(hoverId)
  if (!hoveredNode) return active

  if (hoveredNode.stage === 'upstream') {
    const midstreamTargets = new Set<string>()
    industrySankeyPathsForView.value.forEach((path) => {
      if (path.source === hoverId) {
        active.add(path.key)
        midstreamTargets.add(path.target)
      }
    })
    industrySankeyPathsForView.value.forEach((path) => {
      if (midstreamTargets.has(path.source)) active.add(path.key)
    })
    return active
  }

  if (hoveredNode.stage === 'midstream') {
    industrySankeyPathsForView.value.forEach((path) => {
      if (path.source === hoverId || path.target === hoverId) active.add(path.key)
    })
    return active
  }

  const midstreamSources = new Set<string>()
  industrySankeyPathsForView.value.forEach((path) => {
    if (path.target === hoverId) {
      active.add(path.key)
      midstreamSources.add(path.source)
    }
  })
  industrySankeyPathsForView.value.forEach((path) => {
    if (midstreamSources.has(path.target)) active.add(path.key)
  })
  return active
})
const industrySankeyActiveNodeIds = computed(() => {
  const active = new Set<string>()
  const hoverId = industrySankeyHoverId.value
  if (!hoverId) return active
  if (industrySankeyNodeById.value.has(hoverId)) active.add(hoverId)
  industrySankeyPathsForView.value.forEach((path) => {
    if (!industrySankeyActiveLinkKeys.value.has(path.key)) return
    active.add(path.source)
    active.add(path.target)
  })
  return active
})
const isIndustrySankeyLinkActive = (path: (typeof industrySankeyPathsForView.value)[number]) =>
  !industrySankeyHoverId.value || industrySankeyActiveLinkKeys.value.has(path.key)
const isIndustrySankeyLinkDimmed = (path: (typeof industrySankeyPathsForView.value)[number]) =>
  Boolean(industrySankeyHoverId.value) && !industrySankeyActiveLinkKeys.value.has(path.key)
const isIndustrySankeyNodeActive = (nodeId: string) =>
  !industrySankeyHoverId.value || industrySankeyActiveNodeIds.value.has(nodeId)
const isIndustrySankeyNodeDimmed = (nodeId: string) =>
  Boolean(industrySankeyHoverId.value) && !industrySankeyActiveNodeIds.value.has(nodeId)
const industrySankeyHoverDetail = computed(() => {
  const hoverId = industrySankeyHoverId.value
  if (!hoverId) return null
  const node = industrySankeyNodeById.value.get(hoverId)
  if (node) {
    const stage = industrySankeyStages.find((item) => item.key === node.stage)
    const meta = formatIndustrySankeyNodeMeta(node)
    return {
      label: stage?.label ?? '产业节点',
      title: node.name,
      metric: meta.count,
      desc: meta.fields
    }
  }
  const link = industrySankeyPathsForView.value.find((path) => path.key === hoverId)
  if (!link) return null
  const source = industrySankeyNodeById.value.get(link.source)
  const target = industrySankeyNodeById.value.get(link.target)
  return {
    label: '产业价值流向',
    title: `${source?.name ?? link.source} -> ${target?.name ?? link.target}`,
    metric: `关联强度指数 ${link.value}`,
    desc: '高亮展示该流向及其上下游关联节点'
  }
})
const selectedGraphJobId = ref('')
const activeGraphTaskIndex = ref(0)
const activeResultsPortalJobCardIndex = ref(0)
const selectedJobId = ref('')
const addJobDialogOpen = ref(false)
const manualJobDialogOpen = ref(false)
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
  industryNodeId: string
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
const industryEntityForm = ref<IndustryEntityEditForm>({
  entityType: 'job',
  chainId: '',
  industryId: '',
  chainName: '',
  chainDescription: '',
  chainFocusTag: '',
  industryName: '',
  industryDescription: '',
  industryChainId: '',
  industryStage: 'midstream',
  industryKeyFields: '',
  industryLeadSignals: ''
})
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
  industryNodeId: '',
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
const chainDescriptionForId = (chainId: string, fallbackName = '') =>
  industryChainOverrides.value[chainId]?.description
    ?? customIndustryChains.value.find((chain) => chain.id === chainId)?.description
    ?? defaultChainDescriptions[chainId]
    ?? `${fallbackName || '自建产业链'}的产业范围、价值链定位和岗位承接关系待补充。`
const chainFocusTagForId = (chainId: string) =>
  industryChainOverrides.value[chainId]?.focusTag
    ?? customIndustryChains.value.find((chain) => chain.id === chainId)?.focusTag
    ?? '岗位承接 / 课程映射'
const industryDescriptionForId = (industryId: string, fallbackName = '') =>
  industryNodeOverrides.value[industryId]?.description
    ?? customIndustryNodes.value.find((industry) => industry.id === industryId)?.description
    ?? defaultIndustryDescriptions[industryId]
    ?? `${fallbackName || '自建产业'}的典型场景、岗位需求和课程支撑关系待补充。`
const industryStageForNode = (industry: { id: string; chainId: string }) =>
  industryNodeOverrides.value[industry.id]?.stage
    ?? customIndustryNodes.value.find((node) => node.id === industry.id)?.stage
    ?? industryStageByChainId[industry.chainId]
    ?? 'midstream'
const industryKeyFieldsForId = (industryId: string) =>
  industryNodeOverrides.value[industryId]?.keyFields
    ?? customIndustryNodes.value.find((industry) => industry.id === industryId)?.keyFields
    ?? defaultIndustryKeyFields[industryId]
    ?? ''
const industryLeadSignalsForId = (industryId: string) =>
  industryNodeOverrides.value[industryId]?.leadSignals
    ?? customIndustryNodes.value.find((industry) => industry.id === industryId)?.leadSignals
    ?? defaultIndustryLeadSignals[industryId]
    ?? ''
const industryChainsForBuild = computed(() => {
  const custom = customIndustryChains.value.map((chain) => ({
    id: chain.id,
    name: chain.name,
    total: 0
  }))
  return [...INDUSTRY_CHAINS, ...custom].map((chain) => {
    const override = industryChainOverrides.value[chain.id]
    return {
      ...chain,
      name: override?.name ?? chain.name
    }
  })
})
const industryNodesForBuild = computed(() => {
  const custom = customIndustryNodes.value.map((node) => ({
    id: node.id,
    name: node.name,
    chainId: node.chainId
  }))
  return [...INDUSTRY_NODES, ...custom].map((industry) => {
    const override = industryNodeOverrides.value[industry.id]
    return {
      ...industry,
      name: override?.name ?? industry.name,
      chainId: override?.chainId ?? industry.chainId
    }
  })
})
const manualJobIndustryOptions = computed(() =>
  industryNodesForBuild.value.filter((industry) => industry.chainId === industryEntityForm.value.industryChainId)
)
const industryChainRelationsForBuild = computed(() => {
  const relationMap = new Map<string, { chainId: string; industryNodeId: string }>()
  for (const relation of INDUSTRY_CHAIN_RELATIONS) {
    relationMap.set(`${relation.chainId}:${relation.industryNodeId}`, relation)
  }
  for (const industry of industryNodesForBuild.value) {
    relationMap.set(`${industry.chainId}:${industry.id}`, {
      chainId: industry.chainId,
      industryNodeId: industry.id
    })
  }
  return Array.from(relationMap.values())
})
const jobIndustryRelationsForBuild = computed(() => {
  const overriddenJobIds = new Set(
    Object.entries(jobBasicOverrides.value)
      .filter(([, override]) => Boolean(override.industryNodeId))
      .map(([jobId]) => jobId)
  )
  const relations = JOB_INDUSTRY_RELATIONS.filter((relation) => !overriddenJobIds.has(relation.jobId))
  for (const [jobId, override] of Object.entries(jobBasicOverrides.value)) {
    if (override.industryNodeId) {
      relations.push({ jobId, industryNodeId: override.industryNodeId })
    }
  }
  return relations
})
const activeDetailTab = ref('basic')
const activeMapTaskIndex = ref(0)
const selectedPortraitJobId = ref('')
const selectedCertificateId = ref('')
const selectedCompanyId = ref('')
const selectedNationalIndustryMetricLabel = ref('')
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
let industryResearchTimer: number | undefined
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
      industryNodeId: override.industryNodeId ?? job.industryNodeId,
      abilityCount: nextAbilityCount
    }
  })
})
const jobGroupOptions = computed(() => {
  const groups = [...JOB_CARDS, ...addedJobCards.value].map((job) => job.groupName).filter(Boolean)
  return Array.from(new Set(groups))
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
const industryResearchTotalPages = computed(() =>
  Math.max(1, Math.ceil(INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS.length / industryResearchPageSize))
)
const industryResearchPageNumbers = computed(() =>
  Array.from({ length: industryResearchTotalPages.value }, (_, index) => index + 1)
)
const paginatedIndustryResearchChains = computed(() => {
  const start = (industryResearchCurrentPage.value - 1) * industryResearchPageSize
  return INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS.slice(start, start + industryResearchPageSize)
})
const activeDecisionPlaceholderPage = computed(() => {
  if (activeDecisionPage.value === 'improvement') return null
  if (!(activeDecisionPage.value in governancePlaceholderPages)) return null
  return governancePlaceholderPages[activeDecisionPage.value as keyof typeof governancePlaceholderPages]
})
const decisionImprovementDefaultState = computed(() => decisionImprovementPage.states.default)
const activeDecisionImprovementState = computed(() => decisionImprovementPage.states[decisionImprovementState.value])
const activeAiAnalysis = computed(() => {
  return activeAiAnalysisKey.value === 'hot-jobs' ? aiHotJobAnalysisAdvice : null
})
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
const clearIndustryResearchTimer = () => {
  if (industryResearchTimer !== undefined) {
    window.clearTimeout(industryResearchTimer)
    industryResearchTimer = undefined
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
const jobBasicForId = (jobId: string) => {
  const job = jobCardsForBuild.value.find((item) => item.id === jobId)
  if (!job) return null
  const override = jobBasicOverrides.value[jobId] ?? {}
  return {
    ...job,
    name: override.name ?? job.name,
    occupation: override.occupation ?? job.occupation,
    occupationCode: override.occupationCode ?? job.occupationCode,
    groupName: override.groupName ?? job.groupName,
    industryNodeId: override.industryNodeId ?? job.industryNodeId
  }
}
const selectedJobBasic = computed(() => jobBasicForId(selectedJobId.value) ?? selectedJob.value ?? JOB_CARDS[0])
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
const defaultJobLevel = '初级'
const chainIndustryForJob = (job?: JobCard) => {
  if (!job) return '-'
  const node = industryNodesForBuild.value.find((item) => item.id === job.industryNodeId)
  const chain = node ? industryChainsForBuild.value.find((item) => item.id === node.chainId) : null
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
    return [course.name, course.code, course.id].join(' ').toLowerCase().includes(keyword)
  })
})
const getCourseAbilityMapForJob = (jobId: string): CourseAbilityCategoryMap => {
  const abilities = createEmptyCourseAbilityMap()
  for (const ability of jobDetailForId(jobId).abilities) {
    if (courseAbilityCategories.includes(ability.category as CourseAbilityCategory)) {
      abilities[ability.category as CourseAbilityCategory].push(ability.name)
    }
  }
  return abilities
}
const courseAbilitySourceJobs = computed(() =>
  templateJobsImported.value || addedJobCards.value.length > 0 ? jobCardsForBuild.value : JOB_CARDS
)
const courseJobAbilityOptionsForBuild = computed<CourseAbilityJobOption[]>(() =>
  courseAbilitySourceJobs.value.map((job) => {
    const node = industryNodesForBuild.value.find((item) => item.id === job.industryNodeId)
    const chain = node ? industryChainsForBuild.value.find((item) => item.id === node.chainId) : null
    return {
      id: job.id,
      name: job.name,
      chain: chain?.name ?? '智能建造产业链',
      node: node?.name ?? '岗位建设中心',
      abilities: getCourseAbilityMapForJob(job.id)
    }
  })
)
const courseJobAbilityOptionMap = computed(() =>
  new Map(courseJobAbilityOptionsForBuild.value.map((option) => [option.id, option]))
)
const selectedCourseNodeAbilityRelations = computed(
  () => courseNodeAbilityRelations.value[selectedCourseNodeLabel.value] ?? []
)
const selectedCourseNodeAbilityCount = computed(() =>
  selectedCourseNodeAbilityRelations.value.reduce((sum, relation) =>
    sum + courseAbilityCategories.reduce((categorySum, category) => categorySum + relation.abilities[category].length, 0), 0)
)
const filteredCourseJobAbilityOptions = computed(() => {
  const keyword = courseAbilityJobSearch.value.trim().toLowerCase()
  return courseJobAbilityOptionsForBuild.value.filter((option) => {
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
  return courseJobAbilityOptionMap.value.get(selectedCourseAbilityJobId.value) ?? null
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
const selectedNationalIndustryMetric = computed(() =>
  NATIONAL_INDUSTRY_CHAIN_METRICS.summaryMetrics.find((metric) => metric.label === selectedNationalIndustryMetricLabel.value) ?? null
)
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
const industryLayoutTabs = computed(() => INDUSTRY_RESEARCH_TABS.filter((tab) => tab.key !== 'major'))
const industryResearchPurposeByTab: Record<IndustryResearchTabKey, string> = {
  chain: '梳理智能建造产业链上下游关系，明确专业应重点对接的产业环节与课程项目入口。',
  region: '识别区域企业集聚、岗位需求和工程场景分布，判断校企合作与实训基地拓展方向。',
  policy: '汇总国家与地方政策信号，提炼对专业方向、课程标准和项目化实训的转化要求。',
  company: '沉淀代表企业、技术方向和岗位线索，支撑专业选择可对接的企业资源。',
  major: '从布点分布、开设趋势和产教匹配度判断专业建设空间，避免专业扩张与区域产业需求脱节。'
}
const professionalAnalysisPurposeByTab: Record<ProfessionalAnalysisTabKey, string> = {
  map: '从全国专业布点、省份排名和区域产教匹配度判断专业建设空间，避免专业扩张与区域产业需求脱节。',
  trend: '从历年开设数量、招生规模和新增撤销变化判断专业生命周期，识别专业建设节奏与结构调整信号。'
}
const jobResearchPurposeByTab: Record<JobResearchTabKey, string> = {
  portrait: '拆解核心岗位的任务、能力和证书要求，为课程体系与岗位要求对齐提供依据。',
  demand: '跟踪招聘规模、薪资走势和技能热度，判断当前岗位建设的优先级。',
  forecast: '研判新技术带来的新增岗位和能力缺口，提前布局课程与实训内容。'
}
const activeJobResearchPurpose = computed(() => currentJobResearchMode.value === 'industry'
  ? currentJobIndustryTab.value === 'major'
    ? professionalAnalysisPurposeByTab[currentProfessionalAnalysisTab.value]
    : industryResearchPurposeByTab[currentJobIndustryTab.value]
  : jobResearchPurposeByTab[currentJobResearchTab.value]
)
type ResearchBrief = {
  title: string
  items: string[]
}
const industryResearchBriefs: Record<IndustryResearchTabKey, ResearchBrief> = {
  chain: {
    title: '产业链结构分析',
    items: [
      '智能建造产业链由建筑设计、工程勘察测绘、工程软件、智能建材、建筑装备等上游环节提供基础能力，中游聚焦工程数字化服务与项目实施转化。',
      '岗位需求集中在BIM协同咨询、工程数字化服务、智慧工地平台、装配式建筑和建筑机器人等产业环节。',
      '下游智能施工、质量安全监管、绿色建筑低碳运维和城市更新持续放量，推动岗位向工程交付型复合岗位升级。',
      '建议按设计与数据供给、工程数字化服务、智能施工交付、监管运维应用组织产业认知、岗位画像和课程矩阵。'
    ]
  },
  region: {
    title: '区域产业布局研判',
    items: [
      '智能建造企业和工程场景在京津冀、长三角、粤港澳、成渝及东北重点城市形成集聚，可作为校企合作和实训基地拓展优先区域。',
      '辽宁样本更适合围绕智慧工地、装配式建筑、工程检测监测和城市更新项目建立区域化岗位需求清单。',
      '区域调研应同步关注企业项目类型、技术平台、岗位缺口和可共建课程资源，避免只停留在企业名录收集。'
    ]
  },
  policy: {
    title: '政策趋势解读',
    items: [
      '智能建造政策重点聚焦数字设计、智能生产、智能施工和智慧运维一体化推进。',
      'BIM报建审查、智慧工地监管、建筑机器人应用和绿色低碳建造是工程建设数字化转型的重要抓手。',
      '建议密切跟踪智能建造试点、装配式建筑、工程质量安全监管等政策动向，及时调整课程与实训项目。'
    ]
  },
  company: {
    title: '企业资源研判',
    items: [
      '企业库应优先沉淀能提供真实工程项目、平台工具、设备应用和岗位任务样本的代表企业。',
      '可按产业链环节标注具体产品 / 技术 / 服务节点、合作场景和对应岗位，为后续岗位画像、课程案例和实训项目提供入口。',
      '建议将企业筛选从“规模优先”转为“岗位任务清晰、技术场景可教学、项目资源可共建”三类标准。'
    ]
  },
  major: {
    title: '专业分析研判',
    items: professionalMapInsights
  }
}
const professionalAnalysisBriefs: Record<ProfessionalAnalysisTabKey, ResearchBrief> = {
  map: {
    title: '专业布点分析研判',
    items: professionalMapInsights
  },
  trend: {
    title: '专业开设趋势研判',
    items: professionalTrendInsights
  }
}
const jobResearchBriefs: Record<JobResearchTabKey, ResearchBrief> = {
  portrait: {
    title: '岗位画像洞察',
    items: PORTRAIT_INSIGHTS
  },
  demand: {
    title: '招聘需求趋势判断',
    items: [
      'BIM深化设计、智慧工地管理、建筑机器人应用和智能检测监测岗位招聘热度较高，是当前岗位建设优先方向。',
      '招聘描述中的高频能力集中在BIM协同、工程数据处理、施工现场联调、安全质量管理和项目交付沟通。',
      '建议结合薪资区间、城市分布和技能热度，优先建设能形成课程、实训和证书映射的岗位能力包。'
    ]
  },
  forecast: {
    title: '新岗位新技术',
    items: [
      '未来三年智能建造工程专业将重点受到BIM+数字孪生工地、建筑机器人、结构健康监测和低碳建造影响。',
      '建筑机器人应用工程师、结构健康监测工程师、建筑数据治理工程师将成为新增岗位建设重点。',
      '建议提前将BIM深化、智慧工地、智能检测、建筑物联网和绿色建造纳入课程与实训项目。'
    ]
  }
}
const activeResearchBrief = computed(() => currentJobResearchMode.value === 'industry'
  ? currentJobIndustryTab.value === 'major'
    ? professionalAnalysisBriefs[currentProfessionalAnalysisTab.value]
    : industryResearchBriefs[currentJobIndustryTab.value]
  : jobResearchBriefs[currentJobResearchTab.value]
)
const activeProfessionalAnalysisTab = computed(
  () => PROFESSIONAL_ANALYSIS_TABS.find((tab) => tab.key === currentProfessionalAnalysisTab.value) ?? PROFESSIONAL_ANALYSIS_TABS[0]
)
const activeIndustryResearchTitle = computed(() => {
  if (currentJobResearchMode.value !== 'industry') return activeResearchTab.value.label
  if (currentJobIndustryTab.value === 'major') return activeProfessionalAnalysisTab.value.label
  return activeIndustryTab.value.label
})
const professionalProvinceRankItems = computed(() => {
  const max = Math.max(...professionalProvinceRanks.map((item) => item.count))
  return professionalProvinceRanks.map((item) => ({
    ...item,
    width: `${Math.round((item.count / max) * 100)}%`
  }))
})
const professionalQuadrantItems = computed(() => {
  const maxIndustry = Math.max(...professionalMatchRegions.map((item) => item.industryShare))
  const maxMajor = Math.max(...professionalMatchRegions.map((item) => item.majorShare))
  return professionalMatchRegions.map((item) => ({
    ...item,
    left: `${12 + Math.round((item.majorShare / maxMajor) * 76)}%`,
    bottom: `${12 + Math.round((item.industryShare / maxIndustry) * 76)}%`
  }))
})
const professionalTrendSummaryItems = computed(() => {
  const firstYear = professionalTrendYears[0]
  const firstCount = professionalTrendSchoolCounts[0]
  const currentYear = professionalTrendYears[professionalTrendYears.length - 1]
  const currentCount = professionalTrendSchoolCounts[professionalTrendSchoolCounts.length - 1]
  const fastYearIndex = professionalTrendYears.indexOf('2023')
  const fastYear = fastYearIndex >= 0 ? professionalTrendYears[fastYearIndex] : professionalTrendYears[Math.max(0, professionalTrendYears.length - 3)]
  const fastCount = fastYearIndex >= 0 ? professionalTrendSchoolCounts[fastYearIndex] : professionalTrendSchoolCounts[Math.max(0, professionalTrendSchoolCounts.length - 3)]
  return [
    { label: '起步期', value: `${firstCount}所`, desc: `${firstYear}年试点布点` },
    { label: '扩张期', value: `${fastCount}所`, desc: `${fastYear}年后加速扩容` },
    { label: '当前样本', value: `${currentCount}所`, desc: `${currentYear}年全国样本` },
    { label: '七年净增', value: `+${currentCount - firstCount}所`, desc: '需同步校验区域承载' }
  ]
})
type ChinaLngLat = [number, number]
type ChinaGeoRing = ChinaLngLat[]
type ChinaGeoPolygon = ChinaGeoRing[]
type ChinaGeoMultiPolygon = ChinaGeoPolygon[]
type ChinaGeoFeature = {
  properties: {
    name: string
    center?: ChinaLngLat
    centroid?: ChinaLngLat
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: ChinaGeoPolygon | ChinaGeoMultiPolygon
  }
}
type ChinaGeoJson = {
  features: ChinaGeoFeature[]
}
const chinaGeoFeatures = (chinaGeo as unknown as ChinaGeoJson).features
const normalizeProvinceName = (name: string) =>
  name
    .replace(/壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市/g, '')
    .replace('内蒙古', '内蒙古')
const projectChinaCoordinate = ([lng, lat]: ChinaLngLat) => {
  const x = 30 + ((lng - 73) / (135.5 - 73)) * 760
  const y = 24 + (1 - (lat - 17.5) / (54.5 - 17.5)) * 520
  return [Number(x.toFixed(1)), Number(y.toFixed(1))]
}
const buildChinaRingPath = (ring: ChinaGeoRing) =>
  ring.map((coordinate, index) => {
    const [x, y] = projectChinaCoordinate(coordinate)
    return `${index === 0 ? 'M' : 'L'}${x} ${y}`
  }).join(' ')
const buildChinaPolygonPath = (polygon: ChinaGeoPolygon) =>
  polygon.map((ring) => `${buildChinaRingPath(ring)} Z`).join(' ')
const buildChinaFeaturePath = (feature: ChinaGeoFeature) => {
  if (feature.geometry.type === 'Polygon') {
    return buildChinaPolygonPath(feature.geometry.coordinates as ChinaGeoPolygon)
  }
  return (feature.geometry.coordinates as ChinaGeoMultiPolygon)
    .map((polygon) => buildChinaPolygonPath(polygon))
    .join(' ')
}
const professionalDistributionLookup = computed(() =>
  new Map(professionalDistributionPoints.map((point) => [point.province, point]))
)
const chinaProvincePathItems = computed(() =>
  chinaGeoFeatures.map((feature) => {
    const province = normalizeProvinceName(feature.properties.name)
    const distribution = professionalDistributionLookup.value.get(province)
    return {
      name: province,
      path: buildChinaFeaturePath(feature),
      count: distribution?.count ?? 0,
      tone: distribution?.tone ?? 'heat-1'
    }
  })
)
const professionalMapBubbleItems = computed(() =>
  professionalDistributionPoints.map((point) => {
    const feature = chinaGeoFeatures.find((item) => normalizeProvinceName(item.properties.name) === point.province)
    const center = feature?.properties.centroid ?? feature?.properties.center
    const [x, y] = center ? projectChinaCoordinate(center) : [point.x * 7.6 + 30, point.y * 5.2 + 24]
    return {
      ...point,
      x,
      y,
      size: Math.max(9, Math.min(26, point.count * 0.55))
    }
  })
)
const professionalMapLabelItems = computed(() =>
  professionalMapBubbleItems.value.slice(0, 8).map((point) => ({
    ...point,
    labelWidth: point.province.length > 2 ? 66 : 56
  }))
)
const professionalTrendKpiCards = computed(() => professionalTrendKpis)
const professionalTrendMax = computed(() => Math.max(...professionalTrendSchoolCounts))
const professionalTrendChartWidth = 720
const professionalTrendChartHeight = 260
const professionalTrendChartPad = {
  top: 30,
  right: 28,
  bottom: 42,
  left: 48
}
const professionalTrendGridLines = computed(() =>
  Array.from({ length: 4 }, (_, index) => ({
    y: professionalTrendChartPad.top + index * ((professionalTrendChartHeight - professionalTrendChartPad.top - professionalTrendChartPad.bottom) / 3)
  }))
)
const professionalTrendLinePoints = computed(() => {
  const max = Math.max(1, professionalTrendMax.value)
  const lastIndex = Math.max(1, professionalTrendSchoolCounts.length - 1)
  const plotWidth = professionalTrendChartWidth - professionalTrendChartPad.left - professionalTrendChartPad.right
  const plotHeight = professionalTrendChartHeight - professionalTrendChartPad.top - professionalTrendChartPad.bottom
  return professionalTrendSchoolCounts.map((value, index) => {
    const x = professionalTrendChartPad.left + (index / lastIndex) * plotWidth
    const y = professionalTrendChartPad.top + (1 - value / max) * plotHeight
    return { year: professionalTrendYears[index], value, x, y }
  })
})
const professionalTrendPolyline = computed(() =>
  professionalTrendLinePoints.value.map((point) => `${point.x},${point.y}`).join(' ')
)
const professionalTrendAreaPoints = computed(() => {
  const baseline = professionalTrendChartHeight - professionalTrendChartPad.bottom
  const first = professionalTrendLinePoints.value[0]
  const last = professionalTrendLinePoints.value[professionalTrendLinePoints.value.length - 1]
  if (!first || !last) return ''
  return `${first.x},${baseline} ${professionalTrendPolyline.value} ${last.x},${baseline}`
})
const professionalDeltaMax = computed(() =>
  Math.max(...professionalTrendDeltaRows.flatMap((row) => [row.add, row.cancel]))
)
const professionalEnrollmentMax = computed(() =>
  Math.max(...professionalEnrollmentRows.flatMap((row) => [row.enrollment, row.graduate]))
)
const professionalPercent = (value: number, max: number) => `${Math.max(4, Math.round((value / max) * 100))}%`
const activeIndustryChainLabel = computed(() =>
  REPORT_INDUSTRY_OPTIONS.includes(selectedIndustryChain.value)
    ? selectedIndustryChain.value
    : REPORT_DEFAULT_FORM.industry
)
const industryCompanyPageSize = 10
const currentIndustryCompanyPage = ref(1)
const filteredIndustryCompanyItems = computed(() => {
  const keyword = industryCompanySearchText.value.trim().toLowerCase()
  if (!keyword) return industryCompanyItems

  return industryCompanyItems.filter((company) =>
    [
      company.name,
      company.creditCode,
      company.address,
      company.scale,
      company.products,
      company.industry
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  )
})
const industryCompanyPageCount = computed(() =>
  Math.max(1, Math.ceil(filteredIndustryCompanyItems.value.length / industryCompanyPageSize))
)
const paginatedIndustryCompanyItems = computed(() => {
  const start = (currentIndustryCompanyPage.value - 1) * industryCompanyPageSize
  return filteredIndustryCompanyItems.value.slice(start, start + industryCompanyPageSize)
})
const industryCompanyPageNumbers = computed(() =>
  Array.from({ length: industryCompanyPageCount.value }, (_, index) => index + 1)
)
const filteredReportRows = computed(() => {
  const keyword = reportSearchText.value.trim().toLowerCase()
  const chainKeyword = activeIndustryChainLabel.value.toLowerCase()
  return reportRows.value.filter((report) =>
    report.industry.toLowerCase() === chainKeyword
    && (!keyword || [report.title, report.type, report.industry, report.region, report.major].join(' ').toLowerCase().includes(keyword))
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
const portraitSearchInput = ref('')
const appliedPortraitSearchText = ref('')
const portraitLevelOptions = ['全部', '初级', '中级', '高级']
const portraitLevelFilter = ref('全部')
const portraitJobDetails = computed(() =>
  PORTRAIT_JOB_PROFILES.map((job) => getPortraitJobDetail(job.id))
    .filter((job): job is NonNullable<typeof job> => Boolean(job))
)
const PORTRAIT_KPIS = computed(() => {
  const taskTotal = portraitJobDetails.value.reduce((sum, job) => sum + job.tasks.length, 0)
  const abilityTotal = portraitJobDetails.value.reduce(
    (sum, job) => sum + job.abilityGroups.reduce((groupSum, group) => groupSum + group.items.length, 0),
    0
  )
  const certificateTotal = portraitJobDetails.value.reduce((sum, job) => sum + job.certificates.length, 0)

  return [
    { label: '岗位', value: PORTRAIT_JOB_PROFILES.length, unit: '个', tone: 'blue' },
    { label: '典型工作任务', value: taskTotal, unit: '项', tone: 'green' },
    { label: '能力项', value: abilityTotal, unit: '项', tone: 'purple' },
    { label: '证书', value: certificateTotal, unit: '项', tone: 'orange' }
  ]
})
const filteredPortraitJobs = computed(() => {
  const keyword = appliedPortraitSearchText.value.trim().toLowerCase()
  const levelMatchedJobs = PORTRAIT_JOB_PROFILES.filter((job) =>
    portraitLevelFilter.value === '全部' || job.level === portraitLevelFilter.value
  )
  if (!keyword) return levelMatchedJobs

  return levelMatchedJobs.filter((job) => {
    const detail = getPortraitJobDetail(job.id)
    const searchText = [
      job.name,
      job.salary,
      String(job.demand),
      job.level,
      job.chain,
      ...job.skills,
      detail?.name ?? '',
      detail?.summary ?? '',
      detail?.chain ?? '',
      detail?.node ?? '',
      ...(detail?.tags ?? []),
      ...(detail?.tasks ?? [])
    ].join(' ').toLowerCase()
    return searchText.includes(keyword)
  })
})
const portraitPageCount = computed(() => Math.max(1, Math.ceil(filteredPortraitJobs.value.length / portraitPageSize)))
const paginatedPortraitJobs = computed(() => {
  const start = (currentPortraitPage.value - 1) * portraitPageSize
  return filteredPortraitJobs.value.slice(start, start + portraitPageSize)
})
const portraitPageNumbers = computed(() =>
  Array.from({ length: portraitPageCount.value }, (_, index) => index + 1)
)
const searchPortraitJobs = () => {
  appliedPortraitSearchText.value = portraitSearchInput.value.trim()
  currentPortraitPage.value = 1
}
const applyPortraitLevelFilter = () => {
  currentPortraitPage.value = 1
}
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
const graphLayout = computed(() => buildGraphLayout({
  jobs: jobCardsForBuild.value,
  getCourseIds: courseIdsForJob,
  chains: industryChainsForBuild.value,
  industries: industryNodesForBuild.value,
  chainRelations: industryChainRelationsForBuild.value,
  jobIndustryRelations: jobIndustryRelationsForBuild.value,
  courses: COURSE_NODES,
}))
const resultsPortalGraphLayout = computed(() => buildGraphLayout({
  jobs: JOB_CARDS,
  getCourseIds: defaultCourseIdsForJob,
  chains: industryChainsForBuild.value,
  industries: industryNodesForBuild.value,
  chainRelations: industryChainRelationsForBuild.value,
  jobIndustryRelations: jobIndustryRelationsForBuild.value,
  courses: COURSE_NODES,
}))
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
const studentCareerAgentPrompts = studentCareerPlanData.prompts
const studentCurrentCourse = computed(() =>
  studentCareerPlanData.semesters.flatMap((semester) => semester.courses).find((course) => course.agent)
    ?? studentCareerPlanData.semesters[0]?.courses[0]
)
const studentCareerJobs = computed(() =>
  studentCareerPlanData.jobs.map((job) => ({
    id: job.name,
    name: job.name,
    meta: job.meta,
    skills: job.skills
  }))
)
const getSemesterSortValue = (semester: string) => {
  const match = semester.match(/\d+/)
  return match ? Number(match[0]) : 99
}
const createStudentCourseCard = (course: StudentPlanCourse, semester: string, index: number): StudentCourseCard => ({
  code: course.code,
  name: course.name,
  agent: course.agent,
  credits: course.credits,
  type: course.type,
  semester,
  target: course.target,
  tone: course.agent ? 'active' : index % 3 === 0 ? 'cyan' : 'muted',
  prerequisites: course.prerequisite
})
const studentSemesterCourseGroups = computed(() => {
  return studentCareerPlanData.semesters
    .slice()
    .sort((first, second) => getSemesterSortValue(first.name) - getSemesterSortValue(second.name))
    .map((semester) => ({
      semester: semester.name,
      courses: semester.courses.map((course, index) => createStudentCourseCard(course, semester.name, index))
    }))
})
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
  industryNodesForBuild.value.find((industry) => industry.id === selectedGraphJob.value?.industryNodeId)
)
const selectedGraphChain = computed(() =>
  industryChainsForBuild.value.find((chain) => chain.id === selectedGraphIndustry.value?.chainId)
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
const industryResearchCmsInitializationUrl = () => {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return new URL('./industry-research-admin.html', window.location.href).toString()
  }
  return buildStandaloneViewUrl('industry-research-admin')
}
const openIndustryResearchCmsInitialization = () => {
  openStandaloneView(industryResearchCmsInitializationUrl())
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
const openNationalIndustryMetricDialog = (label: string) => {
  selectedNationalIndustryMetricLabel.value = label
}
const closeNationalIndustryMetricDialog = () => {
  selectedNationalIndustryMetricLabel.value = ''
}
const selectPortraitCompetencyTask = (index: number) => {
  activePortraitCompetencyTaskIndex.value = index
  updatePortraitCompetencyLines()
}
const setPortraitCompetencyBodyMode = (enabled: boolean) => {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('competency-map-body', enabled)
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
const selectStudentPlanTab = (tab: StudentPlanTab) => {
  activeStudentPlanTab.value = tab
}
const selectStudentAgentPrompt = (prompt: string) => {
  activeStudentPrompt.value = prompt
  const courseName = studentCurrentCourse.value?.name ?? '当前课程'
  studentAgentInput.value = `${prompt}：${courseName}`
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
  const option = courseJobAbilityOptionMap.value.get(jobId)
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
  const firstJobId = selectedCourseNodeAbilityRelations.value[0]?.jobId ?? courseJobAbilityOptionsForBuild.value[0]?.id ?? ''
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
      const option = courseJobAbilityOptionMap.value.get(jobId)
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
const toggleAiSuggestionPanel = () => {
  aiSuggestionPanelOpen.value = !aiSuggestionPanelOpen.value
}
const closeAiSuggestionPanel = () => {
  aiSuggestionPanelOpen.value = false
}
const closeAiAnalysisModal = () => {
  activeAiAnalysisKey.value = ''
}
const openAiSuggestion = (key: AiSuggestionItem['key']) => {
  if (key === 'hot-jobs') {
    activeAiAnalysisKey.value = 'hot-jobs'
    closeAiSuggestionPanel()
    return
  }
  closeAiSuggestionPanel()
  openDecisionCenter()
  if (key === 'course-cross') {
    selectDecisionPage('governance', 'course-diagnosis')
    activeDecisionCourseTab.value = '课程交叉分析'
    decisionCourseStatus.value = 'result'
  } else if (key === 'plan-diagnosis') {
    selectDecisionPage('governance', 'plan-analysis')
    activeDecisionPlanModeTab.value = '培养方案诊断分析'
  } else if (key === 'plan-compare') {
    selectDecisionPage('governance', 'plan-analysis')
    activeDecisionPlanModeTab.value = '培养方案对比分析'
  }
  persistDecisionState()
}
const startIndustryResearchInitialization = () => {
  clearIndustryResearchTimer()
  selectedIndustryResearchChainIds.value = []
  persistIndustryResearchSelection()
  industryResearchCurrentPage.value = 1
  industryResearchStatus.value = 'initializing'
  industryResearchTimer = window.setTimeout(() => {
    industryResearchStatus.value = 'ready'
    industryResearchTimer = undefined
  }, 900)
}
const persistIndustryResearchSelection = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(industryResearchStateKey, JSON.stringify({
    initialized: selectedIndustryResearchChainIds.value.length > 0,
    selectedChainIds: selectedIndustryResearchChainIds.value,
    selectedAt: new Date().toISOString()
  }))
  industryResearchDemoInitialized.value = readIndustryResearchDemoInitialized()
}
const refreshIndustryResearchDemoInitialized = () => {
  industryResearchDemoInitialized.value = readIndustryResearchDemoInitialized()
}
const resetIndustryResearchDemoInitialization = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(industryResearchStateKey)
  }
  clearIndustryResearchTimer()
  selectedIndustryResearchChainIds.value = []
  industryResearchCurrentPage.value = 1
  industryResearchStatus.value = 'idle'
  refreshIndustryResearchDemoInitialized()
}
const handleIndustryResearchStorage = (event: StorageEvent) => {
  if (event.key === industryResearchStateKey) {
    refreshIndustryResearchDemoInitialized()
  }
}
const toggleIndustryResearchChain = (chainId: string) => {
  selectedIndustryResearchChainIds.value = selectedIndustryResearchChainIds.value.includes(chainId)
    ? selectedIndustryResearchChainIds.value.filter((id) => id !== chainId)
    : [...selectedIndustryResearchChainIds.value, chainId]
  persistIndustryResearchSelection()
}
const setIndustryResearchPage = (page: number) => {
  industryResearchCurrentPage.value = Math.min(Math.max(page, 1), industryResearchTotalPages.value)
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
const isExpandableJobMenuItem = (item: string): item is ExpandableJobMenuItem =>
  expandableJobMenuItems.includes(item as ExpandableJobMenuItem)
const isJobMenuExpanded = (item: string) =>
  isExpandableJobMenuItem(item) && expandedJobMenus.value[item]
const setJobMenuExpanded = (item: ExpandableJobMenuItem, expanded: boolean) => {
  expandedJobMenus.value = {
    产业调研: item === '产业调研' ? expanded : false
  }
}
const selectJobSection = (item: string) => {
  const shouldToggleMenu = isExpandableJobMenuItem(item)
  currentJobSection.value = item
  if (item === '产业调研') currentJobResearchMode.value = 'industry'
  if (item === '报告生成') currentReportView.value = 'library'
  if (shouldToggleMenu) setJobMenuExpanded(item, true)
  selectedJobId.value = ''
  activeDetailTab.value = 'basic'
  closePortraitJobDialog()
}
const selectJobIndustryTab = (tabKey: IndustryResearchTabKey) => {
  currentModule.value = '岗位中心'
  currentJobSection.value = '产业调研'
  setJobMenuExpanded('产业调研', true)
  currentJobResearchMode.value = 'industry'
  currentJobIndustryTab.value = tabKey
  currentIndustryCompanyPage.value = 1
  selectedJobId.value = ''
  closePortraitJobDialog()
}
const selectProfessionalAnalysisTab = (tabKey: ProfessionalAnalysisTabKey) => {
  currentModule.value = '岗位中心'
  currentJobSection.value = '产业调研'
  setJobMenuExpanded('产业调研', true)
  currentJobResearchMode.value = 'industry'
  currentJobIndustryTab.value = 'major'
  currentProfessionalAnalysisTab.value = tabKey
  selectedJobId.value = ''
  closePortraitJobDialog()
}
const selectJobResearchTab = (tabKey: JobResearchTabKey) => {
  currentModule.value = '岗位中心'
  currentJobSection.value = '产业调研'
  setJobMenuExpanded('产业调研', true)
  currentJobResearchMode.value = 'job'
  currentJobResearchTab.value = tabKey
  currentPortraitPage.value = 1
  selectedJobId.value = ''
  closePortraitJobDialog()
}
const setPortraitPage = (page: number) => {
  currentPortraitPage.value = Math.min(Math.max(page, 1), portraitPageCount.value)
}
const setIndustryCompanyPage = (page: number) => {
  currentIndustryCompanyPage.value = Math.min(Math.max(page, 1), industryCompanyPageCount.value)
}
watch(industryCompanySearchText, () => {
  currentIndustryCompanyPage.value = 1
})
watch(selectedIndustryChain, () => {
  reportForm.value = {
    ...reportForm.value,
    industry: activeIndustryChainLabel.value
  }
})
watch(industryCompanyPageCount, (pageCount) => {
  if (currentIndustryCompanyPage.value > pageCount) {
    currentIndustryCompanyPage.value = pageCount
  }
})
const openReportLibrary = () => {
  currentModule.value = '岗位中心'
  currentJobSection.value = '报告生成'
  currentReportView.value = 'library'
  selectedJobId.value = ''
  closePortraitJobDialog()
}
const openReportCreate = () => {
  currentJobSection.value = '报告生成'
  currentReportView.value = 'create'
  activeReportId.value = 0
  reportForm.value = { ...REPORT_DEFAULT_FORM, industry: activeIndustryChainLabel.value }
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
const createBlankBasicInfoForm = (): JobBasicEditForm => ({
  name: '',
  occupation: '',
  occupationCode: '',
  level: '初级',
  chainIndustry: '',
  industryNodeId: INDUSTRY_NODES[0]?.id ?? '',
  relatedCompanies: '',
  groupName: '',
  salaryRange: '',
  demandLevel: '待评估',
  demandVolume: '',
  education: '大专及以上',
  experience: '不限',
  careerPath: '',
  workSummary: '',
  requirements: ''
})
const createManualJobId = (name: string) => {
  const suffix = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 16)
  return `manual-job-${Date.now().toString(36)}${suffix ? `-${suffix}` : ''}`
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
const downloadAbilityTemplate = async () => {
  await downloadAbilityTemplateWorkbook()
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
  const job = selectedJobBasic.value
  const detail = selectedJobDetail.value
  return {
    name: job?.name ?? '',
    occupation: job?.occupation ?? '',
    occupationCode: job?.occupationCode ?? '',
    level: selectedJobLevel.value,
    chainIndustry: selectedJobChainIndustry.value,
    industryNodeId: job?.industryNodeId ?? '',
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
const createIndustryEntityForm = (
  entityType: IndustryEntityDialogType,
  entityId = selectedJobBasic.value?.industryNodeId ?? ''
): IndustryEntityEditForm => {
  const fallbackIndustryId = selectedJobBasic.value?.industryNodeId ?? INDUSTRY_NODES[0]?.id ?? ''
  const industryId = entityType === 'chain'
    ? ''
    : entityId || fallbackIndustryId
  const sourceIndustry = industryNodesForBuild.value.find((industry) => industry.id === industryId)
  const chainId = entityType === 'chain'
    ? entityId || sourceIndustry?.chainId || INDUSTRY_CHAINS[0]?.id || ''
    : sourceIndustry?.chainId || INDUSTRY_CHAINS[0]?.id || ''
  const sourceChain = industryChainsForBuild.value.find((chain) => chain.id === chainId)
  const sourceChainName = sourceChain?.name ?? ''
  const sourceIndustryName = sourceIndustry?.name ?? ''
  return {
    entityType,
    chainId,
    industryId,
    chainName: sourceChainName,
    chainDescription: chainDescriptionForId(chainId, sourceChainName),
    chainFocusTag: chainFocusTagForId(chainId),
    industryName: sourceIndustryName,
    industryDescription: sourceIndustry ? industryDescriptionForId(sourceIndustry.id, sourceIndustry.name) : '',
    industryChainId: chainId,
    industryStage: sourceIndustry ? industryStageForNode(sourceIndustry) : (industryStageByChainId[chainId] ?? 'midstream'),
    industryKeyFields: sourceIndustry ? industryKeyFieldsForId(sourceIndustry.id) : '',
    industryLeadSignals: sourceIndustry ? industryLeadSignalsForId(sourceIndustry.id) : ''
  }
}
const basicInfoDialogTitle = computed(() => {
  if (manualJobDialogOpen.value) return '添加单个岗位'
  if (industryEntityForm.value.entityType === 'chain') return '编辑产业链信息'
  if (industryEntityForm.value.entityType === 'industry') return '编辑产业信息'
  return '编辑基本信息'
})
const basicInfoDialogCrumb = computed(() => {
  if (manualJobDialogOpen.value) return '手动添加岗位'
  if (industryEntityForm.value.entityType === 'chain') return '编辑产业链信息'
  if (industryEntityForm.value.entityType === 'industry') return '编辑产业信息'
  return '编辑基本信息'
})
const openBasicInfoDialog = () => {
  if (!selectedJob.value) return
  basicInfoForm.value = createBasicInfoForm()
  industryEntityForm.value = createIndustryEntityForm('job', basicInfoForm.value.industryNodeId)
  basicInfoDialogOpen.value = true
}
const openManualJobDialog = () => {
  basicInfoForm.value = createBlankBasicInfoForm()
  basicInfoForm.value.groupName = jobGroupOptions.value[0] ?? ''
  industryEntityForm.value = createIndustryEntityForm('job', basicInfoForm.value.industryNodeId)
  addJobDialogOpen.value = false
  manualJobDialogOpen.value = true
}
const openIndustryEntityDialog = (entityType: 'chain' | 'industry', entityId: string) => {
  selectedGraphJobId.value = ''
  hoverKey.value = entityType === 'chain' ? `chain:${entityId}` : `industry:${entityId}`
  industryEntityForm.value = createIndustryEntityForm(entityType, entityId)
  basicInfoDialogOpen.value = true
}
const closeBasicInfoDialog = () => {
  basicInfoDialogOpen.value = false
}
const closeManualJobDialog = () => {
  manualJobDialogOpen.value = false
}
const syncIndustryEntityChainSelection = () => {
  const chain = industryChainsForBuild.value.find((item) => item.id === industryEntityForm.value.industryChainId)
  if (!chain) return
  industryEntityForm.value.chainId = chain.id
  industryEntityForm.value.chainName = chain.name
  industryEntityForm.value.chainDescription = chainDescriptionForId(chain.id, chain.name)
  industryEntityForm.value.chainFocusTag = chainFocusTagForId(chain.id)
  if (industryEntityForm.value.entityType === 'job') {
    const firstIndustry = industryNodesForBuild.value.find((industry) => industry.chainId === chain.id)
    industryEntityForm.value.industryId = firstIndustry?.id ?? ''
    syncIndustrySelection()
  }
}
const syncIndustrySelection = () => {
  const industry = industryNodesForBuild.value.find((item) => item.id === industryEntityForm.value.industryId)
  if (!industry) return
  const chain = industryChainsForBuild.value.find((item) => item.id === industry.chainId)
  industryEntityForm.value.industryChainId = industry.chainId
  industryEntityForm.value.chainId = industry.chainId
  industryEntityForm.value.chainName = chain?.name ?? ''
  industryEntityForm.value.chainDescription = chainDescriptionForId(industry.chainId, chain?.name ?? '')
  industryEntityForm.value.chainFocusTag = chainFocusTagForId(industry.chainId)
  industryEntityForm.value.industryName = industry.name
  industryEntityForm.value.industryDescription = industryDescriptionForId(industry.id, industry.name)
  industryEntityForm.value.industryStage = industryStageForNode(industry)
  industryEntityForm.value.industryKeyFields = industryKeyFieldsForId(industry.id)
  industryEntityForm.value.industryLeadSignals = industryLeadSignalsForId(industry.id)
  basicInfoForm.value.industryNodeId = industry.id
  basicInfoForm.value.chainIndustry = `${chain?.name ?? ''} - ${industry.name}`
}
const normalizeDemandVolume = () => {
  basicInfoForm.value.demandVolume = basicInfoForm.value.demandVolume.replace(/[^\d,]/g, '')
}
const basicInfoFormReady = computed(() => {
  const form = basicInfoForm.value
  const entity = industryEntityForm.value
  const industryReady = entity.chainName.trim() !== ''
    && (entity.entityType === 'chain' || (entity.industryName.trim() !== '' && entity.industryChainId.trim() !== ''))
  if (entity.entityType !== 'job') return industryReady
  if (manualJobDialogOpen.value) {
    return form.name.trim() !== ''
  }
  return form.name.trim() !== ''
    && form.occupation.trim() !== ''
    && /^[0-9-]+$/.test(form.occupationCode.trim())
    && industryReady
})
const upsertIndustryEntitiesFromForm = () => {
  const entity = industryEntityForm.value
  const chainName = entity.chainName.trim()
  const industryName = entity.industryName.trim()
  let chainId = entity.industryChainId || entity.chainId
  if (!chainId || !industryChainsForBuild.value.some((chain) => chain.id === chainId)) {
    chainId = createCustomIndustryId('chain', chainName)
  }

  if (!INDUSTRY_CHAINS.some((chain) => chain.id === chainId) && !customIndustryChains.value.some((chain) => chain.id === chainId)) {
    customIndustryChains.value = [
      ...customIndustryChains.value,
      { id: chainId, name: chainName, description: entity.chainDescription.trim(), focusTag: entity.chainFocusTag.trim() }
    ]
  }
  industryChainOverrides.value = {
    ...industryChainOverrides.value,
    [chainId]: {
      name: chainName,
      description: entity.chainDescription.trim(),
      focusTag: entity.chainFocusTag.trim()
    }
  }

  if (entity.entityType === 'chain') {
    return { chainId, industryNodeId: entity.industryId, chainIndustry: chainName }
  }

  let industryNodeId = entity.industryId
  if (!industryNodeId || !industryNodesForBuild.value.some((industry) => industry.id === industryNodeId)) {
    industryNodeId = createCustomIndustryId('industry', `${chainName}-${industryName}`)
  }
  if (!INDUSTRY_NODES.some((industry) => industry.id === industryNodeId) && !customIndustryNodes.value.some((industry) => industry.id === industryNodeId)) {
    customIndustryNodes.value = [
      ...customIndustryNodes.value,
      {
        id: industryNodeId,
        name: industryName,
        chainId,
        description: entity.industryDescription.trim(),
        stage: entity.industryStage,
        keyFields: entity.industryKeyFields.trim(),
        leadSignals: entity.industryLeadSignals.trim()
      }
    ]
  }
  industryNodeOverrides.value = {
    ...industryNodeOverrides.value,
    [industryNodeId]: {
      name: industryName,
      description: entity.industryDescription.trim(),
      chainId,
      stage: entity.industryStage,
      keyFields: entity.industryKeyFields.trim(),
      leadSignals: entity.industryLeadSignals.trim()
    }
  }
  return {
    chainId,
    industryNodeId,
    chainIndustry: `${chainName} - ${industryName}`
  }
}
const saveIndustryEntityInfo = () => {
  if (!basicInfoFormReady.value) return
  upsertIndustryEntitiesFromForm()
  closeBasicInfoDialog()
  updateGraphLines()
}
const saveBasicInfo = () => {
  const job = selectedJob.value
  if (!job || !basicInfoFormReady.value) return

  const form = basicInfoForm.value
  const { industryNodeId, chainIndustry } = upsertIndustryEntitiesFromForm()
  jobBasicOverrides.value = {
    ...jobBasicOverrides.value,
    [job.id]: {
      name: form.name.trim(),
      occupation: form.occupation.trim(),
      occupationCode: form.occupationCode.trim(),
      level: form.level.trim(),
      chainIndustry,
      industryNodeId,
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
  updateGraphLines()
}
const saveManualJob = () => {
  if (!basicInfoFormReady.value) return

  const form = basicInfoForm.value
  const { industryNodeId, chainIndustry } = upsertIndustryEntitiesFromForm()
  const jobId = createManualJobId(form.name.trim())
  const nextJob: JobCard = {
    id: jobId,
    name: form.name.trim(),
    groupId: `manual-${industryNodeId || 'custom'}`,
    groupName: form.groupName.trim() || '手动添加岗位群',
    occupation: form.occupation.trim(),
    occupationCode: form.occupationCode.trim(),
    taskCount: 0,
    abilityCount: 0,
    industryNodeId
  }

  addedJobCards.value = [...addedJobCards.value, nextJob]
  jobBasicOverrides.value = {
    ...jobBasicOverrides.value,
    [jobId]: {
      name: nextJob.name,
      occupation: nextJob.occupation,
      occupationCode: nextJob.occupationCode,
      level: form.level.trim(),
      chainIndustry,
      industryNodeId,
      relatedCompanies: form.relatedCompanies.trim(),
      groupName: nextJob.groupName,
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
  editableTasksByJobId.value = { ...editableTasksByJobId.value, [jobId]: [] }
  editableAbilitiesByJobId.value = { ...editableAbilitiesByJobId.value, [jobId]: [] }
  manualJobCourseIds.value = { ...manualJobCourseIds.value, [jobId]: [] }
  selectedJobId.value = jobId
  selectedGraphJobId.value = ''
  activeDetailTab.value = 'basic'
  hoverKey.value = ''
  addJobDialogOpen.value = false
  closeManualJobDialog()
  updateGraphLines()
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
  refreshIndustryResearchDemoInitialized()
  window.addEventListener('resize', updateAbilityLines)
  window.addEventListener('resize', updateGraphLines)
  window.addEventListener('resize', updateGraphAbilityLines)
  window.addEventListener('resize', updatePortraitCompetencyLines)
  window.addEventListener('storage', handleIndustryResearchStorage)
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
  clearIndustryResearchTimer()
  window.removeEventListener('resize', updateAbilityLines)
  window.removeEventListener('resize', updateGraphLines)
  window.removeEventListener('resize', updateGraphAbilityLines)
  window.removeEventListener('resize', updatePortraitCompetencyLines)
  window.removeEventListener('storage', handleIndustryResearchStorage)
})
</script>

<template>
  <main v-if="isStudentCareerPlanView" class="student-plan-shell">
    <aside class="student-app-dock" aria-label="学生端导航">
      <div class="student-school-mark">{{ studentCareerPlanData.schoolMark }}</div>
      <nav>
        <button class="student-dock-item" type="button"><span>▥</span>教学管理</button>
        <button class="student-dock-item active" type="button"><span>▣</span>培养方案</button>
        <button class="student-dock-item" type="button"><span>◇</span>我的成果</button>
        <button class="student-dock-item" type="button"><span>AI</span>AI空间</button>
        <button class="student-dock-item" type="button"><span>▦</span>更多</button>
      </nav>
      <div class="student-dock-bottom">
        <button type="button" aria-label="下载">⇩</button>
        <span></span>
      </div>
    </aside>

    <section class="student-plan-workspace">
      <header class="student-plan-topbar">
        <div>
          <h1>{{ studentCareerPlanData.title }}</h1>
          <p>{{ studentCareerPlanData.subtitle }}</p>
        </div>
        <button class="student-year-switch" type="button">{{ studentCareerPlanData.cohort }}</button>
      </header>

      <nav class="student-plan-tabs" aria-label="培养方案内容">
        <button
          v-for="tab in studentPlanTabs"
          :key="tab"
          class="student-plan-tab"
          :class="{ active: activeStudentPlanTab === tab }"
          type="button"
          @click="selectStudentPlanTab(tab)"
        >
          {{ tab }}
        </button>
      </nav>

      <section class="student-plan-body">
        <section class="student-plan-content">
          <template v-if="activeStudentPlanTab === '培养目标'">
            <article class="student-goal-overview">
              <span>培养目标概述</span>
              <p>{{ studentCareerPlanData.overview }}</p>
            </article>
            <div class="student-goal-list">
              <article v-for="(goal, index) in studentCareerPlanData.goals" :key="goal" class="student-goal-card">
                <div class="student-goal-icon">◎</div>
                <div>
                  <strong>目标{{ index + 1 }}</strong>
                  <p>{{ goal }}</p>
                </div>
              </article>
            </div>
          </template>

          <template v-else-if="activeStudentPlanTab === '毕业要求'">
            <article class="student-section-note">
              <strong>毕业要求</strong>
              <p>{{ studentCareerPlanData.graduationOverview }}</p>
            </article>
            <div class="student-requirement-list">
              <article v-for="item in studentCareerPlanData.requirements" :key="item.code" class="student-requirement-card">
                <div class="student-requirement-code">{{ item.code }}</div>
                <div class="student-requirement-content">
                  <strong>{{ item.title }}</strong>
                  <p v-for="(child, childIndex) in item.children" :key="`${item.code}-${childIndex}`">
                    {{ child }}
                  </p>
                </div>
              </article>
            </div>
          </template>

          <template v-else>
            <div class="student-course-toolbar">
              <button class="student-year-switch" type="button">{{ studentCareerPlanData.courseYear }}</button>
              <span>颜色说明</span>
              <em>蓝色表示已接入课程智能体，灰色表示基础课程或待完善课程资料。</em>
            </div>
            <section
              v-for="group in studentSemesterCourseGroups.slice(0, 8)"
              :key="group.semester"
              class="student-semester-section"
            >
              <h2>{{ group.semester }}</h2>
              <div class="student-course-grid">
                <article
                  v-for="course in group.courses"
                  :key="`${group.semester}-${course.code}`"
                  class="student-course-card"
                  :class="`tone-${course.tone}`"
                >
                  <div class="student-course-card-head">
                    <span>{{ course.type.includes('必修') ? '必修' : '选修' }}</span>
                    <strong>{{ course.name }}</strong>
                  </div>
                  <dl>
                    <div><dt>课程代码</dt><dd>{{ course.code }}</dd></div>
                    <div><dt>课程学分</dt><dd>{{ course.credits }}</dd></div>
                    <div><dt>课程目标</dt><dd>{{ course.target }}</dd></div>
                    <div><dt>先后修</dt><dd>{{ course.prerequisites }}</dd></div>
                  </dl>
                  <p>{{ course.agent || '暂未开通课程智能体' }}</p>
                </article>
              </div>
            </section>
          </template>
        </section>

        <aside class="career-agent-panel" aria-label="学涯规划助手">
          <header>
            <div class="career-agent-avatar">AI</div>
            <h2>学涯规划助手</h2>
            <button type="button" aria-label="关闭助手">×</button>
          </header>

          <section class="career-agent-body">
            <article class="career-agent-opening">
              <p>我是你的学涯规划助手，会结合本专业培养目标、毕业要求、课程体系和岗位方向，帮你看清每门课为什么学、支撑什么能力、未来能对接哪些岗位。</p>
            </article>

            <section class="career-agent-jobs">
              <h3>该专业涉及的岗位</h3>
              <div>
                <article v-for="job in studentCareerJobs" :key="job.id">
                  <strong>{{ job.name }}</strong>
                  <span>{{ job.meta }}</span>
                  <p>{{ job.skills }}</p>
                </article>
              </div>
            </section>

          </section>

          <footer class="career-agent-input">
            <section class="career-agent-prompts">
              <h3>快捷指令</h3>
              <button
                v-for="prompt in studentCareerAgentPrompts"
                :key="prompt"
                type="button"
                :class="{ active: activeStudentPrompt === prompt }"
                @click="selectStudentAgentPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </section>
            <textarea
              v-model="studentAgentInput"
              placeholder="培养方案有困惑？问问学涯规划助手"
              rows="2"
            ></textarea>
            <button class="career-agent-send" type="button" aria-label="发送">➤</button>
          </footer>
        </aside>
      </section>
    </section>
  </main>

  <main v-else-if="isResultsPortal" class="results-portal-shell">
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
                <strong>{{ industryChainsForBuild.length }}</strong>
              </div>
              <div>
                <span>产业节点</span>
                <strong>{{ industryNodesForBuild.length }}</strong>
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
            @click.stop="openIndustryEntityDialog('chain', chain.id)"
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
            @click.stop="openIndustryEntityDialog('industry', industry.id)"
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

  <main v-else-if="isIndustryResearchAdminView" class="cms-admin-shell">
    <aside class="cms-sidebar">
      <nav class="cms-sidebar-nav" aria-label="CMS 管理菜单">
        <button class="cms-menu-section" type="button"><span>▦</span>cms管理<em>⌄</em></button>
        <button class="cms-menu-section" type="button"><span>▦</span>资源管理<em>⌄</em></button>
        <button class="cms-menu-section" type="button"><span>▦</span>课程管理<em>⌄</em></button>
        <button class="cms-menu-section" type="button"><span>▦</span>商品管理<em>⌄</em></button>
        <button class="cms-menu-section" type="button"><span>▦</span>服务等级<em>⌄</em></button>
        <button class="cms-menu-section expanded" type="button"><span>▦</span>平台管理<em>⌃</em></button>
        <div class="cms-sub-menu">
          <button type="button"><span>▦</span>平台列表</button>
          <button type="button"><span>▦</span>班级管理</button>
          <button type="button"><span>▦</span>平台通知</button>
          <button type="button"><span>▦</span>直播分发</button>
          <button type="button"><span>▦</span>操作日志</button>
          <button type="button"><span>▦</span>直播管理</button>
          <button class="active" type="button"><span>▦</span>AI 课程</button>
        </div>
      </nav>
    </aside>

    <section class="cms-workspace">
      <header class="cms-topbar">
        <div class="cms-breadcrumb">
          <button type="button" aria-label="展开导航">☰</button>
          <span>平台管理 / AI 课程管理</span>
        </div>
        <div class="cms-user-tools">
          <button type="button">⌄ 工单</button>
          <span class="cms-avatar">Tre</span>
        </div>
      </header>

      <section class="cms-page-body">
        <article class="cms-management-card">
          <header class="cms-card-titlebar">
            <button type="button" aria-label="返回">‹</button>
            <span></span>
            <h1>新专业建设</h1>
          </header>

          <nav class="cms-professional-tabs" aria-label="新专业建设管理">
            <button
              v-for="tab in cmsProfessionalTabs"
              :key="tab.label"
              type="button"
              :class="{ active: tab.active }"
            >
              {{ tab.label }}
            </button>
          </nav>

          <section class="cms-industry-panel">
            <header class="cms-industry-head">
              <div>
                <h2>产业调研管理</h2>
                <p>用于开通当前专业的产业调研能力，初始化完成后推荐相关产业链供管理员选择。</p>
              </div>
              <button
                v-if="industryResearchStatus === 'idle'"
                class="cms-primary-button"
                type="button"
                @click="startIndustryResearchInitialization"
              >
                数据初始化
              </button>
              <button
                v-else
                class="cms-secondary-button"
                type="button"
                @click="startIndustryResearchInitialization"
              >
                重新初始化
              </button>
            </header>

            <section v-if="industryResearchStatus === 'idle'" class="cms-init-empty">
              <div>
                <strong>待初始化</strong>
                <p>点击“数据初始化”后，系统将根据专业基础信息、培养方向、岗位资料与已有建设数据生成产业链推荐。</p>
              </div>
            </section>

            <section v-else-if="industryResearchStatus === 'initializing'" class="industry-initialization-progress cms-init-progress">
              <div class="industry-progress-copy">
                <span>初始化中</span>
                <strong>正在根据专业名称、培养方向、岗位资料和已有专业数据生成产业链推荐</strong>
                <p>正在识别专业服务面向、岗位能力关键词、课程支撑关系和区域产业关联。</p>
              </div>
              <div class="industry-progress-bar" aria-hidden="true">
                <span></span>
              </div>
            </section>

            <template v-else>
              <div class="cms-chain-toolbar">
                <div>
                  <h3>推荐产业链</h3>
                  <p>请选择一个产业链作为该专业产业调研的默认方向。</p>
                </div>
                <button class="cms-secondary-button" type="button">自主添加产业链</button>
              </div>

              <div class="cms-chain-list">
                <article
                  v-for="chain in paginatedIndustryResearchChains"
                  :key="chain.id"
                  class="industry-chain-row"
                  :class="{ selected: selectedIndustryResearchChainIds.includes(chain.id) }"
                >
                  <div class="industry-chain-main">
                    <div class="industry-chain-title-row">
                      <h4>{{ chain.name }}</h4>
                      <span>匹配度 {{ chain.matchScore }}%</span>
                    </div>
                    <p>{{ chain.stageSummary }}</p>
                    <em>{{ chain.reason }}</em>
                    <div class="industry-chain-tags">
                      <span v-for="tag in chain.evidenceTags" :key="`${chain.id}-${tag}`">{{ tag }}</span>
                    </div>
                  </div>
                  <button
                    class="industry-chain-select"
                    type="button"
                    @click="toggleIndustryResearchChain(chain.id)"
                  >
                    {{ selectedIndustryResearchChainIds.includes(chain.id) ? '取消选择' : '选择' }}
                  </button>
                </article>
              </div>

              <footer class="cms-chain-footer">
                <span>已选 {{ selectedIndustryResearchChainIds.length }} 条产业链</span>
                <nav class="cms-pagination" aria-label="产业链推荐分页">
                  <button
                    type="button"
                    :disabled="industryResearchCurrentPage === 1"
                    @click="setIndustryResearchPage(industryResearchCurrentPage - 1)"
                  >
                    上一页
                  </button>
                  <button
                    v-for="page in industryResearchPageNumbers"
                    :key="page"
                    type="button"
                    :class="{ active: industryResearchCurrentPage === page }"
                    @click="setIndustryResearchPage(page)"
                  >
                    {{ page }}
                  </button>
                  <button
                    type="button"
                    :disabled="industryResearchCurrentPage === industryResearchTotalPages"
                    @click="setIndustryResearchPage(industryResearchCurrentPage + 1)"
                  >
                    下一页
                  </button>
                </nav>
              </footer>
            </template>
          </section>
        </article>
      </section>
    </section>
  </main>

  <main v-else-if="isJobCompetencyMapView" class="competency-map-page-shell">
    <header class="competency-map-page-header">
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
      <button
        class="dock-icon demo-reset"
        type="button"
        aria-label="重置演示初始化状态"
        title="重置演示初始化状态"
        @click="resetIndustryResearchDemoInitialization"
      >
        ↺
      </button>
      <button
        class="orb"
        :class="{ active: aiSuggestionPanelOpen }"
        type="button"
        aria-label="AI assistant"
        data-ai-dock-toggle
        @click.stop="toggleAiSuggestionPanel"
      >
        <span class="new-badge">NEW</span>
      </button>
      <button class="dock-icon" aria-label="download">⇩</button>
      <button class="dock-icon small" aria-label="new">▣</button>
      <div class="old-link">返回旧版</div>
    </aside>

    <aside v-if="aiSuggestionPanelOpen" class="ai-suggestion-panel" aria-label="AI建议面板">
      <header>
        <span></span>
        <strong>优化专业结构，从这里开始！</strong>
      </header>
      <button
        v-for="item in aiSuggestionItems"
        :key="item.key"
        class="ai-suggestion-item"
        type="button"
        :data-ai-suggestion-key="item.key"
        @click="openAiSuggestion(item.key)"
      >
        <span>{{ item.icon }}</span>
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.subtitle }}</p>
        </div>
        <em>›</em>
      </button>
    </aside>

    <div
      v-if="activeAiAnalysis"
      class="dialog-backdrop ai-analysis-backdrop"
      @click.self="closeAiAnalysisModal"
    >
      <section
        class="ai-analysis-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="activeAiAnalysis.title"
        data-ai-suggestion-key="hot-jobs"
      >
        <button class="ai-analysis-close" type="button" aria-label="关闭热门岗位分析建议" @click="closeAiAnalysisModal">
          ×
        </button>
        <div class="ai-analysis-modal-page">
          <header class="ai-analysis-header">
            <h2>{{ activeAiAnalysis.title }}</h2>
            <div>
              <span>基于 {{ activeAiAnalysis.generatedAt }} 数据的分析结果</span>
              <button type="button" @click="activeAiAnalysisKey = 'hot-jobs'">重新分析</button>
            </div>
          </header>

          <section class="ai-analysis-card ai-analysis-hot-jobs">
            <h3>热门岗位分析</h3>
            <p>{{ activeAiAnalysis.industrySummary }}</p>
            <div class="ai-analysis-job-grid">
              <article
                v-for="job in activeAiAnalysis.hotJobs"
                :key="job.name"
                :class="`tone-${job.tone}`"
              >
                <strong>{{ job.name }}</strong>
                <span>{{ job.tags }}</span>
              </article>
            </div>
          </section>

          <section class="ai-analysis-metrics">
            <article v-for="metric in activeAiAnalysis.metrics" :key="metric.label">
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.label }}</span>
            </article>
          </section>

          <section class="ai-analysis-card ai-analysis-diagnosis">
            <div class="ai-analysis-side-label">
              <span>AI</span>
              <strong>专业分析</strong>
            </div>
            <article v-for="card in activeAiAnalysis.diagnosisCards" :key="card.title">
              <strong>{{ card.title }}</strong>
              <p>{{ card.summary }}</p>
            </article>
          </section>

          <nav class="ai-analysis-tabs" aria-label="分析栏目">
            <span class="active">◎ 培养目标分析</span>
            <span>✣ 毕业要求分析</span>
            <span>▣ 课程建设分析</span>
          </nav>

          <section class="ai-analysis-card">
            <h3>培养目标对比分析</h3>
            <div class="ai-analysis-compare-list">
              <article v-for="item in activeAiAnalysis.goalComparisons" :key="item.code">
                <span>{{ item.code }}</span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <em>{{ item.tag }}</em>
                  <p>{{ item.detail }}</p>
                </div>
              </article>
            </div>
          </section>

          <section class="ai-analysis-card">
            <h3>新增目标建议</h3>
            <div class="ai-analysis-suggestion-list">
              <article v-for="item in activeAiAnalysis.newGoalSuggestions" :key="item.title">
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
                <span>建议理由：{{ item.reason }}</span>
              </article>
            </div>
          </section>

          <section class="ai-analysis-card">
            <h3>毕业要求建议调整</h3>
            <div class="ai-analysis-suggestion-list compact">
              <article v-for="item in activeAiAnalysis.graduationRequirementSuggestions" :key="item.title">
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
                <span>建议理由：{{ item.reason }}</span>
              </article>
            </div>
          </section>

          <section class="ai-analysis-card">
            <h3>课程建设建议</h3>
            <div class="ai-analysis-suggestion-list compact">
              <article v-for="item in activeAiAnalysis.courseSuggestions" :key="item.title">
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
                <span>建议理由：{{ item.reason }}</span>
              </article>
            </div>
          </section>

          <p class="ai-analysis-source-note">{{ activeAiAnalysis.sourceNote }}</p>
        </div>
      </section>
    </div>

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
                {{ item.displayLabel ?? item.label }}
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
              {{ item.displayLabel ?? item.label }}
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

          <button
            class="support-avatar"
            :class="{ active: aiSuggestionPanelOpen }"
            type="button"
            aria-label="智能助手"
            data-ai-dock-toggle
            @click.stop="toggleAiSuggestionPanel"
          >
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
          <aside class="job-module-menu job-figma-menu">
            <template v-for="item in jobSideItems" :key="item">
              <div
                v-if="item === '产业调研'"
                class="job-menu-group"
              >
                <button
                  class="job-research-heading"
                  type="button"
                  :class="{ selected: currentJobSection === '产业调研' }"
                  :aria-expanded="isJobMenuExpanded('产业调研')"
                  @click="selectJobSection(item)"
                >
                  <span class="job-research-icon" aria-hidden="true"></span>
                  <strong>产业调研</strong>
                </button>
                <div class="job-sub-menu job-research-menu-card open" aria-hidden="false">
                  <div class="job-sub-title">· 产业布局 ·</div>
                  <button
                    v-for="tab in industryLayoutTabs"
                    :key="tab.key"
                    class="job-sub-button"
                    :class="{ selected: currentJobSection === '产业调研' && currentJobResearchMode === 'industry' && currentJobIndustryTab === tab.key }"
                    @click.stop="selectJobIndustryTab(tab.key)"
                  >
                    {{ tab.label }}
                  </button>
                  <div class="job-sub-title job-sub-title-spaced">· 专业分析 ·</div>
                  <button
                    v-for="tab in PROFESSIONAL_ANALYSIS_TABS"
                    :key="tab.key"
                    class="job-sub-button"
                    :class="{ selected: currentJobSection === '产业调研' && currentJobResearchMode === 'industry' && currentJobIndustryTab === 'major' && currentProfessionalAnalysisTab === tab.key }"
                    @click.stop="selectProfessionalAnalysisTab(tab.key)"
                  >
                    {{ tab.label }}
                  </button>
                  <div class="job-sub-title job-sub-title-spaced">· 岗位分析 ·</div>
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
              </div>
              <div
                v-else-if="item === '报告生成'"
                class="job-menu-group"
              >
                <button
                  class="job-research-heading job-report-heading"
                  type="button"
                  :class="{ selected: currentJobSection === '报告生成' }"
                  @click="openReportLibrary"
                >
                  <span class="job-research-icon job-report-icon" aria-hidden="true"></span>
                  <strong>报告生成</strong>
                  <em>· 报告管理 ·</em>
                </button>
                <div class="job-sub-menu job-research-menu-card open" aria-hidden="false">
                  <button
                    class="job-sub-button"
                    :class="{ selected: currentJobSection === '报告生成' }"
                    @click.stop="openReportLibrary"
                  >
                    调研报告生成
                  </button>
                </div>
              </div>
              <div
                v-else-if="item === '岗位建设中心'"
                class="job-menu-group"
              >
                <button
                  class="job-research-heading job-build-heading"
                  type="button"
                  :class="{ selected: currentJobSection === '岗位建设中心' }"
                  @click="selectJobSection(item)"
                >
                  <span class="job-research-icon job-build-icon" aria-hidden="true"></span>
                  <strong>岗位建设中心</strong>
                  <em>· 岗位维护 ·</em>
                </button>
                <div class="job-sub-menu job-research-menu-card open" aria-hidden="false">
                  <button
                    class="job-sub-button"
                    :class="{ selected: currentJobSection === '岗位建设中心' }"
                    @click.stop="selectJobSection(item)"
                  >
                    岗位建设
                  </button>
                </div>
              </div>
            </template>
          </aside>

          <section class="canvas-card job-center-card">
            <div v-if="currentJobSection === '产业调研'" class="job-research-page">
              <header class="research-title-row">
                <div>
                  <h2>{{ activeIndustryResearchTitle }}</h2>
                </div>
                <div class="research-chain-tabs-wrap" aria-label="当前产业链">
                  <span class="research-chain-select-label">当前产业链：</span>
                  <div class="research-chain-tabs">
                    <button
                      v-for="industry in REPORT_INDUSTRY_OPTIONS"
                      :key="industry"
                      class="research-chain-tab"
                      :class="{ active: selectedIndustryChain === industry }"
                      type="button"
                      :aria-pressed="selectedIndustryChain === industry"
                      @click="selectedIndustryChain = industry"
                    >
                      {{ industry }}
                    </button>
                  </div>
                </div>
              </header>
              <p class="research-page-purpose">{{ activeJobResearchPurpose }}</p>
              <section v-if="!industryResearchDemoInitialized" class="research-uninitialized-state">
                <div class="research-uninitialized-icon">!</div>
                <div class="research-uninitialized-copy">
                  <span>未初始化</span>
                  <h3>产业调研数据未初始化</h3>
                  <p>请先前往 CMS 进行数据初始化。初始化完成后，这里将展示产业链图谱、区域产业分析、政策库、企业库、专业分析和岗位分析结果。</p>
                </div>
                <button class="research-uninitialized-action" type="button" @click="openIndustryResearchCmsInitialization">
                  前往 CMS 初始化
                </button>
              </section>
              <template v-else>
                <section class="research-compact-ai research-figma-ai">
                  <div class="research-figma-ai-mark">
                    <img class="research-figma-ai-icon" src="/figma-assets/job-portrait-ai-icon.png?v=figma-export-2085665242" alt="" aria-hidden="true" />
                    <strong>{{ activeResearchBrief.title }}</strong>
                  </div>
                  <ul>
                    <li v-for="item in activeResearchBrief.items" :key="item">
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </section>

                <template v-if="currentJobResearchMode === 'industry'">
                <template v-if="currentJobIndustryTab === 'chain'">
                  <section class="research-card industry-layout-card">
                    <div class="research-card-head industry-chain-head">
                      <div>
                        <h3>产业链结构图谱</h3>
                        <span>
                          {{ industryChainViewMode === 'treemap'
                            ? '以矩形树图紧凑呈现上中下游、产业环节和具体产品/技术/服务节点'
                            : '按产业环节与权重关系梳理上游、中游、下游价值流，并标注具体产品/技术/服务节点' }}
                        </span>
                      </div>
                      <div class="industry-chain-view-switch" aria-label="产业链图谱视图切换">
                        <button
                          type="button"
                          :class="{ active: industryChainViewMode === 'treemap' }"
                          @click="industryChainViewMode = 'treemap'"
                        >
                          矩形树图
                        </button>
                        <button
                          type="button"
                          :class="{ active: industryChainViewMode === 'sankey' }"
                          @click="industryChainViewMode = 'sankey'"
                        >
                          桑基图
                        </button>
                      </div>
                    </div>
                    <div class="industry-national-kpis">
                      <button
                        v-for="metric in NATIONAL_INDUSTRY_CHAIN_METRICS.summaryMetrics"
                        :key="metric.label"
                        type="button"
                        class="industry-national-kpi-card"
                        :aria-label="`查看${metric.label}详情`"
                        @click="openNationalIndustryMetricDialog(metric.label)"
                      >
                        <span>{{ metric.label }}</span>
                        <strong>{{ metric.value }}</strong>
                        <em>{{ metric.note }}</em>
                        <i>查看详情</i>
                      </button>
                    </div>
                    <div v-if="industryChainViewMode === 'treemap'" class="industry-treemap-board">
                      <section
                        v-for="stage in industryTreemapStagesForView"
                        :key="stage.key"
                        class="industry-treemap-stage"
                        :class="`stage-${stage.key}`"
                      >
                        <header>
                          <div>
                            <h4>{{ stage.label }}</h4>
                            <span>{{ stage.summary }}</span>
                          </div>
                          <strong>{{ stage.stats }}</strong>
                          <p class="industry-stage-national-tags">
                            {{ formatIndustryStageNationalIndustries(stage.key) }}
                          </p>
                        </header>
                        <div class="industry-treemap-grid">
                          <article
                            v-for="node in stage.nodes"
                            :key="node.id"
                            class="industry-treemap-node"
                            :style="industryTreemapNodeStyle(node)"
                          >
                            <strong>{{ node.name }}</strong>
                            <span>代表企业 {{ node.enterpriseCount }}家</span>
                            <div>
                              <em v-for="field in node.techFields" :key="field">{{ field }}</em>
                            </div>
                          </article>
                        </div>
                      </section>
                    </div>
                    <div v-if="industryChainViewMode === 'sankey'" class="industry-sankey-board">
                      <div class="industry-sankey-summary">
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
                      </div>
                      <div v-if="industrySankeyHoverDetail" class="industry-sankey-hover-card">
                        <span>{{ industrySankeyHoverDetail.label }}</span>
                        <strong>{{ industrySankeyHoverDetail.title }}</strong>
                        <p>{{ industrySankeyHoverDetail.metric }}</p>
                        <em>{{ industrySankeyHoverDetail.desc }}</em>
                      </div>
                      <svg
                        class="industry-sankey-svg"
                        :class="{ 'is-hovering': industrySankeyHoverId }"
                        :viewBox="`0 0 ${industrySankeyNodeLayout.width} ${industrySankeyNodeLayout.height}`"
                        preserveAspectRatio="xMidYMid meet"
                        aria-hidden="true"
                        @mouseleave="industrySankeyHoverId = ''"
                      >
                        <defs>
                          <linearGradient
                            v-for="path in industrySankeyPathsForView"
                            :id="path.gradientId"
                            :key="path.gradientId"
                            gradientUnits="userSpaceOnUse"
                            :x1="industrySankeyNodePositionsForView.get(path.source)?.x"
                            :y1="industrySankeyNodePositionsForView.get(path.source)?.y"
                            :x2="industrySankeyNodePositionsForView.get(path.target)?.x"
                            :y2="industrySankeyNodePositionsForView.get(path.target)?.y"
                          >
                            <stop offset="0%" :stop-color="path.fromColor" stop-opacity="0.42" />
                            <stop offset="100%" :stop-color="path.toColor" stop-opacity="0.22" />
                          </linearGradient>
                        </defs>
                        <g v-for="column in industrySankeyColumnsForView" :key="`${column.key}-stage`" class="industry-sankey-stage-label">
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
                          v-for="path in industrySankeyPathsForView"
                          :key="path.key"
                          class="industry-sankey-link"
                          :class="{ active: isIndustrySankeyLinkActive(path), dimmed: isIndustrySankeyLinkDimmed(path) }"
                          :d="path.d"
                          :stroke="`url(#${path.gradientId})`"
                          :stroke-width="path.strokeWidth"
                          @mouseenter="industrySankeyHoverId = path.key"
                        />
                        <g
                          v-for="node in industrySankeyNodesForView"
                          :key="node.id"
                          class="industry-sankey-node"
                          :class="[`stage-${node.stage}`, { active: isIndustrySankeyNodeActive(node.id), dimmed: isIndustrySankeyNodeDimmed(node.id) }]"
                          :transform="`translate(${industrySankeyNodePositionsForView.get(node.id)?.x}, ${industrySankeyNodePositionsForView.get(node.id)?.y})`"
                          @mouseenter="industrySankeyHoverId = node.id"
                        >
                          <rect class="industry-sankey-node-card" :width="industrySankeyNodeLayout.cardWidth" :height="industrySankeyNodeLayout.cardHeight" rx="10" ry="10" />
                          <rect class="industry-sankey-node-accent" width="5" :height="industrySankeyNodeLayout.cardHeight - 18" x="10" y="9" rx="3" ry="3" />
                          <text class="industry-sankey-node-title" :x="industrySankeyNodeLayout.cardWidth / 2" y="22" text-anchor="middle">
                            {{ node.name }}
                          </text>
                          <text class="industry-sankey-node-count" :x="industrySankeyNodeLayout.cardWidth / 2" y="40" text-anchor="middle">
                            {{ formatIndustrySankeyNodeMeta(node).count }}
                          </text>
                          <text class="industry-sankey-node-meta" :x="industrySankeyNodeLayout.cardWidth / 2" y="56" text-anchor="middle">
                            {{ formatIndustrySankeyNodeMeta(node).fields }}
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
                  <section class="demand-kpi-grid industry-kpi-grid industry-region-kpi-grid">
                    <article><span>覆盖省份</span><strong>31</strong><em>全国样本</em></article>
                    <article><span>企业样本</span><strong>12,680</strong><em>智能建造相关企业</em></article>
                    <article><span>重点城市</span><strong>18</strong><em>产业集聚城市</em></article>
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

                <template v-else-if="currentJobIndustryTab === 'major'">
	                  <template v-if="currentProfessionalAnalysisTab === 'map'">
		                    <div class="professional-analysis-map-page">
		                      <div class="professional-map-dashboard">
		                        <section class="research-card professional-geo-map-card">
		                          <div class="research-card-head">
		                            <div>
		                              <h3>全国专业布点热力图</h3>
		                              <span>颜色深浅表示各省开设院校数量，标签标注重点省份</span>
		                            </div>
		                            <em>2025年样本</em>
		                          </div>
		                          <div class="china-heatmap-wrap professional-geo-map-wrap">
		                            <svg class="china-heatmap professional-geo-map" viewBox="0 0 820 590" preserveAspectRatio="xMidYMid meet" role="img" aria-label="全国专业开设院校省域热力地图">
		                              <g
		                                v-for="province in chinaProvincePathItems"
		                                :key="province.name"
		                                class="professional-geo-region"
		                                :class="{ muted: !province.count }"
		                              >
		                                <title>{{ province.name }}：{{ province.count }}所院校</title>
		                                <path
		                                  class="map-province"
		                                  :class="province.tone"
		                                  :d="province.path"
		                                />
		                              </g>
		                              <g
		                                v-for="point in professionalMapLabelItems"
		                                :key="point.province"
		                                class="professional-map-label"
		                                :transform="`translate(${point.x}, ${point.y})`"
		                              >
		                                <rect :x="-(point.labelWidth / 2)" y="-12" :width="point.labelWidth" height="24" rx="12" />
		                                <text x="0" y="4">{{ point.province }} {{ point.count }}</text>
		                              </g>
		                              <g class="south-sea-inset">
		                                <rect x="705" y="454" width="56" height="76" rx="8" />
		                                <path d="M720 472 C733 482 731 493 744 504 M721 513 C733 509 741 517 751 523" />
		                                <text x="733" y="548">南海</text>
		                              </g>
		                            </svg>
		                            <div class="map-scale" aria-hidden="true">
		                              <span>多</span>
		                              <i></i>
		                              <span>少</span>
		                            </div>
		                          </div>
		                        </section>
	                        <section class="research-card industry-rank-card">
	                          <div class="research-card-head">
                            <h3>省份布点排名</h3>
                            <span>按开设院校数排序</span>
                          </div>
                          <div class="province-rank-list">
                            <div v-for="item in professionalProvinceRankItems" :key="item.province">
                              <span>{{ item.province }}</span>
                              <i :style="{ '--value': item.width }"></i>
                              <em>{{ item.count }}所</em>
	                            </div>
	                          </div>
	                        </section>
	                      </div>

	                      <div class="professional-map-dashboard professional-map-dashboard-secondary">
	                        <section class="research-card">
	                          <div class="research-card-head">
	                            <div>
	                              <h3>区域分布矩阵</h3>
	                              <span>按产业占比、专业占比和匹配度对比区域承载</span>
	                            </div>
	                            <em>高匹配优先共建</em>
	                          </div>
	                          <div class="professional-region-matrix">
	                            <article v-for="item in professionalMatchRegions" :key="item.region">
	                              <span>{{ item.region }}</span>
	                              <strong>{{ item.majorShare }}%</strong>
	                              <em>匹配度 {{ item.matchRate }}%</em>
	                              <i><b :style="{ width: `${item.matchRate}%` }"></b></i>
	                            </article>
	                          </div>
	                        </section>
	                        <section class="research-card">
	                          <div class="research-card-head">
	                            <div>
	                              <h3>产教匹配象限</h3>
	                              <span>横轴专业供给，纵轴产业需求</span>
	                            </div>
	                            <em>区域研判</em>
	                          </div>
	                          <div class="professional-quadrant" aria-label="产教匹配象限">
	                            <i class="quadrant-axis quadrant-axis-x"></i>
	                            <i class="quadrant-axis quadrant-axis-y"></i>
	                            <span class="quadrant-label top">产业需求高</span>
	                            <span class="quadrant-label right">专业供给高</span>
	                            <span class="quadrant-label priority">优先深化</span>
	                            <span class="quadrant-label reserve">跨区协同</span>
	                            <button
	                              v-for="item in professionalQuadrantItems"
	                              :key="item.region"
	                              type="button"
	                              class="professional-quadrant-point"
	                              :style="{ left: item.left, bottom: item.bottom }"
	                              :title="`${item.region}：产业${item.industryShare}% / 专业${item.majorShare}% / 匹配${item.matchRate}%`"
	                            >
	                              {{ item.region }}
	                            </button>
	                          </div>
	                        </section>
	                      </div>

	                      <section class="research-card">
	                        <div class="research-card-head">
	                          <h3>产教匹配度分析</h3>
                          <span>产业占比、专业占比与区域匹配度综合判断</span>
                        </div>
                        <div class="professional-match-grid">
                          <article v-for="item in professionalMatchRegions" :key="item.region">
                            <strong>{{ item.region }}</strong>
                            <div><span>产业占比</span><i><em :style="{ width: `${item.industryShare}%` }"></em></i><b>{{ item.industryShare }}%</b></div>
                            <div><span>专业占比</span><i><em :style="{ width: `${item.majorShare}%` }"></em></i><b>{{ item.majorShare }}%</b></div>
                            <p>匹配度 {{ item.matchRate }}%</p>
                          </article>
                        </div>
                      </section>

                      <section class="research-card">
                        <div class="research-card-head">
                          <h3>开设院校列表</h3>
                          <span>样本院校与专业方向定位</span>
                        </div>
                        <div class="industry-company-table-wrap professional-school-table-wrap">
                          <table class="industry-company-table professional-school-table">
                            <thead>
                              <tr>
                                <th>排名</th>
                                <th>院校名称</th>
                                <th>省份</th>
                                <th>层次</th>
                                <th>开设年份</th>
                                <th>专业方向</th>
                                <th>招生规模</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="item in professionalSchoolRows" :key="item.name">
                                <td>{{ item.rank }}</td>
                                <td><strong>{{ item.name }}</strong></td>
                                <td>{{ item.province }}</td>
                                <td>{{ item.level }}</td>
                                <td>{{ item.year }}</td>
                                <td><span>{{ item.focus }}</span></td>
                                <td>{{ item.enrollment }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </template>

                  <template v-else>
                    <div class="professional-analysis-trend-page">
                      <section class="demand-kpi-grid industry-kpi-grid professional-trend-kpis">
                        <article v-for="kpi in professionalTrendKpiCards" :key="kpi.label" :class="`trend-tone-${kpi.tone}`">
                          <span>{{ kpi.label }}</span>
                          <strong>{{ kpi.value }}<small>{{ kpi.unit }}</small></strong>
                          <em>{{ kpi.change }}</em>
                        </article>
                      </section>

	                      <section class="research-card">
	                        <div class="research-card-head">
	                          <div>
	                            <h3>开设趋势研判</h3>
	                            <span>2019-2025年全国样本，结合阶段变化识别扩张节奏</span>
	                          </div>
	                          <em>紧凑趋势卡</em>
	                        </div>
	                        <div class="professional-trend-compact">
	                          <div class="professional-trend-sparkline">
	                            <svg viewBox="0 0 720 260" preserveAspectRatio="xMidYMid meet" aria-label="专业开设院校趋势">
	                              <line
	                                v-for="line in professionalTrendGridLines"
	                                :key="line.y"
	                                class="professional-spark-grid"
	                                :x1="48"
	                                :x2="692"
	                                :y1="line.y"
	                                :y2="line.y"
	                              />
	                              <polygon class="professional-spark-fill" :points="professionalTrendAreaPoints" />
	                              <polyline class="professional-spark-stroke" :points="professionalTrendPolyline" />
	                              <g v-for="point in professionalTrendLinePoints" :key="point.year">
	                                <circle :cx="point.x" :cy="point.y" r="5" />
	                                <text class="professional-spark-value" :x="point.x" :y="point.y - 14">{{ point.value }}</text>
	                                <text class="professional-spark-year" :x="point.x" y="238">{{ point.year }}</text>
	                              </g>
	                            </svg>
	                          </div>
	                          <div class="professional-trend-summary">
	                            <article v-for="item in professionalTrendSummaryItems" :key="item.label">
	                              <span>{{ item.label }}</span>
	                              <strong>{{ item.value }}</strong>
	                              <em>{{ item.desc }}</em>
	                            </article>
	                          </div>
	                        </div>
	                      </section>

                      <div class="professional-trend-layout">
                        <section class="research-card">
                          <div class="research-card-head">
                            <h3>新增 vs 撤销</h3>
                            <span>专业布点年度调整</span>
                          </div>
                          <div class="professional-delta-chart">
                            <div v-for="row in professionalTrendDeltaRows" :key="row.year">
                              <span>{{ row.year }}</span>
                              <i class="add" :style="{ height: professionalPercent(row.add, professionalDeltaMax) }"><em>{{ row.add }}</em></i>
                              <i class="cancel" :style="{ height: professionalPercent(row.cancel, professionalDeltaMax) }"><em>{{ row.cancel }}</em></i>
                            </div>
                          </div>
                        </section>
                        <section class="research-card">
                          <div class="research-card-head">
                            <h3>招生规模趋势</h3>
                            <span>单位：万人</span>
                          </div>
                          <div class="professional-enrollment-chart">
                            <div v-for="row in professionalEnrollmentRows" :key="row.year">
                              <span>{{ row.year }}</span>
                              <i class="enroll" :style="{ height: professionalPercent(row.enrollment, professionalEnrollmentMax) }"><em>{{ row.enrollment }}</em></i>
                              <i class="graduate" :style="{ height: professionalPercent(row.graduate, professionalEnrollmentMax) }"><em>{{ row.graduate }}</em></i>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  </template>
                </template>

                <template v-else-if="currentJobIndustryTab === 'policy'">
                  <section class="policy-toolbar">
                    <label>政策级别：</label>
                    <select><option>全部</option><option>国家级</option><option>省级</option><option>市级</option></select>
                    <label>关键词：</label>
                    <input placeholder="搜索政策标题..." />
                    <button>⌕ 搜索</button>
                  </section>
                  <div class="policy-layout">
                    <section class="research-card policy-timeline-card">
                      <div class="research-card-head">
                        <h3>产业政策库</h3>
                        <span>点击政策查看影响分析</span>
                      </div>
                      <div class="policy-timeline">
                        <article v-for="item in industryPolicyItems" :key="item.title" class="policy-timeline-item">
                          <span>{{ item.date }}</span>
                          <strong>{{ item.title }}</strong>
                          <p>{{ item.summary || item.desc }}<em class="policy-level" :class="item.tag">{{ item.level }}</em></p>
                          <div class="policy-timeline-meta">
                            <small>政策来源：{{ item.source }}</small>
                            <small>发布时间：{{ item.publishDate }}</small>
                            <a class="policy-original-link" :href="item.url" target="_blank" rel="noopener">原始地址</a>
                          </div>
                        </article>
                      </div>
                    </section>
                    <aside class="policy-side">
                      <section class="research-card">
                        <div class="research-card-head">
                          <h3>政策关键词云</h3>
                          <span>高频政策方向</span>
                        </div>
                        <div class="policy-word-cloud" aria-label="政策关键词云">
                          <span
                            v-for="item in industryPolicyKeywords"
                            :key="item.text"
                            :class="[item.size, item.tone]"
                          >{{ item.text }}</span>
                        </div>
                      </section>
                      <section class="research-card">
                        <div class="research-card-head">
                          <h3>年度政策趋势</h3>
                          <span>政策关注度</span>
                        </div>
                        <div class="policy-bars" aria-label="年度政策趋势">
                          <div v-for="item in industryPolicyTrends" :key="item.year">
                            <i :style="{ height: item.height }"></i>
                            <span>{{ item.year }}</span>
                          </div>
                        </div>
                      </section>
                    </aside>
                  </div>
                </template>

                <template v-else>
                  <section class="research-card">
                    <div class="research-card-head">
                      <h3>产业企业库</h3>
                      <span>共 {{ industryCompanyItems.length }} 家企业，匹配 {{ filteredIndustryCompanyItems.length }} 家</span>
                    </div>
                    <div class="industry-company-toolbar">
                      <label>
                        <span>企业搜索</span>
                        <input
                          v-model="industryCompanySearchText"
                          type="search"
                          placeholder="搜索企业名称、信用代码、注册地址、产品或产业"
                        />
                      </label>
                    </div>
                    <div class="industry-company-table-wrap">
                      <table class="industry-company-table">
                        <thead>
                          <tr>
                            <th>企业名称</th>
                            <th>统一社会信用代码</th>
                            <th>企业注册地址</th>
                            <th>企业规模</th>
                            <th>具体产品 / 技术 / 服务节点</th>
                            <th>企业所属产业</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in paginatedIndustryCompanyItems" :key="item.creditCode">
                            <td><strong>{{ item.name }}</strong></td>
                            <td>{{ item.creditCode }}</td>
                            <td>{{ item.address }}</td>
                            <td>{{ item.scale }}</td>
                            <td>{{ item.products }}</td>
                            <td><span>{{ item.industry }}</span></td>
                          </tr>
                        </tbody>
                      </table>
                      <div v-if="filteredIndustryCompanyItems.length === 0" class="industry-company-empty">
                        未找到匹配企业
                      </div>
                    </div>
                    <div class="pagination portrait-pagination industry-company-pagination">
                      <button type="button" :disabled="currentIndustryCompanyPage === 1" @click="setIndustryCompanyPage(currentIndustryCompanyPage - 1)">‹</button>
                      <button
                        v-for="page in industryCompanyPageNumbers"
                        :key="page"
                        type="button"
                        :class="{ active: currentIndustryCompanyPage === page }"
                        @click="setIndustryCompanyPage(page)"
                      >
                        {{ page }}
                      </button>
                      <button type="button" :disabled="currentIndustryCompanyPage === industryCompanyPageCount" @click="setIndustryCompanyPage(currentIndustryCompanyPage + 1)">›</button>
                      <span>第 {{ currentIndustryCompanyPage }} / {{ industryCompanyPageCount }} 页</span>
                    </div>
                  </section>
                </template>
              </template>

              <template v-else-if="currentJobResearchTab === 'portrait'">
                <section class="portrait-overview-row">
                  <div class="portrait-kpi-grid">
                    <article
                      v-for="item in PORTRAIT_KPIS"
                      :key="item.label"
                      :class="`tone-${item.tone}`"
                    >
                      <span>{{ item.label }}</span>
                      <strong>{{ item.value }}</strong>
                      <em>{{ item.unit }}</em>
                    </article>
                  </div>
                  <div class="portrait-search-row">
                    <div class="research-search-box">
                      <span>⌕</span>
                      <input
                        v-model="portraitSearchInput"
                        type="search"
                        placeholder="输入岗位名称、技能关键词或产业链环节"
                        @keyup.enter="searchPortraitJobs"
                      />
                      <button type="button" @click="searchPortraitJobs">搜索</button>
                    </div>
                  </div>
                </section>

                <section class="research-card">
                  <div class="research-card-head portrait-list-head">
                    <h3>岗位列表</h3>
                    <div class="portrait-list-tools">
                      <label class="portrait-level-filter">
                        <span>岗位等级</span>
                        <select v-model="portraitLevelFilter" @change="applyPortraitLevelFilter" aria-label="按岗位等级筛选">
                          <option v-for="level in portraitLevelOptions" :key="level" :value="level">
                            {{ level }}
                          </option>
                        </select>
                      </label>
                      <span>共 {{ filteredPortraitJobs.length }} 个岗位画像，点击卡片查看详情</span>
                    </div>
                  </div>
                  <div v-if="filteredPortraitJobs.length === 0" class="portrait-empty-result">
                    未找到匹配岗位，请调整关键词后重新搜索。
                  </div>
                  <div v-else class="portrait-profile-grid">
                    <button
                      v-for="job in paginatedPortraitJobs"
                      :key="job.id"
                      class="portrait-profile-card"
                      :data-portrait-job="job.id"
                      @click="openPortraitJobDialog(job.id)"
                    >
                      <div class="profile-card-head">
                        <h4>{{ job.name }}</h4>
                        <span class="profile-level-badge" :class="`level-${job.level}`">{{ job.level }}</span>
                      </div>
                      <div class="profile-meta">
                        <strong>{{ job.salary }}</strong>
                        <span class="profile-demand"><i aria-hidden="true"></i>需求 {{ job.demand }}</span>
                      </div>
                      <p>{{ job.chain }}</p>
                      <div class="tags profile-card-tags">
                        <span v-for="skill in job.skills.slice(0, 3)" :key="skill">{{ skill }}</span>
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
                    <span>第 {{ currentPortraitPage }} / {{ portraitPageCount }} 页</span>
                  </div>
                </section>
              </template>

              <template v-else-if="currentJobResearchTab === 'demand'">
                <section class="demand-kpi-grid demand-kpi-grid-fill">
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
                    <div class="trend-chart">
                      <div class="trend-axis" aria-hidden="true">
                        <strong>招聘总数</strong>
                        <span>20k</span>
                        <span>15k</span>
                        <span>10k</span>
                        <span>5k</span>
                        <span>0</span>
                      </div>
                      <div class="trend-bars">
                        <div v-for="item in DEMAND_TREND" :key="item.month">
                          <i :style="{ height: `${item.value * 1.05}px` }"></i>
                          <span>{{ item.month }}</span>
                        </div>
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
                    <span>相关专业表示可协同建设的专业方向，推荐能力用于课程与实训配置</span>
                  </div>
                  <div class="forecast-job-grid">
                    <article v-for="job in FORECAST_NEW_JOBS" :key="job.name">
                      <h4>{{ job.name }}</h4>
                      <div>
                        <span>紧缺度：{{ job.urgency }}</span>
                        <strong>{{ job.salary }}</strong>
                      </div>
                      <div class="forecast-job-tag-block">
                        <strong>相关专业</strong>
                        <div class="tags major-tags">
                          <span v-for="major in job.relatedMajors ?? [job.matchedMajor]" :key="major">{{ major }}</span>
                        </div>
                      </div>
                      <div class="forecast-job-tag-block">
                        <strong>推荐能力</strong>
                        <div class="tags">
                          <span v-for="skill in job.skills" :key="skill">{{ skill }}</span>
                        </div>
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
                        <th>相关专业</th>
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
              </template>
            </div>

            <div v-else-if="currentJobSection === '报告生成'" class="job-research-page report-generate-page">
              <header class="research-title-row">
                <div>
                  <h2>报告生成</h2>
                </div>
                <label class="research-chain-select-wrap">
                  <span class="research-chain-select-label">当前产业链：</span>
                  <select class="research-chain-select" v-model="selectedIndustryChain" aria-label="选择产业链">
                    <option v-for="industry in REPORT_INDUSTRY_OPTIONS" :key="industry" :value="industry">
                      {{ industry }}
                    </option>
                  </select>
                </label>
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
                    当前岗位建设中心暂无岗位数据。可通过添加岗位或AI建岗完成初始化，添加后将自动生成产业岗位课程图谱与岗位列表。
                  </p>
                </div>
              </div>

              <div class="job-actions">
                <button class="secondary-action" @click="openAddJobDialog">＋ 添加岗位</button>
                <button class="ai-action-button">AI建岗</button>
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
                    <strong>{{ industryChainsForBuild.length }}</strong>
                  </div>
                  <div>
                    <span>产业节点</span>
                    <strong>{{ industryNodesForBuild.length }}</strong>
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
                    @click.stop="openIndustryEntityDialog('chain', chain.id)"
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
                    @click.stop="openIndustryEntityDialog('industry', industry.id)"
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
                当前专业尚未初始化岗位、典型工作任务、岗位能力项与课程关系。可先手动添加单个岗位，再继续维护任务、能力项与课程关系。
              </p>
              <div class="job-init-actions">
                <button class="secondary-action" @click="openAddJobDialog">＋ 添加岗位</button>
              </div>
              <div class="job-init-steps">
                <article>
                  <strong>1</strong>
                  <span>手动添加岗位</span>
                  <p>录入岗位、职业编码、岗位群和产业链信息。</p>
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
                <h2>{{ selectedJobBasic?.name ?? selectedJob.name }}</h2>
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
                      <button class="ai-action-button">AI补全</button>
                      <button class="secondary-action" @click="openBasicInfoDialog">编辑基本信息</button>
                    </div>
                  </div>
                  <div class="info-grid">
                    <div><span>岗位名称</span><strong>{{ displayBasicValue(selectedJobBasic.name) }}</strong></div>
                    <div><span>所属职业</span><strong>{{ displayBasicValue(selectedJobBasic.occupation) }}</strong></div>
                    <div><span>职业编码</span><strong>{{ displayBasicValue(selectedJobBasic.occupationCode) }}</strong></div>
                    <div><span>岗位层级</span><strong>{{ displayBasicValue(selectedJobLevel) }}</strong></div>
                    <div><span>岗位所属产业链-产业</span><strong>{{ displayBasicValue(selectedJobChainIndustry) }}</strong></div>
                    <div><span>岗位关联企业</span><strong>{{ displayBasicValue(selectedJobDetail.relatedCompanies) }}</strong></div>
                    <div><span>所属岗位群</span><strong>{{ displayBasicValue(selectedJobBasic.groupName) }}</strong></div>
                    <div><span>薪资范围</span><strong>{{ displayBasicValue(selectedJobDetail.salaryRange) }}</strong></div>
                    <div><span>需求等级</span><strong>{{ displayBasicValue(selectedJobDetail.demandLevel) }}</strong></div>
                    <div><span>需求量</span><strong>{{ displayBasicValue(selectedJobDetail.demandVolume) }}</strong></div>
                    <div><span>学历要求</span><strong>{{ displayBasicValue(selectedJobDetail.education) }}</strong></div>
                    <div><span>经验要求</span><strong>{{ displayBasicValue(selectedJobDetail.experience) }}</strong></div>
                  </div>
                  <div class="rich-block course-link-block">
                    <div class="course-link-head">
                      <h4>相关课程</h4>
                      <button class="secondary-action" @click="openCourseDialog">＋ 增加课程</button>
                    </div>
                    <p class="course-link-note">关联课程将同步展示到产业岗位课程图谱中，可按岗位建设需要增删维护。</p>
                    <div v-if="selectedJobCourses.length > 0" class="course-relation-list">
                      <article v-for="course in selectedJobCourses" :key="course.id">
                        <div>
                          <strong>{{ course.name }}</strong>
                          <span>课程编码：{{ course.code }}</span>
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
                      <button class="ai-action-button">AI生成</button>
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
            <h2 id="add-job-title">添加岗位</h2>
          </div>
          <button class="dialog-close" aria-label="关闭添加岗位弹窗" @click="closeAddJobDialog">×</button>
        </header>

        <div class="template-import-strip manual-job-strip">
          <div>
            <strong>手动添加岗位</strong>
            <p>直接录入单个岗位的基础字段、所属职业、产业链与岗位描述，保存后进入岗位建设中心继续维护。</p>
          </div>
          <button
            class="primary-action compact"
            aria-label="手动添加单个岗位"
            @click="openManualJobDialog"
          >
            手动添加岗位
          </button>
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
      v-if="manualJobDialogOpen || (basicInfoDialogOpen && (selectedJob || industryEntityForm.entityType !== 'job'))"
      class="dialog-backdrop"
      @click.self="manualJobDialogOpen ? closeManualJobDialog() : closeBasicInfoDialog()"
    >
      <section class="job-basic-dialog" role="dialog" aria-modal="true" aria-labelledby="job-basic-dialog-title">
        <header class="dialog-header">
          <div>
            <span>{{ basicInfoDialogCrumb }}</span>
            <h2 id="job-basic-dialog-title">{{ basicInfoDialogTitle }}</h2>
          </div>
          <button
            class="dialog-close"
            aria-label="关闭岗位信息弹窗"
            @click="manualJobDialogOpen ? closeManualJobDialog() : closeBasicInfoDialog()"
          >
            ×
          </button>
        </header>

        <div class="job-basic-dialog-body">
          <section v-if="manualJobDialogOpen" class="job-basic-form-card quick-job-form-card" data-manual-job-quick-form>
            <h3>基础字段</h3>
            <div class="job-basic-form-grid">
              <label class="task-form-field required">
                <span>岗位名称</span>
                <input v-model="basicInfoForm.name" maxlength="30" placeholder="请输入岗位名称" />
                <em>{{ basicInfoForm.name.length }}/30</em>
              </label>
              <label class="task-form-field">
                <span>所属岗位群</span>
                <select v-model="basicInfoForm.groupName">
                  <option v-for="group in jobGroupOptions" :key="group" :value="group">
                    {{ group }}
                  </option>
                </select>
              </label>
              <label class="task-form-field">
                <span>所属产业链</span>
                <select v-model="industryEntityForm.industryChainId" @change="syncIndustryEntityChainSelection">
                  <option
                    v-for="chain in industryChainsForBuild"
                    :key="chain.id"
                    :value="chain.id"
                  >
                    {{ chain.name }}
                  </option>
                </select>
              </label>
              <label class="task-form-field">
                <span>所属产业</span>
                <select v-model="industryEntityForm.industryId" @change="syncIndustrySelection">
                  <option
                    v-for="industry in manualJobIndustryOptions"
                    :key="industry.id"
                    :value="industry.id"
                  >
                    {{ industry.name }}
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section v-else-if="industryEntityForm.entityType === 'job'" class="job-basic-form-card">
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
                  <option>初级</option>
                  <option>中级</option>
                  <option>高级</option>
                </select>
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

          <section v-if="!manualJobDialogOpen" class="job-basic-form-card">
            <h3>产业链信息</h3>
            <div class="job-basic-form-grid">
              <label class="task-form-field required">
                <span>产业链名称</span>
                <input v-model="industryEntityForm.chainName" maxlength="40" placeholder="如：建筑数字化服务链" />
                <em>{{ industryEntityForm.chainName.length }}/40</em>
              </label>
              <label class="task-form-field">
                <span>定位标签</span>
                <input v-model="industryEntityForm.chainFocusTag" maxlength="30" placeholder="如：平台服务 / 场景应用" />
                <em>{{ industryEntityForm.chainFocusTag.length }}/30</em>
              </label>
              <label class="task-form-field wide">
                <span>产业链描述</span>
                <textarea v-model="industryEntityForm.chainDescription" maxlength="180" placeholder="描述该产业链的范围、价值链定位和岗位承接关系"></textarea>
                <em>{{ industryEntityForm.chainDescription.length }}/180</em>
              </label>
            </div>
          </section>

          <section v-if="!manualJobDialogOpen && industryEntityForm.entityType !== 'chain'" class="job-basic-form-card">
            <h3>产业信息</h3>
            <div class="job-basic-form-grid">
              <label class="task-form-field required">
                <span>产业名称</span>
                <input v-model="industryEntityForm.industryName" maxlength="40" placeholder="如：智能运维平台产业" />
                <em>{{ industryEntityForm.industryName.length }}/40</em>
              </label>
              <label class="task-form-field required">
                <span>所属产业链</span>
                <select v-model="industryEntityForm.industryChainId" @change="syncIndustryEntityChainSelection">
                  <option
                    v-for="chain in industryChainsForBuild"
                    :key="chain.id"
                    :value="chain.id"
                  >
                    {{ chain.name }}
                  </option>
                </select>
                <em>可选择已有链，也可直接修改上方产业链名称形成自建链</em>
              </label>
              <label class="task-form-field">
                <span>所属环节</span>
                <select v-model="industryEntityForm.industryStage">
                  <option v-for="stage in industryStageOptions" :key="stage.value" :value="stage.value">
                    {{ stage.label }}
                  </option>
                </select>
              </label>
              <label class="task-form-field wide">
                <span>产业描述</span>
                <textarea v-model="industryEntityForm.industryDescription" maxlength="180" placeholder="描述该产业的典型业务场景、岗位需求和课程支撑关系"></textarea>
                <em>{{ industryEntityForm.industryDescription.length }}/180</em>
              </label>
              <label class="task-form-field wide">
                <span>关键技术/场景</span>
                <input v-model="industryEntityForm.industryKeyFields" maxlength="80" placeholder="如：BIM协同、智慧工地、安全物联" />
                <em>{{ industryEntityForm.industryKeyFields.length }}/80</em>
              </label>
              <label class="task-form-field wide">
                <span>代表企业/需求线索</span>
                <input v-model="industryEntityForm.industryLeadSignals" maxlength="80" placeholder="如：广联达、品茗科技、平台实施岗位需求" />
                <em>{{ industryEntityForm.industryLeadSignals.length }}/80</em>
              </label>
            </div>
          </section>

          <section v-if="!manualJobDialogOpen && industryEntityForm.entityType === 'job'" class="job-basic-form-card">
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
          <span class="dialog-form-tip">
            {{ manualJobDialogOpen ? '填写岗位名称、岗位群和所属产业后即可创建，其他信息进入岗位详情继续编辑。' : '必填项为空或职业编码格式不正确时无法保存。' }}
          </span>
          <div>
            <button class="secondary-action" @click="manualJobDialogOpen ? closeManualJobDialog() : closeBasicInfoDialog()">取消</button>
            <button
              v-if="manualJobDialogOpen"
              class="primary-action compact"
              :disabled="!basicInfoFormReady"
              @click="saveManualJob"
            >
              保存并添加岗位
            </button>
            <button
              v-else
              class="primary-action compact"
              :disabled="!basicInfoFormReady"
              @click="industryEntityForm.entityType === 'job' ? saveBasicInfo() : saveIndustryEntityInfo()"
            >
              {{ industryEntityForm.entityType === 'job' ? '保存基本信息' : '保存产业信息' }}
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
              <span>课程编码：{{ course.code }}</span>
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
      v-if="selectedNationalIndustryMetric"
      class="dialog-backdrop"
      @click.self="closeNationalIndustryMetricDialog"
    >
      <section class="industry-national-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="national-industry-metric-title">
        <header class="dialog-header">
          <div>
            <span>GB/T 4754 行业分类</span>
            <h2 id="national-industry-metric-title">{{ selectedNationalIndustryMetric.label }}</h2>
          </div>
          <button class="dialog-close" aria-label="关闭国标行业指标详情" @click="closeNationalIndustryMetricDialog">×</button>
        </header>

        <div class="industry-national-detail-body">
          <section class="industry-national-detail-hero">
            <div>
              <span>{{ selectedNationalIndustryMetric.note }}</span>
              <strong>{{ selectedNationalIndustryMetric.value }}</strong>
            </div>
            <p>{{ selectedNationalIndustryMetric.detail.summary }}</p>
          </section>

          <section class="portrait-dialog-section">
            <h3>统计口径</h3>
            <p>{{ selectedNationalIndustryMetric.detail.basis }}</p>
          </section>

          <section class="industry-national-detail-grid" aria-label="关键指标">
            <div v-for="item in selectedNationalIndustryMetric.detail.dimensions" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>关联行业</h3>
            <div class="industry-national-detail-tags">
              <span v-for="industry in selectedNationalIndustryMetric.detail.industries" :key="industry">{{ industry }}</span>
            </div>
          </section>

          <section class="portrait-dialog-section">
            <h3>专业建设提示</h3>
            <p>{{ selectedNationalIndustryMetric.detail.action }}</p>
          </section>
        </div>
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
            <div class="portrait-section-heading-row">
              <h3>三维能力分析</h3>
              <span>请在能力图谱中查看全部</span>
            </div>
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
                <p v-for="item in group.items.slice(0, 5)" :key="item">{{ item }}</p>
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
