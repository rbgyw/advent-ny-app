import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { mockBackend, userId } from './fixture';
import { initialPairDeck, pairIds } from '../src/utils/pairs';
// Original package bounds in the supplied 73 × 101 px design.
const productBounds = [[3.5, 30, 66, 41], [-2.5, 23.5, 78, 54], [-11.5, 12.5, 96, 76], [15.5, 32.5, 42, 36], [-4.5, 21.5, 82, 58], [.5, 14, 72, 73], [0, 11.5, 73, 78], [-20.5, 11, 114, 79]] as const;

async function expectFlatRasterization(page: Page, board: Locator, testInfo: TestInfo, prefix: string) {
  // Isolate the PNGs: SVG stroke antialiasing can differ between compositing layers.
  const hideSvg = await page.addStyleTag({ content: '.pair-art { visibility: hidden !important; }' });
  const normal = await board.screenshot({ animations: 'disabled', path: testInfo.outputPath(`${prefix}-products.png`) });
  // Compare settled PNGs against the same artwork with all 3D effects disabled.
  const flatten = await page.addStyleTag({ content: '.pair-card-face { perspective: none !important; transform: none !important; transform-style: flat !important; backface-visibility: visible !important; -webkit-backface-visibility: visible !important; transition: none !important; } .pair-card-back { visibility: hidden !important; }' });
  const flat = await board.screenshot({ animations: 'disabled', path: testInfo.outputPath(`${prefix}-flat-reference.png`) });
  const changedPixels = await page.evaluate(async ({ normal, flat }) => {
    async function pixels(encoded: string) {
      const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, image.width, image.height).data;
    }
    const [a, b] = await Promise.all([pixels(normal), pixels(flat)]);
    let changed = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++;
    return changed;
  }, { normal: normal.toString('base64'), flat: flat.toString('base64') });
  expect(changedPixels, '3D flip must not change settled artwork rasterization').toBe(0);
  await flatten.evaluate(style => style.remove());
  await hideSvg.evaluate(style => style.remove());
}

for (const width of [393, 1440]) {
  for (const dpr of [1, 2, 3]) {
    test(`pair artwork stays proportional and sharp at ${width}px DPR ${dpr}`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({ viewport: { width, height: 1100 }, deviceScaleFactor: dpr, baseURL: testInfo.project.use.baseURL });
      const page = await context.newPage();
      try {
        const backend = await mockBackend(page);
        await page.addInitScript(({ userId, deck, matched }) => {
          const key = `advent-pairs-v1:${userId}:5`;
          if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify({ deck, matched, moves: 8 }));
        }, { userId, deck: initialPairDeck, matched: pairIds });
        await page.goto('/task/5');
        await expect(page.locator('.screen-loader')).toHaveCount(0, { timeout: 15_000 });
        await expect(page.locator('.pair-card.is-open')).toHaveCount(16);
        await expect(page.locator('.pairs-loading')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        const board = page.locator('.pairs-board');
        await board.screenshot({ path: testInfo.outputPath('cards.png'), animations: 'disabled' });
        const geometry = await page.locator('.pair-card').evaluateAll(cards => cards.map(card => {
          const face = card.querySelector('.pair-card-front')!;
          const product = card.querySelector<HTMLImageElement>('.pair-product')!;
          const bounds = card.getBoundingClientRect(), image = product.getBoundingClientRect();
          return { width: bounds.width, height: bounds.height, x: (image.left - bounds.left) / bounds.width, y: (image.top - bounds.top) / bounds.height, imageWidth: image.width / bounds.width, imageHeight: image.height / bounds.height, naturalWidth: product.naturalWidth, transform: getComputedStyle(face).transform };
        }));
        await testInfo.attach('geometry', { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' });
        for (const [index, card] of geometry.entries()) {
          const [x, y, imageWidth, imageHeight] = productBounds[initialPairDeck[index]!]!;
          expect(card.width / card.height).toBeCloseTo(73 / 101, 3);
          expect(card.x).toBeCloseTo(x / 73, 3);
          expect(card.y).toBeCloseTo(y / 101, 3);
          expect(card.imageWidth).toBeCloseTo(imageWidth / 73, 3);
          expect(card.imageHeight).toBeCloseTo(imageHeight / 101, 3);
          expect(card.naturalWidth).toBeGreaterThan(0);
          expect(card.transform).toBe('none');
        }
        await expectFlatRasterization(page, board, testInfo, 'restored');
        // Also compare after a real flip has created and then released a 3D layer.
        await page.evaluate(({ userId, deck }) => sessionStorage.setItem(`advent-pairs-v1:${userId}:5`, JSON.stringify({ deck, matched: [], moves: 0 })), { userId, deck: initialPairDeck });
        await page.reload();
        const firstCard = page.locator('.pair-card').first();
        await expect(firstCard).toBeEnabled();
        await board.screenshot({ path: testInfo.outputPath('card-backs.png') });
        await firstCard.click();
        await expect(firstCard.locator('.pair-flip-enter-active')).toHaveCount(0);
        await expect(firstCard.locator('.pair-card-front')).toHaveCSS('transform', 'none');
        await firstCard.screenshot({ path: testInfo.outputPath('flipped-card.png') });
        await expectFlatRasterization(page, firstCard, testInfo, 'flipped');
        expect(backend.calls.filter(path => path.endsWith('/save_task_progress'))).toHaveLength(0);
      } finally { await context.close(); }
    });
  }
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`pair flips, mismatches and local progress survive ${reducedMotion} motion`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion });
    const backend = await mockBackend(page);
    await page.addInitScript(({ userId, deck }) => {
      const key = `advent-pairs-v1:${userId}:5`;
      if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify({ deck, matched: [], moves: 0 }));
    }, { userId, deck: initialPairDeck });
    await page.goto('/task/5');
    const cards = page.locator('.pair-card'), first = cards.first();
    await expect(first).toBeEnabled();
    await first.click();
    if (reducedMotion === 'no-preference') {
      const transforms = await first.evaluate(card => {
        const animations = card.getAnimations({ subtree: true });
        for (const animation of animations) { animation.pause(); animation.currentTime = 240; }
        return [...card.querySelectorAll('.pair-card-face')].map(face => getComputedStyle(face).transform);
      });
      expect(transforms).toHaveLength(2);
      expect(transforms.every(transform => transform.startsWith('matrix3d('))).toBe(true);
      await first.screenshot({ path: testInfo.outputPath('halfway-flip.png') });
      await first.evaluate(card => card.getAnimations({ subtree: true }).forEach(animation => animation.finish()));
    }
    await expect(first.locator('.pair-flip-enter-active')).toHaveCount(0);
    await expect(first.locator('.pair-card-front')).toHaveCSS('transform', 'none');
    await expect(first.locator('.pair-card-back')).toHaveCount(0);
    const differentIndex = initialPairDeck.findIndex(id => id !== initialPairDeck[0]);
    await cards.nth(differentIndex).click();
    await expect(page.locator('.pairs-counters')).toContainText('Ходов: 1');
    await expect(page.locator('.pair-card.is-open')).toHaveCount(0);
    await expect(first.locator('.pair-flip-enter-active')).toHaveCount(0);
    await expect(first.locator('.pair-card-back')).toHaveCSS('transform', 'none');
    await first.click();
    const matchingIndex = initialPairDeck.findIndex((id, index) => index > 0 && id === initialPairDeck[0]);
    await cards.nth(matchingIndex).click();
    await expect(page.locator('.pair-card.is-matched')).toHaveCount(2);
    await expect(page.locator('.pairs-counters')).toContainText('Ходов: 2');
    await page.reload();
    await expect(page.locator('.pair-card.is-matched')).toHaveCount(2);
    await expect(page.locator('.pairs-counters')).toContainText('Найдено пар: 1 / 8');
    await expect(page.locator('.pairs-counters')).toContainText('Ходов: 2');
    expect(backend.calls.filter(path => path.endsWith('/save_task_progress'))).toHaveLength(0);
  });
}
