export const AI_HOT_JOB_PAGE_SIZE = 6

export type AiHotJob = {
  name: string
  industryChain: string
  stage: '上游' | '中游' | '下游'
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
