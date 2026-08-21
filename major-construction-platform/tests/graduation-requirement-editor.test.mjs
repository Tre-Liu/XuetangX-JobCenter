import test from 'node:test'
import assert from 'node:assert/strict'

import {
  addGraduationRequirement,
  addGraduationRequirementChild,
  createGraduationRequirementDraft,
  moveGraduationRequirement,
  removeGraduationRequirement,
  removeGraduationRequirementChild,
  saveGraduationRequirementDraft
} from '../src/app/graduation-requirement-editor.ts'

const overview = '毕业要求概述'
const requirements = [
  { code: 'R1', text: '素质目标', children: ['遵守职业规范', '承担社会责任'] },
  { code: 'R2', text: '专业知识', children: ['掌握工程基础'] }
]

test('opening the graduation requirement editor creates an isolated draft', () => {
  const draft = createGraduationRequirementDraft(overview, requirements)

  draft.overview = '编辑后的概述'
  draft.requirements[0].text = '编辑后的目标'
  draft.requirements[0].children[0] = '编辑后的指标'

  assert.equal(overview, '毕业要求概述')
  assert.equal(requirements[0].text, '素质目标')
  assert.equal(requirements[0].children[0], '遵守职业规范')
})

test('adding and removing requirement levels keeps every displayed code sequential', () => {
  let draft = createGraduationRequirementDraft(overview, requirements)
  draft = addGraduationRequirementChild(draft, 0)
  assert.deepEqual(draft.requirements[0].children, ['遵守职业规范', '承担社会责任', ''])

  draft = removeGraduationRequirementChild(draft, 0, 1)
  assert.deepEqual(draft.requirements[0].children, ['遵守职业规范', ''])

  draft = addGraduationRequirement(draft)
  assert.deepEqual(draft.requirements.map((item) => item.code), ['R1', 'R2', 'R3'])
  assert.deepEqual(draft.requirements[2], { code: 'R3', text: '', children: [] })

  draft = removeGraduationRequirement(draft, 0)
  assert.deepEqual(draft.requirements.map((item) => item.code), ['R1', 'R2'])
  assert.equal(draft.requirements[0].text, '专业知识')
})

test('confirming the editor trims content without mutating the draft', () => {
  const draft = createGraduationRequirementDraft('  新概述  ', [
    { code: 'R8', text: '  质量安全  ', children: ['  完成质量检测  ', '   '] }
  ])

  const saved = saveGraduationRequirementDraft(draft)

  assert.deepEqual(saved, {
    overview: '新概述',
    requirements: [{ code: 'R1', text: '质量安全', children: ['完成质量检测', ''] }]
  })
  assert.equal(draft.overview, '  新概述  ')
  assert.equal(draft.requirements[0].code, 'R1')
})

test('dragging a requirement to a new position renumbers the resulting hierarchy', () => {
  const draft = createGraduationRequirementDraft(overview, [
    ...requirements,
    { code: 'R3', text: '创新研发', children: ['完成创新项目'] }
  ])

  const moved = moveGraduationRequirement(draft, 2, 0)

  assert.deepEqual(moved.requirements.map((item) => item.text), ['创新研发', '素质目标', '专业知识'])
  assert.deepEqual(moved.requirements.map((item) => item.code), ['R1', 'R2', 'R3'])
  assert.deepEqual(draft.requirements.map((item) => item.text), ['素质目标', '专业知识', '创新研发'])
})
