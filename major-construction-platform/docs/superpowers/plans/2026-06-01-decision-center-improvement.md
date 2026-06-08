# Decision Center Improvement Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-fidelity `专业改进建议` decision-center page that combines signal-board storytelling with a report-style evidence matrix, and ship it consistently in both the Vue app and the static `index.html` fallback.

**Architecture:** Replace the current generic placeholder-only `improvement` page with a dedicated improvement-page data model and a dedicated rendering branch. Keep the rest of the decision-center placeholder pages on the existing lightweight path, but route `improvement` through its own page-level renderer in both `src/App.vue` and `index.html`, backed by richer mock data and explicit page states.

**Tech Stack:** Vue 3 + TypeScript, static HTML/JS fallback, Node built-in test runner (`node --test`), Vite build, existing decision-center CSS system

---

## File Structure

- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/mock/decision-center.ts`
  - Add a dedicated `decisionImprovementPage` export with header metadata, hero signals, matrix rows, action panels, timeline, and state payloads.
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/App.vue`
  - Replace the generic placeholder render path for `improvement` with a dedicated branch and state-aware improvement-page template.
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/styles.css`
  - Add layout and component styles for the new improvement page while reusing decision-center tokens and visual language.
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/index.html`
  - Mirror the new mock structure and add a dedicated static renderer for `improvement`, including default / refreshing / empty / warning states.
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-data.test.mjs`
  - Add mock-data assertions for the new improvement-page structure and content tokens.
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-vue.test.mjs`
  - Add Vue-structure assertions proving `improvement` no longer uses the generic placeholder branch and now renders the dedicated layout.
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-static.test.mjs`
  - Add static fallback assertions for the new renderer and its wiring.

### Task 1: Expand the Improvement Page Data Model

**Files:**
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-data.test.mjs`
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/mock/decision-center.ts`

- [ ] **Step 1: Write the failing mock-data test**

```js
test('decision center mock defines a dedicated improvement-page report model', () => {
  for (const token of [
    'export const decisionImprovementPage',
    'headerMeta',
    'heroSignals',
    'headlineSummary',
    'evidenceMatrix',
    'courseAdjustments',
    'trainingAdditions',
    'resourceRecommendations',
    'deliveryTimeline',
    'warningFlags',
    '智能体开发',
    'AIGC 应用工程师'
  ]) {
    assert.match(decisionMock, new RegExp(token))
  }
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/decision-center-data.test.mjs
```

Expected:

- FAIL on `decision center mock defines a dedicated improvement-page report model`
- Failure mentions missing `decisionImprovementPage` or one of the new fields

- [ ] **Step 3: Write the minimal improvement-page mock export**

```ts
export const decisionImprovementPage = {
  headerMeta: {
    title: '专业改进建议',
    summary: '基于实时招聘数据、行业动态与课程运行情况，形成岗位趋势、课程调整与实训补强建议。',
    meta: [
      { label: '数据周期', value: '近30天' },
      { label: '覆盖岗位数', value: '28 个' },
      { label: '最近更新时间', value: '2026-06-01 09:30' }
    ]
  },
  states: {
    default: {
      heroSignals: [
        { label: '新增岗位', value: '3 个', note: '智能体开发、AIGC应用、多模态数据处理' }
      ],
      headlineSummary:
        'AIGC 应用工程师、智能体开发与多模态处理成为新增需求高点，建议优先调整人工智能导论、Python 程序设计、数据库原理，并补入提示工程与智能体工作流实训。',
      evidenceMatrix: [
        {
          trend: '智能体开发',
          ability: '工作流编排 / 提示工程 / 工具调用',
          courses: 'Python 程序设计 / 人工智能导论',
          gap: '现有课程缺少 Agent 工作流内容',
          action: '增补章节',
          training: '智能体工作流搭建实训'
        }
      ],
      courseAdjustments: [],
      trainingAdditions: [],
      resourceRecommendations: [],
      deliveryTimeline: []
    },
    refreshing: {
      message: '正在同步招聘数据与行业动态，请稍候...'
    },
    empty: {
      title: '开始生成专业改进建议',
      cta: '开始分析'
    },
    warning: {
      warningFlags: ['岗位样本不足', '课程映射未补全']
    }
  }
} as const
```

- [ ] **Step 4: Run the mock-data test to verify it passes**

Run:

```bash
npm test -- tests/decision-center-data.test.mjs
```

Expected:

- PASS for all tests in `tests/decision-center-data.test.mjs`

- [ ] **Step 5: Commit the data-model slice**

```bash
git add tests/decision-center-data.test.mjs src/mock/decision-center.ts
git commit -m "feat: add decision center improvement page mock model"
```

### Task 2: Add the Dedicated Vue Improvement Page Branch

**Files:**
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-vue.test.mjs`
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/App.vue`
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/styles.css`

- [ ] **Step 1: Write the failing Vue structure test**

```js
test('app renders a dedicated improvement report layout instead of the generic placeholder page', () => {
  for (const pattern of [
    /decisionImprovementPage/,
    /activeDecisionPage === 'improvement'/,
    /decision-improvement-page/,
    /decision-improvement-hero/,
    /decision-improvement-matrix/,
    /decision-improvement-actions/,
    /decision-improvement-timeline/,
    /decisionImprovementState/
  ]) {
    assert.match(appVue, pattern)
  }
})
```

- [ ] **Step 2: Run the Vue test to verify it fails**

Run:

```bash
npm test -- tests/decision-center-vue.test.mjs
```

Expected:

- FAIL on the new improvement-layout test
- Failure mentions missing `decisionImprovementPage` or `decision-improvement-page`

- [ ] **Step 3: Add the minimal Vue state/computed wiring**

```ts
const decisionImprovementState = ref<'default' | 'refreshing' | 'empty' | 'warning'>('default')

const activeDecisionImprovementState = computed(() => decisionImprovementPage.states[decisionImprovementState.value])
const isDecisionImprovementPage = computed(() => activeDecisionPage.value === 'improvement')
```

- [ ] **Step 4: Add the dedicated improvement-page template branch**

```vue
<template v-else-if="activeDecisionPage === 'improvement'">
  <section class="decision-improvement-page">
    <header class="decision-improvement-header">
      <div>
        <span>专业质量监控</span>
        <h2>{{ decisionImprovementPage.headerMeta.title }}</h2>
        <p>{{ decisionImprovementPage.headerMeta.summary }}</p>
      </div>
      <div class="decision-improvement-meta">
        <article v-for="item in decisionImprovementPage.headerMeta.meta" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </div>
    </header>
  </section>
</template>
```

- [ ] **Step 5: Fill the Vue branch with the full layout**

```vue
<section class="decision-improvement-hero">
  <article v-for="signal in activeDecisionImprovementState.heroSignals" :key="signal.label" class="decision-improvement-signal">
    <span>{{ signal.label }}</span>
    <strong>{{ signal.value }}</strong>
    <p>{{ signal.note }}</p>
  </article>
</section>

<article class="decision-improvement-headline">
  <strong>本轮核心判断</strong>
  <p>{{ activeDecisionImprovementState.headlineSummary }}</p>
</article>

<section class="decision-improvement-matrix">
  <header>
    <span>重矩阵证据区</span>
    <h3>岗位 / 技术到课程整改映射</h3>
  </header>
</section>
```

- [ ] **Step 6: Add the matching CSS rules**

```css
.decision-improvement-page {
  display: grid;
  gap: 24px;
}

.decision-improvement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  text-align: left;
}

.decision-improvement-matrix {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(126, 156, 255, 0.22);
}
```

- [ ] **Step 7: Run the Vue test to verify it passes**

Run:

```bash
npm test -- tests/decision-center-vue.test.mjs
```

Expected:

- PASS for all tests in `tests/decision-center-vue.test.mjs`

- [ ] **Step 8: Commit the Vue slice**

```bash
git add tests/decision-center-vue.test.mjs src/App.vue src/styles.css
git commit -m "feat: add decision center improvement vue page"
```

### Task 3: Mirror the Dedicated Improvement Page in Static Fallback

**Files:**
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-static.test.mjs`
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/index.html`

- [ ] **Step 1: Write the failing static fallback test**

```js
test('static fallback defines a dedicated improvement page renderer and report tokens', () => {
  for (const pattern of [
    /decisionImprovementPage/,
    /renderDecisionImprovement/,
    /decision-improvement-page/,
    /decision-improvement-matrix/,
    /正在同步招聘数据与行业动态，请稍候/,
    /开始生成专业改进建议/,
    /岗位样本不足/
  ]) {
    assert.match(staticHtml, pattern)
  }
})
```

- [ ] **Step 2: Run the static test to verify it fails**

Run:

```bash
npm test -- tests/decision-center-static.test.mjs
```

Expected:

- FAIL on the dedicated improvement-page static test
- Failure mentions missing `renderDecisionImprovement` or `decisionImprovementPage`

- [ ] **Step 3: Add the minimal static data object and route**

```js
const decisionImprovementPage = {
  headerMeta: { title: '专业改进建议' },
  states: {
    default: { heroSignals: [], evidenceMatrix: [] },
    refreshing: { message: '正在同步招聘数据与行业动态，请稍候...' },
    empty: { title: '开始生成专业改进建议', cta: '开始分析' },
    warning: { warningFlags: ['岗位样本不足'] }
  }
}
```

```js
if (activeDecisionPage === 'improvement') {
  app.innerHTML = renderDecisionImprovement()
  return
}
```

- [ ] **Step 4: Implement the static dedicated renderer**

```js
const renderDecisionImprovement = () => {
  const state = decisionImprovementPage.states.decisionImprovementState || decisionImprovementPage.states.default
  return renderDecisionFrame(`
    <section class="decision-improvement-page">
      <header class="decision-improvement-header">
        <div>
          <span>专业质量监控</span>
          <h2>${decisionImprovementPage.headerMeta.title}</h2>
        </div>
      </header>
    </section>
  `)
}
```

- [ ] **Step 5: Add the full static HTML and CSS hooks**

```js
<section class="decision-improvement-matrix">
  ${state.evidenceMatrix.map((row) => `
    <article class="decision-improvement-row">
      <span>${row.trend}</span>
      <span>${row.ability}</span>
      <span>${row.courses}</span>
      <span>${row.gap}</span>
      <span>${row.action}</span>
      <span>${row.training}</span>
    </article>
  `).join('')}
</section>
```

- [ ] **Step 6: Run the static test to verify it passes**

Run:

```bash
npm test -- tests/decision-center-static.test.mjs
```

Expected:

- PASS for all tests in `tests/decision-center-static.test.mjs`

- [ ] **Step 7: Commit the static fallback slice**

```bash
git add tests/decision-center-static.test.mjs index.html
git commit -m "feat: add decision center improvement static page"
```

### Task 4: Finish State Wiring, Cross-Path Consistency, and Verification

**Files:**
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/App.vue`
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/index.html`
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/mock/decision-center.ts`
- Modify: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/src/styles.css`
- Test: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-data.test.mjs`
- Test: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-vue.test.mjs`
- Test: `/Users/liuhongzhe/Documents/专业建设/major-construction-platform/tests/decision-center-static.test.mjs`

- [ ] **Step 1: Add any final state controls and filters only after all three dedicated tests are green**

```ts
const decisionImprovementFilters = reactive({
  trend: '全部',
  technology: '全部',
  courseType: '全部',
  priority: '全部'
})
```

- [ ] **Step 2: Wire the same state vocabulary across Vue and static fallback**

```ts
type DecisionImprovementState = 'default' | 'refreshing' | 'empty' | 'warning'
```

```js
let decisionImprovementState = 'default'
```

- [ ] **Step 3: Run the focused decision-center test suite**

Run:

```bash
npm test -- tests/decision-center-data.test.mjs tests/decision-center-vue.test.mjs tests/decision-center-static.test.mjs
```

Expected:

- PASS for all decision-center data / Vue / static tests

- [ ] **Step 4: Run the production build**

Run:

```bash
npm run build
```

Expected:

- Vite build completes successfully
- No TypeScript build errors

- [ ] **Step 5: Manually verify the visual path**

Check in browser:

```text
1. Open the local page and enter 决策中心
2. Click 专业质量监控 → 专业改进建议
3. Confirm the header is left-aligned
4. Confirm the hero signal cards are visible
5. Confirm the heavy evidence matrix is present
6. Confirm the three action panels and delivery timeline are visible
7. Confirm the page still matches the decision-center visual system
```

- [ ] **Step 6: Commit the final verified integration**

```bash
git add src/mock/decision-center.ts src/App.vue src/styles.css index.html tests/decision-center-data.test.mjs tests/decision-center-vue.test.mjs tests/decision-center-static.test.mjs
git commit -m "feat: redesign decision center improvement page"
```

## Self-Review

- Spec coverage: this plan covers header realignment, signal-board first screen, heavy evidence matrix, three action panels, delivery timeline, and all four required states.
- Placeholder scan: no `TODO` / `TBD` markers remain; each task names exact files, commands, and target code slices.
- Type consistency: `decisionImprovementPage`, `decisionImprovementState`, `heroSignals`, `evidenceMatrix`, `courseAdjustments`, `trainingAdditions`, `resourceRecommendations`, `deliveryTimeline`, and `warningFlags` are used consistently across tasks.
