<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import '../talent-plan/data.js'
import '../talent-plan/standards.js'
import '../talent-plan/model.js'
import '../talent-plan/purify.js'
import '../talent-plan/richtext.js'
import '../talent-plan/files.js'
import '../talent-plan/views.js'
import '../talent-plan/element.js'
const props = defineProps<{ mode?: 'workbench' | 'results' }>()
const emit = defineEmits<{ navigate: [detail: { view: string; section?: string }] }>()
const host = ref<HTMLElement>()
let panel: HTMLElement | undefined
const navigate = (event: Event) => emit('navigate', (event as CustomEvent).detail)
onMounted(() => {
  panel = document.createElement('talent-plan-workbench')
  panel.setAttribute('mode', props.mode || 'workbench')
  panel.addEventListener('talent-plan-navigate', navigate)
  host.value?.appendChild(panel)
})
watch(() => props.mode, mode => panel?.setAttribute('mode', mode || 'workbench'))
onBeforeUnmount(() => panel?.removeEventListener('talent-plan-navigate', navigate))
</script>
<template><div ref="host" class="talent-plan-workspace-host"></div></template>
