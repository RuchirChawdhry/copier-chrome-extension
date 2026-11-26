import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const features = JSON.parse(await readFile('features.json', 'utf8'));
const manifest = JSON.parse(
  await readFile(resolve(dist, 'manifest.json'), 'utf8'),
);

function assert(condition, description) {
  if (!condition) throw new Error('Build verification failed: ' + description);
}

async function assertFile(path) {
  await access(resolve(dist, path));
}

assert(manifest.manifest_version === 3, 'Manifest V3 required');
assert(
  Boolean(manifest.action?.default_popup) === features.popup,
  'popup feature mismatch',
);
assert(
  Boolean(manifest.side_panel?.default_path) === features.sidebar,
  'sidebar feature mismatch',
);
assert(
  Boolean(manifest.options_ui?.page) === features.settings,
  'settings feature mismatch',
);
assert(
  manifest.permissions.includes('contextMenus') ===
    (features.pageContextMenu || features.toolbarContextMenu),
  'context menu permission mismatch',
);
assert(
  manifest.permissions.includes('sidePanel') === features.sidebar,
  'side panel permission mismatch',
);
assert(manifest.permissions.includes('activeTab') === (features.popup || features.pageContextMenu || features.toolbarContextMenu || features.keyboardShortcuts), 'activeTab permission mismatch');
assert(Boolean(manifest.commands?.['save-active-page']) === features.keyboardShortcuts, 'keyboard shortcut mismatch');
assert(JSON.stringify(manifest.optional_permissions ?? []) === JSON.stringify(features.optionalPermissions ? ['notifications'] : []), 'optional permission mismatch');
assert(!manifest.permissions.includes('notifications'), 'notifications must never be required');
assert(!manifest.host_permissions?.length, 'unexpected broad host access');
assert(Boolean(manifest.content_scripts?.length) === features.contentScript, 'content script mismatch');
if (features.contentScript) {
  assert(JSON.stringify(manifest.content_scripts[0].matches) === JSON.stringify(['https://example.com/*']), 'content script scope mismatch');
  await assertFile('content.js');
}
await assertFile(manifest.background.service_worker);
for (const size of [16, 32, 48, 128]) {
  const icon = await readFile(resolve(dist, manifest.icons[size]));
  assert(
    icon.readUInt32BE(16) === size && icon.readUInt32BE(20) === size,
    'icon dimensions: ' + size,
  );
}
const worker = await readFile(
  resolve(dist, manifest.background.service_worker),
  'utf8',
);
assert(
  !worker.includes('ws://127.0.0.1:'),
  'development reload client leaked into release build',
);

const htmlFiles = [
  ...(features.popup ? [manifest.action.default_popup] : []),
  ...(features.sidebar ? [manifest.side_panel.default_path] : []),
  ...(features.settings ? [manifest.options_ui.page] : []),
];

for (const path of htmlFiles) {
  await assertFile(path);
  const html = await readFile(resolve(dist, path), 'utf8');
  assert(html.includes('id="app"'), path + ' missing mount element');

  // Each HTML entry must be self-contained with packaged, locally resolvable assets.
  const references = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  for (const reference of references) {
    if (/^(?:https?:|data:|#)/.test(reference)) continue;
    const local = reference.startsWith('/') ? reference.slice(1) : reference;
    await assertFile(local);
  }
}

console.log(
  'Verified Manifest V3, optional surfaces, worker, and local UI assets.',
);
