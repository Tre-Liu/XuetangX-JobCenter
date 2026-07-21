import type { ResearchSummary, ResearchSummaryContext } from './research-summary-core.js'

export interface ResearchSummaryClient {
  summarize(
    context: ResearchSummaryContext,
    options?: { signal?: AbortSignal; allowNetwork?: boolean },
  ): Promise<ResearchSummary>
  clear(): void
}

export function createResearchSummaryClient(options?: {
  fetchImpl?: typeof fetch
  endpoint?: string
  timeoutMs?: number
}): ResearchSummaryClient
