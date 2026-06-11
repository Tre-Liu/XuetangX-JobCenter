import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const readConstArrayBlock = (source, constName) => {
  const match = source.match(new RegExp(`export const ${constName} = \\[[\\s\\S]*?\\n\\]`))
  assert.ok(match, `Missing ${constName} export`)
  return match[0]
}
const readBetween = (source, startText, endText) => {
  const start = source.indexOf(startText)
  assert.notEqual(start, -1, `Missing start marker: ${startText}`)
  const end = source.indexOf(endText, start)
  assert.notEqual(end, -1, `Missing end marker: ${endText}`)
  return source.slice(start, end)
}

test('V1 front app keeps the original demo shell while defaulting to job research', () => {
  const app = read('src/App.vue')
  const styles = read('src/styles.css')
  const config = read('src/app/app-config.ts')
  const topModules = readConstArrayBlock(config, 'topModules')

  assert.match(app, /const currentModule = ref\('岗位中心'\)/)
  assert.match(app, /const currentJobSection = ref\('产业调研'\)/)
  assert.match(app, /const currentJobResearchMode = ref<'industry' \| 'job'>\('job'\)/)
  assert.match(app, /v-for="item in topModules"/)
  assert.match(app, /class="job-module-menu"/)
  assert.match(styles, /@import '\.\/styles\/00-base\.css'/)
  assert.match(styles, /@import '\.\/styles\/10-shell\.css'/)
  assert.match(styles, /@import '\.\/styles\/30-job-research\.css'/)
  assert.match(topModules, /label: '岗位中心'/)
  assert.doesNotMatch(topModules, /label: '人才方案管理'/)
  assert.doesNotMatch(topModules, /label: '课程模型'/)
  assert.doesNotMatch(topModules, /label: '决策中心'/)
})

test('V1 job research menu only keeps portrait and demand trend', () => {
  const app = read('src/App.vue')
  const indexHtml = read('index.html')
  const jobResearch = read('src/mock/job-research.ts')
  const talentData = read('src/app/talent-industry-data.ts')
  const staticTopNavBlock = readBetween(indexHtml, 'const topNavHtml', 'const courseTopNavHtml')
  const staticShellBlock = readBetween(indexHtml, 'const shellStart', 'const shellEnd')

  assert.match(jobResearch, /label: '岗位画像分析'/)
  assert.match(jobResearch, /label: '招聘需求趋势'/)
  assert.doesNotMatch(jobResearch, /label: '新岗位新技术预判'/)
  assert.match(talentData, /export const jobSideItems = \['产业调研'\]/)
  assert.doesNotMatch(app, /v-for="tab in INDUSTRY_RESEARCH_TABS"/)
  assert.doesNotMatch(app, /<div class="job-sub-title">产业布局<\/div>/)

  assert.match(indexHtml, /const researchTabs = \[\s*\[\s*'portrait', '岗位画像分析'\s*\],\s*\[\s*'demand', '招聘需求趋势'\s*\]\s*\]/)
  assert.doesNotMatch(indexHtml, /\['forecast', '新岗位新技术预判'\]/)
  assert.doesNotMatch(staticShellBlock, /<div class="job-sub-title">产业布局<\/div>/)
  assert.doesNotMatch(staticShellBlock, /data-industry-tab=/)
  assert.doesNotMatch(staticShellBlock, /data-job-menu="report"/)
  assert.doesNotMatch(staticShellBlock, /data-job-section="build"/)
  assert.doesNotMatch(staticTopNavBlock, />人才方案管理<\/button>/)
  assert.doesNotMatch(staticTopNavBlock, />专业引擎<\/button>/)
  assert.doesNotMatch(staticTopNavBlock, />专业模型<\/button>/)
  assert.doesNotMatch(staticTopNavBlock, />决策中心<\/button>/)
})

test('HTML entry points keep CMS as a standalone project page', () => {
  const indexHtml = read('index.html')
  const cmsHtml = read('industry-research-admin.html')

  assert.match(indexHtml, /id="app"/)
  assert.match(indexHtml, /src="\/src\/main\.ts"/)

  assert.doesNotMatch(cmsHtml, /src="\/src\/main\.ts"/)
  assert.match(cmsHtml, /CMS数据初始化/)
  assert.match(cmsHtml, /id="topInit"/)
  assert.match(cmsHtml, /const chains = \[/)
})

test('V1 job research pages remove the global industry chain selector', () => {
  const app = read('src/App.vue')
  const indexHtml = read('index.html')

  assert.doesNotMatch(app, /research-chain-select-wrap/)
  assert.doesNotMatch(app, /class="research-chain-select"/)
  assert.doesNotMatch(app, /当前产业链：/)
  assert.doesNotMatch(app, /v-model="selectedIndustryChain"/)
  assert.doesNotMatch(indexHtml, /research-chain-select-wrap/)
  assert.doesNotMatch(indexHtml, /class="research-chain-select"/)
  assert.doesNotMatch(indexHtml, /当前产业链：/)
  assert.doesNotMatch(indexHtml, /data-current-industry-chain/)
  assert.doesNotMatch(indexHtml, /staticCurrentIndustryChainSelect/)
})

test('V1 portrait page removes the marked KPI strip and detail sections', () => {
  const app = read('src/App.vue')
  const indexHtml = read('index.html')
  const portraitBlock = app.match(/<template v-else-if="currentJobResearchTab === 'portrait'">[\s\S]*?<template v-else-if="currentJobResearchTab === 'demand'">/)?.[0] ?? ''
  const portraitDialog = readBetween(app, '<section class="portrait-detail-dialog"', 'v-if="selectedCertificateDetail"')
  const staticPortraitBlock = readBetween(indexHtml, 'const portraitBody = () => `', 'const demandHtml = () => demandBody')
  const staticPortraitDialog = readBetween(indexHtml, 'const showStaticPortraitDialog = (jobId) => {', 'const showStaticCertificateDialog = (certificateId) => {')

  assert.ok(portraitBlock, 'Missing portrait tab template')
  assert.doesNotMatch(portraitBlock, /portrait-kpi-grid/)
  assert.doesNotMatch(portraitBlock, /PORTRAIT_KPIS/)
  assert.doesNotMatch(staticPortraitBlock, /portrait-kpi-grid/)
  assert.doesNotMatch(staticPortraitBlock, /data-kpi-labels=/)
  assert.doesNotMatch(staticPortraitBlock, /staticPortraitKpis/)

  for (const removedText of ['岗位能力图谱', '职业路径', '三维能力分析', '典型工作任务', '推荐职业资格证书', '对接专业', '相关企业']) {
    assert.doesNotMatch(portraitDialog, new RegExp(removedText))
    assert.doesNotMatch(staticPortraitDialog, new RegExp(removedText))
  }
  assert.doesNotMatch(portraitDialog, /portrait-radar-card/)
  assert.doesNotMatch(portraitDialog, /portrait-ability-grid/)
  assert.doesNotMatch(staticPortraitDialog, /data-open-static-portrait-graph/)
  assert.doesNotMatch(staticPortraitDialog, /portrait-radar-card/)
  assert.doesNotMatch(staticPortraitDialog, /portrait-ability-grid/)
  assert.doesNotMatch(staticPortraitDialog, /portrait-task-grid/)
  assert.doesNotMatch(staticPortraitDialog, /certificate-chip-row/)
  assert.doesNotMatch(staticPortraitDialog, /portrait-company-grid/)
})

test('V1 demand page replaces skill heat bars with a job skill word cloud', () => {
  const app = read('src/App.vue')
  const indexHtml = read('index.html')
  const css = read('src/styles/30-job-research.css')
  const demandBlock = app.match(/<template v-else-if="currentJobResearchTab === 'demand'">[\s\S]*?<template v-else>/)?.[0] ?? ''
  const staticDemandBlock = readBetween(indexHtml, 'const demandBody = `', 'const forecastDirections = [')

  assert.ok(demandBlock, 'Missing demand tab template')
  assert.match(demandBlock, /岗位技能词云/)
  assert.match(demandBlock, /word-cloud-stage/)
  assert.match(demandBlock, /word-cloud-node/)
  assert.match(staticDemandBlock, /岗位技能词云/)
  assert.match(staticDemandBlock, /demandSkillWordCloudHtml/)
  assert.match(indexHtml, /const demandSkillWordCloudHtml/)
  assert.match(indexHtml, /word-cloud-stage/)
  assert.match(indexHtml, /word-cloud-node/)
  assert.match(app, /demandSkillWordCloudNodes/)
  assert.match(css, /\.word-cloud-stage/)
  assert.match(css, /\.word-cloud-orbit/)
  assert.match(css, /\.word-cloud-node/)
  assert.doesNotMatch(demandBlock, /技能需求热度/)
  assert.doesNotMatch(demandBlock, /skill-bar-list/)
  assert.doesNotMatch(staticDemandBlock, /技能需求热度/)
  assert.doesNotMatch(staticDemandBlock, /skill-bar-list/)
})

test('CMS initialization route in index renders job status table after initialization', () => {
  const app = read('src/App.vue')
  const indexHtml = read('index.html')
  const css = read('src/styles/95-cms-admin.css')
  const cmsBlock = readBetween(app, '<main v-else-if="isIndustryResearchAdminView"', '<main v-else-if="isJobCompetencyMapView"')

  assert.match(cmsBlock, /岗位列表/)
  assert.match(cmsBlock, /cms-job-search-row/)
  assert.match(cmsBlock, /placeholder="输入岗位名称搜索"/)
  assert.match(cmsBlock, /industryResearchJobSearchText/)
  assert.match(cmsBlock, /searchIndustryResearchJobs/)
  assert.match(cmsBlock, /cms-job-table/)
  assert.match(cmsBlock, /<th>岗位名称<\/th>/)
  assert.match(cmsBlock, /<th>操作<\/th>/)
  assert.match(cmsBlock, /未找到匹配岗位/)
  assert.match(cmsBlock, /setIndustryResearchJobStatus\(job.id, 'active'\)/)
  assert.match(cmsBlock, /setIndustryResearchJobStatus\(job.id, 'inactive'\)/)
  assert.match(cmsBlock, /industryResearchJobPageNumbers/)
  assert.match(app, /filteredIndustryResearchJobs/)
  assert.match(app, /paginatedIndustryResearchJobs/)
  assert.match(app, /initialized: true/)
  assert.match(app, /index\.html\?view=industry-research-admin/)
  assert.match(indexHtml, /index\.html\?view=industry-research-admin/)
  assert.match(indexHtml, /const staticCmsIndustryResearchHtml/)
  assert.match(indexHtml, /staticCmsIndustryResearchSearchText/)
  assert.match(indexHtml, /staticCmsFilteredJobs/)
  assert.match(indexHtml, /data-static-cms-job-search/)
  assert.match(indexHtml, /data-static-cms-job-search-submit/)
  assert.match(indexHtml, /placeholder="输入岗位名称搜索"/)
  assert.match(indexHtml, /未找到匹配岗位/)
  assert.match(indexHtml, /cms-job-table/)
  assert.match(indexHtml, /data-static-cms-job-status="active"/)
  assert.match(indexHtml, /data-static-cms-job-status="inactive"/)
  assert.match(css, /\.cms-job-search-row/)
  assert.match(css, /\.cms-job-search/)
  assert.match(css, /\.cms-job-table/)
  assert.match(css, /\.cms-job-status-actions/)

  for (const removedText of ['推荐产业链', '自主添加产业链', '请选择一个产业链', '已选 {{ selectedIndustryResearchChainIds.length }} 条产业链']) {
    assert.doesNotMatch(cmsBlock, new RegExp(removedText))
  }
  assert.doesNotMatch(indexHtml, /new URL\('\.\/industry-research-admin\.html'/)
  assert.doesNotMatch(cmsBlock, /industry-chain-row/)
  assert.doesNotMatch(cmsBlock, /toggleIndustryResearchChain/)
})
