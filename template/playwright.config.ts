import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: { headless: true },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./tests/e2e/diagnostics-reporter.ts'],
  ],
});
