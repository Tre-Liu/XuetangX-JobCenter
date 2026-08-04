# 热门岗位分析三页签 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让热门岗位分析浮窗中的培养目标、毕业要求和课程建设三个页签可切换，并按需求截图展示完整的智能建造专业分析内容。

**Architecture:** 在现有热门岗位分析数据中增加毕业要求对比、岗位能力支撑和课程建议结构。Vue 使用 `activeAiAnalysisTab` 控制条件渲染；静态页使用 `staticAiAnalysisTab` 与事件委托重新渲染浮窗内容。图表使用 SVG/CSS，支撑度图和明细表共用同一数据源。

**Tech Stack:** Vue 3 Composition API、TypeScript、原生 DOM 事件委托、SVG、CSS、Node.js `node:test`、Vite。

## Global Constraints

- 默认页签为 `goals`，关闭后重新打开也恢复为 `goals`。
- 三个页签键固定为 `goals`、`requirements`、`courses`。
- Vue 与静态 HTML 内容和交互一致。
- 课程分析至少包含雷达图、横向支撑度图、明细表和新增课程建议。
- 所有业务文案适配智能建造工程专业。
- 不新增第三方图表依赖，不修改浮窗打开、关闭、滚动锁定和焦点恢复行为。

---

### Task 1: 页签行为回归测试

**Files:**
- Modify: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: Vue `activeAiAnalysisTab`、静态页 `staticAiAnalysisTab`。
- Produces: 能捕获页签退化为静态文本、静态入口缺少委托切换、课程分析缺少关键模块的失败测试。

- [ ] **Step 1: 写入失败测试**

新增断言：Vue 三个页签是 `button[role=tab]` 并更新 `activeAiAnalysisTab`；静态页包含 `data-ai-analysis-tab` 且点击后更新状态并重渲染；两端均包含“毕业要求对比分析、岗位能力维度对比、岗位能力支撑度、课程支撑度明细、新增课程建议”。

- [ ] **Step 2: 验证测试为 RED**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL，失败原因是现有页签仍为无事件的 `span`，且课程分析图表结构不存在。

### Task 2: 数据与 Vue 页签实现

**Files:**
- Modify: `src/mock/decision-center.ts`
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: `aiHotJobAnalysisAdvice`。
- Produces: `graduationRequirementComparisons`、`abilitySupport`、`courseSuggestions` 数据；`activeAiAnalysisTab: Ref<'goals' | 'requirements' | 'courses'>`；三个条件内容面板。

- [ ] **Step 1: 扩充智能建造分析数据**

为毕业要求对比增加编号、标题、指标点和原因；为课程分析增加六项能力的岗位需求度、课程覆盖度、对应课程和建议课程。

- [ ] **Step 2: 实现 Vue 页签与内容面板**

将三个 `span` 改为原生按钮，并以 `v-if / v-else-if / v-else` 渲染培养目标、毕业要求、课程建设三类面板。课程面板使用 SVG 多边形绘制雷达图，并用相同数据生成横向支撑条和明细表。

- [ ] **Step 3: 验证专项测试转为 GREEN**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: Vue 页签和内容断言 PASS，静态版交互断言仍提示尚未实现。

### Task 3: 静态页签实现与视觉样式

**Files:**
- Modify: `index.html`
- Modify: `src/styles/90-decision.css`

**Interfaces:**
- Consumes: `staticAiHotJobAnalysisAdvice`、`staticAiAnalysisTab`。
- Produces: `staticAiAnalysisReportHtml(advice)`、`data-ai-analysis-tab` 委托切换，以及 Vue/静态共用的图表、表格和建议卡片样式。

- [ ] **Step 1: 同步静态数据与报告渲染**

加入与 Vue 相同的数据；把报告下半部分抽成基于 `staticAiAnalysisTab` 的 HTML 生成函数，点击页签时更新状态并替换浮窗。

- [ ] **Step 2: 增加参考截图样式**

为页签按钮、雷达图、支撑条、课程明细表、建议课程网格提供浅蓝报告风格；保留长页内部滚动和现有响应式边界。

- [ ] **Step 3: 验证专项测试全部 GREEN**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs`

Expected: 0 failures。

### Task 4: 完整验证

**Files:**
- Verify: `src/mock/decision-center.ts`
- Verify: `src/App.vue`
- Verify: `index.html`
- Verify: `src/styles/90-decision.css`
- Verify: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: 前三项实现。
- Produces: 自动化、构建和浏览器交互证据。

- [ ] **Step 1: 运行专项测试、完整测试与构建**

Run: `node --test tests/ai-smart-construction-suggestion.test.mjs && npm test && npm run build`

Expected: 全部退出码为 0。

- [ ] **Step 2: 浏览器验收**

打开本地静态页，依次点击三个页签，确认活动状态与内容同步；毕业要求页出现对比和新增建议；课程建设页出现雷达图、支撑度图、明细表和课程建议；关闭浮窗后背景滚动与焦点恢复。

- [ ] **Step 3: 检查最终差异**

Run: `git diff --check && git status --short`

Expected: 无空白错误，只有计划中的文件发生变化。
