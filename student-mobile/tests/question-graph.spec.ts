import { expect, test } from '@playwright/test';

async function openGraph(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '更多', exact: true }).click();
  await page.getByRole('button', { name: '图谱', exact: true }).click();
  await page.getByRole('button', { name: '切换图谱类型' }).click();
  await page.getByRole('menuitemradio', { name: '问题图谱', exact: true }).click();
}
test('question layers navigate the canvas; detail relations navigate and dismiss back to the same view', async ({ page }) => {
  await openGraph(page);
  await expect(page.getByLabel('问题图谱画布，可拖动和缩放')).toBeVisible();
  await page.getByRole('button', { name: '定位中级层级' }).click();
  const world = page.locator('.question-world');
  const before = await world.getAttribute('style');
  await page.getByRole('button', { name: '查看问题：电路等效变换', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('化繁为简的核心思想');
  await expect(dialog.getByRole('button', { name: /电阻串并联化简/ })).toBeVisible();
  await dialog.getByRole('button', { name: /电阻串并联化简/ }).click();
  await expect(dialog.getByRole('heading', { name: '电阻串并联化简', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '关闭问题详情' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(world).toHaveAttribute('style', before!);
});
test('dragging cards never opens detail, zoom and reset remain usable', async ({ page }) => {
  await openGraph(page);
  const card = page.getByRole('button', { name: '查看问题：线性电阻电路分析', exact: true });
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 50, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 110, box.y + 95, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '放大问题图谱' }).click();
  await expect(page.locator('.question-tools output')).toHaveText('100%');
  await page.getByRole('button', { name: '回到问题图谱起点' }).click();
  await expect(page.locator('.question-tools output')).toHaveText('88%');
});
