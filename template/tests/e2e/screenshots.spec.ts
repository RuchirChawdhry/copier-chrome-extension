import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from './fixture';

const features = JSON.parse(await readFile('features.json', 'utf8')) as typeof import('../../features.json');

test('capture each enabled surface in light and dark appearance', async ({ extension }, testInfo) => {
  const { context, url } = extension;
  const surfaces = [
    { enabled: features.popup, name: 'popup', file: 'popup.html', width: 360, height: 400 },
    { enabled: features.sidebar, name: 'sidebar', file: 'sidebar.html', width: 360, height: 720 },
    { enabled: features.settings, name: 'settings', file: 'options.html', width: 900, height: 700 },
  ].filter((surface) => surface.enabled);
  if (!surfaces.length) return;
  const directory = resolve('reports/screenshots');
  await mkdir(directory, { recursive: true });
  const page = await context.newPage();
  await page.goto(url(surfaces[0].file));
  await page.evaluate(() => chrome.storage.local.set({
    savedItems: [
      { id: 'fixture-1', url: 'https://example.org/', title: 'Example article', createdAt: 1 },
      { id: 'fixture-2', url: 'https://example.com/', title: 'Documentation', createdAt: 2 },
    ],
  }));
  for (const surface of surfaces) {
    await page.setViewportSize({ width: surface.width, height: surface.height });
    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((appearance) => chrome.storage.local.set({ appearance }), theme);
      await page.goto(url(surface.file));
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset.appearance)).toBe(theme);
      if (surface.name === 'settings')
        await expect(page.getByLabel('Preferred appearance')).toHaveValue(theme);
      else await expect(page.getByRole('link', { name: 'Example article' })).toBeVisible();
      const name = `${surface.name}-${theme}.png`;
      const path = resolve(directory, name);
      await page.screenshot({ path, animations: 'disabled' });
      await testInfo.attach(name, { path, contentType: 'image/png' });
    }
  }
});
