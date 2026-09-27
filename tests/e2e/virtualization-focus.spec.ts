import { expect, test, type Page } from 'playwright/test';

async function holdThirdBatch(page: Page) {
  let release!: () => void;
  let requested!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route('**/api/pokemon?page=3', async (route) => {
    requested();
    await held;
    await route.continue();
  });
  await page.goto('/pokemon');
  await page.getByTestId('load-sentinel').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–48 筆');
  await page.locator('[data-pokemon-index="47"]').getByRole('link').focus();
  await started;
  return release;
}

test.use({ viewport: { width: 1280, height: 900 } });

test('第三批啟用虛擬化時保留卡片焦點與下一張 Tab 順序', async ({ page, browserName }) => {
  // GIVEN: The last card of the second batch has keyboard focus while the third is pending.
  const release = await holdThirdBatch(page);
  const focused = page.locator('[data-pokemon-index="47"]').getByRole('link');
  await expect(focused).toBeFocused();
  // WHEN: The third batch changes the list from 48 cards to a virtual grid.
  release();
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–72 筆');
  // THEN: The same form retains focus, and Tab continues in data order.
  await expect(focused).toBeFocused();
  // Safari on macOS uses Option-Tab to include links in keyboard navigation.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  await expect(page.locator('[data-pokemon-index="48"]').getByRole('link')).toBeFocused();
});

test('等待第三批時移到搜尋欄的焦點不會被卡片搶回', async ({ page }) => {
  // GIVEN: Loading starts from a focused card, then the visitor moves back to search.
  const release = await holdThirdBatch(page);
  const search = page.getByRole('textbox', { name: '搜尋寶可夢' });
  await search.focus();
  // WHEN: The pending batch arrives after focus has left the grid.
  release();
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–72 筆');
  // THEN: Focus remains on the visitor's current control.
  await expect(search).toBeFocused();
});

test('虛擬列表從三欄改為單欄後保留卡片焦點與 Tab 順序', async ({ page, browserName }) => {
  // GIVEN: A virtualized desktop grid has a focused card.
  const release = await holdThirdBatch(page);
  release();
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–72 筆');
  const focused = page.locator('[data-pokemon-index="47"]').getByRole('link');
  await focused.focus();
  // WHEN: The viewport crosses both responsive column breakpoints.
  await page.setViewportSize({ width: 767, height: 900 });
  // THEN: Regrouping virtual rows keeps the same form focused and the next card reachable.
  await expect(focused).toBeFocused();
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  await expect(page.locator('[data-pokemon-index="48"]').getByRole('link')).toBeFocused();
});
