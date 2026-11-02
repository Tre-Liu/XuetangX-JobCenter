<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import '../data/static-region-city-geo.js'
import '../employment/data.js'
import '../employment/model.js'
import '../employment/views.js'
import '../employment/element.js'
const props = defineProps<{ page: string }>()
const emit = defineEmits<{ pageChange: [page: string] }>()
const host = ref<HTMLElement>()
let panel: HTMLElement | undefined
const change = (event: Event) => emit('pageChange', (event as CustomEvent).detail.page)
onMounted(() => {
  panel = document.createElement('employment-analysis')
  panel.setAttribute('employment-page', props.page)
  panel.addEventListener('employment-page-change', change)
  host.value?.appendChild(panel)
})
watch(() => props.page, value => panel?.setAttribute('employment-page', value))
onBeforeUnmount(() => panel?.removeEventListener('employment-page-change', change))
</script>
<template><div ref="host" class="employment-analysis-host"></div></template>
