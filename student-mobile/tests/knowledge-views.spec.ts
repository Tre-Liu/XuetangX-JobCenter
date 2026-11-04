import {expect,test,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';

async function openGraph(page:Page){
 await page.goto('/');
 await page.getByRole('button',{name:'更多',exact:true}).click();
 await page.getByRole('button',{name:'图谱',exact:true}).click();
}
async function chooseMode(page:Page,name:string){
 await page.getByRole('button',{name:/切换知识图谱视图，当前/}).click();
 await page.getByRole('menuitemradio',{name,exact:true}).click();
 await expect(page.getByRole('menu',{name:'知识图谱视图'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:`切换知识图谱视图，当前${name}`})).toBeVisible();
}
test('four views switch, locate the same descendant and preserve expanded branches',async({page})=>{
 test.setTimeout(60_000);
 await openGraph(page);
 for(const [index,name] of ['树状视图','网状视图','环状视图','自定义视图'].entries()){
  await chooseMode(page,name);
  const canvas=page.getByRole('img',{name:new RegExp(`知识图谱，${name}`)});
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('aria-label',new RegExp(`当前显示${index===0?9:12}个节点`));
  await page.getByRole('button',{name:'打开知识点目录'}).click();
  await page.getByRole('textbox',{name:'搜索知识点名称'}).fill('戴维南定理的应用');
  await page.getByRole('button',{name:'查看戴维南定理的应用',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'戴维南定理的应用',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'关闭详情'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const box=(await canvas.boundingBox())!;
  // Directory location centres the same node in every layout; the canvas hit area must follow it.
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  await expect(page.getByRole('dialog',{name:'戴维南定理的应用',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'关闭详情'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
 }
});
test('view selection dismisses without changing mode and root scrolling stays locked',async({page})=>{
 await page.setViewportSize({width:390,height:740});
 await openGraph(page);
 await page.getByRole('button',{name:/切换知识图谱视图，当前/}).click();
 const menu=page.getByRole('menu',{name:'知识图谱视图'});
 await expect(menu).toBeVisible();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByTestId('sheet-overlay')).toHaveCount(0);
 const triggerBox=(await page.getByRole('button',{name:/切换知识图谱视图，当前/}).boundingBox())!;
 const menuBox=(await menu.boundingBox())!;
 expect(menuBox.y).toBeGreaterThanOrEqual(triggerBox.y+triggerBox.height);
 expect(menuBox.y-triggerBox.y-triggerBox.height).toBeLessThan(12);
 expect(Math.abs(menuBox.x-triggerBox.x)).toBeLessThan(2);
 await expect(page.getByRole('menuitemradio',{name:'自定义视图',exact:true})).toHaveAttribute('aria-checked','true');
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'切换知识图谱视图，当前自定义视图'})).toBeVisible();
 await expect(page.getByRole('button',{name:'切换知识图谱视图，当前自定义视图'})).toBeFocused();
 await page.getByRole('button',{name:/切换知识图谱视图，当前/}).click();
 await page.keyboard.press('ArrowDown');
 await expect(page.getByRole('menuitemradio',{name:'树状视图',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'打开知识点目录'}).click();
 await expect(menu).toHaveCount(0);
 await expect(page.getByRole('dialog',{name:'知识点目录'})).toBeVisible();
 await page.getByRole('button',{name:'关闭目录'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 for(const mode of ['树状视图','环状视图']){
  await chooseMode(page,mode);
  await page.mouse.wheel(0,900);
  const scroll=await page.evaluate(()=>({root:document.scrollingElement!.scrollTop,phone:document.querySelector('.device-screen')!.scrollTop,body:getComputedStyle(document.documentElement).overscrollBehaviorY}));
  expect(scroll).toEqual({root:0,phone:0,body:'none'});
 }
});

test('drag and two-finger zoom do not open nodes',async({page})=>{
 await openGraph(page);
 const canvas=page.locator('.knowledge-stage canvas'),box=(await canvas.boundingBox())!;
 const x=box.x+box.width/2,y=box.y+box.height/2;
 const before=await canvas.evaluate((el:HTMLCanvasElement)=>el.toDataURL());
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+60,y+35,{steps:8});await page.mouse.up();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(await canvas.evaluate((el:HTMLCanvasElement)=>el.toDataURL())).not.toEqual(before);
 const scale=Number.parseInt((await page.locator('.graph-tools span').innerText()));
 const touch=await page.context().newCDPSession(page);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y,id:1},{x:x+25,y,id:2}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-55,y,id:1},{x:x+55,y,id:2}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(async()=>Number.parseInt(await page.locator('.graph-tools span').innerText())).toBeGreaterThan(scale);
 await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('switching graph types preserves the knowledge viewport and mode',async({page})=>{
 await openGraph(page);await chooseMode(page,'环状视图');
 await page.getByRole('button',{name:'放大',exact:true}).click();
 const zoom=await page.locator('.graph-tools span').innerText();
 const before=await page.locator('.knowledge-stage canvas').evaluate((el:HTMLCanvasElement)=>el.toDataURL());
 for(const type of ['能力图谱','知识图谱']){
  await page.getByRole('button',{name:/切换图谱类型，当前/}).click();
  await page.getByRole('navigation',{name:'图谱类型'}).getByRole('button',{name:type,exact:true}).click();
 }
 await expect(page.getByRole('button',{name:'切换知识图谱视图，当前环状视图'})).toBeVisible();
 await expect(page.locator('.graph-tools span')).toHaveText(zoom);
 expect(await page.locator('.knowledge-stage canvas').evaluate((el:HTMLCanvasElement)=>el.toDataURL())).toEqual(before);
});

test('all layouts fit both device presets and keep controls visible after resizing',async({page})=>{
 test.setTimeout(60_000);
 mkdirSync('docs/knowledge-views-20261103',{recursive:true});
 await openGraph(page);
 for(const device of ['iphone','pixel-10']){
  if(device==='pixel-10'){
   await page.getByTestId('device-picker').click();await page.getByTestId('device-option-pixel-10').click();
  }
  for(const [id,name] of [['custom','自定义视图'],['tree','树状视图'],['network','网状视图'],['ring','环状视图']]){
   await chooseMode(page,name);
   const screen=(await page.getByTestId('device-screen').boundingBox())!;
   const tools=(await page.locator('.graph-tools').boundingBox())!;
   expect(tools.y+tools.height).toBeLessThan(screen.y+screen.height-12);
   expect(tools.x+tools.width).toBeLessThan(screen.x+screen.width);
   expect(await page.evaluate(()=>document.scrollingElement!.scrollHeight>innerHeight)).toBe(false);
   await page.mouse.move(20,20);
   await expect(page.getByTestId('mobile-cursor')).toHaveAttribute('data-visible','false');
   await page.getByTestId('phone-frame').screenshot({path:`docs/knowledge-views-20261103/${device}-${id}.png`});
  }
  await page.getByRole('button',{name:/切换知识图谱视图，当前/}).click();
  await page.mouse.move(20,20);
  await expect(page.getByRole('menu',{name:'知识图谱视图'})).toBeVisible();
  await expect(page.getByTestId('mobile-cursor')).toHaveAttribute('data-visible','false');
  await page.getByTestId('phone-frame').screenshot({path:`docs/knowledge-views-20261103/${device}-picker.png`});
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({width:device==='iphone'?375:705,height:device==='iphone'?667:823});
  await page.getByRole('button',{name:'回到中心'}).click();
  await expect(page.getByRole('button',{name:/切换知识图谱视图，当前/})).toBeVisible();
  await page.mouse.wheel(0,-900);
  expect(await page.evaluate(()=>document.scrollingElement!.scrollTop)).toBe(0);
  await page.setViewportSize({width:1100,height:1100});
 }
});

test('expanded tree and ring branches remain readable and selectable on both phones',async({page})=>{
 test.setTimeout(60_000);
 mkdirSync('docs/knowledge-views-20261103',{recursive:true});
 await openGraph(page);
 for(const device of ['iphone','pixel-10']){
  if(device==='pixel-10'){await page.getByTestId('device-picker').click();await page.getByTestId('device-option-pixel-10').click();}
  for(const [id,name] of [['tree','树状视图'],['ring','环状视图']]){
   await chooseMode(page,name);
   await page.getByRole('button',{name:'打开知识点目录'}).click();
   await page.getByRole('button',{name:'查看电阻、电源的等效变换',exact:true}).click();
   await expect(page.getByRole('dialog',{name:'电阻、电源的等效变换',exact:true})).toBeVisible();
   const expand=page.getByRole('button',{name:'展开节点',exact:true});
   if(await expand.count())await expand.click();else await page.getByRole('button',{name:'关闭详情'}).click();
   await expect(page.getByRole('dialog')).toHaveCount(0);
   await page.getByRole('button',{name:'缩小',exact:true}).click();await page.getByRole('button',{name:'缩小',exact:true}).click();
   await page.mouse.move(20,20);
   await page.getByTestId('phone-frame').screenshot({path:`docs/knowledge-views-20261103/${device}-${id}-expanded.png`});
   await page.getByRole('button',{name:'打开知识点目录'}).click();
   await page.getByRole('textbox',{name:'搜索知识点名称'}).fill('电源的等效变换');
   await page.getByRole('button',{name:'查看电源的等效变换',exact:true}).click();
   await expect(page.getByRole('dialog',{name:'电源的等效变换',exact:true})).toBeVisible();
   await page.getByRole('button',{name:'关闭详情'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
   const canvas=page.locator('.knowledge-stage canvas'),box=(await canvas.boundingBox())!;
   await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
   await expect(page.getByRole('dialog',{name:'电源的等效变换',exact:true})).toBeVisible();
   await page.getByRole('button',{name:'关闭详情'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  }
 }
});
