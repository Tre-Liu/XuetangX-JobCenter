# 人才方案空状态重置与智能导入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为人才方案增加可重复演示的空状态重置、五个模块的无数据页面，以及上传—解析预览—选择模块—确认导入的完整本地智能导入流程。

**Architecture:** 将可测试的导入状态转换集中在 `src/app/talent-plan-import.ts`，将双阶段弹窗封装为受控 Vue 组件，`App.vue` 只负责方案模块可用性和页面切换；`index.html` 按项目既有规则镜像同一状态与交互。所有解析结果复用智能建造工程专业已有 mock 数据，不新增网络请求或持久化。

**Tech Stack:** Vue 3.5、TypeScript 5.8、Vite 6、Node.js built-in test runner、`@vue/server-renderer`（由 Vue 依赖提供）、现有 CSS token 与纯 CSS 空状态插画。

## Global Constraints

- 只修改当前 `major-construction-platform`，不触碰 `V1.0需求（2026.6.11）/V1.0_demo` 和工作区中无关的未跟踪产物。
- 同步维护 `src/App.vue` 与根目录 `index.html` 的 `file://` 静态入口；两者必须展示相同的状态和主路径行为。
- “解析”只读取本地文件名并切换本地状态；不得调用上传、OCR、LLM 或其他网络接口，也不得写入 `localStorage`。
- 解析结果只使用 `src/app/talent-industry-data.ts` 的智能建造工程数据；界面不得出现“新能源汽车工程技术”。
- 学生管理不是导入模块，重置后始终显示 0 人表格和分页。
- 所有可执行状态和交互严格执行红—绿—重构：先写行为测试、运行并确认因缺少目标行为失败，再实现最小代码、运行定向测试，最后提交。纯视觉 CSS 不做源码字符串匹配，以浏览器中的失败视觉基线、计算后尺寸和同视口截图对比完成红—绿验证。
- 视觉验收以用户给出的 1920 × 999 截图为信息结构参考，以当前 demo 的字体、间距、圆角、颜色与交互状态为最终设计规范。

---

## Task 1: 建立纯导入状态模型

**Files:**

- Create: `src/app/talent-plan-import.ts`
- Create: `tests/talent-plan-import.test.mjs`

- [ ] **Step 1: 写状态模型的失败测试**

创建 `tests/talent-plan-import.test.mjs`，覆盖初始状态、扩展名验证、进入解析结果、模块勾选、重新解析、确认映射和空状态判断：

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  TALENT_IMPORT_MODULE_KEYS,
  applyTalentImportSelection,
  beginTalentImportReview,
  createEmptyTalentPlanModules,
  createFilledTalentPlanModules,
  createTalentImportDialogState,
  hasTalentPlanModule,
  resetTalentImportDialog,
  selectTalentImportFile,
  selectTalentImportPreview,
  toggleTalentImportModule,
  validateTalentImportFileName
} from '../src/app/talent-plan-import.ts'

test('talent import starts clean with every preview module selected', () => {
  const state = createTalentImportDialogState()
  assert.equal(state.stage, 'upload')
  assert.equal(state.fileName, '')
  assert.equal(state.fileError, '')
  assert.equal(state.activeModule, 'goals')
  assert.deepEqual(state.selectedModules, TALENT_IMPORT_MODULE_KEYS)
})

test('talent import accepts only the six documented file suffixes', () => {
  for (const fileName of ['方案.pdf', '方案.DOC', '方案.docx', '方案.jpg', '方案.jpeg', '方案.png']) {
    assert.equal(validateTalentImportFileName(fileName), '')
  }
  assert.equal(validateTalentImportFileName('方案.xlsx'), '仅支持 pdf、doc、docx、jpg、jpeg、png 格式')
  assert.equal(validateTalentImportFileName('无扩展名'), '仅支持 pdf、doc、docx、jpg、jpeg、png 格式')
})

test('selecting a valid file enables the simulated review stage', () => {
  const selected = selectTalentImportFile(createTalentImportDialogState(), '智能建造培养方案.pdf')
  assert.equal(selected.fileName, '智能建造培养方案.pdf')
  assert.equal(selected.fileError, '')
  assert.equal(beginTalentImportReview(selected).stage, 'review')
})

test('an invalid or missing file cannot enter review', () => {
  const invalid = selectTalentImportFile(createTalentImportDialogState(), '培养方案.zip')
  assert.equal(invalid.fileName, '')
  assert.match(invalid.fileError, /仅支持/)
  assert.equal(beginTalentImportReview(invalid).stage, 'upload')
  assert.equal(beginTalentImportReview(createTalentImportDialogState()).stage, 'upload')
})

test('module selection toggles without duplicates and can become empty', () => {
  const initial = createTalentImportDialogState()
  const withoutGoals = toggleTalentImportModule(initial, 'goals')
  assert.equal(withoutGoals.selectedModules.includes('goals'), false)
  const restored = toggleTalentImportModule(withoutGoals, 'goals')
  assert.equal(restored.selectedModules.filter((key) => key === 'goals').length, 1)
  const none = TALENT_IMPORT_MODULE_KEYS.reduce(toggleTalentImportModule, initial)
  assert.deepEqual(none.selectedModules, [])
})

test('selecting a preview changes only the active module', () => {
  const initial = createTalentImportDialogState()
  const selected = selectTalentImportPreview(initial, 'courses')
  assert.equal(selected.activeModule, 'courses')
  assert.deepEqual(selected.selectedModules, initial.selectedModules)
  assert.equal(initial.activeModule, 'goals')
})

test('reparse clears the file and restores the default selection', () => {
  const review = beginTalentImportReview(
    selectTalentImportFile(toggleTalentImportModule(createTalentImportDialogState(), 'courses'), '方案.docx')
  )
  assert.deepEqual(resetTalentImportDialog(review), createTalentImportDialogState())
})

test('confirmation maps only selected modules to available content', () => {
  assert.deepEqual(applyTalentImportSelection(['goals', 'courses']), {
    goals: true,
    requirements: false,
    courses: true,
    goalRequirementMatrix: false,
    courseRequirementMatrix: false
  })
  assert.equal(hasTalentPlanModule(false, createFilledTalentPlanModules(), 'goals'), false)
  assert.equal(hasTalentPlanModule(true, createEmptyTalentPlanModules(), 'goals'), false)
  assert.equal(hasTalentPlanModule(true, createFilledTalentPlanModules(), 'goals'), true)
})
```

- [ ] **Step 2: 运行测试并确认红灯**

Run:

```bash
node --test tests/talent-plan-import.test.mjs
```

Expected: FAIL，原因是 `src/app/talent-plan-import.ts` 尚不存在；不能接受语法错误或测试装载器错误作为目标失败。

- [ ] **Step 3: 实现不可变的纯状态转换**

创建 `src/app/talent-plan-import.ts`：

```ts
export const TALENT_IMPORT_MODULE_KEYS = [
  'goals',
  'requirements',
  'courses',
  'goalRequirementMatrix',
  'courseRequirementMatrix'
] as const

export type TalentImportModuleKey = (typeof TALENT_IMPORT_MODULE_KEYS)[number]
export type TalentImportStage = 'upload' | 'review'
export type TalentPlanModuleAvailability = Record<TalentImportModuleKey, boolean>

export interface TalentImportDialogState {
  stage: TalentImportStage
  fileName: string
  fileError: string
  activeModule: TalentImportModuleKey
  selectedModules: TalentImportModuleKey[]
}

const SUPPORTED_FILE_SUFFIXES = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])
const UNSUPPORTED_FILE_MESSAGE = '仅支持 pdf、doc、docx、jpg、jpeg、png 格式'

export const createEmptyTalentPlanModules = (): TalentPlanModuleAvailability => ({
  goals: false,
  requirements: false,
  courses: false,
  goalRequirementMatrix: false,
  courseRequirementMatrix: false
})

export const createFilledTalentPlanModules = (): TalentPlanModuleAvailability => ({
  goals: true,
  requirements: true,
  courses: true,
  goalRequirementMatrix: true,
  courseRequirementMatrix: false
})

export const createTalentImportDialogState = (): TalentImportDialogState => ({
  stage: 'upload',
  fileName: '',
  fileError: '',
  activeModule: 'goals',
  selectedModules: [...TALENT_IMPORT_MODULE_KEYS]
})

export const validateTalentImportFileName = (fileName: string): string => {
  const suffix = fileName.split('.').pop()?.toLowerCase()
  return suffix && SUPPORTED_FILE_SUFFIXES.has(suffix) ? '' : UNSUPPORTED_FILE_MESSAGE
}

export const selectTalentImportFile = (
  state: TalentImportDialogState,
  fileName: string
): TalentImportDialogState => {
  const fileError = validateTalentImportFileName(fileName)
  return { ...state, fileName: fileError ? '' : fileName, fileError }
}

export const beginTalentImportReview = (
  state: TalentImportDialogState
): TalentImportDialogState =>
  state.fileName && !state.fileError ? { ...state, stage: 'review' } : state

export const selectTalentImportPreview = (
  state: TalentImportDialogState,
  activeModule: TalentImportModuleKey
): TalentImportDialogState => ({ ...state, activeModule })

export const toggleTalentImportModule = (
  state: TalentImportDialogState,
  key: TalentImportModuleKey
): TalentImportDialogState => ({
  ...state,
  selectedModules: state.selectedModules.includes(key)
    ? state.selectedModules.filter((item) => item !== key)
    : TALENT_IMPORT_MODULE_KEYS.filter((item) => item === key || state.selectedModules.includes(item))
})

export const resetTalentImportDialog = (
  _state?: TalentImportDialogState
): TalentImportDialogState => createTalentImportDialogState()

export const applyTalentImportSelection = (
  selectedModules: readonly TalentImportModuleKey[]
): TalentPlanModuleAvailability =>
  Object.fromEntries(
    TALENT_IMPORT_MODULE_KEYS.map((key) => [key, selectedModules.includes(key)])
  ) as TalentPlanModuleAvailability

export const hasTalentPlanModule = (
  talentPlanCreated: boolean,
  modules: TalentPlanModuleAvailability,
  key: TalentImportModuleKey
): boolean => talentPlanCreated && modules[key]
```

- [ ] **Step 4: 运行定向测试并确认绿灯**

Run:

```bash
node --test tests/talent-plan-import.test.mjs
```

Expected: 7 tests PASS。

- [ ] **Step 5: 提交状态模型**

```bash
git add src/app/talent-plan-import.ts tests/talent-plan-import.test.mjs
git commit -m "feat: add talent plan import state model"
```

---

## Task 2: 建立受控智能导入弹窗组件

**Files:**

- Create: `src/components/TalentPlanImportDialog.vue`
- Create: `tests/talent-plan-import-dialog.test.mjs`
- Modify: `src/app/talent-plan-import.ts`

- [ ] **Step 1: 写组件 SSR 的失败测试**

创建 `tests/talent-plan-import-dialog.test.mjs`，通过 Vite SSR 加载真实 SFC，并验证两个阶段的信息结构与智能建造数据：

```js
import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'

import {
  beginTalentImportReview,
  createTalentImportDialogState,
  selectTalentImportFile
} from '../src/app/talent-plan-import.ts'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const vite = await createServer({
  root: projectRoot,
  server: { middlewareMode: true },
  appType: 'custom'
})
after(() => vite.close())

const { default: TalentPlanImportDialog } = await vite.ssrLoadModule(
  '/src/components/TalentPlanImportDialog.vue'
)

const renderDialog = (modelValue) =>
  renderToString(createSSRApp(TalentPlanImportDialog, { modelValue }))

test('upload stage renders warning, accepted formats and disabled parse action', async () => {
  const html = await renderDialog(createTalentImportDialogState())
  assert.match(html, /智能导入的培养方案内容将替换已填写内容/)
  assert.match(html, /pdf、doc、docx、jpg、jpeg、png/)
  assert.match(html, /开始解析/)
  assert.match(html, /disabled/)
})

test('review stage renders all five modules and current intelligent construction data', async () => {
  const review = beginTalentImportReview(
    selectTalentImportFile(createTalentImportDialogState(), '智能建造工程人才培养方案.pdf')
  )
  const html = await renderDialog(review)
  for (const label of [
    '培养目标',
    '毕业要求',
    '课程管理',
    '培养目标与毕业要求支撑矩阵',
    '课程与毕业要求支撑矩阵'
  ]) {
    assert.match(html, new RegExp(label))
  }
  assert.match(html, /培养目标概述/)
  assert.match(html, /扎根辽西、服务辽宁/)
  assert.match(html, /确认并导入（将替换已填写内容）/)
  assert.doesNotMatch(html, /新能源汽车工程技术/)
})

test('each review module renders its own source-backed preview', async () => {
  const base = beginTalentImportReview(
    selectTalentImportFile(createTalentImportDialogState(), '智能建造工程人才培养方案.docx')
  )
  const expectations = [
    ['requirements', /毕业要求概述/, /R8\.3/],
    ['courses', /思想道德与法治/, /共74门课程/],
    ['goalRequirementMatrix', /毕业要求 \\ 培养目标/, /目标11/],
    ['courseRequirementMatrix', /请添加课程和毕业要求/, /然后设置支撑体系/]
  ]
  for (const [activeModule, first, second] of expectations) {
    const html = await renderDialog({ ...base, activeModule })
    assert.match(html, first)
    assert.match(html, second)
  }
})
```

- [ ] **Step 2: 运行组件测试并确认红灯**

Run:

```bash
node --test tests/talent-plan-import-dialog.test.mjs
```

Expected: FAIL，Vite 明确报告 `TalentPlanImportDialog.vue` 不存在。

- [ ] **Step 3: 在状态模块导出稳定的模块元数据**

在 `src/app/talent-plan-import.ts` 增加以下导出，弹窗和静态入口使用同一组 key、名称与计数：

```ts
export const TALENT_IMPORT_MODULES: ReadonlyArray<{
  key: TalentImportModuleKey
  label: string
  countLabel: string
}> = [
  { key: 'goals', label: '培养目标', countLabel: '11' },
  { key: 'requirements', label: '毕业要求', countLabel: '8组 / 30项' },
  { key: 'courses', label: '课程管理', countLabel: '74' },
  { key: 'goalRequirementMatrix', label: '培养目标与毕业要求支撑矩阵', countLabel: '11 × 8' },
  { key: 'courseRequirementMatrix', label: '课程与毕业要求支撑矩阵', countLabel: '暂无数据' }
]
```

- [ ] **Step 4: 实现双阶段受控组件**

创建 `src/components/TalentPlanImportDialog.vue`。组件接口固定为：

```ts
const props = defineProps<{ modelValue: TalentImportDialogState }>()
const emit = defineEmits<{
  'update:modelValue': [value: TalentImportDialogState]
  close: []
  confirm: [selectedModules: TalentImportModuleKey[]]
}>()
```

实现规则：

- 根遮罩使用 `.dialog-backdrop.talent-import-backdrop`，仅点击遮罩本身或右上角按钮触发 `close`。
- 上传态对话框使用 `role="dialog"`、`aria-modal="true"`、`aria-labelledby="talent-import-title"`。
- 隐藏文件输入设置 `accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"`；`change` 与 `drop` 只把第一个 `File.name` 交给 `selectTalentImportFile`。
- 上传区同时响应点击、Enter 和 Space；选中有效文件后显示文件名，错误显示在 `.talent-import-file-error[role="alert"]`。
- “开始解析”以 `!modelValue.fileName || Boolean(modelValue.fileError)` 作为禁用条件，点击后发出 `beginTalentImportReview` 的新状态。
- 结果态左侧每个模块包含独立复选框；卡片点击调用 `selectTalentImportPreview`，复选框点击阻止冒泡后调用 `toggleTalentImportModule`。
- 右侧使用 `v-if` 分别渲染五个预览：培养目标概述与 11 项目标；8 组毕业要求及其 30 个 children；课程表前 12 行并注明共 74 门；11 列 × 8 行矩阵；课程矩阵复用插画并显示“请添加课程和毕业要求，然后设置支撑体系”。
- 结果 footer 左侧由选中模块元数据生成“已选择：…”；“重新解析”发出 `createTalentImportDialogState()`；确认按钮在零选择时禁用，否则发出选择 key 的拷贝。
- 所有列表 key 使用业务 key/code，不使用数组 index；所有图片与图标复用现有 CSS/字符图形，不引入新资源。

核心方法按以下签名实现：

```ts
const updateState = (nextState: TalentImportDialogState) =>
  emit('update:modelValue', nextState)

const handleFile = (file?: File) => {
  if (!file) return
  updateState(selectTalentImportFile(props.modelValue, file.name))
}

const handleFileInput = (event: Event) => {
  handleFile((event.target as HTMLInputElement).files?.[0])
}

const handleDrop = (event: DragEvent) => {
  handleFile(event.dataTransfer?.files?.[0])
}

const beginReview = () => updateState(beginTalentImportReview(props.modelValue))
const choosePreview = (key: TalentImportModuleKey) =>
  updateState(selectTalentImportPreview(props.modelValue, key))
const toggleModule = (key: TalentImportModuleKey) =>
  updateState(toggleTalentImportModule(props.modelValue, key))
const reparse = () => updateState(createTalentImportDialogState())
const confirmImport = () => {
  if (props.modelValue.selectedModules.length === 0) return
  emit('confirm', [...props.modelValue.selectedModules])
}
```

- [ ] **Step 5: 运行组件与状态测试**

Run:

```bash
node --test tests/talent-plan-import.test.mjs tests/talent-plan-import-dialog.test.mjs
```

Expected: 所有测试 PASS，测试退出后 Vite server 正常关闭，无悬挂句柄。

- [ ] **Step 6: 提交弹窗组件**

```bash
git add src/app/talent-plan-import.ts src/components/TalentPlanImportDialog.vue tests/talent-plan-import-dialog.test.mjs
git commit -m "feat: add talent plan smart import dialog"
```

---

## Task 3: 接入 App 层方案状态、重置和导入提交

**Files:**

- Modify: `src/app/talent-plan-import.ts`
- Modify: `src/App.vue`
- Modify: `tests/talent-plan-import.test.mjs`

- [ ] **Step 1: 写方案级状态转换的失败测试**

在 `tests/talent-plan-import.test.mjs` 的 import 中加入 `createTalentPlanImportTransition`、`createTalentPlanManualTransition` 和 `createTalentPlanResetTransition`，并增加真实状态结果断言：

```js
test('reset transition atomically returns every talent plan control to empty goals', () => {
  const transition = createTalentPlanResetTransition()
  assert.deepEqual(transition, {
    talentPlanCreated: false,
    modules: {
      goals: false,
      requirements: false,
      courses: false,
      goalRequirementMatrix: false,
      courseRequirementMatrix: false
    },
    activeSection: '培养目标',
    activeSubsystem: '',
    activeMatrixTab: 'goalRequirement',
    createDialogOpen: false,
    importDialogOpen: false,
    importDialogState: createTalentImportDialogState()
  })
})

test('import transition replaces availability with only the confirmed modules', () => {
  const transition = createTalentPlanImportTransition(['goals', 'courses'])
  assert.equal(transition.talentPlanCreated, true)
  assert.deepEqual(transition.modules, {
    goals: true,
    requirements: false,
    courses: true,
    goalRequirementMatrix: false,
    courseRequirementMatrix: false
  })
  assert.equal(transition.activeSection, '培养目标')
  assert.equal(transition.importDialogOpen, false)
})

test('manual creation fills existing demo modules and opens the requested section', () => {
  const transition = createTalentPlanManualTransition('毕业要求')
  assert.equal(transition.talentPlanCreated, true)
  assert.deepEqual(transition.modules, createFilledTalentPlanModules())
  assert.equal(transition.activeSection, '毕业要求')
  assert.equal(transition.createDialogOpen, false)
})
```

- [ ] **Step 2: 运行定向状态测试并确认红灯**

Run:

```bash
node --test --test-name-pattern="transition" tests/talent-plan-import.test.mjs
```

Expected: FAIL，Node 报告方案级 transition 导出不存在；不是源文件字符串匹配失败。

- [ ] **Step 3: 实现方案级 transition 并接入 App**

在 `src/app/talent-plan-import.ts` 加入：

```ts
export type TalentPlanSection = '培养目标' | '毕业要求' | '课程管理' | '支撑矩阵' | '学生管理'
export type TalentMatrixTab = 'goalRequirement' | 'courseRequirement'

export interface TalentPlanTransition {
  talentPlanCreated: boolean
  modules: TalentPlanModuleAvailability
  activeSection: TalentPlanSection
  activeSubsystem: ''
  activeMatrixTab: TalentMatrixTab
  createDialogOpen: boolean
  importDialogOpen: boolean
  importDialogState: TalentImportDialogState
}

const createTalentPlanTransition = (
  talentPlanCreated: boolean,
  modules: TalentPlanModuleAvailability,
  activeSection: TalentPlanSection
): TalentPlanTransition => ({
  talentPlanCreated,
  modules,
  activeSection,
  activeSubsystem: '',
  activeMatrixTab: 'goalRequirement',
  createDialogOpen: false,
  importDialogOpen: false,
  importDialogState: createTalentImportDialogState()
})

export const createTalentPlanResetTransition = (): TalentPlanTransition =>
  createTalentPlanTransition(false, createEmptyTalentPlanModules(), '培养目标')

export const createTalentPlanImportTransition = (
  selectedModules: readonly TalentImportModuleKey[]
): TalentPlanTransition =>
  createTalentPlanTransition(true, applyTalentImportSelection(selectedModules), '培养目标')

export const createTalentPlanManualTransition = (
  target: Extract<TalentPlanSection, '培养目标' | '毕业要求'>
): TalentPlanTransition =>
  createTalentPlanTransition(true, createFilledTalentPlanModules(), target)
```

在 `src/App.vue` script 顶部导入组件与纯状态方法；在现有人才方案 ref 附近加入：

```ts
import TalentPlanImportDialog from './components/TalentPlanImportDialog.vue'
import {
  createEmptyTalentPlanModules,
  createTalentPlanImportTransition,
  createTalentImportDialogState,
  createTalentPlanManualTransition,
  createTalentPlanResetTransition,
  type TalentImportDialogState,
  type TalentImportModuleKey,
  type TalentPlanTransition
} from './app/talent-plan-import'

const talentPlanModules = ref(createEmptyTalentPlanModules())
const talentImportDialogOpen = ref(false)
const talentImportDialogState = ref<TalentImportDialogState>(createTalentImportDialogState())
const cultivateCreateTarget = ref<'培养目标' | '毕业要求'>('培养目标')
const activeTalentMatrixTab = ref<'goalRequirement' | 'courseRequirement'>('goalRequirement')

const applyTalentPlanTransition = (transition: TalentPlanTransition) => {
  talentPlanCreated.value = transition.talentPlanCreated
  talentPlanModules.value = transition.modules
  activeTalentSection.value = transition.activeSection
  activeTalentSubsystem.value = transition.activeSubsystem
  activeTalentMatrixTab.value = transition.activeMatrixTab
  cultivateCreateDialogOpen.value = transition.createDialogOpen
  talentImportDialogOpen.value = transition.importDialogOpen
  talentImportDialogState.value = transition.importDialogState
}

const openTalentImportDialog = () => {
  cultivateCreateDialogOpen.value = false
  talentImportDialogState.value = createTalentImportDialogState()
  talentImportDialogOpen.value = true
}

const closeTalentImportDialog = () => {
  talentImportDialogOpen.value = false
  talentImportDialogState.value = createTalentImportDialogState()
}

const confirmTalentImport = (selectedModules: TalentImportModuleKey[]) => {
  applyTalentPlanTransition(createTalentPlanImportTransition(selectedModules))
}

const resetTalentPlanToEmpty = () => {
  applyTalentPlanTransition(createTalentPlanResetTransition())
}
```

调整现有手工创建入口：

```ts
const openCultivateGoalDialog = (target: '培养目标' | '毕业要求' = '培养目标') => {
  cultivateCreateTarget.value = target
  cultivateCreateDialogOpen.value = true
}

const startManualCultivateEntry = () => {
  applyTalentPlanTransition(createTalentPlanManualTransition(cultivateCreateTarget.value))
}
```

删除旧创建弹窗直接持有文件的 `cultivateFileInput`、`selectedCultivateFileName`、`triggerCultivateImport`、`handleCultivateFileChange` 及对应隐藏 input/已选文件提示。创建弹窗的“智能导入”卡片现在只负责打开新的受控弹窗，不保留第二套文件状态。

- [ ] **Step 4: 增加侧栏重置和弹窗挂载**

在 `.section-menu.talent-module-menu.talent-figma-menu` 的现有分组之后、侧栏闭合标签之前加入：

```vue
<div class="talent-sidebar-footer">
  <button
    type="button"
    class="talent-reset-button"
    :disabled="!talentPlanCreated"
    @click="resetTalentPlanToEmpty"
  >
    <span aria-hidden="true">↻</span>
    空状态重置
  </button>
</div>
```

在根模板现有对话框区域加入：

```vue
<TalentPlanImportDialog
  v-if="talentImportDialogOpen"
  v-model="talentImportDialogState"
  @close="closeTalentImportDialog"
  @confirm="confirmTalentImport"
/>
```

把旧创建弹窗中的“智能导入”卡片改为 `@click="openTalentImportDialog"`；标题和手工卡片随 `cultivateCreateTarget` 显示“创建培养目标”或“创建毕业要求”，不新增表单。

- [ ] **Step 5: 运行行为测试与类型构建**

Run:

```bash
node --test --test-name-pattern="transition" tests/talent-plan-import.test.mjs
npm run build
```

Expected: 定向测试 PASS；`vue-tsc` 和 Vite build 均成功。

- [ ] **Step 6: 提交 App 状态接入**

```bash
git add src/app/talent-plan-import.ts src/App.vue tests/talent-plan-import.test.mjs
git commit -m "feat: wire talent plan reset and import state"
```

---

## Task 4: 实现五类 Vue 空状态页面

**Files:**

- Modify: `src/app/talent-plan-import.ts`
- Modify: `src/App.vue`
- Modify: `tests/talent-plan-import.test.mjs`

- [ ] **Step 1: 写五类页面分支解析的行为测试**

在 `tests/talent-plan-import.test.mjs` 的 import 中加入 `resolveTalentPlanSectionMode`，并用手工推导的期望值覆盖空/有数据和矩阵页签：

```js
test('section mode resolves each imported module independently', () => {
  const onlyGoals = applyTalentImportSelection(['goals'])
  assert.equal(resolveTalentPlanSectionMode(true, onlyGoals, '培养目标', 'goalRequirement'), 'goals-data')
  assert.equal(resolveTalentPlanSectionMode(true, onlyGoals, '毕业要求', 'goalRequirement'), 'requirements-empty')
  assert.equal(resolveTalentPlanSectionMode(true, onlyGoals, '课程管理', 'goalRequirement'), 'courses-empty')
  assert.equal(resolveTalentPlanSectionMode(true, onlyGoals, '支撑矩阵', 'goalRequirement'), 'matrix-goal-empty')
})

test('section mode ignores filled flags after a full reset', () => {
  const filled = createFilledTalentPlanModules()
  assert.equal(resolveTalentPlanSectionMode(false, filled, '培养目标', 'goalRequirement'), 'goals-empty')
  assert.equal(resolveTalentPlanSectionMode(false, filled, '毕业要求', 'goalRequirement'), 'requirements-empty')
  assert.equal(resolveTalentPlanSectionMode(false, filled, '课程管理', 'goalRequirement'), 'courses-empty')
  assert.equal(resolveTalentPlanSectionMode(false, filled, '支撑矩阵', 'goalRequirement'), 'matrix-goal-empty')
})

test('matrix and student modes reflect the available demo data', () => {
  const filled = createFilledTalentPlanModules()
  assert.equal(resolveTalentPlanSectionMode(true, filled, '支撑矩阵', 'goalRequirement'), 'matrix-goal-data')
  assert.equal(resolveTalentPlanSectionMode(true, filled, '支撑矩阵', 'courseRequirement'), 'matrix-course-empty')
  assert.equal(resolveTalentPlanSectionMode(true, filled, '学生管理', 'goalRequirement'), 'students-empty')
})
```

- [ ] **Step 2: 运行定向测试并确认红灯**

Run:

```bash
node --test --test-name-pattern="section mode" tests/talent-plan-import.test.mjs
```

Expected: FAIL，Node 报告 `resolveTalentPlanSectionMode` 尚未导出。

- [ ] **Step 3: 实现分支解析器并将通用空页替换为按模块判断的模板**

在 `src/app/talent-plan-import.ts` 增加：

```ts
export type TalentPlanSectionMode =
  | 'goals-empty'
  | 'goals-data'
  | 'requirements-empty'
  | 'requirements-data'
  | 'courses-empty'
  | 'courses-data'
  | 'matrix-goal-empty'
  | 'matrix-goal-data'
  | 'matrix-course-empty'
  | 'students-empty'

export const resolveTalentPlanSectionMode = (
  talentPlanCreated: boolean,
  modules: TalentPlanModuleAvailability,
  section: TalentPlanSection,
  matrixTab: TalentMatrixTab
): TalentPlanSectionMode => {
  if (section === '培养目标') return hasTalentPlanModule(talentPlanCreated, modules, 'goals') ? 'goals-data' : 'goals-empty'
  if (section === '毕业要求') return hasTalentPlanModule(talentPlanCreated, modules, 'requirements') ? 'requirements-data' : 'requirements-empty'
  if (section === '课程管理') return hasTalentPlanModule(talentPlanCreated, modules, 'courses') ? 'courses-data' : 'courses-empty'
  if (section === '学生管理') return 'students-empty'
  if (matrixTab === 'courseRequirement') return 'matrix-course-empty'
  return hasTalentPlanModule(talentPlanCreated, modules, 'goalRequirementMatrix')
    ? 'matrix-goal-data'
    : 'matrix-goal-empty'
}
```

在 `src/App.vue` 增加真实消费该函数的 computed：

```ts
const activeTalentSectionMode = computed(() =>
  resolveTalentPlanSectionMode(
    talentPlanCreated.value,
    talentPlanModules.value,
    activeTalentSection.value as TalentPlanSection,
    activeTalentMatrixTab.value
  )
)
```

Task 3 中仅用于模板直接判断的 `talentModuleAvailable` helper 此时删除；页面分支统一消费 `activeTalentSectionMode`，避免纯函数测试与模板条件形成两套逻辑。

删除当前仅由 `!talentPlanCreated` 控制的通用空状态。保持 `activeTalentSubsystem` 的分支优先级不变，在方案建设内容区使用下列判定：

```vue
<template v-else>
  <section
    v-if="activeTalentSectionMode === 'goals-empty'"
    class="talent-plan-empty-page"
  >
    <div class="empty-state talent-section-empty-state">
      <div class="empty-illustration" aria-hidden="true">
        <div class="hill"></div><div class="box"></div><div class="plane">➤</div>
        <div class="tree tree-left"></div><div class="tree tree-right"></div>
      </div>
      <div class="talent-empty-actions">
        <button type="button" class="talent-empty-secondary" @click="openTalentImportDialog">✦ 智能导入</button>
        <button type="button" class="talent-empty-primary" @click="openCultivateGoalDialog('培养目标')">＋ 创建培养目标</button>
      </div>
    </div>
  </section>

  <section
    v-else-if="activeTalentSectionMode === 'requirements-empty'"
    class="talent-plan-empty-page"
  >
    <div class="empty-state talent-section-empty-state">
      <div class="empty-illustration" aria-hidden="true">
        <div class="hill"></div><div class="box"></div><div class="plane">➤</div>
        <div class="tree tree-left"></div><div class="tree tree-right"></div>
      </div>
      <div class="talent-empty-actions">
        <button type="button" class="talent-empty-secondary" @click="openTalentImportDialog">✦ 智能导入</button>
        <button type="button" class="talent-empty-primary" @click="openCultivateGoalDialog('毕业要求')">＋ 创建毕业要求</button>
      </div>
    </div>
  </section>

  <section
    v-else-if="activeTalentSectionMode === 'courses-empty'"
    class="talent-empty-course-page"
  >
    <header class="talent-course-empty-header">
      <div class="talent-course-empty-tabs"><strong>全部教务课程(0)</strong><span>按课程类型</span><span>按开课学期</span></div>
      <div class="talent-course-empty-actions"><button type="button" @click="openTalentImportDialog">✦ 智能导入</button><button type="button">▣ 批量分配课程成员</button><button type="button">▣ 批量导入</button><button type="button">＋ 添加课程</button></div>
    </header>
    <div class="course-toolbar talent-empty-course-toolbar"><label>⌕ <input placeholder="搜索课程名称/代码/ID" /></label><button>搜索</button><button>课程类型　全部⌄</button><button>开课学期　全部⌄</button><button class="clear-filter">清空</button></div>
    <div class="course-table-wrap talent-empty-table-wrap">
      <table class="course-table"><thead><tr><th>□</th><th>课程代码</th><th>课程名称</th><th>关联的AI课</th><th>课程团队</th><th>课程学分</th><th>课程类型</th><th>开课学期</th><th>课程目标</th><th>操作</th></tr></thead><tbody><tr><td colspan="10" class="talent-empty-table-cell">暂无数据</td></tr></tbody></table>
    </div>
    <div class="talent-empty-pagination"><button disabled>‹</button><button class="active">1</button><button disabled>›</button><span>◎　跳至</span><input value="1" readonly /><span>页</span></div>
  </section>

  <section v-else-if="activeTalentSection === '支撑矩阵'" class="talent-empty-matrix-page">
    <header class="talent-matrix-empty-header">
      <div>
        <button :class="{ active: activeTalentMatrixTab === 'goalRequirement' }" @click="activeTalentMatrixTab = 'goalRequirement'">培养目标与毕业要求支撑矩阵</button>
        <button :class="{ active: activeTalentMatrixTab === 'courseRequirement' }" @click="activeTalentMatrixTab = 'courseRequirement'">课程与毕业要求支撑矩阵</button>
      </div>
      <button type="button" @click="openTalentImportDialog">✦ 智能导入</button>
    </header>
    <div
      v-if="activeTalentSectionMode === 'matrix-goal-empty'"
      class="empty-state talent-matrix-empty-state"
    >
      <div class="empty-illustration" aria-hidden="true"><div class="hill"></div><div class="box"></div><div class="plane">➤</div><div class="tree tree-left"></div><div class="tree tree-right"></div></div>
      <p>请添加培养目标和毕业要求<br />然后设置支撑体系</p>
    </div>
    <div v-else-if="activeTalentSectionMode === 'matrix-course-empty'" class="empty-state talent-matrix-empty-state">
      <div class="empty-illustration" aria-hidden="true"><div class="hill"></div><div class="box"></div><div class="plane">➤</div><div class="tree tree-left"></div><div class="tree tree-right"></div></div>
      <p>请添加课程和毕业要求<br />然后设置支撑体系</p>
    </div>
    <div v-else class="talent-section-body full">
      <div class="matrix-title"><strong>培养目标与毕业要求支撑矩阵</strong><span>勾选表示该毕业要求对培养目标形成直接或重要支撑</span></div>
      <table class="talent-table talent-matrix-table">
        <thead><tr><th>毕业要求 \ 培养目标</th><th v-for="goal in matrixGoals" :key="goal">目标{{ goal }}</th></tr></thead>
        <tbody><tr v-for="row in matrixRows" :key="row.code"><th><strong>{{ row.label }}</strong><span>{{ row.title }}</span></th><td v-for="goal in matrixGoals" :key="`${row.code}-${goal}`"><span v-if="row.goals.includes(goal)" class="matrix-check">✓</span></td></tr></tbody>
      </table>
    </div>
  </section>

  <section v-else-if="activeTalentSection === '学生管理'" class="talent-empty-student-page">
    <h2>2026级全部学生(0)</h2>
    <div class="student-search"><label>⌕ <input placeholder="搜索学生姓名/学号" /></label><button>搜索</button></div>
    <div class="course-table-wrap talent-empty-table-wrap"><table class="course-table"><thead><tr><th>学生姓名</th><th>学号</th><th>入学年份</th><th>所属院系</th><th>所修专业</th><th>已修学分/应修学分/总学分</th></tr></thead><tbody><tr><td colspan="6" class="talent-empty-table-cell">暂无数据</td></tr></tbody></table></div>
    <div class="talent-empty-pagination"><button disabled>‹</button><button class="active">1</button><button disabled>›</button><span>◎　跳至</span><input value="1" readonly /><span>页</span></div>
  </section>

</template>
```

培养目标、毕业要求和课程的有数据分支直接复用当前 `.talent-plan-page` 内对应 section，不复制 mock 文本。把当前统一的 panel header 移入三个有数据分支，确保空状态截图不出现“编辑”头部。矩阵使用上面的完整页签分支：`goalRequirementMatrix` 可用时展示既有 11 × 8 表；课程矩阵由于仓库没有关系数据，即使导入时勾选该模块也显示“请添加课程和毕业要求，然后设置支撑体系”，不得虚构关系。学生分支始终使用上面的 0 人表格。

- [ ] **Step 4: 保证部分导入后每个模块独立显示**

逐项验证模板条件：

- `goals` 仅控制培养目标。
- `requirements` 仅控制毕业要求。
- `courses` 仅控制课程管理。
- `goalRequirementMatrix` 仅控制目标—毕业要求矩阵。
- `courseRequirementMatrix` 仅控制课程—毕业要求矩阵。
- 学生管理不读取任何导入 key。
- `talentPlanCreated === false` 时，所有 `talentModuleAvailable` 均为 false；无额外通用空状态抢占模块页面。

- [ ] **Step 5: 运行定向测试与构建**

Run:

```bash
node --test --test-name-pattern="section mode" tests/talent-plan-import.test.mjs
npm run build
```

Expected: 契约测试 PASS；Vue 模板编译和类型检查通过。

- [ ] **Step 6: 提交五类 Vue 空状态**

```bash
git add src/app/talent-plan-import.ts src/App.vue tests/talent-plan-import.test.mjs
git commit -m "feat: add talent plan module empty states"
```

---

## Task 5: 镜像 `file://` 静态入口行为

**Files:**

- Modify: `index.html`
- Modify: `tests/results-portal.test.mjs`

- [ ] **Step 1: 写静态入口核心交互的失败测试**

扩展现有 `static file talent sidebar runtime transitions keep one current page and active group` VM 测试，不读取源码 token，而是通过已经注册的 delegated event handler 操作真实静态脚本。让 `app.appendChild(node)` 保存最后加入的 dialog，让 stub 同时捕获 `change` handler；为测试 helper 增加 `change(selector, files)`。在原有导航断言后增加：

```js
click('[data-manual-cultivate-entry]')
assert.match(app.innerHTML, /培养目标概述/)

click('[data-reset-talent-plan]')
assert.match(app.innerHTML, /创建培养目标/)
assert.match(app.innerHTML, /data-reset-talent-plan[^>]*disabled/)

for (const [label, expected] of [
  ['培养目标', /创建培养目标/],
  ['毕业要求', /创建毕业要求/],
  ['课程管理', /全部教务课程\(0\)[\s\S]*暂无数据/],
  ['支撑矩阵', /请添加培养目标和毕业要求[\s\S]*然后设置支撑体系/],
  ['学生管理', /2026级全部学生\(0\)[\s\S]*暂无数据/]
]) {
  click('[data-talent-section]', { talentSection: label })
  assert.match(app.innerHTML, expected)
}

click('[data-talent-section]', { talentSection: '培养目标' })
click('[data-open-talent-import]')
assert.match(app.lastAppended.innerHTML, /智能导入的培养方案内容将替换已填写内容/)
assert.match(app.lastAppended.innerHTML, /开始解析[^<]*<\/button>/)

change('[data-talent-import-file]', [{ name: '智能建造工程人才培养方案.pdf' }])
click('[data-start-talent-parse]')
assert.match(app.lastAppended.innerHTML, /解析成功！请选择需要导入的模块/)
assert.match(app.lastAppended.innerHTML, /扎根辽西、服务辽宁/)
assert.doesNotMatch(app.lastAppended.innerHTML, /新能源汽车工程技术/)

click('[data-toggle-talent-import-module]', { toggleTalentImportModule: 'requirements' })
click('[data-confirm-talent-import]')
click('[data-talent-section]', { talentSection: '毕业要求' })
assert.match(app.innerHTML, /创建毕业要求/)
```

`app.lastAppended` 和 `change` 必须驱动静态脚本真实保存的 dialog/state，不允许把预期 HTML 直接塞进 stub。复用当前 harness，不另建第二套 DOM 模拟器。

- [ ] **Step 2: 运行定向测试并确认红灯**

Run:

```bash
node --test --test-name-pattern="static file talent sidebar runtime" tests/results-portal.test.mjs
```

Expected: FAIL，手工创建后重置点击不会进入模块化空状态，或导入 dialog 未被追加；不是源码 token 匹配失败。

- [ ] **Step 3: 增加静态状态和纯辅助函数**

在 `index.html` 现有静态人才方案变量附近增加：

```js
const staticTalentImportModuleKeys = [
  'goals',
  'requirements',
  'courses',
  'goalRequirementMatrix',
  'courseRequirementMatrix'
]
let staticTalentPlanCreated = false
let staticTalentPlanModules = Object.fromEntries(staticTalentImportModuleKeys.map((key) => [key, false]))
let staticTalentImportState = createStaticTalentImportState()
let staticTalentMatrixTab = 'goalRequirement'

function createStaticTalentImportState() {
  return {
    stage: 'upload',
    fileName: '',
    fileError: '',
    activeModule: 'goals',
    selectedModules: [...staticTalentImportModuleKeys]
  }
}

function staticTalentModuleAvailable(key) {
  return staticTalentPlanCreated && Boolean(staticTalentPlanModules[key])
}

function resetStaticTalentPlan() {
  staticTalentPlanCreated = false
  staticTalentPlanModules = Object.fromEntries(staticTalentImportModuleKeys.map((key) => [key, false]))
  staticTalentImportState = createStaticTalentImportState()
  staticTalentMatrixTab = 'goalRequirement'
  renderTalent('培养目标')
}

function applyStaticTalentImport() {
  staticTalentPlanCreated = true
  staticTalentPlanModules = Object.fromEntries(
    staticTalentImportModuleKeys.map((key) => [key, staticTalentImportState.selectedModules.includes(key)])
  )
  staticTalentImportState = createStaticTalentImportState()
  staticTalentMatrixTab = 'goalRequirement'
  closeStaticTalentImportDialog()
  renderTalent('培养目标')
}
```

静态手工创建路径必须设置：

```js
staticTalentPlanCreated = true
staticTalentPlanModules = {
  goals: true,
  requirements: true,
  courses: true,
  goalRequirementMatrix: true,
  courseRequirementMatrix: false
}
```

- [ ] **Step 4: 拆分静态空状态 HTML 渲染器**

为 `renderTalent(section)` 增加五个明确的渲染函数：

```js
function staticTalentIllustrationHtml() {
  return '<div class="empty-illustration" aria-hidden="true"><div class="hill"></div><div class="box"></div><div class="plane">➤</div><div class="tree tree-left"></div><div class="tree tree-right"></div></div>'
}

function staticGoalEmptyHtml(target) {
  return `<section class="talent-plan-empty-page"><div class="empty-state talent-section-empty-state">${staticTalentIllustrationHtml()}<div class="talent-empty-actions"><button type="button" class="talent-empty-secondary" data-open-talent-import>✦ 智能导入</button><button type="button" class="talent-empty-primary" data-create-talent-target="${target}">＋ 创建${target}</button></div></div></section>`
}

function staticMatrixEmptyHtml() {
  const isGoalMatrix = staticTalentMatrixTab === 'goalRequirement'
  const message = isGoalMatrix
    ? '请添加培养目标和毕业要求<br>然后设置支撑体系'
    : '请添加课程和毕业要求<br>然后设置支撑体系'
  return `<section class="talent-empty-matrix-page"><header class="talent-matrix-empty-header"><div><button class="${isGoalMatrix ? 'active' : ''}" data-static-talent-matrix-tab="goalRequirement">培养目标与毕业要求支撑矩阵</button><button class="${isGoalMatrix ? '' : 'active'}" data-static-talent-matrix-tab="courseRequirement">课程与毕业要求支撑矩阵</button></div><button type="button" data-open-talent-import>✦ 智能导入</button></header><div class="empty-state talent-matrix-empty-state">${staticTalentIllustrationHtml()}<p>${message}</p></div></section>`
}
```

课程和学生空表格必须复制 Task 4 的表头、`暂无数据` 与单页分页文本；不要渲染已有数据行。`renderTalent` 根据当前 section 与模块 key 选择空渲染器或现有 `talentPlanDemoHtml` 的对应 section。统一 click 分发处理 `data-static-talent-matrix-tab`：更新 `staticTalentMatrixTab` 后重渲染支撑矩阵；目标矩阵只有在 `goalRequirementMatrix` 可用时显示已有表，课程矩阵始终显示仓库无关系数据的空提示。静态侧栏底部加入：

```html
<div class="talent-sidebar-footer">
  <button type="button" class="talent-reset-button" data-reset-talent-plan disabled>
    <span aria-hidden="true">↻</span> 空状态重置
  </button>
</div>
```

每次 `renderTalent` 后用 `staticTalentPlanCreated` 同步 `disabled` 属性。

- [ ] **Step 5: 实现静态上传和结果弹窗**

实现单一 `renderStaticTalentImportDialog()`：

- 上传态 HTML 的 class、文案、accept 和 data attribute 与 Vue 组件一致。
- `change`/`drop` 只保留支持的文件名；不支持格式写入 `.talent-import-file-error` 并禁用解析。
- `data-start-talent-parse` 将 stage 设为 `review` 后原位重渲染弹窗。
- 结果态左列 5 个条目，点击 `data-talent-import-module` 更新 active；复选框使用 `data-toggle-talent-import-module` 更新 selection。
- 右预览使用 `staticTalentGoalOverview`、`staticTalentGoals`、现有毕业要求、课程和矩阵静态数据；课程—毕业要求矩阵显示空文案。
- `data-reparse-talent-import` 重置 state 并回上传态；`data-confirm-talent-import` 调用 `applyStaticTalentImport()`；零选择时设置 `disabled`。
- 关闭遮罩或右上角关闭按钮仅移除弹窗，不改变 `staticTalentPlanModules`。

在现有统一 click/change 事件分发中加入这些 data attribute，避免给每次重渲染后的节点单独绑定监听器。

- [ ] **Step 6: 运行静态行为测试、完整测试与构建**

Run:

```bash
node --test --test-name-pattern="static file talent sidebar runtime" tests/results-portal.test.mjs
npm test
npm run build
```

Expected: 静态定向测试、完整 Node 测试与生产构建全部 PASS。

- [ ] **Step 7: 提交静态入口镜像**

```bash
git add index.html tests/results-portal.test.mjs
git commit -m "feat: mirror talent plan import in static demo"
```

---

## Task 6: 对齐 demo 视觉、响应式和交互状态

**Files:**

- Modify: `src/styles/20-talent.css`
- Modify: `src/styles/50-dialogs.css`
- Modify: `src/styles/60-portrait.css`
- Modify: `src/styles/70-course-engine.css`

- [ ] **Step 1: 记录浏览器中的失败视觉基线**

完整阅读 `browser:control-in-app-browser` 指令，启动本地 Vite，并在 1920 × 999 视口打开已实现的培养目标空状态、课程空状态、上传弹窗和结果弹窗。保存实现 CSS 前的截图，并通过浏览器 DOM/计算样式检查下列目标：

- 重置按钮宽 128px、圆角 8px，位于 176px 侧栏底部。
- 上传弹窗在该视口宽 516px，不超过 `100vw - 32px`。
- 结果弹窗在该视口约 1118 × 750px，不超过 `100vw - 48px` / `100vh - 48px`。
- 空状态主操作居中；课程/学生表头和分页没有溢出。
- focus-visible 与 disabled 状态肉眼和计算样式均可区分。

- [ ] **Step 2: 确认视觉基线确实为红灯**

Expected: 至少一个新增界面尚未达到上述几何/布局目标；在 task report 中记录真实测量值和截图路径。若全部已经满足，说明当前 task 没有必要的 CSS 变更，应停止并向 controller 报告，而不是制造样式改动。

- [ ] **Step 3: 实现侧栏与五类空状态样式**

在 `src/styles/20-talent.css` 和最贴近现有规则的页面样式文件中加入以下几何约束；颜色优先使用项目已有 CSS 变量，没有同义变量时使用当前人才方案页面已经存在的色值：

```css
.section-menu.talent-module-menu.talent-figma-menu {
  position: relative;
  display: flex;
  flex-direction: column;
}

.talent-sidebar-footer {
  margin-top: auto;
  padding: 16px 24px 18px;
}

.talent-reset-button {
  width: 128px;
  min-height: 32px;
  border: 1px solid #b9c9ee;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
  color: #58709f;
  cursor: pointer;
}

.talent-reset-button:hover:not(:disabled) { border-color: #5677ff; color: #3458d4; background: #fff; }
.talent-reset-button:focus-visible { outline: 2px solid #5677ff; outline-offset: 2px; }
.talent-reset-button:disabled { opacity: 0.48; cursor: not-allowed; }

.talent-plan-empty-page,
.talent-empty-matrix-page,
.talent-empty-student-page {
  min-height: 100%;
  background: #fff;
  border-radius: 8px;
}

.talent-section-empty-state { min-height: calc(100vh - 84px); }
.talent-empty-actions { display: flex; gap: 12px; justify-content: center; margin-top: 18px; }
.talent-empty-secondary,
.talent-empty-primary { min-height: 36px; padding: 0 20px; border-radius: 6px; font-weight: 600; }
.talent-empty-secondary { border: 1px solid #6e79ff; background: #fff; color: #646cf5; }
.talent-empty-primary { border: 1px solid #4564ff; background: #4564ff; color: #fff; }

.talent-empty-course-page { padding: 16px 24px 24px; background: #fff; border-radius: 8px; }
.talent-course-empty-header,
.talent-matrix-empty-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.talent-empty-table-cell { height: 60px; text-align: center; color: #a1a8b7; }
.talent-empty-pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 12px 0 4px; }
.talent-empty-pagination input { width: 40px; height: 30px; text-align: center; border: 1px solid #dbe2ef; border-radius: 6px; }
.talent-matrix-empty-state { min-height: calc(100vh - 148px); }
.talent-matrix-empty-state p { color: #9aa3b4; line-height: 1.5; text-align: center; }
```

- [ ] **Step 4: 实现上传与结果弹窗样式**

在 `src/styles/50-dialogs.css` 加入：

```css
.talent-import-backdrop { z-index: 1200; background: rgba(20, 28, 45, 0.42); }

.talent-import-dialog {
  width: min(516px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(29, 43, 73, 0.22);
}

.talent-import-dialog.is-review {
  width: min(1118px, calc(100vw - 48px));
  height: min(750px, calc(100vh - 48px));
  display: grid;
  grid-template-rows: 56px minmax(0, 1fr) 72px;
}

.talent-import-header { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 36px; border-bottom: 1px solid #e8edf5; }
.talent-import-close { width: 32px; height: 32px; border: 0; background: transparent; color: #49618e; font-size: 22px; cursor: pointer; }
.talent-import-warning { margin: 16px 36px 8px; padding: 5px 12px; border: 1px solid #ffc18e; border-radius: 6px; background: #fff3e9; color: #ef721f; text-align: center; }
.talent-import-dropzone { min-height: 204px; margin: 8px 36px; border: 1px dashed #7b91ee; border-radius: 8px; background: #f0f3ff; display: grid; place-items: center; text-align: center; cursor: pointer; }
.talent-import-dropzone:focus-visible { outline: 2px solid #5677ff; outline-offset: 3px; }
.talent-import-file-error { min-height: 20px; margin: 4px 36px 0; color: #e25252; font-size: 13px; }
.talent-import-upload-footer { display: flex; justify-content: center; padding: 16px 36px 24px; border-top: 1px solid #edf0f5; }

.talent-import-review-main { min-height: 0; padding: 14px 36px 8px; background: #f1fbf6; }
.talent-import-success { display: flex; align-items: center; gap: 8px; height: 30px; color: #2eae71; font-weight: 600; }
.talent-import-review-body { height: calc(100% - 30px); display: grid; grid-template-columns: 192px minmax(0, 1fr); gap: 16px; }
.talent-import-module-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
.talent-import-module-card { min-height: 52px; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 10px 12px 10px 16px; border: 1px solid #dce7ec; border-radius: 8px; background: #fff; color: #18355f; text-align: left; cursor: pointer; }
.talent-import-module-card.active { border-color: #4e79ff; background: #e7f0ff; }
.talent-import-preview { min-width: 0; overflow: auto; padding: 16px; background: #fff; }
.talent-import-preview-table { width: 100%; border-collapse: collapse; }
.talent-import-preview-table th,
.talent-import-preview-table td { padding: 12px; border: 1px solid #e3e9f2; color: #4d5667; text-align: left; }
.talent-import-footer { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 20px; padding: 0 36px; border-top: 1px solid #dfe8e4; background: #fff; }
.talent-import-selection-summary { overflow: hidden; color: #7084ad; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.talent-import-footer-actions { display: flex; gap: 12px; }
.talent-import-reparse,
.talent-import-confirm { min-height: 34px; padding: 0 20px; border-radius: 6px; }
.talent-import-confirm { border: 1px solid #4564ff; background: #4564ff; color: #fff; }
.talent-import-confirm:disabled { opacity: 0.48; cursor: not-allowed; }
```

补充 `@media (max-width: 1180px)`：结果弹窗左右栏调整为 `168px minmax(0, 1fr)`、横向 padding 20px；footer summary 允许两行。补充 `@media (prefers-reduced-motion: reduce)` 覆盖新增 hover/弹窗过渡。不得改变 1920 × 999 下的目标尺寸。

- [ ] **Step 5: 运行构建并验证浏览器计算样式**

Run:

```bash
npm test
npm run build
```

Expected: 全部 PASS；CSS bundle 中不存在未知 import 或构建警告升级为错误。回到同一 1920 × 999 浏览器状态，确认 Step 1 的尺寸目标逐项达成，并保存 CSS 后截图。该截图只证明目标状态，Task 7 仍需把它与用户参考图合并比较。

- [ ] **Step 6: 提交视觉样式**

```bash
git add src/styles/20-talent.css src/styles/50-dialogs.css src/styles/60-portrait.css src/styles/70-course-engine.css
git commit -m "style: align talent plan empty and import states"
```

---

## Task 7: 浏览器主路径、视觉 QA 与最终验证

**Files:**

- Create: `design-qa.md`
- Modify if defects are found: `src/App.vue`
- Modify if defects are found: `src/components/TalentPlanImportDialog.vue`
- Modify if defects are found: `src/styles/20-talent.css`
- Modify if defects are found: `src/styles/50-dialogs.css`
- Modify if defects are found: `src/styles/60-portrait.css`
- Modify if defects are found: `src/styles/70-course-engine.css`
- Modify if defects are found: `index.html`
- Modify if defects are found: `tests/talent-plan-import.test.mjs`
- Modify if defects are found: `tests/talent-plan-import-dialog.test.mjs`
- Modify if defects are found: `tests/results-portal.test.mjs`

- [ ] **Step 1: 加载浏览器控制与 design QA 技能说明**

完整阅读 `browser:control-in-app-browser` 和 `product-design:image-to-code` 指定的 `design-qa` 指令；按技能要求启动本地 Vite 服务并使用应用内浏览器，不用外部 Chrome 代替。

- [ ] **Step 2: 启动本地预览并检查控制台**

Run:

```bash
npm run dev -- --port 4173
```

Expected: Vite 输出 `http://localhost:4173/`。保持该 session 运行，应用内浏览器打开该地址，设置视口为 1920 × 999，确认控制台无新增 error。

- [ ] **Step 3: 逐状态验证 Vue 主入口**

按固定顺序操作并截图：

1. 进入人才方案已有数据页，确认侧栏底部重置按钮可用。
2. 点击“空状态重置”，确认回到培养目标，按钮变为禁用。
3. 依次进入培养目标、毕业要求、课程管理、支撑矩阵、学生管理，分别核对操作区、表头、空文案和分页。
4. 从培养目标点击“智能导入”，确认 516px 上传弹窗、警告、格式说明和禁用的“开始解析”。
5. 选择一个支持格式的本地小文件；确认只展示文件名且不产生网络请求。
6. 点击“开始解析”，确认 1118 × 750 结果弹窗和五个默认勾选模块。
7. 切换五个预览，核对 11 个目标、8 组/30 指标、74 门课程、11 × 8 矩阵和课程矩阵空提示。
8. 取消全部勾选，确认按钮禁用；恢复两个模块，确认 footer 汇总准确。
9. 点击“重新解析”，确认回到干净上传态。
10. 再次解析并只勾选培养目标与课程，点击确认；确认目标和课程有数据、毕业要求和两个矩阵为空、学生仍为 0。

- [ ] **Step 4: 验证 `file://` 静态入口**

直接打开构建前根目录 `index.html`（保持项目当前 static fallback 方式），重复步骤 2、4、6、7、8、9、10。检查静态入口不出现模块计数、按钮文案或状态提交差异。

- [ ] **Step 5: 生成并审查视觉对比图**

为以下状态各取一张本地截图，并与用户对应参考图按相同画布并排组合：

- 培养目标空状态。
- 课程管理空状态。
- 支撑矩阵空状态。
- 智能导入上传态。
- 智能导入结果态（培养目标预览）。

使用 `view_image` 检查合成图，按 design QA 规则记录所有差异为 P0/P1/P2/P3。修复全部 P0/P1/P2；每次修复后重跑受影响的定向测试并重新截图。P3 仅在明确不会破坏 demo 一致性时修复。

- [ ] **Step 6: 写 `design-qa.md`**

文件必须包含：

```md
# 人才方案空状态与智能导入 Design QA

## 验证环境

- 视口：1920 × 999
- 入口：Vue/Vite 与 file:// 静态入口
- 参考：用户提供的空状态、上传态与解析结果截图

## 已验证状态

- 培养目标、毕业要求、课程管理、支撑矩阵、学生管理空状态
- 智能导入上传、格式错误、解析结果、模块切换、重新解析、部分确认
- Vue 与静态入口一致性

## 问题与修复

记录每个发现的问题、严重级别、修复文件和复验结果；没有问题的级别明确写“无”。

## 最终结论

P0/P1/P2 均为 0，主路径、视觉结构、控制台和两套入口复验通过。
```

- [ ] **Step 7: 运行最终验证**

Run:

```bash
npm test
npm run build
git diff --check
git status --short
```

Expected:

- `npm test`: 全部 tests PASS。
- `npm run build`: `vue-tsc`、Vite 与 Sites worker 构建成功。
- `git diff --check`: 无输出，退出码 0。
- `git status --short`: 只包含本任务有意修改的文件；工作区上层原有未跟踪目录保持原样。

- [ ] **Step 8: 提交 QA 记录和必要修复**

```bash
git add design-qa.md src/App.vue src/components/TalentPlanImportDialog.vue src/app/talent-plan-import.ts src/styles/20-talent.css src/styles/50-dialogs.css src/styles/60-portrait.css src/styles/70-course-engine.css index.html tests/talent-plan-import.test.mjs tests/talent-plan-import-dialog.test.mjs tests/results-portal.test.mjs
git commit -m "test: verify talent plan reset and smart import"
```

如果 Task 7 没有代码修复，提交中只包含 `design-qa.md`；不要制造无意义代码改动。

---

## Final Acceptance Checklist

- [ ] 红色箭头标注区域出现 128px 宽“空状态重置”，有数据时可用、空状态时禁用。
- [ ] 一次点击原子清空五个方案模块、关闭相关弹窗并回到培养目标。
- [ ] 五个页面分别呈现用户截图中的信息结构，不被一个通用空页覆盖。
- [ ] 任一“智能导入”入口直接打开上传态；格式、错误、禁用状态和拖放均可操作。
- [ ] 解析结果五模块可独立预览和勾选；重新解析与零选择禁用正确。
- [ ] 部分确认后只有已选模块恢复智能建造工程数据，未选模块保持为空。
- [ ] 学生管理始终为 0 人表格，不进入导入模块。
- [ ] 页面不存在新能源汽车工程文案，不发送解析网络请求，不写持久化。
- [ ] Vue/Vite 与 `file://` 静态入口行为一致。
- [ ] 定向测试、全量测试、生产构建、`git diff --check` 与 1920 × 999 视觉 QA 全部通过。
