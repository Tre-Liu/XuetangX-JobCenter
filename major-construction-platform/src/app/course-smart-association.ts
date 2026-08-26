export type CourseSmartAssociationTask = {
  name: string
  description?: string
  abilities?: string[]
}

export type CourseSmartAssociationJob = {
  id: string
  name: string
  chain: string
  node: string
  tasks: CourseSmartAssociationTask[]
}

export type CourseSmartAssociationCandidate = CourseSmartAssociationJob & {
  reason: string
}

export type CourseSmartAssociationRelation = {
  jobId: string
  jobName: string
  chain: string
  node: string
  tasks: string[]
}

export type CourseSmartAssociationInput = {
  courseName: string
  majorName: string
  knowledgeNodeName: string
  jobs: CourseSmartAssociationJob[]
}

export const courseSmartAssociationLoadingSteps = [
  '正在识别当前课程与所属专业',
  '正在检索本专业岗位库',
  '正在匹配岗位典型工作任务'
] as const

const normalizeSearchText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '')

const extractSearchTerms = (value: string) => {
  const normalized = normalizeSearchText(value)
  const terms: string[] = []
  const seen = new Set<string>()
  const connectorCharacters = new Set(['与', '和', '及', '的', '或'])
  const genericTerms = new Set(['原理'])
  const addTerm = (term: string) => {
    if (term.length < 2 || seen.has(term) || genericTerms.has(term) || [...term].some((character) => connectorCharacters.has(character))) return
    seen.add(term)
    terms.push(term)
  }

  for (const chineseText of normalized.match(/[\u3400-\u9fff]+/g) ?? []) {
    for (let index = 0; index < chineseText.length - 1; index += 1) {
      addTerm(chineseText.slice(index, index + 2))
    }
  }
  for (const word of normalized.match(/[a-z0-9+#.]{2,}/g) ?? []) addTerm(word)
  return terms
}

const searchableJobText = (job: CourseSmartAssociationJob) => normalizeSearchText([
  job.name,
  job.chain,
  job.node,
  ...job.tasks.flatMap((task) => [task.name, task.description ?? '', ...(task.abilities ?? [])])
].join(' '))

export const buildCourseSmartAssociationCandidates = (
  input: CourseSmartAssociationInput,
  limit = 4
): CourseSmartAssociationCandidate[] => {
  const terms = extractSearchTerms(`${input.courseName} ${input.knowledgeNodeName}`)
  const ranked = input.jobs.map((job, sourceIndex) => {
    const searchText = searchableJobText(job)
    const matchedTerms = terms.filter((term) => searchText.includes(term))
    return { job, sourceIndex, matchedTerms }
  }).sort((left, right) =>
    right.matchedTerms.length - left.matchedTerms.length || left.sourceIndex - right.sourceIndex
  )

  return ranked.slice(0, Math.max(0, limit)).map(({ job, matchedTerms }) => ({
    ...job,
    tasks: job.tasks.map((task) => ({
      ...task,
      abilities: task.abilities ? [...task.abilities] : undefined
    })),
    reason: matchedTerms.length > 0
      ? `课程或知识点关键词：${matchedTerms[0]}`
      : `来源于${input.majorName}岗位库`
  }))
}

export const buildCourseSmartAssociationRelations = (
  candidates: CourseSmartAssociationCandidate[]
): CourseSmartAssociationRelation[] => candidates
  .map((candidate) => ({
    jobId: candidate.id,
    jobName: candidate.name,
    chain: candidate.chain,
    node: candidate.node,
    tasks: candidate.tasks.map((task) => task.name)
  }))
  .filter((relation) => relation.tasks.length > 0)

export const replaceCourseSmartAssociationRelations = (
  current: Record<string, CourseSmartAssociationRelation[]>,
  knowledgeNodeName: string,
  candidates: CourseSmartAssociationCandidate[]
): Record<string, CourseSmartAssociationRelation[]> => {
  const relations = buildCourseSmartAssociationRelations(candidates)
  if (relations.length === 0) return current
  return {
    ...current,
    [knowledgeNodeName]: relations
  }
}
