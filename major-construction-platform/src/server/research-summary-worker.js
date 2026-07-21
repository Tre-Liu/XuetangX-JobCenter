import {
  RESEARCH_SUMMARY_JSON_SCHEMA,
  RESEARCH_SUMMARY_PAGE_CONFIGS,
  RESEARCH_SUMMARY_PAGE_KEYS,
  RESEARCH_SUMMARY_SYSTEM_PROMPT,
  createResearchSummaryCacheKey,
  validateResearchSummary,
} from '../app/research-summary-core.js'

const API_PATH = '/api/research-summary'
const MAX_BODY_BYTES = 64 * 1024
const MODEL_TIMEOUT_MS = 10_000

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders,
  },
})

const outputContent = (payload) => (
  payload?.output?.flatMap((item) => item?.type === 'message' ? item.content ?? [] : []) ?? []
)

const isContext = (value) => (
  value
  && typeof value === 'object'
  && RESEARCH_SUMMARY_PAGE_KEYS.includes(value.pageKey)
  && typeof value.pageName === 'string'
  && value.pageName.length > 0
  && value.pageName.length <= 40
  && typeof value.subject === 'string'
  && value.subject.length > 0
  && value.subject.length <= 80
  && typeof value.dataVersion === 'string'
  && value.dataVersion.length > 0
  && value.dataVersion.length <= 100
  && Array.isArray(value.facts)
  && value.facts.length <= 10
  && value.facts.every((fact) => (
    fact
    && typeof fact === 'object'
    && typeof fact.label === 'string'
    && (typeof fact.value === 'string' || typeof fact.value === 'number')
  ))
  && Array.isArray(value.groups)
  && value.groups.length <= 6
  && value.groups.every((group) => (
    group
    && typeof group === 'object'
    && typeof group.name === 'string'
    && Array.isArray(group.items)
    && group.items.length <= 12
  ))
  && Array.isArray(value.constraints)
  && value.constraints.length <= 8
)

const parseContext = async (request) => {
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return { error: json({ error: 'payload-too-large' }, 413) }
  }

  try {
    const context = JSON.parse(raw)
    return isContext(context)
      ? { context }
      : { error: json({ error: 'invalid-context' }, 400) }
  } catch {
    return { error: json({ error: 'invalid-json' }, 400) }
  }
}

const fetchAsset = async (request, env) => {
  const response = await env.ASSETS.fetch(request)
  if (response.status !== 404) return response

  const url = new URL(request.url)
  if (url.pathname.includes('.')) return response

  return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
}

export const createResearchSummaryWorker = ({ fetchImpl = globalThis.fetch } = {}) => {
  const cache = new Map()

  return {
    async fetch(request, env) {
      const url = new URL(request.url)
      if (url.pathname !== API_PATH) return fetchAsset(request, env)

      if (request.method !== 'POST') {
        return json({ error: 'method-not-allowed' }, 405, { allow: 'POST' })
      }

      const parsed = await parseContext(request)
      if (parsed.error) return parsed.error
      const context = parsed.context

      if (!env.OPENAI_API_KEY) return json({ error: 'ai-summary-disabled' }, 503)

      const cacheKey = createResearchSummaryCacheKey(context)
      if (cache.has(cacheKey)) return json(cache.get(cacheKey))

      const modelRequest = {
        model: env.AI_SUMMARY_MODEL || 'gpt-5.6-luna',
        store: false,
        reasoning: { effort: 'low' },
        max_output_tokens: 600,
        instructions: RESEARCH_SUMMARY_SYSTEM_PROMPT,
        input: `${RESEARCH_SUMMARY_PAGE_CONFIGS[context.pageKey].focus}\n当前页面 JSON：\n${JSON.stringify(context)}`,
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: 'research_summary',
            strict: true,
            schema: RESEARCH_SUMMARY_JSON_SCHEMA,
          },
        },
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS)

      try {
        const response = await fetchImpl(
          env.AI_SUMMARY_API_URL || 'https://api.openai.com/v1/responses',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify(modelRequest),
            signal: controller.signal,
          },
        )

        if (!response.ok) return json({ error: 'model-request-failed' }, 502)

        const payload = await response.json()
        const content = outputContent(payload)
        if (content.some((item) => item?.type === 'refusal')) {
          return json({ error: 'model-refused' }, 502)
        }

        const outputText = content.find((item) => item?.type === 'output_text')?.text
        if (typeof outputText !== 'string') return json({ error: 'missing-model-output' }, 502)

        let modelOutput
        try {
          modelOutput = JSON.parse(outputText)
        } catch {
          return json({ error: 'invalid-model-json' }, 502)
        }

        const checked = validateResearchSummary(modelOutput, context)
        if (!checked.ok) return json({ error: 'invalid-model-output' }, 502)

        cache.set(cacheKey, checked.value)
        return json(checked.value)
      } catch {
        return json({ error: 'model-unavailable' }, 502)
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

export default createResearchSummaryWorker()
