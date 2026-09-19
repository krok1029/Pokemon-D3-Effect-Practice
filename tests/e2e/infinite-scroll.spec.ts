import { expect, test } from 'playwright/test';

test('列表回應只帶一批卡片且分批涵蓋完整排序與型態', async ({ request }) => {
  // GIVEN: The real CSV is exposed through the list read endpoint.
  const first = await (await request.get('/api/pokemon')).json();
  // WHEN: Every batch is read in order.
  const entries = [...first.pokemons];
  for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
    const response = await request.get(`/api/pokemon?page=${page}`);
    expect(response.ok()).toBe(true);
    const batch = await response.json();
    expect(batch.page).toBe(page);
    expect(batch.pokemons.length).toBeLessThanOrEqual(24);
    entries.push(...batch.pokemons);
  }
  // THEN: No form is lost or duplicated and card data excludes matchup calculations.
  expect(first.total).toBe(1032);
  expect(first.pokemons).toHaveLength(24);
  expect(first.pokemons[0].name).toBe('Bulbasaur');
  expect(first.pokemons[0]).not.toHaveProperty('defenseMatchups');
  expect(first.pokemons[0]).not.toHaveProperty('offenseMatchups');
  expect(entries).toHaveLength(1032);
  expect(new Set(entries.map((entry) => `${entry.id}/${entry.formId}`)).size).toBe(1032);
  expect(entries.map((entry) => entry.id)).toEqual(
    entries.map((entry) => entry.id).sort((a, b) => a - b),
  );
});

test('接近底部自動載入下一批並維持總數', async ({ page }) => {
  // GIVEN: A fresh list starts with one batch.
  await page.goto('/pokemon');
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–24 筆');
  await expect(page.locator('[data-pokemon-index]')).toHaveCount(24);
  // WHEN: The visitor scrolls near the end.
  await page.getByRole('button', { name: '載入更多', exact: true }).scrollIntoViewIfNeeded();
  // THEN: The next batch arrives automatically with a stable total.
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–48 筆');
  await expect(page.getByRole('status')).toHaveText('共 1,032 筆型態樣本符合條件。');
  await expect(page.locator('[data-pokemon-index="24"]')).toBeAttached();
});

test('分享深層批次可刷新並向前瀏覽，改篩選回到第一批', async ({ page, request }) => {
  // GIVEN: A shared URL points at a later batch in a filtered list.
  const batch = await (await request.get('/api/pokemon?type=water&page=3')).json();
  await page.goto('/pokemon?type=water&page=3');
  await page.reload();
  await expect(
    page.getByRole('link', { name: `查看 ${batch.pokemons[0].name} 詳情`, exact: true }),
  ).toBeAttached();
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 49–72 筆');
  // WHEN: Earlier results are requested, then the filter changes.
  await page.getByRole('button', { name: '載入前 24 筆' }).click();
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 25–72 筆');
  await page.getByRole('textbox', { name: '搜尋寶可夢' }).fill('Squirtle');
  // THEN: The stale batch is cleared and the new query starts at a valid origin.
  await expect(page).toHaveURL(/\/pokemon\?q=Squirtle&type=water$/);
  await expect(page.getByRole('status')).toHaveText('共 1 筆型態樣本符合條件。');
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–1 筆');
  await expect(page.getByText('已到最後一筆')).toBeVisible();
});

test('越界批次回到最後一批，空結果回到第一批', async ({ page }) => {
  // GIVEN / WHEN: A shared page number exceeds the dataset.
  await page.goto('/pokemon?page=9999');
  // THEN: The valid last batch is shown and the URL is normalized.
  await expect(page).toHaveURL(/\/pokemon\?page=43$/);
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1009–1032 筆');
  await expect(page.getByText('已到最後一筆')).toBeAttached();
  await page.goto('/pokemon?q=missing&page=9999');
  await expect(page).toHaveURL(/\/pokemon\?q=missing$/);
  await expect(page.getByRole('status')).toHaveText('共 0 筆型態樣本符合條件。');
});

test('後續載入失敗可重試且不遺失已載入資料', async ({ page }) => {
  // GIVEN: The next batch fails once.
  await page.route(
    '**/api/pokemon?page=2',
    (route) => route.fulfill({ status: 503, body: 'Unavailable' }),
    { times: 1 },
  );
  await page.goto('/pokemon');
  // WHEN: Automatic loading fails and the visitor retries.
  await page.getByRole('button', { name: '載入更多', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByText('載入失敗，請再試一次。')).toBeVisible();
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–24 筆');
  await page.getByRole('button', { name: '重新載入', exact: true }).click();
  // THEN: The second batch is appended exactly once.
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–48 筆');
  expect(
    await page
      .locator('[data-pokemon-index]')
      .evaluateAll((cards) => new Set(cards.map((card) => card.id)).size),
  ).toBe(await page.locator('[data-pokemon-index]').count());
});

test('慢速舊搜尋回應不會覆蓋較新的搜尋', async ({ page }) => {
  // GIVEN: An earlier search response is held in flight.
  let release!: () => void;
  let requested!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route('**/api/pokemon?q=Bulbasaur', async (route) => {
    requested();
    await held;
    await route.continue().catch(() => {});
  });
  await page.goto('/pokemon');
  const search = page.getByRole('textbox', { name: '搜尋寶可夢' });
  await search.fill('Bulbasaur');
  await started;
  // WHEN: A new search completes before the old request is released.
  await search.fill('Squirtle');
  await expect(page.getByRole('link', { name: '查看 Squirtle 詳情' })).toBeVisible();
  release();
  // THEN: Both URL and results still describe the latest query.
  await expect(page).toHaveURL(/q=Squirtle$/);
  await expect(page.getByRole('status')).toHaveText('共 1 筆型態樣本符合條件。');
  await expect(page.getByRole('link', { name: '查看 Bulbasaur 詳情' })).toHaveCount(0);
});

for (const back of ['link', 'browser']) {
  test(`深層卡片經詳細頁後恢復批次與位置：${back}`, async ({ page, request }) => {
    // GIVEN: A visitor opens a detail from a later batch.
    const batch = await (await request.get('/api/pokemon?type=water&page=3')).json();
    const name = batch.pokemons[6].name;
    await page.goto('/pokemon?type=water&page=3');
    await page.getByRole('link', { name: `查看 ${name} 詳情`, exact: true }).click();
    await expect(page.getByRole('link', { name: '← 回到列表' })).toBeVisible();
    // WHEN: The detail is refreshed before using its return link, or browser Back is used.
    if (back === 'link') {
      await page.reload();
      await page.getByRole('link', { name: '← 回到列表' }).click();
    } else {
      await page.goBack();
    }
    // THEN: The filter, batch and source card are restored.
    await expect(page).toHaveURL(/type=water&page=3#pokemon-/);
    await expect(page.getByRole('button', { name: '水', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(
      page.getByRole('link', { name: `查看 ${name} 詳情`, exact: true }),
    ).toBeInViewport();
  });
}
