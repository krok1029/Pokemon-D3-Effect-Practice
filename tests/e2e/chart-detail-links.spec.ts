import { expect, test, type Locator, type Page } from 'playwright/test';

test.use({ viewport: { width: 1440, height: 1100 } });

const forms = [
  {
    name: 'Charizard',
    form: 'charizard',
    types: ['火', '飛行'],
    stats: [78, 84, 78, 109, 85, 100],
  },
  {
    name: 'Mega Charizard X',
    form: 'mega-charizard-x',
    types: ['火', '龍'],
    stats: [78, 130, 111, 130, 85, 100],
  },
  {
    name: 'Mega Charizard Y',
    form: 'mega-charizard-y',
    types: ['火', '飛行'],
    stats: [78, 104, 78, 159, 115, 100],
  },
];
const labels = ['HP', '物攻', '物防', '特攻', '特防', '速度'];
const selection = (page: Page) => page.getByRole('complementary', { name: '選取寶可夢' });
const formLink = (page: Page, name: string) =>
  selection(page).getByRole('link', { name: `查看 ${name} 詳情`, exact: true });

async function dragPlot(page: Page, button: 'left' | 'middle' = 'left') {
  const plot = page.getByRole('img', { name: '寶可夢能力散佈圖', exact: true });
  await plot.scrollIntoViewIfNeeded();
  const box = await plot.boundingBox();
  if (!box) throw new Error('Scatter plot must be visible');
  // Drag across the visible plotting surface; do not inspect D3 nodes or bound data.
  const start = button === 'left' ? [0.09, 0.065] : [0.45, 0.45];
  const end = button === 'left' ? [0.96, 0.88] : [0.6, 0.55];
  await page.mouse.move(box.x + box.width * start[0], box.y + box.height * start[1]);
  await page.mouse.down({ button });
  await page.mouse.move(box.x + box.width * end[0], box.y + box.height * end[1], { steps: 12 });
  await page.mouse.up({ button });
}

async function expectStats(container: Locator, stats: number[]) {
  for (const [index, label] of labels.entries()) {
    await expect(container.getByText(label, { exact: true }).locator('..')).toHaveText(
      `${label}${stats[index]}`,
    );
  }
}

async function expectDetails(page: Page, form: (typeof forms)[number]) {
  await expect(page.getByText(form.name, { exact: true })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(`${form.name} #006`));
  const profile = page.locator('[data-slot="card"]').filter({ hasText: '能力值總和' });
  for (const type of form.types)
    await expect(profile.getByText(type, { exact: true })).toBeVisible();
  await expectStats(
    page.locator('[data-slot="card"]').filter({ hasText: '能力值細節' }),
    form.stats,
  );
}

for (const form of forms) {
  test(`brush result opens ${form.name} with matching data and a shareable URL`, async ({
    page,
    context,
  }) => {
    // GIVEN: A real brush selects the three forms that share species number 6.
    await page.goto('/chart');
    await dragPlot(page);
    const link = formLink(page, form.name);
    await expect(link).toHaveAttribute('href', `/pokemon/6?form=${form.form}`);
    const row = selection(page)
      .getByRole('listitem')
      .filter({
        has: page.getByRole('link', { name: `查看 ${form.name} 詳情`, exact: true }),
      });
    await expectStats(row, form.stats);
    for (const type of form.types) await expect(row.getByText(type, { exact: true })).toBeVisible();
    await link.focus();
    await expect(link).toBeFocused();
    const href = await link.getAttribute('href');

    // WHEN: The visitor activates the selected form's link using the keyboard.
    await page.keyboard.press('Enter');

    // THEN: Navigation, refresh and an independent shared URL all preserve that form.
    await expect(page).toHaveURL(new RegExp(`/pokemon/6\\?form=${form.form}$`));
    await expectDetails(page, form);
    await page.reload();
    await expectDetails(page, form);
    const shared = await context.newPage();
    await shared.goto(href!);
    await expectDetails(shared, form);
    await shared.close();
  });
}

test('legend explains and applies primary-type filtering', async ({ page }) => {
  // GIVEN: All Charizard forms have Fire as primary and Dragon/Flying as secondary.
  await page.goto('/chart');
  const legend = page.getByRole('region', { name: '主屬性篩選' });
  await expect(legend).toContainText('散佈圖依主屬性篩選與著色；圖鑑的屬性篩選則比對主、副屬性。');

  // WHEN: Secondary types are hidden before brushing.
  await legend.getByRole('button', { name: '龍', exact: true }).click();
  await legend.getByRole('button', { name: '飛行', exact: true }).click();
  await dragPlot(page);

  // THEN: All three Fire-primary forms remain available.
  for (const form of forms) await expect(formLink(page, form.name)).toHaveCount(1);
});

test('hiding the primary type removes selected forms and reset restores them', async ({ page }) => {
  // GIVEN: The brush includes all Charizard forms.
  await page.goto('/chart');
  await dragPlot(page);
  const legend = page.getByRole('region', { name: '主屬性篩選' });

  // WHEN: Their primary type is hidden.
  await legend.getByRole('button', { name: '火', exact: true }).click();

  // THEN: The selection no longer offers these hidden forms; reset makes them selectable again.
  for (const form of forms) await expect(formLink(page, form.name)).toHaveCount(0);
  await legend.getByRole('button', { name: '重設', exact: true }).click();
  await dragPlot(page);
  for (const form of forms) await expect(formLink(page, form.name)).toHaveCount(1);
});

test('changing axes clears the selection and allows a new brush', async ({ page }) => {
  // GIVEN: A selection is displayed on the initial axes.
  await page.goto('/chart');
  await dragPlot(page);
  await expect(formLink(page, forms[0].name)).toHaveCount(1);

  // WHEN: The visitor chooses different abilities for both axes.
  await page.getByRole('combobox', { name: 'X 軸', exact: true }).selectOption('spAtk');
  await page.getByRole('combobox', { name: 'Y 軸', exact: true }).selectOption('speed');

  // THEN: The empty prompt remains usable, and a new brush uses the selected abilities.
  await expect(selection(page)).toContainText('從散佈圖中拖曳滑鼠框選區域');
  await expect(selection(page).getByRole('link')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'X 軸', exact: true })).toHaveValue('spAtk');
  await expect(page.getByRole('combobox', { name: 'Y 軸', exact: true })).toHaveValue('speed');
  await dragPlot(page);
  for (const form of forms) await expect(formLink(page, form.name)).toHaveCount(1);
});

test('zoom and middle-button pan keep brushing usable', async ({ page }) => {
  // GIVEN: The full initial plotting range is selected.
  await page.goto('/chart');
  await dragPlot(page);
  const count = await selection(page).getByRole('link').count();

  // WHEN: The visitor zooms into the data and brushes the visible range.
  await page.getByRole('button', { name: '放大', exact: true }).click();
  await dragPlot(page);

  // THEN: Fewer samples fit; zooming out restores a wider range and panning clears selection.
  await expect.poll(() => selection(page).getByRole('link').count()).toBeLessThan(count);
  await page.getByRole('button', { name: '縮小', exact: true }).click();
  await dragPlot(page);
  await expect.poll(() => selection(page).getByRole('link').count()).toBeGreaterThanOrEqual(count);
  await dragPlot(page, 'middle');
  await expect(selection(page).getByRole('link')).toHaveCount(0);
  await dragPlot(page);
  await expect.poll(() => selection(page).getByRole('link').count()).toBeGreaterThan(0);
});

test('excluding legendaries removes their links while ordinary forms remain selectable', async ({
  page,
}) => {
  // GIVEN: Legendary Mewtwo is initially available in the selection.
  await page.goto('/chart');
  await dragPlot(page);
  await expect(formLink(page, 'Mewtwo')).toHaveCount(1);

  // WHEN: Legendary samples are excluded.
  await page.getByRole('checkbox', { name: /排除傳說寶可夢/ }).click();

  // THEN: A fresh brush offers ordinary forms without legendary links.
  await expect(page).toHaveURL(/excludeLegendaries=true/);
  await expect(page.getByRole('checkbox', { name: /排除傳說寶可夢/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /排除傳說寶可夢/ })).toBeEnabled();
  await dragPlot(page);
  await expect(formLink(page, 'Mewtwo')).toHaveCount(0);
  for (const form of forms) await expect(formLink(page, form.name)).toHaveCount(1);
});
