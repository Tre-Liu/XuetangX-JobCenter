# Hot Job Abilities and Talent-Plan Empty State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit industry-segment labels, data-backed expandable job abilities, and a reversible no-talent-plan demo state to the hot-job analysis modal in both Vue and static builds, then merge the same rules into the DingTalk requirements document.

**Architecture:** Extend the existing `AiHotJob` domain model with industry-segment and ability records, and keep pagination plus ability aggregation in the existing small helper module. Vue uses reactive state and computed values; `index.html` mirrors those states with delegated events and rerender helpers. Both render paths use the same Chinese copy and module boundaries, while CSS provides shared visuals.

**Tech Stack:** Vue 3 Composition API, TypeScript, static HTML/JavaScript fallback, CSS, Node test runner, Vite, Chrome-controlled DingTalk editor.

## Global Constraints

- Keep Vue and `index.html` static-demo behavior and copy aligned.
- Do not display recruitment counts or company counts on job cards.
- Do not infer missing industry segments from job names; use `产业环节：待确认` for missing confirmed data.
- Core ability count is derived from all selected jobs by unique ability `id`, never hard-coded and never limited to the visible job page.
- Default demo state is `模拟：已有人培方案`; reopening the modal resets to that state.
- The no-plan copy is exactly `没有人才培养方案数据，请先导入人才培养方案`.
- Only these six modules become empty states: 培养目标对比分析、新增目标建议、毕业要求比对分析、新增毕业要求建议、课程支撑度明细、新增课程建议.
- Do not add upload, parsing, or real talent-plan import behavior in this iteration.
- Preserve existing unrelated untracked files and local changes.

---

### Task 1: Extend the hot-job data contract and ability aggregation

**Files:**
- Modify: `src/app/ai-hot-jobs.ts`
- Modify: `src/mock/decision-center.ts`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Produces: `AiHotJobAbility` with `id`, `name`, `type`, `description`, `tasks`, and `source`.
- Produces: `AiHotJob.industrySegment: string` and `AiHotJob.abilities: AiHotJobAbility[]`.
- Produces: `getAiHotJobAbilityCount(jobs: readonly AiHotJob[]): number` for all-job de-duplication by ability ID.
- Consumes: existing `AiHotJob` arrays and pagination without changing `getAiHotJobPage` behavior.

- [ ] **Step 1: Write the failing domain-data test**

Add an async test that imports the helper and mock data, then checks the explicit segments, nonempty details, and de-duplicated count:

```js
test('hot jobs expose confirmed industry segments and data-backed abilities', async () => {
  const { getAiHotJobAbilityCount } = await import('../src/app/ai-hot-jobs.ts')
  const { aiHotJobAnalysisAdvice } = await import('../src/mock/decision-center.ts')

  assert.equal(aiHotJobAnalysisAdvice.hotJobs.length, 8)
  for (const job of aiHotJobAnalysisAdvice.hotJobs) {
    assert.ok(job.industrySegment)
    assert.ok(job.abilities.length >= 3)
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
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run: `node --test --test-name-pattern="confirmed industry segments" tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL because `industrySegment`, `abilities`, or `getAiHotJobAbilityCount` is missing.

- [ ] **Step 3: Add the domain types and aggregation helper**

Add this contract to `src/app/ai-hot-jobs.ts` and extend `AiHotJob`:

```ts
export type AiHotJobAbility = {
  id: string
  name: string
  type: '知识' | '技能' | '素养'
  description: string
  tasks: string[]
  source: string
}

export type AiHotJob = {
  name: string
  industryChain: string
  stage: '上游' | '中游' | '下游'
  industrySegment: string
  abilities: AiHotJobAbility[]
  recruitmentCount?: number
  companyCount?: number
  selectionType: 'market' | 'representative'
  tone: 'blue' | 'purple' | 'cyan'
}

export const getAiHotJobAbilityCount = (jobs: readonly AiHotJob[]) =>
  new Set(jobs.flatMap((job) => job.abilities.map((ability) => ability.id))).size
```

- [ ] **Step 4: Populate the eight selected jobs from their stored job duties**

Use these confirmed segment mappings:

| Jobs | Stage | Industry segment |
| --- | --- | --- |
| 机器学习工程师、深度学习工程师 | 上游 | 数据、算力与模型基础 |
| 算法工程师、机器视觉工程师、自然语言处理、语音识别工程师 | 中游 | 智能感知、语音视觉与平台工具 |
| 智能驾驶工程师、智能驾驶测试工程师 | 下游 | 行业智能化应用与 AI 服务 |

Each job receives at least three ability records derived from its duties. Reuse the same ability ID only when the ability meaning is the same across roles. The exact job-specific coverage is:

| Job | Required ability meanings |
| --- | --- |
| 算法工程师 | 算法方案设计、训练数据处理、模型评估优化、工程部署协同 |
| 机器视觉工程师 | 图像预处理、视觉模型训练、相机与光源适配、视觉结果评估 |
| 机器学习工程师 | 特征工程、机器学习建模、模型验证调优、训练数据处理 |
| 自然语言处理 | 文本语料处理、语义分析、NLP 模型训练、模型效果评估 |
| 深度学习工程师 | 深度网络设计、训练优化、框架工程化、模型验证调优 |
| 语音识别工程师 | 音频信号处理、语音识别建模、解码与效果优化、语音数据处理 |
| 智能驾驶工程师 | 环境感知与融合、规划控制、车载系统集成、道路场景验证 |
| 智能驾驶测试工程师 | 测试场景设计、测试数据采集分析、安全性能评估、缺陷跟踪复测 |

Set `source` to a traceable form such as `来源：标准岗位“算法工程师”的岗位职责与工作任务` and use concrete task arrays rather than generic fillers.

- [ ] **Step 5: Run the focused test and confirm green**

Run: `node --test --test-name-pattern="confirmed industry segments" tests/ai-smart-construction-suggestion.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit the domain change**

```bash
git add major-construction-platform/src/app/ai-hot-jobs.ts major-construction-platform/src/mock/decision-center.ts major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: add data-backed hot job abilities"
```

---

### Task 2: Render industry segments and expandable abilities in Vue

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/90-decision.css`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: `getAiHotJobAbilityCount()` and every job's `industrySegment` plus `abilities`.
- Produces: Vue state `aiJobAbilitiesExpanded` and `expandedAiJobAbilityIds`.
- Produces: click targets with `aria-expanded` for the metric and each ability row.

- [ ] **Step 1: Write failing Vue markup tests**

Add assertions for:

```js
assert.match(appVue, /产业环节：\s*\{\{ job\.industrySegment \}\}/)
assert.match(appVue, /getAiHotJobAbilityCount\(activeAiAnalysis\.value\.hotJobs\)/)
assert.match(appVue, /aria-expanded="aiJobAbilitiesExpanded"/)
assert.match(appVue, /@click="aiJobAbilitiesExpanded = !aiJobAbilitiesExpanded"/)
assert.match(appVue, /v-for="ability in job\.abilities"/)
assert.match(appVue, /典型工作任务/)
assert.match(appVue, /能力来源/)
```

- [ ] **Step 2: Run the focused Vue test and confirm red**

Run: `node --test --test-name-pattern="expandable job abilities" tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL because the interactive ability panel does not exist.

- [ ] **Step 3: Add Vue reactive state and reset behavior**

Import `getAiHotJobAbilityCount`, then add:

```ts
const aiJobAbilitiesExpanded = ref(false)
const expandedAiJobAbilityIds = ref<string[]>([])
const aiHotJobAbilityCount = computed(() =>
  activeAiAnalysis.value ? getAiHotJobAbilityCount(activeAiAnalysis.value.hotJobs) : 0,
)
const toggleAiJobAbility = (abilityId: string) => {
  expandedAiJobAbilityIds.value = expandedAiJobAbilityIds.value.includes(abilityId)
    ? expandedAiJobAbilityIds.value.filter((id) => id !== abilityId)
    : [...expandedAiJobAbilityIds.value, abilityId]
}
```

Reset both expansion states when the analysis opens or closes.

- [ ] **Step 4: Render the explicit industry-segment row**

Immediately after the existing chain/stage row, add:

```vue
<span class="ai-analysis-job-segment">产业环节：{{ job.industrySegment || '待确认' }}</span>
```

- [ ] **Step 5: Make only the ability metric interactive**

Render the ability metric as a native button containing `${aiHotJobAbilityCount}项`, label, and a visible `展开能力详情/收起能力详情` hint. Keep the remaining three metrics as noninteractive articles.

Below the metrics, conditionally render `.ai-analysis-abilities` grouped by all `activeAiAnalysis.hotJobs`. For each ability, render a button with ability name/type and `aria-expanded`; its detail contains `description`, a “典型工作任务” list, and “能力来源”.

- [ ] **Step 6: Add shared visual styles**

Add styles for:

```css
.ai-analysis-job-segment { display: block; white-space: normal; color: #60789f; }
.ai-analysis-metric-button { width: 100%; border: 0; background: transparent; cursor: pointer; }
.ai-analysis-abilities { padding: 28px 32px; border-radius: 14px; background: #f8fbff; }
.ai-analysis-ability-group { border: 1px solid #dce8fa; border-radius: 12px; }
.ai-analysis-ability-toggle { width: 100%; text-align: left; }
.ai-analysis-ability-detail { padding: 0 18px 18px; color: #526b91; }
```

Include `:focus-visible` and reduced-motion-compatible states. Do not truncate the industry-segment text.

- [ ] **Step 7: Run the focused test and confirm green**

Run: `node --test --test-name-pattern="expandable job abilities" tests/ai-smart-construction-suggestion.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit the Vue interaction**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/src/styles/90-decision.css major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: expand hot job ability details"
```

---

### Task 3: Add the reversible no-talent-plan state in Vue

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/90-decision.css`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Produces: `aiTalentPlanAvailable: Ref<boolean>` defaulting to `true`.
- Produces: six module-local empty states using the exact shared message.
- Preserves: job cards, abilities, tabs, pagination, and unlisted analysis modules.

- [ ] **Step 1: Write the failing no-plan Vue tests**

Add assertions that require the state, demo switch, exact message, and six guarded modules:

```js
assert.match(appVue, /const aiTalentPlanAvailable = ref\(true\)/)
assert.match(appVue, /模拟：\{\{ aiTalentPlanAvailable \? '已有人培方案' : '无人培方案' \}\}/)
assert.match(appVue, /没有人才培养方案数据，请先导入人才培养方案/)
for (const title of ['培养目标对比分析', '新增目标建议', '毕业要求比对分析', '新增毕业要求建议', '课程支撑度明细', '新增课程建议']) {
  assert.match(appVue, new RegExp(`${title}[\\s\\S]*aiTalentPlanAvailable`))
}
```

- [ ] **Step 2: Run the focused no-plan test and confirm red**

Run: `node --test --test-name-pattern="no-talent-plan" tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL because the switch and empty states do not exist.

- [ ] **Step 3: Add state, switch, and reset behavior**

Add `const aiTalentPlanAvailable = ref(true)`. Render the fixed control inside the modal section but outside `.ai-analysis-modal-page`:

```vue
<button
  class="ai-analysis-plan-simulator"
  type="button"
  :aria-pressed="!aiTalentPlanAvailable"
  @click="aiTalentPlanAvailable = !aiTalentPlanAvailable"
>
  模拟：{{ aiTalentPlanAvailable ? '已有人培方案' : '无人培方案' }}
</button>
```

Reset the state to `true` whenever the analysis opens or closes.

- [ ] **Step 4: Guard exactly six modules**

Keep each existing module heading visible. Under each heading, use `v-if="aiTalentPlanAvailable"` for existing content and `v-else` for:

```vue
<div class="ai-analysis-plan-empty" role="status">
  <strong>没有人才培养方案数据</strong>
  <span>请先导入人才培养方案</span>
</div>
```

Change the heading copy from `毕业要求对比分析` to the requested `毕业要求比对分析` in both render paths and tests. Do not guard 岗位能力维度对比 or 岗位能力支撑度.

- [ ] **Step 5: Style the fixed switch and consistent empty state**

Anchor `.ai-analysis-plan-simulator` to the modal's lower-left safe area with `position: fixed` or equivalent modal-relative placement matching the reference. Style `.ai-analysis-plan-empty` as a centered, non-error informational state with enough height to replace the hidden module content. Add focus-visible styling and avoid covering the modal scroll bar.

- [ ] **Step 6: Run the focused test and confirm green**

Run: `node --test --test-name-pattern="no-talent-plan" tests/ai-smart-construction-suggestion.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit the Vue no-plan behavior**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/src/styles/90-decision.css major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: simulate missing talent plan"
```

---

### Task 4: Mirror data and interactions in the static demo

**Files:**
- Modify: `index.html`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: the same eight jobs, industry segments, ability records, and exact copy as the Vue mock.
- Produces: `staticAiTalentPlanAvailable`, `staticAiJobAbilitiesExpanded`, and `staticExpandedAiJobAbilityIds`.
- Produces: delegated event targets `data-ai-toggle-abilities`, `data-ai-job-ability-id`, and `data-ai-toggle-talent-plan`.

- [ ] **Step 1: Write failing static parity tests**

Require the static source to contain each segment name, the three state variables/data attributes, the exact no-plan message, and the six module headings. Also require that static job cards render `产业环节：${...}` and ability details render `典型工作任务` plus `能力来源`.

- [ ] **Step 2: Run the focused static test and confirm red**

Run: `node --test --test-name-pattern="static hot-job parity" tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL because the static fallback has no segment, ability accordion, or no-plan state.

- [ ] **Step 3: Mirror the data snapshot and ability count**

Copy the exact `industrySegment` and `abilities` arrays from `aiHotJobAnalysisAdvice` into `staticAiHotJobAnalysisAdvice`. Add a static count helper that de-duplicates every job's ability IDs and use it only for the first metric value.

- [ ] **Step 4: Render the segment and ability panel**

Extend `staticAiHotJobsHtml()` with the explicit industry-segment row. Add `staticAiAbilitiesHtml(advice)` that renders all eight role groups, ability toggle buttons, details for expanded IDs, and source text. Make the first metric a `data-ai-toggle-abilities` button with `aria-expanded` and keep the other metrics as articles.

- [ ] **Step 5: Implement the static no-plan switch and module guards**

Add the left-bottom `data-ai-toggle-talent-plan` button. In `staticAiAnalysisReportHtml(advice)`, render the shared empty-state markup for exactly the six specified modules when `staticAiTalentPlanAvailable` is false. Preserve the two course-side raw ability charts.

- [ ] **Step 6: Add delegated event updates and reset behavior**

In the app click handler:

```js
const abilityPanel = app.querySelector('[data-ai-abilities-panel]')
const analysisMetrics = app.querySelector('[data-ai-analysis-metrics]')
const analysisReport = app.querySelector('.ai-analysis-tab-panel')

if (target.closest('[data-ai-toggle-abilities]')) {
  staticAiJobAbilitiesExpanded = !staticAiJobAbilitiesExpanded
  if (analysisMetrics) analysisMetrics.outerHTML = staticAiMetricsHtml(staticAiHotJobAnalysisAdvice)
  if (abilityPanel) abilityPanel.outerHTML = staticAiAbilitiesHtml(staticAiHotJobAnalysisAdvice)
  return
}

const abilityButton = target.closest('[data-ai-job-ability-id]')
if (abilityButton) {
  const abilityId = abilityButton.dataset.aiJobAbilityId
  staticExpandedAiJobAbilityIds.has(abilityId)
    ? staticExpandedAiJobAbilityIds.delete(abilityId)
    : staticExpandedAiJobAbilityIds.add(abilityId)
  if (abilityPanel) abilityPanel.outerHTML = staticAiAbilitiesHtml(staticAiHotJobAnalysisAdvice)
  return
}

if (target.closest('[data-ai-toggle-talent-plan]')) {
  staticAiTalentPlanAvailable = !staticAiTalentPlanAvailable
  const simulator = app.querySelector('[data-ai-plan-simulator]')
  if (simulator) simulator.outerHTML = staticAiPlanSimulatorHtml()
  if (analysisReport) analysisReport.outerHTML = staticAiAnalysisReportHtml(staticAiHotJobAnalysisAdvice)
  return
}
```

Reset all three states inside `openStaticAiAnalysis()` and `closeStaticAiAnalysis()` so reopening starts with a plan and collapsed abilities.

- [ ] **Step 7: Run the static parity test and confirm green**

Run: `node --test --test-name-pattern="static hot-job parity" tests/ai-smart-construction-suggestion.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit static parity**

```bash
git add major-construction-platform/index.html major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: mirror hot job demo states"
```

---

### Task 5: Verify behavior, layout, and production build

**Files:**
- Modify if a defect is found: `src/App.vue`
- Modify if a defect is found: `index.html`
- Modify if a defect is found: `src/styles/90-decision.css`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: completed Vue/static implementations.
- Produces: evidence that automated tests, type checks, build, and visible interactions pass.

- [ ] **Step 1: Run focused tests**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: all tests in the file PASS.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`

Expected: zero failing tests.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: `vue-tsc`, Vite build, and worker build complete successfully.

- [ ] **Step 4: Perform browser interaction checks**

Open the existing `index.html?tab=chain&reportView=create&professionalTab=map&view=job-industry` demo and verify:

1. Each job card shows full industry segment text.
2. Clicking 岗位核心能力 expands all eight role groups; clicking an ability displays definition, tasks, and source.
3. The displayed ability count equals the de-duplicated data count and does not change on page 2.
4. The bottom-left simulator toggles to 无人培方案 without moving tabs or pages.
5. The exact six modules show the import prompt while raw job ability charts remain visible.
6. Toggling back restores content; closing/reopening restores the default plan state and collapsed ability panel.

- [ ] **Step 5: Fix only observed defects and rerun the relevant checks**

Use `apply_patch` for source fixes. Rerun the focused test, full suite, build, and the exact browser path that exposed the defect.

- [ ] **Step 6: Commit verification fixes if any**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/90-decision.css major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "fix: polish hot job analysis states"
```

---

### Task 6: Merge the approved behavior into the DingTalk requirements document

**Files:**
- External document: DingTalk 《热门岗位分析建议》 at `https://alidocs.dingtalk.com/i/nodes/oP0MALyR8k79EjOpUYG350jK83bzYmDO`

**Interfaces:**
- Consumes: verified demo behavior and exact copy.
- Produces: updated existing requirement sections without a detached addendum.

- [ ] **Step 1: Re-open and inspect the current DingTalk document**

Use the claimed Chrome tab and locate the existing 热门岗位总览、岗位能力分析、三类分析页签、Demo、验收标准 sections before editing.

- [ ] **Step 2: Update the existing sections in place**

Merge these requirements:

- 热门岗位卡片增加完整产业环节，字段来自 confirmed 岗位—产业节点关联。
- 岗位核心能力来自对应岗位职责/工作任务，按 ID 去重计数，支持岗位分组和单项展开。
- Demo 左下角双态开关默认“已有人培方案”，可切换“无人培方案”。
- 六个指定模块在无人培时保留标题并显示 exact copy；其他岗位侧分析继续展示。
- 重新打开浮窗重置为已有人培且能力收起。

- [ ] **Step 3: Add acceptance criteria to section 12**

Add explicit pass/fail checks for industry-segment display, traceable ability details, de-duplicated count, keyboard-accessible expansion, exact six empty states, toggle reversibility, and reset behavior.

- [ ] **Step 4: Re-read the edited document and verify scope placement**

Confirm the content is integrated into the current-period scope, terminology uses `毕业要求比对分析`, no detached supplemental chapter was added, and all six empty-state modules use the exact message.

- [ ] **Step 5: Report final evidence**

Return the demo files changed, test/build results, commit IDs, and confirmation that the DingTalk document was updated in place.
