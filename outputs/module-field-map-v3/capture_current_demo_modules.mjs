import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const outputDir = '/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/module-field-map-v3/live-screenshots'
const baseUrl = 'http://127.0.0.1:5178/index.html'

const pages = [
  { name: '区域产业分析', file: '当前demo-区域产业分析.png', query: 'view=job-industry&tab=region&reportView=library' },
  { name: '产业政策库', file: '当前demo-产业政策库.png', query: 'view=job-industry&tab=policy&reportView=library' },
  { name: '产业企业库', file: '当前demo-产业企业库.png', query: 'view=job-industry&tab=company&reportView=library' },
  { name: '岗位画像分析', file: '当前demo-岗位画像分析.png', query: 'view=job-research&tab=portrait&reportView=library' },
  { name: '招聘需求趋势', file: '当前demo-招聘需求趋势.png', query: 'view=job-research&tab=demand&reportView=library' },
  { name: '新岗位新技术', file: '当前demo-新岗位新技术.png', query: 'view=job-research&tab=forecast&reportView=library' },
]

await fs.mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})

const context = await browser.newContext({
  viewport: { width: 1920, height: 1700 },
  deviceScaleFactor: 1,
})

await context.addInitScript(() => {
  localStorage.setItem(
    'major-construction-platform:industry-research',
    JSON.stringify({
      initialized: true,
      selectedChainIds: ['chain-platform'],
      selectedChainId: 'chain-platform',
      officialMajor: { level: 'vocational', code: '440304', name: '智能建造技术' },
      selectedAt: '2026-07-08T00:00:00.000Z',
    }),
  )
})

try {
  const page = await context.newPage()
  for (const item of pages) {
    await page.goto(`${baseUrl}?${item.query}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.job-research-page', { state: 'visible', timeout: 10_000 })
    await page.getByText(item.name, { exact: true }).first().waitFor({ state: 'visible', timeout: 10_000 })
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(outputDir, item.file),
      fullPage: true,
    })
    console.log(`${item.name}: ${item.file}`)
  }
} finally {
  await browser.close()
}
