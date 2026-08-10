import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const hotJobAnalysisPage = await readFile(new URL('../src/components/HotJobAnalysisPage.vue', import.meta.url), 'utf8').catch(() => '')
const vueSource = `${appVue}\n${hotJobAnalysisPage}`
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const decisionMock = await readFile(new URL('../src/mock/decision-center.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('AI assistant launchers are hidden in Vue and static fallback', () => {
  const vueTemplate = appVue.slice(appVue.indexOf('<template>'))
  const staticDock = staticHtml.match(/const staticDockHtml = \(\) => `[\s\S]*?`/)?.[0] || ''

  assert.doesNotMatch(vueTemplate, /data-ai-dock-toggle|class="support-avatar global-ai-assistant"|id="ai-suggestion-panel"/)
  assert.doesNotMatch(staticDock, /data-ai-dock-toggle|class="support-avatar global-ai-assistant"|id="ai-suggestion-panel"/)
})

test('Vue renders hot-job analysis as an inline research page', () => {
  assert.match(appVue, /currentJobResearchTab === 'analysis'[\s\S]*<HotJobAnalysisPage\s*\/>/)
  assert.match(hotJobAnalysisPage, /class="hot-job-analysis-page"/)
  assert.doesNotMatch(appVue, /class="dialog-backdrop ai-analysis-backdrop"/)
  assert.doesNotMatch(hotJobAnalysisPage, /aria-modal="true"|ai-analysis-close/)
})

test('hot-job analysis uses the menu name as its page title', async () => {
  const { aiHotJobAnalysisAdvice } = await import('../src/mock/decision-center.ts')
  assert.equal(aiHotJobAnalysisAdvice.title, '岗培优化建议')
  assert.match(hotJobAnalysisPage, /aria-label="岗培优化建议"/)
})

test('Vue hot-job analysis omits the shared current-industry-chain switcher', () => {
  assert.match(
    appVue,
    /<div\s+v-if="currentJobResearchTab !== 'analysis'"\s+class="research-chain-tabs-wrap"\s+aria-label="当前产业链"\s*>/,
  )
})

test('inline hot-job analysis fits the research canvas without fixed overlays', () => {
  assert.match(
    stylesCss,
    /\.hot-job-analysis-page \.ai-analysis-modal-page\s*\{[\s\S]*min-width:\s*0;[\s\S]*margin:\s*0;/,
  )
  assert.match(
    stylesCss,
    /\.hot-job-analysis-page \.ai-analysis-plan-simulator\s*\{[\s\S]*position:\s*sticky;[\s\S]*right:\s*24px;[\s\S]*bottom:\s*24px;/,
  )
})

test('static fallback renders hot-job analysis as an inline research page', () => {
  assert.match(staticHtml, /const staticAiAnalysisPageHtml = \(\) =>/)
  assert.match(staticHtml, /tab === 'analysis'[\s\S]*?staticAiAnalysisPageHtml\(\)/)
  assert.match(staticHtml, /class="hot-job-analysis-page"/)
  assert.doesNotMatch(staticHtml, /class="dialog-backdrop ai-analysis-backdrop"/)
  assert.doesNotMatch(staticHtml, /data-close-ai-analysis|class="ai-analysis-close"/)
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
    { value: '3项', label: '培养目标建议调整', expandLabel: '展开详情' },
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

test('hot-job analysis renders scrollable ability descriptions in Vue', () => {
  assert.match(hotJobAnalysisPage, /产业环节：\s*\{\{ job\.industrySegment \|\| '待确认' \}\}/)
  assert.match(hotJobAnalysisPage, /getAiHotJobAbilityCount\(activeAiAnalysis\.hotJobs\)/)
  assert.match(hotJobAnalysisPage, /:aria-expanded="aiJobAbilitiesExpanded"/)
  assert.match(hotJobAnalysisPage, /@click="aiJobAbilitiesExpanded = !aiJobAbilitiesExpanded"/)
  assert.match(hotJobAnalysisPage, /getAiHotJobSuggestionMetrics\(activeAiAnalysis\)/)
  assert.match(hotJobAnalysisPage, /v-for="metric in aiHotJobSuggestionMetrics"/)
  assert.match(hotJobAnalysisPage, /v-for="ability in job\.abilities"/)
  assert.match(hotJobAnalysisPage, /class="ai-analysis-ability-description"/)
  assert.match(hotJobAnalysisPage, /:aria-label="`\$\{job\.name\}能力列表`"/)

  const abilityPanel = hotJobAnalysisPage.match(/id="ai-hot-job-abilities"[\s\S]*?<section class="ai-analysis-card ai-analysis-diagnosis">/)?.[0] || ''
  assert.doesNotMatch(abilityPanel, /toggleAiJobAbility|典型工作任务|能力来源/)
  assert.match(stylesCss, /\.ai-analysis-ability-list\s*\{[\s\S]*max-height:[\s\S]*overflow-y:\s*auto;/)
  assert.match(stylesCss, /\.ai-analysis-job-only-notice\s*\{/)
})

test('Vue hot-job analysis supports the no-talent-plan demo state', () => {
  assert.match(hotJobAnalysisPage, /const aiTalentPlanAvailable = ref\(true\)/)
  assert.match(hotJobAnalysisPage, /模拟：\{\{ aiTalentPlanAvailable \? '已有人培方案' : '无人培方案' \}\}/)
  assert.match(hotJobAnalysisPage, /:aria-pressed="!aiTalentPlanAvailable"/)
  assert.match(hotJobAnalysisPage, /没有人才培养方案数据/)
  assert.match(hotJobAnalysisPage, /请先导入人才培养方案/)

  for (const title of [
    '培养目标对比分析',
    '毕业要求比对分析',
    '课程支撑度明细',
  ]) {
    assert.match(hotJobAnalysisPage, new RegExp(`${title}[\\s\\S]{0,900}v-if="aiTalentPlanAvailable"`))
  }

  for (const title of ['新增目标建议', '新增毕业要求建议', '新增课程建议']) {
    const section = hotJobAnalysisPage.match(new RegExp(`<h3>${title}</h3>[\\s\\S]{0,1600}?</section>`))?.[0] || ''
    assert.match(section, /v-if="!aiTalentPlanAvailable" class="ai-analysis-job-only-notice"/)
    assert.match(section, /当前未导入人才培养方案，以下为基于岗位需求生成的通用建议/)
    assert.doesNotMatch(section, /v-if="aiTalentPlanAvailable" class="ai-analysis-(suggestion-list|course-suggestions)"/)
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
  assert.match(staticHtml, /data-ai-toggle-abilities/)
  assert.match(staticHtml, /data-ai-toggle-talent-plan/)
  assert.match(staticHtml, /产业环节：\$\{staticEscapeText\(job\.industrySegment \|\| '待确认'\)\}/)
  assert.match(staticHtml, /const staticAiSuggestionMetrics = \(advice\) =>/)
  assert.match(staticHtml, /advice\.newGoalSuggestions\.length/)
  assert.match(staticHtml, /advice\.graduationRequirementSuggestions\.length/)
  assert.match(staticHtml, /advice\.courseSuggestions\.length/)
  assert.match(staticHtml, /ai-analysis-ability-description/)
  assert.match(staticHtml, /ai-analysis-job-only-notice/)
  assert.match(staticHtml, /当前未导入人才培养方案，以下为基于岗位需求生成的通用建议/)
  assert.match(staticHtml, /没有人才培养方案数据，请先导入人才培养方案/)
  assert.match(staticHtml, /毕业要求比对分析/)

  const staticAnalysisBlock = staticHtml.match(/const staticAiHotJobAbilities = \{[\s\S]*?const staticAiAnalysisPageHtml/)?.[0] || ''
  for (const abilityName of [
    '技术文档与知识沉淀',
    '前沿视觉技术研究',
    '实验文档与经验沉淀',
    '团队技术指导',
    '技术文档与知识交流',
    '语音系统集成协同',
    '智能驾驶技术创新',
    '测试技术跟踪与方法引入',
  ]) {
    assert.match(staticAnalysisBlock, new RegExp(abilityName))
  }
  assert.doesNotMatch(staticAnalysisBlock, /data-ai-job-ability-id|典型工作任务|能力来源/)
  assert.doesNotMatch(staticAnalysisBlock, /\{ value: '5项'.*培养目标建议调整|\{ value: '7项'.*毕业要求建议调整|\{ value: '10门'.*建议新增或强化课程/)
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
    assert.match(vueSource, new RegExp(text))
    assert.match(staticHtml, new RegExp(text))
  }
  for (const text of ['招聘样本不足', '产业映射分']) {
    assert.doesNotMatch(decisionMock, new RegExp(text))
    assert.doesNotMatch(staticHtml, new RegExp(text))
  }
})

test('Vue and static hot-job cards show only selection labels while preserving pagination', () => {
  const vueHotJobCards = hotJobAnalysisPage.match(/<div class="ai-analysis-job-grid"[\s\S]*?<nav v-if="aiHotJobPageCount > 1"/)?.[0] || ''
  const staticHotJobCards = staticHtml.match(/const staticAiHotJobsHtml = \(advice\) => \{[\s\S]*?const staticAiAnalysisPageHtml/)?.[0] || ''

  assert.match(hotJobAnalysisPage, /const activeAiHotJobPage = ref\(1\)/)
  assert.match(hotJobAnalysisPage, /getAiHotJobPage\(activeAiAnalysis\.hotJobs, activeAiHotJobPage\.value\)/)
  assert.match(hotJobAnalysisPage, /v-for="job in pagedAiHotJobs"/)
  assert.match(hotJobAnalysisPage, /job\.industryChain.*job\.stage/s)
  assert.match(vueHotJobCards, /市场热门岗/)
  assert.match(vueHotJobCards, /产业代表岗/)
  assert.doesNotMatch(vueHotJobCards, /job\.recruitmentCount|job\.companyCount|条招聘|家企业/)
  assert.match(hotJobAnalysisPage, /:disabled="activeAiHotJobPage === 1"/)
  assert.match(hotJobAnalysisPage, /:disabled="activeAiHotJobPage === aiHotJobPageCount"/)

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

test('hot-job analysis shows the fixed 2026 version control in Vue and static entries', () => {
  for (const source of [vueSource, staticHtml]) {
    const modal = source.match(/ai-analysis-modal-page[\s\S]{0,1800}ai-analysis-hot-jobs/)?.[0] || ''
    assert.match(modal, /class="ai-analysis-version-select"/)
    assert.match(modal, /aria-label="当前分析版本：2026版本"/)
    assert.match(modal, />\s*<span>2026版本<\/span>/)
    assert.match(modal, /class="ai-analysis-version-chevron"/)
  }

  assert.match(
    stylesCss,
    /\.ai-analysis-version-select\s*\{[\s\S]*position:\s*absolute;[\s\S]*left:\s*0;/
  )
  assert.match(stylesCss, /\.ai-analysis-version-select:focus-visible\s*\{/)
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
  assert.match(hotJobAnalysisPage, /const activeAiAnalysisTab = ref<AiAnalysisTabKey>\('goals'\)/)
  assert.match(hotJobAnalysisPage, /role="tab"[\s\S]*@click="activeAiAnalysisTab = 'requirements'"/)
  assert.match(hotJobAnalysisPage, /role="tab"[\s\S]*@click="activeAiAnalysisTab = 'courses'"/)
  assert.match(hotJobAnalysisPage, /:aria-selected="activeAiAnalysisTab === 'requirements'"/)
  assert.match(hotJobAnalysisPage, /v-if="activeAiAnalysisTab === 'goals'"/)
  assert.match(hotJobAnalysisPage, /v-else-if="activeAiAnalysisTab === 'requirements'"/)
  assert.doesNotMatch(hotJobAnalysisPage, /<span>✣ 毕业要求分析<\/span>/)

  assert.match(staticHtml, /let staticAiAnalysisTab = 'goals'/)
  assert.match(staticHtml, /data-ai-analysis-tab="requirements"/)
  assert.match(staticHtml, /data-ai-analysis-tab="courses"/)
  assert.match(staticHtml, /staticAiAnalysisTab = aiAnalysisTab\.dataset\.aiAnalysisTab/)
  assert.match(staticHtml, /staticAiAnalysisReportHtml\(advice\)/)
})

test('graduation requirement tab renders comparison and new requirement advice', () => {
  for (const source of [vueSource, staticHtml]) {
    assert.match(source, /毕业要求比对分析/)
    assert.match(source, /新增毕业要求建议/)
  }
  assert.match(decisionMock, /BIM深化与协同交付能力/)
  assert.match(decisionMock, /智慧工地平台应用能力/)
  assert.match(staticHtml, /BIM深化与协同交付能力/)
  assert.match(staticHtml, /智慧工地平台应用能力/)
})

test('course construction tab renders charts details and course recommendations', () => {
  for (const source of [vueSource, staticHtml]) {
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
