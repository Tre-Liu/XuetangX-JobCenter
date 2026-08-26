import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const shellCssSource = await readFile(new URL('../src/styles/10-shell.css', import.meta.url), 'utf8')
const rendererStart = indexSource.indexOf('const engineHtml =')
const rendererEnd = indexSource.indexOf('const courseModelHtml =', rendererStart)
const interactionStart = indexSource.indexOf('const handleStaticEngineInteraction =')
const interactionEnd = indexSource.indexOf('const courseModelHtml =', interactionStart)
const fileModeBranchStart = indexSource.indexOf(
  "if (window.location.protocol === 'file:' && fileModeView === 'results-portal')",
)

assert.notEqual(rendererStart, -1, 'index.html should define engineHtml')
assert.notEqual(rendererEnd, -1, 'engineHtml should end before courseModelHtml')
assert.notEqual(interactionStart, -1, 'index.html should define handleStaticEngineInteraction')
assert.notEqual(interactionEnd, -1, 'engine interaction handler should end before course model rendering')
assert.notEqual(fileModeBranchStart, -1, 'index.html should define the results portal file-mode branch')

const rendererSource = indexSource.slice(rendererStart, rendererEnd)
const interactionSource = indexSource.slice(interactionStart, interactionEnd)
const interactionContext = {}

const createMajorEngineRenderer = (industryEducationModelEnabled = true) => {
  const rendererContext = {}
  vm.runInNewContext(
    `
  const shellStart = (moduleName) => \`<main data-module="\${moduleName}">\`
  const shellEnd = '</main>'
  const topNavHtml = () => ''
  const staticDockHtml = () => ''
  const staticIndustryEducationModelEnabled = ${industryEducationModelEnabled}
  ${rendererSource}
  globalThis.renderMajorEngine = engineHtml
  `,
    rendererContext,
  )
  return rendererContext.renderMajorEngine
}

const renderMajorEngine = createMajorEngineRenderer()

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

test('静态专业引擎在结果页提前返回前完成交互初始化', () => {
  const renderEngineStart = indexSource.indexOf('let renderEngine =')
  assert.notEqual(renderEngineStart, -1, 'index.html should initialize a reusable renderEngine function')
  assert.ok(
    renderEngineStart < fileModeBranchStart,
    'renderEngine must be initialized before the file-mode branch can return',
  )
  assert.ok(
    interactionStart < fileModeBranchStart,
    'handleStaticEngineInteraction must be initialized before the file-mode branch can return',
  )
})

test('静态专业引擎的专业建设智库渲染完整知识资源', () => {
  const html = renderMajorEngine('knowledge')

  assert.match(html, /知识库统计/)
  assert.match(html, /培养方案/)
  assert.match(html, /专业认证/)
  assert.match(html, /政策文件/)
  assert.match(html, /行业报告/)
})

test('静态专业引擎默认为专业全景图谱渲染浅色锁定图谱', () => {
  const html = renderMajorEngine()

  assert.match(html, /class="engine-major-graph"/)
  assert.match(html, /class="opendesign-graph-frame"/)
  assert.match(html, /theme=light&amp;themeLock=light/)
  assert.match(html, /embedScene=major-engine/)
  assert.match(html, /industryEducationModel=enabled/)
  assert.doesNotMatch(html, /engine-lock-scene/)
})

test('静态专业引擎会把 CMS 产教模型未开通状态传入图谱', () => {
  const html = createMajorEngineRenderer(false)()

  assert.match(html, /embedScene=major-engine/)
  assert.match(html, /industryEducationModel=disabled/)
})

test('静态专业引擎未开放的图谱栏目继续渲染统一占位状态', () => {
  const html = renderMajorEngine('knowledge-domain-graph')

  assert.match(html, /功能准备中，敬请期待~/)
  assert.match(html, /engine-lock-scene/)
})

test('静态专业引擎提供六个可切换栏目和两条分组线', () => {
  const html = renderMajorEngine()
  const controls = html.match(/data-engine-section=/g) ?? []
  const dividers = html.match(/class="engine-nav-divider"/g) ?? []

  assert.equal(controls.length, 6)
  assert.equal(dividers.length, 2)
  assert.match(html, />专业全景图谱<\/button>/)
  assert.match(html, />共建课程群图谱<\/button>/)
  assert.match(html, />专业建设智库<\/button>/)
})

test('专业引擎侧边栏与人才方案使用同一宽度规格', () => {
  const engineMenuRule = [...shellCssSource.matchAll(/\.engine-module-menu\s*\{([^}]*)\}/g)]
    .map((match) => match[1])
    .find((rule) => rule.includes('background: #edf3ff'))

  assert.ok(engineMenuRule, '应找到专业引擎侧边栏主样式')
  assert.match(engineMenuRule, /width:\s*176px/)
  assert.match(engineMenuRule, /flex:\s*0 0 176px/)
  assert.match(engineMenuRule, /padding:\s*28px 24px 20px/)
})

test('静态专业引擎共享交互处理器切换栏目', () => {
  const target = {
    closest(selector) {
      return selector === '[data-engine-section]'
        ? { dataset: { engineSection: 'knowledge' } }
        : null
    },
  }

  assert.equal(handleEngineInteraction(target), true)
  assert.deepEqual(Array.from(interactionState().renderedSections), ['knowledge'])
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
