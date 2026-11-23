import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
const output=resolve('docs/results-figma-20261117/dialog-themes')
await mkdir(output,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[]
try {
 for(const entry of ['static','vue']) {
  const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'})
  const base=entry==='static'?pathToFileURL(resolve('index.html')).href:'http://localhost:5175/index.html'
  await page.goto(`${base}?view=results-portal&edit=1`)
  await page.getByRole('button',{name:'产教模型',exact:true}).click()
  const shell=page.locator('.results-portal-shell')
  for(const theme of ['dark','light']) for(const size of [{width:1600,height:1000},{width:390,height:844}]) {
   await page.setViewportSize(size)
   await shell.evaluate((el,theme)=>el.dataset.theme=theme,theme)
   for(const kind of ['description','data','jobs','words']) {
    const trigger=page.locator(`[data-im-edit="${kind}"]`)
    await trigger.click()
    const dialog=page.getByRole('dialog')
    await dialog.waitFor()
    const appearance=await dialog.evaluate(el=>({theme:el.closest('.results-settings-overlay').dataset.theme,background:getComputedStyle(el).backgroundColor,fields:[...el.querySelectorAll('input:not([type=checkbox]),textarea,select')].map(input=>getComputedStyle(input).backgroundColor)}))
    assert.equal(appearance.theme,theme,'挂载到body的弹窗必须继承成果页主题')
    assert.equal(appearance.background,theme==='dark'?'rgb(21, 25, 44)':'rgb(255, 255, 255)')
    if(theme==='dark')assert.ok(appearance.fields.every(bg=>bg!=='rgb(255, 255, 255)'),'所有深色表单控件必须避免白底')
    const submit=await dialog.locator('button[type=submit]').boundingBox()
    assert.ok(submit.y>=0&&submit.y+submit.height<=size.height,'主操作须在视口内')
    const bounds=await dialog.boundingBox()
    assert.ok(bounds.x>=0&&bounds.x+bounds.width<=size.width,'弹窗须完整位于视口内')
    const content=dialog.locator('.results-settings-body')
    await content.hover()
    await page.mouse.wheel(0,1200)
    if(await content.evaluate(el=>el.scrollHeight>el.clientHeight))await page.waitForFunction(el=>el.scrollTop>0,await content.elementHandle(),{timeout:3000}).catch(()=>assert.fail(`${entry}/${theme}/${size.width}/${kind}: 长内容须可在弹窗内部滚动`))
    await page.mouse.wheel(0,-1200)
    await content.evaluate(el=>el.scrollTop=0)
    assert.equal(await page.evaluate(()=>scrollY),0)
    if(size.width===1600)await page.screenshot({path:`${output}/${entry}-${theme}-${kind}.png`})
    await shell.evaluate((el,theme)=>el.dataset.theme=theme==='dark'?'light':'dark',theme)
    await page.waitForFunction(theme=>document.querySelector('.results-settings-overlay').dataset.theme!==theme,theme)
    await shell.evaluate((el,theme)=>el.dataset.theme=theme,theme)
    await dialog.getByRole('button',{name:'取消',exact:true}).click()
    assert.ok(await trigger.evaluate(el=>document.activeElement===el))
    checks.push({entry,theme,size,kind})
   }
  }
  for(const kind of ['navigation','style','modules']) {
   await page.setViewportSize({width:1600,height:1000})
   await shell.evaluate(el=>el.dataset.theme='dark')
   await page.locator(`[data-results-edit="${kind}"]`).click()
   assert.equal(await page.getByRole('dialog').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(21, 25, 44)','共用设置弹窗也须使用深色主题')
   if(kind==='style')assert.ok(await page.getByRole('dialog').evaluate(el=>[...el.querySelectorAll('input:not([type=file]):not([type=radio]),textarea,select')].every(input=>getComputedStyle(input).backgroundColor!=='rgb(255, 255, 255)')))
   await page.getByRole('dialog').getByRole('button',{name:'取消',exact:true}).click()
  }
  await page.close()
 }
 await writeFile(`${output}/checks.json`,JSON.stringify(checks,null,2))
 console.log(`Passed ${checks.length} industry dialog entry/theme/viewport checks plus 6 shared settings dialogs, live theme changes, focus return and visible actions.`)
} finally {await browser.close()}
