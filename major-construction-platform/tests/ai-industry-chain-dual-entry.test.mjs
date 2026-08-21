import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = async (relativePath) => (
  readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8').catch(() => '')
)

const loader = await readSource('src/app/ai-industry-chain-data.ts')
const app = await readSource('src/App.vue')
const talentData = await readSource('src/app/talent-industry-data.ts')
const staticHtml = await readSource('index.html')
const styles = await readSource('src/styles/20-talent.css')

test('Vue loader exposes typed retryable access to the shared AI chain package', () => {
  assert.match(loader, /export interface AiIndustryChainData/)
  assert.match(loader, /export const loadAiIndustryChainData/)
  assert.match(loader, /__AI_INDUSTRY_CHAIN_DATA__/)
  assert.match(loader, /\.\/public\/data\/ai-industry-chain-data\.js/)
  assert.match(loader, /\.\/data\/ai-industry-chain-data\.js/)
  assert.match(loader, /\/data\/ai-industry-chain-data\.js/)
  assert.match(loader, /人工智能产业链数据加载失败/)
  assert.match(loader, /人工智能产业链数据版本不匹配/)
})

test('Vue entry exposes the complete AI chain interaction contract', () => {
  for (const token of [
    '人工智能产业链',
    'isAiIndustryChain',
    'ensureAiIndustryChainData',
    '正在加载人工智能产业链完整数据',
    '重新加载',
    'aiIndustryNodeSearchText',
    'aiIndustryCompanyStageFilter',
    'aiIndustryCompanySourceFilter',
    'aiIndustryCompanyProvinceFilter',
    'filteredAiIndustryCompanies',
    'paginatedAiIndustryCompanies',
    '来源标称样本量',
  ]) {
    assert.match(`${app}\n${talentData}`, new RegExp(token))
  }
})

test('file entry exposes equivalent AI chain loading and interaction hooks', () => {
  for (const token of [
    '人工智能产业链',
    'ensureStaticAiIndustryChainData',
    'staticAiIndustryChainSectionHtml',
    'staticAiIndustryRegionMapBody',
    'staticAiIndustryCompanyBody',
    'data-ai-node-search',
    'data-ai-node-expand',
    'data-ai-company-stage',
    'data-ai-company-source',
    'data-ai-company-province',
    'data-ai-company-page',
    '__AI_INDUSTRY_CHAIN_DATA__',
  ]) {
    assert.match(staticHtml, new RegExp(token))
  }
})

test('AI graph uses the shared treemap and Sankey contracts in both entries', () => {
  assert.match(app, /ai-chain-shared-treemap/)
  assert.match(app, /ai-chain-shared-sankey/)
  assert.match(staticHtml, /staticAiIndustryTreemapHtml/)
  assert.match(staticHtml, /staticAiIndustrySankeyHtml/)
  assert.match(staticHtml, /ai-chain-shared-treemap/)
  assert.match(staticHtml, /ai-chain-shared-sankey/)
  assert.doesNotMatch(staticHtml, /class="ai-chain-sankey"/)
  assert.doesNotMatch(app, /class="ai-chain-sankey"/)
})

test('all chain selectors include AI and the enterprise selector is a non-wrapping five-column grid', () => {
  assert.match(`${talentData}\n${staticHtml}`, /人工智能产业链/)
  assert.match(styles, /\.industry-company-segments\s*\{[^}]*grid-template-columns:\s*repeat\(5,/s)
  assert.match(styles, /\.industry-company-segments button\s*\{[^}]*white-space:\s*nowrap/s)
  assert.doesNotMatch(styles, /\.industry-company-segments\s*\{[^}]*grid-template-columns:\s*repeat\(4,/s)
  assert.match(styles, /\.policy-segments\s*\{[^}]*grid-template-columns:\s*repeat\(5,/s)
  assert.match(styles, /\.policy-segments button\s*\{[^}]*white-space:\s*nowrap/s)
  assert.doesNotMatch(styles, /\.policy-segments\s*\{[^}]*grid-template-columns:\s*repeat\(4,/s)
})

test('AI policy mapping exists in Vue and static entries', () => {
  assert.match(talentData, /'人工智能产业链':\s*\{/)
  assert.match(staticHtml, /const staticPolicyViewsByChain\s*=\s*\{[\s\S]*?'人工智能产业链':\s*\{/)
})

test('static AI regional analysis reuses the China map renderer', () => {
  assert.match(staticHtml, /const staticAiIndustryRegionMapBody\s*=\s*\(\)\s*=>/)
  assert.match(staticHtml, /staticIndustryRegionMapBody\(staticAiIndustryProvinceMetrics\(\)\)/)
  assert.match(staticHtml, /class="china-heatmap"/)
  assert.doesNotMatch(staticHtml, /const staticAiIndustryRegionBody\s*=\s*\(\)\s*=>/)
})

test('AI regional KPI cards use the same dimensions in Vue and static entries', () => {
  assert.match(app, /const normalizeRegionName\s*=\s*\(name:\s*string\)/)
  assert.match(app, /const aiIndustryKeyCityCount\s*=\s*computed/)
  assert.match(app, /\.map\(\(company\)\s*=>\s*normalizeRegionName\(company\.city\)\)/)
  assert.match(staticHtml, /const staticAiIndustryKeyCityCount\s*=\s*\(data\)\s*=>/)
  assert.match(staticHtml, /\.map\(\(company\)\s*=>\s*staticNormalizeRegionName\(company\.city\)\)/)
  assert.doesNotMatch(app, /normalizeProvinceName\(company\.city/)

  for (const source of [app, staticHtml]) {
    assert.match(source, />覆盖省份</)
    assert.match(source, />企业样本</)
    assert.match(source, />覆盖城市</)
  }

  const vueRegionKpis = app.match(
    /<section class="demand-kpi-grid industry-kpi-grid industry-region-kpi-grid industry-research-figma-board">([\s\S]*?)<\/section>/
  )
  const staticAiRegionKpis = staticHtml.match(
    /const staticAiIndustryRegionSectionHtml[\s\S]*?return `(<section class="demand-kpi-grid industry-kpi-grid industry-region-kpi-grid industry-research-figma-board">[\s\S]*?<\/section>)/
  )
  assert.ok(vueRegionKpis, 'Vue regional KPI section should exist')
  assert.ok(staticAiRegionKpis, 'static AI regional KPI section should exist')
  assert.doesNotMatch(vueRegionKpis[1], /<em>/)
  assert.doesNotMatch(staticAiRegionKpis[1], /<em>/)

  assert.doesNotMatch(app, /<span v-if="isAiIndustryChain">地区待补<\/span>/)
  assert.doesNotMatch(staticHtml, /<article><span>地区待补<\/span>/)
  assert.doesNotMatch(staticHtml, />覆盖省级地区</)
  assert.match(app, /industry-research-figma-board/)
  assert.match(staticHtml, /industry-research-figma-board/)
  assert.match(app, /industry-figma-kpi-card/)
  assert.match(staticHtml, /industry-figma-kpi-card/)
  assert.match(app, /industry-region-figma-dashboard/)
  assert.match(staticHtml, /industry-region-figma-dashboard/)
})

test('AI regional maps use logarithmic adaptive heat levels in both entries', () => {
  assert.match(app, /const adaptiveHeatTone[\s\S]*?Math\.log1p/)
  assert.match(staticHtml, /const staticAdaptiveHeatTone[\s\S]*?Math\.log1p/)
  assert.match(app, /const maxLog[\s\S]*?Math\.log1p\(count\) \/ maxLog/)
  assert.match(staticHtml, /const maxLog[\s\S]*?Math\.log1p\(count\) \/ maxLog/)
  assert.match(app, /对数自适应/)
  assert.match(staticHtml, /对数自适应/)
})

test('AI regional maps expose national province city district drilldown in both entries', () => {
  for (const token of [
    'selectedIndustryMapProvince',
    'selectedIndustryMapCity',
    'selectedIndustryMapDistrict',
    'selectIndustryMapProvince',
    'selectIndustryMapCity',
    'selectIndustryMapDistrict',
    'industry-map-breadcrumb',
    'data-map-drill-district',
  ]) {
    assert.match(app, new RegExp(token))
  }

  for (const token of [
    'staticSelectedIndustryMapProvince',
    'staticSelectedIndustryMapCity',
    'staticSelectedIndustryMapDistrict',
    'data-map-drill-province',
    'data-map-drill-city',
    'data-map-drill-district',
    'data-map-drill-level',
    'industry-map-breadcrumb',
  ]) {
    assert.match(staticHtml, new RegExp(token))
  }
})

test('map labels do not block province drilldown clicks', () => {
  assert.match(styles, /\.professional-map-label\s*\{[^}]*pointer-events:\s*none/s)
})

test('all 109 AI nodes remain accessible inside the shared treemap expansion', () => {
  assert.match(app, /aiIndustryExpandedStages/)
  assert.match(app, /data-ai-node-expand/)
  assert.match(staticHtml, /staticAiIndustryExpandedStages/)
  assert.match(staticHtml, /data-ai-node-expand/)
  assert.doesNotMatch(app, /class="ai-chain-node-explorer"/)
  assert.doesNotMatch(staticHtml, /class="research-card ai-chain-node-explorer"/)
})

test('AI chain retains loading, provenance, filter, and pagination visual hooks', () => {
  for (const selector of ['.ai-chain-state', '.ai-chain-kpis', '.ai-chain-provenance', '.ai-company-filters', '.ai-company-pagination']) {
    assert.match(styles, new RegExp(selector.replaceAll('.', '\\.')))
  }
})
