# Report File Upload Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the browser-native report reference file picker with a lightweight, system-aligned upload row in both application entries.

**Architecture:** Keep the real `multiple` file input and its existing change handlers, but visually hide it inside its existing label. Render a shared class structure for the trigger and status text in Vue and the static fallback, with all presentation owned by the report stylesheet.

**Tech Stack:** Vue 3 SFC template, static HTML template string, CSS, Node.js built-in test runner.

## Global Constraints

- Preserve multi-file selection and existing file-count state.
- Keep Vue and static fallback structure, copy, and visuals aligned.
- Do not add drag-and-drop, file preview, per-file deletion, dependencies, or new upload state.
- Do not create a Git commit unless the user explicitly requests one; the worktree already contains unrelated changes.

---

### Task 1: Add the system-styled report file picker

**Files:**
- Modify: `tests/results-portal.test.mjs`
- Modify: `src/App.vue:9363`
- Modify: `index.html:4041`
- Modify: `src/styles/80-report.css:315`

**Interfaces:**
- Consumes: Vue `setReportReferenceFiles(event: Event)` and the static `[data-report-files]` change listener.
- Produces: `.report-file-control`, `.report-file-input`, `.report-file-trigger`, `.report-file-icon`, and `.report-file-summary` markup shared by both entries.

- [x] **Step 1: Write the failing structure and style contract test**

Add this test after `report wizard styling stays compact and prevents text overflow`:

```js
test('report reference files use the system-styled picker in both entries', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /class="report-file-control"/)
    assert.match(source, /class="report-file-input"[^>]*type="file"[^>]*multiple/)
    assert.match(source, /class="report-file-trigger"/)
    assert.match(source, /class="report-file-icon" aria-hidden="true">↑<\/span>选择文件/)
    assert.match(source, /未选择文件/)
  }

  const control = styleBlock('.report-file-control')
  const hiddenInput = styleBlock('.report-file-input')
  const trigger = styleBlock('.report-file-trigger')

  assert.match(control, /min-height:\s*42px/)
  assert.match(control, /border-radius:\s*8px/)
  assert.match(hiddenInput, /clip-path:\s*inset\(50%\)/)
  assert.match(trigger, /color:\s*#2f6ff5/)
  assert.match(stylesCss, /\.report-file-control:focus-within\s*\{[\s\S]*box-shadow:/)
})
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test --test-name-pattern="report reference files use the system-styled picker" tests/results-portal.test.mjs
```

Expected: FAIL because `.report-file-control` is absent from the Vue and static templates.

- [x] **Step 3: Replace the Vue native picker markup**

Replace the current reference-file label body with:

```vue
<label class="report-field report-field-wide">
  <span>参考文件上传</span>
  <span class="report-file-control">
    <input class="report-file-input" type="file" multiple @change="setReportReferenceFiles" />
    <span class="report-file-trigger"><span class="report-file-icon" aria-hidden="true">↑</span>选择文件</span>
    <em class="report-file-summary">{{ reportReferenceFiles.length ? `已选择 ${reportReferenceFiles.length} 个文件` : '未选择文件' }}</em>
  </span>
</label>
```

- [x] **Step 4: Mirror the markup in the static fallback**

Replace the current static reference-file label with:

```html
<label class="report-field report-field-wide"><span>参考文件上传</span><span class="report-file-control"><input class="report-file-input" type="file" multiple data-report-files><span class="report-file-trigger"><span class="report-file-icon" aria-hidden="true">↑</span>选择文件</span><em class="report-file-summary">${staticReportFileCount ? `已选择 ${staticReportFileCount} 个文件` : '未选择文件'}</em></span></label>
```

- [x] **Step 5: Add the upload-row styling**

Replace the existing `.report-file-summary` block with:

```css
.report-file-control {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 42px;
  padding: 4px;
  overflow: hidden;
  border: 1px solid #dce6f4;
  border-radius: 8px;
  background: #fbfdff;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.report-file-control:hover {
  border-color: #b9ceff;
  background: #ffffff;
}

.report-file-control:focus-within {
  border-color: #86aaff;
  box-shadow: 0 0 0 3px rgba(47, 115, 255, 0.12);
}

.report-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.report-file-trigger {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 104px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid #bfd1ff;
  border-radius: 7px;
  color: #2f6ff5;
  background: #f2f6ff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.report-file-control:hover .report-file-trigger {
  border-color: #96b5ff;
  color: #1f62ec;
  background: #eaf1ff;
}

.report-file-icon {
  margin-right: 6px;
  font-size: 15px;
  line-height: 1;
}

.report-file-summary {
  flex: 1;
  min-width: 0;
  margin: 0 10px;
  overflow: hidden;
  color: #7d899d;
  font-size: 12px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- [x] **Step 6: Run the focused test and verify GREEN**

Run:

```bash
node --test --test-name-pattern="report reference files use the system-styled picker" tests/results-portal.test.mjs
```

Expected: PASS for the new contract test.

- [x] **Step 7: Run complete verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: all tests pass, production build exits with code 0, and `git diff --check` prints no errors.
