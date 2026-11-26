import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { unzipSync, zipSync } from 'fflate';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pkg.name), 'Invalid package name');
assert(
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(pkg.version),
  'Use a stable three-part numeric version',
);
assert.equal(
  manifest.version,
  pkg.version,
  'Manifest version must match package version',
);
assert(
  pkg.version.split('.').every((part) => Number(part) <= 65535) &&
    pkg.version !== '0.0.0',
  'Invalid Chromium version',
);
const filename = `${pkg.name}-v${pkg.version}.zip`;
const files = {};

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile())
      files[relative('dist', path).split(sep).join('/')] = await readFile(path);
    else throw new Error(`Unexpected archive entry: ${path}`);
  }
}

await collect('dist');
const archive = zipSync(files, { level: 6, mtime: new Date(2000, 0, 1) });
const extracted = unzipSync(archive);
assert.deepEqual(Object.keys(extracted).sort(), Object.keys(files).sort());
for (const [path, data] of Object.entries(files))
  assert(
    Buffer.from(extracted[path]).equals(data),
    `ZIP content mismatch: ${path}`,
  );
assert(extracted['manifest.json'], 'Archive must contain manifest at root');
await mkdir('release', { recursive: true });
await writeFile(join('release', filename), archive);
await writeFile(
  'release/SHA256SUMS.txt',
  `${createHash('sha256').update(archive).digest('hex')}  ${filename}\n`,
);
console.log(join('release', filename));
