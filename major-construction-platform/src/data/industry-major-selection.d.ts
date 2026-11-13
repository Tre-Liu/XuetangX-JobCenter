declare global {
  var IndustryMajorSelection: {
    restore<T extends { key: string; code: string; sourceLevel: string; uiLevel?: string; level?: string }>(catalogue: T[], state: unknown): T[]
    mergeChains<T extends { id: string; node: string; evidence?: string }>(groups: { major: { key: string; name: string }; chains: T[] }[]): (T & { matchedMajors: { key: string; name: string; node: string; evidence: string }[] })[]
    matchJobs(majors: { name: string; code: string }[]): import('./major-job-matching').MajorMatchedJob[]
  }
}
export {}
