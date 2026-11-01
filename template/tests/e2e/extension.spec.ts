import { test, expect, chromium } from '@playwright/test';
import { resolve } from 'node:path';
import features from '../../features.json';

test('the generated extension loads its configured surfaces', async () => {
  const dist = resolve('dist');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [
      '--disable-extensions-except=' + dist,
      '--load-extension=' + dist
    ]
  });
  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    const page = await context.newPage();

    for (const [enabled, filename] of [
      [features.popup, 'popup.html'],
      [features.sidebar, 'sidebar.html'],
      [features.settings, 'options.html']
    ] as const) {
      if (!enabled) continue;
      await page.goto('chrome-extension://' + extensionId + '/' + filename);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    }

    if (features.settings) {
      await page.goto('chrome-extension://' + extensionId + '/options.html');
      await page.getByLabel('Preferred appearance').selectOption('dark');
      await page.getByRole('button', { name: 'Save settings' }).click();
      await expect(page.getByRole('status')).toHaveText('Saved');
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset.appearance)).toBe('dark');
    }

    if (features.sidebar) {
      await page.goto('chrome-extension://' + extensionId + '/sidebar.html');
      await page.evaluate(() => chrome.runtime.sendMessage({
        type: 'items.add', url: 'https://example.org/', title: 'Fixture item'
      }));
      await expect(page.getByRole('link', { name: 'Fixture item' })).toBeVisible();
      await page.getByRole('button', { name: 'Remove Fixture item' }).click();
      await expect(page.getByRole('link', { name: 'Fixture item' })).toHaveCount(0);
    }
  } finally {
    await context.close();
  }
});
