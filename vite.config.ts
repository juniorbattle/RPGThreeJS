import { defineConfig, type Plugin } from 'vite';

function vfxDevAcquisitionPlugin(): Plugin {
  return {
    name: 'vfx-dev-acquisition',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/dev/vfx-acquire', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
          return;
        }
        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }
        let candidateId: string;
        try {
          const parsed = JSON.parse(body);
          candidateId = parsed.candidateId;
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body' }));
          return;
        }
        if (!candidateId || typeof candidateId !== 'string' ||
            candidateId.includes('/') || candidateId.includes('\\') || candidateId.includes('..')) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Invalid candidateId' }));
          return;
        }
        const megaPackRoot = process.env.MEGA_PACK_ROOT;
        if (!megaPackRoot) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'MEGA_PACK_ROOT not configured on server' }));
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lib = await import('./tools/vfx/sync-candidate-lib.mjs') as any;
        const { loadInventory, syncSingleCandidate, DEST_ROOT } = lib;
        const inventory = loadInventory();
        const result = await syncSingleCandidate({ megaPackRoot, inventory, candidateId, destRoot: DEST_ROOT });
        res.setHeader('Content-Type', 'application/json');
        if (result.ok) {
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } else {
          res.statusCode = 500;
          res.end(JSON.stringify(result));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [vfxDevAcquisitionPlugin()],
  build: {
    rollupOptions: {
      input: {
        game: 'index.html',
        combat: 'legacy-combat.html',
      },
      output: {
        manualChunks(id) {
          const normalized = id.replaceAll('\\', '/');
          if (normalized.includes('/node_modules/three/examples/jsm/')) return 'three-postprocessing';
          if (normalized.includes('/node_modules/three/')) return 'three-core';
          if (normalized.includes('/node_modules/zod/')) return 'validation';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
