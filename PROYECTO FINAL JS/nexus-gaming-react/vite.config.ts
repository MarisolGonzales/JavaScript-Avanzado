import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vite + plugin de React (Laboratorios 13 y 14).
 * El proxy envía /api al backend de Express, así el navegador no necesita CORS.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
