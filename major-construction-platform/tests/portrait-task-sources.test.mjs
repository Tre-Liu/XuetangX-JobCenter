import test from 'node:test'
import assert from 'node:assert/strict'

await import('../src/data/portrait-task-sources.js')
await import('../src/utils/portrait-task-sources.js')
await import('../src/utils/portrait-competency-map-state.js')
const { getSources } = globalThis.PortraitTaskSources

test('historical task retains its actual training file and page without duplicate ability rows', () => {
  const sources = getSources('化妆师/调香师', '根据客户需求及场景特性，设计适配的妆容造型')
  assert.equal(sources.length, 1)
  assert.equal(sources[0].file, '2025级人物形象设计专业人才培养方案.pdf')
  assert.equal(sources[0].school, '湖南大众传媒职业技术学院')
  assert.equal(sources[0].locator, 'PDF第10页/表2')
})

test('a similarly named task or a different job cannot inherit a source', () => {
  assert.deepEqual(getSources('BIM建模工程师', '建筑模型创建与标准校核'), [])
  assert.deepEqual(getSources('BIM建模工程师', '安全检查'), [])
  assert.deepEqual(getSources('化妆师/调香师', '根据客户需求及场景特性，设计适配的妆容造型（修订）'), [])
  assert.deepEqual(getSources('', ''), [])
})

test('task objects and task strings resolve the same source', () => {
  const name = '根据客户需求及场景特性，设计适配的妆容造型'
  assert.deepEqual(getSources('化妆师/调香师', { name }), getSources('化妆师/调香师', name))
})

test('BIM demo sources are opt-in, clearly marked, and do not replace historical sources', () => {
  const tasks = ['建筑模型创建与标准校核', '施工图深化与碰撞检查', '工程量提取与变更协同', '模型交付与过程复核', '设计协同问题闭环']
  for (const task of tasks) {
    const sources = getSources('BIM建模工程师', task, { allowDemo: true })
    assert.ok(sources.length)
    assert.ok(sources.every((source) => source.isDemo && source.file && source.major && source.locator))
    assert.deepEqual(getSources('BIM建模工程师', task), [])
  }
  assert.equal(getSources('BIM建模工程师', tasks[1], { allowDemo: true }).length, 2)
  assert.deepEqual(getSources('化妆师', tasks[0], { allowDemo: true }), [])
  const historicalName = '根据客户需求及场景特性，设计适配的妆容造型'
  assert.deepEqual(getSources('化妆师/调香师', historicalName, { allowDemo: true }), getSources('化妆师/调香师', historicalName))
})
