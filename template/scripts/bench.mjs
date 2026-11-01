import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

const features = JSON.parse(await readFile('features.json', 'utf8'));
const surface = features.popup ? 'popup.html' : features.sidebar ? 'sidebar.html' : features.settings ? 'options.html' : null;
if (!surface) {
  console.log('No UI enabled to benchmark');
  process.exit(0);
}

const dist = resolve('dist');
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  headless: true,
  args: ['--disable-extensions-except=' + dist, '--load-extension=' + dist]
});

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const origin = 'chrome-extension://' + new URL(worker.url()).host + '/';
  const samples = [];
  const page = await context.newPage();

  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    await page.goto(origin + surface);
    await page.locator('[data-ready="true"]').waitFor();
    samples.push(performance.now() - start);
  }

  samples.sort((a, b) => a - b);
  console.log(JSON.stringify({
    metric: 'navigation-to-Svelte-mount',
    surface,
    runs: samples.length,
    p50_ms: Number(samples[Math.floor(samples.length * 0.5)].toFixed(2)),
    p95_ms: Number(samples[Math.ceil(samples.length * 0.95) - 1].toFixed(2)),
    note: 'Playwright navigation-to-mounted measurement, NOT physical toolbar click latency'
  }, null, 2));
} finally {
  await context.close();
}
