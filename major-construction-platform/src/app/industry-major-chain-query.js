import '../data/major-job-matching.js'
import '../data/industry-major-selection.js'
const normalizeCode = (value) => {
  const text = String(value ?? '').trim().toUpperCase()
  const match = text.match(/^(\d+)([A-Z]*)$/)
  return match ? `${match[1].padStart(6, '0')}${match[2]}` : text
}

export const buildIndustryMajorKey = (sourceLevel, code) =>
  `${String(sourceLevel).trim()}:${normalizeCode(code)}`

export const filterIndustryMajors = (data, uiLevel, keyword = '') => {
  const normalizedKeyword = String(keyword).trim().toLowerCase()
  return data.majors.filter((major) =>
    major.uiLevel === uiLevel
    && (!normalizedKeyword
      || major.code.toLowerCase().includes(normalizedKeyword)
      || major.name.toLowerCase().includes(normalizedKeyword))
  )
}

export const getIndustryMajorProfile = (data, sourceLevel, code) => {
  const key = buildIndustryMajorKey(sourceLevel, code)
  const major = data.majors.find((item) => item.key === key)
  if (!major) return null
  const relations = Array.from(data.relations)
    .filter((relation) => relation.majorKey === key)
    .sort((first, second) => first.order - second.order)
  const chainIds = new Set(relations.map((relation) => relation.chainId))
  const chains = Array.from(data.chains).filter((chain) => chainIds.has(chain.id))
  return { major, relations, chains }
}

const emptySanitizedStoredState = () => ({
  initialized: false,
  selectedChainIds: [],
})

export const sanitizeIndustryResearchStoredState = (data, storedState) => {
  if (!storedState || typeof storedState !== 'object' || storedState.initialized !== true) {
    return emptySanitizedStoredState()
  }

  const majors = globalThis.IndustryMajorSelection.restore(data.majors, storedState)
  const majorKeys = new Set(majors.map(major => major.key))
  if (majors.length && storedState.matchingMode === 'job-name' && !data.relations.some(relation => majorKeys.has(relation.majorKey))) {
    const disabledJobIds = new Set(Array.isArray(storedState.disabledJobIds) ? storedState.disabledJobIds : [])
    const matchedJobs = globalThis.IndustryMajorSelection.matchJobs(majors).map(job => ({ ...job, enabled: !disabledJobIds.has(job.id) }))
    return { initialized: matchedJobs.length > 0, selectedChainIds: [], matchingMode: 'job-name', matchedJobs }
  }
  if (!majors.some(major => major.matchStatus === '已匹配')) return emptySanitizedStoredState()

  const currentChainIds = new Set(data.chains.map((chain) => chain.id))
  const confirmedChainIds = new Set(data.relations
    .filter((relation) => majorKeys.has(relation.majorKey) && currentChainIds.has(relation.chainId))
    .map((relation) => relation.chainId))
  const selectedChainIds = Array.isArray(storedState.selectedChainIds)
    ? [...new Set(storedState.selectedChainIds.filter((chainId) =>
        typeof chainId === 'string' && confirmedChainIds.has(chainId)
      ))]
    : []

  return {
    initialized: selectedChainIds.length > 0,
    selectedChainIds,
  }
}
