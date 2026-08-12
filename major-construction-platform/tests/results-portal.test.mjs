import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'
import { JOB_CARDS, getJobDetail } from '../src/mock/job-center.ts'
import { REPORT_INDUSTRY_CHAIN_OPTIONS } from '../src/mock/research-report.ts'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const appConfig = await readFile(new URL('../src/app/app-config.ts', import.meta.url), 'utf8')
const appTalentIndustryData = await readFile(new URL('../src/app/talent-industry-data.ts', import.meta.url), 'utf8')
const abilityImportUtil = await readFile(new URL('../src/utils/ability-import.ts', import.meta.url), 'utf8').catch(() => '')
const standaloneViewUtil = await readFile(new URL('../src/utils/standalone-view.ts', import.meta.url), 'utf8').catch(() => '')
const graphLayoutUtil = await readFile(new URL('../src/utils/graph-layout.ts', import.meta.url), 'utf8').catch(() => '')
const appSource = `${appVue}\n${appTalentIndustryData}\n${appConfig}`
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const openDesignGraphHtml = await readFile(new URL('../public/opendesign/industry-education-graph-prototype.html', import.meta.url), 'utf8').catch(() => '')
const staticRegionCityGeo = await readFile(new URL('../src/data/static-region-city-geo.js', import.meta.url), 'utf8').catch(() => '')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))
const jobCenterMock = await readFile(new URL('../src/mock/job-center.ts', import.meta.url), 'utf8')
const jobResearchMock = await readFile(new URL('../src/mock/job-research.ts', import.meta.url), 'utf8')
const researchReportMock = await readFile(new URL('../src/mock/research-report.ts', import.meta.url), 'utf8')
const styleBlock = (selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = stylesCss.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `${selector} style block should exist`)
  return match[1]
}
const openDesignStyleBlock = (selector) => {
  const selectorIndex = openDesignGraphHtml.indexOf(selector)
  assert.ok(selectorIndex >= 0, `${selector} style block should exist in OpenDesign graph`)
  const blockStart = openDesignGraphHtml.indexOf('{', selectorIndex)
  const blockEnd = openDesignGraphHtml.indexOf('\n    }', blockStart)
  assert.ok(blockStart >= 0 && blockEnd > blockStart, `${selector} style block should be parseable`)
  return openDesignGraphHtml.slice(blockStart + 1, blockEnd)
}
const sourceSlice = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker)
  assert.ok(start >= 0, `${startMarker} should exist`)
  const end = source.indexOf(endMarker, start)
  assert.ok(end > start, `${endMarker} should appear after ${startMarker}`)
  return source.slice(start, end)
}
const readStaticReportIndustryChainOptions = () => {
  const declaration = sourceSlice(
    staticHtml,
    'const staticReportIndustryChainOptions = [',
    'let staticSelectedIndustryChain =',
  ).replace(
    'const staticReportIndustryChainOptions =',
    'staticReportIndustryChainOptions =',
  )
  const sandbox = { staticReportMajorOptions: [] }
  vm.runInNewContext(declaration, sandbox)
  return JSON.parse(JSON.stringify(sandbox.staticReportIndustryChainOptions))
}

const parseHexColor = (value) => {
  const match = value.match(/^#([0-9a-f]{6})$/i)
  assert.ok(match, `expected a six-digit hex color, received ${value}`)
  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16))
}
const parseCssColor = (value) => {
  const trimmed = value.trim()
  if (trimmed.startsWith('#')) return { rgb: parseHexColor(trimmed), alpha: 1 }
  const rgba = trimmed.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i)
  assert.ok(rgba, `expected a hex or rgba color, received ${value}`)
  return {
    rgb: rgba.slice(1, 4).map(Number),
    alpha: Number(rgba[4]),
  }
}
const compositeRgb = (foreground, alpha, background) =>
  foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha))
const relativeLuminance = (rgb) => {
  const [red, green, blue] = rgb.map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}
const contrastRatio = (first, second) => {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05)
}
const minimumGradientContrast = (foreground, start, end, sampleCount = 100) => {
  let minimum = Number.POSITIVE_INFINITY
  for (let index = 0; index <= sampleCount; index += 1) {
    const progress = index / sampleCount
    const background = start.map((channel, channelIndex) =>
      channel + (end[channelIndex] - channel) * progress)
    minimum = Math.min(minimum, contrastRatio(foreground, background))
  }
  return minimum
}

class FakeElement {}

const createStaticReportHarness = ({
  source = staticHtml,
  confirmResult = true,
  deferTimers = true,
} = {}) => {
  const scriptMatch = source.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  let documentClickHandler = null
  let inputHandler = null
  let changeHandler = null
  let keydownHandler = null
  let appHtml = ''
  let nextConfirmResult = confirmResult
  let capturedAdsText = ''
  let timerSequence = 0
  const timers = []
  class CapturingBlob {
    constructor(parts) {
      capturedAdsText = parts.map((part) => String(part)).join('')
    }
  }
  class SandboxURL extends URL {}
  SandboxURL.createObjectURL = () => 'blob:static-report-harness'
  SandboxURL.revokeObjectURL = () => {}

  const app = {
    get innerHTML() {
      return appHtml
    },
    set innerHTML(value) {
      appHtml = value
    },
    querySelector() {
      return null
    },
    querySelectorAll() {
      return []
    },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
      if (type === 'input') inputHandler = handler
      if (type === 'change') changeHandler = handler
      if (type === 'keydown') keydownHandler = handler
    },
  }
  const documentStub = {
    body: {
      classList: { add() {}, remove() {} },
      appendChild() {},
      removeChild() {},
    },
    querySelector(selector) {
      return selector === '#app' ? app : null
    },
    querySelectorAll() {
      return []
    },
    addEventListener(type, handler) {
      if (type === 'click') documentClickHandler = handler
    },
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        click() {},
        remove() {},
        querySelector() { return null },
        querySelectorAll() { return [] },
      }
    },
  }
  const storage = {}
  const url = new URL('file:///tmp/major-construction-platform/index.html')
  const scheduleTimer = (callback) => {
    timerSequence += 1
    const timer = { id: timerSequence, callback, cleared: false }
    timers.push(timer)
    if (!deferTimers && typeof callback === 'function') callback()
    return timer.id
  }
  const clearTimer = (timerId) => {
    const timer = timers.find((item) => item.id === timerId)
    if (timer) timer.cleared = true
  }
  const storageApi = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = String(value) },
    removeItem: (key) => { delete storage[key] },
  }
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: {
        protocol: 'file:',
        href: url.toString(),
        search: url.search,
        pathname: url.pathname,
      },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(callback) {
        if (typeof callback === 'function') callback()
        return 1
      },
      open() { return { opener: null } },
      confirm() { return nextConfirmResult },
      scrollTo() {},
      setTimeout: scheduleTimer,
      clearTimeout: clearTimer,
      localStorage: storageApi,
    },
    localStorage: storageApi,
    document: documentStub,
    URL: SandboxURL,
    URLSearchParams,
    Blob: CapturingBlob,
    requestAnimationFrame(callback) {
      if (typeof callback === 'function') callback()
      return 1
    },
    setTimeout: scheduleTimer,
    clearTimeout: clearTimer,
    Map,
    Set,
    Math,
  }

  vm.createContext(sandbox)
  vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  assert.ok(clickHandler)
  assert.ok(inputHandler)
  assert.ok(changeHandler)
  assert.ok(keydownHandler)

  const makeTarget = ({ selector, dataset = {}, value = '', files } = {}) => {
    const target = new FakeElement()
    target.dataset = dataset
    target.value = value
    if (files !== undefined) target.files = files
    target.closest = (candidate) => candidate === selector ? { dataset } : null
    target.matches = (candidate) => candidate === selector
    return target
  }

  return {
    click(selector, dataset = {}) {
      const target = makeTarget({ selector, dataset })
      clickHandler({ target })
      documentClickHandler?.({ target })
    },
    input(selector, value, dataset = {}, eventProperties = {}) {
      inputHandler({
        target: makeTarget({ selector, dataset, value }),
        ...eventProperties,
      })
    },
    keydown(selector, key, dataset = {}) {
      keydownHandler({
        target: makeTarget({ selector, dataset }),
        key,
        preventDefault() {},
      })
    },
    change(selector, value, { dataset = {}, files } = {}) {
      changeHandler({ target: makeTarget({ selector, dataset, value, files }) })
    },
    runTimer(index, { evenIfCleared = true } = {}) {
      const timer = timers[index]
      assert.ok(timer, `expected timer ${index}`)
      if (evenIfCleared || !timer.cleared) timer.callback()
    },
    setConfirmResult(value) {
      nextConfirmResult = value
    },
    get html() {
      return appHtml
    },
    get timers() {
      return timers
    },
    get adsText() {
      return capturedAdsText
    },
  }
}

const selectStaticReportChain = (
  harness,
  chainId = 'chain-smart-construction',
) => {
  harness.change('[data-report-chain-select]', chainId)
}

const openStaticReportCreate = (
  harness,
  { selectDefaultChain = true } = {},
) => {
  harness.click('[data-job-section]', { jobSection: 'report' })
  harness.click('[data-report-action]', { reportAction: 'new' })
  if (selectDefaultChain) selectStaticReportChain(harness)
}

const selectStaticReportJob = (harness, jobId) => {
  harness.click('[data-report-job]', { reportJob: jobId })
}

const advanceStaticReport = (harness) => {
  harness.click('[data-report-step-next]')
}

test('static report renders a read-only major and native chain select', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness, { selectDefaultChain: false })
  assert.match(harness.html, /data-report-major-readonly/)
  assert.doesNotMatch(harness.html, /data-report-major(?:\s|=)/)
  assert.match(harness.html, /data-report-chain-select/)
  assert.match(harness.html, /<option value="">请选择产业链<\/option>/)
  assert.match(harness.html, /<option value="__custom__">自定义产业链<\/option>/)
  assert.doesNotMatch(harness.html, /data-report-chain-search/)
})

test('static report chain job mappings preserve canonical order for every chain', () => {
  const staticMappings = readStaticReportIndustryChainOptions().map(
    ({ id, jobIds }) => ({ id, jobIds }),
  )
  const canonicalMappings = REPORT_INDUSTRY_CHAIN_OPTIONS.map(
    ({ id, jobIds }) => ({ id, jobIds: [...jobIds] }),
  )

  assert.deepEqual(staticMappings, canonicalMappings)
})

test('static custom chain input appears only for the custom select option', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness, { selectDefaultChain: false })
  assert.doesNotMatch(harness.html, /data-report-custom-chain-input/)
  harness.change('[data-report-chain-select]', '__custom__')
  assert.match(harness.html, /data-report-custom-chain-input/)
  assert.match(harness.html, /暂无库内关联岗位/)
})

test('static report chain controls gate and filter job choices', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness, { selectDefaultChain: false })

  assert.match(harness.html, /产教调研报告/)
  assert.match(harness.html, /选择产业链/)
  assert.match(harness.html, /请先选择产业链/)
  assert.doesNotMatch(harness.html, /data-report-job=/)

  selectStaticReportChain(harness)
  assert.match(harness.html, /data-report-job="job-bim-deepening"/)

  harness.change('[data-report-chain-select]', '')
  assert.match(harness.html, /请先选择产业链/)
  assert.doesNotMatch(harness.html, /data-report-job=/)
})

test('static report accepts unique custom chain and multiple custom jobs', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness, { selectDefaultChain: false })

  harness.change('[data-report-chain-select]', '__custom__')
  harness.input('[data-report-custom-chain-input]', '城市更新服务链')
  harness.keydown('[data-report-custom-chain-input]', 'Enter')
  assert.match(harness.html, /暂无库内关联岗位/)

  harness.input('[data-report-custom-job-input]', '城市更新咨询师')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  harness.input('[data-report-custom-job-input]', '城市更新项目经理')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  assert.match(harness.html, /城市更新咨询师/)
  assert.match(harness.html, /城市更新项目经理/)

  harness.input('[data-report-custom-job-input]', ' 城市更新咨询师 ')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  assert.match(harness.html, /岗位名称已存在/)
})

test('static custom job uniqueness uses only the current chain visible candidates', () => {
  const sameChainHarness = createStaticReportHarness()
  openStaticReportCreate(sameChainHarness, { selectDefaultChain: false })
  selectStaticReportChain(
    sameChainHarness,
    'chain-building-digital-service',
  )
  sameChainHarness.input(
    '[data-report-custom-job-input]',
    'BIM深化设计工程师',
  )
  sameChainHarness.keydown('[data-report-custom-job-input]', 'Enter')
  assert.match(sameChainHarness.html, /岗位名称已存在/)

  const unrelatedHarness = createStaticReportHarness()
  openStaticReportCreate(unrelatedHarness, { selectDefaultChain: false })
  selectStaticReportChain(
    unrelatedHarness,
    'chain-building-digital-service',
  )
  unrelatedHarness.input(
    '[data-report-custom-job-input]',
    '建筑智能运维工程师',
  )
  unrelatedHarness.keydown('[data-report-custom-job-input]', 'Enter')
  assert.doesNotMatch(unrelatedHarness.html, /岗位名称已存在/)
  assert.match(
    unrelatedHarness.html,
    /<span>建筑智能运维工程师<button type="button" data-report-custom-job-remove=/,
  )

  const customChainHarness = createStaticReportHarness()
  openStaticReportCreate(customChainHarness, { selectDefaultChain: false })
  customChainHarness.change('[data-report-chain-select]', '__custom__')
  customChainHarness.input(
    '[data-report-custom-chain-input]',
    '城市更新服务链',
  )
  customChainHarness.keydown('[data-report-custom-chain-input]', 'Enter')
  customChainHarness.input(
    '[data-report-custom-job-input]',
    'BIM深化设计工程师',
  )
  customChainHarness.keydown('[data-report-custom-job-input]', 'Enter')
  assert.doesNotMatch(customChainHarness.html, /岗位名称已存在/)
  assert.match(
    customChainHarness.html,
    /<span>BIM深化设计工程师<button type="button" data-report-custom-job-remove=/,
  )
})

test('static report rejects library-name custom chain and generates custom jobs', () => {
  const harness = createStaticReportHarness({ deferTimers: true })
  openStaticReportCreate(harness, { selectDefaultChain: false })

  harness.change('[data-report-chain-select]', '__custom__')
  harness.input('[data-report-custom-chain-input]', '智能建造产业链')
  harness.keydown('[data-report-custom-chain-input]', 'Enter')
  assert.match(harness.html, /产业链名称已存在/)

  harness.input('[data-report-custom-chain-input]', '城市更新服务链')
  harness.keydown('[data-report-custom-chain-input]', 'Enter')
  harness.input('[data-report-custom-job-input]', '城市更新咨询师')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  advanceStaticReport(harness)
  advanceStaticReport(harness)
  harness.click('[data-report-action]', { reportAction: 'generate' })
  harness.runTimer(0)

  assert.match(harness.html, /产业链：城市更新服务链/)
  assert.match(harness.html, /城市更新咨询师/)
  harness.click('[data-report-action]', { reportAction: 'library' })
  assert.match(harness.html, /城市更新服务链/)
  assert.match(harness.html, /data-report-edit="7"/)
})

test('static report restores a saved custom chain name when editing', () => {
  const harness = createStaticReportHarness({ deferTimers: true })
  openStaticReportCreate(harness, { selectDefaultChain: false })
  harness.change('[data-report-chain-select]', '__custom__')
  harness.input('[data-report-custom-chain-input]', '城市更新服务链')
  harness.keydown('[data-report-custom-chain-input]', 'Enter')
  harness.input('[data-report-custom-job-input]', '城市更新咨询师')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  advanceStaticReport(harness)
  advanceStaticReport(harness)
  harness.click('[data-report-action]', { reportAction: 'generate' })
  harness.runTimer(0)
  harness.click('[data-report-action]', { reportAction: 'library' })
  harness.click('[data-report-edit]', { reportEdit: '7' })
  harness.click('[data-report-action]', { reportAction: 'create' })
  harness.click('[data-report-step-previous]')
  harness.click('[data-report-step-previous]')

  assert.match(harness.html, /data-report-custom-chain-input value="城市更新服务链"/)
})

test('static report restores a normalized legacy library chain when returning to parameters', () => {
  const legacySource = staticHtml.replace(
    "        staticReportForm = {\n          title: '智能建造工程专业产业调研报告',",
    `        staticReportRows[0] = {
          ...staticReportRows[0],
          industry: '  智能建造产业链  ',
          industryChainId: '',
          industryChainName: '',
          industryChainSource: 'library'
        }
        staticReportForm = {
          title: '智能建造工程专业产业调研报告',`,
  )
  assert.notEqual(legacySource, staticHtml)
  const harness = createStaticReportHarness({ source: legacySource })
  harness.click('[data-job-section]', { jobSection: 'report' })
  harness.click('[data-report-edit]', { reportEdit: '1' })
  harness.click('[data-report-action]', { reportAction: 'create' })
  harness.click('[data-report-step-previous]')
  harness.click('[data-report-step-previous]')

  assert.match(
    harness.html,
    /<option value="chain-smart-construction" selected>智能建造产业链<\/option>/,
  )
  assert.match(harness.html, /data-report-job="job-bim-deepening"/)
})

test('results menu exposes the expected actions', () => {
  for (const label of ['查看成果页', '编辑成果页', '门户设置', '复制链接']) {
    assert.match(appSource, new RegExp(label))
  }
})

test('results portal opens in a new browser tab', () => {
  assert.match(appSource, /openResultsPortal/)
  assert.match(appSource, /buildStandaloneViewUrl\('results-portal'\)/)
  assert.match(standaloneViewUtil, /const opened = window\.open\(urlString, '_blank'\)/)
  assert.match(standaloneViewUtil, /window\.location\.href = urlString/)
})

test('Vue standalone view browser helpers are extracted from the entry component', () => {
  assert.match(appVue, /from '\.\/utils\/standalone-view'/)
  assert.doesNotMatch(appVue, /const buildStandaloneViewUrl = \(/)
  assert.doesNotMatch(appVue, /const openStandaloneView = \(/)
  assert.match(standaloneViewUtil, /export const buildStandaloneViewUrl = \(/)
  assert.match(standaloneViewUtil, /export const openStandaloneView = \(/)
  assert.match(standaloneViewUtil, /window\.open\(urlString, '_blank'\)/)
  assert.match(standaloneViewUtil, /window\.location\.href = urlString/)
})

test('Vue graph layout builder is extracted from the entry component', () => {
  assert.match(appVue, /from '\.\/utils\/graph-layout'/)
  assert.doesNotMatch(appVue, /const buildGraphLayout = \(jobs: JobCard\[\]/)
  assert.match(graphLayoutUtil, /export const buildGraphLayout = \(/)
  assert.match(graphLayoutUtil, /export type GraphLayoutLink = \{/)
  assert.match(graphLayoutUtil, /courses: CourseNode\[\]/)
  assert.match(appVue, /buildGraphLayout\(\{/)
})

test('top navigation displays the job module as 产教模型 while keeping its route key', () => {
  assert.match(appConfig, /\{ label: '岗位中心', displayLabel: '产教模型', icon: '◎' \}/)
  assert.match(appVue, /\{\{ item\.displayLabel \?\? item\.label \}\}/)
  assert.match(staticHtml, /data-module="job"><span class="tab-icon">◎<\/span>产教模型<\/button>/)
  assert.doesNotMatch(staticHtml, /data-module="job"><span class="tab-icon">◎<\/span>岗位中心<\/button>/)
})

test('results portal navigation places 岗位中心 before 课程体系', () => {
  const navMatch = appSource.match(/const resultsPortalNav = \[([\s\S]*?)\]/)
  assert.ok(navMatch)
  assert.ok(navMatch[1].indexOf("label: '岗位中心'") < navMatch[1].indexOf("label: '课程体系'"))
})

test('static html entry exposes hover menu and results portal renderer', () => {
  assert.match(staticHtml, /data-results-open/)
  assert.match(staticHtml, /resultsPortalHtml/)
  assert.match(staticHtml, /const resultsPortalUrl = \(\) => buildStaticViewUrl\('results-portal'\)/)
  assert.match(staticHtml, /openStaticView\(resultsPortalUrl\(\)\)/)
})

test('static html file view renders the dark results portal without throwing', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  const app = {
    innerHTML: '',
    querySelector() {
      return null
    },
    addEventListener() {}
  }

  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) {
      return selector === '#app' ? app : null
    }
  }

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html?view=results-portal')
  class FakeElement {}

  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: {
        protocol: 'file:',
        href: url.toString(),
        search: url.search,
        pathname: url.pathname
      },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame() { return 1 },
      open() { return { opener: null } },
      scrollTo() {}
    },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame() { return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  assert.doesNotThrow(() => {
    vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  })
  assert.match(app.innerHTML, /results-portal-shell/)
  assert.match(app.innerHTML, /智能建造工程专业/)
  assert.match(app.innerHTML, /该专业下的关联岗位/)
  assert.doesNotMatch(app.innerHTML, /<strong>0<\/strong><em>专业课程<\/em>/)
  assert.doesNotMatch(app.innerHTML, /<strong>0<\/strong><em>建设岗位<\/em>/)
})

test('industry regional SVG map preserves its natural aspect ratio', () => {
  assert.match(
    staticHtml,
    /<svg class=\\"china-heatmap\\" viewBox=\\"0 0 820 590\\" preserveAspectRatio=\\"xMidYMid meet\\"/
  )

  const mapBlock = styleBlock('.china-heatmap')
  assert.match(mapBlock, /aspect-ratio:\s*820\s*\/\s*590;/)
  assert.match(mapBlock, /height:\s*auto;/)
  assert.doesNotMatch(mapBlock, /height:\s*540px;/)
})

test('static industry chain graph suppresses node-level national industry tags', () => {
  assert.match(staticHtml, /const staticIndustryNodeNationalIndustries = \{/)
  assert.match(staticHtml, /design:\s*\[[^\]]*'E 建筑业'[^\]]*'M 科学研究和技术服务业'/)
  assert.match(staticHtml, /software:\s*\[[^\]]*'I 信息传输、软件和信息技术服务业'/)
  assert.match(staticHtml, /construction:\s*\[[^\]]*'E 建筑业'/)
  assert.doesNotMatch(staticHtml, /staticIndustryNodeNationalTagsHtml\(node\.id\)/)
  assert.doesNotMatch(staticHtml, /staticNationalIndustryTagHtml/)
  assert.doesNotMatch(staticHtml, /class="industry-node-national-code"/)
  assert.doesNotMatch(staticHtml, /class="industry-node-national-name"/)
  assert.doesNotMatch(staticHtml, /class="industry-node-national-tags"/)
  assert.doesNotMatch(staticHtml, /class="industry-stage-national-tags"/)
  assert.match(staticHtml, /data-basic-industry-national-industries/)
  assert.match(staticHtml, /nationalIndustries/)
  assert.doesNotMatch(stylesCss, /\.industry-node-national-tags/)
  assert.doesNotMatch(stylesCss, /\.industry-node-national-code/)
  assert.doesNotMatch(stylesCss, /\.industry-node-national-name/)
  assert.doesNotMatch(stylesCss, /\.industry-stage-national-tags/)
})

test('regional industry analysis presents three KPI cards without cooperation leads', () => {
  const regionKpiSection = appVue.match(
    /<section class="demand-kpi-grid industry-kpi-grid industry-region-kpi-grid industry-research-figma-board">([\s\S]*?)<\/section>/
  )

  assert.ok(regionKpiSection, 'regional KPI section should use its own layout class')
  assert.match(regionKpiSection[1], />覆盖省份</)
  assert.match(regionKpiSection[1], />企业样本</)
  assert.match(regionKpiSection[1], />重点城市</)
  assert.doesNotMatch(regionKpiSection[1], /合作线索/)

  const regionKpiStyles = styleBlock('.demand-kpi-grid.industry-region-kpi-grid')
  assert.match(regionKpiStyles, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/)
  assert.match(appVue, /industry-research-figma-board/)
  assert.match(staticHtml, /industry-research-figma-board/)
  assert.match(appVue, /industry-figma-kpi-card/)
  assert.match(staticHtml, /industry-figma-kpi-card/)
  assert.match(appVue, /industry-region-figma-dashboard/)
  assert.match(staticHtml, /industry-region-figma-dashboard/)
})

test('static regional industry map drills from province to city list', () => {
  assert.match(staticHtml, /let staticSelectedIndustryMapProvince = null/)
  assert.match(staticHtml, /data-map-drill-province/)
  assert.match(staticHtml, /data-map-drill-back/)
  assert.match(staticHtml, /industry-map-drill-card/)
  assert.match(staticHtml, /industry-map-city-list/)
  assert.match(staticHtml, /staticIndustryCityMapHtml/)
  assert.match(staticHtml, /staticIndustryMapProvinceCount/)
  assert.match(staticHtml, /industry-city-map-panel/)
  assert.match(staticHtml, /staticRegionCityGeoData/)
  assert.match(staticHtml, /industry-city-map-region/)
  assert.doesNotMatch(staticHtml, /industry-city-map-shape/)
  assert.doesNotMatch(staticHtml, /industry-city-map-grid/)
  assert.match(staticHtml, /data-map-drill-city/)
  assert.match(staticHtml, /深圳/)
  assert.match(staticHtml, /广州/)
  assert.match(staticHtml, /renderIndustry\('region', \{ preserveScroll: true \}\)/)
})

test('regional city drilldown uses sourced province city boundary data', () => {
  assert.match(staticHtml, /src="\.\/src\/data\/static-region-city-geo\.js"/)
  assert.match(staticRegionCityGeo, /window\.staticRegionCityGeoData/)
  assert.match(staticRegionCityGeo, /DataV\.GeoAtlas/)
  assert.match(staticRegionCityGeo, /ChinaGeoJson/)
  assert.match(staticRegionCityGeo, /四川/)
  assert.match(staticRegionCityGeo, /成都市/)
  assert.match(staticRegionCityGeo, /内蒙古/)
  assert.match(staticRegionCityGeo, /呼和浩特市/)
  assert.match(staticRegionCityGeo, /"d":"M/)
})

test('regional map cards use the shared spacing contract', () => {
  assert.match(stylesCss, /--region-card-head-padding-block:\s*22px/)
  assert.match(stylesCss, /--region-card-head-padding-inline:\s*24px/)
  assert.match(stylesCss, /--region-card-head-gap:\s*16px/)
  assert.match(styleBlock('.industry-map-card .research-card-head'), /padding:\s*var\(--region-card-head-padding-block\)\s+var\(--region-card-head-padding-inline\);/)
  assert.match(styleBlock('.industry-rank-card .research-card-head'), /padding:\s*var\(--region-card-head-padding-block\)\s+var\(--region-card-head-padding-inline\);/)
  assert.match(styleBlock('.industry-map-drill-card .research-card-head'), /gap:\s*var\(--region-card-head-gap\);/)
})

test('job industry header lists current industry chains as top buttons', () => {
  const industryHeader = appVue.match(/<div v-if="currentJobSection === '产业调研'" class="job-research-page">[\s\S]*?<p v-if="showIndustryResearchChrome" class="research-page-purpose">/)?.[0] ?? ''
  const staticIndustryRenderer = staticHtml.match(/const industryHtml = \(tab = 'chain'\) => \{[\s\S]*?const reportSectionChineseNums/)?.[0] ?? ''

  assert.match(appSource, /const selectedIndustryChain = ref\('智能建造产业链'\)/)
  assert.match(appSource, /const activeIndustryChainLabel = computed/)
  assert.match(industryHeader, /class="research-chain-tabs-wrap"/)
  assert.match(industryHeader, /class="research-chain-tabs"/)
  assert.match(industryHeader, /<button[\s\S]*v-for="industry in REPORT_INDUSTRY_OPTIONS"[\s\S]*class="research-chain-tab"/)
  assert.match(industryHeader, /:class="\{ active: selectedIndustryChain === industry \}"/)
  assert.match(industryHeader, /:aria-pressed="selectedIndustryChain === industry"/)
  assert.match(industryHeader, /@click="selectedIndustryChain = industry"/)
  assert.doesNotMatch(industryHeader, /<select/)
  assert.doesNotMatch(appSource, /当前产业链：\{\{ industry \}\}/)
  assert.match(styleBlock('.research-chain-tabs-wrap'), /display:\s*grid/)
  assert.match(styleBlock('.research-chain-tabs'), /display:\s*flex/)
  assert.match(styleBlock('.research-chain-tab'), /white-space:\s*nowrap/)
  assert.match(stylesCss, /\.research-chain-tab\.active\s*\{/)
  assert.match(staticHtml, /const staticCurrentIndustryChainTabs = \(extraClass = ''\) =>/)
  assert.match(staticHtml, /data-current-industry-chain-tab/)
  assert.match(staticHtml, /class="research-chain-tab \$\{item === staticSelectedIndustryChain \? 'active' : ''\}"/)
  assert.match(staticHtml, /aria-pressed="\$\{item === staticSelectedIndustryChain \? 'true' : 'false'\}"/)
  assert.match(staticIndustryRenderer, /staticCurrentIndustryChainTabs\(\)/)
  assert.doesNotMatch(staticIndustryRenderer, /staticCurrentIndustryChainSelect\(\)/)
  assert.doesNotMatch(appSource, /<span>当前产业链：\{\{ activeIndustryChainLabel \}\}<\/span>/)
  assert.doesNotMatch(staticHtml, /<span>当前产业链：\$\{staticEscapeText\(staticSelectedIndustryChain\)\}<\/span>/)
  assert.doesNotMatch(appSource, /<button class="research-chain-select">当前产业链：智能建造产业链⌄<\/button>/)
})

test('static job research header uses current industry chain tabs instead of a select', () => {
  const staticResearchRenderer = staticHtml.match(/const researchHtml = \(tab = 'portrait'\) => \{[\s\S]*?const industryHtml = \(tab = 'chain'\) => \{/)?.[0] ?? ''
  const staticChainTabHandler = staticHtml.match(/const industryChainTab = target\.closest\('\[data-current-industry-chain-tab\]'\)[\s\S]*?if \(talentSection\)/)?.[0] ?? ''

  assert.match(staticResearchRenderer, /staticCurrentIndustryChainTabs\(\)/)
  assert.doesNotMatch(staticResearchRenderer, /staticCurrentIndustryChainSelect\(\)/)
  assert.match(staticChainTabHandler, /renderResearch\(tab \|\| staticCurrentResearchTab \|\| 'portrait'/)
  assert.match(staticChainTabHandler, /renderIndustry\(tab \|\| 'chain'/)
  assert.doesNotMatch(staticChainTabHandler, /staticCurrentIndustryTab/)
})

test('static job sidebar keeps primary entries visible and nests research groups', () => {
  assert.match(staticHtml, /data-job-primary="research"[\s\S]*<strong>产业调研<\/strong>/)
  assert.match(staticHtml, /data-job-primary="report"[\s\S]*<strong>报告生成<\/strong>/)
  assert.doesNotMatch(staticHtml, /data-job-primary="build"/)
  assert.doesNotMatch(staticHtml, /<strong>岗位建设中心<\/strong>/)
  assert.match(staticHtml, /data-job-sub-menu="research"/)
  assert.match(staticHtml, /data-job-section="report"[\s\S]*产教调研报告/)
  assert.match(staticHtml, /activeSection === 'research' && activeResearchMode === 'industry' && activeIndustryTab === key/)
  assert.match(staticHtml, /activeSection === 'research' && activeResearchMode === 'job' && activeResearchTab === key/)
  assert.doesNotMatch(staticHtml, /activeResearchSubtitle/)
  assert.doesNotMatch(staticHtml, /<em>· \$\{activeResearchSubtitle\} ·<\/em>/)
  assert.match(staticHtml, /aria-expanded="\$\{researchMenuOpen \? 'true' : 'false'\}"/)
  assert.match(staticHtml, /data-job-sub-menu="research" aria-hidden="false"/)
  assert.match(staticHtml, /<div class="job-sub-title">· 产业布局 ·<\/div>[\s\S]*<div class="job-sub-title job-sub-title-spaced">· 岗位分析 ·<\/div>/)
  assert.doesNotMatch(staticHtml, /<div class="job-sub-title">产业布局<\/div>/)
  assert.doesNotMatch(staticHtml, /<div class="job-sub-title job-sub-title-spaced">岗位分析<\/div>/)
  assert.match(staticHtml, /toggleStaticJobMenu/)
  assert.match(staticHtml, /app\.querySelectorAll\('\[data-job-menu\], \[data-job-sub-menu\]'\)/)
  assert.match(stylesCss, /\.section-menu \.job-sub-menu\s*\{[\s\S]*width:\s*128px;/)
  assert.doesNotMatch(staticHtml, /data-job-section="research">产业调研/)
  assert.doesNotMatch(staticHtml, /data-job-menu="report"[\s\S]*产业调研报告/)
})

test('static html default file view starts empty but can add jobs from job analysis candidates', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  class DomElement {}
  const appendedDialogs = []
  const app = {
    innerHTML: '',
    querySelector() { return null },
    appendChild(node) {
      appendedDialogs.push(node)
    },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
    }
  }

  const storage = {}
  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return { className: '', innerHTML: '', style: {}, appendChild() {}, setAttribute() {}, addEventListener() {}, querySelector() { return null }, querySelectorAll() { return [] } }
    }
  }

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html')
  const sandbox = {
    console,
    Element: DomElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open() { return { opener: null } },
      scrollTo() {},
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
    },
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  assert.doesNotThrow(() => {
    vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  })
  assert.match(app.innerHTML, /产业链图谱/)
  assert.match(app.innerHTML, /产业调研数据未初始化/)

  const buildSectionButton = new DomElement()
  buildSectionButton.closest = (selector) => {
    if (selector === '[data-job-section]') return buildSectionButton
    if (selector === '[data-job-section="build"]') return buildSectionButton
    return null
  }
  buildSectionButton.dataset = { jobSection: 'build' }
  buildSectionButton.matches = () => false
  buildSectionButton.classList = { contains() { return false } }
  assert.equal(typeof clickHandler, 'function')
  assert.doesNotThrow(() => clickHandler({ target: buildSectionButton }))

  assert.match(app.innerHTML, /岗位中心智能总结/)
  assert.match(app.innerHTML, /暂无岗位建设数据/)
  assert.doesNotMatch(app.innerHTML, /data-import-template-jobs/)
  assert.doesNotMatch(app.innerHTML, /<h3>产业岗位课程图谱<\/h3>/)
  assert.doesNotMatch(app.innerHTML, /graph-panel/)
  assert.doesNotMatch(app.innerHTML, /job-card/)
  assert.doesNotMatch(app.innerHTML, /results-portal-shell/)
  assert.match(appSource, /const templateJobsImported = ref\(false\)/)
  assert.match(staticHtml, /let staticTemplateImported = false/)

  const addButton = new DomElement()
  addButton.closest = (selector) => {
    if (selector === '[data-open-add-dialog]') return addButton
    return null
  }
  addButton.matches = () => false
  addButton.classList = { contains() { return false } }

  assert.doesNotThrow(() => clickHandler({ target: addButton }))
  assert.equal(appendedDialogs.length, 1)
  assert.doesNotMatch(appendedDialogs[0].innerHTML, /产业调研 \/ 岗位分析/)
  assert.match(appendedDialogs[0].innerHTML, /手动添加岗位/)
  assert.match(appendedDialogs[0].innerHTML, /data-open-manual-job-dialog/)
  assert.doesNotMatch(appendedDialogs[0].innerHTML, /一键导入智能建造工程专业岗位建设示例数据/)
  assert.match(appendedDialogs[0].innerHTML, /从产业调研沉淀的岗位中选择/)
  assert.match(appendedDialogs[0].innerHTML, /BIM深化设计工程师/)
  assert.match(appendedDialogs[0].innerHTML, /智慧工地管理工程师/)
  assert.match(appendedDialogs[0].innerHTML, /可添加/)
})

test('Vue add job dialog exposes manual single job creation', () => {
  const initActions = appSource.match(/<div class="job-init-actions">([\s\S]*?)<\/div>/)
  assert.ok(initActions)
  assert.doesNotMatch(initActions[1], /openManualJobDialog/)
  const staticInitActions = staticHtml.match(/<div class="job-init-actions">([\s\S]*?)<\/div>/)
  assert.ok(staticInitActions)
  assert.doesNotMatch(staticInitActions[1], /data-open-manual-job-dialog/)
  assert.match(appSource, /手动添加岗位/)
  assert.match(appSource, /@click="openManualJobDialog"/)
  assert.match(appSource, /@click="saveManualJob"/)
  assert.match(appSource, /addJobDialogOpen\.value = false\s+manualJobDialogOpen\.value = true/)
  assert.match(appSource, /data-manual-job-quick-form/)
  assert.doesNotMatch(appSource, /aria-label="导入智能建造演示岗位数据"/)
  assert.doesNotMatch(appSource, /@click="importTemplateJobs"/)
  assert.match(staticHtml, /data-open-manual-job-dialog/)
  assert.match(staticHtml, /data-save-manual-job/)
  assert.match(staticHtml, /app\.querySelector\('\.add-job-dialog'\)\?\.closest\('\.dialog-backdrop'\)\?\.remove\(\)/)
  assert.doesNotMatch(staticHtml, /data-import-template-jobs/)
})

test('Vue entry lazy loads xlsx only when Excel import or template export is used', () => {
  assert.doesNotMatch(appVue, /import \* as XLSX from 'xlsx'/)
  assert.match(appVue, /from '\.\/utils\/ability-import'/)
  assert.doesNotMatch(appVue, /const loadXlsx = \(\) => import\('xlsx'\)/)
  assert.match(abilityImportUtil, /const loadXlsx = \(\) => import\('xlsx'\)/)
  assert.match(abilityImportUtil, /export const buildAbilityTemplateWorkbook = async \(\)/)
  assert.match(abilityImportUtil, /export const parseAbilityImportWorkbook = async \(file: File, jobName: string\)/)
  assert.match(abilityImportUtil, /const XLSX = await loadXlsx\(\)/)
  assert.match(appVue, /const downloadAbilityTemplate = async \(\) =>/)
})

test('static job build list shows 12 jobs per page', () => {
  assert.match(staticHtml, /const staticBuildJobPageSize = 12/)
  assert.match(staticHtml, /staticPagedBuildJobs/)
  assert.match(staticHtml, /Math\.ceil\(getStaticBuildJobs\(\)\.length \/ staticBuildJobPageSize\)/)
  assert.match(staticHtml, /activeStaticBuildJobPage \* staticBuildJobPageSize/)
})

test('static generation ignores an old callback after leaving and editing another report', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness)
  harness.input('[data-report-form-title]', '待取消的报告 A')
  selectStaticReportJob(harness, 'job-bim-deepening')
  advanceStaticReport(harness)
  advanceStaticReport(harness)
  harness.click('[data-report-action]', { reportAction: 'generate' })
  assert.equal(harness.timers.length, 1)

  harness.click('[data-report-action]', { reportAction: 'library' })
  harness.click('[data-report-edit]', { reportEdit: '1' })
  harness.runTimer(0)
  harness.click('[data-report-action]', { reportAction: 'library' })

  const originalRow = harness.html.match(
    /<tr><td><strong>智能建造工程专业产业调研报告<\/strong>[\s\S]*?<\/tr>/,
  )
  assert.ok(originalRow)
  assert.match(originalRow[0], /已完成/)
  assert.doesNotMatch(harness.html, /待取消的报告 A/)
  assert.doesNotMatch(harness.html, /data-report-edit="7"/)
})

test('static report creation allows selecting more than ten jobs', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness)
  const jobIds = [
    'job-bim-modeler',
    'job-bim-deepening',
    'job-parametric-design',
    'job-prefab-designer',
    'job-component-production',
    'job-prefab-quality',
    'job-smart-construction-tech',
    'job-construction-robot-operator',
    'job-uav-construction',
    'job-smart-site-manager',
    'job-project-digital-manager',
  ]
  jobIds.forEach((jobId) => selectStaticReportJob(harness, jobId))

  assert.match(harness.html, /已选择 11 个/)
  assert.doesNotMatch(harness.html, /最多选择 10 个|\/ 10/)
  assert.doesNotMatch(harness.html, /data-report-job="[^"]+"[^>]*disabled/)
})

test('static report searches do not rerender during Chinese IME composition', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness)
  harness.click('[data-report-region-clear]')
  const initialHtml = harness.html

  harness.input(
    '[data-report-region-search]',
    '沈',
    {},
    { isComposing: true },
  )

  assert.equal(harness.html, initialHtml)

  harness.input('[data-report-region-search]', '沈阳市')
  assert.match(harness.html, /data-report-region-search value="沈阳市"/)
  assert.match(harness.html, /data-report-region-option="city:210100"/)
})

test('static report region search panel closes on outside click', () => {
  const harness = createStaticReportHarness()
  openStaticReportCreate(harness)
  harness.click('[data-report-region-clear]')

  harness.input('[data-report-region-search]', '沈阳')
  assert.match(harness.html, /data-report-region-option="city:210100"/)
  harness.click('[data-report-step]', { reportStep: '1' })
  assert.doesNotMatch(harness.html, /data-report-region-option=/)
})

test('static report TOC edits persist when returning to parameters', () => {
  const harness = createStaticReportHarness({ confirmResult: false })
  openStaticReportCreate(harness)
  selectStaticReportJob(harness, 'job-bim-deepening')
  advanceStaticReport(harness)

  const tocId = harness.html.match(/data-report-toc-title="([^"]+)"/)?.[1]
  assert.ok(tocId)
  harness.input('[data-report-toc-title]', '已修改的专业目录', {
    reportTocTitle: tocId,
  })
  harness.click('[data-report-step-previous]')
  advanceStaticReport(harness)

  assert.match(harness.html, /步骤 2 \/ 3/)
  assert.match(harness.html, /已修改的专业目录/)
  assert.match(harness.html, /默认目录，可按需调整/)
  assert.doesNotMatch(harness.html, /data-report-kind|data-report-template|data-report-creation-mode/)
})

test('static reports keep their adjusted TOC and file count after reload', () => {
  const harness = createStaticReportHarness({ deferTimers: false })
  openStaticReportCreate(harness)
  selectStaticReportJob(harness, 'job-bim-deepening')
  harness.change('[data-report-files]', '', { files: [{}, {}, {}] })
  advanceStaticReport(harness)
  harness.click('[data-report-toc-add]')
  assert.match(harness.html, /新增章节/)
  advanceStaticReport(harness)
  harness.click('[data-report-action]', { reportAction: 'generate' })
  harness.click('[data-report-action]', { reportAction: 'library' })
  harness.click('[data-report-edit]', { reportEdit: '7' })
  harness.click('[data-report-action]', { reportAction: 'create' })

  assert.match(harness.html, /3 个文件/)
  harness.click('[data-report-step-previous]')
  assert.match(harness.html, /默认目录，可按需调整/)
  harness.click('[data-report-step-previous]')
  assert.doesNotMatch(harness.html, /data-report-template|data-report-creation-mode/)
  advanceStaticReport(harness)
  assert.match(harness.html, /新增章节/)
})

test('static regeneration stays done and ADS keeps reverse job order', () => {
  const harness = createStaticReportHarness({ deferTimers: false })
  openStaticReportCreate(harness)
  selectStaticReportJob(harness, 'job-smart-site-manager')
  selectStaticReportJob(harness, 'job-bim-deepening')
  advanceStaticReport(harness)
  advanceStaticReport(harness)
  harness.click('[data-report-action]', { reportAction: 'generate' })
  harness.click('[data-report-action]', { reportAction: 'save' })
  harness.click('[data-report-action]', { reportAction: 'create' })
  harness.click('[data-report-action]', { reportAction: 'generate' })
  harness.click('[data-report-action]', { reportAction: 'preview' })
  harness.click('[data-report-action]', { reportAction: 'ads' })

  const ads = JSON.parse(harness.adsText)
  assert.equal(ads.metadata.major, '智能建造工程专业')
  assert.equal(ads.metadata.majorGroup, '智能建造工程专业')
  assert.equal(ads.metadata.industryChainId, 'chain-smart-construction')
  assert.equal(ads.metadata.industryChainName, '智能建造产业链')
  assert.equal(ads.metadata.industryChainSource, 'library')
  assert.equal(Object.hasOwn(ads.metadata, 'relatedIndustryCode'), true)
  assert.equal(Object.hasOwn(ads.metadata, 'relatedIndustry'), true)
  assert.equal(ads.metadata.relatedIndustryCode, '')
  assert.equal(ads.metadata.relatedIndustry, '')
  assert.deepEqual(ads.metadata.regionNames, ['沈阳市', '京津冀'])
  assert.deepEqual(
    ads.metadata.jobIds,
    ['job-smart-site-manager', 'job-bim-deepening'],
  )
  assert.deepEqual(
    ads.metadata.jobNames,
    ['智慧工地管理工程师', 'BIM深化设计工程师'],
  )

  harness.click('[data-report-action]', { reportAction: 'library' })
  const regeneratedRow = harness.html.match(
    /<tr><td><strong>智能建造工程专业产业调研报告<\/strong>[\s\S]*?data-report-edit="7"[\s\S]*?<\/tr>/,
  )
  assert.ok(regeneratedRow)
  assert.match(regeneratedRow[0], /已完成/)
})

test('static custom-chain ADS matches the empty-id serialization contract', () => {
  const harness = createStaticReportHarness({ deferTimers: false })
  openStaticReportCreate(harness, { selectDefaultChain: false })
  harness.change('[data-report-chain-select]', '__custom__')
  harness.input('[data-report-custom-chain-input]', '城市更新服务链')
  harness.keydown('[data-report-custom-chain-input]', 'Enter')
  harness.input('[data-report-custom-job-input]', '城市更新咨询师')
  harness.keydown('[data-report-custom-job-input]', 'Enter')
  advanceStaticReport(harness)
  advanceStaticReport(harness)
  harness.click('[data-report-action]', { reportAction: 'generate' })
  harness.click('[data-report-action]', { reportAction: 'preview' })
  harness.click('[data-report-action]', { reportAction: 'ads' })

  const ads = JSON.parse(harness.adsText)
  assert.equal(ads.metadata.industryChainId, '')
  assert.equal(ads.metadata.industryChainName, '城市更新服务链')
  assert.equal(ads.metadata.industryChainSource, 'custom')
})

test('static default TOC allows adding a root and deleting its child', () => {
  const harness = createStaticReportHarness({ deferTimers: false })
  openStaticReportCreate(harness)
  selectStaticReportJob(harness, 'job-bim-deepening')
  advanceStaticReport(harness)
  harness.click('[data-report-toc-add]')

  const rootId = harness.html.match(
    /value="新增章节" data-report-toc-title="([^"]+)"/,
  )?.[1]
  assert.ok(rootId)
  const childId = harness.html.match(
    /value="新增小节" data-report-toc-title="([^"]+)"/,
  )?.[1]
  assert.ok(childId)
  harness.click('[data-report-toc-delete]', {
    reportTocDelete: childId,
  })
  assert.doesNotMatch(harness.html, /value="新增小节"/)
  assert.match(harness.html, /value="新增章节"/)
})

test('static validation requires an industry chain and at least one region', () => {
  const missingRegionHarness = createStaticReportHarness({ deferTimers: false })
  openStaticReportCreate(missingRegionHarness)
  selectStaticReportJob(missingRegionHarness, 'job-bim-deepening')
  missingRegionHarness.click('[data-report-region-clear]')
  advanceStaticReport(missingRegionHarness)
  assert.match(missingRegionHarness.html, /步骤 1 \/ 3/)
  assert.match(missingRegionHarness.html, /请至少选择一个城市或经济区/)

  const missingIndustryHarness = createStaticReportHarness({ deferTimers: false })
  openStaticReportCreate(missingIndustryHarness)
  selectStaticReportJob(missingIndustryHarness, 'job-bim-deepening')
  missingIndustryHarness.change('[data-report-chain-select]', '')
  advanceStaticReport(missingIndustryHarness)
  assert.match(missingIndustryHarness.html, /步骤 1 \/ 3/)
  assert.match(missingIndustryHarness.html, /请选择或输入产业链/)
})

test('static dynamic report content escapes hostile job names', () => {
  const functionSource = sourceSlice(
    staticHtml,
    'const buildStaticDynamicReportContent = (',
    'const loadStaticReportConfiguration = (report) => {',
  )
  const sandbox = {
    staticReportJobOptions: [{
      id: 'hostile-job',
      name: '<img src=x onerror=alert(1)>',
    }],
    staticReportForm: {
      title: '安全报告',
      reportKind: 'industry',
      major: '',
      industryChainName: '智能建造产业链',
      region: '辽宁省',
      jobIds: ['hostile-job'],
      customJobNames: [],
      creationMode: 'custom',
    },
    staticReportFileCount: 0,
    resolveStaticReportJobNames(jobIds, customJobNames = []) {
      return [
        ...jobIds.map(() => '<img src=x onerror=alert(1)>'),
        ...customJobNames,
      ]
    },
    reportContentHtml: '<h1>旧标题</h1><p class="report-doc-subtitle">旧副标题</p><h2>正文</h2>',
    result: '',
  }
  vm.createContext(sandbox)
  vm.runInContext(
    `${functionSource}\nresult = buildStaticDynamicReportContent(staticReportForm, staticReportFileCount, '2026-07-27')`,
    sandbox,
  )

  assert.match(sandbox.result, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(sandbox.result, /<img src=x onerror=alert\(1\)>/)
})

test('static dynamic report subtitle escapes a custom chain name exactly once', () => {
  const functionSource = sourceSlice(
    staticHtml,
    'const buildStaticDynamicReportContent = (',
    'const loadStaticReportConfiguration = (report) => {',
  )
  const sandbox = {
    staticReportForm: {},
    staticReportFileCount: 0,
    resolveStaticReportJobNames() {
      return []
    },
    reportContentHtml: '<h1>旧标题</h1><p class="report-doc-subtitle">旧副标题</p><h2>正文</h2>',
    result: '',
  }
  vm.createContext(sandbox)
  vm.runInContext(
    `${functionSource}\nresult = buildStaticDynamicReportContent({
      title: '自定义报告',
      major: '智能建造工程专业',
      industryChainName: 'R&D服务链',
      region: '沈阳市',
      jobIds: [],
      customJobNames: []
    }, 0, '2026-07-27')`,
    sandbox,
  )

  assert.match(sandbox.result, /产业链：R&amp;D服务链/)
  assert.doesNotMatch(sandbox.result, /R&amp;amp;D服务链/)
})

test('static report navigation renders library and creation states without errors', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  let inputHandler = null
  let changeHandler = null
  let confirmCalls = 0
  let requestedTocSelector = ''
  let focusCalls = 0
  let expectedTocSelector = ''
  const invalidTocInput = { focus() { focusCalls += 1 } }
  let openedUrl = ''
  let appHtml = ''
  let failNextReportEditorRender = false
  let deferWindowTimeout = false
  const scheduledWindowTimeouts = []
  let capturedAdsText = ''
  class CapturingBlob {
    constructor(parts) {
      capturedAdsText = parts.map((part) => String(part)).join('')
    }
  }
  class SandboxURL extends URL {}
  SandboxURL.createObjectURL = () => 'blob:static-report-test'
  SandboxURL.revokeObjectURL = () => {}
  const app = {
    get innerHTML() {
      return appHtml
    },
    set innerHTML(value) {
      if (failNextReportEditorRender && value.includes('data-report-editable')) {
        failNextReportEditorRender = false
        throw new Error('forced static report editor render failure')
      }
      appHtml = value
    },
    querySelector(selector) {
      requestedTocSelector = selector
      return selector === expectedTocSelector ? invalidTocInput : null
    },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
      if (type === 'input') inputHandler = handler
      if (type === 'change') changeHandler = handler
    }
  }

  const storage = {}
  const documentStub = {
    body: {
      classList: { add() {}, remove() {} },
      appendChild() {},
      removeChild() {}
    },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        click() {},
        remove() {},
        querySelector() { return null },
        querySelectorAll() { return [] }
      }
    }
  }

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html')
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open() { return { opener: null } },
      confirm() {
        confirmCalls += 1
        return true
      },
      scrollTo() {},
      setTimeout(cb) {
        if (typeof cb !== 'function') return 0
        if (deferWindowTimeout) {
          scheduledWindowTimeouts.push(cb)
          return scheduledWindowTimeouts.length
        }
        cb()
        return 1
      },
      clearTimeout() {},
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
    },
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
    document: documentStub,
    URL: SandboxURL,
    URLSearchParams,
    Blob: CapturingBlob,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  assert.ok(clickHandler, 'expected click handler to be registered on app')
  assert.ok(inputHandler, 'expected input handler to be registered on app')
  assert.ok(changeHandler, 'expected change handler to be registered on app')

  const reportButton = new FakeElement()
  reportButton.closest = (selector) => {
    if (selector === '[data-job-section]') {
      return { dataset: { jobSection: 'report' } }
    }
    return null
  }
  reportButton.matches = () => false

  assert.doesNotThrow(() => clickHandler({ target: reportButton }))
  assert.doesNotMatch(app.innerHTML, /岗位中心 \/ 产业调研报告/)
  assert.match(app.innerHTML, /报告库管理/)
  assert.match(app.innerHTML, /title="预览"/)
  assert.doesNotMatch(app.innerHTML, /title="编辑"/)

  const newReportButton = new FakeElement()
  newReportButton.closest = (selector) => {
    if (selector === '[data-report-action]') {
      return { dataset: { reportAction: 'new' } }
    }
    return null
  }
  newReportButton.matches = () => false

  assert.doesNotThrow(() => clickHandler({ target: newReportButton }))
  assert.match(app.innerHTML, /参数配置/)
  assert.match(app.innerHTML, /步骤 1 \/ 3/)
  assert.match(app.innerHTML, /基本参数/)
  assert.match(app.innerHTML, /data-report-major-readonly/)
  assert.match(app.innerHTML, /选择产业链/)
  assert.match(app.innerHTML, /data-report-chain-select/)
  assert.match(app.innerHTML, /分析区域/)
  assert.match(app.innerHTML, /搜索城市或经济区/)
  assert.match(app.innerHTML, /沈阳市/)
  assert.match(app.innerHTML, /京津冀/)
  assert.match(app.innerHTML, /选择分析岗位/)
  assert.match(app.innerHTML, /已选择 0 个/)
  assert.match(app.innerHTML, /请先选择产业链/)
  assert.doesNotMatch(app.innerHTML, /报告类型/)
  assert.doesNotMatch(app.innerHTML, /创建方式/)
  assert.doesNotMatch(app.innerHTML, /报告模板/)
  assert.doesNotMatch(app.innerHTML, /最多选择 10 个|\/ 10/)
  assert.doesNotMatch(app.innerHTML, /选择报告维度/)
  assert.doesNotMatch(app.innerHTML, /目录结构/)

  const chainSelect = new FakeElement()
  chainSelect.value = 'chain-smart-construction'
  chainSelect.matches = (selector) => selector === '[data-report-chain-select]'
  assert.doesNotThrow(() => changeHandler({ target: chainSelect }))
  assert.match(app.innerHTML, /智能建造产业链/)

  const regionClear = new FakeElement()
  regionClear.closest = (selector) => selector === '[data-report-region-clear]' ? { dataset: {} } : null
  regionClear.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: regionClear }))
  const selectRegion = (id) => {
    const regionOption = new FakeElement()
    regionOption.closest = (selector) => selector === '[data-report-region-option]'
      ? { dataset: { reportRegionOption: id } }
      : null
    regionOption.matches = () => false
    assert.doesNotThrow(() => clickHandler({ target: regionOption }))
  }
  selectRegion('city:210100')
  selectRegion('economic-zone:jing-jin-ji')
  assert.match(app.innerHTML, /沈阳市/)
  assert.match(app.innerHTML, /京津冀/)

  const jobToggle = new FakeElement()
  jobToggle.closest = (selector) => {
    if (selector === '[data-report-job]') {
      return { dataset: { reportJob: 'job-bim-deepening' } }
    }
    return null
  }
  jobToggle.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: jobToggle }))
  assert.match(app.innerHTML, /已选择 1 个/)

  const nextToToc = new FakeElement()
  nextToToc.closest = (selector) => {
    if (selector === '[data-report-step-next]') return { dataset: {} }
    return null
  }
  nextToToc.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: nextToToc }))
  assert.match(app.innerHTML, /步骤 2 \/ 3/)
  assert.match(app.innerHTML, /目录结构/)
  assert.match(app.innerHTML, /默认目录，可按需调整/)

  const nextToConfirm = new FakeElement()
  nextToConfirm.closest = (selector) => {
    if (selector === '[data-report-step-next]') return { dataset: {} }
    return null
  }
  nextToConfirm.matches = () => false

  const nestedTocId = app.innerHTML.match(/<input value="行业分布现状" data-report-toc-title="([^"]+)"/)
  assert.ok(nestedTocId, 'expected an editable third-level TOC title')
  const emptyTocTitle = new FakeElement()
  emptyTocTitle.dataset = { reportTocTitle: nestedTocId[1] }
  emptyTocTitle.value = ' '
  emptyTocTitle.closest = () => null
  emptyTocTitle.matches = (selector) => selector === '[data-report-toc-title]'
  inputHandler({ target: emptyTocTitle })
  expectedTocSelector = `[data-report-toc-title="${nestedTocId[1]}"]`
  assert.doesNotThrow(() => clickHandler({ target: nextToConfirm }))
  assert.match(app.innerHTML, /目录标题不能为空/)
  assert.match(app.innerHTML, /步骤 2 \/ 3/)
  assert.equal(requestedTocSelector, expectedTocSelector)
  assert.equal(focusCalls, 1)

  const restoredTocTitle = new FakeElement()
  restoredTocTitle.dataset = { reportTocTitle: nestedTocId[1] }
  restoredTocTitle.value = '行业分布现状'
  restoredTocTitle.closest = () => null
  restoredTocTitle.matches = (selector) => selector === '[data-report-toc-title]'
  inputHandler({ target: restoredTocTitle })

  assert.doesNotThrow(() => clickHandler({ target: nextToConfirm }))
  assert.match(app.innerHTML, /步骤 3 \/ 3/)
  assert.match(app.innerHTML, /分析范围/)
  assert.match(app.innerHTML, /BIM深化设计工程师/)
  assert.match(app.innerHTML, /智能建造产业链/)
  assert.match(app.innerHTML, /沈阳市、京津冀/)
  assert.doesNotMatch(app.innerHTML, /专业分析报告模板/)

  const previousToParameters = new FakeElement()
  previousToParameters.closest = (selector) => selector === '[data-report-step-previous]' ? { dataset: {} } : null
  previousToParameters.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: previousToParameters }))
  assert.doesNotThrow(() => clickHandler({ target: previousToParameters }))

  assert.doesNotThrow(() => clickHandler({ target: nextToToc }))
  assert.equal(confirmCalls, 0)
  assert.match(app.innerHTML, /默认目录，可按需调整/)

  assert.doesNotThrow(() => clickHandler({ target: nextToConfirm }))
  assert.doesNotThrow(() => clickHandler({ target: nextToConfirm }))
  assert.match(app.innerHTML, /步骤 3 \/ 3/)
  assert.match(app.innerHTML, /确认并生成报告/)
  assert.match(app.innerHTML, /AI 开始生成报告/)
  assert.match(app.innerHTML, /分析范围/)
  assert.match(app.innerHTML, /BIM深化设计工程师/)

  const unsafeTitle = new FakeElement()
  unsafeTitle.value = '<img src=x onerror=alert(1)>'
  unsafeTitle.closest = () => null
  unsafeTitle.matches = (selector) => selector === '[data-report-form-title]'
  inputHandler({ target: unsafeTitle })

  const generate = new FakeElement()
  generate.closest = (selector) => {
    if (selector === '[data-report-action]') {
      return { dataset: { reportAction: 'generate' } }
    }
    return null
  }
  generate.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: generate }))
  assert.match(app.innerHTML, /报告生成范围/)
  assert.match(app.innerHTML, /重点分析岗位包括/)
  assert.match(app.innerHTML, /BIM深化设计工程师/)
  assert.match(app.innerHTML, /本次生成使用参考文件 0 个/)
  assert.match(app.innerHTML, /<h1>&lt;img src=x onerror=alert\(1\)&gt;<\/h1>/)

  const library = new FakeElement()
  library.closest = (selector) => selector === '[data-report-action]'
    ? { dataset: { reportAction: 'library' } }
    : null
  library.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: library }))
  assert.match(app.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(app.innerHTML, /<img src=x onerror=alert\(1\)>/)
  const generatedDraftRow = app.innerHTML.match(/<tr><td><strong>&lt;img src=x onerror=alert\(1\)&gt;<\/strong>[\s\S]*?<\/tr>/)
  assert.ok(generatedDraftRow)
  assert.match(generatedDraftRow[0], /data-report-edit="7"/)
  assert.match(generatedDraftRow[0], /草稿/)
  assert.doesNotMatch(generatedDraftRow[0], /专业报告/)
  assert.doesNotMatch(generatedDraftRow[0], /模板/)

  const editGenerated = new FakeElement()
  editGenerated.closest = (selector) => selector === '[data-report-edit]'
    ? { dataset: { reportEdit: '7' } }
    : null
  editGenerated.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: editGenerated }))
  assert.match(app.innerHTML, /<h1>&lt;img src=x onerror=alert\(1\)&gt;<\/h1>/)
  assert.match(app.innerHTML, /报告预览（PDF 版式）/)
  assert.doesNotMatch(app.innerHTML, /data-report-editable/)

  const preview = new FakeElement()
  preview.closest = (selector) => selector === '[data-report-action]'
    ? { dataset: { reportAction: 'preview' } }
    : null
  preview.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: preview }))

  const exportAds = new FakeElement()
  exportAds.closest = (selector) => selector === '[data-report-action]'
    ? { dataset: { reportAction: 'ads' } }
    : null
  exportAds.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: exportAds }))
  const adsData = JSON.parse(capturedAdsText)
  assert.equal(adsData.metadata.major, '智能建造工程专业')
  assert.equal(adsData.metadata.majorGroup, '智能建造工程专业')
  assert.equal(adsData.metadata.referenceFileCount, 0)
  assert.deepEqual(adsData.metadata.jobIds, ['job-bim-deepening'])
  assert.deepEqual(adsData.metadata.jobNames, ['BIM深化设计工程师'])
  assert.equal(adsData.tocStructure[0].title, '专业建设背景与概述')

  const save = new FakeElement()
  save.closest = (selector) => selector === '[data-report-action]'
    ? { dataset: { reportAction: 'save' } }
    : null
  save.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: save }))
  assert.doesNotThrow(() => clickHandler({ target: library }))
  const completedRow = app.innerHTML.match(/<tr><td><strong>&lt;img src=x onerror=alert\(1\)&gt;<\/strong>[\s\S]*?<\/tr>/)
  assert.ok(completedRow)
  assert.match(completedRow[0], /已完成/)

  const editExisting = new FakeElement()
  editExisting.closest = (selector) => selector === '[data-report-edit]'
    ? { dataset: { reportEdit: '1' } }
    : null
  editExisting.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: editExisting }))
  assert.match(app.innerHTML, /生成日期：2026-06-05/)

  assert.doesNotThrow(() => clickHandler({ target: library }))
  assert.doesNotThrow(() => clickHandler({ target: newReportButton }))

  const recoveryTitle = new FakeElement()
  recoveryTitle.value = '静态报告生成异常恢复测试'
  recoveryTitle.closest = () => null
  recoveryTitle.matches = (selector) => selector === '[data-report-form-title]'
  inputHandler({ target: recoveryTitle })
  assert.doesNotThrow(() => changeHandler({ target: chainSelect }))
  assert.doesNotThrow(() => clickHandler({ target: jobToggle }))
  assert.doesNotThrow(() => clickHandler({ target: nextToToc }))
  assert.doesNotThrow(() => clickHandler({ target: nextToConfirm }))
  assert.match(app.innerHTML, /步骤 3 \/ 3/)

  deferWindowTimeout = true
  failNextReportEditorRender = true
  assert.doesNotThrow(() => clickHandler({ target: generate }))
  assert.doesNotThrow(() => clickHandler({ target: generate }))
  assert.doesNotThrow(() => scheduledWindowTimeouts[0]())
  assert.equal(scheduledWindowTimeouts.length, 1)
  assert.match(app.innerHTML, /报告生成失败/)
  assert.match(app.innerHTML, /重新生成/)
  assert.match(app.innerHTML, /返回配置/)

  deferWindowTimeout = false
  const retryGenerate = new FakeElement()
  retryGenerate.closest = (selector) => selector === '[data-report-action]'
    ? { dataset: { reportAction: 'retry-generate' } }
    : null
  retryGenerate.matches = () => false
  assert.doesNotThrow(() => clickHandler({ target: retryGenerate }))
  assert.match(app.innerHTML, /静态报告生成异常恢复测试/)

  assert.doesNotThrow(() => clickHandler({ target: library }))
  const recoveredRow = app.innerHTML.match(/<tr><td><strong>静态报告生成异常恢复测试<\/strong>[\s\S]*?<\/tr>/)
  assert.ok(recoveredRow)
  assert.match(recoveredRow[0], /data-report-edit="8"/)
  assert.match(app.innerHTML, /报告总数 \/ 份/)
  assert.doesNotMatch(app.innerHTML, /data-report-edit="9"/)
})

test('static report generation persists scope and lifecycle metadata', () => {
  assert.match(staticHtml, /const buildStaticDynamicReportContent = \(/)
  assert.match(staticHtml, /const createStaticReportGenerationSnapshot = \(/)
  assert.match(staticHtml, /status: previousReport\?\.status \|\| 'draft'/)
  assert.match(staticHtml, /const commitStaticGeneratedReport = \(snapshot\) =>/)
  assert.match(staticHtml, /const rollbackStaticGeneratedReport = \(snapshot, committedReport\) =>/)
  assert.match(staticHtml, /item !== committedReport/)
  assert.match(staticHtml, /item === committedReport/)
  assert.match(staticHtml, /normalizeStaticReportForm\(activeReport \?\? \{/)
  assert.match(staticHtml, /resolveStaticReportJobNames\([\s\S]*?reportSnapshot\.jobIds,[\s\S]*?reportSnapshot\.customJobNames[\s\S]*?\)/)
  assert.match(staticHtml, /industryChainName: reportSnapshot\.industryChainName/)
  assert.match(staticHtml, /customJobNames: reportSnapshot\.customJobNames/)
  assert.match(staticHtml, /creationMode: reportSnapshot\.creationMode/)
  assert.match(staticHtml, /templateId: reportSnapshot\.templateId/)
  assert.match(staticHtml, /tocStructure: reportSnapshot\.toc/)
  assert.doesNotMatch(staticHtml, /creationMode: activeReport\?\./)
})

test('Vue report keeps the current major read-only and uses a chain select', () => {
  const parameterTemplate = sourceSlice(
    appVue,
    '<section class="research-card report-form-card report-parameter-card">',
    '<label class="report-field report-field-wide">'
  )
  assert.match(parameterTemplate, /data-report-major-readonly/)
  assert.doesNotMatch(parameterTemplate, /data-report-major(?:\s|=)/)
  assert.match(parameterTemplate, /data-report-chain-select/)
  assert.match(parameterTemplate, />请选择产业链</)
  assert.match(parameterTemplate, />自定义产业链</)
  assert.match(parameterTemplate, /data-report-custom-chain-input/)
  assert.doesNotMatch(parameterTemplate, /data-report-chain-search/)
})

test('Vue report configuration loading supplies major-scoped chain options', () => {
  const loader = sourceSlice(
    appVue,
    'const loadReportConfiguration = (report: ResearchReportItem) => {',
    'const editReport = (report: ResearchReportItem) => {',
  )

  assert.match(
    loader,
    /createReportConfigurationState\(\s*report,\s*REPORT_INDUSTRY_CHAIN_OPTIONS,\s*\)/,
  )
})

test('Vue report creation uses chain and custom-job controls', () => {
  const parameterTemplate = sourceSlice(
    appVue,
    '<section class="research-card report-form-card report-parameter-card">',
    '<div v-else-if="reportCreateStep === 2" class="report-wizard-panel">'
  )
  assert.match(appVue, /const reportCreateValidation = ref<ReportValidationError \| null>\(null\)/)
  assert.match(appVue, /validateReportForm\(reportForm\.value, \{/)
  assert.match(appVue, /regionOptions: reportRegionOptions/)
  assert.match(appVue, /const selectedReportJobNames = computed\(\(\) =>/)
  assert.match(appVue, /const availableReportJobs = computed\(\(\) =>/)
  assert.match(appVue, /const toggleReportJob = \(jobId: string\) =>/)
  assert.doesNotMatch(appVue, /reportForm\.value\.jobIds\.length >= 10/)
  assert.match(parameterTemplate, />专业</)
  assert.match(parameterTemplate, />选择产业链</)
  assert.match(parameterTemplate, />分析区域</)
  assert.match(parameterTemplate, />选择分析岗位</)
  assert.match(parameterTemplate, /data-report-chain-select/)
  assert.match(parameterTemplate, /data-report-custom-chain-input/)
  assert.match(parameterTemplate, /data-report-custom-job-input/)
  assert.match(parameterTemplate, /请先选择产业链/)
  assert.match(parameterTemplate, /暂无库内关联岗位/)
  assert.match(parameterTemplate, /data-report-region-search/)
  assert.match(parameterTemplate, /已选择 \{\{ selectedReportJobNames\.length \}\} 个/)
  assert.doesNotMatch(parameterTemplate, />相关行业</)
  assert.doesNotMatch(parameterTemplate, /GB\/T 4754/)
  assert.doesNotMatch(parameterTemplate, />报告类型</)
  assert.doesNotMatch(parameterTemplate, />创建方式</)
  assert.doesNotMatch(parameterTemplate, />报告模板</)
  assert.doesNotMatch(parameterTemplate, /最多选择 10 个|\/ 10/)
  assert.match(parameterTemplate, /class="report-field-error"/)
  assert.match(appVue, /const selectReportChain =/)
  assert.match(appVue, /const addCustomReportChain =/)
  assert.match(appVue, /const addCustomJob =/)
  assert.match(appVue, /const selectReportRegion =/)
  assert.match(appVue, /const removeReportRegion =/)
})

test('Vue report TOC keeps one editable default directory', () => {
  assert.match(appVue, /const reportTocDirty = ref\(false\)/)
  assert.doesNotMatch(appVue, /window\.confirm\('当前目录已修改，切换创建方式或模板将覆盖现有目录。是否继续？'\)/)
  assert.match(appVue, /findEmptyReportTocTitle\(reportTocRows\.value\)/)
  assert.match(appVue, /目录标题不能为空/)
  assert.match(appVue, /reportTocDirty\.value = true/)
  assert.match(appVue, /默认目录，可按需调整/)
})

test('Vue unlocked report step navigation preserves TOC initialization and validation guards', () => {
  const stepNavigation = sourceSlice(
    appVue,
    'const goToReportCreateStep = (step: ReportCreateStep) => {',
    'const goToNextReportCreateStep = () => {'
  )

  assert.match(
    stepNavigation,
    /step > reportCreateStep\.value[\s\S]*?reportCreateStep\.value === 1[\s\S]*?!validateReportParameters\(\)[\s\S]*?!initializeReportTocFromForm\(\)/
  )
  assert.match(
    stepNavigation,
    /step > reportCreateStep\.value && step === 3 && !validateReportToc\(\)/
  )
})

test('Vue report confirmation and lifecycle persist the full generation scope', () => {
  const confirmationTemplate = sourceSlice(
    appVue,
    '<div v-else class="report-wizard-panel report-confirm-panel">',
    '<footer class="report-wizard-footer">'
  )
  assert.match(appVue, />分析范围</)
  assert.match(appVue, /selectedReportJobNames/)
  assert.match(confirmationTemplate, /reportForm\.industryChainName/)
  assert.match(confirmationTemplate, />产业链</)
  assert.doesNotMatch(confirmationTemplate, />相关行业</)
  assert.match(confirmationTemplate, /reportForm\.regionNames/)
  assert.doesNotMatch(confirmationTemplate, />报告类型</)
  assert.doesNotMatch(confirmationTemplate, />创建方式</)
  assert.doesNotMatch(confirmationTemplate, /reportForm\.creationMode/)
  assert.match(appVue, /const reportReferenceFileCount = ref\(0\)/)
  assert.match(appVue, /createReportGenerationSnapshot\(\{/)
  assert.match(appVue, /referenceFileCount: reportReferenceFileCount\.value/)
  assert.match(appVue, /toc: serializeReportToc\(reportTocRows\.value\)/)
  assert.match(appVue, /reportGenerationController\.schedule\(\(token\) =>/)
  assert.match(appVue, /createGeneratedReportDraft\(snapshot\)/)
  assert.match(appVue, /rollbackReportGeneration\(reportRows\.value, snapshot\)/)
  assert.match(appVue, /reportGenerationError/)
  assert.match(appVue, />重新生成</)
  assert.match(appVue, />返回配置</)
})

test('Vue regenerated reports sync full catalog metadata and ADS uses one snapshot', () => {
  const persistGeneratedReport = sourceSlice(
    appVue,
    'const createGeneratedReportDraft = (snapshot: ReportGenerationSnapshot) => {',
    'const updateReportEditorContent = (event: Event) => {'
  )
  const adsExport = sourceSlice(
    appVue,
    'const exportReportAds = () => {',
    'const nextFrame = () =>'
  )

  assert.match(
    persistGeneratedReport,
    /applyReportGeneration\(reportRows\.value, snapshot\)/
  )
  assert.match(
    persistGeneratedReport,
    /createReportGenerationSnapshot\(\{[\s\S]*?referenceFileCount: reportReferenceFileCount\.value[\s\S]*?jobOptions: RESEARCH_JOB_CANDIDATES/
  )
  assert.match(persistGeneratedReport, /form: snapshot\.report/)
  assert.match(persistGeneratedReport, /jobNames: snapshot\.jobNames/)
  assert.match(persistGeneratedReport, /reportGenerationController\.isCurrent\(token\)/)
  assert.match(persistGeneratedReport, /rollbackReportGeneration\(reportRows\.value, snapshot\)/)
  assert.match(adsExport, /const reportSnapshot: ResearchReportItem =/)
  assert.match(adsExport, /createReportAdsMetadata\([\s\S]*?reportSnapshot,[\s\S]*?RESEARCH_JOB_CANDIDATES/)
  assert.match(adsExport, /\.\.\.metadata/)
  assert.doesNotMatch(adsExport, /selectedReportJobs\.value/)
  assert.doesNotMatch(adsExport, /activeReport\.value\?\./)
})

test('report library hides report type and keeps standard selectors without copy actions', () => {
  const searchPlaceholder = '搜索标题、产业链、区域或岗位'

  assert.match(appVue, new RegExp(`placeholder="${searchPlaceholder}"`))
  assert.match(staticHtml, new RegExp(`placeholder="${searchPlaceholder}"`))
  assert.doesNotMatch(appVue, /<th>报告类型<\/th>/)
  assert.doesNotMatch(appVue, /report-type-tag/)
  assert.doesNotMatch(appVue, /report-mode-tag/)
  assert.doesNotMatch(staticHtml, /<th>报告类型<\/th>/)
  assert.doesNotMatch(staticHtml, /report-type-tag/)
  assert.doesNotMatch(staticHtml, /report-mode-tag/)

  for (const description of [
    '面向专业建设、产业岗位需求与改进建议。',
    '面向行业发展、区域产业、企业岗位与人才需求。',
  ]) {
    assert.match(researchReportMock, new RegExp(description))
    assert.match(staticHtml, new RegExp(description))
  }
  assert.match(appVue, /data-report-chain-select/)
  assert.match(appVue, /data-report-custom-job-input/)
  assert.match(appVue, /data-report-region-search/)
  assert.match(staticHtml, /data-report-chain-select/)
  assert.match(staticHtml, /data-report-custom-chain-input/)
  assert.match(staticHtml, /data-report-custom-job-input/)
  assert.match(staticHtml, /data-report-region-search/)
  assert.match(appVue, /:aria-invalid="Boolean\(reportFieldError\('industryChainName'\)\)"/)
  assert.match(appVue, /:aria-invalid="Boolean\(reportFieldError\('regionIds'\)\)"/)
  assert.match(staticHtml, /staticReportValidationError\?\.field === 'industryChainName'/)
  assert.match(staticHtml, /staticReportValidationError\?\.field === 'regionIds'/)
  assert.doesNotMatch(appVue, /\bcopyReport\b/)
  assert.doesNotMatch(staticHtml, /data-report-copy/)
})

test('Vue report wizard keeps the existing three-step contract', () => {
  assert.match(appVue, /type ReportCreateStep = 1 \| 2 \| 3/)
  assert.match(appVue, /label: '参数配置'/)
  assert.match(appVue, /label: '目录调整'/)
  assert.match(appVue, /label: '报告生成'/)
  assert.match(appVue, /AI 开始生成报告/)
  assert.doesNotMatch(appVue, /选择报告维度/)
})

test('report page starts directly with report content', () => {
  const vueReportPage = sourceSlice(
    appVue,
    '<div v-else-if="currentJobSection === \'报告生成\'" class="job-research-page report-generate-page">',
    '<div v-else-if="!selectedJob" class="job-page">'
  )
  const staticReportPage = sourceSlice(
    staticHtml,
    'const reportHtml = (view = staticReportView) => {',
    'const captureStaticReportEditor = () => {'
  )

  assert.doesNotMatch(vueReportPage, /<header class="research-title-row">/)
  assert.doesNotMatch(vueReportPage, /<section class="research-tip">/)
  assert.doesNotMatch(
    staticReportPage,
    /report-generate-page"><header class="research-title-row">/
  )
  assert.doesNotMatch(
    staticReportPage,
    /本页面支持<strong>一键生成专业群产业调研分析报告/
  )
})

test('report wizard styling stays compact and prevents text overflow', () => {
  const stepper = styleBlock('.report-wizard-stepper')
  const parameterGrid = styleBlock('.report-parameter-grid')
  const parameterHeader = styleBlock('.report-parameter-card > .research-card-head')
  const tocScroll = styleBlock('.report-toc-scroll')
  const jobOptions = styleBlock('.report-job-options')
  const jobCheckbox = styleBlock('.report-job-field .report-job-options input')
  const segmentedOptions = styleBlock('.report-segmented-options')
  const fieldError = styleBlock('.report-field-error')
  const summaryTags = styleBlock('.report-summary-tags')
  const combobox = styleBlock('.report-combobox')
  const comboboxPanel = styleBlock('.report-combobox-panel')
  const selectionTags = styleBlock('.report-selection-tags')

  assert.match(stepper, /min-height:\s*44px/)
  assert.match(stepper, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(parameterGrid, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(parameterHeader, /height:\s*68px/)
  assert.match(parameterHeader, /padding:\s*0 20px/)
  assert.match(tocScroll, /overflow:\s*auto/)
  assert.match(jobOptions, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(jobOptions, /max-height:\s*260px/)
  assert.match(jobOptions, /overflow:\s*auto/)
  assert.match(jobCheckbox, /width:\s*16px/)
  assert.match(jobCheckbox, /height:\s*16px/)
  assert.match(jobCheckbox, /flex:\s*0 0 16px/)
  assert.match(segmentedOptions, /display:\s*flex/)
  assert.match(fieldError, /color:\s*#c43b3b/)
  assert.match(summaryTags, /flex-wrap:\s*wrap/)
  assert.match(combobox, /position:\s*relative/)
  assert.match(comboboxPanel, /position:\s*absolute/)
  assert.match(comboboxPanel, /max-height:\s*280px/)
  assert.match(comboboxPanel, /overflow-y:\s*auto/)
  assert.match(selectionTags, /flex-wrap:\s*wrap/)
  assert.match(stylesCss, /\.report-job-options button:disabled/)
  assert.doesNotMatch(stylesCss, /\.report-wizard \.report-dimension-grid/)
  assert.match(stylesCss, /@media \(max-width:\s*900px\)[\s\S]*\.report-parameter-grid,[\s\S]*\.report-confirm-panel[\s\S]*grid-template-columns:\s*1fr/)
  assert.match(
    stylesCss,
    /@media \(max-width:\s*900px\)[\s\S]*\.report-job-options[\s\S]*grid-template-columns:\s*1fr/,
  )
  assert.match(
    stylesCss,
    /@media \(max-width:\s*900px\)[\s\S]*body:has\(\.report-generate-page\)[\s\S]*min-width:\s*0/,
  )
  assert.match(
    stylesCss,
    /@media \(max-width:\s*900px\)[\s\S]*\.app-shell:has\(\.report-generate-page\)[\s\S]*min-width:\s*0/,
  )
  assert.match(
    stylesCss,
    /@media \(max-width:\s*900px\)[\s\S]*\.job-center-card:has\(\.report-generate-page\)[\s\S]*min-width:\s*0/,
  )
})

test('report reference files use the system-styled picker in both entries', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /class="report-file-control"/)
    assert.match(source, /class="report-file-input"[^>]*type="file"[^>]*multiple/)
    assert.match(source, /class="report-file-trigger"/)
    assert.match(source, /class="report-file-icon" aria-hidden="true">↑<\/span>选择文件/)
    assert.match(source, /未选择文件/)
  }

  const control = styleBlock('.report-file-control')
  const hiddenInput = styleBlock('.report-field .report-file-input')
  const trigger = styleBlock('.report-file-trigger')

  assert.match(control, /min-height:\s*42px/)
  assert.match(control, /border-radius:\s*8px/)
  assert.match(hiddenInput, /clip-path:\s*inset\(50%\)/)
  assert.match(trigger, /color:\s*#2f6ff5/)
  assert.match(stylesCss, /\.report-file-control:focus-within\s*\{[\s\S]*box-shadow:/)
})

test('static html can deep-link directly to the report library view', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  const app = {
    innerHTML: '',
    querySelector() { return null },
    addEventListener() {}
  }

  const storage = {}
  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        querySelector() { return null },
        querySelectorAll() { return [] }
      }
    }
  }

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html?view=job-report&reportView=library&tab=chain')
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open() { return { opener: null } },
      scrollTo() {},
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
    },
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  assert.doesNotThrow(() => {
    vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  })
  assert.doesNotMatch(app.innerHTML, /岗位中心 \/ 产业调研报告/)
  assert.match(app.innerHTML, /报告库管理/)
  assert.match(app.innerHTML, />预览<\/button>/)
  assert.match(app.innerHTML, />下载<\/button>/)
  assert.match(app.innerHTML, /class="report-action-danger"[^>]*>删除<\/button>/)
  const staticPreviewStart = staticHtml.indexOf('const reportPreview =')
  const staticPreviewEnd = staticHtml.indexOf('const reportDelete =', staticPreviewStart)
  assert.ok(staticPreviewStart >= 0)
  assert.ok(staticPreviewEnd > staticPreviewStart)
  const staticPreviewHandler = staticHtml.slice(staticPreviewStart, staticPreviewEnd)
  assert.match(staticPreviewHandler, /loadStaticReportConfiguration\(report\)/)
  assert.match(staticPreviewHandler, /printStaticReportPdf\(\)/)
  assert.doesNotMatch(staticPreviewHandler, /renderReport\('preview'\)/)
  assert.doesNotMatch(app.innerHTML, /data-report-copy|title="复制"|>□<\/button>/)
  assert.match(app.innerHTML, /class="job-sub-button selected" data-job-section="report">产教调研报告/)
  assert.doesNotMatch(app.innerHTML, /class="job-sub-button selected" data-industry-tab="chain">产业链图谱/)
})

test('static html can deep-link directly to the industry research layout view', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  const app = {
    innerHTML: '',
    querySelector() { return null },
    addEventListener() {}
  }

  const storage = {}
  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        querySelector() { return null },
        querySelectorAll() { return [] }
      }
    }
  }

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html?view=job-industry&tab=chain')
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open() { return { opener: null } },
      scrollTo() {},
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
    },
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  assert.doesNotThrow(() => {
    vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  })
  assert.doesNotMatch(app.innerHTML, /产业调研 \/ 产业布局/)
  assert.match(app.innerHTML, /产业链图谱/)
  assert.match(app.innerHTML, /产业调研数据未初始化/)
  assert.match(app.innerHTML, /请先前往 CMS 进行数据初始化/)
  assert.match(app.innerHTML, /data-go-cms-industry-init/)
  assert.doesNotMatch(app.innerHTML, /industry-sankey-board/)
  assert.match(app.innerHTML, /job-sub-menu/)
  assert.doesNotMatch(app.innerHTML, /job-subsection-list/)
})

test('seven industry research demo pages share the CMS initialization prompt', () => {
  assert.match(appSource, /industryResearchStateKey/)
  assert.match(appSource, /readIndustryResearchDemoInitialized/)
  assert.match(appSource, /class="research-uninitialized-state"/)
  assert.match(appSource, /产业调研数据未初始化/)
  assert.match(appSource, /请先前往 CMS 进行数据初始化/)
  assert.match(appSource, /buildStandaloneViewUrl\('industry-research-admin', \{ entry: 'industry', majorName: '智能建造工程专业' \}\)/)

  assert.match(staticHtml, /staticIndustryResearchStateKey/)
  assert.match(staticHtml, /readStaticIndustryResearchInitialized/)
  assert.match(staticHtml, /const staticResearchUninitializedHtml =/)
  assert.match(staticHtml, /data-go-cms-industry-init/)
  assert.match(staticHtml, /产业调研数据未初始化/)
  assert.match(staticHtml, /const industryResearchCmsInitializationUrl = \(\) => \{[\s\S]*new URL\('\.\/industry-research-admin\.html', window\.location\.href\)[\s\S]*params\.set\('entry', 'industry'\)[\s\S]*params\.set\('majorName', '智能建造工程专业'\)/)
  assert.doesNotMatch(staticHtml, /const industryResearchCmsInitializationUrl = \(\) => buildStaticViewUrl\('industry-research-admin'\)/)

  const tabLabels = [
    '产业链图谱',
    '区域产业分析',
    '产业政策库',
    '产业企业库',
    '岗位画像分析',
    '招聘需求趋势',
    '新岗位新技术'
  ]
  for (const label of tabLabels) {
    assert.match(staticHtml, new RegExp(label))
  }
  assert.match(stylesCss, /\.research-uninitialized-state\s*\{/)
  assert.match(stylesCss, /\.research-uninitialized-action\s*\{/)
})

test('demo dock exposes the CMS initialization reset control', () => {
  assert.match(appVue, /class="dock-icon demo-reset"/)
  assert.match(staticHtml, /data-reset-demo-initialization/)
  assert.match(staticHtml, /title="重置演示初始化状态"/)
  assert.match(stylesCss, /\.dock-icon\.demo-reset/)
})

test('static demo shows initialized industry research data after CMS chain selection is stored', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  const app = {
    innerHTML: '',
    querySelector() { return null },
    addEventListener(type, handler) {
      if (type === 'click') this.clickHandler = handler
    }
  }
  const storage = {
    'major-construction-platform:industry-research': JSON.stringify({
      initialized: true,
      selectedChainIds: ['smart-construction'],
      selectedAt: '2026-06-10T00:00:00.000Z'
    })
  }
  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        querySelector() { return null },
        querySelectorAll() { return [] }
      }
    }
  }

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html?view=job-industry&tab=chain')
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open() { return { opener: null } },
      scrollTo() {},
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
    },
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  assert.doesNotThrow(() => {
    vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  })
  assert.match(app.innerHTML, /产业链图谱/)
  assert.match(app.innerHTML, /<h3>产业链结构图谱<\/h3>/)
  assert.match(app.innerHTML, /industry-chain-view-switch/)
  assert.match(app.innerHTML, /industry-treemap-board/)
  assert.match(app.innerHTML, /industry-treemap-node/)
  assert.match(app.innerHTML, /data-industry-chain-view="sankey"/)
  assert.match(app.innerHTML, /关联国标行业/)
  assert.match(app.innerHTML, /12个/)
  assert.match(app.innerHTML, /data-static-national-metric="关联国标行业"/)
  assert.match(app.innerHTML, /查看详情/)
  assert.match(app.innerHTML, /industry-treemap-stage-copy/)
  assert.match(app.innerHTML, /industry-treemap-stage-stat/)
  assert.doesNotMatch(app.innerHTML, /industry-node-national-tags/)
  assert.doesNotMatch(app.innerHTML, /industry-stage-national-tags/)
  assert.doesNotMatch(app.innerHTML, /国标行业关联分析/)
  assert.doesNotMatch(app.innerHTML, /代表企业行业覆盖/)
  assert.doesNotMatch(app.innerHTML, /行业增长信号/)
  assert.doesNotMatch(app.innerHTML, /<p>具体产品\/技术\/服务节点<\/p>/)
  assert.doesNotMatch(app.innerHTML, /矩形面积按代表企业/)
  assert.doesNotMatch(app.innerHTML, /industry-treemap-hover-card/)
  assert.match(app.innerHTML, /产业链结构完整/)
  assert.match(app.innerHTML, /主要机会集中在/)
  assert.match(app.innerHTML, /核心问题是/)
  assert.doesNotMatch(app.innerHTML, /细分节点为\d+/)
  assert.doesNotMatch(app.innerHTML, /产业调研数据未初始化/)
  assert.match(app.innerHTML, /data-reset-demo-initialization/)

  const resetTarget = new FakeElement()
  resetTarget.closest = (selector) => selector === '[data-reset-demo-initialization]' ? resetTarget : null
  resetTarget.matches = () => false
  app.clickHandler({ target: resetTarget })

  assert.equal(storage['major-construction-platform:industry-research'], undefined)
  assert.match(app.innerHTML, /产业调研数据未初始化/)
})

test('static national industry KPI cards open a detail dialog', () => {
  assert.match(staticHtml, /const showStaticNationalIndustryMetricDialog =/)
  assert.match(staticHtml, /staticNationalIndustryMetricDialogHtml/)
  assert.match(staticHtml, /showStaticNationalIndustryMetricDialog\(staticNationalMetric\.dataset\.staticNationalMetric/)
  assert.match(staticHtml, /data-static-national-metric/)
  assert.match(staticHtml, /industry-national-detail-dialog/)
  assert.match(staticHtml, /GB\/T 4754 行业分类/)
})

test('static industry chain switch opens sankey view from treemap view', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')
  const app = {
    innerHTML: '',
    querySelector(selector) {
      if (selector === '.job-research-page') return { scrollTop: 0, scrollTo() {} }
      return null
    },
    querySelectorAll(selector) {
      return []
    },
    addEventListener(type, handler) {
      this.handlers = this.handlers || {}
      this.handlers[type] = this.handlers[type] || []
      this.handlers[type].push(handler)
    }
  }
  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html?view=job-industry&tab=chain')
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      history: { replaceState() {} },
      localStorage: {
        getItem(key) {
          if (key === 'major-construction-platform:industry-research') {
            return JSON.stringify({ initialized: true, selectedChainIds: ['chain-foundation'], selectedAt: '2026-06-15T00:00:00.000Z' })
          }
          return null
        },
        setItem() {},
        removeItem() {}
      },
      open() { return null },
      addEventListener() {},
      scrollY: 0,
      scrollTo() {},
      setTimeout
    },
    document: {
      body: { classList: { add() {}, remove() {} } },
      querySelector(selector) { return selector === '#app' ? app : app.querySelector(selector) },
      querySelectorAll(selector) { return app.querySelectorAll(selector) }
    },
    localStorage: {
      getItem(key) {
        if (key === 'major-construction-platform:industry-research') {
          return JSON.stringify({ initialized: true, selectedChainIds: ['chain-foundation'], selectedAt: '2026-06-15T00:00:00.000Z' })
        }
        return null
      },
      setItem() {},
      removeItem() {}
    },
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  assert.match(app.innerHTML, /industry-treemap-board/)
  assert.equal(typeof sandbox.window.__setStaticIndustryChainView, 'function')
  vm.runInContext("window.__setStaticIndustryChainView('sankey')", sandbox, { timeout: 5000 })
  assert.match(app.innerHTML, /industry-sankey-board/)
  assert.match(app.innerHTML, /industry-sankey-summary/)
  assert.doesNotMatch(app.innerHTML, /industry-treemap-board/)
  assert.match(app.innerHTML, /<button type="button" class="active" data-industry-chain-view="sankey"[^>]*>桑基图<\/button>/)
})

test('static industry and job research pages retain restored rich component markers', () => {
  for (const marker of [
    'industry-sankey-board',
    'industry-sankey-svg',
    'china-heatmap',
    'province-rank-list',
    'policy-toolbar',
    'policy-timeline-item',
    'industry-company-toolbar',
    'industry-company-table',
    'portrait-overview-row',
    'portrait-profile-card',
    'demand-kpi-grid',
    'demand-trend-bars',
    'job-skill-word-cloud',
    '岗位技能词云',
    'forecast-direction-grid rich',
    'forecast-job-grid rich',
    'forecast-major-recommend',
    'job-sub-menu'
  ]) {
    assert.match(staticHtml, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  assert.doesNotMatch(staticHtml, /job-subsection-list/)
  assert.doesNotMatch(staticHtml, /job-model-deploy|AI模型部署工程师|MLOps|模型部署/)
})

test('research ai brief uses a compact shared text layout', () => {
  assert.match(appSource, /class="research-compact-ai research-figma-ai"/)
  assert.match(appSource, /class="research-figma-ai-mark"/)
  assert.match(appSource, /class="research-figma-ai-icon" src="\/figma-assets\/job-portrait-ai-icon\.png\?v=figma-export-2085665242"/)
  assert.match(appSource, /activeResearchSummary\.title/)
  assert.match(appSource, /activeResearchSummary\.items/)
  assert.match(appSource, /researchSummaryClient\.summarize/)
  assert.match(appSource, /buildResearchSummaryContext/)

  assert.match(staticHtml, /class="research-compact-ai research-figma-ai"/)
  assert.match(staticHtml, /class="research-figma-ai-mark"/)
  assert.match(staticHtml, /class="research-figma-ai-icon" src="\.\/public\/figma-assets\/job-portrait-ai-icon\.png\?v=figma-export-2085665242" onerror="this\.onerror=null;this\.src='\.\/figma-assets\/job-portrait-ai-icon\.png\?v=figma-export-2085665242'"/)
  assert.match(staticHtml, /staticResearchBriefHtml\('industry', tab\)/)
  assert.match(staticHtml, /staticResearchBriefHtml\('job', tab\)/)
  assert.match(staticHtml, /产业链结构分析/)

  assert.match(stylesCss, /\.research-figma-ai\s*\{[\s\S]*grid-template-columns:\s*168px minmax\(0, 1fr\)/)
  assert.match(stylesCss, /\.research-figma-ai-mark\s*\{[\s\S]*justify-items:\s*center/)
  assert.doesNotMatch(stylesCss, /\.research-figma-ai-mark i/)
  assert.match(stylesCss, /\.research-compact-ai ul\s*\{[^}]*flex-direction:\s*column/)
  assert.doesNotMatch(stylesCss, /\.research-compact-ai\s*\{[^}]*grid-template-columns:/)
  assert.doesNotMatch(stylesCss, /\.research-compact-ai ul\s*\{[^}]*grid-template-columns:/)
  assert.doesNotMatch(stylesCss, /\.research-analysis-list/)
  assert.doesNotMatch(stylesCss, /\.forecast-strip/)
})

test('industry and job research tabs expose a lightweight page purpose line', () => {
  const purposeLines = [
    '梳理智能建造产业链上下游关系，明确专业应重点对接的产业环节与课程项目入口。',
    '识别区域企业集聚、岗位需求和工程场景分布，判断校企合作与实训基地拓展方向。',
    '汇总国家与地方政策信号，提炼对专业方向、课程标准和项目化实训的转化要求。',
    '沉淀代表企业、技术方向和岗位线索，支撑专业选择可对接的企业资源。',
    '拆解核心岗位的任务、能力和证书要求，为课程体系与岗位要求对齐提供依据。',
    '跟踪招聘规模、薪资走势和技能热度，判断当前岗位建设的优先级。',
    '研判新技术带来的新增岗位和能力缺口，提前布局课程与实训内容。'
  ]

  for (const source of [appSource, staticHtml]) {
    assert.match(source, /research-page-purpose/)
    for (const line of purposeLines) {
      assert.match(source, new RegExp(line))
    }
  }
  assert.match(stylesCss, /\.research-page-purpose\s*\{/)
})

test('static industry sankey renders real node metrics and visible hover details', () => {
  assert.match(staticHtml, /enterpriseCount: 186/)
  assert.match(staticHtml, /techFields: \['BIM正向设计', '数字审图', '参数化设计'\]/)
  assert.match(staticHtml, /const formatStaticIndustrySankeyNodeMeta =/)
  assert.match(staticHtml, /staticIndustryChainViewMode = 'treemap'/)
  assert.match(staticHtml, /staticIndustryTreemapHtml/)
  assert.match(staticHtml, /window\.__setStaticIndustryChainView/)
  assert.match(staticHtml, /onclick="window\.__setStaticIndustryChainView && window\.__setStaticIndustryChainView\('sankey'\)"/)
  assert.match(staticHtml, /style="--node-size: \$\{size\}px; --node-share:/)
  assert.doesNotMatch(staticHtml, /grid-row: span \$\{span\}/)
  assert.match(staticHtml, /industry-chain-view-switch/)
  assert.match(staticHtml, /industry-treemap-board/)
  assert.match(staticHtml, /data-industry-chain-view="treemap"/)
  assert.match(staticHtml, /data-industry-chain-view="sankey"/)
  assert.match(staticHtml, /industry-sankey-summary/)
  assert.match(staticHtml, /<h3>产业链结构图谱<\/h3>/)
  assert.match(staticHtml, /具体产品\/技术\/服务节点/)
  assert.doesNotMatch(staticHtml, /<p>具体产品\/技术\/服务节点<\/p>/)
  assert.doesNotMatch(staticHtml, /industry-treemap-footnote/)
  assert.doesNotMatch(staticHtml, /矩形面积按代表企业/)
  assert.match(staticHtml, /industry-sankey-hover-card/)
  assert.match(staticHtml, /setStaticIndustrySankeyHoverInfo/)
  assert.match(staticHtml, /link\.classList\.toggle\('active', isActive\)/)
  assert.match(staticHtml, /node\.classList\.toggle\('active', isActive\)/)
  assert.match(staticHtml, /data-sankey-node-id/)
  assert.match(staticHtml, /data-sankey-link-key/)
  assert.doesNotMatch(staticHtml, /industry-treemap-hover-card/)
  assert.doesNotMatch(staticHtml, /undefined · undefined/)
})

test('static job analysis tabs keep rich sections and clickable portrait cards', () => {
  const portraitStart = staticHtml.indexOf('const portraitBody = () => `')
  const portraitEnd = staticHtml.indexOf('const demandKpis = [', portraitStart)
  const demandStart = staticHtml.indexOf('const demandBody = `')
  const demandEnd = staticHtml.indexOf('const forecastDirections = [', demandStart)
  const forecastStart = staticHtml.indexOf('const forecastBody = `')
  const forecastEnd = staticHtml.indexOf('const researchHtml =', forecastStart)
  assert.ok(portraitStart > -1)
  assert.ok(portraitEnd > portraitStart)
  assert.ok(demandStart > -1)
  assert.ok(demandEnd > demandStart)
  assert.ok(forecastStart > -1)
  assert.ok(forecastEnd > forecastStart)

  const portraitBlock = staticHtml.slice(portraitStart, portraitEnd)
  const demandBlock = staticHtml.slice(demandStart, demandEnd)
  const forecastBlock = staticHtml.slice(forecastStart, forecastEnd)

  for (const marker of ['portrait-overview-row', 'portrait-kpi-grid', 'portrait-search-row', 'data-static-portrait-job', 'staticPortraitPaginationHtml']) {
    assert.match(portraitBlock, new RegExp(marker))
  }
  for (const marker of ['profile-card-head', 'profile-level-badge', 'profile-demand', 'profile-card-tags']) {
    assert.match(portraitBlock, new RegExp(marker))
    assert.match(appVue, new RegExp(marker))
  }
  for (const marker of ['research-compact-ai research-figma-ai', 'research-figma-ai-mark', 'research-figma-ai-icon']) {
    assert.match(staticHtml, new RegExp(marker))
    assert.match(appVue, new RegExp(marker))
  }
  for (const marker of ['岗位需求月度趋势', '岗位技能热度', '热门岗位招聘明细', 'demand-trend-bars', 'demandSkillWordCloudHtml', 'research-table']) {
    assert.match(demandBlock, new RegExp(marker))
  }
  assert.match(staticHtml, /job-skill-word-cloud/)
  assert.match(staticHtml, /aria-label="岗位技能词云"/)
  assert.match(appVue, /demandSkillHeatTone/)
  assert.match(appVue, /aria-label="岗位技能词云"/)
  assert.doesNotMatch(demandBlock, /skill-bar-list/)
  assert.match(appVue, /if \(value >= 90\) return 'xl blue'/)
  assert.match(staticHtml, /if \(value >= 90\) return 'xl blue'/)
  assert.doesNotMatch(staticHtml, /job-skill-heat-panel/)
  for (const marker of ['新兴技术方向', '新岗位 × 专业匹配', '人才培养方向建议', '相关专业', '推荐能力', 'forecast-direction-grid rich', 'forecast-job-grid rich', 'research-table']) {
    assert.match(forecastBlock, new RegExp(marker))
  }
  assert.doesNotMatch(forecastBlock, /对口专业：/)
  assert.doesNotMatch(forecastBlock, /能力\/任务标签/)
})

test('job portrait AI summary and cards match the Figma compact card specification', () => {
  assert.match(
    stylesCss,
    /\.research-figma-ai\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-columns:\s*168px minmax\(0, 1fr\);[\s\S]*min-height:\s*112px;[\s\S]*border-radius:\s*8px;[\s\S]*background:[\s\S]*linear-gradient\(106deg/
  )
  assert.match(
    stylesCss,
    /\.research-figma-ai-mark\s*\{[\s\S]*display:\s*grid;[\s\S]*justify-items:\s*center;[\s\S]*align-content:\s*center;[\s\S]*gap:\s*4px;/
  )
  assert.match(
    stylesCss,
    /\.research-figma-ai-icon\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*48px;[\s\S]*object-fit:\s*contain;/
  )
  assert.match(
    stylesCss,
    /\.research-figma-ai-mark strong\s*\{[\s\S]*background:\s*linear-gradient\(90deg, #2f6cff 0%, #8a5cff 100%\);[\s\S]*-webkit-text-fill-color:\s*transparent;/
  )
  assert.match(
    stylesCss,
    /\.research-figma-ai ul\s*\{[\s\S]*justify-content:\s*center;[\s\S]*gap:\s*10px;/
  )
  assert.match(
    stylesCss,
    /\.portrait-profile-card\s*\{[\s\S]*display:\s*grid;[\s\S]*min-height:\s*172px;[\s\S]*padding:\s*18px 20px;[\s\S]*border-radius:\s*8px;[\s\S]*background:\s*#fbfcff;/
  )
  assert.match(
    stylesCss,
    /\.profile-meta strong[\s\S]*\{[\s\S]*color:\s*#0f66ff;[\s\S]*font-size:\s*20px;/
  )
  assert.match(
    stylesCss,
    /\.profile-demand\s*\{[\s\S]*margin-left:\s*auto;[\s\S]*color:\s*#8b98ad;[\s\S]*font-size:\s*13px;/
  )
  assert.match(
    stylesCss,
    /\.profile-level-badge\s*\{[\s\S]*height:\s*22px;[\s\S]*border-radius:\s*6px;[\s\S]*background:\s*#e9fbf4;/
  )
  assert.match(
    stylesCss,
    /\.profile-card-tags\s*\{[\s\S]*padding-top:\s*12px;[\s\S]*border-top:\s*1px solid #edf2fb;/
  )
})

test('static job analysis deep links render the selected uninitialized tab without runtime errors', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  const cases = [
    ['portrait', '岗位画像分析', false],
    ['demand', '招聘需求趋势', false],
    ['forecast', '新岗位新技术', false],
    ['analysis', '岗培优化建议', true]
  ]

  for (const [tab, title, isAnalysis] of cases) {
    let clickHandler = null
    const app = {
      innerHTML: '',
      querySelector() { return null },
      addEventListener(type, handler) {
        if (type === 'click') clickHandler = handler
      }
    }
    const storage = {}
    const url = new URL(`file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html?view=job-research&tab=${tab}`)
    const sandbox = {
      console,
      Element: FakeElement,
      window: {
        location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
        history: { replaceState() {} },
        addEventListener() {},
        removeEventListener() {},
        requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
        open() { return { opener: null } },
        scrollTo() {},
        localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
      },
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
      document: {
        body: { classList: { add() {}, remove() {} } },
        querySelector(selector) { return selector === '#app' ? app : null },
        addEventListener() {},
        removeEventListener() {},
        createElement() {
          return {
            className: '',
            innerHTML: '',
            style: {},
            appendChild() {},
            setAttribute() {},
            addEventListener() {},
            querySelector() { return null },
            querySelectorAll() { return [] }
          }
        }
      },
      URL,
      URLSearchParams,
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      setTimeout,
      clearTimeout,
      Map,
      Set,
      Math
    }

    vm.createContext(sandbox)
    assert.doesNotThrow(() => {
      vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
    }, `expected ${tab} deep link to render`)
    assert.match(app.innerHTML, new RegExp(title))
    if (isAnalysis) {
      assert.match(app.innerHTML, /data-research-tab="analysis">岗培优化建议<\/button>/)
      assert.match(app.innerHTML, /<header class="ai-analysis-header">[\s\S]*?<h2>岗培优化建议<\/h2>/)
      assert.doesNotMatch(app.innerHTML, /热门岗位分析建议/)
      assert.doesNotMatch(app.innerHTML, /<header class="research-title-row">[\s\S]*?<h2>岗培优化建议<\/h2>/)
      assert.doesNotMatch(app.innerHTML, /综合产业链、招聘与岗位能力数据，研判热门岗位及专业建设方向。/)
      assert.doesNotMatch(app.innerHTML, /class="research-page-purpose"/)
    } else {
      assert.match(app.innerHTML, new RegExp(`<h2>${title}<\\/h2>`))
      assert.match(app.innerHTML, /class="research-page-purpose"/)
      assert.match(app.innerHTML, /产业调研数据未初始化/)
      assert.match(app.innerHTML, /请先前往 CMS 进行数据初始化/)
    }
    assert.equal(typeof clickHandler, 'function')

    const demandButton = new FakeElement()
    demandButton.closest = (selector) => {
      if (selector === '[data-research-tab]') return { dataset: { researchTab: 'demand' } }
      return null
    }
    demandButton.matches = () => false
    assert.doesNotThrow(() => clickHandler({ target: demandButton }))
    assert.match(app.innerHTML, /招聘需求趋势/)
    assert.match(app.innerHTML, /产业调研数据未初始化/)

    if (tab === 'portrait') {
      storage['major-construction-platform:industry-research'] = JSON.stringify({
        initialized: true,
        selectedChainIds: ['smart-construction'],
        selectedAt: '2026-07-21T00:00:00.000Z'
      })
      const portraitButton = new FakeElement()
      portraitButton.closest = (selector) => {
        if (selector === '[data-research-tab]') return { dataset: { researchTab: 'portrait' } }
        return null
      }
      portraitButton.matches = () => false
      assert.doesNotThrow(() => clickHandler({ target: portraitButton }))
      assert.match(app.innerHTML, /岗位需求已由数字设计与BIM延伸至/)
      assert.match(app.innerHTML, /呈现跨环节复合化发展/)
      assert.doesNotMatch(app.innerHTML, /岗位为24个/)
    }
  }
})

test('static html default file view opens the results portal in a new tab from 建设成果展示', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  let openedUrl = ''
  let openedTarget = ''
  const app = {
    innerHTML: '',
    querySelector() { return null },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
    }
  }

  const storage = {}
  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        querySelector() { return null },
        querySelectorAll() { return [] }
      }
    }
  }

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html')
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open(urlString, target) {
        openedUrl = urlString
        openedTarget = target
        return { opener: null }
      },
      scrollTo() {},
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
    },
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  assert.ok(clickHandler, 'expected click handler to be registered on app')

  const resultsButton = new FakeElement()
  resultsButton.classList = { contains: () => false }
  resultsButton.closest = (selector) => selector === '[data-results-open]' ? {} : null
  resultsButton.matches = () => false

  assert.doesNotThrow(() => clickHandler({ target: resultsButton }))
  assert.equal(openedTarget, '_blank')
  assert.match(openedUrl, /view=results-portal/)
})

test('static portrait graph launcher preserves the selected job id in the opened URL', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  let openedUrl = ''
  const app = {
    innerHTML: '',
    querySelector() { return null },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
    }
  }

  const storage = {}
  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        querySelector() { return null },
        querySelectorAll() { return [] }
      }
    }
  }

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html')
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open(urlString) {
        openedUrl = urlString
        return { opener: null }
      },
      scrollTo() {},
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
    },
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  assert.ok(clickHandler, 'expected click handler to be registered on app')

  const portraitGraphButton = new FakeElement()
  portraitGraphButton.classList = { contains: () => false }
  portraitGraphButton.closest = (selector) => {
    if (selector === '[data-open-static-portrait-graph]') {
      return { dataset: { openStaticPortraitGraph: 'job-site-manager' } }
    }
    return null
  }
  portraitGraphButton.matches = () => false

  assert.doesNotThrow(() => clickHandler({ target: portraitGraphButton }))
  assert.match(openedUrl, /view=job-competency-map/)
  assert.match(openedUrl, /job=job-site-manager/)
})

test('switching back to 岗位中心 clears a stale course-model view parameter', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  const app = {
    innerHTML: '',
    querySelector() { return null },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
    }
  }

  const storage = {}
  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html?view=course-model')
  const location = { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname }
  const history = {
    replaceState(_state, _title, nextUrl) {
      const next = new URL(nextUrl)
      location.href = next.toString()
      location.search = next.search
      location.pathname = next.pathname
    }
  }
  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        querySelector() { return null },
        querySelectorAll() { return [] }
      }
    }
  }

  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location,
      history,
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open() { return { opener: null } },
      scrollTo() {},
      localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] }
    },
    localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => storage[k] = String(v), removeItem: (k) => delete storage[k] },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  assert.ok(clickHandler, 'expected click handler to be registered on app')
  assert.match(app.innerHTML, /概率论与数理统计-wjl-智能体/)
  assert.match(app.innerHTML, /data-course-model-board/)
  assert.match(app.innerHTML, /data-course-edit-toggle/)
  assert.doesNotMatch(app.innerHTML, /课程模型入口保留/)

  const jobModuleButton = new FakeElement()
  jobModuleButton.classList = { contains: () => false }
  jobModuleButton.closest = (selector) => selector === '[data-module="job"]' ? {} : null
  jobModuleButton.matches = () => false

  assert.doesNotThrow(() => clickHandler({ target: jobModuleButton }))
  assert.match(app.innerHTML, /岗位中心智能总结/)
  assert.doesNotMatch(location.href, /view=course-model/)
})

test('static professional model tab opens the restored course model view', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  let openedUrl = ''
  let openedTarget = ''
  const app = {
    innerHTML: '',
    querySelector() { return null },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
    }
  }
  const documentStub = {
    body: { classList: { add() {}, remove() {} } },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      return {
        className: '',
        innerHTML: '',
        style: {},
        appendChild() {},
        setAttribute() {},
        addEventListener() {},
        querySelector() { return null },
        querySelectorAll() { return [] }
      }
    }
  }
  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html')
  const sandbox = {
    console,
    Element: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
      open(urlString, target) {
        openedUrl = urlString
        openedTarget = target
        return { opener: null }
      },
      scrollTo() {},
      localStorage: { getItem: () => null, setItem() {}, removeItem() {} }
    },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame(cb) { if (typeof cb === 'function') cb(); return 1 },
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math
  }

  vm.createContext(sandbox)
  vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  assert.ok(clickHandler, 'expected click handler to be registered on app')

  const courseModelButton = new FakeElement()
  courseModelButton.classList = { contains: () => false }
  courseModelButton.closest = (selector) => selector === '[data-open-course-model]' ? {} : null
  courseModelButton.matches = () => false

  assert.doesNotThrow(() => clickHandler({ target: courseModelButton }))
  assert.equal(openedTarget, '_blank')
  assert.match(openedUrl, /view=course-model/)
  assert.doesNotMatch(app.innerHTML, /概率论与数理统计-wjl-智能体/)
})

test('static html portal navigation places 岗位中心 before 课程体系', () => {
  const navMatch = staticHtml.match(/const resultsPortalNav = \[([\s\S]*?)\]/)
  assert.ok(navMatch)
  assert.ok(navMatch[1].indexOf("'岗位中心'") < navMatch[1].indexOf("'课程体系'"))
})

test('results portal job center shows the industry graph in Vue entry', () => {
  assert.match(appSource, /activeResultsPortalTab === '岗位中心'/)
  assert.match(appSource, /results-portal-graph/)
  assert.match(appSource, /产业专业图谱/)
})

test('results portal home hero uses intelligent construction copy and populated metrics', () => {
  assert.match(appSource, /resultsPortalHeroMetrics/)
  assert.match(appSource, /智能建造工程专业/)
  assert.match(appSource, /建筑业数字化转型与绿色低碳建造需求/)
  assert.doesNotMatch(appSource, /<h1>人工智能专业<\/h1>/)

  for (const label of ['专业课程', '建设岗位', '知识点', 'AI工具', '智能体', '专业资源']) {
    assert.match(appSource, new RegExp(label))
    assert.match(staticHtml, new RegExp(label))
  }
})

test('job center mock uses intelligent construction industry chain with at least 20 jobs', () => {
  const jobCardsBlock = jobCenterMock.match(/const BASE_JOB_CARDS: JobCard\[] = \[([\s\S]*?)\]\n\nexport const JOB_CARDS/)
  assert.ok(jobCardsBlock)
  const jobCount = [...jobCardsBlock[1].matchAll(/id: 'job-/g)].length
  assert.ok(jobCount >= 20, `expected at least 20 jobs, got ${jobCount}`)

  for (const label of [
    '智能建造工程',
    '智能建造产业链',
    'BIM协同设计与算量平台',
    '装配式构件生产与数字工厂',
    '智慧工地管理平台',
    '智能检测监测与结构健康',
    'BIM深化设计工程师',
    '智慧工地管理工程师',
    '建筑机器人应用工程师',
    '结构健康监测工程师'
  ]) {
    assert.match(jobCenterMock, new RegExp(label))
  }

  assert.doesNotMatch(jobCenterMock, /major: '人工智能技术应用'/)
  assert.doesNotMatch(jobCenterMock, /人工智能产业链/)
})

test('results portal job center shows the industry graph in static entry', () => {
  assert.match(staticHtml, /data-results-panel="岗位中心"/)
  assert.match(staticHtml, /data-results-tab="\$\{item\}"/)
  assert.match(staticHtml, /results-portal-graph/)
  assert.match(staticHtml, /产业专业图谱/)
})

test('results portal embeds the repository OpenDesign graph copy in Vue and static entries', async () => {
  const openDesignSourcePath = /file:\/\/\/Users\/liuhongzhe\/Documents\/Codex\/2026-06-15\/help-me-locally-deploy-open-design\/work\/open-design\/\.od\/projects\/d8cf836e-0d47-4647-875e-99990c27b65d\/industry-education-graph-prototype\.html/

  assert.match(appVue, /openDesignGraphFrameSrc/)
  assert.match(appVue, /\/opendesign\/industry-education-graph-prototype\.html/)
  assert.match(appVue, /openDesignGraphFrameVersion/)
  assert.match(appVue, /odVersion/)
  assert.match(appVue, /class="opendesign-graph-frame"/)
  assert.doesNotMatch(appVue, openDesignSourcePath)

  assert.match(staticHtml, /staticOpenDesignGraphFrameSrc/)
  assert.match(staticHtml, /\.\/public\/opendesign\/industry-education-graph-prototype\.html/)
  assert.match(staticHtml, /staticOpenDesignGraphFrameVersion/)
  assert.match(staticHtml, /odVersion/)
  assert.match(staticHtml, /class="opendesign-graph-frame"/)
  assert.match(staticHtml, /const baseUrl = staticOpenDesignGraphUrl/)
  assert.doesNotMatch(staticHtml, openDesignSourcePath)

  assert.match(stylesCss, /\.opendesign-graph-frame-shell/)
  assert.match(stylesCss, /\.opendesign-graph-frame/)
  assert.match(openDesignGraphHtml, /产教融合三类图谱工作区/)
})

test('OpenDesign industry graph mirrors all 24 results portal jobs with a group-focused responsive layout', () => {
  assert.match(openDesignGraphHtml, /const industryJobCards = \[/)
  assert.match(openDesignGraphHtml, /data-job-group-filter/)
  assert.match(openDesignGraphHtml, /data-industry-job-id/)
  assert.match(openDesignGraphHtml, /applyActiveIndustryJobFromLocation/)
  assert.match(openDesignGraphHtml, /activeJob/)
  assert.match(openDesignGraphHtml, /岗位群聚焦/)
  assert.match(openDesignGraphHtml, /let currentIndustryNode = "chain-digital-construction"/)
  assert.match(openDesignGraphHtml, /applyTheme\(storedTheme\);\s*applyGraphVisibility\(\);/)
  assert.match(openDesignGraphHtml, /if \(graphVisibility\.program \|\| graphVisibility\.course\) \{\s*setFocus/)
  assert.doesNotMatch(openDesignGraphHtml, /24岗位索引/)
  assert.doesNotMatch(openDesignGraphHtml, /industry-job-pool/)

  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .graph-stage'), /justify-items:\s*stretch/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-overlay'), /inline-size:\s*100%/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-overlay'), /display:\s*grid/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-map'), /grid-template-columns:\s*1fr;/)
  assert.doesNotMatch(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-map'), /repeat\(auto-fit/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-map'), /inline-size:\s*100%/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-layer'), /grid-template-rows:\s*auto\s+1fr/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-layer'), /inline-size:\s*100%/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-node-grid'), /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*180px\),\s*1fr\)\)/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-node-grid'), /inline-size:\s*100%/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-job-focus-grid'), /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*180px\),\s*1fr\)\)/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .industry-job-focus-grid'), /inline-size:\s*100%/)
  assert.match(openDesignGraphHtml, /\.graph-shell\[data-view="industry"\]:has\(\.program-view\.is-graph-hidden\) \.graph-stage/)
  assert.match(openDesignStyleBlock('.graph-shell[data-view="industry"]:has(.program-view.is-graph-hidden) .graph-stage'), /grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(openDesignStyleBlock('.graph-shell[data-view="industry"]:has(.program-view.is-graph-hidden) .industry-overlay'), /grid-column:\s*1\s*\/\s*-1/)
  assert.match(openDesignStyleBlock('.graph-shell[data-view="industry"]:has(.program-view.is-graph-hidden) .industry-map'), /inline-size:\s*100%/)
  assert.match(openDesignStyleBlock('.graph-shell[data-layout="industry-only"] .program-view'), /display:\s*none/)
  assert.match(openDesignStyleBlock('.graph-shell[data-view="industry"]:has(.program-view.is-graph-hidden) .program-view'), /display:\s*none/)

  const jobDataBlock = openDesignGraphHtml.match(/const industryJobCards = \[([\s\S]*?)\];/)
  assert.ok(jobDataBlock, 'OpenDesign graph should expose industryJobCards mock data')
  const graphJobIds = [...jobDataBlock[1].matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1])
  assert.equal(new Set(graphJobIds).size, JOB_CARDS.length)

  for (const job of JOB_CARDS) {
    assert.ok(graphJobIds.includes(job.id), `${job.id} should be present in OpenDesign graph data`)
    assert.match(openDesignGraphHtml, new RegExp(job.name))
    assert.match(openDesignGraphHtml, new RegExp(job.groupName))
  }
})

test('OpenDesign job focus graph links jobs directly to ability canvas without task layer', () => {
  for (const token of [
    'data-layer-tone="ability"',
    'industry-ability-grid',
    'abilityCardHtml',
    '岗位能力点'
  ]) {
    assert.match(openDesignGraphHtml, new RegExp(token))
  }

  for (const token of [
    'data-layer-tone="task"',
    'industry-task-grid',
    'taskCardHtml',
    '<span>典型工作任务</span>'
  ]) {
    assert.doesNotMatch(openDesignGraphHtml, new RegExp(token))
  }

  assert.match(openDesignStyleBlock('.industry-layer[data-layer-tone="ability"]'), /--layer-accent:\s*oklch\(72%\s*0\.108\s*154\)/)
  assert.doesNotMatch(openDesignGraphHtml, /industry-job-detail-drawer/)
  assert.doesNotMatch(openDesignGraphHtml, /industry-evidence-chain/)
  assert.doesNotMatch(openDesignGraphHtml, /renderIndustryEvidenceChain/)
})

test('results portal keeps the OpenDesign iframe focused on the active carousel job', () => {
  assert.match(appVue, /buildOpenDesignGraphFrameSrc/)
  assert.match(appVue, /activeResultsPortalJobCard\.value\?\.id/)
  assert.match(appVue, /activeJob/)
  assert.match(appVue, /params\.set\('activeJob', activeJobId\)/)

  assert.match(staticHtml, /staticOpenDesignGraphFrameSrc\(card\.id\)/)
  assert.match(staticHtml, /updateStaticOpenDesignGraphFrame/)
  assert.match(staticHtml, /activeJob/)
  assert.match(staticHtml, /params\.set\('activeJob', activeJobId\)/)
})

test('job center keeps the industry research entry and industry layout tabs visible', () => {
  assert.match(appSource, /const jobSideItems = \['产业调研', '报告生成'\]/)
  assert.doesNotMatch(appSource, /const jobSideItems = \[[^\]]*'岗位建设中心'/)
  assert.match(appSource, /const INDUSTRY_RESEARCH_TABS/)
  assert.match(appSource, /currentJobIndustryTab/)
  assert.match(appSource, /selectJobIndustryTab/)
  for (const label of ['产业链图谱', '区域产业分析', '产业政策库', '产业企业库', '产业布局', '岗位分析']) {
    assert.match(appSource, new RegExp(label))
  }

  assert.match(staticHtml, /class="job-research-heading[\s\S]*data-job-primary="research"[\s\S]*<strong>产业调研<\/strong>/)
  assert.match(staticHtml, /class="job-research-heading job-report-heading[\s\S]*data-job-primary="report"[\s\S]*<strong>报告生成<\/strong>/)
  assert.doesNotMatch(staticHtml, /data-job-primary="build"/)
  assert.match(staticHtml, /<div class="job-sub-title">· 产业布局 ·<\/div>[\s\S]*<div class="job-sub-title job-sub-title-spaced">· 岗位分析 ·<\/div>/)
  assert.match(staticHtml, /data-industry-tab="\$\{key\}"/)
  assert.match(staticHtml, /data-research-tab="\$\{key\}"/)
  assert.match(staticHtml, /research-page-purpose/)
})

test('page and dialog headers do not render breadcrumb labels', () => {
  const breadcrumbLabels = [
    '产业调研 / 产业布局',
    '产业调研 / 岗位分析',
    '岗位中心 / 报告生成',
    '人才方案管理 / 子系统',
    '人才方案管理 / 培养目标',
    '课程模型 / 岗位能力',
    '岗位详情 / 关联课程',
    '岗位详情 / 典型工作任务',
    '岗位详情 / 岗位能力项',
    '岗位详情 / 基本信息',
    '岗位建设中心 / 手动添加',
    '岗位画像分析 / 岗位详情',
    '产业政策库 / 政策详情'
  ]

  for (const source of [appSource, staticHtml]) {
    for (const label of breadcrumbLabels) {
      assert.doesNotMatch(source, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
  }
})

test('industry research policy and company data matches intelligent construction', () => {
  for (const source of [appSource, staticHtml]) {
    for (const label of [
      '中国建筑',
      '广联达',
      '品茗科技',
      '装配式建筑',
      '智慧工地',
      '建筑机器人',
      'BIM协同',
      '智能建造',
      '统一社会信用代码',
      '<th>经营范围</th>'
    ]) {
      assert.match(source, new RegExp(label))
    }

    assert.doesNotMatch(source, /<th>具体产品 \/ 技术 \/ 服务节点<\/th>/)

    for (const oldLabel of [
      '百度智能云',
      '科大讯飞',
      '商汤科技',
      '生成式人工智能',
      '人工智能\\+行动',
      'AI开发与训练平台',
      'AIGC应用',
      'MLOps与合规运维',
      '模型部署与MLOps'
    ]) {
      assert.doesNotMatch(source, new RegExp(oldLabel))
    }
  }
})

test('industry policy timeline is sorted by date descending', () => {
  const parsePolicyDates = (source, startMarker, endMarker) => {
    const start = source.indexOf(startMarker)
    const end = source.indexOf(endMarker, start)
    assert.ok(start > -1)
    assert.ok(end > start)
    return [...source.slice(start, end).matchAll(/date: '(\d{4})年(\d{1,2})月'/g)].map((match) =>
      Number(match[1]) * 100 + Number(match[2])
    )
  }

  for (const dates of [
    parsePolicyDates(appSource, 'const industryPolicyItems = [', 'export const industryPolicyKeywords = ['),
    parsePolicyDates(staticHtml, 'const staticPolicyItems = [', 'const staticPolicyDateParts =')
  ]) {
    assert.ok(dates.length >= 4)
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a))
  }
})

test('industry policy library exposes rich official source metadata', () => {
  const countPolicies = (source, startMarker, endMarker) => {
    const start = source.indexOf(startMarker)
    const end = source.indexOf(endMarker, start)
    assert.ok(start > -1)
    assert.ok(end > start)
    return [...source.slice(start, end).matchAll(/title: '/g)].length
  }

  assert.ok(countPolicies(appSource, 'const industryPolicyItems = [', 'export const industryPolicyKeywords = [') >= 8)
  assert.ok(countPolicies(staticHtml, 'const staticPolicyItems = [', 'const staticPolicyDateParts =') >= 8)

  for (const source of [appSource, staticHtml]) {
    for (const label of ['agency', 'source', 'publishDate', 'url', 'summary', '政策来源', '发布时间', '原始地址']) {
      assert.match(source, new RegExp(label))
    }
    assert.match(source, /https:\/\/www\.gov\.cn/)
    assert.match(source, /https:\/\/www\.mohurd\.gov\.cn/)
    assert.doesNotMatch(source, /policy\.agency\}<\/em>/)
  }
})

test('industry policy library includes current 2025 and 2026 policy entries', () => {
  const collectPolicyBlock = (source, startMarker, endMarker) => {
    const start = source.indexOf(startMarker)
    const end = source.indexOf(endMarker, start)
    assert.ok(start > -1)
    assert.ok(end > start)
    return source.slice(start, end)
  }

  for (const block of [
    collectPolicyBlock(appSource, 'const industryPolicyItems = [', 'export const industryPolicyKeywords = ['),
    collectPolicyBlock(staticHtml, 'const staticPolicyItems = [', 'const staticPolicyDateParts =')
  ]) {
    assert.match(block, /date: '2026年/)
    assert.match(block, /publishDate: '2026-\d{2}-\d{2}'/)
    assert.match(block, /date: '2025年/)
    assert.match(block, /publishDate: '2025-\d{2}-\d{2}'/)
    assert.match(block, /https:\/\/www\.gov\.cn/)
    assert.match(block, /https:\/\/www\.mohurd\.gov\.cn/)
  }
})

test('industry policy page keeps keyword word cloud and annual trend side panel', () => {
  for (const source of [appSource, staticHtml]) {
    for (const label of [
      'policy-layout',
      'policy-word-cloud',
      'word-cloud-stage',
      'word-cloud-node',
      'policy-bars',
      '政策关键词热度',
      '年度政策趋势',
      'BIM协同',
      '智慧工地',
      '装配式建筑',
      '绿色建造'
    ]) {
      assert.match(source, new RegExp(label))
    }
    assert.doesNotMatch(source, /keyword-heat-panel policy-keyword-panel/)
  }
})

test('industry company pagination keeps enough bottom breathing room', () => {
  const paginationStyles = styleBlock('.pagination.portrait-pagination.industry-company-pagination')
  const paddingMatch = paginationStyles.match(/padding:\s*\d+px\s+\d+px\s+(\d+)px/)
  assert.ok(paddingMatch, 'industry company pagination should declare vertical padding')
  assert.ok(Number(paddingMatch[1]) >= 34, 'bottom padding should keep the paginator away from the card edge')
})

test('industry policy list keeps more policies inside an internal scroll panel', () => {
  const cardStyles = styleBlock('.policy-timeline-card')
  const timelineStyles = styleBlock('.policy-timeline')
  assert.match(cardStyles, /display:\s*flex/)
  assert.match(cardStyles, /flex-direction:\s*column/)
  assert.match(cardStyles, /height:\s*100%/)
  assert.match(cardStyles, /min-height:\s*0/)
  assert.match(timelineStyles, /flex:\s*1/)
  assert.match(timelineStyles, /min-height:\s*0/)
  assert.match(timelineStyles, /overflow-y:\s*auto/)
  assert.match(appSource, /policy-timeline-meta/)
  assert.match(staticHtml, /policy-timeline-meta/)
})

test('industry policy library matches the Figma board with filters and insight panels', () => {
  for (const source of [appSource, staticHtml]) {
    for (const label of [
      'policy-board',
      'research-compact-ai',
      'data-summary-source',
      'policy-segments',
      'policy-search-box',
      'policy-filter-select',
      'filteredIndustryPolicyItems',
      '政策标题 / 关键词',
      '政策级别',
      '政策关键词云',
      '高频政策方向',
      '年度政策趋势',
      '政策关注度',
      'policy-empty-state'
    ]) {
      assert.match(source, new RegExp(label))
    }
  }

  const boardStyles = styleBlock('.policy-board')
  assert.match(boardStyles, /background:\s*#d6e4ff/)
  assert.match(boardStyles, /border-radius:\s*8px/)
  assert.match(boardStyles, /(?:^|\n)\s*height:\s*814px/)
  assert.match(boardStyles, /min-height:\s*814px/)
  assert.match(boardStyles, /box-sizing:\s*border-box/)
  assert.match(boardStyles, /align-content:\s*start/)
  assert.match(boardStyles, /grid-template-rows:\s*32px\s+732px/)
  assert.match(boardStyles, /gap:\s*18px/)
  assert.match(boardStyles, /padding:\s*16px/)

  const flatCanvasStyles = styleBlock('.job-company-flat-content .job-center-card.job-research-flat-canvas')
  assert.match(flatCanvasStyles, /margin:\s*0/)

  const layoutStyles = styleBlock('.policy-layout')
  assert.match(layoutStyles, /grid-template-columns:\s*minmax\(0,\s*1\.8fr\)\s+minmax\(360px,\s*1fr\)/)
  assert.match(layoutStyles, /height:\s*732px/)
  assert.match(layoutStyles, /min-height:\s*732px/)
  assert.match(layoutStyles, /gap:\s*18px/)
  assert.match(layoutStyles, /align-items:\s*stretch/)

  const sideStyles = styleBlock('.policy-side')
  assert.match(sideStyles, /grid-template-rows:\s*306px\s+306px/)
  assert.match(sideStyles, /gap:\s*18px/)
  assert.match(sideStyles, /height:\s*732px/)
  assert.match(sideStyles, /align-content:\s*start/)
  assert.match(styleBlock('.policy-chip-cloud'), /height:\s*254px/)
  assert.match(styleBlock('.policy-bars'), /height:\s*254px/)

  const chainRowStyles = styleBlock('.policy-chain-row')
  assert.match(chainRowStyles, /display:\s*grid/)
  assert.match(chainRowStyles, /grid-template-columns:\s*1fr/)
  assert.match(chainRowStyles, /width:\s*min\(920px, 100%\)/)
  assert.match(chainRowStyles, /height:\s*32px/)
  assert.match(chainRowStyles, /border:\s*1px solid rgba\(255, 255, 255, 0\.9\)/)
  assert.match(chainRowStyles, /background:\s*rgba\(255, 255, 255, 0\.42\)/)

  const segmentStyles = styleBlock('.policy-segments')
  assert.match(segmentStyles, /display:\s*grid/)
  assert.match(segmentStyles, /grid-template-columns:\s*repeat\(5, minmax\(150px, 1fr\)\)/)
  assert.match(styleBlock('.policy-segments button'), /min-height:\s*28px/)
  assert.match(styleBlock('.policy-segments button'), /font-size:\s*13px/)
  assert.match(styleBlock('.policy-segments button'), /font-weight:\s*600/)
  assert.match(styleBlock('.policy-segments button'), /white-space:\s*nowrap/)
  assert.match(styleBlock('.policy-segments button.active'), /background:\s*rgba\(255, 255, 255, 0\.92\)/)

  const timelineCardStyles = styleBlock('.policy-layout .policy-timeline-card,\n.policy-side .research-card')
  assert.match(timelineCardStyles, /border:\s*1px solid #ffffff/)
  assert.match(timelineCardStyles, /background:\s*#f3f7ff/)
  assert.match(timelineCardStyles, /box-shadow:\s*none/)

  const staticJobMenuStyles = styleBlock('.section-menu.job-module-menu.job-figma-menu')
  assert.match(staticJobMenuStyles, /width:\s*176px/)
  assert.match(staticJobMenuStyles, /flex:\s*0 0 176px/)
  assert.match(staticJobMenuStyles, /padding:\s*31px 24px 16px/)

  const policyOpenStyles = styleBlock('.policy-item-open')
  assert.match(policyOpenStyles, /grid-template-columns:\s*60px\s+minmax\(0,\s*1fr\)/)
  assert.match(policyOpenStyles, /gap:\s*24px/)
  assert.match(policyOpenStyles, /min-height:\s*141px/)
  assert.match(policyOpenStyles, /padding:\s*12px 8px/)
})

test('industry policy controls and copy use the exact Figma dimensions and typography', () => {
  const listHead = styleBlock('.policy-list-head')
  assert.match(listHead, /grid-template-columns:\s*132px\s+240px\s+160px/)
  assert.doesNotMatch(listHead, /max-content/)
  assert.match(listHead, /gap:\s*12px/)

  const searchStyles = styleBlock('.policy-search-box')
  assert.match(searchStyles, /width:\s*240px/)
  const filterStyles = styleBlock('.policy-filter-select')
  assert.match(filterStyles, /width:\s*160px/)

  const controlStyles = styleBlock('.policy-search-box,\n.policy-filter-select')
  assert.match(controlStyles, /height:\s*32px/)
  assert.match(controlStyles, /border:\s*1px solid rgba\(16, 63, 183, 0\.17\)/)
  assert.match(controlStyles, /background:\s*rgba\(255, 255, 255, 0\.8\)/)

  const listTitleStyles = styleBlock('.policy-list-head h3')
  assert.match(listTitleStyles, /color:\s*#2b2e35/)
  assert.match(listTitleStyles, /font-size:\s*16px/)
  assert.match(listTitleStyles, /font-weight:\s*600/)
  assert.match(listTitleStyles, /line-height:\s*26px/)

  const searchPlaceholderStyles = styleBlock('.policy-search-box input::placeholder')
  assert.match(searchPlaceholderStyles, /color:\s*#a0acc5/)
  assert.match(searchPlaceholderStyles, /font-weight:\s*400/)
  assert.match(searchPlaceholderStyles, /opacity:\s*1/)

  const policyTitleStyles = styleBlock('.policy-item-open .policy-title-row > strong')
  assert.match(policyTitleStyles, /color:\s*#142346/)
  assert.match(policyTitleStyles, /font-size:\s*15px/)
  assert.match(policyTitleStyles, /font-weight:\s*600/)
  assert.match(policyTitleStyles, /line-height:\s*20px/)

  const summaryStyles = styleBlock('.policy-item-open .policy-item-main > p')
  assert.match(summaryStyles, /color:\s*#495d87/)
  assert.match(summaryStyles, /font-size:\s*14px/)
  assert.match(summaryStyles, /font-weight:\s*400/)
  assert.match(summaryStyles, /line-height:\s*24px/)

  const sideTitleStyles = styleBlock('.policy-side .research-card-head h3')
  assert.match(sideTitleStyles, /color:\s*#142346/)
  assert.match(sideTitleStyles, /font-size:\s*16px/)
  assert.match(sideTitleStyles, /font-weight:\s*600/)
  assert.match(sideTitleStyles, /line-height:\s*22px/)

  const sideSubtitleStyles = styleBlock('.policy-side .research-card-head > span')
  assert.match(sideSubtitleStyles, /color:\s*#7485a8/)
  assert.match(sideSubtitleStyles, /font-size:\s*14px/)
  assert.match(sideSubtitleStyles, /font-weight:\s*400/)
  assert.match(sideSubtitleStyles, /line-height:\s*26px/)

  assert.match(stylesCss, /@media \(max-width:\s*1240px\) \{[\s\S]*?\.policy-list-head \{[\s\S]*?grid-template-columns:\s*120px minmax\(180px,\s*1fr\) 132px/)
  assert.match(stylesCss, /@media \(max-width:\s*1240px\) \{[\s\S]*?\.policy-search-box,[\s\S]*?\.policy-filter-select \{[\s\S]*?width:\s*100%/)
})

test('industry policy filters show the current result count without an extra clear action', () => {
  assert.match(appVue, /产业政策库（\{\{\s*filteredIndustryPolicyItems\.length\s*\}\}）/)
  assert.doesNotMatch(appVue, /产业政策库（\{\{\s*industryPolicyItems\.length\s*\}\}）/)
  assert.match(staticHtml, /产业政策库（\$\{filtered\.length\}）/)
  assert.doesNotMatch(staticHtml, /产业政策库（\$\{staticPolicyItems\.length\}）/)

  for (const source of [appVue, staticHtml]) {
    assert.doesNotMatch(source, /policy-clear-action/)
    assert.doesNotMatch(source, />\s*清除筛选项\s*</)
  }
  assert.doesNotMatch(staticHtml, /data-static-policy-clear/)
})

test('industry policy data and panels follow the selected chain with a six-year trend axis', () => {
  assert.match(appTalentIndustryData, /export const industryPolicyViewsByChain/)
  assert.match(staticHtml, /const staticPolicyViewsByChain/)

  for (const chain of ['智能建造产业链', '装配式建筑产业链', '建筑数字化服务链', '绿色低碳建造产业链']) {
    assert.match(appTalentIndustryData, new RegExp(chain))
    assert.match(staticHtml, new RegExp(chain))
  }

  assert.match(appVue, /activeIndustryPolicyView/)
  assert.match(appVue, /industryPoliciesForSelectedChain/)
  assert.match(appVue, /const industryPolicyChainOptions = Object\.keys\(industryPolicyViewsByChain\)/)
  assert.match(appVue, /const activeIndustryPolicyChain = computed/)
  assert.match(staticHtml, /staticActiveIndustryPolicyView/)
  assert.match(staticHtml, /staticPoliciesForSelectedChain/)
  assert.match(staticHtml, /const staticPolicyChainOptions = Object\.keys\(staticPolicyViewsByChain\)/)

  const vuePolicyStart = appVue.indexOf('<template v-else-if="currentJobIndustryTab === \'policy\'">')
  const vueCompanyStart = appVue.indexOf('<template v-else>', vuePolicyStart)
  assert.ok(vuePolicyStart >= 0 && vueCompanyStart > vuePolicyStart)
  const vuePolicyTemplate = appVue.slice(vuePolicyStart, vueCompanyStart)
  assert.match(vuePolicyTemplate, /v-for="industry in industryPolicyChainOptions"/)
  assert.doesNotMatch(vuePolicyTemplate, /v-for="industry in REPORT_INDUSTRY_OPTIONS"/)
  const staticPolicyTemplate = sourceSlice(staticHtml, 'const industryPolicyBody = () => {', 'const industryCompanyBody = () => {')
  assert.match(staticPolicyTemplate, /staticPolicyChainOptions\.map/)

  const vueTrendBlock = sourceSlice(appTalentIndustryData, 'export const industryPolicyTrends = [', 'export const industryPolicyViewsByChain')
  const staticTrendBlock = sourceSlice(staticHtml, 'const staticPolicyTrends = [', 'const staticPolicyViewsByChain')
  for (const source of [vueTrendBlock, staticTrendBlock]) {
    for (const year of ['2022', '2023', '2024', '2025', '2026', '2027']) {
      assert.match(source, new RegExp(`year: '${year}'`))
    }
    assert.equal([...source.matchAll(/year: '\d{4}'/g)].length, 6)
    const values = [...source.matchAll(/value:\s*(\d+)/g)].map((match) => Number(match[1]))
    const heights = [...source.matchAll(/height:\s*'(\d+)px'/g)].map((match) => Number(match[1]))
    assert.deepEqual(values, [72, 46, 102, 98, 66, 90])
    assert.deepEqual(heights, [103, 66, 146, 140, 95, 129])
  }

  for (const source of [appVue, staticHtml]) {
    assert.match(source, /policy-trend-axis/)
    assert.match(source, /policy-trend-plot/)
    assert.match(source, /item\.year === '2027' \? '预测' : ''/)
    assert.match(source, /示意性归一化指数，仅用于演示政策热度变化/)
    assert.match(source, /政策关注度示意指数/)
  }
  assert.match(appVue, /const industryPolicyTrendTicks = \[120, 90, 60, 30, 0\]/)
  assert.match(staticHtml, /const trendAxis = '<span>120<\/span><span>90<\/span><span>60<\/span><span>30<\/span><span>0<\/span>'/)
})

test('industry policy tabs, rows, dialogs, and standalone search expose keyboard-safe behavior', () => {
  assert.match(appVue, /handleIndustryPolicyTabKeydown/)
  assert.match(appVue, /:tabindex="activeIndustryPolicyChain === industry \? 0 : -1"/)
  assert.match(appVue, /:aria-controls="'industry-policy-panel'"/)
  assert.match(appVue, /id="industry-policy-panel"/)
  assert.match(staticHtml, /data-current-industry-chain-tab/)
  assert.match(staticHtml, /data-policy-tabpanel/)

  for (const source of [appVue, staticHtml]) {
    assert.match(source, /class="policy-item-open"/)
    assert.doesNotMatch(source, /<article[^>]*class="policy-timeline-item"[^>]*role="button"/)
  }
  assert.match(styleBlock('.policy-item-open:focus-visible'), /outline:\s*2px solid #3764ff/)
  assert.match(styleBlock('.policy-search-box:focus-within,\n.policy-filter-select:focus-within'), /box-shadow:/)
  const timelineStyles = styleBlock('.policy-timeline')
  assert.match(timelineStyles, /align-content:\s*start/)
  assert.match(timelineStyles, /grid-auto-rows:\s*max-content/)

  assert.match(appVue, /policyDialogRef/)
  assert.match(appVue, /policyDialogCloseRef/)
  assert.match(appVue, /handlePolicyDialogKeydown/)
  assert.match(appVue, /:inert="selectedPolicyItem \? true : undefined"/)
  assert.match(appVue, /:aria-hidden="selectedPolicyItem \? 'true' : undefined"/)
  assert.match(appVue, /ref="policyDialogRef"/)
  assert.match(appVue, /tabindex="-1"/)
  assert.match(appVue, /@keydown="handlePolicyDialogKeydown"/)

  const staticDialogBlock = sourceSlice(staticHtml, 'const showStaticPolicyDialog =', 'const refreshAddDialogState =')
  assert.match(staticDialogBlock, /aria-labelledby="static-policy-detail-title"/)
  assert.match(staticDialogBlock, /id="static-policy-detail-title"/)
  assert.match(staticDialogBlock, /aria-label="关闭政策详情"/)
  assert.match(staticHtml, /const trapStaticDialogFocus/)
  assert.match(staticHtml, /const setStaticDialogBackgroundInert/)
  assert.match(staticHtml, /const appendStaticDialog = \(html, nested = false, extraClass = '', isolateBackground = false\)/)
  assert.match(staticHtml, /if \(isolateBackground\) \{[\s\S]*?setStaticDialogBackgroundInert\(true\)/)
  assert.match(staticHtml, /if \(restoreBackground\) setStaticDialogBackgroundInert\(false\)/)
  assert.match(staticDialogBlock, /appendStaticDialog\([\s\S]*?, false, '', true\)/)
  assert.match(staticHtml, /event\.key === 'Escape'/)
  assert.match(staticHtml, /event\.isComposing/)
  assert.match(staticHtml, /focus\(\{ preventScroll: true \}\)/)
  assert.match(staticHtml, /setSelectionRange\(selectionStart, selectionEnd\)/)
  assert.match(staticHtml, /policyButton\.focus\(\{ preventScroll: true \}\)/)
  assert.match(staticHtml, /id="static-policy-result-announcer" class="policy-result-announcer" role="status" aria-live="polite" aria-atomic="true"/)
  assert.match(staticHtml, /const staticPolicyResultAnnouncer = document\.querySelector\('#static-policy-result-announcer'\)/)
  assert.match(staticHtml, /const announceStaticPolicyResults = \(\) =>/)
  assert.match(staticHtml, /if \(!staticPolicyResultAnnouncer \|\| staticPolicyResultAnnouncer === app\) return/)
  assert.match(staticHtml, /if \(tab === 'policy'\) announceStaticPolicyResults\(\)/)
  assert.match(staticHtml, /const levelSelect = app\.querySelector\('\[data-static-policy-level\]'\)/)
  assert.match(staticHtml, /if \(levelSelect instanceof HTMLSelectElement\) levelSelect\.focus\(\{ preventScroll: true \}\)/)
})

test('industry policy page removes duplicated intro blocks and left-aligns chain tabs in the board', () => {
  assert.match(appSource, /const showIndustryResearchChrome = computed\(\(\) =>[\s\S]*currentJobResearchTab\.value !== 'analysis'[\s\S]*currentJobIndustryTab\.value !== 'policy'[\s\S]*currentJobIndustryTab\.value !== 'company'[\s\S]*\)/)
  assert.match(appSource, /<header v-if="showIndustryResearchChrome" class="research-title-row">/)
  assert.match(appSource, /<p v-if="showIndustryResearchChrome" class="research-page-purpose">/)
  assert.match(appSource, /class="research-compact-ai research-figma-ai"[\s\S]*?:data-summary-source="activeResearchSummary\.source"/)
  assert.match(appSource, /policy-chain-row/)
  assert.match(appSource, /policy-segments/)
  assert.doesNotMatch(appSource, /policy-chain-row" aria-label="当前产业链">\s*<span class="research-chain-select-label">当前产业链：<\/span>/)

  assert.match(staticHtml, /const staticCurrentIndustryChainTabs = \(extraClass = ''\) =>/)
  assert.match(staticHtml, /const header = tab === 'policy' \|\| tab === 'company' \? ''/)
  assert.match(staticHtml, /const purposeLine = tab === 'policy' \|\| tab === 'company' \? ''/)
  assert.match(staticHtml, /const brief = tab === 'major'[\s\S]*?staticResearchBriefHtml\('industry', tab\)/)
  assert.match(staticHtml, /policy-segments/)
  assert.doesNotMatch(staticHtml, /staticCurrentIndustryChainTabs\('policy-chain-row'\)/)

  const chainRowStyles = styleBlock('.policy-chain-row')
  assert.match(chainRowStyles, /justify-content:\s*flex-start/)
  assert.match(chainRowStyles, /padding:\s*4px/)
})

test('policy detail dialog follows the Figma summary callout and numbered sections', () => {
  for (const source of [appSource, staticHtml]) {
    for (const label of [
      'policy-summary-callout',
      'policy-callout-icon',
      'policy-section-title',
      'policy-section-index',
      '政策总结',
      '对专业建设的影响'
    ]) {
      assert.match(source, new RegExp(label))
    }
  }
})

test('policy detail dialog places original source action at summary top without breadcrumb', () => {
  const dialogStart = staticHtml.indexOf('const showStaticPolicyDialog =')
  const dialogEnd = staticHtml.indexOf('const refreshAddDialogState =', dialogStart)
  assert.ok(dialogStart > -1)
  assert.ok(dialogEnd > dialogStart)
  const dialogBlock = staticHtml.slice(dialogStart, dialogEnd)

  assert.doesNotMatch(dialogBlock, /产业政策库 \/ 政策详情/)
  assert.match(dialogBlock, /<header class="dialog-header"><div><h2 id="static-policy-detail-title">\$\{policy\.title\}<\/h2><\/div>/)
  assert.match(dialogBlock, /policy-summary-topline/)
  assert.match(dialogBlock, /<span class="policy-level \$\{policy\.tag\}">\$\{policy\.level\}<\/span><strong>\$\{policy\.date\}<\/strong><em>\$\{policy\.agency \|\| policy\.source\}<\/em><a class="policy-source-link" href="\$\{policy\.url\}" target="_blank" rel="noopener">原始地址<\/a>/)
  assert.doesNotMatch(dialogBlock, /policy-original-link policy-source-action/)
  assert.doesNotMatch(dialogBlock, /<dt>原始地址<\/dt>/)

  const summaryToplineStyles = styleBlock('.policy-summary-topline')
  assert.match(summaryToplineStyles, /justify-content:\s*space-between/)
  const sourceLinkStyles = styleBlock('.policy-source-link')
  assert.match(sourceLinkStyles, /margin-left:\s*auto/)
  assert.doesNotMatch(sourceLinkStyles, /background:/)
  assert.doesNotMatch(sourceLinkStyles, /border-radius:/)
})

test('policy detail dialog uses expanded copy without suggested conversion tasks', () => {
  const dialogStart = staticHtml.indexOf('const showStaticPolicyDialog =')
  const dialogEnd = staticHtml.indexOf('const refreshAddDialogState =', dialogStart)
  assert.ok(dialogStart > -1)
  assert.ok(dialogEnd > dialogStart)
  const dialogBlock = staticHtml.slice(dialogStart, dialogEnd)

  assert.doesNotMatch(dialogBlock, /建议转化任务/)
  assert.doesNotMatch(dialogBlock, /policy\.tasks/)
  assert.match(dialogBlock, /getStaticPolicySummaryParagraphs/)
  assert.match(dialogBlock, /getStaticPolicyImpactParagraphs/)
  assert.match(staticHtml, /policy-copy-block/)
  assert.match(staticHtml, /政策主旨/)
  assert.match(staticHtml, /落到专业建设链路/)
})

test('research report content focuses on Northeast and North China regions', () => {
  const appReportStart = researchReportMock.indexOf('export const REPORT_CONTENT = `')
  assert.ok(appReportStart > -1)
  const appReportBlock = researchReportMock.slice(appReportStart)

  const staticReportStart = staticHtml.indexOf('const reportContentHtml = `')
  const staticReportEnd = staticHtml.indexOf('staticReportEditorContent = reportContentHtml', staticReportStart)
  assert.ok(staticReportStart > -1)
  assert.ok(staticReportEnd > staticReportStart)
  const staticReportBlock = staticHtml.slice(staticReportStart, staticReportEnd)

  for (const source of [appReportBlock, staticReportBlock]) {
    for (const label of [
      '分析区域：东北 / 华北',
      '图1 东北与华北智能建造区域协同结构图',
      '图2 东北与华北智能建造企业样本分布',
      '沈阳',
      '大连',
      '长春',
      '哈尔滨',
      '北京',
      '天津',
      '唐山',
      '雄安',
      '辽宁沈阳-大连',
      '京津冀'
    ]) {
      assert.match(source, new RegExp(label))
    }
    assert.doesNotMatch(source, /分析区域：浙江省 \/ 长三角/)
    assert.doesNotMatch(source, /图2 长三角智能建造企业样本区域分布/)
    assert.doesNotMatch(source, /杭州|宁波|嘉兴|绍兴|湖州|上海|苏州/)
  }
})

test('job research company details use intelligent construction enterprises', () => {
  const companyStart = jobResearchMock.indexOf('export const COMPANY_DETAILS: CompanyDetail[] = [')
  const companyEnd = jobResearchMock.indexOf('export const PORTRAIT_COMPETENCY_MAP_CONFIGS', companyStart)
  assert.ok(companyStart > -1)
  assert.ok(companyEnd > companyStart)
  const companyBlock = jobResearchMock.slice(companyStart, companyEnd)

  for (const label of [
    '中国建筑',
    '广联达',
    '品茗科技',
    '中建科技',
    '沈阳远大智能工业',
    'BIM协同',
    '智慧工地',
    '装配式建筑'
  ]) {
    assert.match(companyBlock, new RegExp(label))
  }

  for (const oldLabel of ['百度智能云', '科大讯飞', '商汤科技', '阿里云', '人工智能', '大模型']) {
    assert.doesNotMatch(companyBlock, new RegExp(oldLabel))
  }
})

test('static job portrait research uses intelligent construction jobs instead of old AI jobs', () => {
  const portraitStart = staticHtml.indexOf('const staticPortraitDetails = {')
  const portraitEnd = staticHtml.indexOf('const staticPortraitProfiles', portraitStart)
  assert.ok(portraitStart > -1)
  assert.ok(portraitEnd > portraitStart)
  const portraitBlock = staticHtml.slice(portraitStart, portraitEnd)

  for (const label of [
    'BIM深化设计工程师',
    '智慧工地管理工程师',
    '建筑机器人应用工程师',
    '结构健康监测工程师'
  ]) {
    assert.match(portraitBlock, new RegExp(label))
  }

  assert.match(staticHtml, /staticCurrentIndustryChainTabs/)
  assert.match(staticHtml, /research-chain-select-label/)
  assert.match(staticHtml, /data-current-industry-chain-tab="\$\{staticEscapeText\(item\)\}"/)
  assert.doesNotMatch(portraitBlock, /<select class="research-chain-select"/)
  assert.doesNotMatch(staticHtml, /当前产业链：\$\{staticEscapeText\(item\)\}/)
  assert.doesNotMatch(staticHtml, /data-default-label/)
  assert.doesNotMatch(portraitBlock, /AI模型部署工程师/)
  assert.doesNotMatch(portraitBlock, /工业视觉检测工程师/)
  assert.doesNotMatch(portraitBlock, /模型服务部署/)
})

test('job portrait level uses single seniority values instead of group name or ranges', () => {
  assert.doesNotMatch(staticHtml, /level:\s*job\.groupName/)
  for (const source of [staticHtml, jobResearchMock]) {
    assert.match(source, /level:\s*job\.taskCount >= 7 \? '高级' : job\.taskCount >= 6 \? '中级' : '初级'/)
    assert.doesNotMatch(source, /初中级/)
    assert.doesNotMatch(source, /初级 \/ 中级/)
    assert.doesNotMatch(source, /中级 \/ 高级/)
  }
})

test('job portrait search removes hot tags and shows 12 jobs per page', () => {
  assert.match(appSource, /const portraitPageSize = 12/)
  assert.match(staticHtml, /const staticPortraitPageSize = 12/)

  for (const source of [appSource, staticHtml]) {
    assert.doesNotMatch(source, /热门岗位搜索/)
    assert.doesNotMatch(source, /class="hot-tags"/)
  }
})

test('job portrait overview uses one flat KPI row with search below', () => {
  const vuePortraitBlock = appVue.slice(
    appVue.indexOf("currentJobResearchTab === 'portrait'"),
    appVue.indexOf("currentJobResearchTab === 'demand'")
  )
  const staticPortraitBlock = staticHtml.slice(
    staticHtml.indexOf("const portraitBody = () =>"),
    staticHtml.indexOf("const demandHtml = () =>")
  )

  for (const source of [vuePortraitBlock, staticPortraitBlock]) {
    assert.match(source, /portrait-overview-row/)
    assert.match(source, /portrait-kpi-grid/)
    assert.match(source, /portrait-search-row/)
    assert.match(source, />搜索</)
    assert.doesNotMatch(source, /portrait-search-panel/)
    assert.doesNotMatch(source, /岗位搜索引擎/)
  }

  assert.match(appVue, /const PORTRAIT_KPIS = computed/)
  assert.match(staticHtml, /const staticPortraitKpis = \(\) =>/)
  for (const label of ['岗位', '典型工作任务', '能力项', '证书']) {
    assert.match(appVue, new RegExp(label))
    assert.match(staticPortraitBlock, new RegExp(label))
  }
  for (const selector of ['.portrait-overview-row', '.portrait-kpi-grid', '.portrait-search-row']) {
    assert.match(stylesCss, new RegExp(selector.replace('.', '\\.')))
  }
  assert.match(stylesCss, /\.portrait-overview-row\s*\{[\s\S]*grid-template-columns:\s*1fr;/)
  assert.match(stylesCss, /\.portrait-kpi-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
})

test('job portrait search input filters the list results', () => {
  const vuePortraitBlock = appVue.slice(
    appVue.indexOf("currentJobResearchTab === 'portrait'"),
    appVue.indexOf("currentJobResearchTab === 'demand'")
  )
  const staticPortraitBlock = staticHtml.slice(
    staticHtml.indexOf("const portraitBody = () =>"),
    staticHtml.indexOf("const demandHtml = () =>")
  )

  assert.match(appVue, /const portraitSearchInput = ref\(''\)/)
  assert.match(appVue, /const appliedPortraitSearchText = ref/)
  assert.match(appVue, /const filteredPortraitJobs = computed/)
  assert.match(appVue, /const searchPortraitJobs = \(\) =>/)
  assert.match(vuePortraitBlock, /v-model="portraitSearchInput"/)
  assert.match(vuePortraitBlock, /placeholder="输入岗位名称、技能关键词或产业链环节"/)
  assert.match(vuePortraitBlock, /@keyup\.enter="searchPortraitJobs"/)
  assert.match(vuePortraitBlock, /@click="searchPortraitJobs"/)
  assert.match(vuePortraitBlock, /v-for="job in paginatedPortraitJobs"/)
  assert.match(appVue, /filteredPortraitJobs\.value\.slice/)
  assert.match(vuePortraitBlock, /filteredPortraitJobs\.length/)
  assert.match(vuePortraitBlock, /portrait-empty-result/)
  assert.doesNotMatch(vuePortraitBlock, /readonly/)

  assert.match(staticHtml, /let staticPortraitSearchInput = ''/)
  assert.match(staticHtml, /let staticAppliedPortraitSearchText =/)
  assert.match(staticHtml, /const getStaticFilteredPortraitProfiles = \(\) =>/)
  assert.match(staticPortraitBlock, /data-static-portrait-search-input/)
  assert.match(staticPortraitBlock, /placeholder="输入岗位名称、技能关键词或产业链环节"/)
  assert.match(staticPortraitBlock, /data-static-portrait-search-button/)
  assert.match(staticPortraitBlock, /getStaticFilteredPortraitProfiles\(\)\.length/)
  assert.match(staticPortraitBlock, /portrait-empty-result/)
  assert.match(staticHtml, /data-static-portrait-search-button/)
  assert.match(staticHtml, /staticAppliedPortraitSearchText = staticPortraitSearchInput\.trim\(\)/)
  assert.match(staticHtml, /key === 'Enter'/)
  assert.doesNotMatch(staticPortraitBlock, /readonly/)
})

test('job portrait level filter narrows the list results', () => {
  const vuePortraitBlock = appVue.slice(
    appVue.indexOf("currentJobResearchTab === 'portrait'"),
    appVue.indexOf("currentJobResearchTab === 'demand'")
  )
  const staticPortraitBlock = staticHtml.slice(
    staticHtml.indexOf("const portraitBody = () =>"),
    staticHtml.indexOf("const demandHtml = () =>")
  )

  assert.match(appVue, /const portraitLevelFilter = ref\('全部'\)/)
  assert.match(appVue, /const portraitLevelOptions = \['全部', '初级', '中级', '高级'\]/)
  assert.match(appVue, /portraitLevelFilter\.value === '全部' \|\| job\.level === portraitLevelFilter\.value/)
  assert.match(vuePortraitBlock, /岗位等级/)
  assert.match(vuePortraitBlock, /v-model="portraitLevelFilter"/)
  assert.match(vuePortraitBlock, /@change="applyPortraitLevelFilter"/)

  assert.match(staticHtml, /let staticPortraitLevelFilter = '全部'/)
  assert.match(staticHtml, /const staticPortraitLevelOptions = \['全部', '初级', '中级', '高级'\]/)
  assert.match(staticHtml, /staticPortraitLevelFilter === '全部' \|\| job\.level === staticPortraitLevelFilter/)
  assert.match(staticPortraitBlock, /岗位等级/)
  assert.match(staticPortraitBlock, /data-static-portrait-level-filter/)
})

test('job portrait search matches visible job content instead of hidden associations', () => {
  const vueFilterBlock = appVue.slice(
    appVue.indexOf('const filteredPortraitJobs = computed'),
    appVue.indexOf('const portraitPageCount = computed')
  )
  const staticFilterBlock = staticHtml.slice(
    staticHtml.indexOf('const getStaticFilteredPortraitProfiles = () =>'),
    staticHtml.indexOf('const getStaticPortraitPageCount = () =>')
  )

  for (const source of [vueFilterBlock, staticFilterBlock]) {
    assert.match(source, /job\.name/)
    assert.match(source, /job\.chain/)
    assert.match(source, /job\.skills/)
    assert.match(source, /tasks/)
    assert.doesNotMatch(source, /abilities/)
    assert.doesNotMatch(source, /abilityGroups/)
    assert.doesNotMatch(source, /certificates/)
    assert.doesNotMatch(source, /companies/)
    assert.doesNotMatch(source, /majors/)
  }
})

test('portrait company cards use a coordinated summary layout', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /class="portrait-company-body"/)
    assert.match(source, /class="portrait-company-tags"/)
  }
  assert.match(stylesCss, /\.portrait-company-grid button\s*\{[\s\S]*grid-template-columns:\s*40px minmax\(0,\s*1fr\)/)
  assert.match(stylesCss, /\.portrait-company-body\s*\{[\s\S]*min-width:\s*0/)
  assert.match(stylesCss, /\.portrait-company-tags\s*\{[\s\S]*display:\s*flex/)
})

test('portrait competency data enforces at least 80 abilities per job', () => {
  assert.match(jobCenterMock, /export const MIN_JOB_ABILITY_COUNT = 80/)
  assert.match(jobCenterMock, /expandStandardJobAbilities/)
  assert.match(jobCenterMock, /abilityCount: Math\.max\(MIN_JOB_ABILITY_COUNT/)
  assert.match(jobCenterMock, /linkStandardAbilitiesToTasks\(baseTasks, expandedAbilities\)/)
  assert.match(appSource, /PORTRAIT_JOB_PROFILES\.some\(\(job\) => job\.id === jobId\)/)
  assert.match(staticHtml, /const staticMinPortraitAbilityCount = 80/)
  assert.match(staticHtml, /normalizeStaticPortraitAbilities/)
})

test('portrait competency map links every ability to at least one task', () => {
  assert.match(appSource, /const distributePortraitAbilitiesAcrossTasks/)
  assert.match(appSource, /coveredAbilityNames/)
  assert.match(appSource, /allAbilityNames\.forEach/)
  assert.match(appSource, /taskAbilityMap\[taskName\]\.push\(abilityName\)/)
  assert.doesNotMatch(appSource, /knowledge\[\(index \+ 2\) % knowledge\.length\]/)
  assert.match(staticHtml, /const distributeStaticPortraitAbilitiesAcrossTasks/)
  assert.match(staticHtml, /coveredAbilityNames/)
  assert.match(staticHtml, /allAbilityNames\.forEach/)
  assert.match(staticHtml, /taskAbilityMap\[taskName\]\.push\(abilityName\)/)
})

test('course ability picker uses the current job center jobs and saves via delegated clicks', () => {
  assert.match(appSource, /const courseAbilitySourceJobs = computed/)
  assert.match(appSource, /jobCardsForBuild\.value/)
  assert.match(appSource, /getCourseAbilityMapForJob/)
  assert.doesNotMatch(appSource, /courseJobAbilityOptions\.filter/)

  assert.match(staticHtml, /const getStaticCourseAbilityOptions = \(\) =>/)
  assert.match(staticHtml, /getStaticBuildJobs\(\)/)
  assert.match(staticHtml, /getStaticCourseAbilityOptionById/)
  assert.match(staticHtml, /const hasStaticCourseAbilities = \(abilities = createStaticCourseAbilityMap\(\)\) =>/)
  assert.match(staticHtml, /target\.closest\('\[data-save-course-ability\]'\)/)
  assert.ok(
    staticHtml.indexOf('closeStaticCourseAbilityDialog()') <
      staticHtml.indexOf('staticCourseAbilityDialogState.nodeName = nodeName'),
    'static course ability dialog should close stale overlays before initializing draft state'
  )
  assert.doesNotMatch(staticHtml, /id: 'job-vision-inspection'/)
  assert.doesNotMatch(staticHtml, /id: 'job-ai-data-analyst'/)
})

test('job detail data links every standardized ability to a task', () => {
  for (const job of JOB_CARDS) {
    const detail = getJobDetail(job.id)
    const abilityNames = new Set(detail.abilities.map((ability) => ability.name))
    const linkedAbilityNames = new Set(detail.tasks.flatMap((task) => task.abilities))
    const missing = [...abilityNames].filter((abilityName) => !linkedAbilityNames.has(abilityName))

    assert.ok(abilityNames.size >= 80, `${job.name} should have at least 80 abilities`)
    assert.deepEqual(missing, [], `${job.name} has unlinked abilities`)
  }
})

test('results portal hides inactive panels and allows page scrolling', () => {
  assert.match(stylesCss, /\[data-results-panel\]\[hidden\]/)
  assert.match(stylesCss, /body:has\(\.results-portal-shell\)/)
  assert.match(stylesCss, /\.results-portal-shell\s*{[\s\S]*overflow: visible/)
})

test('graph links are measured from rendered node boxes and expose connector ports', () => {
  assert.match(appSource, /const updateGraphLines/)
  assert.match(appSource, /getBoundingClientRect\(\)/)
  assert.match(appSource, /graphMeasuredLinks/)
  assert.match(appSource, /resultsPortalGraphMeasuredLinks/)
  assert.match(appSource, /:viewBox="graphLineViewBox"/)
  assert.match(staticHtml, /const updateStaticGraphLines/)
  assert.match(staticHtml, /getBoundingClientRect\(\)/)
  assert.match(staticHtml, /canvas\.__graphLinks = links/)
  assert.match(stylesCss, /\.graph-entity::after/)
  assert.match(stylesCss, /\.graph-entity::before/)
})

test('course model background orbit is centered on the root knowledge node', () => {
  assert.match(staticHtml, /\['概率论与\\n数理统计',\s*50,\s*52,\s*'root'/)
  assert.match(staticHtml, /class="course-orbit-bg"/)
  assert.match(stylesCss, /\.course-orbit-bg\s*\{[\s\S]*left:\s*50%/)
  assert.match(stylesCss, /\.course-orbit-bg\s*\{[\s\S]*top:\s*52%/)
  assert.match(stylesCss, /\.course-orbit-bg\s*\{[\s\S]*transform:\s*translate\(-50%,\s*-50%\)/)
})

test('course model graph lines use the same coordinate plane as knowledge nodes', () => {
  const lineStyleMatch = stylesCss.match(/\.course-graph-lines\s*\{(?<body>[^}]*)\}/)
  assert.ok(lineStyleMatch?.groups?.body)
  const lineStyle = lineStyleMatch.groups.body

  assert.match(staticHtml, /<svg class="course-graph-lines" viewBox="0 0 100 100"/)
  assert.match(staticHtml, /<path d="M50 52 C47 42, 45 34, 45 29"/)
  assert.match(lineStyle, /inset:\s*0/)
  assert.match(lineStyle, /width:\s*100%/)
  assert.match(lineStyle, /height:\s*100%/)
})

test('graph hover highlights only explicit measured graph link paths', () => {
  assert.match(appSource, /const activeGraphLinkKeys/)
  assert.match(appSource, /activeGraphLinkKeys\.has\(link\.key\)/)
  assert.match(staticHtml, /activeLinkKeys/)
  assert.match(staticHtml, /link\.dataset\.linkKey/)
})

test('results portal standalone industry graph binds hover highlight state', () => {
  const standaloneGraphMatch = staticHtml.match(/const renderStandaloneIndustryGraph = \([\s\S]*?const renderResultsGraph/)
  assert.ok(standaloneGraphMatch, 'expected standalone results graph renderer')
  const standaloneHoverMatch = staticHtml.match(/const bindStandaloneGraphHover = \([\s\S]*?const updateStandaloneAbilityLines/)
  assert.ok(standaloneHoverMatch, 'expected standalone graph hover binder')

  const standaloneGraph = standaloneGraphMatch[0]
  const standaloneHover = standaloneHoverMatch[0]
  assert.match(standaloneGraph, /keys:\s*\[/)
  assert.match(standaloneGraph, /bindStandaloneGraphHover\(canvas, links\)/)
  assert.match(staticHtml, /data-link-keys/)
  assert.match(standaloneHover, /activeLinkKeys/)
  assert.match(standaloneHover, /classList\.toggle\('active'/)
  assert.match(standaloneHover, /classList\.remove\('active', 'dimmed'\)/)
})

test('industry graph clusters job nodes by job groups in Vue and static entries', () => {
  assert.match(appSource, /jobGroups/)
  assert.match(appSource, /graph-job-groups/)
  assert.match(appSource, /graph-job-group/)
  assert.match(appSource, /graph-group-job/)
  assert.match(staticHtml, /graph-job-groups/)
  assert.match(staticHtml, /graph-job-group/)
  assert.match(staticHtml, /graph-group-job/)
  assert.match(staticHtml, /groupName/)
  assert.match(stylesCss, /\.graph-job-group/)
  assert.match(stylesCss, /\.graph-job-group-title/)
  assert.match(stylesCss, /\.graph-group-job/)
})

test('standalone results portal spaces job group containers with a fixed vertical gap', () => {
  const standaloneGraphMatch = staticHtml.match(/const renderStandaloneIndustryGraph = \([\s\S]*?const renderResultsGraph =/)
  assert.ok(standaloneGraphMatch, 'expected standalone results portal graph renderer')
  const standaloneGraph = standaloneGraphMatch[0]

  assert.match(standaloneGraph, /standaloneGroupGapPx = 64/)
  assert.match(standaloneGraph, /standaloneGroupTopPaddingPx/)
  assert.match(standaloneGraph, /effectiveCanvasHeight/)
  assert.match(standaloneGraph, /canvas\.style\.height = `\$\{effectiveCanvasHeight\}px`/)
  assert.doesNotMatch(standaloneGraph, /const top = 8 \+ index \* 16/)
})

test('job group containers expose an in-panel header and restrained palette accents', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /graph-job-group-header/)
    assert.match(source, /group-accent-/)
  }
  assert.match(stylesCss, /\.graph-job-group-header/)
  assert.match(stylesCss, /var\(--group-accent\)/)
  assert.match(stylesCss, /var\(--group-accent-soft\)/)
  assert.doesNotMatch(stylesCss, /\.graph-job-group-chip/)
  assert.match(stylesCss, /\.graph-job-group-jobs\s*{[\s\S]*justify-content:\s*flex-start/)
  assert.match(stylesCss, /\.graph-group-job\s*{[\s\S]*align-self:\s*center/)
  assert.match(stylesCss, /\.graph-job-group \.graph-group-job\s*{[\s\S]*position:\s*relative/)
  assert.match(stylesCss, /\.graph-job-group \.graph-group-job\.active:not\(\.graph-entity-span\)\s*{[\s\S]*transform:\s*none/)
})

test('job graph metric row reads as lightweight summary text instead of cards', () => {
  const headingItemBlock = stylesCss.match(/\n\.graph-headings div\s*\{([\s\S]*?)\n\}/)
  assert.ok(headingItemBlock, 'expected main job graph heading item style block')

  assert.match(headingItemBlock[1], /min-height:\s*auto/)
  assert.match(headingItemBlock[1], /padding:\s*0/)
  assert.match(headingItemBlock[1], /border-radius:\s*0/)
  assert.match(headingItemBlock[1], /background:\s*transparent/)
  assert.match(headingItemBlock[1], /box-shadow:\s*none/)
})

test('industry graph starts content close to the top of the canvas', () => {
  assert.match(graphLayoutUtil, /topForIndex\(index, list\.length, 4, 88\)/)
  assert.match(graphLayoutUtil, /topForIndex\(index, list\.length, 3, 90\)/)
  assert.match(graphLayoutUtil, /topForIndex\(index, list\.length, 2, 94\)/)
  assert.match(graphLayoutUtil, /const groupStartPx = effectiveCanvasHeight \* 0\.02/)
  assert.match(graphLayoutUtil, /const groupAvailablePx = effectiveCanvasHeight \* 0\.94/)
  assert.match(staticHtml, /topForIndex\(index, list\.length, 4, 88\)/)
  assert.match(staticHtml, /topForIndex\(index, list\.length, 3, 90\)/)
  assert.match(staticHtml, /topForIndex\(index, list\.length, 2, 94\)/)
  assert.match(staticHtml, /const groupStartPx = effectiveCanvasHeight \* 0\.02/)
  assert.match(staticHtml, /const groupAvailablePx = effectiveCanvasHeight \* 0\.94/)
})

test('industry graph metric row aligns to the four graph columns', () => {
  for (const label of ['产业链', '产业节点', '岗位群 / 岗位', '课程']) {
    assert.match(appSource, new RegExp(`<span>${label}</span>`))
  }

  assert.doesNotMatch(appSource, /graph-column-headings/)
  assert.doesNotMatch(staticHtml, /graph-column-headings/)

  const headingBlock = stylesCss.match(/\n\.graph-headings\s*\{([\s\S]*?)\n\}/)
  assert.ok(headingBlock, 'expected graph heading row styles')
  assert.match(headingBlock[1], /display:\s*grid/)
  assert.match(headingBlock[1], /grid-template-columns:\s*20fr 21fr 29fr 14fr/)
  assert.match(headingBlock[1], /column-gap:\s*4%/)
  assert.match(headingBlock[1], /padding:\s*2px 2% 12px/)
})

test('clicking a job node opens the job ability graph inside the graph frame', () => {
  assert.match(appSource, /selectedGraphJobId/)
  assert.match(appSource, /openGraphAbility/)
  assert.match(appSource, /selectedGraphJobDetail/)
  assert.match(appSource, /graph-ability-view/)
  assert.doesNotMatch(appSource, /data-graph-map-task-index/)
  assert.match(appSource, /data-graph-map-ability/)
})

test('static graph job nodes open an inline ability graph with a back action', () => {
  assert.match(staticHtml, /data-graph-job/)
  assert.match(staticHtml, /renderStaticGraphAbility/)
  assert.doesNotMatch(staticHtml, /selectStaticGraphAbilityTask/)
  assert.match(staticHtml, /data-back-static-graph/)
  assert.match(staticHtml, /graph-ability-view/)
  assert.match(staticHtml, /data-graph-map-ability/)
})

test('job ability graph uses industry information and direct ability headings', () => {
  const appGraphAbility = sourceSlice(
    appVue,
    '<div class="graph-ability-view graph-ability-matrix">',
    '<div v-else :key="graphModeKey" class="graph-mode-panel">'
  )
  const staticGraphAbility = sourceSlice(
    staticHtml,
    "const renderStaticGraphAbility =",
    'const updateStaticPortraitCompetencyLines ='
  )
  assert.match(appSource, /selectedGraphIndustry/)
  assert.match(appSource, /selectedGraphChain/)
  for (const label of ['产业信息', '岗位能力点']) {
    assert.match(appGraphAbility, new RegExp(label))
    assert.match(staticGraphAbility, new RegExp(label))
  }
  for (const label of ['典型工作任务', '任务详览', '关联能力项']) {
    assert.doesNotMatch(appGraphAbility, new RegExp(`<span>${label}</span>`))
    assert.doesNotMatch(staticGraphAbility, new RegExp(`<span>${label}</span>`))
  }
  assert.match(staticHtml, /selectedStaticGraphIndustry/)
  assert.match(staticHtml, /graph-ability-industry-node/)
})

test('job ability graph presents abilities as a readable direct matrix', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /graph-ability-matrix/)
    assert.match(source, /graph-ability-matrix-board/)
    assert.match(source, /graph-ability-matrix-cell/)
    assert.match(source, /data-graph-ability-category/)
    assert.doesNotMatch(source, /graph-ability-task-rail/)
    assert.doesNotMatch(source, /data-graph-map-task-index/)
    assert.doesNotMatch(source, /graph-ability-detail-panel/)
    assert.doesNotMatch(source, /data-graph-task-detail/)
  }
  for (const label of ['岗位能力点']) {
    assert.match(appSource, new RegExp(label))
    assert.match(staticHtml, new RegExp(label))
  }
  assert.match(stylesCss, /\.graph-ability-matrix-board[\s\S]*overflow-x:\s*auto/)
  assert.doesNotMatch(stylesCss, /\.graph-ability-task-rail/)
  assert.doesNotMatch(stylesCss, /\.graph-ability-detail-panel/)
})

test('results portal static entry wires direct ability graph and back button clicks', () => {
  const portalStart = staticHtml.indexOf("if (staticPageView === 'results-portal')")
  const portalEnd = staticHtml.indexOf('renderHome()', portalStart)
  assert.ok(portalStart > -1)
  assert.ok(portalEnd > portalStart)
  const portalEntry = staticHtml.slice(portalStart, portalEnd)
  assert.match(portalEntry, /renderStaticGraphAbility/)
  assert.doesNotMatch(portalEntry, /selectStaticGraphAbilityTask/)
  assert.match(portalEntry, /data-back-static-graph/)
  assert.match(portalEntry, /renderStaticGraph\(staticJobs/)
})

test('results portal static direct entry initializes the graph canvas after rendering html', () => {
  const portalStart = staticHtml.indexOf("if (staticPageView === 'results-portal')")
  const portalEnd = staticHtml.indexOf('renderHome()', portalStart)
  assert.ok(portalStart > -1)
  assert.ok(portalEnd > portalStart)
  const portalEntry = staticHtml.slice(portalStart, portalEnd)

  assert.match(portalEntry, /app\.innerHTML = resultsPortalHtml\(\)/)
  assert.match(portalEntry, /requestAnimationFrame\(\(\) => renderStaticGraph\(staticJobs/)
})

test('results portal standalone renderer fills the graph canvas synchronously after html reset', () => {
  const rendererStart = staticHtml.indexOf('const renderStandalonePortal =')
  const rendererEnd = staticHtml.indexOf("if (window.location.protocol === 'file:' && fileModeView === 'results-portal')", rendererStart)
  assert.ok(rendererStart > -1)
  assert.ok(rendererEnd > rendererStart)
  const renderer = staticHtml.slice(rendererStart, rendererEnd)

  assert.match(renderer, /app\.innerHTML = resultsPortalHtml\(\)/)
  assert.match(renderer, /if \(activeStaticResultsTab === '岗位中心'\) renderResultsGraph\(shouldAnimateGraphMode\)/)
  assert.doesNotMatch(renderer, /requestAnimationFrame\(\(\) => renderResultsGraph\(shouldAnimateGraphMode\)\)/)
})

test('results portal standalone ability graph helpers are initialized before file-mode early return', () => {
  const escapeStart = staticHtml.indexOf('const staticEscapeText =')
  const abilityStart = staticHtml.indexOf('const renderStandaloneGraphAbility =')
  const earlyReturnStart = staticHtml.indexOf("if (window.location.protocol === 'file:' && fileModeView === 'results-portal')")
  assert.ok(escapeStart > -1)
  assert.ok(abilityStart > -1)
  assert.ok(earlyReturnStart > -1)

  assert.ok(escapeStart < abilityStart, 'staticEscapeText must be initialized before standalone ability graph rendering can run')
  assert.ok(escapeStart < earlyReturnStart, 'file-mode results portal returns before later helper declarations are initialized')
})

test('job ability graph header puts back action on the left and quoted job title on the right', () => {
  assert.match(appSource, /selectedGraphAbilityTitle/)
  assert.match(appSource, /graph-ability-title-row/)
  assert.match(appSource, /{{ selectedGraphAbilityTitle }}/)
  assert.doesNotMatch(appSource, /selectedGraphJobId \? '岗位能力图谱' : '岗位产业图谱'/)
  assert.doesNotMatch(appSource, /\$\{selectedGraphJob\?\.name \?\? '岗位'\} - 典型工作任务 - 能力项图谱/)

  assert.match(staticHtml, /graph-ability-title-row/)
  assert.match(staticHtml, /「\$\{data\.job\?\.name \|\| '岗位'\}岗位」岗位能力图谱/)
  assert.doesNotMatch(staticHtml, /mode === 'ability' \? '岗位能力图谱' : '岗位产业图谱'/)
  assert.doesNotMatch(staticHtml, /\$\{data\.job\?\.name \|\| '岗位'\} - 典型工作任务 - 能力项图谱/)
})

test('standalone portrait competency map opens without an in-page back action', () => {
  const vueStart = appVue.indexOf('<main v-else-if="isJobCompetencyMapView"')
  const vueEnd = appVue.indexOf('<div class="competency-map-page-layout">', vueStart)
  assert.ok(vueStart > -1)
  assert.ok(vueEnd > vueStart)
  const vueHeader = appVue.slice(vueStart, vueEnd)

  const staticStart = staticHtml.indexOf('const staticPortraitCompetencyPageHtml =')
  const staticEnd = staticHtml.indexOf('<div class="competency-map-page-layout">', staticStart)
  assert.ok(staticStart > -1)
  assert.ok(staticEnd > staticStart)
  const staticHeader = staticHtml.slice(staticStart, staticEnd)

  for (const header of [vueHeader, staticHeader]) {
    assert.doesNotMatch(header, /competency-map-back-button/)
    assert.doesNotMatch(header, /‹ 返回/)
  }
  assert.doesNotMatch(staticHeader, /data-competency-back/)
})

test('job detail ability map center hides education and demand metadata', () => {
  const vueStart = appVue.indexOf('<div class="map-center">')
  const vueEnd = appVue.indexOf('<div class="ability-map-graph">', vueStart)
  assert.ok(vueStart > -1)
  assert.ok(vueEnd > vueStart)
  const vueCenter = appVue.slice(vueStart, vueEnd)

  const staticStart = staticHtml.indexOf('const staticMapSectionHtml =')
  const staticEnd = staticHtml.indexOf('const modernDetailHtml =', staticStart)
  assert.ok(staticStart > -1)
  assert.ok(staticEnd > staticStart)
  const staticMapTab = staticHtml.slice(staticStart, staticEnd)

  for (const source of [vueCenter, staticMapTab]) {
    assert.match(source, /map-center/)
    assert.match(source, /salary/)
    assert.doesNotMatch(source, /<small>/)
    assert.doesNotMatch(source, /需求量/)
  }
})

test('results portal job center shows linked job cards as a carousel before the graph', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /results-job-card-switcher/)
    assert.match(source, /results-job-card-track/)
    assert.match(source, /results-job-card-dots/)
    assert.match(source, /关联岗位卡片/)
    assert.doesNotMatch(source, /results-job-path/)
    for (const label of ['岗位群', '产业链', '关联课程']) {
      assert.match(source, new RegExp(label))
    }
    assert.doesNotMatch(source, /岗位建设路径/)
  }
  assert.match(appSource, /resultsPortalJobCards/)
  assert.match(appSource, /activeResultsPortalJobCardIndex/)
  assert.match(appSource, /showResultsPortalJobCard/)
  assert.match(staticHtml, /activeStaticResultsJobIndex/)
  assert.match(staticHtml, /data-results-job-prev/)
  assert.match(staticHtml, /data-results-job-next/)
  assert.match(staticHtml, /data-results-job-dot/)
  assert.match(stylesCss, /\.results-job-card-switcher/)
})

test('static results portal carousel updates the existing track instead of rerendering the page', () => {
  const helperMatch = staticHtml.match(/const standaloneShowResultsJobCard = \(index = 0\) => \{([\s\S]*?)\n        \}/)
  assert.ok(helperMatch)

  assert.match(staticHtml, /const updateStandaloneResultsJobCarousel = \(\) => \{/)
  assert.match(helperMatch[1], /updateStandaloneResultsJobCarousel\(\)/)
  assert.doesNotMatch(helperMatch[1], /renderStandalonePortal\(\)/)
})

test('results portal job center omits the summary strip, KPI cards, path block, and duplicated graph title', () => {
  for (const source of [appSource, staticHtml]) {
    assert.doesNotMatch(source, /results-job-insights/)
    assert.doesNotMatch(source, /results-job-kpis/)
    assert.doesNotMatch(source, /results-job-path/)
    assert.doesNotMatch(source, /resultsPortalKpis/)
    assert.doesNotMatch(source, /resultsPortalInsights/)
    assert.doesNotMatch(source, /resultsPortalPath/)
    assert.doesNotMatch(source, /产业链 - 产业节点 - 岗位 - 课程图谱/)
  }
  assert.doesNotMatch(stylesCss, /\.results-job-spotlight::after/)
  assert.doesNotMatch(stylesCss, /\.results-job-insights/)
  assert.doesNotMatch(stylesCss, /\.results-job-kpis/)
  assert.doesNotMatch(stylesCss, /\.results-job-path/)
})

test('job carousel ability button scrolls to the graph frame', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /查看岗位能力图谱/)
    assert.doesNotMatch(source, /查看岗位图谱/)
    assert.match(source, /scrollIntoView\(\{\s*behavior: 'smooth',\s*block: 'start'/)
  }
  assert.match(appSource, /resultsPortalGraphRef/)
  assert.match(appSource, /openGraphAbility\(card\.id, true\)/)
  assert.match(staticHtml, /scrollStaticResultsGraphIntoView/)
})

test('results portal OpenDesign graph keeps only the compact section label outside the iframe', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /产业专业图谱/)
    assert.doesNotMatch(source, /岗位产业图谱/)
    assert.match(source, /opendesign-graph-frame/)
    assert.doesNotMatch(source, /results-portal-legacy-graph/)
  }
})

test('results portal graph offers fullscreen viewing in Vue and static entries', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /全屏/)
    assert.match(source, /data-graph-fullscreen/)
    assert.match(source, /requestFullscreen/)
    assert.match(source, /opendesign-graph-frame-shell/)
  }
  assert.match(stylesCss, /\.graph-fullscreen-button/)
  assert.match(stylesCss, /\.opendesign-graph-frame-shell:fullscreen/)
})

test('OpenDesign light mode keeps industry-only graph layers fully light', () => {
  const industryOnlyLayerBlock = openDesignStyleBlock('html[data-theme="light"] .graph-shell[data-layout="industry-only"] .industry-layer')
  assert.match(industryOnlyLayerBlock, /var\(--layer-light-a\)/)
  assert.match(industryOnlyLayerBlock, /var\(--layer-light-b\)/)
  assert.doesNotMatch(industryOnlyLayerBlock, /rgba\(10,\s*20,\s*36/)

  const industryOnlyCardBlock = openDesignStyleBlock('html[data-theme="light"] .graph-shell[data-layout="industry-only"] .industry-card')
  assert.match(industryOnlyCardBlock, /var\(--layer-light-b\)/)
  assert.doesNotMatch(industryOnlyCardBlock, /rgba\(0,\s*0,\s*0,\s*0\.16/)
})

test('job graph mode switch has animated transitions in Vue and static entries', () => {
  assert.match(appSource, /<Transition name="graph-mode"/)
  assert.match(appSource, /graphModeKey/)
  assert.match(appSource, /refreshGraphModeLines/)
  assert.match(staticHtml, /graph-mode-animate/)
  assert.match(staticHtml, /animateStaticGraphMode/)
  assert.match(staticHtml, /animateStandaloneGraphMode/)
  assert.match(staticHtml, /renderStandalonePortal\(true\)/)
  assert.match(stylesCss, /\.graph-mode-enter-active/)
  assert.match(stylesCss, /@keyframes graphModeContentIn/)
})

test('Vue manual entry opens the full talent plan demo sections', () => {
  assert.match(appSource, /talentPlanCreated/)
  assert.match(appSource, /startManualCultivateEntry/)
  assert.match(appSource, /activeTalentSection/)
  for (const label of ['培养目标', '毕业要求', '课程管理', '支撑矩阵', '学生管理']) {
    assert.match(appSource, new RegExp(label))
  }
  assert.match(appSource, /talent-course-table/)
  assert.match(appSource, /talent-matrix-table/)
})

test('talent plan demo is mocked from intelligent construction source materials', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /扎根辽西、服务辽宁、对接产业、面向一线/)
    assert.match(source, /智能建造工程基础理论知识和技术技能/)
    assert.match(source, /建筑信息模型（BIM）基础与应用/)
    assert.match(source, /R8/)
    assert.match(source, /B261311/)
    assert.match(source, /智能建造施工技术/)
    assert.match(source, /B261340/)
    assert.match(source, /智慧工地平台部署与管理/)
  }
  assert.match(appSource, /talentCourses\.length/)
  assert.match(staticHtml, /staticTalentCourses\.length/)
})

test('graduation requirements are grouped into fewer parent requirements with multiple indicators', () => {
  const vueGroupedBlock = appSource.match(/(?:export\s+)?const graduationRequirements = \[([\s\S]*?)\]\n(?:export\s+)?const talentCourses/)
  const staticGroupedBlock = staticHtml.match(/const staticGraduationRequirements = \[([\s\S]*?)\]\n        const staticTalentCourses/)
  assert.ok(vueGroupedBlock)
  assert.ok(staticGroupedBlock)

  for (const source of [appSource, staticHtml]) {
    assert.match(source, /价值塑造与职业素养/)
    assert.match(source, /工程基础与智能建造专业知识/)
    assert.match(source, /智慧工地管理、智能检测与创新发展/)
    assert.match(source, /0, 2, 3, 7, 8/)
    assert.match(source, /20, 21, 22/)
    assert.match(source, /26, 27, 29/)
  }

  for (const block of [vueGroupedBlock[1], staticGroupedBlock[1]]) {
    assert.match(block, /code: 'R8'/)
    assert.doesNotMatch(block, /code: 'R9'/)
    assert.doesNotMatch(block, /code: 'R30'/)
  }
})

test('talent plan content panes provide internal scrolling for long source-derived content', () => {
  const canvasCardBlock = stylesCss.match(/\.canvas-card\s*{([^}]*)}/)
  const talentPlanBlock = stylesCss.match(/\.talent-plan-page\s*{([^}]*)}/)
  const talentPanelHeadBlock = stylesCss.match(/\.talent-panel-head\s*{([^}]*)}/)

  assert.ok(canvasCardBlock)
  assert.ok(talentPlanBlock)
  assert.ok(talentPanelHeadBlock)
  assert.match(canvasCardBlock[1], /min-height:\s*0/)
  assert.match(canvasCardBlock[1], /overflow:\s*hidden/)
  assert.match(talentPlanBlock[1], /height:\s*100%/)
  assert.match(talentPlanBlock[1], /overflow-y:\s*auto/)
  assert.match(talentPanelHeadBlock[1], /position:\s*sticky/)
  assert.match(talentPanelHeadBlock[1], /top:\s*0/)
})

test('talent goal text cells keep balanced inner spacing', () => {
  const goalTextBlock = styleBlock('.goal-row span')

  assert.match(goalTextBlock, /box-sizing:\s*border-box;/)
  assert.match(goalTextBlock, /padding:\s*11px 22px;/)
  assert.match(goalTextBlock, /line-height:\s*1\.55;/)
})

test('talent support matrix maps grouped graduation requirements to all training goals', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /const (?:matrixGoals|staticMatrixGoals) = \[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11\]/)
    assert.match(source, /毕业要求 R8/)
    assert.match(source, /智慧工地管理、智能检测与创新发展/)
    assert.match(source, /目标(?:\{\{ goal \}\}|\$\{goal\})/)
    assert.match(source, /智能建造施工工艺优化/)
    assert.match(source, /面向房屋建筑业、土木工程建筑业/)
    assert.doesNotMatch(source, /v-for="goal in 6"/)
    assert.doesNotMatch(source, /\[1,2,3,4,5,6\]\.map/)
  }
})

test('static index manual entry opens the full talent plan demo sections', () => {
  assert.match(staticHtml, /talentPlanDemoHtml/)
  assert.match(staticHtml, /data-manual-cultivate-entry/)
  assert.match(staticHtml, /data-talent-section/)
  for (const label of ['培养目标', '毕业要求', '课程管理', '支撑矩阵', '学生管理']) {
    assert.match(staticHtml, new RegExp(label))
  }
  assert.match(staticHtml, /talent-course-table/)
  assert.match(staticHtml, /talent-matrix-table/)
})

test('talent sidebar mirrors the industry model grouping in Vue and static entries', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /talent-module-menu talent-figma-menu/)
    assert.match(source, /talent-menu-group/)
    assert.match(source, /talent-menu-heading/)
    assert.match(source, /talent-sub-menu/)
    assert.match(source, /talent-menu-button/)
    assert.match(source, /方案建设/)
    assert.match(source, /方案调研/)
    assert.match(source, /方案比对/)
    assert.match(source, /aria-current/)
  }

  for (const label of [
    '培养目标',
    '毕业要求',
    '课程管理',
    '支撑矩阵',
    '学生管理',
    '人才培养方案调研',
    '人才培养方案比对',
  ]) {
    assert.match(appSource, new RegExp(label))
    assert.match(staticHtml, new RegExp(label))
  }

  assert.match(appConfig, /groupLabel: '方案调研'/)
  assert.match(appConfig, /groupLabel: '方案比对'/)
  assert.match(appConfig, /iconClass: 'talent-research-icon'/)
  assert.match(appConfig, /iconClass: 'talent-compare-icon'/)
  assert.match(appSource, /activeTalentSubsystem/)
  assert.match(appSource, /openTalentSubsystem/)
  assert.match(staticHtml, /data-talent-section/)
  assert.match(staticHtml, /data-talent-subsystem/)
})

test('talent selected menu text meets WCAG AA across the full active gradient', () => {
  const selectedStyles = styleBlock('.talent-menu-button.selected')
  const foregroundMatch = selectedStyles.match(/color:\s*(#[0-9a-f]{6})/i)
  const gradientMatch = selectedStyles.match(
    /linear-gradient\(90deg,\s*(#[0-9a-f]{6})\s+0%,\s*(#[0-9a-f]{6})\s+100%\)/i
  )

  assert.ok(foregroundMatch, 'selected talent menu should declare a hex text color')
  assert.ok(gradientMatch, 'selected talent menu should declare two hex gradient endpoints')

  const minimumContrast = minimumGradientContrast(
    parseHexColor(foregroundMatch[1]),
    parseHexColor(gradientMatch[1]),
    parseHexColor(gradientMatch[2])
  )
  assert.ok(
    minimumContrast >= 4.5,
    `selected 13px talent menu text contrast must be at least 4.5:1, received ${minimumContrast.toFixed(4)}:1`
  )
})

test('talent focus outline keeps 3:1 contrast across the pale sidebar gradient', () => {
  const sidebarStyles = styleBlock('.section-menu.talent-module-menu.talent-figma-menu')
  const focusStyles = styleBlock('.talent-version-select:focus-visible,\n.talent-menu-button:focus-visible')
  const panelMatch = stylesCss.match(/--web-panel:\s*(#[0-9a-f]{6})/i)
  const outlineMatch = focusStyles.match(/outline:\s*2px solid\s+([^;]+);/i)
  const sidebarStops = Array.from(sidebarStyles.matchAll(
    /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/gi
  ))

  assert.ok(panelMatch, 'web panel token should be available for alpha compositing')
  assert.ok(outlineMatch, 'talent controls should declare a two-pixel focus outline')
  assert.equal(sidebarStops.length, 3, 'talent sidebar should keep three pale gradient stops')

  const panel = parseHexColor(panelMatch[1])
  const outline = parseCssColor(outlineMatch[1])
  const ratios = sidebarStops.map((stop) => {
    const stopColor = stop.slice(1, 4).map(Number)
    const background = compositeRgb(stopColor, Number(stop[4]), panel)
    const renderedOutline = compositeRgb(outline.rgb, outline.alpha, background)
    return contrastRatio(renderedOutline, background)
  })
  const minimumContrast = Math.min(...ratios)

  assert.ok(
    minimumContrast >= 3,
    `talent focus outline contrast must be at least 3:1, received ${minimumContrast.toFixed(4)}:1`
  )
})

test('static file talent sidebar runtime transitions keep one current page and active group', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  let changeHandler = null
  let keydownHandler = null
  let activeElement = null
  let deferAnimationFrames = false
  const animationFrames = []
  const storage = {}
  const requestFrame = (callback) => {
    if (typeof callback !== 'function') return 0
    if (deferAnimationFrames) animationFrames.push(callback)
    else callback()
    return animationFrames.length
  }
  const flushAnimationFrames = () => {
    while (animationFrames.length > 0) {
      const callbacks = animationFrames.splice(0)
      callbacks.forEach((callback) => callback())
    }
  }
  const createFocusTarget = (name, ownerBackdrop = null) => {
    const target = new FakeElement()
    target.name = name
    target.ownerBackdrop = ownerBackdrop
    target.isConnected = ownerBackdrop ? ownerBackdrop.isConnected : true
    target.hidden = false
    target.dataset = {}
    target.focus = () => {
      if (target.isConnected !== false) activeElement = target
    }
    target.getAttribute = () => null
    target.hasAttribute = () => false
    target.setAttribute = () => {}
    target.querySelectorAll = () => []
    target.contains = (candidate) => candidate === target
    target.closest = (selector) => selector === '.dialog-backdrop' ? ownerBackdrop : null
    return target
  }
  const app = {
    innerHTML: '',
    lastAppended: null,
    querySelector() { return null },
    querySelectorAll() { return [] },
    appendChild(node) {
      this.lastAppended = node
      node.isConnected = true
      node.currentDialogNodes?.forEach((child) => { child.isConnected = true })
    },
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler
      if (type === 'change') changeHandler = handler
      if (type === 'keydown') keydownHandler = handler
    },
  }
  const documentStub = {
    get activeElement() { return activeElement },
    body: {
      classList: { add() {}, remove() {} },
      appendChild() {},
    },
    querySelector(selector) { return selector === '#app' ? app : null },
    addEventListener() {},
    removeEventListener() {},
    createElement() {
      const element = new FakeElement()
      let innerHTML = ''
      element.className = ''
      element.dataset = {}
      element.hidden = false
      element.isConnected = false
      element.style = {}
      element.fileInputClickCount = 0
      element.currentDialogNodes = []
      element.appendChild = () => {}
      element.setAttribute = () => {}
      element.addEventListener = () => {}
      element.getAttribute = () => null
      element.hasAttribute = () => false
      element.contains = (candidate) => candidate === element
        || Boolean(candidate?.isConnected && candidate.ownerBackdrop === element)
      element.closest = (selector) => selector === '.dialog-backdrop' ? element : null
      element.classList = {
        contains(token) { return element.className.split(/\s+/).includes(token) }
      }
      element.createOwnedFocusTarget = (name) => {
        const target = createFocusTarget(name, element)
        element.currentDialogNodes.push(target)
        return target
      }
      const rebuildDialogNodes = () => {
        element.currentDialogNodes.forEach((child) => { child.isConnected = false })
        element.currentDialogNodes = []
        const dialogPanel = element.createOwnedFocusTarget('dialog-panel')
        dialogPanel.contains = (candidate) => candidate === dialogPanel
          || Boolean(candidate?.isConnected && candidate.ownerBackdrop === element)
        dialogPanel.querySelectorAll = () => element.currentDialogNodes.filter((child) =>
          child !== dialogPanel && child !== element.fileInput)
        element.dialogPanel = dialogPanel
        element.staticCloseButton = innerHTML.includes('data-close-static-dialog')
          ? element.createOwnedFocusTarget('static-close')
          : null
        element.talentCloseButton = innerHTML.includes('data-close-talent-import-dialog')
          ? element.createOwnedFocusTarget('talent-import-close')
          : null
        element.fileInput = innerHTML.includes('data-talent-import-file')
          ? element.createOwnedFocusTarget('talent-import-file')
          : null
        if (element.fileInput) {
          element.fileInput.click = () => { element.fileInputClickCount += 1 }
        }
      }
      Object.defineProperty(element, 'innerHTML', {
        get() { return innerHTML },
        set(value) {
          if (activeElement?.ownerBackdrop === element) activeElement.isConnected = false
          innerHTML = String(value)
          rebuildDialogNodes()
        }
      })
      element.querySelector = (selector) => {
        if (selector === '[role="dialog"]') return element.dialogPanel
        if (selector === '[data-close-static-dialog]') return element.staticCloseButton
        if (selector === '[data-close-talent-import-dialog]') return element.talentCloseButton
        if (selector === '[data-talent-import-file]') return element.fileInput
        return null
      }
      element.querySelectorAll = () => []
      element.remove = () => {
        if (activeElement?.ownerBackdrop === element) activeElement.isConnected = false
        element.isConnected = false
        element.currentDialogNodes.forEach((child) => { child.isConnected = false })
        if (app.lastAppended === element) app.lastAppended = null
      }
      return element
    },
  }
  const localStorageStub = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = String(value) },
    removeItem: (key) => { delete storage[key] },
  }
  const url = new URL('file:///Users/liuhongzhe/Documents/major-construction-platform/index.html')
  const sandbox = {
    console,
    Element: FakeElement,
    HTMLElement: FakeElement,
    window: {
      location: { protocol: 'file:', href: url.toString(), search: url.search, pathname: url.pathname },
      addEventListener() {},
      removeEventListener() {},
      requestAnimationFrame: requestFrame,
      open() { return { opener: null } },
      scrollTo() {},
      localStorage: localStorageStub,
    },
    localStorage: localStorageStub,
    document: documentStub,
    URL,
    URLSearchParams,
    requestAnimationFrame: requestFrame,
    setTimeout,
    clearTimeout,
    Map,
    Set,
    Math,
  }

  vm.createContext(sandbox)
  vm.runInContext(`(() => {${scriptMatch[1]}})()`, sandbox, { timeout: 5000 })
  deferAnimationFrames = true
  assert.equal(typeof clickHandler, 'function', 'static bootstrap should register delegated clicks')

  const dispatchClick = (target) => {
    let defaultPrevented = false
    clickHandler({ target, preventDefault() { defaultPrevented = true } })
    flushAnimationFrames()
    return { defaultPrevented, target }
  }
  const click = (selector, dataset = {}, { backdrop = null } = {}) => {
    const target = createFocusTarget(selector, backdrop)
    target.dataset = dataset
    target.classList = { contains() { return false } }
    target.matches = () => false
    target.closest = (candidate) => {
      if (candidate === selector) return target
      if (candidate === '.dialog-backdrop') return backdrop
      return null
    }
    target.focus()
    return dispatchClick(target)
  }
  const keydown = (selector, dataset = {}, key = 'Enter') => {
    const target = new FakeElement()
    target.dataset = dataset
    target.matches = (candidate) => candidate === selector
    target.closest = (candidate) => {
      if (candidate === selector) return target
      if (candidate === '.dialog-backdrop') return app.lastAppended
      return null
    }
    let defaultPrevented = false
    keydownHandler({ target, key, preventDefault() { defaultPrevented = true } })
    flushAnimationFrames()
    return { defaultPrevented }
  }
  const change = (selector, files = []) => {
    const target = new FakeElement()
    target.files = files
    target.matches = (candidate) => candidate === selector
    changeHandler({ target })
    flushAnimationFrames()
  }
  const focusInsideDialog = (name) => {
    const target = app.lastAppended.createOwnedFocusTarget(name)
    target.focus()
    return target
  }
  const assertTalentState = (label, groupLabel) => {
    assert.equal((app.innerHTML.match(/aria-current="page"/g) || []).length, 1)
    const currentButton = app.innerHTML.match(
      /<button\s+[^>]*class="talent-menu-button selected"[^>]*aria-current="page"[^>]*>([^<]+)<\/button>/
    )
    assert.ok(currentButton, `expected ${label} to be the rendered current talent button`)
    assert.equal(currentButton[1].trim(), label)

    const activeGroups = Array.from(app.innerHTML.matchAll(
      /<section class="talent-menu-group([^"]*)">([\s\S]*?)<\/section>/g
    )).filter((group) => group[1].trim().split(/\s+/).includes('active'))
    assert.equal(activeGroups.length, 1, `expected one active talent group for ${label}`)
    assert.match(activeGroups[0][2], new RegExp(`<strong>${groupLabel}</strong>`))
  }

  click('[data-module="talent"]')
  for (const label of ['培养目标', '毕业要求', '课程管理', '支撑矩阵', '学生管理']) {
    click('[data-talent-section]', { talentSection: label })
    assertTalentState(label, '方案建设')
  }
  for (const [key, label, groupLabel] of [
    ['research', '人才培养方案调研', '方案调研'],
    ['compare', '人才培养方案比对', '方案比对'],
  ]) {
    click('[data-talent-subsystem]', { talentSubsystem: key })
    assertTalentState(label, groupLabel)
  }

  click('[data-manual-cultivate-entry]')
  assert.match(app.innerHTML, /培养目标概述/)

  click('[data-reset-talent-plan]')
  assert.match(app.innerHTML, /创建培养目标/)
  assert.match(app.innerHTML, /data-reset-talent-plan[^>]*disabled/)

  for (const [label, expected] of [
    ['培养目标', /创建培养目标/],
    ['毕业要求', /创建毕业要求/],
    ['课程管理', /全部教务课程\(0\)[\s\S]*暂无数据/],
    ['支撑矩阵', /请添加培养目标和毕业要求[\s\S]*然后设置支撑体系/],
    ['学生管理', /2026级全部学生\(0\)[\s\S]*暂无数据/],
  ]) {
    click('[data-talent-section]', { talentSection: label })
    assert.match(app.innerHTML, expected)
  }

  click('[data-talent-section]', { talentSection: '培养目标' })
  const directImportOpen = click('[data-open-talent-import]')
  const importDialog = app.lastAppended
  const initialImportFocusUsesCloseButton = activeElement === importDialog.talentCloseButton
  assert.match(app.lastAppended.innerHTML, /<h2[^>]*>智能导入<\/h2>/)
  assert.match(app.lastAppended.innerHTML, /智能导入的培养方案内容将替换已填写内容/)
  assert.match(app.lastAppended.innerHTML, /开始解析[^<]*<\/button>/)
  const uploadDialogHtml = app.lastAppended.innerHTML
  const uploadByEnter = keydown('[data-talent-import-drop]', {}, 'Enter')
  const uploadBySpace = keydown('[data-talent-import-drop]', {}, ' ')
  const uploadFileInputClickCount = app.lastAppended.fileInputClickCount

  focusInsideDialog('before-file-selection')
  change('[data-talent-import-file]', [{ name: '智能建造工程人才培养方案.pdf' }])
  const fileSelectionRefocusedClose = activeElement === importDialog.talentCloseButton
  click('[data-start-talent-parse]', {}, { backdrop: importDialog })
  const parseRefocusedClose = activeElement === importDialog.talentCloseButton
  assert.match(app.lastAppended.innerHTML, /解析成功！请选择需要导入的模块/)
  assert.match(app.lastAppended.innerHTML, /扎根辽西、服务辽宁/)
  assert.doesNotMatch(app.lastAppended.innerHTML, /新能源汽车工程技术/)
  const reviewDialogHtml = app.lastAppended.innerHTML

  const selectedBeforeLabelSwitch = (app.lastAppended.innerHTML.match(/ checked/g) || []).length
  const labelSwitch = click(
    '[data-talent-import-preview-label]',
    { talentImportPreviewLabel: 'requirements' },
    { backdrop: importDialog }
  )
  const previewSwitchRefocusedClose = activeElement === importDialog.talentCloseButton
  const requirementsPreviewAria = app.lastAppended.innerHTML
  assert.equal(labelSwitch.defaultPrevented, true)
  assert.match(app.lastAppended.innerHTML, /毕业要求概述/)
  assert.equal((app.lastAppended.innerHTML.match(/ checked/g) || []).length, selectedBeforeLabelSwitch)

  click(
    '[data-toggle-talent-import-module]',
    { toggleTalentImportModule: 'requirements' },
    { backdrop: importDialog }
  )
  const checkboxSwitchRefocusedClose = activeElement === importDialog.talentCloseButton
  assert.equal((app.lastAppended.innerHTML.match(/ checked/g) || []).length, selectedBeforeLabelSwitch - 1)
  click(
    '[data-toggle-talent-import-module]',
    { toggleTalentImportModule: 'requirements' },
    { backdrop: importDialog }
  )
  assert.equal((app.lastAppended.innerHTML.match(/ checked/g) || []).length, selectedBeforeLabelSwitch)

  click(
    '[data-talent-import-preview-label]',
    { talentImportPreviewLabel: 'courses' },
    { backdrop: importDialog }
  )
  assert.match(app.lastAppended.innerHTML, /共74门课程/)
  assert.equal((app.lastAppended.innerHTML.match(/ checked/g) || []).length, selectedBeforeLabelSwitch)

  click('[data-reparse-talent-import]', {}, { backdrop: importDialog })
  const reparseRefocusedClose = activeElement === importDialog.talentCloseButton
  assert.equal(app.lastAppended, importDialog)
  assert.match(app.lastAppended.innerHTML, /点击上传或拖拽文件至此/)
  assert.match(app.lastAppended.innerHTML, /AI自动解析并输出规范化培养方案/)

  change('[data-talent-import-file]', [{ name: '智能建造工程人才培养方案.pdf' }])
  click('[data-start-talent-parse]')
  click('[data-close-talent-import-dialog]', {}, { backdrop: importDialog })
  const dedicatedCloseRestoredTrigger = activeElement === directImportOpen.target
  assert.equal(app.lastAppended, null)

  const backdropImportOpen = click('[data-open-talent-import]')
  const backdropImportDialog = app.lastAppended
  dispatchClick(backdropImportDialog)
  const backdropCloseRestoredTrigger = activeElement === backdropImportOpen.target
  assert.equal(app.lastAppended, null)

  click('[data-open-talent-import]')
  change('[data-talent-import-file]', [{ name: '智能建造工程人才培养方案.pdf' }])
  click('[data-start-talent-parse]')
  click('[data-toggle-talent-import-module]', { toggleTalentImportModule: 'requirements' })
  click('[data-confirm-talent-import]')
  click('[data-talent-section]', { talentSection: '毕业要求' })
  assert.match(app.innerHTML, /创建毕业要求/)

  click('[data-reset-talent-plan]')
  click('[data-open-talent-import]')
  change('[data-talent-import-file]', [{ name: '智能建造工程人才培养方案.pdf' }])
  click('[data-start-talent-parse]')
  for (const moduleKey of ['goals', 'requirements', 'courses', 'goalRequirementMatrix']) {
    click('[data-toggle-talent-import-module]', { toggleTalentImportModule: moduleKey })
  }
  click('[data-confirm-talent-import]')
  const nonRenderableImportKeepsResetDisabled = /data-reset-talent-plan\s+disabled/.test(app.innerHTML)

  click('[data-open-talent-import]')
  const resetImportDialog = app.lastAppended
  click('[data-reset-talent-plan]')
  const resetClosedImportDialog = app.lastAppended === null
  click('[data-open-talent-import]')
  const resetReappendedImportDialog = app.lastAppended instanceof FakeElement
    && app.lastAppended !== resetImportDialog
  click('[data-close-talent-import-dialog]', {}, { backdrop: app.lastAppended })

  const chainedCultivateOpen = click(
    '[data-create-talent-target]',
    { createTalentTarget: '培养目标' }
  )
  const cultivateDialog = app.lastAppended
  click('[data-trigger-cultivate-import]', {}, { backdrop: cultivateDialog })
  const chainedImportDialog = app.lastAppended
  const chainedImportOpened = chainedImportDialog instanceof FakeElement
    && chainedImportDialog !== cultivateDialog
  click('[data-close-talent-import-dialog]', {}, { backdrop: chainedImportDialog })
  const chainedImportRestoredPersistentTrigger = activeElement === chainedCultivateOpen.target

  click('[data-open-talent-import]')
  const escapedImportDialog = app.lastAppended
  const escapeClose = keydown('[data-close-talent-import-dialog]', {}, 'Escape')
  const escapeRemovedDialog = app.lastAppended === null
  click('[data-open-talent-import]')
  const escapeReappendedDialog = app.lastAppended instanceof FakeElement
    && app.lastAppended !== escapedImportDialog

  assert.deepEqual({
    uploadDropMarker: /data-talent-import-drop(?:\s|>)/.test(uploadDialogHtml),
    uploadEnterPrevented: uploadByEnter.defaultPrevented,
    uploadSpacePrevented: uploadBySpace.defaultPrevented,
    uploadFileInputClickCount,
    previewButtonIsIndependent: /<button type="button" class="talent-import-preview-button" data-talent-import-preview-label="goals"[^>]*>[\s\S]*?<\/button><input id="talent-import-goals"/.test(reviewDialogHtml),
    moduleCardHasNoButtonRole: !/<article class="talent-import-module-card[^>]*(?:role="button"|tabindex="0"|data-talent-import-module)/.test(reviewDialogHtml),
    previewControlIsNotCheckboxLabel: !/<label[^>]*(?:for="talent-import-|data-talent-import-preview-label)/.test(reviewDialogHtml),
    previewButtonsExposeCurrentState: /data-talent-import-preview-label="goals" aria-pressed="true" aria-controls="talent-import-preview-panel"/.test(reviewDialogHtml)
      && /data-talent-import-preview-label="requirements" aria-pressed="false" aria-controls="talent-import-preview-panel"/.test(reviewDialogHtml)
      && /<section id="talent-import-preview-panel" class="talent-import-preview"/.test(reviewDialogHtml)
      && /data-talent-import-preview-label="requirements" aria-pressed="true" aria-controls="talent-import-preview-panel"/.test(requirementsPreviewAria),
    initialImportFocusUsesCloseButton,
    fileSelectionRefocusedClose,
    parseRefocusedClose,
    previewSwitchRefocusedClose,
    checkboxSwitchRefocusedClose,
    reparseRefocusedClose,
    dedicatedCloseRestoredTrigger,
    backdropCloseRestoredTrigger,
    nonRenderableImportKeepsResetDisabled,
    resetClosedImportDialog,
    resetReappendedImportDialog,
    chainedImportOpened,
    chainedImportRestoredPersistentTrigger,
    escapePrevented: escapeClose.defaultPrevented,
    escapeRemovedDialog,
    escapeReappendedDialog,
  }, {
    uploadDropMarker: true,
    uploadEnterPrevented: true,
    uploadSpacePrevented: true,
    uploadFileInputClickCount: 2,
    previewButtonIsIndependent: true,
    moduleCardHasNoButtonRole: true,
    previewControlIsNotCheckboxLabel: true,
    previewButtonsExposeCurrentState: true,
    initialImportFocusUsesCloseButton: true,
    fileSelectionRefocusedClose: true,
    parseRefocusedClose: true,
    previewSwitchRefocusedClose: true,
    checkboxSwitchRefocusedClose: true,
    reparseRefocusedClose: true,
    dedicatedCloseRestoredTrigger: true,
    backdropCloseRestoredTrigger: true,
    nonRenderableImportKeepsResetDisabled: true,
    resetClosedImportDialog: true,
    resetReappendedImportDialog: true,
    chainedImportOpened: true,
    chainedImportRestoredPersistentTrigger: true,
    escapePrevented: true,
    escapeRemovedDialog: true,
    escapeReappendedDialog: true,
  })
})

test('talent sidebar matches the industry model geometry and interaction states', () => {
  const sidebarStyles = styleBlock('.section-menu.talent-module-menu.talent-figma-menu')
  assert.match(sidebarStyles, /width:\s*176px/)
  assert.match(sidebarStyles, /flex:\s*0 0 176px/)
  assert.match(sidebarStyles, /padding:\s*31px 24px 16px/)
  assert.match(sidebarStyles, /overflow-y:\s*auto/)
  assert.match(sidebarStyles, /linear-gradient\(90deg/)

  const groupStyles = styleBlock('.talent-menu-group')
  assert.match(groupStyles, /width:\s*128px/)
  assert.match(groupStyles, /margin:\s*0 auto 20px/)

  const headingStyles = styleBlock('.talent-menu-heading')
  assert.match(headingStyles, /min-height:\s*74px/)
  assert.match(headingStyles, /flex-direction:\s*column/)

  const iconStyles = styleBlock('.talent-menu-icon')
  assert.match(iconStyles, /width:\s*34px/)
  assert.match(iconStyles, /height:\s*34px/)

  const buttonStyles = styleBlock('.talent-version-select,\n.talent-menu-button')
  assert.match(buttonStyles, /width:\s*128px/)
  assert.match(buttonStyles, /height:\s*30px/)
  assert.match(buttonStyles, /border-radius:\s*8px/)

  const menuButtonStyles = styleBlock('.talent-menu-button')
  assert.match(menuButtonStyles, /white-space:\s*nowrap/)
  assert.match(menuButtonStyles, /font-size:\s*13px/)

  const selectedStyles = styleBlock('.talent-menu-button.selected')
  assert.match(selectedStyles, /linear-gradient\(90deg, #1a66ed 0%, #8054e8 100%\)/)
  assert.match(selectedStyles, /color:\s*#ffffff/)

  assert.match(stylesCss, /\.talent-menu-button:focus-visible/)
  assert.match(stylesCss, /\.talent-menu-group\.active \.talent-menu-heading strong/)
  const reducedMotionRule = stylesCss.match(
    /@media \(prefers-reduced-motion: reduce\) \{\s*\.talent-version-select,\s*\.talent-menu-button\s*\{([^}]*)\}\s*\}/
  )
  assert.ok(reducedMotionRule, 'talent controls should own a reduced-motion media rule')
  assert.match(reducedMotionRule[1], /transition:\s*none/)
  assert.doesNotMatch(stylesCss, /\.talent-subsystem-entry\s*\{/)
})

test('talent research subsystem supports search results and PDF preview in Vue and static entry', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /researchPlanResults/)
    assert.match(source, /talent-research-search-card/)
    assert.match(source, /搜索全国优秀职业院校人培方案/)
    assert.match(source, /搜索结果/)
    assert.match(source, /pdf-preview-shell/)
    assert.match(source, /openResearchPlanPreview/)
  }
  assert.match(appSource, /filteredResearchPlanResults/)
  assert.match(staticHtml, /filterResearchPlanResults/)
  assert.doesNotMatch(appSource, /class="research-filter-row"/)
  assert.doesNotMatch(staticHtml, /class="research-filter-row"/)
  assert.doesNotMatch(appSource, /research-search-icon/)
  assert.doesNotMatch(staticHtml, /research-search-icon/)
  assert.doesNotMatch(stylesCss, /\.research-search-icon/)
  assert.match(stylesCss, /talent-research-search-card/)
  assert.match(stylesCss, /pdf-preview-page/)
})

test('talent research removes discovery copy and renders state-specific search layouts', () => {
  for (const source of [appSource, staticHtml]) {
    assert.doesNotMatch(source, /猜你想搜/)
    assert.doesNotMatch(source, /已收录 235 篇院校人才培养方案/)
  }

  assert.match(
    appSource,
    /class="talent-research-home"\s*:class="\{ 'has-results': researchHasSearched \}"/
  )
  assert.match(
    appSource,
    /class="talent-research-search-card"\s*:class="\{ compact: researchHasSearched \}"/
  )
  assert.doesNotMatch(appSource, /searchResearchSuggestion/)
  assert.match(staticHtml, /talent-research-home\$\{resultsStateClass\}/)
  assert.match(staticHtml, /talent-research-search-card\$\{searchCardStateClass\}/)
  assert.doesNotMatch(staticHtml, /data-research-suggestion/)
  assert.doesNotMatch(stylesCss, /\.research-suggestion-row/)
  assert.doesNotMatch(stylesCss, /\.research-count/)
})

test('talent research results use a compact full-width flat layout', () => {
  const searchedHomeStyles = styleBlock('.talent-research-home.has-results')
  const compactSearchStyles = styleBlock('.talent-research-search-card.compact')
  const compactMasterSearchStyles = styleBlock(
    '.talent-research-search-card.compact .research-master-search'
  )
  const resultsPanelStyles = styleBlock('.research-results-panel')

  assert.match(searchedHomeStyles, /justify-items:\s*stretch/)
  assert.match(compactSearchStyles, /width:\s*100%/)
  assert.match(compactMasterSearchStyles, /box-shadow:\s*none/)
  assert.match(resultsPanelStyles, /width:\s*100%/)
  assert.match(resultsPanelStyles, /padding:\s*0/)
  assert.match(resultsPanelStyles, /border:\s*0/)
  assert.match(resultsPanelStyles, /border-radius:\s*0/)
  assert.match(resultsPanelStyles, /background:\s*transparent/)
  assert.match(resultsPanelStyles, /box-shadow:\s*none/)
})

test('talent subsystem pages stay constrained so research results can scroll inside the canvas', () => {
  const subsystemStyles = styleBlock('.talent-subsystem-page')
  const researchStyles = styleBlock('.talent-research-page')

  assert.match(subsystemStyles, /(?:^|\n)\s*height:\s*100%/)
  assert.match(subsystemStyles, /(?:^|\n)\s*min-height:\s*0/)
  assert.match(researchStyles, /overflow:\s*auto/)
})

test('talent compare subsystem supports PDF selection, module comparison, editor and PDF export in Vue and static entry', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /compare-upload-card/)
    assert.match(source, /本地人才培养方案/)
    assert.match(source, /系统内人培/)
    assert.match(source, /主动上传PDF/)
    assert.match(source, /开始比对/)
    assert.match(source, /compare-module-card/)
    assert.match(source, /比对建议/)
    assert.match(source, /compare-editor-panel/)
    assert.match(source, /字号/)
    assert.match(source, /插入表格/)
    assert.match(source, /导出新PDF/)
  }
  assert.match(appSource, /startTalentPlanCompare/)
  assert.match(appSource, /exportComparePdf/)
  assert.match(staticHtml, /data-start-talent-compare/)
  assert.match(staticHtml, /data-export-compare-pdf/)
  assert.match(stylesCss, /compare-editor-panel/)
})

test('talent compare subsystem shows a comparing loading state and scrollable module results', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /比对中/)
    assert.match(source, /compare-loading-panel/)
  }
  assert.match(appSource, /compareLoading/)
  assert.match(staticHtml, /data-finish-talent-compare/)
  assert.match(stylesCss, /\.compare-module-results\s*\{[\s\S]*overflow-y:\s*auto/)
  assert.match(stylesCss, /\.compare-module-results\s*\{[\s\S]*max-height:/)
})

test('talent compare module cards switch the editor to the selected module draft', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /data-compare-module/)
    assert.match(source, /data-compare-editor-title/)
    assert.match(source, /培养目标修订稿/)
    assert.match(source, /毕业要求修订稿/)
    assert.match(source, /课程体系修订稿/)
  }
  assert.match(appSource, /activeCompareModuleName/)
  assert.match(appSource, /activeCompareEditorContent/)
  assert.match(appSource, /selectCompareModuleForEdit/)
  assert.match(staticHtml, /activeStaticCompareModuleName/)
  assert.match(staticHtml, /renderStaticCompareEditor/)
  assert.match(stylesCss, /\.compare-module-card\.selected/)
})

test('talent compare mock content is tailored to intelligent construction engineering', () => {
  const appCompareBlock = appSource.match(/const researchPlanResults = \[[\s\S]*?const matrixGoals/)
  const staticCompareBlock = staticHtml.match(/const researchPlanResults = \[[\s\S]*?const staticMatrixGoals/)
  assert.ok(appCompareBlock)
  assert.ok(staticCompareBlock)

  for (const source of [appCompareBlock[0], staticCompareBlock[0]]) {
    for (const label of [
      '智能建造工程专业人才培养方案',
      'BIM深化设计',
      '装配式构件深化',
      '智慧工地平台部署',
      '智能测量与三维扫描',
      '结构健康监测',
      '建筑机器人应用',
      '工程成果物'
    ]) {
      assert.match(source, new RegExp(label))
    }
    assert.doesNotMatch(source, /北京邮电大学人工智能专业/)
    assert.doesNotMatch(source, /模型部署|MLOps|数据标注|行业智能应用开发|人工智能产业链/)
  }

  for (const source of [appSource, staticHtml]) {
    assert.match(source, /2026级智能建造工程专业人才培养方案\.pdf/)
    assert.match(source, /被比对-智能建造工程专业标杆人才培养方案\.pdf/)
  }
})

test('talent compare setup guides users to import local research reports', () => {
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /导入本地文件/)
    assert.match(source, /产业调研报告/)
    assert.match(source, /专业分析报告/)
    assert.match(source, /compare-reference-import/)
    assert.match(source, /compare-reference-icon/)
    assert.match(source, /data-compare-reference-import/)
  }
  assert.match(appSource, /compareReferenceFiles/)
  assert.match(appSource, /simulateReferenceFileImport/)
  assert.match(staticHtml, /staticCompareReferenceFiles/)
  assert.match(stylesCss, /\.compare-reference-import/)
  assert.match(stylesCss, /\.compare-reference-icon/)
})
