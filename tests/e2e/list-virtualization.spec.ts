import { expect, test, type Page } from 'playwright/test';

async function loadBatches(page: Page, count: number) {
  await page.goto('/pokemon');
  for (let batch = 2; batch <= count; batch++) {
    await page.getByTestId('load-sentinel').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('loaded-range')).toHaveText(`已載入第 1–${batch * 24} 筆`);
  }
}

test('連續載入多批後卡片 DOM 有界，快速捲回仍能看到資料', async ({ page }) => {
  // GIVEN: Six batches have been loaded through normal scrolling.
  await page.setViewportSize({ width: 1440, height: 900 });
  await loadBatches(page, 6);
  const list = page.getByRole('list', { name: '寶可夢卡片' });
  await expect(list).toHaveAttribute('data-virtualized', 'true');
  expect(await page.locator('[data-pokemon-index]').count()).toBeLessThanOrEqual(30);
  await expect(page.locator('#pokemon-1-bulbasaur')).toHaveCount(0);
  // WHEN: The user rapidly scrolls back to the beginning of the loaded range.
  await page.evaluate(() => scrollTo(0, 0));
  // THEN: Earlier data is rendered again without growing the DOM to 144 cards.
  await expect(page.locator('#pokemon-1-bulbasaur')).toBeAttached();
  await expect(page.getByRole('img', { name: 'Bulbasaur', exact: true })).toHaveCSS('opacity', '1');
  await expect(page).toHaveURL(/\/pokemon$/);
  expect(await page.locator('[data-pokemon-index]').count()).toBeLessThanOrEqual(30);
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–144 筆');
  await page.reload();
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–24 筆');
});

test('虛擬卡片在手機寬度與放大字體下不重疊或橫向溢出', async ({ page }) => {
  // GIVEN: The list has enough cards to use virtualization.
  await loadBatches(page, 4);
  // WHEN: The viewport narrows and text size increases.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addStyleTag({ content: 'html { font-size: 20px; }' });
  await page.evaluate(() => scrollTo(0, 1600));
  // THEN: Measured rows have room for their content and the page stays within the viewport.
  await expect.poll(async () => page.locator('[data-pokemon-index]').count()).toBeGreaterThan(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await expect
    .poll(() =>
      page.locator('[data-virtualized="true"] > [data-index]').evaluateAll((rows) => {
        const bounds = rows.map((row) => row.getBoundingClientRect()).sort((a, b) => a.top - b.top);
        return bounds.slice(1).every((row, index) => row.top >= bounds[index].bottom - 1);
      }),
    )
    .toBe(true);
  expect(await page.locator('[data-pokemon-index]').count()).toBeLessThanOrEqual(12);
});

test('捲走的鍵盤焦點不被卸載且 Tab 仍依資料順序前進', async ({ page, browserName }) => {
  // GIVEN: A card link is focused in a virtualized list.
  await loadBatches(page, 4);
  const source = page.locator('[data-pokemon-index]').first();
  const index = Number(await source.getAttribute('data-pokemon-index'));
  const link = page.locator(`[data-pokemon-index="${index}"]`).getByRole('link');
  await link.focus();
  // WHEN: Scrolling moves that focused card outside the normal render window.
  await page.evaluate(() => scrollTo(0, 0));
  // THEN: Focus survives, and Tab reaches the next card instead of jumping to the footer.
  await expect(link).toBeFocused();
  // Safari on macOS uses Option-Tab to include links in keyboard navigation.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  await expect(page.locator(`[data-pokemon-index="${index + 1}"]`).getByRole('link')).toBeFocused();
});

test('從虛擬區段開啟詳細頁再返回可直接定位原卡片', async ({ page }) => {
  // GIVEN: The visitor has scrolled through several batches.
  await loadBatches(page, 5);
  const link = page.locator('[data-pokemon-index]').last().getByRole('link');
  const name = await link.getAttribute('aria-label');
  await link.click();
  await expect(page.getByRole('link', { name: '← 回到列表' })).toBeVisible();
  await page.reload();
  // WHEN: The visitor returns using the preserved source URL.
  await page.getByRole('link', { name: '← 回到列表' }).click();
  // THEN: The exact source form is visible without downloading the preceding batches.
  await expect(page.getByRole('link', { name: name!, exact: true })).toBeInViewport();
  await expect(page).toHaveURL(/page=\d+#pokemon-/);
  expect(await page.locator('[data-pokemon-index]').count()).toBeLessThanOrEqual(48);
});
