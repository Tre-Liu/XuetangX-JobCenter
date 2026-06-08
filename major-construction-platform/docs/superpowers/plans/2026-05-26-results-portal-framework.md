# Results Portal Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hover menu for "建设成果展示" and open a new-tab成果页 with a nav skeleton that includes "岗位中心" before "课程体系".

**Architecture:** Keep the feature inside the existing Vue single-file app. Use a query flag to switch the app into a standalone portal view, avoiding a router dependency.

**Tech Stack:** Vue 3, Vite, TypeScript, Node built-in test runner, CSS.

---

### Task 1: Behavior Contract

**Files:**
- Create: `tests/results-portal.test.mjs`
- Modify: `package.json`

- [x] **Step 1: Write the failing test**

```js
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')

test('results menu exposes the expected actions', () => {
  for (const label of ['查看成果页', '编辑成果页', '门户设置', '复制链接']) {
    assert.match(appVue, new RegExp(label))
  }
})

test('results portal opens in a new browser tab', () => {
  assert.match(appVue, /openResultsPortal/)
  assert.match(appVue, /window\.open\(resultsPortalUrl\.value, '_blank', 'noopener'\)/)
})

test('results portal navigation places 岗位中心 before 课程体系', () => {
  const navMatch = appVue.match(/const resultsPortalNav = \[([\s\S]*?)\]/)
  assert.ok(navMatch)
  assert.ok(navMatch[1].indexOf("label: '岗位中心'") < navMatch[1].indexOf("label: '课程体系'"))
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/results-portal.test.mjs`
Expected: FAIL because the results portal menu and navigation do not exist yet.

### Task 2: Implement Framework

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`

- [ ] **Step 1: Add constants and open handler**
- [ ] **Step 2: Render the standalone portal shell when URL mode is active**
- [ ] **Step 3: Wrap the top nav item with a hover menu and bind "查看成果页"**
- [ ] **Step 4: Style the dropdown and portal skeleton**
- [ ] **Step 5: Run `npm test -- tests/results-portal.test.mjs` and `npm run build`**
