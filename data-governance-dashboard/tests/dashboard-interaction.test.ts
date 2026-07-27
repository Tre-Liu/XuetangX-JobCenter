import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import snapshotJson from '../src/data/dashboard-snapshot.json'
import DashboardView from '../src/components/DashboardView.vue'
import SourceDrawer from '../src/components/SourceDrawer.vue'
import SourceTable from '../src/components/SourceTable.vue'
import type { AssetMetric, DashboardSnapshot, SourceStatus } from '../src/types/dashboard'

const sources: SourceStatus[] = [
  {
    id: 'majorCatalog',
    assetId: 'majors',
    relativePath: '官方数据/专业目录.xlsx',
    selectedCandidate: true,
    modifiedAt: '2026-07-14T00:00:00.000Z',
    grain: '专业编码',
    status: 'validated',
    notes: ['按专业编码去重'],
  },
  {
    id: 'majorMatches',
    assetId: 'majors',
    relativePath: '治理结果/专业匹配.xlsx',
    selectedCandidate: true,
    modifiedAt: '2026-07-15T00:00:00.000Z',
    grain: '专业匹配状态',
    status: 'partial',
    notes: ['仍有待人工研判记录'],
  },
  {
    id: 'positionMatches',
    assetId: 'positions',
    relativePath: '治理结果/岗位匹配.xlsx',
    selectedCandidate: true,
    modifiedAt: '2026-07-16T00:00:00.000Z',
    grain: '岗位编码',
    status: 'review',
    notes: [],
  },
]

const majorMetric: AssetMetric = {
  id: 'majors',
  label: '专业',
  primaryValue: 682,
  totalValue: 2142,
  coverageRate: 682 / 2142,
  status: 'partial',
  definition: '有确定关联专业 ÷ 专业总数',
  grain: '专业编码',
  sourceIds: ['majorCatalog', 'majorMatches'],
  supportingMetrics: [{ label: '待人工研判', value: 443 }],
}

function dashboardSnapshot(): DashboardSnapshot {
  const snapshot = structuredClone(snapshotJson) as DashboardSnapshot
  const sourceOverrides = new Map(sources.map((source) => [source.id, source]))
  snapshot.sources = snapshot.sources.map((source) =>
    structuredClone(sourceOverrides.get(source.id) ?? source))
  snapshot.warnings = ['招聘匹配仍在处理中']
  return snapshot
}

const mountedWrappers: VueWrapper[] = []

function mountTracked(component: Parameters<typeof mount>[0], options?: Parameters<typeof mount>[1]) {
  const wrapper = mount(component, options)
  mountedWrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  for (const wrapper of mountedWrappers.splice(0)) {
    if (wrapper.exists()) wrapper.unmount()
  }
})

describe('source exploration', () => {
  it('composes accessible asset and status filters over the real source rows', async () => {
    const wrapper = mountTracked(SourceTable, { props: { sources } })

    expect(wrapper.get('[aria-label="按资产类别筛选"]').element.tagName).toBe('SELECT')
    expect(wrapper.get('[aria-label="按来源状态筛选"]').element.tagName).toBe('SELECT')
    expect(wrapper.text()).toContain('2026/07/14 08:00')
    expect(wrapper.text()).toContain('已校验')
    expect(wrapper.findAll('thead th').map((header) => header.text())).toEqual([
      '数据资产',
      '统计粒度',
      '更新时间',
      '状态',
      '查看来源',
    ])

    await wrapper.get('[aria-label="按资产类别筛选"]').setValue('majors')
    await wrapper.get('[aria-label="按来源状态筛选"]').setValue('partial')

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('专业匹配.xlsx')
    expect(wrapper.text()).not.toContain('专业目录.xlsx')
    expect(wrapper.text()).not.toContain('岗位匹配.xlsx')

    await wrapper.get('button[aria-label="查看 majorMatches"]').trigger('click')
    expect(wrapper.emitted('inspect')).toEqual([['majorMatches']])
  })

  it('shows a reader-facing empty result after filters remove every source', async () => {
    const wrapper = mountTracked(SourceTable, { props: { sources } })

    await wrapper.get('[aria-label="按资产类别筛选"]').setValue('recruitment')

    expect(wrapper.text()).toContain('没有符合当前筛选条件的来源')
  })

  it('renders a named modal with complete metric, lineage, notes, and warning details', async () => {
    const wrapper = mountTracked(SourceDrawer, {
      attachTo: document.body,
      props: {
        metric: majorMetric,
        sources: sources.slice(0, 2),
        warnings: ['招聘匹配仍在处理中'],
      },
    })
    await nextTick()

    const dialog = wrapper.get('[role="dialog"]')
    const label = wrapper.get(`#${dialog.attributes('aria-labelledby')}`)
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(label.text()).toBe('专业来源详情')
    expect(dialog.text()).toContain('有确定关联专业 ÷ 专业总数')
    expect(dialog.text()).toContain('专业编码')
    expect(dialog.text()).toContain('682')
    expect(dialog.text()).toContain('2,142')
    expect(dialog.text()).toContain('31.8%')
    expect(dialog.text()).toContain('待人工研判')
    expect(dialog.text()).toContain('443')
    expect(dialog.text()).toContain('官方数据/专业目录.xlsx')
    expect(dialog.text()).toContain('治理结果/专业匹配.xlsx')
    expect(dialog.text()).toContain('按专业编码去重')
    expect(dialog.text()).toContain('仍有待人工研判记录')
    expect(dialog.text()).toContain('招聘匹配仍在处理中')
    expect(document.activeElement).toBe(wrapper.get('[aria-label="关闭来源详情"]').element)
  })

  it('emits close for backdrop and close button but not drawer content clicks', async () => {
    const wrapper = mountTracked(SourceDrawer, {
      attachTo: document.body,
      props: { metric: majorMetric, sources: sources.slice(0, 2), warnings: [] },
    })

    await wrapper.get('.source-drawer__panel').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.get('[role="dialog"]').trigger('click')
    await wrapper.get('[aria-label="关闭来源详情"]').trigger('click')
    expect(wrapper.emitted('close')).toEqual([[], []])
  })

  it('handles document Escape, contains Tab focus, and removes keyboard handlers on unmount', async () => {
    let closeCount = 0
    const wrapper = mountTracked(SourceDrawer, {
      attachTo: document.body,
      props: { metric: majorMetric, sources: sources.slice(0, 2), warnings: [] },
      attrs: { onClose: () => { closeCount += 1 } },
    })
    await nextTick()
    const closeButton = wrapper.get('[aria-label="关闭来源详情"]').element

    const forwardTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(forwardTab)
    expect(forwardTab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(closeButton)

    const backwardTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    document.dispatchEvent(backwardTab)
    expect(backwardTab.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(closeButton)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(closeCount).toBe(1)

    wrapper.unmount()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(closeCount).toBe(1)
  })

  it('opens all linked sources from a metric and restores focus after Escape', async () => {
    const wrapper = mountTracked(DashboardView, {
      attachTo: document.body,
      props: { snapshotValue: dashboardSnapshot() },
    })
    const trigger = wrapper.get('button[aria-label*="专业指标"]')

    await trigger.trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('官方数据/专业目录.xlsx')
    expect(wrapper.get('[role="dialog"]').text()).toContain('治理结果/专业匹配.xlsx')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('opens the owning metric from a source row and restores focus to that exact row trigger', async () => {
    const wrapper = mountTracked(DashboardView, {
      attachTo: document.body,
      props: { snapshotValue: dashboardSnapshot() },
    })
    const trigger = wrapper.get('button[aria-label="查看 positionMatches"]')

    await trigger.trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('岗位来源详情')

    await wrapper.get('[aria-label="关闭来源详情"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('falls back to the owning metric card when the original source trigger disconnects', async () => {
    const snapshot = dashboardSnapshot()
    const wrapper = mountTracked(DashboardView, {
      attachTo: document.body,
      props: { snapshotValue: snapshot },
    })
    const sourceTrigger = wrapper.get('button[aria-label="查看 positionMatches"]')

    await sourceTrigger.trigger('click')
    const withoutSourceRow = dashboardSnapshot()
    withoutSourceRow.sources = withoutSourceRow.sources.filter(
      (source) => source.id !== 'positionMatches',
    )
    withoutSourceRow.assets.find(
      (asset) => asset.id === 'positions',
    )!.sourceIds = []
    await wrapper.setProps({ snapshotValue: withoutSourceRow })
    expect(sourceTrigger.element.isConnected).toBe(false)

    await wrapper.get('[aria-label="关闭来源详情"]').trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(
      wrapper.get('.metric-card[data-asset-id="positions"]').element,
    )
  })

  it('restores focus to the dashboard anchor when a prop change invalidates the open metric', async () => {
    const wrapper = mountTracked(DashboardView, {
      attachTo: document.body,
      props: { snapshotValue: dashboardSnapshot() },
    })
    await wrapper.get('button[aria-label*="专业指标"]').trigger('click')

    await wrapper.setProps({ snapshotValue: { schemaVersion: 2 } })
    await nextTick()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('main[tabindex="-1"]').element)
  })

  it('creates unique heading IDs and valid labels for concurrent drawer instances', async () => {
    const DrawerPair = defineComponent({
      components: { SourceDrawer },
      setup: () => ({
        majorMetric,
        sources: sources.slice(0, 2),
      }),
      template: `
        <div>
          <SourceDrawer :metric="majorMetric" :sources="sources" :warnings="[]" />
          <SourceDrawer :metric="majorMetric" :sources="sources" :warnings="[]" />
        </div>
      `,
    })
    const wrapper = mountTracked(DrawerPair, { attachTo: document.body })
    await nextTick()
    const dialogs = wrapper.findAll('[role="dialog"]')

    expect(dialogs).toHaveLength(2)
    const firstIds = dialogs[0].findAll('[id]').map((node) => node.attributes('id'))
    const secondIds = dialogs[1].findAll('[id]').map((node) => node.attributes('id'))
    expect(new Set([...firstIds, ...secondIds]).size).toBe(firstIds.length + secondIds.length)
    for (const dialog of dialogs) {
      const labelledBy = dialog.attributes('aria-labelledby')
      expect(dialog.find(`#${labelledBy}`).text()).toBe('专业来源详情')
      for (const section of dialog.findAll('section[aria-labelledby]')) {
        expect(dialog.find(`#${section.attributes('aria-labelledby')}`).exists()).toBe(true)
      }
    }
  })

  it('keeps Tab and Shift+Tab focus inside the topmost concurrent drawer', async () => {
    const DrawerPair = defineComponent({
      components: { SourceDrawer },
      setup: () => ({
        majorMetric,
        sources: sources.slice(0, 2),
      }),
      template: `
        <div>
          <SourceDrawer :metric="majorMetric" :sources="sources" :warnings="[]" />
          <SourceDrawer :metric="majorMetric" :sources="sources" :warnings="[]" />
        </div>
      `,
    })
    const wrapper = mountTracked(DrawerPair, { attachTo: document.body })
    await nextTick()
    const dialogs = wrapper.findAll('[role="dialog"]')
    const firstClose = dialogs[0].get('[aria-label="关闭来源详情"]').element
    const secondClose = dialogs[1].get('[aria-label="关闭来源详情"]').element as HTMLElement

    secondClose.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    }))
    expect(document.activeElement).toBe(secondClose)
    expect(document.activeElement).not.toBe(firstClose)

    secondClose.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }))
    expect(document.activeElement).toBe(secondClose)
    expect(document.activeElement).not.toBe(firstClose)
  })

  it('routes Escape to the topmost drawer, then the remaining drawer, and cleans up', async () => {
    const DrawerStack = defineComponent({
      components: { SourceDrawer },
      setup() {
        const firstOpen = ref(true)
        const secondOpen = ref(true)
        const firstCloses = ref(0)
        const secondCloses = ref(0)
        const closeFirst = () => {
          firstCloses.value += 1
          firstOpen.value = false
        }
        const closeSecond = () => {
          secondCloses.value += 1
          secondOpen.value = false
        }
        return {
          closeFirst,
          closeSecond,
          firstCloses,
          firstOpen,
          majorMetric,
          secondCloses,
          secondOpen,
          sources: sources.slice(0, 2),
        }
      },
      template: `
        <div>
          <output data-test="first-closes">{{ firstCloses }}</output>
          <output data-test="second-closes">{{ secondCloses }}</output>
          <SourceDrawer
            v-if="firstOpen"
            :metric="majorMetric"
            :sources="sources"
            :warnings="[]"
            @close="closeFirst"
          />
          <SourceDrawer
            v-if="secondOpen"
            :metric="majorMetric"
            :sources="sources"
            :warnings="[]"
            @close="closeSecond"
          />
        </div>
      `,
    })
    const wrapper = mountTracked(DrawerStack, { attachTo: document.body })
    await nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.get('[data-test="first-closes"]').text()).toBe('0')
    expect(wrapper.get('[data-test="second-closes"]').text()).toBe('1')
    expect(wrapper.findAll('[role="dialog"]')).toHaveLength(1)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.get('[data-test="first-closes"]').text()).toBe('1')
    expect(wrapper.get('[data-test="second-closes"]').text()).toBe('1')
    expect(wrapper.findAll('[role="dialog"]')).toHaveLength(0)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.get('[data-test="first-closes"]').text()).toBe('1')
    expect(wrapper.get('[data-test="second-closes"]').text()).toBe('1')
  })

  it('explains empty linked-source records and rejects dangling source IDs', async () => {
    const emptySnapshot = dashboardSnapshot()
    emptySnapshot.assets[2].sourceIds = []
    const emptyWrapper = mountTracked(DashboardView, {
      props: { snapshotValue: emptySnapshot },
    })
    await emptyWrapper.get('button[aria-label*="专业指标"]').trigger('click')
    expect(emptyWrapper.get('[role="dialog"]').text()).toContain('该指标当前未关联来源')
    emptyWrapper.unmount()

    const missingSnapshot = dashboardSnapshot()
    missingSnapshot.assets[2].sourceIds = ['source-not-in-snapshot']
    const missingWrapper = mountTracked(DashboardView, {
      props: { snapshotValue: missingSnapshot },
    })
    expect(missingWrapper.get('[role="alert"]').text()).toBe(
      '无法展示数据：快照数据结构不完整',
    )
  })
})
