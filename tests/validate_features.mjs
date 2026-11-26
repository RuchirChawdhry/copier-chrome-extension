import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const original = await readFile('features.json', 'utf8');
const keys = Object.keys(JSON.parse(original));
const cases = {
  default: [true, true, true, true, true],
  popupOnly: [true, false, false, false, false],
  sidebarOnly: [false, true, false, false, false],
  menusOnly: [false, false, false, true, true],
  none: [false, false, false, false, false],
  settingsOnly: [false, false, true, false, false],
};
try {
  for (const [name, values] of Object.entries(cases)) {
    console.log('Testing feature configuration: ' + name);
    await writeFile('features.json', JSON.stringify(Object.fromEntries(keys.map((key, i) => [key, values[i]])), null, 2) + '\n');
    for (const command of [['build'], ['verify:build'], ['exec', 'playwright', 'test']])
      execFileSync('pnpm', command, { stdio: 'inherit', shell: process.platform === 'win32' });
  }
} finally {
  await writeFile('features.json', original);
}
