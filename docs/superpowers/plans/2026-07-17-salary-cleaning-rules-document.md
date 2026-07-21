# 岗位/JD 薪资清洗规范精简 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有薪资清洗规范压缩为 180～220 行，并统一薪资展示格式为 `8k - 15k`。

**Architecture:** 直接重写现有 Markdown 文件，保留业务决策和开发必需字段，删除重复解释、监控指标、版本管理等扩展内容。最终文档只保留 7 个章节。

**Tech Stack:** Markdown、UTF-8、`rg`、`wc`。

## Global Constraints

- 标准薪资展示格式必须为 `8k - 15k`。
- 不得出现大写 `K`、`/月` 或“参考薪资：”前缀。
- 数据计算口径仍为元/月，只改变页面展示文本。
- 日薪、时薪、实习和兼职薪资不进入正式月薪池。
- 上下限倒挂不自动交换。
- 无有效月薪样本显示“暂无薪资数据”。
- 岗位下限取有效 JD 起薪的 P25，上限取有效 JD 上限的 P75。

---

### Task 1: 重写精简版规范

**Files:**
- Modify: `outputs/salary-cleaning-rules/岗位_JD薪资清洗规范.md`

**Interfaces:**
- Consumes: 当前 V1.0 规则、用户确认的 `8k - 15k` 展示格式。
- Produces: 7 章、180～220 行的独立规范。

- [ ] **Step 1: 保留七个核心章节**

保留目标与原则、必要字段、JD 清洗、岗位聚合与展示、质量状态、问题案例、回归与验收。

- [ ] **Step 2: 删除扩展内容**

删除重复说明、长流程图、监控指标、告警原则、版本管理和非必要实现细节。

- [ ] **Step 3: 统一展示格式**

所有正常薪资示例使用 `8k - 15k`；异常历史案例保留原错误格式，并明确其仅用于问题说明。

### Task 2: 验证精简结果

**Files:**
- Verify: `outputs/salary-cleaning-rules/岗位_JD薪资清洗规范.md`

**Interfaces:**
- Consumes: Task 1 的精简文档。
- Produces: 篇幅、章节和展示格式检查结果。

- [ ] **Step 1: 检查篇幅**

Run: `wc -l outputs/salary-cleaning-rules/岗位_JD薪资清洗规范.md`

Expected: 行数不超过 220。

- [ ] **Step 2: 检查章节**

Run: `rg -n '^## ' outputs/salary-cleaning-rules/岗位_JD薪资清洗规范.md`

Expected: 只输出 7 个编号章节。

- [ ] **Step 3: 检查核心规则**

Run: `rg -n 'P25|P75|invalid_reversed_bound|non_monthly_salary|暂无薪资数据|8k - 15k' outputs/salary-cleaning-rules/岗位_JD薪资清洗规范.md`

Expected: 每个核心口径至少出现一次。

- [ ] **Step 4: 检查展示冲突**

Run: `rg -n '[0-9]K|/月|参考薪资：' outputs/salary-cleaning-rules/岗位_JD薪资清洗规范.md`

Expected: 只允许在“历史错误案例”或“禁止格式”中出现，并明确标识为错误。
