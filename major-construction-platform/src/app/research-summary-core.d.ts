export type ResearchSummaryPageKey =
  | 'industry-chain'
  | 'industry-region'
  | 'industry-policy'
  | 'industry-company'
  | 'professional-map'
  | 'professional-trend'
  | 'job-portrait'
  | 'job-demand'
  | 'job-forecast'

export interface ResearchSummaryFact {
  label: string
  value: string | number
  evidence?: string
}

export interface ResearchSummaryGroup {
  name: string
  items: object[]
}

export interface ResearchSummaryContext {
  pageKey: ResearchSummaryPageKey
  pageName: string
  subject: string
  facts: ResearchSummaryFact[]
  groups: ResearchSummaryGroup[]
  constraints: string[]
  dataVersion: string
}

export interface ResearchSummary {
  title: string
  items: string[]
  source: 'ai' | 'fallback'
}

export interface ResearchSummaryPageConfig {
  title: string
  focus: string
  recommendation: string
}

export const RESEARCH_SUMMARY_PAGE_KEYS: ResearchSummaryPageKey[]
export const RESEARCH_SUMMARY_SYSTEM_PROMPT: string
export const RESEARCH_SUMMARY_PAGE_CONFIGS: Record<ResearchSummaryPageKey, ResearchSummaryPageConfig>
export const RESEARCH_SUMMARY_JSON_SCHEMA: Record<string, unknown>

export function createResearchSummaryContext(input: {
  pageKey: ResearchSummaryPageKey
  pageName: string
  subject: string
  facts?: ResearchSummaryFact[]
  groups?: ResearchSummaryGroup[]
  constraints?: string[]
}): ResearchSummaryContext

export function buildFallbackResearchSummary(context: ResearchSummaryContext): ResearchSummary
export function validateResearchSummary(
  value: unknown,
  context: ResearchSummaryContext,
): { ok: true; value: ResearchSummary } | { ok: false; reason: string }
export function createResearchSummaryCacheKey(context: ResearchSummaryContext): string
