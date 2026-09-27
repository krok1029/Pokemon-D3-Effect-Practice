import { expect, test } from 'playwright/test';

test('the shared layout applies the loaded Geist font and exposes both font variables', async ({
  page,
}) => {
  // GIVEN: The home page uses the shared layout and contains Latin text.
  // WHEN: The page and its fonts finish loading.
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  // THEN: The computed body font uses Geist, and its actual font face has loaded.
  const fonts = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    return {
      className: document.body.className,
      sans: body.getPropertyValue('--font-geist-sans').trim(),
      mono: body.getPropertyValue('--font-geist-mono').trim(),
      family: body.fontFamily,
      loadedFamilies: [...document.fonts]
        .filter((font) => font.status === 'loaded')
        .map((font) => font.family.replaceAll('"', '')),
    };
  });
  expect(fonts.className).not.toContain('[object Object]');
  expect(fonts.sans).toMatch(/Geist/);
  expect(fonts.mono).toMatch(/Geist Mono/);
  const fontFamilies = (value: string) =>
    value.split(',').map((family) => family.replaceAll('"', '').trim());
  expect(fontFamilies(fonts.family)).toEqual(fontFamilies(fonts.sans));
  expect(fonts.loadedFamilies).toContain(fontFamilies(fonts.family)[0]);
});
