# Smart Construction Report PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the industry research report flow so it uses `智能建造工程专业` data, generates a serious long-form report with charts and tables, and exports a real downloadable PDF directly to the local machine.

**Architecture:** Keep the existing report library/create/editor flow in both the Vue app and the root `index.html` demo entry. Replace the current print-window export with client-side PDF generation, expand the report mock data and long-form HTML source, and keep the same light design language already used by the demo.

**Tech Stack:** Vue 3, Vite, TypeScript, static HTML/JS fallback, client-side PDF library, Node test runner.

---

### Task 1: Prepare the Export Pipeline

**Files:**
- Modify: `package.json`
- Modify: `src/App.vue`
- Modify: `index.html`

- [ ] **Step 1: Add a browser-side PDF generator**

Install and wire a library that can render the existing rich HTML report into a real `.pdf` file download without relying on the browser print dialog.

- [ ] **Step 2: Replace print-window export**

Swap the current `printReportPdf` implementation for a true download flow that captures the report document, applies export-specific styles, and saves a named PDF file locally.

- [ ] **Step 3: Keep both report entry points aligned**

Update the Vue report editor/export flow and the root static `index.html` report flow so both export the same way.

### Task 2: Rebuild the Report Content Around Smart Construction

**Files:**
- Modify: `src/mock/research-report.ts`
- Modify: `src/App.vue`
- Modify: `index.html`

- [ ] **Step 1: Replace report seed metadata**

Update report titles, industry labels, major names, and default form values so the report is centered on `智能建造工程专业` and `智能建造产业链`.

- [ ] **Step 2: Expand the正文 to long-form report content**

Rewrite the main report HTML to a serious, structured report of roughly 4000 Chinese characters, covering industry background, policy environment, regional distribution, enterprise structure,岗位 demand,技术 evolution,专业建设建议, and总结建议.

- [ ] **Step 3: Enrich with charts, tables, and figure blocks**

Add properly formatted visual sections such as a structured industry figure, demand chart, enterprise distribution chart/table, and professional recommendation table so the report is图文并茂 rather than plain text only.

### Task 3: Polish the Editor and Download Experience

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`
- Modify: `index.html`

- [ ] **Step 1: Keep the report layout严肃协调**

Tune export typography, table density, figure sizing, spacing, and pagination so the generated report looks formal and readable in both on-screen preview and PDF output.

- [ ] **Step 2: Preserve the existing create/edit flow**

Ensure AI generation loading, report editing, save action, and PDF export still work smoothly after the content and export refactor.

### Task 4: Verify Build and Export Behavior

**Files:**
- Read: generated build output only

- [ ] **Step 1: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 2: Verify the export path**

Open the demo, generate a report, trigger PDF export, and confirm a real PDF file is downloaded locally instead of opening a print dialog.

- [ ] **Step 3: Spot-check report content**

Confirm the generated report uses `智能建造工程专业` data, has substantial正文 content, and includes charts/tables in a polished layout.
