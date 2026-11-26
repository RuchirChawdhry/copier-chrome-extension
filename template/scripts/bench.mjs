import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { cpus, platform, release, arch } from 'node:os';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const options = Object.fromEntries(process.argv.slice(2).filter((arg) => arg.startsWith('--') && arg.includes('=')).map((arg) => {
  const index = arg.indexOf('=');
  return [arg.slice(2, index), arg.slice(index + 1)];
}));
const features = JSON.parse(await readFile('features.json', 'utf8'));
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
const enabled = Object.entries({ popup: 'popup.html', sidebar: 'sidebar.html', settings: 'options.html' }).filter(([name]) => features[name]);
const surfaces = options.surface && options.surface !== 'all' ? enabled.filter(([name]) => name === options.surface) : enabled;
if (options.surface && options.surface !== 'all' && !surfaces.length) throw new Error('Requested surface is not enabled');
const runs = Number(options.runs ?? 21);
if (!Number.isInteger(runs) || runs < 2 || runs > 100) throw new Error('--runs must be between 2 and 100');
const attached = Boolean(options.cdp);
if (attached && !options['extension-id']) throw new Error('CDP mode requires --extension-id=');

export function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const percentile = (p) => Number(sorted[Math.ceil(sorted.length * p) - 1].toFixed(2));
  return { count: sorted.length, p50_ms: percentile(0.5), p95_ms: percentile(0.95) };
}

const report = {
  schema: 1,
  timestamp: new Date().toISOString(),
  revision: process.env.GITHUB_SHA ?? null,
  version: manifest.version,
  mode: attached ? 'attached-cdp' : 'playwright-bundled-chromium',
  environment: { node: process.version, platform: platform(), release: release(), arch: arch(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, runner: process.env.RUNNER_OS ?? null },
  features,
  runsPerSurface: runs,
  note: 'Navigation start to DOM mount and initial data-ready marker, measured inside the document with a MutationObserver. First navigation is not guaranteed cold. No physical toolbar click, paint, native panel animation or service worker cold-start measurement.',
  browserVersion: null,
  surfaces: {},
};
let context;
let browser;
try {
  if (surfaces.length) {
    if (attached) {
      browser = await chromium.connectOverCDP(options.cdp);
      context = browser.contexts()[0];
      if (!context) throw new Error('No existing browser context');
    } else {
      const dist = resolve('dist');
      context = await chromium.launchPersistentContext('', {
        channel: 'chromium',
        headless: true,
        args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
      });
      browser = context.browser();
    }
    report.browserVersion = browser.version();
    const worker = attached ? null : (context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker'));
    const id = attached ? options['extension-id'] : new URL(worker.url()).host;
    for (const [surface, file] of surfaces) {
      const page = await context.newPage();
      const samples = [];
      try {
        await page.addInitScript(() => {
          const times = {};
          const observer = new MutationObserver(() => {
            if (times.mount_ms === undefined && document.querySelector('[data-ready="true"]')) times.mount_ms = performance.now();
            if (times.data_ready_ms === undefined && document.querySelector('[data-data-ready="true"]')) times.data_ready_ms = performance.now();
            if (times.mount_ms !== undefined && times.data_ready_ms !== undefined) observer.disconnect();
          });
          observer.observe(document, { subtree: true, childList: true, attributes: true });
          window.__extensionBenchmark = times;
        });
        for (let i = 0; i < runs; i++) {
          await page.goto('about:blank');
          await page.goto(`chrome-extension://${id}/${file}`, { waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => window.__extensionBenchmark?.data_ready_ms !== undefined && window.__extensionBenchmark?.mount_ms !== undefined, { timeout: 10_000 });
          const times = await page.evaluate(() => window.__extensionBenchmark);
          samples.push(Object.fromEntries(Object.entries(times).map(([key, value]) => [key, Number(value.toFixed(2))])));
        }
        report.surfaces[surface] = {
          first: samples[0],
          subsequentMount: summarize(samples.slice(1).map((sample) => sample.mount_ms)),
          subsequentDataReady: summarize(samples.slice(1).map((sample) => sample.data_ready_ms)),
          samples,
        };
      } finally { await page.close(); }
    }
  }
  const output = resolve(options.output ?? 'reports/performance.json');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (attached) await browser?.close();
  else await context?.close();
}
