import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const tokens=JSON.parse(await readFile('docs/results-figma-20261117/figma-colors.json','utf8'))
const browser=await chromium.launch({headless:true,channel:'chrome'})
try {
 for(const entry of ['static','vue']) for(const edit of [false,true]) {
  const page=await browser.newPage({viewport:{width:1600,height:1000}})
  const base=entry==='static'?pathToFileURL(resolve('index.html')).href:'http://localhost:5175/index.html'
  await page.goto(`${base}?view=results-portal${edit?'&edit=1':''}`)
  await page.getByRole('button',{name:'产教模型',exact:true}).click()
  await page.locator('.results-portal-shell').evaluate(el=>el.dataset.theme='light')
  // Normalize the original Figma CSS through the same browser, independently of app styles.
  const normalize=async(property,value)=>page.evaluate(({property,value})=>{const el=document.createElement('div');el.style.setProperty(property,value);document.body.append(el);const result=getComputedStyle(el).getPropertyValue(property);el.remove();return result},{property,value})
  const actual=async(selector,property)=>page.locator(selector).first().evaluate((el,p)=>getComputedStyle(el).getPropertyValue(p),property)
  assert.equal(await actual('.im-overview h2','background-image'),await normalize('background-image',tokens.title),'概览标题须使用Figma三色渐变和原色标位置')
  assert.equal(await actual('.im-overview-lead','color'),await normalize('color',tokens.description))
  for(const [index,pseudo] of ['::before','::after'].entries()) {
   const glow=await page.locator('.im-overview').evaluate((el,p)=>{const s=getComputedStyle(el,p);return {color:s.backgroundColor,opacity:s.opacity,filter:s.filter}},pseudo)
   assert.equal(glow.color,await normalize('color',tokens.overviewGlows[index].color))
   assert.equal(Number(glow.opacity),tokens.overviewGlows[index].opacity)
   assert.equal(glow.filter,`blur(${tokens.overviewGlows[index].blur}px)`)
  }
  for(const mode of ['关系图谱','产业列表']) {
   await page.getByRole('button',{name:mode,exact:true}).click()
   if(mode==='关系图谱') {
    assert.equal(await actual('.im-flow-node','background-color'),await normalize('background-color',tokens.relationNode.background))
    for(const [stage,pair] of [['upstream',tokens.link.upstreamMidstream],['midstream',tokens.link.midstreamDownstream]]) {
     const base=`.im-stage-link.stage-${stage}`
     assert.equal(await actual(`${base} .im-link-start`,'stop-color'),await normalize('color',pair[0]))
     assert.equal(await actual(`${base} .im-link-end`,'stop-color'),await normalize('color',pair[1]))
    }
   }
   for(const stage of tokens.stages) {
    const selector=mode==='关系图谱'?`.im-flow-stage.stage-${stage.key}`:`.im-stage-board .stage-${stage.key} header`
    assert.equal(await actual(selector,'background-image'),await normalize('background-image',stage[mode==='关系图谱'?'relationGradient':'listGradient']),`${stage.key}/${mode}:渐变必须匹配原稿`)
    if(mode==='关系图谱')assert.equal(await actual(`${selector} h4`,'color'),await normalize('color',stage.text))
    else assert.equal(await actual(`.im-stage-board .stage-${stage.key}`,'background-color'),await normalize('background-color',stage.listSurface))
   }
  }
  assert.ok(await page.locator('.im-stage-board .industry-treemap-stage').evaluateAll(stages=>stages.every(stage=>[...stage.querySelectorAll('.industry-treemap-node')].every(node=>node.getBoundingClientRect().right<=stage.getBoundingClientRect().right+.5))),'产业卡片不得超出所属阶段列')
  await page.close()
 }
 console.log('Passed 4 dual-entry/view/edit color checks against copied Figma CSS: title gradient, text colors, both graph modes, stage gradients and surfaces.')
} finally {await browser.close()}
