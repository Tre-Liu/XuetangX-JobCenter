import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const browser=await chromium.launch({headless:true,channel:'chrome'})
try {
 for(const entry of ['static','vue']) for(const edit of [false,true]) for(const size of [{width:1600,height:1000},{width:1800,height:1000}]) {
  const page=await browser.newPage({viewport:size})
  const base=entry==='static'?pathToFileURL(resolve('index.html')).href:'http://localhost:5175/index.html'
  await page.goto(`${base}?view=results-portal${edit?'&edit=1':''}`)
  await page.getByRole('button',{name:'产教模型',exact:true}).click()
  const outer=page.locator('.im-scroll'),canvas=page.locator('.im-chain-canvas')
  for(const mode of ['关系图谱','产业列表']) {
   await page.getByRole('button',{name:mode,exact:true}).click()
   await outer.evaluate(el=>el.scrollTop=0)
   await canvas.evaluate(el=>el.scrollTop=el.scrollHeight)
   const box=await canvas.boundingBox()
   await page.mouse.move(box.x+box.width/2,Math.min(box.y+100,size.height-40))
   await page.mouse.wheel(0,400)
   await page.waitForFunction(()=>document.querySelector('.im-scroll').scrollTop>0,null,{timeout:1200}).catch(()=>assert.fail(`${entry}/${edit}/${size.width}/${mode}: 在图谱底部继续向下滚动必须能前往岗位区`))
   assert.equal(await page.evaluate(()=>scrollY),0)
   await outer.evaluate(el=>el.scrollTop=200)
   await canvas.evaluate(el=>el.scrollTop=0)
   const next=await canvas.boundingBox()
   await page.mouse.move(next.x+next.width/2,Math.max(150,next.y+100))
   await page.mouse.wheel(0,-400)
   await page.waitForFunction(()=>document.querySelector('.im-scroll').scrollTop<200,null,{timeout:1200})
   assert.equal(await page.evaluate(()=>scrollY),0)
  }
  await page.close()
 }
 console.log('Passed 8 entry/edit/viewport combinations: graph and list boundaries continue module scrolling in both directions; document stays fixed.')
} finally {await browser.close()}
