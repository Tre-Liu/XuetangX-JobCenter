<script lang="ts">
const TALENT_IMPORT_DIALOG_FOCUSABLE = [
  'a[href]:not([hidden])',
  'button:not([disabled]):not([hidden])',
  'input:not([disabled]):not([hidden]):not([type="hidden"])',
  'select:not([disabled]):not([hidden])',
  'textarea:not([disabled]):not([hidden])',
  '[tabindex]:not([tabindex="-1"]):not([hidden])'
].join(', ')

const isFocusTarget = (value: unknown): value is HTMLElement =>
  Boolean(value && typeof (value as HTMLElement).focus === 'function')

export const createTalentImportDialogFocusController = (
  getActiveElement: () => Element | null = () =>
    typeof document === 'undefined' ? null : document.activeElement
) => {
  let returnFocus: HTMLElement | null = null

  const captureReturnFocus = (preferredTarget?: HTMLElement | null) => {
    const activeElement = getActiveElement()
    returnFocus = isFocusTarget(preferredTarget) && preferredTarget.isConnected
      ? preferredTarget
      : isFocusTarget(activeElement)
        ? activeElement
        : null
  }

  const focusInitial = (closeButton?: HTMLElement | null) => {
    closeButton?.focus({ preventScroll: true })
  }

  const focusAfterUpdate = (
    schedule: (callback: () => void) => unknown,
    getDialog: () => HTMLElement | null,
    getFallback: () => HTMLElement | null
  ) => {
    schedule(() => {
      const dialog = getDialog()
      const activeElement = getActiveElement()
      if (!dialog || (activeElement && dialog.contains(activeElement))) return
      getFallback()?.focus({ preventScroll: true })
    })
  }

  const restoreReturnFocus = () => {
    const target = returnFocus
    returnFocus = null
    if (target?.isConnected !== false) target?.focus({ preventScroll: true })
  }

  const handleKeydown = (
    event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'preventDefault'>,
    dialog: HTMLElement | null,
    close: () => void
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key !== 'Tab' || !dialog) return

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(TALENT_IMPORT_DIALOG_FOCUSABLE)
    )
    if (focusable.length === 0) {
      event.preventDefault()
      dialog.focus({ preventScroll: true })
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const activeElement = getActiveElement()
    if (!activeElement || !dialog.contains(activeElement)) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus({ preventScroll: true })
    } else if (event.shiftKey && (activeElement === first || activeElement === dialog)) {
      event.preventDefault()
      last.focus({ preventScroll: true })
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault()
      first.focus({ preventScroll: true })
    }
  }

  return {
    captureReturnFocus,
    focusAfterUpdate,
    focusInitial,
    handleKeydown,
    restoreReturnFocus
  }
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  graduationOverview,
  graduationRequirements,
  matrixGoals,
  matrixRows,
  talentCourses,
  talentGoalOverview,
  talentGoals
} from '../app/talent-industry-data'
import {
  TALENT_IMPORT_MODULES,
  beginTalentImportReview,
  createTalentImportDialogState,
  selectTalentImportFile,
  selectTalentImportPreview,
  toggleTalentImportModule,
  type TalentImportDialogState,
  type TalentImportModuleKey
} from '../app/talent-plan-import'

const props = defineProps<{
  modelValue: TalentImportDialogState
  returnFocusTarget?: HTMLElement | null
}>()
const emit = defineEmits<{
  'update:modelValue': [value: TalentImportDialogState]
  close: []
  confirm: [selectedModules: TalentImportModuleKey[]]
}>()

const fileInput = ref<HTMLInputElement>()
const dialog = ref<HTMLElement>()
const closeButton = ref<HTMLButtonElement>()
const focusController = createTalentImportDialogFocusController()
const selectedModuleLabels = computed(() =>
  TALENT_IMPORT_MODULES
    .filter((module) => props.modelValue.selectedModules.includes(module.key))
    .map((module) => module.label)
)

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

const openFilePicker = () => fileInput.value?.click()
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
const closeDialog = () => emit('close')
const handleDialogKeydown = (event: KeyboardEvent) =>
  focusController.handleKeydown(event, dialog.value ?? null, closeDialog)

onMounted(() => {
  focusController.captureReturnFocus(props.returnFocusTarget)
  nextTick(() => focusController.focusInitial(closeButton.value))
})

watch(
  () => props.modelValue.stage,
  () => {
    focusController.focusAfterUpdate(
      (callback) => nextTick(callback),
      () => dialog.value ?? null,
      () => closeButton.value ?? null
    )
  }
)

onBeforeUnmount(() => {
  nextTick(() => focusController.restoreReturnFocus())
})
</script>

<template>
  <div class="dialog-backdrop talent-import-backdrop" @click.self="closeDialog">
    <section
      ref="dialog"
      class="talent-import-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="talent-import-title"
      tabindex="-1"
      @keydown="handleDialogKeydown"
    >
      <header class="talent-import-dialog-header">
        <div>
          <h2 id="talent-import-title">智能导入</h2>
          <p v-if="modelValue.stage === 'upload'">智能导入的培养方案内容将替换已填写内容</p>
        </div>
        <button ref="closeButton" type="button" class="talent-import-close" aria-label="关闭" @click="closeDialog">×</button>
      </header>

      <section v-if="modelValue.stage === 'upload'" class="talent-import-upload-stage">
        <input
          ref="fileInput"
          class="talent-import-file-input"
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          @change="handleFileInput"
        >
        <div
          class="talent-import-drop-zone"
          role="button"
          tabindex="0"
          @click="openFilePicker"
          @keydown.enter.prevent="openFilePicker"
          @keydown.space.prevent="openFilePicker"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <span class="talent-import-upload-icon" aria-hidden="true">⇧</span>
          <strong>点击上传或拖拽文件至此</strong>
          <strong class="talent-import-upload-assist">AI自动解析并输出规范化培养方案</strong>
          <span>pdf、doc、docx、jpg、jpeg、png 格式</span>
          <em v-if="modelValue.fileName" class="talent-import-file-name">{{ modelValue.fileName }}</em>
        </div>
        <p v-if="modelValue.fileError" class="talent-import-file-error" role="alert">
          {{ modelValue.fileError }}
        </p>
        <footer class="talent-import-upload-footer">
          <button
            type="button"
            class="talent-import-primary-action"
            :disabled="!modelValue.fileName || Boolean(modelValue.fileError)"
            @click="beginReview"
          >
            开始解析
          </button>
        </footer>
      </section>

      <section v-else class="talent-import-review-stage">
        <p class="talent-import-success">✓ 解析成功！请选择需要导入的模块：</p>
        <div class="talent-import-review-body">
          <aside class="talent-import-module-list" aria-label="可导入模块">
            <article
              v-for="module in TALENT_IMPORT_MODULES"
              :key="module.key"
              class="talent-import-module-card"
              :class="{ active: modelValue.activeModule === module.key }"
            >
              <button
                type="button"
                class="talent-import-preview-button"
                :aria-pressed="modelValue.activeModule === module.key"
                aria-controls="talent-import-preview-panel"
                @click="choosePreview(module.key)"
              >
                <strong>{{ module.label }}</strong>
                <span>{{ module.countLabel }}</span>
              </button>
              <input
                :id="`talent-import-${module.key}`"
                type="checkbox"
                :checked="modelValue.selectedModules.includes(module.key)"
                :aria-label="`选择${module.label}`"
                @change="toggleModule(module.key)"
              >
            </article>
          </aside>

          <section id="talent-import-preview-panel" class="talent-import-preview" aria-live="polite">
          <template v-if="modelValue.activeModule === 'goals'">
            <h3>培养目标概述</h3>
            <p class="talent-import-overview">{{ talentGoalOverview }}</p>
            <h3>培养目标</h3>
            <div class="talent-import-goal-list">
              <article v-for="(goal, index) in talentGoals" :key="goal" class="talent-import-goal-row">
                <strong>培养目标{{ index + 1 }}</strong>
                <span>{{ goal }}</span>
              </article>
            </div>
          </template>

          <template v-else-if="modelValue.activeModule === 'requirements'">
            <h3>毕业要求概述</h3>
            <p class="talent-import-overview">{{ graduationOverview }}</p>
            <h3>毕业要求</h3>
            <article v-for="requirement in graduationRequirements" :key="requirement.code" class="talent-import-requirement-group">
              <strong>{{ requirement.code }}</strong>
              <div class="talent-import-requirement-copy">
                <strong>{{ requirement.text }}</strong>
                <p v-for="child in requirement.children" :key="`${requirement.code}-${child}`">
                  {{ requirement.code }}.{{ requirement.children.indexOf(child) + 1 }} {{ child }}
                </p>
              </div>
            </article>
          </template>

          <template v-else-if="modelValue.activeModule === 'courses'">
            <header class="talent-import-preview-header">
              <h3>课程管理</h3>
              <span>共74门课程</span>
            </header>
            <table class="talent-import-course-table">
              <thead>
                <tr><th>序号</th><th>课程代码</th><th>课程名称</th><th>课程团队</th><th>课程学分</th><th>课程类型</th><th>开课学期</th></tr>
              </thead>
              <tbody>
                <tr v-for="(course, index) in talentCourses.slice(0, 12)" :key="course[0]">
                  <td>{{ index + 1 }}</td><td>{{ course[0] }}</td><td>{{ course[1] }}</td><td>{{ course[3] }}</td><td>{{ course[4] }}</td><td>{{ course[5] }}</td><td>{{ course[6] }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-else-if="modelValue.activeModule === 'goalRequirementMatrix'">
            <h3>培养目标与毕业要求支撑矩阵</h3>
            <table class="talent-import-matrix-table">
              <thead>
                <tr><th>毕业要求 \ 培养目标</th><th v-for="goal in matrixGoals" :key="goal">培养目标{{ goal }}</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in matrixRows" :key="row.code">
                  <th>{{ row.label }}</th>
                  <td v-for="goal in matrixGoals" :key="`${row.code}-${goal}`">{{ row.goals.includes(goal) ? '✓' : '' }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-else-if="modelValue.activeModule === 'courseRequirementMatrix'">
            <div class="talent-import-empty-preview">
              <div class="empty-illustration" aria-hidden="true">
                <div class="hill"></div>
                <div class="box">
                  <span class="box-face front"></span>
                  <span class="box-face side"></span>
                  <span class="box-face top"></span>
                </div>
                <div class="plane"></div>
                <span class="tree tree-left"></span>
                <span class="tree tree-mid"></span>
                <span class="tree tree-right"></span>
              </div>
              <p>请添加课程和毕业要求<br>然后设置支撑体系</p>
            </div>
          </template>
          </section>
        </div>
      </section>

      <footer v-if="modelValue.stage === 'review'" class="talent-import-review-footer">
        <span>已选择：{{ selectedModuleLabels.join('、') || '无' }}</span>
        <div>
          <button type="button" class="talent-import-secondary-action" @click="reparse">重新解析</button>
          <button
            type="button"
            class="talent-import-primary-action"
            :disabled="modelValue.selectedModules.length === 0"
            @click="confirmImport"
          >
            确认并导入（将替换已填写内容）
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>
