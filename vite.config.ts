import { defineConfig, type Plugin } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

      // R2C-LAB V1D.2: DEV-only GIF preview bridge using deterministic preview index
      let previewIndexCache: Record<string, { status: string; previewRelativePath: string | null }> | null = null;
      function getPreviewIndex(): Record<string, { status: string; previewRelativePath: string | null }> {
        if (previewIndexCache !== null) return previewIndexCache;
        const indexPath = join(process.cwd(), 'docs', 'reports', 'vfx-megapack-preview-index.json');
        if (!existsSync(indexPath)) {
          previewIndexCache = {};
          return previewIndexCache;
        }
        const data = JSON.parse(readFileSync(indexPath, 'utf-8'));
        const idx = data.index ?? {};
        previewIndexCache = idx;
        return idx;
      }

      server.middlewares.use('/dev/vfx-preview', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        const url = req.url ?? '';
        const candidateId = url.replace(/^\//, '').replace(/\.gif$/, '');
        if (!candidateId || candidateId.includes('/') || candidateId.includes('\\') || candidateId.includes('..')) {
          res.statusCode = 400;
          res.end('Invalid candidateId');
          return;
        }
        const megaPackRoot = process.env.MEGA_PACK_ROOT;
        if (!megaPackRoot) {
          res.statusCode = 503;
          res.end('MEGA_PACK_ROOT not configured');
          return;
        }
        const index = getPreviewIndex();
        const entry = index[candidateId];
        if (!entry) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Candidate not found in preview index');
          return;
        }
        if (entry.status !== 'RESOLVED' || !entry.previewRelativePath) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end(entry.status === 'AMBIGUOUS' ? 'AMBIGUOUS_PREVIEW' : 'PREVIEW UNAVAILABLE');
          return;
        }
        const gifPath = join(megaPackRoot, '02_previews', entry.previewRelativePath.replace(/\\/g, '/'));
        if (!existsSync(gifPath)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('PREVIEW UNAVAILABLE');
          return;
        }
        const gifData = readFileSync(gifPath);
        res.setHeader('Content-Type', 'image/gif');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(gifData);
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
