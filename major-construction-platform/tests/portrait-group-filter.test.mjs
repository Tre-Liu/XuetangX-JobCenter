import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
const ctx = vm.createContext({})
vm.runInContext(readFileSync(new URL('../src/industry-domain/model.js', import.meta.url), 'utf8'), ctx)
const M = ctx.IndustryDomain
const major = { code: '081001', sourceLevel: '普通本科' }
const matches = { 甲: { majors: [{ code: '081001', level: '普通本科' }] }, 乙: { majors: [{ code: '081001', level: '职业本科' }] } }
const jobs = [
  { id: 'a', name: '甲', groupName: '甲群', chain: '链一' },
  { id: 'b', name: '乙', groupName: '乙群', chain: '链一' },
  { id: 'c', name: '甲', groupName: '丙群', chain: '链二' },
  { id: 'd', name: '甲', groupName: '', chain: '链一' }
]
const ids = rows => Array.from(rows, row => row.id)
test('major relevance intersects chain, exact code and education level; unknown major never broadens', () => {
  const scope = M.portraitGroupScope(jobs, { chain: '链一', major, majorOnly: true, matches })
  assert.deepEqual(Array.from(scope.groups, g => g.name), ['甲群'])
  assert.deepEqual(ids(scope.jobs), ['a'])
  assert.equal(M.portraitGroupScope(jobs, { chain: '链一', major: { code: '999999' }, majorOnly: true, matches }).jobs.length, 0)
  assert.equal(M.portraitGroupScope(jobs, { chain: '链一', majorOnly: true, matches }).groups.length, 0)
  assert.deepEqual(ids(M.portraitGroupScope(jobs, { chain: '链一', majorOnly: false }).jobs), ['a', 'b', 'd'])
})
test('top ten ranks by job count, retains selected eleventh and never truncates all jobs', () => {
  const many = Array.from({ length: 12 }, (_, n) => Array.from({ length: n + 1 }, (_, k) => ({ id: `${n}-${k}`, name: '甲', groupName: `群${n}`, chain: '链一', demand: 999 - n }))).flat()
  const scope = M.portraitGroupScope(many, { chain: '链一', majorOnly: false, group: '群0' })
  assert.equal(scope.groups.length, 12)
  assert.equal(scope.visibleGroups.length, 10)
  assert.deepEqual(Array.from(scope.visibleGroups, g => g.name), ['群0','群11','群10','群9','群8','群7','群6','群5','群4','群3'])
  assert.equal(scope.jobs.length, 78)
  assert.equal(scope.group, '群0')
  const reset = M.portraitGroupScope(many, { chain: '链二', majorOnly: false, group: '群0' })
  assert.equal(reset.group, '')
  assert.equal(reset.jobs.length, 0)
})
test('membership overrides affect relevance and counts without losing unrestricted ungrouped jobs', () => {
  const scope = M.portraitGroupScope(jobs, { chain: '链一', major, majorOnly: true, matches }, { a: '' })
  assert.equal(scope.groups.length, 0)
  assert.deepEqual(ids(M.portraitGroupScope(jobs, { chain: '链一', majorOnly: false }, { a: '' }).jobs), ['a','b','d'])
})
test('catalog education labels and stored match labels resolve the same vocational level', () => {
  const options = { chain: '链一', major: { code: '081001', sourceLevel: '高等职业教育本科' }, majorOnly: true, matches }
  assert.deepEqual(ids(M.portraitGroupScope(jobs, options).jobs), ['b'])
})
