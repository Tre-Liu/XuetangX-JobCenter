import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const talentIndustryData = await readFile(new URL('../src/app/talent-industry-data.ts', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const styles = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('industry research navigation contains professional analysis as a second-level group', () => {
  assert.match(talentIndustryData, /export type IndustryResearchTabKey = 'chain' \| 'region' \| 'policy' \| 'company' \| 'major'/)
  assert.match(talentIndustryData, /\{ key: 'major', label: '专业分析' \}/)

  assert.match(appVue, /· 专业分析 ·/)
  assert.match(appVue, /PROFESSIONAL_ANALYSIS_TABS/)
  assert.match(appVue, /专业布点分析/)
  assert.match(appVue, /专业开设趋势/)
  assert.match(appVue, /currentProfessionalAnalysisTab/)
})

test('professional analysis pages are integrated inside industry research content', () => {
  assert.match(appVue, /currentJobIndustryTab === 'major'/)
  assert.match(appVue, /activeIndustryResearchTitle/)
  assert.match(appVue, /professionalAnalysisBriefs/)
  assert.doesNotMatch(appVue, /class="professional-analysis-tabs"/)
  assert.match(appVue, /professional-analysis-map-page/)
  assert.match(appVue, /professional-analysis-trend-page/)
  assert.match(appVue, /professionalProvinceRankItems/)
  assert.match(appVue, /professionalTrendKpis/)

  assert.match(talentIndustryData, /export const professionalDistributionPoints/)
  assert.match(talentIndustryData, /export const professionalProvinceRanks/)
  assert.match(talentIndustryData, /export const professionalSchoolRows/)
  assert.match(talentIndustryData, /export const professionalTrendKpis/)
  assert.match(talentIndustryData, /export const professionalTrendYears/)
})

test('professional analysis follows existing research visual system', () => {
  for (const selector of [
    '.professional-map-dashboard',
    '.professional-geo-map-card',
    '.professional-geo-map-wrap',
    '.professional-geo-map',
    '.professional-geo-region',
    '.professional-map-label',
    '.professional-region-matrix',
    '.professional-quadrant',
    '.province-rank-list',
    '.professional-match-grid',
    '.professional-trend-compact',
    '.professional-trend-sparkline',
    '.professional-trend-summary',
    '.professional-trend-layout',
    '.professional-delta-chart'
  ]) {
    assert.match(styles, new RegExp(selector.replace('.', '\\.')))
  }

  assert.doesNotMatch(styles, /\.professional-analysis-tabs/)
  assert.doesNotMatch(styles, /\.professional-analysis-map\s*\{/)
  assert.doesNotMatch(styles, /\.professional-map-layout/)
  assert.doesNotMatch(styles, /\.professional-china-map/)
  assert.doesNotMatch(styles, /\.professional-map-region/)
  assert.doesNotMatch(styles, /\.professional-density-list/)
  assert.doesNotMatch(styles, /\.professional-line-chart/)
  assert.doesNotMatch(appVue, /<svg viewBox="0 0 100 100" preserveAspectRatio="none"[\s\S]*?professionalTrendPolyline/)
  assert.doesNotMatch(appVue, /professional-china-map/)
  assert.doesNotMatch(appVue, /professional-map-region/)
  assert.doesNotMatch(appVue, /professional-density-card/)
  assert.doesNotMatch(appVue, /professional-line-chart/)
  assert.doesNotMatch(styles, /\.legacy-major-page/)
  assert.doesNotMatch(appVue, /BaseChart/)
  assert.doesNotMatch(appVue, /ElTable/)
})

test('professional analysis cards keep comfortable title and content spacing', () => {
  assert.match(
    styles,
    /\.professional-analysis-map-page\s+\.research-card-head,\s*\.professional-analysis-trend-page\s+\.research-card-head\s*\{[\s\S]*?min-height:\s*70px;[\s\S]*?height:\s*auto;[\s\S]*?padding:\s*16px\s+32px\s+14px;/
  )
  assert.match(
    styles,
    /\.professional-analysis-map-page\s+\.research-card-head\s*>\s*div,\s*\.professional-analysis-trend-page\s+\.research-card-head\s*>\s*div\s*\{[\s\S]*?gap:\s*6px;/
  )
  assert.match(
    styles,
    /\.professional-geo-map-wrap\s*\{[\s\S]*?padding:\s*18px\s+32px\s+30px;/
  )
  assert.match(
    styles,
    /\.professional-region-matrix\s*\{[\s\S]*?padding:\s*20px\s+32px\s+24px;/
  )
  assert.match(
    styles,
    /\.professional-quadrant\s*\{[\s\S]*?margin:\s*20px\s+32px\s+24px;/
  )
  assert.match(
    styles,
    /\.professional-match-grid\s*\{[\s\S]*?padding:\s*20px\s+32px\s+24px;/
  )
  assert.match(
    styles,
    /\.professional-trend-compact\s*\{[\s\S]*?padding:\s*20px\s+32px\s+24px;/
  )
})

test('static industry research export includes professional analysis pages', () => {
  assert.match(staticHtml, /const professionalTabs = \[/)
  assert.match(staticHtml, /\['map', '专业布点分析'\]/)
  assert.match(staticHtml, /\['trend', '专业开设趋势'\]/)
  assert.match(staticHtml, /· 专业分析 ·/)
  assert.match(staticHtml, /data-static-professional-tab/)
  assert.match(staticHtml, /staticCurrentProfessionalTab/)
  assert.match(staticHtml, /professional-analysis-map-page/)
  assert.match(staticHtml, /professional-analysis-trend-page/)
  assert.match(staticHtml, /全国专业布点热力图/)
  assert.match(staticHtml, /professional-geo-map/)
  assert.match(staticHtml, /professional-geo-region/)
  assert.match(staticHtml, /产教匹配象限/)
  assert.match(staticHtml, /开设趋势研判/)
  assert.match(staticHtml, /professional-region-matrix/)
  assert.match(staticHtml, /professional-trend-compact/)
  assert.doesNotMatch(staticHtml, /professional-china-map/)
  assert.doesNotMatch(staticHtml, /professional-map-region/)
  assert.doesNotMatch(staticHtml, /professional-density-card/)
  assert.doesNotMatch(staticHtml, /professional-line-chart/)
  assert.match(staticHtml, /syncStaticViewUrl\('job-industry', \{ tab: 'major', professionalTab: tab \}\)/)
})
