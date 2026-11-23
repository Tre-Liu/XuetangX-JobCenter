import type {KnowledgeCourse, KnowledgeRelationSeed} from './model'

export interface KnowledgeDomainContextValue {
  major: string
  scope: string
  plan?: {name: string; text: string} | null
  courses: (KnowledgeCourse & {isCore: boolean})[]
  materials: {name: string; text: string}[]
  curriculumRevision?: string
  relationSeeds?: KnowledgeRelationSeed[]
  suggestedGoals?: {title: string; text: string}[]
}

declare global {
  var KnowledgeDomainContext: {
    build(url: URL, settings?: {catalogAvailable?: boolean; selection?: 'all' | 'knowledge-domain'}): KnowledgeDomainContextValue
  }
}
