# Course Smart Association Auto-Apply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make course smart matching automatically associate every returned job and maintained task after loading, then return directly to the course drawer.

**Architecture:** Add a pure relation builder to the existing course matching module and use it at the end of the final loading stage. Remove selection-only state and markup from both Vue and standalone implementations while preserving the empty-result retry path.

**Tech Stack:** Vue 3, TypeScript, standalone JavaScript, Node test runner

**Spec:** `docs/superpowers/specs/2026-08-21-course-smart-association-auto-apply.md`

## Global Constraints

- Keep the existing three visible loading stages.
- Auto-apply all returned jobs and every maintained task.
- Replace this knowledge node's previous smart task relations without changing manual ability relations.
- Keep `src/App.vue` and root `index.html` synchronized.

---

### Task 1: Auto-apply relation contract

**Files:**
- Modify: `major-construction-platform/tests/course-smart-association.test.mjs`
- Modify: `major-construction-platform/src/app/course-smart-association.ts`

**Interfaces:**
- Consumes: `CourseSmartAssociationCandidate[]`
- Produces: `buildCourseSmartAssociationRelations(candidates)` returning all non-empty job/task relations

- [x] Write a failing test proving every returned job and all maintained tasks become relations while jobs without tasks are omitted.
- [x] Run `node --test tests/course-smart-association.test.mjs` and verify the missing export causes the expected failure.
- [x] Implement the minimal pure relation builder.
- [x] Re-run the focused test and verify it passes.

### Task 2: Vue automatic completion

**Files:**
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/tests/results-portal.test.mjs`

**Interfaces:**
- Consumes: `buildCourseSmartAssociationRelations(courseSmartAssociationCandidates.value)`
- Produces: replacement `courseNodeTaskRelations` entry and automatic dialog close after the final loading stage

- [x] Change the portal contract test to require auto-apply behavior and reject selection controls.
- [x] Run the focused portal test and verify the old selection flow fails it.
- [x] Apply all candidate tasks on final loading completion, remove selection state/functions/markup, and retain empty-result retry.
- [x] Re-run the focused portal and relation tests.

### Task 3: Standalone synchronization and verification

**Files:**
- Modify: `major-construction-platform/index.html`
- Modify: `major-construction-platform/src/styles/70-course-engine.css`

**Interfaces:**
- Consumes: standalone smart association candidates
- Produces: the same auto-apply, drawer refresh, and no-result retry behavior as Vue

- [x] Replace standalone draft selection and confirmation handlers with final-stage automatic association.
- [x] Remove obsolete result-selection CSS.
- [x] Run `npm test`.
- [x] Run `npm run build` and inspect the reported result.
