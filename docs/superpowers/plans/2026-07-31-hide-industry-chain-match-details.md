# Hide Industry Chain Match Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the “匹配依据” and “关系说明” rows from industry-chain recommendation cards in every supported UI entry.

**Architecture:** Change only the presentation templates in the Vue page and its two standalone HTML mirrors. Keep `evidence` and `description` in the generated dataset so matching behavior and future non-card consumers remain unchanged.

**Tech Stack:** Vue 3 single-file component, standalone HTML/JavaScript mirrors, Node.js built-in test runner.

## Global Constraints

- Keep the industry-chain name, relation type, node, job count, enterprise count, selection state, pagination, filtering, and initialization behavior unchanged.
- Update `major-construction-platform/src/App.vue`, `major-construction-platform/industry-research-admin.html`, and `major-construction-platform/outputs/industry-research-admin.html` consistently.
- Do not remove `evidence` or `description` from generated data or matching logic.
- Preserve all unrelated uncommitted changes already present in the worktree.

---

### Task 1: Remove Match Detail Rows from All Card Templates

**Files:**
- Modify: `major-construction-platform/tests/industry-research-management.test.mjs:164-195`
- Modify: `major-construction-platform/src/App.vue:6317-6330`
- Modify: `major-construction-platform/industry-research-admin.html:492`
- Modify: `major-construction-platform/outputs/industry-research-admin.html:492`

**Interfaces:**
- Consumes: Existing `chain` card objects and their `name`, `relationType`, `node`, `jobCount`, and `enterpriseCount` properties.
- Produces: The same cards and interactions without rendered labels named `匹配依据` or `关系说明`.

- [ ] **Step 1: Write the failing regression assertions**

Change the card-field test so it asserts that the retained KPI labels exist while the two removed labels do not:

```js
test('industry chain cards show stable demo KPI fields', () => {
  for (const field of ['产业环节', '包含岗位数', '包含企业数']) {
    assert.match(appVue, new RegExp(field))
  }
  for (const field of ['匹配依据', '关系说明']) {
    assert.doesNotMatch(appVue, new RegExp(field))
  }

  for (const [label, source] of [
    ['outputs static html', localHtml],
    ['root static html', rootLocalHtml],
  ]) {
    for (const field of ['产业环节', '包含岗位数', '包含企业数']) {
      assert.match(source, new RegExp(field), `${label} should render ${field}`)
    }
    for (const field of ['匹配依据', '关系说明']) {
      assert.doesNotMatch(source, new RegExp(field), `${label} should omit ${field}`)
    }
  }
})
```

Keep the test’s existing assertions for KPI values, hidden stage/confidence/score fields, search, selection, and pagination.

- [ ] **Step 2: Run the targeted test and verify the new assertions fail**

Run:

```bash
cd major-construction-platform
node --test tests/industry-research-management.test.mjs
```

Expected: FAIL because the Vue and standalone templates still contain `匹配依据` and `关系说明`.

- [ ] **Step 3: Remove the two Vue template rows**

Delete only these lines from the card body in `src/App.vue`:

```vue
<p>匹配依据：{{ chain.evidence }}</p>
<em>关系说明：{{ chain.description }}</em>
```

- [ ] **Step 4: Remove the two standalone template rows**

In both standalone HTML files, change the generated card body from:

```js
<div><div class="chain-title"><h4>${chain.name}</h4><span>${chain.relationType}</span></div><p>产业环节：${chain.node} · 包含岗位数：${chain.jobCount.toLocaleString('zh-CN')} · 包含企业数：${chain.enterpriseCount.toLocaleString('zh-CN')}</p><em>匹配依据：${chain.evidence}</em><em>关系说明：${chain.description}</em></div>
```

to:

```js
<div><div class="chain-title"><h4>${chain.name}</h4><span>${chain.relationType}</span></div><p>产业环节：${chain.node} · 包含岗位数：${chain.jobCount.toLocaleString('zh-CN')} · 包含企业数：${chain.enterpriseCount.toLocaleString('zh-CN')}</p></div>
```

- [ ] **Step 5: Run the targeted test and verify it passes**

Run:

```bash
cd major-construction-platform
node --test tests/industry-research-management.test.mjs
```

Expected: PASS with zero failing subtests.

- [ ] **Step 6: Run full verification**

Run:

```bash
cd major-construction-platform
npm test
npm run build
```

Expected: both commands exit with status `0`.

Then confirm the removed labels remain only in data-generation code, not UI templates:

```bash
rg -n "匹配依据|关系说明" src/App.vue industry-research-admin.html outputs/industry-research-admin.html
```

Expected: no matches.

- [ ] **Step 7: Review the final diff**

Run:

```bash
git diff --check
git diff -- major-construction-platform/tests/industry-research-management.test.mjs major-construction-platform/src/App.vue major-construction-platform/industry-research-admin.html major-construction-platform/outputs/industry-research-admin.html
```

Expected: no whitespace errors; the diff contains only the regression assertions and removal of the two card rows, alongside any clearly pre-existing unrelated edits in already-dirty files.
