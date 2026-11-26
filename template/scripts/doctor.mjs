import { access, readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { loadConfig } from './config.mjs';

const checks = [];
async function check(name, fn, required = true) {
  try { const detail = await fn(); checks.push({ name, status: 'pass', detail }); }
  catch (error) { checks.push({ name, status: required ? 'fail' : 'warn', detail: error.message }); }
}
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
function command(name, args) {
  const result = spawnSync(name, args, { encoding: 'utf8', shell: process.platform === 'win32' && name === 'pnpm' });
  if (result.status !== 0) throw new Error(name + ' unavailable: ' + (result.error?.message ?? result.stderr?.trim()));
  return result.stdout.trim();
}
await check('Node.js', () => {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) throw new Error('Install Node.js >=22.12');
  return process.version;
});
await check('pnpm', () => {
  const version = command('pnpm', ['--version']);
  if (version !== pkg.packageManager.split('@')[1]) throw new Error('Expected ' + pkg.packageManager + '; found ' + version);
  return version;
});
await check('Lockfile', async () => { await access('pnpm-lock.yaml'); return 'present'; });
await check('Configuration', async () => { await loadConfig(); return 'valid'; });
await check('Dependencies', async () => { await access('node_modules/.bin/biome' + (process.platform === 'win32' ? '.cmd' : '')); return 'installed'; });
await check('Git', () => command('git', ['rev-parse', '--show-toplevel']), false);
await check('Git hooks', async () => { await access(resolve(command('git', ['rev-parse', '--git-path', 'hooks/pre-commit']))); return 'pre-commit installed'; }, false);
await check('Chromium', async () => { const { chromium } = await import('@playwright/test'); await access(chromium.executablePath()); return 'browser installed'; });
await check('Build output', async () => { await access('dist/manifest.json'); return 'present'; }, false);
const report = { schema: 1, status: checks.some((item) => item.status === 'fail') ? 'failed' : 'passed', platform: process.platform, checks };
await mkdir('reports', { recursive: true });
await writeFile('reports/doctor.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.status === 'failed') process.exitCode = 1;
