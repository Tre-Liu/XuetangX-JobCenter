import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
const output=resolve('docs/results-industry-editing-20261103')
await mkdir(output,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[]
try{
 for(const entry of ['static','vue']){
  const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  const url=(entry==='static'?pathToFileURL(resolve('index.html')).href:'http://localhost:5193/index.html')+'?view=results-portal&edit=1'
  const enter=async()=>{await page.getByRole('button',{name:'产教模型',exact:true}).click();await page.locator('results-industry-model').waitFor()}
  const open=async kind=>{await page.locator(`[data-im-edit="${kind}"]`).click();await page.getByRole('dialog').waitFor();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.im-editor-overlay')).opacity==='1')}
  const save=async()=>{await page.getByRole('dialog').getByRole('button',{name:'确定',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'})}
  await page.goto(url);await enter()
  const title=await page.locator('.im-overview h2').textContent()
  await open('description');await page.getByRole('dialog').locator('[name=title]').fill('产业链编辑验证');await page.getByRole('dialog').getByRole('button',{name:'取消',exact:true}).click()
  assert.equal(await page.locator('.im-overview h2').textContent(),title)
  await open('description');await page.getByRole('dialog').locator('[name=title]').fill('产业链编辑验证');await page.getByRole('dialog').locator('[name=description]').fill('产业资料整理，待核验。');await save()
  await open('data');await page.locator('[name=label0]').fill('产业环节');await page.locator('[name=value0]').fill('0');await page.locator('[name=unit0]').fill('项');await save()
  assert.equal(await page.locator('.im-overview-metrics > div').first().innerText(),'产业环节\n0项')
  const picker=page.locator('[data-im-chain]'),options=await picker.locator('option').evaluateAll(els=>els.map(e=>e.value))
  await picker.selectOption(options[1]);assert.notEqual(await page.locator('.im-overview h2').textContent(),'产业链编辑验证');await picker.selectOption(options[0])
  assert.equal(await page.locator('.im-overview h2').textContent(),'产业链编辑验证')
  await open('jobs');await page.getByRole('button',{name:'全部取消',exact:true}).click();await save()
  assert.equal(await page.locator('.im-job-list button').count(),0);assert.equal(await page.locator('[data-im-job-count]').textContent(),'0 个');assert.equal(await page.locator('.competency-map-board .competency-job-node').count(),0)
  await page.reload();await enter();assert.equal(await page.locator('.im-job-list button').count(),0)
  assert.equal(await page.locator('.im-overview h2').textContent(),'产业链编辑验证');assert.equal(await page.locator('.im-overview-metrics strong').first().textContent(),'0项')
  await open('jobs');await page.getByRole('searchbox',{name:'搜索可选岗位'}).fill('BIM');assert.ok(await page.locator('.im-job-options input').count()>0)
  const first=page.locator('.im-job-options input').first(),jobId=await first.getAttribute('value');await first.check();await save()
  assert.equal(await page.locator('.im-job-list button').count(),1);assert.equal(await page.locator('.im-job-list button').getAttribute('data-im-job'),jobId)
  await open('words');await page.locator('[name=terms]').fill('BIM\n全新词条\nC++\nBIM');await save()
  await page.waitForFunction(()=>document.querySelectorAll('.im-cloud button').length===3)
  assert.ok(await page.getByRole('button',{name:'全新词条，岗位描述中出现 0 次',exact:true}).count())
  await page.getByRole('button',{name:'全新词条，岗位描述中出现 0 次',exact:true}).click();assert.equal(await page.locator('.im-job-list button').count(),0)
  await page.getByRole('button',{name:'全新词条，岗位描述中出现 0 次',exact:true}).click();assert.equal(await page.locator('.im-job-list button').count(),1)
  await page.reload();await enter();await page.waitForFunction(()=>document.querySelectorAll('.im-cloud button').length===3)
  await open('words');await page.locator('[name=terms]').fill('');await save();assert.equal(await page.locator('.im-cloud button').count(),0)
  for(const viewport of [{width:1600,height:1000},{width:1280,height:720},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(viewport);await open('jobs')
   const dialog=page.getByRole('dialog'),submit=dialog.getByRole('button',{name:'确定',exact:true}),b=await submit.boundingBox()
   assert.ok(b.y>=0&&b.y+b.height<=viewport.height&&b.x>=0&&b.x+b.width<=viewport.width)
   await page.locator('.im-job-options').hover();await page.mouse.wheel(0,3000);await page.mouse.wheel(0,-3000)
   assert.equal(await page.evaluate(()=>scrollY),0)
   await dialog.getByRole('button',{name:'取消',exact:true}).click()
   await page.locator('.im-scroll').evaluate(el=>el.scrollTop=el.scrollHeight)
   await page.mouse.move(viewport.width-5,viewport.height-5);await page.mouse.wheel(0,4000);await page.mouse.wheel(0,-4000)
   const layout=await page.evaluate(()=>({root:document.documentElement.scrollTop,body:document.body.scrollTop,height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,viewport:innerHeight,viewportWidth:innerWidth}))
   assert.equal(layout.root,0);assert.equal(layout.body,0);assert.equal(layout.height,layout.viewport);assert.equal(layout.width,layout.viewportWidth)
   checks.push({entry,viewport,layout})
  }
  await page.setViewportSize({width:1600,height:1000});await page.locator('.im-scroll').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`${output}/${entry}-overview.png`})
  await open('jobs');await page.screenshot({path:`${output}/${entry}-jobs-dialog.png`});await page.keyboard.press('Escape')
  await page.getByRole('button',{name:'首页',exact:true}).click();await enter();assert.equal(await page.locator('.im-job-list button').count(),1)
  assert.doesNotMatch(await page.locator('results-industry-model').innerText(),/演示|demo|模拟数据|示例数据|测试数据/i)
  await page.goto(url.replace('&edit=1',''));await enter();assert.equal(await page.locator('[data-im-edit]').count(),0);assert.equal(await page.locator('.im-overview h2').textContent(),'产业链编辑验证')
  for(const viewport of [{width:1600,height:1000},{width:1280,height:720},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(viewport)
   await page.locator('.im-scroll').evaluate(el=>el.scrollTop=el.scrollHeight)
   assert.ok(await page.locator('.im-scroll').evaluate(el=>el.scrollTop>0))
   await page.mouse.move(viewport.width-5,viewport.height-5);await page.mouse.wheel(0,4000);await page.mouse.wheel(0,-4000)
   assert.equal(await page.evaluate(()=>scrollY),0)
   assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),viewport.height)
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),viewport.width)
   checks.push({entry,view:'published',viewport})
  }
  assert.deepEqual(errors,[])
  await context.close();console.log(`${entry} editing, persistence, cancellation, empty states and viewport checks passed`)
 }
 await writeFile(`${output}/browser-checks.json`,JSON.stringify(checks,null,2))
}finally{await browser.close()}
