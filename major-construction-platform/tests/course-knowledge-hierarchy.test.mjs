import test from 'node:test'
import assert from 'node:assert/strict'
import '../src/talent-plan/data.js'
import '../src/knowledge-domain/curriculum.js'
import '../src/knowledge-domain/context.js'
import '../src/knowledge-domain/model.js'

const context = globalThis.KnowledgeDomainContext.build(new URL('https://local.invalid/index.html'), { selection: 'knowledge-domain' })

function outline(nodes, level = 0) {
  return nodes.flatMap(node => [{ node, level }, ...outline(node.children, level + 1)])
}

test('双课与单课展示可逐级展开的实际节点，并保留双课关联端点', async () => {
  await import('../src/knowledge-domain/course-hierarchy.js')
  const graph = globalThis.KnowledgeDomainModel.fromCurriculum(context)
  const original = structuredClone(graph)
  const { dual, single } = globalThis.CourseKnowledgeHierarchy.build(graph)
  assert.deepEqual(dual.roots.map(node => node.name), ['建筑信息模型基础', '智能测量技术'])
  const dualNodes = outline(dual.roots)
  assert.equal(dualNodes.length, 201)
  for (const course of dual.roots) assert.equal(Math.max(...outline([course]).map(entry => entry.level)), 10)
  const displayed = new Set(dualNodes.map(({ node }) => node.id))
  assert.equal(dual.relations.length, 3)
  assert.ok(dual.relations.every(({ from, to }) => displayed.has(from.id) && displayed.has(to.id)))

  const singleNodes = outline(single.roots)
  assert.equal(singleNodes.length, 30)
  assert.equal(Math.max(...singleNodes.map(entry => entry.level)), 2)
  assert.equal(singleNodes.filter(entry => entry.level === 2).length, 27)
  assert.deepEqual(graph, original)
})

test('已修订的单元与知识点名称仍可在课程层级中查看', async () => {
  await import('../src/knowledge-domain/course-hierarchy.js')
  const graph = globalThis.KnowledgeDomainModel.fromCurriculum(context)
  const [bim] = graph.courses
  bim.topics[0].name = '模型定位与空间基准'
  bim.topics[0].nameEdited = true
  const section = bim.topics[11].sections[1]
  section.points[1] = '典型断面选取'
  section.editedPoints = [1]
  graph.relations = null

  const { dual, single } = globalThis.CourseKnowledgeHierarchy.build(graph)
  assert.equal(single.roots[0].children[0].name, '模型定位与空间基准')
  const anchor = outline(dual.roots).find(({ node }) => node.name === '典型断面选取')
  assert.equal(Math.max(...outline([anchor.node], anchor.level).map(entry => entry.level)), 10)
  assert.deepEqual(dual.relations, [])
})
