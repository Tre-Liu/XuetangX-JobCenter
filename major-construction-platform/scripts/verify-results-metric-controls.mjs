import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

const output=resolve('docs/results-metric-controls-20261104')
await mkdir(output,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[]
try{
 for(const entry of ['static','vue']){
  const context=await browser.newContext({viewport:{width:1600,height:1000}})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  const url=(entry==='static'?pathToFileURL(resolve('index.html')).href:'http://localhost:5193/index.html')+'?view=results-portal&edit=1'
  const enter=async()=>{await page.getByRole('button',{name:'产教模型',exact:true}).click();await page.locator('results-industry-model').waitFor()}
  const open=async()=>{await page.locator('[data-im-edit=data]').click();await page.getByRole('dialog').waitFor();await page.waitForFunction(()=>getComputedStyle(document.querySelector('.im-editor-overlay')).opacity==='1')}
  const dialog=page.getByRole('dialog'),rows=dialog.locator('fieldset')
  const save=async()=>{await dialog.getByRole('button',{name:'确定',exact:true}).click();await dialog.waitFor({state:'detached'})}
  const cancel=async()=>{await dialog.getByRole('button',{name:'取消',exact:true}).click();await dialog.waitFor({state:'detached'})}
  const clear=async()=>{while(await rows.count())await dialog.locator('[data-delete-metric]').first().click()}
  const metrics=()=>page.locator('.im-overview-metrics > div').allTextContents()
  await page.goto(url);await enter()
  const defaults=await metrics();assert.equal(defaults.length,4)
  await open();await clear()
  assert.equal(await dialog.getByRole('button',{name:'添加',exact:true}).count(),1,'删空后仍有添加入口')
  assert.equal(await dialog.getByRole('button',{name:'初始化',exact:true}).count(),1)
  await save();assert.equal((await metrics()).length,0)
  await page.reload();await enter();assert.equal((await metrics()).length,0)
  await open();await page.screenshot({path:`${output}/${entry}-empty.png`})
  for(let i=0;i<4;i++){
   await dialog.getByRole('button',{name:'添加',exact:true}).click()
   assert.equal(await rows.count(),i+1)
   assert.equal(await rows.nth(i).locator('input').first().evaluate(el=>el===document.activeElement),true)
   await rows.nth(i).locator('input').nth(0).fill(`自定统计${i+1}`)
   await rows.nth(i).locator('input').nth(1).fill(String(i))
   await rows.nth(i).locator('input').nth(2).fill('项')
  }
  assert.equal(await dialog.getByRole('button',{name:'添加',exact:true}).isDisabled(),true)
  await dialog.locator('[data-delete-metric]').nth(1).click()
  assert.equal(await dialog.getByRole('button',{name:'添加',exact:true}).isEnabled(),true)
  await dialog.getByRole('button',{name:'添加',exact:true}).click()
  await rows.nth(3).locator('input').nth(0).fill('新增统计')
  await rows.nth(3).locator('input').nth(1).fill('99')
  await rows.nth(3).locator('input').nth(2).fill('家')
  await save()
  const custom=await metrics()
  assert.deepEqual(custom,['自定统计10项','自定统计32项','自定统计43项','新增统计99家'])
  await page.reload();await enter();assert.deepEqual(await metrics(),custom)
  await open();await dialog.getByRole('button',{name:'初始化',exact:true}).click();assert.equal(await rows.count(),4);await cancel()
  assert.deepEqual(await metrics(),custom)
  await open();await clear();await dialog.getByRole('button',{name:'初始化',exact:true}).click();await save()
  assert.deepEqual(await metrics(),defaults)
  const picker=page.locator('[data-im-chain]'),options=await picker.locator('option').evaluateAll(els=>els.map(el=>el.value))
  await picker.selectOption(options[1]);const otherDefaults=await metrics()
  await open();await clear();await dialog.getByRole('button',{name:'初始化',exact:true}).click();await save()
  assert.deepEqual(await metrics(),otherDefaults)
  await picker.selectOption(options[0]);assert.deepEqual(await metrics(),defaults)
  for(const viewport of [{width:1600,height:1000},{width:1280,height:720},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(viewport);await open()
   for(const name of ['初始化','添加','确定','取消']){
    const box=await dialog.getByRole('button',{name,exact:true}).boundingBox()
    assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width&&box.y+box.height<=viewport.height)
   }
   await dialog.locator('.results-settings-body').hover();await page.mouse.wheel(0,3000);await page.mouse.wheel(0,-3000)
   assert.equal(await page.evaluate(()=>scrollY),0)
   await page.screenshot({path:`${output}/${entry}-${viewport.width}.png`});await cancel()
   await page.locator('.im-scroll').evaluate(el=>el.scrollTop=el.scrollHeight)
   assert.ok(await page.locator('.im-scroll').evaluate(el=>el.scrollTop>0))
   await page.mouse.move(viewport.width-5,viewport.height-5);await page.mouse.wheel(0,4000);await page.mouse.wheel(0,-4000)
   const layout=await page.evaluate(()=>({root:document.documentElement.scrollTop,body:document.body.scrollTop,height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth}))
   assert.deepEqual(layout,{root:0,body:0,height:viewport.height,width:viewport.width})
   checks.push({entry,viewport,layout})
  }
  assert.doesNotMatch(await page.locator('results-industry-model').innerText(),/演示|demo|模拟数据|示例数据|测试数据/i)
  assert.deepEqual(errors,[])
  await context.close();console.log(`${entry}: metric recovery, add limit, cancellation, persistence, chain isolation and viewport checks passed`)
 }
 await writeFile(`${output}/browser-checks.json`,JSON.stringify(checks,null,2))
}finally{await browser.close()}
