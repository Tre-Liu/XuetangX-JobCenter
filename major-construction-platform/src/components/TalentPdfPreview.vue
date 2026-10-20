<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import '../pdf-preview/element.js'
const props = defineProps<{ plan: { name: string; school: string; year: string; major: string; pages: number } }>()
const host = ref<HTMLElement>()
let reader: HTMLElement | undefined
const sync = () => {
  for (const key of ['name', 'school', 'year', 'major', 'pages'] as const) {
    reader?.setAttribute(key, String(props.plan[key]))
  }
}
onMounted(() => { reader = document.createElement('talent-pdf-preview'); sync(); host.value?.appendChild(reader) })
watch(() => props.plan, sync)
</script>
<template><div ref="host" class="talent-pdf-preview-host"></div></template>
