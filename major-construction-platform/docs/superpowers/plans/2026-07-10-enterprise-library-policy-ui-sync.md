# 企业库同步政策库 UI 规范 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变企业数据与筛选分页口径的前提下，使普通企业库和人工智能企业库在 Vue 与静态入口中统一采用政策库已验收的 UI、响应式和无障碍规范。

**Architecture:** 以 `src/styles/20-talent.css` 为唯一视觉契约来源，在政策库和企业库根节点上定义共享 CSS 变量，并用明确的组合选择器统一三段画布、标签栏、AI 卡和控件。`src/App.vue` 与 `index.html` 保留各自的数据渲染方式，只补齐同名结构、键盘行为、稳定结果播报与焦点恢复。

**Tech Stack:** Vue 3、TypeScript、Vite、原生浏览器 JavaScript、Node.js test runner。

## Global Constraints

- 保留企业库现有四列表格、企业 logo、产业分组、搜索字段、普通企业库每页 6 条以及人工智能企业库的完整筛选与分页口径。
- 同时修改 Vue 入口和源 `index.html` 静态入口。
- 不新增运行时依赖，不修改企业数据和人工智能产业链数据包。
- 不把政策关键词云、政策趋势图或政策详情弹窗移植到企业库。
- 桌面主校准画布为 938px，高度分配为 `32px 106px 732px`，画布内边距 16px、行间距 18px。
- 产业链标签按钮最小高度 28px、字号 13px、字重 600；支持 ArrowLeft、ArrowRight、Home、End。
- AI 卡在桌面端固定 106px；900px 及以下允许自适应增高。
- 1240px 及以下工具栏不得溢出；表格在卡片内部横向滚动。
- 结果播报节点必须稳定存在于列表重绘区域之外，并使用 `role=status aria-live=polite aria-atomic=true`。
- 实施遵循 TDD：每项生产代码修改前必须先运行对应测试并看到预期失败。

---

## File Map

- Modify `tests/industry-company-library-design.test.mjs`: 企业库视觉契约、双入口结构、无障碍与响应式源代码回归。
- Modify `src/styles/20-talent.css`: 政策库/企业库共享 CSS 变量、三段画布、标签、AI 卡、列表控件、表格滚动、分页焦点与响应式规则。
- Modify `src/App.vue`: 普通与 AI 企业库的 tabpanel/tab 语义、键盘切换、稳定结果播报、控件类名和精简研判文案。
- Modify `index.html`: 与 Vue 等价的企业库结构、键盘切换、稳定播报、IME/光标保持和筛选焦点恢复。
- Update `docs/superpowers/specs/2026-07-10-enterprise-library-policy-ui-sync-design.md` only if implementation reveals a genuine design contradiction; otherwise leave it unchanged.

---

### Task 1: 建立政策库与企业库共享视觉契约

**Files:**
- Modify: `major-construction-platform/tests/industry-company-library-design.test.mjs`
- Modify: `major-construction-platform/src/styles/20-talent.css`

**Interfaces:**
- Consumes: existing selectors `.policy-board`, `.industry-company-board`, `.policy-chain-row`, `.industry-company-chain-row`, `.policy-ai-card`, `.industry-company-ai-card`.
- Produces: shared variables `--library-board-bg`, `--library-card-bg`, `--library-border`, `--library-control-border`, `--library-title`, `--library-copy` scoped to both board roots.

- [ ] **Step 1: Replace the old enterprise-only visual assertions with failing shared-contract assertions**

In `tests/industry-company-library-design.test.mjs`, update the visual test to assert these exact contracts:

```js
const companyBoardStyles = styleBlock('.industry-company-board')
assert.match(companyBoardStyles, /grid-template-rows:\s*32px 106px 732px/)
assert.match(companyBoardStyles, /gap:\s*18px/)
assert.match(companyBoardStyles, /height:\s*938px/)
assert.match(companyBoardStyles, /min-height:\s*938px/)
assert.match(companyBoardStyles, /padding:\s*16px/)
assert.match(companyBoardStyles, /background:\s*var\(--library-board-bg\)/)
assert.match(styleBlock('.industry-company-chain-row'), /height:\s*32px/)
assert.match(styleBlock('.industry-company-chain-row'), /background:\s*rgba\(255, 255, 255, 0\.42\)/)
assert.match(styleBlock('.industry-company-segments button'), /min-height:\s*28px/)
assert.match(styleBlock('.industry-company-segments button'), /font-weight:\s*600/)
assert.match(styleBlock('.industry-company-segments button.active'), /background:\s*rgba\(255, 255, 255, 0\.92\)/)
assert.match(styleBlock('.industry-company-ai-card'), /height:\s*106px/)
assert.match(styleBlock('.industry-company-ai-card'), /gap:\s*24px/)
assert.match(styleBlock('.industry-company-ai-card'), /padding:\s*10px 20px 12px/)
assert.match(styleBlock('.industry-company-ai-card strong'), /font-size:\s*14px/)
assert.match(styleBlock('.industry-company-ai-card strong'), /font-weight:\s*600/)
assert.match(styleBlock('.industry-company-ai-bullets li'), /font-size:\s*14px/)
assert.match(styleBlock('.industry-company-ai-bullets li'), /font-weight:\s*400/)
assert.match(styleBlock('.industry-company-ai-bullets li'), /line-height:\s*24px/)
assert.match(styleBlock('.industry-company-list-card'), /height:\s*732px/)
assert.match(styleBlock('.industry-company-list-card'), /border:\s*1px solid #ffffff/)
assert.match(styleBlock('.industry-company-list-card'), /background:\s*var\(--library-card-bg\)/)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/industry-company-library-design.test.mjs
```

Expected: FAIL because the current enterprise board still uses `auto auto minmax(0, 1fr)`, 14px padding/gap, 36px tabs, a 108px AI card, and older colors.

- [ ] **Step 3: Implement the shared board variables and enterprise layout**

In `src/styles/20-talent.css`, add the shared root contract immediately before `.industry-company-board` and update the enterprise blocks:

```css
.policy-board,
.industry-company-board {
  --library-board-bg: #d6e4ff;
  --library-card-bg: #f3f7ff;
  --library-border: #ffffff;
  --library-control-border: rgba(16, 63, 183, 0.17);
  --library-title: #2b2e35;
  --library-copy: #495d87;
}

.industry-company-board {
  display: grid;
  align-content: start;
  grid-template-rows: 32px 106px 732px;
  gap: 18px;
  height: 938px;
  min-height: 938px;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 8px;
  background: var(--library-board-bg);
}
```

Set `.industry-company-chain-row` to `height: 32px` and `background: rgba(255, 255, 255, 0.42)`. Set its buttons to the policy values `min-height: 28px`, `font-weight: 600`, and active background `rgba(255, 255, 255, 0.92)`.

Set `.industry-company-ai-card` to `gap: 24px`, `height: 106px`, `padding: 10px 20px 12px`, and `background: #eff4ff`. Give its title the same gradient text declaration used by `.policy-ai-card strong`; set bullets to `gap: 0`, `color: var(--library-copy)`, `font-size: 14px`, `font-weight: 400`, `line-height: 24px`.

Set `.industry-company-list-card` to `height: 732px`, `border: 1px solid var(--library-border)`, `background: var(--library-card-bg)`. Set its title to `color: var(--library-title)`, `font-weight: 600`, `line-height: 26px`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/industry-company-library-design.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add major-construction-platform/tests/industry-company-library-design.test.mjs major-construction-platform/src/styles/20-talent.css
git commit -m "style: align enterprise library with policy UI"
```

---

### Task 2: 同步 Vue 企业库交互与无障碍语义

**Files:**
- Modify: `major-construction-platform/tests/industry-company-library-design.test.mjs`
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/src/styles/20-talent.css`

**Interfaces:**
- Consumes: `industryCompanySegments`, `setIndustryCompanySegment(segmentKey)`, `filteredIndustryCompanyItems`, `filteredAiIndustryCompanies`, `nextTick`.
- Produces: `handleIndustryCompanyTabKeydown(event, segmentKey)`, stable `.industry-company-result-announcer`, and policy-compatible `.industry-company-search-box` / `.industry-company-filter-select` control classes.

- [ ] **Step 1: Add failing Vue semantics assertions**

Append a test that asserts:

```js
test('Vue enterprise library exposes policy-compatible tab and live-result behavior', () => {
  assert.match(appVue, /handleIndustryCompanyTabKeydown/)
  assert.match(appVue, /:tabindex="activeIndustryCompanySegmentKey === segment\.key \? 0 : -1"/)
  assert.match(appVue, /:aria-controls="'industry-company-panel'"/)
  assert.match(appVue, /id="industry-company-panel"/)
  assert.match(appVue, /industry-company-segments" role="tablist" aria-label="人工智能产业企业库分类"/)
  assert.match(appVue, /@keydown="handleIndustryPolicyTabKeydown\(\$event, industry\)"/)
  assert.match(appVue, /class="industry-company-result-announcer" role="status" aria-live="polite" aria-atomic="true"/)
  assert.match(appVue, /class="industry-company-search industry-company-search-box"/)
  assert.match(appVue, /role="status" aria-live="polite"[\s\S]*?未找到匹配企业/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run `node --test tests/industry-company-library-design.test.mjs`.

Expected: FAIL because the enterprise tabs have no roving tabindex, keyboard handler, tabpanel id, or stable result announcer.

- [ ] **Step 3: Implement Vue keyboard handling and stable result announcement**

Add beside `handleIndustryPolicyTabKeydown`:

```ts
const handleIndustryCompanyTabKeydown = (event: KeyboardEvent, segmentKey: string) => {
  const currentIndex = industryCompanySegments.findIndex((segment) => segment.key === segmentKey)
  if (currentIndex < 0) return
  let nextIndex = currentIndex
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % industryCompanySegments.length
  else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + industryCompanySegments.length) % industryCompanySegments.length
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = industryCompanySegments.length - 1
  else return
  event.preventDefault()
  setIndustryCompanySegment(industryCompanySegments[nextIndex].key)
  const tablist = event.currentTarget instanceof HTMLElement ? event.currentTarget.parentElement : null
  nextTick(() => tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus({ preventScroll: true }))
}
```

Give the ordinary board `id="industry-company-panel" role="tabpanel" :aria-label="activeIndustryCompanySegment.label"`. Add `:aria-controls="'industry-company-panel'"`, `:tabindex`, and `@keydown` to ordinary tabs. Add equivalent `role=tablist`, `role=tab`, `aria-selected`, `aria-controls`, and tabindex semantics to AI enterprise chain tabs, and route their `@keydown` to the existing `handleIndustryPolicyTabKeydown($event, industry)` because that handler already operates on the same five chain options.

Place one stable announcer directly inside each enterprise board and before the chain row:

```html
<span class="industry-company-result-announcer" role="status" aria-live="polite" aria-atomic="true">
  产业企业库，共{{ filteredIndustryCompanyItems.length }}家企业
</span>
```

Use the AI filtered count in the AI board. Add `role="status" aria-live="polite"` to both empty states. Add accessible labels to search inputs and AI filters.

Shorten the ordinary three bullets to three single-line conclusions while preserving the existing meanings: representative project resources, industry-node/job linkage, and the three screening standards.

- [ ] **Step 4: Align Vue control classes and CSS**

Add `industry-company-search-box` to both search labels and `industry-company-filter-select` to AI filter labels. In CSS, make these use the policy control height, border, background, placeholder, and `:focus-within` ring. Reuse `policy-search.svg` for a masked search icon rendered by `.industry-company-search-box > span`.

Add:

```css
.industry-company-result-announcer {
  position: fixed;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.industry-company-segments button:focus-visible,
.industry-company-pagination button:focus-visible,
.ai-company-filters > button:focus-visible {
  outline: 2px solid #3764ff;
  outline-offset: 2px;
}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run `node --test tests/industry-company-library-design.test.mjs`.

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add major-construction-platform/tests/industry-company-library-design.test.mjs major-construction-platform/src/App.vue major-construction-platform/src/styles/20-talent.css
git commit -m "feat: add accessible enterprise library controls"
```

---

### Task 3: 同步静态入口的键盘、播报与焦点恢复

**Files:**
- Modify: `major-construction-platform/tests/industry-company-library-design.test.mjs`
- Modify: `major-construction-platform/index.html`

**Interfaces:**
- Consumes: `staticIndustryCompanySegments`, `staticActiveCompanySegment`, `staticCompanySearchText`, `staticAiIndustryCompany*Filter`, `renderIndustry('company', options)`.
- Produces: stable `#static-company-result-announcer`, `announceStaticCompanyResults(count)`, roving enterprise tabs, and focus-preserving static search/filter updates.

- [ ] **Step 1: Add failing static behavior assertions**

Append assertions for:

```js
assert.match(staticIndexHtml, /id="static-company-result-announcer" class="industry-company-result-announcer" role="status" aria-live="polite" aria-atomic="true"/)
assert.match(staticIndexHtml, /const announceStaticCompanyResults = \(count\) =>/)
assert.match(staticIndexHtml, /data-company-tabpanel/)
assert.match(staticIndexHtml, /data-static-company-segment[^>]*tabindex="\$\{segment\.key === activeSegment\.key \? '0' : '-1'\}"/)
assert.match(staticIndexHtml, /const companyTab = target\.closest\('\.industry-company-segments \[data-static-company-segment\]'\)/)
assert.match(staticIndexHtml, /const aiCompanyChainTab = target\.closest\('\.industry-company-segments \[data-current-industry-chain-tab\]'\)/)
assert.match(staticIndexHtml, /event\.isComposing[\s\S]*?data-static-company-search/)
assert.match(staticIndexHtml, /setSelectionRange\(selectionStart, selectionEnd\)/)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run `node --test tests/industry-company-library-design.test.mjs`.

Expected: FAIL because the static enterprise renderer replaces its result text, lacks roving tabindex and keyboard switching, and loses ordinary-search focus during input rerender.

- [ ] **Step 3: Add the stable announcer and static markup semantics**

Add the announcer beside the existing static policy announcer, outside `#app`:

```html
<span id="static-company-result-announcer" class="industry-company-result-announcer" role="status" aria-live="polite" aria-atomic="true"></span>
```

Cache it beside `staticPolicyResultAnnouncer` and implement:

```js
const announceStaticCompanyResults = (count) => {
  if (!staticCompanyResultAnnouncer || staticCompanyResultAnnouncer === app) return
  staticCompanyResultAnnouncer.textContent = ''
  requestAnimationFrame(() => {
    staticCompanyResultAnnouncer.textContent = `产业企业库，共${count}家企业`
  })
}
```

Give ordinary and AI boards `id="industry-company-panel" role="tabpanel" data-company-tabpanel`. Generate all company tabs with `role="tab"`, `aria-selected`, `aria-controls="industry-company-panel"`, and roving `tabindex`.

Call `announceStaticCompanyResults(filtered.length)` after rendering the company tab. Add `role="status" aria-live="polite"` to both static empty states.

- [ ] **Step 4: Implement static keyboard switching and focus preservation**

In the existing `keydown` handler, handle ordinary enterprise tabs with the same key set as policy tabs. After assigning `staticActiveCompanySegment`, rerender and focus the selected tab in `requestAnimationFrame`.

Handle AI enterprise chain tabs separately with `.industry-company-segments [data-current-industry-chain-tab]`. Calculate the next index from `reportIndustryOptions`, assign `staticSelectedIndustryChain`, call `ensureStaticAiIndustryChainData()` when the next option is `人工智能产业链`, rerender `company`, and focus the active chain tab after the rerender.

For ordinary search input, mirror the policy/AI IME-safe flow:

```js
if (target.matches('[data-static-company-search]')) {
  staticCompanySearchText = target.value
  staticCompanyPage = 1
  if (event.isComposing) return
  const selectionStart = target.selectionStart ?? staticCompanySearchText.length
  const selectionEnd = target.selectionEnd ?? selectionStart
  renderIndustry('company', { preserveScroll: true })
  const search = app.querySelector('[data-static-company-search]')
  if (search instanceof HTMLInputElement) {
    search.focus({ preventScroll: true })
    search.setSelectionRange(selectionStart, selectionEnd)
  }
  return
}
```

After AI select rerender, restore focus to the selector with the same data attribute. After clearing AI filters, restore focus to `[data-ai-company-clear]`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run `node --test tests/industry-company-library-design.test.mjs`.

Expected: PASS.

- [ ] **Step 6: Run the static and AI dual-entry regression set**

Run:

```bash
node --test tests/industry-company-library-design.test.mjs tests/ai-industry-chain-dual-entry.test.mjs tests/results-portal.test.mjs
```

Expected: PASS with zero failures.

- [ ] **Step 7: Commit Task 3**

```bash
git add major-construction-platform/tests/industry-company-library-design.test.mjs major-construction-platform/index.html
git commit -m "feat: align static enterprise library behavior"
```

---

### Task 4: 响应式、全量验证与浏览器 QA

**Files:**
- Modify: `major-construction-platform/tests/industry-company-library-design.test.mjs`
- Modify: `major-construction-platform/src/styles/20-talent.css`
- Create only if screenshots are captured: `artifacts/enterprise-library-policy-ui-sync/*`

**Interfaces:**
- Consumes: completed enterprise board, controls, table and both rendering entries.
- Produces: verified 1240px/900px responsive contracts and final QA evidence.

- [ ] **Step 1: Add failing responsive assertions**

Add:

```js
assert.match(stylesCss, /@media \(max-width:\s*1240px\) \{[\s\S]*?\.industry-company-list-head \{[\s\S]*?grid-template-columns:\s*minmax\(160px, 1fr\) minmax\(220px, 1\.4fr\)/)
assert.match(stylesCss, /@media \(max-width:\s*1240px\) \{[\s\S]*?\.ai-company-filters \{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
assert.match(stylesCss, /@media \(max-width:\s*900px\) \{[\s\S]*?\.industry-company-ai-card \{[\s\S]*?grid-template-columns:\s*1fr[\s\S]*?height:\s*auto/)
assert.match(styleBlock('.industry-company-table-wrap'), /overflow:\s*auto/)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run `node --test tests/industry-company-library-design.test.mjs`.

Expected: FAIL until the enterprise toolbar/filter breakpoints and two-axis table scrolling are explicit.

- [ ] **Step 3: Implement the responsive rules**

In `src/styles/20-talent.css`:

```css
.industry-company-table-wrap {
  overflow: auto;
  scrollbar-gutter: stable;
}

@media (max-width: 1240px) {
  .industry-company-list-head {
    grid-template-columns: minmax(160px, 1fr) minmax(220px, 1.4fr);
    gap: 8px;
    padding: 18px 16px 12px;
  }

  .ai-company-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .industry-company-board {
    grid-template-rows: 32px auto minmax(732px, 1fr);
    height: auto;
  }

  .industry-company-ai-card {
    grid-template-columns: 1fr;
    height: auto;
    padding: 16px;
  }
}
```

- [ ] **Step 4: Run focused and full automated verification**

Run:

```bash
node --test tests/industry-company-library-design.test.mjs tests/ai-industry-chain-dual-entry.test.mjs tests/results-portal.test.mjs
npm test
npm run build
```

Expected: all tests pass; build exits 0. Existing Vite chunk-size or external-script warnings may remain, but no new errors are acceptable.

- [ ] **Step 5: Run browser QA at desktop and responsive widths**

Start the project with `npm run dev -- --port 5173`. Verify these URLs and states:

- `http://127.0.0.1:5173/?view=job-industry&tab=company` at 1440×988: ordinary enterprise tabs, AI card, six-row table, search, pagination.
- Same URL after selecting `人工智能产业链`: loading/retry, four filters, clear action, table, pagination.
- Same two states at 1180×720: toolbar stays within the list card and the table scrolls inside the card.
- Keyboard: ArrowLeft/ArrowRight/Home/End changes ordinary enterprise tabs and retains focus.
- Search: ordinary and AI search retain focus and caret; empty results announce the new count.
- Browser console: zero new errors.

If screenshots are captured, store them under `artifacts/enterprise-library-policy-ui-sync/` and reference their absolute paths in the handoff.

- [ ] **Step 6: Commit Task 4**

```bash
git add major-construction-platform/tests/industry-company-library-design.test.mjs major-construction-platform/src/styles/20-talent.css
git commit -m "test: verify enterprise library UI parity"
```

---

## Final Completion Checklist

- [ ] Re-read `docs/superpowers/specs/2026-07-10-enterprise-library-policy-ui-sync-design.md` and match every acceptance criterion to fresh evidence.
- [ ] Confirm `git status --short` contains no unintended files.
- [ ] Confirm the latest `npm test` reports zero failures.
- [ ] Confirm the latest `npm run build` exits 0.
- [ ] Report exact commands, pass counts, build warnings, browser states, and any remaining limitation.
