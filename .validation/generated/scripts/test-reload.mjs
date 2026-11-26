import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const features = JSON.parse(await readFile('features.json', 'utf8'));
assert(features.popup, 'Reload test requires the popup feature');
const source = 'src/ui/popup/App.svelte';
const original = await readFile(source, 'utf8');
const profile = await mkdtemp(join(tmpdir(), 'extension-reload-'));
const server = spawn(process.execPath, ['scripts/dev.mjs'], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
for (const stream of [server.stdout, server.stderr])
  stream.on('data', (data) => {
    output += data;
    process.stdout.write(data);
  });
let context;

async function waitFor(predicate, description, timeout = 60_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error('Dev server stopped');
    if (await predicate()) return;
    await delay(250);
  }
  throw new Error('Timed out: ' + description);
}

try {
  await waitFor(
    () => output.includes('Development build ready'),
    'initial build',
  );
  const dist = resolve('dist');
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: ['--disable-extensions-except=' + dist, '--load-extension=' + dist],
  });
  const manager = await context.newPage();
  await manager.goto('chrome://extensions/');
  const loadButton = manager.getByRole('button', { name: 'Load unpacked' });
  if (!(await loadButton.isVisible())) {
    await manager.getByLabel('Developer mode').click();
    await loadButton.waitFor({ state: 'visible' });
  }
  await manager.close();
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  const url = 'chrome-extension://' + id + '/popup.html';
  await waitFor(
    () => output.includes('Reload client connected'),
    'worker connection',
  );
  const initial = await context.newPage();
  await initial.goto(url);
  await initial.locator('[data-ready="true"]').waitFor();
  await initial.close();
  for (const marker of ['Reload verification one', 'Reload verification two']) {
    const current =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'));
    const closed = new Promise((resolve) => current.once('close', resolve));
    const connections = output.split('Reload client connected.').length;
    await writeFile(
      source,
      original.replace('Quick actions, right where you need them.', marker),
    );
    await Promise.race([
      closed,
      delay(60_000).then(() => {
        throw new Error('Worker did not reload');
      }),
    ]);
    await waitFor(
      () => output.split('Reload client connected.').length > connections,
      'worker reconnection',
    );
    await waitFor(async () => {
      const page = await context.newPage();
      try {
        await page.goto(url, { timeout: 5000 });
        return await page.getByText(marker, { exact: true }).isVisible();
      } catch {
        return false;
      } finally {
        await page.close();
      }
    }, marker);
    console.log('Verified automatic reload: ' + marker);
  }
} finally {
  await context?.close();
  server.kill();
  await new Promise((resolve) => {
    if (server.exitCode !== null) resolve();
    else server.once('exit', resolve);
  });
  await writeFile(source, original);
  await rm(profile, { recursive: true, force: true });
}
