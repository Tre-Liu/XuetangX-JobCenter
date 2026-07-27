# Report Library Text Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace report-library icon buttons with the text actions “编辑”, “下载”, and “删除”, while removing the copy entry.

**Architecture:** Keep the existing report event handlers and change only the action markup in the Vue view and file:// static fallback. Centralize the visual treatment in the existing report stylesheet, with a dedicated danger class for deletion.

**Tech Stack:** Vue 3 single-file component, static HTML/JavaScript fallback, CSS, Node.js built-in test runner.

## Global Constraints

- Each report row exposes exactly “编辑”, “下载”, and “删除”.
- The report copy entry is removed and no replacement button is added.
- “编辑” and “下载” use the primary text color; “删除” uses a danger color.
- Existing edit, preview/download, and delete event flows remain unchanged.
- The page-level “新建报告” button remains unchanged.
- Vue and file:// static views must remain consistent.

---

### Task 1: Replace report-library actions in both render paths

**Files:**
- Modify: `tests/results-portal.test.mjs:801`
- Modify: `src/App.vue:9436-9441`
- Modify: `index.html:4017`
- Modify: `src/styles/80-report.css:90-97`
- Modify: `src/styles/80-report.css:164-181`

**Interfaces:**
- Consumes: existing `editReport(report)`, `previewReport(report)`, and `deleteReport(report.id)` Vue handlers; existing `data-report-edit`, `data-report-preview`, and `data-report-delete` static event hooks.
- Produces: `.report-action-danger` styling hook on delete actions; no new JavaScript interface.

- [ ] **Step 1: Extend the file:// runtime test with failing action assertions**

In `tests/results-portal.test.mjs`, extend `static html can deep-link directly to the report library view` after its existing `报告库管理` assertion:

```js
assert.match(app.innerHTML, />编辑<\/button>/)
assert.match(app.innerHTML, />下载<\/button>/)
assert.match(app.innerHTML, /class="report-action-danger"[^>]*>删除<\/button>/)
assert.doesNotMatch(app.innerHTML, /data-report-copy|title="复制"|>□<\/button>/)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="static html can deep-link directly to the report library view" tests/results-portal.test.mjs
```

Expected: FAIL because the rendered actions still contain icon glyphs and a copy entry.

- [ ] **Step 3: Replace the Vue action markup**

In `src/App.vue`, keep the existing event handlers but change the action group to:

```vue
<div class="report-action-buttons">
  <button title="编辑" @click="editReport(report)">编辑</button>
  <button title="下载" @click="previewReport(report)">下载</button>
  <button class="report-action-danger" title="删除" @click="deleteReport(report.id)">删除</button>
</div>
```

- [ ] **Step 4: Replace the static fallback action markup**

Inside `index.html`’s `libraryBody`, keep the existing data hooks but use:

```html
<div class="report-action-buttons"><button title="编辑" data-report-edit="${report.id}">编辑</button><button title="下载" data-report-preview="${report.id}">下载</button><button class="report-action-danger" title="删除" data-report-delete="${report.id}">删除</button></div>
```

Do not add `data-report-copy`.

- [ ] **Step 5: Update the shared report action styles**

In `src/styles/80-report.css`, set the action group gap to `4px` without changing the other toolbar gaps. Replace the square-button styling with:

```css
.report-action-buttons {
  gap: 4px;
}

.report-action-buttons button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 44px;
  height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: 6px;
  color: #2f73ff;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  background: transparent;
  cursor: pointer;
}

.report-action-buttons button:hover {
  color: #1f5fd5;
  background: #f1f6ff;
}

.report-action-buttons button:focus-visible {
  outline: 2px solid #8fb2ff;
  outline-offset: 1px;
}

.report-action-buttons .report-action-danger {
  color: #e5484d;
}

.report-action-buttons .report-action-danger:hover {
  color: #c9363e;
  background: #fff1f0;
}
```

- [ ] **Step 6: Run the focused test and verify GREEN**

Run:

```bash
node --test --test-name-pattern="static html can deep-link directly to the report library view" tests/results-portal.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Run regression tests and build**

Run:

```bash
npm test
npm run build
```

Expected: both commands exit with code 0 and no new warnings or errors.

- [ ] **Step 8: Review the final diff**

Run:

```bash
git diff --check
git diff -- src/App.vue index.html src/styles/80-report.css tests/results-portal.test.mjs
```

Expected: no whitespace errors; diff contains the three text actions, shared styling, and runtime assertions. The pre-existing report-step navigation test in `tests/results-portal.test.mjs` remains untouched.

- [ ] **Step 9: Commit only this feature’s files**

```bash
git add src/App.vue index.html src/styles/80-report.css
git add -p tests/results-portal.test.mjs
git commit -m "fix: use text actions in report library"
```

At the interactive test-file staging prompt, stage only the report-library assertion hunk and leave the pre-existing report-step navigation hunk unstaged.
