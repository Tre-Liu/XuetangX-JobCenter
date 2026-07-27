<script setup lang="ts">
import { computed, ref } from 'vue'
import { filterSources, statusLabel } from '../dashboard-model'
import type { AssetMetric, SourceStatus } from '../types/dashboard'

const emit = defineEmits<{
  inspect: [sourceId: string]
}>()

const assetFilter = ref<AssetMetric['id'] | 'all'>('all')
const statusFilter = ref<SourceStatus['status'] | 'all'>('all')

const props = defineProps<{
  sources: SourceStatus[]
}>()

const filteredSources = computed(() => filterSources(props.sources, {
  assetId: assetFilter.value,
  status: statusFilter.value,
}))

const assetOptions: Array<{ value: AssetMetric['id'] | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'chains', label: '产业链' },
  { value: 'stages', label: '产业环节' },
  { value: 'undergraduateMajors', label: '高教（本科）' },
  { value: 'vocationalMajors', label: '职教' },
  { value: 'industries', label: '国标行业' },
  { value: 'positions', label: '岗位' },
  { value: 'recruitment', label: '招聘信息' },
]

const statusOptions: Array<{ value: SourceStatus['status'] | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'validated', label: '已校验' },
  { value: 'partial', label: '部分覆盖' },
  { value: 'review', label: '建议复核' },
  { value: 'in_progress', label: '跑批进行中' },
]

const assetLabels = Object.fromEntries(
  assetOptions
    .filter((option) => option.value !== 'all')
    .map((option) => [option.value, option.label]),
) as Record<AssetMetric['id'], string>

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Shanghai',
})
</script>

<template>
  <div class="source-explorer">
    <div class="source-filters">
      <label>
        <span>资产类别</span>
        <select v-model="assetFilter" aria-label="按资产类别筛选">
          <option
            v-for="option in assetOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <label>
        <span>来源状态</span>
        <select v-model="statusFilter" aria-label="按来源状态筛选">
          <option
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="source-table-wrap">
      <table class="source-table">
        <caption class="sr-only">数据来源清单</caption>
        <thead>
          <tr>
            <th scope="col">数据资产</th>
            <th scope="col">统计粒度</th>
            <th scope="col">更新时间</th>
            <th scope="col">状态</th>
            <th scope="col">查看来源</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="source in filteredSources" :key="source.id">
            <td data-label="数据资产">
              <span class="source-table__asset">{{ assetLabels[source.assetId] }}</span>
              <span class="source-table__path">{{ source.relativePath }}</span>
            </td>
            <td data-label="统计粒度">{{ source.grain }}</td>
            <td data-label="更新时间">{{ dateFormatter.format(new Date(source.modifiedAt)) }}</td>
            <td data-label="状态">
              <span class="source-status" :class="`source-status--${source.status}`">
                {{ statusLabel(source.status) }}
              </span>
            </td>
            <td data-label="查看来源">
              <button
                class="source-table__inspect"
                type="button"
                :aria-label="`查看 ${source.id}`"
                @click="emit('inspect', source.id)"
              >
                查看详情
              </button>
            </td>
          </tr>
          <tr v-if="filteredSources.length === 0">
            <td class="source-table__empty" colspan="5">
              没有符合当前筛选条件的来源
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
