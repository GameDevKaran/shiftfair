import { spawnSync } from 'node:child_process';
import { mkdir, cp } from 'node:fs/promises';
const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
await mkdir('build', { recursive: true });
await cp('public', 'build', { recursive: true });
await cp('dist/src', 'build/app', { recursive: true });
console.log('ShiftFair static application built in build/');
