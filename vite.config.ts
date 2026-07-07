import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy DEV local : `npm run dev` route /api vers le backend jurilux-insight
// (fork de jurilux-api), exactement comme Caddy le fera en production (same-origin).
// Cible configurable via API_TARGET (défaut = backend local sur :8088).
const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:8088';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/docs': { target: API_TARGET, changeOrigin: true },
    },
  },
});
