import type { ResearchSummary, ResearchSummaryContext, ResearchSummaryPageConfig } from './research-summary-core.js'

export declare const buildInterpretiveResearchSummary: (
  context: ResearchSummaryContext,
  config: ResearchSummaryPageConfig,
) => Omit<ResearchSummary, 'source'>
