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
