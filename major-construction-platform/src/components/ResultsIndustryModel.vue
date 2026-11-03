<script setup lang="ts">
import { onMounted, ref } from 'vue'
import '../results-home/motion.js'
import '../results-home/industry-editor.js'
import '../results-home/industry-model.js'
import '../results-home/industry-data.js'
const host = ref<HTMLElement>()
onMounted(() => {
  const panel = document.createElement('results-industry-model')
  panel.setAttribute('asset-base', './results-assets/')
  host.value?.appendChild(panel)
})
</script>
<template><div ref="host" class="results-industry-host"></div></template>
