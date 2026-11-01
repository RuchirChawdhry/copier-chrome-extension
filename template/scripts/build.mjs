import { rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { build as esbuild, context as esbuildContext } from 'esbuild';

const watch = process.argv.includes('--watch');
const root = process.cwd();
const dist = resolve(root, 'dist');
const features = JSON.parse(await readFile(resolve(root, 'features.json'), 'utf8'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

const manifest = {
  manifest_version: 3,
  name: pkg.extensionName ?? pkg.name,
  description: pkg.description,
  version: pkg.version,
  minimum_chrome_version: '116',
  permissions: [
    'storage',
    'activeTab',
    ...(features.sidebar ? ['sidePanel'] : []),
    ...(features.pageContextMenu || features.toolbarContextMenu ? ['contextMenus'] : [])
  ],
  background: { service_worker: 'background.js', type: 'module' },
  action: features.popup
    ? { default_title: pkg.name, default_popup: 'popup.html' }
    : { default_title: pkg.name },
  ...(features.sidebar ? { side_panel: { default_path: 'sidebar.html' } } : {}),
  ...(features.settings ? { options_ui: { page: 'options.html', open_in_tab: true } } : {})
};

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await writeFile(resolve(dist, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const entryPoints = [
  ...(features.popup ? ['popup.html'] : []),
  ...(features.sidebar ? ['sidebar.html'] : []),
  ...(features.settings ? ['options.html'] : [])
];

for (const html of entryPoints) {
  await viteBuild({
    root,
    configFile: false,
    base: './',
    plugins: [svelte()],
    build: {
      outDir: dist,
      emptyOutDir: false,
      minify: 'esbuild',
      cssCodeSplit: false,
      ...(watch ? { watch: {} } : {}),
      rollupOptions: {
        input: resolve(root, html),
        output: {
          inlineDynamicImports: true,
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    }
  });
}

const workerConfig = {
  entryPoints: [resolve(root, 'src/background/index.ts')],
  outfile: resolve(dist, 'background.js'),
  bundle: true,
  minify: !watch,
  platform: 'browser',
  format: 'esm',
  target: 'chrome116',
  define: { __FEATURES__: JSON.stringify(features) }
};

if (watch) {
  const ctx = await esbuildContext(workerConfig);
  await ctx.watch();
  console.log('Watching extension files. Reload the unpacked extension after changes.');
} else {
  await esbuild(workerConfig);
  console.log('Built unpacked extension in dist/');
}
