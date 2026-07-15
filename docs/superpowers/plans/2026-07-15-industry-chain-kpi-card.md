# 产业链推荐卡片 KPI 改造实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将产业链推荐卡片的规则标签替换为产业环节、岗位数和企业数三个稳定演示 KPI，并同步到 Vue 与两个静态入口。

**Architecture:** 在共享推荐视图模型中增加 `jobCount` 和 `enterpriseCount`，通过产业链 ID 获取固定演示 KPI；人工智能产业链使用明确值，其余产业链使用稳定兜底算法。静态入口复制同一套演示口径，卡片只改变标签区，不改变匹配依据、关系说明和交互。

**Tech Stack:** Vue 3、TypeScript、原生 JavaScript 静态入口、Node.js test runner、Vite、OpenAI Sites。

## Global Constraints

- 岗位数和企业数是演示数据，不声明为实时统计数据。
- 人工智能产业链必须显示 `128` 个岗位和 `37,626` 家企业。
- 卡片标签区只显示产业环节、包含岗位数、包含企业数。
- 匹配依据、关系说明、搜索、多选、分页和滚动行为保持不变。
- `src/App.vue`、`industry-research-admin.html`、`outputs/industry-research-admin.html` 必须同步。

---

### Task 1: 建立 KPI 卡片回归测试

**Files:**
- Modify: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: 当前 Vue、共享推荐构建器和两个静态 HTML 源码。
- Produces: 对新 KPI 文案、人工智能演示值、旧标签移除和双静态入口同步的回归约束。

- [ ] **Step 1: 写入失败测试**

将原有“Vue relation cards show workbook fields”测试改为：

```js
test('industry chain cards show stable demo KPI fields', () => {
  for (const field of ['产业环节', '包含岗位数', '包含企业数', '匹配依据', '关系说明']) {
    assert.match(appVue, new RegExp(field))
  }
  for (const removedField of ['阶段：{{ chain.stage }}', '置信度：{{ chain.confidence }}', '规则得分：{{ chain.score }}']) {
    assert.doesNotMatch(appVue, new RegExp(removedField.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(industryResearchData, /'chain-75155ff272':\s*\{\s*jobCount:\s*128,\s*enterpriseCount:\s*37626\s*\}/)

  for (const [label, source] of [
    ['outputs static html', localHtml],
    ['root static html', rootLocalHtml],
  ]) {
    for (const field of ['产业环节', '包含岗位数', '包含企业数', '匹配依据', '关系说明']) {
      assert.match(source, new RegExp(field), `${label} should render ${field}`)
    }
    assert.match(source, /chain-75155ff272[^\n]*jobCount:\s*128[^\n]*enterpriseCount:\s*37626/, `${label} should use the AI demo KPI values`)
    assert.doesNotMatch(source, /阶段：\$\{chain\.stage\}/, `${label} should hide the stage tag`)
    assert.doesNotMatch(source, /置信度：\$\{chain\.confidence\}/, `${label} should hide the confidence tag`)
    assert.doesNotMatch(source, /规则得分：\$\{chain\.score\}/, `${label} should hide the score tag`)
  }
})
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: FAIL，提示缺少“包含岗位数”或人工智能 KPI 配置。

### Task 2: 扩展共享推荐数据并更新 Vue 卡片

**Files:**
- Modify: `major-construction-platform/src/app/industry-research-management.ts`
- Modify: `major-construction-platform/src/App.vue`
- Test: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: `IndustryMajorChainRelation.chainId`。
- Produces: `getIndustryResearchDemoKpis(chainId): { jobCount: number; enterpriseCount: number }` 和带有两个 KPI 字段的 `IndustryResearchChainRecommendation`。

- [ ] **Step 1: 增加稳定演示 KPI 构建逻辑**

在 `industry-research-management.ts` 中加入：

```ts
type IndustryResearchDemoKpis = {
  jobCount: number
  enterpriseCount: number
}

const industryResearchDemoKpisByChainId: Record<string, IndustryResearchDemoKpis> = {
  'chain-75155ff272': { jobCount: 128, enterpriseCount: 37626 },
}

const stableIndustryResearchSeed = (value: string) =>
  Array.from(value).reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 0)

export const getIndustryResearchDemoKpis = (chainId: string): IndustryResearchDemoKpis => {
  const configured = industryResearchDemoKpisByChainId[chainId]
  if (configured) return configured
  const seed = stableIndustryResearchSeed(chainId)
  return {
    jobCount: 48 + (seed % 121),
    enterpriseCount: 1200 + (seed % 48000),
  }
}
```

将 `jobCount`、`enterpriseCount` 加入推荐类型，并在 `buildIndustryResearchRecommendations` 中展开 `...getIndustryResearchDemoKpis(relation.chainId)`。

- [ ] **Step 2: 替换 Vue 标签区**

将 `src/App.vue` 的标签区改为：

```vue
<div class="industry-chain-tags">
  <span>产业环节：{{ chain.node }}</span>
  <span>包含岗位数：{{ chain.jobCount.toLocaleString('zh-CN') }}</span>
  <span>包含企业数：{{ chain.enterpriseCount.toLocaleString('zh-CN') }}</span>
</div>
```

保留下面的匹配依据和关系说明。

- [ ] **Step 3: 运行目标测试观察剩余静态入口失败**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: Vue 与共享数据断言通过，静态入口 KPI 断言仍失败。

### Task 3: 同步两个静态入口

**Files:**
- Modify: `major-construction-platform/industry-research-admin.html`
- Modify: `major-construction-platform/outputs/industry-research-admin.html`
- Test: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: 静态入口中的 `relation.chainId`。
- Produces: 带 `jobCount`、`enterpriseCount` 的 `activeChains` 及新 KPI 标签 HTML。

- [ ] **Step 1: 增加静态 KPI 配置和稳定兜底**

在静态脚本中加入与 Vue 相同口径的配置：

```js
const industryResearchDemoKpisByChainId = {
  'chain-75155ff272': { jobCount: 128, enterpriseCount: 37626 }
};
const getIndustryResearchDemoKpis = (chainId) => {
  const configured = industryResearchDemoKpisByChainId[chainId];
  if (configured) return configured;
  const seed = Array.from(chainId).reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 0);
  return { jobCount: 48 + (seed % 121), enterpriseCount: 1200 + (seed % 48000) };
};
```

在 `getIndustryMajorProfile` 的 relation 映射中展开 `...getIndustryResearchDemoKpis(relation.chainId)`。

- [ ] **Step 2: 替换静态标签 HTML**

```html
<p>产业环节：${chain.node} · 包含岗位数：${chain.jobCount.toLocaleString('zh-CN')} · 包含企业数：${chain.enterpriseCount.toLocaleString('zh-CN')}</p>
<em>匹配依据：${chain.evidence}</em>
<em>关系说明：${chain.description}</em>
```

- [ ] **Step 3: 保持两个静态文件完全一致**

Run: `cp industry-research-admin.html outputs/industry-research-admin.html`

Expected: `cmp -s industry-research-admin.html outputs/industry-research-admin.html` exit code `0`。

- [ ] **Step 4: 运行目标测试并确认 GREEN**

Run: `node --test tests/industry-research-management.test.mjs`

Expected: 全部通过。

- [ ] **Step 5: 提交功能改动**

```bash
git add src/app/industry-research-management.ts src/App.vue industry-research-admin.html outputs/industry-research-admin.html tests/industry-research-management.test.mjs
git commit -m "feat: show industry chain KPI data"
```

### Task 4: 全量验证、发布和线上验收

**Files:**
- Verify: `major-construction-platform/dist/client/`
- Verify: `major-construction-platform/dist/server/index.js`
- Verify: `.openai/hosting.json`

**Interfaces:**
- Consumes: 已提交的功能版本和现有 Sites 项目绑定。
- Produces: 通过测试的构建归档、正式站点新版本和浏览器验收证据。

- [ ] **Step 1: 运行全量测试与构建**

Run: `npm test && npm run build`

Expected: 所有测试通过，Vite 构建成功并生成 `dist/client` 与 `dist/server/index.js`。

- [ ] **Step 2: 本地浏览器验收**

在产业调研管理页面选择 `510209 人工智能技术应用`，确认人工智能产业链卡片显示“产业环节、包含岗位数 128、包含企业数 37,626”，不显示旧三个标签；同时验证选择按钮和页面滚动。

- [ ] **Step 3: 打包并发布现有 Sites 项目**

使用现有 `.openai/hosting.json` 的 `project_id` 打包 `major-construction-platform`，推送 Sites 专用源码归档，保存新版本并部署。

- [ ] **Step 4: 轮询部署并在线验收**

等待部署状态为 `succeeded`，打开正式 URL 重新执行 KPI 文案、选择交互、滚动和控制台错误检查。
