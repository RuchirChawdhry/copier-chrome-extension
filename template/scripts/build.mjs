import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import {
  enabledSurfaces,
  loadConfig,
  makeManifest,
  safeBuildDirectory,
} from './config.mjs';

const devPort = Number(process.env.EXTENSION_DEV_RELOAD_PORT ?? 0);
const dev = devPort > 0;
const root = process.cwd();
const dist = safeBuildDirectory(process.env.EXTENSION_BUILD_DIR ?? 'dist');
const features = await loadConfig();
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const manifest = makeManifest(features, pkg);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'icons'), resolve(dist, 'icons'), { recursive: true });
await writeFile(
  resolve(dist, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);

for (const [, html] of enabledSurfaces(features)) {
  await viteBuild({
    root,
    configFile: false,
    base: './',
    plugins: [tailwindcss(), svelte()],
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
  target: 'chrome' + features.minimumChromeVersion,
  define: {
    __FEATURES__: JSON.stringify(features),
    __DEV__: JSON.stringify(dev),
    __DEV_RELOAD_PORT__: JSON.stringify(devPort),
  },
};

await esbuild(workerConfig);
for (const script of features.contentScripts) {
  await esbuild({
    entryPoints: [resolve(root, script.entry)],
    outfile: resolve(dist, script.output),
    bundle: true,
    minify: !dev,
    platform: 'browser',
    format: 'iife',
    target: 'chrome' + features.minimumChromeVersion,
    define: { __DEV__: JSON.stringify(dev) },
  });
}
console.log('Built unpacked extension in ' + dist);
