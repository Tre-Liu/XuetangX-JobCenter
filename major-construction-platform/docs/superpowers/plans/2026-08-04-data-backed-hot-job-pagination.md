# 真实招聘数据热门岗位分页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将热门岗位总览改为基于人工智能产业链真实招聘数量和招聘企业数量的岗位列表，并在 Vue 与静态 demo 中提供产业链标签、产业阶段、入选类型和每页 6 个岗位的分页。

**Architecture:** 扩展现有 `AiHotJobAnalysisAdvice.hotJobs` 数据结构，直接保存已按企业数、招聘数排好序的真实数据快照；Vue 通过计算属性分页，静态 `index.html` 使用同构页码状态和 HTML 生成函数。需求规格同步记录本次人工智能产业链数据快照和实际入选结果。

**Tech Stack:** Vue 3 Composition API、TypeScript、原生 HTML/CSS/JavaScript、Node.js `node:test`

## Global Constraints

- 不计算或展示产业映射分、需求热度分、专业匹配度、课程可支撑度或任何综合评分。
- 岗位排序先按招聘企业数量降序，企业数量相同时按招聘数量降序。
- 常规岗位展示真实招聘数量、真实招聘企业数量和“市场热门岗”。
- 没有招聘数据的兜底项仅展示“产业代表岗”，不展示“招聘样本不足”、0 条、0 家或虚构数据。
- 每页展示 6 个岗位；人工智能产业链只有 8 个不同岗位时展示全部 8 个，不制造岗位补足到 12 个。
- Vue 源码入口与 `file://` 静态 `index.html` 必须保持一致。

---

### Task 1: 固化数据结构与失败测试

**Files:**
- Modify: `major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs`
- Create: `major-construction-platform/src/app/ai-hot-jobs.ts`
- Modify: `major-construction-platform/src/mock/decision-center.ts`

**Interfaces:**
- Consumes: 已确认的人工智能产业链岗位—产业节点关系和高置信岗位—招聘关系汇总。
- Produces: `AiHotJob`，字段为 `name`、`industryChain`、`stage`、可选 `recruitmentCount`、可选 `companyCount`、`selectionType`、`tone`；同时产出可直接测试的 `getAiHotJobPage()` 分页纯函数。

- [ ] **Step 1: 写入失败测试**

先在测试内动态导入 `src/app/ai-hot-jobs.ts`，用 8 项手工夹具断言第 1 页为 6 项、第 2 页为 2 项、越界页码被收敛；同时断言 Vue mock 与静态版均包含 8 个不同岗位、人工智能产业链、上中下游、46 条招聘、38 家企业、“市场热门岗”和“产业代表岗”，并断言不包含“招聘样本不足”“产业映射分”。

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `npm test -- tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL，原因是 `src/app/ai-hot-jobs.ts` 尚不存在，当前数据仍是 6 个智能建造岗位。

- [ ] **Step 3: 扩展 TypeScript 类型并替换岗位数据**

在 `src/app/ai-hot-jobs.ts` 加入：

```ts
export type AiHotJob = {
  name: string
  industryChain: string
  stage: '上游' | '中游' | '下游'
  recruitmentCount?: number
  companyCount?: number
  selectionType: 'market' | 'representative'
  tone: 'blue' | 'purple' | 'cyan'
}
```

并实现 `getAiHotJobPage(jobs, page, pageSize = 6)`，返回收敛后的 `page`、`pageCount` 和当前页 `items`。`decision-center.ts` 从该文件导入 `AiHotJob`。

按下列顺序写入 8 个不同岗位：算法工程师（46/38）、机器视觉工程师（2/2）、机器学习工程师（2/1）、自然语言处理（1/1）、深度学习工程师、语音识别工程师、智能驾驶工程师、智能驾驶测试工程师。后 4 项为 `representative` 且不写招聘数量字段。

- [ ] **Step 4: 运行定向测试确认数据断言进入下一处预期失败**

Run: `npm test -- tests/ai-smart-construction-suggestion.test.mjs`

Expected: 数据断言通过，分页相关断言仍失败。

### Task 2: 实现 Vue 岗位卡片与分页

**Files:**
- Modify: `major-construction-platform/src/App.vue`
- Modify: `major-construction-platform/src/styles/90-decision.css`
- Test: `major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: `activeAiAnalysis.hotJobs: AiHotJob[]`。
- Produces: `activeAiHotJobPage`、`pagedAiHotJobs`、`aiHotJobPageCount` 和 `setAiHotJobPage(page: number)`。

- [ ] **Step 1: 补充分页失败测试**

断言 Vue 使用页码状态、`slice` 截取每页 6 条、上一页和下一页具有禁用边界，并在打开或重新分析时回到第 1 页。

- [ ] **Step 2: 运行定向测试确认失败**

Run: `npm test -- tests/ai-smart-construction-suggestion.test.mjs`

Expected: FAIL，原因是 Vue 尚无岗位分页状态和控件。

- [ ] **Step 3: 实现 Vue 分页与卡片内容**

新增 `const aiHotJobPageSize = 6` 和响应式页码；计算总页数及当前页切片。卡片显示岗位名、`产业链 · 阶段`；`market` 显示“X 条招聘｜Y 家企业｜市场热门岗”，`representative` 只显示“产业代表岗”。重新打开与“重新分析”均设置页码为 1。

- [ ] **Step 4: 添加分页与卡片样式**

保持三列卡片网格，增加两行元信息、类型标签、居中页码控件和禁用状态；第二页只有 2 项时保持从左到右排列。

- [ ] **Step 5: 运行定向测试**

Run: `npm test -- tests/ai-smart-construction-suggestion.test.mjs`

Expected: Vue 分页断言 PASS，静态版同步断言仍失败。

### Task 3: 同步静态 demo

**Files:**
- Modify: `major-construction-platform/index.html`
- Test: `major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: 与 Vue mock 完全一致的 8 项岗位快照和每页 6 条规则。
- Produces: `staticAiHotJobPage`、`staticAiHotJobPageSize`、岗位分页 HTML，以及 `data-ai-hot-job-page` 事件入口。

- [ ] **Step 1: 将静态数据替换为同构岗位字段**

确保岗位名称、顺序、产业链、阶段、招聘数、企业数和入选类型与 Vue 逐项一致。

- [ ] **Step 2: 实现静态岗位列表和分页 HTML**

根据 `staticAiHotJobPage` 使用 `slice` 截取 6 项；代表岗只渲染产业链、阶段和“产业代表岗”。在岗位卡片区域下方渲染上一页、页码和下一页。

- [ ] **Step 3: 实现静态翻页事件**

点击 `data-ai-hot-job-page` 后更新页码并仅替换岗位列表区域；打开、关闭再打开和重新分析均从第 1 页开始。

- [ ] **Step 4: 运行定向测试**

Run: `npm test -- tests/ai-smart-construction-suggestion.test.mjs`

Expected: PASS。

### Task 4: 更新需求文档并完成验证

**Files:**
- Modify: `major-construction-platform/docs/superpowers/specs/2026-08-04-hot-job-analysis-modal-design.md`
- Verify: `major-construction-platform/src/App.vue`
- Verify: `major-construction-platform/index.html`

**Interfaces:**
- Consumes: 已实现的 8 项 demo 数据和交互行为。
- Produces: 可追溯的数据快照说明、实际入选表和验收记录。

- [ ] **Step 1: 更新需求文档中的人工智能产业链试算结果**

记录数据口径：240,034 条输入招聘记录、239,149 条有效去重招聘记录、人工智能产业链 10 条确认关系和 8 个不同岗位；列出 8 个岗位及其阶段、招聘数量、企业数量和入选类型，明确产业代表岗不显示样本不足。

- [ ] **Step 2: 运行文档和代码静态检查**

Run: `git diff --check`

Expected: 无空白错误。

- [ ] **Step 3: 运行定向测试和完整测试**

Run: `npm test -- tests/ai-smart-construction-suggestion.test.mjs`

Run: `npm test`

Expected: 全部 PASS。

- [ ] **Step 4: 运行生产构建**

Run: `npm run build`

Expected: Vue 类型检查和 Vite 生产构建成功。

- [ ] **Step 5: 检查最终差异**

确认只包含热门岗位 mock、Vue/静态交互、样式、测试、实施计划和需求规格的相关修改，且未纳入 `outputs/ai-chain-hot-jobs-experiment/` 等既有未跟踪文件。
