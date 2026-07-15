# 产业调研管理页滚动修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复产业调研管理页长内容无法滚动的问题，同时保持顶部栏和左侧菜单固定。

**Architecture:** CMS 外壳继续固定在 `100vh` 视口内，右侧工作区作为两行网格承载顶部栏和内容区。通过允许网格子项收缩并隐藏工作区自身溢出，让内容区成为唯一的纵向滚动容器；Vue 入口与两个独立 HTML 入口使用相同约束。

**Tech Stack:** Vue 3、CSS Grid、Node.js `node:test`、Vite

## Global Constraints

- 不修改产业链关联、置信度、规则得分或专业匹配数据。
- 顶部栏与左侧菜单保持固定，只让右侧页面内容区滚动。
- 同时覆盖 Vue CMS 入口、`industry-research-admin.html` 和 `outputs/industry-research-admin.html`。
- 不执行线上站点发布。

---

### Task 1: 建立滚动容器并增加双入口回归保护

**Files:**
- Modify: `major-construction-platform/tests/industry-research-management.test.mjs`
- Modify: `major-construction-platform/src/styles/95-cms-admin.css`
- Modify: `major-construction-platform/industry-research-admin.html`
- Modify: `major-construction-platform/outputs/industry-research-admin.html`

**Interfaces:**
- Consumes: 现有 `.cms-admin-shell`、`.cms-workspace`、`.cms-page-body` 与独立页面 `.page-body` CSS 选择器。
- Produces: 固定视口外壳、可收缩工作区和唯一可纵向滚动的内容区；不新增 JavaScript API。

- [x] **Step 1: 写入失败的滚动布局测试**

在 `industry-research-management.test.mjs` 中增加测试，要求 Vue 样式包含以下约束：

```js
test('industry research CMS keeps navigation fixed while the page body scrolls', () => {
  const shellStyle = styleBlock('.cms-admin-shell')
  const workspaceStyle = styleBlock('.cms-workspace')
  const pageBodyStyle = styleBlock('.cms-page-body')

  assert.match(shellStyle, /height:\s*100vh;/)
  assert.match(shellStyle, /overflow:\s*hidden;/)
  assert.match(workspaceStyle, /min-height:\s*0;/)
  assert.match(workspaceStyle, /overflow:\s*hidden;/)
  assert.match(pageBodyStyle, /min-height:\s*0;/)
  assert.match(pageBodyStyle, /overflow:\s*auto;/)

  for (const [label, source] of [
    ['outputs static html', localHtml],
    ['root static html', rootLocalHtml],
  ]) {
    assert.match(source, /\.cms-admin-shell\s*\{[^}]*height:\s*100vh;[^}]*overflow:\s*hidden;/s, `${label} should constrain the CMS shell to the viewport`)
    assert.match(source, /\.cms-workspace\s*\{[^}]*min-height:\s*0;[^}]*overflow:\s*hidden;/s, `${label} should allow the workspace grid to shrink`)
    assert.match(source, /\.page-body\s*\{[^}]*min-height:\s*0;[^}]*overflow:\s*auto;/s, `${label} should scroll the page body`)
  }
})
```

- [x] **Step 2: 运行定向测试并确认失败原因**

Run: `npm test -- --test-name-pattern="keeps navigation fixed while the page body scrolls" tests/industry-research-management.test.mjs`

Expected: FAIL，缺少 `overflow: hidden` 或 `min-height: 0`，证明测试能捕获当前滚动缺陷。

- [x] **Step 3: 实施最小 CSS 修复**

在 Vue 样式中加入：

```css
.cms-admin-shell {
  overflow: hidden;
}

.cms-workspace {
  min-height: 0;
  overflow: hidden;
}

.cms-page-body {
  min-height: 0;
  overflow: auto;
}
```

在两个独立 HTML 入口中使用等价约束：

```css
.cms-admin-shell { height: 100vh; overflow: hidden; }
.cms-workspace { min-height: 0; overflow: hidden; }
.page-body { min-height: 0; overflow: auto; }
```

- [x] **Step 4: 运行定向测试并确认通过**

Run: `npm test -- --test-name-pattern="keeps navigation fixed while the page body scrolls" tests/industry-research-management.test.mjs`

Expected: PASS，1 个目标测试通过。

- [x] **Step 5: 运行产业调研管理测试**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: PASS，无失败测试。

- [x] **Step 6: 运行完整验证**

Run: `npm test`

Expected: 全部测试通过。

Run: `npm run build`

Expected: TypeScript 检查与 Vite 生产构建成功；允许既有的外部脚本和大分块非阻塞告警。

- [x] **Step 7: 浏览器验收**

打开 `/?view=industry-research-admin&entry=industry&majorName=智能建造工程专业`，初始化产业链列表后确认：

1. 右侧内容可以滚动到底部。
2. 顶部栏和左侧菜单不随右侧内容滚动。
3. 页面不再显示旧版硬编码的 `96% / 88% / 82%`。

- [x] **Step 8: 提交修复**

```bash
git add major-construction-platform/tests/industry-research-management.test.mjs major-construction-platform/src/styles/95-cms-admin.css major-construction-platform/industry-research-admin.html major-construction-platform/outputs/industry-research-admin.html docs/superpowers/plans/2026-07-15-industry-research-scroll.md
git commit -m "fix: restore industry research page scrolling"
```
