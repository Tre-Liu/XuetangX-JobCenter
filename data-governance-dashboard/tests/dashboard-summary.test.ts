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

    expect(wrapper.get('button').attributes('aria-label')).toContain('专业')
    expect(wrapper.text()).toContain('682')
    expect(wrapper.text()).toContain('2,142')

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['majors']])
  })

  it('renders a reader-facing alert for an unknown snapshot version', () => {
    const wrapper = mount(DashboardView, {
      props: { snapshotValue: { schemaVersion: 2 } },
    })

    expect(wrapper.get('[role="alert"]').text()).toBe('无法展示数据：未知快照版本 2')
  })

  it('renders the header and all six asset metric cards from a valid snapshot', () => {
    const wrapper = mount(DashboardView, { props: { snapshotValue: snapshotJson } })

    expect(wrapper.get('h1').text()).toBe('专业建设数据治理驾驶舱')
    expect(wrapper.findAll('button')).toHaveLength(6)
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
