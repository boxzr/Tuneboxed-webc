import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from the apex domain via the CNAME in public/, so assets live at the root.
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Libraries change far less often than the app, so keeping them in
        // their own files lets returning visitors reuse them from cache.
        manualChunks(id) {
          if (id.includes('vite/preload-helper')) return 'vendor';
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](three|three-stdlib|@react-three|troika-[^\\/]+|camera-controls|maath|meshline)[\\/]/.test(id)) return 'three';
          if (/[\\/](firebase|@firebase)[\\/]/.test(id)) return 'firebase';
          if (/[\\/]@supabase[\\/]/.test(id)) return 'supabase';
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler|framer-motion|motion-dom|motion-utils|@babel)[\\/]/.test(id)) return 'vendor';
          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
    // Do not steal the browser to localhost. Hosting a real room belongs on
    // tuneboxed.com; opening the preview automatically is how rooms ended up
    // at http://localhost:3000/battle/...
    open: false,
  },
});
