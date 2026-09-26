import { expect, test, type Locator, type Page } from 'playwright/test';

test.use({ viewport: { width: 1440, height: 1100 } });

async function pointCenter(point: Locator) {
  return point.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  });
}

async function brushPoint(page: Page, point: Locator) {
  const center = await pointCenter(point);
  await page.mouse.move(center.x - 3, center.y - 3);
  await page.mouse.down();
  await page.mouse.move(center.x + 3, center.y + 3, { steps: 4 });
  await page.mouse.up();
}

for (const selectionSource of ['search', 'brush'] as const) {
  test(`selected point tracks continuous pan and can be reselected: ${selectionSource}`, async ({
    page,
  }) => {
    // GIVEN: Bulbasaur is selected before a gesture that clears the selection.
    await page.goto('/chart');
    const plot = page.getByRole('img', { name: '寶可夢能力散佈圖', exact: true });
    const point = plot
      .locator('circle.dot')
      .filter({ has: page.locator('title', { hasText: /^Bulbasaur（/ }) });
    const selection = page.getByRole('complementary', { name: '選取寶可夢' });
    const bulbasaurLink = selection.getByRole('link', { name: '查看 Bulbasaur 詳情', exact: true });
    if (selectionSource === 'search') {
      await page.getByRole('searchbox', { name: '搜尋圖表中的寶可夢' }).fill('Bulbasaur');
      await page.getByRole('button', { name: '選取 Bulbasaur', exact: true }).click();
    } else {
      await plot.scrollIntoViewIfNeeded();
      await brushPoint(page, point);
    }
    await expect(bulbasaurLink).toHaveAttribute('href', '/pokemon/1?form=bulbasaur');
    await expect(point).toHaveAttribute('fill-opacity', '1');
    await expect(plot.locator('.brush .selection')).toBeHidden();
    await plot.scrollIntoViewIfNeeded();
    const initial = await pointCenter(point);
    const bounds = await plot.locator('.brush .overlay').boundingBox();
    if (!bounds) throw new Error('Plot bounds must be visible');
    const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

    // WHEN: The same middle-button gesture continues after React clears selection.
    await page.mouse.move(start.x, start.y);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(start.x + 20, start.y);
    await expect(selection.getByRole('link')).toHaveCount(0);
    await expect(point).toHaveAttribute('fill-opacity', '0.75');
    for (const distance of [40, 80, 120]) {
      await page.mouse.move(start.x + distance, start.y, { steps: 4 });
      const rendered = await pointCenter(point);
      expect
        .soft(rendered.x - initial.x, `Rendered point follows the ${distance}px drag`)
        .toBeCloseTo(distance, 0);
      expect.soft(rendered.y).toBeCloseTo(initial.y, 0);
    }
    await page.mouse.up({ button: 'middle' });
    await brushPoint(page, point);

    // THEN: Brushing the visible point selects that exact form, with its highlight restored.
    await expect(bulbasaurLink).toHaveAttribute('href', '/pokemon/1?form=bulbasaur');
    await expect(point).toHaveAttribute('fill-opacity', '1');
    await expect(point).toHaveAttribute('stroke-width', '1.4');
    await expect(plot.locator('.brush .selection')).toBeHidden();
  });
}
