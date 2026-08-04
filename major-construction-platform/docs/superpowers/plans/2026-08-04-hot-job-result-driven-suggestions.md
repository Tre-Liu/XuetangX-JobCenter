# 热门岗位结果驱动建议 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让热门岗位分析在无人培方案时继续生成三类岗位侧建议，以真实结果明细计算统计，并把每岗五项真实能力简化为可滚动的名称与描述列表，同时将 AI 提示词拆入钉钉需求文档对应模块。

**Architecture:** 数据层保留可追溯的标准岗位能力对象，并由纯函数根据三类建议数组生成概览统计；Vue 与静态 `index.html` 分别消费同一口径。人才培养方案状态只控制三个比对模块和岗位侧建议提示，不再隐藏新增建议。钉钉文档以模块专属提示词替代集中式完整提示词作为实现依据。

**Tech Stack:** Vue 3、TypeScript、Vite、Node.js test runner、静态 HTML 文件模式、钉钉文档编辑器。

## Global Constraints

- 市场热门岗与产业代表岗的入选、排序、补足、产业映射和分页规则不得改变。
- 三项建议统计必须由当前结果数组长度计算，不使用 AI 单独返回的统计值或页面常量。
- 无人才培养方案时，培养目标、毕业要求、课程三个比对模块保持空状态，三个新增建议模块继续展示岗位侧通用建议。
- 当前八个岗位各使用数据库标准岗位的五条职责拆解出五项能力。
- 页面能力区域只显示能力名称与能力描述，不显示能力类型、典型工作任务、能力来源或单项展开按钮。
- 提示词只写入钉钉需求文档，不在 Demo 页面展示。
- Vue 页面与 `index.html` 文件模式保持行为一致。
- 不修改或删除仓库中用户已有的未跟踪目录。

---

## File Structure

- `src/app/ai-hot-jobs.ts`：新增建议统计的纯函数和返回类型。
- `src/mock/decision-center.ts`：移除固定建议统计值，为八个岗位补齐第五项真实能力。
- `src/App.vue`：消费动态统计，简化能力卡，调整无人培方案分支。
- `src/styles/90-decision.css`：能力列表内部滚动与岗位侧通用建议提示样式。
- `index.html`：镜像数据、统计、能力列表和无人培状态。
- `tests/ai-smart-construction-suggestion.test.mjs`：保护统计口径、每岗五项能力和双态展示合同。
- 钉钉《热门岗位分析建议》：把十个 AI 文本模块的提示词放入对应功能章节，并调整无人培方案验收规则。

### Task 1: 结果驱动统计与五项真实能力数据

**Files:**
- Modify: `src/app/ai-hot-jobs.ts`
- Modify: `src/mock/decision-center.ts`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: `AiHotJobAnalysisAdvice.newGoalSuggestions`、`graduationRequirementSuggestions`、`courseSuggestions`。
- Produces: `getAiHotJobSuggestionMetrics(input): AiHotJobSuggestionMetric[]`，供 Vue 概览统计使用。
- Produces: 每个 `AiHotJob.abilities` 恰好五项的当前人工智能产业链 Demo 数据。

- [ ] **Step 1: 写入统计与能力数据的失败测试**

在 `tests/ai-smart-construction-suggestion.test.mjs` 增加：

```js
test('hot-job suggestion metrics are derived from returned result rows', async () => {
  const { getAiHotJobSuggestionMetrics } = await import('../src/app/ai-hot-jobs.ts')

  const metrics = getAiHotJobSuggestionMetrics({
    newGoalSuggestions: [{}, {}, {}],
    graduationRequirementSuggestions: [{}, {}, {}, {}],
    courseSuggestions: [{}, {}, {}, {}, {}],
  })

  assert.deepEqual(metrics, [
    { value: '3项', label: '培养目标建议调整' },
    { value: '4项', label: '毕业要求建议调整' },
    { value: '5门', label: '建议新增或强化课程' },
  ])
})
```

把岗位能力断言从 `job.abilities.length >= 3` 改为：

```js
assert.equal(job.abilities.length, 5)
```

并断言 `aiHotJobAnalysisAdvice` 不再声明固定 `metrics` 数据。

- [ ] **Step 2: 运行测试并确认按预期失败**

Run:

```bash
node --test --test-name-pattern="hot-job suggestion metrics|hot jobs expose confirmed" tests/ai-smart-construction-suggestion.test.mjs
```

Expected: FAIL，原因分别为 `getAiHotJobSuggestionMetrics is not a function`、现有岗位能力数为 4。

- [ ] **Step 3: 实现纯统计函数**

在 `src/app/ai-hot-jobs.ts` 增加：

```ts
export type AiHotJobSuggestionMetricInput = {
  newGoalSuggestions: readonly unknown[]
  graduationRequirementSuggestions: readonly unknown[]
  courseSuggestions: readonly unknown[]
}

export type AiHotJobSuggestionMetric = {
  value: string
  label: string
}

export const getAiHotJobSuggestionMetrics = (
  input: AiHotJobSuggestionMetricInput,
): AiHotJobSuggestionMetric[] => [
  { value: `${input.newGoalSuggestions.length}项`, label: '培养目标建议调整' },
  { value: `${input.graduationRequirementSuggestions.length}项`, label: '毕业要求建议调整' },
  { value: `${input.courseSuggestions.length}门`, label: '建议新增或强化课程' },
]
```

- [ ] **Step 4: 补齐八个岗位的第五项能力**

在 `src/mock/decision-center.ts` 根据标准岗位第五条职责增加以下能力：

```text
算法工程师：技术文档与知识沉淀
机器视觉工程师：前沿视觉技术研究
机器学习工程师：实验文档与经验沉淀
自然语言处理：团队技术指导
深度学习工程师：技术文档与知识交流
语音识别工程师：语音系统集成协同
智能驾驶工程师：智能驾驶技术创新
智能驾驶测试工程师：测试技术跟踪与方法引入
```

每项继续保留唯一 `id`、`type`、`description`、`tasks` 和 `source` 作为内部追溯数据；删除 `AiHotJobAnalysisAdvice.metrics` 类型字段和对象中的固定统计数组。

- [ ] **Step 5: 运行聚焦测试并确认通过**

Run:

```bash
node --test --test-name-pattern="hot-job suggestion metrics|hot jobs expose confirmed" tests/ai-smart-construction-suggestion.test.mjs
```

Expected: 相关测试全部 PASS，返回指标为 3 项、4 项、5 门，每岗五项能力。

- [ ] **Step 6: 提交数据与统计函数**

```bash
git add major-construction-platform/src/app/ai-hot-jobs.ts major-construction-platform/src/mock/decision-center.ts major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: derive hot job suggestion metrics"
```

### Task 2: Vue 能力滚动与无人培岗位侧建议

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles/90-decision.css`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: `getAiHotJobSuggestionMetrics(activeAiAnalysis)`。
- Consumes: `AiHotJob.abilities[].name` 与 `description`。
- Produces: `aiHotJobSuggestionMetrics` computed 统计，以及 `ai-analysis-job-only-notice` 无方案提示。

- [ ] **Step 1: 写入 Vue 行为的失败测试**

修改 Vue 相关测试，要求：

```js
assert.match(appVue, /getAiHotJobSuggestionMetrics\(activeAiAnalysis\.value\)/)
assert.match(appVue, /v-for="metric in aiHotJobSuggestionMetrics"/)
assert.match(appVue, /class="ai-analysis-ability-description"/)
assert.match(appVue, /当前未导入人才培养方案，以下为基于岗位需求生成的通用建议/)
assert.match(appVue, /v-if="!aiTalentPlanAvailable" class="ai-analysis-job-only-notice"/)
```

能力详情区域内断言不再出现 `toggleAiJobAbility`、`典型工作任务` 和 `能力来源`。无人培测试只要求三个比对模块的内容受 `aiTalentPlanAvailable` 控制，三个新增建议列表不得受该条件隐藏。

样式测试要求：

```js
assert.match(stylesCss, /\.ai-analysis-ability-list\s*\{[\s\S]*max-height:[\s\S]*overflow-y:\s*auto;/)
assert.match(stylesCss, /\.ai-analysis-job-only-notice\s*\{/)
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run:

```bash
node --test --test-name-pattern="expandable job abilities|no-talent-plan|suggestion metrics" tests/ai-smart-construction-suggestion.test.mjs
```

Expected: FAIL，现有 Vue 仍使用固定 `metrics.slice(1)`、能力展开按钮，并在无方案时隐藏新增建议。

- [ ] **Step 3: 实现 Vue 动态统计**

在 `src/App.vue` 导入 `getAiHotJobSuggestionMetrics` 并增加：

```ts
const aiHotJobSuggestionMetrics = computed(() =>
  activeAiAnalysis.value ? getAiHotJobSuggestionMetrics(activeAiAnalysis.value) : []
)
```

把概览统计循环改为：

```vue
<article v-for="metric in aiHotJobSuggestionMetrics" :key="metric.label">
  <strong>{{ metric.value }}</strong>
  <span>{{ metric.label }}</span>
</article>
```

- [ ] **Step 4: 简化能力卡并增加内部滚动**

移除 `expandedAiJobAbilityIds` 状态、`toggleAiJobAbility` 函数及单项能力按钮，能力列表改为：

```vue
<div v-if="job.abilities.length" class="ai-analysis-ability-list" tabindex="0" :aria-label="`${job.name}能力列表`">
  <article v-for="ability in job.abilities" :key="`${job.name}-${ability.id}`" class="ai-analysis-ability-item">
    <strong>{{ ability.name }}</strong>
    <p class="ai-analysis-ability-description">{{ ability.description || '暂无能力描述' }}</p>
  </article>
</div>
```

在 `src/styles/90-decision.css` 为 `.ai-analysis-ability-list` 设置固定 `max-height`、`overflow-y: auto`、滚动条留白和键盘聚焦态，删除只服务于展开详情的样式。

- [ ] **Step 5: 调整无人培方案分支**

三个比对模块继续使用现有空状态。三个新增建议模块始终渲染建议列表，并在列表前增加：

```vue
<div v-if="!aiTalentPlanAvailable" class="ai-analysis-job-only-notice" role="status">
  当前未导入人才培养方案，以下为基于岗位需求生成的通用建议。请先上传人才培养方案，以获得结合现状差距的针对性建议。
</div>
```

该提示分别放在新增目标建议、新增毕业要求建议、新增课程建议中。

- [ ] **Step 6: 运行聚焦测试并确认通过**

Run:

```bash
node --test --test-name-pattern="expandable job abilities|no-talent-plan|suggestion metrics" tests/ai-smart-construction-suggestion.test.mjs
```

Expected: 相关测试 PASS；Vue 不再使用固定建议统计或单项能力展开状态。

- [ ] **Step 7: 提交 Vue 行为**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/src/styles/90-decision.css major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: refine hot job plan-free suggestions"
```

### Task 3: 静态文件模式一致性

**Files:**
- Modify: `index.html`
- Test: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Produces: `staticAiSuggestionMetrics(advice)`，返回与 Vue 相同的 3/4/5 结果口径。
- Produces: 静态能力滚动列表和无人培三类通用建议提示。

- [ ] **Step 1: 写入静态入口的失败测试**

增加：

```js
assert.match(staticHtml, /const staticAiSuggestionMetrics = \(advice\) =>/)
assert.match(staticHtml, /advice\.newGoalSuggestions\.length/)
assert.match(staticHtml, /advice\.graduationRequirementSuggestions\.length/)
assert.match(staticHtml, /advice\.courseSuggestions\.length/)
assert.match(staticHtml, /ai-analysis-ability-description/)
assert.match(staticHtml, /ai-analysis-job-only-notice/)
```

并要求静态热门岗位分析数据段不再包含固定 `{ value: '5项'`、`{ value: '7项'`、`{ value: '10门'`。

- [ ] **Step 2: 运行测试并确认按预期失败**

Run:

```bash
node --test --test-name-pattern="static hot-job parity" tests/ai-smart-construction-suggestion.test.mjs
```

Expected: FAIL，静态入口仍使用固定统计、四项能力和展开详情。

- [ ] **Step 3: 镜像五项能力与结果统计**

在 `index.html` 的 `staticAiHotJobAbilities` 为八个岗位加入 Task 1 的第五项能力，并删除固定 `metrics` 数组。增加：

```js
const staticAiSuggestionMetrics = (advice) => [
  { value: `${advice.newGoalSuggestions.length}项`, label: '培养目标建议调整' },
  { value: `${advice.graduationRequirementSuggestions.length}项`, label: '毕业要求建议调整' },
  { value: `${advice.courseSuggestions.length}门`, label: '建议新增或强化课程' },
]
```

- [ ] **Step 4: 镜像能力与无人培渲染**

静态能力 HTML 只生成能力名称与 `description`，不生成类型、任务、来源或 `data-ai-job-ability-id`。三个新增建议区域始终渲染明细，无方案时在每个区域前输出与 Vue 完全相同的 `ai-analysis-job-only-notice` 文案；三个比对区域继续输出导入提示。

- [ ] **Step 5: 运行静态入口测试并确认通过**

Run:

```bash
node --test --test-name-pattern="static hot-job parity" tests/ai-smart-construction-suggestion.test.mjs
```

Expected: PASS。

- [ ] **Step 6: 提交静态入口**

```bash
git add major-construction-platform/index.html major-construction-platform/tests/ai-smart-construction-suggestion.test.mjs
git commit -m "feat: mirror result-driven hot job analysis"
```

### Task 4: 将提示词融入钉钉功能模块

**Files:**
- Modify externally: 钉钉《热门岗位分析建议》

**Interfaces:**
- Consumes: 当前文档第 7 章页面内容、第 8 章状态与兜底、第 10 至 11 章 AI 规则与完整提示词、第 12 章验收标准。
- Produces: 十个模块专属提示词，以及与新无人培状态和动态统计一致的验收规则。

- [ ] **Step 1: 更新页面规则与状态规则**

在对应原章节内完成以下修改，不新增脱离正文的补充章节：

```text
三项建议统计分别取新增目标建议、新增毕业要求建议和新增课程建议的实际返回条数；不得单独生成或写死统计值。

无人才培养方案时，培养目标对比分析、毕业要求比对分析和课程支撑度明细显示导入提示；新增目标建议、新增毕业要求建议和新增课程建议继续基于岗位需求生成通用建议，并提示用户上传人才培养方案后可获得针对性建议。

岗位能力卡只展示能力名称和能力描述；每岗展示数据库标准岗位职责拆解出的全部能力，当前人工智能产业链 Demo 每岗五项，列表在岗位卡范围内滚动。
```

- [ ] **Step 2: 在十个 AI 模块下写入专属提示词**

分别写入以下实际提示词，方括号字段为运行时输入字段：

1. **热门岗位分析摘要**：`根据[产业链名称]、[入选岗位及产业环节]、[招聘企业数量]、[招聘数量]和[岗位能力]概括主要岗位方向、产业分布和共性能力。不得改变确定性排序，不得补充输入中不存在的岗位、企业或数值。输出1段120字以内摘要。`
2. **专业分析概览—培养目标**：`根据[岗位能力]和[当前培养目标]概括培养目标已覆盖方向与需要关注的岗位能力。没有培养目标时，只描述岗位侧培养方向并明确无法判断现有覆盖情况。输出1段100字以内结论。`
3. **专业分析概览—毕业要求**：`根据[岗位知识技能素养]和[当前毕业要求及指标点]概括覆盖情况与需关注方向。没有毕业要求时，只描述岗位侧能力要求并明确无法判断现有覆盖情况。输出1段100字以内结论。`
4. **专业分析概览—课程体系**：`根据[岗位能力]、[当前课程]和[课程支撑关系]概括课程支撑情况与需加强方向。没有课程数据时，只描述岗位侧课程建设方向并明确无法判断现有支撑情况。输出1段100字以内结论。`
5. **培养目标对比分析**：`逐条比较[当前培养目标]与[入选岗位能力]，输出目标编号、现有表述、对应岗位能力、覆盖判断和判断依据。缺少培养目标时停止比对并返回“没有人才培养方案数据，请先导入人才培养方案”。不得虚构目标原文。`
6. **新增目标建议**：`根据[入选岗位]、[产业环节]、[岗位能力]生成培养目标建议，输出标题、建议表述、对应岗位和理由。有培养目标时先去重并仅输出新增或需调整内容；无培养目标时输出岗位侧通用建议，声明无法判断现有方案是否已覆盖，禁止使用“现有目标不足”等比较性结论。`
7. **毕业要求比对分析**：`逐条比较[当前毕业要求及指标点]与[岗位知识技能素养]，输出要求编号、能力对应关系、覆盖判断和证据。缺少毕业要求时停止比对并返回“没有人才培养方案数据，请先导入人才培养方案”。不得改写输入中的毕业要求原文。`
8. **新增毕业要求建议**：`根据[入选岗位]和[岗位知识技能素养]生成可评价的毕业要求建议，输出标题、建议表述、可观测行为、对应岗位和理由。有毕业要求时避免重复；无毕业要求时输出岗位侧通用建议，声明无法判断现有覆盖情况，禁止声称现有要求缺失。`
9. **课程建设分析结论**：`根据[岗位能力]、[课程清单]和[课程支撑关系]总结主要支撑方向与建设关注点。课程支撑度数值只能使用输入中的真实计算结果，不得由模型估算。缺少课程数据时只输出岗位侧课程方向并明确无法进行支撑度判断。`
10. **新增课程建议**：`根据[入选岗位]、[岗位能力]、[现有课程]和[课程支撑关系]生成课程建议，输出课程名称、主要内容、对应岗位能力、课程形态和理由。有课程数据时先判断新增或强化；无课程数据时输出岗位侧通用课程建议，声明无法判断现有课程是否已覆盖，禁止使用虚构支撑度。`

- [ ] **Step 3: 调整集中式提示词章节**

将原“十一、完整提示词”改为“十一、AI 生成通用规则”，保留角色、事实边界、缺失数据、禁止虚构和输出安全等跨模块规则；删除与十个模块重复的集中式生成任务，明确模块专属任务以第 7 章对应提示词为准。

- [ ] **Step 4: 更新验收标准**

新增并核对：统计与明细一致、无人培三类建议仍展示、三个比对模块为空、每岗五项能力可滚动、能力仅展示名称与描述、十个 AI 模块均有专属提示词、确定性模块没有 AI 提示词。

- [ ] **Step 5: 逐章节检索并确认钉钉已保存**

在文档编辑器中滚动扫描全文，确认十个模块提示词各出现一次，新无人培提示和统计口径出现于对应章节，页面顶部显示“已保存”。

### Task 5: 全量验证与交付

**Files:**
- Verify: `src/app/ai-hot-jobs.ts`
- Verify: `src/mock/decision-center.ts`
- Verify: `src/App.vue`
- Verify: `src/styles/90-decision.css`
- Verify: `index.html`
- Verify: `tests/ai-smart-construction-suggestion.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–4 的全部交付。
- Produces: 可从 Vue 服务模式和 `file://` 静态模式演示的最终结果。

- [ ] **Step 1: 运行热门岗位聚焦测试**

```bash
node --test tests/ai-smart-construction-suggestion.test.mjs
```

Expected: 该文件全部 PASS。

- [ ] **Step 2: 运行全量测试**

```bash
npm test
```

Expected: 全部测试 PASS，失败数为 0。

- [ ] **Step 3: 运行生产构建**

```bash
npm run build
```

Expected: Vue TypeScript 检查、客户端构建和服务端构建全部成功；允许保留项目既有的非 module script 与 chunk size 警告。

- [ ] **Step 4: 启动 Demo 并进行浏览器验证**

```bash
npm run dev
```

检查：

1. 顶部三个数字为当前明细实际的 3 项、4 项、5 门。
2. 八个岗位各展示五项能力，单个岗位卡能独立滚动。
3. 能力项只展示名称和描述。
4. 无方案时三个比对模块显示导入提示，三个新增建议模块仍展示建议与岗位侧通用提示。
5. 切回有方案后岗位侧通用提示消失，建议明细保留。
6. 热门岗位第 1、2 页分页和产业环节保持不变。
7. 关闭再打开浮窗恢复默认已有人培方案状态。

- [ ] **Step 5: 核对工作区并提交最终修正**

```bash
git status --short
git diff --check
git add major-construction-platform
git commit -m "feat: complete result-driven hot job suggestions"
```

只提交本计划涉及的文件；保留用户原有未跟踪目录不变。
