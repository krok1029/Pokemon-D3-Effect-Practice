import { expect, test } from 'playwright/test';

const forms = [
  { id: 6, formId: 'charizard', name: 'Charizard', file: '006_噴火龍.png' },
  { id: 19, formId: 'rattata', name: 'Rattata', file: '019_小拉達.png' },
  { id: 19, formId: 'alolan-rattata', name: 'Alolan Rattata', file: '019_小拉達(阿羅拉型態).png' },
];

for (const form of forms) {
  test(`${form.name} uses the same dedicated image on its card and detail page`, async ({
    page,
  }) => {
    // GIVEN: The filtered list includes this form.
    await page.goto(`/pokemon?q=${encodeURIComponent(form.name)}`);
    const card = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole('link', { name: `查看 ${form.name} 詳情`, exact: true }) });
    const cardImage = card.getByRole('img', { name: form.name, exact: true });
    await expect(cardImage).toBeVisible();
    const source = new URL(
      (await cardImage.getAttribute('src')) ?? '',
      'http://localhost',
    ).searchParams.get('url');
    expect(source).toBe(`/img/${form.file}`);

    // WHEN: The corresponding form detail is opened.
    await card.getByRole('link', { name: `查看 ${form.name} 詳情`, exact: true }).click();

    // THEN: The same real asset is loaded for that stable form identity.
    await expect(page).toHaveURL(new RegExp(`form=${form.formId}`));
    const image = page.getByRole('img', { name: form.name, exact: true });
    await expect(image).toBeVisible();
    expect(
      new URL((await image.getAttribute('src')) ?? '', 'http://localhost').searchParams.get('url'),
    ).toBe(source);
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);
  });
}

for (const form of [
  { id: 6, formId: 'mega-charizard-x', name: 'Mega Charizard X', total: 634 },
  { id: 6, formId: 'mega-charizard-y', name: 'Mega Charizard Y', total: 634 },
  { id: 7, formId: 'squirtle', name: 'Squirtle', total: 314 },
]) {
  test(`${form.name} clearly explains missing form artwork while keeping its data`, async ({
    page,
  }) => {
    // GIVEN: No matching image exists for this CSV form.
    await page.goto(`/pokemon?q=${encodeURIComponent(form.name)}`);
    const card = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByRole('link', { name: `查看 ${form.name} 詳情`, exact: true }) });
    await expect(card.getByText('尚無此型態對應圖檔', { exact: false })).toBeVisible();
    await expect(card.getByRole('img', { name: form.name, exact: true })).toHaveCount(0);

    // WHEN: The card opens the form detail page.
    await card.getByRole('link', { name: `查看 ${form.name} 詳情`, exact: true }).click();

    // THEN: Missing artwork never substitutes another form or hides the stats.
    const profile = page.locator('[data-slot="card"]').filter({ hasText: '能力值總和' });
    await expect(profile.getByText(form.name, { exact: true })).toBeVisible();
    await expect(profile.getByText('尚無此型態對應圖檔', { exact: false }).first()).toBeVisible();
    await expect(profile.getByText(String(form.total), { exact: true })).toBeVisible();
    await expect(page.getByText('能力值細節', { exact: true })).toBeVisible();
    await expect(page.locator('img[src*="%2Fimg%2F"]')).toHaveCount(0);
  });
}

test('failed detail artwork leaves a readable message and stats', async ({ page }) => {
  // GIVEN: The selected form has a mapped image, but the image request fails.
  await page.route('**/_next/image?*', async (route) => {
    const source = new URL(route.request().url()).searchParams.get('url');
    if (source?.startsWith('/img/')) await route.abort();
    else await route.continue();
  });
  // WHEN: Opening that form directly.
  await page.goto('/pokemon/6?form=charizard');
  // THEN: All image slots fail gracefully while the profile remains readable.
  await expect(page.getByText('圖片暫無法載入', { exact: true })).toHaveCount(3);
  await expect(page.getByText('Charizard', { exact: true })).toBeVisible();
  await expect(page.getByText('能力值細節', { exact: true })).toBeVisible();
});
