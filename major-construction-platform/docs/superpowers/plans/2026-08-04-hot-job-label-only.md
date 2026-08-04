# 热门岗位卡片标签精简 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将具有招聘数据的岗位卡片从“招聘数量｜企业数量｜市场热门岗”精简为仅显示“市场热门岗”，并保持 Vue、静态 demo、测试和需求文档一致。

**Architecture:** 保留 `AiHotJob` 中的 `recruitmentCount` 与 `companyCount`，继续作为真实数据和排序依据；仅修改两个可见入口的卡片渲染与标签样式。需求规格保留招聘明细表，同时明确数量不直接展示在卡片中。

**Tech Stack:** Vue 3、TypeScript、静态 HTML/JavaScript、CSS、Node.js `node:test`

## Global Constraints

- 市场热门岗卡片只显示“市场热门岗”。
- 产业代表岗卡片只显示“产业代表岗”。
- 招聘数量和招聘企业数量保留在数据结构与需求文档明细中。
- Vue 源码入口和 `file://` 静态入口保持一致。
- 不改变岗位顺序、分页或入选规则。

---

### Task 1: 用测试锁定标签展示

**Files:**
- Modify: `major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: Vue 岗位卡片模板与 `staticAiHotJobsHtml()`。
- Produces: 卡片只展示类型标签、但 mock 仍保留真实数量字段的回归约束。

- [ ] **Step 1: 修改测试预期**

断言 Vue 和静态卡片渲染均包含“市场热门岗”“产业代表岗”，且渲染片段不再拼接“条招聘”“家企业”；同时保留 `decision-center.ts` 中 `recruitmentCount: 46` 和 `companyCount: 38` 的数据断言。

- [ ] **Step 2: 运行定向测试验证失败**

Run: `npm test -- tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL，因为 Vue 与静态模板仍显示招聘数量和企业数量。

### Task 2: 同步两个 demo 入口和标签样式

**Files:**
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/index.html`
- Modify: `major-construction-platform/src/mock/decision-center.ts`
- Modify: `major-construction-platform/src/styles/90-decision.css`

**Interfaces:**
- Consumes: `job.selectionType: 'market' | 'representative'`。
- Produces: 两类岗位统一使用圆角标签，仅文案不同。

- [ ] **Step 1: 修改 Vue 卡片**

将 `market` 分支改为 `<span class="ai-analysis-job-evidence market">市场热门岗</span>`，不读取可见模板中的招聘数量或企业数量。

- [ ] **Step 2: 修改静态卡片**

在 `staticAiHotJobsHtml()` 中让 `market` 分支只返回“市场热门岗”，保留静态数据对象中的 `recruitmentCount` 与 `companyCount`。

- [ ] **Step 3: 同步摘要和样式**

摘要改为“具有真实招聘记录的岗位标记为市场热门岗”；将圆角、背景和加粗样式放到 `.ai-analysis-job-evidence`，两类标签共享视觉规则。

- [ ] **Step 4: 运行定向测试**

Run: `npm test -- tests/ai-smart-construction-suggestion.test.mjs`

Expected: PASS。

### Task 3: 验证并提交

**Files:**
- Verify: `major-construction-platform/docs/superpowers/specs/2026-08-04-hot-job-analysis-modal-design.md`
- Verify: `major-construction-platform/index.html`
- Verify: `major-construction-platform/src/App.vue`

**Interfaces:**
- Consumes: 已更新的 demo 与需求规格。
- Produces: 通过测试和构建的可交付修改。

- [ ] **Step 1: 检查差异**

Run: `git diff --check`

Expected: 无空白错误，未纳入既有未跟踪数据目录。

- [ ] **Step 2: 运行完整测试**

Run: `npm test`

Expected: 全部 PASS。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: Vue 类型检查和 Vite 构建成功。
