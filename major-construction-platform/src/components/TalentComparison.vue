<script setup lang="ts">
import { onMounted, ref } from 'vue'
import '../talent-plan/data.js'
import '../talent-plan/model.js'
import '../talent-plan/files.js'
import '../talent-compare/research-data.js'
import '../talent-compare/assets/echarts.min.js'
import '../talent-compare/model.js'
import '../talent-compare/icons.js'
import '../talent-compare/views.js'
import '../talent-compare/charts.js'
import '../talent-compare/element.js'
const host = ref<HTMLElement>()
onMounted(() => host.value?.appendChild(document.createElement('talent-comparison')))
</script>
<template><div ref="host" class="talent-comparison-host"></div></template>
