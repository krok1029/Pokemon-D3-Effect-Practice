import { expect, test, type Locator, type Page, type TestInfo } from 'playwright/test';

test.use({ viewport: { width: 1440, height: 1100 } });

const scatterPlot = (page: Page) =>
  page.getByRole('img', { name: '寶可夢能力散佈圖', exact: true });

async function waitForPointPositions(plot: Locator) {
  await plot.evaluate(
    (svg) =>
      new Promise<void>((resolve) => {
        let previous = '';
        let stableFrames = 0;
        const inspect = () => {
          const positions = Array.from(svg.querySelectorAll('circle.dot'), (dot) =>
            ['cx', 'cy'].map((attribute) => dot.getAttribute(attribute)).join(','),
          ).join(';');
          stableFrames = positions === previous ? stableFrames + 1 : 0;
          previous = positions;
          if (stableFrames >= 3) resolve();
          else requestAnimationFrame(inspect);
        };
        requestAnimationFrame(inspect);
      }),
  );
}

async function zoom(page: Page, direction: '放大' | '縮小', count: number) {
  for (let index = 0; index < count; index += 1) {
    await page.getByRole('button', { name: direction, exact: true }).click();
    await waitForPointPositions(scatterPlot(page));
  }
}

async function dragPlot(page: Page, button: 'left' | 'middle') {
  const plot = scatterPlot(page);
  await plot.scrollIntoViewIfNeeded();
  const box = await plot.boundingBox();
  if (!box) throw new Error('Scatter plot must be visible');
  const start = button === 'left' ? [0.09, 0.065] : [0.45, 0.45];
  const end = button === 'left' ? [0.96, 0.88] : [0.55, 0.5];
  await page.mouse.move(box.x + box.width * start[0], box.y + box.height * start[1]);
  await page.mouse.down({ button });
  await page.mouse.move(box.x + box.width * end[0], box.y + box.height * end[1], { steps: 12 });
  await page.mouse.up({ button });
}

async function expectDotsConfinedToPlot(page: Page, testInfo: TestInfo, step: string) {
  const plot = scatterPlot(page);
  await plot.scrollIntoViewIfNeeded();
  await waitForPointPositions(plot);
  const svgBox = await plot.boundingBox();
  const plotBox = await plot.locator('.brush .overlay').boundingBox();
  if (!svgBox || !plotBox) throw new Error('Scatter plot and plotting bounds must be visible');

  const rendered = await plot.screenshot({ scale: 'css' });
  const withoutDots = await plot.screenshot({
    scale: 'css',
    style: 'svg[aria-label="寶可夢能力散佈圖"] circle.dot { visibility: hidden !important; }',
  });
  const changedPixels = await page.evaluate(
    async ({ withDots, withoutDots, bounds, svgWidth, svgHeight }) => {
      const readImage = async (data: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is required for rendered pixel verification');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const [visible, hidden] = await Promise.all([readImage(withDots), readImage(withoutDots)]);
      let outside = 0;
      let inside = 0;
      for (let y = 0; y < visible.height; y += 1) {
        for (let x = 0; x < visible.width; x += 1) {
          const offset = (y * visible.width + x) * 4;
          const changed = [0, 1, 2, 3].some(
            (channel) => visible.data[offset + channel] !== hidden.data[offset + channel],
          );
          if (!changed) continue;
          const cssX = (x / visible.width) * svgWidth;
          const cssY = (y / visible.height) * svgHeight;
          if (
            cssX < bounds.left - 2 ||
            cssX > bounds.right + 2 ||
            cssY < bounds.top - 2 ||
            cssY > bounds.bottom + 2
          ) {
            outside += 1;
          } else if (
            cssX > bounds.left + 2 &&
            cssX < bounds.right - 2 &&
            cssY > bounds.top + 2 &&
            cssY < bounds.bottom - 2
          ) {
            inside += 1;
          }
        }
      }
      return { outside, inside };
    },
    {
      withDots: rendered.toString('base64'),
      withoutDots: withoutDots.toString('base64'),
      bounds: {
        left: plotBox.x - svgBox.x,
        top: plotBox.y - svgBox.y,
        right: plotBox.x + plotBox.width - svgBox.x,
        bottom: plotBox.y + plotBox.height - svgBox.y,
      },
      svgWidth: svgBox.width,
      svgHeight: svgBox.height,
    },
  );
  await testInfo.attach(`${step}-rendered-plot`, { body: rendered, contentType: 'image/png' });
  expect(changedPixels.outside, `${step}: dots must not paint over axes or margins`).toBe(0);
  expect(changedPixels.inside, `${step}: in-range dots must still render`).toBeGreaterThan(100);
}

for (const layout of ['desktop', 'changed axes, data and viewport'] as const) {
  test(`zoom and pan keep rendered dots within the plot: ${layout}`, async ({ page }, testInfo) => {
    // GIVEN: A real chart, including a redraw after axis/data changes and a narrower viewport.
    await page.goto('/chart?excludeLegendaries=true');
    if (layout === 'changed axes, data and viewport') {
      await page.getByRole('combobox', { name: 'X 軸', exact: true }).selectOption('spAtk');
      await page.getByRole('combobox', { name: 'Y 軸', exact: true }).selectOption('speed');
      await page.getByRole('checkbox', { name: /排除傳說寶可夢/ }).click();
      await expect(page).toHaveURL(/\/chart$/);
      await expect(page.getByRole('checkbox', { name: /排除傳說寶可夢/ })).not.toBeChecked();
      await expect(page.getByRole('checkbox', { name: /排除傳說寶可夢/ })).toBeEnabled();
      await page.setViewportSize({ width: 760, height: 1100 });
    }

    // WHEN: The visitor magnifies the chart six times using its controls.
    await zoom(page, '放大', 6);

    // THEN: Pixels outside the plotting surface are unchanged when dots are hidden.
    await expectDotsConfinedToPlot(page, testInfo, 'zoomed');
    await dragPlot(page, 'left');
    const selection = page.getByRole('complementary', { name: '選取寶可夢' });
    await expect.poll(() => selection.getByRole('link').count()).toBeGreaterThan(0);
    await dragPlot(page, 'middle');
    await expect(selection.getByRole('link')).toHaveCount(0);
    await expectDotsConfinedToPlot(page, testInfo, 'panned');
    await zoom(page, '縮小', 3);
    await expectDotsConfinedToPlot(page, testInfo, 'zoomed-out');
    await dragPlot(page, 'left');
    await expect.poll(() => selection.getByRole('link').count()).toBeGreaterThan(0);
    await expect(selection.getByRole('link').first()).toHaveAttribute(
      'href',
      /\/pokemon\/\d+\?form=[a-z0-9-]+$/,
    );
    await expect(scatterPlot(page).locator('circle.dot title').first()).toHaveText(/.+（.+）/);
  });
}
