# 人工智能去重企业数据详情弹窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 恢复人工智能产业链“去重企业”KPI 的 Figma 数据详情弹窗，并保持 Vue 与静态入口一致。

**Architecture:** 将现有国标 KPI 弹窗的数据结构抽象为统一的 `selectedIndustryMetricDialog` 展示对象。AI 卡片只负责生成真实数据详情并打开同一模态模板；静态入口以相同对象契约调用现有 `appendStaticDialog`，继续复用焦点恢复、遮罩关闭、Escape 和焦点陷阱逻辑。

**Tech Stack:** Vue 3、TypeScript、原生 HTML/CSS/JavaScript、Node.js `node:test`、Vite。

## Global Constraints

- 只为“去重企业”新增详情交互，其余三张 AI KPI 保持只读。
- 数字必须读取 `companyCount`、`sourceReportedCount`、`sourceMembershipCount` 和 `pendingCompanyCount`，不得硬编码。
- 继续使用现有 `industry-national-detail-dialog` Figma 视觉结构。
- Vue 与 `file://.../index.html` 静态入口同时实现。
- 保留用户当前对 `src/styles/20-talent.css` 和 `tests/industry-research-figma-ui.test.mjs` 的未提交改动。
- 不修改人工智能产业链源数据、企业库筛选和图谱布局。

---

## File Map

- Modify: `tests/industry-research-figma-ui.test.mjs` — 锁定双入口触发器、真实字段、弹窗文案和按钮样式。
- Modify: `src/App.vue` — 生成统一弹窗展示对象，增加 AI 打开状态和触发按钮。
- Modify: `index.html` — 生成静态 AI 详情对象，复用现有模态渲染和事件委托。
- Modify: `src/styles/20-talent.css` — 为 KPI 按钮补充浏览器重置、指针与“查看详情”提示样式。

### Task 1: 锁定双入口弹窗契约

**Files:**
- Modify: `tests/industry-research-figma-ui.test.mjs`
- Test: `tests/industry-research-figma-ui.test.mjs`

**Interfaces:**
- Consumes: `src/App.vue`、`index.html` 和 `src/styles/20-talent.css` 源码文本。
- Produces: `openAiCompanyMetricDialog`、`data-static-ai-company-metric`、`selectedIndustryMetricDialog` 与 `.ai-company-metric-trigger` 契约。

- [ ] **Step 1: 写入失败测试**

增加一个测试，要求两个入口都存在去重企业按钮、真实统计字段和 Figma 弹窗内容：

```js
test('AI deduplicated company KPI opens the shared Figma detail dialog in both entries', () => {
  assert.match(appVue, /class="industry-figma-kpi-card ai-company-metric-trigger"/)
  assert.match(appVue, /@click="openAiCompanyMetricDialog\(\$event\)"/)
  assert.match(appVue, /selectedIndustryMetricDialog/)
  assert.match(appVue, /sourceReportedCount/)
  assert.match(appVue, /sourceMembershipCount/)
  assert.match(appVue, /pendingCompanyCount/)

  assert.match(staticHtml, /data-static-ai-company-metric="deduplicated-companies"/)
  assert.match(staticHtml, /showStaticAiCompanyMetricDialog/)
  assert.match(staticHtml, /sourceReportedCount/)
  assert.match(staticHtml, /sourceMembershipCount/)
  assert.match(staticHtml, /pendingCompanyCount/)

  for (const source of [appVue, staticHtml]) {
    assert.match(source, /跨来源企业去重口径/)
    assert.match(source, /数据来源/)
    assert.match(source, /人工智能/)
    assert.match(source, /智能视觉/)
    assert.match(source, /智能语音识别/)
  }
  assert.match(styleBlock('.ai-company-metric-trigger'), /cursor:\s*pointer/)
})
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `node --test tests/industry-research-figma-ui.test.mjs`

Expected: FAIL，报告缺少 `ai-company-metric-trigger` 或 `openAiCompanyMetricDialog`。

### Task 2: 实现 Vue 统一弹窗

**Files:**
- Modify: `src/App.vue`
- Test: `tests/industry-research-figma-ui.test.mjs`

**Interfaces:**
- Consumes: `aiIndustryChainData: ShallowRef<AiIndustryChainData | null>` 和现有 `selectedNationalIndustryMetric`。
- Produces: `selectedIndustryMetricDialog` 统一对象及 `openAiCompanyMetricDialog(event?: Event): void`。

- [ ] **Step 1: 增加 AI 打开状态和统一展示对象**

在国标指标状态附近增加 `aiCompanyMetricDialogOpen`，并将普通与 AI 详情映射为统一对象：

```ts
const aiCompanyMetricDialogOpen = ref(false)
const aiCompanyMetricDialog = computed(() => {
  const data = aiIndustryChainData.value
  if (!data) return null
  return {
    label: '去重企业',
    subtitle: '跨来源企业去重口径',
    note: '完整企业库',
    value: formatAiIndustryCount(data.meta.companyCount),
    detail: {
      summary: '合并人工智能、智能视觉和智能语音识别三类来源后形成的唯一企业样本。',
      basis: '同一企业可关联多个来源、产业阶段与细分节点；企业数量按统一身份去重，来源关系量不等同于企业资产量。',
      dimensions: [
        { label: '来源标称样本', value: formatAiIndustryCount(data.meta.sourceReportedCount) },
        { label: '可解析来源关系', value: formatAiIndustryCount(data.meta.sourceMembershipCount) },
        { label: '待映射企业', value: formatAiIndustryCount(data.quality.pendingCompanyCount) },
      ],
      tagsTitle: '数据来源',
      tags: ['人工智能', '智能视觉', '智能语音识别'],
      action: '用于专业产业对接、合作企业筛选和岗位需求研判；建议结合产业阶段、细分节点与区域分布进一步筛选。',
    },
  }
})
```

普通国标指标映射相同结构，`subtitle` 为“GB/T 4754 行业分类”，`tagsTitle` 为“关联行业”。

- [ ] **Step 2: 补齐打开与关闭状态**

```ts
const openAiCompanyMetricDialog = (event?: Event) => {
  if (!aiCompanyMetricDialog.value) return
  aiCompanyMetricDialogOpen.value = true
  nationalIndustryMetricTrigger.value = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null
}
const closeNationalIndustryMetricDialog = () => {
  selectedNationalIndustryMetricLabel.value = ''
  aiCompanyMetricDialogOpen.value = false
  requestAnimationFrame(() => nationalIndustryMetricTrigger.value?.focus())
}
```

打开普通国标指标时同步把 `aiCompanyMetricDialogOpen` 设为 `false`。

- [ ] **Step 3: 将 AI 卡片和模态模板接入统一对象**

将“去重企业”改为：

```vue
<button
  type="button"
  class="industry-figma-kpi-card ai-company-metric-trigger"
  aria-label="查看去重企业详情"
  @click="openAiCompanyMetricDialog($event)"
>
  <span>去重企业</span>
  <strong>{{ formatAiIndustryCount(aiIndustryChainData.meta.companyCount) }}</strong>
  <em>完整企业库</em>
  <i>查看详情</i>
</button>
```

模态模板改读 `selectedIndustryMetricDialog`，标题下方读取 `subtitle`，标签标题读取 `detail.tagsTitle`，标签循环读取 `detail.tags`。

- [ ] **Step 4: 运行测试确认 Vue 尚未覆盖静态入口与按钮样式**

Run: `node --test tests/industry-research-figma-ui.test.mjs`

Expected: FAIL 仅剩静态入口和 `.ai-company-metric-trigger` 样式相关断言。

### Task 3: 实现静态入口弹窗

**Files:**
- Modify: `index.html`
- Test: `tests/industry-research-figma-ui.test.mjs`

**Interfaces:**
- Consumes: `staticAiIndustryChainData` 和 `appendStaticDialog(html)`。
- Produces: `staticAiCompanyMetricDetail(data)`、`showStaticAiCompanyMetricDialog()` 和 `data-static-ai-company-metric`。

- [ ] **Step 1: 泛化静态弹窗渲染函数**

使 `staticNationalIndustryMetricDialogHtml(metric)` 读取：

```js
const subtitle = metric.subtitle || 'GB/T 4754 行业分类'
const tagsTitle = detail.tagsTitle || '关联行业'
const tags = detail.tags || detail.industries || []
```

模板标题、标签标题和标签列表改用这些字段。

- [ ] **Step 2: 生成 AI 真实详情对象并打开**

```js
const staticAiCompanyMetricDetail = (data) => ({
  label: '去重企业',
  subtitle: '跨来源企业去重口径',
  note: '完整企业库',
  value: staticAiIndustryFormatCount(data.meta.companyCount),
  detail: {
    summary: '合并人工智能、智能视觉和智能语音识别三类来源后形成的唯一企业样本。',
    basis: '同一企业可关联多个来源、产业阶段与细分节点；企业数量按统一身份去重，来源关系量不等同于企业资产量。',
    dimensions: [
      { label: '来源标称样本', value: staticAiIndustryFormatCount(data.meta.sourceReportedCount) },
      { label: '可解析来源关系', value: staticAiIndustryFormatCount(data.meta.sourceMembershipCount) },
      { label: '待映射企业', value: staticAiIndustryFormatCount(data.quality.pendingCompanyCount) },
    ],
    tagsTitle: '数据来源',
    tags: ['人工智能', '智能视觉', '智能语音识别'],
    action: '用于专业产业对接、合作企业筛选和岗位需求研判；建议结合产业阶段、细分节点与区域分布进一步筛选。',
  },
})
const showStaticAiCompanyMetricDialog = () => {
  if (!staticAiIndustryChainData) return
  appendStaticDialog(staticNationalIndustryMetricDialogHtml(staticAiCompanyMetricDetail(staticAiIndustryChainData)))
}
```

- [ ] **Step 3: 将静态卡片与事件委托接入**

把“去重企业”输出为带 `data-static-ai-company-metric="deduplicated-companies"` 的按钮；点击分支调用 `showStaticAiCompanyMetricDialog()`。

- [ ] **Step 4: 运行测试确认静态实现 GREEN**

Run: `node --test tests/industry-research-figma-ui.test.mjs`

Expected: FAIL 仅剩 `.ai-company-metric-trigger` 样式相关断言。

### Task 4: 对齐按钮样式并做完整验证

**Files:**
- Modify: `src/styles/20-talent.css`
- Test: `tests/industry-research-figma-ui.test.mjs`

**Interfaces:**
- Consumes: `.industry-figma-kpi-card` 现有 Figma 卡片样式。
- Produces: `.ai-company-metric-trigger` 原生按钮重置和可点击态。

- [ ] **Step 1: 增加最小样式**

```css
.ai-company-metric-trigger {
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.ai-company-metric-trigger i {
  display: inline-flex;
  margin-top: 8px;
  color: #2d68df;
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}
```

- [ ] **Step 2: 运行定向测试**

Run: `node --test tests/industry-research-figma-ui.test.mjs tests/industry-research-management.test.mjs tests/ai-industry-chain-dual-entry.test.mjs`

Expected: 全部 PASS。

- [ ] **Step 3: 运行类型、全量测试和构建**

Run: `./node_modules/.bin/vue-tsc -b`

Expected: exit 0。

Run: `npm test`

Expected: 0 failures。

Run: `npm run build`

Expected: exit 0；允许已有的外部脚本和 chunk-size 非阻塞告警。

- [ ] **Step 4: 浏览器视觉与交互验证**

在 `index.html?tab=chain&view=job-industry` 打开人工智能产业链，点击“去重企业”，核对弹窗标题、遮罩、尺寸、摘要卡、三张统计卡、来源标签和专业建设提示。分别验证关闭按钮、遮罩、Escape 和关闭后焦点恢复，并保存最终截图。

- [ ] **Step 5: 复核差异**

Run: `git diff --check && git diff --stat`

Expected: 无空白错误；差异只包含计划中的测试、Vue、静态入口和 CSS，以及用户进入任务前已有的两处改动。
