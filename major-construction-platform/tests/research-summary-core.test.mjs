import test from 'node:test'
import assert from 'node:assert/strict'
import {
  RESEARCH_SUMMARY_PAGE_KEYS,
  RESEARCH_SUMMARY_SYSTEM_PROMPT,
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

test('prompt requires the title to be the current subject only', () => {
  assert.match(RESEARCH_SUMMARY_SYSTEM_PROMPT, /title 必须直接使用输入 subject/)
  assert.match(RESEARCH_SUMMARY_SYSTEM_PROMPT, /不附加分析类型/)
})

test('fallback changes when current page facts change', () => {
  const makeTrendContext = (values) => createResearchSummaryContext({
    pageKey: 'professional-trend',
    pageName: '专业开设趋势',
    subject: '智能建造工程专业',
    groups: [{
      name: '历年开设',
      items: values.map((value, index) => ({ year: 2022 + index, value })),
    }],
  })
  const first = buildFallbackResearchSummary(makeTrendContext([10, 16, 24]))
  const second = buildFallbackResearchSummary(makeTrendContext([24, 16, 10]))
  assert.equal(first.source, 'fallback')
  assert.match(first.items.join(''), /扩张/)
  assert.match(second.items.join(''), /收缩|调整/)
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
    items: ['需求呈增长趋势。', 'BIM协同是重点方向。', '岗位能力仍需完善。', '建议建设相关课程。'],
  }, context).ok, true)
  assert.equal(validateResearchSummary({
    title: '招聘需求趋势分析',
    items: ['需求呈增长趋势。', '样本量达到99项。', '岗位能力仍需完善。', '建议建设相关课程。'],
  }, context).ok, false)
  assert.equal(validateResearchSummary({
    title: '招聘需求趋势分析',
    items: ['需求呈增长趋势。', 'BIM协同是重点方向。', '建议建设相关课程。'],
  }, context).ok, false)
})

test('normalizes an AI response title to the current subject', () => {
  const context = makeContext('industry-chain', 12)
  const result = validateResearchSummary({
    title: '产业链结构分析',
    items: ['产业链协同关系逐步形成。', '核心环节承担主要承接作用。', '薄弱环节仍需补强。', '建议建设相关课程。'],
  }, context)

  assert.equal(result.ok, true)
  assert.equal(result.value.title, '智能建造产业链')
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

test('rejects AI summaries that describe data processing instead of research conclusions', () => {
  const context = makeContext('industry-chain', 12)
  const result = validateResearchSummary({
    title: '产业链结构分析',
    items: [
      '标准化结果将产业链划分为三个阶段。',
      '完整数据覆盖产业上下游。',
      '企业可同时关联多个来源关系。',
      '建议按产业节点建设课程。',
    ],
  }, context)

  assert.equal(result.ok, false)
  assert.equal(result.reason, 'process-description')
})

test('rejects isolated numeric evidence appended in parentheses', () => {
  const context = makeContext('industry-chain', 12)
  const result = validateResearchSummary({
    title: '产业链结构分析',
    items: [
      '产业链已具备跨环节协同能力（细分节点12）。',
      '产业资源向主导环节集中。',
      '薄弱环节的承接能力有待增强。',
      '建议按产业节点建设课程。',
    ],
  }, context)

  assert.equal(result.ok, false)
  assert.equal(result.reason, 'parenthetical-evidence')
})
