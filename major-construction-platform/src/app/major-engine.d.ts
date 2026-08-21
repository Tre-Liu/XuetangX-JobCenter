export type MajorEngineSectionKey =
  | 'knowledge'
  | 'major-graph'
  | 'knowledge-domain-graph'
  | 'course-group-graph'
  | 'ability-dimension-graph'
  | 'quality-goal-graph'

export type MajorEngineSection = {
  key: MajorEngineSectionKey
  label: string
  dividerBefore?: boolean
}

export type MajorEngineKnowledgeStat = {
  key: string
  icon: 'document' | 'media' | 'characters' | 'slices'
  label: string
  value: string
  unit: string
  detail?: string
}

export type MajorEngineKnowledgeRow = {
  key: string
  name: string
  icon: 'book' | 'certificate' | 'document' | 'report'
  tone: 'magenta' | 'purple' | 'violet' | 'blue'
  processed: number
  uploaded: number
}

export const DEFAULT_MAJOR_ENGINE_SECTION: MajorEngineSectionKey
export const MAJOR_ENGINE_GRAPH_VERSION: string
export const MAJOR_ENGINE_GRAPH_PATH: string
export const MAJOR_ENGINE_SECTIONS: MajorEngineSection[]
export const MAJOR_ENGINE_KNOWLEDGE_STATS: MajorEngineKnowledgeStat[]
export const MAJOR_ENGINE_KNOWLEDGE_ROWS: MajorEngineKnowledgeRow[]

export function resolveMajorEngineSection(key: unknown): MajorEngineSectionKey
export function buildMajorEngineGraphFrameSrc(baseUrl?: string): string
export function getMajorEngineContentMode(key: unknown): 'graph' | 'knowledge' | 'placeholder'
export function selectMajorEngineSection(
  current: unknown,
  requested: unknown,
): MajorEngineSectionKey
export function getMajorEngineResourceDisplayMode(rows: unknown): 'rows' | 'empty'
export function createMajorEngineUploadFeedback(resourceName?: string): string
