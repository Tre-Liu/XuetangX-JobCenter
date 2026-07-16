import {
  RESEARCH_SUMMARY_PAGE_KEYS,
  createResearchSummaryContext,
} from './research-summary-core.js'

export const RESEARCH_SUMMARY_PAGE_NAMES = {
  'industry-chain': '产业链图谱',
  'industry-region': '区域产业分析',
  'industry-policy': '产业政策库',
  'industry-company': '产业企业库',
  'professional-map': '专业布点分析',
  'professional-trend': '专业开设趋势',
  'job-portrait': '岗位画像分析',
  'job-demand': '招聘需求趋势',
  'job-forecast': '新岗位新技术',
}

export const buildResearchSummaryContext = (pageKey, payload = {}) => {
  if (!RESEARCH_SUMMARY_PAGE_KEYS.includes(pageKey)) {
    throw new Error(`Unsupported summary page: ${pageKey}`)
  }

  return createResearchSummaryContext({
    pageKey,
    pageName: payload.pageName || RESEARCH_SUMMARY_PAGE_NAMES[pageKey],
    subject: payload.subject,
    facts: payload.facts,
    groups: payload.groups,
    constraints: [
      '只总结当前页面提供的数据，不补写外部事实。',
      '最后一条必须给出可执行的专业建设建议。',
      ...(payload.constraints ?? []),
    ],
  })
}
