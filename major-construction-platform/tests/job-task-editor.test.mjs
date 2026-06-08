import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('typical work tasks expose edit and delete actions wired to handlers', () => {
  assert.match(appVue, /openTaskDialog\(task, index\)/)
  assert.match(appVue, /@click\.stop="openTaskDialog\(task, index\)"/)
  assert.match(appVue, /aria-label="编辑典型工作任务"/)
  assert.match(appVue, /deleteJobTask\(index\)/)
  assert.match(appVue, /taskDialogMode/)
  assert.match(appVue, /editingTaskIndex/)
})

test('task dialog edits name description and selects abilities from the abilities tab data', () => {
  assert.match(appVue, /taskAbilityOptions/)
  assert.match(appVue, /selectedJobDetail\.value\.abilities\.map/)
  assert.match(appVue, /toggleTaskAbility/)
  assert.match(appVue, /taskForm\.abilities\.includes\(ability\.name\)/)
  assert.doesNotMatch(appVue, /v-model="taskForm\.abilitiesText"/)
})

test('static file entry wires typical work task edit and delete actions', () => {
  assert.match(staticHtml, /data-edit-static-task/)
  assert.match(staticHtml, /data-delete-static-task/)
  assert.match(staticHtml, /showStaticTaskDialog\(Number\(editStaticTask\.dataset\.editStaticTask\)\)/)
  assert.match(staticHtml, /wireStaticTaskActionButtons/)
  assert.match(staticHtml, /showStaticTaskDialog\(Number\(button\.dataset\.editStaticTask\)\)/)
  assert.match(staticHtml, /deleteStaticTaskByIndex\(Number\(button\.dataset\.deleteStaticTask\)\)/)
  assert.match(staticHtml, /refreshStaticTaskPanels\('job-model-deploy'\)/)
  assert.match(staticHtml, /staticTaskAbilityPickerHtml/)
  assert.match(staticHtml, /data-static-task-ability/)
})
