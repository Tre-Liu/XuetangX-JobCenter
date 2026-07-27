<script setup lang="ts">
import { computed } from 'vue'
import { snapshotDisplayStatus } from '../dashboard-model'
import type { DashboardSnapshot } from '../types/dashboard'

const props = defineProps<{
  snapshot: DashboardSnapshot
}>()

const displayStatus = computed(() => snapshotDisplayStatus(props.snapshot))
const generatedAtLabel = computed(() => {
  const generatedAt = new Date(props.snapshot.generatedAt)
  return Number.isFinite(generatedAt.getTime())
    ? generatedAt.toLocaleString('zh-CN', { hour12: false })
    : '生成时间未知'
})
</script>

<template>
  <header class="dashboard-header">
    <div>
      <p class="eyebrow">专业建设 · 数据治理</p>
      <h1>专业建设数据治理驾驶舱</h1>
      <p class="snapshot-meta">数据生成于 {{ generatedAtLabel }}</p>
    </div>
    <span class="snapshot-status" :class="`tone-${displayStatus.tone}`" role="status">
      {{ displayStatus.label }}
    </span>
  </header>
</template>
