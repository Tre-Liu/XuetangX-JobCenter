<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildCoverageRows, snapshotLoadState } from '../dashboard-model'
import type { AssetMetric } from '../types/dashboard'
import CoverageChart from './CoverageChart.vue'
import DashboardHeader from './DashboardHeader.vue'
import MetricCard from './MetricCard.vue'
import RecruitmentFunnel from './RecruitmentFunnel.vue'

const props = defineProps<{
  snapshotValue: unknown
}>()

const loadState = computed(() => snapshotLoadState(props.snapshotValue))
const selectedAssetId = ref<AssetMetric['id'] | null>(null)

function openSources(assetId: AssetMetric['id']) {
  selectedAssetId.value = assetId
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
          @select="openSources"
        />
      </section>
      <section class="dashboard-charts" aria-label="数据治理分析图表">
        <CoverageChart :rows="buildCoverageRows(loadState.snapshot.assets)" />
        <RecruitmentFunnel :pipeline="loadState.snapshot.recruitmentPipeline" />
      </section>
    </template>
  </main>
</template>
