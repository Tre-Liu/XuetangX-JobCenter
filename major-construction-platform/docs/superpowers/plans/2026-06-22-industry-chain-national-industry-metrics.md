# Industry Chain National Industry Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GB/T 4754 national industry classification metrics to the "产业链图谱" module.

**Architecture:** Keep the existing industry chain graph as the primary surface. Add a small typed mock data export from `src/mock/job-research.ts`, render it in the existing `产业链结构图谱` card in `src/App.vue`, and style the new blocks in `src/styles/20-talent.css`.

**Tech Stack:** Vue 3 composition API, TypeScript, static `node --test` assertions, Vite build.

## Global Constraints

- Classification basis is GB/T 4754 national economic industry classification.
- Implement only: 关联行业总数、上中下游行业分布、代表企业行业覆盖、行业增长信号.
- Do not add live crawling or external data calls.
- Do not redesign the whole industry research page.
- Do not change the existing treemap/sankey switch.
- Use demo mock values with clear relative meaning and no real-time-statistics claims.
- Follow existing `20-talent.css` style: compact operational layout, 8px radius, restrained blue/teal/warm accents.

---

### Task 1: Add National Industry Metrics Mock Data

**Files:**
- Modify: `major-construction-platform/src/mock/job-research.ts`
- Test: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Produces: `NATIONAL_INDUSTRY_CHAIN_METRICS` with:
  - `summaryMetrics: Array<{ label: string; value: string; note: string }>`
  - `stageDistributions: Record<'upstream' | 'midstream' | 'downstream', { label: string; industries: string[] }>`
  - `enterpriseCoverage: Array<{ industry: string; division: string; share: number; enterpriseCount: number; samples: string[] }>`
  - `growthSignals: Array<{ industry: string; recruitmentHeat: string; policyHeat: string; enterpriseActivity: string; interpretation: string }>`
- Consumes: no new runtime dependencies.

- [ ] **Step 1: Write the failing test**

Add this fixture read near the other top-level file reads in `major-construction-platform/tests/industry-research-management.test.mjs`:

```js
const jobResearchMock = await readFile(new URL('../src/mock/job-research.ts', import.meta.url), 'utf8')
```

Then add this test to the same file:

```js
test('industry chain national industry metrics mock follows GB/T 4754 display contract', () => {
  assert.match(jobResearchMock, /export const NATIONAL_INDUSTRY_CHAIN_METRICS/)
  assert.match(jobResearchMock, /关联国标行业/)
  assert.match(jobResearchMock, /覆盖门类/)
  assert.match(jobResearchMock, /核心关联行业/)
  assert.match(jobResearchMock, /增长行业/)
  assert.match(jobResearchMock, /E 建筑业/)
  assert.match(jobResearchMock, /I 信息传输、软件和信息技术服务业/)
  assert.match(jobResearchMock, /C 制造业/)
  assert.match(jobResearchMock, /N 水利、环境和公共设施管理业/)
  assert.match(jobResearchMock, /recruitmentHeat/)
  assert.match(jobResearchMock, /policyHeat/)
  assert.match(jobResearchMock, /enterpriseActivity/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/industry-research-management.test.mjs`

Expected: FAIL containing `NATIONAL_INDUSTRY_CHAIN_METRICS`.

- [ ] **Step 3: Add the mock data export**

Append this data near the other industry research exports in `src/mock/job-research.ts`:

```ts
export const NATIONAL_INDUSTRY_CHAIN_METRICS = {
  summaryMetrics: [
    { label: '关联国标行业', value: '12个', note: '覆盖门类、大类与关键中类' },
    { label: '覆盖门类', value: '5类', note: '建筑业、制造业、信息服务等' },
    { label: '核心关联行业', value: '建筑业 / 软件和信息技术服务业', note: '岗位与企业样本最集中' },
    { label: '增长行业', value: '专业技术服务业、专用设备制造业', note: '招聘、政策和企业活跃度较高' }
  ],
  stageDistributions: {
    upstream: {
      label: '上游覆盖行业',
      industries: ['C 制造业', 'I 信息传输、软件和信息技术服务业', 'M 科学研究和技术服务业']
    },
    midstream: {
      label: '中游覆盖行业',
      industries: ['E 建筑业', 'I 信息传输、软件和信息技术服务业', 'M 科学研究和技术服务业']
    },
    downstream: {
      label: '下游覆盖行业',
      industries: ['E 建筑业', 'N 水利、环境和公共设施管理业', 'M 科学研究和技术服务业']
    }
  },
  enterpriseCoverage: [
    { industry: 'E 建筑业', division: '47 房屋建筑业 / 48 土木工程建筑业', share: 42, enterpriseCount: 394, samples: ['中国建筑', '中建八局东北公司'] },
    { industry: 'I 信息传输、软件和信息技术服务业', division: '65 软件和信息技术服务业', share: 28, enterpriseCount: 263, samples: ['广联达', '品茗科技'] },
    { industry: 'C 制造业', division: '35 专用设备制造业 / 30 非金属矿物制品业', share: 18, enterpriseCount: 169, samples: ['沈阳远大智能工业', '中建科技'] },
    { industry: 'M 科学研究和技术服务业', division: '74 专业技术服务业', share: 12, enterpriseCount: 113, samples: ['盈建科/构力科技', '南方测绘'] }
  ],
  growthSignals: [
    { industry: '65 软件和信息技术服务业', recruitmentHeat: '高', policyHeat: '高', enterpriseActivity: '高', interpretation: 'BIM协同、智慧工地平台和工程数据治理岗位持续扩展。' },
    { industry: '74 专业技术服务业', recruitmentHeat: '中高', policyHeat: '高', enterpriseActivity: '中高', interpretation: '工程测绘、检测监测、设计咨询与数字化交付需求增强。' },
    { industry: '35 专用设备制造业', recruitmentHeat: '中高', policyHeat: '中高', enterpriseActivity: '中', interpretation: '建筑机器人、智能测量装备和构件生产设备带动复合型岗位。' },
    { industry: '47 房屋建筑业 / 48 土木工程建筑业', recruitmentHeat: '高', policyHeat: '高', enterpriseActivity: '高', interpretation: '智能施工、装配式建造和质量安全监管仍是产业链落地的主场景。' }
  ]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/industry-research-management.test.mjs`

Expected: PASS for the new test and existing tests.

- [ ] **Step 5: Commit**

```bash
git add major-construction-platform/src/mock/job-research.ts major-construction-platform/tests/industry-research-management.test.mjs
git commit -m "Add national industry chain metrics data"
```

### Task 2: Render Metrics In The Industry Chain Graph

**Files:**
- Modify: `major-construction-platform/src/App.vue`
- Test: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: `NATIONAL_INDUSTRY_CHAIN_METRICS` from `./mock/job-research`.
- Produces: visible template blocks:
  - `.industry-national-kpis`
  - `.industry-stage-national-tags`
  - `.industry-national-analysis`
  - `.industry-national-growth`

- [ ] **Step 1: Write the failing test**

This task reuses `jobResearchMock` from Task 1. Add this test to `major-construction-platform/tests/industry-research-management.test.mjs`:

```js
test('industry chain graph renders national industry metrics in the Vue page', () => {
  assert.match(appVue, /NATIONAL_INDUSTRY_CHAIN_METRICS/)
  assert.match(appVue, /class="industry-national-kpis"/)
  assert.match(appVue, /v-for="metric in NATIONAL_INDUSTRY_CHAIN_METRICS\.summaryMetrics"/)
  assert.match(appVue, /formatIndustryStageNationalIndustries\(stage\.key\)/)
  assert.match(appVue, /国标行业关联分析/)
  assert.match(appVue, /代表企业行业覆盖/)
  assert.match(appVue, /行业增长信号/)
  assert.match(appVue, /v-for="item in NATIONAL_INDUSTRY_CHAIN_METRICS\.enterpriseCoverage"/)
  assert.match(appVue, /v-for="item in NATIONAL_INDUSTRY_CHAIN_METRICS\.growthSignals"/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/industry-research-management.test.mjs`

Expected: FAIL containing `industry-national-kpis` or `NATIONAL_INDUSTRY_CHAIN_METRICS`.

- [ ] **Step 3: Import data and add helper**

In `src/App.vue`, extend the existing import from `./mock/job-research`:

```ts
  NATIONAL_INDUSTRY_CHAIN_METRICS,
```

Add this helper near the industry chain computed helpers:

```ts
const formatIndustryStageNationalIndustries = (stageKey: string) =>
  NATIONAL_INDUSTRY_CHAIN_METRICS.stageDistributions[
    stageKey as keyof typeof NATIONAL_INDUSTRY_CHAIN_METRICS.stageDistributions
  ]?.industries.join(' / ') ?? ''
```

- [ ] **Step 4: Render KPI strip and stage labels**

Inside the `产业链结构图谱` card, after the card header and before the treemap/sankey boards, add:

```vue
<div class="industry-national-kpis">
  <article v-for="metric in NATIONAL_INDUSTRY_CHAIN_METRICS.summaryMetrics" :key="metric.label">
    <span>{{ metric.label }}</span>
    <strong>{{ metric.value }}</strong>
    <em>{{ metric.note }}</em>
  </article>
</div>
```

Inside each treemap stage header, after `<strong>{{ stage.stats }}</strong>`, add:

```vue
<p class="industry-stage-national-tags">
  {{ formatIndustryStageNationalIndustries(stage.key) }}
</p>
```

- [ ] **Step 5: Render enterprise coverage and growth signals**

After the treemap/sankey board and before `industry-chain-info-grid`, add:

```vue
<section class="industry-national-analysis">
  <div class="industry-national-analysis-head">
    <h4>国标行业关联分析</h4>
    <span>按 GB/T 4754 展示代表企业覆盖与行业增长信号</span>
  </div>
  <div class="industry-national-columns">
    <section>
      <h5>代表企业行业覆盖</h5>
      <article
        v-for="item in NATIONAL_INDUSTRY_CHAIN_METRICS.enterpriseCoverage"
        :key="item.industry"
        class="industry-national-coverage-row"
      >
        <div>
          <strong>{{ item.industry }}</strong>
          <span>{{ item.division }}</span>
        </div>
        <div class="industry-national-bar" :style="{ '--industry-share': `${item.share}%` }">
          <i></i>
        </div>
        <em>{{ item.share }}% / {{ item.enterpriseCount }}家</em>
        <p>{{ item.samples.join('、') }}</p>
      </article>
    </section>
    <section class="industry-national-growth">
      <h5>行业增长信号</h5>
      <article v-for="item in NATIONAL_INDUSTRY_CHAIN_METRICS.growthSignals" :key="item.industry">
        <strong>{{ item.industry }}</strong>
        <div>
          <span>招聘热度 {{ item.recruitmentHeat }}</span>
          <span>政策热度 {{ item.policyHeat }}</span>
          <span>企业活跃度 {{ item.enterpriseActivity }}</span>
        </div>
        <p>{{ item.interpretation }}</p>
      </article>
    </section>
  </div>
</section>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- tests/industry-research-management.test.mjs`

Expected: PASS for the new test and existing tests.

- [ ] **Step 7: Commit**

```bash
git add major-construction-platform/src/App.vue major-construction-platform/tests/industry-research-management.test.mjs
git commit -m "Render national industry metrics in chain graph"
```

### Task 3: Style And Verify The New Industry Metrics

**Files:**
- Modify: `major-construction-platform/src/styles/20-talent.css`
- Test: `major-construction-platform/tests/industry-research-management.test.mjs`

**Interfaces:**
- Consumes: classes from Task 2.
- Produces: compact responsive styles for KPI, distribution, coverage, and signal blocks.

- [ ] **Step 1: Write the failing style test**

Add this test to `major-construction-platform/tests/industry-research-management.test.mjs`:

```js
test('national industry metrics have compact responsive styles', () => {
  assert.match(stylesCss, /\.industry-national-kpis\s*\{/)
  assert.match(stylesCss, /\.industry-national-analysis\s*\{/)
  assert.match(stylesCss, /\.industry-national-columns\s*\{/)
  assert.match(stylesCss, /\.industry-national-coverage-row\s*\{/)
  assert.match(stylesCss, /\.industry-national-bar i\s*\{/)
  assert.match(stylesCss, /width:\s*var\(--industry-share\);/)
  assert.match(stylesCss, /\.industry-national-growth article\s*\{/)
  assert.match(stylesCss, /@media \(max-width: 1180px\)[\s\S]*\.industry-national-columns/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/industry-research-management.test.mjs`

Expected: FAIL containing `.industry-national-kpis`.

- [ ] **Step 3: Add CSS**

Add this block near the existing industry treemap styles in `src/styles/20-talent.css`:

```css
.industry-national-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 12px 24px 0;
}

.industry-national-kpis article {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #e2eaf8;
  border-radius: 8px;
  background: #f8fbff;
}

.industry-national-kpis span,
.industry-national-kpis em {
  display: block;
  color: #728198;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  line-height: 1.45;
}

.industry-national-kpis strong {
  display: block;
  margin: 4px 0;
  color: #223554;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.3;
}

.industry-stage-national-tags {
  grid-column: 1 / -1;
  margin: 0;
  color: #5f6f8a;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.industry-national-analysis {
  margin: 0 24px 16px;
  padding: 16px;
  border: 1px solid #e2eaf8;
  border-radius: 8px;
  background: #fbfdff;
}

.industry-national-analysis-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.industry-national-analysis-head h4,
.industry-national-columns h5 {
  margin: 0;
  color: #223554;
  font-size: 15px;
  font-weight: 900;
}

.industry-national-analysis-head span {
  color: #728198;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.industry-national-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 14px;
}

.industry-national-columns > section {
  min-width: 0;
}

.industry-national-coverage-row,
.industry-national-growth article {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #e6edf8;
  border-radius: 8px;
  background: #ffffff;
}

.industry-national-coverage-row strong,
.industry-national-growth strong {
  display: block;
  color: #253856;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.4;
}

.industry-national-coverage-row span,
.industry-national-coverage-row em,
.industry-national-coverage-row p,
.industry-national-growth span,
.industry-national-growth p {
  color: #728198;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  line-height: 1.45;
}

.industry-national-bar {
  height: 7px;
  overflow: hidden;
  margin: 9px 0 6px;
  border-radius: 999px;
  background: #edf3fb;
}

.industry-national-bar i {
  display: block;
  width: var(--industry-share);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #326fff, #20bfb8);
}

.industry-national-growth div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.industry-national-growth span {
  padding: 3px 7px;
  border-radius: 5px;
  background: #edf3fb;
}
```

Add this responsive rule near the existing responsive industry chain rules:

```css
@media (max-width: 1180px) {
  .industry-national-kpis,
  .industry-national-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .industry-national-kpis,
  .industry-national-columns {
    grid-template-columns: minmax(0, 1fr);
  }

  .industry-national-analysis-head {
    flex-direction: column;
  }
}
```

- [ ] **Step 4: Run targeted tests**

Run: `npm test -- tests/industry-research-management.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build`

Expected: build exits 0. Pre-existing Vite warnings about non-module scripts or large chunks may still appear and should be reported as warnings, not failures.

- [ ] **Step 6: Commit**

```bash
git add major-construction-platform/src/styles/20-talent.css major-construction-platform/tests/industry-research-management.test.mjs
git commit -m "Style national industry metrics"
```
