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
