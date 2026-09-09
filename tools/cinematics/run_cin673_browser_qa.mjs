import { resolve } from 'node:path';

process.env.CIN671_OUTPUT_DIR ??= resolve(process.cwd(), 'tmp/cinematics/cin673/after/stills');
await import('./run_cin671_browser_qa.mjs');
