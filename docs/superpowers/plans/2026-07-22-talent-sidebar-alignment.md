# 人才方案管理侧边栏对齐产教模型实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变七个既有入口和状态逻辑的前提下，将人才方案管理侧边栏重构为与产教模型一致的三段式分组导航，并保持 Vue 与 `file://` 静态入口同构。

**Architecture:** 继续以 `sideItems` 和 `talentSubsystemItems` 作为菜单数据源，仅为子系统项补充分组标题和图标类。Vue 与静态模板输出相同的专属 `talent-*` 结构，统一由 `20-talent.css` 提供视觉契约；既有点击处理函数和 `data-*` 事件委托保持不变。

**Tech Stack:** Vue 3、TypeScript、原生 JavaScript 静态入口、CSS、Node.js test runner、Vite。

## Global Constraints

- 侧边栏必须包含“方案建设”“方案调研”“方案比对”三个始终展开的分组。
- 必须保留 `2026版本`、培养目标、毕业要求、课程管理、支撑矩阵、学生管理、人才培养方案调研和人才培养方案比对现有文案。
- 不修改 `activeTalentSection`、`activeTalentSubsystem`、`selectTalentSection()`、`openTalentSubsystem()` 的状态语义。
- 侧边栏固定宽度为 `176px`，水平内边距为 `24px`，菜单宽度为 `128px`，菜单高度为 `30px`，圆角为 `8px`。
- Vue 入口和 `file://` 静态入口必须使用相同结构类和同一份 CSS。
- 不新增外部依赖、网络请求、路由或版本切换业务逻辑。
- 所有七个页面入口必须保持原生 `button`，活动菜单项必须设置 `aria-current="page"`。
- 侧边栏高度不足时必须内部纵向滚动，不得推动主内容区或产生横向位移。

---

### Task 1: 建立三段式导航结构与语义契约

**Files:**
- Modify: `major-construction-platform/tests/results-portal.test.mjs`
- Modify: `major-construction-platform/src/app/app-config.ts`
- Modify: `major-construction-platform/src/App.vue:7088-7116`
- Modify: `major-construction-platform/index.html:4186-4190`
- Modify: `major-construction-platform/index.html:4539-4549`

**Interfaces:**
- Consumes: `sideItems: string[]`、`activeTalentSection: Ref<string>`、`activeTalentSubsystem: Ref<string>`、`selectTalentSection(item: string): void`、`openTalentSubsystem(key: string): void`。
- Produces: `talentSubsystemItems` 项在保留 `icon: string` 的同时新增 `groupLabel: string` 与 `iconClass: string`；Vue 和静态入口均输出 `.talent-module-menu`、`.talent-menu-group`、`.talent-menu-heading`、`.talent-sub-menu`、`.talent-menu-button`。

- [ ] **Step 1: 用结构测试替换旧的平铺入口断言**

在 `tests/results-portal.test.mjs` 中，将现有的“talent sidebar exposes research and comparison subsystem entries”和“talent subsystem sidebar entries keep long labels on one line”两个测试替换为：

```js
test('talent sidebar mirrors the industry model grouping in Vue and static entries', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /talent-module-menu talent-figma-menu/)
    assert.match(source, /talent-menu-group/)
    assert.match(source, /talent-menu-heading/)
    assert.match(source, /talent-sub-menu/)
    assert.match(source, /talent-menu-button/)
    assert.match(source, /方案建设/)
    assert.match(source, /方案调研/)
    assert.match(source, /方案比对/)
    assert.match(source, /aria-current/)
  }

  for (const label of [
    '培养目标',
    '毕业要求',
    '课程管理',
    '支撑矩阵',
    '学生管理',
    '人才培养方案调研',
    '人才培养方案比对',
  ]) {
    assert.match(appSource, new RegExp(label))
    assert.match(staticHtml, new RegExp(label))
  }

  assert.match(appConfig, /groupLabel: '方案调研'/)
  assert.match(appConfig, /groupLabel: '方案比对'/)
  assert.match(appConfig, /iconClass: 'talent-research-icon'/)
  assert.match(appConfig, /iconClass: 'talent-compare-icon'/)
  assert.match(appSource, /activeTalentSubsystem/)
  assert.match(appSource, /openTalentSubsystem/)
  assert.match(staticHtml, /data-talent-section/)
  assert.match(staticHtml, /data-talent-subsystem/)
})
```

- [ ] **Step 2: 运行目标测试并确认 RED**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="talent sidebar mirrors" tests/results-portal.test.mjs
```

Expected: FAIL，首个缺失项为 `talent-module-menu talent-figma-menu`。

- [ ] **Step 3: 为子系统菜单数据补充分组元数据**

将 `src/app/app-config.ts` 中的 `talentSubsystemItems` 改为：

```ts
export const talentSubsystemItems = [
  {
    key: 'research',
    groupLabel: '方案调研',
    label: '人才培养方案调研',
    icon: '⌕',
    iconClass: 'talent-research-icon',
  },
  {
    key: 'compare',
    groupLabel: '方案比对',
    label: '人才培养方案比对',
    icon: '⇄',
    iconClass: 'talent-compare-icon',
  },
]
```

将 `index.html` 中的 `staticTalentSubsystems` 同步改为：

```js
const staticTalentSubsystems = [
  {
    key: 'research',
    groupLabel: '方案调研',
    label: '人才培养方案调研',
    icon: '⌕',
    iconClass: 'talent-research-icon'
  },
  {
    key: 'compare',
    groupLabel: '方案比对',
    label: '人才培养方案比对',
    icon: '⇄',
    iconClass: 'talent-compare-icon'
  }
]
```

- [ ] **Step 4: 将 Vue 侧边栏改为三个始终展开的分组**

用以下结构替换 `src/App.vue` 的人才方案 `<aside>`：

```vue
<aside
  v-if="currentModule === '人才方案管理'"
  class="section-menu talent-module-menu talent-figma-menu"
  aria-label="人才方案管理导航"
>
  <section
    class="talent-menu-group talent-build-group"
    :class="{ active: activeTalentSubsystem === '' }"
  >
    <div class="talent-menu-heading">
      <span class="talent-menu-icon talent-build-icon" aria-hidden="true"></span>
      <strong>方案建设</strong>
    </div>
    <div class="talent-sub-menu">
      <button class="talent-version-select" type="button" aria-label="当前人才方案版本：2026版本">
        <span>2026版本</span>
        <span class="talent-version-chevron" aria-hidden="true"></span>
      </button>
      <div class="talent-sub-title">· 方案内容 ·</div>
      <button
        v-for="item in sideItems"
        :key="item"
        class="talent-menu-button"
        :class="{ selected: activeTalentSubsystem === '' && activeTalentSection === item }"
        :aria-current="activeTalentSubsystem === '' && activeTalentSection === item ? 'page' : undefined"
        type="button"
        @click="selectTalentSection(item)"
      >
        {{ item }}
      </button>
    </div>
  </section>

  <section
    v-for="item in talentSubsystemItems"
    :key="item.key"
    class="talent-menu-group"
    :class="{ active: activeTalentSubsystem === item.key }"
  >
    <div class="talent-menu-heading">
      <span class="talent-menu-icon" :class="item.iconClass" aria-hidden="true"></span>
      <strong>{{ item.groupLabel }}</strong>
    </div>
    <div class="talent-sub-menu">
      <button
        class="talent-menu-button"
        :class="{ selected: activeTalentSubsystem === item.key }"
        :aria-current="activeTalentSubsystem === item.key ? 'page' : undefined"
        type="button"
        @click="openTalentSubsystem(item.key)"
      >
        {{ item.label }}
      </button>
    </div>
  </section>
</aside>
```

- [ ] **Step 5: 将静态侧边栏输出改为相同结构**

在 `index.html` 的 `staticTalentShell()` 前增加两个只负责输出结构的函数：

```js
const staticTalentBuildGroupHtml = (section = '培养目标', subsystem = '') => `
  <section class="talent-menu-group talent-build-group ${!subsystem ? 'active' : ''}">
    <div class="talent-menu-heading">
      <span class="talent-menu-icon talent-build-icon" aria-hidden="true"></span>
      <strong>方案建设</strong>
    </div>
    <div class="talent-sub-menu">
      <button class="talent-version-select" type="button" aria-label="当前人才方案版本：2026版本">
        <span>2026版本</span>
        <span class="talent-version-chevron" aria-hidden="true"></span>
      </button>
      <div class="talent-sub-title">· 方案内容 ·</div>
      ${staticTalentSections.map((item) => `
        <button
          type="button"
          class="talent-menu-button ${!subsystem && item === section ? 'selected' : ''}"
          data-talent-section="${item}"
          ${!subsystem && item === section ? 'aria-current="page"' : ''}
        >${item}</button>
      `).join('')}
    </div>
  </section>`

const staticTalentSubsystemGroupHtml = (item, subsystem = '') => `
  <section class="talent-menu-group ${subsystem === item.key ? 'active' : ''}">
    <div class="talent-menu-heading">
      <span class="talent-menu-icon ${item.iconClass}" aria-hidden="true"></span>
      <strong>${item.groupLabel}</strong>
    </div>
    <div class="talent-sub-menu">
      <button
        type="button"
        class="talent-menu-button ${subsystem === item.key ? 'selected' : ''}"
        data-talent-subsystem="${item.key}"
        ${subsystem === item.key ? 'aria-current="page"' : ''}
      >${item.label}</button>
    </div>
  </section>`
```

将 `staticTalentShell()` 内原有人才方案 `<aside>` 区块替换为：

```js
<aside class="section-menu talent-module-menu talent-figma-menu" aria-label="人才方案管理导航">
  ${staticTalentBuildGroupHtml(section, subsystem)}
  ${staticTalentSubsystems.map((item) => staticTalentSubsystemGroupHtml(item, subsystem)).join('')}
</aside>
```

保留画布、助手按钮和现有事件委托不变。

- [ ] **Step 6: 运行目标测试并确认结构转绿**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="talent sidebar mirrors" tests/results-portal.test.mjs
```

Expected: PASS，输出 `1` 个通过测试且无失败。

- [ ] **Step 7: 提交结构改造**

```bash
git add major-construction-platform/tests/results-portal.test.mjs major-construction-platform/src/app/app-config.ts major-construction-platform/src/App.vue major-construction-platform/index.html
git commit -m "feat: group talent sidebar navigation"
```

---

### Task 2: 实现产教模型同体系的视觉与可访问状态

**Files:**
- Modify: `major-construction-platform/tests/results-portal.test.mjs`
- Modify: `major-construction-platform/src/styles/10-shell.css:60-104`
- Modify: `major-construction-platform/src/styles/20-talent.css:1`

**Interfaces:**
- Consumes: Task 1 输出的 `.talent-module-menu`、`.talent-menu-group`、`.talent-menu-heading`、`.talent-menu-icon`、`.talent-sub-menu`、`.talent-version-select`、`.talent-menu-button`。
- Produces: 固定的 `176px` 容器、`128px × 30px` 菜单、蓝紫活动态、三种分组图标、悬停/聚焦状态和内部滚动契约。

- [ ] **Step 1: 增加失败的视觉契约测试**

在 Task 1 的结构测试后增加：

```js
test('talent sidebar matches the industry model geometry and interaction states', () => {
  const sidebarStyles = styleBlock('.section-menu.talent-module-menu.talent-figma-menu')
  assert.match(sidebarStyles, /width:\s*176px/)
  assert.match(sidebarStyles, /flex:\s*0 0 176px/)
  assert.match(sidebarStyles, /padding:\s*31px 24px 16px/)
  assert.match(sidebarStyles, /overflow-y:\s*auto/)
  assert.match(sidebarStyles, /linear-gradient\(90deg/)

  const groupStyles = styleBlock('.talent-menu-group')
  assert.match(groupStyles, /width:\s*128px/)
  assert.match(groupStyles, /margin:\s*0 auto 20px/)

  const headingStyles = styleBlock('.talent-menu-heading')
  assert.match(headingStyles, /min-height:\s*74px/)
  assert.match(headingStyles, /flex-direction:\s*column/)

  const iconStyles = styleBlock('.talent-menu-icon')
  assert.match(iconStyles, /width:\s*34px/)
  assert.match(iconStyles, /height:\s*34px/)

  const buttonStyles = styleBlock('.talent-version-select,\n.talent-menu-button')
  assert.match(buttonStyles, /width:\s*128px/)
  assert.match(buttonStyles, /height:\s*30px/)
  assert.match(buttonStyles, /border-radius:\s*8px/)

  const menuButtonStyles = styleBlock('.talent-menu-button')
  assert.match(menuButtonStyles, /white-space:\s*nowrap/)
  assert.match(menuButtonStyles, /font-size:\s*13px/)

  const selectedStyles = styleBlock('.talent-menu-button.selected')
  assert.match(selectedStyles, /linear-gradient\(90deg, #1d6fff 0%, #8b5cf6 100%\)/)
  assert.match(selectedStyles, /color:\s*#ffffff/)

  assert.match(stylesCss, /\.talent-menu-button:focus-visible/)
  assert.match(stylesCss, /\.talent-menu-group\.active \.talent-menu-heading strong/)
  assert.match(stylesCss, /@media \(prefers-reduced-motion: reduce\)/)
  assert.doesNotMatch(stylesCss, /\.talent-subsystem-entry\s*\{/)
})
```

- [ ] **Step 2: 运行视觉契约测试并确认 RED**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="talent sidebar matches" tests/results-portal.test.mjs
```

Expected: FAIL，提示 `.section-menu.talent-module-menu.talent-figma-menu` 样式块不存在。

- [ ] **Step 3: 删除不再使用的旧人才子系统样式**

从 `src/styles/10-shell.css` 删除以下完整选择器块：

```css
.talent-subsystem-spacer {
  display: none;
}

.talent-subsystem-entry-group {
  display: grid;
  width: 156px;
  gap: 14px;
  margin-top: auto;
}

.talent-subsystem-entry {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid var(--web-border);
  border-radius: 8px;
  color: var(--web-text-muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 8px 18px rgba(75, 93, 142, 0.08);
}

.talent-subsystem-entry span {
  flex: 0 0 auto;
  color: var(--web-primary);
  font-size: 15px;
}

.talent-subsystem-entry.selected {
  border-color: #4f82ff;
  color: #ffffff;
  background: var(--web-primary);
  box-shadow: 0 10px 18px rgba(21, 92, 232, 0.22);
}

.talent-subsystem-entry.selected span {
  color: #ffffff;
}
```

保留 `.section-menu`、`.section-title-icon`、`.version-select` 和 `.side-button`，因为其他现有页面仍可能依赖通用外观。

- [ ] **Step 4: 在 20-talent.css 增加人才方案专属视觉规则**

在 `src/styles/20-talent.css` 顶部、现有 `.job-section-menu` 规则之前加入：

```css
.section-menu.talent-module-menu.talent-figma-menu {
  width: 176px;
  flex: 0 0 176px;
  align-items: center;
  padding: 31px 24px 16px;
  overflow-x: hidden;
  overflow-y: auto;
  text-align: center;
  border-right: 1px solid var(--web-border-soft);
  background:
    linear-gradient(90deg, rgba(218, 230, 255, 0.96) 0%, rgba(231, 237, 255, 0.92) 58%, rgba(248, 251, 255, 0.86) 100%),
    var(--web-panel);
}

.talent-menu-group {
  width: 128px;
  margin: 0 auto 20px;
}

.talent-menu-group:last-child {
  margin-bottom: 0;
}

.talent-menu-heading {
  display: flex;
  width: 128px;
  min-height: 74px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  color: var(--web-text);
  text-align: center;
}

.talent-menu-heading strong {
  color: var(--web-text);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  font-weight: 800;
  line-height: 20px;
}

.talent-menu-group.active .talent-menu-heading strong {
  color: #1d4ed8;
}

.talent-menu-icon {
  position: relative;
  display: block;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  box-shadow:
    inset 0 0 0 1px rgba(122, 145, 255, 0.25),
    0 9px 18px rgba(85, 111, 230, 0.18);
}

.talent-menu-icon::before,
.talent-menu-icon::after {
  position: absolute;
  content: "";
}

.talent-build-icon {
  background: linear-gradient(135deg, #eef5ff 0%, #d9e5ff 48%, #6f82ff 100%);
}

.talent-build-icon::before {
  top: 8px;
  left: 9px;
  width: 16px;
  height: 19px;
  border: 2px solid #4f67ff;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.45);
}

.talent-build-icon::after {
  top: 13px;
  left: 13px;
  width: 8px;
  height: 7px;
  border-top: 2px solid #4f67ff;
  border-bottom: 2px solid #4f67ff;
}

.talent-research-icon {
  background: linear-gradient(135deg, #eaf2ff 0%, #cfdcff 48%, #8b5cf6 100%);
}

.talent-research-icon::before {
  top: 8px;
  left: 8px;
  width: 13px;
  height: 13px;
  border: 2px solid #5668ff;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.42);
}

.talent-research-icon::after {
  top: 22px;
  left: 21px;
  width: 9px;
  height: 2px;
  border-radius: 2px;
  background: #5668ff;
  transform: rotate(43deg);
  transform-origin: left center;
}

.talent-compare-icon {
  background: linear-gradient(135deg, #ecfdf5 0%, #d8f4e8 46%, #42c99a 100%);
}

.talent-compare-icon::before {
  top: 10px;
  left: 7px;
  width: 18px;
  height: 6px;
  border-top: 2px solid #098b68;
  border-right: 2px solid #098b68;
  transform: skewX(35deg);
}

.talent-compare-icon::after {
  right: 7px;
  bottom: 9px;
  width: 18px;
  height: 6px;
  border-bottom: 2px solid #098b68;
  border-left: 2px solid #098b68;
  transform: skewX(35deg);
}

.talent-sub-menu {
  width: 128px;
}

.talent-sub-title {
  width: 100%;
  margin: 8px 0 4px;
  padding: 0 4px;
  color: var(--web-text-subtle);
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
}

.talent-version-select,
.talent-menu-button {
  display: flex;
  width: 128px;
  height: 30px;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--web-text-muted);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 13px;
  line-height: 20px;
  background: rgba(255, 255, 255, 0.72);
  transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.talent-version-select {
  gap: 7px;
  border-color: rgba(16, 63, 183, 0.12);
  background: rgba(255, 255, 255, 0.58);
}

.talent-version-chevron {
  width: 6px;
  height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
}

.talent-menu-button {
  margin-top: 8px;
  white-space: nowrap;
}

.talent-version-select:hover,
.talent-menu-button:hover {
  color: #31507f;
  background: rgba(255, 255, 255, 0.92);
}

.talent-menu-button.selected {
  color: #ffffff;
  border-color: #4f82ff;
  background: linear-gradient(90deg, #1d6fff 0%, #8b5cf6 100%);
  box-shadow: 0 10px 20px rgba(77, 93, 235, 0.24);
}

.talent-version-select:focus-visible,
.talent-menu-button:focus-visible {
  outline: 2px solid rgba(47, 111, 255, 0.48);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .talent-version-select,
  .talent-menu-button {
    transition: none;
  }
}
```

- [ ] **Step 5: 运行两个侧边栏目标测试**

Run:

```bash
cd major-construction-platform
node --test --test-name-pattern="talent sidebar" tests/results-portal.test.mjs
```

Expected: PASS，结构测试和视觉契约测试均通过。

- [ ] **Step 6: 运行 TypeScript 与生产构建检查**

Run:

```bash
cd major-construction-platform
npm run build
```

Expected: `vue-tsc -b` 与 `vite build` 均成功，退出码为 `0`。

- [ ] **Step 7: 提交视觉实现**

```bash
git add major-construction-platform/tests/results-portal.test.mjs major-construction-platform/src/styles/10-shell.css major-construction-platform/src/styles/20-talent.css
git commit -m "style: align talent sidebar with industry model"
```

---

### Task 3: 完成双入口交互验证与视觉 QA

**Files:**
- Modify: `major-construction-platform/design-qa.md`
- Verify: `major-construction-platform/index.html`
- Verify: `major-construction-platform/src/App.vue`
- Verify: `/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-0311e9af-ace8-4665-baf6-8092dbfc00e6.png`

**Interfaces:**
- Consumes: Task 1 的同构结构和 Task 2 的视觉契约。
- Produces: 七个入口的交互证据、桌面与矮视口的截图证据，以及 `final result: passed` 的 QA 记录。

- [ ] **Step 1: 运行完整自动化测试**

Run:

```bash
cd major-construction-platform
npm test
```

Expected: 全部测试通过，失败数为 `0`。

- [ ] **Step 2: 再次运行生产构建作为最终基线**

Run:

```bash
cd major-construction-platform
npm run build
```

Expected: 构建成功，退出码为 `0`，无 TypeScript 错误。

- [ ] **Step 3: 启动 Vue 入口并验证七个导航状态**

Run:

```bash
cd major-construction-platform
npm run dev -- --port 4173 --strictPort
```

在浏览器打开 `http://127.0.0.1:4173/`，依次执行：

1. 点击“人才方案管理”。
2. 点击培养目标、毕业要求、课程管理、支撑矩阵、学生管理。
3. 点击人才培养方案调研、人才培养方案比对。
4. 每一步确认内容切换、唯一活动菜单项和所属分组标题同步高亮。
5. 使用 Tab 键确认七个入口均可聚焦，焦点轮廓可见。
6. 检查浏览器控制台，确认无运行时错误。

Expected: 七个入口均可用，每个状态只有一个 `aria-current="page"`。

- [ ] **Step 4: 验证 file:// 静态入口行为一致**

在浏览器打开：

```text
file:///Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/major-construction-platform/index.html
```

重复 Step 3 的七个入口点击路径，并确认 `data-talent-section` 与 `data-talent-subsystem` 事件委托正常工作。

Expected: 静态入口与 Vue 入口的结构、文案、活动态和页面切换一致。

- [ ] **Step 5: 执行桌面与矮视口视觉检查**

分别在约 `2048 × 1240` 和 `1440 × 720` 视口检查并截图：

- 对照产教模型侧边栏确认宽度、渐变背景、`34px` 图标、`128px × 30px` 菜单和蓝紫选中态一致。
- 对照用户原截图确认红框区域已从平铺结构重组为三段式层级，主体内容位置稳定。
- 在矮视口滚动人才方案侧边栏，确认第三组可到达，主内容区不随侧栏滚动且页面无横向溢出。
- 检查长标签完整显示，不换行、不截断。

Expected: 无 P0、P1、P2 视觉问题；P3 仅记录为后续微调，不阻塞交付。

- [ ] **Step 6: 将 QA 结果写入 design-qa.md**

在 `major-construction-platform/design-qa.md` 顶部追加：

```markdown
# 人才方案管理侧边栏对齐产教模型 QA

- Source visual truth：`/var/folders/zq/0shk2lcn5lz9ncw39dykp0vm0000gn/T/codex-clipboard-0311e9af-ace8-4665-baf6-8092dbfc00e6.png`
- Reference component：产教模型侧边栏
- Verified entries：Vue 与 `file://` 静态入口
- Viewports：2048 × 1240、1440 × 720

## Findings

- P0：无。
- P1：无。
- P2：无。
- 三个分组、七个入口、活动状态、键盘焦点和矮视口内部滚动均通过验证。
- Vue 与静态入口结构及行为一致，浏览器控制台无运行时错误。

final result: passed

---
```

若视觉对比发现 P0/P1/P2，先修复并重新执行 Task 2 的目标测试、完整测试、构建和本 Task 的截图检查；只有报告为 `final result: passed` 才能交付。

- [ ] **Step 7: 提交 QA 记录**

```bash
git add major-construction-platform/design-qa.md
git commit -m "test: verify talent sidebar alignment"
```
