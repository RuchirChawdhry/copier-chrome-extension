import { createHash } from 'node:crypto';
import { readFile, readdir, rm } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { surfaces } from './config.mjs';

export async function snapshot(root) {
  const files = new Map();
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) {
        const data = await readFile(path);
        files.set(relative(root, path).split(sep).join('/'), createHash('sha256').update(data).digest('hex'));
      }
    }
  }
  await walk(root);
  return files;
}

export async function reloadPlan(previous, next, staging) {
  if (!previous) return { kind: 'full', surfaces: [] };
  const changed = new Set([...new Set([...previous.keys(), ...next.keys()])].filter((path) => previous.get(path) !== next.get(path)));
  if (!changed.size) return { kind: 'none', surfaces: [] };
  const covered = new Set();
  const affected = [];
  for (const [name, html] of Object.entries(surfaces)) {
    if (!next.has(html)) continue;
    const document = await readFile(join(staging, html), 'utf8');
    const assets = [html, ...[...document.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map((match) => match[1].replace(/^\.\//, '').replace(/^\//, ''))];
    for (const asset of assets) covered.add(asset);
    if (assets.some((asset) => changed.has(asset))) affected.push(name);
  }
  // Unknown output changes conservatively require a full extension reload.
  if ([...changed].some((path) => !covered.has(path) && (next.has(path) || !path.startsWith('assets/'))))
    return { kind: 'full', surfaces: [] };
  return { kind: 'surfaces', surfaces: affected };
}

export async function removeStale(previous, next, root) {
  if (!previous) return;
  for (const path of previous.keys()) if (!next.has(path)) await rm(join(root, path), { force: true });
}
