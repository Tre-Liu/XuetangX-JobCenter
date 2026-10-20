export interface BusinessJob { id: string; name: string; salary: string; demand: number | string; level: string; chain: string; skills: string[]; groupName: string; node: string; education: string; experience: string; summary: string; abilities: Record<string, string[]> }
export interface BusinessState { membership: Record<string, string>; relations: Record<string, string[]>; targets: Record<string, number>; companyCategories: Record<string, string>; recruitment: unknown[] }
export interface BusinessGroup { id: string; name: string; field: string; stages: string[]; nodes: string[]; chains: string[]; members: BusinessJob[]; demand: number; salary: number }
declare global {
  var IndustryDomain: {
    storageKey: string;
    groups(jobs: BusinessJob[], overrides?: Record<string, string>): BusinessGroup[];
    groupName(job: BusinessJob, overrides?: Record<string, string>): string;
    portraitTags(job: BusinessJob | undefined, overrides?: Record<string, string>, groupsEnabled?: boolean): string[];
    coverage(job: BusinessJob, courses: unknown[], edits?: Record<string, string[]>): { total: number; matched: number; percent: number };
    filterJobs(jobs: BusinessJob[], filters: Record<string, string | boolean>, state: BusinessState, courses: unknown[]): BusinessJob[];
    load(storage: Storage): BusinessState;
  }
}
