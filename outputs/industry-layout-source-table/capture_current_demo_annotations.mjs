import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = 'http://127.0.0.1:5178/index.html'
const outputDir = '/Users/liuhongzhe/Documents/专业建设/outputs/industry-layout-source-table/field-shots'
await fs.mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
})
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 })
await context.addInitScript(() => {
  localStorage.setItem(
    'major-construction-platform:industry-research',
    JSON.stringify({ initialized: true, selectedChainIds: ['chain-platform'], selectedChainId: 'chain-platform' })
  )
})
const page = await context.newPage()

function pageUrl(mode, tab) {
  const view = mode === 'industry' ? 'job-industry' : 'job-research'
  return `${baseUrl}?view=${view}&tab=${tab}&reportView=library`
}

async function openPage(mode, tab) {
  await page.goto(pageUrl(mode, tab), { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
}

function card(text) {
  return page.locator('section, article, div.research-card, div.research-two-col, div.industry-list-grid, div.policy-layout')
    .filter({ hasText: text })
    .first()
}

function target(key) {
  const map = {
    'layout-nav': () => page.locator('button').filter({ hasText: '区域产业分析' }).first(),
    'job-nav': () => page.locator('button').filter({ hasText: '岗位画像分析' }).first(),
    'chain-brief': () => card('产业链结构分析'),
    'view-switch': () => page.locator('.industry-chain-view-switch').first(),
    'national-kpis': () => page.locator('.industry-national-kpis').first(),
    'national-dialog': () => page.locator('.industry-national-detail-dialog').first(),
    'treemap-stage': () => page.locator('.industry-treemap-board').first(),
    'treemap-node': () => page.locator('.industry-treemap-grid').first(),
    'sankey': () => page.locator('.industry-sankey-board').first(),
    'coverage': () => page.locator('.industry-national-analysis section').first(),
    'growth': () => page.locator('.industry-national-growth').first(),
    'insights': () => page.locator('.industry-chain-info-grid').first(),
    'enterprise-list': () => card('代表企业'),
    'job-list-chain': () => card('核心岗位'),
    'suggestions': () => card('产业链建设建议'),
    'region-brief': () => card('区域产业布局研判'),
    'region-kpi': () => page.locator('.industry-kpi-grid').first(),
    'region-cards': () => page.locator('.industry-region-grid').first(),
    'policy-brief': () => card('政策趋势解读'),
    'policy-toolbar': () => page.locator('.policy-toolbar').first(),
    'policy-list': () => page.locator('.policy-timeline-card').first(),
    'policy-cloud': () => card('政策关键词云'),
    'policy-trend': () => card('年度政策趋势'),
    'company-brief': () => card('企业资源研判'),
    'company-search': () => page.locator('.industry-company-toolbar').first(),
    'company-table': () => page.locator('.industry-company-table-wrap').first(),
    'company-pagination': () => page.locator('.industry-company-pagination').first(),
    'portrait-brief': () => card('岗位画像洞察'),
    'portrait-kpi-search': () => page.locator('.portrait-overview-row').first(),
    'portrait-list': () => card('岗位列表'),
    'portrait-dialog': () => page.locator('.portrait-detail-dialog').first(),
    'portrait-ability': () => card('三维能力分析'),
    'certificate-dialog': () => page.locator('.certificate-detail-dialog, .certificate-chip-row').first(),
    'company-dialog': () => page.locator('.company-detail-dialog').first(),
    'competency-map': () => page.locator('.competency-map-board, .portrait-competency-map-page').first(),
    'demand-brief': () => card('招聘需求趋势判断'),
    'demand-kpi': () => page.locator('.demand-kpi-grid').first(),
    'demand-trend': () => card('岗位需求月度趋势'),
    'demand-skills': () => card('技能需求热度'),
    'demand-table': () => card('热门岗位招聘明细'),
    'forecast-brief': () => card('新岗位新技术'),
    'forecast-directions': () => card('新兴技术方向'),
    'forecast-jobs': () => card('新岗位 × 专业匹配'),
    'forecast-training': () => card('人才培养方向建议')
  }
  return map[key]()
}

async function markAndShot(key, fileName, label) {
  const locator = target(key)
  await locator.waitFor({ state: 'visible', timeout: 8000 })
  await locator.scrollIntoViewIfNeeded()
  await locator.evaluate((el, text) => {
    el.style.outline = '0'
    el.style.boxShadow = 'inset 0 0 0 6px #ff3b30'
    el.setAttribute('data-codex-shot-label', text)
  }, label)
  await page.addStyleTag({
    content: `
      [data-codex-shot-label] { position: relative !important; }
      [data-codex-shot-label]::before {
        content: attr(data-codex-shot-label);
        position: absolute;
        left: 8px;
        top: 8px;
        z-index: 2147483647;
        background: #ff3b30;
        color: #fff;
        font: 700 15px sans-serif;
        line-height: 1;
        padding: 6px 9px;
        border-radius: 5px;
        white-space: nowrap;
      }
    `
  })
  await page.waitForTimeout(120)
  await locator.screenshot({ path: path.join(outputDir, fileName) })
  await locator.evaluate((el) => {
    el.style.outline = ''
    el.style.outlineOffset = ''
    el.style.boxShadow = ''
    el.removeAttribute('data-codex-shot-label')
  })
}

async function prepare(action) {
  if (!action) return
  if (action === 'switch-sankey') {
    await page.getByRole('button', { name: '桑基图' }).click()
    await page.waitForTimeout(500)
  }
  if (action === 'open-national-dialog') {
    await page.locator('.industry-national-kpi-card').first().click()
    await page.waitForTimeout(500)
  }
  if (action === 'open-portrait-dialog') {
    await page.locator('.portrait-profile-card').first().click()
    await page.waitForTimeout(700)
  }
  if (action === 'open-certificate-dialog') {
    await page.locator('.portrait-profile-card').first().click()
    await page.waitForTimeout(500)
    await page.locator('.certificate-chip-row').first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
  }
  if (action === 'open-company-dialog') {
    await page.locator('.portrait-profile-card').first().click()
    await page.waitForTimeout(500)
    const companyButton = page.locator('.portrait-company-grid button').first()
    await companyButton.scrollIntoViewIfNeeded()
    await companyButton.evaluate((el) => el.click())
    await page.waitForTimeout(500)
  }
  if (action === 'open-competency-map') {
    await page.goto(`${baseUrl}?view=job-competency-map&job=job-bim-modeler`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)
  }
}

const shots = [
  ['industry', 'chain', 'layout-nav', 'row-02-layout-nav.png', '产业布局导航'],
  ['industry', 'chain', 'chain-brief', 'row-03-chain-brief.png', '顶部研判摘要'],
  ['industry', 'chain', 'view-switch', 'row-04-view-switch.png', '视图切换'],
  ['industry', 'chain', 'national-kpis', 'row-05-national-kpis.png', '国标行业KPI'],
  ['industry', 'chain', 'national-dialog', 'row-06-national-dialog.png', 'KPI详情弹窗', 'open-national-dialog'],
  ['industry', 'chain', 'treemap-stage', 'row-07-treemap-stage.png', '矩形树图阶段'],
  ['industry', 'chain', 'treemap-node', 'row-08-treemap-node.png', '产业节点卡片'],
  ['industry', 'chain', 'sankey', 'row-09-sankey.png', '桑基图与hover', 'switch-sankey'],
  ['industry', 'chain', 'coverage', 'row-10-coverage.png', '代表企业行业覆盖'],
  ['industry', 'chain', 'growth', 'row-11-growth.png', '行业增长信号'],
  ['industry', 'chain', 'insights', 'row-12-insights.png', '产业链洞察'],
  ['industry', 'chain', 'enterprise-list', 'row-13-enterprise-list.png', '代表企业列表'],
  ['industry', 'chain', 'job-list-chain', 'row-14-job-list-chain.png', '核心岗位列表'],
  ['industry', 'chain', 'suggestions', 'row-15-suggestions.png', '产业链建设建议'],
  ['industry', 'region', 'region-brief', 'row-16-region-brief.png', '区域研判摘要'],
  ['industry', 'region', 'region-kpi', 'row-17-region-kpi.png', '区域KPI'],
  ['industry', 'region', 'region-cards', 'row-18-region-cards.png', '区域合作方向'],
  ['industry', 'policy', 'policy-brief', 'row-19-policy-brief.png', '政策摘要'],
  ['industry', 'policy', 'policy-toolbar', 'row-20-policy-toolbar.png', '政策筛选'],
  ['industry', 'policy', 'policy-list', 'row-21-policy-list.png', '政策时间线'],
  ['industry', 'policy', 'policy-cloud', 'row-22-policy-cloud.png', '关键词云'],
  ['industry', 'policy', 'policy-trend', 'row-23-policy-trend.png', '年度政策趋势'],
  ['industry', 'company', 'company-brief', 'row-24-company-brief.png', '企业研判摘要'],
  ['industry', 'company', 'company-search', 'row-25-company-search.png', '企业搜索'],
  ['industry', 'company', 'company-table', 'row-26-company-table.png', '企业表格'],
  ['industry', 'company', 'company-pagination', 'row-27-company-pagination.png', '企业分页'],
  ['job', 'portrait', 'job-nav', 'row-28-job-nav.png', '岗位分析导航'],
  ['job', 'portrait', 'portrait-brief', 'row-29-portrait-brief.png', '岗位画像摘要'],
  ['job', 'portrait', 'portrait-kpi-search', 'row-30-portrait-kpi-search.png', 'KPI与搜索'],
  ['job', 'portrait', 'portrait-list', 'row-31-portrait-list.png', '岗位列表筛选分页'],
  ['job', 'portrait', 'portrait-dialog', 'row-32-portrait-dialog.png', '岗位详情弹窗', 'open-portrait-dialog'],
  ['job', 'portrait', 'portrait-ability', 'row-33-portrait-ability.png', '三维能力分析', 'open-portrait-dialog'],
  ['job', 'portrait', 'certificate-dialog', 'row-34-certificate-dialog.png', '证书详情弹窗', 'open-certificate-dialog'],
  ['job', 'portrait', 'company-dialog', 'row-35-company-dialog.png', '企业详情弹窗', 'open-company-dialog'],
  ['job', 'portrait', 'competency-map', 'row-36-competency-map.png', '岗位能力图谱', 'open-competency-map'],
  ['job', 'demand', 'demand-brief', 'row-37-demand-brief.png', '招聘趋势摘要'],
  ['job', 'demand', 'demand-kpi', 'row-38-demand-kpi.png', '需求KPI'],
  ['job', 'demand', 'demand-trend', 'row-39-demand-trend.png', '月度趋势'],
  ['job', 'demand', 'demand-skills', 'row-40-demand-skills.png', '技能热度'],
  ['job', 'demand', 'demand-table', 'row-41-demand-table.png', '招聘明细表'],
  ['job', 'forecast', 'forecast-brief', 'row-42-forecast-brief.png', '新岗位新技术摘要'],
  ['job', 'forecast', 'forecast-directions', 'row-43-forecast-directions.png', '新兴技术方向'],
  ['job', 'forecast', 'forecast-jobs', 'row-44-forecast-jobs.png', '新岗位专业匹配'],
  ['job', 'forecast', 'forecast-training', 'row-45-forecast-training.png', '人才培养建议']
]

try {
  for (const [mode, tab, key, fileName, label, action] of shots) {
    await openPage(mode, tab)
    await prepare(action)
    await markAndShot(key, fileName, label)
    console.log(`${fileName} ${label}`)
  }
} finally {
  await browser.close()
}
