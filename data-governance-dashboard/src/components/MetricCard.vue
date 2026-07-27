<script setup lang="ts">
import { computed } from 'vue'
import { formatCount, formatPercent } from '../dashboard-model'
import type { AssetMetric } from '../types/dashboard'

const props = withDefaults(defineProps<{
  metric: AssetMetric
  selected?: boolean
}>(), {
  selected: false,
})

const emit = defineEmits<{
  select: [assetId: AssetMetric['id']]
}>()

const statusLabel = computed(() => ({
  validated: '已验证',
  partial: '部分完成',
  review: '待复核',
  in_progress: '处理中',
}[props.metric.status]))

const cardLabel = computed(() => `${props.metric.label}指标，主值 ${formatCount(props.metric.primaryValue)}`)
const descriptionId = computed(() => `metric-card-description-${props.metric.id}`)

function formatSupportingValue(value: number | string) {
  return typeof value === 'number' ? formatCount(value) : value
}
</script>

<template>
  <button
    class="metric-card"
    :class="{ 'is-selected': selected }"
    type="button"
    :data-asset-id="metric.id"
    :aria-label="cardLabel"
    :aria-describedby="descriptionId"
    :aria-pressed="selected"
    @click="emit('select', metric.id)"
  >
    <span class="metric-card__topline">
      <span class="metric-card__label">{{ metric.label }}</span>
      <span class="metric-card__status">{{ statusLabel }}</span>
    </span>
    <span class="metric-card__value">{{ formatCount(metric.primaryValue) }}</span>
    <span v-if="metric.totalValue !== undefined" class="metric-card__total">
      / {{ formatCount(metric.totalValue) }}
    </span>
    <span v-if="metric.coverageRate !== undefined" class="metric-card__coverage">
      覆盖率 {{ formatPercent(metric.coverageRate) }}
    </span>
    <span class="metric-card__definition">{{ metric.definition }}</span>
    <span class="metric-card__grain">统计粒度：{{ metric.grain }}</span>
    <span v-if="metric.supportingMetrics.length" class="metric-card__supporting">
      <span v-for="supporting in metric.supportingMetrics" :key="supporting.label">
        {{ supporting.label }}：{{ formatSupportingValue(supporting.value) }}
      </span>
    </span>
    <span :id="descriptionId" class="sr-only">
      状态：{{ statusLabel }}。
      <template v-if="metric.totalValue !== undefined">总数 {{ formatCount(metric.totalValue) }}。</template>
      <template v-if="metric.coverageRate !== undefined">覆盖率 {{ formatPercent(metric.coverageRate) }}。</template>
      定义：{{ metric.definition }}。统计粒度：{{ metric.grain }}。
      <template v-for="supporting in metric.supportingMetrics" :key="supporting.label">
        {{ supporting.label }}：{{ formatSupportingValue(supporting.value) }}。
      </template>
    </span>
  </button>
</template>
