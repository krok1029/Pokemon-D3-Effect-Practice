import { expect, test } from 'playwright/test';

test('a timed-out batch retains existing cards and retries the same page', async ({ page }) => {
  // GIVEN: The second batch never returns while the first batch remains usable.
  let release!: () => void;
  let requested!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route(
    '**/api/pokemon?page=2',
    async (route) => {
      requested();
      await held;
      await route.abort().catch(() => {});
    },
    { times: 1 },
  );
  await page.goto('/pokemon');
  await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–24 筆');
  await page.clock.install();

  try {
    // WHEN: The request reaches its 15-second application deadline.
    await page.getByTestId('load-sentinel').scrollIntoViewIfNeeded();
    await started;
    await page.clock.fastForward(15_000);

    // THEN: Existing cards survive and the same batch can be retried successfully.
    await expect(page.getByText('載入逾時，請再試一次。')).toBeVisible();
    await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–24 筆');
    await expect(page.locator('[data-pokemon-index]')).toHaveCount(24);
    const retry = page.waitForRequest('**/api/pokemon?page=2');
    await page.getByRole('button', { name: '重新載入', exact: true }).click();
    await retry;
    await expect(page.getByTestId('loaded-range')).toHaveText('已載入第 1–48 筆');
    await expect(page.locator('[data-pokemon-index]')).toHaveCount(48);
    await expect(page.getByText('載入逾時，請再試一次。')).toHaveCount(0);
  } finally {
    release();
  }
});

test('changing filters cancels the old deadline without showing a timeout', async ({ page }) => {
  // GIVEN: The previous filter's request is still pending.
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
    await route.abort().catch(() => {});
  });
  await page.goto('/pokemon');
  await page.clock.install();
  const search = page.getByRole('textbox', { name: '搜尋寶可夢' });

  try {
    await search.fill('Bulbasaur');
    await started;

    // WHEN: A new filter replaces it and its results finish before the old deadline.
    await search.fill('Squirtle');
    await expect(page.getByRole('link', { name: '查看 Squirtle 詳情' })).toBeVisible();
    await page.clock.fastForward(15_000);

    // THEN: Cancellation is silent and cannot replace the current query's results.
    await expect(page).toHaveURL(/q=Squirtle$/);
    await expect(page.getByRole('status')).toHaveText('共 1 筆型態樣本符合條件。');
    await expect(page.getByText('載入逾時，請再試一次。')).toHaveCount(0);
    await expect(page.getByRole('link', { name: '查看 Bulbasaur 詳情' })).toHaveCount(0);
  } finally {
    release();
  }
});
