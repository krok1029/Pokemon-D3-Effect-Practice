import { expect, test } from 'playwright/test';

const cases: [string, string[]][] = [
  ['#025', ['Pikachu']],
  ['025', ['Pikachu']],
  ['Farfetch’d', ["Farfetch'd", "Galarian Farfetch'd"]],
  ['Mr Mime', ['Mr. Mime', 'Galarian Mr. Mime']],
];

for (const [query, names] of cases) {
  test(`catalog and chart accept the same search format: ${query}`, async ({ page }) => {
    // GIVEN: A copied query uses a card number or common name punctuation.
    const params = new URLSearchParams({ q: query });

    // WHEN: The shared catalog URL is opened and refreshed.
    await page.goto(`/pokemon?${params}`);
    await page.reload();

    // THEN: The original input and exactly the expected forms survive the URL round trip.
    await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue(query);
    await expect(page.getByRole('status')).toHaveText(`共 ${names.length} 筆型態樣本符合條件。`);
    await expect(page.getByRole('link', { name: /查看 .* 詳情/ })).toHaveCount(names.length);
    for (const name of names) {
      await expect(
        page.getByRole('link', { name: `查看 ${name} 詳情`, exact: true }),
      ).toBeVisible();
    }

    // WHEN: The same query is entered in the chart's independent search control.
    await page.goto('/chart');
    const searchRegion = page.getByRole('region', { name: '搜尋並選取寶可夢', exact: true });
    await searchRegion.getByRole('searchbox', { name: '搜尋圖表中的寶可夢' }).fill(query);

    // THEN: Both entry points expose the same forms and valid form destinations.
    await expect(searchRegion.getByRole('status')).toHaveText(`符合 ${names.length} 筆型態。`);
    await expect(searchRegion.getByRole('button')).toHaveCount(names.length);
    for (const name of names) {
      await expect(
        searchRegion.getByRole('button', { name: `選取 ${name}`, exact: true }),
      ).toBeVisible();
    }
    await searchRegion.getByRole('link', { name: `查看 ${names[0]} 詳情`, exact: true }).click();
    await expect(page.getByText(names[0], { exact: true })).toBeVisible();
    await expect(page.getByText('能力值細節', { exact: true })).toBeVisible();
  });
}
