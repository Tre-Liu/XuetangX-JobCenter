<script lang="ts">
const drawerKeyboardOwners: symbol[] = []
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { formatCount, formatPercent, statusLabel } from '../dashboard-model'
import type { AssetMetric, SourceStatus } from '../types/dashboard'

const props = defineProps<{
  metric: AssetMetric
  sources: SourceStatus[]
  warnings: string[]
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const keyboardOwner = Symbol('source-drawer-keyboard-owner')
const instanceId = useId()
const titleId = `source-drawer-title-${instanceId}`
const detailsHeadingId = `source-drawer-details-${instanceId}`
const metricHeadingId = `source-drawer-metric-${instanceId}`
const lineageHeadingId = `source-drawer-lineage-${instanceId}`
const warningHeadingId = `source-drawer-warning-${instanceId}`
const missingSourceCount = computed(() => {
  const availableIds = new Set(props.sources.map((source) => source.id))
  return props.metric.sourceIds.filter((sourceId) => !availableIds.has(sourceId)).length
})

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Shanghai',
})

function formatSupportingValue(value: number | string) {
  return typeof value === 'number' ? formatCount(value) : value
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (drawerKeyboardOwners.at(-1) !== keyboardOwner || event.defaultPrevented) return

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const focusableElements = Array.from(
    dialog.value?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  )
  const first = focusableElements[0]
  const last = focusableElements.at(-1)

  if (!first || !last) {
    event.preventDefault()
    dialog.value?.focus()
    return
  }

  const activeElement = document.activeElement
  if (!dialog.value?.contains(activeElement)) {
    event.preventDefault()
    const focusTarget = event.shiftKey ? last : first
    focusTarget.focus()
  } else if (event.shiftKey && activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  drawerKeyboardOwners.push(keyboardOwner)
  document.addEventListener('keydown', handleDocumentKeydown)
  void nextTick(() => closeButton.value?.focus())
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDocumentKeydown)
  const ownerIndex = drawerKeyboardOwners.lastIndexOf(keyboardOwner)
  if (ownerIndex !== -1) drawerKeyboardOwners.splice(ownerIndex, 1)
})
</script>

<template>
  <div
    ref="dialog"
    class="source-drawer"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    tabindex="-1"
    @click.self="emit('close')"
  >
    <article class="source-drawer__panel">
      <header class="source-drawer__header">
        <div>
          <p class="eyebrow">指标来源追溯</p>
          <h2 :id="titleId">{{ metric.label }}来源详情</h2>
        </div>
        <button
          ref="closeButton"
          class="source-drawer__close"
          type="button"
          aria-label="关闭来源详情"
          @click="emit('close')"
        >
          ×
        </button>
      </header>

      <section
        v-if="metric.details?.kind === 'name-list'"
        class="source-drawer__section"
        :aria-labelledby="detailsHeadingId"
      >
        <h3 :id="detailsHeadingId">{{ metric.details.label }}</h3>
        <ol class="source-drawer__name-list">
          <li v-for="item in metric.details.items" :key="item">{{ item }}</li>
        </ol>
      </section>

      <section class="source-drawer__section" :aria-labelledby="metricHeadingId">
        <h3 :id="metricHeadingId">指标口径</h3>
        <p>{{ metric.definition }}</p>
        <dl class="source-drawer__facts">
          <div>
            <dt>统计粒度</dt>
            <dd>{{ metric.grain }}</dd>
          </div>
          <div>
            <dt>分子</dt>
            <dd>{{ formatCount(metric.primaryValue) }}</dd>
          </div>
          <div>
            <dt>分母</dt>
            <dd>{{ metric.totalValue === undefined ? '未提供' : formatCount(metric.totalValue) }}</dd>
          </div>
          <div>
            <dt>覆盖率</dt>
            <dd>{{ metric.coverageRate === undefined ? '未提供' : formatPercent(metric.coverageRate) }}</dd>
          </div>
        </dl>
        <div class="source-drawer__supporting">
          <h4>支撑指标</h4>
          <ul v-if="metric.supportingMetrics.length">
            <li
              v-for="(supporting, supportingIndex) in metric.supportingMetrics"
              :key="`${supporting.label}-${supportingIndex}`"
            >
              <span>{{ supporting.label }}</span>
              <strong>{{ formatSupportingValue(supporting.value) }}</strong>
            </li>
          </ul>
          <p v-else>当前指标暂无支撑指标。</p>
        </div>
      </section>

      <section class="source-drawer__section" :aria-labelledby="lineageHeadingId">
        <h3 :id="lineageHeadingId">关联来源</h3>
        <p v-if="metric.sourceIds.length === 0" class="source-drawer__empty">
          该指标当前未关联来源。
        </p>
        <p v-else-if="sources.length === 0" class="source-drawer__empty">
          未找到对应的来源记录，请检查快照来源配置。
        </p>
        <ul v-else class="source-drawer__sources">
          <li v-for="source in sources" :key="source.id">
            <p class="source-drawer__path">{{ source.relativePath }}</p>
            <dl>
              <div>
                <dt>修改时间</dt>
                <dd>{{ dateFormatter.format(new Date(source.modifiedAt)) }}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{{ statusLabel(source.status) }}</dd>
              </div>
            </dl>
            <div class="source-drawer__notes">
              <strong>说明</strong>
              <ul v-if="source.notes.length">
                <li v-for="(note, noteIndex) in source.notes" :key="`${source.id}-${noteIndex}`">
                  {{ note }}
                </li>
              </ul>
              <span v-else>暂无补充说明。</span>
            </div>
          </li>
        </ul>
        <p v-if="sources.length > 0 && missingSourceCount > 0" class="source-drawer__empty">
          另有 {{ missingSourceCount }} 条关联来源未找到对应的来源记录。
        </p>
      </section>

      <section class="source-drawer__section" :aria-labelledby="warningHeadingId">
        <h3 :id="warningHeadingId">快照警告</h3>
        <ul v-if="warnings.length" class="source-drawer__warnings">
          <li v-for="(warning, warningIndex) in warnings" :key="warningIndex">
            {{ warning }}
          </li>
        </ul>
        <p v-else>当前快照暂无警告。</p>
      </section>
    </article>
  </div>
</template>
