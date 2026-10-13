import { resolve } from 'node:path';

process.env.CIN67_OUTPUT_DIR ??= resolve(process.cwd(), 'tmp/cinematics/cin673/after/video');
await import('./run_cin67_browser_qa.mjs');
