import { expect, test } from 'playwright/test';

for (const suffix of ['6?form=not-a-form', '99999', 'not-an-id']) {
  test(`invalid Pokémon URL ${suffix} returns a localized 404 with a recovery link`, async ({
    page,
  }) => {
    // GIVEN: A saved link has a missing form, missing species, or invalid species number.
    // WHEN: The visitor opens that link directly.
    const response = await page.goto(`/pokemon/${suffix}`);

    // THEN: The HTTP status and main content communicate failure without showing another form.
    expect(response?.status()).toBe(404);
    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { level: 1, name: '404 找不到寶可夢資料', exact: true }),
    ).toBeVisible();
    await expect(main.getByRole('link', { name: '回圖鑑重新搜尋', exact: true })).toHaveAttribute(
      'href',
      '/pokemon',
    );
    await expect(main.getByText('能力值細節', { exact: true })).toHaveCount(0);
  });
}

test('a visitor can recover from a missing form using the keyboard on mobile', async ({ page }) => {
  // GIVEN: The missing-form page is open on a narrow screen.
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/pokemon/6?form=not-a-form');
  const recovery = page.getByRole('main').getByRole('link', { name: '回圖鑑重新搜尋' });
  await recovery.focus();
  await expect(recovery).toBeFocused();

  // WHEN: The visitor follows the main recovery action with the keyboard.
  await page.keyboard.press('Enter');

  // THEN: The catalog provides an operable search field.
  await expect(page).toHaveURL(/\/pokemon$/);
  await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toBeEditable();
});
