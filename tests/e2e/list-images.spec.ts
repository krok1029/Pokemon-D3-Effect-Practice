import { expect, test } from 'playwright/test';

test('慢速圖片保留固定空間，靠近畫面才請求其他圖片', async ({ page }) => {
  // GIVEN: Pokémon images are held while the page becomes interactive.
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requests: string[] = [];
  await page.route('**/_next/image?*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('url')?.startsWith('/img/')) {
      requests.push(route.request().url());
      await ready;
    }
    await route.continue();
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pokemon', { waitUntil: 'domcontentloaded' });
  const image = page.getByRole('img', { name: 'Bulbasaur', exact: true });
  const slot = image.locator('..');
  await expect(slot).toHaveAttribute('aria-busy', 'true');
  const before = await slot.boundingBox();
  expect(before?.width).toBe(96);
  expect(before?.height).toBe(96);
  expect(requests.length).toBeLessThanOrEqual(6);
  // WHEN: The slow images finish downloading.
  release();
  // THEN: The image appears without changing its reserved dimensions.
  await expect(slot).toHaveAttribute('aria-busy', 'false');
  await expect(image).toHaveCSS('opacity', '1');
  const after = await slot.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);
  expect(after?.y).toBe(before?.y);
});

test('圖片失敗顯示明確替代內容且卡片仍可開啟', async ({ page }) => {
  // GIVEN: The image optimizer cannot supply the first Pokémon image.
  await page.route('**/_next/image?*', async (route) => {
    const source = new URL(route.request().url()).searchParams.get('url') ?? '';
    if (source.startsWith('/img/001_')) await route.fulfill({ status: 404, body: '' });
    else await route.continue();
  });
  // WHEN: The list loads.
  await page.goto('/pokemon');
  // THEN: Failure has a stable fallback and does not block the detail link.
  const card = page.locator('#pokemon-1-bulbasaur');
  await expect(card.getByText('圖片暫無法載入')).toBeVisible();
  await card.getByRole('link', { name: '查看 Bulbasaur 詳情' }).click();
  await expect(page).toHaveURL(/\/pokemon\/1\?form=bulbasaur/);
});
