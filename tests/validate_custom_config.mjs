import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const path = 'extension.config.json';
const original = await readFile(path, 'utf8');
function run(script, succeeds = true) {
  const result = spawnSync(process.execPath, ['scripts/' + script], { stdio: 'inherit' });
  assert.equal(result.status === 0, succeeds, script + ' exit status');
}
try {
  const config = JSON.parse(original);
  config.manifest.permissions.push('tabs');
  config.manifest.host_permissions = ['https://example.org/*'];
  config.manifest.commands = { 'product-action': { description: 'Product action' } };
  config.contentScript = true;
  config.contentScripts = [{ entry: 'src/content/index.ts', output: 'product-content.js', matches: ['https://example.org/*'], run_at: 'document_idle' }];
  await writeFile(path, JSON.stringify(config));
  run('build.mjs');
  run('verify-build.mjs');
  const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
  assert(manifest.permissions.includes('tabs'));
  assert.deepEqual(manifest.host_permissions, ['https://example.org/*']);
  assert(manifest.commands['product-action']);
  assert.equal(manifest.content_scripts[0].js[0], 'product-content.js');
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://example.org/*']);
  manifest.permissions.push('history');
  await writeFile('dist/manifest.json', JSON.stringify(manifest));
  run('verify-build.mjs', false);
  run('build.mjs');
  const html = await readFile('dist/popup.html', 'utf8');
  await writeFile('dist/popup.html', html.replace('</head>', '<script src="https://example.org/remote.js"></script></head>'));
  run('verify-build.mjs', false);
  console.log('Verified custom permissions, host matches, commands, content entry, and rejection of drift and remote executable assets.');
} finally {
  await writeFile(path, original);
  run('build.mjs');
}
