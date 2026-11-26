import { readdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const original = await readFile('extension.config.json', 'utf8');
const keys = ['popup','sidebar','settings','pageContextMenu','toolbarContextMenu','keyboardShortcuts','toolbarBadge','optionalPermissions','contentScript'];
const cases = {
  default: [true, true, true, true, true],
  popupOnly: [true, false, false, false, false],
  sidebarOnly: [false, true, false, false, false],
  menusOnly: [false, false, false, true, true],
  none: [false, false, false, false, false],
  settingsOnly: [false, false, true, false, false],
  allCapabilities: [true, true, true, true, true, true, true, true, true],
  backgroundCapabilities: [false, false, false, false, false, true, true, false, true],
  optionalAccess: [false, false, true, false, false, false, false, true, false],
};
try {
  for (const [name, values] of Object.entries(cases)) {
    console.log('Testing feature configuration: ' + name);
    const config = { ...JSON.parse(original), ...Object.fromEntries(keys.map((key, i) => [key, values[i] ?? false])) };
    config.manifest.permissions = config.example && (config.popup || config.pageContextMenu || config.toolbarContextMenu || config.keyboardShortcuts) ? ['activeTab'] : [];
    config.manifest.optional_permissions = config.optionalPermissions ? ['notifications'] : [];
    config.manifest.commands = config.keyboardShortcuts ? { [config.example ? 'save-active-page' : 'extension-action']: { description: 'Extension action' } } : {};
    config.contentScripts = config.contentScript ? [{ entry: 'src/content/index.ts', output: 'content.js', matches: ['https://example.com/*'], run_at: 'document_idle' }] : [];
    await writeFile('extension.config.json', JSON.stringify(config, null, 2) + '\n');
    for (const command of [['build'], ['verify:build'], ['exec', 'playwright', 'test']])
      execFileSync('pnpm', command, { stdio: 'inherit', shell: process.platform === 'win32' });
    const screenshots = await readdir('reports/screenshots').catch((error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    assert.equal(screenshots.filter((file) => file.endsWith('.png')).length, 2 * (values.slice(0, 3).filter(Boolean).length + Number(Boolean(values[2] && values.slice(5).some(Boolean)))));
  }
} finally {
  await writeFile('extension.config.json', original);
}
