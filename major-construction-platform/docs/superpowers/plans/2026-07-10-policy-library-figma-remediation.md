# 政策库 Figma 还原整改实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Vue/Vite 与 `file://` standalone 两套入口中，把产业政策库还原到 Figma `1440 × 988` 基线，并补齐核心交互、响应式和可访问性。

**Architecture:** 保留现有应用外壳和双入口架构。政策数据与产业链展示配置放在 `talent-industry-data.ts`；Vue 在 `App.vue` 计算当前视图；standalone 在 `index.html` 镜像同一展示规则；两套入口共用 `20-talent.css` 的视觉规范。

**Tech Stack:** Vue 3 Composition API、TypeScript、HTML/CSS、Node.js `node:test`、Vite。

## Global Constraints

- Figma `1440 × 988` 是唯一视觉基线；不得发明新的卡片风格、色板、圆角、图标或布局。
- 同步覆盖 `src/App.vue` 与 `index.html`，共享样式写入 `src/styles/20-talent.css`。
- 不修改 `V1.0需求（2026.6.11）/V1.0_demo`。
- 不新增未经核验的政策事实；产业链联动只复用现有政策记录。
- 工具栏不显示“清除筛选项”按钮；标题数量必须显示当前匹配数。
- 趋势图必须有 2022–2027 六年、0/30/60/90/120 纵轴和可访问数值文本。
- 搜索、筛选、产业链切换和详情弹窗必须可键盘操作。
- `1280 × 720` 不得裁切关键词云或趋势图；页面可以纵向滚动。
- 遵循 TDD：每个行为先让测试按旧实现失败，再写生产代码。

---

### Task 1: 锁定新的政策库展示与交互契约

**Files:**
- Modify: `tests/results-portal.test.mjs`

- [ ] 更新旧 Figma 断言到精确 token：背景、16px 画板内边距、18px 节奏、32px 控件、字体规格、141px 条目节奏。
- [ ] 增加双入口断言：无“清除筛选项”按钮、动态匹配数、产业链展示配置、2027 数据、纵轴、可访问数值。
- [ ] 增加交互断言：tabs 键盘处理、详情独立按钮、弹窗 Escape/焦点圈定/焦点还原、standalone 搜索焦点恢复。
- [ ] 运行 `node --test tests/results-portal.test.mjs`，确认新断言在旧实现上失败。

### Task 2: 建立产业链联动展示数据

**Files:**
- Modify: `src/app/talent-industry-data.ts`
- Modify: `index.html`
- Test: `tests/results-portal.test.mjs`

- [ ] 为现有政策记录添加稳定 id/产业链关联，或新增等价的链路映射配置。
- [ ] 导出四条产业链的 AI 解读、政策 id 子集、关键词和 2022–2027 趋势值。
- [ ] 默认链展示完整数据，其他链展示现有记录的可信子集。
- [ ] standalone 镜像相同字段和数值。
- [ ] 运行定向测试，确认数据契约通过。

### Task 3: 重构 Vue 政策库结构与状态

**Files:**
- Modify: `src/App.vue`
- Test: `tests/results-portal.test.mjs`

- [ ] 基于 `selectedIndustryChain` 计算当前政策库视图，再执行搜索和级别筛选。
- [ ] 标题数量绑定 `filteredIndustryPolicyItems.length`，删除可见清除按钮。
- [ ] 产业链 tabs 添加 roving tabindex、方向键切换和 tabpanel 关联。
- [ ] 政策条目改为独立详情按钮与独立原始地址链接，保留鼠标与 Enter/Space 使用体验。
- [ ] 趋势图渲染纵轴、六根柱和屏幕阅读器数值。
- [ ] 删除重复的专业建设影响段落。
- [ ] 为详情弹窗补齐初始焦点、Escape、焦点圈定与关闭后还原。
- [ ] 运行定向测试和 `npm run build`。

### Task 4: 同步 standalone 政策库结构与事件

**Files:**
- Modify: `index.html`
- Test: `tests/results-portal.test.mjs`

- [ ] 同步动态匹配数、无清除按钮、产业链联动、趋势轴和详情按钮结构。
- [ ] 搜索重绘后恢复输入焦点、光标与页面滚动。
- [ ] 同步 tabs 键盘行为和详情弹窗的焦点管理、Escape、焦点还原。
- [ ] 为 standalone 弹窗补齐 `aria-labelledby` 与关闭按钮名称。
- [ ] 运行定向测试。

### Task 5: 按 Figma 重写政策库样式

**Files:**
- Modify: `src/styles/20-talent.css`
- Modify if needed: `src/styles/10-shell.css`
- Add: `public/figma-assets/policy-search.svg`
- Add: `public/figma-assets/policy-section-marker.svg`
- Test: `tests/results-portal.test.mjs`

- [ ] 使用可信图标库资产补齐搜索图标和侧栏菱形标记，不用文字字符、CSS 绘图或手写 SVG。
- [ ] 应用 Figma 的颜色、16/18px 栅格、690px 主列、32px 控件、精确字体层级和 141px 条目节奏。
- [ ] 将侧栏标题从竖线样式改为图标资产，趋势图改为六柱和纵轴布局。
- [ ] 增加 `:focus-within`、`:focus-visible` 和条目交互态。
- [ ] 让政策页容器在矮屏纵向滚动，移除右侧内容裁切。
- [ ] 统一 standalone 政策页二级导航宽度。
- [ ] 运行定向测试、完整 `npm test` 与 `npm run build`。

### Task 6: 浏览器交互与设计 QA

**Files:**
- Add/Modify: `design-qa.md`
- Add: `artifacts/policy-library-remediation/*`

- [ ] 启动 Vite，并在用户选择的浏览器中打开政策库直达地址。
- [ ] 在 `1440 × 988` 捕获默认态，测试产业链切换、搜索、筛选、详情弹窗、Escape、Tab 循环和焦点还原；检查控制台错误。
- [ ] 在 `1280 × 720` 验证页面滚动和右侧卡片完整可见。
- [ ] 把 Figma 参考图和实现截图合成同一张比较图，执行字体、间距、颜色、图标/资产、文案五项 QA。
- [ ] 修复所有 P0/P1/P2，重复捕获与比较。
- [ ] 写入 `design-qa.md`；只有 `final result: passed` 才能交付。

### Task 7: 最终验证与交付

**Files:**
- Review all changed files.

- [ ] 检查 `git diff`，确认没有修改旧版快照或无关模块。
- [ ] 再次运行政策库定向测试、完整测试与构建。
- [ ] 明确区分本轮结果与 4 个既有基线失败。
- [ ] 保持本地预览运行，返回可点击预览地址、QA 报告和主要改动文件。
