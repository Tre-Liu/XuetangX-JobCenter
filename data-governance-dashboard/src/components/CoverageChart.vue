<script setup lang="ts">
import { formatPercent } from '../dashboard-model'
import type { CoverageRow } from '../dashboard-model'

defineProps<{
  rows: CoverageRow[]
}>()

const barWidth = 360
const rowHeight = 48
</script>

<template>
  <section class="chart-panel coverage-chart" aria-labelledby="coverage-heading">
    <h2 id="coverage-heading">资产覆盖率</h2>
    <svg
      class="coverage-chart__svg"
      role="img"
      aria-labelledby="coverage-title coverage-desc"
      :viewBox="`0 0 640 ${Math.max(rows.length * rowHeight + 24, 72)}`"
    >
      <title id="coverage-title">可比数据资产覆盖率</title>
      <desc id="coverage-desc">展示标准产业链、专业、岗位、国标行业和招聘信息的覆盖率。</desc>
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
