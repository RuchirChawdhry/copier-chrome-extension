import { expect, test } from './fixture';

test('all surfaces share the design system in both themes', async ({ extension }) => {
  const page = await extension.context.newPage();
  await page.goto(extension.url('popup.html'));
  for (const theme of ['light', 'dark', 'system'] as const) {
    await page.emulateMedia({ colorScheme: theme === 'light' ? 'dark' : 'light' });
    await page.evaluate((value) => chrome.storage.local.set({ 'ui.theme': value }), theme);
    if (theme === 'system') await page.emulateMedia({ colorScheme: 'dark' });
    const dark = theme !== 'light';
    for (const file of ['popup.html', 'sidebar.html', 'options.html']) {
      await page.goto(extension.url(file));
      await expect(page.locator('[data-data-ready="true"]')).toBeVisible();
      await expect(page.locator('body')).toHaveCSS('background-color', dark ? 'rgb(16, 16, 18)' : 'rgb(245, 245, 246)');
      await expect(page.locator('body')).toHaveCSS('color', dark ? 'rgb(244, 244, 245)' : 'rgb(24, 24, 27)');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-size', '18px');
      await expect(page.locator('header')).toHaveCSS('border-bottom-width', '1px');
      await expect(page.locator('header')).toHaveCSS('padding-bottom', '16px');
      const buttons = page.getByRole('button');
      for (const button of await buttons.all()) {
        await expect(button).toHaveCSS('border-radius', '8px');
      }
      if (file === 'options.html') {
        await expect(page.getByRole('button', { name: 'Save settings' })).toHaveCSS('background-color', dark ? 'rgb(94, 234, 212)' : 'rgb(15, 118, 110)');
        await expect(page.getByLabel('Preferred appearance')).toHaveCSS('height', '36px');
      }
    }
  }
});
