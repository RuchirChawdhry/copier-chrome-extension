import { chromium } from '@playwright/test';
import { resolve, dirname } from 'node:path';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const options = Object.fromEntries(process.argv.slice(2)
  .filter((argument) => argument.startsWith('--') && argument.includes('='))
  .map((argument) => {
    const equals = argument.indexOf('=');
    return [argument.slice(2, equals), argument.slice(equals + 1)];
  }));

const features = JSON.parse(await readFile('features.json', 'utf8'));
const availableSurfaces = [
  ...(features.popup ? ['popup'] : []),
  ...(features.sidebar ? ['sidebar'] : []),
  ...(features.settings ? ['settings'] : [])
];
const surfaceNames = {
  popup: 'popup.html',
  sidebar: 'sidebar.html',
  settings: 'options.html'
};

const requested = options.surface && options.surface !== 'all'
  ? [options.surface]
  : availableSurfaces;
const surfaces = requested.filter((surface) => availableSurfaces.includes(surface));

if (surfaces.length !== requested.length) {
  throw new Error('Requested surface is not enabled. Enabled: ' + availableSurfaces.join(', '));
}
if (!surfaces.length) {
  console.log('No enabled UI surfaces to benchmark.');
  process.exit(0);
}

const attached = Boolean(options.cdp);
if (attached && !options['extension-id']) {
  throw new Error('CDP mode needs --extension-id= from the browser extensions page');
}

const dist = resolve('dist');
const samplesPerSurface = Number(options.runs ?? 11);
if (!Number.isInteger(samplesPerSurface) || samplesPerSurface < 2 || samplesPerSurface > 100) {
  throw new Error('--runs must be between 2 and 100');
}

let browser;
let context;
let extensionId;

if (attached) {
  browser = await chromium.connectOverCDP(options.cdp);
  context = browser.contexts()[0];
  if (!context) throw new Error('No existing browser context found at CDP endpoint');
  extensionId = options['extension-id'];
} else {
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    args: [
      '--disable-extensions-except=' + dist,
      '--load-extension=' + dist
    ]
  });
  browser = context.browser();
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  extensionId = new URL(worker.url()).host;
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const percentile = (p) => Number(sorted[Math.ceil(sorted.length * p) - 1].toFixed(2));
  return { count: sorted.length, p50_ms: percentile(0.5), p95_ms: percentile(0.95) };
}

const report = {
  browserVersion: await browser.version(),
  mode: attached ? 'attached-cdp' : 'playwright-bundled-chromium',
  timestamp: new Date().toISOString(),
  metric: 'navigation-start-to-Svelte-mounted-marker',
  note: 'Does not measure physical toolbar clicks or native side-panel animation.',
  surfaces: {}
};

try {
  for (const surface of surfaces) {
    const page = await context.newPage();
    const samples = [];
    const target = 'chrome-extension://' + extensionId + '/' + surfaceNames[surface];

    try {
      for (let i = 0; i < samplesPerSurface; i++) {
        await page.goto('about:blank');
        const start = performance.now();
        await page.goto(target, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-ready="true"]').waitFor({ state: 'visible', timeout: 10_000 });
        samples.push(performance.now() - start);
      }
      report.surfaces[surface] = {
        first_navigation_ms: Number(samples[0].toFixed(2)),
        subsequent_navigations: summarize(samples.slice(1))
      };
    } finally {
      await page.close();
    }
  }
  if (options.output) {
    await mkdir(dirname(resolve(options.output)), { recursive: true });
    await writeFile(resolve(options.output), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (browser) await browser.close();
  else if (context) await context.close();
}
