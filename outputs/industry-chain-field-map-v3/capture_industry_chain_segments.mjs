import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const outputDir = '/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/industry-chain-field-map-v3'
const baseUrl = 'http://127.0.0.1:5178/index.html?view=job-industry&tab=chain&reportView=library'

await fs.mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})

const context = await browser.newContext({
  viewport: { width: 1600, height: 1450 },
  deviceScaleFactor: 1,
})

await context.addInitScript(() => {
  localStorage.setItem(
    'major-construction-platform:industry-research',
    JSON.stringify({ initialized: true, selectedChainIds: ['chain-platform'], selectedChainId: 'chain-platform' }),
  )
})

const page = await context.newPage()

try {
  await page.goto(baseUrl, { waitUntil: 'load' })
  await page.waitForSelector('.industry-layout-card', { state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(500)

  await page.screenshot({
    path: path.join(outputDir, '产业链图谱-完整页-上半段.png'),
    fullPage: true,
  })

  await page.evaluate(() => {
    const candidates = [
      document.querySelector('.job-center-card'),
      document.querySelector('.job-research-page'),
      document.scrollingElement,
      document.documentElement,
      document.body,
    ].filter(Boolean)
    for (const element of candidates) {
      if (element.scrollHeight > element.clientHeight + 20) {
        element.scrollTop = Math.floor(element.clientHeight * 0.7)
      }
    }
    window.scrollTo(0, Math.floor(window.innerHeight * 0.7))
  })
  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(outputDir, '产业链图谱-完整页-下半段.png'),
    fullPage: true,
  })
} finally {
  await browser.close()
}
