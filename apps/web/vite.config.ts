import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@universal-plm/industry-capabilities': fileURLToPath(new URL('./src/shared/industry-capabilities/index.ts', import.meta.url)),
      '@universal-plm/enterprise-scale': fileURLToPath(new URL('./src/shared/enterprise-scale/index.ts', import.meta.url)),
      '@universal-plm/autonomous-operations': fileURLToPath(new URL('./src/shared/autonomous-operations/index.ts', import.meta.url)),
      '@universal-plm/domain-core': fileURLToPath(new URL('./src/shared/domain-core/index.ts', import.meta.url)),
      '@universal-plm/configuration-engine': fileURLToPath(new URL('./src/shared/configuration-engine/index.ts', import.meta.url)),
      '@universal-plm/manufacturing': fileURLToPath(new URL('./src/shared/manufacturing/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
