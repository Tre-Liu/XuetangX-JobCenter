# Data Governance Dashboard Single HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the data-governance dashboard as one offline `index.html`, list all 19 standard industry-chain names in details, and split major statistics into higher education (undergraduate) and vocational education modules.

**Architecture:** Keep the existing Vue/Vite project as the maintainable source and data-refresh pipeline. Extend the reviewed snapshot contract with chain-name details and two major asset metrics, then add a deterministic post-build step that inlines Vite CSS and JavaScript into `dist-single/index.html`.

**Tech Stack:** Node.js 24+, Vue 3, TypeScript, Vite 6, SheetJS 0.20.3, Vitest, Node test runner.

## Global Constraints

- Final delivery is one self-contained `data-governance-dashboard/dist-single/index.html`.
- The HTML must work offline without a server, CDN, sidecar script, stylesheet, data file, or external request.
- Standard industry-chain details must list the 19 complete names from `industry_chain_standardization_summary.csv`.
- Higher education means the “普通本科” summary row: 840 total, 190 matched, 161 review, 489 unmatched, 21 multi-chain, 216 relations.
- Vocational education means “职业教育（中职+高职专科+职业本科）”: 1,302 total, 492 matched, 282 review, 528 unmatched, 68 multi-chain, 575 relations.
- The two major groups must reconcile to the workbook total row.
- Existing recruitment, industry, position, stage, source-lineage, refresh, and development-server behavior remains supported.

---

### Task 1: Extend collectors with chain names and grouped major summaries

**Files:**
- Modify: `data-governance-dashboard/scripts/collectors/static-assets.mjs`
- Modify: `data-governance-dashboard/scripts/collectors/matched-assets.mjs`
- Test: `data-governance-dashboard/tests/static-assets.test.mjs`
- Test: `data-governance-dashboard/tests/matched-assets.test.mjs`

**Interfaces:**
- Produces: `AssetMetric.details?: { kind: 'name-list'; label: string; items: string[] }`.
- Produces: `readMajorSummaries(rows): { undergraduate: MajorSummary; vocational: MajorSummary; total: MajorSummary }`.
- Produces asset IDs `undergraduateMajors` and `vocationalMajors`.
- Produces four source-status IDs from the two shared professional files:
  `undergraduateMajorCatalog`, `undergraduateMajorMatches`,
  `vocationalMajorCatalog`, and `vocationalMajorMatches`.

- [ ] **Step 1: Write failing static collector tests**

Add assertions that the chains asset contains:

```js
details: {
  kind: 'name-list',
  label: '完整标准产业链名称',
  items: ['数据要素与数字经济产业链', '人工智能产业链'],
}
```

Also add rejection cases for blank and duplicate `standard_chain` values.

- [ ] **Step 2: Run the static collector test and verify failure**

Run:

```bash
cd data-governance-dashboard
node --test tests/static-assets.test.mjs
```

Expected: FAIL because chain details and strict list validation do not exist.

- [ ] **Step 3: Implement ordered chain-name collection**

Add a helper that trims `standard_chain`, rejects blank names and duplicates, and returns the source-order list. Set `primaryValue` to `items.length` and attach the `name-list` details object to the chains metric.

- [ ] **Step 4: Run the static collector test**

Run:

```bash
node --test tests/static-assets.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Write failing grouped-major tests**

Use fixture summary rows for “普通本科”, “职业教育（中职+高职专科+职业本科）”, and “合计”. Assert:

```js
readMajorSummaries(rows).undergraduate.total === 840
readMajorSummaries(rows).vocational.total === 1302
```

Assert `buildMatchedAssetMetrics` returns both `undergraduateMajors` and `vocationalMajors`, with their own coverage and supporting metrics. Add a failure case where grouped totals do not reconcile to “合计”.

- [ ] **Step 6: Run the grouped-major test and verify failure**

Run:

```bash
node --test tests/matched-assets.test.mjs
```

Expected: FAIL because only the aggregate `majors` metric exists.

- [ ] **Step 7: Implement grouped-major parsing and reconciliation**

Replace `readMajorSummary` with `readMajorSummaries`. Parse each named row against the shared header, validate every group independently, sum the two groups, and compare all six count fields with the total row. Build two assets:

```js
{
  id: 'undergraduateMajors',
  label: '高教（本科）',
  definition: '普通本科中有确定产业链关联的专业数 ÷ 普通本科专业总数',
}
{
  id: 'vocationalMajors',
  label: '职教',
  definition: '中职、高职专科和职业本科中有确定产业链关联的专业数 ÷ 职教专业总数',
}
```

Both assets use `majorCatalog` and `majorMatches` as sources.

Expose the shared physical files as four metric-owned snapshot source records so the existing
single-owner `SourceStatus.assetId` contract remains unambiguous:

```js
undergraduateMajors.sourceIds = [
  'undergraduateMajorCatalog',
  'undergraduateMajorMatches',
]
vocationalMajors.sourceIds = [
  'vocationalMajorCatalog',
  'vocationalMajorMatches',
]
```

The four source records retain the exact same reviewed file paths, timestamps, grains, statuses,
and notes as their two physical sources; only the snapshot source ID and owning asset ID differ.

- [ ] **Step 8: Run collector tests**

Run:

```bash
node --test tests/static-assets.test.mjs tests/matched-assets.test.mjs
```

Expected: PASS.

- [ ] **Step 9: Commit collector changes**

```bash
git add data-governance-dashboard/scripts/collectors/static-assets.mjs data-governance-dashboard/scripts/collectors/matched-assets.mjs data-governance-dashboard/tests/static-assets.test.mjs data-governance-dashboard/tests/matched-assets.test.mjs
git commit -m "feat: split major governance metrics"
```

### Task 2: Update the snapshot contract and real baseline

**Files:**
- Modify: `data-governance-dashboard/src/types/dashboard.ts`
- Modify: `data-governance-dashboard/src/dashboard-model.ts`
- Modify: `data-governance-dashboard/scripts/build-snapshot.mjs`
- Modify: `data-governance-dashboard/tests/dashboard-model.test.mjs`
- Modify: `data-governance-dashboard/tests/snapshot-builder.test.mjs`
- Modify: `data-governance-dashboard/tests/helpers/snapshot-fixture.mjs`
- Modify: `data-governance-dashboard/tests/source-exploration.test.mjs`

**Interfaces:**
- Consumes: chain `details` and the two grouped-major assets from Task 1.
- Produces: canonical seven-asset order `chains`, `stages`, `undergraduateMajors`, `vocationalMajors`, `industries`, `positions`, `recruitment`.
- Produces: validated `DashboardSnapshot` schema version 1 with optional asset detail list.

- [ ] **Step 1: Write failing model and snapshot tests**

Update fixtures to contain seven assets. Assert:

```ts
snapshot.assets.map((asset) => asset.id)
```

equals:

```ts
[
  'chains',
  'stages',
  'undergraduateMajors',
  'vocationalMajors',
  'industries',
  'positions',
  'recruitment',
]
```

Add tests rejecting a chains detail list whose length differs from `primaryValue`, contains blanks, or contains duplicates. Add exact baseline assertions for both major groups.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
npm run test:data -- --test-name-pattern="snapshot|major|chain"
npm run test:ui -- --run tests/dashboard-model.test.mjs
```

Expected: one or both commands fail because the contract still expects `majors`.

- [ ] **Step 3: Update TypeScript types and browser validation**

Change `AssetMetric['id']` to include the two grouped IDs and remove `majors`. Add:

```ts
export interface AssetNameListDetails {
  kind: 'name-list'
  label: string
  items: string[]
}
```

Set `details?: AssetNameListDetails` on `AssetMetric`. Update asset order, total-bearing asset IDs, supporting-metric contracts, source ownership rules, coverage ordering, and grouped-major invariants. Preserve the invariant that every `sourceId` resolves to exactly one source whose `assetId` equals the metric ID.

- [ ] **Step 4: Update build-time snapshot validation**

Mirror the browser contract in `build-snapshot.mjs`: seven-asset order, exact current baseline, chain detail-list validation, and per-group major conservation. Update `ASSET_NAMES`, field labels, totals, and source validation so both grouped major assets can reference shared major sources.

- [ ] **Step 5: Run model and snapshot tests**

Run:

```bash
npm run test:data
npm run test:ui
```

Expected: PASS.

- [ ] **Step 6: Refresh the reviewed snapshot**

Run:

```bash
npm run refresh
```

Expected: `src/data/dashboard-snapshot.json` contains seven assets, the 19 chain names, and exact grouped major baselines.

- [ ] **Step 7: Check deterministic refresh**

Run:

```bash
npm run refresh:check
```

Expected: PASS with no snapshot drift.

- [ ] **Step 8: Commit snapshot-contract changes**

```bash
git add data-governance-dashboard/src/types/dashboard.ts data-governance-dashboard/src/dashboard-model.ts data-governance-dashboard/scripts/build-snapshot.mjs data-governance-dashboard/src/data/dashboard-snapshot.json data-governance-dashboard/tests/dashboard-model.test.mjs data-governance-dashboard/tests/snapshot-builder.test.mjs data-governance-dashboard/tests/helpers/snapshot-fixture.mjs data-governance-dashboard/tests/source-exploration.test.mjs
git commit -m "feat: validate grouped dashboard snapshot"
```

### Task 3: Render the new cards, chart rows, filters, and chain detail list

**Files:**
- Modify: `data-governance-dashboard/src/components/SourceDrawer.vue`
- Modify: `data-governance-dashboard/src/components/SourceTable.vue`
- Modify: `data-governance-dashboard/src/styles.css`
- Modify: `data-governance-dashboard/tests/dashboard-summary.test.ts`
- Modify: `data-governance-dashboard/tests/dashboard-charts.test.ts`
- Modify: `data-governance-dashboard/tests/dashboard-interaction.test.ts`
- Modify: `data-governance-dashboard/src/App.spec.ts`

**Interfaces:**
- Consumes: seven-asset snapshot and `metric.details`.
- Produces: accessible ordered list `.source-drawer__name-list` for name-list details.

- [ ] **Step 1: Write failing UI tests**

Assert the default dashboard shows separate “高教（本科）” and “职教” cards, no aggregate “专业” card, seven cards total, and coverage rows for both groups. Open the chains drawer and assert all 19 names are present in an ordered list with 19 items.

- [ ] **Step 2: Run focused UI tests and verify failure**

Run:

```bash
npm run test:ui -- tests/dashboard-summary.test.ts tests/dashboard-charts.test.ts tests/dashboard-interaction.test.ts src/App.spec.ts
```

Expected: FAIL because the UI still expects one `majors` metric and does not render details.

- [ ] **Step 3: Render asset details in the drawer**

In `SourceDrawer.vue`, add an optional section before “指标口径”:

```vue
<section v-if="metric.details?.kind === 'name-list'">
  <h3>{{ metric.details.label }}</h3>
  <ol class="source-drawer__name-list">
    <li v-for="item in metric.details.items" :key="item">{{ item }}</li>
  </ol>
</section>
```

Give the heading a unique ID and connect it through `aria-labelledby`.

- [ ] **Step 4: Update source filters and responsive layout**

Replace the single professional asset option with the two grouped options. Adjust the metric grid to handle seven cards cleanly and style the chain list as a readable two-column list on wide screens and one column on narrow screens.

- [ ] **Step 5: Run focused UI tests**

Run:

```bash
npm run test:ui -- tests/dashboard-summary.test.ts tests/dashboard-charts.test.ts tests/dashboard-interaction.test.ts src/App.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit UI changes**

```bash
git add data-governance-dashboard/src/components/SourceDrawer.vue data-governance-dashboard/src/components/SourceTable.vue data-governance-dashboard/src/styles.css data-governance-dashboard/tests/dashboard-summary.test.ts data-governance-dashboard/tests/dashboard-charts.test.ts data-governance-dashboard/tests/dashboard-interaction.test.ts data-governance-dashboard/src/App.spec.ts
git commit -m "feat: show grouped majors and chain names"
```

### Task 4: Build and verify one self-contained HTML file

**Files:**
- Create: `data-governance-dashboard/scripts/build-single-html.mjs`
- Create: `data-governance-dashboard/tests/single-html-build.test.mjs`
- Modify: `data-governance-dashboard/package.json`
- Modify: `data-governance-dashboard/README.md`
- Generated: `data-governance-dashboard/dist-single/index.html`

**Interfaces:**
- Produces command: `npm run build:single`.
- Produces file: `dist-single/index.html`.

- [ ] **Step 1: Write the failing single-file build test**

Create a test that runs `npm run build:single`, then asserts:

```js
const files = await readdir('dist-single')
assert.deepEqual(files, ['index.html'])
assert.match(html, /<style[\s>]/)
assert.match(html, /<script type="module">/)
assert.doesNotMatch(html, /<script[^>]+src=/)
assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/)
assert.doesNotMatch(html, /https?:\/\//)
```

Also assert the embedded HTML includes the dashboard app mount root and the build exits nonzero if Vite emits an unsupported asset reference.

- [ ] **Step 2: Run the single-file test and verify failure**

Run:

```bash
node --test tests/single-html-build.test.mjs
```

Expected: FAIL because `build:single` does not exist.

- [ ] **Step 3: Implement the single-file packager**

The script must:

1. Delete only `dist-single` and recreate it.
2. Run the existing Vite build into a temporary directory under the project.
3. Parse the generated `index.html`.
4. Replace each local stylesheet link with its file contents inside `<style>`.
5. Replace each local module script with its file contents inside `<script type="module">`.
6. Reject any remaining local or remote script, stylesheet, image, font, preload, or modulepreload dependency.
7. Write only `dist-single/index.html`.
8. Remove its temporary build directory in `finally`.

Add package scripts:

```json
"build:single": "node scripts/build-single-html.mjs",
"verify": "npm test && npm run refresh:check && npm run build && npm run build:single"
```

- [ ] **Step 4: Run the single-file test**

Run:

```bash
node --test tests/single-html-build.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Document offline usage**

Update `README.md` with:

```bash
npm run build:single
open dist-single/index.html
```

Clarify that `dist-single/index.html` is a generated snapshot and `npm run refresh` must run before rebuilding when source data changes.

- [ ] **Step 6: Run full verification**

Run:

```bash
npm run verify
```

Expected: all Node tests, all Vitest tests, refresh check, regular build, and single-file build pass.

- [ ] **Step 7: Inspect final artifact shape**

Run:

```bash
find dist-single -maxdepth 1 -type f -print
rg -n '<script[^>]+src=|<link[^>]+stylesheet|https?://' dist-single/index.html
```

Expected: exactly one `index.html`; the second command prints nothing.

- [ ] **Step 8: Commit packager and generated artifact**

```bash
git add data-governance-dashboard/scripts/build-single-html.mjs data-governance-dashboard/tests/single-html-build.test.mjs data-governance-dashboard/package.json data-governance-dashboard/README.md data-governance-dashboard/dist-single/index.html
git commit -m "feat: export dashboard as single html"
```

### Task 5: Final reconciliation and handoff

**Files:**
- Verify: `data-governance-dashboard/src/data/dashboard-snapshot.json`
- Verify: `data-governance-dashboard/dist-single/index.html`

**Interfaces:**
- Consumes all prior task outputs.
- Produces final verified offline dashboard handoff.

- [ ] **Step 1: Reconcile real snapshot values**

Verify the final snapshot contains:

```text
chains: 19 / 129, with 19 unique names
undergraduateMajors: 190 / 840
vocationalMajors: 492 / 1302
undergraduate + vocational: 682 / 2142
```

- [ ] **Step 2: Run final verification from a clean command**

Run:

```bash
cd data-governance-dashboard
npm run verify
```

Expected: exit code 0.

- [ ] **Step 3: Check repository status**

Run:

```bash
git status --short
```

Expected: clean worktree after intended commits.

- [ ] **Step 4: Hand off the file**

Provide a clickable local link to:

`data-governance-dashboard/dist-single/index.html`

State that it is an offline snapshot and can be regenerated with `npm run refresh && npm run build:single`.
