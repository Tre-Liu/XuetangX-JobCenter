import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const rendererStart = indexSource.indexOf('const engineHtml =')
const rendererEnd = indexSource.indexOf('const courseModelHtml =', rendererStart)
const interactionStart = indexSource.indexOf('const handleStaticEngineInteraction =')
const interactionEnd = indexSource.indexOf('const decisionMenuGroups =', interactionStart)

assert.notEqual(rendererStart, -1, 'index.html should define engineHtml')
assert.notEqual(rendererEnd, -1, 'engineHtml should end before courseModelHtml')
assert.notEqual(interactionStart, -1, 'index.html should define handleStaticEngineInteraction')
assert.notEqual(interactionEnd, -1, 'engine interaction handler should end before decision menu data')

const rendererSource = indexSource.slice(rendererStart, rendererEnd)
const interactionSource = indexSource.slice(interactionStart, interactionEnd)
const rendererContext = {}
const interactionContext = {}

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

vm.runInNewContext(
  `
  var renderedSections = []
  var toastDelay = 0
  var timerCallback = null
  var staticEngineToastTimer = null
  const toast = { hidden: true }
  const app = { querySelector: () => toast }
  const renderEngine = (section) => renderedSections.push(section)
  const window = {
    clearTimeout: () => {},
    setTimeout: (callback, delay) => {
      timerCallback = callback
      toastDelay = delay
      return 17
    }
  }
  ${interactionSource}
  globalThis.handleEngineInteraction = handleStaticEngineInteraction
  globalThis.interactionState = () => ({
    renderedSections,
    toastHidden: toast.hidden,
    toastDelay,
    timerCallback,
  })
  `,
  interactionContext,
)

const handleEngineInteraction = interactionContext.handleEngineInteraction
const interactionState = interactionContext.interactionState

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

test('静态专业引擎共享交互处理器切换栏目', () => {
  const target = {
    closest(selector) {
      return selector === '[data-engine-section]'
        ? { dataset: { engineSection: 'custom-graph' } }
        : null
    },
  }

  assert.equal(handleEngineInteraction(target), true)
  assert.deepEqual(Array.from(interactionState().renderedSections), ['custom-graph'])
})

test('静态专业引擎共享交互处理器展示并关闭上传反馈', () => {
  const target = {
    closest(selector) {
      return selector === '[data-engine-upload]' ? {} : null
    },
  }

  assert.equal(handleEngineInteraction(target), true)
  const visibleState = interactionState()
  assert.equal(visibleState.toastHidden, false)
  assert.equal(visibleState.toastDelay, 2800)

  visibleState.timerCallback()
  assert.equal(interactionState().toastHidden, true)
})
