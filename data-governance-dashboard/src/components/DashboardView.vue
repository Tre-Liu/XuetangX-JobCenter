<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { buildCoverageRows, snapshotLoadState } from '../dashboard-model'
import type { AssetMetric } from '../types/dashboard'
import CoverageChart from './CoverageChart.vue'
import DashboardHeader from './DashboardHeader.vue'
import MetricCard from './MetricCard.vue'
import RecruitmentFunnel from './RecruitmentFunnel.vue'
import SourceDrawer from './SourceDrawer.vue'
import SourceTable from './SourceTable.vue'

const props = defineProps<{
  snapshotValue: unknown
}>()

const loadState = computed(() => snapshotLoadState(props.snapshotValue))
const selectedAssetId = ref<AssetMetric['id'] | null>(null)
let drawerTrigger: HTMLElement | null = null

function rememberDrawerTrigger(event: Event) {
  if (!(event.target instanceof Element)) return

  const button = event.target.closest('button')
  if (button instanceof HTMLElement) drawerTrigger = button
}

function openSources(assetId: AssetMetric['id']) {
  if (drawerTrigger === null && document.activeElement instanceof HTMLButtonElement) {
    drawerTrigger = document.activeElement
  }
  selectedAssetId.value = assetId
}

function openSource(sourceId: string) {
  if (!loadState.value.valid) return

  const source = loadState.value.snapshot.sources.find((candidate) => candidate.id === sourceId)
  if (source) openSources(source.assetId)
}

const selectedMetric = computed(() => {
  if (!loadState.value.valid || selectedAssetId.value === null) return null

  return loadState.value.snapshot.assets.find((asset) => asset.id === selectedAssetId.value) ?? null
})

const selectedSources = computed(() => {
  if (!loadState.value.valid || selectedMetric.value === null) return []

  const sourcesById = new Map(
    loadState.value.snapshot.sources.map((source) => [source.id, source]),
  )
  return selectedMetric.value.sourceIds.flatMap((sourceId) => {
    const source = sourcesById.get(sourceId)
    return source ? [source] : []
  })
})

function closeSources() {
  const trigger = drawerTrigger
  selectedAssetId.value = null
  drawerTrigger = null
  void nextTick(() => {
    if (trigger?.isConnected) trigger.focus()
  })
}
</script>

<template>
  <main class="dashboard-shell">
    <section v-if="!loadState.valid" class="dashboard-alert" role="alert">
      {{ loadState.message }}
    </section>
    <template v-else>
      <DashboardHeader :snapshot="loadState.snapshot" />
      <section class="metric-grid" aria-label="数据资产指标概览">
        <MetricCard
          v-for="asset in loadState.snapshot.assets"
          :key="asset.id"
          :metric="asset"
          :selected="selectedAssetId === asset.id"
          @click.capture="rememberDrawerTrigger"
          @select="openSources"
        />
      </section>
      <section class="dashboard-charts" aria-label="数据治理分析图表">
        <CoverageChart :rows="buildCoverageRows(loadState.snapshot.assets)" />
        <RecruitmentFunnel :pipeline="loadState.snapshot.recruitmentPipeline" />
      </section>
      <section class="source-section" aria-labelledby="source-section-heading">
        <div class="source-section__heading">
          <p class="eyebrow">数据来源追溯</p>
          <h2 id="source-section-heading">来源数据</h2>
        </div>
        <SourceTable
          :sources="loadState.snapshot.sources"
          @click.capture="rememberDrawerTrigger"
          @inspect="openSource"
        />
      </section>
      <SourceDrawer
        v-if="selectedMetric"
        :metric="selectedMetric"
        :sources="selectedSources"
        :warnings="loadState.snapshot.warnings"
        @close="closeSources"
      />
    </template>
  </main>
</template>
