import test from 'node:test'
import assert from 'node:assert/strict'
import {
  RESEARCH_SUMMARY_PAGE_NAMES,
  buildResearchSummaryContext,
} from '../src/app/research-summary-contexts.js'

const cases = [
  ['industry-chain', '产业链图谱', '智能建造产业链'],
  ['industry-region', '区域产业分析', '智能建造产业链'],
  ['industry-policy', '产业政策库', '智能建造产业链'],
  ['industry-company', '产业企业库', '智能建造产业链'],
  ['professional-map', '专业布点分析', '智能建造工程专业'],
  ['professional-trend', '专业开设趋势', '智能建造工程专业'],
  ['job-portrait', '岗位画像分析', 'BIM深化设计工程师'],
  ['job-demand', '招聘需求趋势', '智能建造工程岗位群'],
  ['job-forecast', '新岗位新技术', '智能建造工程岗位群'],
]

for (const [pageKey, pageName, subject] of cases) {
  test(`${pageKey} builds a bounded current-page context`, () => {
    const context = buildResearchSummaryContext(pageKey, {
      subject,
      facts: [{ label: '当前指标', value: 12, evidence: '来自当前页面 KPI' }],
      groups: [{ name: '当前列表', items: Array.from({ length: 20 }, (_, index) => ({ name: `条目${index}`, count: index })) }],
    })
    assert.equal(context.pageKey, pageKey)
    assert.equal(context.pageName, pageName)
    assert.equal(context.subject, subject)
    assert.equal(context.groups[0].items.length, 12)
    assert.equal(context.constraints.length, 2)
    assert.ok(context.dataVersion)
  })
}

test('page names and page configurations stay aligned', () => {
  assert.deepEqual(Object.keys(RESEARCH_SUMMARY_PAGE_NAMES).sort(), cases.map(([key]) => key).sort())
})

test('rejects an unsupported page key', () => {
  assert.throws(() => buildResearchSummaryContext('unknown-page', { subject: '无效' }), /Unsupported summary page/)
})
