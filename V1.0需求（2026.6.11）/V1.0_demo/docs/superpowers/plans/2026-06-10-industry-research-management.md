# Industry Research Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `产业调研` management page with initialization progress, recommended industry chain selection, and manual chain entry.

**Architecture:** Add focused mock data in `src/app/industry-research-management.ts`, wire page state and handlers into `src/App.vue`, add CSS to the existing talent/management styles, and cover the feature with a static Node test. Keep the feature local to the current large-file app pattern.

**Tech Stack:** Vue 3 Composition API, TypeScript, Vite, CSS, Node `node:test`.

---

### Task 1: Feature Contract Test

**Files:**
- Create: `tests/industry-research-management.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const industryResearchData = await readFile(new URL('../src/app/industry-research-management.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('professional construction top tabs expose industry research management', () => {
  assert.match(appVue, /label: '产业调研'/)
  assert.match(appVue, /currentModule === '产业调研'/)
  assert.match(appVue, /openIndustryResearchManagement/)
})

test('industry research management supports initialization progress before recommendations', () => {
  assert.match(appVue, /industryResearchStatus = ref<'idle' \| 'initializing' \| 'ready'>\('idle'\)/)
  assert.match(appVue, /startIndustryResearchInitialization/)
  assert.match(appVue, /setTimeout\(\(\) => \{[\s\S]*industryResearchStatus\.value = 'ready'/)
  assert.match(appVue, /初始化中/)
  assert.match(appVue, /正在根据专业名称、培养方向、岗位资料和已有专业数据生成产业链推荐/)
})

test('industry chain recommendations are shown as selectable list with manual add entry', () => {
  assert.match(industryResearchData, /INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS/)
  for (const chain of ['智能建造产业链', '建筑工业化产业链', '智慧城市基础设施产业链']) {
    assert.match(industryResearchData, new RegExp(chain))
  }
  assert.match(appVue, /自主添加产业链/)
  assert.match(appVue, /v-for="chain in INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS"/)
  assert.match(appVue, /selectIndustryResearchChain\(chain\.id\)/)
  assert.match(appVue, /selectedIndustryResearchChainId === chain\.id/)
})

test('industry research management has dedicated operational styling', () => {
  assert.match(stylesCss, /\.industry-research-management\s*\{/)
  assert.match(stylesCss, /\.industry-chain-row\.selected\s*\{/)
  assert.match(stylesCss, /\.industry-initialization-progress\s*\{/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/industry-research-management.test.mjs`

Expected: fails because `src/app/industry-research-management.ts` or page hooks do not exist.

### Task 2: Mock Data

**Files:**
- Create: `src/app/industry-research-management.ts`

- [ ] **Step 1: Add focused mock data**

```ts
export type IndustryResearchChainRecommendation = {
  id: string
  name: string
  matchScore: number
  stageSummary: string
  reason: string
  evidenceTags: string[]
}

export const INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS: IndustryResearchChainRecommendation[] = [
  {
    id: 'smart-construction',
    name: '智能建造产业链',
    matchScore: 96,
    stageSummary: 'BIM 协同设计、装配式建造、智慧工地、智能检测、数字化运维',
    reason: '与智能建造工程专业的岗位能力、课程体系和区域建设项目数字化转型需求匹配度最高。',
    evidenceTags: ['BIM', '智慧工地', '数字化运维']
  },
  {
    id: 'construction-industrialization',
    name: '建筑工业化产业链',
    matchScore: 88,
    stageSummary: '构件深化设计、预制生产、运输吊装、装配施工、质量验收',
    reason: '覆盖装配式建筑项目的核心工序，适合支撑施工组织、质量检测和项目管理方向调研。',
    evidenceTags: ['装配式建筑', '预制构件', '质量验收']
  },
  {
    id: 'smart-city-infrastructure',
    name: '智慧城市基础设施产业链',
    matchScore: 82,
    stageSummary: '基础设施感知、城市数据平台、工程实施、运营维护、治理服务',
    reason: '可承接城市基础设施数字化建设场景，适合作为专业拓展方向和区域服务能力补充。',
    evidenceTags: ['城市更新', '基础设施', '运营维护']
  }
]
```

- [ ] **Step 2: Run test**

Run: `npm test tests/industry-research-management.test.mjs`

Expected: still fails because Vue page wiring and CSS are missing.

### Task 3: Vue Page Wiring

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Import data and add page state**

Add imports from `./app/industry-research-management`, add `industryResearchStatus`, `selectedIndustryResearchChainId`, `industryResearchTimer`, `openIndustryResearchManagement`, `startIndustryResearchInitialization`, and `selectIndustryResearchChain`.

- [ ] **Step 2: Add top tab and page template**

Add `{ label: '产业调研' }` to the module nav and add a `currentModule === '产业调研'` template with initialization and recommendation list states.

- [ ] **Step 3: Run test**

Run: `npm test tests/industry-research-management.test.mjs`

Expected: still fails only on CSS selectors.

### Task 4: Styling

**Files:**
- Modify: `src/styles/20-talent.css`

- [ ] **Step 1: Add management page CSS**

Add `.industry-research-management`, `.industry-initialization-progress`, `.industry-chain-row`, `.industry-chain-row.selected`, and supporting classes for compact operational layout.

- [ ] **Step 2: Run targeted test**

Run: `npm test tests/industry-research-management.test.mjs`

Expected: passes.

### Task 5: Full Verification

**Files:**
- Verify: all touched files

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: all Node tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Browser smoke test**

Run the local dev server, open the app, navigate to `产业调研`, click `数据初始化`, wait for recommendations, and confirm selection state renders without layout breakage.

