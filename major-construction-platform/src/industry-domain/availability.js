/* Only confirmed CMS relations may enable job-group features. Shared by both entries. */
;(function (root) {
  const normalizeCode = value => String(value ?? '').trim().toUpperCase().replace(/^(\d+)([A-Z]*)$/, (_, code, suffix) => code.padStart(6, '0') + suffix)
  const hasJobGroups = (data, state) => {
    if (!data || state?.initialized !== true || !state.officialMajor || !Array.isArray(state.selectedChainIds)) return false
    const identity = state.officialMajor
    const majors = data.majors.filter(major => major.uiLevel === identity.level
      && normalizeCode(major.code) === normalizeCode(identity.code)
      && (!identity.sourceLevel || major.sourceLevel === identity.sourceLevel))
    if (majors.length !== 1 || majors[0].matchStatus !== '已匹配') return false
    return data.relations.some(relation => relation.majorKey === majors[0].key
      && state.selectedChainIds.includes(relation.chainId)
      && data.chains.some(chain => chain.id === relation.chainId))
  }
  root.IndustryDomainAvailability = { hasJobGroups }
})(globalThis)
