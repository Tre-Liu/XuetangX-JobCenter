# Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce token pressure from the oversized Vue and CSS entry files while preserving the current demo behavior.

**Architecture:** First restore and commit a clean baseline, then split CSS by contiguous feature sections without changing selector order. Next split the Vue entry along existing top-level view boundaries so `App.vue` becomes a router-like shell and large feature views move into focused files.

**Tech Stack:** Vue 3, Vite, TypeScript, CSS imports, Node test runner.

---

### Task 1: Baseline Checkpoint

**Files:**
- Modify: `index.html`
- Modify: `tests/job-task-editor.test.mjs`
- Modify: `tests/static-job-graph-data.test.mjs`

- [x] **Step 1: Reproduce baseline failures**

Run: `npm test`
Expected: Baseline static-entry tests fail before any architecture work.

- [x] **Step 2: Fix static entry root causes**

Restore missing file-mode decision center hooks, task/ability editing hooks, and current intelligent-construction test expectations.

- [x] **Step 3: Verify baseline**

Run: `npm test`
Expected: 111 tests pass.

- [x] **Step 4: Build baseline**

Run: `npm run build`
Expected: production build succeeds.

- [x] **Step 5: Commit**

Commit: `944603e test: restore static entry baseline`

### Task 2: CSS Module Split

**Files:**
- Modify: `src/styles.css`
- Create: `src/styles/00-base.css`
- Create: `src/styles/10-shell.css`
- Create: `src/styles/20-talent.css`
- Create: `src/styles/30-job-research.css`
- Create: `src/styles/40-job-center.css`
- Create: `src/styles/50-dialogs.css`
- Create: `src/styles/60-portrait.css`
- Create: `src/styles/70-course-engine.css`
- Create: `src/styles/80-report.css`
- Create: `src/styles/90-decision.css`

- [ ] **Step 1: Split by contiguous line ranges**

Move existing CSS blocks into ordered files without changing selector order inside each moved range.

- [ ] **Step 2: Replace root CSS with imports**

`src/styles.css` imports the ordered module files.

- [ ] **Step 3: Verify**

Run: `npm test`
Expected: 111 tests pass.

Run: `npm run build`
Expected: production build succeeds.

### Task 3: Vue Entry Split

**Files:**
- Modify: `src/App.vue`
- Create: `src/views/ResultsPortalView.vue`
- Create: `src/views/JobCompetencyMapView.vue`
- Create: `src/views/MainWorkspaceView.vue`
- Create: `src/composables/useJobGraph.ts`

- [ ] **Step 1: Extract standalone result and competency views**

Move top-level `isResultsPortal` and `isJobCompetencyMapView` template branches plus their directly required logic into focused view components.

- [ ] **Step 2: Extract graph measurement logic**

Move shared graph measurement helpers into `useJobGraph.ts` with the same public function names used by the views.

- [ ] **Step 3: Verify**

Run: `npm test`
Expected: 111 tests pass.

Run: `npm run build`
Expected: production build succeeds.

### Task 4: Final Checkpoint

**Files:**
- All files changed in Tasks 2 and 3.

- [ ] **Step 1: Measure line counts**

Run a line-count script for `src/App.vue`, `src/styles.css`, and new module files.

- [ ] **Step 2: Commit**

Commit message: `refactor: split oversized app and style entrypoints`
