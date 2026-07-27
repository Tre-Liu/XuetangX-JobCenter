<script setup lang="ts">
import { computed, ref } from 'vue'
import { snapshotLoadState } from '../dashboard-model'
import type { AssetMetric } from '../types/dashboard'
import DashboardHeader from './DashboardHeader.vue'
import MetricCard from './MetricCard.vue'

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
    </template>
  </main>
</template>
