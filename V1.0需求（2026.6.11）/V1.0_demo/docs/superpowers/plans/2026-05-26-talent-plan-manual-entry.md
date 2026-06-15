# Talent Plan Manual Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the manual-entry demonstration framework for 人才方案管理.

**Architecture:** Keep the current single-file Vue pattern and static file fallback. Add demo data constants and rendering branches for the talent plan created state, then mirror the same structure in `index.html` for direct file opening.

**Tech Stack:** Vue 3, TypeScript, Vite, plain CSS, node:test.

---

### Task 1: Add Failing Coverage

**Files:**
- Modify: `tests/results-portal.test.mjs`

- [ ] **Step 1: Add tests for talent manual entry**

Append tests that read `src/App.vue` and `index.html` and assert the manual-entry flow plus five sections exist.

- [ ] **Step 2: Run the tests**

Run: `npm test`

Expected: the new tests fail because the demo state and static manual-entry rendering are not implemented yet.

### Task 2: Implement Vue Talent Demo State

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`

- [ ] **Step 1: Add talent demo data and state**

Add constants for goals, graduation requirements, courses, matrix rows, and student table columns. Add `activeTalentSection` and `talentPlanCreated`.

- [ ] **Step 2: Wire manual entry**

Update `startManualCultivateEntry()` to close the dialog, set `talentPlanCreated` to true, set `activeTalentSection` to 培养目标, and keep the user in 人才方案管理.

- [ ] **Step 3: Render five views**

Replace the talent empty-state-only branch with conditional rendering: empty state before creation, demo shell after creation. Side buttons select sections.

- [ ] **Step 4: Add styles**

Add compact panel, row, hierarchy, table, matrix, and pagination styles that match the supplied screenshots.

### Task 3: Implement Static Index Fallback

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add static demo data**

Add arrays for goals, requirements, courses, matrix rows, and table columns inside the file-protocol script.

- [ ] **Step 2: Add static render helpers**

Add `talentPlanDemoHtml(section)` and update `renderTalent()` to accept empty or demo mode.

- [ ] **Step 3: Wire static clicks**

Make the static "手工录入" button close the dialog and render demo mode. Add click handling for talent side buttons.

### Task 4: Verify

**Files:**
- No new files.

- [ ] **Step 1: Run tests**

Run: `npm test`

Expected: all node tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.
