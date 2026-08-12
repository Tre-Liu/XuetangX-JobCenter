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
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true },
  appType: 'custom'
})
after(() => vite.close())

const {
  default: TalentPlanImportDialog,
  createTalentImportDialogFocusController
} = await vite.ssrLoadModule(
  '/src/components/TalentPlanImportDialog.vue'
)

const renderDialog = (modelValue) =>
  renderToString(createSSRApp(TalentPlanImportDialog, { modelValue }))

test('upload stage renders warning, accepted formats and disabled parse action', async () => {
  const html = await renderDialog(createTalentImportDialogState())
  assert.match(html, /<h2[^>]*>智能导入<\/h2>/)
  assert.match(html, /智能导入的培养方案内容将替换已填写内容/)
  assert.match(html, /点击上传或拖拽文件至此/)
  assert.match(html, /AI自动解析并输出规范化培养方案/)
  assert.match(html, /pdf、doc、docx、jpg、jpeg、png/)
  assert.match(html, /开始解析/)
  assert.match(html, /disabled/)
})

test('review stage renders all five modules and current intelligent construction data', async () => {
  const review = beginTalentImportReview(
    selectTalentImportFile(createTalentImportDialogState(), '智能建造工程人才培养方案.pdf')
  )
  const html = await renderDialog(review)
  assert.match(html, /解析成功！请选择需要导入的模块/)
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
  assert.match(html, /<h3>培养目标<\/h3>/)
  assert.match(html, /培养目标1/)
  assert.match(html, /扎根辽西、服务辽宁/)
  assert.match(html, /确认并导入（将替换已填写内容）/)
  assert.doesNotMatch(html, /新能源汽车工程技术/)
})

test('review module cards expose preview buttons and checkboxes as sibling controls', async () => {
  const review = beginTalentImportReview(
    selectTalentImportFile(createTalentImportDialogState(), '智能建造工程人才培养方案.pdf')
  )
  const html = await renderDialog(review)
  const cards = [...html.matchAll(/<article class="([^"]*)">([\s\S]*?)<\/article>/g)]
    .filter(([, classNames]) => classNames.split(' ').includes('talent-import-module-card'))

  assert.equal(cards.length, 5)
  for (const [, , contents] of cards) {
    assert.match(contents, /^<button type="button" class="talent-import-preview-button"[^>]*>/)
    assert.match(contents, /<\/button><input[^>]+type="checkbox"[^>]+aria-label="选择[^\"]+"/)
    assert.doesNotMatch(contents, /role="button"|tabindex="0"|<label/)
  }
})

const createFocusFixture = () => {
  let activeElement
  let prevented = 0
  const focusTarget = (name) => {
    const target = {
      name,
      isConnected: true,
      focus: () => {
        activeElement = target
      }
    }
    return target
  }
  const trigger = focusTarget('trigger')
  const closeButton = focusTarget('close')
  const finalButton = focusTarget('confirm')
  const dialog = {
    focus: () => {
      activeElement = dialog
    },
    contains: (target) => target === dialog || target === closeButton || target === finalButton,
    querySelectorAll: () => [closeButton, finalButton]
  }
  const keyEvent = (key, shiftKey = false) => ({
    key,
    shiftKey,
    preventDefault: () => {
      prevented += 1
    }
  })

  activeElement = trigger
  return {
    closeButton,
    dialog,
    finalButton,
    getActiveElement: () => activeElement,
    getPreventedCount: () => prevented,
    keyEvent,
    trigger
  }
}

test('focus controller captures and restores the direct import trigger', () => {
  assert.equal(typeof createTalentImportDialogFocusController, 'function')
  const fixture = createFocusFixture()
  const controller = createTalentImportDialogFocusController(fixture.getActiveElement)

  controller.captureReturnFocus()
  controller.focusInitial(fixture.closeButton)
  assert.equal(fixture.getActiveElement(), fixture.closeButton)

  controller.restoreReturnFocus()
  assert.equal(fixture.getActiveElement(), fixture.trigger)
})

test('focus controller restores the persistent origin after a chained import trigger detaches', () => {
  let activeElement
  const focusTarget = (name, isConnected = true) => {
    const target = {
      name,
      isConnected,
      focus: () => {
        activeElement = target
      }
    }
    return target
  }
  const persistentOrigin = focusTarget('persistent-origin')
  const chainedImportTrigger = focusTarget('chained-import-trigger', false)
  activeElement = chainedImportTrigger
  const controller = createTalentImportDialogFocusController(() => activeElement)

  controller.captureReturnFocus(persistentOrigin)
  controller.restoreReturnFocus()

  assert.equal(activeElement, persistentOrigin)
})

test('focus controller wraps Tab and Shift+Tab inside the dialog', () => {
  assert.equal(typeof createTalentImportDialogFocusController, 'function')
  const fixture = createFocusFixture()
  const controller = createTalentImportDialogFocusController(fixture.getActiveElement)

  fixture.closeButton.focus()
  controller.handleKeydown(fixture.keyEvent('Tab', true), fixture.dialog, () => {})
  assert.equal(fixture.getActiveElement(), fixture.finalButton)

  controller.handleKeydown(fixture.keyEvent('Tab'), fixture.dialog, () => {})
  assert.equal(fixture.getActiveElement(), fixture.closeButton)
  assert.equal(fixture.getPreventedCount(), 2)
})

test('focus controller restores focus inside after a stage update removes the active control', () => {
  const fixture = createFocusFixture()
  const controller = createTalentImportDialogFocusController(fixture.getActiveElement)
  const pendingUpdates = []

  controller.focusAfterUpdate(
    (callback) => pendingUpdates.push(callback),
    () => fixture.dialog,
    () => fixture.closeButton
  )

  assert.equal(fixture.getActiveElement(), fixture.trigger)
  assert.equal(pendingUpdates.length, 1)
  pendingUpdates[0]()
  assert.equal(fixture.getActiveElement(), fixture.closeButton)
})

test('focus controller prevents Escape and closes the dialog', () => {
  assert.equal(typeof createTalentImportDialogFocusController, 'function')
  const fixture = createFocusFixture()
  const controller = createTalentImportDialogFocusController(fixture.getActiveElement)
  let closeCount = 0

  controller.handleKeydown(fixture.keyEvent('Escape'), fixture.dialog, () => {
    closeCount += 1
  })

  assert.equal(closeCount, 1)
  assert.equal(fixture.getPreventedCount(), 1)
})

test('each review module renders its own source-backed preview', async () => {
  const base = beginTalentImportReview(
    selectTalentImportFile(createTalentImportDialogState(), '智能建造工程人才培养方案.docx')
  )
  const expectations = [
    ['requirements', /毕业要求概述/, /<h3>毕业要求<\/h3>/],
    ['courses', /序号/, /课程学分/],
    ['goalRequirementMatrix', /毕业要求 \\ 培养目标/, /培养目标11/],
    ['courseRequirementMatrix', /请添加课程和毕业要求/, /然后设置支撑体系/]
  ]
  for (const [activeModule, first, second] of expectations) {
    const html = await renderDialog({ ...base, activeModule })
    assert.match(html, first)
    assert.match(html, second)
  }
})
