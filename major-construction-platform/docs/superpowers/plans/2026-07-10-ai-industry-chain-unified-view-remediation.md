# AI Industry Chain Unified View Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the artificial-intelligence industry chain use the same treemap, Sankey, China map, policy-library, company-library, and chain-tab presentation contract as the four existing chains in both Vue and the source `file://` entry.

**Architecture:** Extend the generated AI bundle with deterministic Sankey relationships, adapt that bundle into the existing presentation structures, and remove the AI-only graph and static-region render paths. Vue and static rendering remain separate runtimes but share the same data fields, CSS classes, state semantics, and validation tests.

**Tech Stack:** Vue 3, TypeScript, Vite, Node.js, SheetJS `xlsx`, Node test runner, plain browser JavaScript for the static entry.

## Global Constraints

- Preserve all unrelated existing workspace changes.
- Update `src/App.vue` and the source `index.html` entry together.
- Do not modify the original Excel, CSV, or JSON files.
- Preserve 3 stages, 109 detail nodes, 33,975 source-reported records, 33,961 normalized memberships, and 32,403 deduplicated companies.
- Do not add runtime dependencies.
- Five chain tabs stay on one desktop row; narrow layouts scroll horizontally rather than wrapping.
- AI graph views must use `.industry-treemap-board` and `.industry-sankey-board`.
- AI region views must use the existing China-map presentation.
- All 109 nodes remain accessible through the treemap expand/search interaction.
- Implement with failing tests first and run both targeted and full verification.

---

### Task 1: Lock the unified dual-entry contract with failing tests

**Files:**
- Modify: `tests/ai-industry-chain-dual-entry.test.mjs`
- Modify: `tests/ai-industry-chain-data.test.mjs`

**Interfaces:**
- Consumes: current Vue/static source and generated browser bundle.
- Produces: regression assertions for tabs, policies, maps, graph structures, node access, and Sankey relationships.

- [ ] **Step 1: Replace AI-only visual-hook assertions with unified structure assertions**

Add tests equivalent to:

```js
test('AI graph uses the shared treemap and Sankey contracts in both entries', () => {
  assert.match(app, /industry-treemap-board/)
  assert.match(app, /industry-sankey-board/)
  assert.match(staticHtml, /staticAiIndustryTreemapHtml/)
  assert.match(staticHtml, /staticAiIndustrySankeyHtml/)
  assert.doesNotMatch(staticHtml, /class="ai-chain-sankey"/)
})

test('all chain selectors include AI and use five-column non-wrapping layout', () => {
  assert.match(styles, /grid-template-columns:\s*repeat\(5,/)
  assert.match(styles, /white-space:\s*nowrap/)
  assert.match(`${talentData}\n${staticHtml}`, /人工智能产业链/)
})

test('static AI region reuses the China map renderer', () => {
  assert.match(staticHtml, /staticAiIndustryRegionMapBody/)
  assert.match(staticHtml, /china-heatmap/)
})

test('AI policy mapping exists in Vue and static entries', () => {
  assert.match(talentData, /'人工智能产业链':\s*\{/)
  assert.match(staticHtml, /'人工智能产业链':\s*\{/)
})
```

- [ ] **Step 2: Require generated Sankey data**

Add:

```js
assert.ok(Array.isArray(data.sankey.nodes) && data.sankey.nodes.length >= 3)
assert.ok(Array.isArray(data.sankey.links))
assert.ok(data.sankey.links.every((link) => link.value > 0))
```

- [ ] **Step 3: Run targeted tests and verify RED**

Run: `node --test tests/ai-industry-chain-data.test.mjs tests/ai-industry-chain-dual-entry.test.mjs`

Expected: FAIL because Sankey data, AI policy mapping, five-column layout, and shared static AI renderers do not yet exist.

---

### Task 2: Generate deterministic AI Sankey relationships

**Files:**
- Modify: `scripts/build-ai-industry-chain-data.mjs`
- Modify: `src/app/ai-industry-chain-data.ts`
- Regenerate: `public/data/ai-industry-chain-data.js`
- Test: `tests/ai-industry-chain-data.test.mjs`

**Interfaces:**
- Consumes: `browserCompanies`, `nodes`, and standard stages.
- Produces: `sankey: { nodes: AiIndustrySankeyNode[]; links: AiIndustrySankeyLink[] }`.

- [ ] **Step 1: Aggregate real cross-stage node co-memberships**

Use the top weighted nodes per stage, group long-tail nodes under a stage-specific aggregate, and count only company-observed cross-stage pairs:

```js
const sankey = buildSankey({ companies: browserCompanies, nodes, limitPerStage: 8 })
const result = { version: 1, meta, stages, nodes, sankey, companies: browserCompanies, provinces, quality }
```

Each node has `{ id, name, stage, value }`; each link has `{ source, target, value }`. Do not invent links for stage pairs with zero observed companies.

- [ ] **Step 2: Add matching TypeScript interfaces**

```ts
export interface AiIndustrySankeyNode {
  id: string
  name: string
  stage: AiIndustryStageKey
  value: number
}

export interface AiIndustrySankeyLink {
  source: string
  target: string
  value: number
}
```

- [ ] **Step 3: Regenerate and verify GREEN**

Run: `node scripts/build-ai-industry-chain-data.mjs`

Run: `node --test tests/ai-industry-chain-data.test.mjs`

Expected: PASS with `3 stages, 109 nodes, 32403 companies`.

---

### Task 3: Unify chain tabs and policy views

**Files:**
- Modify: `src/app/talent-industry-data.ts`
- Modify: `index.html`
- Modify: `src/styles/20-talent.css`
- Test: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: existing policy items, keywords, and trends.
- Produces: an `人工智能产业链` policy view in both policy maps and five-column tab styling.

- [ ] **Step 1: Add the AI policy view to both maps**

Use AI/data/model/vision/speech/robotics keywords and a deterministic trend series. Reuse existing policy-list filtering; do not create random policies.

- [ ] **Step 2: Make five tabs non-wrapping**

Implement the equivalent of:

```css
.industry-company-chain-row { width: min(920px, 100%); overflow: hidden; }
.industry-company-segments { grid-template-columns: repeat(5, minmax(150px, 1fr)); }
.industry-company-segments button { white-space: nowrap; }
```

For narrow viewports, keep `overflow-x: auto` and do not switch back to wrapping.

- [ ] **Step 3: Run dual-entry tests**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: policy and tab tests PASS; graph/map tests may remain RED until later tasks.

---

### Task 4: Reuse treemap and Sankey structures in Vue and static entries

**Files:**
- Modify: `src/App.vue`
- Modify: `index.html`
- Modify: `src/styles/20-talent.css`
- Test: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: `AiIndustryChainData.stages`, `.nodes`, `.sankey`, and `industryChainViewMode`.
- Produces: shared treemap and Sankey DOM/class contracts and an in-tree node expansion interaction.

- [ ] **Step 1: Add view-model helpers**

Build stage groups, visible/filtered nodes, expanded-stage state, and Sankey layout input from the data package. Keep node clicks connected to the AI company node filter.

- [ ] **Step 2: Replace the Vue AI-only graph markup**

Render `.industry-treemap-board` when `industryChainViewMode === 'treemap'` and `.industry-sankey-board` when it equals `sankey`. Put the 109-node search and expansion controls inside the treemap stage structure; remove the separate `.ai-chain-node-explorer` block.

- [ ] **Step 3: Replace the static AI graph renderer**

Create `staticAiIndustryTreemapHtml()` returning one `.industry-treemap-board` with three `.industry-treemap-stage` children, and `staticAiIndustrySankeyHtml()` returning one `.industry-sankey-board` containing the generated AI Sankey nodes and links.

Have `staticAiIndustryChainSectionHtml()` choose one based on `staticIndustryChainViewMode`. Never output both views simultaneously.

- [ ] **Step 4: Remove obsolete AI-only graph CSS and add small modifiers only where data density requires them**

Delete `.ai-chain-stage-grid`, `.ai-chain-sankey`, and `.ai-chain-node-explorer` rules after their markup is gone. Keep provenance, loading, filters, and pagination styles.

- [ ] **Step 5: Run targeted tests**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: treemap, Sankey, node-access, and view-exclusivity tests PASS.

---

### Task 5: Reuse the China map for AI regional analysis

**Files:**
- Modify: `src/App.vue` only if parity defects remain
- Modify: `index.html`
- Modify: `src/styles/20-talent.css` only if shared modifiers are required
- Test: `tests/ai-industry-chain-dual-entry.test.mjs`

**Interfaces:**
- Consumes: `AiIndustryChainData.provinces` and `quality.missingProvinceCount`.
- Produces: the existing China-map DOM contract, legend, ranking, and province selection behavior.

- [ ] **Step 1: Parameterize the static China-map renderer**

Change `staticIndustryRegionMapBody()` to accept a `provinceMetrics` argument that defaults to the current construction-industry metrics. Add `staticAiIndustryRegionMapBody()` that calls it with `staticAiProvinceMetrics()`, so both branches execute the same province SVG path mapping, legend, and ranking renderer.

- [ ] **Step 2: Replace the AI rank-only body**

Keep AI KPI values, then render the China map and a single ranking sourced from the same metrics. Remove the duplicate full-width/righthand rank lists.

- [ ] **Step 3: Run dual-entry tests**

Run: `node --test tests/ai-industry-chain-dual-entry.test.mjs`

Expected: all targeted contract tests PASS.

---

### Task 6: Full verification and visual QA

**Files:**
- Modify: `design-qa.md`
- Modify only as required by failures: implementation/test files above

**Interfaces:**
- Consumes: both runnable entries and the five user screenshots.
- Produces: passing automated verification and browser evidence at the user viewport.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Vite build completes without TypeScript or bundling errors.

- [ ] **Step 3: Verify the source `file://` entry in Chrome**

At approximately 1982×1278, capture and inspect the AI company, policy, region, treemap, Sankey, and expanded-node states. Confirm no console errors.

- [ ] **Step 4: Verify the Vue entry at the same viewport**

Capture the same states and compare layout, labels, totals, and interactions.

- [ ] **Step 5: Record design QA**

Update `design-qa.md` with reference paths, implementation screenshots, viewport/state, comparison notes, and `final result: passed` only after all issues are resolved.

- [ ] **Step 6: Run final verification after any QA edits**

Run: `npm test && npm run build`

Expected: both commands PASS with fresh output.
