import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { zipSync } from 'fflate';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const filename = pkg.name + '-v' + pkg.version + '.zip';
const files = {};

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(path);
    } else if (entry.isFile()) {
      const zipPath = relative('dist', path).split(sep).join('/');
      files[zipPath] = await readFile(path);
    }
  }
}

await collect('dist');
await writeFile(filename, zipSync(files, { level: 6 }));
console.log(filename);
