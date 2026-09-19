import { expect, test, type Locator, type Page } from 'playwright/test';

function matchup(region: Locator, page: Page, type: string) {
  return region.getByRole('listitem').filter({ has: page.getByText(type, { exact: true }) });
}

test('兩個方向直接呈現全部倍率，雙屬性計算保持一致', async ({ page }) => {
  // GIVEN / WHEN: Open Charizard's Fire/Flying matchup comparison.
  await page.goto('/pokemon/6');
  const attack = page.getByRole('region', { name: '攻擊相剋', exact: true });
  const defense = page.getByRole('region', { name: '防禦相剋', exact: true });
  // THEN: Both directions are immediately visible with all 18 types.
  await expect(attack.getByRole('listitem')).toHaveCount(18);
  await expect(defense.getByRole('listitem')).toHaveCount(18);
  await expect(attack.getByRole('listitem').last()).toBeVisible();
  await expect(defense.getByRole('listitem').last()).toBeVisible();
  await expect(attack).toContainText('對手的屬性 · 造成的倍率');
  await expect(attack).toContainText('使用火或飛行屬性招式');
  await expect(attack).toContainText('選擇其中效果最好的一種');
  await expect(defense).toContainText('對手的招式屬性 · 承受的倍率');
  for (const [type, multiplier] of [
    ['水', '1'],
    ['岩石', '0.5'],
    ['草', '2'],
  ]) {
    await expect(matchup(attack, page, type)).toHaveText(`${type}×${multiplier}`);
  }
  for (const [type, multiplier] of [
    ['岩石', '4'],
    ['草', '0.25'],
    ['地面', '0'],
    ['一般', '1'],
  ]) {
    await expect(matchup(defense, page, type)).toHaveText(`${type}×${multiplier}`);
  }
  await expect(
    page.getByText(/這裡只計算屬性相剋，不含本系加成、特性、道具與實際招式配置/),
  ).toBeVisible();
});

test('一般招式的免疫與火招式的抗性、等倍、弱點不變', async ({ page }) => {
  await page.goto('/pokemon/19');
  const attack = page.getByRole('region', { name: '攻擊相剋', exact: true });
  await expect(matchup(attack, page, '幽靈')).toHaveText('幽靈×0');
  await page.goto('/pokemon/4');
  for (const [type, multiplier] of [
    ['水', '0.5'],
    ['一般', '1'],
    ['草', '2'],
  ]) {
    await expect(matchup(attack, page, type)).toHaveText(`${type}×${multiplier}`);
  }
});

test('桌面左右排列，圖片與屬性順序表達攻擊方向', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/pokemon/1');
  const attack = page.getByRole('region', { name: '攻擊相剋', exact: true });
  const defense = page.getByRole('region', { name: '防禦相剋', exact: true });
  await expect(attack.getByText('Bulbasaur · 攻擊方')).toBeVisible();
  await expect(defense.getByText('Bulbasaur · 被攻擊方')).toBeVisible();
  const a = (await attack.boundingBox())!;
  const d = (await defense.boundingBox())!;
  expect(a.x + a.width).toBeLessThanOrEqual(d.x + 1);
  expect(Math.abs(a.y - d.y)).toBeLessThan(2);
  const source = (await attack.getByRole('figure').boundingBox())!;
  const targets = (await attack.getByRole('list').boundingBox())!;
  expect(source.y + source.height).toBeLessThan(targets.y);
  const moves = (await defense.getByRole('list').boundingBox())!;
  const recipient = (await defense.getByRole('figure').boundingBox())!;
  expect(moves.y + moves.height).toBeLessThan(recipient.y);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`手機${colorScheme}模式上下排列且沒有橫向溢出`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/pokemon/6');
    const attack = page.getByRole('region', { name: '攻擊相剋', exact: true });
    const defense = page.getByRole('region', { name: '防禦相剋', exact: true });
    await expect(matchup(attack, page, '草')).toBeVisible();
    await expect(matchup(defense, page, '岩石')).toBeVisible();
    const a = (await attack.boundingBox())!;
    const d = (await defense.boundingBox())!;
    expect(a.y + a.height).toBeLessThanOrEqual(d.y + 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
