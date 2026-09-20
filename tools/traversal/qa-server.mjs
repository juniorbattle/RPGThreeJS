/** Stable local QA server: no filesystem reload can erase an in-progress route. */
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5174, strictPort: true, host: '127.0.0.1', watch: null, hmr: false } });
await server.listen();
server.printUrls();
