<script setup lang="ts">
import snapshotJson from './data/dashboard-snapshot.json'
import DashboardView from './components/DashboardView.vue'
</script>

<template>
  <DashboardView :snapshot-value="snapshotJson" />
</template>
