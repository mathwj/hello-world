// tsc only emits .js — the JSON dataset has to be copied into dist by hand.
import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/data', { recursive: true });
await cp('src/data', 'dist/data', { recursive: true });
console.log('Copied src/data → dist/data');
