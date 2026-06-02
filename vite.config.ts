import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/v1': {
        target: process.env.VITE_ADMIN_API_PROXY_TARGET || 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
