export const AI_HOT_JOB_PAGE_SIZE = 6

export type AiHotJobAbility = {
  id: string
  name: string
  type: '知识' | '技能' | '素养'
  description: string
  tasks: string[]
  source: string
}

export type AiHotJob = {
  name: string
  industryChain: string
  stage: '上游' | '中游' | '下游'
  industrySegment: string
  abilities: AiHotJobAbility[]
  recruitmentCount?: number
  companyCount?: number
  selectionType: 'market' | 'representative'
  tone: 'blue' | 'purple' | 'cyan'
}

export type AiHotJobPage<T> = {
  page: number
  pageCount: number
  items: T[]
}

export type AiHotJobSuggestionMetricInput = {
  newGoalSuggestions: readonly unknown[]
  graduationRequirementSuggestions: readonly unknown[]
  courseSuggestions: readonly unknown[]
}

export type AiHotJobSuggestionMetric = {
  value: string
  label: string
}

export const getAiHotJobPage = <T>(
  jobs: readonly T[],
  requestedPage: number,
  pageSize = AI_HOT_JOB_PAGE_SIZE,
): AiHotJobPage<T> => {
  const pageCount = Math.max(1, Math.ceil(jobs.length / pageSize))
  const page = Math.min(Math.max(1, Math.trunc(requestedPage)), pageCount)
  const start = (page - 1) * pageSize

  return {
    page,
    pageCount,
    items: jobs.slice(start, start + pageSize),
  }
}

export const getAiHotJobAbilityCount = (jobs: readonly AiHotJob[]) =>
  new Set(jobs.flatMap((job) => job.abilities.map((ability) => ability.id))).size

export const getAiHotJobSuggestionMetrics = (
  input: AiHotJobSuggestionMetricInput,
): AiHotJobSuggestionMetric[] => [
  { value: `${input.newGoalSuggestions.length}项`, label: '培养目标建议调整' },
  { value: `${input.graduationRequirementSuggestions.length}项`, label: '毕业要求建议调整' },
  { value: `${input.courseSuggestions.length}门`, label: '建议新增或强化课程' },
]
