# Portrait Career Path Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portrait dialog career path display a full职业发展路径 chain instead of a single岗位 label.

**Architecture:** Keep the change inside the existing static portrait data builder. Add a small helper that derives a chain from the job name and岗位群, then have static portrait details consume it.

**Tech Stack:** Vue 3 app, static `index.html` fallback, Node.js built-in test runner.

## Global Constraints

- Do not rewrite unrelated existing changes in the dirty worktree.
- Preserve existing portrait dialog structure and copy except the职业路径 value.
- Use `→` as the career-chain separator because Vue-side job detail data already uses that convention.

---

### Task 1: Static Portrait Career Path Chain

**Files:**
- Modify: `major-construction-platform/tests/portrait-dialog.test.mjs`
- Modify: `major-construction-platform/index.html`

**Interfaces:**
- Consumes: existing `buildStaticJobDetail(job, index)` function.
- Produces: `buildStaticCareerPath(job)` returning a string like `BIM建模工程师 → BIM深化设计与数字建模骨干 → 智能建造项目负责人 → 数字建造技术经理`.

- [ ] **Step 1: Write the failing test**

```js
test('static portrait career path is a chained职业发展路径 instead of one job label', () => {
  assert.match(staticIndex, /const buildStaticCareerPath = \(job\) =>/)
  assert.match(staticIndex, /career:\s*buildStaticCareerPath\(job\)/)
  assert.doesNotMatch(staticIndex, /career:\s*'工程项目交付岗'/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/portrait-dialog.test.mjs`
Expected: FAIL because `buildStaticCareerPath` is missing and `career: '工程项目交付岗'` still exists.

- [ ] **Step 3: Write minimal implementation**

```js
const buildStaticCareerPath = (job) => {
  const groupCore = String(job.groupName || '智能建造岗位群').replace('岗位群', '')
  return `${job.name} → ${groupCore}骨干 → 智能建造项目负责人 → 数字建造技术经理`
}
```

Change `career: '工程项目交付岗'` to `career: buildStaticCareerPath(job)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/portrait-dialog.test.mjs`
Expected: PASS.

- [ ] **Step 5: Run broader verification**

Run: `npm test`
Expected: PASS for the existing test suite.
