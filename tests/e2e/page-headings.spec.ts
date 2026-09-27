import { expect, test } from 'playwright/test';

for (const width of [375, 1280]) {
  test(`詳細頁以型態名稱為主標題，能力與相剋為第二層（${width}px）`, async ({ page }) => {
    // GIVEN: A visitor uses a mobile or desktop viewport.
    await page.setViewportSize({ width, height: 900 });

    // WHEN: Opening a specific form directly.
    await page.goto('/pokemon/6?form=mega-charizard-x');

    // THEN: Heading navigation exposes the form and both main detail sections.
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Mega Charizard X');
    await expect(main.getByRole('heading', { level: 2 })).toHaveText([
      '能力值細節',
      '屬性相剋對照',
    ]);
    await expect(main.getByRole('heading', { level: 3 })).toHaveText(['攻擊方', '被攻擊方']);
  });

  test(`圖表頁標題導覽包含三張圖表（${width}px）`, async ({ page }) => {
    // GIVEN: A visitor uses a mobile or desktop viewport.
    await page.setViewportSize({ width, height: 900 });

    // WHEN: Opening the chart page.
    await page.goto('/chart');

    // THEN: Every chart is reachable by its level-two heading below the page title.
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('寶可夢能力平均值');
    await expect(main.getByRole('heading', { level: 2 })).toHaveText([
      '六項能力雷達圖',
      '依屬性比較能力平均值',
      '能力散佈圖',
    ]);
    await expect(main.getByRole('heading', { level: 3 }).first()).toHaveText('搜尋並選取寶可夢');
  });
}
