import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const filename = pkg.name + '-v' + pkg.version + '.zip';
execFileSync('zip', ['-qr', '../' + filename, '.'], { cwd: 'dist', stdio: 'inherit' });
console.log(filename);
