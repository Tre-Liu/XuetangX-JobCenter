# 产业链图谱与区域产业分析 Figma 对齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改动现有真实数据、接口、业务计算和交互行为的前提下，将“产业链图谱”和“区域产业分析”的 Vue 与静态双入口按已确认的 Figma 参数做精确视觉对齐。

**Architecture:** 继续复用 `src/styles.css` 导入的共享样式，以 `src/styles/20-talent.css` 作为视觉实现的单一来源；`src/App.vue` 与根 `index.html` 保留现有业务结构和交互，只负责共同挂载既有 Figma 语义类。用源码级回归测试锁定两入口、核心选择器、精确色值、尺寸和响应式降级，再用全量测试、构建和浏览器双尺寸检查验收。

**Tech Stack:** Vue 3、TypeScript、Vite、原生静态 HTML/JavaScript、CSS Grid/Flex、Node.js `node:test`。

**Global constraints:**

- Preserve every existing data source, loading/error/empty state, KPI dialog, treemap/Sankey switch, AI node search/expand, map province-city-district drill-down, TOP15 ranking and region cards.
- Do not change global navigation, left sidebar, page routing, report generation or unrelated pages.
- Treat 1440px as the Figma reference width while retaining usable stacked layouts below the current desktop breakpoint.
- Keep the root `index.html` and Vue entry covered by the same source-level assertions; do not duplicate CSS into HTML.
- Use `apply_patch` for manual edits and inspect `git diff` before every commit so unrelated user changes remain untouched.

---

## Task 1: Lock the approved Figma visual contract in tests

**Files:**
- Modify: `major-construction-platform/tests/industry-research-figma-ui.test.mjs`
- Read: `major-construction-platform/src/styles/20-talent.css`
- Read: `major-construction-platform/src/App.vue`
- Read: `major-construction-platform/index.html`

- [ ] **Step 1: Replace the loose palette/layout assertions with exact approved tokens**

Add assertions for the shared board/page contract:

```js
test('industry research Figma surfaces use the approved background, opacity and radii', () => {
  assert.match(styleBlock('.job-research-page'), /background:\s*#d7e4ff/i)
  assert.match(styleBlock('.industry-research-figma-board'), /--figma-board-surface:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)/i)
  assert.match(styleBlock('.industry-research-figma-board'), /--figma-board-radius:\s*16px/)
  assert.match(styleBlock('.industry-research-figma-board'), /--figma-item-radius:\s*8px/)
})
```

Keep the existing dual-entry assertions for `industry-research-figma-board`, `industry-figma-kpi-card`, `industry-region-figma-dashboard`, `产业链结构图谱`, `全国企业区域分布`, dialog sections and accessibility hooks.

- [ ] **Step 2: Add exact chain KPI and stage-header assertions**

Assert the reference geometry and gradients:

```js
test('chain KPI cards and stage headers match the Figma geometry and gradients', () => {
  assert.match(styleBlock('.industry-national-kpis'), /gap:\s*16px/)
  assert.match(styleBlock('.industry-figma-kpi-card'), /min-height:\s*127px/)
  assert.match(styleBlock('.industry-figma-kpi-card'), /padding:\s*12px\s+14px/)
  assert.match(styleBlock('.industry-treemap-stage header'), /min-height:\s*60px/)
  assert.match(styleBlock('.industry-treemap-stage header'), /linear-gradient\(90deg,\s*#edf4ff\s+0%,\s*#b5ccff\s+100%\)/i)
  assert.match(styleBlock('.industry-treemap-stage.stage-midstream header'), /linear-gradient\(90deg,\s*#e9f8fe\s+0%,\s*#a8dfe7\s+100%\)/i)
  assert.match(styleBlock('.industry-treemap-stage.stage-downstream header'), /linear-gradient\(90deg,\s*#f5f2ff\s+0%,\s*#d4bfff\s+100%\)/i)
  assert.match(styles, /\.industry-treemap-stage\.stage-upstream header\s*\{[^}]*clip-path:/s)
})
```

- [ ] **Step 3: Update regional assertions to the eight Figma scale colors plus low-data fallback**

Replace `#8BBAFF` with the approved `#8BB0FF`. Assert the eight design colors and retain `#E7F0FF` only as the separate low-data/no-emphasis fallback:

```js
for (const color of [
  '#0A2EC9', '#173FFB', '#113FFF', '#346BFF',
  '#5992FF', '#8BB0FF', '#B5D6FF', '#D6EAFF'
]) assert.match(styles.toUpperCase(), new RegExp(color.toUpperCase()))
assert.match(styles.toUpperCase(), /#E7F0FF/)
assert.doesNotMatch(styles.toUpperCase(), /#8BBAFF/)
```

Also assert:

```js
assert.match(styleBlock('.industry-region-figma-dashboard'), /grid-template-columns:\s*minmax\(0,\s*2\.04fr\)\s+minmax\(320px,\s*1fr\)/)
assert.match(styleBlock('.industry-region-figma-dashboard'), /gap:\s*16px/)
assert.match(styleBlock('.industry-region-figma-dashboard .professional-geo-map-card,\n.industry-region-figma-dashboard .industry-rank-card'), /min-height:\s*629px/)
```

Use the actual combined-selector string returned by `styleBlock`; if its newline formatting is brittle, add a small helper that normalizes whitespace rather than weakening the value assertion.

- [ ] **Step 4: Add responsive-shape coverage**

Assert the existing desktop-to-stack media query still contains:

```css
.industry-region-figma-dashboard { grid-template-columns: 1fr; }
.industry-treemap-board { grid-template-columns: 1fr; }
.industry-treemap-stage header { clip-path: none; }
```

Use a regex over `styles` scoped to the current `@media (max-width: 1180px)` block; do not rely on browser-computed pixels in this unit test.

- [ ] **Step 5: Run the targeted test and confirm it fails for the old values**

Run:

```bash
cd major-construction-platform
npm test -- --test-name-pattern='Figma|chain KPI|regional heatmap|surfaces'
```

Expected: FAIL because current CSS still uses `#8BBAFF`, 10px board radius, 108px KPI height, 10/14px gaps, 100deg gradients and 560px map/rank height.

- [ ] **Step 6: Review the test diff**

Run:

```bash
git diff -- major-construction-platform/tests/industry-research-figma-ui.test.mjs
```

Confirm the tests cover both entries and exact parameters without deleting interaction/accessibility checks.

---

## Task 2: Apply the shared surface tokens and chain visual alignment

**Files:**
- Modify: `major-construction-platform/src/styles/20-talent.css:343-360`
- Modify: `major-construction-platform/src/styles/20-talent.css:1054-1330`
- Test: `major-construction-platform/tests/industry-research-figma-ui.test.mjs`

- [ ] **Step 1: Set the approved page background without affecting unrelated flat/company pages**

Update the standard industry research page:

```css
.job-research-page {
  height: 100%;
  overflow: auto;
  padding: 22px 26px 32px;
  background: #d7e4ff;
}
```

Retain the existing special `.industry-company-page` and `.job-research-flat-canvas .job-research-page` overrides.

- [ ] **Step 2: Replace the board variables with the approved shared contract**

Use:

```css
.industry-research-figma-board {
  --figma-board-border: #ffffff;
  --figma-board-surface: rgba(255, 255, 255, 0.7);
  --figma-board-radius: 16px;
  --figma-item-radius: 8px;
  --figma-board-shadow: 0 10px 28px rgba(38, 67, 125, 0.06);
}

.industry-chain-figma-board {
  overflow: hidden;
  border-color: var(--figma-board-border);
  border-radius: var(--figma-board-radius);
  background: var(--figma-board-surface);
  box-shadow: var(--figma-board-shadow);
}
```

- [ ] **Step 3: Align the KPI grid and cards while preserving button semantics/focus**

Set the four-column desktop grid to a 16px gap and keep existing margins. Set `.industry-figma-kpi-card` to `min-height: 127px`, `padding: 12px 14px`, white 1px border, 8px radius and 70%-white surface. Preserve hover/focus transition, outline and current content typography.

```css
.industry-national-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 16px 16px 0;
}

.industry-figma-kpi-card {
  min-width: 0;
  min-height: 127px;
  padding: 12px 14px;
  border: 1px solid #ffffff;
  border-radius: var(--figma-item-radius, 8px);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 8px 22px rgba(38, 67, 125, 0.06);
}
```

- [ ] **Step 4: Align the treemap container and exact three-stage gradients**

Use a translucent/white-bordered 16px outer board and 8px stage items. Set the header height to 60px and exact 90-degree gradients:

```css
.industry-treemap-stage header {
  position: relative;
  min-height: 60px;
  background: linear-gradient(90deg, #edf4ff 0%, #b5ccff 100%);
}

.industry-treemap-stage.stage-midstream header {
  background: linear-gradient(90deg, #e9f8fe 0%, #a8dfe7 100%);
}

.industry-treemap-stage.stage-downstream header {
  background: linear-gradient(90deg, #f5f2ff 0%, #d4bfff 100%);
}
```

At desktop widths, create the Figma arrow/chevron silhouette with `clip-path`:

```css
.industry-treemap-stage.stage-upstream header {
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%);
}

.industry-treemap-stage.stage-midstream header {
  clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%);
}

.industry-treemap-stage.stage-downstream header {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 18px 50%);
}
```

Retain `overflow: visible` around the three stage headers and enough horizontal padding so copy/badges do not enter the chevron tips.

- [ ] **Step 5: Add narrow-width degradation for the chevrons**

Inside the existing breakpoint that changes `.industry-treemap-board` to one column, add:

```css
.industry-treemap-stage.stage-upstream header,
.industry-treemap-stage.stage-midstream header,
.industry-treemap-stage.stage-downstream header {
  clip-path: none;
}
```

This restores rounded rectangles when the stages stack.

- [ ] **Step 6: Run chain-focused tests**

Run:

```bash
cd major-construction-platform
npm test -- --test-name-pattern='Figma|chain KPI|metric detail'
```

Expected: chain and dialog tests PASS; regional geometry assertions remain FAIL until Task 3.

- [ ] **Step 7: Inspect the diff and commit the chain slice**

Run:

```bash
git diff --check
git diff -- major-construction-platform/src/styles/20-talent.css major-construction-platform/tests/industry-research-figma-ui.test.mjs
git status --short
```

Commit only the chain/test slice:

```bash
git add major-construction-platform/src/styles/20-talent.css major-construction-platform/tests/industry-research-figma-ui.test.mjs
git commit -m "style: align industry chain with Figma"
```

---

## Task 3: Align the regional dashboard and approved map palette

**Files:**
- Modify: `major-construction-platform/src/styles/20-talent.css:1834-2245`
- Modify: `major-construction-platform/src/styles/20-talent.css:3678-3735`
- Modify: `major-construction-platform/src/styles/20-talent.css:5825-5910`
- Test: `major-construction-platform/tests/industry-research-figma-ui.test.mjs`

- [ ] **Step 1: Apply the shared translucent KPI surface to the three regional cards**

Keep the three equal columns and current KPI content. Use 16px gap, 127px minimum card height, 12px/14px padding, white border, 8px item radius and the shared 70%-white surface. Do not change the 31 / company sample / key-city calculations.

- [ ] **Step 2: Match the 1170px Figma row ratio and 629px reference height**

Use a responsive 775:379 ratio instead of fixed 320px-only ranking width:

```css
.industry-region-figma-dashboard {
  grid-template-columns: minmax(0, 2.04fr) minmax(320px, 1fr);
  gap: 16px;
  align-items: stretch;
}

.industry-region-figma-dashboard .research-card {
  border-color: #ffffff;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 28px rgba(38, 67, 125, 0.06);
}

.industry-region-figma-dashboard .professional-geo-map-card,
.industry-region-figma-dashboard .industry-rank-card {
  height: 629px;
  min-height: 629px;
}
```

Preserve TOP15 row count, click targets and rank values; only rebalance available width/height and spacing.

- [ ] **Step 3: Correct the map ramp to the eight exact Figma colors**

Map the current heat classes and scale stops across these exact values, darkest to lightest:

```css
#0a2ec9
#173ffb
#113fff
#346bff
#5992ff
#8bb0ff
#b5d6ff
#d6eaff
```

Keep `#e7f0ff` only for very-low-data/no-emphasis fallback. Do not delete any `heat-*` class used by the AI province/city/district rendering; if nine semantic classes remain, the lowest class uses the fallback and the remaining eight classes use the approved ramp. Replace every old `#8bbaff` occurrence with `#8bb0ff`, including map scale and city/district heat styles.

- [ ] **Step 4: Preserve drill-down readability and responsive stacking**

Confirm the same regional dashboard class is used by national, AI city and AI district maps in both entries. Retain the current breakpoint rule:

```css
.industry-region-figma-dashboard {
  grid-template-columns: 1fr;
}
```

At the stacked breakpoint, allow cards to use content-driven height or a safe minimum instead of forcing two consecutive 629px panels if existing mobile rules already relax height; add a scoped override only if browser inspection shows clipping.

- [ ] **Step 5: Run all industry research tests**

Run:

```bash
cd major-construction-platform
npm test -- --test-name-pattern='industry|Figma|regional|chain|metric'
```

Expected: PASS, including both Vue/static entry assertions, KPI dialog/accessibility checks and exact palette/geometry checks.

- [ ] **Step 6: Inspect the diff and commit the regional slice**

Run:

```bash
git diff --check
git diff -- major-construction-platform/src/styles/20-talent.css major-construction-platform/tests/industry-research-figma-ui.test.mjs
git status --short
```

Commit:

```bash
git add major-construction-platform/src/styles/20-talent.css major-construction-platform/tests/industry-research-figma-ui.test.mjs
git commit -m "style: align regional industry analysis with Figma"
```

---

## Task 4: Full verification and browser visual QA

**Files:**
- Verify: `major-construction-platform/src/App.vue`
- Verify: `major-construction-platform/index.html`
- Verify: `major-construction-platform/src/styles/20-talent.css`
- Verify: `major-construction-platform/tests/industry-research-figma-ui.test.mjs`

- [ ] **Step 1: Run the complete automated test suite**

Run:

```bash
cd major-construction-platform
npm test
```

Expected: exit code 0 with no failing tests.

- [ ] **Step 2: Run the production build**

Run:

```bash
cd major-construction-platform
npm run build
```

Expected: Vue type-check, Vite build and worker build all exit 0. If any command fails, record the exact command and first actionable error before changing code.

- [ ] **Step 3: Start the local site and inspect the Vue entry at 1440px reference width**

Run:

```bash
cd major-construction-platform
npm run dev -- --host 127.0.0.1
```

Use the Chrome control skill and inspect:

- 产业链图谱 / 矩形树图: translucent 16px outer card, 4 equal KPI cards, 16px gaps, exact three gradients, chevron headers, no clipped node copy.
- 产业链图谱 / 桑基图: switch state and existing Sankey interactions still work.
- 国标行业 KPI dialog: click, keyboard focus, Escape close and all Figma sections remain intact.
- 区域产业分析: 3 equal KPI cards, map/rank ratio close to 775/379, 629px row, TOP15 visible, exact eight-color ramp, hover/drill-down still works.

- [ ] **Step 4: Inspect the static entry and a narrow viewport**

Open the served root static entry that exercises `index.html` and repeat the chain/region smoke checks. Then use a narrow viewport around 768px:

- treemap stages stack and chevrons become rounded rectangles;
- regional map/rank cards stack without horizontal overflow;
- KPI grids reduce columns as before;
- dialogs remain within the viewport.

- [ ] **Step 5: Apply only evidence-based visual polish and rerun verification**

If the browser reveals clipping, overflow or a selector mismatch, patch the smallest scoped rule. Then rerun:

```bash
cd major-construction-platform
npm test
npm run build
git diff --check
```

- [ ] **Step 6: Final self-review against the approved design specification**

Check each item explicitly:

- Background `#D7E4FF`.
- Cards `rgba(255,255,255,0.7)` with 1px white border.
- 16px outer and 8px item radii.
- Chain gradients exactly `#EDF4FF→#B5CCFF`, `#E9F8FE→#A8DFE7`, `#F5F2FF→#D4BFFF`, all 90deg.
- Regional palette includes all eight approved colors and no `#8BBAFF` typo.
- Both Vue and static entries contain the same semantic classes.
- All loading/error/empty and interactive states remain present.
- No placeholders, no TODOs, no fabricated values, no unrelated navigation changes.

- [ ] **Step 7: Commit any final QA-only polish**

If Task 4 changed files, commit only those changes:

```bash
git add major-construction-platform/src/styles/20-talent.css major-construction-platform/tests/industry-research-figma-ui.test.mjs
git commit -m "test: verify industry Figma alignment"
```

If no files changed after browser QA, do not create an empty commit.
