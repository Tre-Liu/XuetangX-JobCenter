import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const talentIndustryData = await readFile(new URL('../src/app/talent-industry-data.ts', import.meta.url), 'utf8')
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
    '.professional-map-layout',
    '.china-heatmap',
    '.map-region',
    '.province-rank-list',
    '.professional-match-grid',
    '.professional-trend-layout',
    '.professional-line-chart',
    '.professional-delta-chart'
  ]) {
    assert.match(styles, new RegExp(selector.replace('.', '\\.')))
  }

  assert.doesNotMatch(styles, /\.professional-analysis-tabs/)
  assert.doesNotMatch(styles, /\.professional-analysis-map\s*\{/)
  assert.doesNotMatch(appVue, /<svg viewBox="0 0 100 100" preserveAspectRatio="none"[\s\S]*?professionalTrendPolyline/)
  assert.doesNotMatch(styles, /\.legacy-major-page/)
  assert.doesNotMatch(appVue, /BaseChart/)
  assert.doesNotMatch(appVue, /ElTable/)
})
