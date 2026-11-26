import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const config = JSON.parse(await readFile('extension.config.json', 'utf8'));
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
const output = resolve('reports/screenshots');
const dist = resolve('dist');
const helper = resolve('scripts/native-menu-ui.py');

function run(command, ...args) {
  const result = spawnSync(command, args, { stdio: 'inherit', timeout: 45_000 });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}: ${result.error ?? result.status}`);
}
function ui(...args) {
  run('/usr/bin/python3', helper, ...args);
}
function pointer(...args) {
  run('xdotool', ...args);
}
async function capture(filename, labels) {
  ui('verify', ...labels);
  await delay(200);
  run('scrot', '--overwrite', join(output, filename));
  pointer('key', 'Escape');
  await delay(250);
}

await mkdir(output, { recursive: true });
for (const theme of ['light', 'dark']) {
  const profile = await mkdtemp(join(tmpdir(), 'native-menu-'));
  let context;
  const launch = () => chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: false,
    viewport: null,
    env: { ...process.env, GTK_THEME: theme === 'dark' ? 'Adwaita:dark' : 'Adwaita', NO_AT_BRIDGE: '0', ACCESSIBILITY_ENABLED: '1' },
    args: [
      '--disable-extensions-except=' + dist,
      '--load-extension=' + dist,
      '--force-renderer-accessibility',
      '--ozone-platform=x11',
      '--window-position=0,0',
      '--window-size=1280,800',
      '--start-maximized',
      '--no-first-run',
      ...(theme === 'dark' ? ['--force-dark-mode'] : []),
    ],
  });
  try {
    // Discover the unpacked ID, then pin it in this disposable profile only.
    context = await launch();
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const id = new URL(worker.url()).host;
    await context.close();
    context = undefined;
    const preferencesPath = join(profile, 'Default', 'Preferences');
    const preferences = JSON.parse(await readFile(preferencesPath, 'utf8'));
    preferences.extensions ??= {};
    preferences.extensions.pinned_extensions = [id];
    await writeFile(preferencesPath, JSON.stringify(preferences));
    context = await launch();

    const page = context.pages()[0] ?? await context.newPage();
    await page.route('https://example.org/**', (route) => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><title>Context menu fixture</title><style>html{color-scheme:light dark}body{font:16px system-ui;padding:32px}a{display:inline-block;padding:12px 0}</style><h1>Extension context menus</h1><p>Right-click the page or the link below.</p><a href="https://example.org/article">Example link</a></html>',
    }));
    await page.goto('https://example.org/');
    await page.bringToFront();
    await delay(800);

    if (config.pageContextMenu) {
      pointer('mousemove', '--sync', '360', '330', 'click', '3');
      await capture(`context-menu-page-${theme}.png`, [config.example ? 'Save this page' : 'Extension settings']);
      if (config.example) {
        ui('click', 'link', 'Example link', '3');
        await capture(`context-menu-link-${theme}.png`, ['Save link']);
      }
    }
    if (config.toolbarContextMenu) {
      ui('click', 'toolbar', manifest.action.default_title, '3');
      await capture(`context-menu-toolbar-${theme}.png`, config.example ? ['Save current page', 'Open sidebar', 'Open settings'] : ['Settings', 'Open sidebar']);
    }
  } finally {
    await context?.close();
    await rm(profile, { recursive: true, force: true });
  }
}
