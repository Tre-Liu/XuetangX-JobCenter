# Decision Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pixel-faithful 决策中心 module that opens from the existing top navigation, supports left-menu and in-page tab switching, and includes default, loading, result, empty, and warning states that match the approved design.

**Architecture:** Keep the feature inside the existing single-file Vue app and the file-protocol static fallback. Introduce a dedicated decision-center mock data module, add a state-driven decision-center shell in `src/App.vue`, and mirror the same navigation and flow states in `index.html` so `index.html` continues to work when opened directly.

**Tech Stack:** Vue 3, TypeScript, Vite, Node built-in test runner, CSS, static HTML fallback script.

---

### Task 1: Lock the data contract with a failing test

**Files:**
- Create: `tests/decision-center-data.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const decisionMock = await readFile(new URL('../src/mock/decision-center.ts', import.meta.url), 'utf8')

test('decision center mock exports overview, governance flows, and placeholder pages', () => {
  for (const token of [
    'export const decisionCenterOverview',
    'export const decisionCenterMenuGroups',
    'export const planAnalysisStates',
    'export const courseDiagnosisStates',
    'export const governancePlaceholderPages'
  ]) {
    assert.match(decisionMock, new RegExp(token))
  }
})

test('decision center mock includes the approved navigation labels', () => {
  for (const label of [
    '专业决策中枢',
    '专业建设治理',
    '专业质量监控',
    '专业运行数据',
    '专业全局概览',
    '培养方案分析',
    '课程体系诊断',
    '课程交叉分析',
    '专业改进建议',
    'AI课程运行'
  ]) {
    assert.match(decisionMock, new RegExp(label))
  }
})

test('plan and course diagnosis states include pending, loading, result, and warning views', () => {
  for (const token of [
    "status: 'pending'",
    "status: 'loading'",
    "status: 'result'",
    "status: 'warning'",
    '开始分析',
    '重新方案分析',
    '课程体系信息校验结果'
  ]) {
    assert.match(decisionMock, new RegExp(token))
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/decision-center-data.test.mjs`

Expected: FAIL with `ENOENT` because `src/mock/decision-center.ts` does not exist yet.

- [ ] **Step 3: Commit**

```bash
git add tests/decision-center-data.test.mjs
git commit -m "test: define decision center data contract"
```

### Task 2: Create the decision-center mock module

**Files:**
- Create: `src/mock/decision-center.ts`
- Test: `tests/decision-center-data.test.mjs`

- [ ] **Step 1: Add the exported types and menu model**

```ts
export type DecisionGroupKey = 'hub' | 'governance' | 'quality' | 'runtime'
export type DecisionPageKey =
  | 'overview'
  | 'plan-analysis'
  | 'course-diagnosis'
  | 'outcome-analysis'
  | 'student-analysis'
  | 'improvement'
  | 'ai-course'
  | 'insight-diagnosis'
  | 'runtime-monitor'

export type DecisionFlowStatus = 'pending' | 'loading' | 'result' | 'warning'

export const decisionCenterMenuGroups = [
  {
    key: 'hub',
    title: '专业决策中枢',
    icon: '◈',
    items: [{ key: 'overview', label: '专业全局概览' }]
  },
  {
    key: 'governance',
    title: '专业建设治理',
    icon: '◫',
    items: [
      { key: 'plan-analysis', label: '培养方案分析' },
      { key: 'course-diagnosis', label: '课程体系诊断' }
    ]
  },
  {
    key: 'quality',
    title: '专业质量监控',
    icon: '◬',
    items: [
      { key: 'outcome-analysis', label: '专业达成度分析' },
      { key: 'student-analysis', label: '学生培养分析' },
      { key: 'improvement', label: '专业改进建议' }
    ]
  },
  {
    key: 'runtime',
    title: '专业运行数据',
    icon: '◭',
    items: [
      { key: 'ai-course', label: 'AI课程运行' },
      { key: 'insight-diagnosis', label: '应用洞察诊断' },
      { key: 'runtime-monitor', label: '运行监控' }
    ]
  }
] as const
```

- [ ] **Step 2: Add the overview, plan analysis, course diagnosis, and placeholder data**

```ts
export const decisionCenterOverview = {
  title: '专业全局概览',
  version: '2026版',
  heroValue: '6 个培养目标',
  guideLabels: ['培养目标', '毕业要求', '课程体系', '教学资源'],
  graduationCards: [
    { label: '毕业要求', value: 7 },
    { label: '毕业要求指标点', value: 12 }
  ],
  courseBadges: [
    'AI课：3门',
    '使用：393次',
    '12门课程',
    '概率论与数理统计-wjl-智能体',
    '离散数学-wjl',
    '数据库原理'
  ],
  resourceCards: [
    { label: '知识库资源', value: 10 },
    { label: '知识点', value: 284 },
    { label: '关联学习内容', value: 0 },
    { label: 'AI工具与智能体', value: 28 }
  ]
}

export const planAnalysisStates = {
  pending: {
    status: 'pending',
    modeTabs: ['培养方案诊断分析', '培养方案对比分析'],
    title: '计算机科学与技术专业【2026版】培养方案智能评析报告',
    cta: '开始分析',
    checks: [
      '12门关联教学课程',
      '12门课程设置了课程类型',
      '12门课程设置了开课学期',
      '12门课程设置了学分',
      '课程与毕业要求关联矩阵不完整'
    ]
  },
  loading: {
    status: 'loading',
    heading: '培养方案智能解析中',
    steps: ['扫描培养目标', '比对毕业要求', '分析课程体系', '生成治理建议']
  },
  warning: {
    status: 'warning',
    alerts: ['缺少课程关联', '缺少学分设置', '缺少毕业要求映射', '缺少关联教学资源']
  },
  result: {
    status: 'result',
    topTabs: ['综合评分', '数据概览', '培养目标智能评析', '毕业要求智能评析', '课程体系智能评析'],
    score: 62,
    radarAverage: 7.2,
    restudyAction: '重新方案分析',
    historyAction: '历史分析'
  }
} as const

export const courseDiagnosisStates = {
  pending: {
    status: 'pending',
    modeTabs: ['课程诊断分析', '课程交叉分析'],
    title: '课程体系分析',
    cta: '开始分析',
    summary: '课程体系信息校验结果'
  },
  loading: {
    status: 'loading',
    heading: '课程体系智能诊断中',
    steps: ['校验课程设置', '测算学分结构', '识别交叉覆盖', '生成课程建议']
  },
  warning: {
    status: 'warning',
    alerts: ['缺少学分结构', '缺少课程类型', '缺少课程与毕业要求映射']
  },
  result: {
    status: 'result',
    topTabs: ['课程诊断分析', '课程交叉分析'],
    keyMetrics: ['毕业要求覆盖率', '学期平均开设课程数（门）', '学期平均学分（含实践）']
  }
} as const

export const governancePlaceholderPages = {
  'outcome-analysis': { title: '专业达成度分析', metrics: ['阶段达成率', '核心课程达成度', '薄弱指标点'] },
  'student-analysis': { title: '学生培养分析', metrics: ['学生画像', '学业风险', '能力成长曲线'] },
  improvement: { title: '专业改进建议', metrics: ['整改优先级', '课程优化建议', '资源补强建议'] },
  'ai-course': { title: 'AI课程运行', metrics: ['AI课数量', '调用次数', '使用覆盖班级'] },
  'insight-diagnosis': { title: '应用洞察诊断', metrics: ['活跃工具', '高频场景', '异常使用波动'] },
  'runtime-monitor': { title: '运行监控', metrics: ['运行健康度', '近7日趋势', '关键节点预警'] }
} as const
```

- [ ] **Step 3: Run the data-contract test to verify it passes**

Run: `npm test -- tests/decision-center-data.test.mjs`

Expected: PASS with `3 tests` passing.

- [ ] **Step 4: Commit**

```bash
git add src/mock/decision-center.ts tests/decision-center-data.test.mjs
git commit -m "feat: add decision center mock data model"
```

### Task 3: Lock the Vue decision-center shell with a failing test

**Files:**
- Create: `tests/decision-center-vue.test.mjs`

- [ ] **Step 1: Write the failing Vue shell test**

```js
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')

test('app imports the decision center mock and tracks module + page state', () => {
  for (const token of [
    "from './mock/decision-center'",
    'const currentModule = ref(',
    'const activeDecisionGroup = ref(',
    'const activeDecisionPage = ref(',
    'const activeDecisionPlanTab = ref(',
    'const activeDecisionCourseTab = ref(',
    'const decisionPlanStatus = ref(',
    'const decisionCourseStatus = ref('
  ]) {
    assert.match(appVue, new RegExp(token))
  }
})

test('app renders the approved decision-center navigation and flow actions', () => {
  for (const label of [
    '专业决策中枢',
    '专业建设治理',
    '专业质量监控',
    '专业运行数据',
    '专业全局概览',
    '培养方案分析',
    '课程体系诊断',
    '开始分析',
    '重新方案分析',
    '课程交叉分析'
  ]) {
    assert.match(appVue, new RegExp(label))
  }
})

test('app persists the decision-center selection when users switch pages', () => {
  for (const token of [
    'localStorage',
    'decision-center-state',
    'openDecisionCenter',
    'selectDecisionPage',
    'startDecisionPlanAnalysis',
    'startDecisionCourseAnalysis'
  ]) {
    assert.match(appVue, new RegExp(token))
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/decision-center-vue.test.mjs`

Expected: FAIL because `App.vue` does not yet import or render the decision-center shell.

- [ ] **Step 3: Commit**

```bash
git add tests/decision-center-vue.test.mjs
git commit -m "test: define decision center vue shell"
```

### Task 4: Implement the Vue decision-center state machine and screens

**Files:**
- Modify: `src/App.vue`
- Test: `tests/decision-center-vue.test.mjs`

- [ ] **Step 1: Import the new mock module and add decision-center refs**

```ts
import {
  courseDiagnosisStates,
  decisionCenterMenuGroups,
  decisionCenterOverview,
  governancePlaceholderPages,
  planAnalysisStates
} from './mock/decision-center'

const currentModule = ref(isCourseModelView ? '课程模型' : '人才方案管理')
const activeDecisionGroup = ref<'hub' | 'governance' | 'quality' | 'runtime'>('hub')
const activeDecisionPage = ref<'overview' | 'plan-analysis' | 'course-diagnosis' | 'outcome-analysis' | 'student-analysis' | 'improvement' | 'ai-course' | 'insight-diagnosis' | 'runtime-monitor'>('overview')
const activeDecisionPlanTab = ref<'综合评分' | '数据概览' | '培养目标智能评析' | '毕业要求智能评析' | '课程体系智能评析'>('综合评分')
const activeDecisionCourseTab = ref<'课程诊断分析' | '课程交叉分析'>('课程诊断分析')
const decisionPlanStatus = ref<'pending' | 'loading' | 'result' | 'warning'>('pending')
const decisionCourseStatus = ref<'pending' | 'loading' | 'result' | 'warning'>('pending')
const decisionStateStorageKey = 'decision-center-state'
```

- [ ] **Step 2: Add selection, persistence, and staged analysis handlers**

```ts
const openDecisionCenter = () => {
  currentModule.value = '决策中心'
  restoreDecisionState()
}

const selectDecisionPage = (groupKey: typeof activeDecisionGroup.value, pageKey: typeof activeDecisionPage.value) => {
  activeDecisionGroup.value = groupKey
  activeDecisionPage.value = pageKey
  persistDecisionState()
}

const persistDecisionState = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    decisionStateStorageKey,
    JSON.stringify({
      group: activeDecisionGroup.value,
      page: activeDecisionPage.value,
      planTab: activeDecisionPlanTab.value,
      courseTab: activeDecisionCourseTab.value,
      planStatus: decisionPlanStatus.value,
      courseStatus: decisionCourseStatus.value
    })
  )
}

const restoreDecisionState = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(decisionStateStorageKey)
  if (!raw) return
  const saved = JSON.parse(raw)
  activeDecisionGroup.value = saved.group ?? 'hub'
  activeDecisionPage.value = saved.page ?? 'overview'
  activeDecisionPlanTab.value = saved.planTab ?? '综合评分'
  activeDecisionCourseTab.value = saved.courseTab ?? '课程诊断分析'
  decisionPlanStatus.value = saved.planStatus ?? 'pending'
  decisionCourseStatus.value = saved.courseStatus ?? 'pending'
}

const startDecisionPlanAnalysis = async () => {
  decisionPlanStatus.value = 'loading'
  persistDecisionState()
  await nextTick()
  window.setTimeout(() => {
    decisionPlanStatus.value = 'result'
    persistDecisionState()
  }, 900)
}

const startDecisionCourseAnalysis = async () => {
  decisionCourseStatus.value = 'loading'
  persistDecisionState()
  await nextTick()
  window.setTimeout(() => {
    decisionCourseStatus.value = 'result'
    persistDecisionState()
  }, 900)
}
```

- [ ] **Step 3: Wire the top navigation so 决策中心 becomes a real module**

```vue
<button
  v-for="module in topModules"
  :key="module.label"
  class="module-tab"
  :class="{ active: currentModule === module.label, outline: module.outline }"
  type="button"
  @click="module.label === '决策中心' ? openDecisionCenter() : currentModule = module.label"
>
  <span class="tab-icon">{{ module.icon }}</span>{{ module.label }}
</button>
```

- [ ] **Step 4: Render the decision-center shell inside the workspace**

```vue
<div v-else-if="currentModule === '决策中心'" class="content-area decision-content-area">
  <aside class="decision-sidebar">
    <section
      v-for="group in decisionCenterMenuGroups"
      :key="group.key"
      class="decision-side-group"
    >
      <header class="decision-side-group-title">
        <span>{{ group.icon }}</span>
        <strong>{{ group.title }}</strong>
      </header>
      <button
        v-for="item in group.items"
        :key="item.key"
        class="decision-side-item"
        :class="{ active: activeDecisionPage === item.key }"
        type="button"
        @click="selectDecisionPage(group.key, item.key)"
      >
        {{ item.label }}
      </button>
    </section>
  </aside>

  <section class="canvas-card decision-center-card">
    <template v-if="activeDecisionPage === 'overview'">
      <header class="decision-overview-head">
        <h2>{{ decisionCenterOverview.heroValue }}</h2>
        <button class="decision-version-switch">{{ decisionCenterOverview.version }}</button>
      </header>
      <section class="decision-stage-shell">
        <div class="decision-stage-guides">
          <span v-for="label in decisionCenterOverview.guideLabels" :key="label">{{ label }}</span>
        </div>
        <div class="decision-stage-orbit"></div>
        <div class="decision-stage-cloud">培养目标</div>
        <div class="decision-stage-platform">毕业要求</div>
        <div class="decision-stage-courses">
          <span v-for="badge in decisionCenterOverview.courseBadges" :key="badge">{{ badge }}</span>
        </div>
        <div class="decision-stage-resources">
          <article v-for="card in decisionCenterOverview.resourceCards" :key="card.label">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
          </article>
        </div>
      </section>
    </template>

    <template v-else-if="activeDecisionPage === 'plan-analysis'">
      <section v-if="decisionPlanStatus === 'pending'" class="decision-report decision-report-pending">
        <h2>{{ planAnalysisStates.pending.title }}</h2>
        <button class="primary-action" type="button" @click="startDecisionPlanAnalysis">
          {{ planAnalysisStates.pending.cta }}
        </button>
      </section>
      <section v-else-if="decisionPlanStatus === 'loading'" class="decision-report decision-report-loading">
        <h2>{{ planAnalysisStates.loading.heading }}</h2>
      </section>
      <section v-else class="decision-report decision-report-result">
        <header class="decision-report-toolbar">
          <button class="outline-action">{{ planAnalysisStates.result.historyAction }}</button>
          <button class="outline-action">{{ planAnalysisStates.result.restudyAction }}</button>
        </header>
        <nav class="decision-report-tabs">
          <button
            v-for="tab in planAnalysisStates.result.topTabs"
            :key="tab"
            :class="{ active: activeDecisionPlanTab === tab }"
            type="button"
            @click="activeDecisionPlanTab = tab"
          >
            {{ tab }}
          </button>
        </nav>
      </section>
    </template>

    <template v-else-if="activeDecisionPage === 'course-diagnosis'">
      <section v-if="decisionCourseStatus === 'pending'" class="decision-report decision-report-pending">
        <h2>{{ courseDiagnosisStates.pending.title }}</h2>
        <button class="primary-action" type="button" @click="startDecisionCourseAnalysis">
          {{ courseDiagnosisStates.pending.cta }}
        </button>
      </section>
      <section v-else class="decision-report decision-report-result">
        <nav class="decision-report-tabs">
          <button
            v-for="tab in courseDiagnosisStates.result.topTabs"
            :key="tab"
            :class="{ active: activeDecisionCourseTab === tab }"
            type="button"
            @click="activeDecisionCourseTab = tab"
          >
            {{ tab }}
          </button>
        </nav>
      </section>
    </template>

    <template v-else>
      <section class="decision-placeholder-page">
        <h2>{{ governancePlaceholderPages[activeDecisionPage].title }}</h2>
      </section>
    </template>
  </section>
</div>
```

- [ ] **Step 5: Run the Vue-shell test to verify it passes**

Run: `npm test -- tests/decision-center-vue.test.mjs`

Expected: PASS with `3 tests` passing.

- [ ] **Step 6: Commit**

```bash
git add src/App.vue tests/decision-center-vue.test.mjs
git commit -m "feat: add decision center vue module"
```

### Task 5: Lock the static fallback and styles with failing tests

**Files:**
- Create: `tests/decision-center-static.test.mjs`

- [ ] **Step 1: Write the failing static/style test**

```js
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const stylesCss = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

test('static file entry exposes decision-center module rendering and persistence hooks', () => {
  for (const token of [
    'data-module="decision"',
    'renderDecisionCenter',
    'renderDecisionOverview',
    'renderDecisionPlanAnalysis',
    'renderDecisionCourseDiagnosis',
    'decision-center-state',
    'localStorage'
  ]) {
    assert.match(staticHtml, new RegExp(token))
  }
})

test('decision-center styles include the main shell, stage, report tabs, and warning cards', () => {
  for (const token of [
    '.decision-content-area',
    '.decision-sidebar',
    '.decision-side-group',
    '.decision-stage-shell',
    '.decision-stage-orbit',
    '.decision-report-tabs',
    '.decision-alert-card',
    '.decision-placeholder-page'
  ]) {
    assert.match(stylesCss, new RegExp(token.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')))
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/decision-center-static.test.mjs`

Expected: FAIL because the static entry and CSS do not yet contain decision-center renderers or selectors.

- [ ] **Step 3: Commit**

```bash
git add tests/decision-center-static.test.mjs
git commit -m "test: define decision center static fallback"
```

### Task 6: Mirror the decision center in `index.html`, add styles, and verify the full feature

**Files:**
- Modify: `index.html`
- Modify: `src/styles.css`
- Test: `tests/decision-center-data.test.mjs`
- Test: `tests/decision-center-vue.test.mjs`
- Test: `tests/decision-center-static.test.mjs`

- [ ] **Step 1: Add the 决策中心 top-nav button and file-protocol decision state in `index.html`**

```html
<button class="module-tab ${activeModule === 'decision' ? 'active' : ''}" data-module="decision">
  <span class="tab-icon">AI</span>决策中心
</button>
```

```js
const decisionStorageKey = 'decision-center-state'
let activeDecisionGroup = 'hub'
let activeDecisionPage = 'overview'
let activeDecisionPlanTab = '综合评分'
let activeDecisionCourseTab = '课程诊断分析'
let decisionPlanStatus = 'pending'
let decisionCourseStatus = 'pending'

const saveDecisionState = () => {
  window.localStorage.setItem(
    decisionStorageKey,
    JSON.stringify({
      activeDecisionGroup,
      activeDecisionPage,
      activeDecisionPlanTab,
      activeDecisionCourseTab,
      decisionPlanStatus,
      decisionCourseStatus
    })
  )
}
```

- [ ] **Step 2: Add the static renderers for overview, 培养方案分析, and 课程体系诊断**

```js
const renderDecisionOverview = () => `
  <div class="content-area decision-content-area">
    <aside class="decision-sidebar">${renderDecisionSidebar()}</aside>
    <section class="canvas-card decision-center-card">
      <header class="decision-overview-head"><h2>6 个培养目标</h2><button class="decision-version-switch">2026版</button></header>
      <section class="decision-stage-shell">
        <div class="decision-stage-guides"><span>培养目标</span><span>毕业要求</span><span>课程体系</span><span>教学资源</span></div>
        <div class="decision-stage-orbit"></div>
        <div class="decision-stage-cloud">培养目标</div>
        <div class="decision-stage-platform">毕业要求</div>
      </section>
    </section>
  </div>
`

const renderDecisionPlanAnalysis = () => {
  if (decisionPlanStatus === 'pending') {
    return `<section class="decision-report decision-report-pending"><h2>计算机科学与技术专业【2026版】培养方案智能评析报告</h2><button class="primary-action" data-decision-start-plan>开始分析</button></section>`
  }
  if (decisionPlanStatus === 'loading') {
    return `<section class="decision-report decision-report-loading"><h2>培养方案智能解析中</h2></section>`
  }
  return `<section class="decision-report decision-report-result"><nav class="decision-report-tabs"><button class="${activeDecisionPlanTab === '综合评分' ? 'active' : ''}" data-decision-plan-tab="综合评分">综合评分</button><button data-decision-plan-tab="数据概览">数据概览</button><button data-decision-plan-tab="培养目标智能评析">培养目标智能评析</button><button data-decision-plan-tab="毕业要求智能评析">毕业要求智能评析</button><button data-decision-plan-tab="课程体系智能评析">课程体系智能评析</button></nav><button class="outline-action">重新方案分析</button></section>`
}

const renderDecisionCourseDiagnosis = () => {
  if (decisionCourseStatus === 'pending') {
    return `<section class="decision-report decision-report-pending"><h2>课程体系分析</h2><button class="primary-action" data-decision-start-course>开始分析</button></section>`
  }
  return `<section class="decision-report decision-report-result"><nav class="decision-report-tabs"><button class="${activeDecisionCourseTab === '课程诊断分析' ? 'active' : ''}" data-decision-course-tab="课程诊断分析">课程诊断分析</button><button data-decision-course-tab="课程交叉分析">课程交叉分析</button></nav></section>`
}

const renderDecisionCenter = () => {
  if (activeDecisionPage === 'overview') return renderDecisionOverview()
  if (activeDecisionPage === 'plan-analysis') return renderDecisionFrame(renderDecisionPlanAnalysis())
  if (activeDecisionPage === 'course-diagnosis') return renderDecisionFrame(renderDecisionCourseDiagnosis())
  return renderDecisionFrame(renderDecisionPlaceholder())
}
```

- [ ] **Step 3: Bind static click handlers for page switching and staged analysis**

```js
if (target.closest('[data-module="decision"]')) {
  activeModule = 'decision'
  restoreDecisionState()
  renderHome()
}

const decisionPageButton = target.closest('[data-decision-page]')
if (decisionPageButton) {
  activeDecisionGroup = decisionPageButton.dataset.decisionGroup || 'hub'
  activeDecisionPage = decisionPageButton.dataset.decisionPage || 'overview'
  saveDecisionState()
  renderHome()
}

if (target.closest('[data-decision-start-plan]')) {
  decisionPlanStatus = 'loading'
  saveDecisionState()
  renderHome()
  window.setTimeout(() => {
    decisionPlanStatus = 'result'
    saveDecisionState()
    renderHome()
  }, 900)
}
```

- [ ] **Step 4: Add the high-fidelity decision-center CSS blocks**

```css
.decision-content-area {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 0;
  min-height: calc(100vh - 138px);
  background:
    radial-gradient(circle at 58% 18%, rgba(255, 255, 255, 0.82), transparent 24%),
    radial-gradient(circle at 66% 66%, rgba(103, 109, 255, 0.18), transparent 28%),
    linear-gradient(180deg, #c8d8ff 0%, #d6e3ff 36%, #c7d8ff 100%);
}

.decision-sidebar {
  padding: 22px 10px 18px;
  border-right: 1px solid rgba(121, 145, 255, 0.18);
  background: linear-gradient(180deg, rgba(241, 246, 255, 0.78), rgba(227, 236, 255, 0.92));
}

.decision-side-group {
  margin-bottom: 20px;
  padding: 12px 10px 16px;
}

.decision-stage-shell {
  position: relative;
  min-height: 980px;
  overflow: hidden;
}

.decision-stage-orbit {
  position: absolute;
  inset: 130px 280px 180px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 0 120px rgba(114, 136, 255, 0.22);
}

.decision-report-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  border-radius: 18px;
  background: rgba(239, 244, 255, 0.92);
}

.decision-alert-card {
  border: 1px solid rgba(255, 151, 112, 0.44);
  background: rgba(255, 248, 244, 0.92);
  color: #6b4b3c;
}

.decision-placeholder-page {
  min-height: 720px;
  border-radius: 26px;
  background: rgba(248, 251, 255, 0.78);
}
```

- [ ] **Step 5: Run the targeted tests and the full build**

Run: `npm test -- tests/decision-center-data.test.mjs tests/decision-center-vue.test.mjs tests/decision-center-static.test.mjs`

Expected: PASS with all decision-center tests green.

Run: `npm run build`

Expected: PASS with a successful Vite production build and no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add index.html src/styles.css tests/decision-center-static.test.mjs
git commit -m "feat: add decision center static shell and styles"
```

## Self-Review

- Spec coverage check: the plan includes the top-nav entry, four left-side menu groups, overview page, 培养方案分析 states, 课程体系诊断 states, 课程交叉分析 tab, and placeholder pages for the remaining governance/runtime modules.
- Placeholder scan: no placeholder markers remain in the task steps.
- Type consistency check: all steps reuse the same state keys (`hub`, `governance`, `quality`, `runtime`, `overview`, `plan-analysis`, `course-diagnosis`) and flow statuses (`pending`, `loading`, `result`, `warning`).

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-01-decision-center.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
