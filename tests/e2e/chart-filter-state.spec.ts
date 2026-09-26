import { expect, test, type Page } from 'playwright/test';

test.use({ viewport: { width: 1440, height: 1100 } });

const selection = (page: Page) => page.getByRole('complementary', { name: '選取寶可夢' });
const selectedLink = (page: Page, name: string) =>
  selection(page).getByRole('link', { name: `查看 ${name} 詳情`, exact: true });

async function selectVisiblePlot(page: Page) {
  const plot = page.getByRole('img', { name: '寶可夢能力散佈圖', exact: true });
  await plot.scrollIntoViewIfNeeded();
  const box = await plot.boundingBox();
  if (!box) throw new Error('Scatter plot must be visible');
  await page.mouse.move(box.x + box.width * 0.09, box.y + box.height * 0.065);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.96, box.y + box.height * 0.88, { steps: 12 });
  await page.mouse.up();
}

test('legendary round trips preserve the chosen axes and hidden primary type', async ({ page }) => {
  // GIVEN: The visitor analyzes special attack against speed with Fire hidden.
  await page.goto('/chart');
  const xAxis = page.getByRole('combobox', { name: 'X 軸', exact: true });
  const yAxis = page.getByRole('combobox', { name: 'Y 軸', exact: true });
  const fire = page
    .getByRole('region', { name: '主屬性篩選' })
    .getByRole('button', { name: '火', exact: true });
  const legendaryToggle = page.getByRole('checkbox', { name: /排除傳說寶可夢/ });
  await xAxis.selectOption('spAtk');
  await yAxis.selectOption('speed');
  await fire.click();

  // WHEN: The same analysis is compared without and then with legendary samples.
  await legendaryToggle.click();

  // THEN: Only the sample population changes in each direction.
  await expect(page).toHaveURL(/excludeLegendaries=true/);
  await expect(legendaryToggle).toBeChecked();
  await expect(legendaryToggle).toBeEnabled();
  await expect(xAxis).toHaveValue('spAtk');
  await expect(yAxis).toHaveValue('speed');
  await expect(fire).toHaveAttribute('aria-pressed', 'false');
  await selectVisiblePlot(page);
  await expect(selectedLink(page, 'Bulbasaur')).toHaveCount(1);
  await expect(selectedLink(page, 'Charizard')).toHaveCount(0);
  await expect(selectedLink(page, 'Mewtwo')).toHaveCount(0);

  await legendaryToggle.click();
  await expect(page).toHaveURL(/\/chart$/);
  await expect(legendaryToggle).not.toBeChecked();
  await expect(legendaryToggle).toBeEnabled();
  await expect(xAxis).toHaveValue('spAtk');
  await expect(yAxis).toHaveValue('speed');
  await expect(fire).toHaveAttribute('aria-pressed', 'false');
  await selectVisiblePlot(page);
  await expect(selectedLink(page, 'Bulbasaur')).toHaveCount(1);
  await expect(selectedLink(page, 'Charizard')).toHaveCount(0);
  await expect(selectedLink(page, 'Mewtwo')).toHaveCount(1);
});

test('excluding legendaries prunes only unavailable selected samples', async ({ page }) => {
  // GIVEN: The current selection contains ordinary and legendary samples.
  await page.goto('/chart');
  await selectVisiblePlot(page);
  await expect(selectedLink(page, 'Bulbasaur')).toHaveCount(1);
  await expect(selectedLink(page, 'Mewtwo')).toHaveCount(1);

  // WHEN: The visitor excludes legendary samples without making another selection.
  await page.getByRole('checkbox', { name: /排除傳說寶可夢/ }).click();

  // THEN: Existing ordinary selections remain, and removed samples leave no stale details.
  await expect(page).toHaveURL(/excludeLegendaries=true/);
  await expect(page.getByRole('checkbox', { name: /排除傳說寶可夢/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /排除傳說寶可夢/ })).toBeEnabled();
  await expect(selectedLink(page, 'Bulbasaur')).toHaveCount(1);
  await expect(selectedLink(page, 'Mewtwo')).toHaveCount(0);
  await expect(selection(page).getByText('傳說', { exact: true })).toHaveCount(0);
});
