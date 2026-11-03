import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const base = process.env.PORTRAIT_CHECK_URL || 'http://localhost:5175'
const out = resolve('docs/portrait-group-filter-20261103')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const results = []
try {
  for (const entry of ['vue', 'static']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const url = entry === 'static' ? pathToFileURL(resolve('index.html')).href : `${base}/index.html`
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${url}?view=job-research&tab=portrait&majorName=${encodeURIComponent('物联网工程专业')}`)
    await page.evaluate(() => {
      const data = INDUSTRY_MAJOR_CHAIN_DATA, major = data.majors.find(m => m.name === '物联网工程' && m.matchStatus === '已匹配')
      localStorage.setItem('major-construction-platform:industry-research', JSON.stringify({ initialized: true,
        officialMajor: { level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code, name: major.name },
        selectedChainIds: data.relations.filter(r => r.majorKey === major.key).map(r => r.chainId) }))
    })
    await page.reload()
    await page.locator('.portrait-group-overview').waitFor()
    await page.waitForFunction(() => !!document.querySelector('industry-business')?.data?.scope)
    assert.equal(await page.locator('[data-group-major-only]').isChecked(), true)
    const related = await page.locator('industry-business').first().evaluate(el => el.data.scope.jobs.length)
    assert.ok(related > 0)
    await page.locator('[data-group-major-only]').uncheck()
    await page.waitForFunction(() => document.querySelector('industry-business').data.majorOnly === false)
    const unrestricted = await page.locator('industry-business').first().evaluate(el => el.data.scope.jobs.length)
    assert.ok(unrestricted > related)
    await page.locator('[data-group-all]').click()
    const chosen = page.locator('.portrait-group-options [data-group-filter]').nth(1)
    const name = await chosen.getAttribute('data-group-filter')
    await chosen.click()
    await page.waitForFunction(name => document.querySelector('industry-business').data.scope.group === name, name)
    const count = await page.locator('industry-business').first().evaluate(el => el.data.scope.groups.find(g => g.name === el.data.scope.group).members.length)
    assert.equal(await page.locator('.portrait-profile-card').count(), Math.min(count, 12))
    assert.equal(await page.locator('.portrait-group-info').count(), 0)
    await page.locator('[data-group-all]').click()
    await page.locator('.portrait-group-options [data-group-filter=""]').click()
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 700 }]) {
      await page.setViewportSize(viewport)
      const box = await page.locator('.job-research-page').boundingBox()
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.wheel(0, 2000)
      await page.waitForFunction(() => document.querySelector('.job-research-page').scrollTop > 0)
      const layout = await page.evaluate(() => ({ root: document.documentElement.scrollTop, body: document.body.scrollTop,
        height: document.documentElement.scrollHeight, viewport: innerHeight,
        width: document.documentElement.scrollWidth, viewportWidth: innerWidth,
        contain: getComputedStyle(document.querySelector('.job-research-page')).overscrollBehaviorY }))
      assert.equal(layout.root, 0); assert.equal(layout.body, 0); assert.equal(layout.height, layout.viewport)
      assert.equal(layout.width, layout.viewportWidth); assert.equal(layout.contain, 'contain')
      await page.mouse.wheel(0, 5000)
      await page.mouse.wheel(0, -10000)
      await page.locator('.job-research-page').evaluate(el => el.scrollTop = 0)
      results.push({ entry, viewport, layout })
    }
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('[data-group-major-only]').check()
    await page.screenshot({ path: `${out}/${entry}-portrait.png` })
    // Switching chain changes the available groups and resets selection, without scrolling the document.
    await page.getByRole('button', { name: '人工智能产业链', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('industry-business')?.data?.scope?.group === '')
    assert.equal(await page.locator('[data-group-major-only]').isChecked(), true)
    await page.getByRole('button', { name: '招聘需求趋势', exact: true }).click()
    assert.equal(await page.evaluate(() => document.documentElement.scrollTop), 0)
    await page.getByRole('button', { name: '岗位画像分析', exact: true }).click()
    await page.locator('.portrait-group-overview').waitFor()
    // A chain-associated major with no local job-major matches must show an explicit empty state.
    await page.evaluate(() => {
      const data = INDUSTRY_MAJOR_CHAIN_DATA
      const major = data.majors.find(m => m.code === '410101' && m.matchStatus === '已匹配')
      if (!major) throw new Error('Missing seed major fixture')
      localStorage.setItem('major-construction-platform:industry-research', JSON.stringify({ initialized: true,
        officialMajor: { level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code, name: major.name },
        selectedChainIds: data.relations.filter(r => r.majorKey === major.key).map(r => r.chainId) }))
    })
    await page.reload(); await page.locator('.portrait-group-overview').waitFor()
    await page.waitForFunction(() => document.querySelector('industry-business')?.data?.scope?.groups.length === 0)
    assert.equal(await page.locator('.portrait-profile-card').count(), 0)
    await page.locator('[data-group-major-only]').uncheck()
    assert.equal(await page.locator('[data-group-major-only]').isChecked(), false)
    assert.ok(await page.locator('.portrait-profile-card').count() > 0)
    assert.deepEqual(errors, [])
    results.push({ entry, related, unrestricted, emptyFallback: true, errors })
    await context.close()
  }
  // Isolated, ephemeral 93-group fixture exercises the production component beyond current local catalog size.
  const page = await browser.newPage({ viewport: { width: 1024, height: 700 } })
  await page.route('**/src/main.ts*', route => route.abort())
  await page.goto(`${base}/index.html`)
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}body{font-family:sans-serif}main{height:100%;overflow:auto;overscroll-behavior:contain;padding:24px;box-sizing:border-box;zoom:.9}</style><main><div style="height:250px"></div><industry-business></industry-business><div style="height:1500px"></div></main>')
  await page.addStyleTag({ content: await readFile('src/industry-domain/business.css', 'utf8') })
  await page.evaluate(() => {
    const panel = document.querySelector('industry-business')
    const jobs = Array.from({ length: 93 }, (_, n) => Array.from({ length: n + 1 }, (_, k) => ({ id: `${n}-${k}`, name: `岗位${n}`, groupName: `岗位群${n}`, chain: '产业链甲', salary: '10K', demand: 1 }))).flat()
    panel.addEventListener('industry-business-action', event => {
      panel.context = { ...panel.data, scope: IndustryDomain.portraitGroupScope(jobs, { chain: '产业链甲', majorOnly: false, group: event.detail.group }) }
    })
    panel.context = { kind: 'group-overview', majorOnly: false, jobs, scope: IndustryDomain.portraitGroupScope(jobs, { chain: '产业链甲', majorOnly: false }) }
  })
  assert.equal(await page.locator('.portrait-group-tabs').count(), 0)
  assert.equal(await page.locator('.portrait-group-options button').count(), 11)
  await page.locator('[data-group-all]').click()
  await page.locator(':popover-open').waitFor()
  const popoverBox = await page.locator(':popover-open').boundingBox()
  const triggerBox = await page.locator('[data-group-all]').boundingBox()
  assert.ok(Math.abs(popoverBox.width - Math.max(triggerBox.width, 400)) < 1)
  assert.ok(Math.abs(popoverBox.x - triggerBox.x) < 1)
  assert.ok(popoverBox.x >= 0 && popoverBox.x + popoverBox.width <= 1024)
  assert.ok(popoverBox.y >= 0 && popoverBox.y + popoverBox.height <= 700)
  assert.ok(Math.abs(popoverBox.y - triggerBox.y - triggerBox.height) < 20, `popover anchor mismatch ${JSON.stringify({ popoverBox, triggerBox })}`)
  await page.locator('[data-group-more]').click()
  assert.equal(await page.locator('.portrait-group-options button').count(), 94)
  const scroller = page.locator('.portrait-group-options')
  await scroller.hover(); await page.mouse.wheel(0, 1000)
  await page.waitForFunction(() => document.querySelector('.portrait-group-options').scrollTop > 0)
  assert.equal(await page.evaluate(() => document.querySelector('main').scrollTop), 0)
  await page.locator('[data-group-search]').fill('岗位群0')
  assert.equal(await page.locator('.portrait-group-options button').count(), 1)
  await page.locator('.portrait-group-options button').click()
  assert.equal(await page.locator(':popover-open').count(), 0)
  assert.equal(await page.locator('[data-group-all]').getAttribute('title'), '岗位群0')
  assert.equal(await page.locator('.portrait-group-info').count(), 0)
  await page.locator('[data-group-all]').click()
  await page.locator('[data-group-search]').fill('岗位群0')
  assert.equal(await page.locator('.portrait-group-options button').count(), 1)
  await page.locator('[data-group-search]').fill('不存在')
  await page.getByText('未找到匹配岗位群', { exact: true }).waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await page.locator(':popover-open').count(), 0)
  await page.locator('[data-group-all]').click()
  await page.mouse.click(10, 600)
  assert.equal(await page.locator(':popover-open').count(), 0)
  await page.locator('[data-group-all]').click()
  await page.screenshot({ path: `${out}/group-picker-fixture.png` })
  results.push({ fixtureGroups: 93, topTen: true, search: true, selectionPinned: true, escape: true, outsideClick: true, containedScroll: true, popoverBox, triggerBox })
  await page.keyboard.press('Escape')
  const food = JSON.parse(await readFile(`${out}/food-chain-picker-fixture.json`, 'utf8'))
  await page.evaluate(jobs => {
    const old = document.querySelector('industry-business'), panel = document.createElement('industry-business')
    panel.context = { kind: 'group-overview', majorOnly: false, jobs, scope: IndustryDomain.portraitGroupScope(jobs, { chain: '食品饮料产业链', majorOnly: false }) }
    old.replaceWith(panel)
  }, food.jobs)
  assert.equal(await page.locator('industry-business').evaluate(el => el.data.scope.groups.length), 93)
  await page.locator('[data-group-all]').click()
  assert.equal(await page.locator('.portrait-group-options button').count(), 11)
  await page.screenshot({ path: `${out}/food-chain-dropdown.png` })
  await page.locator('[data-group-more]').click()
  assert.equal(await page.locator('.portrait-group-options button').count(), 94)
  results.push({ foodChainGroups: 93, foodChainJobs: 892, realNamesLayout: true })
  await writeFile(`${out}/browser-checks.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
} finally { await browser.close() }
