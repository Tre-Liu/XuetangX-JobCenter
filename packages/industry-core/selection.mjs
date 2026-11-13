import {matchMajorJobs} from './matching.mjs';
const normalize = value => String(value ?? '').trim().toUpperCase().replace(/^(\d+)([A-Z]*)$/, (_, code, suffix) => code.padStart(6, '0') + suffix)
const restore = (catalogue, state) => {
  const identities = Array.isArray(state?.officialMajors) ? state.officialMajors : [state?.officialMajor]
  const seen = new Set()
  return identities.flatMap(identity => {
    if (!identity || typeof identity !== 'object') return []
    const candidates = catalogue.filter(major => (major.uiLevel || major.level) === identity.level
      && normalize(major.code) === normalize(identity.code)
      && (!identity.sourceLevel || major.sourceLevel === identity.sourceLevel))
    if (candidates.length !== 1 || seen.has(candidates[0].key)) return []
    seen.add(candidates[0].key)
    return [candidates[0]]
  })
}
const mergeChains = groups => {
  const merged = new Map()
  for (const { major, chains } of groups) {
    for (const chain of chains) {
      if (!merged.has(chain.id)) merged.set(chain.id, { ...chain, matchedMajors: [] })
      const row = merged.get(chain.id)
      row.node = [...new Set([row.node, chain.node].filter(Boolean).flatMap(value => value.split('、')))].join('、')
      if (!row.matchedMajors.some(item => item.key === major.key)) {
        row.matchedMajors.push({ key: major.key, name: major.name, node: chain.node, evidence: chain.evidence || '' })
      }
    }
  }
  return [...merged.values()]
}
const matchJobs = majors => [...new Map(majors.flatMap(major => matchMajorJobs(major)).map(job => [job.id, job])).values()]
export const IndustryMajorSelection = { restore, mergeChains, matchJobs };
