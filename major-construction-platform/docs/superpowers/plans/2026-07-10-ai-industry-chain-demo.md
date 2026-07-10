# Artificial Intelligence Industry Chain Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete, data-backed “人工智能产业链” experience to the chain graph, regional analysis, and enterprise library in both the Vue and `file://` demo entries.

**Architecture:** A deterministic Node generator reads the standardized chain bundle and three Excel sources, produces one lazy-loaded browser data package, and validates the agreed counts. Vue and the static fallback each adapt that same package into their existing views while preserving all current smart-construction behavior.

**Tech Stack:** Vue 3, TypeScript, Vite, Node.js, SheetJS `xlsx`, Node test runner, plain browser JavaScript for the static fallback.

## Global Constraints

- Preserve all unrelated existing workspace changes, especially current edits in `src/App.vue`, `index.html`, `src/app/talent-industry-data.ts`, `src/styles/20-talent.css`, and `tests/results-portal.test.mjs`.
- Update both the Vue entry and the source `file://.../index.html` entry.
- Do not modify the source Excel, CSV, or JSON files.
- Keep all 109 detailed nodes and all 32,403 deduplicated companies accessible.
- Retain 33,975 as the source-reported count and 33,961 as the normalized source-membership count.
- Do not include phone, email, legal representative, long business scope, or long company introduction fields in the browser bundle.
- Do not add new runtime dependencies.
- Do not commit shared dirty files unless pre-existing user hunks can be isolated safely; verification evidence is more important than task-level commits in this worktree.

---

## File Map

- Create `scripts/build-ai-industry-chain-data.mjs`: source ingestion, normalization, deduplication, stage mapping, aggregation, and browser-package generation.
- Create `public/data/ai-industry-chain-data.js`: generated shared browser data assigned to `window.__AI_INDUSTRY_CHAIN_DATA__`.
- Create `src/app/ai-industry-chain-data.ts`: shared TypeScript types plus the lazy script loader for Vue.
- Modify `src/app/talent-industry-data.ts`: add “人工智能产业链” to the current-chain options without replacing existing options.
- Modify `src/App.vue`: Vue loading state, AI graph, node explorer, regional view, and full enterprise library.
- Modify `index.html`: equivalent `file://` loader and static rendering.
- Modify `src/styles/20-talent.css`: AI-specific state, KPI, node, provenance, filter, and pagination styles.
- Create `tests/ai-industry-chain-data.test.mjs`: generated data integrity and cross-source reconciliation.
- Create `tests/ai-industry-chain-dual-entry.test.mjs`: Vue/static source contract and dual-entry behavior.
- Modify `tests/results-portal.test.mjs` only where an existing assertion hard-codes the four old chain options or rejects “人工智能产业链” globally.

---

### Task 1: Build and validate the complete browser data package

**Files:**
- Create: `major-construction-platform/scripts/build-ai-industry-chain-data.mjs`
- Create: `major-construction-platform/public/data/ai-industry-chain-data.js`
- Create: `major-construction-platform/tests/ai-industry-chain-data.test.mjs`

**Interfaces:**
- Consumes: the three standardized files under `/Users/liuhongzhe/Desktop/产业链整理结果/` and the three Excel workbooks under `/Users/liuhongzhe/Desktop/2025年最新产业链企业相关数据/`.
- Produces: `window.__AI_INDUSTRY_CHAIN_DATA__` with `{ version, meta, stages, nodes, companies, provinces, quality }`.

- [ ] **Step 1: Write the failing integrity test**

Create a Node test that generates into a temporary file, evaluates the classic script in a VM context, and asserts the exact contract:

```js
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import vm from 'node:vm'

const projectRoot = path.resolve(import.meta.dirname, '..')

test('generated AI chain bundle preserves the complete reconciled dataset', () => {
  const output = path.join(tmpdir(), `ai-industry-chain-${process.pid}.js`)
  execFileSync(process.execPath, [
    path.join(projectRoot, 'scripts/build-ai-industry-chain-data.mjs'),
    '--output', output,
  ])
  const context = { window: {} }
  vm.runInNewContext(readFileSync(output, 'utf8'), context)
  const data = context.window.__AI_INDUSTRY_CHAIN_DATA__

  assert.equal(data.version, 1)
  assert.equal(data.meta.stageCount, 3)
  assert.equal(data.meta.nodeCount, 109)
  assert.equal(data.meta.sourceReportedCount, 33975)
  assert.equal(data.meta.sourceMembershipCount, 33961)
  assert.equal(data.meta.companyCount, 32403)
  assert.equal(data.companies.length, 32403)
  assert.equal(data.nodes.length, 109)
  assert.deepEqual(data.stages.map((item) => item.id), ['node-043', 'node-044', 'node-045'])
  assert.ok(data.companies.every((item) => item.name || item.creditCode))
  assert.ok(data.companies.every((item) => item.sources.length > 0))
  assert.ok(data.companies.some((item) => item.mappingStatus === 'pending'))
})
```

- [ ] **Step 2: Run the test and verify the generator is missing**

Run: `node --test tests/ai-industry-chain-data.test.mjs`

Expected: FAIL because `scripts/build-ai-industry-chain-data.mjs` does not exist.

- [ ] **Step 3: Implement deterministic source reading and entity reconciliation**

Implement these exact functions in the generator:

```js
const clean = (value) => {
  const text = String(value ?? '').trim()
  return ['-', '--', '暂无', 'None'].includes(text) ? '' : text
}

const entityKey = ({ creditCode, name }, nameToCode) => {
  if (creditCode) return `id:${creditCode}`
  const codes = nameToCode.get(name)
  return codes?.size === 1 ? `id:${[...codes][0]}` : `name:${name}`
}

const stageForRecord = (source, row) => {
  if (source === '人工智能') return clean(row['产业位置'])
  if (source === '智能视觉') {
    return row['二级分类'] === '智能视觉终端设备' ? '下游' : '中游'
  }
  return ['语音识别相关产品', '语音识别解决方案'].includes(row['二级分类']) ? '下游' : '中游'
}

const browserCompany = (entity) => ({
  id: entity.key,
  name: entity.name,
  creditCode: entity.creditCode,
  province: entity.province,
  city: entity.city,
  district: entity.district,
  address: entity.address,
  scale: entity.scale,
  status: entity.status,
  finance: entity.finance,
  sources: [...entity.sources].sort(),
  stages: [...entity.stages].sort(),
  nodeIds: [...entity.nodeIds].sort(),
  nodeNames: [...entity.nodeNames].sort(),
  classificationPaths: [...entity.classificationPaths].sort(),
  mappingStatus: entity.nodeIds.size ? 'mapped' : 'pending',
})
```

Use `xlsx.readFile()` and `XLSX.utils.sheet_to_json(sheet, { defval: '' })`. Build the name-to-code map before computing canonical keys. Merge hierarchy rows and base/matching rows so hierarchy-only and information-only companies are retained. Use source-qualified node IDs such as `ai:云计算服务`, `vision:智能视觉算法`, and `speech:数据分析` so equal labels from different sources cannot collide.

- [ ] **Step 4: Generate summary, stages, nodes, province totals, and quality evidence**

The final object must use this shape:

```js
const result = {
  version: 1,
  meta: {
    chainName: '人工智能产业链',
    stageCount: 3,
    nodeCount: nodes.length,
    sourceCount: 3,
    sourceReportedCount: 33975,
    sourceMembershipCount: sourceMemberships,
    companyCount: companies.length,
  },
  stages: STANDARD_STAGES,
  nodes,
  companies,
  provinces,
  quality: {
    pendingCompanyCount,
    missingProvinceCount,
    hierarchyOnlyCount,
    informationOnlyCount,
  },
}
```

Write exactly one statement to the output file:

```js
window.__AI_INDUSTRY_CHAIN_DATA__ = Object.freeze(<serialized result>);
```

Support `--output <path>` and default to `public/data/ai-industry-chain-data.js`.

- [ ] **Step 5: Run the generator and integrity test**

Run: `node scripts/build-ai-industry-chain-data.mjs`

Expected: a summary line reporting `3 stages, 109 nodes, 32403 companies` and a generated `public/data/ai-industry-chain-data.js`.

Run: `node --test tests/ai-industry-chain-data.test.mjs`

Expected: PASS.

---

### Task 2: Add a typed, retryable Vue loader

**Files:**
- Create: `major-construction-platform/src/app/ai-industry-chain-data.ts`
- Create: `major-construction-platform/tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: `window.__AI_INDUSTRY_CHAIN_DATA__` generated by Task 1.
- Produces: `loadAiIndustryChainData(force?: boolean): Promise<AiIndustryChainData>` and exported `AiIndustryChainData` types.

- [ ] **Step 1: Write the failing dual-entry contract test**

```js
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => readFileSync(path.join(root, file), 'utf8')

test('Vue and static entries load the shared AI industry chain package', () => {
  const loader = read('src/app/ai-industry-chain-data.ts')
  const app = read('src/App.vue')
  const html = read('index.html')
  assert.match(loader, /loadAiIndustryChainData/)
  assert.match(loader, /__AI_INDUSTRY_CHAIN_DATA__/)
  assert.match(loader, /public\/data\/ai-industry-chain-data\.js/)
  assert.match(loader, /\/data\/ai-industry-chain-data\.js/)
  assert.match(app, /人工智能产业链/)
  assert.match(html, /人工智能产业链/)
  assert.match(html, /__AI_INDUSTRY_CHAIN_DATA__/)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: FAIL because the loader and new chain selection do not exist.

- [ ] **Step 3: Implement types and loader state isolation**

Define `AiIndustryChainCompany`, `AiIndustryChainNode`, `AiIndustryChainStage`, and `AiIndustryChainData`. Extend `Window` with `__AI_INDUSTRY_CHAIN_DATA__?: AiIndustryChainData`.

Implement one in-flight promise and environment-aware candidates:

```ts
let loadingPromise: Promise<AiIndustryChainData> | null = null

const candidateUrls = () => window.location.protocol === 'file:'
  ? ['./public/data/ai-industry-chain-data.js', './data/ai-industry-chain-data.js']
  : ['/data/ai-industry-chain-data.js']

export const loadAiIndustryChainData = (force = false) => {
  if (!force && window.__AI_INDUSTRY_CHAIN_DATA__) {
    return Promise.resolve(window.__AI_INDUSTRY_CHAIN_DATA__)
  }
  if (!force && loadingPromise) return loadingPromise
  loadingPromise = loadFirstAvailableScript(candidateUrls())
    .then(() => {
      const data = window.__AI_INDUSTRY_CHAIN_DATA__
      if (!data || data.version !== 1) throw new Error('人工智能产业链数据版本不匹配')
      return data
    })
    .finally(() => { loadingPromise = null })
  return loadingPromise
}
```

`loadFirstAvailableScript` must remove a failed script element before trying the next candidate and reject with `人工智能产业链数据加载失败` after all candidates fail.

- [ ] **Step 4: Re-run the focused test after adding the loader file**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: still FAIL only on App/static integration assertions, proving the loader contract itself now exists.

---

### Task 3: Implement the Vue AI chain, region, and enterprise views

**Files:**
- Modify: `major-construction-platform/src/app/talent-industry-data.ts`
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/src/styles/20-talent.css`
- Modify: `major-construction-platform/tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: `loadAiIndustryChainData()` and `AiIndustryChainData` from Task 2.
- Produces: Vue chain selection, loading/error states, node explorer, province analysis, and complete enterprise search/pagination.

- [ ] **Step 1: Extend the failing test with Vue behavior contracts**

Assert that `src/App.vue` contains:

```js
for (const token of [
  'isAiIndustryChain',
  'ensureAiIndustryChainData',
  '正在加载人工智能产业链完整数据',
  '重新加载',
  'aiIndustryNodeSearchText',
  'aiIndustryCompanyStageFilter',
  'aiIndustryCompanySourceFilter',
  'aiIndustryCompanyProvinceFilter',
  'filteredAiIndustryCompanies',
  'paginatedAiIndustryCompanies',
  '来源标称样本量',
]) assert.match(app, new RegExp(token))
```

Also assert `talent-industry-data.ts` contains the fifth option `'人工智能产业链'` without removing the four existing options.

- [ ] **Step 2: Run the focused test and verify the new assertions fail**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: FAIL on the first missing Vue token.

- [ ] **Step 3: Add Vue state, lazy loading, and derived collections**

Add these state variables and computed values near the current industry-chain state:

```ts
const aiIndustryChainData = shallowRef<AiIndustryChainData | null>(null)
const aiIndustryChainLoading = ref(false)
const aiIndustryChainError = ref('')
const aiIndustryNodeSearchText = ref('')
const aiIndustryCompanySearchText = ref('')
const aiIndustryCompanyStageFilter = ref('all')
const aiIndustryCompanySourceFilter = ref('all')
const aiIndustryCompanyProvinceFilter = ref('all')
const aiIndustryCompanyPage = ref(1)
const aiIndustryCompanyPageSize = 12
const isAiIndustryChain = computed(() => selectedIndustryChain.value === '人工智能产业链')
```

`ensureAiIndustryChainData(force = false)` must set loading/error state, call the loader, and reset filters only on the first successful load. Watch `selectedIndustryChain` and call it when the AI chain becomes active.

Filter companies by normalized search across name, credit code, province/city, node names, and classification paths. Stage/source/province filters must compose with the search. Calculate page count from the filtered array and clamp the current page when filters change.

- [ ] **Step 4: Add Vue templates without changing existing non-AI markup**

Wrap existing chain, region, and company bodies with `v-if="isAiIndustryChain"` / `v-else` branches. The AI branch must include:

- four KPI cards using `meta.companyCount`, `meta.nodeCount`, `meta.stageCount`, and `meta.sourceCount`;
- three standard stage cards and an expandable/searchable 109-node panel;
- a compact three-stage Sankey when `industryChainViewMode === 'sankey'`;
- provenance text for 33,975, 33,961, and 32,403;
- province KPI/ranking using `provinces` and `quality.missingProvinceCount`;
- enterprise search, stage/source/province filters, 12-row pagination, first/last/current-neighbor buttons, and `pending` badges.

All loading/error branches must use the exact user-facing strings from the test.

- [ ] **Step 5: Add scoped visual styles**

Prefix new selectors with `.ai-chain-` or `.ai-company-`. Reuse current blue/teal/orange stage colors. Add responsive rules at the same breakpoints already used by `20-talent.css`. Do not restyle existing smart-construction cards.

- [ ] **Step 6: Run focused and existing portal tests**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs tests/industry-company-library-design.test.mjs tests/results-portal.test.mjs`

Expected: the new test may still fail only on static-entry assertions; existing tests must not regress.

---

### Task 4: Implement equivalent `file://` static behavior

**Files:**
- Modify: `major-construction-platform/index.html`
- Modify: `major-construction-platform/tests/ai-industry-chain-dual-entry.test.mjs`
- Modify: `major-construction-platform/tests/results-portal.test.mjs` only for assertions that intentionally enumerate old chain options.

**Interfaces:**
- Consumes: the same `window.__AI_INDUSTRY_CHAIN_DATA__` package.
- Produces: `ensureStaticAiIndustryChainData(force)` plus AI-specific static HTML render functions.

- [ ] **Step 1: Extend the failing test with static contracts**

Assert these tokens exist in `index.html`:

```js
for (const token of [
  'ensureStaticAiIndustryChainData',
  'staticAiIndustryChainSectionHtml',
  'staticAiIndustryRegionBody',
  'staticAiIndustryCompanyBody',
  'data-ai-node-search',
  'data-ai-company-stage',
  'data-ai-company-source',
  'data-ai-company-province',
  'data-ai-company-page',
]) assert.match(html, new RegExp(token))
```

- [ ] **Step 2: Run the test and verify the static assertions fail**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: FAIL on `ensureStaticAiIndustryChainData`.

- [ ] **Step 3: Add the static loader and rerender hook**

Use the same candidate order as Vue. Store `staticAiIndustryChainData`, `staticAiIndustryChainLoading`, `staticAiIndustryChainError`, and one in-flight promise. When AI is selected, render the loading state immediately, load the script, then call the existing talent-section rerender function. The retry button calls `ensureStaticAiIndustryChainData(true)`.

- [ ] **Step 4: Add static render functions and event delegation**

Implement pure HTML functions for AI chain, region, company cards, filters, and pagination. Escape every workbook-derived string with `staticEscapeText` before interpolation.

Extend the existing click/input/change delegation to handle:

- AI node search;
- stage/source/province filters;
- enterprise search;
- pagination;
- retry;
- node-to-enterprise filter handoff.

The static branch must calculate actual page counts; it must not reuse `industryCompanyDisplayPageCount = 50`.

- [ ] **Step 5: Run dual-entry and portal tests**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs tests/results-portal.test.mjs tests/industry-company-library-design.test.mjs`

Expected: PASS.

---

### Task 5: Full verification and visual QA

**Files:**
- Modify only files required to fix verified defects found in this task.

**Interfaces:**
- Consumes: completed implementation from Tasks 1–4.
- Produces: passing tests/build plus browser evidence for Vue and `file://`.

- [ ] **Step 1: Run generated-data verification**

Run: `node scripts/build-ai-industry-chain-data.mjs`

Expected: `3 stages, 109 nodes, 32403 companies`.

Run: `node --test tests/ai-industry-chain-data.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit code 0. Existing non-blocking warnings about classic external scripts or large chunks may remain, but no new missing-file or TypeScript error is allowed.

- [ ] **Step 4: Verify Vue behavior in a browser**

Run: `npm run dev -- --port 4173`

Open the industry research route with `tab=chain&professionalTab=map&reportView=library&view=job-industry`. Select “人工智能产业链” and verify:

- KPI values are 32,403 / 109 / 3 / 3;
- node search can find `智能视觉算法` and `数据分析`;
- switching to enterprise library retains AI selection;
- searching `华为技术有限公司` returns the expected company;
- stage/source/province filters compose;
- page controls show the real last page;
- region ranking is populated from the enterprise dataset.

- [ ] **Step 5: Verify the source `file://` entry**

Open `major-construction-platform/index.html` directly with the same query string. Repeat the chain, node, region, company search, filter, pagination, and retry-state checks. Confirm the browser loads `./public/data/ai-industry-chain-data.js` without a fetch/CORS error.

- [ ] **Step 6: Inspect the final diff**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: only intended new/modified implementation files plus the user’s pre-existing unrelated changes. Do not stage or commit shared files containing pre-existing user work.
