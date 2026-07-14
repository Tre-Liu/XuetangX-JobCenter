# Industry Major Chain Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hard-coded CMS major and chain recommendations with build-time generated data from `专业与产业链产业环节匹配结果.xlsx`, so each selected major loads only its confirmed industry-chain relations.

**Architecture:** A repeatable Node/XLSX generator normalizes the workbook into one typed Vue data module plus two equivalent browser-global data files for the standalone HTML entries. A small pure query module owns exact major-key lookup and confirmed-relation filtering; Vue and standalone pages consume the same normalized contract and preserve the existing localStorage handoff.

**Tech Stack:** Vue 3, TypeScript, Node.js ESM, `xlsx`, Node test runner, Vite.

## Global Constraints

- The workbook at `../V1.0需求（2026.6.11）/官方数据/专业与产业链产业环节匹配结果.xlsx` is the only source of professional and industry-chain mapping truth.
- Expected source totals are exactly 2,142 majors, 19 chains, 57 chain stages, and 791 confirmed relations.
- Only confirmed relations from `专业-产业链关系明细` may appear; `待人工研判` and `未匹配` records must produce an empty result.
- Major identity is `sourceLevel + majorCode`; the UI-level `undergraduate`/`vocational` value is only a filter group.
- Vue, `industry-research-admin.html`, and `outputs/industry-research-admin.html` must show equivalent data and behavior.
- Runtime browser code must not parse the `.xlsx` file.
- Do not modify or commit unrelated untracked files already present in the repository.

---

## File Structure

- Create `major-construction-platform/src/app/industry-major-chain-types.ts`: shared normalized data interfaces.
- Create `major-construction-platform/scripts/generate-industry-major-chain-data.mjs`: workbook reader, normalizer, validation, and artifact writer.
- Create `major-construction-platform/src/data/industry-major-chain-data.ts`: generated typed Vue data.
- Create `major-construction-platform/industry-major-chain-data.js`: generated browser-global data for root standalone HTML.
- Create `major-construction-platform/outputs/industry-major-chain-data.js`: generated browser-global data for output standalone HTML.
- Create `major-construction-platform/src/app/industry-major-chain-query.js`: pure runtime query and filtering functions.
- Create `major-construction-platform/src/app/industry-major-chain-query.d.ts`: TypeScript declarations for the query module.
- Modify `major-construction-platform/src/app/industry-research-management.ts`: expose page-facing recommendation types and derive cards from workbook relations.
- Modify `major-construction-platform/src/App.vue`: use full major data, exact relation lookup, default association, and strict empty states.
- Modify `major-construction-platform/industry-research-admin.html`: consume generated global data and exact lookup.
- Modify `major-construction-platform/outputs/industry-research-admin.html`: mirror the root standalone entry.
- Modify `major-construction-platform/package.json`: add the explicit data regeneration command.
- Create `major-construction-platform/tests/industry-major-chain-data.test.mjs`: source-count, integrity, and sample lookup tests.
- Modify `major-construction-platform/tests/industry-research-management.test.mjs`: Vue/static integration and no-fallback assertions.

---

### Task 1: Generate and validate the normalized workbook dataset

**Files:**
- Create: `major-construction-platform/src/app/industry-major-chain-types.ts`
- Create: `major-construction-platform/scripts/generate-industry-major-chain-data.mjs`
- Create: `major-construction-platform/src/data/industry-major-chain-data.ts`
- Create: `major-construction-platform/industry-major-chain-data.js`
- Create: `major-construction-platform/outputs/industry-major-chain-data.js`
- Modify: `major-construction-platform/package.json`
- Test: `major-construction-platform/tests/industry-major-chain-data.test.mjs`

**Interfaces:**
- Produces: `INDUSTRY_MAJOR_CHAIN_DATA: IndustryMajorChainDataset`.
- Produces: `globalThis.INDUSTRY_MAJOR_CHAIN_DATA` with the same JSON-compatible shape for static HTML.
- Dataset types: `IndustryMajorRecord`, `IndustryChainRecord`, `IndustryMajorChainRelation`, `IndustryMajorChainDataset`.

- [ ] **Step 1: Write the failing source-contract test**

Create `tests/industry-major-chain-data.test.mjs`. Load the generated browser data in a VM context so the test exercises the exact JSON-compatible contract used by static pages:

```js
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'

const source = await readFile(new URL('../industry-major-chain-data.js', import.meta.url), 'utf8')
const context = { globalThis: {} }
vm.runInNewContext(source, context)
const data = context.globalThis.INDUSTRY_MAJOR_CHAIN_DATA

test('generated industry-major dataset has the audited workbook totals', () => {
  assert.equal(data.stats.majorCount, 2142)
  assert.equal(data.stats.undergraduateCount, 840)
  assert.equal(data.stats.vocationalCount, 1302)
  assert.equal(data.stats.chainCount, 19)
  assert.equal(data.stats.stageCount, 57)
  assert.equal(data.stats.relationCount, 791)
})

test('every confirmed relation references an imported major and chain', () => {
  const majorKeys = new Set(data.majors.map((major) => major.key))
  const chainIds = new Set(data.chains.map((chain) => chain.id))
  assert.ok(data.relations.every((relation) => majorKeys.has(relation.majorKey)))
  assert.ok(data.relations.every((relation) => chainIds.has(relation.chainId)))
})

test('pending and unmatched majors have no confirmed relation rows', () => {
  const relatedMajorKeys = new Set(data.relations.map((relation) => relation.majorKey))
  assert.ok(data.majors
    .filter((major) => major.matchStatus !== '已匹配')
    .every((major) => !relatedMajorKeys.has(major.key)))
})
```

- [ ] **Step 2: Run the source-contract test and confirm it fails**

Run: `node --test tests/industry-major-chain-data.test.mjs`

Expected: FAIL with `ENOENT` for `industry-major-chain-data.js`.

- [ ] **Step 3: Add the normalized dataset types**

Create `src/app/industry-major-chain-types.ts`:

```ts
export type IndustryMajorUiLevel = 'undergraduate' | 'vocational'
export type IndustryMajorMatchStatus = '已匹配' | '待人工研判' | '未匹配'

export type IndustryMajorRecord = {
  key: string
  uiLevel: IndustryMajorUiLevel
  sourceLevel: string
  code: string
  name: string
  category: string
  majorCategory: string
  matchStatus: IndustryMajorMatchStatus
  noMatchReason: string
}

export type IndustryChainStage = {
  stage: '上游' | '中游' | '下游'
  node: string
  sourceEvidence: string
  formationBasis: string
}

export type IndustryChainRecord = {
  id: string
  name: string
  stages: IndustryChainStage[]
}

export type IndustryMajorChainRelation = {
  majorKey: string
  order: number
  relationType: string
  chainId: string
  stage: '上游' | '中游' | '下游'
  node: string
  confidence: string
  score: number
  evidence: string
  description: string
}

export type IndustryMajorChainDataset = {
  stats: {
    majorCount: number
    undergraduateCount: number
    vocationalCount: number
    chainCount: number
    stageCount: number
    relationCount: number
  }
  majors: IndustryMajorRecord[]
  chains: IndustryChainRecord[]
  relations: IndustryMajorChainRelation[]
}
```

- [ ] **Step 4: Implement the workbook generator**

Create `scripts/generate-industry-major-chain-data.mjs`. Use `XLSX.readFile()` and `sheet_to_json()` with string-preserving cleanup. The core normalization must use these exact rules:

```js
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workbookPath = path.resolve(
  projectRoot,
  '../V1.0需求（2026.6.11）/官方数据/专业与产业链产业环节匹配结果.xlsx'
)
const clean = (value) => String(value ?? '').replace(/^\uFEFF/, '').trim()
const normalizeCode = (value) => {
  const text = clean(value).toUpperCase()
  const match = text.match(/^(\d+)([A-Z]*)$/)
  return match ? `${match[1].padStart(6, '0')}${match[2]}` : text
}
const majorKey = (sourceLevel, code) => `${sourceLevel}:${normalizeCode(code)}`
const chainId = (name) => `chain-${createHash('sha1').update(name).digest('hex').slice(0, 10)}`
const uiLevelFor = (sourceLevel) => sourceLevel === '普通本科' ? 'undergraduate' : 'vocational'

const workbook = XLSX.readFile(workbookPath, { cellDates: false })
const rows = (sheetName) => {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new Error(`缺少工作表：${sheetName}`)
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
}
const requireColumns = (sheetName, records, columns) => {
  const available = new Set(Object.keys(records[0] ?? {}))
  const missing = columns.filter((column) => !available.has(column))
  if (missing.length) throw new Error(`${sheetName}缺少字段：${missing.join('、')}`)
}
```

Build `majors` from `本科专业匹配` and `职业教育专业匹配`, `chains` from `产业链环节字典`, and `relations` from `专业-产业链关系明细`. Before normalization, call `requireColumns()` for every field consumed from each sheet. Find relation majors by exact source level and normalized code, map chain names through `chainId()`, and sort relations by `majorKey` then `order`.

Validate before writing:

```js
const assertCount = (label, actual, expected) => {
  if (actual !== expected) throw new Error(`${label}数量异常：期望${expected}，实际${actual}`)
}
assertCount('专业', majors.length, 2142)
assertCount('本科专业', majors.filter((major) => major.uiLevel === 'undergraduate').length, 840)
assertCount('职教专业', majors.filter((major) => major.uiLevel === 'vocational').length, 1302)
assertCount('产业链', chains.length, 19)
assertCount('产业环节', chains.reduce((sum, chain) => sum + chain.stages.length, 0), 57)
assertCount('确定关系', relations.length, 791)

const majorKeys = new Set(majors.map((major) => major.key))
const chainIds = new Set(chains.map((chain) => chain.id))
for (const relation of relations) {
  if (!majorKeys.has(relation.majorKey)) throw new Error(`关系引用未知专业：${relation.majorKey}`)
  if (!chainIds.has(relation.chainId)) throw new Error(`关系引用未知产业链：${relation.chainId}`)
}

const dataset = {
  stats: {
    majorCount: majors.length,
    undergraduateCount: majors.filter((major) => major.uiLevel === 'undergraduate').length,
    vocationalCount: majors.filter((major) => major.uiLevel === 'vocational').length,
    chainCount: chains.length,
    stageCount: chains.reduce((sum, chain) => sum + chain.stages.length, 0),
    relationCount: relations.length,
  },
  majors,
  chains,
  relations,
}
```

Write the Vue module and both static globals from `JSON.stringify(dataset)`:

```js
const serialized = JSON.stringify(dataset)
writeFileSync(
  path.join(projectRoot, 'src/data/industry-major-chain-data.ts'),
  `import type { IndustryMajorChainDataset } from '../app/industry-major-chain-types'\n\nexport const INDUSTRY_MAJOR_CHAIN_DATA: IndustryMajorChainDataset = ${serialized}\n`
)
const browserSource = `globalThis.INDUSTRY_MAJOR_CHAIN_DATA = ${serialized};\n`
writeFileSync(path.join(projectRoot, 'industry-major-chain-data.js'), browserSource)
mkdirSync(path.join(projectRoot, 'outputs'), { recursive: true })
writeFileSync(path.join(projectRoot, 'outputs/industry-major-chain-data.js'), browserSource)
```

- [ ] **Step 5: Add the explicit regeneration command and generate artifacts**

Add to `package.json` scripts:

```json
"generate:industry-major-data": "node scripts/generate-industry-major-chain-data.mjs"
```

Run: `npm run generate:industry-major-data`

Expected: exit 0 and the three generated data files exist.

- [ ] **Step 6: Run the dataset tests**

Run: `node --test tests/industry-major-chain-data.test.mjs`

Expected: 3 tests pass.

- [ ] **Step 7: Commit the generated data foundation**

```bash
git add major-construction-platform/package.json \
  major-construction-platform/scripts/generate-industry-major-chain-data.mjs \
  major-construction-platform/src/app/industry-major-chain-types.ts \
  major-construction-platform/src/data/industry-major-chain-data.ts \
  major-construction-platform/industry-major-chain-data.js \
  major-construction-platform/outputs/industry-major-chain-data.js \
  major-construction-platform/tests/industry-major-chain-data.test.mjs
git commit -m "feat: generate industry major chain dataset"
```

---

### Task 2: Add exact major and confirmed-relation query functions

**Files:**
- Create: `major-construction-platform/src/app/industry-major-chain-query.js`
- Create: `major-construction-platform/src/app/industry-major-chain-query.d.ts`
- Modify: `major-construction-platform/tests/industry-major-chain-data.test.mjs`

**Interfaces:**
- Consumes: `IndustryMajorChainDataset` from Task 1.
- Produces: `filterIndustryMajors(data, uiLevel, keyword)`.
- Produces: `getIndustryMajorProfile(data, sourceLevel, code)` returning `{ major, relations, chains } | null`.

- [ ] **Step 1: Add failing behavior tests for exact lookup**

Append to `tests/industry-major-chain-data.test.mjs`:

```js
import {
  filterIndustryMajors,
  getIndustryMajorProfile,
} from '../src/app/industry-major-chain-query.js'

test('artificial intelligence returns only its confirmed AI midstream relation', () => {
  const profile = getIndustryMajorProfile(data, '普通本科', '080717T')
  assert.equal(profile.major.name, '人工智能')
  assert.deepEqual(profile.relations.map((relation) => [
    profile.chains.find((chain) => chain.id === relation.chainId).name,
    relation.stage,
    relation.node,
  ]), [['人工智能产业链', '中游', '智能感知、语音视觉与平台工具']])
})

test('pending and unmatched majors return an empty confirmed relation set', () => {
  const pending = getIndustryMajorProfile(data, '普通本科', '081008T')
  const unmatched = getIndustryMajorProfile(data, '普通本科', '082801')
  assert.equal(pending.major.matchStatus, '待人工研判')
  assert.equal(pending.relations.length, 0)
  assert.equal(unmatched.major.matchStatus, '未匹配')
  assert.equal(unmatched.relations.length, 0)
})

test('major search filters by UI group, code, and name', () => {
  assert.ok(filterIndustryMajors(data, 'undergraduate', '080717T').some((major) => major.name === '人工智能'))
  assert.ok(filterIndustryMajors(data, 'vocational', '工程造价').every((major) => major.uiLevel === 'vocational'))
})
```

- [ ] **Step 2: Run tests and confirm query imports fail**

Run: `node --test tests/industry-major-chain-data.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `industry-major-chain-query.js`.

- [ ] **Step 3: Implement the pure query module**

Create `src/app/industry-major-chain-query.js`:

```js
const normalizeCode = (value) => {
  const text = String(value ?? '').trim().toUpperCase()
  const match = text.match(/^(\d+)([A-Z]*)$/)
  return match ? `${match[1].padStart(6, '0')}${match[2]}` : text
}

export const buildIndustryMajorKey = (sourceLevel, code) =>
  `${String(sourceLevel).trim()}:${normalizeCode(code)}`

export const filterIndustryMajors = (data, uiLevel, keyword = '') => {
  const normalizedKeyword = String(keyword).trim().toLowerCase()
  return data.majors.filter((major) =>
    major.uiLevel === uiLevel
    && (!normalizedKeyword
      || major.code.toLowerCase().includes(normalizedKeyword)
      || major.name.toLowerCase().includes(normalizedKeyword))
  )
}

export const getIndustryMajorProfile = (data, sourceLevel, code) => {
  const key = buildIndustryMajorKey(sourceLevel, code)
  const major = data.majors.find((item) => item.key === key)
  if (!major) return null
  const relations = data.relations
    .filter((relation) => relation.majorKey === key)
    .sort((first, second) => first.order - second.order)
  const chainIds = new Set(relations.map((relation) => relation.chainId))
  const chains = data.chains.filter((chain) => chainIds.has(chain.id))
  return { major, relations, chains }
}
```

Create `src/app/industry-major-chain-query.d.ts`:

```ts
import type {
  IndustryChainRecord,
  IndustryMajorChainDataset,
  IndustryMajorChainRelation,
  IndustryMajorRecord,
  IndustryMajorUiLevel,
} from './industry-major-chain-types'

export type IndustryMajorProfile = {
  major: IndustryMajorRecord
  relations: IndustryMajorChainRelation[]
  chains: IndustryChainRecord[]
}

export function buildIndustryMajorKey(sourceLevel: string, code: string): string
export function filterIndustryMajors(
  data: IndustryMajorChainDataset,
  uiLevel: IndustryMajorUiLevel,
  keyword?: string,
): IndustryMajorRecord[]
export function getIndustryMajorProfile(
  data: IndustryMajorChainDataset,
  sourceLevel: string,
  code: string,
): IndustryMajorProfile | null
```

- [ ] **Step 4: Run query tests**

Run: `node --test tests/industry-major-chain-data.test.mjs`

Expected: all dataset and query tests pass.

- [ ] **Step 5: Commit query behavior**

```bash
git add major-construction-platform/src/app/industry-major-chain-query.js \
  major-construction-platform/src/app/industry-major-chain-query.d.ts \
  major-construction-platform/tests/industry-major-chain-data.test.mjs
git commit -m "feat: query confirmed chains by major"
```

---

### Task 3: Integrate workbook-backed data into the Vue CMS page

**Files:**
- Modify: `major-construction-platform/src/app/industry-research-management.ts`
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: `INDUSTRY_MAJOR_CHAIN_DATA` and Task 2 query functions.
- Produces: `IndustryResearchChainRecommendation` cards containing real relation fields.
- Persists: `officialMajor.sourceLevel` and confirmed chain IDs.

- [ ] **Step 1: Replace hard-coded recommendation assertions with failing source-backed assertions**

Update `tests/industry-research-management.test.mjs` to require:

```js
test('Vue industry initialization uses workbook-generated major and relation data', () => {
  assert.match(appVue, /INDUSTRY_MAJOR_CHAIN_DATA/)
  assert.match(appVue, /getIndustryMajorProfile/)
  assert.match(appVue, /confirmedCmsIndustryMajor\?\.sourceLevel/)
  assert.match(appVue, /暂无确定关联产业链/)
  assert.doesNotMatch(industryResearchData, /name: '智能建造产业链',[\s\S]*matchScore: 96/)
})

test('Vue relation cards show workbook fields instead of invented scores', () => {
  for (const field of ['阶段', '产业环节', '置信度', '规则得分', '匹配依据', '关系说明']) {
    assert.match(appVue, new RegExp(field))
  }
  assert.doesNotMatch(appVue, /匹配度 \{\{ chain\.matchScore \}\}%/)
})
```

- [ ] **Step 2: Run the integration test and verify failure**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: FAIL because `App.vue` still imports the fixed recommendations.

- [ ] **Step 3: Convert the page-facing recommendation model**

In `src/app/industry-research-management.ts`, remove `INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS` and define a converter:

```ts
import type {
  IndustryChainRecord,
  IndustryMajorChainRelation,
} from './industry-major-chain-types'

export type IndustryResearchChainRecommendation = {
  id: string
  name: string
  stage: string
  node: string
  confidence: string
  score: number
  evidence: string
  description: string
}

export const buildIndustryResearchRecommendations = (
  relations: IndustryMajorChainRelation[],
  chains: IndustryChainRecord[],
): IndustryResearchChainRecommendation[] => relations.map((relation) => ({
  id: relation.chainId,
  name: chains.find((chain) => chain.id === relation.chainId)?.name ?? relation.chainId,
  stage: relation.stage,
  node: relation.node,
  confidence: relation.confidence,
  score: relation.score,
  evidence: relation.evidence,
  description: relation.description,
}))
```

- [ ] **Step 4: Wire full majors and exact profiles into `App.vue`**

Import the generated dataset and query functions. Replace `cmsIndustryOfficialMajors` with `INDUSTRY_MAJOR_CHAIN_DATA.majors`. Extend `CmsIndustryOfficialMajor` with `sourceLevel`, `matchStatus`, and `noMatchReason`.

Add state:

```ts
const activeIndustryResearchChains = ref<IndustryResearchChainRecommendation[]>([])
const industryResearchEmptyReason = ref('')
```

Filter majors through `filterIndustryMajors()`. In `startIndustryResearchInitialization()`, query the selected major and default-select only returned confirmed chain IDs:

```ts
const profile = confirmedCmsIndustryMajor.value
  ? getIndustryMajorProfile(
      INDUSTRY_MAJOR_CHAIN_DATA,
      confirmedCmsIndustryMajor.value.sourceLevel,
      confirmedCmsIndustryMajor.value.code,
    )
  : null
activeIndustryResearchChains.value = profile
  ? buildIndustryResearchRecommendations(profile.relations, profile.chains)
  : []
selectedIndustryResearchChainIds.value = activeIndustryResearchChains.value.map((chain) => chain.id)
industryResearchEmptyReason.value = !profile
  ? '专业数据不存在，请重新选择专业'
  : profile.relations.length === 0
    ? profile.major.noMatchReason || profile.major.matchStatus
    : ''
```

All filter, pagination, association, and toggle computed values must use `activeIndustryResearchChains.value`, not the removed fixed array. Persist `sourceLevel` in `officialMajor`. Before persisting selected IDs, intersect them with `activeIndustryResearchChains.value.map((chain) => chain.id)` so stale IDs from the old six-chain demo cannot survive.

- [ ] **Step 5: Update Vue result markup**

Render real relation fields. When `activeIndustryResearchChains.length === 0`, render:

```html
<section class="cms-chain-empty-state">
  <strong>暂无确定关联产业链</strong>
  <p>{{ confirmedCmsIndustryMajor?.matchStatus }} · {{ industryResearchEmptyReason }}</p>
</section>
```

For relation cards, render `chain.stage`, `chain.node`, `chain.confidence`, `chain.score`, `chain.evidence`, and `chain.description`. Keep the select/cancel button for demo overrides.

- [ ] **Step 6: Run focused Vue integration and type checks**

Run: `node --test tests/industry-major-chain-data.test.mjs tests/industry-research-management.test.mjs`

Expected: focused tests pass.

Run: `./node_modules/.bin/vue-tsc -b`

Expected: exit 0 with no TypeScript errors.

- [ ] **Step 7: Commit Vue integration**

```bash
git add major-construction-platform/src/app/industry-research-management.ts \
  major-construction-platform/src/App.vue \
  major-construction-platform/tests/industry-research-management.test.mjs
git commit -m "feat: load confirmed chains for selected major"
```

---

### Task 4: Mirror exact lookup in both standalone CMS HTML entries

**Files:**
- Modify: `major-construction-platform/industry-research-admin.html`
- Modify: `major-construction-platform/outputs/industry-research-admin.html`
- Modify: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: `globalThis.INDUSTRY_MAJOR_CHAIN_DATA` generated in Task 1.
- Produces: static-page lookup behavior equivalent to Vue.

- [ ] **Step 1: Add failing dual-entry assertions**

For both static files, assert:

```js
assert.match(source, /<script src="\.\/industry-major-chain-data\.js"><\/script>/)
assert.match(source, /INDUSTRY_MAJOR_CHAIN_DATA/)
assert.match(source, /getIndustryMajorProfile/)
assert.match(source, /暂无确定关联产业链/)
assert.doesNotMatch(source, /const officialIndustryMajors = \[/)
assert.doesNotMatch(source, /const chains = \[/)
assert.doesNotMatch(source, /智能建造产业链', 96/)
```

- [ ] **Step 2: Run static integration tests and verify failure**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: FAIL because both standalone pages still embed fixed arrays.

- [ ] **Step 3: Load the generated global and replace embedded arrays**

Add this script immediately before each page's inline behavior script:

```html
<script src="./industry-major-chain-data.js"></script>
```

At the start of the inline script:

```js
const industryMajorChainData = globalThis.INDUSTRY_MAJOR_CHAIN_DATA
if (!industryMajorChainData) throw new Error('产业链专业数据加载失败')
const officialIndustryMajors = industryMajorChainData.majors
let activeChains = []
```

Delete the two embedded fixed arrays. Update the professional list to use object fields, including `sourceLevel`, `matchStatus`, and `noMatchReason`.

- [ ] **Step 4: Add exact profile lookup and strict empty state**

Implement the same key contract in plain browser JS:

```js
const getIndustryMajorProfile = (major) => {
  const relations = industryMajorChainData.relations
    .filter((relation) => relation.majorKey === major.key)
    .sort((first, second) => first.order - second.order)
  const chainLookup = new Map(industryMajorChainData.chains.map((chain) => [chain.id, chain]))
  return {
    major,
    chains: relations.map((relation) => ({
      ...relation,
      id: relation.chainId,
      name: chainLookup.get(relation.chainId)?.name || relation.chainId,
    })),
  }
}
```

On initialization, set `activeChains` from the profile and replace the selected set with all confirmed chain IDs. If the selected professional key is missing, render `专业数据不存在，请重新选择专业`. If the profile exists but has no confirmed relations, render `暂无确定关联产业链` and the major's status/reason. Search, paging, associated-chain rendering, selection toggles, and persisted IDs must use `activeChains`, which also discards stale IDs from the old fixed demo.

- [ ] **Step 5: Keep the two standalone HTML files byte-equivalent where expected**

After updating the root file, copy it to the output file only if their existing intended content is identical; otherwise apply the same behavior patch separately and compare the relevant script blocks with `diff -u`.

Run: `diff -u industry-research-admin.html outputs/industry-research-admin.html`

Expected: no differences, or only previously documented path/content differences unrelated to this feature.

- [ ] **Step 6: Run dual-entry tests**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: all tests pass.

- [ ] **Step 7: Commit standalone integration**

```bash
git add major-construction-platform/industry-research-admin.html \
  major-construction-platform/outputs/industry-research-admin.html \
  major-construction-platform/tests/industry-research-management.test.mjs
git commit -m "feat: sync standalone major chain lookup"
```

---

### Task 5: Full regression, build, and browser verification

**Files:**
- Modify only if verification identifies a feature regression in files already listed above.

**Interfaces:**
- Consumes: completed Vue and standalone implementations.
- Produces: verified build and interaction evidence.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: exit 0 with every Node test passing.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: exit 0. Existing warnings about external scripts without `type="module"` or large chunks are non-blocking if the command succeeds.

- [ ] **Step 3: Start the local demo server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite reports a local URL and remains running.

- [ ] **Step 4: Verify the matched-major path**

Open `/?view=industry-research-admin&entry=industry&majorName=智能建造工程专业`, click `数据初始化`, choose `080717T 人工智能`, and confirm.

Expected:

- The picker searches the full 840 undergraduate records.
- Exactly one associated chain appears: `人工智能产业链`.
- Its details are `中游` and `智能感知、语音视觉与平台工具`.
- No smart-construction, building-industrialization, or green-building recommendation appears.

- [ ] **Step 5: Verify the pending-major path**

Reinitialize, choose `081008T 智能建造`, and confirm.

Expected:

- The associated count is 0.
- The page shows `暂无确定关联产业链`.
- The page shows `待人工研判` and the source-table reason.
- No candidate or fallback chain card appears.

- [ ] **Step 6: Verify the standalone entry**

Open `industry-research-admin.html?entry=industry` through the local server and repeat the two sample paths.

Expected: behavior and displayed data match the Vue entry.

- [ ] **Step 7: Inspect the final diff and commit verification fixes if any**

Run: `git diff --check`

Expected: no whitespace errors.

If verification required a code fix, stage only feature files and commit:

```bash
git add major-construction-platform/src \
  major-construction-platform/scripts/generate-industry-major-chain-data.mjs \
  major-construction-platform/industry-major-chain-data.js \
  major-construction-platform/outputs/industry-major-chain-data.js \
  major-construction-platform/industry-research-admin.html \
  major-construction-platform/outputs/industry-research-admin.html \
  major-construction-platform/tests \
  major-construction-platform/package.json
git commit -m "fix: verify workbook-backed industry initialization"
```
