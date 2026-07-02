# OpenDesign Results Graph Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the results portal job graph area with the OpenDesign industry-education graph while keeping edits in OpenDesign visible in the file-mode demo after refresh.

**Architecture:** Embed the OpenDesign graph as an isolated iframe inside the existing results portal graph section. File-mode static demo points to the OpenDesign source file; Vite/server mode uses a project-local fallback copy.

**Tech Stack:** Vue 3 single-file component, standalone static HTML, Node test runner.

## Global Constraints

- Update both `src/App.vue` and `index.html` because the visible demo is opened from `file://.../major-construction-platform/index.html`.
- Preserve existing uncommitted changes.
- Do not inline the OpenDesign CSS/JS into the main app.
- Keep the graph responsive inside the existing成果页 position.

---

### Task 1: Embed OpenDesign Graph In Results Portal

**Files:**
- Modify: `tests/results-portal.test.mjs`
- Modify: `src/App.vue`
- Modify: `index.html`
- Modify: `src/styles/00-base.css`
- Create: `public/opendesign/industry-education-graph-prototype.html`

**Interfaces:**
- Produces: `openDesignGraphFrameSrc` in Vue and `staticOpenDesignGraphFrameSrc()` in static HTML.
- Produces: `.opendesign-graph-frame-shell` and `.opendesign-graph-frame` styles.

- [ ] **Step 1: Write the failing test**

```js
test('results portal embeds the OpenDesign industry education graph with live file-mode source and fallback copy', async () => {
  const fallbackHtml = await readFile(new URL('../public/opendesign/industry-education-graph-prototype.html', import.meta.url), 'utf8')

  assert.match(appVue, /openDesignGraphFrameSrc/)
  assert.match(appVue, /file:\/\/\/Users\/liuhongzhe\/Documents\/Codex\/2026-06-15\/help-me-locally-deploy-open-design\/work\/open-design\/\.od\/projects\/d8cf836e-0d47-4647-875e-99990c27b65d\/industry-education-graph-prototype\.html/)
  assert.match(appVue, /\/opendesign\/industry-education-graph-prototype\.html/)
  assert.match(appVue, /class="opendesign-graph-frame"/)

  assert.match(staticHtml, /staticOpenDesignGraphFrameSrc/)
  assert.match(staticHtml, /file:\/\/\/Users\/liuhongzhe\/Documents\/Codex\/2026-06-15\/help-me-locally-deploy-open-design\/work\/open-design\/\.od\/projects\/d8cf836e-0d47-4647-875e-99990c27b65d\/industry-education-graph-prototype\.html/)
  assert.match(staticHtml, /\.\/public\/opendesign\/industry-education-graph-prototype\.html/)
  assert.match(staticHtml, /class="opendesign-graph-frame"/)

  assert.match(stylesCss, /\.opendesign-graph-frame-shell/)
  assert.match(stylesCss, /\.opendesign-graph-frame/)
  assert.match(fallbackHtml, /产教融合三类图谱工作区/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/results-portal.test.mjs`
Expected: FAIL because `public/opendesign/industry-education-graph-prototype.html` and iframe code do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add the constants and iframe markup to both entries, copy the OpenDesign HTML to `public/opendesign/industry-education-graph-prototype.html`, and add responsive frame styles.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/results-portal.test.mjs`
Expected: PASS.

- [ ] **Step 5: Verify full project**

Run: `npm test`
Expected: PASS.
