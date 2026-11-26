import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const probe = 'tests/e2e/diagnostics-probe.spec.ts';
const config = 'extension.config.json';
const original = await readFile(config, 'utf8');
try {
  await writeFile(probe, `import { expect, test } from './fixture';
test('intentional diagnostic probe', async ({ extension }) => {
  const page = await extension.context.newPage();
  await page.goto(extension.url('popup.html'));
  const error = page.waitForEvent('pageerror');
  await page.evaluate(() => {
    console.warn('fixture warning');
    setTimeout(() => { throw new Error('fixture exception'); }, 0);
  });
  await error;
  expect(false).toBe(true);
});\n`);
  const run = spawnSync(process.execPath, [resolve('node_modules/@playwright/test/cli.js'), 'test', 'diagnostics-probe.spec.ts'], { stdio: 'inherit' });
  assert.equal(run.status, 1, 'Expected intentional browser failure');
  const report = JSON.parse(await readFile('reports/diagnostics.json', 'utf8'));
  assert.equal(report.status, 'failed');
  const test = report.tests.find((item) => item.title.includes('intentional diagnostic probe'));
  assert(test?.errors.length);
  assert(test.events.some((event) => event.kind === 'console-warning' && event.message.includes('fixture warning')));
  assert(test.events.some((event) => event.kind === 'exception' && event.message.includes('fixture exception')));
  assert(test.artifacts.some((artifact) => artifact.name === 'trace'));
  console.log('Verified failure report, page exception, console warning and trace location');
  await writeFile(config, '{}\n');
  const doctor = spawnSync(process.execPath, ['scripts/doctor.mjs'], { stdio: 'inherit' });
  assert.equal(doctor.status, 1);
  const doctorReport = JSON.parse(await readFile('reports/doctor.json', 'utf8'));
  assert(doctorReport.checks.some((check) => check.name === 'Configuration' && check.status === 'fail'));
  console.log('Verified doctor rejects invalid configuration');
} finally {
  await rm(probe, { force: true });
  await writeFile(config, original);
}
