import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { env } from 'node:process';

export default defineConfig({
  plugins: [react()],
  server: {
    host: env.HOST || '127.0.0.1',
    port: Number(env.FRONTEND_PORT || 3000),
    strictPort: true,
    proxy: {
      '/api': `http://127.0.0.1:${env.BACKEND_PORT || 4000}`
    }
  }
});
