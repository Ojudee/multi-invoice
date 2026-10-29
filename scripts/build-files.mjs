import { cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = process.argv[2];

if (command === 'sync') {
  const dist = path.join(root, 'dist');
  cpSync(path.join(dist, 'assets'), path.join(root, 'assets'), { recursive: true, force: true });
  cpSync(dist, path.join(root, 'docs'), { recursive: true, force: true });
} else if (command === 'clean') {
  rmSync(path.join(root, 'dist'), { recursive: true, force: true });
  rmSync(path.join(root, 'server.js'), { force: true });
} else {
  throw new Error(`Unknown build-file command: ${command}`);
}
