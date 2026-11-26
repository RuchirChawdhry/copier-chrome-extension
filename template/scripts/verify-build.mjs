import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { enabledSurfaces, loadConfig, localPath, makeManifest } from './config.mjs';

const dist = resolve('dist');
const config = await loadConfig();
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.json'), 'utf8'));
assert.deepEqual(manifest, makeManifest(config, pkg), 'Packaged manifest differs from declared configuration');
assert.equal(manifest.manifest_version, 3);
assert(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(manifest.version) && manifest.version !== '0.0.0' && manifest.version.split('.').every((part) => Number(part) <= 65535), 'Invalid Chromium version');

async function verifyFile(path) {
  await access(resolve(dist, localPath(path)));
}
await verifyFile(manifest.background.service_worker);
for (const size of [16, 32, 48, 128]) {
  const path = manifest.icons[size];
  await verifyFile(path);
  const bytes = await readFile(resolve(dist, path));
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.readUInt32BE(16) === size && bytes.readUInt32BE(20) === size, 'Invalid icon: ' + path);
}
for (const script of manifest.content_scripts ?? []) {
  for (const path of [...(script.js ?? []), ...(script.css ?? [])]) await verifyFile(path);
}
for (const [, path] of enabledSurfaces(config)) {
  const html = await readFile(resolve(dist, localPath(path)), 'utf8');
  assert(html.includes('id="app"'), path + ' missing mount element');
  for (const match of html.matchAll(/<(script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi)) {
    const asset = match[2].replace(/^\.\//, '').replace(/^\//, '');
    await verifyFile(asset);
  }
  assert(!/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(html), 'Inline executable script: ' + path);
}
for (const file of await readdir(dist, { recursive: true, withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith('.js')) continue;
  const source = await readFile(resolve(file.parentPath, file.name), 'utf8');
  assert(!source.includes('ws://127.0.0.1:'), 'Development reload client leaked: ' + file.name);
}
console.log('Verified manifest configuration, local executable assets, icons and production output.');
