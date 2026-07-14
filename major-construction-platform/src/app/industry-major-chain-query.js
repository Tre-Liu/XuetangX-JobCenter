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

const resolveStoredOfficialMajor = (data, officialMajor) => {
  if (!officialMajor || typeof officialMajor !== 'object') return null
  const code = normalizeCode(officialMajor.code)
  const uiLevel = String(officialMajor.level ?? '').trim()
  if (!code || !uiLevel) return null

  const sourceLevel = String(officialMajor.sourceLevel ?? '').trim()
  if (sourceLevel) {
    const key = buildIndustryMajorKey(sourceLevel, code)
    return data.majors.find((major) =>
      major.key === key && major.uiLevel === uiLevel
    ) ?? null
  }

  const candidates = data.majors.filter((major) =>
    major.uiLevel === uiLevel && normalizeCode(major.code) === code
  )
  return candidates.length === 1 ? candidates[0] : null
}

export const sanitizeIndustryResearchStoredState = (data, storedState) => {
  if (!storedState || typeof storedState !== 'object' || storedState.initialized !== true) {
    return emptySanitizedStoredState()
  }

  const major = resolveStoredOfficialMajor(data, storedState.officialMajor)
  if (!major || major.matchStatus !== '已匹配') return emptySanitizedStoredState()

  const currentChainIds = new Set(data.chains.map((chain) => chain.id))
  const confirmedChainIds = new Set(data.relations
    .filter((relation) => relation.majorKey === major.key && currentChainIds.has(relation.chainId))
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
