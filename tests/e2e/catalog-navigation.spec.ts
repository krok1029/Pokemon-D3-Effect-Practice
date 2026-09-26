import { expect, test, type Page } from 'playwright/test';

function catalogNavigation(page: Page) {
  return page
    .getByRole('navigation', { name: '主要導覽' })
    .getByRole('link', { name: '寶可夢', exact: true });
}

async function expectFirstBatch(page: Page) {
  await expect(page).toHaveURL(/\/pokemon$/);
  await expect(page.getByTestId('loaded-range')).toHaveCount(1);
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–24 筆');
  await expect(page.locator('[data-pokemon-index]').first()).toHaveAttribute(
    'id',
    'pokemon-1-bulbasaur',
  );
  await expect(page.getByRole('button', { name: '載入前 24 筆' })).toHaveCount(0);
}

for (const viewport of [
  { label: '桌面', width: 1280, height: 800 },
  { label: '手機', width: 390, height: 844 },
]) {
  test(`${viewport.label}深層圖鑑點主要導覽後，網址與列表一起回到第一批`, async ({ page }) => {
    // GIVEN: A shared URL starts on the third batch of the real catalog.
    await page.setViewportSize(viewport);
    await page.goto('/pokemon?page=3');
    await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 49–72 筆');
    await expect(page.locator('[data-pokemon-index]').first()).toHaveAttribute(
      'id',
      'pokemon-37-alolan-vulpix',
    );
    await expect(page.getByRole('button', { name: '載入前 24 筆' })).toBeVisible();

    // WHEN: The existing Next.js navigation link opens the catalog root.
    await catalogNavigation(page).click();

    // THEN: Its first batch is shown immediately, without refreshing the route.
    await expectFirstBatch(page);
  });
}

test('捲動更新批次網址保留累積列表，點導覽才重新開始', async ({ page }) => {
  // GIVEN: The catalog started at its root and has accumulated three batches.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/pokemon');
  for (let batch = 2; batch <= 3; batch++) {
    await page.getByTestId('load-sentinel').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('loaded-range')).toHaveText(`已載入第 1–${batch * 24} 筆`);
  }
  await expect(page.getByRole('list', { name: '寶可夢卡片' })).toHaveAttribute(
    'data-virtualized',
    'true',
  );

  // WHEN: The visible batch changes through scrolling, then the root link is followed.
  await page.mouse.wheel(0, 1);
  await page.locator('[data-pokemon-index="48"]').scrollIntoViewIfNeeded();
  await page
    .locator('[data-pokemon-index="48"]')
    .evaluate((card) => card.scrollIntoView({ block: 'start' }));
  await expect(page).toHaveURL(/\/pokemon\?page=3#pokemon-/);
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–72 筆');
  await catalogNavigation(page).click();

  // THEN: Only the explicit route navigation clears the accumulated virtualized feed.
  await expectFirstBatch(page);
  await expect(page.getByRole('list', { name: '寶可夢卡片' })).toHaveAttribute(
    'data-virtualized',
    'false',
  );
});

test('深層圖鑑導覽後，瀏覽器上一頁與下一頁還原各自批次', async ({ page }) => {
  // GIVEN: A visitor explicitly navigated from the third batch to the catalog root.
  await page.goto('/pokemon?page=3');
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 49–72 筆');
  await catalogNavigation(page).click();
  await expectFirstBatch(page);

  // WHEN: Browser history goes back to the shared third-batch URL.
  await page.goBack();

  // THEN: The third batch is restored, and Forward restores the first batch again.
  await expect(page).toHaveURL(/\/pokemon\?page=3$/);
  await expect(page.getByTestId('loaded-range')).toHaveCount(1);
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 49–72 筆');
  await expect(
    page.getByRole('link', { name: '查看 Alolan Vulpix 詳情', exact: true }),
  ).toBeAttached();
  await page.goForward();
  await expectFirstBatch(page);
});
