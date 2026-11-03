import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const out = resolve('docs/results-industry-model-20261103/fixed-canvas')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const checks = []
try {
  for (const entry of ['static', 'vue']) for (const edit of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    const url = entry === 'static' ? pathToFileURL(resolve('index.html')).href : `${process.env.RESULTS_CHECK_URL || 'http://localhost:5175'}/index.html`
    await page.goto(`${url}?view=results-portal${edit ? '&edit=1' : ''}`)
    await page.getByRole('button', { name: '产教模型', exact: true }).click()
    const panel = page.locator('results-industry-model')
    await panel.waitFor()
    const chains = await panel.locator('[data-im-chain] option').evaluateAll(els => els.map(e => e.value))
    for (const chain of chains) {
      await panel.locator('[data-im-chain]').selectOption(chain)
      assert.ok(await panel.locator('.industry-treemap-node').count() >= 12, '每条产业链应有足够的细分节点供画布浏览')
      for (const stage of ['upstream', 'midstream', 'downstream']) assert.ok(await panel.locator(`.stage-${stage} .industry-treemap-node`).count() > 0)
      await panel.locator('[data-im-mode="sankey"]').click()
      const visibleNodes = await panel.locator('.im-industry-sankey').evaluate(svg => {
        const height = svg.viewBox.baseVal.height
        return [...svg.querySelectorAll('foreignObject')].every(n => n.y.baseVal.value + n.height.baseVal.value <= height)
      })
      assert.ok(visibleNodes, '桑基图必须完整容纳新增节点')
      await panel.locator('[data-im-mode="treemap"]').click()
    }
    await panel.locator('[data-im-chain]').selectOption(chains[0])
    for (const viewport of [{ width: 1600, height: 1000 }, { width: 1280, height: 720 }, { width: 768, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport)
      await panel.locator('.im-scroll').evaluate(el => el.scrollTop = 0)
      const canvas = panel.locator('.im-chain-canvas')
      await canvas.scrollIntoViewIfNeeded()
      const dimensions = await canvas.evaluate(el => ({ height: el.clientHeight, full: el.scrollHeight, contain: getComputedStyle(el).overscrollBehaviorY }))
      assert.ok(dimensions.height > 150 && dimensions.height < viewport.height, '画布必须定高且可操作')
      assert.ok(dimensions.full > dimensions.height, '新增节点应在画布内部形成纵向滚动')
      assert.equal(dimensions.contain, 'contain')
      assert.ok(await panel.locator('.industry-treemap-node > strong').evaluateAll(nodes => nodes.every(n => n.scrollHeight <= n.clientHeight + 1)), '长节点名称须完整换行显示')
      await canvas.evaluate(el => el.scrollTop = 0)
      const outer = await panel.locator('.im-scroll').evaluate(el => el.scrollTop)
      await canvas.hover({ position: { x: 30, y: 120 } })
      await page.mouse.wheel(0, 20000)
      await page.waitForFunction(() => document.querySelector('.im-chain-canvas').scrollTop > 0)
      await page.mouse.wheel(0, 20000)
      await page.waitForTimeout(100)
      assert.equal(await panel.locator('.im-scroll').evaluate(el => el.scrollTop), outer, '画布边缘滚动不得传递到外层')
      assert.equal(await canvas.evaluate(el => el.clientHeight), dimensions.height)
      await page.mouse.wheel(0, -20000)
      await page.waitForFunction(() => document.querySelector('.im-chain-canvas').scrollTop === 0)
      await page.mouse.wheel(0, -20000)
      await page.waitForTimeout(100)
      assert.equal(await panel.locator('.im-scroll').evaluate(el => el.scrollTop), outer)
      for (const theme of ['dark', 'light']) {
        await page.locator('.results-portal-shell').evaluate((el, theme) => el.dataset.theme = theme, theme)
        await page.mouse.move(0, 0)
        const node = panel.locator('.industry-treemap-node').first()
        const appearance = el => {
          const s = getComputedStyle(el)
          return [s.backgroundColor, s.borderColor, s.boxShadow, s.filter, s.transform]
        }
        const before = await node.evaluate(appearance)
        await node.hover()
        await page.waitForTimeout(250)
        assert.deepEqual(await node.evaluate(appearance), before, '矩形节点 hover 不得变亮或变形')
      }
      const root = await page.evaluate(() => ({ y: scrollY, height: document.documentElement.scrollHeight, viewport: innerHeight, width: document.documentElement.scrollWidth, viewportWidth: innerWidth }))
      assert.equal(root.y, 0); assert.equal(root.height, root.viewport); assert.equal(root.width, root.viewportWidth)
      checks.push({ entry, edit, viewport, dimensions, root })
    }
    await page.setViewportSize({ width: 1600, height: 1000 })
    await panel.locator('.im-scroll').evaluate(el => el.scrollTop = 0)
    await page.locator('.results-portal-shell').evaluate(el => el.dataset.theme = 'dark')
    await page.screenshot({ path: `${out}/${entry}-${edit ? 'edit' : 'view'}.png` })
    await page.getByRole('button', { name: '首页', exact: true }).click()
    await page.getByRole('button', { name: '产教模型', exact: true }).click()
    assert.equal(await page.evaluate(() => scrollY), 0)
    assert.doesNotMatch(await panel.innerText(), /演示|demo|模拟数据|示例数据|测试数据/i)
    assert.deepEqual(errors, [])
    await page.close()
  }
  await writeFile(`${out}/checks.json`, JSON.stringify(checks, null, 2))
  console.log(`定高画布检查通过：${checks.length} 项双入口/查看编辑/视口组合，含节点数量、内部滚动、边缘隔离、hover 与桑基图完整性。`)
} finally { await browser.close() }
