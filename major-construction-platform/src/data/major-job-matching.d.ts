export type MajorMatchedJob = { id: string; name: string; majorName: string; source: string; enabled: boolean; taskCount: number; abilityCount: number }
declare global {
  var MAJOR_JOB_MATCHING: { match(major: { name: string; code: string } | null | undefined): MajorMatchedJob[] }
}
