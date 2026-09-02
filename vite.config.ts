import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from the apex domain via the CNAME in public/, so assets live at the root.
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    // Do not steal the browser to localhost. Hosting a real room belongs on
    // tuneboxed.com; opening the preview automatically is how rooms ended up
    // at http://localhost:3000/battle/...
    open: false,
  },
});
