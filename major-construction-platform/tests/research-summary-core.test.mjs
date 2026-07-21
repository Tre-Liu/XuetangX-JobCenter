import test from 'node:test'
import assert from 'node:assert/strict'
import {
  RESEARCH_SUMMARY_PAGE_KEYS,
  buildFallbackResearchSummary,
  createResearchSummaryCacheKey,
  createResearchSummaryContext,
  validateResearchSummary,
} from '../src/app/research-summary-core.js'

const makeContext = (pageKey, value = 12) => createResearchSummaryContext({
  pageKey,
  pageName: pageKey,
  subject: '智能建造产业链',
  facts: [
    { label: '样本量', value, evidence: `当前页面共 ${value} 个样本` },
    { label: '重点方向', value: 'BIM协同', evidence: '页面排名第一' },
  ],
  groups: [{ name: '代表项', items: [{ name: 'BIM协同', count: value }] }],
  constraints: ['只使用当前页面数据'],
})

test('registers exactly nine page keys', () => {
  assert.equal(RESEARCH_SUMMARY_PAGE_KEYS.length, 9)
  assert.equal(new Set(RESEARCH_SUMMARY_PAGE_KEYS).size, 9)
})

test('fallback changes when current page facts change', () => {
  const first = buildFallbackResearchSummary(makeContext('industry-chain', 12))
  const second = buildFallbackResearchSummary(makeContext('industry-chain', 28))
  assert.equal(first.source, 'fallback')
  assert.match(first.items.join(''), /12/)
  assert.match(second.items.join(''), /28/)
  assert.notDeepEqual(first, second)
})

test('cache key changes with subject and facts', () => {
  assert.notEqual(
    createResearchSummaryCacheKey(makeContext('industry-region', 12)),
    createResearchSummaryCacheKey(makeContext('industry-region', 13)),
  )
})

test('rejects AI numbers absent from context', () => {
  const context = makeContext('job-demand', 12)
  assert.equal(validateResearchSummary({
    title: '招聘需求趋势分析',
    items: ['需求呈增长趋势。', 'BIM协同是重点方向（样本量12）。', '岗位能力仍需完善。', '建议建设相关课程。'],
  }, context).ok, true)
  assert.equal(validateResearchSummary({
    title: '招聘需求趋势分析',
    items: ['需求呈增长趋势。', 'BIM协同是重点方向（样本量99）。', '岗位能力仍需完善。', '建议建设相关课程。'],
  }, context).ok, false)
  assert.equal(validateResearchSummary({
    title: '招聘需求趋势分析',
    items: ['需求呈增长趋势。', 'BIM协同是重点方向。', '建议建设相关课程。'],
  }, context).ok, false)
})

test('bounds context arrays and rejects markup-shaped output', () => {
  const context = createResearchSummaryContext({
    pageKey: 'industry-company',
    pageName: '产业企业库',
    subject: '智能建造产业链',
    facts: Array.from({ length: 20 }, (_, index) => ({ label: `指标${index}`, value: index })),
    groups: [{ name: '企业', items: Array.from({ length: 20 }, (_, index) => ({ name: `企业${index}` })) }],
  })
  assert.equal(context.facts.length, 10)
  assert.equal(context.groups[0].items.length, 12)
  assert.equal(validateResearchSummary({
    title: '企业资源研判',
    items: ['<b>企业结构</b>', '当前页面指标。', '建议建设企业资源库。'],
  }, context).ok, false)
})
