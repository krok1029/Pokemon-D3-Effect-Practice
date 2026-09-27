import { expect, test } from 'playwright/test';

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

for (const theme of ['light', 'dark'] as const) {
  test(`18 種圖鑑徽章在 ${theme} 主題有足夠文字與圖示對比`, async ({ page }, testInfo) => {
    // GIVEN: The visitor uses this system theme and the full catalog.
    await page.emulateMedia({ colorScheme: theme });
    const measurements = [];

    for (const type of types) {
      // WHEN: Opening each type's catalog filter.
      await page.goto(`/pokemon?type=${type}`);
      await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`));
      const icon = page.locator(`[data-pokemon-index] img[src="/types/${type}.svg"]`).first();
      await expect(icon).toBeVisible();
      const badge = icon.locator('..');
      const colors = await badge.evaluate((element) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const context = canvas.getContext('2d')!;
        const luminance = (color: string) => {
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const channels = Array.from(context.getImageData(0, 0, 1, 1).data)
            .slice(0, 3)
            .map((channel) => channel / 255)
            .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const style = getComputedStyle(element);
        const foreground = luminance(style.color);
        const background = luminance(style.backgroundColor);
        return {
          color: style.color,
          background: style.backgroundColor,
          contrast:
            (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
        };
      });

      // THEN: Small text clears AA and the icon uses the same contrasting foreground.
      expect
        .soft(colors.contrast, `${theme}/${type}: ${JSON.stringify(colors)}`)
        .toBeGreaterThanOrEqual(4.5);
      expect
        .soft(await icon.evaluate((element) => getComputedStyle(element).filter))
        .toBe(colors.color === 'rgb(255, 255, 255)' ? 'brightness(0) invert(1)' : 'brightness(0)');
      measurements.push({ type, ...colors });
    }
    await testInfo.attach(`${theme}-badge-colors`, {
      body: JSON.stringify(measurements, null, 2),
      contentType: 'application/json',
    });
  });
}
