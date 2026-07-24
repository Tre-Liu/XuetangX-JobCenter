# Remove Report Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the report page's redundant header/tip block and the global demo-reset dock button from both Vue and `file://` static rendering.

**Architecture:** Keep the existing report state machine, report form data, and industry-research initialization storage intact. Remove only the unwanted render structures, their button-only event hooks, and button-only CSS, while locking the Vue/static parity with source-contract tests.

**Tech Stack:** Vue 3 Composition API, TypeScript, static HTML/JavaScript, plain CSS, Node.js built-in test runner.

## Global Constraints

- Preserve all existing uncommitted report three-step wizard changes.
- Remove UI structures directly; do not hide them with CSS.
- Keep report library, report creation, report generation, editing, preview, and export behavior unchanged.
- Keep industry-research initialization-state reading and CMS initialization behavior unchanged.
- Keep every other dock control and the “返回旧版” entry unchanged.
- Keep Vue and `file://` static rendering aligned.

---

## File Structure

- `major-construction-platform/tests/results-portal.test.mjs`
  - Defines absence contracts for the unwanted report chrome and demo-reset control.
- `major-construction-platform/tests/industry-research-management.test.mjs`
  - Updates the previous demo-reset presence contract to the new absence contract.
- `major-construction-platform/src/App.vue`
  - Removes the Vue report header/tip and global demo-reset button.
- `major-construction-platform/index.html`
  - Removes the same structures from static renderers and deletes the unreachable reset click branch.
- `major-construction-platform/src/styles/00-base.css`
  - Removes styles used only by the deleted demo-reset button.

### Task 1: Remove unwanted report chrome and demo reset control

**Files:**

- Modify: `major-construction-platform/tests/results-portal.test.mjs`
- Modify: `major-construction-platform/tests/industry-research-management.test.mjs`
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/index.html`
- Modify: `major-construction-platform/src/styles/00-base.css`

**Interfaces:**

- Consumes: existing `currentJobSection`, `currentReportView`, `reportHtml()`, `staticDockHtml()`, and industry-research initialization state.
- Produces: report rendering whose first child is the active report body, plus dock rendering without a demo-reset control.

- [ ] **Step 1: Write the failing absence-contract tests**

Replace the existing static reset-button test and add a report-chrome test:

```js
test('demo dock omits the CMS initialization reset control', () => {
  assert.doesNotMatch(appVue, /class="dock-icon demo-reset"/)
  assert.doesNotMatch(staticHtml, /data-reset-demo-initialization/)
  assert.doesNotMatch(staticHtml, /title="重置演示初始化状态"/)
  assert.doesNotMatch(stylesCss, /\.dock-icon\.demo-reset/)
})

test('report page starts directly with report content', () => {
  const vueReportPage = appVue.match(
    /<div v-else-if="currentJobSection === '报告生成'" class="job-research-page report-generate-page">([\s\S]*?)<div v-else-if="currentJobSection === '岗位建设中心'"/
  )?.[1] ?? ''

  assert.doesNotMatch(vueReportPage, /<header class="research-title-row">/)
  assert.doesNotMatch(vueReportPage, /<section class="research-tip">/)
  assert.doesNotMatch(
    staticHtml,
    /report-generate-page"><header class="research-title-row">/
  )
  assert.doesNotMatch(
    staticHtml,
    /report-generate-page">[\s\S]*?本页面支持<strong>一键生成专业群产业调研分析报告/
  )
})
```

- [ ] **Step 2: Run the focused tests and verify they fail for the expected markup**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="demo dock omits|report page starts directly" tests/results-portal.test.mjs
```

Expected: both tests fail because the reset button and report header/tip are still rendered.

- [ ] **Step 3: Remove the Vue markup**

In `src/App.vue`, remove the complete button:

```vue
<button
  class="dock-icon demo-reset"
  type="button"
  aria-label="重置演示初始化状态"
  title="重置演示初始化状态"
  @click="resetIndustryResearchDemoInitialization"
>
  ↺
</button>
```

In the `currentJobSection === '报告生成'` page, remove:

```vue
<header class="research-title-row">
  <div>
    <h2>报告生成</h2>
  </div>
  <label class="research-chain-select-wrap">
    <span class="research-chain-select-label">当前产业链：</span>
    <select class="research-chain-select" v-model="selectedIndustryChain" aria-label="选择产业链">
      <option v-for="industry in REPORT_INDUSTRY_OPTIONS" :key="industry" :value="industry">
        {{ industry }}
      </option>
    </select>
  </label>
</header>

<section class="research-tip">
  <span class="tip-icon">i</span>
  <p>
    本页面支持
    <strong>一键生成专业群产业调研分析报告</strong>
    ，自动整合产业、岗位、专业、课程等数据，用于材料撰写、方案修订和建设论证。
  </p>
</section>
```

Do not remove `selectedIndustryChain`, because report library rows and report creation defaults still use industry-chain state.

- [ ] **Step 4: Remove static markup and the unreachable reset event branch**

Delete every static button instance matching:

```html
<button class="dock-icon demo-reset" type="button" aria-label="重置演示初始化状态" title="重置演示初始化状态" data-reset-demo-initialization>↺</button>
```

Change the static report return expression from:

```js
return shellStart('job', 'report') + `<div class="job-research-page report-generate-page"><header class="research-title-row"><div><h2>报告生成</h2></div>${staticCurrentIndustryChainSelect()}</header><section class="research-tip"><span class="tip-icon">i</span><p>本页面支持<strong>一键生成专业群产业调研分析报告</strong>，自动整合产业、岗位、专业、课程等数据，用于材料撰写、方案修订和建设论证。</p></section>${body}</div>` + shellEnd
```

to:

```js
return shellStart('job', 'report') + `<div class="job-research-page report-generate-page">${body}</div>` + shellEnd
```

Delete only this click branch:

```js
if (target.closest('[data-reset-demo-initialization]')) {
  localStorage.removeItem(staticIndustryResearchStateKey)
  renderStaticPage()
  return
}
```

Do not delete `staticIndustryResearchStateKey`, `readStaticIndustryResearchInitialized()`, or CMS initialization navigation.

- [ ] **Step 5: Remove button-only CSS**

Delete these rules from `src/styles/00-base.css`:

```css
.dock-icon.demo-reset {
  width: 46px;
  height: 46px;
  margin-bottom: 28px;
  border: 3px solid #ff5f6d;
  border-radius: 2px;
  color: #ffffff;
  font-size: 24px;
  line-height: 1;
  background: rgba(255, 255, 255, 0.03);
}

.dock-icon.demo-reset:hover {
  color: #ffffff;
  background: rgba(255, 95, 109, 0.18);
}
```

- [ ] **Step 6: Run the focused tests and verify they pass**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="demo dock omits|report page starts directly" tests/results-portal.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Run regression checks**

Run:

```bash
cd major-construction-platform
node --test tests/results-portal.test.mjs
npm run build
```

Expected: the full results-portal suite passes and the production build completes without Vue/TypeScript errors.

- [ ] **Step 8: Inspect the final diff**

Run:

```bash
git diff --check
git diff -- major-construction-platform/tests/results-portal.test.mjs major-construction-platform/src/App.vue major-construction-platform/index.html major-construction-platform/src/styles/00-base.css
```

Expected: no whitespace errors; the diff contains only the test expectation updates and the intended deletions, alongside the pre-existing three-step wizard changes.
