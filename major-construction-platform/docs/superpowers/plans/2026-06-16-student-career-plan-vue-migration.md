# Student Career Plan Vue Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the standalone student career plan page into the existing Vue/Vite project as the single maintained implementation.

**Architecture:** The Vue route `index.html?view=student-career-plan` remains the primary page. Student plan content moves into `src/app/student-career-plan-data.ts`, `src/App.vue` imports that module, and `student-career-plan/index.html` becomes a small compatibility redirect into the Vue route.

**Tech Stack:** Vue 3, Vite, TypeScript, Node test runner.

---

## File Structure

- Create `major-construction-platform/src/app/student-career-plan-data.ts`: typed source of truth for student plan labels, overview text, goals, requirements, course samples, jobs, and prompts.
- Modify `major-construction-platform/src/App.vue`: import the new data module and replace derived generic talent data for this page with the student-career-plan data.
- Create `major-construction-platform/student-career-plan/index.html`: compatibility redirect into `../index.html?view=student-career-plan`.
- Modify `major-construction-platform/tests/student-career-plan-static-index.test.mjs`: assert the compatibility entry redirects to the Vue route and does not duplicate the old static app.
- Modify `major-construction-platform/tests/student-career-plan.test.mjs`: assert the Vue view imports and renders from the student career plan data module.

### Task 1: Vue-Oriented Regression Tests

**Files:**
- Modify: `major-construction-platform/tests/student-career-plan-static-index.test.mjs`
- Modify: `major-construction-platform/tests/student-career-plan.test.mjs`

- [ ] **Step 1: Write failing tests**

Update `student-career-plan-static-index.test.mjs` so it reads `../student-career-plan/index.html`, expects a redirect to `../index.html?view=student-career-plan`, and rejects the old static implementation markers such as `const planData =` and `function renderGoals`.

Update `student-career-plan.test.mjs` to assert that `src/App.vue` imports `studentCareerPlanData`, references `studentCareerPlanData.title`, and still exposes the three tabs and prompt behavior.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- tests/student-career-plan-static-index.test.mjs tests/student-career-plan.test.mjs`

Expected: FAIL because `student-career-plan/index.html` does not exist and `App.vue` does not import `studentCareerPlanData`.

### Task 2: Data Module And Vue Wiring

**Files:**
- Create: `major-construction-platform/src/app/student-career-plan-data.ts`
- Modify: `major-construction-platform/src/App.vue`

- [ ] **Step 1: Add the data module**

Create a typed `studentCareerPlanData` export with:

- `title: '智能建造工程（学生端培养方案）'`
- `subtitle: '学生端培养方案'`
- `cohort: '2026级'`
- `schoolMark: 'AI'`
- `tabs: ['培养目标', '毕业要求', '课程体系']`
- `overview`, `goals`, `graduationOverview`, `requirements`, `semesters`, `jobs`, and `prompts` from the static page.

- [ ] **Step 2: Wire App.vue to the data module**

Import `studentCareerPlanData` and derive:

- `studentPlanTabs` from `studentCareerPlanData.tabs`
- `studentCareerAgentPrompts` from `studentCareerPlanData.prompts`
- `studentCurrentCourse` from the first semester course with `agent`
- `studentCareerJobs` from `studentCareerPlanData.jobs`
- `studentSemesterCourseGroups` from `studentCareerPlanData.semesters`

Replace hard-coded page title, subtitle, cohort, overview, goals, requirements, courses, and jobs with the imported data.

- [ ] **Step 3: Run tests to verify GREEN for Vue wiring**

Run: `npm test -- tests/student-career-plan.test.mjs`

Expected: PASS.

### Task 3: Compatibility Entry

**Files:**
- Create: `major-construction-platform/student-career-plan/index.html`

- [ ] **Step 1: Add compatibility redirect**

Create a small HTML file with title `学涯规划助手`, canonical link `../index.html?view=student-career-plan`, a JavaScript `location.replace('../index.html?view=student-career-plan')`, and a visible fallback link.

- [ ] **Step 2: Run tests to verify compatibility entry**

Run: `npm test -- tests/student-career-plan-static-index.test.mjs`

Expected: PASS.

### Task 4: Full Verification

**Files:**
- Verify only.

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/student-career-plan-static-index.test.mjs tests/student-career-plan.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: PASS or report any pre-existing failures with the failing test names and errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: Build exits 0.
