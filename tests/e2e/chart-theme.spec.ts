import { expect, test, type Locator, type Page } from 'playwright/test';

async function textColors(chart: Locator) {
  return chart.locator('text').evaluateAll((labels) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const rgb = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    const luminance = (channels: number[]) => {
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    return labels.map((label) => {
      const card = label.closest('[data-slot="card"]')!;
      const foreground = rgb(getComputedStyle(label).fill);
      const background = rgb(getComputedStyle(card).backgroundColor);
      const light = luminance(foreground);
      const dark = luminance(background);
      return {
        text: label.textContent,
        foreground,
        background,
        contrast: (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05),
      };
    });
  });
}

async function expectReadable(page: Page, chart: Locator, theme: 'light' | 'dark') {
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${theme}\\b`));
  await expect(chart.locator('text').first()).toBeVisible();
  await expect
    .poll(async () => Math.min(...(await textColors(chart)).map((label) => label.contrast)))
    .toBeGreaterThanOrEqual(4.5);
  return textColors(chart);
}

for (const name of ['HP 平均值直條圖', 'Average Pokemon stats radar chart']) {
  test(`${name}：暗色初次載入的文字有足夠對比`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/chart');
    const chart = page.getByRole('img', { name, exact: true });
    const colors = await expectReadable(page, chart, 'dark');
    await testInfo.attach('dark-text-colors', {
      body: JSON.stringify(colors, null, 2),
      contentType: 'application/json',
    });
  });

  test(`${name}：同頁隨系統切換明暗色並保持文字可讀`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/chart');
    const chart = page.getByRole('img', { name, exact: true });
    const light = await expectReadable(page, chart, 'light');
    const values = light.map((label) => label.text);

    await page.emulateMedia({ colorScheme: 'dark' });
    const dark = await expectReadable(page, chart, 'dark');
    expect(dark.map((label) => label.text)).toEqual(values);
    expect(dark.map((label) => label.foreground)).not.toEqual(
      light.map((label) => label.foreground),
    );

    await page.emulateMedia({ colorScheme: 'light' });
    expect(await expectReadable(page, chart, 'light')).toEqual(light);
    await testInfo.attach('theme-text-colors', {
      body: JSON.stringify({ light, dark }, null, 2),
      contentType: 'application/json',
    });
  });
}
