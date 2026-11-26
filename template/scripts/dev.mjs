import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { cp, rm } from 'node:fs/promises';
import { WebSocket, WebSocketServer } from 'ws';

const port = Number(process.env.EXTENSION_DEV_RELOAD_PORT ?? 17347);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Invalid reload port');
const server = new WebSocketServer({ host: '127.0.0.1', port });
server.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
await new Promise((resolve) => server.once('listening', resolve));
const staging = '.dev-dist';
let running = false;
let queued = false;
let initial = true;
let timer;

async function rebuild() {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/build.mjs'], {
        stdio: 'inherit',
        env: {
          ...process.env,
          EXTENSION_BUILD_DIR: staging,
          EXTENSION_DEV_RELOAD_PORT: String(port),
        },
      });
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0 ? resolve() : reject(new Error('Build failed')),
      );
    });
    if (initial) await rm('dist', { recursive: true, force: true });
    await cp(staging, 'dist', { recursive: true, force: true });
    initial = false;
    for (const client of server.clients) {
      if (client.readyState === WebSocket.OPEN) client.send('reload');
    }
    console.log('Development build ready; connected extensions reloaded.');
  } catch (error) {
    console.error(error.message, '— last successful build remains available.');
  } finally {
    running = false;
    if (queued) {
      queued = false;
      void rebuild();
    }
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => void rebuild(), 150);
}

const watchers = [
  watch('src', { recursive: true }, schedule),
  watch('icons', { recursive: true }, schedule),
  watch('scripts', { recursive: true }, schedule),
  watch('.', (_event, name) => {
    if (name && /^(features\.json|package\.json|.*\.html)$/.test(name))
      schedule();
  }),
];

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    for (const watcher of watchers) watcher.close();
    for (const client of server.clients) client.terminate();
    server.close();
    process.exit(0);
  });
}

console.log('Reload server on ws://127.0.0.1:' + port);
await rebuild();
