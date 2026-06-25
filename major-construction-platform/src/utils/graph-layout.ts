import type {
  CourseNode,
  IndustryChainRelation,
  IndustryLane,
  IndustryNode,
  JobCard,
  JobIndustryRelation,
} from '../mock/job-center'

export type GraphLayoutLink = {
  key: string
  fromKey: string
  toKey: string
  keys: string[]
  curve?: number
}

export type GraphLayoutJobGroup = {
  key: string
  name: string
  count: number
  top: number
  height: number
  tone: string
  jobs: Array<JobCard & { row: number; key: string; top: number }>
}

type GraphLayoutInput = {
  jobs: JobCard[]
  getCourseIds: (jobId: string) => string[]
  chains: IndustryLane[]
  industries: IndustryNode[]
  chainRelations: IndustryChainRelation[]
  jobIndustryRelations: JobIndustryRelation[]
  courses: CourseNode[]
}

const graphCanvasHeight = 1440
const graphGroupTones = ['cyan', 'violet', 'teal', 'indigo', 'amber', 'blue'] as const

export const buildGraphLayout = ({
  jobs,
  getCourseIds,
  chains,
  industries,
  chainRelations,
  jobIndustryRelations,
  courses,
}: GraphLayoutInput) => {
  const chainById = new Map(chains.map((chain) => [chain.id, chain]))
  const industryById = new Map(industries.map((industry) => [industry.id, industry]))
  const activeJobIds = new Set(jobs.map((job) => job.id))
  const originalJobOrder = new Map(jobs.map((job, index) => [job.id, index]))
  const originalChainOrder = new Map(chains.map((chain, index) => [chain.id, index]))
  const originalIndustryOrder = new Map(industries.map((industry, index) => [industry.id, index]))
  const uniqueRelationKeys = new Set<string>()
  const activeJobIndustryRelations = jobIndustryRelations
    .filter((relation) => activeJobIds.has(relation.jobId) && industryById.has(relation.industryNodeId))
    .filter((relation) => {
      const key = `${relation.industryNodeId}:${relation.jobId}`
      if (uniqueRelationKeys.has(key)) return false
      uniqueRelationKeys.add(key)
      return true
    })

  for (const job of jobs) {
    const hasRelation = activeJobIndustryRelations.some((relation) => relation.jobId === job.id)
    if (!hasRelation && industryById.has(job.industryNodeId)) {
      activeJobIndustryRelations.push({ industryNodeId: job.industryNodeId, jobId: job.id })
    }
  }

  const activeIndustryIds = new Set(activeJobIndustryRelations.map((relation) => relation.industryNodeId))
  const uniqueChainRelationKeys = new Set<string>()
  const activeIndustryChainRelations = chainRelations
    .filter((relation) => activeIndustryIds.has(relation.industryNodeId) && chainById.has(relation.chainId))
    .filter((relation) => {
      const key = `${relation.chainId}:${relation.industryNodeId}`
      if (uniqueChainRelationKeys.has(key)) return false
      uniqueChainRelationKeys.add(key)
      return true
    })

  for (const industryId of activeIndustryIds) {
    const hasRelation = activeIndustryChainRelations.some((relation) => relation.industryNodeId === industryId)
    const industry = industryById.get(industryId)
    if (!hasRelation && industry && chainById.has(industry.chainId)) {
      activeIndustryChainRelations.push({ chainId: industry.chainId, industryNodeId: industryId })
    }
  }

  const activeChainIds = new Set(activeIndustryChainRelations.map((relation) => relation.chainId))
  const topForIndex = (index: number, count: number, start = 7, end = 93) =>
    count <= 1 ? 50 : start + (index / (count - 1)) * (end - start)
  const relatedIndustryIdsForJob = (jobId: string) =>
    activeJobIndustryRelations
      .filter((relation) => relation.jobId === jobId)
      .map((relation) => relation.industryNodeId)
  const relatedChainIdsForIndustry = (industryNodeId: string) =>
    activeIndustryChainRelations
      .filter((relation) => relation.industryNodeId === industryNodeId)
      .map((relation) => relation.chainId)
  const relatedChainIdsForJob = (jobId: string) =>
    Array.from(new Set(
      relatedIndustryIdsForJob(jobId).flatMap((industryNodeId) => relatedChainIdsForIndustry(industryNodeId))
    ))
  const industryOrderForJob = (job: JobCard) => {
    const indexes = relatedIndustryIdsForJob(job.id)
      .map((industryId) => originalIndustryOrder.get(industryId) ?? Number.MAX_SAFE_INTEGER)
    return indexes.length === 0 ? Number.MAX_SAFE_INTEGER : Math.min(...indexes)
  }

  const chainNodes = chains
    .filter((chain) => activeChainIds.has(chain.id))
    .sort((a, b) => (originalChainOrder.get(a.id) ?? 0) - (originalChainOrder.get(b.id) ?? 0))
    .map((chain, index, list) => ({
      ...chain,
      key: `chain:${chain.id}`,
      top: topForIndex(index, list.length, 4, 88)
    }))
  const industryNodes = industries
    .filter((industry) => activeIndustryIds.has(industry.id))
    .sort((a, b) => (originalIndustryOrder.get(a.id) ?? 0) - (originalIndustryOrder.get(b.id) ?? 0))
    .map((industry, index, list) => ({
      ...industry,
      key: `industry:${industry.id}`,
      top: topForIndex(index, list.length, 3, 90)
    }))
  const orderedJobs = [...jobs]
    .sort((a, b) => {
      const industryDiff = industryOrderForJob(a) - industryOrderForJob(b)
      if (industryDiff !== 0) return industryDiff
      return (originalJobOrder.get(a.id) ?? 0) - (originalJobOrder.get(b.id) ?? 0)
    })
    .map((job, index, list) => ({
      ...job,
      row: index,
      key: `job:${job.id}`,
      top: topForIndex(index, list.length, 2, 94)
    }))
  const groupedJobs = Array.from(
    orderedJobs.reduce((groups, job) => {
      const currentGroup = groups.get(job.groupName)
      if (currentGroup) {
        currentGroup.jobs.push(job)
      } else {
        groups.set(job.groupName, { name: job.groupName, jobs: [job] })
      }
      return groups
    }, new Map<string, { name: string; jobs: typeof orderedJobs }>())
      .values()
  )
  const groupGapPx = 26
  const groupShellHeightPx = 72
  const groupJobHeightPx = 56
  const groupJobGapPx = 10
  const desiredGroupHeights = groupedJobs.map(
    (group) => groupShellHeightPx + group.jobs.length * groupJobHeightPx + Math.max(group.jobs.length - 1, 0) * groupJobGapPx
  )
  const totalDesiredHeight =
    desiredGroupHeights.reduce((sum, height) => sum + height, 0) + Math.max(groupedJobs.length - 1, 0) * groupGapPx
  const effectiveCanvasHeight = Math.max(graphCanvasHeight, Math.ceil(totalDesiredHeight / 0.94))
  const groupStartPx = effectiveCanvasHeight * 0.02
  const groupAvailablePx = effectiveCanvasHeight * 0.94
  const groupScale = totalDesiredHeight > groupAvailablePx ? groupAvailablePx / totalDesiredHeight : 1
  let groupCursorPx = groupStartPx
  const jobGroups: GraphLayoutJobGroup[] = groupedJobs.map((group, index) => {
    const heightPx = desiredGroupHeights[index] * groupScale
    const result = {
      key: `job-group:${group.name}:${index}`,
      name: group.name,
      count: group.jobs.length,
      top: (groupCursorPx / effectiveCanvasHeight) * 100,
      height: (heightPx / effectiveCanvasHeight) * 100,
      tone: graphGroupTones[index % graphGroupTones.length],
      jobs: group.jobs
    }
    groupCursorPx += heightPx + (groupedJobs.length === 1 ? 0 : groupGapPx * groupScale)
    return result
  })

  const rowCount = Math.max(orderedJobs.length, 1)
  const jobRowById = new Map(orderedJobs.map((job) => [job.id, job.row]))
  const jobById = new Map(orderedJobs.map((job) => [job.id, job]))
  const activeCourseRelations = courses.map((course) => ({
    ...course,
    jobIds: jobs
      .filter((job) => getCourseIds(job.id).includes(course.id))
      .map((job) => job.id)
  })).filter((course) => course.jobIds.length > 0)

  const courseWithAverage = activeCourseRelations.map((course) => {
    const linkedRows = course.jobIds
      .map((jobId) => jobRowById.get(jobId))
      .filter((value): value is number => value !== undefined)
    const averageRow =
      linkedRows.length === 0
        ? rowCount / 2
        : linkedRows.reduce((sum, item) => sum + item, 0) / linkedRows.length
    return { ...course, averageRow }
  }).sort((a, b) => a.averageRow - b.averageRow)

  const courseNodes = courseWithAverage.map((course, index) => ({
    key: `course:${course.id}`,
    id: course.id,
    name: course.name,
    top: courseWithAverage.length === 1 ? 50 : 9 + (index / (courseWithAverage.length - 1)) * 82
  }))

  const links: GraphLayoutLink[] = []

  for (const relation of activeIndustryChainRelations) {
    const chainKey = `chain:${relation.chainId}`
    const industryKey = `industry:${relation.industryNodeId}`
    links.push({
      key: `chain-industry-${relation.chainId}-${relation.industryNodeId}`,
      fromKey: chainKey,
      toKey: industryKey,
      keys: [chainKey, industryKey]
    })
  }

  for (const relation of activeJobIndustryRelations) {
    const industryKey = `industry:${relation.industryNodeId}`
    const jobKey = `job:${relation.jobId}`
    links.push({
      key: `industry-job-${relation.industryNodeId}-${relation.jobId}`,
      fromKey: industryKey,
      toKey: jobKey,
      keys: [
        industryKey,
        jobKey,
        ...relatedChainIdsForIndustry(relation.industryNodeId).map((chainId) => `chain:${chainId}`)
      ].filter(Boolean)
    })
  }

  for (const course of courseNodes) {
    const sourceCourse = activeCourseRelations.find((item) => item.id === course.id)
    if (!sourceCourse) continue
    sourceCourse.jobIds.forEach((jobId, index) => {
      const jobRow = jobRowById.get(jobId)
      const job = jobById.get(jobId)
      if (jobRow === undefined || !job) return
      const industryKeys = relatedIndustryIdsForJob(job.id).map((industryId) => `industry:${industryId}`)
      const chainKeys = relatedChainIdsForJob(job.id).map((chainId) => `chain:${chainId}`)
      const jobKey = `job:${jobId}`
      const courseKey = `course:${course.id}`

      links.push({
        key: `job-course-${jobId}-${course.id}`,
        fromKey: jobKey,
        toKey: courseKey,
        keys: [
          jobKey,
          courseKey,
          ...industryKeys,
          ...chainKeys
        ].filter(Boolean),
        curve: index % 2 === 0 ? 4 : -4
      })
    })
  }

  return {
    canvasHeight: effectiveCanvasHeight,
    chains: chainNodes,
    industries: industryNodes,
    jobGroups,
    jobs: orderedJobs,
    courses: courseNodes,
    links
  }
}
