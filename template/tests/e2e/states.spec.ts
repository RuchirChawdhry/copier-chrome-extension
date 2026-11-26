import { readFileSync } from 'node:fs';
import { expect, test } from './fixture';

const features = JSON.parse(
  readFileSync('extension.config.json', 'utf8'),
) as typeof import('../../extension.config.json');

test('sidebar shows loading, failure, retry and empty states', async ({
  extension,
}) => {
  test.skip(!features.sidebar, 'Sidebar disabled');
  const page = await extension.context.newPage();
  // Fault injection at the browser API boundary, not a production fallback.
  await page.addInitScript(() => {
    const area = chrome.storage.local;
    const get = area.get.bind(area);
    let first = true;
    Object.defineProperty(area, 'get', {
      value: (key: string) => {
        if (key !== 'example.links' || !first) return get(key);
        first = false;
        return new Promise((_, reject) => {
          window.addEventListener(
            'fixture-storage-failure',
            () => reject(new Error('Fixture storage failure')),
            { once: true },
          );
        });
      },
    });
  });
  await page.goto(extension.url('sidebar.html'));
  await expect(page.getByText('Loading saved items…')).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(new Event('fixture-storage-failure')),
  );
  await expect(page.getByRole('alert')).toContainText(
    'Fixture storage failure',
  );
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(
    page.getByText('Nothing saved yet. Save a page to get started.'),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
