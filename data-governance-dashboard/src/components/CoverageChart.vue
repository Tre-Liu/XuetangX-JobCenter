<script setup lang="ts">
import { useId } from 'vue'
import { formatPercent } from '../dashboard-model'
import type { CoverageRow } from '../dashboard-model'

defineProps<{
  rows: CoverageRow[]
}>()

const barWidth = 360
const rowHeight = 48
const instanceId = useId()
const headingId = `coverage-heading-${instanceId}`
const titleId = `coverage-title-${instanceId}`
const descriptionId = `coverage-desc-${instanceId}`
</script>

<template>
  <section class="chart-panel coverage-chart" :aria-labelledby="headingId">
    <h2 :id="headingId">资产覆盖率</h2>
    <svg
      class="coverage-chart__svg"
      role="img"
      :aria-labelledby="`${titleId} ${descriptionId}`"
      :viewBox="`0 0 640 ${Math.max(rows.length * rowHeight + 24, 72)}`"
    >
      <title :id="titleId">可比数据资产覆盖率</title>
      <desc :id="descriptionId">展示标准产业链、高教（本科）、职教、岗位、国标行业和招聘信息的覆盖率。</desc>
      <g v-for="(row, index) in rows" :key="row.id" :transform="`translate(0 ${index * rowHeight + 12})`">
        <text class="coverage-chart__label" x="0" y="17">{{ row.label }}</text>
        <text class="coverage-chart__percent" x="620" y="17" text-anchor="end">{{ formatPercent(row.rate) }}</text>
        <rect class="coverage-chart__track" x="160" y="2" :width="barWidth" height="20" rx="10" />
        <rect
          class="coverage-chart__bar"
          x="160"
          y="2"
          :width="barWidth * row.rate"
          height="20"
          rx="10"
        />
      </g>
    </svg>
  </section>
</template>
