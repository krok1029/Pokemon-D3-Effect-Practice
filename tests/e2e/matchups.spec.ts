import { expect, test } from 'playwright/test';

test('normal attacks show immunity against ghost on the detail page', async ({ page }) => {
  // GIVEN: Rattata has the Normal type in the real dataset.
  await page.goto('/pokemon/19');

  // WHEN: The visitor reads its offensive matchup wheel.
  const immunity = page.getByText('幽靈 攻擊：0×', { exact: true });

  // THEN: Immunity is preserved instead of being raised to neutral effectiveness.
  await expect(immunity).toHaveCount(1);
  const offense = page.getByRole('region', { name: '攻擊方', exact: true });
  await expect(
    offense.getByRole('listitem').filter({ has: page.getByText('幽靈', { exact: true }) }),
  ).toContainText('0×');
});

test('dual types use their better attack while defensive multipliers still combine', async ({
  page,
}) => {
  // GIVEN: The default Charizard form is Fire/Flying.
  await page.goto('/pokemon/6');

  await expect(
    page.getByText('內環為承受攻擊時的倍率；外環為自身屬性招式對單一目標屬性的最佳相剋倍率。'),
  ).toBeVisible();

  // WHEN: The visitor compares offense and defense against the same target types.
  const offense = page.getByRole('region', { name: '攻擊方', exact: true });
  const defense = page.getByRole('region', { name: '防禦方', exact: true });

  // THEN: Flying provides neutral Water coverage, while Fire/Flying has a 4× Rock weakness.
  for (const [type, multiplier] of [
    ['水', '1'],
    ['岩石', '0.5'],
    ['草', '2'],
  ]) {
    await expect(
      offense.getByRole('listitem').filter({ has: page.getByText(type, { exact: true }) }),
    ).toContainText(`${multiplier}×`);
    await expect(page.getByText(`${type} 攻擊：${multiplier}×`, { exact: true })).toHaveCount(1);
  }
  for (const [type, multiplier] of [
    ['岩石', '4'],
    ['地面', '0'],
    ['草', '0.25'],
  ]) {
    await expect(
      defense.getByRole('listitem').filter({ has: page.getByText(type, { exact: true }) }),
    ).toContainText(`${multiplier}×`);
    await expect(page.getByText(`${type} 防禦：${multiplier}×`, { exact: true })).toHaveCount(1);
  }
});

test('fire matchups distinguish resistance, neutral damage, and weakness', async ({ page }) => {
  // GIVEN: Charmander is a single Fire type.
  await page.goto('/pokemon/4');

  // WHEN: The visitor reads the offensive list and its calculation scope.
  const offense = page.getByRole('region', { name: '攻擊方', exact: true });

  // THEN: Worked examples agree between the visible list and wheel labels.
  await expect(offense).toContainText('自身屬性招式對單一目標屬性的最佳相剋倍率');
  await expect(offense).toContainText('不含本系加成、特性、道具與實際招式配置');
  for (const [type, multiplier] of [
    ['水', '0.5'],
    ['一般', '1'],
    ['草', '2'],
  ]) {
    const row = offense
      .getByRole('listitem')
      .filter({ has: page.getByText(type, { exact: true }) });
    await expect(row).toContainText(`${multiplier}×`);
    await expect(page.getByText(`${type} 攻擊：${multiplier}×`, { exact: true })).toHaveCount(1);
  }
});
