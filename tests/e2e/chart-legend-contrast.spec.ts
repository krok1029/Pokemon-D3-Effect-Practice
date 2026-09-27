import { expect, test, type Locator } from 'playwright/test';

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
  test(`18 種散佈圖圖例在 ${theme} 主題選取及取消都可讀`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    // GIVEN: All primary types are enabled in the chosen system theme.
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/chart');
    await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`));
    const legend = page.getByRole('region', { name: '主屬性篩選', exact: true });
    const buttons = legend.locator('button[aria-pressed]');
    await expect(buttons).toHaveCount(18);
    const measurements = [];
    for (let index = 0; index < 18; index += 1) {
      const button = buttons.nth(index);
      const icon = button.locator('img');
      const label = await button.innerText();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => button.evaluate((element) => element.getAnimations().length)).toBe(0);
      await expect.poll(async () => (await measure(button)).contrast).toBeGreaterThanOrEqual(4.5);
      const selected = await measure(button);
      await button.scrollIntoViewIfNeeded();
      await expect(icon).toBeVisible();
      await expect
        .poll(() => icon.evaluate((element) => (element as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      const glyph = await measure(icon.locator('..'));
      expect(glyph.contrast).toBeGreaterThanOrEqual(4.5);
      expect(await icon.evaluate((element) => getComputedStyle(element).filter)).toBe(
        glyph.foreground.every((channel) => channel === 255)
          ? 'brightness(0) invert(1)'
          : 'brightness(0)',
      );
      // WHEN: Excluding a type using the keyboard.
      await button.focus();
      await button.press('Space');
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      await expect.poll(() => button.evaluate((element) => element.getAnimations().length)).toBe(0);
      // THEN: It remains readable, keeps its identifying color, and can be restored.
      await expect.poll(async () => (await measure(button)).contrast).toBeGreaterThanOrEqual(4.5);
      const unselected = await measure(button);
      expect(selected.opacity).toBe('1');
      expect(unselected.opacity).toBe('1');
      expect(unselected.background).not.toEqual(selected.background);
      expect(await measure(icon.locator('..'))).toEqual(glyph);
      await button.press('Space');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => button.evaluate((element) => element.getAnimations().length)).toBe(0);
      measurements.push({ label, selected, unselected, glyph });
    }
    await testInfo.attach(`${theme}-legend-contrast`, {
      body: JSON.stringify(measurements, null, 2),
      contentType: 'application/json',
    });
  });
}
