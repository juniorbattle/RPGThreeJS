import { defineConfig } from 'vite';

export default defineConfig({
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
