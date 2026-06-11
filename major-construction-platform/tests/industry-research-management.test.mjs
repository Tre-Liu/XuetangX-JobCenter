import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const industryResearchData = await readFile(new URL('../src/app/industry-research-management.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))
const localHtml = await readFile(new URL('../outputs/industry-research-admin.html', import.meta.url), 'utf8')
const rootLocalHtml = await readFile(new URL('../industry-research-admin.html', import.meta.url), 'utf8')

test('industry research management renders as a standalone CMS admin page', () => {
  assert.match(appVue, /currentViewParam === 'industry-research-admin'/)
  assert.match(appVue, /class="cms-admin-shell"/)
  assert.match(appVue, /class="cms-sidebar"/)
  assert.match(appVue, /平台管理 \/ AI 课程管理/)
  assert.match(appVue, /class="cms-management-card"/)
})

test('CMS professional construction tabs expose industry research management', () => {
  assert.match(appVue, /label: '产业调研'/)
  assert.match(appVue, /cmsProfessionalTabs/)
  assert.doesNotMatch(appVue, /topModulesWithIndustryResearch/)
})

test('industry research management supports initialization progress before recommendations', () => {
  assert.match(appVue, /industryResearchStatus = ref<'idle' \| 'initializing' \| 'ready'>\('idle'\)/)
  assert.match(appVue, /startIndustryResearchInitialization/)
  assert.match(appVue, /setTimeout\(\(\) => \{[\s\S]*industryResearchStatus\.value = 'ready'/)
  assert.match(appVue, /初始化中/)
  assert.match(appVue, /正在根据专业名称、培养方向、岗位资料和已有专业数据生成产业链推荐/)
})

test('industry research idle state uses only the header initialization action', () => {
  const appIdleSection = appVue.match(/<section v-if="industryResearchStatus === 'idle'" class="cms-init-empty">[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.doesNotMatch(appIdleSection, /<button/)

  for (const source of [localHtml, rootLocalHtml]) {
    const htmlIdleSection = source.match(/<section class="init-empty" id="empty">[\s\S]*?<\/section>/)?.[0] ?? ''
    assert.doesNotMatch(htmlIdleSection, /<button/)
    assert.doesNotMatch(source, /id="init"/)
    assert.doesNotMatch(source, /querySelector\('#init'\)/)
  }
})

test('industry chain recommendations are shown as selectable list with manual add entry', () => {
  assert.match(industryResearchData, /INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS/)
  for (const chain of ['智能建造产业链', '建筑工业化产业链', '智慧城市基础设施产业链']) {
    assert.match(industryResearchData, new RegExp(chain))
  }
  assert.match(appVue, /自主添加产业链/)
  assert.match(appVue, /v-for="chain in paginatedIndustryResearchChains"/)
  assert.match(appVue, /toggleIndustryResearchChain\(chain\.id\)/)
  assert.match(appVue, /selectedIndustryResearchChainIds\.includes\(chain\.id\)/)
})

test('industry chain recommendations support multi-select and pagination', () => {
  assert.match(industryResearchData, /id: 'green-building-materials'/)
  assert.match(industryResearchData, /id: 'engineering-digital-services'/)
  assert.match(appVue, /selectedIndustryResearchChainIds = ref<string\[\]>\(\[\]\)/)
  assert.match(appVue, /industryResearchPageSize = 3/)
  assert.match(appVue, /paginatedIndustryResearchChains = computed/)
  assert.match(appVue, /industryResearchTotalPages = computed/)
  assert.match(appVue, /setIndustryResearchPage\(page\)/)
  assert.match(appVue, /class="cms-pagination"/)
  assert.match(appVue, /已选 \{\{ selectedIndustryResearchChainIds\.length \}\} 条产业链/)
})

test('industry research management has dedicated operational styling', () => {
  assert.match(stylesCss, /\.cms-admin-shell\s*\{/)
  assert.match(stylesCss, /\.cms-sidebar\s*\{/)
  assert.match(stylesCss, /\.cms-management-card\s*\{/)
  assert.match(stylesCss, /\.industry-chain-row\.selected\s*\{/)
  assert.match(stylesCss, /\.industry-initialization-progress\s*\{/)
  assert.match(stylesCss, /\.cms-pagination\s*\{/)
})

test('local standalone html file can be opened directly', () => {
  assert.match(localHtml, /产业调研管理/)
  assert.match(localHtml, /cms-admin-shell/)
  assert.match(localHtml, /数据初始化/)
  assert.match(localHtml, /自主添加产业链/)
  assert.match(localHtml, /分页/)
})

test('industry research CMS persists selected chains for demo handoff', () => {
  assert.match(appVue, /industryResearchStateKey/)
  assert.match(appVue, /persistIndustryResearchSelection/)
  assert.match(appVue, /localStorage\.setItem\(industryResearchStateKey/)
  assert.match(appVue, /initialized:\s*selectedIndustryResearchChainIds\.value\.length > 0/)

  for (const source of [localHtml, rootLocalHtml]) {
    assert.match(source, /const industryResearchStateKey = 'major-construction-platform:industry-research'/)
    assert.match(source, /const persistSelection = \(\) =>/)
    assert.match(source, /localStorage\.setItem\(industryResearchStateKey/)
    assert.match(source, /initialized:\s*selected\.size > 0/)
    assert.match(source, /selectedChainIds:\s*\[\.\.\.selected\]/)
  }
})

test('main demo dock can reset CMS initialization state for rehearsals', () => {
  assert.match(appVue, /resetIndustryResearchDemoInitialization/)
  assert.match(appVue, /localStorage\.removeItem\(industryResearchStateKey\)/)
  assert.match(appVue, /aria-label="重置演示初始化状态"/)
  assert.match(appVue, /title="重置演示初始化状态"/)
  assert.match(appVue, /class="dock-icon demo-reset"/)
  assert.match(appVue, /@click="resetIndustryResearchDemoInitialization"/)
})
