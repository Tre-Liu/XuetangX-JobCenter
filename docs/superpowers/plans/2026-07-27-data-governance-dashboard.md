# 专业建设数据治理驾驶舱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建一个独立 Vue 工程，通过可重复的数据刷新脚本统计六类专业建设数据资产，并以“总量 + 已清洗量/覆盖率”的数据治理驾驶舱展示当前成果、质量状态和来源。

**Architecture:** Node 刷新脚本从工作区中的 CSV、Excel 和招聘清单 JSON 读取已清洗产物，完成结构校验、指标计算和一致性校验后，原子写入有版本的静态 JSON 快照。Vue 3 前端只消费该快照，使用原生 SVG/CSS 渲染指标卡、覆盖率图、招聘漏斗、来源表和详情抽屉，不在浏览器中读取大型源文件。

**Tech Stack:** Vue 3.5、TypeScript 5.8、Vite 6、Node.js 24 内置测试运行器、Vitest 3、Vue Test Utils 2、jsdom 26、`xlsx` 0.18、原生 SVG/CSS

## Global Constraints

- 工程固定创建在仓库根目录的 `data-governance-dashboard/`，拥有独立 `package.json` 和 `index.html`。
- 不修改现有 Excel、CSV、JSON、Parquet、数据库或现有前端工程。
- 不建设后端服务；浏览器只读取 `src/data/dashboard-snapshot.json`。
- 不把产业链、环节、专业、行业、岗位、关系和招聘记录跨粒度求和。
- 不引入 ECharts 或其他图表框架；图表使用原生 SVG 和 CSS。
- 招聘清单优先读取 `outputs/recruitment_position_matching/v1/manifests`，仅在该目录不存在时使用 `.worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1/manifests`，禁止合并两个目录。
- 当前招聘数据必须显示“2014—2016 当前批次”和“跑批进行中”，禁止描述为 2014—2025 全量完成。
- 刷新失败时不得覆盖上一份有效快照。
- 所有新功能遵循 RED → GREEN → REFACTOR；每个生产行为必须先出现能正确失败的测试。
- 数据刷新和纯逻辑使用 Node.js 内置测试运行器；Vue 渲染与交互使用 Vitest + Vue Test Utils + jsdom，禁止用读取源码文本或正则匹配 CSS 代替行为测试。
- 根目录 `.superpowers/` 加入 `.gitignore`，浏览器草图不进入产品提交。

---

### Task 1: 建立独立工程骨架和验证入口

**Files:**
- Modify: `.gitignore`
- Create: `data-governance-dashboard/package.json`
- Create: `data-governance-dashboard/index.html`
- Create: `data-governance-dashboard/tsconfig.json`
- Create: `data-governance-dashboard/tsconfig.app.json`
- Create: `data-governance-dashboard/tsconfig.node.json`
- Create: `data-governance-dashboard/vite.config.ts`
- Create: `data-governance-dashboard/vitest.config.ts`
- Create: `data-governance-dashboard/src/main.ts`
- Create: `data-governance-dashboard/src/App.vue`
- Create: `data-governance-dashboard/src/styles.css`
- Create: `data-governance-dashboard/src/data/dashboard-snapshot.json`
- Test: `data-governance-dashboard/tests/project-build.test.mjs`

**Interfaces:**
- Consumes: 仓库根目录和 Node.js 24。
- Produces: 独立的 `npm test`、`npm run test:data`、`npm run test:ui`、`npm run dev`、`npm run build` 命令；后续任务可在 `src/` 和 `scripts/` 内增量实现。

- [ ] **Step 1: 写可构建产物失败测试**

```js
// data-governance-dashboard/tests/project-build.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('standalone dashboard builds a loadable index artifact', async () => {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const html = await readFile(resolve(projectRoot, 'dist/index.html'), 'utf8')
  assert.match(html, /<div id="app"><\/div>/)
  assert.match(html, /assets\/.*\.js/)
})
```

- [ ] **Step 2: 运行测试并确认因工程文件缺失而失败**

Run: `cd data-governance-dashboard && node --test tests/project-build.test.mjs`

Expected: FAIL，`npm run build` 因 `package.json` 尚不存在而返回非零退出码。

- [ ] **Step 3: 创建最小可构建工程**

`package.json` 使用以下脚本和依赖：

```json
{
  "name": "data-governance-dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "test": "npm run test:data && npm run test:ui",
    "test:data": "node --test",
    "test:ui": "vitest run --passWithNoTests",
    "refresh": "node scripts/refresh-data.mjs",
    "refresh:check": "node scripts/refresh-data.mjs --check",
    "build": "vue-tsc -b && vite build",
    "verify": "npm test && npm run refresh:check && npm run build"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "^5.2.4",
    "vite": "^6.3.5",
    "vue": "^3.5.13",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^26.1.0",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4",
    "vue-tsc": "^2.2.10"
  }
}
```

`vitest.config.ts`：

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
```

`App.vue` 先提供可构建标题：

```vue
<template>
  <main class="dashboard-shell">
    <h1>专业建设数据治理驾驶舱</h1>
  </main>
</template>
```

初始快照必须是合法 JSON，且明确没有伪造数据：

```json
{
  "schemaVersion": 1,
  "generatedAt": "1970-01-01T00:00:00.000Z",
  "workspaceRootLabel": "unrefreshed",
  "overallStatus": "error",
  "assets": [],
  "recruitmentPipeline": {
    "inputRows": 0,
    "validUniqueRows": 0,
    "duplicateRows": 0,
    "invalidRows": 0,
    "formallyMatchedJobs": 0,
    "mediumReviewJobs": 0,
    "unmatchedRows": 0,
    "formalRelationCount": 0,
    "completedYears": []
  },
  "sources": [],
  "warnings": ["尚未执行 npm run refresh"]
}
```

在根 `.gitignore` 末尾添加：

```gitignore
.superpowers/
```

- [ ] **Step 4: 安装依赖并验证骨架**

Run: `cd data-governance-dashboard && npm install`

Expected: PASS，生成 `package-lock.json`，无依赖解析错误。

Run: `cd data-governance-dashboard && npm test && npm run build`

Expected: PASS；Vite 生成 `dist/index.html`。

- [ ] **Step 5: 提交工程骨架**

```bash
git add .gitignore data-governance-dashboard
git commit -m "feat: scaffold data governance dashboard"
```

---

### Task 2: 定义快照类型、源登记和只读解析器

**Files:**
- Create: `data-governance-dashboard/src/types/dashboard.ts`
- Create: `data-governance-dashboard/scripts/source-registry.mjs`
- Create: `data-governance-dashboard/scripts/lib/readers.mjs`
- Test: `data-governance-dashboard/tests/source-registry.test.mjs`
- Test: `data-governance-dashboard/tests/readers.test.mjs`

**Interfaces:**
- Consumes: `workspaceRoot: string`、源登记项 `SourceDefinition`。
- Produces:
  - `SOURCE_REGISTRY: readonly SourceDefinition[]`
  - `resolveSource(workspaceRoot, definition): Promise<ResolvedSource>`
  - `resolveAllSources(workspaceRoot, registry): Promise<Record<string, ResolvedSource>>`
  - `readCsvObjects(filePath): Promise<Record<string, string>[]>`
  - `readWorksheetRows(filePath, sheetName): Promise<unknown[][]>`
  - `rowsToObjects(rows, headerRowIndex): Record<string, unknown>[]`
  - `readJson(filePath): Promise<unknown>`
  - 前端 `DashboardSnapshot` 类型。

- [ ] **Step 1: 写登记表和解析器失败测试**

```js
// tests/source-registry.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { SOURCE_REGISTRY } from '../scripts/source-registry.mjs'

test('registry defines every required source with relative candidates', () => {
  assert.deepEqual(
    new Set(SOURCE_REGISTRY.map((source) => source.assetId)),
    new Set(['chains', 'stages', 'majors', 'industries', 'positions', 'recruitment']),
  )
  assert.ok(SOURCE_REGISTRY.every((source) => source.required === true))
  assert.ok(SOURCE_REGISTRY.flatMap((source) => source.candidates).every((path) => !path.startsWith('/')))
})

test('recruitment source keeps stable output ahead of worktree fallback', () => {
  const source = SOURCE_REGISTRY.find((item) => item.id === 'recruitmentManifests')
  assert.deepEqual(source.candidates, [
    'outputs/recruitment_position_matching/v1/manifests',
    '.worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1/manifests',
  ])
})
```

```js
// tests/readers.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import {
  readCsvObjects,
  readWorksheetRows,
  rowsToObjects,
  resolveSource,
  requireColumns,
} from '../scripts/lib/readers.mjs'

test('CSV reader preserves quoted newlines and strips BOM', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-readers-'))
  const path = join(dir, 'sample.csv')
  await writeFile(path, '\ufeffid,name,description\n1,节点A,"第一行\n第二行"\n', 'utf8')
  assert.deepEqual(await readCsvObjects(path), [
    { id: '1', name: '节点A', description: '第一行\n第二行' },
  ])
})

test('worksheet reader and header mapping preserve typed values', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-readers-'))
  const path = join(dir, 'sample.xlsx')
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ['代码', '名称', '数量'],
    ['A01', '农业', 3],
  ]), '数据')
  XLSX.writeFile(book, path)

  const rows = await readWorksheetRows(path, '数据')
  assert.deepEqual(rowsToObjects(rows, 0), [{ 代码: 'A01', 名称: '农业', 数量: 3 }])
})

test('missing required source and changed columns fail explicitly', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-readers-'))
  await assert.rejects(
    resolveSource(dir, { id: 'majorCatalog', candidates: ['missing.xlsx'] }),
    /缺少必需数据源 majorCatalog.*missing\.xlsx/,
  )
  assert.throws(
    () => requireColumns([{ 专业名称: '人工智能' }], ['专业名称', '专业编码'], 'majorCatalog'),
    /majorCatalog 缺少字段: 专业编码/,
  )
})
```

- [ ] **Step 2: 运行测试并确认模块不存在**

Run: `cd data-governance-dashboard && node --test tests/source-registry.test.mjs tests/readers.test.mjs`

Expected: FAIL，错误包含 `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 定义前端快照类型**

`src/types/dashboard.ts` 必须逐字包含设计文档中的 `DashboardSnapshot`、`AssetMetric`、`RecruitmentPipeline` 和 `SourceStatus` 接口；`schemaVersion` 固定为字面量 `1`，资产 ID 联合类型固定为六类数据。

- [ ] **Step 4: 实现源登记表**

`scripts/source-registry.mjs` 导出以下登记项：

```js
export const SOURCE_REGISTRY = Object.freeze([
  {
    id: 'chainStandardization',
    assetId: 'chains',
    kind: 'csv',
    candidates: ['output/industry-chain-standardization/industry_chain_standardization_summary.csv'],
    required: true,
    requiredColumns: ['standard_chain'],
    grain: '标准产业链名称',
  },
  {
    id: 'chainCatalog',
    assetId: 'chains',
    kind: 'xlsx',
    candidates: ['V1.0需求（2026.6.11）/官方数据/中国产业链分类.xlsx'],
    sheet: '产业链-产业',
    required: true,
    requiredColumns: ['产业链'],
    grain: '源产业链名称',
  },
  {
    id: 'stageNodes',
    assetId: 'stages',
    kind: 'csv',
    candidates: ['output/industry-chain-stage-nodes/industry_chain_stage_nodes.csv'],
    required: true,
    requiredColumns: ['node_id', 'standard_chain', 'stage'],
    grain: '标准阶段环节ID',
  },
  {
    id: 'detailedNodes',
    assetId: 'stages',
    kind: 'xlsx',
    candidates: ['V1.0需求（2026.6.11）/官方数据/10个产业链节点汇总.xlsx'],
    sheet: '节点明细',
    required: true,
    requiredColumns: ['产业ID', '产业链名称', '节点编码'],
    grain: '精细产业节点编码',
  },
  {
    id: 'majorCatalog',
    assetId: 'majors',
    kind: 'xlsx',
    candidates: ['V1.0需求（2026.6.11）/官方数据/教育部官方专业目录-高等教育与职业教育-20260612.xlsx'],
    sheet: '全部专业',
    required: true,
    requiredColumns: ['专业名称', '专业编码'],
    grain: '专业编码',
  },
  {
    id: 'majorMatches',
    assetId: 'majors',
    kind: 'xlsx-summary',
    candidates: ['V1.0需求（2026.6.11）/官方数据/专业与产业链产业环节匹配结果.xlsx'],
    sheet: '说明与统计',
    required: true,
    grain: '专业匹配状态',
  },
  {
    id: 'industryCatalog',
    assetId: 'industries',
    kind: 'xlsx',
    candidates: ['V1.0需求（2026.6.11）/官方数据/国民经济行业分类_GBT4754-2017.xlsx'],
    sheet: '国民经济行业分类',
    required: true,
    requiredColumns: ['代码', '名称', '层级'],
    grain: '国民经济行业代码',
  },
  {
    id: 'positionMatches',
    assetId: 'positions',
    kind: 'xlsx-summary',
    candidates: ['V1.0需求（2026.6.11）/官方数据/岗位与产业节点关联表.xlsx'],
    sheet: '说明与统计',
    required: true,
    grain: '岗位编码',
  },
  {
    id: 'recruitmentManifests',
    assetId: 'recruitment',
    kind: 'manifest-directory',
    candidates: [
      'outputs/recruitment_position_matching/v1/manifests',
      '.worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1/manifests',
    ],
    required: true,
    grain: '招聘记录',
  },
])
```

- [ ] **Step 5: 实现解析器和字段校验**

`readers.mjs` 使用 `node:fs/promises` 和 `xlsx`。CSV 通过 `xlsx` 的文本导入路径解析，支持双引号、转义双引号和引号内换行，禁止使用 `split('\n')`：

```js
export async function readCsvObjects(filePath) {
  const text = await readFile(filePath, 'utf8')
  const book = XLSX.read(text.replace(/^\uFEFF/, ''), { type: 'string', raw: true })
  const sheet = book.Sheets[book.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}

export async function readWorksheetRows(filePath, sheetName) {
  const book = XLSX.readFile(filePath, { cellDates: true, raw: true })
  const sheet = book.Sheets[sheetName]
  if (!sheet) throw new Error(`${filePath} 缺少工作表: ${sheetName}`)
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
}

export function rowsToObjects(rows, headerRowIndex = 0) {
  const headers = rows[headerRowIndex].map((value) => String(value ?? '').trim())
  return rows.slice(headerRowIndex + 1)
    .filter((row) => row.some((value) => value !== null && value !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])))
}

export async function resolveSource(workspaceRoot, definition) {
  for (const relativePath of definition.candidates) {
    const absolutePath = resolve(workspaceRoot, relativePath)
    if (await exists(absolutePath)) {
      return { ...definition, relativePath, absolutePath }
    }
  }
  throw new Error(`缺少必需数据源 ${definition.id}: ${definition.candidates.join(' | ')}`)
}

export async function resolveAllSources(workspaceRoot, registry) {
  const entries = await Promise.all(
    registry.map(async (definition) => [
      definition.id,
      await resolveSource(workspaceRoot, definition),
    ]),
  )
  return Object.fromEntries(entries)
}

export function requireColumns(objects, requiredColumns, sourceId) {
  const actual = new Set(Object.keys(objects[0] ?? {}))
  const missing = requiredColumns.filter((column) => !actual.has(column))
  if (missing.length) throw new Error(`${sourceId} 缺少字段: ${missing.join(', ')}`)
}
```

- [ ] **Step 6: 运行测试和全量回归**

Run: `cd data-governance-dashboard && npm test`

Expected: PASS。

- [ ] **Step 7: 提交数据契约和解析器**

```bash
git add data-governance-dashboard
git commit -m "feat: define dashboard source contracts"
```

---

### Task 3: 统计产业链、产业环节和行业

**Files:**
- Create: `data-governance-dashboard/scripts/collectors/static-assets.mjs`
- Test: `data-governance-dashboard/tests/static-assets.test.mjs`

**Interfaces:**
- Consumes:
  - `collectStaticAssets({ workspaceRoot, resolvedSources }): Promise<{ assets, sources }>`
  - 解析器输出的对象行。
- Produces:
  - `assets` 中 ID 为 `chains`、`stages`、`industries` 的三个 `AssetMetric`。
  - 对应的五条 `SourceStatus`。

- [ ] **Step 1: 写三个指标的失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStaticAssetMetrics } from '../scripts/collectors/static-assets.mjs'

test('static metrics deduplicate chains, stage nodes, detailed nodes, and industries', () => {
  const result = buildStaticAssetMetrics({
    standardizedChains: [{ standard_chain: '链A' }, { standard_chain: '链A' }, { standard_chain: '链B' }],
    chainCatalog: [{ 产业链: '链A' }, { 产业链: '链B' }, { 产业链: '链C' }],
    stageNodes: [{ node_id: 'n1' }, { node_id: 'n1' }, { node_id: 'n2' }],
    detailedNodes: [{ 节点编码: 'd1', 产业链名称: '链A' }, { 节点编码: 'd2', 产业链名称: '链A' }],
    industries: [{ 代码: 'A' }, { 代码: '01' }, { 代码: '01' }],
  })

  assert.deepEqual(result.find((item) => item.id === 'chains'), {
    id: 'chains',
    label: '标准产业链',
    primaryValue: 2,
    totalValue: 3,
    coverageRate: 2 / 3,
    status: 'partial',
    definition: '标准化产业链名称数 ÷ 源产业链名称数',
    grain: '产业链名称',
    sourceIds: ['chainStandardization', 'chainCatalog'],
    supportingMetrics: [],
  })
  assert.equal(result.find((item) => item.id === 'stages').primaryValue, 2)
  assert.deepEqual(result.find((item) => item.id === 'stages').supportingMetrics, [
    { label: '10链精细节点', value: 2 },
  ])
  assert.equal(result.find((item) => item.id === 'industries').primaryValue, 2)
  assert.equal(result.find((item) => item.id === 'industries').totalValue, 3)
})

test('stage metric never manufactures a coverage rate across incompatible grains', () => {
  const [stage] = buildStaticAssetMetrics({
    standardizedChains: [],
    chainCatalog: [],
    stageNodes: [{ node_id: 'n1' }],
    detailedNodes: [{ 节点编码: 'd1' }],
    industries: [],
  }).filter((item) => item.id === 'stages')
  assert.equal(stage.coverageRate, undefined)
  assert.equal(stage.totalValue, undefined)
})
```

- [ ] **Step 2: 运行测试并确认 collector 不存在**

Run: `cd data-governance-dashboard && node --test tests/static-assets.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现唯一值、覆盖率和源状态**

```js
const uniqueNonBlank = (rows, key) =>
  new Set(rows.map((row) => String(row[key] ?? '').trim()).filter(Boolean)).size

export function buildStaticAssetMetrics(input) {
  const standardized = uniqueNonBlank(input.standardizedChains, 'standard_chain')
  const chainTotal = uniqueNonBlank(input.chainCatalog, '产业链')
  const stages = uniqueNonBlank(input.stageNodes, 'node_id')
  const details = uniqueNonBlank(input.detailedNodes, '节点编码')
  const industryRows = input.industries.filter((row) => String(row['代码'] ?? '').trim())
  const uniqueIndustries = uniqueNonBlank(industryRows, '代码')

  return [
    {
      id: 'chains',
      label: '标准产业链',
      primaryValue: standardized,
      totalValue: chainTotal,
      coverageRate: standardized / chainTotal,
      status: standardized === chainTotal ? 'validated' : 'partial',
      definition: '标准化产业链名称数 ÷ 源产业链名称数',
      grain: '产业链名称',
      sourceIds: ['chainStandardization', 'chainCatalog'],
      supportingMetrics: [],
    },
    {
      id: 'stages',
      label: '产业环节',
      primaryValue: stages,
      status: 'validated',
      definition: '按 node_id 去重的标准阶段环节',
      grain: '标准阶段环节ID',
      sourceIds: ['stageNodes', 'detailedNodes'],
      supportingMetrics: [{ label: '10链精细节点', value: details }],
    },
    {
      id: 'industries',
      label: '国标行业',
      primaryValue: uniqueIndustries,
      totalValue: industryRows.length,
      coverageRate: uniqueIndustries / industryRows.length,
      status: 'validated',
      definition: '唯一行业代码数 ÷ 有效数据行数',
      grain: '国民经济行业代码',
      sourceIds: ['industryCatalog'],
      supportingMetrics: [{ label: '重复代码行', value: industryRows.length - uniqueIndustries }],
    },
  ]
}
```

`collectStaticAssets` 负责解析真实文件、执行 `requireColumns`、调用上述纯函数，并从 `stat.mtime` 生成 `SourceStatus.modifiedAt`。

- [ ] **Step 4: 运行测试**

Run: `cd data-governance-dashboard && node --test tests/static-assets.test.mjs`

Expected: PASS。

- [ ] **Step 5: 提交静态资产统计**

```bash
git add data-governance-dashboard
git commit -m "feat: count chain stage and industry assets"
```

---

### Task 4: 统计专业和岗位匹配成果

**Files:**
- Create: `data-governance-dashboard/scripts/collectors/matched-assets.mjs`
- Test: `data-governance-dashboard/tests/matched-assets.test.mjs`

**Interfaces:**
- Consumes:
  - `majorCatalogRows: Record<string, unknown>[]`
  - `majorSummaryRows: unknown[][]`
  - `positionSummaryRows: unknown[][]`
- Produces:
  - `buildMatchedAssetMetrics(input): AssetMetric[]`
  - `collectMatchedAssets({ workspaceRoot, resolvedSources }): Promise<{ assets, sources }>`
  - ID 为 `majors`、`positions` 的指标。
  - `readMajorSummary(rows): MajorSummary`
  - `readPositionSummary(rows): PositionSummary`

- [ ] **Step 1: 写中文汇总表解析失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  readMajorSummary,
  readPositionSummary,
  buildMatchedAssetMetrics,
} from '../scripts/collectors/matched-assets.mjs'

test('major summary reads the 合计 row by label rather than fixed coordinates', () => {
  const summary = readMajorSummary([
    ['标题'],
    ['数据范围', '专业数', '有确定关联专业', '多产业链专业', '产业链关系数', '待人工研判', '未匹配', '确定关联专业率'],
    ['合计', 2142, 682, 89, 791, 443, 1017, 682 / 2142],
  ])
  assert.deepEqual(summary, {
    total: 2142,
    matched: 682,
    multiChain: 89,
    relations: 791,
    review: 443,
    unmatched: 1017,
  })
})

test('position summary reads alternating key-value cells', () => {
  const summary = readPositionSummary([
    ['岗位总数', 1356, '已匹配岗位', 645, '未匹配岗位', 711, '关系总数', 706],
    ['产业节点数', 57, '岗位匹配率', 645 / 1356, '高置信关系', 157, '建议复核关系', 175],
  ])
  assert.deepEqual(summary, {
    total: 1356,
    matched: 645,
    unmatched: 711,
    relations: 706,
    stages: 57,
    highConfidence: 157,
    reviewRelations: 175,
  })
})

test('matched metrics use unique major codes and source summary values', () => {
  const [majors, positions] = buildMatchedAssetMetrics({
    majorCatalogRows: [{ 专业编码: 'A' }, { 专业编码: 'A' }, { 专业编码: 'B' }],
    majorSummary: { total: 2, matched: 1, multiChain: 0, relations: 1, review: 0, unmatched: 1 },
    positionSummary: { total: 4, matched: 3, unmatched: 1, relations: 5, stages: 2, highConfidence: 2, reviewRelations: 1 },
  })
  assert.equal(majors.coverageRate, 0.5)
  assert.equal(positions.coverageRate, 0.75)
  assert.deepEqual(positions.supportingMetrics, [
    { label: '岗位—节点关系', value: 5 },
    { label: '高置信关系', value: 2 },
    { label: '建议复核关系', value: 1 },
  ])
})
```

- [ ] **Step 2: 运行测试并确认缺少模块**

Run: `cd data-governance-dashboard && node --test tests/matched-assets.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现按标签解析和指标计算**

`readMajorSummary` 必须先找到以“数据范围”开头的表头行，再找到“合计”行，通过表头名称取值。`readPositionSummary` 必须将每行的偶数索引视为键、相邻奇数索引视为值：

```js
const pairs = (rows) => new Map(
  rows.flatMap((row) =>
    Array.from({ length: Math.floor(row.length / 2) }, (_, index) => [
      String(row[index * 2] ?? '').trim(),
      row[index * 2 + 1],
    ]),
  ).filter(([key]) => key),
)
```

`buildMatchedAssetMetrics` 返回：

```js
{
  id: 'majors',
  label: '专业',
  primaryValue: majorSummary.matched,
  totalValue: catalogTotal,
  coverageRate: majorSummary.matched / catalogTotal,
  status: 'partial',
  definition: '有确定产业链关联的专业数 ÷ 标准专业目录总数',
  grain: '专业编码',
  sourceIds: ['majorCatalog', 'majorMatches'],
  supportingMetrics: [
    { label: '待人工研判', value: majorSummary.review },
    { label: '未匹配', value: majorSummary.unmatched },
    { label: '多产业链专业', value: majorSummary.multiChain },
    { label: '产业链关系', value: majorSummary.relations },
  ],
}
```

岗位指标使用同一结构，`definition` 为“已匹配产业节点岗位数 ÷ 岗位总数”，状态为 `partial`，辅助指标依次为未匹配岗位数、关系数、高置信关系数和建议复核关系数。`collectMatchedAssets` 将两个 Excel 源的相对路径、修改时间、粒度和质量状态映射为 `SourceStatus`。

- [ ] **Step 4: 验证测试**

Run: `cd data-governance-dashboard && node --test tests/matched-assets.test.mjs`

Expected: PASS。

- [ ] **Step 5: 提交专业和岗位统计**

```bash
git add data-governance-dashboard
git commit -m "feat: count matched major and position assets"
```

---

### Task 5: 汇总招聘跑批清单

**Files:**
- Create: `data-governance-dashboard/scripts/collectors/recruitment.mjs`
- Test: `data-governance-dashboard/tests/recruitment.test.mjs`

**Interfaces:**
- Consumes:
  - 已解析的招聘源目录。
  - `year=*/part-*.json` 文件。
- Produces:
  - `collectRecruitment({ workspaceRoot, resolvedSource }): Promise<{ asset, pipeline, sources, warnings }>`
  - `sumRecruitmentManifests(manifests): RecruitmentPipeline`
  - `discoverManifestFiles(directory): Promise<string[]>`

- [ ] **Step 1: 写候选目录、分片汇总和年份失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, writeFile, mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  discoverManifestFiles,
  sumRecruitmentManifests,
} from '../scripts/collectors/recruitment.mjs'

test('manifest discovery includes part files and excludes summary files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'recruitment-manifests-'))
  await mkdir(join(root, 'year=2016'), { recursive: true })
  await writeFile(join(root, 'year=2016', 'part-00000.json'), '{}')
  await writeFile(join(root, 'year=2016-summary.json'), '{}')
  assert.deepEqual(
    (await discoverManifestFiles(root)).map((path) => path.replace(root, '')),
    ['/year=2016/part-00000.json'],
  )
})

test('manifest summation keeps record counts and sorted completed years', () => {
  const pipeline = sumRecruitmentManifests([
    {
      year: 2016,
      counts: {
        source_rows: 10,
        valid_unique_rows: 8,
        duplicate_rows: 1,
        invalid_rows: 1,
        formally_matched_jobs: 2,
        medium_review_jobs: 3,
        unmatched_rows: 3,
        formal_relation_count: 2,
      },
    },
    {
      year: 2014,
      counts: {
        source_rows: 2,
        valid_unique_rows: 2,
        duplicate_rows: 0,
        invalid_rows: 0,
        formally_matched_jobs: 0,
        medium_review_jobs: 1,
        unmatched_rows: 1,
        formal_relation_count: 0,
      },
    },
  ])
  assert.deepEqual(pipeline.completedYears, [2014, 2016])
  assert.equal(pipeline.inputRows, 12)
  assert.equal(pipeline.validUniqueRows, 10)
  assert.equal(pipeline.formallyMatchedJobs, 2)
})

test('invalid negative or missing counts fail with the manifest field', () => {
  assert.throws(
    () => sumRecruitmentManifests([{ year: 2016, counts: { source_rows: -1 } }]),
    /source_rows.*非负整数/,
  )
})
```

- [ ] **Step 2: 运行测试并确认招聘 collector 不存在**

Run: `cd data-governance-dashboard && node --test tests/recruitment.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现文件发现和确定性汇总**

`discoverManifestFiles` 必须：

- 只读取目录名匹配 `year=\d{4}` 的子目录；
- 只读取文件名匹配 `part-*.json` 的文件；
- 按年份、文件名排序；
- 不读取 `*-summary.json`。

`sumRecruitmentManifests` 必须把以下字段逐项求和：

```js
const COUNT_FIELD_MAP = {
  source_rows: 'inputRows',
  valid_unique_rows: 'validUniqueRows',
  duplicate_rows: 'duplicateRows',
  invalid_rows: 'invalidRows',
  formally_matched_jobs: 'formallyMatchedJobs',
  medium_review_jobs: 'mediumReviewJobs',
  unmatched_rows: 'unmatchedRows',
  formal_relation_count: 'formalRelationCount',
}
```

招聘资产结构：

```js
{
  id: 'recruitment',
  label: '招聘信息',
  primaryValue: pipeline.validUniqueRows,
  totalValue: pipeline.inputRows,
  coverageRate: pipeline.validUniqueRows / pipeline.inputRows,
  status: 'in_progress',
  definition: '有效唯一招聘记录数 ÷ 当前已处理输入记录数',
  grain: '招聘记录',
  sourceIds: ['recruitmentManifests'],
  supportingMetrics: [
    { label: '正式匹配招聘', value: pipeline.formallyMatchedJobs },
    { label: '中置信待复核', value: pipeline.mediumReviewJobs },
    { label: '未匹配', value: pipeline.unmatchedRows },
    { label: '当前批次', value: `${firstYear}—${lastYear}` },
  ],
}
```

警告由实际 `completedYears` 与目标年份 2014—2025 的差集生成。当前数据对应的精确文案为：

```text
招聘匹配当前仅发现 2014—2016 完成清单，2017—2025 未计入当前成果。
```

实现 `formatRecruitmentWarning(completedYears, { firstYear: 2014, lastYear: 2025 })`；若没有缺失年份则不产生警告，若缺失年份不连续则按逗号列出。

- [ ] **Step 4: 验证测试**

Run: `cd data-governance-dashboard && node --test tests/recruitment.test.mjs`

Expected: PASS。

- [ ] **Step 5: 提交招聘汇总**

```bash
git add data-governance-dashboard
git commit -m "feat: summarize recruitment processing manifests"
```

---

### Task 6: 组装、校验并原子发布快照

**Files:**
- Create: `data-governance-dashboard/scripts/build-snapshot.mjs`
- Create: `data-governance-dashboard/scripts/refresh-data.mjs`
- Create: `data-governance-dashboard/scripts/lib/atomic-write.mjs`
- Create: `data-governance-dashboard/tests/helpers/snapshot-fixture.mjs`
- Test: `data-governance-dashboard/tests/snapshot-builder.test.mjs`
- Test: `data-governance-dashboard/tests/refresh-cli.test.mjs`
- Modify: `data-governance-dashboard/src/data/dashboard-snapshot.json`

**Interfaces:**
- Consumes: Tasks 2–5 的 collectors。
- Produces:
  - `buildDashboardSnapshot({ workspaceRoot, now }): Promise<DashboardSnapshot>`
  - `validateSnapshot(snapshot): void`
  - `assertCurrentBaseline(snapshot): void`
  - `writeJsonAtomically(outputPath, value): Promise<void>`
  - CLI 参数 `--workspace-root <path>`、`--output <path>`、`--check`。

- [ ] **Step 1: 写一致性与原子写入失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { validateSnapshot } from '../scripts/build-snapshot.mjs'
import { writeJsonAtomically } from '../scripts/lib/atomic-write.mjs'
import { validSnapshotFixture } from './helpers/snapshot-fixture.mjs'

test('snapshot rejects position totals that do not reconcile', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  const position = snapshot.assets.find((asset) => asset.id === 'positions')
  position.primaryValue = 3
  position.totalValue = 5
  position.supportingMetrics = [
    { label: '未匹配岗位', value: 1 },
    { label: '岗位—节点关系', value: 3 },
    { label: '建议复核关系', value: 1 },
  ]
  assert.throws(() => validateSnapshot(snapshot), /已匹配岗位.*未匹配岗位.*岗位总数/)
})

test('snapshot rejects recruitment counts that do not reconcile', () => {
  const snapshot = structuredClone(validSnapshotFixture)
  snapshot.recruitmentPipeline.inputRows = 10
  snapshot.recruitmentPipeline.validUniqueRows = 8
  snapshot.recruitmentPipeline.duplicateRows = 1
  snapshot.recruitmentPipeline.invalidRows = 0
  assert.throws(() => validateSnapshot(snapshot), /有效唯一.*重复.*无效.*输入/)
})

test('atomic writer replaces complete JSON without leaving temp files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-atomic-'))
  const path = join(dir, 'snapshot.json')
  await writeFile(path, '{"old":true}\n')
  await writeJsonAtomically(path, { schemaVersion: 1, value: 42 })
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), { schemaVersion: 1, value: 42 })
})
```

`refresh-cli.test.mjs` 单独验证参数，不启动真实刷新：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { parseArgs } from '../scripts/refresh-data.mjs'

test('CLI accepts explicit workspace, output, and check mode', () => {
  assert.deepEqual(
    parseArgs(['--workspace-root', './fixture', '--output', './out.json', '--check']),
    {
      workspaceRoot: resolve('./fixture'),
      output: resolve('./out.json'),
      check: true,
    },
  )
})

test('CLI rejects unknown and valueless options', () => {
  assert.throws(() => parseArgs(['--unknown']), /未知参数: --unknown/)
  assert.throws(() => parseArgs(['--workspace-root']), /--workspace-root 缺少路径/)
  assert.throws(() => parseArgs(['--output']), /--output 缺少路径/)
})
```

测试夹具独立于产品快照：

```js
// tests/helpers/snapshot-fixture.mjs
const asset = (id, primaryValue, totalValue, supportingMetrics = []) => ({
  id,
  label: id,
  primaryValue,
  ...(totalValue === undefined ? {} : {
    totalValue,
    coverageRate: primaryValue / totalValue,
  }),
  status: id === 'recruitment' ? 'in_progress' : 'partial',
  definition: `${id} test definition`,
  grain: `${id} test grain`,
  sourceIds: [],
  supportingMetrics,
})

export const validSnapshotFixture = {
  schemaVersion: 1,
  generatedAt: '2026-07-27T00:00:00.000Z',
  workspaceRootLabel: 'fixture',
  overallStatus: 'partial',
  assets: [
    asset('chains', 2, 3),
    asset('stages', 1),
    asset('majors', 1, 2),
    asset('industries', 2, 2),
    asset('positions', 3, 4, [
      { label: '未匹配岗位', value: 1 },
      { label: '岗位—节点关系', value: 3 },
      { label: '建议复核关系', value: 1 },
    ]),
    asset('recruitment', 8, 10),
  ],
  recruitmentPipeline: {
    inputRows: 10,
    validUniqueRows: 8,
    duplicateRows: 1,
    invalidRows: 1,
    formallyMatchedJobs: 2,
    mediumReviewJobs: 3,
    unmatchedRows: 3,
    formalRelationCount: 2,
    completedYears: [2014, 2016],
  },
  sources: [],
  warnings: [],
}
```

- [ ] **Step 2: 运行测试并确认组装模块不存在**

Run: `cd data-governance-dashboard && node --test tests/snapshot-builder.test.mjs tests/refresh-cli.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现快照组装和整体状态**

```js
export async function buildDashboardSnapshot({ workspaceRoot, now = new Date() }) {
  const resolvedSources = await resolveAllSources(workspaceRoot, SOURCE_REGISTRY)
  const [staticResult, matchedResult, recruitmentResult] = await Promise.all([
    collectStaticAssets({ workspaceRoot, resolvedSources }),
    collectMatchedAssets({ workspaceRoot, resolvedSources }),
    collectRecruitment({ workspaceRoot, resolvedSource: resolvedSources.recruitmentManifests }),
  ])
  const unsortedAssets = [
    ...staticResult.assets,
    ...matchedResult.assets,
    recruitmentResult.asset,
  ]
  const order = ['chains', 'stages', 'majors', 'industries', 'positions', 'recruitment']
  const assets = order.map((id) => unsortedAssets.find((asset) => asset.id === id))
  const sources = [
    ...staticResult.sources,
    ...matchedResult.sources,
    ...recruitmentResult.sources,
  ]
  const snapshot = {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    workspaceRootLabel: basename(resolve(workspaceRoot)),
    overallStatus: assets.some((asset) => asset.status === 'in_progress' || asset.status === 'partial')
      ? 'partial'
      : 'healthy',
    assets,
    recruitmentPipeline: recruitmentResult.pipeline,
    sources,
    warnings: recruitmentResult.warnings,
  }
  validateSnapshot(snapshot)
  return snapshot
}
```

- [ ] **Step 4: 实现全部一致性校验**

`validateSnapshot` 必须验证：

```js
assert(snapshot.schemaVersion === 1, '未知快照版本')
assert(new Set(snapshot.assets.map(({ id }) => id)).size === 6, '必须包含六类唯一资产')
assert(standardizedChains <= chainTotal, '标准产业链数不得大于源产业链数')
assert(majorMatched <= majorTotal, '确定关联专业不得大于专业总数')
assert(positionMatched + positionUnmatched === positionTotal, '已匹配岗位 + 未匹配岗位必须等于岗位总数')
assert(validUnique + duplicates + invalid === inputRows, '招聘有效唯一 + 重复 + 无效必须等于输入记录')
assert(matched + review + unmatched <= validUnique, '招聘结果分类不得大于有效唯一记录')
assert(everyCoverageRateBetweenZeroAndOne, '覆盖率必须在 0 到 1 之间')
assert(completedYearsAreSortedUnique, '招聘完成年份必须升序且唯一')
```

错误消息使用中文并包含资产名和具体数值。

- [ ] **Step 5: 实现 CLI、`--check` 和原子输出**

`atomic-write.mjs` 在目标文件同目录写临时文件，再通过 `rename` 替换：

```js
export async function writeJsonAtomically(outputPath, value) {
  const target = outputPath instanceof URL ? fileURLToPath(outputPath) : resolve(outputPath)
  const temp = join(dirname(target), `.${basename(target)}.${process.pid}.tmp`)
  await mkdir(dirname(target), { recursive: true })
  try {
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
    await rename(temp, target)
  } finally {
    await unlink(temp).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}
```

`refresh-data.mjs` 的参数解析以显式参数为准，否则默认使用工程父目录：

```js
export function parseArgs(args) {
  const options = {
    workspaceRoot: resolve(fileURLToPath(new URL('../..', import.meta.url))),
    output: undefined,
    check: false,
  }
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--check') options.check = true
    else if (arg === '--workspace-root') {
      if (!args[index + 1]) throw new Error('--workspace-root 缺少路径')
      options.workspaceRoot = resolve(args[++index])
    } else if (arg === '--output') {
      if (!args[index + 1]) throw new Error('--output 缺少路径')
      options.output = resolve(args[++index])
    }
    else throw new Error(`未知参数: ${arg}`)
  }
  return options
}

const options = parseArgs(process.argv.slice(2))
const snapshot = await buildDashboardSnapshot({
  workspaceRoot: options.workspaceRoot,
  now: new Date(),
})

if (options.check) {
  assertCurrentBaseline(snapshot)
  console.log(formatSummary(snapshot))
  process.exit(0)
}

await writeJsonAtomically(
  options.output ?? new URL('../src/data/dashboard-snapshot.json', import.meta.url),
  snapshot,
)
console.log(formatSummary(snapshot))
```

模块底部只在作为 CLI 入口执行时调用 `main()`，保证测试导入 `parseArgs` 不会触发刷新：

```js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
```

`assertCurrentBaseline` 使用以下固定审批基线：

```js
const CURRENT_BASELINE = {
  'chains.primaryValue': 19,
  'chains.totalValue': 129,
  'stages.primaryValue': 57,
  'stages.supportingMetrics.10链精细节点': 1133,
  'majors.primaryValue': 682,
  'majors.totalValue': 2142,
  'industries.primaryValue': 1955,
  'positions.primaryValue': 645,
  'positions.totalValue': 1356,
  'recruitmentPipeline.inputRows': 240034,
  'recruitmentPipeline.validUniqueRows': 239149,
  'recruitmentPipeline.formallyMatchedJobs': 19297,
  'recruitmentPipeline.completedYears': [2014, 2015, 2016],
}
```

逐项不一致时抛出：

```text
基线不一致 majors.primaryValue: expected 682, received 681
```

- [ ] **Step 6: 跑测试，再刷新真实快照**

Run: `cd data-governance-dashboard && npm test`

Expected: PASS。

Run: `cd data-governance-dashboard && npm run refresh`

Expected output contains:

```text
快照生成成功
产业链 19/129
专业 682/2142
岗位 645/1356
招聘有效唯一 239149
当前批次 2014—2016
```

Run: `cd data-governance-dashboard && npm run refresh:check`

Expected: PASS，且不改写快照。

- [ ] **Step 7: 提交快照流水线**

```bash
git add data-governance-dashboard
git commit -m "feat: build validated dashboard snapshots"
```

---

### Task 7: 渲染顶部栏和六类指标卡

**Files:**
- Create: `data-governance-dashboard/src/dashboard-model.ts`
- Create: `data-governance-dashboard/src/components/DashboardHeader.vue`
- Create: `data-governance-dashboard/src/components/MetricCard.vue`
- Create: `data-governance-dashboard/src/components/DashboardView.vue`
- Modify: `data-governance-dashboard/src/App.vue`
- Modify: `data-governance-dashboard/src/styles.css`
- Test: `data-governance-dashboard/tests/dashboard-model.test.mjs`
- Test: `data-governance-dashboard/tests/dashboard-summary.test.ts`

**Interfaces:**
- Consumes: `DashboardSnapshot` JSON。
- Produces:
  - `formatCount(value): string`
  - `formatPercent(value): string`
  - `snapshotDisplayStatus(snapshot, now): { label, tone }`
  - `snapshotLoadState(value): { valid: true, snapshot } | { valid: false, message }`
  - `MetricCard` emits `select` with asset ID。

- [ ] **Step 1: 写格式化、过期状态和模板失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatCount,
  formatPercent,
  snapshotDisplayStatus,
  snapshotLoadState,
} from '../src/dashboard-model.ts'

test('dashboard formats Chinese-facing counts and percentages', () => {
  assert.equal(formatCount(239149), '239,149')
  assert.equal(formatPercent(0.318394), '31.8%')
})

test('snapshot older than seven days is stale', () => {
  assert.deepEqual(
    snapshotDisplayStatus(
      { generatedAt: '2026-07-01T00:00:00.000Z', overallStatus: 'partial' },
      new Date('2026-07-09T00:00:00.000Z'),
    ),
    { label: '数据已过期', tone: 'stale' },
  )
})

test('unknown snapshot schema produces a reader-facing error state', () => {
  assert.deepEqual(snapshotLoadState({ schemaVersion: 2 }), {
    valid: false,
    message: '无法展示数据：未知快照版本 2',
  })
})
```

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardView from '../src/components/DashboardView.vue'
import MetricCard from '../src/components/MetricCard.vue'

const metric = {
  id: 'majors',
  label: '专业',
  primaryValue: 682,
  totalValue: 2142,
  coverageRate: 682 / 2142,
  status: 'partial',
  definition: '有确定关联专业 ÷ 专业总数',
  grain: '专业编码',
  sourceIds: ['majorCatalog', 'majorMatches'],
  supportingMetrics: [{ label: '待人工研判', value: 443 }],
}

describe('dashboard summary', () => {
  it('renders a metric button and emits the selected asset', async () => {
    const wrapper = mount(MetricCard, { props: { metric } })
    expect(wrapper.get('button').attributes('aria-label')).toContain('专业')
    expect(wrapper.text()).toContain('682')
    expect(wrapper.text()).toContain('2,142')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['majors']])
  })

  it('renders a reader-facing alert for an unknown snapshot version', () => {
    const wrapper = mount(DashboardView, {
      props: { snapshotValue: { schemaVersion: 2 } },
    })
    expect(wrapper.get('[role="alert"]').text()).toBe('无法展示数据：未知快照版本 2')
  })
})
```

- [ ] **Step 2: 运行测试并确认模型和组件缺失**

Run: `cd data-governance-dashboard && node --test tests/dashboard-model.test.mjs && npx vitest run tests/dashboard-summary.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` 或 `ENOENT`。

- [ ] **Step 3: 实现显示模型**

```ts
type SnapshotStatusInput = {
  schemaVersion?: unknown
  generatedAt?: string
  overallStatus?: 'healthy' | 'partial' | 'stale' | 'error'
}

export const formatCount = (value: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)

export const formatPercent = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)

export function snapshotDisplayStatus(snapshot: SnapshotStatusInput, now = new Date()) {
  const age = now.getTime() - new Date(snapshot.generatedAt ?? 0).getTime()
  if (age > 7 * 24 * 60 * 60 * 1000) return { label: '数据已过期', tone: 'stale' }
  if (snapshot.overallStatus === 'partial') return { label: '部分完成', tone: 'partial' }
  if (snapshot.overallStatus === 'error') return { label: '快照异常', tone: 'error' }
  return { label: '数据快照正常', tone: 'healthy' }
}

export function snapshotLoadState(value: SnapshotStatusInput) {
  if (value?.schemaVersion !== 1) {
    return {
      valid: false,
      message: `无法展示数据：未知快照版本 ${String(value?.schemaVersion ?? '缺失')}`,
    }
  }
  return { valid: true, snapshot: value }
}
```

- [ ] **Step 4: 实现 Header、MetricCard 和 App 第一屏**

`MetricCard.vue` 根元素必须是 `<button type="button">`，展示主值、可选分母、百分比、状态文字和辅助指标；点击时：

```ts
const emit = defineEmits<{ select: [assetId: AssetMetric['id']] }>()
```

`DashboardView.vue` 接收 `snapshotValue: unknown`，通过 `snapshotLoadState` 决定错误面板或正式看板，并维护 `selectedAssetId`。`App.vue` 只负责注入静态快照：

```vue
<script setup lang="ts">
import snapshotJson from './data/dashboard-snapshot.json'
import DashboardView from './components/DashboardView.vue'
</script>

<template>
  <DashboardView :snapshot-value="snapshotJson" />
</template>
```

`DashboardView.vue` 的成功分支使用 `DashboardHeader`，并按 `snapshot.assets` 渲染六张 `MetricCard`；每张卡的 `select` 事件调用 `openSources(assetId)`。

- [ ] **Step 5: 验证测试和构建**

Run: `cd data-governance-dashboard && npm test && npm run build`

Expected: PASS；构建中没有 TypeScript 错误。

- [ ] **Step 6: 提交第一屏**

```bash
git add data-governance-dashboard
git commit -m "feat: render dashboard summary metrics"
```

---

### Task 8: 实现覆盖率图和招聘处理漏斗

**Files:**
- Modify: `data-governance-dashboard/src/dashboard-model.ts`
- Create: `data-governance-dashboard/src/components/CoverageChart.vue`
- Create: `data-governance-dashboard/src/components/RecruitmentFunnel.vue`
- Modify: `data-governance-dashboard/src/components/DashboardView.vue`
- Modify: `data-governance-dashboard/src/styles.css`
- Test: `data-governance-dashboard/tests/dashboard-charts.test.ts`

**Interfaces:**
- Consumes:
  - `AssetMetric[]`
  - `RecruitmentPipeline`
- Produces:
  - `buildCoverageRows(assets): CoverageRow[]`
  - `buildRecruitmentStages(pipeline): FunnelStage[]`
  - 两个无第三方图表依赖的可访问组件。

- [ ] **Step 1: 写图表数据选择失败测试**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import {
  buildCoverageRows,
  buildRecruitmentStages,
} from '../src/dashboard-model.ts'
import CoverageChart from '../src/components/CoverageChart.vue'
import RecruitmentFunnel from '../src/components/RecruitmentFunnel.vue'

const coverageRows = buildCoverageRows([
    { id: 'chains', label: '标准产业链', coverageRate: 0.147 },
    { id: 'stages', label: '产业环节' },
    { id: 'majors', label: '专业', coverageRate: 0.318 },
    { id: 'industries', label: '国标行业', coverageRate: 0.999 },
    { id: 'positions', label: '岗位', coverageRate: 0.476 },
    { id: 'recruitment', label: '招聘信息', coverageRate: 0.996 },
])

describe('dashboard charts', () => {
  it('includes only compatible ratios and renders an accessible coverage SVG', () => {
    expect(coverageRows.map(({ id }) => id)).toEqual([
      'chains', 'majors', 'positions', 'industries', 'recruitment',
    ])
    const wrapper = mount(CoverageChart, { props: { rows: coverageRows } })
    expect(wrapper.get('svg').attributes('role')).toBe('img')
    expect(wrapper.text()).toContain('14.7%')
    expect(wrapper.text()).not.toContain('产业环节')
  })

  it('keeps input, valid, review, and formal match stages in the rendered funnel', () => {
    const pipeline = {
      inputRows: 10,
      validUniqueRows: 8,
      duplicateRows: 1,
      invalidRows: 1,
      mediumReviewJobs: 3,
      formallyMatchedJobs: 2,
      unmatchedRows: 3,
      formalRelationCount: 2,
      completedYears: [2014, 2016],
    }
    expect(buildRecruitmentStages(pipeline)).toEqual([
      { id: 'input', label: '输入记录', value: 10, tone: 'primary' },
      { id: 'valid', label: '有效唯一', value: 8, tone: 'primary' },
      { id: 'review', label: '待复核', value: 3, tone: 'warning' },
      { id: 'matched', label: '正式匹配', value: 2, tone: 'success' },
    ])
    const wrapper = mount(RecruitmentFunnel, { props: { pipeline } })
    expect(wrapper.get('ol').text()).toContain('输入记录')
    expect(wrapper.get('ol').text()).toContain('正式匹配')
    expect(wrapper.text()).toContain('未匹配')
  })
})
```

- [ ] **Step 2: 运行测试并确认函数不存在**

Run: `cd data-governance-dashboard && npx vitest run tests/dashboard-charts.test.ts`

Expected: FAIL，错误说明导出函数不存在。

- [ ] **Step 3: 实现图表数据函数**

`buildCoverageRows` 按 `chains`、`majors`、`positions`、`industries`、`recruitment` 固定顺序输出，过滤 `coverageRate === undefined`，并将数值限制在 0 到 1。

`buildRecruitmentStages` 使用测试中的四个阶段，另提供：

```js
export const buildRecruitmentFootnotes = (pipeline) => [
  { label: '重复记录', value: pipeline.duplicateRows },
  { label: '无效记录', value: pipeline.invalidRows },
  { label: '未匹配', value: pipeline.unmatchedRows },
  { label: '正式关系', value: pipeline.formalRelationCount },
]
```

- [ ] **Step 4: 实现可访问的原生图表组件**

`CoverageChart.vue` 使用 `<svg role="img" aria-labelledby="coverage-title coverage-desc">`；每个条形同时显示资产名、百分比文本和 `<rect>`。`RecruitmentFunnel.vue` 使用有序列表和 CSS 多边形，不依赖颜色区分阶段；每段显示数值和中文标签。

- [ ] **Step 5: 验证测试和构建**

Run: `cd data-governance-dashboard && npm test && npm run build`

Expected: PASS；`package-lock.json` 不出现 ECharts、Chart.js 或 D3。

- [ ] **Step 6: 提交图表**

```bash
git add data-governance-dashboard
git commit -m "feat: visualize coverage and recruitment flow"
```

---

### Task 9: 实现来源表、筛选器和详情抽屉

**Files:**
- Modify: `data-governance-dashboard/src/dashboard-model.ts`
- Create: `data-governance-dashboard/src/components/SourceTable.vue`
- Create: `data-governance-dashboard/src/components/SourceDrawer.vue`
- Modify: `data-governance-dashboard/src/components/DashboardView.vue`
- Modify: `data-governance-dashboard/src/styles.css`
- Test: `data-governance-dashboard/tests/source-exploration.test.mjs`
- Test: `data-governance-dashboard/tests/dashboard-interaction.test.ts`

**Interfaces:**
- Consumes: `SourceStatus[]`、`AssetMetric[]`、选中的资产 ID、状态筛选值。
- Produces:
  - `sourcesForAsset(sources, assetId): SourceStatus[]`
  - `filterSources(sources, { assetId, status }): SourceStatus[]`
  - `statusLabel(status): string`
  - `SourceTable` emits `inspect` with source ID。
  - `SourceDrawer` emits `close`。

- [ ] **Step 1: 写筛选行为和交互契约失败测试**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterSources,
  sourcesForAsset,
  statusLabel,
} from '../src/dashboard-model.ts'

const sources = [
  { id: 'majorCatalog', assetId: 'majors', status: 'validated' },
  { id: 'majorMatches', assetId: 'majors', status: 'partial' },
  { id: 'positionMatches', assetId: 'positions', status: 'review' },
]

test('source filters compose asset and quality status', () => {
  assert.deepEqual(
    filterSources(sources, { assetId: 'majors', status: 'partial' }).map(({ id }) => id),
    ['majorMatches'],
  )
  assert.equal(sourcesForAsset(sources, 'majors').length, 2)
  assert.equal(statusLabel('in_progress'), '跑批进行中')
})
```

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardView from '../src/components/DashboardView.vue'
import SourceTable from '../src/components/SourceTable.vue'

const source = {
  id: 'majorCatalog',
  assetId: 'majors',
  relativePath: '官方数据/专业目录.xlsx',
  selectedCandidate: true,
  modifiedAt: '2026-07-14T00:00:00.000Z',
  grain: '专业编码',
  status: 'validated',
  notes: ['按专业编码去重'],
}

const metric = {
  id: 'majors',
  label: '专业',
  primaryValue: 682,
  totalValue: 2142,
  coverageRate: 682 / 2142,
  status: 'partial',
  definition: '有确定关联专业 ÷ 专业总数',
  grain: '专业编码',
  sourceIds: ['majorCatalog'],
  supportingMetrics: [],
}

const snapshot = {
  schemaVersion: 1,
  generatedAt: '2026-07-27T00:00:00.000Z',
  workspaceRootLabel: 'fixture',
  overallStatus: 'partial',
  assets: [metric],
  recruitmentPipeline: {
    inputRows: 0,
    validUniqueRows: 0,
    duplicateRows: 0,
    invalidRows: 0,
    formallyMatchedJobs: 0,
    mediumReviewJobs: 0,
    unmatchedRows: 0,
    formalRelationCount: 0,
    completedYears: [],
  },
  sources: [source],
  warnings: [],
}

describe('source exploration', () => {
  it('filters the real source table and emits the selected source', async () => {
    const wrapper = mount(SourceTable, { props: { sources: [source] } })
    await wrapper.get('[aria-label="按资产类别筛选"]').setValue('majors')
    expect(wrapper.text()).toContain('专业目录.xlsx')
    await wrapper.get('button[aria-label="查看 majorCatalog"]').trigger('click')
    expect(wrapper.emitted('inspect')).toEqual([['majorCatalog']])
  })

  it('opens source details from a metric and closes them with Escape', async () => {
    const wrapper = mount(DashboardView, {
      attachTo: document.body,
      props: { snapshotValue: snapshot },
    })
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('官方数据/专业目录.xlsx')
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
```

- [ ] **Step 2: 运行测试并确认函数和组件缺失**

Run: `cd data-governance-dashboard && node --test tests/source-exploration.test.mjs && npx vitest run tests/dashboard-interaction.test.ts`

Expected: FAIL。

- [ ] **Step 3: 实现来源筛选模型**

```js
export function filterSources(sources, { assetId = 'all', status = 'all' }) {
  return sources.filter((source) =>
    (assetId === 'all' || source.assetId === assetId) &&
    (status === 'all' || source.status === status),
  )
}

export const sourcesForAsset = (sources, assetId) =>
  filterSources(sources, { assetId, status: 'all' })

export const statusLabel = (status) => ({
  validated: '已校验',
  partial: '部分覆盖',
  review: '建议复核',
  in_progress: '跑批进行中',
  missing: '缺少数据源',
}[status] ?? '未知状态')
```

- [ ] **Step 4: 实现表格和抽屉**

`SourceTable.vue` 包含两个 `<select>`：

- 资产类别：全部、产业链、产业环节、专业、国标行业、岗位、招聘信息；
- 状态：全部、已校验、部分覆盖、建议复核、跑批进行中。

表格列固定为数据资产、统计粒度、更新时间、状态、查看来源。移动端使用 CSS 将每行转为带 `data-label` 的卡片，不隐藏字段。

`SourceDrawer.vue` 展示：

- 指标名称和定义；
- 粒度；
- 分子、分母、覆盖率；
- 支撑指标；
- 所有关联源的相对路径、修改时间、状态和说明；
- 快照警告。

打开时聚焦关闭按钮；关闭时将焦点返回触发卡片。Escape、遮罩和关闭按钮均关闭抽屉。

- [ ] **Step 5: 验证测试和构建**

Run: `cd data-governance-dashboard && npm test && npm run build`

Expected: PASS。

- [ ] **Step 6: 提交来源追溯**

```bash
git add data-governance-dashboard
git commit -m "feat: add source lineage exploration"
```

---

### Task 10: 完成响应式视觉、说明文档和最终验收

**Files:**
- Modify: `data-governance-dashboard/src/styles.css`
- Modify: `data-governance-dashboard/src/components/DashboardView.vue`
- Create: `data-governance-dashboard/README.md`

**Interfaces:**
- Consumes: Tasks 1–9 的完整工程和真实数据快照。
- Produces: 通过 `npm run verify` 的独立看板、可复现说明和经视觉检查的桌面/平板/手机布局。

- [ ] **Step 1: 在最终 CSS 前运行真实页面并记录视觉 RED**

Run: `cd data-governance-dashboard && npm run dev`

在真实浏览器分别设置 1440×900、768×1024、390×844，确认当前页面至少存在以下尚未满足的审批稿行为，并把实际观察写入 Task 10 报告：

- 宽屏指标卡尚未稳定为六列；
- 平板指标卡尚未稳定为三列；
- 手机指标卡、来源表或抽屉尚未形成单列无横向滚动布局；
- 焦点样式或减少动态效果规则尚未完整。

Expected: 视觉 RED；报告包含每个视口的具体缺陷，不使用源码正则或选择器存在性代替渲染检查。

- [ ] **Step 2: 完成视觉系统**

`styles.css` 使用以下固定设计标记：

```css
:root {
  color: #173c4f;
  background: #f4f7f9;
  font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --teal-900: #103f55;
  --teal-700: #176c69;
  --teal-500: #16a27a;
  --amber-600: #b56b19;
  --red-600: #b44747;
  --surface: #ffffff;
  --border: #e1e8ec;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1100px) {
  .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .metric-grid,
  .analysis-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

所有按钮和可操作表格行使用 `:focus-visible` 双层高对比轮廓。页面设置 `overflow-wrap: anywhere` 处理长路径，但正文区域不设置横向滚动。

- [ ] **Step 3: 编写可复现 README**

README 必须包含：

```markdown
# 专业建设数据治理驾驶舱

## 首次运行

1. `npm install`
2. `npm run refresh`
3. `npm run dev`

## 数据刷新

默认数据工作区为本工程父目录。其他位置使用：

`npm run refresh -- --workspace-root /absolute/path/to/workspace`

刷新脚本仅在全部源校验通过后替换快照。

## 验证与构建

- `npm test`
- `npm run refresh:check`
- `npm run build`
- `npm run verify`

## 当前数据边界

招聘处理清单当前覆盖 2014—2016；2017—2025 不计入当前成果。
57 个标准阶段环节与 1,133 个精细产业节点属于不同粒度，不相加。
```

- [ ] **Step 4: 运行完整自动验证**

Run: `cd data-governance-dashboard && npm run verify`

Expected: PASS；测试、真实数据基线检查、TypeScript 检查和 Vite 构建全部成功。

- [ ] **Step 5: 启动页面并完成三种宽度视觉 GREEN**

Run: `cd data-governance-dashboard && npm run dev`

检查：

- 1440×900：六张指标卡同排，图表和漏斗双列，来源表完整；
- 768×1024：指标卡三列，图表纵向堆叠，无文字重叠；
- 390×844：指标卡单列，来源表转换为卡片，抽屉不超出视口；
- 点击每张指标卡均打开正确来源；
- Tab、Enter、Escape 可完成打开与关闭；
- 页面无控制台错误和横向滚动。

如果发现视觉问题，先写一个能描述该缺陷的源文件或模型测试，再做最小 CSS/模板修复，并重新运行 `npm run verify`。

- [ ] **Step 6: 检查工作区只包含预期改动**

Run: `git status --short`

Expected: 只出现 `data-governance-dashboard/` 和已计划的根 `.gitignore` 改动；不包含源数据文件变化。

Run: `git diff --check`

Expected: PASS，无空白错误。

- [ ] **Step 7: 提交最终视觉和文档**

```bash
git add .gitignore data-governance-dashboard
git commit -m "feat: finish data governance dashboard"
```

- [ ] **Step 8: 最终完成声明前复验**

Run: `cd data-governance-dashboard && npm run verify`

Expected: PASS，输出为本次提交后的全新验证结果。
