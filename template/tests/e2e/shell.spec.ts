import { readFileSync } from 'node:fs';
import { expect, test } from './fixture';
const config = JSON.parse(readFileSync('extension.config.json', 'utf8')) as typeof import('../../extension.config.json');

test('enabled extension pages mount and preferences persist', async ({ extension }) => {
  const page = await extension.context.newPage();
  for (const [enabled, file] of [[config.popup, 'popup.html'], [config.sidebar, 'sidebar.html'], [config.settings, 'options.html']] as const) {
    if (!enabled) continue;
    await page.goto(extension.url(file));
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    await expect(page.locator('[data-data-ready="true"]')).toBeVisible();
  }
  if (config.settings) {
    await page.goto(extension.url('options.html'));
    await page.getByLabel('Preferred appearance').selectOption('dark');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page.getByRole('status')).toHaveText('Saved');
    await page.reload();
    await expect(page.getByLabel('Preferred appearance')).toHaveValue('dark');
  }
});
