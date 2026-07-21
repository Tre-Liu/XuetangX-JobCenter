import test from 'node:test'
import assert from 'node:assert/strict'
import { buildResearchSummaryContext } from '../src/app/research-summary-contexts.js'
import { createResearchSummaryWorker } from '../src/server/research-summary-worker.js'

const context = buildResearchSummaryContext('industry-chain', {
  subject: '智能建造产业链',
  facts: [{ label: '节点数', value: 12, evidence: '当前页面节点' }],
  groups: [],
})

const apiRequest = (body = context, method = 'POST') => new Request(
  'https://example.test/api/research-summary',
  {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  },
)

const assets = {
  fetch: async (request) => new Response(new URL(request.url).pathname, { status: 404 }),
}

test('returns 503 without a server key and never calls the model', async () => {
  let calls = 0
  const worker = createResearchSummaryWorker({ fetchImpl: async () => { calls += 1 } })
  const response = await worker.fetch(apiRequest(), { ASSETS: assets })

  assert.equal(response.status, 503)
  assert.equal(calls, 0)
})

test('sends strict structured output request and returns validated JSON', async () => {
  let requestUrl = ''
  let requestInit
  const worker = createResearchSummaryWorker({
    fetchImpl: async (url, init) => {
      requestUrl = url
      requestInit = init
      return new Response(JSON.stringify({
        output: [{
          type: 'message',
          content: [{
            type: 'output_text',
            text: JSON.stringify({
              title: '产业链分析',
              items: [
                '产业链正由单点建设走向跨环节协同。',
                '关键节点承担上下游连接作用。',
                '工程场景协同仍有进一步深化空间。',
                '建议按关键节点建设相关课程。',
              ],
            }),
          }],
        }],
      }))
    },
  })
  const response = await worker.fetch(apiRequest(), {
    OPENAI_API_KEY: 'test-key',
    AI_SUMMARY_API_URL: 'https://model.example/v1/responses',
    AI_SUMMARY_MODEL: 'test-model',
    ASSETS: assets,
  })
  const body = JSON.parse(requestInit.body)

  assert.equal(response.status, 200)
  assert.equal(requestUrl, 'https://model.example/v1/responses')
  assert.equal(requestInit.headers.authorization, 'Bearer test-key')
  assert.equal(body.model, 'test-model')
  assert.equal(body.text.format.type, 'json_schema')
  assert.equal(body.text.format.strict, true)
  assert.equal(body.text.format.schema.properties.items.minItems, 4)
  assert.equal(body.text.format.schema.properties.items.maxItems, 4)
  assert.equal(body.store, false)
  assert.match(body.instructions, /先形成研判结论，再选择当前页面数据作为证据/)
  assert.match(body.instructions, /总体研判.*结构特征.*机会与问题.*建设启示/)
  assert.match(body.instructions, /禁止逐项复述 KPI/)
  assert.match(body.instructions, /数字保留在页面 KPI 和图表/)
  assert.match(body.instructions, /不输出括号证据或孤立统计标签/)
  assert.deepEqual(await response.json(), {
    title: '智能建造产业链',
    items: [
      '产业链正由单点建设走向跨环节协同。',
      '关键节点承担上下游连接作用。',
      '工程场景协同仍有进一步深化空间。',
      '建议按关键节点建设相关课程。',
    ],
    source: 'ai',
  })
})

test('rejects invalid API input before calling the model', async () => {
  let calls = 0
  const worker = createResearchSummaryWorker({ fetchImpl: async () => { calls += 1 } })
  const env = { OPENAI_API_KEY: 'test-key', ASSETS: assets }

  assert.equal((await worker.fetch(apiRequest(context, 'GET'), env)).status, 405)
  assert.equal((await worker.fetch(apiRequest({ ...context, pageKey: 'unknown' }), env)).status, 400)
  assert.equal((await worker.fetch(apiRequest({ ...context, subject: 'x'.repeat(70_000) }), env)).status, 413)
  assert.equal(calls, 0)
})

test('returns 502 for refusal, invalid output, and upstream failure', async () => {
  const payloads = [
    new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }] })),
    new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text: '{bad json' }] }] })),
    new Response('upstream error', { status: 500 }),
  ]

  for (const modelResponse of payloads) {
    const worker = createResearchSummaryWorker({ fetchImpl: async () => modelResponse })
    const response = await worker.fetch(apiRequest(), { OPENAI_API_KEY: 'test-key', ASSETS: assets })
    assert.equal(response.status, 502)
  }
})

test('preserves asset lookup and SPA fallback for non-API paths', async () => {
  const calls = []
  const worker = createResearchSummaryWorker({ fetchImpl: async () => new Response() })
  const env = {
    ASSETS: {
      fetch: async (request) => {
        const pathname = new URL(request.url).pathname
        calls.push(pathname)
        return pathname === '/index.html'
          ? new Response('shell')
          : new Response('missing', { status: 404 })
      },
    },
  }

  const response = await worker.fetch(new Request('https://example.test/industry/chain'), env)
  assert.equal(await response.text(), 'shell')
  assert.deepEqual(calls, ['/industry/chain', '/index.html'])
})
