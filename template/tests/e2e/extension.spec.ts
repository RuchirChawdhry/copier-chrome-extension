import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from './fixture';

const features = JSON.parse(readFileSync(resolve('features.json'), 'utf8')) as typeof import('../../features.json');

test('configured surfaces, typed RPC, reactive storage and settings', async ({ extension }) => {
  const { context, url } = extension;
  const page = await context.newPage();
  for (const [enabled, filename] of [
    [features.popup, 'popup.html'],
    [features.sidebar, 'sidebar.html'],
    [features.settings, 'options.html'],
  ] as const) {
    if (!enabled) continue;
    await page.goto(url(filename));
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
  }

  const filename = features.sidebar ? 'sidebar.html' : features.popup ? 'popup.html' : features.settings ? 'options.html' : null;
  if (filename) {
    await page.goto(url(filename));
    const result = await page.evaluate(async () => {
      const call = (method: string, params: unknown) =>
        chrome.runtime.sendMessage({ channel: 'extension-rpc', method, params });
      const results = await Promise.all([
        call('items.add', { url: 'https://example.org/', title: 'Fixture item' }),
        call('items.add', { url: 'https://example.com/', title: 'Second item' }),
      ]);
      return {
        results,
        list: await call('items.list', null),
        invalid: await call('items.add', { url: 123 }),
        unknown: await call('constructor', null),
      };
    });
    expect(result.results.every((item) => item.ok)).toBe(true);
    expect(result.list).toMatchObject({ ok: true, value: expect.arrayContaining([
      expect.objectContaining({ title: 'Fixture item' }),
      expect.objectContaining({ title: 'Second item' }),
    ]) });
    expect(result.list.value).toHaveLength(2);
    expect(result.invalid.ok).toBe(false);
    expect(result.unknown.ok).toBe(false);
    if (features.sidebar || features.popup) {
      await expect(page.getByRole('link', { name: 'Fixture item' })).toBeVisible();
    }
    if (features.sidebar) {
      const second = await context.newPage();
      await second.goto(url('sidebar.html'));
      await expect(second.getByRole('link', { name: 'Fixture item' })).toBeVisible();
      await page.getByRole('button', { name: 'Remove Fixture item' }).click();
      await expect(second.getByRole('link', { name: 'Fixture item' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Fixture item' })).toHaveCount(0);
      await second.close();
    }
  }

  if (features.settings) {
    const second = await context.newPage();
    await second.goto(url(features.popup ? 'popup.html' : 'options.html'));
    await page.goto(url('options.html'));
    await page.getByLabel('Preferred appearance').selectOption('dark');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByRole('status')).toHaveText('Saved');
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.appearance)).toBe('dark');
    await expect.poll(() => second.evaluate(() => document.documentElement.dataset.appearance)).toBe('dark');
    await page.reload();
    await expect(page.getByLabel('Preferred appearance')).toHaveValue('dark');
    await second.close();
  }
});
