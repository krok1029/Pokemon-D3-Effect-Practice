import { expect, test } from 'playwright/test';

test('分享的複合篩選網址直接還原控制項與結果', async ({ page }) => {
  // GIVEN: A shared URL combines a name, type, and legendary filter.
  const sharedUrl = '/pokemon?q=Articuno&type=ice&legendary=1';

  // WHEN: The recipient opens the URL.
  await page.goto(sharedUrl);

  // THEN: Controls, count, and the displayed Pokémon match all three filters.
  await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('Articuno');
  await expect(page.getByRole('button', { name: '冰', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).toBeChecked();
  await expect(page.getByRole('status')).toHaveText('共 1 筆型態樣本符合條件。');
  await expect(page.getByRole('link', { name: /查看 .* 詳情/ })).toHaveCount(1);
  await expect(page.getByRole('link', { name: '查看 Articuno 詳情' })).toBeVisible();
});

test('調整條件後可刷新並分享相同的結果', async ({ page, context }) => {
  // GIVEN: The visitor combines the same three filters using the controls.
  await page.goto('/pokemon');
  await page.getByRole('textbox', { name: '搜尋寶可夢' }).fill('Articuno');
  await page.getByRole('button', { name: '冰', exact: true }).click();
  await page.getByRole('checkbox', { name: '只顯示傳說寶可夢' }).check();
  await expect(page).toHaveURL(/\/pokemon\?q=Articuno&type=ice&legendary=1$/);

  // WHEN: The visitor refreshes, then opens the copied URL in another tab.
  await page.reload();
  const recipient = await context.newPage();
  await recipient.goto(page.url());

  // THEN: Each page has identical controls, one result, and a usable detail link.
  for (const target of [page, recipient]) {
    await expect(target.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('Articuno');
    await expect(target.getByRole('button', { name: '冰', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(target.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).toBeChecked();
    await expect(target.getByRole('status')).toHaveText('共 1 筆型態樣本符合條件。');
    await expect(target.getByRole('link', { name: '查看 Articuno 詳情' })).toBeVisible();
  }
});

test('清除條件及瀏覽器前後導覽保持網址與畫面一致', async ({ page }) => {
  // GIVEN: A combined query is active.
  await page.goto('/pokemon?q=Articuno&type=ice&legendary=1');

  // WHEN: The visitor clears filters and moves back and forward through that action.
  await page.getByRole('button', { name: '清除篩選', exact: true }).click();
  await expect(page).toHaveURL(/\/pokemon$/);
  await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('');
  await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).not.toBeChecked();
  await expect(page.getByRole('button', { name: '全部', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('status')).toHaveText('共 1,032 筆型態樣本符合條件。');
  await page.goBack();

  // THEN: Back restores all filters and results; forward restores the cleared list.
  await expect(page).toHaveURL(/q=Articuno&type=ice&legendary=1$/);
  await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('Articuno');
  await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).toBeChecked();
  await expect(page.getByRole('button', { name: '冰', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('status')).toHaveText('共 1 筆型態樣本符合條件。');
  await expect(page.getByRole('link', { name: '查看 Articuno 詳情' })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/pokemon$/);
  await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('');
  await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).not.toBeChecked();
  await expect(page.getByRole('status')).toHaveText('共 1,032 筆型態樣本符合條件。');
});

test('無效篩選參數回到預設並移除無效值', async ({ page }) => {
  // GIVEN: A bookmarked URL contains an unknown type and unsupported boolean value.
  const invalidUrl = '/pokemon?q=Bulbasaur&type=unknown&legendary=true';

  // WHEN: The visitor opens the malformed query.
  await page.goto(invalidUrl);

  // THEN: The valid keyword survives, invalid filters use defaults, and the URL is canonical.
  await expect(page).toHaveURL(/\/pokemon\?q=Bulbasaur$/);
  await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('Bulbasaur');
  await expect(page.getByRole('button', { name: '全部', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).not.toBeChecked();
  await expect(page.getByRole('status')).toHaveText('共 1 筆型態樣本符合條件。');
  await expect(page.getByRole('link', { name: '查看 Bulbasaur 詳情' })).toBeVisible();
});

test('詳細頁刷新後返回原條件與來源卡片位置', async ({ page }) => {
  // GIVEN: The visitor opens a result near the bottom of a filtered list.
  await page.goto('/pokemon?q=a&type=flying&legendary=1');
  const sourceCardLink = page.getByRole('link', { name: '查看 Yveltal 詳情' });
  await sourceCardLink.click();
  await expect(page).toHaveURL(/\/pokemon\/717\?/);
  await page.reload();

  // WHEN: The visitor follows the detail page's return link.
  await page.getByRole('link', { name: '← 回到列表' }).click();

  // THEN: The original filters and a recognizable position survive detail refresh.
  await expect(page).toHaveURL(/\/pokemon\?q=a&type=flying&legendary=1#pokemon-/);
  await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('a');
  await expect(page.getByRole('button', { name: '飛行', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).toBeChecked();
  await expect(page.getByRole('status')).toHaveText('共 16 筆型態樣本符合條件。');
  await expect(page.getByRole('link', { name: '查看 Yveltal 詳情' })).toBeInViewport();
});

test('沒有結果時可清除條件回到圖鑑', async ({ page }) => {
  // GIVEN: An unmatched query clearly explains why the list is empty.
  await page.goto('/pokemon?q=does-not-exist&type=ice&legendary=1');
  await expect(page.getByRole('status')).toHaveText('共 0 筆型態樣本符合條件。');
  await expect(page.getByText('找不到符合條件的寶可夢，試試調整搜尋或篩選條件。')).toBeVisible();
  await expect(page.getByRole('link', { name: /查看 .* 詳情/ })).toHaveCount(0);

  // WHEN: The visitor uses the provided clear action.
  await page.getByRole('button', { name: '清除篩選', exact: true }).click();

  // THEN: The default list is usable again.
  await expect(page).toHaveURL(/\/pokemon$/);
  await expect(page.getByRole('status')).toHaveText('共 1,032 筆型態樣本符合條件。');
  await expect(page.getByRole('link', { name: '查看 Bulbasaur 詳情' })).toBeVisible();
});

for (const [keyword, type, typeLabel, pokemon] of [
  ['bUlBa', 'poison', '毒', 'Bulbasaur'],
  ['144', 'ice', '冰', 'Articuno'],
]) {
  test(`保留名稱不分大小寫或編號搜尋與主副屬性語意：${keyword}`, async ({ page }) => {
    // GIVEN: A shared query uses an existing name/id search and either type.
    const query = new URLSearchParams({ q: keyword, type });

    // WHEN: The visitor opens the query.
    await page.goto(`/pokemon?${query}`);

    // THEN: The named result matches the existing search semantics.
    await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue(keyword);
    await expect(page.getByRole('button', { name: typeLabel, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('status')).toHaveText('共 1 筆型態樣本符合條件。');
    await expect(page.getByRole('link', { name: `查看 ${pokemon} 詳情` })).toBeVisible();
  });
}

for (const source of ['', '?returnTo=https%3A%2F%2Fexample.com%2Fpokemon', '?returnTo=%2Fchart']) {
  test(`缺少或無效來源時回到預設列表：${source || '無來源'}`, async ({ page }) => {
    // GIVEN: The detail page was opened without a valid source-list URL.
    await page.goto(`/pokemon/144${source}`);

    // WHEN: The visitor follows the return link.
    await page.getByRole('link', { name: '← 回到列表' }).click();

    // THEN: The result is a valid default list on the same site.
    await expect(page).toHaveURL(/\/pokemon$/);
    await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('');
    await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).not.toBeChecked();
    await expect(page.getByRole('status')).toHaveText('共 1,032 筆型態樣本符合條件。');
  });
}

test('連續輸入名稱可用一次上一頁還原先前查詢', async ({ page }) => {
  // GIVEN: A visitor edits an existing query in one uninterrupted typing session.
  await page.goto('/pokemon?q=Art');
  const search = page.getByRole('textbox', { name: '搜尋寶可夢' });
  await search.click();
  await search.press('End');
  await search.pressSequentially('icuno');
  await expect(page).toHaveURL(/\/pokemon\?q=Articuno$/);
  await expect(page.getByRole('status')).toHaveText('共 2 筆型態樣本符合條件。');

  // WHEN: The visitor goes back once.
  await page.goBack();

  // THEN: The prior query and its full results return, not one deleted character.
  await expect(page).toHaveURL(/\/pokemon\?q=Art$/);
  await expect(search).toHaveValue('Art');
  await expect(page.getByRole('status')).toHaveText('共 6 筆型態樣本符合條件。');
  await expect(page.getByRole('link', { name: '查看 Kartana 詳情' })).toBeVisible();
});

test('瀏覽器上一頁從詳細頁恢復原條件與位置', async ({ page }) => {
  // GIVEN: The visitor follows a result well below the first screen.
  await page.goto('/pokemon?q=a&type=flying&legendary=1');
  await page.getByRole('link', { name: '查看 Yveltal 詳情' }).click();
  await expect(page.getByRole('link', { name: '← 回到列表' })).toBeVisible();

  // WHEN: The visitor uses the browser's back action.
  await page.goBack();

  // THEN: Both the source filters and the card position are restored.
  await expect(page.getByRole('textbox', { name: '搜尋寶可夢' })).toHaveValue('a');
  await expect(page.getByRole('button', { name: '飛行', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).toBeChecked();
  await expect(page.getByRole('status')).toHaveText('共 16 筆型態樣本符合條件。');
  await expect(page.getByRole('link', { name: '查看 Yveltal 詳情' })).toBeInViewport();
});

test('互動程式尚未載入時不接受會遺失的篩選輸入', async ({ page }) => {
  // GIVEN: HTML arrives before the browser has downloaded the interactive scripts.
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route('**/_next/static/chunks/**', async (route) => {
    await scriptsReady;
    await route.continue();
  });
  await page.goto('/pokemon', { waitUntil: 'commit' });
  const search = page.getByRole('textbox', { name: '搜尋寶可夢' });
  try {
    await expect(search).toBeDisabled();
    await expect(page.getByRole('button', { name: '冰', exact: true })).toBeDisabled();
    await expect(page.getByRole('checkbox', { name: '只顯示傳說寶可夢' })).toBeDisabled();
  } finally {
    releaseScripts();
  }

  // WHEN: The scripts finish loading and the visitor enters a query.
  await search.fill('Articuno');

  // THEN: Enabled controls retain the query in the URL and display matching results.
  await expect(page).toHaveURL(/\/pokemon\?q=Articuno$/);
  await expect(search).toHaveValue('Articuno');
  await expect(page.getByRole('status')).toHaveText('共 2 筆型態樣本符合條件。');
});
