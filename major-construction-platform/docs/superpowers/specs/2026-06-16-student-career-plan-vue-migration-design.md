# Student Career Plan Vue Migration Design

## Goal

Move the standalone `student-career-plan.html` experience into the existing `major-construction-platform` Vue/Vite app so later large-scale edits happen in one maintained code path.

## Current Context

- The workspace root is not the build root. The Vue/Vite project lives in `major-construction-platform`.
- `src/App.vue` already has a `view=student-career-plan` branch with tabs, course cards, and the right-side planning assistant.
- `src/styles/25-student-career-plan.css` already owns the dedicated layout styles for this view.
- The root-level `student-career-plan.html` is a static snapshot and should not remain the primary implementation.
- The tracked `major-construction-platform/student-career-plan.html` path is currently deleted, so existing static tests need a Vue-oriented replacement.

## Architecture

Keep the student career plan inside the existing Vue app instead of creating a second project. Add a focused data module for the static page content, wire the existing Vue branch to that module, and expose a lightweight standalone HTML entry under `major-construction-platform/student-career-plan/index.html` that redirects into the Vue route.

The maintained page URL should be `index.html?view=student-career-plan`. The compatibility page exists only for old links and static smoke tests.

## Data And UI Boundaries

- `src/app/student-career-plan-data.ts` owns page text, tabs, jobs, prompts, requirements, and semester course samples.
- `src/App.vue` owns the Vue interaction state: active tab, active prompt, and input text.
- `src/styles/25-student-career-plan.css` remains the style owner for the view.
- `student-career-plan/index.html` is a tiny redirect shell, not a duplicate UI implementation.

## Testing

Use node tests before production edits:

- Update the static index test to expect a Vue redirect shell at `student-career-plan/index.html`.
- Add assertions that the Vue page imports the student career plan data module and uses Vue state rather than DOM string rendering.
- Keep the existing student career plan view tests for tabs, prompts, grouped courses, and styles.

## Migration Rules

- Do not keep a second full static HTML implementation.
- Do not remove unrelated generated outputs or user files.
- Preserve the current visual structure: left dock, topbar, three tabs, scrollable content, and right-side assistant.
- Preserve quick prompt behavior: clicking a prompt fills the input with that prompt plus a course name.
