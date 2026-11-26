import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve, relative } from 'node:path';

export const surfaces = { popup: 'popup.html', sidebar: 'sidebar.html', settings: 'options.html' };
export function localPath(path) {
  assert(typeof path === 'string' && path.length && !isAbsolute(path) && !/[:\\?#]/.test(path) && !path.split('/').includes('..') && !path.startsWith('/'), 'Expected a relative local asset path: ' + path);
  return path;
}
export function enabledSurfaces(config) {
  return Object.entries(surfaces).filter(([name]) => config[name]);
}
export async function loadConfig() {
  const config = JSON.parse(await readFile('extension.config.json', 'utf8'));
  for (const name of [...Object.keys(surfaces), 'pageContextMenu', 'toolbarContextMenu', 'keyboardShortcuts', 'toolbarBadge', 'optionalPermissions', 'contentScript', 'example']) assert.equal(typeof config[name], 'boolean', 'Missing boolean flag: ' + name);
  assert(/^\d+$/.test(config.minimumChromeVersion), 'Invalid minimum Chrome version');
  assert(config.manifest && typeof config.manifest === 'object' && !Array.isArray(config.manifest), 'Manifest overrides must be an object');
  for (const key of ['manifest_version', 'name', 'description', 'version', 'background', 'action', 'side_panel', 'options_ui', 'icons', 'content_scripts', 'minimum_chrome_version']) assert(!Object.hasOwn(config.manifest, key), 'Use dedicated configuration for ' + key);
  for (const key of ['permissions', 'host_permissions', 'optional_permissions', 'optional_host_permissions']) assert(Array.isArray(config.manifest[key]) && config.manifest[key].every((value) => typeof value === 'string'), key + ' must be a string array');
  assert(Array.isArray(config.contentScripts), 'contentScripts must be an array');
  assert(config.contentScript === Boolean(config.contentScripts.length), 'contentScript flag must match declared entries');
  const outputs = new Set();
  for (const script of config.contentScripts) {
    localPath(script.entry);
    localPath(script.output);
    assert(script.output.endsWith('.js') && script.output !== 'background.js' && !script.output.startsWith('assets/') && !outputs.has(script.output), 'Invalid or duplicate content output: ' + script.output);
    outputs.add(script.output);
    assert(Array.isArray(script.matches) && script.matches.length && script.matches.every((match) => typeof match === 'string'), 'Content script matches required');
    assert(!Object.hasOwn(script, 'js'), 'Use output for the bundled content script');
  }
  return config;
}
export function makeManifest(config, pkg) {
  const extra = config.manifest;
  return {
    ...extra,
    manifest_version: 3,
    name: pkg.extensionName ?? pkg.name,
    description: pkg.description,
    version: pkg.version,
    minimum_chrome_version: config.minimumChromeVersion,
    icons: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' },
    permissions: [...new Set(['storage', ...(config.sidebar ? ['sidePanel'] : []), ...(config.pageContextMenu || config.toolbarContextMenu ? ['contextMenus'] : []), ...extra.permissions])],
    background: { service_worker: 'background.js', type: 'module' },
    action: { default_title: pkg.extensionName ?? pkg.name, default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' }, ...(config.popup ? { default_popup: surfaces.popup } : {}) },
    ...(config.sidebar ? { side_panel: { default_path: surfaces.sidebar } } : {}),
    ...(config.settings ? { options_ui: { page: surfaces.settings, open_in_tab: true } } : {}),
    ...(config.contentScript ? { content_scripts: config.contentScripts.map(({ entry: _entry, output, ...rest }) => ({ ...rest, js: [output] })) } : {}),
  };
}
export function safeBuildDirectory(path) {
  const relativePath = relative(process.cwd(), resolve(path));
  assert(['dist', '.dev-dist'].includes(relativePath), 'Build output must be dist or .dev-dist');
  return resolve(path);
}
