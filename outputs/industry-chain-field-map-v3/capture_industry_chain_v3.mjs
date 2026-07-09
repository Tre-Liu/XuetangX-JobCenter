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

async function addFieldBadges() {
  await page.addStyleTag({
    content: `
      .codex-field-badge {
        position: absolute;
        z-index: 2147483647;
        max-width: 330px;
        padding: 7px 9px;
        border: 2px solid #ff3b30;
        border-radius: 7px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 10px 28px rgba(15,23,42,.22);
        color: #111827;
        font: 700 13px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        pointer-events: none;
      }
      .codex-field-badge strong {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        margin-right: 6px;
        border-radius: 50%;
        background: #ff3b30;
        color: #fff;
        font-size: 13px;
      }
      .codex-field-box {
        position: absolute;
        z-index: 2147483646;
        border: 3px solid #ff3b30;
        border-radius: 10px;
        pointer-events: none;
        box-shadow: inset 0 0 0 2px rgba(255,255,255,.85);
      }
    `,
  })

  await page.evaluate(() => {
    const overlays = [
      {
        selector: '.research-title-row',
        label: '产业链.名称；专业-产业链选择上下文',
        dx: 8,
        dy: 8,
      },
      {
        selector: '.research-figma-ai',
        label: '产业链.介绍 / 发展分析；AI摘要建议留生成来源',
        dx: 8,
        dy: 8,
      },
      {
        selector: '.industry-national-kpis',
        label: '行业 + 产业链环节_行业聚合；当前缺统计快照字段',
        dx: 8,
        dy: 8,
      },
      {
        selector: '.industry-treemap-stage.stage-upstream header',
        label: '产业链环节.阶段_ps上中下游 / 介绍 / 分类',
        dx: 8,
        dy: 8,
      },
      {
        selector: '.industry-treemap-stage.stage-upstream .industry-treemap-grid',
        label: '产业链环节.名称；企业数=count(产业链环节_企业)',
        dx: 8,
        dy: 10,
      },
      {
        selector: '.industry-treemap-stage.stage-midstream .industry-treemap-grid',
        label: '产业链环节.关键技术 / 关键产品 / 应用场景',
        dx: 8,
        dy: 10,
      },
      {
        selector: '.industry-treemap-stage.stage-downstream .industry-treemap-grid',
        label: '产业链环节.细分领域 / 发展建议 / 短板',
        dx: 8,
        dy: 10,
      },
      {
        selector: '.industry-chain-info-grid',
        label: '产业链环节.发展建议；可由AI生成后人工审核',
        dx: 8,
        dy: 8,
      },
      {
        selector: '.industry-list-grid section:nth-child(1)',
        label: '企业.企业名称 / 主营产品 / 核心技术；关联表=产业链环节_企业',
        dx: 8,
        dy: 8,
      },
      {
        selector: '.industry-list-grid section:nth-child(2)',
        label: '岗位.名称；关联表=产业链环节_岗位',
        dx: 8,
        dy: 8,
      },
      {
        selector: '.industry-suggestion-row',
        label: '产业链环节.发展建议 / 招商机会 / 是否高价值',
        dx: 8,
        dy: 8,
      },
    ]

    document.querySelectorAll('.codex-field-badge,.codex-field-box').forEach((node) => node.remove())
    overlays.forEach((item, index) => {
      const element = document.querySelector(item.selector)
      if (!element) return
      const rect = element.getBoundingClientRect()
      const scrollX = window.scrollX
      const scrollY = window.scrollY

      const box = document.createElement('div')
      box.className = 'codex-field-box'
      box.style.left = `${rect.left + scrollX}px`
      box.style.top = `${rect.top + scrollY}px`
      box.style.width = `${rect.width}px`
      box.style.height = `${rect.height}px`
      document.body.appendChild(box)

      const badge = document.createElement('div')
      badge.className = 'codex-field-badge'
      badge.innerHTML = `<strong>${index + 1}</strong>${item.label}`
      badge.style.left = `${rect.left + scrollX + item.dx}px`
      badge.style.top = `${rect.top + scrollY + item.dy}px`
      document.body.appendChild(badge)
    })
  })
}

try {
  await page.goto(baseUrl, { waitUntil: 'load' })
  await page.waitForSelector('.industry-layout-card', { state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(500)

  await page.screenshot({
    path: path.join(outputDir, '产业链图谱-当前页面.png'),
    fullPage: true,
  })

  await addFieldBadges()
  await page.screenshot({
    path: path.join(outputDir, '产业链图谱-字段映射标注_v3.png'),
    fullPage: true,
  })

  await page.getByRole('button', { name: '桑基图' }).click()
  await page.waitForSelector('.industry-sankey-board', { state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(300)
  await page.addStyleTag({
    content: `
      .codex-sankey-note {
        position: absolute;
        z-index: 2147483647;
        top: 382px;
        left: 340px;
        max-width: 540px;
        padding: 9px 12px;
        border: 2px solid #ff3b30;
        border-radius: 7px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 10px 28px rgba(15,23,42,.22);
        color: #111827;
        font: 700 14px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }
    `,
  })
  await page.evaluate(() => {
    document.querySelectorAll('.codex-field-badge,.codex-field-box,.codex-sankey-note').forEach((node) => node.remove())
    const board = document.querySelector('.industry-sankey-board')
    if (!board) return
    const rect = board.getBoundingClientRect()
    const box = document.createElement('div')
    box.className = 'codex-field-box'
    box.style.left = `${rect.left + window.scrollX}px`
    box.style.top = `${rect.top + window.scrollY}px`
    box.style.width = `${rect.width}px`
    box.style.height = `${rect.height}px`
    document.body.appendChild(box)
    const note = document.createElement('div')
    note.className = 'codex-sankey-note'
    note.textContent = '桑基图需要新增/补充：产业链环节关系.source环节id、target环节id、关系类型、权重value；仅靠“父产业链环节id”不足以表达跨环节流向强度。'
    document.body.appendChild(note)
  })
  await page.screenshot({
    path: path.join(outputDir, '产业链图谱-桑基图关系缺口_v3.png'),
    fullPage: true,
  })

  console.log(outputDir)
} finally {
  await browser.close()
}
