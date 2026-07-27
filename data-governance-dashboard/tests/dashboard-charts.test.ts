import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import {
  buildCoverageRows,
  buildRecruitmentStages,
} from '../src/dashboard-model.ts'
import CoverageChart from '../src/components/CoverageChart.vue'
import RecruitmentFunnel from '../src/components/RecruitmentFunnel.vue'

const coverageRows = buildCoverageRows([
  { id: 'chains', label: '标准产业链', coverageRate: 0.147 },
  { id: 'stages', label: '产业环节' },
  { id: 'majors', label: '专业', coverageRate: 0.318 },
  { id: 'industries', label: '国标行业', coverageRate: 0.999 },
  { id: 'positions', label: '岗位', coverageRate: 0.476 },
  { id: 'recruitment', label: '招聘信息', coverageRate: 0.996 },
])

const pipeline = {
  inputRows: 10,
  validUniqueRows: 8,
  duplicateRows: 1,
  invalidRows: 1,
  mediumReviewJobs: 3,
  formallyMatchedJobs: 2,
  unmatchedRows: 3,
  formalRelationCount: 2,
  completedYears: [2014, 2016],
}

describe('dashboard charts', () => {
  it('includes only compatible ratios in a fixed order and renders an accessible coverage SVG', () => {
    expect(coverageRows).toEqual([
      { id: 'chains', label: '标准产业链', rate: 0.147 },
      { id: 'majors', label: '专业', rate: 0.318 },
      { id: 'positions', label: '岗位', rate: 0.476 },
      { id: 'industries', label: '国标行业', rate: 0.999 },
      { id: 'recruitment', label: '招聘信息', rate: 0.996 },
    ])

    const wrapper = mount(CoverageChart, { props: { rows: coverageRows } })

    expect(wrapper.get('svg').attributes('role')).toBe('img')
    expect(wrapper.get('svg').attributes('aria-labelledby')).toBeTruthy()
    expect(wrapper.text()).toContain('14.7%')
    expect(wrapper.text()).not.toContain('产业环节')
  })

  it('clamps unusable coverage values before they reach bar widths', () => {
    expect(buildCoverageRows([
      { id: 'chains', label: '标准产业链', coverageRate: -1 },
      { id: 'majors', label: '专业', coverageRate: 2 },
      { id: 'positions', label: '岗位', coverageRate: Number.NaN },
    ])).toEqual([
      { id: 'chains', label: '标准产业链', rate: 0 },
      { id: 'majors', label: '专业', rate: 1 },
      { id: 'positions', label: '岗位', rate: 0 },
    ])
  })

  it('keeps input, valid, review, and formal match stages in the rendered funnel', () => {
    expect(buildRecruitmentStages(pipeline)).toEqual([
      { id: 'input', label: '输入记录', value: 10, tone: 'primary' },
      { id: 'valid', label: '有效唯一', value: 8, tone: 'primary' },
      { id: 'review', label: '待复核', value: 3, tone: 'warning' },
      { id: 'matched', label: '正式匹配', value: 2, tone: 'success' },
    ])

    const wrapper = mount(RecruitmentFunnel, { props: { pipeline } })

    expect(wrapper.get('ol').text()).toContain('输入记录')
    expect(wrapper.get('ol').text()).toContain('正式匹配')
    expect(wrapper.text()).toContain('未匹配')
    expect(wrapper.text()).toContain('2014—2016')
  })

  it('renders safe zero-valued stages when a caller supplies invalid pipeline counts', () => {
    const wrapper = mount(RecruitmentFunnel, {
      props: {
        pipeline: { ...pipeline, inputRows: Number.NaN, validUniqueRows: -1 },
      },
    })

    expect(wrapper.get('ol').text()).toContain('输入记录：0')
    expect(wrapper.get('ol').text()).toContain('有效唯一：0')
  })
})
