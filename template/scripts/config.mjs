import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { z } from 'zod';

export const surfaces = {
  popup: 'popup.html',
  sidebar: 'sidebar.html',
  settings: 'options.html',
};
const localAssetPath = z.string().min(1).refine(
  (path) =>
    !isAbsolute(path) &&
    !/[:\\?#]/.test(path) &&
    !path.split('/').includes('..') &&
    !path.startsWith('/'),
  { message: 'Expected a relative local asset path' },
);

export function localPath(path) {
  return localAssetPath.parse(path);
}

export function enabledSurfaces(config) {
  return Object.entries(surfaces).filter(([name]) => config[name]);
}
const reservedManifestKeys = [
  'manifest_version',
  'name',
  'description',
  'version',
  'background',
  'action',
  'side_panel',
  'options_ui',
  'icons',
  'content_scripts',
  'minimum_chrome_version',
];

const manifestSchema = z.looseObject({
  permissions: z.array(z.string()),
  host_permissions: z.array(z.string()),
  optional_permissions: z.array(z.string()),
  optional_host_permissions: z.array(z.string()),
}).superRefine((manifest, ctx) => {
  for (const key of reservedManifestKeys) {
    if (Object.hasOwn(manifest, key)) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: 'Use dedicated configuration for ' + key,
      });
    }
  }
});

const contentScriptSchema = z.looseObject({
  entry: localAssetPath,
  output: localAssetPath.refine(
    (path) =>
      path.endsWith('.js') &&
      path !== 'background.js' &&
      !path.startsWith('assets/'),
    { message: 'Invalid content output' },
  ),
  matches: z.array(z.string()).min(1, 'Content script matches required'),
}).superRefine((script, ctx) => {
  if (Object.hasOwn(script, 'js')) {
    ctx.addIssue({
      code: 'custom',
      path: ['js'],
      message: 'Use output for the bundled content script',
    });
  }
});

export const extensionConfigSchema = z.looseObject({
  popup: z.boolean(),
  sidebar: z.boolean(),
  settings: z.boolean(),
  pageContextMenu: z.boolean(),
  toolbarContextMenu: z.boolean(),
  keyboardShortcuts: z.boolean(),
  toolbarBadge: z.boolean(),
  optionalPermissions: z.boolean(),
  contentScript: z.boolean(),
  example: z.boolean(),
  minimumChromeVersion: z.string().regex(/^\d+$/, 'Invalid minimum Chrome version'),
  manifest: manifestSchema,
  contentScripts: z.array(contentScriptSchema),
}).superRefine((config, ctx) => {
  if (config.contentScript !== Boolean(config.contentScripts.length)) {
    ctx.addIssue({
      code: 'custom',
      path: ['contentScript'],
      message: 'contentScript flag must match declared entries',
    });
  }
  const outputs = new Set();
  for (const [index, script] of config.contentScripts.entries()) {
    if (outputs.has(script.output)) {
      ctx.addIssue({
        code: 'custom',
        path: ['contentScripts', index, 'output'],
        message: 'Invalid or duplicate content output: ' + script.output,
      });
    }
    outputs.add(script.output);
  }
});

export async function loadConfig() {
  const config = JSON.parse(await readFile('extension.config.json', 'utf8'));
  return extensionConfigSchema.parse(config);
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
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    permissions: [
      ...new Set([
        'storage',
        ...(config.sidebar ? ['sidePanel'] : []),
        ...(config.pageContextMenu || config.toolbarContextMenu
          ? ['contextMenus']
          : []),
        ...extra.permissions,
      ]),
    ],
    background: { service_worker: 'background.js', type: 'module' },
    action: {
      default_title: pkg.extensionName ?? pkg.name,
      default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' },
      ...(config.popup ? { default_popup: surfaces.popup } : {}),
    },
    ...(config.sidebar
      ? { side_panel: { default_path: surfaces.sidebar } }
      : {}),
    ...(config.settings
      ? { options_ui: { page: surfaces.settings, open_in_tab: true } }
      : {}),
    ...(config.contentScript
      ? {
          content_scripts: config.contentScripts.map(
            ({ entry: _entry, output, ...rest }) => ({ ...rest, js: [output] }),
          ),
        }
      : {}),
  };
}
export function safeBuildDirectory(path) {
  const relativePath = relative(process.cwd(), resolve(path));
  assert(
    ['dist', '.dev-dist'].includes(relativePath),
    'Build output must be dist or .dev-dist',
  );
  return resolve(path);
}
