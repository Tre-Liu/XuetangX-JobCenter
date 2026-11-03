import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'chrome',headless:true})
const report=[]
try {
for(const entry of ['static','vue']) {
  const context=await browser.newContext()
  const page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  for(const edit of [false,true]) {
    await page.setViewportSize({width:1744,height:1000})
    console.log('入口',entry,'编辑',edit)
    await page.goto(`${entry==='static'?pathToFileURL(resolve('index.html')).href:'http://localhost:5187/index.html'}?view=results-portal${edit?'&edit=1':''}`)
    await page.locator('.results-portal-nav button').filter({hasText:/^产教模型$/}).click()
    await page.waitForSelector('.im-cloud button')
    for(const [width,height] of [[1744,1000],[1280,720],[768,900],[390,844]]) {
      console.log('窗口',width,height)
      await page.setViewportSize({width,height})
      await page.locator('.im-talent-section').evaluate(e=>e.scrollIntoView({block:'start'}))
      await page.waitForTimeout(350)
      const metrics=await page.evaluate(()=>{
        const cloud=document.querySelector('.im-cloud'),r=cloud.getBoundingClientRect()
        const words=[...cloud.querySelectorAll('button')].map(b=>{const z=b.getBoundingClientRect();return {name:b.textContent,size:parseFloat(getComputedStyle(b).fontSize),x:z.x-r.x,y:z.y-r.y,width:z.width,height:z.height}})
        return {words,width:r.width,height:r.height,scrollY,root:document.documentElement.scrollHeight,viewport:innerHeight,removed:document.querySelectorAll('.im-word-note,[data-im-reset-word],.im-keywords .im-caption,.im-keywords .im-basis').length}
      })
      assert.equal(metrics.removed,0)
      assert.equal(metrics.scrollY,0)
      assert.ok(metrics.root<=height+1)
      assert.ok(metrics.words.length>3)
      assert.ok(Math.max(...metrics.words.map(w=>w.size))/Math.min(...metrics.words.map(w=>w.size))>1.8)
      for(const w of metrics.words) assert.ok(w.x>=-.1&&w.y>=-.1&&w.x+w.width<=metrics.width+.1&&w.y+w.height<=metrics.height+.1)
      for(const [i,w] of metrics.words.entries())for(const o of metrics.words.slice(i+1))assert.ok(w.x+w.width<=o.x+.1||o.x+o.width<=w.x+.1||w.y+w.height<=o.y+.1||o.y+o.height<=w.y+.1)
      await page.mouse.move(width-25,height-60);await page.mouse.wheel(0,1800);await page.mouse.wheel(0,-1800)
      assert.equal(await page.evaluate(()=>scrollY),0)
      if(width===1744&&!edit)await page.screenshot({path:`docs/results-industry-model-20261103/word-cloud/${entry}.png`})
      report.push({entry,edit,width,height,...metrics})
    }
    await page.locator('.im-cloud button').first().evaluate(e=>e.click())
    assert.equal(await page.locator('.im-cloud [aria-pressed=true]').count(),1)
    await page.locator('.im-cloud [aria-pressed=true]').evaluate(e=>e.click())
    assert.equal(await page.locator('.im-job-list button').count(),24)
    await page.locator('.results-portal-nav button').filter({hasText:/^首页$/}).click()
    await page.locator('.results-portal-nav button').filter({hasText:/^产教模型$/}).click()
    await page.waitForSelector('.im-cloud button')
    assert.equal(await page.evaluate(()=>scrollY),0)
  }
  assert.deepEqual(errors,[])
  await context.close()
}
await writeFile('docs/results-industry-model-20261103/word-cloud/browser-checks.json',JSON.stringify(report,null,2))
console.log(`词云双入口、查看/编辑、四种窗口共 ${report.length} 组检查通过`)
}finally{await browser.close()}
