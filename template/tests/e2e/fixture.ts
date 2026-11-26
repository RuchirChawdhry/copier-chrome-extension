import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { type BrowserContext, chromium, test as base } from '@playwright/test';

type Extension = { context: BrowserContext; id: string; url: (filename: string) => string };

export const test = base.extend<{ extension: Extension }>({
  extension: async ({ headless }, use, testInfo) => {
    const dist = resolve('dist');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium', headless,
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    });
    try {
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
      const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
      const id = new URL(worker.url()).host;
      await use({ context, id, url: (filename) => `chrome-extension://${id}/${filename}` });
    } finally {
      try {
        const path = testInfo.outputPath('trace.zip');
        await mkdir(dirname(path), { recursive: true });
        await context.tracing.stop({ path });
        await testInfo.attach('trace', { path, contentType: 'application/zip' });
      } finally {
        await context.close();
      }
    }
  },
});
export { expect } from '@playwright/test';
