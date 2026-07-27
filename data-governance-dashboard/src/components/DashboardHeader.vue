<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { snapshotDisplayStatus } from '../dashboard-model'
import type { DashboardSnapshot } from '../types/dashboard'

const props = defineProps<{
  snapshot: DashboardSnapshot
}>()

const staleThresholdMs = 7 * 24 * 60 * 60 * 1000
const maximumRefreshDelayMs = 60 * 1000
const currentTime = ref(Date.now())
let refreshTimer: ReturnType<typeof setTimeout> | undefined

function clearRefreshTimer() {
  if (refreshTimer !== undefined) {
    clearTimeout(refreshTimer)
    refreshTimer = undefined
  }
}

function scheduleStatusRefresh() {
  clearRefreshTimer()
  const generatedAt = new Date(props.snapshot.generatedAt).getTime()
  const now = Date.now()
  if (!Number.isFinite(generatedAt) || now > generatedAt + staleThresholdMs) return

  const thresholdDelay = generatedAt + staleThresholdMs - now + 1
  refreshTimer = setTimeout(() => {
    currentTime.value = Date.now()
    scheduleStatusRefresh()
  }, Math.min(Math.max(thresholdDelay, 1), maximumRefreshDelayMs))
}

onMounted(scheduleStatusRefresh)
onBeforeUnmount(clearRefreshTimer)
watch(
  () => [props.snapshot.generatedAt, props.snapshot.overallStatus],
  () => {
    currentTime.value = Date.now()
    scheduleStatusRefresh()
  },
)

const displayStatus = computed(() =>
  snapshotDisplayStatus(props.snapshot, new Date(currentTime.value)))
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
      <p class="dashboard-header__scope">
        六类数据资产：产业链、产业环节、专业、国标行业、岗位、招聘信息
      </p>
      <p class="snapshot-meta">数据生成于 {{ generatedAtLabel }}</p>
    </div>
    <span class="snapshot-status" :class="`tone-${displayStatus.tone}`" role="status">
      {{ displayStatus.label }}
    </span>
  </header>
</template>
