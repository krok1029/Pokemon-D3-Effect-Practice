import { expect, test, type Locator, type Page } from 'playwright/test';

function matchup(region: Locator, page: Page, type: string) {
  return region.getByRole('listitem').filter({ has: page.getByText(type, { exact: true }) });
}

test('防禦先呈現弱點、抗性與免疫，展開後仍可查閱全部屬性', async ({ page }) => {
  // GIVEN: Charizard is Fire/Flying.
  await page.goto('/pokemon/6');
  const defense = page.getByRole('region', { name: '防禦相剋', exact: true });

  // THEN: Group labels and visible numbers explain both direction and magnitude.
  await expect(defense).toContainText('下列屬性是對手的招式');
  await expect(
    matchup(defense.getByRole('region', { name: '弱點', exact: true }), page, '岩石'),
  ).toHaveText('岩石4×');
  await expect(
    matchup(defense.getByRole('region', { name: '抗性', exact: true }), page, '草'),
  ).toHaveText('草0.25×');
  await expect(
    matchup(defense.getByRole('region', { name: '免疫', exact: true }), page, '地面'),
  ).toHaveText('地面0×');
  await expect(matchup(defense, page, '一般')).not.toBeVisible();

  // WHEN: The visitor expands neutral damage with the keyboard.
  const normal = defense.locator('summary');
  await normal.focus();
  await page.keyboard.press('Enter');

  // THEN: All 18 defense types remain available without a scrolling subpanel.
  await expect(matchup(defense, page, '一般')).toBeVisible();
  await expect(matchup(defense, page, '一般')).toHaveText('一般1×');
  await expect(defense.getByRole('listitem')).toHaveCount(18);
});

test('雙屬性攻擊另行展開並使用最佳倍率', async ({ page }) => {
  // GIVEN: Offensive information starts collapsed.
  await page.goto('/pokemon/6');
  const offense = page.getByRole('region', { name: '攻擊相剋', exact: true });
  await expect(offense).not.toBeVisible();

  // WHEN: The visitor asks which opponent types are easier to attack.
  await page.getByText('攻擊時：打哪些屬性更有效？', { exact: true }).click();

  // THEN: Opponent types are clearly distinguished from move types.
  await expect(offense).toContainText('下列屬性是對手的屬性');
  await expect(offense).toContainText('選擇其中效果最好的一種');
  for (const [type, multiplier] of [
    ['水', '1'],
    ['岩石', '0.5'],
    ['草', '2'],
  ]) {
    await expect(matchup(offense, page, type)).toHaveText(`${type}${multiplier}×`);
  }
  await expect(offense.getByRole('listitem')).toHaveCount(18);
  await expect(
    page.getByText(/這裡只計算屬性相剋，不含本系加成、特性、道具與實際招式配置/),
  ).toBeVisible();
});

test('一般攻擊保留幽靈免疫，火屬性保留抗性與弱點', async ({ page }) => {
  // GIVEN / WHEN: Open each representative single-type Pokémon's offense section.
  await page.goto('/pokemon/19');
  await page.getByText('攻擊時：打哪些屬性更有效？', { exact: true }).click();
  const offense = page.getByRole('region', { name: '攻擊相剋', exact: true });
  await expect(
    matchup(offense.getByRole('region', { name: '無法造成傷害', exact: true }), page, '幽靈'),
  ).toHaveText('幽靈0×');

  await page.goto('/pokemon/4');
  await expect(page.getByText('沒有免疫的屬性', { exact: true })).toBeVisible();
  await page.getByText('攻擊時：打哪些屬性更有效？', { exact: true }).click();
  // THEN: The UI retains every previously verified calculation.
  for (const [type, multiplier] of [
    ['水', '0.5'],
    ['一般', '1'],
    ['草', '2'],
  ]) {
    await expect(matchup(offense, page, type)).toHaveText(`${type}${multiplier}×`);
  }
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`手機${colorScheme}模式可閱讀與展開，沒有橫向溢出`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/pokemon/6');
    const weakness = page.getByRole('region', { name: '弱點', exact: true });
    await expect(matchup(weakness, page, '岩石')).toBeVisible();
    await page.getByText('攻擊時：打哪些屬性更有效？', { exact: true }).click();
    await expect(page.getByRole('region', { name: '攻擊相剋', exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
