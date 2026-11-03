<script setup lang="ts">
import { onMounted, ref } from 'vue'
import '../results-home/motion.js'
import '../results-home/element.js'
const props = defineProps<{
  name: string
  summary: string
  metrics: { label: string; value: number; basis?: string }[]
  courses: string[]
  jobs: string[]
}>()
const host = ref<HTMLElement>()
onMounted(() => {
  const panel = document.createElement('results-home')
  panel.setAttribute('config', JSON.stringify(props))
  panel.setAttribute('asset-base', './results-assets/')
  host.value?.appendChild(panel)
})
</script>
<template><div ref="host" class="results-home-host"></div></template>
