import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = 'dist';
const manifest = JSON.parse(
  await readFile(join(root, 'manifest.json'), 'utf8'),
);
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile()) {
      const bytes = await readFile(path);
      files.push({
        path: relative(root, path).split(sep).join('/'),
        bytes: bytes.length,
        gzipBytes: gzipSync(bytes).length,
      });
    }
  }
}

await collect(root);
files.sort((a, b) => a.path.localeCompare(b.path));

function totals(entries) {
  return {
    bytes: entries.reduce((sum, file) => sum + file.bytes, 0),
    gzipBytes: entries.reduce((sum, file) => sum + file.gzipBytes, 0),
  };
}
const surfaces = {};
for (const [name, html] of Object.entries({
  popup: manifest.action?.default_popup,
  sidebar: manifest.side_panel?.default_path,
  settings: manifest.options_ui?.page,
})) {
  if (!html) continue;
  const document = await readFile(join(root, html), 'utf8');
  const paths = new Set([
    html,
    ...[...document.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((match) =>
      match[1].replace(/^\.\//, '').replace(/^\//, ''),
    ),
  ]);
  surfaces[name] = totals(files.filter((file) => paths.has(file.path)));
}
const groups = {};
for (const type of ['.js', '.css', '.html', '.png', '.json'])
  groups[type] = totals(files.filter((file) => extname(file.path) === type));
const report = {
  schema: 1,
  version: manifest.version,
  revision: process.env.GITHUB_SHA ?? null,
  totals: totals(files),
  groups,
  surfaces,
  worker: totals(
    files.filter((file) => file.path === manifest.background.service_worker),
  ),
  contentScripts: totals(
    files.filter((file) =>
      manifest.content_scripts?.some((entry) => entry.js?.includes(file.path)),
    ),
  ),
  files,
  note: 'gzipBytes sums per-file gzip sizes; it is not the extension ZIP size. Surface totals include HTML and its directly linked local assets; shared assets may appear in more than one surface.',
};
await mkdir('reports', { recursive: true });
await writeFile(
  'reports/bundle-size.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
