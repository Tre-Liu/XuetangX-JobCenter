# 专业引擎页面重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 demo 的旧版专业引擎替换为截图所示的 7 栏目结构，完整实现知识库演示页，并为其余 6 个栏目提供统一占位页。

**Architecture:** 新建独立的专业引擎数据与状态模块，让 Node 测试可以直接验证栏目选择、默认回退和上传反馈行为；`App.vue` 只负责绑定状态与渲染；专业引擎视觉集中在现有 shell 样式文件中。静态 `index.html` 使用同一信息架构同步本地直开入口。

**Tech Stack:** Vue 3 Composition API、TypeScript、ES modules、Node.js test runner、CSS。

## Global Constraints

- 知识库为完整演示页面，其余 6 个栏目统一显示“功能准备中，敬请期待~”。
- 左侧栏目顺序必须为：知识库、专业图谱、知识领域图谱、课程群图谱、能力维度图谱、素质目标图谱、自定义图谱。
- 上传按钮只提供页面内模拟反馈，不读取文件、不访问网络、不写入存储。
- 不改变其他一级模块的名称、入口、状态和交互。
- 不引入第三方依赖或远程图片。
- 样式沿用当前 demo 的蓝紫渐变、浅蓝背景、白色卡片和圆角规范。

---

### Task 1: 专业引擎状态与数据契约

**Files:**
- Create: `src/app/major-engine.js`
- Create: `src/app/major-engine.d.ts`
- Create: `tests/major-engine.test.mjs`
- Modify: `src/app/app-config.ts`

**Interfaces:**
- Produces: `MAJOR_ENGINE_SECTIONS`
- Produces: `MAJOR_ENGINE_KNOWLEDGE_STATS`
- Produces: `MAJOR_ENGINE_KNOWLEDGE_ROWS`
- Produces: `DEFAULT_MAJOR_ENGINE_SECTION`
- Produces: `resolveMajorEngineSection(key: unknown): MajorEngineSectionKey`
- Produces: `getMajorEngineContentMode(key: unknown): 'knowledge' | 'placeholder'`
- Produces: `createMajorEngineUploadFeedback(resourceName?: string): string`

- [x] **Step 1: Write the failing behavior tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_MAJOR_ENGINE_SECTION,
  MAJOR_ENGINE_KNOWLEDGE_ROWS,
  MAJOR_ENGINE_SECTIONS,
  createMajorEngineUploadFeedback,
  getMajorEngineContentMode,
  resolveMajorEngineSection,
} from '../src/app/major-engine.js'

test('专业引擎默认进入知识库，并对非法栏目回退到知识库', () => {
  assert.equal(DEFAULT_MAJOR_ENGINE_SECTION, 'knowledge')
  assert.equal(resolveMajorEngineSection('major-graph'), 'major-graph')
  assert.equal(resolveMajorEngineSection('missing'), 'knowledge')
})

test('专业引擎只为知识库返回完整内容模式', () => {
  assert.equal(getMajorEngineContentMode('knowledge'), 'knowledge')
  assert.equal(getMajorEngineContentMode('course-group-graph'), 'placeholder')
})

test('专业引擎栏目和知识库分类使用确定的业务顺序', () => {
  assert.deepEqual(
    MAJOR_ENGINE_SECTIONS.map((item) => item.label),
    ['知识库', '专业图谱', '知识领域图谱', '课程群图谱', '能力维度图谱', '素质目标图谱', '自定义图谱'],
  )
  assert.deepEqual(
    MAJOR_ENGINE_KNOWLEDGE_ROWS.map((item) => item.name),
    ['培养方案', '专业认证', '政策文件', '行业报告'],
  )
})

test('上传演示反馈包含所选资源分类', () => {
  assert.equal(createMajorEngineUploadFeedback('政策文件'), '已打开政策文件上传演示，本次不会读取或保存真实文件')
})
```

- [x] **Step 2: Run tests and confirm RED**

Run: `node --test tests/major-engine.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/app/major-engine.js`.

- [x] **Step 3: Implement the minimal state and data module**

Create `src/app/major-engine.js` with the seven section keys and labels, four zero-value statistics, four resource rows, a valid-key set, fallback resolver, content-mode resolver, and upload feedback formatter. Add matching declarations in `src/app/major-engine.d.ts`.

Remove the obsolete `EngineSectionKey`, `engineMenuItems`, and `engineSectionPanels` exports from `src/app/app-config.ts`; leave unrelated course, member, permission, and top-navigation exports unchanged.

- [x] **Step 4: Run focused and full tests**

Run: `node --test tests/major-engine.test.mjs`

Expected: 4 tests PASS.

Run: `npm test`

Expected: all existing tests PASS.

- [x] **Step 5: Commit the state contract**

```bash
git add src/app/major-engine.js src/app/major-engine.d.ts src/app/app-config.ts tests/major-engine.test.mjs
git commit -m "feat: add professional engine state model"
```

### Task 2: Vue 知识库与六类占位页面

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/10-shell.css`
- Test: `tests/major-engine.test.mjs`

**Interfaces:**
- Consumes: all exports from `src/app/major-engine.js`.
- Produces: a Vue-rendered professional engine sidebar, knowledge base view, placeholder view, and transient upload feedback.

- [x] **Step 1: Add a failing controller transition test**

Extend `tests/major-engine.test.mjs`:

```js
test('非法栏目不会把专业引擎切换到不存在的页面', () => {
  const selected = resolveMajorEngineSection('not-a-section')
  assert.equal(selected, 'knowledge')
  assert.equal(getMajorEngineContentMode(selected), 'knowledge')
})
```

Temporarily change the assertion to exercise the not-yet-used invalid-state branch through a new `selectMajorEngineSection(current, requested)` export:

```js
assert.equal(selectMajorEngineSection('major-graph', 'not-a-section'), 'major-graph')
```

Expected production rule: a rejected request preserves the current valid section instead of resetting it.

- [x] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/major-engine.test.mjs`

Expected: FAIL because `selectMajorEngineSection` is not exported.

- [x] **Step 3: Implement the transition and Vue page**

Add:

```js
export const selectMajorEngineSection = (current, requested) =>
  majorEngineSectionKeys.has(requested)
    ? requested
    : resolveMajorEngineSection(current)
```

Update `src/App.vue` to:

- import the new data and helpers;
- initialize `engineActiveSection` with `DEFAULT_MAJOR_ENGINE_SECTION`;
- preserve the current valid subsection when leaving and returning;
- render all seven sidebar buttons from `MAJOR_ENGINE_SECTIONS`;
- render knowledge statistics from `MAJOR_ENGINE_KNOWLEDGE_STATS`;
- render the four resource rows from `MAJOR_ENGINE_KNOWLEDGE_ROWS`;
- show the upload feedback as a transient in-page toast;
- render the CSS lock illustration and shared placeholder copy for non-knowledge sections;
- clear the feedback timeout in `onBeforeUnmount`.

Replace the obsolete engine card-grid CSS block with focused styles for:

- `.engine-module-menu`
- `.engine-brand`
- `.engine-section-button`
- `.engine-board`
- `.engine-knowledge-summary`
- `.engine-knowledge-table`
- `.engine-upload-button`
- `.engine-placeholder`
- `.engine-lock-illustration`
- `.engine-demo-toast`

Add a narrow responsive rule that allows the table to scroll horizontally and keeps the sidebar readable.

- [x] **Step 4: Run focused tests and compile**

Run: `node --test tests/major-engine.test.mjs`

Expected: all professional engine tests PASS.

Run: `npm run build`

Expected: Vue type checking and Vite build PASS.

- [x] **Step 5: Commit the Vue implementation**

```bash
git add src/App.vue src/styles/10-shell.css src/app/major-engine.js src/app/major-engine.d.ts tests/major-engine.test.mjs
git commit -m "feat: rebuild professional engine workspace"
```

### Task 3: 静态入口同步与视觉验收

**Files:**
- Modify: `index.html`
- Modify: `docs/superpowers/plans/2026-07-31-major-engine.md`

**Interfaces:**
- Consumes: the same seven section labels and knowledge-page information architecture.
- Produces: a usable professional engine fallback when the static entry renders without the Vue bundle.

- [x] **Step 1: Add a failing static interaction test**

Create a controlled DOM fixture in `tests/major-engine-static.test.mjs` that evaluates only the extracted `engineHtml` renderer and asserts:

- default renderer contains four resource categories;
- requesting `major-graph` contains the shared placeholder copy;
- sidebar contains seven `data-engine-section` controls.

The test must execute the renderer and assert its returned HTML rather than search raw source lines.

- [x] **Step 2: Run the static test and confirm RED**

Run: `node --test tests/major-engine-static.test.mjs`

Expected: FAIL because the current renderer returns the old single placeholder panel.

- [x] **Step 3: Implement the static fallback**

Update `index.html` so `engineHtml(section = 'knowledge')` returns:

- the seven-section sidebar;
- the knowledge statistics and four resource categories for `knowledge`;
- the lock illustration and placeholder copy for all other valid sections.

Update the delegated click handler to call `engineHtml(section)` for `data-engine-section` and to open `engineHtml('knowledge')` from the top-level professional engine module button.

- [x] **Step 4: Run all automated verification**

Run: `node --test tests/major-engine-static.test.mjs tests/major-engine.test.mjs`

Expected: all professional engine tests PASS.

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build`

Expected: build PASS without warnings introduced by this change.

- [x] **Step 5: Run browser visual verification**

Start: `npm run dev`

Verify at a desktop viewport:

1. “专业引擎” defaults to “知识库”.
2. Knowledge summary, four rows, and upload button match the screenshot structure.
3. Upload feedback appears and disappears.
4. Each other section shows the same centered lock placeholder.
5. Leaving and returning to the module preserves the last valid subsection.
6. Other top-level modules remain usable.

- [x] **Step 6: Commit the static fallback and plan completion**

```bash
git add index.html tests/major-engine-static.test.mjs docs/superpowers/plans/2026-07-31-major-engine.md
git commit -m "feat: sync professional engine static fallback"
```
