# Major Picker Pagination Overflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the official-major picker pagination inside its dialog at every supported viewport.

**Architecture:** Add one compact page-window helper to the Vue entry and mirror the same algorithm in both standalone HTML entries. Add defensive grid/flex width constraints to the existing CMS styles without changing data or initialization behavior.

**Tech Stack:** Vue 3, TypeScript, standalone HTML/JavaScript, CSS, Node test runner.

## Global Constraints

- Show first page, last page, current page ±2, and ellipsis gaps.
- Keep 8 majors per page and preserve all current selection behavior.
- Update Vue, root standalone HTML, and output standalone HTML together.
- Do not add dependencies.

---

### Task 1: Add the regression contract

**Files:**
- Modify: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: Vue and standalone source strings already loaded by the test.
- Produces: assertions for compact page tokens and dialog width containment.

- [ ] **Step 1: Write the failing test**

Assert that Vue exposes `buildCompactPageTokens`, renders ellipsis tokens, and does not iterate `cmsIndustryMajorPageNumbers`. Assert that both standalone entries build the same compact token list. Assert that `.cms-industry-major-dialog`, footer, and pagination have `min-width: 0` or width containment rules.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: FAIL because compact pagination contracts do not exist.

### Task 2: Implement compact pagination

**Files:**
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/src/styles/95-cms-admin.css`
- Modify: `major-construction-platform/industry-research-admin.html`
- Modify: `major-construction-platform/outputs/industry-research-admin.html`

**Interfaces:**
- Produces: `buildCompactPageTokens(currentPage, totalPages): Array<number | 'ellipsis'>` and equivalent standalone token construction.

- [ ] **Step 1: Add the minimal Vue helper and template rendering**

Build a sorted set containing `1`, `totalPages`, and `currentPage - 2` through `currentPage + 2` within bounds; insert `'ellipsis'` when adjacent values differ by more than one. Render ellipsis as a non-button span.

- [ ] **Step 2: Mirror the algorithm in both standalone entries**

Replace `Array.from({ length: totalPages })` with the compact token list and render ellipsis spans between page buttons.

- [ ] **Step 3: Add defensive width constraints**

Set `min-width: 0` on the dialog grid tracks, body, footer, and pagination; allow footer wrapping only when the viewport is too narrow.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: PASS.

### Task 3: Verify and publish

**Files:**
- Modify: `major-construction-platform/design-qa.md`

**Interfaces:**
- Consumes: local built page and supplied production screenshot.
- Produces: passed design QA evidence and a deployed Sites version.

- [ ] **Step 1: Run full verification**

Run: `npm test` and `npm run build`

Expected: all tests pass and the production build exits 0.

- [ ] **Step 2: Browser QA**

At desktop and compact desktop viewports, open the picker, switch levels, search, paginate, and confirm no horizontal overflow.

- [ ] **Step 3: Publish to the existing Sites project**

Package the verified build, push the exact archive source commit, save a new version, deploy it, and poll until `succeeded`.

