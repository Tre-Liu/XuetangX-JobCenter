<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
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

const closeButton = ref<HTMLButtonElement | null>(null)
const titleId = computed(() => `source-drawer-title-${props.metric.id}`)
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
})

function formatSupportingValue(value: number | string) {
  return typeof value === 'number' ? formatCount(value) : value
}

onMounted(() => {
  void nextTick(() => closeButton.value?.focus())
})
</script>

<template>
  <div
    class="source-drawer"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    @click.self="emit('close')"
    @keydown.esc.stop.prevent="emit('close')"
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

      <section class="source-drawer__section" aria-labelledby="source-metric-heading">
        <h3 id="source-metric-heading">指标口径</h3>
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
            <li v-for="supporting in metric.supportingMetrics" :key="supporting.label">
              <span>{{ supporting.label }}</span>
              <strong>{{ formatSupportingValue(supporting.value) }}</strong>
            </li>
          </ul>
          <p v-else>当前指标暂无支撑指标。</p>
        </div>
      </section>

      <section class="source-drawer__section" aria-labelledby="source-lineage-heading">
        <h3 id="source-lineage-heading">关联来源</h3>
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
                <li v-for="note in source.notes" :key="note">{{ note }}</li>
              </ul>
              <span v-else>暂无补充说明。</span>
            </div>
          </li>
        </ul>
        <p v-if="sources.length > 0 && missingSourceCount > 0" class="source-drawer__empty">
          另有 {{ missingSourceCount }} 条关联来源未找到对应的来源记录。
        </p>
      </section>

      <section class="source-drawer__section" aria-labelledby="source-warning-heading">
        <h3 id="source-warning-heading">快照警告</h3>
        <ul v-if="warnings.length" class="source-drawer__warnings">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
        <p v-else>当前快照暂无警告。</p>
      </section>
    </article>
  </div>
</template>
