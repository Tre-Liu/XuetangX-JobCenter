# 岗位全链条字段详情 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让汇报视图红框内的任务、当前任务、K/A/Q、职业和口径说明均可查看带来源预览与汇总流程的字段详情。

**Architecture:** 继续使用单文件离线 HTML。生成脚本内增加结构化字段追溯数据和一个可复用的字段详情抽屉；任务选择与详情查看采用独立交互，动态渲染的 K/A/Q 项携带稳定字段键。来源预览使用纯 HTML/CSS 仿真 Excel 行和 PDF 页缩略图，避免外部资源。

**Tech Stack:** Node.js ESM、原生 HTML/CSS/JavaScript、node:test。

**Spec:** 用户于 2026-08-20 确认的“红框内全部字段都可查看详情”设计。

## Global Constraints

- 输出必须仍是可通过 `file://` 直接打开的单个离线 HTML。
- 不展示无可靠依据的匹配度百分比。
- 直接证据、规则关联、教学标准候选必须明确区分。
- 任务卡点击继续切换任务；“查看详情”使用独立按钮。
- 每个详情至少包含当前值、来源预览、汇总/计算流程、证据边界。

---

### Task 1: 固化字段详情交互契约

**Files:**
- Modify: `tests/job-occupation-task-er.test.mjs`
- Modify: `scripts/build_job_occupation_task_er.mjs`

**Interfaces:**
- Consumes: 现有 `robotTaskData` 与任务选择交互。
- Produces: `data-field-detail` 触发器、`#robot-field-drawer`、`openRobotFieldDetail(fieldKey)`。

- [ ] **Step 1: Write the failing test**

新增构建后行为契约，要求任务详情按钮、K/A/Q 条目、职业卡和口径说明均有字段键，并存在可复用详情抽屉。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/job-occupation-task-er.test.mjs`
Expected: FAIL，缺少 `robot-field-drawer` 或字段详情触发器。

- [ ] **Step 3: Write minimal implementation**

在生成脚本中为静态字段增加触发器，为动态 K/A/Q 渲染稳定字段键，并增加字段抽屉的打开、关闭、焦点恢复和 Escape 处理。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/job-occupation-task-er.test.mjs`
Expected: PASS。

### Task 2: 增加图文来源预览与汇总流程

**Files:**
- Modify: `tests/job-occupation-task-er.test.mjs`
- Modify: `scripts/build_job_occupation_task_er.mjs`
- Generate: `output/job-occupation-task-er/job_occupation_task_er.html`

**Interfaces:**
- Consumes: `openRobotFieldDetail(fieldKey)`。
- Produces: `robotFieldDetailData`、来源缩略图、四步汇总流程、计算口径与证据边界。

- [ ] **Step 1: Write the failing test**

要求输出包含 Excel/PDF 两种来源预览、原始数据到展示结果的四步流程、精确工作表行号/页码以及无百分比的计算口径。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/job-occupation-task-er.test.mjs`
Expected: FAIL，缺少来源预览或流程图结构。

- [ ] **Step 3: Write minimal implementation**

为任务、当前任务、K/A/Q、职业和口径说明配置追溯数据；使用 HTML/CSS 生成 Excel 行预览、PDF 页缩略图、箭头流程和结果卡。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/job-occupation-task-er.test.mjs`
Expected: PASS。

- [ ] **Step 5: Generate the standalone artifact**

Run: `node scripts/build_job_occupation_task_er.mjs`
Expected: 更新 `output/job-occupation-task-er/job_occupation_task_er.html`。

### Task 3: 浏览器验收

**Files:**
- Verify: `output/job-occupation-task-er/job_occupation_task_er.html`

**Interfaces:**
- Consumes: 生成后的离线 HTML。
- Produces: 桌面与窄屏可见性、任务切换、各类型详情和关闭交互的验收结果。

- [ ] **Step 1: Run the complete automated suite**

Run: `node --test tests/job-occupation-task-er.test.mjs`
Expected: 全部 PASS。

- [ ] **Step 2: Open the local HTML in the browser**

确认页面无横向溢出，红框内各类字段都有“详情”提示。

- [ ] **Step 3: Exercise representative interactions**

依次检查任务详情、知识条目、职业卡、口径说明；确认来源缩略图和四步流程随字段变化，任务切换仍正常。

- [ ] **Step 4: Check narrow viewport and console**

确认抽屉在窄屏变为全宽，无控制台错误。
