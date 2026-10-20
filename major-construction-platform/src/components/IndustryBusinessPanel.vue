<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import '../industry-domain/model.js'
import '../industry-domain/business-panels.js'
const props = defineProps<{ context: Record<string, unknown> }>()
const emit = defineEmits<{ action: [detail: { action: string; group?: string; jobId?: string }] }>()
const host = ref<HTMLElement>()
let panel: HTMLElement & { context: Record<string, unknown> }
onMounted(() => {
  panel = document.createElement('industry-business') as typeof panel
  panel.context = props.context
  panel.addEventListener('industry-business-action', event => emit('action', (event as CustomEvent).detail))
  host.value?.appendChild(panel)
})
watch(() => props.context, value => { if (panel) panel.context = value }, { deep: true })
</script>
<template><div ref="host"></div></template>
