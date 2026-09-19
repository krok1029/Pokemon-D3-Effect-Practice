import { expect, test } from 'playwright/test';

// These literal expectations come from the shipped CSV and the four-row fixture.
// Start the server with the matching POKEMON_DATA_PATH before selecting custom.
const dataset =
  process.env.POKEMON_E2E_DATASET === 'custom'
    ? {
        samples: '4',
        species: '3',
        range: '#1–#151',
        nonLegendarySamples: '3',
        nonLegendarySpecies: '2',
      }
    : {
        samples: '1,032',
        species: '898',
        range: '#1–#898',
        nonLegendarySamples: '907',
        nonLegendarySpecies: '806',
      };

test('首頁說明用途與資料範圍，提供可操作的圖鑑入口', async ({ page }) => {
  // GIVEN: A visitor opens the public homepage.
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('寶可夢圖鑑與能力探索');
  await expect(page).toHaveTitle('Pokemon D3 Effect｜寶可夢圖鑑與能力探索');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /寶可夢.*能力.*屬性/,
  );
  const scope = page.getByRole('region', { name: '目前資料範圍' });
  await expect(scope.getByText(`${dataset.samples} 筆`, { exact: true })).toBeVisible();
  await expect(scope.getByText(`${dataset.species} 個`, { exact: true })).toBeVisible();
  await expect(scope.getByText(dataset.range, { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '探索圖表', exact: true })).toHaveAttribute(
    'href',
    '/chart',
  );
  await expect(page.locator('footer a[href="/privacy"], footer a[href="/terms"]')).toHaveCount(0);

  // WHEN: The visitor chooses the Pokédex entry point.
  await page.getByRole('link', { name: '瀏覽圖鑑', exact: true }).click();

  // THEN: The real Pokédex page is reached without typing another URL.
  await expect(page).toHaveURL(/\/pokemon$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('個別寶可夢資料');
});

for (const viewport of [
  { label: '手機', width: 390, height: 844 },
  { label: '桌面', width: 1280, height: 800 },
]) {
  test(`${viewport.label}可從圖鑑導覽至圖表`, async ({ page }) => {
    // GIVEN: The visitor is browsing the Pokédex at this viewport width.
    await page.setViewportSize(viewport);
    await page.goto('/pokemon');
    const navigation = page.getByRole('navigation', { name: '主要導覽' });
    await expect(navigation.getByRole('link', { name: '寶可夢', exact: true })).toBeVisible();
    await expect(navigation.getByRole('link', { name: 'GitHub', exact: true })).toBeVisible();

    // WHEN: They choose the chart in the main navigation.
    await navigation.getByRole('link', { name: '圖表', exact: true }).click();

    // THEN: The chart is reached without typing a URL.
    await expect(page).toHaveURL(/\/chart$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('寶可夢能力平均值');
  });

  test(`${viewport.label}可從圖表返回首頁`, async ({ page }) => {
    // GIVEN: The visitor is exploring the chart at this viewport width.
    await page.setViewportSize(viewport);
    await page.goto('/chart');

    // WHEN: They choose the site's home link.
    await page
      .getByRole('navigation', { name: '主要導覽' })
      .getByRole('link', { name: 'Pokemon D3 Effect' })
      .click();

    // THEN: The homepage is reachable on both mobile and desktop.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('寶可夢圖鑑與能力探索');
  });
}

test('圖鑑區分型態樣本與不同編號，並解釋雙屬性分組', async ({ page }) => {
  // GIVEN: The configured dataset includes multiple forms of a species.
  // WHEN: A visitor reads the Pokédex overview.
  await page.goto('/pokemon');

  // THEN: The overview describes samples without inflating the species count.
  const overview = page.getByRole('main');
  await expect(
    overview.getByText(
      `收錄 ${dataset.samples} 筆型態樣本，涵蓋 ${dataset.species} 個不同圖鑑編號`,
      { exact: false },
    ),
  ).toBeVisible();
  await expect(overview.getByText(/每筆型態資料為一個樣本/)).toBeVisible();
  await expect(overview.getByText(/雙屬性.*同時計入兩組.*不可直接相加/)).toBeVisible();
});

test('統計以型態樣本計數，排除傳說後更新樣本與編號數', async ({ page }) => {
  // GIVEN: The chart initially includes every sample from the configured dataset.
  await page.goto('/chart');
  await expect(
    page.getByText(
      `目前彙整 ${dataset.samples} 筆型態樣本，涵蓋 ${dataset.species} 個不同圖鑑編號`,
      { exact: false },
    ),
  ).toBeVisible();
  await expect(page.getByText(/每筆型態資料為一個樣本/)).toBeVisible();
  await expect(page.getByText(/雙屬性.*同時計入兩組.*不可直接相加/)).toBeVisible();

  // WHEN: The visitor excludes legendary entries using the existing filter.
  await page.getByRole('checkbox', { name: /排除傳說寶可夢/ }).click();

  // THEN: The public URL and counts reflect the actual remaining samples.
  await expect(page).toHaveURL(/excludeLegendaries=true/);
  await expect(
    page.getByText(
      `目前彙整 ${dataset.nonLegendarySamples} 筆型態樣本，涵蓋 ${dataset.nonLegendarySpecies} 個不同圖鑑編號`,
      { exact: false },
    ),
  ).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /排除傳說寶可夢/ })).toBeChecked();
});
