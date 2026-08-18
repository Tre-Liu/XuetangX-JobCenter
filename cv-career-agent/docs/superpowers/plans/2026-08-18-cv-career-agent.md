# Computer Vision Career Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, offline Vue application whose multi-entry career agent closes the loop from role analysis through interview diagnosis, growth tasks, and reassessment for junior, intermediate, and senior computer-vision engineers.

**Architecture:** A typed local knowledge base feeds a deterministic intent router and agent orchestrator. All tools read and update one learner profile store, while a single responsive workbench renders conversation, task analysis, capability evidence, radar diagnosis, interview, growth, and history without a forced wizard flow.

**Tech Stack:** Vue 3.5, TypeScript 5.8, Vite 6, ECharts 5, browser localStorage, Node test runner.

**Spec:** `cv-career-agent/docs/2026-08-18-design.md`

## Global Constraints

- The project lives only under `cv-career-agent` and does not import code, styles, or data from existing demos.
- All core flows work with network access disabled and make no API requests.
- The UI uses a graphite, electric-purple, and cyan AI-workbench visual system rather than the existing light education-platform style.
- Users can enter role analysis, capability lookup, level comparison, interview, diagnosis, or growth planning in any order.
- Interview and reassessment update one shared learner profile and immediately change match score, radar data, gaps, and recommendations.
- Every role claim exposes a source file, chapter or section, and verified PDF page when available.
- The first version contains exactly 3 role levels, 7 career functions, 5 scenarios, 18 interview questions, and 12 growth tasks.
- The primary desktop acceptance viewport is 1440 by 900 pixels; a narrow 820-pixel layout must remain usable.

---

## Planned File Structure

```text
cv-career-agent/
  index.html                         Vite entry document
  package.json                       isolated scripts and dependencies
  tsconfig.json                      strict TypeScript project config
  vite.config.ts                     Vue build configuration
  src/
    main.ts                          app bootstrap
    App.vue                          workbench composition only
    styles/
      tokens.css                     palette, spacing, typography tokens
      base.css                       reset, shared states, responsive rules
      workbench.css                  workbench layout and component styling
    domain/
      types.ts                       shared domain contracts
      scoring.ts                     profile and match-score calculations
      intent-router.ts               deterministic intent classification
      orchestrator.ts                tool selection and response assembly
      persistence.ts                 versioned localStorage adapter
    data/
      sources.ts                     source registry and page references
      capabilities.ts                levels, career functions, graph nodes
      scenarios.ts                   five scenario task chains
      interviews.ts                  18 questions and rubrics
      growth-tasks.ts                12 actionable growth tasks
    stores/
      agent-store.ts                 single reactive session/profile store
    components/
      ContextBar.vue                 role, scenario, match score, reset
      AgentConversation.vue          messages, tool traces, suggested actions
      AgentComposer.vue              free text and command shortcuts
      DynamicWorkspace.vue           non-linear result panel router
      TaskAnalysisPanel.vue          task chain and task evidence
      CapabilityPanel.vue            capability graph and evidence drawer
      DiagnosisPanel.vue             radar, gaps, explanation actions
      InterviewPanel.vue             adaptive three-question interview
      GrowthPanel.vue                tasks, completion, reassessment
      EvidencePanel.vue              source traceability
      HistoryPanel.vue               saved reports and profile changes
    tests/
      knowledge.test.ts              data counts and source integrity
      intent-router.test.ts          supported intents and fallback
      scoring.test.ts                weighted match and profile updates
      orchestrator.test.ts           tool plans and suggested actions
      persistence.test.ts            save, restore, and reset behavior
      business-loop.test.ts          interview-to-growth-to-reassessment loop
```

---

### Task 1: Isolated Project Foundation and Knowledge Contracts

**Files:**
- Create: `cv-career-agent/package.json`
- Create: `cv-career-agent/index.html`
- Create: `cv-career-agent/tsconfig.json`
- Create: `cv-career-agent/vite.config.ts`
- Create: `cv-career-agent/src/main.ts`
- Create: `cv-career-agent/src/domain/types.ts`
- Create: `cv-career-agent/src/data/sources.ts`
- Create: `cv-career-agent/src/data/capabilities.ts`
- Create: `cv-career-agent/src/data/scenarios.ts`
- Create: `cv-career-agent/src/data/interviews.ts`
- Create: `cv-career-agent/src/data/growth-tasks.ts`
- Test: `cv-career-agent/src/tests/knowledge.test.ts`

**Interfaces:**
- Produces: `RoleLevel`, `CareerFunction`, `SourceRecord`, `CapabilityNode`, `Scenario`, `InterviewQuestion`, `GrowthTask`, and exported data arrays used by all later tasks.

- [ ] **Step 1: Write the failing knowledge-integrity test**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { roleLevels, careerFunctions, capabilityNodes } from '../data/capabilities'
import { scenarios } from '../data/scenarios'
import { interviewQuestions } from '../data/interviews'
import { growthTasks } from '../data/growth-tasks'
import { sources } from '../data/sources'

test('knowledge base has the approved first-version scope', () => {
  assert.equal(roleLevels.length, 3)
  assert.equal(careerFunctions.length, 7)
  assert.equal(scenarios.length, 5)
  assert.equal(interviewQuestions.length, 18)
  assert.equal(growthTasks.length, 12)
  assert.ok(capabilityNodes.length >= 50 && capabilityNodes.length <= 70)
  assert.ok(sources.every((source) => source.file && source.section))
})
```

- [ ] **Step 2: Run the test and verify missing modules fail**

Run: `cd cv-career-agent && npm test -- src/tests/knowledge.test.ts`  
Expected: FAIL because the domain and data modules do not exist.

- [ ] **Step 3: Create isolated package and strict domain types**

Use these scripts and dependency families in `package.json`:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "test": "node --import tsx --test src/tests/*.test.ts",
    "build": "vue-tsc -b && vite build"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "^5.2.4",
    "echarts": "^5.6.0",
    "vite": "^6.3.5",
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "tsx": "^4.20.3",
    "typescript": "^5.8.3",
    "vue-tsc": "^2.2.10"
  }
}
```

Define these exact discriminators in `types.ts`:

```ts
export type LevelId = 'junior' | 'intermediate' | 'senior'
export type IntentId = 'role-analysis' | 'capability-query' | 'level-compare' | 'interview' | 'diagnosis' | 'growth-plan' | 'explain' | 'fallback'
export type WorkspacePanel = 'tasks' | 'capabilities' | 'diagnosis' | 'interview' | 'growth' | 'evidence' | 'history'
export interface EvidenceRef { sourceId: string; section: string; pdfPage?: number; printedPage?: number }
export interface LearnerProfile { level: LevelId; targetLevel: LevelId; scenarioId: string; scores: Record<string, number>; interviewCount: number; completedTaskIds: string[] }
```

- [ ] **Step 4: Populate source-backed knowledge data**

Create three levels, seven functions, five scenarios, 50-70 capability nodes, 18 questions, and 12 tasks. Use national-standard PDF pages 32-39 for level requirements, page 51 for theoretical weights, page 56 for professional ability weights, and page 58 for the career-direction definition. Attach at least one `EvidenceRef` to every task, capability node, interview rubric, and growth task.

- [ ] **Step 5: Run integrity test and build**

Run: `cd cv-career-agent && npm test -- src/tests/knowledge.test.ts`  
Expected: PASS with exact approved counts.  
Run: `cd cv-career-agent && npm run build`  
Expected: PASS with a generated `dist` directory.

- [ ] **Step 6: Commit the foundation**

```bash
git add cv-career-agent
git commit -m "feat: scaffold offline cv career agent knowledge base"
```

---

### Task 2: Intent Router, Scoring, Persistence, and Orchestrator

**Files:**
- Create: `cv-career-agent/src/domain/intent-router.ts`
- Create: `cv-career-agent/src/domain/scoring.ts`
- Create: `cv-career-agent/src/domain/persistence.ts`
- Create: `cv-career-agent/src/domain/orchestrator.ts`
- Test: `cv-career-agent/src/tests/intent-router.test.ts`
- Test: `cv-career-agent/src/tests/scoring.test.ts`
- Test: `cv-career-agent/src/tests/orchestrator.test.ts`
- Test: `cv-career-agent/src/tests/persistence.test.ts`

**Interfaces:**
- Consumes: data arrays and types from Task 1.
- Produces: `routeIntent(text: string, context: AgentContext): IntentResult`, `calculateMatch(profile: LearnerProfile, target: RoleLevel): MatchResult`, `applyScoreDelta(profile: LearnerProfile, delta: ScoreDelta[]): LearnerProfile`, `planAgentTurn(input: AgentInput): AgentTurnPlan`, and versioned `loadSession`/`saveSession`/`clearSession`.

- [ ] **Step 1: Write intent and fallback tests**

```ts
test('routes interview language without requiring a wizard state', () => {
  assert.equal(routeIntent('直接给我做一次中级面试', baseContext).intent, 'interview')
})

test('returns helpful fallback actions', () => {
  const result = routeIntent('帮我看看这个', baseContext)
  assert.equal(result.intent, 'fallback')
  assert.equal(result.suggestedPanels.length, 3)
})
```

- [ ] **Step 2: Write weighted-score and immutable-update tests**

```ts
test('profile update changes only mapped capabilities', () => {
  const next = applyScoreDelta(profile, [{ capabilityId: 'cv-model-validation', delta: 8, reason: 'interview' }])
  assert.equal(next.scores['cv-model-validation'], profile.scores['cv-model-validation'] + 8)
  assert.notEqual(next, profile)
})
```

- [ ] **Step 3: Write orchestrator plan test**

```ts
test('diagnosis plan always returns evidence and a next action', () => {
  const plan = planAgentTurn({ text: '为什么我的部署能力只有62分', context, profile })
  assert.equal(plan.intent, 'explain')
  assert.ok(plan.toolCalls.includes('evidence.lookup'))
  assert.ok(plan.actions.length > 0)
})
```

- [ ] **Step 4: Run the new tests and verify failures**

Run: `cd cv-career-agent && npm test -- src/tests/intent-router.test.ts src/tests/scoring.test.ts src/tests/orchestrator.test.ts src/tests/persistence.test.ts`  
Expected: FAIL because the four domain modules are missing.

- [ ] **Step 5: Implement deterministic routing and scoring**

Use ordered intent rules so explicit commands win over broad keywords. Clamp capability scores to 0-100. Calculate match as the weighted sum of current score divided by the weighted target threshold, capped at 100. Return `confidence`, `toolCalls`, `responseBlocks`, `actions`, `panel`, and evidence IDs from every orchestrator plan.

- [ ] **Step 6: Implement versioned persistence**

Store a `SessionSnapshot` under `cv-career-agent:v1`. Parse defensively, reject an unknown `schemaVersion`, and return the documented initial session on corruption. `clearSession()` must remove only this key.

- [ ] **Step 7: Run domain tests**

Run: `cd cv-career-agent && npm test`  
Expected: All Task 1 and Task 2 tests PASS.

- [ ] **Step 8: Commit the agent engine**

```bash
git add cv-career-agent/src/domain cv-career-agent/src/tests
git commit -m "feat: add local agent routing and profile engine"
```

---

### Task 3: Shared Agent Store and Non-Linear Business Loop

**Files:**
- Create: `cv-career-agent/src/stores/agent-store.ts`
- Test: `cv-career-agent/src/tests/business-loop.test.ts`

**Interfaces:**
- Consumes: Task 2 orchestrator, scoring, and persistence functions.
- Produces: `useAgentStore()` with `state`, `send`, `selectLevel`, `selectScenario`, `openPanel`, `startInterview`, `submitInterviewAnswer`, `assignGrowthTask`, `completeGrowthTask`, `runReassessment`, and `resetDemo`.

- [ ] **Step 1: Write the complete loop test**

```ts
test('interview diagnosis, growth completion, and reassessment share one profile', () => {
  const store = createAgentStore(createInitialSession())
  store.startInterview('intermediate')
  store.submitInterviewAnswer('先按业务指标建立验证集，再比较准确率、召回率和推理时延。')
  const afterInterview = store.state.profile.scores['cv-model-validation']
  store.assignGrowthTask('growth-validation-benchmark')
  store.completeGrowthTask('growth-validation-benchmark')
  store.runReassessment('growth-validation-benchmark', true)
  assert.ok(store.state.profile.scores['cv-model-validation'] > afterInterview)
  assert.ok(store.state.history.some((entry) => entry.kind === 'reassessment'))
})
```

- [ ] **Step 2: Run the loop test and verify failure**

Run: `cd cv-career-agent && npm test -- src/tests/business-loop.test.ts`  
Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement one shared reactive state boundary**

Keep domain calculations in pure Task 2 functions. The store owns coordination only: append messages and history, move the active panel, persist after mutations, and enforce that growth score changes occur only after a passed reassessment.

- [ ] **Step 4: Run all tests**

Run: `cd cv-career-agent && npm test`  
Expected: All tests PASS, including the closed-loop score change.

- [ ] **Step 5: Commit the business loop**

```bash
git add cv-career-agent/src/stores cv-career-agent/src/tests/business-loop.test.ts
git commit -m "feat: close interview growth and reassessment loop"
```

---

### Task 4: Workbench Shell and Multi-Entry Conversation UI

**Files:**
- Create: `cv-career-agent/src/App.vue`
- Create: `cv-career-agent/src/components/ContextBar.vue`
- Create: `cv-career-agent/src/components/AgentConversation.vue`
- Create: `cv-career-agent/src/components/AgentComposer.vue`
- Create: `cv-career-agent/src/components/DynamicWorkspace.vue`
- Create: `cv-career-agent/src/styles/tokens.css`
- Create: `cv-career-agent/src/styles/base.css`
- Create: `cv-career-agent/src/styles/workbench.css`
- Modify: `cv-career-agent/src/main.ts`

**Interfaces:**
- Consumes: `useAgentStore()` from Task 3.
- Produces: a single workbench with level/scenario context, free-text entry, six quick capabilities, visible tool traces, and independent workspace tabs.

- [ ] **Step 1: Add static UI contract assertions**

Extend `business-loop.test.ts` with source checks that `App.vue` contains `ContextBar`, `AgentConversation`, `AgentComposer`, and `DynamicWorkspace`, and that the composer exposes quick actions for role analysis, interview, diagnosis, and growth.

- [ ] **Step 2: Run the test and verify failure**

Run: `cd cv-career-agent && npm test -- src/tests/business-loop.test.ts`  
Expected: FAIL because the Vue components do not exist.

- [ ] **Step 3: Implement the shell and direct entry points**

Compose the four components in `App.vue`. Do not add a numbered stepper. Level and scenario selectors update context globally. Quick actions call the same `send()` path as free text. Workspace tabs remain directly clickable at all times.

- [ ] **Step 4: Apply the new visual system**

Define exact tokens: `--surface-0: #080b12`, `--surface-1: #111621`, `--surface-2: #171d2a`, `--accent-violet: #8b5cf6`, `--accent-cyan: #22d3ee`, `--text-1: #f5f7fb`, `--text-2: #a8b1c3`. Use a two-column 60/40 layout at 1440×900 and one column below 980 pixels. Respect `prefers-reduced-motion`.

- [ ] **Step 5: Run tests and build**

Run: `cd cv-career-agent && npm test && npm run build`  
Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit the workbench shell**

```bash
git add cv-career-agent/src
git commit -m "feat: build multi-entry agent workbench"
```

---

### Task 5: Dynamic Analysis, Capability, Diagnosis, and Evidence Panels

**Files:**
- Create: `cv-career-agent/src/components/TaskAnalysisPanel.vue`
- Create: `cv-career-agent/src/components/CapabilityPanel.vue`
- Create: `cv-career-agent/src/components/DiagnosisPanel.vue`
- Create: `cv-career-agent/src/components/EvidencePanel.vue`
- Modify: `cv-career-agent/src/components/DynamicWorkspace.vue`
- Modify: `cv-career-agent/src/styles/workbench.css`

**Interfaces:**
- Consumes: active scenario, profile, match result, capability nodes, and evidence refs.
- Produces: clickable task chain, expandable capability relationships, ECharts radar, gap list, and source drawer.

- [ ] **Step 1: Add panel contract checks**

Assert that `DynamicWorkspace.vue` imports all four panels, that evidence actions accept a `sourceId`, and that diagnosis exposes an `explainCapability(capabilityId)` action.

- [ ] **Step 2: Run the contract test and verify failure**

Run: `cd cv-career-agent && npm test`  
Expected: FAIL because the panel components are absent.

- [ ] **Step 3: Implement task and capability exploration**

Render scenario tasks as a selectable chain rather than a forced sequence. Selecting a task reveals inputs, steps, tools, outputs, metrics, related capabilities, and an evidence button. Capability nodes support search and show prerequisites and level expectations.

- [ ] **Step 4: Implement diagnosis and traceability**

Render a five-axis radar for algorithm, data, validation, deployment, and engineering collaboration. List the three largest weighted gaps. Each gap opens an explanation in the conversation and exposes its evidence. If ECharts initialization fails, render five labeled progress bars with the same values.

- [ ] **Step 5: Run tests and build**

Run: `cd cv-career-agent && npm test && npm run build`  
Expected: PASS.

- [ ] **Step 6: Commit analysis panels**

```bash
git add cv-career-agent/src/components cv-career-agent/src/styles/workbench.css
git commit -m "feat: add explainable analysis and diagnosis panels"
```

---

### Task 6: Interview, Growth, Reassessment, and History UI

**Files:**
- Create: `cv-career-agent/src/components/InterviewPanel.vue`
- Create: `cv-career-agent/src/components/GrowthPanel.vue`
- Create: `cv-career-agent/src/components/HistoryPanel.vue`
- Modify: `cv-career-agent/src/components/DynamicWorkspace.vue`
- Modify: `cv-career-agent/src/components/AgentConversation.vue`
- Modify: `cv-career-agent/src/styles/workbench.css`

**Interfaces:**
- Consumes: Task 3 interview, growth, reassessment, and reset actions.
- Produces: adaptive three-question interview, rubric feedback, actionable growth queue, reassessment proof, profile-change timeline, and reset control.

- [ ] **Step 1: Extend loop tests for UI-triggered actions**

Assert that interview submission changes `interviewCount`, failed reassessment leaves scores unchanged, passed reassessment records before/after values, and reset restores the exact initial snapshot.

- [ ] **Step 2: Run tests and verify any missing behavior fails**

Run: `cd cv-career-agent && npm test -- src/tests/business-loop.test.ts`  
Expected: FAIL until all store behaviors used by the UI are present.

- [ ] **Step 3: Implement the adaptive interview**

Show one question at a time, the mapped ability, answer area, and progress. Select the next question from the same level or one level deeper when the current rubric score is at least 75. After three questions, update the profile once and open diagnosis.

- [ ] **Step 4: Implement growth and reassessment**

Allow a gap to create a growth task, show practice steps and acceptance criteria, mark work submitted, then run one evidence-based reassessment. Only a passed reassessment applies the task's declared score delta.

- [ ] **Step 5: Implement history and reset**

Render interview reports, assigned/completed tasks, reassessments, and before/after match scores in reverse chronological order. Reset requires one confirmation click and clears only the project localStorage key.

- [ ] **Step 6: Run tests and build**

Run: `cd cv-career-agent && npm test && npm run build`  
Expected: PASS.

- [ ] **Step 7: Commit the complete product loop**

```bash
git add cv-career-agent/src
git commit -m "feat: complete interview growth and reassessment experience"
```

---

### Task 7: Browser Verification and First-Version Handoff

**Files:**
- Modify as defects require: `cv-career-agent/src/components/*.vue`
- Modify as defects require: `cv-career-agent/src/styles/*.css`
- Create: `cv-career-agent/README.md`

**Interfaces:**
- Consumes: the complete application from Tasks 1-6.
- Produces: verified offline build and concise local run instructions.

- [ ] **Step 1: Run final automated verification**

Run: `cd cv-career-agent && npm test`  
Expected: all tests PASS.  
Run: `cd cv-career-agent && npm run build`  
Expected: TypeScript and Vite build PASS.

- [ ] **Step 2: Start the local app and inspect 1440×900**

Run: `cd cv-career-agent && npm run dev -- --port 4188`  
Open the local URL in the in-app browser. Verify all six entry intents, direct panel navigation, evidence drawers, interview completion, growth assignment, passed reassessment, score change, persistence after reload, and reset.

- [ ] **Step 3: Inspect narrow layout and reduced motion**

At 820 pixels wide, confirm one-column reading order, visible composer, usable tabs, and no horizontal overflow. Emulate reduced motion and verify type/processing effects become immediate or minimal.

- [ ] **Step 4: Fix only observed defects and repeat verification**

For every defect, add or tighten a test where practical, patch the smallest responsible component/style, rerun `npm test` and `npm run build`, and repeat the affected browser flow.

- [ ] **Step 5: Document run commands and project boundaries**

README must state:

```text
npm install
npm run dev
npm test
npm run build
```

It must also state that the project is an offline competition prototype, uses local source-backed data, makes no model API calls, and is independent from the existing professional-construction demos.

- [ ] **Step 6: Commit the verified first version**

```bash
git add cv-career-agent
git commit -m "docs: verify and document cv career agent v1"
```
