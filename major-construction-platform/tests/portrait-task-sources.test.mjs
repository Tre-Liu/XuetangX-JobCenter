import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

await import('../src/data/portrait-task-sources.js')
await import('../src/utils/portrait-task-sources.js')
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
    assert.ok(sources.every((source) => source.isDemo && source.file && source.school && source.major && source.locator))
    assert.deepEqual(getSources('BIM建模工程师', task), [])
  }
  assert.equal(getSources('BIM建模工程师', tasks[1], { allowDemo: true }).length, 2)
  assert.deepEqual(getSources('化妆师', tasks[0], { allowDemo: true }), [])
  const historicalName = '根据客户需求及场景特性，设计适配的妆容造型'
  assert.deepEqual(getSources('化妆师/调香师', historicalName, { allowDemo: true }), getSources('化妆师/调香师', historicalName))
})

test('both entry points show per-task provenance and an honest missing-source state', async () => {
  for (const file of ['../src/App.vue', '../index.html']) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8')
    assert.match(source, /portrait-task-source/)
    assert.match(source, /暂未关联案例/)
    assert.match(source, /案例：/)
    assert.doesNotMatch(source, /参考人培/)
    assert.match(source, /getSources/)
  }
})

test('static cards render multiple real sources safely and handle missing provenance', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const escape = html.match(/const staticEscapeText = .*$/m)[0]
  const render = html.slice(html.indexOf('const staticPortraitTaskCardsHtml ='), html.indexOf('const showStaticPortraitDialog ='))
  const renderCards = vm.runInNewContext(`${escape}\n${render}\nstaticPortraitTaskCardsHtml`, {
    window: { PortraitTaskSources: { getSources: (_job, task) => task === '缺失' ? [] : [
      { file: '<script>.pdf', school: '学校甲', major: '专业甲', locator: 'PDF第3页 · 职业能力分析' },
      { file: '第二份人培.pdf', school: '学校乙', major: '', locator: 'PDF第4页' }
    ] } }
  })
  const result = renderCards({ name: '岗位', tasks: ['测试', '缺失'] })
  assert.match(result, /title="&lt;script&gt;\.pdf">案例：学校甲 · 专业甲/)
  assert.match(result, /<small>职业能力分析<\/small>/)
  assert.doesNotMatch(result, /PDF第\d+页/)
  assert.match(result, /第二份人培.pdf/)
  assert.match(result, /暂未关联案例/)
  assert.doesNotMatch(result, /<script>/)
})
