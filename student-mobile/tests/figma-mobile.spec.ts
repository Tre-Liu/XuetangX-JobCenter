import { expect, test, type Page } from '@playwright/test';

async function openGraph(page: Page) {
 await page.goto('/');
 await page.getByRole('button', { name: '更多', exact: true }).click();
 await page.getByRole('button', { name: '图谱', exact: true }).click();
}

test('graph switch keeps the chosen name briefly, then clears the canvas and reopens accessibly', async ({page}) => {
 await openGraph(page);
 const trigger=page.getByRole('button',{name:'切换图谱类型，当前知识图谱'});
 await trigger.click();
 await page.getByRole('navigation',{name:'图谱类型'}).getByRole('button',{name:'能力图谱',exact:true}).click();
 const selected=page.getByRole('button',{name:'切换图谱类型，当前能力图谱'});
 await expect(selected).toContainText('能力图谱');
 await expect(page.locator('.graph-banner:visible')).toContainText('能力图谱');
 await expect.poll(async()=> (await selected.boundingBox())!.width,{timeout:5000}).toBeLessThan(55);
 await selected.click();
 await expect(page.getByRole('navigation',{name:'图谱类型'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('navigation',{name:'图谱类型'})).toHaveCount(0);
 await expect(selected).toBeFocused();
});

test('directory searches collapsed descendants and remembers the node actually visited', async ({page}) => {
 await openGraph(page);
 await page.getByRole('button',{name:'打开知识点目录'}).click();
 const dialog=page.getByRole('dialog',{name:'知识点目录'});
 await expect(dialog.getByRole('button',{name:'查看戴维南定理的应用',exact:true})).toHaveCount(0);
 await dialog.getByRole('textbox',{name:'搜索知识点名称'}).fill('戴维南定理的应用');
 await dialog.getByRole('button',{name:'查看戴维南定理的应用',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'戴维南定理的应用',exact:true})).toBeVisible();
 await expect.poll(()=>page.locator('.device-screen').evaluate(el=>el.scrollTop)).toBe(0);
 await expect(page.getByTestId('keyboard-dock')).toHaveAttribute('data-visible','false');
 await page.getByRole('button',{name:'关闭详情'}).click();
 await page.getByRole('button',{name:'打开知识点目录'}).click();
 await expect(dialog.getByRole('button',{name:'最近访问戴维南定理的应用'})).toBeVisible();
 await dialog.getByRole('button',{name:'筛选学习内容类型'}).click();
 await dialog.getByRole('button',{name:'视频',exact:true}).click();
 await expect(dialog).toContainText('没有找到相关知识点');
 await dialog.getByRole('button',{name:'关闭目录'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('all graph types expose the directory in the course header', async ({page}) => {
 await openGraph(page);
 for (const [type,noun] of [['知识图谱','知识点'],['能力图谱','能力点'],['问题图谱','问题'],['素质图谱','素质点']]) {
  if(type!=='知识图谱') {
   await page.getByRole('button',{name:/切换图谱类型，当前/}).click();
   await page.getByRole('navigation',{name:'图谱类型'}).getByRole('button',{name:type,exact:true}).click();
  }
  await page.getByRole('button',{name:`打开${noun}目录`}).click();
  await expect(page.getByRole('dialog',{name:`${noun}目录`})).toBeVisible();
  await page.getByRole('button',{name:'关闭目录'}).click();
 }
});

test('opening a node from the expanded tree keeps details inside the phone viewport', async ({page})=>{
 await page.setViewportSize({width:705,height:823});
 await openGraph(page);
 await page.getByRole('button',{name:'打开知识点目录'}).click();
 await page.getByRole('button',{name:'展开叠加、替代和戴维南定理'}).click();
 await page.getByRole('button',{name:'查看戴维南定理的应用',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'戴维南定理的应用',exact:true})).toBeVisible();
 // Native focus restoration can scroll this clipped outer viewport while the sheet animates.
 await page.locator('.device-screen').evaluate(el=>{el.scrollTop=96});
 await expect.poll(()=>page.locator('.device-screen').evaluate(el=>el.scrollTop)).toBe(0);
 await expect(page.getByTestId('keyboard-dock')).toHaveAttribute('data-visible','false');
});

test('canvas controls clear the iPhone home indicator and unsynced records show no student status', async ({page})=>{
 await openGraph(page);
 const tools=page.locator('.graph-tools');
 const phone=page.locator('.device-screen');
 const bounds=await phone.boundingBox();
 const controlBounds=await tools.boundingBox();
 const scale=await phone.evaluate(el=>el.getBoundingClientRect().height/(el as HTMLElement).offsetHeight);
 expect(bounds!.y+bounds!.height-(controlBounds!.y+controlBounds!.height)).toBeGreaterThan(45*scale);
 await page.getByRole('button',{name:'打开知识点目录'}).click();
 await page.getByRole('button',{name:'查看动态电路',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'动态电路',exact:true})).toContainText('学习记录待同步');
});
