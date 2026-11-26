import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { type BrowserContext, test as base, chromium } from '@playwright/test';

type Extension = {
  context: BrowserContext;
  id: string;
  url: (filename: string) => string;
};

export const test = base.extend<{ extension: Extension }>({
  extension: async ({ headless }, use, testInfo) => {
    const dist = resolve('dist');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless,
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    });
    const events: { kind: string; context: string; message: string }[] = [];
    const record = (kind: string, source: string, message: string) => events.push({ kind, context: source, message });
    context.on('console', (message) => {
      if (['error', 'warning'].includes(message.type()))
        record('console-' + message.type(), message.page() ? 'page' : 'worker-or-context', message.text());
    });
    context.on('weberror', (error) => record('exception', 'page', error.error().message));
    context.on('requestfailed', (request) => record('request-failed', 'browser', request.failure()?.errorText ?? 'Request failed'));
    try {
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });
      const worker =
        context.serviceWorkers()[0] ??
        (await context.waitForEvent('serviceworker'));
      const id = new URL(worker.url()).host;
      await use({
        context,
        id,
        url: (filename) => `chrome-extension://${id}/${filename}`,
      });
    } finally {
      try {
        const path = testInfo.outputPath('trace.zip');
        await mkdir(dirname(path), { recursive: true });
        await context.tracing.stop({ path });
        const diagnostics = testInfo.outputPath('browser-events.json');
        await writeFile(diagnostics, JSON.stringify(events, null, 2));
        await testInfo.attach('browser-events', { path: diagnostics, contentType: 'application/json' });
        await testInfo.attach('trace', {
          path,
          contentType: 'application/zip',
        });
      } finally {
        await context.close();
      }
    }
  },
});
export { expect } from '@playwright/test';
