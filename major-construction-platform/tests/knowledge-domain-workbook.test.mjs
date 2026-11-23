import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import XLSX from 'xlsx'
import '../src/knowledge-domain/workbook.js'
import '../src/knowledge-domain/atlas.js'

globalThis.XLSX = XLSX
const { read, apply } = globalThis.KnowledgeDomainWorkbook
const template = readFileSync(new URL('../src/knowledge-domain/知识领域图谱导入模板.xlsx', import.meta.url))
const atlasOf = graph => globalThis.KnowledgeDomainAtlas.build(graph.major, graph.courses, graph.goalPlan, [], graph.atlasChanges)
const row = (...cells) => ({ at: '第 3 行', cells })
const pathRow = (names, note = '') => row(...Array.from({length: 10}, (_, i) => names[i] || ''), note, '', '', '', '')

test('下载模板可导入课程、跨课程关联、跨领域知识点及培养目标', () => {
  const graph = apply(read(template), 'add', null, null, '当前专业')
  const atlas = atlasOf(graph)
  assert.equal(graph.major, '当前专业')
  assert.equal(graph.courses.length, 2)
  assert.equal(graph.relations.length, 1)
  assert.equal(atlas.domains.length, 2)
  assert.equal(atlas.memberships.size, 1)
  assert.equal(atlas.goals[0].domains.length, 2)
  assert.equal(atlas.goals[0].source, '教学设计参考')
})

test('新增保留已编辑字段，仅更新跳过新节点，覆盖以文件为准', () => {
  const data = read(template)
  const original = apply(data, 'add', null, null, '当前专业')
  const atlas = atlasOf(original)
  const changed = structuredClone(data)
  changed.培养目标[0].cells[1] = '更新后的目标正文'
  changed.课程群图谱.push(pathRow(['新课程', '新增知识点']))
  const added = apply(changed, 'add', original, atlas, original.major)
  assert.equal(added.courses.length, 3)
  assert.equal(atlasOf(added).goals[0].text, atlas.goals[0].text)
  const updated = apply(changed, 'update', original, atlas, original.major)
  assert.equal(updated.courses.length, 2)
  assert.equal(atlasOf(updated).goals[0].text, '更新后的目标正文')
  assert.equal(added.relations.length, 1)
  assert.equal(original.courses.length, 2)
  const replacement = apply({ 课程群图谱: [pathRow(['替换课程', '知识点'])], 知识领域关系: [], 培养目标: [] }, 'replace', original, atlas, original.major)
  assert.deepEqual(replacement.courses.map(c => c.name), ['替换课程'])
  assert.equal(atlasOf(replacement).goals.length, 0)
})

test('错误的关联行不能部分写入，完整路径区分同名知识点', () => {
  const data = read(template)
  const original = apply(data, 'add', null, null, '当前专业')
  const snapshot = JSON.stringify(original)
  data.课程群图谱.push(pathRow(['程序设计基础', '其他单元', '选择结构']))
  data.知识领域关系.push(row('程序设计方法', '', '程序设计基础', '选择结构'))
  assert.throws(() => apply(data, 'add', original, atlasOf(original), original.major), /同名知识点/)
  assert.equal(JSON.stringify(original), snapshot)
  data.知识领域关系.at(-1).cells[3] = '其他单元 › 选择结构'
  assert.doesNotThrow(() => apply(data, 'add', original, atlasOf(original), original.major))
})
