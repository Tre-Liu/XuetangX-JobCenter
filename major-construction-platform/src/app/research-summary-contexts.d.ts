import type {
  ResearchSummaryContext,
  ResearchSummaryFact,
  ResearchSummaryGroup,
  ResearchSummaryPageKey,
} from './research-summary-core.js'

export const RESEARCH_SUMMARY_PAGE_NAMES: Record<ResearchSummaryPageKey, string>

export function buildResearchSummaryContext(
  pageKey: ResearchSummaryPageKey,
  payload?: {
    pageName?: string
    subject?: string
    facts?: ResearchSummaryFact[]
    groups?: ResearchSummaryGroup[]
    constraints?: string[]
  },
): ResearchSummaryContext
