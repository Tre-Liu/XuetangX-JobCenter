import assert from 'node:assert/strict'
import test from 'node:test'

await import('../src/utils/portrait-competency-map-state.js')

const state = globalThis.PortraitCompetencyMapState

test('competency map zoom uses 10 percent steps and stays between 60 and 140 percent', () => {
  assert.equal(state.changeZoom(1, -0.1), 0.9)
  assert.equal(state.changeZoom(1.35, 0.1), 1.4)
  assert.equal(state.changeZoom(0.6, -0.1), 0.6)
  assert.equal(state.changeZoom(1.4, 0.1), 1.4)
})

test('competency map theme toggles between light and dark', () => {
  assert.equal(state.nextTheme('light'), 'dark')
  assert.equal(state.nextTheme('dark'), 'light')
})

test('task ability lanes contain only the selected task abilities with natural category counts', () => {
  const items = [
    { name: '知识 A', category: '知识' },
    { name: '知识 B', category: '知识' },
    { name: '技能 A', category: '技能' },
    { name: '技能 B', category: '技能' },
    { name: '素养 A', category: '素养' }
  ]

  assert.deepEqual(
    state.buildTaskAbilityLanes(items, new Set(['知识 B', '技能 A', '素养 A']), ['知识', '技能', '素养'])
      .map((lane) => ({ category: lane.category, names: lane.items.map((item) => item.name) })),
    [
      { category: '知识', names: ['知识 B'] },
      { category: '技能', names: ['技能 A'] },
      { category: '素养', names: ['素养 A'] }
    ]
  )
  assert.deepEqual(items.map((item) => item.name), ['知识 A', '知识 B', '技能 A', '技能 B', '素养 A'])
})

test('task scene direction follows the selected task order', () => {
  assert.equal(state.getTaskSlideDirection(0, 3), 'forward')
  assert.equal(state.getTaskSlideDirection(3, 1), 'backward')
})

test('ability detail includes only tasks that reference the selected ability', () => {
  const detail = state.buildAbilityDetail({
    abilityName: '工程数据清洗与治理',
    jobName: 'BIM建模工程师',
    nodes: [
      { name: '工程数据清洗与治理', category: '技能', tone: 'skill', marker: '技' },
      { name: '工程数据组织规范', category: '知识', tone: 'knowledge', marker: '知' }
    ],
    tasks: [
      { name: '施工图深化与碰撞检查', abilities: ['工程数据清洗与治理'] },
      { name: '模型交付与过程复核', abilities: ['工程数据组织规范'] },
      { name: '工程量提取与变更协同', abilities: ['工程数据清洗与治理', '工程数据组织规范'] }
    ]
  })

  assert.deepEqual(detail, {
    name: '工程数据清洗与治理',
    category: '技能',
    tone: 'skill',
    marker: '技',
    jobName: 'BIM建模工程师',
    relatedTasks: ['施工图深化与碰撞检查', '工程量提取与变更协同']
  })
})
