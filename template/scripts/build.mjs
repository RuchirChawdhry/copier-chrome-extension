import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';

const devPort = Number(process.env.EXTENSION_DEV_RELOAD_PORT ?? 0);
const dev = devPort > 0;
const root = process.cwd();
const dist = resolve(root, process.env.EXTENSION_BUILD_DIR ?? 'dist');
const features = JSON.parse(
  await readFile(resolve(root, 'features.json'), 'utf8'),
);
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

const manifest = {
  manifest_version: 3,
  name: pkg.extensionName ?? pkg.name,
  description: pkg.description,
  version: pkg.version,
  minimum_chrome_version: '116',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  permissions: [
    'storage',
    ...(features.popup || features.pageContextMenu || features.toolbarContextMenu || features.keyboardShortcuts ? ['activeTab'] : []),
    ...(features.sidebar ? ['sidePanel'] : []),
    ...(features.pageContextMenu || features.toolbarContextMenu
      ? ['contextMenus']
      : []),
  ],
  ...(features.optionalPermissions ? { optional_permissions: ['notifications'] } : {}),
  ...(features.keyboardShortcuts ? {
    commands: {
      'save-active-page': {
        suggested_key: { default: 'Alt+Shift+S' },
        description: 'Save the active page',
      },
    },
  } : {}),
  ...(features.contentScript ? {
    content_scripts: [{
      matches: ['https://example.com/*'],
      js: ['content.js'],
      run_at: 'document_idle',
    }],
  } : {}),
  background: { service_worker: 'background.js', type: 'module' },
  action: features.popup
    ? {
        default_title: pkg.name,
        default_popup: 'popup.html',
        default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' },
      }
    : {
        default_title: pkg.name,
        default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' },
      },
  ...(features.sidebar ? { side_panel: { default_path: 'sidebar.html' } } : {}),
  ...(features.settings
    ? { options_ui: { page: 'options.html', open_in_tab: true } }
    : {}),
};

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'icons'), resolve(dist, 'icons'), { recursive: true });
await writeFile(
  resolve(dist, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);

const entryPoints = [
  ...(features.popup ? ['popup.html'] : []),
  ...(features.sidebar ? ['sidebar.html'] : []),
  ...(features.settings ? ['options.html'] : []),
];

for (const html of entryPoints) {
  await viteBuild({
    root,
    configFile: false,
    base: './',
    plugins: [svelte()],
    define: { __DEV__: JSON.stringify(dev) },
    build: {
      outDir: dist,
      emptyOutDir: false,
      minify: 'esbuild',
      cssCodeSplit: false,
      rollupOptions: {
        input: resolve(root, html),
        output: {
          inlineDynamicImports: true,
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
  });
}

const workerConfig = {
  entryPoints: [resolve(root, 'src/background/index.ts')],
  outfile: resolve(dist, 'background.js'),
  bundle: true,
  minify: !dev,
  platform: 'browser',
  format: 'esm',
  target: 'chrome116',
  define: {
    __FEATURES__: JSON.stringify(features),
    __DEV__: JSON.stringify(dev),
    __DEV_RELOAD_PORT__: JSON.stringify(devPort),
  },
};

await esbuild(workerConfig);
if (features.contentScript) {
  await esbuild({
    entryPoints: [resolve(root, 'src/content/index.ts')],
    outfile: resolve(dist, 'content.js'),
    bundle: true,
    minify: !dev,
    platform: 'browser',
    format: 'iife',
    target: 'chrome116',
    define: { __DEV__: JSON.stringify(dev) },
  });
}
console.log('Built unpacked extension in ' + dist);
