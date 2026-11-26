import { expect, test } from './fixture';

test('intentional failure confirms CI diagnostics upload', async ({ extension }) => {
  const page = await extension.context.newPage();
  await page.goto(extension.url('popup.html'));
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
  await expect(page.getByText('Deliberate diagnostic failure marker')).toBeVisible({ timeout: 500 });
});
