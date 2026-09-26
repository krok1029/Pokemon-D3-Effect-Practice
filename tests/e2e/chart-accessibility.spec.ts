import { expect, test, type Locator, type Page } from 'playwright/test';

async function tabTo(page: Page, target: Locator, tabKey: 'Tab' | 'Alt+Tab') {
  for (let count = 0; count < 60; count += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press(tabKey);
  }
  await expect(target).toBeFocused();
}

test('keyboard users can search, select and open a specific chart form', async ({
  page,
  browserName,
}) => {
  // GIVEN: All comparison controls have names and the user starts without a mouse selection.
  await page.goto('/chart');
  await expect(page.getByRole('combobox', { name: '比較能力', exact: true })).toBeVisible();
  const searchRegion = page.getByRole('region', { name: '搜尋並選取寶可夢', exact: true });
  const input = searchRegion.getByRole('searchbox', { name: '搜尋圖表中的寶可夢' });
  // macOS WebKit uses Option+Tab to include native buttons and links in keyboard navigation.
  const tabKey = process.platform === 'darwin' && browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

  // WHEN: The user reaches search with Tab and selects Mega Charizard X with Enter.
  await tabTo(page, input, tabKey);
  await page.keyboard.type('Mega Charizard X');
  await expect(searchRegion.getByRole('status')).toHaveText('符合 1 筆型態。');
  const select = searchRegion.getByRole('button', { name: '選取 Mega Charizard X', exact: true });
  await tabTo(page, select, tabKey);
  await page.keyboard.press('Enter');

  // THEN: Selection is announced by the control, and the same form opens with the keyboard.
  await expect(
    searchRegion.getByRole('button', { name: '取消選取 Mega Charizard X', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const selected = page.getByRole('complementary', { name: '選取寶可夢' });
  await expect(selected.getByRole('link', { name: '查看 Mega Charizard X 詳情' })).toBeVisible();
  await tabTo(page, searchRegion.getByRole('link', { name: '查看 Mega Charizard X 詳情' }), tabKey);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pokemon\/6\?form=mega-charizard-x$/);
  await expect(page.getByText('Mega Charizard X', { exact: true })).toBeVisible();
  await expect(page.getByText('能力值細節', { exact: true })).toBeVisible();
});

test('search selection follows active type filters and can be removed', async ({ page }) => {
  // GIVEN: A form is found by its zero-padded Pokédex number.
  await page.goto('/chart');
  const searchRegion = page.getByRole('region', { name: '搜尋並選取寶可夢', exact: true });
  const input = searchRegion.getByRole('searchbox', { name: '搜尋圖表中的寶可夢' });
  await input.fill('006');
  await searchRegion.getByRole('button', { name: '選取 Mega Charizard Y', exact: true }).click();
  const selected = page.getByRole('complementary', { name: '選取寶可夢' });
  await expect(selected.getByRole('link', { name: '查看 Mega Charizard Y 詳情' })).toBeVisible();

  // WHEN: That same selection is toggled off, then its primary type is hidden.
  await searchRegion
    .getByRole('button', { name: '取消選取 Mega Charizard Y', exact: true })
    .click();
  await expect(selected.getByRole('link')).toHaveCount(0);
  await input.fill('Charizard');
  await page
    .getByRole('region', { name: '主屬性篩選' })
    .getByRole('button', { name: '火', exact: true })
    .click();

  // THEN: The alternate selector cannot introduce samples outside the chart's filters.
  await expect(searchRegion.getByRole('status')).toHaveText('目前條件下找不到符合的寶可夢。');
  await expect(searchRegion.getByRole('button')).toHaveCount(0);
});

test.describe('touch selection', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('touch users can choose and open a form without dragging the plot', async ({ page }) => {
    // GIVEN: A touch viewport uses the alternate chart selection controls.
    await page.goto('/chart');
    const region = page.getByRole('region', { name: '搜尋並選取寶可夢', exact: true });
    const input = region.getByRole('searchbox', { name: '搜尋圖表中的寶可夢' });
    await input.tap();
    await page.keyboard.type('Mega Charizard Y');

    // WHEN: The visitor selects and opens the form through native touch controls.
    await region.getByRole('button', { name: '選取 Mega Charizard Y', exact: true }).tap();
    await expect(
      region.getByRole('button', { name: '取消選取 Mega Charizard Y', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await region.getByRole('link', { name: '查看 Mega Charizard Y 詳情', exact: true }).tap();

    // THEN: Touch navigation reaches the correct form and its readable profile.
    await expect(page).toHaveURL(/\/pokemon\/6\?form=mega-charizard-y$/);
    await expect(page.getByText('Mega Charizard Y', { exact: true })).toBeVisible();
    await expect(page.getByText('能力值細節', { exact: true })).toBeVisible();
  });
});
