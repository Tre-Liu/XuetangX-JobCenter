import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'
import { JOB_CARDS, getJobDetail } from '../src/mock/job-center.ts'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const appConfig = await readFile(new URL('../src/app/app-config.ts', import.meta.url), 'utf8')
const appTalentIndustryData = await readFile(new URL('../src/app/talent-industry-data.ts', import.meta.url), 'utf8')
const abilityImportUtil = await readFile(new URL('../src/utils/ability-import.ts', import.meta.url), 'utf8').catch(() => '')
const standaloneViewUtil = await readFile(new URL('../src/utils/standalone-view.ts', import.meta.url), 'utf8').catch(() => '')
const graphLayoutUtil = await readFile(new URL('../src/utils/graph-layout.ts', import.meta.url), 'utf8').catch(() => '')
const appSource = `${appVue}\n${appTalentIndustryData}\n${appConfig}`
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
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

class FakeElement {}

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

test('static industry chain nodes expose related national industry tags', () => {
  assert.match(staticHtml, /const staticIndustryNodeNationalIndustries = \{/)
  assert.match(staticHtml, /design:\s*\[[^\]]*'E 建筑业'[^\]]*'M 科学研究和技术服务业'/)
  assert.match(staticHtml, /software:\s*\[[^\]]*'I 信息传输、软件和信息技术服务业'/)
  assert.match(staticHtml, /construction:\s*\[[^\]]*'E 建筑业'/)
  assert.match(staticHtml, /staticIndustryNodeNationalTagsHtml\(node\.id\)/)
  assert.match(staticHtml, /staticNationalIndustryTagHtml/)
  assert.match(staticHtml, /class="industry-node-national-code"/)
  assert.match(staticHtml, /class="industry-node-national-name"/)
  assert.match(staticHtml, /data-basic-industry-national-industries/)
  assert.match(staticHtml, /nationalIndustries/)
  assert.match(styleBlock('.industry-node-national-tags'), /display:\s*flex/)
  assert.match(styleBlock('.industry-node-national-tags em'), /display:\s*inline-flex/)
  assert.match(styleBlock('.industry-node-national-tags em'), /border-style:\s*dashed/)
  assert.match(styleBlock('.industry-node-national-tags em'), /border-radius:\s*4px/)
  assert.match(styleBlock('.industry-node-national-code'), /background:\s*#eaf2ff/)
  assert.match(styleBlock('.industry-node-national-code'), /color:\s*#2f6fff/)
  assert.doesNotMatch(styleBlock('.industry-node-national-code'), /#1f3152/)
  assert.match(styleBlock('.industry-sankey-hover-card .industry-node-national-tags'), /margin-top:\s*8px/)
})

test('regional industry analysis presents three KPI cards without cooperation leads', () => {
  const regionKpiSection = appVue.match(
    /<section class="demand-kpi-grid industry-kpi-grid industry-region-kpi-grid">([\s\S]*?)<\/section>/
  )

  assert.ok(regionKpiSection, 'regional KPI section should use its own layout class')
  assert.match(regionKpiSection[1], />覆盖省份</)
  assert.match(regionKpiSection[1], />企业样本</)
  assert.match(regionKpiSection[1], />重点城市</)
  assert.doesNotMatch(regionKpiSection[1], /合作线索/)

  const regionKpiStyles = styleBlock('.demand-kpi-grid.industry-region-kpi-grid')
  assert.match(regionKpiStyles, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/)
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
  const industryHeader = appVue.match(/<div v-if="currentJobSection === '产业调研'" class="job-research-page">[\s\S]*?<p class="research-page-purpose">/)?.[0] ?? ''
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
  assert.match(staticHtml, /const staticCurrentIndustryChainTabs = \(\) =>/)
  assert.match(staticHtml, /data-current-industry-chain-tab/)
  assert.match(staticHtml, /class="research-chain-tab \$\{item === staticSelectedIndustryChain \? 'active' : ''\}"/)
  assert.match(staticHtml, /aria-pressed="\$\{item === staticSelectedIndustryChain \? 'true' : 'false'\}"/)
  assert.match(staticIndustryRenderer, /staticCurrentIndustryChainTabs\(\)/)
  assert.doesNotMatch(staticIndustryRenderer, /staticCurrentIndustryChainSelect\(\)/)
  assert.doesNotMatch(appSource, /<span>当前产业链：\{\{ activeIndustryChainLabel \}\}<\/span>/)
  assert.doesNotMatch(staticHtml, /<span>当前产业链：\$\{staticEscapeText\(staticSelectedIndustryChain\)\}<\/span>/)
  assert.doesNotMatch(appSource, /<button class="research-chain-select">当前产业链：智能建造产业链⌄<\/button>/)
})

test('static job sidebar keeps primary entries visible and nests research groups', () => {
  assert.match(staticHtml, /data-job-primary="research"[\s\S]*<strong>产业调研<\/strong>/)
  assert.match(staticHtml, /data-job-primary="report"[\s\S]*<strong>报告生成<\/strong>/)
  assert.match(staticHtml, /data-job-primary="build"[\s\S]*<strong>岗位建设中心<\/strong>/)
  assert.match(staticHtml, /data-job-sub-menu="research"/)
  assert.match(staticHtml, /data-job-section="report"[\s\S]*调研报告生成/)
  assert.match(staticHtml, /data-job-section="build"[\s\S]*岗位建设/)
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
  assert.doesNotMatch(app.innerHTML, /岗位中心 \/ 产业调研报告/)
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
  assert.match(app.innerHTML, /class="job-sub-button selected" data-job-section="report">调研报告生成/)
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
  assert.match(appSource, /buildStandaloneViewUrl\('industry-research-admin'\)/)

  assert.match(staticHtml, /staticIndustryResearchStateKey/)
  assert.match(staticHtml, /readStaticIndustryResearchInitialized/)
  assert.match(staticHtml, /const staticResearchUninitializedHtml =/)
  assert.match(staticHtml, /data-go-cms-industry-init/)
  assert.match(staticHtml, /产业调研数据未初始化/)
  assert.match(staticHtml, /const industryResearchCmsInitializationUrl = \(\) => new URL\('\.\/industry-research-admin\.html', window\.location\.href\)\.toString\(\)/)
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

test('static file demo dock can reset CMS initialization state', () => {
  assert.match(staticHtml, /data-reset-demo-initialization/)
  assert.match(staticHtml, /title="重置演示初始化状态"/)
  assert.match(staticHtml, /localStorage\.removeItem\(staticIndustryResearchStateKey\)/)
  assert.match(staticHtml, /renderStaticPage\(\)/)
})

test('static demo shows initialized industry research data after CMS chain selection is stored', () => {
  const scriptMatch = staticHtml.match(/<script>\s*\(\(\) => \{([\s\S]*)\}\)\(\)\s*<\/script>/)
  assert.ok(scriptMatch, 'expected file:// bootstrap script in static entry')

  const app = {
    innerHTML: '',
    querySelector() { return null },
    addEventListener() {}
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
  assert.doesNotMatch(app.innerHTML, /国标行业关联分析/)
  assert.doesNotMatch(app.innerHTML, /代表企业行业覆盖/)
  assert.doesNotMatch(app.innerHTML, /行业增长信号/)
  assert.doesNotMatch(app.innerHTML, /<p>具体产品\/技术\/服务节点<\/p>/)
  assert.doesNotMatch(app.innerHTML, /矩形面积按代表企业/)
  assert.doesNotMatch(app.innerHTML, /industry-treemap-hover-card/)
  assert.doesNotMatch(app.innerHTML, /产业调研数据未初始化/)
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

test('research ai brief uses a compact shared text layout', () => {
  assert.match(appSource, /class="research-compact-ai research-figma-ai"/)
  assert.match(appSource, /class="research-figma-ai-mark"/)
  assert.match(appSource, /class="research-figma-ai-icon" src="\/figma-assets\/job-portrait-ai-icon\.png\?v=figma-export-2085665242"/)
  assert.match(appSource, /activeResearchBrief\.title/)
  assert.match(appSource, /activeResearchBrief\.items/)
  assert.match(appSource, /产业链结构分析/)

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
  for (const marker of ['岗位需求月度趋势', '技能需求热度', '热门岗位招聘明细', 'trend-bars', 'skill-bar-list', 'research-table']) {
    assert.match(demandBlock, new RegExp(marker))
  }
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
    ['portrait', '岗位画像分析'],
    ['demand', '招聘需求趋势'],
    ['forecast', '新岗位新技术']
  ]

  for (const [tab, title] of cases) {
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
    assert.match(app.innerHTML, /产业调研数据未初始化/)
    assert.match(app.innerHTML, /请先前往 CMS 进行数据初始化/)
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
    assert.match(appSource, new RegExp(label))
  }
  for (const label of ['关联产业链', '朝阳产业', '开设趋势', '就业规模']) {
    assert.match(appSource, new RegExp(label))
  }
  assert.match(appSource, /activeResultsPortalTab === '岗位中心'/)
  assert.match(appSource, /results-portal-graph/)
  assert.match(appSource, /岗位产业图谱/)
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
  assert.match(appSource, /const jobSideItems = \['产业调研', '报告生成', '岗位建设中心'\]/)
  assert.match(appSource, /const INDUSTRY_RESEARCH_TABS/)
  assert.match(appSource, /currentJobIndustryTab/)
  assert.match(appSource, /selectJobIndustryTab/)
  for (const label of ['产业链图谱', '区域产业分析', '产业政策库', '产业企业库', '产业布局', '岗位分析']) {
    assert.match(appSource, new RegExp(label))
  }

  assert.match(staticHtml, /class="job-research-heading[\s\S]*data-job-primary="research"[\s\S]*<strong>产业调研<\/strong>/)
  assert.match(staticHtml, /class="job-research-heading job-report-heading[\s\S]*data-job-primary="report"[\s\S]*<strong>报告生成<\/strong>/)
  assert.match(staticHtml, /class="job-research-heading job-build-heading[\s\S]*data-job-primary="build"[\s\S]*<strong>岗位建设中心<\/strong>/)
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
      '具体产品 / 技术 / 服务节点'
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
    parsePolicyDates(appSource, 'const industryPolicyItems = [', 'export const industryPolicyKeywords = ['),
    parsePolicyDates(staticHtml, 'const staticPolicyItems = [', 'const industryPolicyBody = `')
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
  assert.ok(countPolicies(staticHtml, 'const staticPolicyItems = [', 'const industryPolicyBody = `') >= 8)

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
    collectPolicyBlock(staticHtml, 'const staticPolicyItems = [', 'const industryPolicyBody = `')
  ]) {
    assert.match(block, /date: '2026年/)
    assert.match(block, /publishDate: '2026-\d{2}-\d{2}'/)
    assert.match(block, /date: '2025年/)
    assert.match(block, /publishDate: '2025-\d{2}-\d{2}'/)
    assert.match(block, /https:\/\/www\.gov\.cn/)
    assert.match(block, /https:\/\/www\.mohurd\.gov\.cn/)
  }
})

test('industry policy page keeps keyword cloud and annual trend side panel', () => {
  for (const source of [appSource, staticHtml]) {
    for (const label of [
      'policy-layout',
      'policy-word-cloud',
      'policy-bars',
      '政策关键词云',
      '年度政策趋势',
      'BIM协同',
      '智慧工地',
      '装配式建筑',
      '绿色建造'
    ]) {
      assert.match(source, new RegExp(label))
    }
  }
})

test('industry company pagination keeps enough bottom breathing room', () => {
  const paginationStyles = styleBlock('.industry-company-pagination')
  const paddingMatch = paginationStyles.match(/padding:\s*0\s+18px\s+(\d+)px/)
  assert.ok(paddingMatch, 'industry company pagination should declare vertical padding')
  assert.ok(Number(paddingMatch[1]) >= 34, 'bottom padding should keep the paginator away from the card edge')
})

test('industry policy list keeps more policies inside an internal scroll panel', () => {
  const timelineStyles = styleBlock('.policy-timeline')
  assert.match(timelineStyles, /max-height:\s*\d+px/)
  assert.match(timelineStyles, /overflow-y:\s*auto/)
  assert.match(appSource, /policy-timeline-meta/)
  assert.match(staticHtml, /policy-timeline-meta/)
})

test('policy detail dialog places original source action at summary top without breadcrumb', () => {
  const dialogStart = staticHtml.indexOf('const showStaticPolicyDialog =')
  const dialogEnd = staticHtml.indexOf('const refreshAddDialogState =', dialogStart)
  assert.ok(dialogStart > -1)
  assert.ok(dialogEnd > dialogStart)
  const dialogBlock = staticHtml.slice(dialogStart, dialogEnd)

  assert.doesNotMatch(dialogBlock, /产业政策库 \/ 政策详情/)
  assert.match(dialogBlock, /<header class="dialog-header"><div><h2>\$\{policy\.title\}<\/h2><\/div>/)
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

  assert.match(staticHtml, /staticCurrentIndustryChainSelect/)
  assert.match(staticHtml, /research-chain-select-label/)
  assert.match(staticHtml, /<option value="\$\{staticEscapeText\(item\)\}" \$\{item === staticSelectedIndustryChain \? 'selected' : ''\}>\$\{staticEscapeText\(item\)\}<\/option>/)
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
  assert.match(appSource, /data-graph-map-task-index/)
  assert.match(appSource, /data-graph-map-ability/)
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
  assert.match(appSource, /selectedGraphIndustry/)
  assert.match(appSource, /selectedGraphChain/)
  assert.match(appSource, /graph-ability-headings/)
  for (const label of ['产业信息', '岗位', '典型工作任务', '能力项']) {
    assert.match(appSource, new RegExp(label))
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
  const vueEnd = appVue.indexOf('<div ref="abilityMapGraphRef"', vueStart)
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
    assert.match(source, /results-job-path/)
    for (const label of ['岗位群', '产业链', '关联课程', '岗位建设路径']) {
      assert.match(source, new RegExp(label))
    }
  }
  assert.match(appSource, /resultsPortalJobCards/)
  assert.match(appSource, /activeResultsPortalJobCardIndex/)
  assert.match(appSource, /showResultsPortalJobCard/)
  assert.match(staticHtml, /activeStaticResultsJobIndex/)
  assert.match(staticHtml, /data-results-job-prev/)
  assert.match(staticHtml, /data-results-job-next/)
  assert.match(staticHtml, /data-results-job-dot/)
  assert.match(appSource, /resultsPortalPath/)
  assert.match(stylesCss, /\.results-job-kpis article\.featured/)
  assert.match(stylesCss, /\.results-job-card-switcher/)
})

test('static results portal carousel updates the existing track instead of rerendering the page', () => {
  const helperMatch = staticHtml.match(/const standaloneShowResultsJobCard = \(index = 0\) => \{([\s\S]*?)\n        \}/)
  assert.ok(helperMatch)

  assert.match(staticHtml, /const updateStandaloneResultsJobCarousel = \(\) => \{/)
  assert.match(helperMatch[1], /updateStandaloneResultsJobCarousel\(\)/)
  assert.doesNotMatch(helperMatch[1], /renderStandalonePortal\(\)/)
})

test('results portal job center keeps the summary layout coordinated', () => {
  const vueKpis = appSource.match(/const resultsPortalKpis = computed\(\(\) => \[([\s\S]*?)\]\)/)
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
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /查看岗位能力图谱/)
    assert.doesNotMatch(source, /查看岗位图谱/)
    assert.match(source, /scrollIntoView\(\{\s*behavior: 'smooth',\s*block: 'start'/)
  }
  assert.match(appSource, /resultsPortalGraphRef/)
  assert.match(appSource, /openGraphAbility\(card\.id, true\)/)
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
  assert.match(appSource, /results-job-insight-strip/)
  assert.match(appSource, /results-job-path-text/)
  assert.match(staticHtml, /results-job-insight-strip/)
  assert.match(staticHtml, /results-job-path-text/)
  assert.doesNotMatch(appSource, /<article v-for="item in resultsPortalInsights"/)
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

test('talent sidebar exposes research and comparison subsystem entries in Vue and static entry', () => {
  for (const label of ['人才培养方案调研', '人才培养方案比对']) {
    assert.match(appSource, new RegExp(label))
    assert.match(staticHtml, new RegExp(label))
  }
  assert.match(appSource, /activeTalentSubsystem/)
  assert.match(appSource, /openTalentSubsystem/)
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
  for (const source of [appSource, staticHtml]) {
    assert.match(source, /researchPlanResults/)
    assert.match(source, /talent-research-search-card/)
    assert.match(source, /搜索全国优秀职业院校人培方案/)
    assert.match(source, /搜索结果/)
    assert.match(source, /pdf-preview-shell/)
    assert.match(source, /openResearchPlanPreview/)
    assert.match(source, /2025年沈建大智能建造人培/)
    assert.match(source, /2024年大工智能建造方向/)
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
