import { expect, test, type Page } from 'playwright/test';

const labels = ['HP', '物攻', '物防', '特攻', '特防', '速度'];
// navigation.csv has three Grass/Poison forms and Mew. These expectations are hand-calculated.
const allAverages = ['76.3', '82.8', '88.8', '96.8', '96.3', '76.3'];
const nonLegendaryAverages = ['68.3', '77.0', '85.0', '95.7', '95.0', '68.3'];

async function expectAverages(page: Page, values: string[]) {
  await expect(page.locator('dl dt')).toHaveText(labels);
  await expect(page.locator('dl dd')).toHaveText(values);
  const radar = page.getByRole('img', { name: 'Average Pokemon stats radar chart' });
  await expect(radar).toBeVisible();
  await expect(radar.locator('circle title')).toHaveText(
    labels.map((label, index) => `${label}: ${values[index]}`),
  );
  await expect(radar.locator('circle')).toHaveCount(6);
  expect(
    await radar
      .locator('path')
      .evaluateAll((paths) =>
        paths.every(
          (path) => Boolean(path.getAttribute('d')) && !path.getAttribute('d')!.includes('NaN'),
        ),
      ),
  ).toBe(true);
}

async function expectBars(page: Page, stat: string, titles: string[], values: string[]) {
  const chart = page.getByRole('img', { name: `${stat} 平均值直條圖`, exact: true });
  await expect(chart).toBeVisible();
  await expect(chart.locator('rect title')).toHaveText(titles);
  await expect(chart.locator('.bars text')).toHaveText(values);
  const geometry = await chart.locator('.bars rect').evaluateAll((bars) =>
    bars.map((bar) => {
      const bounds = bar.getBoundingClientRect();
      return { x: bounds.x, height: bounds.height };
    }),
  );
  expect(
    geometry
      .slice(1)
      .every(
        (bar, index) => bar.x > geometry[index].x && bar.height <= geometry[index].height + 0.1,
      ),
  ).toBe(true);
}

for (const viewport of [
  { name: '桌面', width: 1440, height: 900 },
  { name: '手機', width: 390, height: 844 },
]) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('四筆型態樣本的六項平均值與雷達圖一致', async ({ page }) => {
      // GIVEN: The dedicated fixture server contains three Grass/Poison forms and legendary Mew.
      // WHEN: The public chart page is opened with all forms included.
      await page.goto('/chart');
      // THEN: Every displayed average and radar point matches the four-row arithmetic.
      await expect(page.getByText(/目前彙整 4 筆型態樣本，涵蓋 3 個不同圖鑑編號/)).toBeVisible();
      await expectAverages(page, allAverages);
      await expectBars(
        page,
        'HP',
        [
          'Psychic：100.0（HP，1 隻寶可夢）',
          'Grass：68.3（HP，3 隻寶可夢）',
          'Poison：68.3（HP，3 隻寶可夢）',
        ],
        ['100.0', '68.3', '68.3'],
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

    test('切換比較能力更新各屬性數值並保持降序', async ({ page }) => {
      // GIVEN: The HP comparison is populated from the four-row fixture.
      await page.goto('/chart');
      await expect(page.getByRole('img', { name: 'HP 平均值直條圖', exact: true })).toBeVisible();
      // WHEN: The visitor selects Special Attack using the public control.
      await page.getByRole('combobox', { name: '比較能力', exact: true }).selectOption('spAtk');
      // THEN: Psychic remains first; both overlapping type groups use (65 + 100 + 122) / 3.
      await expectBars(
        page,
        '特攻',
        [
          'Psychic：100.0（特攻，1 隻寶可夢）',
          'Grass：95.7（特攻，3 隻寶可夢）',
          'Poison：95.7（特攻，3 隻寶可夢）',
        ],
        ['100.0', '95.7', '95.7'],
      );
    });

    test('排除傳說同步更新六項平均、雷達與屬性比較', async ({ page }) => {
      // GIVEN: All four fixture rows participate and the comparison is set to Special Attack.
      await page.goto('/chart');
      await page.getByRole('combobox', { name: '比較能力', exact: true }).selectOption('spAtk');
      const legendaryToggle = page.getByRole('checkbox', { name: '排除傳說寶可夢' });
      await expect(legendaryToggle).not.toBeChecked();
      // WHEN: Mew is excluded through the page's legendary toggle.
      await legendaryToggle.click();
      // THEN: The three remaining forms determine the averages, and the Psychic group disappears.
      await expect(legendaryToggle).toBeChecked();
      await expect(page).toHaveURL(/excludeLegendaries=true/);
      await expect(page.getByText(/目前彙整 3 筆型態樣本，涵蓋 2 個不同圖鑑編號/)).toBeVisible();
      await expectAverages(page, nonLegendaryAverages);
      await expect(page.getByRole('combobox', { name: '比較能力', exact: true })).toHaveValue(
        'spAtk',
      );
      await expectBars(
        page,
        '特攻',
        ['Grass：95.7（特攻，3 隻寶可夢）', 'Poison：95.7（特攻，3 隻寶可夢）'],
        ['95.7', '95.7'],
      );
    });
  });
}
