import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  applyAbilityEdit,
  deleteAbilityReferencesFromTasks
} from '../src/utils/job-ability-editor.js'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('applyAbilityEdit updates only the targeted ability and renames task references', () => {
  const abilities = [
    { name: '原能力项', category: '知识', definition: '原定义' },
    { name: '保留能力项', category: '技能', definition: '保留定义' }
  ]
  const tasks = [
    { name: '任务一', description: '说明', abilities: ['原能力项', '保留能力项'] },
    { name: '任务二', description: '说明', abilities: ['原能力项'] }
  ]

  const result = applyAbilityEdit({
    abilities,
    tasks,
    originalName: '原能力项',
    nextAbility: { name: '新能力项', category: '素养', definition: '新定义' }
  })

  assert.deepEqual(result.abilities, [
    { name: '新能力项', category: '素养', definition: '新定义' },
    { name: '保留能力项', category: '技能', definition: '保留定义' }
  ])
  assert.deepEqual(result.tasks, [
    { name: '任务一', description: '说明', abilities: ['新能力项', '保留能力项'] },
    { name: '任务二', description: '说明', abilities: ['新能力项'] }
  ])
})

test('deleteAbilityReferencesFromTasks removes only the deleted ability reference', () => {
  const tasks = [
    { name: '任务一', description: '说明', abilities: ['待删能力', '保留能力'] },
    { name: '任务二', description: '说明', abilities: ['待删能力'] }
  ]

  const result = deleteAbilityReferencesFromTasks(tasks, '待删能力')

  assert.deepEqual(result, [
    { name: '任务一', description: '说明', abilities: ['保留能力'] },
    { name: '任务二', description: '说明', abilities: [] }
  ])
})

test('vue detail page wires ability edit dialog and save flow', () => {
  assert.match(appVue, /openAbilityDialog\(ability\)/)
  assert.match(appVue, /saveAbilityDialog/)
  assert.match(appVue, /编辑能力项/)
  assert.match(appVue, /applyAbilityEdit\(/)
})

test('static index page wires ability edit dialog and save flow', () => {
  assert.match(staticHtml, /data-edit-static-ability/)
  assert.match(staticHtml, /showStaticAbilityDialog/)
  assert.match(staticHtml, /data-save-static-ability/)
  assert.match(staticHtml, /refreshStaticAbilityEditDialog/)
  assert.match(staticHtml, /const staticAbilityCategoryOptions = \['知识', '技能', '素养'\]/)
  assert.match(staticHtml, /staticAbilityCategoryOptions\.map\(\(option\)/)
})

test('static index click delegation tolerates text-node button targets', () => {
  assert.match(staticHtml, /const rawTarget = event\.target/)
  assert.match(staticHtml, /const target = rawTarget instanceof Element \? rawTarget : rawTarget\?\.parentElement/)
})
