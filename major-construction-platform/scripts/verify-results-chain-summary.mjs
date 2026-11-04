import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const base = process.env.RESULTS_CHECK_URL || 'http://localhost:5175'
const out = resolve('docs/results-industry-model-20261103/chain-summary')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const results = []
try {
  for (const entry of ['static', 'vue']) {
    for (const edit of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
      const errors = []
      page.on('pageerror', e => errors.push(e.message))
      const url = entry === 'static' ? pathToFileURL(resolve('index.html')).href : `${base}/index.html`
      await page.goto(`${url}?view=results-portal${edit ? '&edit=1' : ''}`)
      await page.getByRole('button', { name: '产教模型', exact: true }).click()
      const panel = page.locator('results-industry-model')
      await panel.waitFor()
      const picker = panel.getByRole('combobox', { name: '当前产业链' })
      assert.equal(await picker.count(), 1, '多产业链必须提供可访问的切换入口')
      assert.equal(await picker.locator('option').count(), 3)
      const chains = await picker.locator('option').evaluateAll(options => options.map(o => ({ id: o.value, name: o.textContent })))
      const nodeSets = []
      for (const chain of chains) {
        await picker.selectOption(chain.id)
        assert.equal(await panel.locator('.im-overview h2').textContent(), chain.name)
        const before = await panel.locator('.im-overview').innerHTML()
        nodeSets.push(await panel.locator('[data-im-node]').evaluateAll(nodes => nodes.map(n => n.dataset.imNode).sort().join(',')))
        await panel.locator('[data-im-node]').first().click()
        assert.equal(await panel.locator('.im-overview').innerHTML(), before, '点击产业节点不得替换产业链描述与数据')
        await panel.locator('[data-im-mode="sankey"]').click()
        await panel.locator('[data-im-node]').last().click()
        assert.equal(await panel.locator('.im-overview').innerHTML(), before)
        await panel.locator('[data-im-mode="treemap"]').click()
      }
      assert.equal(new Set(nodeSets).size, 3, '切换后图谱须展示对应产业链的数据范围')
      for (const theme of ['dark', 'light']) {
        await page.locator('.results-portal-shell').evaluate((el, theme) => el.dataset.theme = theme, theme)
        for (const viewport of [{ width: 1600, height: 1000 }, { width: 1280, height: 720 }, { width: 768, height: 900 }, { width: 390, height: 844 }]) {
          await page.setViewportSize(viewport)
          const scroll = panel.locator('.im-scroll')
          await scroll.evaluate(el => el.scrollTop = 0)
          const pickerBox = await picker.boundingBox()
          assert.ok(pickerBox.x >= 0 && pickerBox.x + pickerBox.width <= viewport.width && pickerBox.y + pickerBox.height <= viewport.height)
          // Wheel over the module gutter; the nested graph intentionally contains its own wheel events.
          await scroll.hover({ position: { x: 2, y: 20 } })
          await page.mouse.wheel(0, 12000)
          await page.waitForFunction(() => document.querySelector('.im-scroll').scrollTop > 0, null, { timeout: 3000 }).catch(async error => {
            console.log({ entry, edit, theme, viewport, scroll: await panel.evaluate(el => [...el.querySelectorAll('.im-scroll,.im-chain-canvas')].map(n => ({ className: n.className, top: n.scrollTop, height: n.clientHeight, full: n.scrollHeight }))) })
            await page.screenshot({ path: `${out}/scroll-diagnostic.png` })
            throw error
          })
          await page.waitForTimeout(100)
          const layout = await page.evaluate(() => ({
            root: document.documentElement.scrollTop, body: document.body.scrollTop,
            height: document.documentElement.scrollHeight, viewport: innerHeight,
            width: document.documentElement.scrollWidth, viewportWidth: innerWidth,
            contain: getComputedStyle(document.querySelector('.im-scroll')).overscrollBehaviorY
          }))
          assert.equal(layout.root, 0); assert.equal(layout.body, 0)
          assert.equal(layout.height, layout.viewport); assert.equal(layout.width, layout.viewportWidth)
          assert.equal(layout.contain, 'contain')
          await page.mouse.wheel(0, 16000)
          await page.mouse.wheel(0, -24000)
          await scroll.evaluate(el => el.scrollTop = 0)
          if (viewport.width === 1600) await page.screenshot({ path: `${out}/${entry}-${edit ? 'edit' : 'view'}-${theme}.png` })
          if (viewport.width === 390 && theme === 'dark') await page.screenshot({ path: `${out}/${entry}-${edit ? 'edit' : 'view'}-mobile.png` })
          results.push({ entry, edit, theme, viewport, layout })
        }
      }
      await page.getByRole('button', { name: '首页', exact: true }).click()
      await page.getByRole('button', { name: '产教模型', exact: true }).click()
      assert.equal(await picker.count(), 1)
      assert.equal(await page.evaluate(() => document.documentElement.scrollTop), 0)
      const text = await panel.innerText()
      assert.doesNotMatch(text, /演示|demo|模拟数据|示例数据|测试数据|无演示样本/i)
      assert.deepEqual(errors, [])
      await page.close()
    }
  }
  // Single-chain and empty archives use the same live component, without dummy options.
  const page = await browser.newPage()
  await page.goto(`${pathToFileURL(resolve('index.html')).href}?view=results-portal`)
  await page.getByRole('button', { name: '产教模型', exact: true }).click()
  for (const count of [1, 0]) {
    await page.evaluate(count => {
      const old = document.querySelector('results-industry-model')
      const el = document.createElement('results-industry-model')
      const config = count ? { ...ResultsIndustryData, chains: ResultsIndustryData.chains.slice(0, 1) } : {}
      el.setAttribute('config', JSON.stringify(config)); old.replaceWith(el)
    }, count)
    assert.equal(await page.locator('[data-im-chain]').count(), 0)
    if (!count) {
      assert.equal(await page.locator('.im-overview h2').textContent(), '产业链概览')
      assert.deepEqual(await page.locator('.im-overview-metrics strong').allTextContents(), ['0个', '0家', '0个', '0个'])
      assert.equal(await page.locator('.im-chain-canvas').textContent(), '暂无产业链资料')
    }
  }
  await page.close()
  await writeFile(`${out}/browser-checks.json`, JSON.stringify(results, null, 2))
  console.log(`产业链概览与切换检查通过：${results.length} 项视口/模式/主题组合，双入口、单链与空档案。`)
} finally {
  await browser.close()
}
