export type KnowledgePointDomains = Record<number, string[]>

export interface KnowledgeSection {
  name: string
  points: string[]
  pointDomains?: KnowledgePointDomains
  source?: string
  evidence?: string
  pointSources?: {source: string; evidence?: string; fileName?: string}[]
}

export type KnowledgeUnit =
  | {name: string; source?: string; curriculumUnitIndex?: number; sections: KnowledgeSection[]; points?: never}
  | {name: string; source?: string; points: string[]; pointDomains?: KnowledgePointDomains; sections?: never}

export interface KnowledgeCourse {
  id: string
  name: string
  isCore?: boolean
  source?: string
  topics?: KnowledgeUnit[]
}

export interface KnowledgeRelationSeed {
  from: [courseId: string, pointName: string]
  to: [courseId: string, pointName: string]
  label: string
  reason: string
}

export interface KnowledgeGenerationInput {
  major: string
  courses?: KnowledgeCourse[]
  attachments?: {name: string; text: string}[]
  requirements?: string
  curriculumRevision?: string
  relationSeeds?: KnowledgeRelationSeed[]
}

export type KnowledgeLeafPath = [course: number, unit: number, section: number | null, point: number]

export interface KnowledgeGraph {
  major: string
  mode: 'local' | 'ai'
  modeLabel: string
  notice: string
  requirements: string
  courses: (KnowledgeCourse & {source: string; topics: KnowledgeUnit[]})[]
  sources: {kind: string; name: string}[]
  unusedMaterials?: {name: string; reason: string}[]
  curriculumRevision?: string
  relations?: {from: KnowledgeLeafPath; to: KnowledgeLeafPath; label: string; reason: string}[]
}

declare global {
  var KnowledgeDomainModel: {
    generate(input: KnowledgeGenerationInput, options?: {
      signal?: AbortSignal
      onProgress?: (state: {completed: number; total: number; message: string}) => void
    }): Promise<KnowledgeGraph>
    fromCurriculum(input: KnowledgeGenerationInput): KnowledgeGraph | null
    previousRevision(revision?: string): string
    upgradeCurriculum(previous: KnowledgeGraph, input: KnowledgeGenerationInput): KnowledgeGraph | null
  }
}
