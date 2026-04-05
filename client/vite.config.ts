import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiUrl,
        changeOrigin: true,
      },
      '/socket.io': {
        target: apiUrl,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
  },
});
