import { expect, test } from 'playwright/test';

test('dashboard shows total pokemon count card', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('網站統計寶可夢數：')).toBeVisible();
});
