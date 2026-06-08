import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'
import { JOB_CARDS, getJobDetail } from '../src/mock/job-center.ts'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const stylesCss = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const jobCenterMock = await readFile(new URL('../src/mock/job-center.ts', import.meta.url), 'utf8')
const jobResearchMock = await readFile(new URL('../src/mock/job-research.ts', import.meta.url), 'utf8')
const researchReportMock = await readFile(new URL('../src/mock/research-report.ts', import.meta.url), 'utf8')

class FakeElement {}

test('results menu exposes the expected actions', () => {
  for (const label of ['查看成果页', '编辑成果页', '门户设置', '复制链接']) {
    assert.match(appVue, new RegExp(label))
  }
})

test('results portal opens in a new browser tab', () => {
  assert.match(appVue, /openResultsPortal/)
  assert.match(appVue, /buildStandaloneViewUrl\('results-portal'\)/)
  assert.match(appVue, /const opened = window\.open\(urlString, '_blank'\)/)
  assert.match(appVue, /window\.location\.href = urlString/)
})

test('results portal navigation places 岗位中心 before 课程体系', () => {
  const navMatch = appVue.match(/const resultsPortalNav = \[([\s\S]*?)\]/)
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

test('static html default file view opens the job center main page instead of results portal', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  let clickHandler = null
  class DomElement {}
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
  assert.match(app.innerHTML, /岗位中心智能总结/)
  assert.match(app.innerHTML, /暂无岗位建设数据/)
  assert.match(app.innerHTML, /data-import-template-jobs/)
  assert.doesNotMatch(app.innerHTML, /<h3>产业岗位课程图谱<\/h3>/)
  assert.doesNotMatch(app.innerHTML, /graph-panel/)
  assert.doesNotMatch(app.innerHTML, /job-card/)
  assert.doesNotMatch(app.innerHTML, /results-portal-shell/)

  const importButton = new DomElement()
  importButton.closest = (selector) => {
    if (selector === '[data-import-template-jobs]') return importButton
    return null
  }
  importButton.matches = () => false
  importButton.classList = { contains() { return false } }

  assert.equal(typeof clickHandler, 'function')
  assert.doesNotThrow(() => clickHandler({ target: importButton }))
  assert.match(app.innerHTML, /产业岗位课程图谱/)
  assert.match(app.innerHTML, /BIM建模工程师/)
})

test('static html default file view can open the industry research report library from 岗位中心', () => {
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

  const reportButton = new FakeElement()
  reportButton.closest = (selector) => {
    if (selector === '[data-job-section]') {
      return { dataset: { jobSection: 'report' } }
    }
    return null
  }
  reportButton.matches = () => false

  assert.doesNotThrow(() => clickHandler({ target: reportButton }))
  assert.match(app.innerHTML, /岗位中心 \/ 产业调研报告/)
  assert.match(app.innerHTML, /报告库管理/)

  const newReportButton = new FakeElement()
  newReportButton.closest = (selector) => {
    if (selector === '[data-report-action]') {
      return { dataset: { reportAction: 'new' } }
    }
    return null
  }
  newReportButton.matches = () => false

  assert.doesNotThrow(() => clickHandler({ target: newReportButton }))
  assert.match(app.innerHTML, /报告参数/)
  assert.match(app.innerHTML, /目录结构/)
  assert.match(app.innerHTML, /AI 生成报告/)
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

  const url = new URL('file:///Users/liuhongzhe/Documents/%E4%B8%93%E4%B8%9A%E5%BB%BA%E8%AE%BE/major-construction-platform/index.html?view=job-report&reportView=library')
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
  assert.match(app.innerHTML, /岗位中心 \/ 产业调研报告/)
  assert.match(app.innerHTML, /报告库管理/)
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
  assert.match(app.innerHTML, /产业调研 \/ 产业布局/)
  assert.match(app.innerHTML, /产业链图谱/)
  assert.match(app.innerHTML, /industry-sankey-board/)
  assert.match(app.innerHTML, /industry-sankey-svg/)
  assert.match(app.innerHTML, /job-sub-menu/)
  assert.doesNotMatch(app.innerHTML, /job-subsection-list/)
})

test('static industry and job research pages retain restored rich component markers', () => {
  for (const marker of [
    'industry-sankey-board',
    'industry-sankey-svg',
    'china-heatmap',
    'province-rank-list',
    'policy-toolbar',
    'policy-timeline-item',
    'industry-enterprise-grid',
    'research-search-hero',
    'portrait-profile-card',
    'demand-kpi-grid',
    'trend-bars',
    'skill-bar-list',
    'forecast-direction-grid rich',
    'forecast-job-grid rich',
    'forecast-major-recommend',
    'job-sub-menu'
  ]) {
    assert.match(staticHtml, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  assert.doesNotMatch(staticHtml, /job-subsection-list/)
  assert.doesNotMatch(staticHtml, /job-model-deploy|AI模型部署工程师|人工智能产业链|MLOps|模型部署/)
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

  for (const marker of ['research-search-hero', 'portrait-profile-card', 'data-static-portrait-job', 'staticPortraitPaginationHtml']) {
    assert.match(portraitBlock, new RegExp(marker))
  }
  for (const marker of ['岗位需求月度趋势', '技能需求热度', '热门岗位招聘明细', 'trend-bars', 'skill-bar-list', 'research-table']) {
    assert.match(demandBlock, new RegExp(marker))
  }
  for (const marker of ['forecast-strip', '新兴技术方向', '新岗位 × 专业匹配', '人才培养方向建议', 'forecast-direction-grid', 'forecast-job-grid', 'research-table']) {
    assert.match(forecastBlock, new RegExp(marker))
  }
})

test('static job analysis deep links render the selected tab without runtime errors', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  const cases = [
    ['portrait', '岗位画像分析', 'portrait-profile-card'],
    ['demand', '招聘需求趋势', '热门岗位招聘明细'],
    ['forecast', '新岗位新技术预判', '新岗位 × 专业匹配']
  ]

  for (const [tab, title, marker] of cases) {
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
    assert.match(app.innerHTML, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.equal(typeof clickHandler, 'function')

    const demandButton = new FakeElement()
    demandButton.closest = (selector) => {
      if (selector === '[data-research-tab]') return { dataset: { researchTab: 'demand' } }
      return null
    }
    demandButton.matches = () => false
    assert.doesNotThrow(() => clickHandler({ target: demandButton }))
    assert.match(app.innerHTML, /招聘需求趋势/)
    assert.match(app.innerHTML, /热门岗位招聘明细/)
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

test('results portal job center shows KPI labels and industry graph in Vue entry', () => {
  for (const label of ['建设岗位', '典型工作任务', '岗位能力项', '关联课程', '岗课匹配度']) {
    assert.match(appVue, new RegExp(label))
  }
  for (const label of ['关联产业链', '朝阳产业', '开设趋势', '就业规模']) {
    assert.match(appVue, new RegExp(label))
  }
  assert.match(appVue, /activeResultsPortalTab === '岗位中心'/)
  assert.match(appVue, /results-portal-graph/)
  assert.match(appVue, /岗位产业图谱/)
})

test('results portal home hero uses intelligent construction copy and populated metrics', () => {
  assert.match(appVue, /resultsPortalHeroMetrics/)
  assert.match(appVue, /智能建造工程专业/)
  assert.match(appVue, /建筑业数字化转型与绿色低碳建造需求/)
  assert.doesNotMatch(appVue, /<h1>人工智能专业<\/h1>/)

  for (const label of ['专业课程', '建设岗位', '知识点', 'AI工具', '智能体', '专业资源']) {
    assert.match(appVue, new RegExp(label))
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

test('results portal job center shows KPI labels and industry graph in static entry', () => {
  for (const label of ['建设岗位', '典型工作任务', '岗位能力项', '关联课程', '岗课匹配度']) {
    assert.match(staticHtml, new RegExp(label))
  }
  for (const label of ['关联产业链', '朝阳产业', '开设趋势', '就业规模']) {
    assert.match(staticHtml, new RegExp(label))
  }
  assert.match(staticHtml, /data-results-panel="岗位中心"/)
  assert.match(staticHtml, /data-results-tab="\$\{item\}"/)
  assert.match(staticHtml, /results-portal-graph/)
  assert.match(staticHtml, /岗位产业图谱/)
})

test('job center keeps the industry research entry and industry layout tabs visible', () => {
  assert.match(appVue, /const jobSideItems = \['产业调研', '产业调研报告', '岗位建设中心'\]/)
  assert.match(appVue, /const INDUSTRY_RESEARCH_TABS/)
  assert.match(appVue, /currentJobIndustryTab/)
  assert.match(appVue, /selectJobIndustryTab/)
  for (const label of ['产业链图谱', '区域产业分析', '产业政策库', '产业企业库', '产业布局', '岗位分析']) {
    assert.match(appVue, new RegExp(label))
  }

  assert.match(staticHtml, /data-job-section="research">产业调研<\/button>/)
  assert.match(staticHtml, /产业调研 \/ 产业布局/)
  assert.match(staticHtml, /产业调研 \/ 岗位分析/)
})

test('industry research policy and company data matches intelligent construction', () => {
  const appResearchStart = appVue.indexOf('const industryChainInsights = [')
  const appResearchEnd = appVue.indexOf('type EngineSectionKey', appResearchStart)
  assert.ok(appResearchStart > -1)
  assert.ok(appResearchEnd > appResearchStart)
  const appResearchBlock = appVue.slice(appResearchStart, appResearchEnd)

  const staticResearchStart = staticHtml.indexOf('const industryChainBody = `')
  const staticResearchEnd = staticHtml.indexOf('const portraitBody = () =>', staticResearchStart)
  assert.ok(staticResearchStart > -1)
  assert.ok(staticResearchEnd > staticResearchStart)
  const staticResearchBlock = staticHtml.slice(staticResearchStart, staticResearchEnd)

  for (const source of [appResearchBlock, staticResearchBlock]) {
    for (const label of [
      '中国建筑',
      '广联达',
      '品茗科技',
      '装配式建筑',
      '智慧工地',
      '建筑机器人',
      'BIM协同',
      '智能建造'
    ]) {
      assert.match(source, new RegExp(label))
    }

    for (const oldLabel of [
      '百度智能云',
      '科大讯飞',
      '商汤科技',
      '生成式人工智能',
      '人工智能\\+行动',
      '人工智能产业链',
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
    parsePolicyDates(appVue, 'const industryPolicyItems = [', 'const industryCompanyItems = ['),
    parsePolicyDates(staticHtml, 'const staticPolicyItems = [', 'const industryPolicyBody = `')
  ]) {
    assert.ok(dates.length >= 4)
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a))
  }
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

  assert.match(staticHtml, /当前产业链：智能建造产业链/)
  assert.doesNotMatch(portraitBlock, /AI模型部署工程师/)
  assert.doesNotMatch(portraitBlock, /工业视觉检测工程师/)
  assert.doesNotMatch(portraitBlock, /模型服务部署/)
})

test('job portrait search removes hot tags and shows 12 jobs per page', () => {
  assert.match(appVue, /const portraitPageSize = 12/)
  assert.match(staticHtml, /const staticPortraitPageSize = 12/)

  for (const source of [appVue, staticHtml]) {
    assert.doesNotMatch(source, /热门岗位搜索/)
    assert.doesNotMatch(source, /class="hot-tags"/)
  }
})

test('portrait company cards use a coordinated summary layout', () => {
  for (const source of [appVue, staticHtml]) {
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
  assert.match(appVue, /PORTRAIT_JOB_PROFILES\.some\(\(job\) => job\.id === jobId\)/)
  assert.match(staticHtml, /const staticMinPortraitAbilityCount = 80/)
  assert.match(staticHtml, /normalizeStaticPortraitAbilities/)
})

test('portrait competency map links every ability to at least one task', () => {
  assert.match(appVue, /const distributePortraitAbilitiesAcrossTasks/)
  assert.match(appVue, /coveredAbilityNames/)
  assert.match(appVue, /allAbilityNames\.forEach/)
  assert.match(appVue, /taskAbilityMap\[taskName\]\.push\(abilityName\)/)
  assert.doesNotMatch(appVue, /knowledge\[\(index \+ 2\) % knowledge\.length\]/)
  assert.match(staticHtml, /const distributeStaticPortraitAbilitiesAcrossTasks/)
  assert.match(staticHtml, /coveredAbilityNames/)
  assert.match(staticHtml, /allAbilityNames\.forEach/)
  assert.match(staticHtml, /taskAbilityMap\[taskName\]\.push\(abilityName\)/)
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
  assert.match(appVue, /const updateGraphLines/)
  assert.match(appVue, /getBoundingClientRect\(\)/)
  assert.match(appVue, /graphMeasuredLinks/)
  assert.match(appVue, /resultsPortalGraphMeasuredLinks/)
  assert.match(appVue, /:viewBox="graphLineViewBox"/)
  assert.match(staticHtml, /const updateStaticGraphLines/)
  assert.match(staticHtml, /getBoundingClientRect\(\)/)
  assert.match(staticHtml, /canvas\.__graphLinks = links/)
  assert.match(stylesCss, /\.graph-entity::after/)
  assert.match(stylesCss, /\.graph-entity::before/)
})

test('graph hover highlights only explicit measured graph link paths', () => {
  assert.match(appVue, /const activeGraphLinkKeys/)
  assert.match(appVue, /activeGraphLinkKeys\.has\(link\.key\)/)
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
  assert.match(appVue, /jobGroups/)
  assert.match(appVue, /graph-job-groups/)
  assert.match(appVue, /graph-job-group/)
  assert.match(appVue, /graph-group-job/)
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
  for (const source of [appVue, staticHtml]) {
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

test('clicking a job node opens the job ability graph inside the graph frame', () => {
  assert.match(appVue, /selectedGraphJobId/)
  assert.match(appVue, /openGraphAbility/)
  assert.match(appVue, /selectedGraphJobDetail/)
  assert.match(appVue, /graph-ability-view/)
  assert.match(appVue, /data-graph-map-task-index/)
  assert.match(appVue, /data-graph-map-ability/)
})

test('static graph job nodes open an inline ability graph with a back action', () => {
  assert.match(staticHtml, /data-graph-job/)
  assert.match(staticHtml, /renderStaticGraphAbility/)
  assert.match(staticHtml, /selectStaticGraphAbilityTask/)
  assert.match(staticHtml, /data-back-static-graph/)
  assert.match(staticHtml, /graph-ability-view/)
  assert.match(staticHtml, /data-graph-map-ability/)
})

test('job ability graph uses industry information and task ability headings', () => {
  assert.match(appVue, /selectedGraphIndustry/)
  assert.match(appVue, /selectedGraphChain/)
  assert.match(appVue, /graph-ability-headings/)
  for (const label of ['产业信息', '岗位', '典型工作任务', '能力项']) {
    assert.match(appVue, new RegExp(label))
    assert.match(staticHtml, new RegExp(label))
  }
  assert.match(staticHtml, /selectedStaticGraphIndustry/)
  assert.match(staticHtml, /graph-ability-industry-node/)
})

test('results portal static entry wires ability task and back button clicks', () => {
  const portalStart = staticHtml.indexOf("if (staticPageView === 'results-portal')")
  const portalEnd = staticHtml.indexOf('renderHome()', portalStart)
  assert.ok(portalStart > -1)
  assert.ok(portalEnd > portalStart)
  const portalEntry = staticHtml.slice(portalStart, portalEnd)
  assert.match(portalEntry, /selectStaticGraphAbilityTask/)
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
  assert.match(appVue, /selectedGraphAbilityTitle/)
  assert.match(appVue, /graph-ability-title-row/)
  assert.match(appVue, /{{ selectedGraphAbilityTitle }}/)
  assert.doesNotMatch(appVue, /selectedGraphJobId \? '岗位能力图谱' : '岗位产业图谱'/)
  assert.doesNotMatch(appVue, /\$\{selectedGraphJob\?\.name \?\? '岗位'\} - 典型工作任务 - 能力项图谱/)

  assert.match(staticHtml, /graph-ability-title-row/)
  assert.match(staticHtml, /「\$\{data\.job\?\.name \|\| '岗位'\}岗位」岗位能力图谱/)
  assert.doesNotMatch(staticHtml, /mode === 'ability' \? '岗位能力图谱' : '岗位产业图谱'/)
  assert.doesNotMatch(staticHtml, /\$\{data\.job\?\.name \|\| '岗位'\} - 典型工作任务 - 能力项图谱/)
})

test('results portal job center shows linked job cards as a carousel before the graph', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /results-job-card-switcher/)
    assert.match(source, /results-job-card-track/)
    assert.match(source, /results-job-card-dots/)
    assert.match(source, /关联岗位卡片/)
    assert.match(source, /results-job-path/)
    for (const label of ['岗位群', '产业链', '关联课程', '岗位建设路径']) {
      assert.match(source, new RegExp(label))
    }
  }
  assert.match(appVue, /resultsPortalJobCards/)
  assert.match(appVue, /activeResultsPortalJobCardIndex/)
  assert.match(appVue, /showResultsPortalJobCard/)
  assert.match(staticHtml, /activeStaticResultsJobIndex/)
  assert.match(staticHtml, /data-results-job-prev/)
  assert.match(staticHtml, /data-results-job-next/)
  assert.match(staticHtml, /data-results-job-dot/)
  assert.match(appVue, /resultsPortalPath/)
  assert.match(stylesCss, /\.results-job-kpis article\.featured/)
  assert.match(stylesCss, /\.results-job-card-switcher/)
})

test('results portal job center keeps the summary layout coordinated', () => {
  const vueKpis = appVue.match(/const resultsPortalKpis = computed\(\(\) => \[([\s\S]*?)\]\)/)
  const staticKpis = staticHtml.match(/const resultsPortalKpis = \(\) => \[([\s\S]*?)\]\s*const resultsPortalHeroMetrics/)
  assert.ok(vueKpis)
  assert.ok(staticKpis)

  for (const kpiBlock of [vueKpis[1], staticKpis[1]]) {
    for (const label of ['建设岗位', '典型工作任务', '岗位能力项', '关联课程', '岗课匹配度']) {
      assert.match(kpiBlock, new RegExp(label))
    }
    for (const label of ['关联产业链', '朝阳产业', '开设趋势', '就业规模']) {
      assert.doesNotMatch(kpiBlock, new RegExp(label))
    }
  }

  assert.doesNotMatch(stylesCss, /\.results-job-spotlight::after/)
  assert.doesNotMatch(stylesCss, /grid-column:\s*span 4/)
  const carouselBlock = stylesCss.match(/\.results-job-card-switcher\s*{([^}]*)}/)
  assert.ok(carouselBlock)
  assert.match(carouselBlock[1], /overflow:\s*hidden/)
  assert.match(stylesCss, /\.results-job-kpis\s*{[\s\S]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/)
  assert.doesNotMatch(stylesCss, /article\.tone-purple/)
  assert.doesNotMatch(stylesCss, /article\.tone-green/)
  assert.doesNotMatch(stylesCss, /article\.tone-amber/)
})

test('job carousel ability button scrolls to the graph frame', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /查看岗位能力图谱/)
    assert.doesNotMatch(source, /查看岗位图谱/)
    assert.match(source, /scrollIntoView\(\{\s*behavior: 'smooth',\s*block: 'start'/)
  }
  assert.match(appVue, /resultsPortalGraphRef/)
  assert.match(appVue, /openGraphAbility\(card\.id, true\)/)
  assert.match(staticHtml, /scrollStaticResultsGraphIntoView/)
})

test('results portal graph headings do not reuse light card blocks', () => {
  const darkHeadingBlock = stylesCss.match(/\.results-portal-graph \.graph-headings div\s*{([\s\S]*?)}/)
  assert.ok(darkHeadingBlock)
  assert.match(darkHeadingBlock[1], /background:\s*transparent/)
  assert.match(darkHeadingBlock[1], /border:\s*0/)
  assert.match(darkHeadingBlock[1], /border-radius:\s*0/)
  assert.match(darkHeadingBlock[1], /box-shadow:\s*none/)
})

test('results portal conclusions and path use lightweight text sections', () => {
  assert.match(appVue, /results-job-insight-strip/)
  assert.match(appVue, /results-job-path-text/)
  assert.match(staticHtml, /results-job-insight-strip/)
  assert.match(staticHtml, /results-job-path-text/)
  assert.doesNotMatch(appVue, /<article v-for="item in resultsPortalInsights"/)
  assert.doesNotMatch(staticHtml, /resultsPortalInsights\.map\(\(\[label, value, detail\]\) => `<article/)

  const insightsBlock = stylesCss.match(/\.results-job-insights\s*{([^}]*)}/)
  const pathBlock = stylesCss.match(/\.results-job-path\s*{([^}]*)}/)
  assert.ok(insightsBlock)
  assert.ok(pathBlock)
  assert.doesNotMatch(insightsBlock[1], /grid-template-columns/)
  assert.doesNotMatch(pathBlock[1], /border:/)
  assert.match(stylesCss, /\.results-job-path-text/)
})

test('job graph mode switch has animated transitions in Vue and static entries', () => {
  assert.match(appVue, /<Transition name="graph-mode"/)
  assert.match(appVue, /graphModeKey/)
  assert.match(appVue, /refreshGraphModeLines/)
  assert.match(staticHtml, /graph-mode-animate/)
  assert.match(staticHtml, /animateStaticGraphMode/)
  assert.match(staticHtml, /animateStandaloneGraphMode/)
  assert.match(staticHtml, /renderStandalonePortal\(true\)/)
  assert.match(stylesCss, /\.graph-mode-enter-active/)
  assert.match(stylesCss, /@keyframes graphModeContentIn/)
})

test('Vue manual entry opens the full talent plan demo sections', () => {
  assert.match(appVue, /talentPlanCreated/)
  assert.match(appVue, /startManualCultivateEntry/)
  assert.match(appVue, /activeTalentSection/)
  for (const label of ['培养目标', '毕业要求', '课程管理', '支撑矩阵', '学生管理']) {
    assert.match(appVue, new RegExp(label))
  }
  assert.match(appVue, /talent-course-table/)
  assert.match(appVue, /talent-matrix-table/)
})

test('talent plan demo is mocked from intelligent construction source materials', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /扎根辽西、服务辽宁、对接产业、面向一线/)
    assert.match(source, /智能建造工程基础理论知识和技术技能/)
    assert.match(source, /建筑信息模型（BIM）基础与应用/)
    assert.match(source, /R8/)
    assert.match(source, /B261311/)
    assert.match(source, /智能建造施工技术/)
    assert.match(source, /B261340/)
    assert.match(source, /智慧工地平台部署与管理/)
  }
  assert.match(appVue, /talentCourses\.length/)
  assert.match(staticHtml, /staticTalentCourses\.length/)
})

test('graduation requirements are grouped into fewer parent requirements with multiple indicators', () => {
  const vueGroupedBlock = appVue.match(/const graduationRequirements = \[([\s\S]*?)\]\nconst talentCourses/)
  const staticGroupedBlock = staticHtml.match(/const staticGraduationRequirements = \[([\s\S]*?)\]\n        const staticTalentCourses/)
  assert.ok(vueGroupedBlock)
  assert.ok(staticGroupedBlock)

  for (const source of [appVue, staticHtml]) {
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

test('talent support matrix maps grouped graduation requirements to all training goals', () => {
  for (const source of [appVue, staticHtml]) {
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

test('talent sidebar exposes research and comparison subsystem entries in Vue and static entry', () => {
  for (const label of ['人才培养方案调研', '人才培养方案比对']) {
    assert.match(appVue, new RegExp(label))
    assert.match(staticHtml, new RegExp(label))
  }
  assert.match(appVue, /activeTalentSubsystem/)
  assert.match(appVue, /openTalentSubsystem/)
  assert.match(staticHtml, /data-talent-subsystem/)
  assert.match(stylesCss, /talent-subsystem-entry/)
})

test('talent subsystem sidebar entries keep long labels on one line', () => {
  const entryBlock = stylesCss.match(/\.talent-subsystem-entry\s*{([^}]*)}/)
  assert.ok(entryBlock)
  assert.match(entryBlock[1], /white-space:\s*nowrap/)
  assert.match(entryBlock[1], /font-size:\s*13px/)
  assert.match(stylesCss, /\.talent-subsystem-entry-group\s*{[\s\S]*width:\s*156px/)
})

test('talent research subsystem supports search results and PDF preview in Vue and static entry', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /researchPlanResults/)
    assert.match(source, /talent-research-search-card/)
    assert.match(source, /搜索全国优秀职业院校人培方案/)
    assert.match(source, /搜索结果/)
    assert.match(source, /pdf-preview-shell/)
    assert.match(source, /openResearchPlanPreview/)
    assert.match(source, /2025年沈建大智能建造人培/)
    assert.match(source, /2024年大工智能建造方向/)
  }
  assert.match(appVue, /filteredResearchPlanResults/)
  assert.match(staticHtml, /filterResearchPlanResults/)
  assert.doesNotMatch(appVue, /class="research-filter-row"/)
  assert.doesNotMatch(staticHtml, /class="research-filter-row"/)
  assert.doesNotMatch(appVue, /research-search-icon/)
  assert.doesNotMatch(staticHtml, /research-search-icon/)
  assert.doesNotMatch(stylesCss, /\.research-search-icon/)
  assert.match(stylesCss, /talent-research-search-card/)
  assert.match(stylesCss, /pdf-preview-page/)
})

test('talent compare subsystem supports PDF selection, module comparison, editor and PDF export in Vue and static entry', () => {
  for (const source of [appVue, staticHtml]) {
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
  assert.match(appVue, /startTalentPlanCompare/)
  assert.match(appVue, /exportComparePdf/)
  assert.match(staticHtml, /data-start-talent-compare/)
  assert.match(staticHtml, /data-export-compare-pdf/)
  assert.match(stylesCss, /compare-editor-panel/)
})

test('talent compare subsystem shows a comparing loading state and scrollable module results', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /比对中/)
    assert.match(source, /compare-loading-panel/)
  }
  assert.match(appVue, /compareLoading/)
  assert.match(staticHtml, /data-finish-talent-compare/)
  assert.match(stylesCss, /\.compare-module-results\s*\{[\s\S]*overflow-y:\s*auto/)
  assert.match(stylesCss, /\.compare-module-results\s*\{[\s\S]*max-height:/)
})

test('talent compare module cards switch the editor to the selected module draft', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /data-compare-module/)
    assert.match(source, /data-compare-editor-title/)
    assert.match(source, /培养目标修订稿/)
    assert.match(source, /毕业要求修订稿/)
    assert.match(source, /课程体系修订稿/)
  }
  assert.match(appVue, /activeCompareModuleName/)
  assert.match(appVue, /activeCompareEditorContent/)
  assert.match(appVue, /selectCompareModuleForEdit/)
  assert.match(staticHtml, /activeStaticCompareModuleName/)
  assert.match(staticHtml, /renderStaticCompareEditor/)
  assert.match(stylesCss, /\.compare-module-card\.selected/)
})

test('talent compare mock content is tailored to intelligent construction engineering', () => {
  const appCompareBlock = appVue.match(/const researchPlanResults = \[[\s\S]*?const matrixGoals/)
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

  for (const source of [appVue, staticHtml]) {
    assert.match(source, /2026级智能建造工程专业人才培养方案\.pdf/)
    assert.match(source, /被比对-智能建造工程专业标杆人才培养方案\.pdf/)
  }
})

test('talent compare setup guides users to import local research reports', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /导入本地文件/)
    assert.match(source, /产业调研报告/)
    assert.match(source, /专业分析报告/)
    assert.match(source, /compare-reference-import/)
    assert.match(source, /compare-reference-icon/)
    assert.match(source, /data-compare-reference-import/)
  }
  assert.match(appVue, /compareReferenceFiles/)
  assert.match(appVue, /simulateReferenceFileImport/)
  assert.match(staticHtml, /staticCompareReferenceFiles/)
  assert.match(stylesCss, /\.compare-reference-import/)
  assert.match(stylesCss, /\.compare-reference-icon/)
})
