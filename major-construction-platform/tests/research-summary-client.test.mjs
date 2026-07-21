import test from 'node:test'
import assert from 'node:assert/strict'
import { createResearchSummaryClient } from '../src/app/research-summary-client.js'
import { buildResearchSummaryContext } from '../src/app/research-summary-contexts.js'

const context = buildResearchSummaryContext('industry-chain', {
  subject: '智能建造产业链',
  facts: [{ label: '节点数', value: 12 }],
  groups: [],
})

const validResponse = {
  title: '产业链结构分析',
  items: [
    '智能建造产业链已进入多环节协同发展阶段。',
    '产业结构正由单点建造向设计、施工与运维贯通演进。',
    '数字化服务是当前的主要增长机会，跨环节能力仍是短板。',
    '建议围绕产业链协同重组课程与实训项目。',
  ],
}

test('uses one valid AI response for duplicate contexts', async () => {
  let calls = 0
  const client = createResearchSummaryClient({
    fetchImpl: async () => {
      calls += 1
      return { ok: true, json: async () => validResponse }
    },
  })

  assert.equal((await client.summarize(context)).source, 'ai')
  assert.equal((await client.summarize(context)).source, 'ai')
  assert.equal(calls, 1)
})

test('keeps fallback when network is disabled or response is invalid', async () => {
  let calls = 0
  const client = createResearchSummaryClient({
    fetchImpl: async () => {
      calls += 1
      return { ok: true, json: async () => ({ title: '', items: [] }) }
    },
  })

  assert.equal((await client.summarize(context, { allowNetwork: false })).source, 'fallback')
  assert.equal(calls, 0)
  assert.equal((await client.summarize(context)).source, 'fallback')
  assert.equal(calls, 1)
})

test('does not retain a failed response in cache', async () => {
  let calls = 0
  const client = createResearchSummaryClient({
    fetchImpl: async () => {
      calls += 1
      return calls === 1
        ? { ok: false, json: async () => ({}) }
        : { ok: true, json: async () => validResponse }
    },
  })

  assert.equal((await client.summarize(context)).source, 'fallback')
  assert.equal((await client.summarize(context)).source, 'ai')
  assert.equal(calls, 2)
})

test('falls back after timeout without throwing', async () => {
  const client = createResearchSummaryClient({
    timeoutMs: 5,
    fetchImpl: (_url, init) => new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      setTimeout(() => resolve({ ok: true, json: async () => validResponse }), 50)
    }),
  })

  assert.equal((await client.summarize(context)).source, 'fallback')
})
