import {
  buildFallbackResearchSummary,
  createResearchSummaryCacheKey,
  validateResearchSummary,
} from './research-summary-core.js'

export const createResearchSummaryClient = ({
  fetchImpl = globalThis.fetch,
  endpoint = '/api/research-summary',
  timeoutMs = 8000,
} = {}) => {
  const cache = new Map()

  return {
    async summarize(context, { signal, allowNetwork = true } = {}) {
      const fallback = buildFallbackResearchSummary(context)
      if (!allowNetwork || typeof fetchImpl !== 'function') return fallback

      const key = createResearchSummaryCacheKey(context)
      if (cache.has(key)) return cache.get(key)

      const pending = (async () => {
        const controller = new AbortController()
        const abort = () => controller.abort()
        const timer = setTimeout(abort, timeoutMs)

        if (signal?.aborted) controller.abort()
        else signal?.addEventListener('abort', abort, { once: true })

        try {
          const response = await fetchImpl(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(context),
            signal: controller.signal,
          })

          if (!response.ok) return fallback
          const checked = validateResearchSummary(await response.json(), context)
          return checked.ok ? checked.value : fallback
        } catch {
          return fallback
        } finally {
          clearTimeout(timer)
          signal?.removeEventListener('abort', abort)
        }
      })()

      cache.set(key, pending)
      const result = await pending
      if (result.source !== 'ai') cache.delete(key)
      return result
    },

    clear() {
      cache.clear()
    },
  }
}
