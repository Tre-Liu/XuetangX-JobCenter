import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const output=resolve('docs/results-figma-20261117')
await mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,channel:'chrome'})
const checks=[]
try {
 for (const entry of ['static','vue']) for (const edit of [false,true]) {
  const page=await browser.newPage({viewport:{width:1600,height:1000}}), errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  const url=entry==='static'?pathToFileURL(resolve('index.html')).href:`${process.env.RESULTS_CHECK_URL||'http://localhost:5175'}/index.html`
  await page.goto(`${url}?view=results-portal${edit?'&edit=1':''}`)
  await page.getByRole('button',{name:'产教模型',exact:true}).click()
  const panel=page.locator('results-industry-model');await panel.waitFor()
  const picker=panel.getByRole('combobox',{name:'当前产业链'})
  const options=await picker.locator('option').evaluateAll(els=>els.map(el=>({id:el.value,name:el.textContent})))
  for (const chain of options) {
   await picker.selectOption(chain.id)
   assert.equal(await panel.locator('.im-overview h2').textContent(),chain.name)
   await panel.getByRole('button',{name:'产业列表',exact:true}).click()
   assert.ok(await panel.locator('.industry-treemap-node').count())
   await panel.locator('[data-im-node]').first().click()
   await panel.getByRole('button',{name:'关系图谱',exact:true}).click()
   assert.ok(await panel.locator('.im-industry-sankey foreignObject').count())
  }
  await picker.selectOption(options[0].id)
  const canvas=panel.locator('.im-chain-canvas')
  await panel.locator('.im-scroll').evaluate(el=>el.scrollTop=0)
  const outerBefore=await panel.locator('.im-scroll').evaluate(el=>el.scrollTop)
  await canvas.hover({position:{x:30,y:120}});await page.mouse.wheel(0,20000)
  await page.waitForFunction(()=>document.querySelector('.im-chain-canvas').scrollTop>0)
  await page.mouse.wheel(0,20000)
  assert.ok(await panel.locator('.im-scroll').evaluate(el=>el.scrollTop)>outerBefore,'图谱底部继续滚动应进入下方模块内容')
  assert.equal(await page.evaluate(()=>scrollY),0)
  await canvas.evaluate(el=>el.scrollTop=0)
  await panel.getByRole('searchbox',{name:'搜索岗位'}).fill('不存在的岗位名称')
  assert.equal(await panel.locator('.im-job-list button').count(),0)
  await panel.getByRole('searchbox',{name:'搜索岗位'}).fill('')
  await panel.locator('[data-im-compact]').click()
  assert.ok(await panel.locator('.competency-map-board').innerText())
  if (edit) for(const kind of ['description','data']) {
   await panel.locator(`[data-im-edit="${kind}"]`).click()
   await page.getByRole('dialog').getByRole('button',{name:'取消',exact:true}).click()
  }
  for (const theme of ['light','dark']) for (const size of [{width:1600,height:1000},{width:1280,height:720},{width:768,height:900},{width:390,height:844}]) {
   await page.setViewportSize(size)
   await page.locator('.results-portal-shell').evaluate((el,t)=>el.dataset.theme=t,theme)
   const scroll=panel.locator('.im-scroll');await scroll.evaluate(el=>el.scrollTop=0)
   const box=await scroll.boundingBox();await page.mouse.move(box.x+2,box.y+10);await page.mouse.wheel(0,20000)
   await page.waitForFunction(()=>document.querySelector('.im-scroll').scrollTop>0)
   const layout=await page.evaluate(()=>({top:scrollY,height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,rootOverflow:getComputedStyle(document.documentElement).overflowY,rootOverscroll:getComputedStyle(document.documentElement).overscrollBehaviorY,innerOverscroll:getComputedStyle(document.querySelector('.im-scroll')).overscrollBehaviorY}))
   assert.equal(layout.top,0);assert.equal(layout.height,size.height);assert.equal(layout.width,size.width)
   assert.equal(layout.rootOverflow,'hidden');assert.equal(layout.rootOverscroll,'none');assert.equal(layout.innerOverscroll,'contain')
   await page.mouse.wheel(0,-30000);await page.waitForFunction(()=>document.querySelector('.im-scroll').scrollTop===0)
   if(size.width===1600) {
    const overview=await panel.locator('.im-overview').boundingBox(),chain=await panel.locator('.im-chain').boundingBox()
    assert.equal(Math.round(overview.width),1280);assert.equal(Math.round(chain.height),634);assert.equal(Math.round(chain.y-overview.y-overview.height),16)
    await page.screenshot({path:`${output}/${entry}-${edit?'edit':'view'}-${theme}.png`})
    await panel.getByRole('button',{name:'产业列表',exact:true}).click()
    await page.screenshot({path:`${output}/${entry}-${edit?'edit':'view'}-${theme}-list.png`})
    await panel.getByRole('button',{name:'关系图谱',exact:true}).click()
    await scroll.evaluate(el=>el.scrollTop=el.scrollHeight)
    await page.screenshot({path:`${output}/${entry}-${edit?'edit':'view'}-${theme}-talent.png`})
    await scroll.evaluate(el=>el.scrollTop=0)
   }
   assert.doesNotMatch(await panel.innerText(),/演示|demo|模拟数据|示例数据|测试数据/i)
   checks.push({entry,edit,theme,...size,layout})
  }
  await page.getByRole('button',{name:'首页',exact:true}).click();assert.equal(await page.evaluate(()=>scrollY),0)
  await page.getByRole('button',{name:'产教模型',exact:true}).click();assert.equal(await page.evaluate(()=>scrollY),0)
  assert.deepEqual(errors,[]);await page.close()
 }
 await writeFile(`${output}/checks.json`,JSON.stringify(checks,null,2))
 console.log(`Passed ${checks.length} dual-entry/view/edit/theme/viewport combinations, chain switching, graph modes, search, dialogs, and wheel containment.`)
} finally {await browser.close()}
