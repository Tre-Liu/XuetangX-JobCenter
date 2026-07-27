import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import snapshotJson from '../src/data/dashboard-snapshot.json'
import DashboardView from '../src/components/DashboardView.vue'
import MetricCard from '../src/components/MetricCard.vue'

const metric = {
  id: 'majors' as const,
  label: '专业',
  primaryValue: 682,
  totalValue: 2142,
  coverageRate: 682 / 2142,
  status: 'partial' as const,
  definition: '有确定关联专业 ÷ 专业总数',
  grain: '专业编码',
  sourceIds: ['majorCatalog', 'majorMatches'],
  supportingMetrics: [{ label: '待人工研判', value: 443 }],
}

describe('dashboard summary', () => {
  it('renders a metric button and emits the selected asset', async () => {
    const wrapper = mount(MetricCard, { props: { metric } })
    const button = wrapper.get('button')

    expect(button.attributes('aria-label')).toContain('专业')
    const descriptionId = button.attributes('aria-describedby')
    expect(descriptionId).toBeTruthy()
    const description = wrapper.get(`#${descriptionId}`)
    expect(description.text()).toContain('部分完成')
    expect(description.text()).toContain('总数 2,142')
    expect(description.text()).toContain('覆盖率 31.8%')
    expect(description.text()).toContain('有确定关联专业 ÷ 专业总数')
    expect(description.text()).toContain('统计粒度：专业编码')
    expect(description.text()).toContain('待人工研判：443')
    expect(wrapper.text()).toContain('682')
    expect(wrapper.text()).toContain('2,142')

    await button.trigger('click')

    expect(wrapper.emitted('select')).toEqual([['majors']])
  })

  it('renders a reader-facing alert for an unknown snapshot version', () => {
    const wrapper = mount(DashboardView, {
      props: { snapshotValue: { schemaVersion: 2 } },
    })

    expect(wrapper.get('[role="alert"]').text()).toBe('无法展示数据：未知快照版本 2')
  })

  it('renders a reader-facing alert for a malformed version one snapshot', () => {
    const wrapper = mount(DashboardView, {
      props: { snapshotValue: { schemaVersion: 1 } },
    })

    expect(wrapper.get('[role="alert"]').text()).toBe('无法展示数据：快照数据结构不完整')
  })

  it('renders a reader-facing alert when a version one snapshot has malformed recruitment pipeline data', () => {
    const malformedSnapshot = structuredClone(snapshotJson)
    malformedSnapshot.recruitmentPipeline.inputRows = -1

    const wrapper = mount(DashboardView, { props: { snapshotValue: malformedSnapshot } })

    expect(wrapper.get('[role="alert"]').text()).toBe('无法展示数据：快照数据结构不完整')
  })

  it('renders a reader-facing alert for unsorted completed recruitment years', () => {
    const malformedSnapshot = structuredClone(snapshotJson)
    malformedSnapshot.recruitmentPipeline.completedYears = [2016, 2014]

    const wrapper = mount(DashboardView, { props: { snapshotValue: malformedSnapshot } })

    expect(wrapper.get('[role="alert"]').text()).toBe('无法展示数据：快照数据结构不完整')
  })

  it('renders a reader-facing alert for duplicate completed recruitment years', () => {
    const malformedSnapshot = structuredClone(snapshotJson)
    malformedSnapshot.recruitmentPipeline.completedYears = [2014, 2015, 2015]

    const wrapper = mount(DashboardView, { props: { snapshotValue: malformedSnapshot } })

    expect(wrapper.get('[role="alert"]').text()).toBe('无法展示数据：快照数据结构不完整')
  })

  it('renders the header and all six asset metric cards from a valid snapshot', () => {
    const wrapper = mount(DashboardView, { props: { snapshotValue: snapshotJson } })

    expect(wrapper.get('h1').text()).toBe('专业建设数据治理驾驶舱')
    expect(wrapper.findAll('.metric-card')).toHaveLength(6)
    expect(wrapper.text()).toContain('标准产业链')
    expect(wrapper.text()).toContain('产业环节')
    expect(wrapper.text()).toContain('专业')
    expect(wrapper.text()).toContain('国标行业')
    expect(wrapper.text()).toContain('岗位')
    expect(wrapper.text()).toContain('招聘信息')
  })

  it('marks an asset as selected after its metric card is clicked', async () => {
    const wrapper = mount(DashboardView, { props: { snapshotValue: snapshotJson } })
    const positions = wrapper.get('button[aria-label*="岗位"]')

    expect(positions.attributes('aria-pressed')).toBe('false')
    await positions.trigger('click')
    expect(positions.attributes('aria-pressed')).toBe('true')
  })

  it('shows a stale status for a valid but old snapshot', () => {
    const staleSnapshot = structuredClone(snapshotJson)
    staleSnapshot.generatedAt = '2026-01-01T00:00:00.000Z'

    const wrapper = mount(DashboardView, { props: { snapshotValue: staleSnapshot } })

    expect(wrapper.text()).toContain('数据已过期')
  })
})
