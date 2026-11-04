import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

const output=resolve('docs/results-term-controls-20261104')
await mkdir(output,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[]
try{
 for(const entry of ['static','vue']){
  const context=await browser.newContext({viewport:{width:1600,height:1000}})
  const page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  const url=(entry==='static'?pathToFileURL(resolve('index.html')).href:'http://localhost:5195/index.html')+'?view=results-portal&edit=1'
  const enter=async()=>{await page.getByRole('button',{name:'产教模型',exact:true}).click();await page.locator('results-industry-model').waitFor()}
  const open=async()=>{await page.locator('[data-im-edit=words]').click();await dialog.waitFor()}
  const dialog=page.getByRole('dialog'),rows=dialog.locator('.im-term-row')
  const save=async()=>{await dialog.getByRole('button',{name:'确定',exact:true}).click();await dialog.waitFor({state:'detached'})}
  const cancel=async()=>{await dialog.getByRole('button',{name:'取消',exact:true}).click();await dialog.waitFor({state:'detached'})}
  const clear=async()=>{while(await rows.count())await dialog.locator('[data-delete-term]').first().click()}
  const entries=()=>rows.evaluateAll(elements=>elements.map(el=>({name:el.querySelector('input').value,type:el.querySelector('select').value})))
  const cloud=()=>page.locator('.im-cloud button').evaluateAll(elements=>elements.map(el=>({name:el.textContent.trim(),size:parseFloat(el.style.getPropertyValue('--word-size')),label:el.getAttribute('aria-label')})))
  await page.goto(url);await enter();await open()
  assert.deepEqual(await dialog.locator('.im-term-actions button').allTextContents(),['初始化','新增词条'])
  assert.deepEqual(await dialog.locator('footer button').allTextContents(),['取消','确定'])
  assert.equal(await dialog.locator('textarea').count(),0)
  const defaults=await entries();assert.ok(defaults.length>3)
  assert.deepEqual(await rows.first().locator('select option').allTextContents(),['大','中','小'])
  await clear()
  for(const [name,type] of [['BIM','small'],['C++','large'],['无人机','medium']]){
   await dialog.getByRole('button',{name:'新增词条',exact:true}).click()
   await rows.last().locator('input').fill(name);await rows.last().locator('select').selectOption(type)
  }
  await save();await page.locator('.im-cloud button').first().waitFor({state:'attached'})
  const custom=await cloud(),size=name=>custom.find(w=>w.name===name).size
  assert.ok(size('C++')>size('无人机')&&size('无人机')>size('BIM'))
  assert.ok(custom.every(w=>/岗位描述中出现 \d+ 次/.test(w.label)))
  const expected=[{name:'BIM',type:'small'},{name:'C++',type:'large'},{name:'无人机',type:'medium'}]
  await page.reload();await enter();await open();assert.deepEqual(await entries(),expected)
  await dialog.getByRole('button',{name:'初始化',exact:true}).click();assert.deepEqual(await entries(),defaults);await cancel()
  await open();assert.deepEqual(await entries(),expected)
  await rows.nth(1).locator('input').fill('BIM');await dialog.getByRole('button',{name:'确定',exact:true}).click()
  assert.equal(await dialog.locator('[role=alert]').textContent(),'词条名称不能重复')
  await rows.nth(1).locator('input').fill('C++')
  await rows.nth(1).locator('[data-delete-term]').click()
  assert.equal(await rows.nth(1).locator('select').getAttribute('aria-label'),'词条 2 类型')
  await rows.nth(1).locator('select').selectOption('large');await save()
  await open();assert.deepEqual(await entries(),[{name:'BIM',type:'small'},{name:'无人机',type:'large'}]);await clear();await save()
  assert.equal(await page.locator('.im-cloud button').count(),0)
  await page.reload();await enter();await open();assert.equal(await rows.count(),0)
  await dialog.getByRole('button',{name:'初始化',exact:true}).click();await save()
  await page.reload();await enter();await open();assert.deepEqual(await entries(),defaults)
  while(await rows.count()<24){await dialog.getByRole('button',{name:'新增词条',exact:true}).click();await rows.last().locator('input').fill(`配置项${await rows.count()}`)}
  assert.equal(await dialog.getByRole('button',{name:'新增词条',exact:true}).isDisabled(),true)
  await cancel()
  for(const viewport of [{width:1600,height:1000},{width:1280,height:720},{width:768,height:900},{width:390,height:844}]){
   console.log(entry,viewport)
   await page.setViewportSize(viewport);await open()
   for(const name of ['初始化','新增词条','确定','取消']){
    const box=await dialog.getByRole('button',{name,exact:true}).boundingBox()
    assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width&&box.y+box.height<=viewport.height,`${entry} ${viewport.width} ${name} visible`)
   }
   await dialog.locator('.results-settings-body').hover();await page.mouse.wheel(0,3000)
   await page.waitForFunction(()=>document.querySelector('.im-editor-dialog .results-settings-body').scrollTop>0)
   for(const name of ['初始化','新增词条']){
    const box=await dialog.getByRole('button',{name,exact:true}).boundingBox()
    const frame=await dialog.boundingBox()
    assert.ok(box.y>=frame.y&&box.y+box.height<frame.y+frame.height,`${name} remains visible when scrolling`)
   }
   await page.mouse.wheel(0,3000);await page.mouse.wheel(0,-6000)
   assert.equal(await page.evaluate(()=>scrollY),0)
   await dialog.getByRole('button',{name:'确定',exact:true}).focus();await page.keyboard.press('Tab')
   assert.equal(await dialog.getByRole('button',{name:'关闭设置',exact:true}).evaluate(el=>el===document.activeElement),true)
   await page.screenshot({path:`${output}/${entry}-${viewport.width}.png`});await cancel()
   await page.locator('.im-scroll').evaluate(el=>el.scrollTop=el.scrollHeight)
   await page.mouse.move(viewport.width-5,viewport.height-5);await page.mouse.wheel(0,4000);await page.mouse.wheel(0,-4000)
   const layout=await page.evaluate(()=>({root:document.documentElement.scrollTop,body:document.body.scrollTop,height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,overscroll:getComputedStyle(document.documentElement).overscrollBehavior}))
   assert.deepEqual(layout,{root:0,body:0,height:viewport.height,width:viewport.width,overscroll:'none'})
   await page.getByRole('button',{name:'首页',exact:true}).click();await enter()
   assert.equal(await page.evaluate(()=>scrollY),0)
   checks.push({entry,viewport,layout})
  }
  assert.doesNotMatch(await page.locator('results-industry-model').innerText(),/演示|demo|模拟数据|示例数据|测试数据/i)
  await page.goto(url.replace('&edit=1',''));await enter()
  assert.equal(await page.locator('[data-im-edit]').count(),0)
  for(const viewport of [{width:1600,height:1000},{width:1280,height:720},{width:768,height:900},{width:390,height:844}]){
   await page.setViewportSize(viewport)
   await page.locator('.im-scroll').evaluate(el=>el.scrollTop=el.scrollHeight)
   await page.mouse.move(viewport.width-5,viewport.height-5);await page.mouse.wheel(0,5000);await page.mouse.wheel(0,-5000)
   assert.equal(await page.evaluate(()=>scrollY),0)
   await page.getByRole('button',{name:'首页',exact:true}).click();await enter()
   assert.equal(await page.evaluate(()=>scrollY),0)
   checks.push({entry,edit:false,viewport})
  }
  assert.deepEqual(errors,[])
  await context.close();console.log(`${entry}: term types, persistence, initialization, cancellation, validation, empty state and viewport checks passed`)
 }
 await writeFile(`${output}/browser-checks.json`,JSON.stringify(checks,null,2))
}finally{await browser.close()}
