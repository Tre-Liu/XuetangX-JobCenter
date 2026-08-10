<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  getAiHotJobAbilityCount,
  getAiHotJobPage,
  getAiHotJobSuggestionMetrics,
} from '../app/ai-hot-jobs'
import { aiHotJobAnalysisAdvice } from '../mock/decision-center'

type AiAnalysisTabKey = 'goals' | 'requirements' | 'courses'

const activeAiAnalysis = aiHotJobAnalysisAdvice
const activeAiAnalysisTab = ref<AiAnalysisTabKey>('goals')
const activeAiHotJobPage = ref(1)
const aiJobAbilitiesExpanded = ref(false)
const aiTalentPlanAvailable = ref(true)

const aiHotJobAbilityCount = computed(() =>
  getAiHotJobAbilityCount(activeAiAnalysis.hotJobs)
)
const aiHotJobSuggestionMetrics = computed(() =>
  getAiHotJobSuggestionMetrics(activeAiAnalysis)
)
const activeAiHotJobPagination = computed(() =>
  getAiHotJobPage(activeAiAnalysis.hotJobs, activeAiHotJobPage.value)
)
const pagedAiHotJobs = computed(() => activeAiHotJobPagination.value.items)
const aiHotJobPageCount = computed(() => activeAiHotJobPagination.value.pageCount)

const setAiHotJobPage = (page: number) => {
  activeAiHotJobPage.value = getAiHotJobPage(activeAiAnalysis.hotJobs, page).page
}
const reanalyzeAiHotJobs = () => {
  activeAiHotJobPage.value = 1
  aiJobAbilitiesExpanded.value = false
  aiTalentPlanAvailable.value = true
}
const buildAiRadarPoints = (values: number[], radius = 105, center = 150) => values
  .map((value, index) => {
    const angle = (Math.PI * 2 * index / values.length) - Math.PI / 2
    const distance = radius * value / 100
    return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`
  })
  .join(' ')
</script>

<template>
  <section class="hot-job-analysis-page" aria-label="岗培优化建议">
    <div class="ai-analysis-modal-page">
      <header class="ai-analysis-header">
        <button
          class="ai-analysis-version-select"
          type="button"
          aria-label="当前分析版本：2026版本"
        >
          <span>2026版本</span>
          <span class="ai-analysis-version-chevron" aria-hidden="true"></span>
        </button>
        <h2>{{ activeAiAnalysis.title }}</h2>
        <div>
          <span>基于 {{ activeAiAnalysis.generatedAt }} 数据的分析结果</span>
          <button type="button" @click="reanalyzeAiHotJobs">重新分析</button>
        </div>
      </header>

      <section class="ai-analysis-card ai-analysis-hot-jobs">
        <h3>热门岗位分析</h3>
        <p>{{ activeAiAnalysis.industrySummary }}</p>
        <div class="ai-analysis-job-grid" aria-live="polite">
          <article
            v-for="job in pagedAiHotJobs"
            :key="job.name"
            :class="`tone-${job.tone}`"
          >
            <strong>{{ job.name }}</strong>
            <span class="ai-analysis-job-chain">{{ job.industryChain }} · {{ job.stage }}</span>
            <span class="ai-analysis-job-segment">产业环节：{{ job.industrySegment || '待确认' }}</span>
            <span v-if="job.selectionType === 'market'" class="ai-analysis-job-evidence market">市场热门岗</span>
            <span v-else class="ai-analysis-job-evidence representative">产业代表岗</span>
          </article>
        </div>
        <nav v-if="aiHotJobPageCount > 1" class="ai-analysis-job-pagination" aria-label="热门岗位分页">
          <button
            type="button"
            aria-label="上一页"
            :disabled="activeAiHotJobPage === 1"
            @click="setAiHotJobPage(activeAiHotJobPage - 1)"
          >‹</button>
          <button
            v-for="page in aiHotJobPageCount"
            :key="page"
            type="button"
            :class="{ active: activeAiHotJobPage === page }"
            :aria-current="activeAiHotJobPage === page ? 'page' : undefined"
            @click="setAiHotJobPage(page)"
          >{{ page }}</button>
          <button
            type="button"
            aria-label="下一页"
            :disabled="activeAiHotJobPage === aiHotJobPageCount"
            @click="setAiHotJobPage(activeAiHotJobPage + 1)"
          >›</button>
        </nav>
      </section>

      <section class="ai-analysis-metrics">
        <button
          class="ai-analysis-metric-button"
          type="button"
          :aria-expanded="aiJobAbilitiesExpanded"
          aria-controls="ai-hot-job-abilities"
          @click="aiJobAbilitiesExpanded = !aiJobAbilitiesExpanded"
        >
          <strong>{{ aiHotJobAbilityCount }}项</strong>
          <span>岗位核心能力</span>
          <small>{{ aiJobAbilitiesExpanded ? '收起能力详情' : '展开能力详情' }}</small>
        </button>
        <article v-for="metric in aiHotJobSuggestionMetrics" :key="metric.label">
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
          <small v-if="metric.expandLabel" class="ai-analysis-metric-entry">{{ metric.expandLabel }}</small>
        </article>
      </section>

      <section
        v-if="aiJobAbilitiesExpanded"
        id="ai-hot-job-abilities"
        class="ai-analysis-card ai-analysis-abilities"
        aria-label="岗位核心能力详情"
      >
        <header>
          <div>
            <h3>岗位核心能力详情</h3>
            <p>能力项来自入选岗位对应的标准岗位职责，共 {{ aiHotJobAbilityCount }} 项（按能力标识去重）。</p>
          </div>
          <span>覆盖 {{ activeAiAnalysis.hotJobs.length }} 个岗位</span>
        </header>
        <div class="ai-analysis-ability-groups">
          <article v-for="job in activeAiAnalysis.hotJobs" :key="`ability-${job.name}`" class="ai-analysis-ability-group">
            <h4>{{ job.name }}</h4>
            <div
              v-if="job.abilities.length"
              class="ai-analysis-ability-list"
              tabindex="0"
              :aria-label="`${job.name}能力列表`"
            >
              <article v-for="ability in job.abilities" :key="`${job.name}-${ability.id}`" class="ai-analysis-ability-item">
                <strong>{{ ability.name }}</strong>
                <p class="ai-analysis-ability-description">{{ ability.description || '暂无能力描述' }}</p>
              </article>
            </div>
            <p v-else class="ai-analysis-ability-empty">暂无已关联能力项</p>
          </article>
        </div>
      </section>

      <section class="ai-analysis-card ai-analysis-diagnosis">
        <div class="ai-analysis-side-label">
          <span>AI</span>
          <strong>专业分析</strong>
        </div>
        <article v-for="card in activeAiAnalysis.diagnosisCards" :key="card.title">
          <strong>{{ card.title }}</strong>
          <p>{{ card.summary }}</p>
        </article>
      </section>

      <nav class="ai-analysis-tabs" role="tablist" aria-label="分析栏目">
        <button
          type="button"
          role="tab"
          :class="{ active: activeAiAnalysisTab === 'goals' }"
          :aria-selected="activeAiAnalysisTab === 'goals'"
          @click="activeAiAnalysisTab = 'goals'"
        >◎ 培养目标分析</button>
        <button
          type="button"
          role="tab"
          :class="{ active: activeAiAnalysisTab === 'requirements' }"
          :aria-selected="activeAiAnalysisTab === 'requirements'"
          @click="activeAiAnalysisTab = 'requirements'"
        >✣ 毕业要求分析</button>
        <button
          type="button"
          role="tab"
          :class="{ active: activeAiAnalysisTab === 'courses' }"
          :aria-selected="activeAiAnalysisTab === 'courses'"
          @click="activeAiAnalysisTab = 'courses'"
        >▣ 课程建设分析</button>
      </nav>

      <div v-if="activeAiAnalysisTab === 'goals'" class="ai-analysis-tab-panel" role="tabpanel">
        <section class="ai-analysis-card">
          <h3>培养目标对比分析</h3>
          <div v-if="aiTalentPlanAvailable" class="ai-analysis-compare-list">
            <article v-for="item in activeAiAnalysis.goalComparisons" :key="item.code">
              <span>{{ item.code }}</span>
              <div>
                <strong>{{ item.title }}</strong>
                <em>{{ item.tag }}</em>
                <p>{{ item.detail }}</p>
              </div>
            </article>
          </div>
          <div v-else class="ai-analysis-plan-empty" role="status">
            <p>没有人才培养方案数据，请先导入人才培养方案</p>
          </div>
        </section>

        <section class="ai-analysis-card">
          <h3>新增目标建议</h3>
          <div v-if="!aiTalentPlanAvailable" class="ai-analysis-job-only-notice" role="status">
            当前未导入人才培养方案，以下为基于岗位需求生成的通用建议。请先上传人才培养方案，以获得结合现状差距的针对性建议。
          </div>
          <div class="ai-analysis-suggestion-list">
            <article v-for="item in activeAiAnalysis.newGoalSuggestions" :key="item.title">
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
              <span>建议理由：{{ item.reason }}</span>
            </article>
          </div>
        </section>
      </div>

      <div v-else-if="activeAiAnalysisTab === 'requirements'" class="ai-analysis-tab-panel" role="tabpanel">
        <section class="ai-analysis-card">
          <h3>毕业要求比对分析</h3>
          <div v-if="aiTalentPlanAvailable" class="ai-analysis-compare-list requirement-list">
            <article v-for="item in activeAiAnalysis.graduationRequirementComparisons" :key="item.code">
              <span>{{ item.code }}</span>
              <div>
                <strong>{{ item.title }}</strong>
                <em>{{ item.tag }}</em>
                <p>{{ item.indicators }}</p>
                <small>{{ item.detail }}</small>
              </div>
            </article>
          </div>
          <div v-else class="ai-analysis-plan-empty" role="status">
            <p>没有人才培养方案数据，请先导入人才培养方案</p>
          </div>
        </section>

        <section class="ai-analysis-card">
          <h3>新增毕业要求建议</h3>
          <div v-if="!aiTalentPlanAvailable" class="ai-analysis-job-only-notice" role="status">
            当前未导入人才培养方案，以下为基于岗位需求生成的通用建议。请先上传人才培养方案，以获得结合现状差距的针对性建议。
          </div>
          <div class="ai-analysis-suggestion-list compact">
            <article v-for="item in activeAiAnalysis.graduationRequirementSuggestions" :key="item.title">
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
              <span>新增原因：{{ item.reason }}</span>
            </article>
          </div>
        </section>
      </div>

      <div v-else class="ai-analysis-tab-panel course-panel" role="tabpanel">
        <section class="ai-analysis-card">
          <h3>岗位能力维度对比</h3>
          <div class="ai-analysis-radar-layout">
            <svg class="ai-analysis-radar" viewBox="0 0 300 300" role="img" aria-label="岗位需求度与课程覆盖度雷达图">
              <g class="radar-grid">
                <polygon v-for="level in [20, 40, 60, 80, 100]" :key="level" :points="buildAiRadarPoints(activeAiAnalysis.abilitySupport.map(() => level))" />
                <line v-for="(_, index) in activeAiAnalysis.abilitySupport" :key="index" x1="150" y1="150" :x2="buildAiRadarPoints(activeAiAnalysis.abilitySupport.map((__, itemIndex) => itemIndex === index ? 100 : 0)).split(' ')[index].split(',')[0]" :y2="buildAiRadarPoints(activeAiAnalysis.abilitySupport.map((__, itemIndex) => itemIndex === index ? 100 : 0)).split(' ')[index].split(',')[1]" />
              </g>
              <polygon class="radar-demand" :points="buildAiRadarPoints(activeAiAnalysis.abilitySupport.map(item => item.jobDemand))" />
              <polygon class="radar-coverage" :points="buildAiRadarPoints(activeAiAnalysis.abilitySupport.map(item => item.courseCoverage))" />
            </svg>
            <div class="ai-analysis-radar-labels">
              <span v-for="item in activeAiAnalysis.abilitySupport" :key="item.ability">{{ item.ability }}</span>
            </div>
            <div class="ai-analysis-chart-legend"><span class="demand">岗位需求度</span><span class="coverage">课程覆盖度</span></div>
          </div>
        </section>

        <section class="ai-analysis-card">
          <h3>岗位能力支撑度</h3>
          <div class="ai-analysis-support-bars">
            <article v-for="item in activeAiAnalysis.abilitySupport" :key="item.ability">
              <strong>{{ item.ability }}</strong>
              <div><i :style="{ width: `${item.jobDemand}%` }"></i><b :style="{ width: `${item.courseCoverage}%` }"></b></div>
              <span>{{ item.courseCoverage }}%</span>
            </article>
          </div>
        </section>

        <section class="ai-analysis-card">
          <h3>课程支撑度明细</h3>
          <div v-if="aiTalentPlanAvailable" class="ai-analysis-course-table">
            <div class="table-head"><span>岗位能力需求</span><span>对应学校课程</span><span>课程支撑度</span><span>建议新增课程</span></div>
            <article v-for="item in activeAiAnalysis.abilitySupport" :key="item.ability">
              <strong>{{ item.ability }}</strong>
              <div><em v-for="course in item.courses" :key="course">{{ course }}</em></div>
              <span class="support-score">{{ item.courseCoverage }}%<i><b :style="{ width: `${item.courseCoverage}%` }"></b></i></span>
              <div><em v-for="course in item.suggestedCourses" :key="course" class="suggested">{{ course }}</em></div>
            </article>
          </div>
          <div v-else class="ai-analysis-plan-empty" role="status">
            <p>没有人才培养方案数据，请先导入人才培养方案</p>
          </div>
        </section>

        <section class="ai-analysis-card">
          <h3>新增课程建议</h3>
          <div v-if="!aiTalentPlanAvailable" class="ai-analysis-job-only-notice" role="status">
            当前未导入人才培养方案，以下为基于岗位需求生成的通用建议。请先上传人才培养方案，以获得结合现状差距的针对性建议。
          </div>
          <div class="ai-analysis-course-suggestions">
            <article v-for="item in activeAiAnalysis.courseSuggestions" :key="item.title">
              <header><span>强烈建议</span><strong>{{ item.title }}</strong><em>专业必修</em></header>
              <p>{{ item.description }}</p>
              <small>{{ item.reason }}</small>
            </article>
          </div>
        </section>
      </div>

      <p class="ai-analysis-source-note">{{ activeAiAnalysis.sourceNote }}</p>
    </div>
    <button
      class="ai-analysis-plan-simulator"
      type="button"
      :aria-pressed="!aiTalentPlanAvailable"
      @click="aiTalentPlanAvailable = !aiTalentPlanAvailable"
    >
      模拟：{{ aiTalentPlanAvailable ? '已有人培方案' : '无人培方案' }}
    </button>
  </section>
</template>
