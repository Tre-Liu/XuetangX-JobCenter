<script setup lang="ts">
import { computed } from 'vue'
import {
  buildRecruitmentFootnotes,
  buildRecruitmentStages,
  formatCount,
} from '../dashboard-model'
import type { RecruitmentPipeline } from '../types/dashboard'

const props = defineProps<{
  pipeline: RecruitmentPipeline
}>()

const stages = computed(() => buildRecruitmentStages(props.pipeline))
const footnotes = computed(() => buildRecruitmentFootnotes(props.pipeline))
const completedYearsLabel = computed(() => {
  const completedYears = Array.isArray(props.pipeline.completedYears) ? props.pipeline.completedYears : []
  const years = completedYears.filter((year) => Number.isFinite(year) && Number.isInteger(year) && year >= 0)
  if (years.length === 0) return '未提供'
  return years.length === 1 ? String(years[0]) : `${years[0]}—${years[years.length - 1]}`
})
</script>

<template>
  <section class="chart-panel recruitment-funnel" aria-labelledby="recruitment-heading">
    <h2 id="recruitment-heading">招聘数据处理漏斗</h2>
    <p class="recruitment-funnel__years">已完成年份：{{ completedYearsLabel }}</p>
    <ol class="recruitment-funnel__stages" aria-label="招聘数据处理阶段">
      <li
        v-for="stage in stages"
        :key="stage.id"
        class="recruitment-funnel__stage"
        :class="`tone-${stage.tone}`"
      >
        <span class="recruitment-funnel__label">{{ stage.label }}</span>
        <strong>：{{ formatCount(stage.value) }}</strong>
      </li>
    </ol>
    <ul class="recruitment-funnel__footnotes" aria-label="招聘处理补充指标">
      <li v-for="footnote in footnotes" :key="footnote.label">
        <span>{{ footnote.label }}</span>
        <strong>{{ formatCount(footnote.value) }}</strong>
      </li>
    </ul>
  </section>
</template>
