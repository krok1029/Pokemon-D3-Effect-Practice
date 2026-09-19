import { expect, test, type Page } from 'playwright/test';

const charizardForms = [
  {
    name: 'Charizard',
    formId: 'charizard',
    types: ['火', '飛行'],
    stats: [78, 84, 78, 109, 85, 100],
  },
  {
    name: 'Mega Charizard X',
    formId: 'mega-charizard-x',
    types: ['火', '龍'],
    stats: [78, 130, 111, 130, 85, 100],
  },
  {
    name: 'Mega Charizard Y',
    formId: 'mega-charizard-y',
    types: ['火', '飛行'],
    stats: [78, 104, 78, 159, 115, 100],
  },
];

async function expectCharizardDetails(page: Page, form: (typeof charizardForms)[number]) {
  await expect(page.getByText(form.name, { exact: true })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(`${form.name} #006`));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    `${form.name} 的基礎能力值、屬性與傳說狀態。`,
  );
  const profile = page.locator('[data-slot="card"]').filter({ hasText: '能力值總和' });
  for (const type of form.types) {
    await expect(profile.getByText(type, { exact: true })).toBeVisible();
  }
  const stats = page.locator('[data-slot="card"]').filter({ hasText: '能力值細節' });
  for (const [index, label] of ['HP', '物攻', '物防', '特攻', '特防', '速度'].entries()) {
    await expect(stats.getByText(label, { exact: true }).locator('..')).toHaveText(
      `${label}${form.stats[index]}`,
    );
  }
}

for (const form of charizardForms) {
  test(`shared ${form.name} URL shows its own stats, types and metadata`, async ({ page }) => {
    // GIVEN: A shareable URL explicitly selects one Charizard form.
    const url = `/pokemon/6?form=${form.formId}`;

    // WHEN: The URL is opened directly.
    await page.goto(url);

    // THEN: Page and metadata identify the same form, including all six base stats.
    await expectCharizardDetails(page, form);
  });
}

test('each Charizard card links to a distinct form URL', async ({ page }) => {
  // GIVEN: The list contains all three Charizard forms.
  await page.goto('/pokemon');
  await page.getByRole('textbox', { name: '搜尋寶可夢' }).fill('Charizard');
  for (const form of charizardForms) {
    await expect(
      page.getByRole('link', { name: `查看 ${form.name} 詳情`, exact: true }),
    ).toHaveAttribute('href', new RegExp(`/pokemon/6\\?form=${form.formId}`));
  }

  // WHEN: A visitor chooses the Mega Charizard Y card.
  await page.getByRole('link', { name: '查看 Mega Charizard Y 詳情', exact: true }).click();

  // THEN: The card opens that form, rather than the first row with species number 6.
  await expect(page).toHaveURL(/\/pokemon\/6\?form=mega-charizard-y/);
  await expectCharizardDetails(page, charizardForms[2]);
});

test('refreshing a form URL preserves the same form', async ({ page }) => {
  // GIVEN: Mega Charizard X is open by its form URL.
  await page.goto('/pokemon/6?form=mega-charizard-x');

  // WHEN: The visitor refreshes the page.
  await page.reload();

  // THEN: Its URL and data still identify Mega Charizard X.
  await expect(page).toHaveURL(/form=mega-charizard-x/);
  await expectCharizardDetails(page, charizardForms[1]);
});

for (const id of ['6', '006']) {
  test(`legacy species URL ${id} opens regular Charizard`, async ({ page }) => {
    // GIVEN: A saved species-only URL predates form identity.
    // WHEN: The saved URL is opened.
    await page.goto(`/pokemon/${id}`);

    // THEN: It deterministically selects regular Charizard.
    await expectCharizardDetails(page, charizardForms[0]);
  });
}

test('regional form URLs preserve their own name and types', async ({ page }) => {
  // GIVEN: Alolan and regular Raichu share species number 26.
  // WHEN: The regional form URL is opened.
  await page.goto('/pokemon/26?form=alolan-raichu');

  // THEN: Its distinct name and secondary type are rendered.
  await expect(page.getByText('Alolan Raichu', { exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/Alolan Raichu #026/);
  const profile = page.locator('[data-slot="card"]').filter({ hasText: '能力值總和' });
  await expect(profile.getByText('電', { exact: true })).toBeVisible();
  await expect(profile.getByText('超能力', { exact: true })).toBeVisible();
});

for (const suffix of [
  '6oops',
  '6.1',
  '0',
  '-1',
  '9007199254740993',
  '99999',
  '6?form=',
  '6?form=missing-form',
  '6?form=raichu',
  '6?form=charizard&form=mega-charizard-x',
]) {
  test(`invalid detail URL ${suffix} shows not found`, async ({ page }) => {
    // GIVEN: The URL has an invalid number or explicitly unavailable/ambiguous form.
    // WHEN: The visitor requests the URL.
    await page.goto(`/pokemon/${suffix}`);

    // THEN: No unrelated form is silently displayed.
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByText('能力值細節', { exact: true })).toHaveCount(0);
  });
}
