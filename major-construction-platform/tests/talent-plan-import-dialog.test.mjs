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
