import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { snapshot } from './reload-plan.mjs';

const config = JSON.parse(await readFile('extension.config.json', 'utf8'));
assert(config.popup, 'Reload test requires popup');
const source = 'src/ui/popup/App.svelte';
const workerSource = 'src/background/index.ts';
const original = await readFile(source, 'utf8');
const originalWorker = await readFile(workerSource, 'utf8');
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
  const load = manager.getByRole('button', { name: 'Load unpacked' });
  if (!(await load.isVisible())) {
    await manager.getByLabel('Developer mode').click();
    await load.waitFor({ state: 'visible' });
  }
  await manager.close();
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  const url = 'chrome-extension://' + id + '/popup.html';
  await waitFor(
    () => output.includes('Reload client connected'),
    'worker connected',
  );
  const page = await context.newPage();
  await page.goto(url);
  await page.locator('[data-ready="true"]').waitFor();
  const other = config.sidebar ? await context.newPage() : null;
  if (other) {
    await other.goto('chrome-extension://' + id + '/sidebar.html');
    await other.locator('[data-ready="true"]').waitFor();
    await other.evaluate(() => {
      window.__reloadSentinel = true;
    });
  }
  let workerClosed = false;
  worker.once('close', () => {
    workerClosed = true;
  });
  for (const marker of ['Selective reload one', 'Selective reload two']) {
    await writeFile(
      source,
      original.replace('</Surface>', '<p>' + marker + '</p></Surface>'),
    );
    await page.getByText(marker, { exact: true }).waitFor({ timeout: 60_000 });
    assert(!workerClosed, 'UI edit must not reload worker');
    if (other)
      assert(
        await other.evaluate(() => window.__reloadSentinel),
        'Unchanged sidebar reloaded',
      );
    assert.deepEqual(
      await snapshot('dist'),
      await snapshot('.dev-dist'),
      'Obsolete or stale assets remain',
    );
    console.log('Verified selective interface reload: ' + marker);
  }
  await writeFile(
    workerSource,
    originalWorker + '\nconsole.info("Full reload fixture");\n',
  );
  await waitFor(() => workerClosed, 'full worker reload');
  await waitFor(
    () => output.split('Reload client connected.').length > 2,
    'worker reconnected',
  );
  const reopened = await context.newPage();
  await reopened.goto(url);
  await reopened.getByText('Selective reload two', { exact: true }).waitFor();
  console.log('Verified full reload after worker edit');
} finally {
  await context?.close();
  server.kill();
  if (server.exitCode === null && server.signalCode === null)
    await new Promise((resolve) => server.once('exit', resolve));
  await writeFile(source, original);
  await writeFile(workerSource, originalWorker);
  await rm(profile, { recursive: true, force: true });
}
