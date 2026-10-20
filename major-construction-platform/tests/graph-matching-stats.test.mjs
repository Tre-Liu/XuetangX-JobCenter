import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const html = readFileSync(new URL('../public/opendesign/industry-education-graph-prototype.html', import.meta.url), 'utf8')
const context = {}
const start = html.indexOf('    function calculateGraphMatchingStats(')
const end = html.indexOf('    function renderGraphMatchingStats(', start)
vm.runInNewContext(html.slice(start, end) + '\nglobalThis.calculate = calculateGraphMatchingStats;', context)

test('按岗位内能力去重，一对多知识点与重复任务不重复计数，剔除无效关联', () => {
  const result = context.calculate([
    { id: 'a', tasks: [{ abilities: [{ name: '联调', category: '技能' }, { name: '联调', category: '技能' }, { name: '责任', category: '素养' }] }] },
    { id: 'b', tasks: [{ abilities: [{ name: '联调', category: '技能' }, { name: '无效', category: '知识' }] }] },
  ], [
    { id: 'c1', knowledgeIds: ['k1', 'k2'] },
    { id: 'c2', knowledgeIds: ['k1'] },
    { id: 'c3', knowledgeIds: [] },
  ], ability => ability.name === '联调' ? ['k1', 'k2'] : ability.name === '无效' ? ['missing'] : [])
  assert.equal(result.abilityTotal, 4)
  assert.equal(result.abilityMatched, 2)
  assert.equal(result.abilityRate, '50.0%')
  assert.equal(result.courseTotal, 3)
  assert.equal(result.courseMatched, 2)
  assert.equal(result.courseRate, '66.7%')
})

test('没有岗位或课程时占比为零', () => {
  const result = context.calculate([], [], () => [])
  assert.equal(result.abilityRate, '0.0%')
  assert.equal(result.courseRate, '0.0%')
})
