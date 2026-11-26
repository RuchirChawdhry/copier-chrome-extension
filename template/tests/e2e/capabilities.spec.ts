import { readFileSync } from 'node:fs';
import { expect, test } from './fixture';
const features = JSON.parse(readFileSync('features.json', 'utf8')) as typeof import('../../features.json');

test('optional capabilities match manifest and runtime behavior', async ({ extension }) => {
  const { context, url } = extension;
  const worker = context.serviceWorkers()[0];
  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
  expect(Boolean(manifest.commands?.['save-active-page'])).toBe(features.keyboardShortcuts);
  expect(Boolean(manifest.optional_permissions?.includes('notifications'))).toBe(features.optionalPermissions);
  expect(manifest.permissions).not.toContain('notifications');
  expect(Boolean(manifest.content_scripts?.length)).toBe(features.contentScript);

  if (features.keyboardShortcuts) {
    const commands = await worker.evaluate(() => chrome.commands.getAll());
    expect(commands.some((command) => command.name === 'save-active-page')).toBe(true);
  }

  if (features.toolbarBadge) {
    await worker.evaluate(() => chrome.storage.local.set({ 'example.links': [{ id: 'badge', title: 'Example', url: 'https://example.org/', createdAt: 1 }] }));
    await expect.poll(() => worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('1');
    await worker.evaluate(() => chrome.storage.local.set({ 'example.links': [] }));
    await expect.poll(() => worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('');
  }

  const page = await context.newPage();
  await page.route('https://example.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>Allowed site</body></html>' }));
  await page.route('https://example.org/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>Other site</body></html>' }));
  await page.goto('https://example.com/');
  if (features.contentScript) await expect(page.locator('html')).toHaveAttribute('data-extension-example', 'ready');
  else await expect(page.locator('html')).not.toHaveAttribute('data-extension-example');
  await page.goto('https://example.org/');
  await expect(page.locator('html')).not.toHaveAttribute('data-extension-example');

  if (features.settings && (features.optionalPermissions || features.keyboardShortcuts || features.toolbarBadge || features.contentScript)) {
    await page.goto(url('options.html'));
    const general = page.getByRole('tab', { name: 'General' });
    await general.focus();
    await general.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Browser' })).toHaveAttribute('aria-selected', 'true');
    if (features.optionalPermissions) {
      await expect(page.getByText('Access: Not granted')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Grant notification access' })).toBeEnabled();
      expect(await page.evaluate(() => chrome.permissions.contains({ permissions: ['notifications'] }))).toBe(false);
    }
    await page.getByRole('button', { name: 'About browser access' }).click();
    await expect(page.getByRole('dialog', { name: 'Browser access' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  }
});
