import { defineConfig } from 'vite';

// Tool-only config: avoids loading the development VFX bridge while running
// deterministic repository generators and validators.
export default defineConfig({});
