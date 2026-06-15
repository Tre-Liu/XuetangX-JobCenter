# Web Component Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the demo so the main application follows the Figma `# web端组件` light component system, while the results portal keeps a dark showcase theme.

**Architecture:** Keep the existing Vue and static demo structure intact. Add reusable CSS custom properties for the web component palette, apply them to the global shell, nav, sidebars, panels, buttons, and selected core module surfaces, and leave the results portal on its dark palette.

**Tech Stack:** Vue 3, Vite, TypeScript, CSS, Node test runner.

---

### Task 1: Lock the Visual Contract

**Files:**
- Modify: `tests/decision-center-static.test.mjs`
- Read: `src/styles.css`

- [ ] **Step 1: Write the failing test**

Add assertions that `src/styles.css` defines web component CSS tokens, applies them to `.app-shell`, `.content-area`, `.topbar`, `.section-menu`, `.job-module-menu`, `.canvas-card`, `.job-center-card`, and keeps `.results-portal-shell` dark.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/decision-center-static.test.mjs`
Expected: FAIL because the new token names and selector contracts do not exist yet.

### Task 2: Apply the Main App Web Component Theme

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add CSS tokens**

Define `--web-bg`, `--web-panel`, `--web-surface`, `--web-surface-strong`, `--web-border`, `--web-primary`, `--web-primary-hover`, `--web-primary-soft`, `--web-danger`, `--web-success`, and text tokens in `:root`.

- [ ] **Step 2: Update shell and navigation**

Use the tokens for `body`, `.app-shell`, `.dock`, `.topbar`, `.module-tab`, and `.module-tab.active`.

- [ ] **Step 3: Update sidebars and common panels**

Use the tokens for `.content-area`, `.section-menu`, `.job-module-menu`, `.canvas-card`, `.job-center-card`, and selected buttons.

- [ ] **Step 4: Run focused test**

Run: `npm test -- tests/decision-center-static.test.mjs`
Expected: PASS.

### Task 3: Verify the Demo

**Files:**
- Read: generated build output only

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Open local demo and inspect visually**

Run the Vite dev server, open the app in the in-app browser, and capture at least one screenshot of the main demo and the results portal.
