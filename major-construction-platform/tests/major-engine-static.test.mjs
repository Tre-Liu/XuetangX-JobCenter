import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const rendererStart = indexSource.indexOf('const engineHtml =')
const rendererEnd = indexSource.indexOf('const courseModelHtml =', rendererStart)

assert.notEqual(rendererStart, -1, 'index.html should define engineHtml')
assert.notEqual(rendererEnd, -1, 'engineHtml should end before courseModelHtml')

const rendererSource = indexSource.slice(rendererStart, rendererEnd)
const rendererContext = {}

vm.runInNewContext(
  `
  const shellStart = (moduleName) => \`<main data-module="\${moduleName}">\`
  const shellEnd = '</main>'
  const topNavHtml = () => ''
  ${rendererSource}
  globalThis.renderMajorEngine = engineHtml
  `,
  rendererContext,
)

const renderMajorEngine = rendererContext.renderMajorEngine

test('静态专业引擎默认渲染完整知识库', () => {
  const html = renderMajorEngine()

  assert.match(html, /知识库统计/)
  assert.match(html, /培养方案/)
  assert.match(html, /专业认证/)
  assert.match(html, /政策文件/)
  assert.match(html, /行业报告/)
})

test('静态专业引擎为图谱栏目渲染统一占位状态', () => {
  const html = renderMajorEngine('major-graph')

  assert.match(html, /功能准备中，敬请期待~/)
  assert.match(html, /engine-lock-scene/)
})

test('静态专业引擎提供七个可切换栏目', () => {
  const html = renderMajorEngine()
  const controls = html.match(/data-engine-section=/g) ?? []

  assert.equal(controls.length, 7)
})
