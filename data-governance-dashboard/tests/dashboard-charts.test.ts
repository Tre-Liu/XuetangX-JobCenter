import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
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
  { id: 'undergraduateMajors', label: '高教（本科）', coverageRate: 0.226 },
  { id: 'vocationalMajors', label: '职教', coverageRate: 0.378 },
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
      { id: 'undergraduateMajors', label: '高教（本科）', rate: 0.226 },
      { id: 'vocationalMajors', label: '职教', rate: 0.378 },
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

  it('gives each mounted coverage chart unique local SVG descriptions', () => {
    const DualCoverageCharts = defineComponent({
      setup: () => () => h('div', [
        h(CoverageChart, { rows: coverageRows }),
        h(CoverageChart, { rows: coverageRows }),
      ]),
    })
    const wrapper = mount(DualCoverageCharts)
    const svgs = wrapper.findAll('svg')
    const ids = wrapper.findAll('[id]').map((element) => element.attributes('id'))

    expect(svgs).toHaveLength(2)
    expect(new Set(ids).size).toBe(ids.length)
    for (const svg of svgs) {
      const labelledBy = svg.attributes('aria-labelledby').split(' ')
      expect(labelledBy).toHaveLength(2)
      expect(svg.find('title').attributes('id')).toBe(labelledBy[0])
      expect(svg.find('desc').attributes('id')).toBe(labelledBy[1])
    }
  })

  it('clamps unusable coverage values before they reach bar widths', () => {
    expect(buildCoverageRows([
      { id: 'chains', label: '标准产业链', coverageRate: -1 },
      { id: 'undergraduateMajors', label: '高教（本科）', coverageRate: 2 },
      { id: 'vocationalMajors', label: '职教', coverageRate: Number.POSITIVE_INFINITY },
      { id: 'positions', label: '岗位', coverageRate: Number.NaN },
    ])).toEqual([
      { id: 'chains', label: '标准产业链', rate: 0 },
      { id: 'undergraduateMajors', label: '高教（本科）', rate: 1 },
      { id: 'vocationalMajors', label: '职教', rate: 0 },
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
    expect(wrapper.text()).toContain('2014, 2016')
    expect(wrapper.text()).not.toContain('2014—2016')
  })

  it('formats contiguous completed years as one range', () => {
    const wrapper = mount(RecruitmentFunnel, {
      props: { pipeline: { ...pipeline, completedYears: [2014, 2015, 2016] } },
    })

    expect(wrapper.text()).toContain('2014—2016')
  })

  it('gives each mounted recruitment funnel a unique heading label', () => {
    const DualRecruitmentFunnels = defineComponent({
      setup: () => () => h('div', [
        h(RecruitmentFunnel, { pipeline }),
        h(RecruitmentFunnel, { pipeline }),
      ]),
    })
    const wrapper = mount(DualRecruitmentFunnels)
    const funnels = wrapper.findAll('.recruitment-funnel')
    const headingIds = funnels.map((funnel) => funnel.get('h2').attributes('id'))

    expect(funnels).toHaveLength(2)
    expect(new Set(headingIds).size).toBe(headingIds.length)
    for (const funnel of funnels) {
      expect(funnel.attributes('aria-labelledby')).toBe(
        funnel.get('h2').attributes('id'),
      )
    }
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

  it('does not turn unsorted or duplicate completed years into a misleading range', () => {
    const wrapper = mount(RecruitmentFunnel, {
      props: { pipeline: { ...pipeline, completedYears: [2016, 2014, 2014] } },
    })

    expect(wrapper.text()).toContain('已完成年份：未提供')
    expect(wrapper.text()).not.toContain('2016—2014')
  })
})
