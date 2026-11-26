import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

if (!process.env.CI) {
  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  });
  if (git.status === 0 && resolve(git.stdout.trim()) === resolve('.')) {
    const result = spawnSync('lefthook', ['install'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  } else {
    console.log(
      'Initialize Git, then run pnpm hooks:install to enable staged formatting.',
    );
  }
}
