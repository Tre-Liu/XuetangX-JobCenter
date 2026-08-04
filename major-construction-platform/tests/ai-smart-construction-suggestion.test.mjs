import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const decisionMock = await readFile(new URL('../src/mock/decision-center.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('AI assistant exposes the same four suggestions in Vue and file fallback', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /热门岗位分析建议/)
    assert.match(source, /优化专业结构，从这里开始/)
    assert.match(source, /data-ai-suggestion-key="hot-jobs"/)
    assert.match(source, /ai-suggestion-panel/)
  }
})

test('AI assistant is globally available and reports its expanded state', () => {
  assert.match(appVue, /class="support-avatar global-ai-assistant"/)
  assert.match(appVue, /aria-label="AI助手"/)
  assert.match(appVue, /:aria-expanded="aiSuggestionPanelOpen"/)
  assert.match(staticHtml, /class="support-avatar global-ai-assistant"/)
  assert.match(staticHtml, /aria-label="AI助手"/)
})

test('hot-job suggestion opens the Vue analysis modal', () => {
  assert.doesNotMatch(appVue, /if \(key === 'hot-jobs'\) return/)
  assert.match(
    appVue,
    /if \(key === 'hot-jobs'\) \{[\s\S]*activeAiAnalysisKey\.value = 'hot-jobs'[\s\S]*return/
  )
  assert.match(appVue, /@keydown\.esc="closeAiAnalysisModal"/)
  assert.match(appVue, /ref="aiAnalysisCloseRef"/)
  assert.match(appVue, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(appVue, /aiAnalysisReturnFocus[\s\S]*focus\(\{ preventScroll: true \}\)/)
})

test('hot-job suggestion opens the static analysis modal', () => {
  assert.doesNotMatch(staticHtml, /if \(key === 'hot-jobs'\) return/)
  assert.match(
    staticHtml,
    /if \(key === 'hot-jobs'\) \{[\s\S]*openStaticAiAnalysis\([\s\S]*return/
  )
  assert.match(staticHtml, /app\.insertAdjacentHTML\('beforeend', staticAiAnalysisModalHtml\(\)\)/)
  assert.match(staticHtml, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(staticHtml, /const closeStaticAiAnalysis = \(\) =>/)
  assert.match(staticHtml, /staticAiAnalysisReturnFocus[\s\S]*focus\(\{ preventScroll: true \}\)/)
})

test('AI suggestion panel supports outside click without closing from panel clicks', () => {
  assert.match(appVue, /<main v-else class="app-shell" @click="closeAiSuggestionPanel">/)
  assert.match(appVue, /id="ai-suggestion-panel"[\s\S]*@click\.stop/)
  assert.match(
    staticHtml,
    /staticAiSuggestionPanelOpen && !target\.closest\('\.ai-suggestion-panel'\)/
  )
})

test('right-side support avatar uses the same AI suggestion trigger', () => {
  assert.match(
    appVue,
    /class="support-avatar global-ai-assistant"[\s\S]*data-ai-dock-toggle[\s\S]*@click\.stop="toggleAiSuggestionPanel"/
  )
  assert.match(
    staticHtml,
    /class="support-avatar global-ai-assistant"[\s\S]*data-ai-dock-toggle/
  )
})

test('AI assistant matches the reference dimensions and responsive bounds', () => {
  assert.match(
    stylesCss,
    /\.global-ai-assistant\s*\{[\s\S]*position:\s*fixed;[\s\S]*right:\s*28px;[\s\S]*bottom:\s*28px;/
  )
  assert.match(
    stylesCss,
    /\.global-ai-assistant\s*\{[\s\S]*width:\s*58px;[\s\S]*height:\s*58px;/
  )
  assert.match(
    stylesCss,
    /\.ai-suggestion-panel\s*\{[\s\S]*width:\s*336px;[\s\S]*border-radius:\s*18px;/
  )
  assert.match(stylesCss, /\.ai-suggestion-item\s*\{[\s\S]*min-height:\s*83px;/)
  assert.match(stylesCss, /max-width:\s*calc\(100vw - 32px\);/)
  assert.match(stylesCss, /max-height:\s*calc\(100vh - 118px\);/)
  assert.match(stylesCss, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(appVue, /ai-assistant-avatar\.png/)
  assert.match(staticHtml, /public\/figma-assets\/ai-assistant-avatar\.png/)
})

test('hot-job pagination shows six items per page and clamps page boundaries', async () => {
  const { getAiHotJobPage } = await import('../src/app/ai-hot-jobs.ts')
  const jobs = Array.from({ length: 8 }, (_, index) => ({ name: `岗位${index + 1}` }))

  const firstPage = getAiHotJobPage(jobs, 1)
  assert.equal(firstPage.page, 1)
  assert.equal(firstPage.pageCount, 2)
  assert.deepEqual(firstPage.items.map((job) => job.name), ['岗位1', '岗位2', '岗位3', '岗位4', '岗位5', '岗位6'])

  const lastPage = getAiHotJobPage(jobs, 99)
  assert.equal(lastPage.page, 2)
  assert.deepEqual(lastPage.items.map((job) => job.name), ['岗位7', '岗位8'])
})

test('hot-job suggestion metrics are derived from returned result rows', async () => {
  const { getAiHotJobSuggestionMetrics } = await import('../src/app/ai-hot-jobs.ts')

  const metrics = getAiHotJobSuggestionMetrics({
    newGoalSuggestions: [{}, {}, {}],
    graduationRequirementSuggestions: [{}, {}, {}, {}],
    courseSuggestions: [{}, {}, {}, {}, {}],
  })

  assert.deepEqual(metrics, [
    { value: '3项', label: '培养目标建议调整' },
    { value: '4项', label: '毕业要求建议调整' },
    { value: '5门', label: '建议新增或强化课程' },
  ])
})

test('hot jobs expose confirmed industry segments and data-backed abilities', async () => {
  const { getAiHotJobAbilityCount } = await import('../src/app/ai-hot-jobs.ts')
  const { aiHotJobAnalysisAdvice } = await import('../src/mock/decision-center.ts')

  assert.equal(aiHotJobAnalysisAdvice.hotJobs.length, 8)
  assert.equal('metrics' in aiHotJobAnalysisAdvice, false)
  for (const job of aiHotJobAnalysisAdvice.hotJobs) {
    assert.ok(job.industrySegment)
    assert.equal(job.abilities.length, 5)
    for (const ability of job.abilities) {
      assert.ok(ability.id && ability.name && ability.type)
      assert.ok(ability.description && ability.tasks.length && ability.source)
    }
  }

  const expected = new Set(
    aiHotJobAnalysisAdvice.hotJobs.flatMap((job) => job.abilities.map((ability) => ability.id)),
  ).size
  assert.equal(getAiHotJobAbilityCount(aiHotJobAnalysisAdvice.hotJobs), expected)
})

test('hot-job analysis exposes expandable job abilities in Vue', () => {
  assert.match(appVue, /产业环节：\s*\{\{ job\.industrySegment \|\| '待确认' \}\}/)
  assert.match(appVue, /getAiHotJobAbilityCount\(activeAiAnalysis\.value\.hotJobs\)/)
  assert.match(appVue, /:aria-expanded="aiJobAbilitiesExpanded"/)
  assert.match(appVue, /@click="aiJobAbilitiesExpanded = !aiJobAbilitiesExpanded"/)
  assert.match(appVue, /v-for="ability in job\.abilities"/)
  assert.match(appVue, /toggleAiJobAbility\(ability\.id\)/)
  assert.match(appVue, /典型工作任务/)
  assert.match(appVue, /能力来源/)
})

test('Vue hot-job analysis supports the no-talent-plan demo state', () => {
  assert.match(appVue, /const aiTalentPlanAvailable = ref\(true\)/)
  assert.match(appVue, /模拟：\{\{ aiTalentPlanAvailable \? '已有人培方案' : '无人培方案' \}\}/)
  assert.match(appVue, /:aria-pressed="!aiTalentPlanAvailable"/)
  assert.match(appVue, /没有人才培养方案数据/)
  assert.match(appVue, /请先导入人才培养方案/)

  for (const title of [
    '培养目标对比分析',
    '新增目标建议',
    '毕业要求比对分析',
    '新增毕业要求建议',
    '课程支撑度明细',
    '新增课程建议',
  ]) {
    assert.match(appVue, new RegExp(`${title}[\\s\\S]{0,900}v-if="aiTalentPlanAvailable"`))
  }
})

test('static hot-job parity includes segments abilities and no-plan states', () => {
  for (const segment of [
    '数据、算力与模型基础',
    '智能感知、语音视觉与平台工具',
    '行业智能化应用与AI服务',
  ]) {
    assert.match(staticHtml, new RegExp(segment))
  }

  assert.match(staticHtml, /let staticAiTalentPlanAvailable = true/)
  assert.match(staticHtml, /let staticAiJobAbilitiesExpanded = false/)
  assert.match(staticHtml, /const staticExpandedAiJobAbilityIds = new Set\(\)/)
  assert.match(staticHtml, /data-ai-toggle-abilities/)
  assert.match(staticHtml, /data-ai-job-ability-id/)
  assert.match(staticHtml, /data-ai-toggle-talent-plan/)
  assert.match(staticHtml, /产业环节：\$\{staticEscapeText\(job\.industrySegment \|\| '待确认'\)\}/)
  assert.match(staticHtml, /典型工作任务/)
  assert.match(staticHtml, /能力来源/)
  assert.match(staticHtml, /没有人才培养方案数据，请先导入人才培养方案/)
  assert.match(staticHtml, /毕业要求比对分析/)
})

test('hot-job analysis uses real AI-chain recruitment evidence and representative fallback', () => {
  for (const text of [
    '人工智能产业链',
    '算法工程师',
    '机器视觉工程师',
    '机器学习工程师',
    '自然语言处理',
    '深度学习工程师',
    '语音识别工程师',
    '智能驾驶工程师',
    '智能驾驶测试工程师',
    'recruitmentCount: 46',
    'companyCount: 38'
  ]) {
    assert.match(decisionMock, new RegExp(text))
    assert.match(staticHtml, new RegExp(text))
  }
  for (const text of ['市场热门岗', '产业代表岗']) {
    assert.match(appVue, new RegExp(text))
    assert.match(staticHtml, new RegExp(text))
  }
  for (const text of ['招聘样本不足', '产业映射分']) {
    assert.doesNotMatch(decisionMock, new RegExp(text))
    assert.doesNotMatch(staticHtml, new RegExp(text))
  }
})

test('Vue and static hot-job cards show only selection labels while preserving pagination', () => {
  const vueHotJobCards = appVue.match(/<div class="ai-analysis-job-grid"[\s\S]*?<nav v-if="aiHotJobPageCount > 1"/)?.[0] || ''
  const staticHotJobCards = staticHtml.match(/const staticAiHotJobsHtml = \(advice\) => \{[\s\S]*?const staticAiAnalysisModalHtml/)?.[0] || ''

  assert.match(appVue, /const activeAiHotJobPage = ref\(1\)/)
  assert.match(appVue, /getAiHotJobPage\(activeAiAnalysis\.value\.hotJobs, activeAiHotJobPage\.value\)/)
  assert.match(appVue, /v-for="job in pagedAiHotJobs"/)
  assert.match(appVue, /job\.industryChain.*job\.stage/s)
  assert.match(vueHotJobCards, /市场热门岗/)
  assert.match(vueHotJobCards, /产业代表岗/)
  assert.doesNotMatch(vueHotJobCards, /job\.recruitmentCount|job\.companyCount|条招聘|家企业/)
  assert.match(appVue, /:disabled="activeAiHotJobPage === 1"/)
  assert.match(appVue, /:disabled="activeAiHotJobPage === aiHotJobPageCount"/)

  assert.match(staticHtml, /let staticAiHotJobPage = 1/)
  assert.match(staticHtml, /const staticAiHotJobPageSize = 6/)
  assert.match(staticHtml, /data-ai-hot-job-page/)
  assert.match(staticHotJobCards, /市场热门岗/)
  assert.match(staticHotJobCards, /产业代表岗/)
  assert.doesNotMatch(staticHotJobCards, /job\.recruitmentCount|job\.companyCount|条招聘|家企业/)
})

test('hot-job analysis modal has a high-definition long-page shell', () => {
  for (const pattern of [
    /\.ai-analysis-modal\s*\{/,
    /width:\s*min\(calc\(100vw - 96px\),\s*1720px\);/,
    /height:\s*calc\(100vh - 96px\);/,
    /overflow-y:\s*auto;/,
    /scrollbar-gutter:\s*stable;/,
    /\.ai-analysis-modal-page\s*\{/,
    /min-width:\s*1180px;/
  ]) {
    assert.match(stylesCss, pattern)
  }
})

test('hot-job analysis modal title is centered across the full header', () => {
  assert.match(
    stylesCss,
    /\.ai-analysis-header\s*\{[\s\S]*grid-template-columns:\s*1fr auto 1fr;/
  )
  assert.match(
    stylesCss,
    /\.ai-analysis-header h2\s*\{[\s\S]*grid-column:\s*2;[\s\S]*justify-self:\s*center;/
  )
  assert.match(
    stylesCss,
    /\.ai-analysis-header div\s*\{[\s\S]*grid-column:\s*3;[\s\S]*justify-self:\s*end;[\s\S]*margin-right:\s*56px;/
  )
})

test('hot-job analysis exposes three interactive report tabs in Vue and static entries', () => {
  assert.match(appVue, /const activeAiAnalysisTab = ref<AiAnalysisTabKey>\('goals'\)/)
  assert.match(appVue, /role="tab"[\s\S]*@click="activeAiAnalysisTab = 'requirements'"/)
  assert.match(appVue, /role="tab"[\s\S]*@click="activeAiAnalysisTab = 'courses'"/)
  assert.match(appVue, /:aria-selected="activeAiAnalysisTab === 'requirements'"/)
  assert.match(appVue, /v-if="activeAiAnalysisTab === 'goals'"/)
  assert.match(appVue, /v-else-if="activeAiAnalysisTab === 'requirements'"/)
  assert.doesNotMatch(appVue, /<span>✣ 毕业要求分析<\/span>/)

  assert.match(staticHtml, /let staticAiAnalysisTab = 'goals'/)
  assert.match(staticHtml, /data-ai-analysis-tab="requirements"/)
  assert.match(staticHtml, /data-ai-analysis-tab="courses"/)
  assert.match(staticHtml, /staticAiAnalysisTab = aiAnalysisTab\.dataset\.aiAnalysisTab/)
  assert.match(staticHtml, /staticAiAnalysisReportHtml\(advice\)/)
})

test('graduation requirement tab renders comparison and new requirement advice', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /毕业要求比对分析/)
    assert.match(source, /新增毕业要求建议/)
  }
  assert.match(decisionMock, /BIM深化与协同交付能力/)
  assert.match(decisionMock, /智慧工地平台应用能力/)
  assert.match(staticHtml, /BIM深化与协同交付能力/)
  assert.match(staticHtml, /智慧工地平台应用能力/)
})

test('course construction tab renders charts details and course recommendations', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /岗位能力维度对比/)
    assert.match(source, /岗位能力支撑度/)
    assert.match(source, /课程支撑度明细/)
    assert.match(source, /新增课程建议/)
    assert.match(source, /ai-analysis-radar/)
    assert.match(source, /ai-analysis-support-bars/)
    assert.match(source, /ai-analysis-course-table/)
  }
  assert.match(decisionMock, /abilitySupport/)
  assert.match(decisionMock, /jobDemand:\s*92/)
  assert.match(decisionMock, /courseCoverage:\s*46/)
})
