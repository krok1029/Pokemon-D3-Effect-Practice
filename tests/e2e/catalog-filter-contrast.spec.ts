import { expect, test, type Locator } from 'playwright/test';
const types = [
  'bug',
  'dark',
  'dragon',
  'electric',
  'fairy',
  'fighting',
  'fire',
  'flying',
  'ghost',
  'grass',
  'ground',
  'ice',
  'normal',
  'poison',
  'psychic',
  'rock',
  'steel',
  'water',
];

async function measure(button: Locator) {
  return button.evaluate((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const ancestors: Element[] = [];
    for (let current: Element | null = element; current; current = current.parentElement) {
      ancestors.unshift(current);
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 1, 1);
    for (const ancestor of ancestors) {
      context.fillStyle = getComputedStyle(ancestor).backgroundColor;
      context.fillRect(0, 0, 1, 1);
    }
    const background = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    context.fillStyle = getComputedStyle(element).color;
    context.fillRect(0, 0, 1, 1);
    const foreground = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    const luminance = (channels: number[]) => {
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const light = luminance(foreground);
    const dark = luminance(background);
    return {
      foreground,
      background,
      opacity: getComputedStyle(element).opacity,
      contrast: (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05),
    };
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`18 種圖鑑篩選在 ${theme} 主題選取及取消都可讀`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    // GIVEN: All type controls are available in the chosen system theme.
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/pokemon');
    await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`));
    const fieldset = page.getByRole('group', { name: '搜尋與篩選寶可夢' });
    const measurements = [];
    for (const type of types) {
      const icon = fieldset.locator(`img[src="/types/${type}.svg"]`);
      const button = icon.locator('..');
      // WHEN: Selecting each type and then clearing that selection.
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => button.evaluate((element) => element.getAnimations().length)).toBe(0);
      await expect(page).toHaveURL(new RegExp(`[?&]type=${type}(?:&|$)`));
      await expect.poll(async () => (await measure(button)).contrast).toBeGreaterThanOrEqual(4.5);
      const selected = await measure(button);
      const filter = await icon.evaluate((element) => getComputedStyle(element).filter);
      expect(filter).toBe(
        selected.foreground.every((channel) => channel === 255)
          ? 'brightness(0) invert(1)'
          : 'brightness(0)',
      );
      await expect(icon).toBeVisible();
      expect(
        await icon.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      await expect.poll(() => button.evaluate((element) => element.getAnimations().length)).toBe(0);
      await expect(page).toHaveURL(/\/pokemon$/);
      // THEN: Both states retain AA text contrast and the selected glyph contrasts with its fill.
      await expect.poll(async () => (await measure(button)).contrast).toBeGreaterThanOrEqual(4.5);
      const unselected = await measure(button);
      expect(selected.opacity).toBe('1');
      expect(unselected.opacity).toBe('1');
      expect(await icon.evaluate((element) => getComputedStyle(element).filter)).toBe('none');
      measurements.push({ type, selected, unselected });
    }
    await testInfo.attach(`${theme}-filter-contrast`, {
      body: JSON.stringify(measurements, null, 2),
      contentType: 'application/json',
    });
  });
}
