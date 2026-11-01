import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const features = JSON.parse(await readFile('features.json', 'utf8'));
const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.json'), 'utf8'));

function assert(condition, description) {
  if (!condition) throw new Error('Build verification failed: ' + description);
}

async function assertFile(path) {
  await access(resolve(dist, path));
}

assert(manifest.manifest_version === 3, 'Manifest V3 required');
assert(Boolean(manifest.action?.default_popup) === features.popup, 'popup feature mismatch');
assert(Boolean(manifest.side_panel?.default_path) === features.sidebar, 'sidebar feature mismatch');
assert(Boolean(manifest.options_ui?.page) === features.settings, 'settings feature mismatch');
assert(manifest.permissions.includes('contextMenus') === (features.pageContextMenu || features.toolbarContextMenu), 'context menu permission mismatch');
assert(manifest.permissions.includes('sidePanel') === features.sidebar, 'side panel permission mismatch');
await assertFile(manifest.background.service_worker);

const htmlFiles = [
  ...(features.popup ? [manifest.action.default_popup] : []),
  ...(features.sidebar ? [manifest.side_panel.default_path] : []),
  ...(features.settings ? [manifest.options_ui.page] : [])
];

for (const path of htmlFiles) {
  await assertFile(path);
  const html = await readFile(resolve(dist, path), 'utf8');
  assert(html.includes('id="app"'), path + ' missing mount element');

  // Each HTML entry must be self-contained with packaged, locally resolvable assets.
  const references = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|data:|#)/.test(reference)) continue;
    const local = reference.startsWith('/') ? reference.slice(1) : reference;
    await assertFile(local);
  }
}

console.log('Verified Manifest V3, optional surfaces, worker, and local UI assets.');
