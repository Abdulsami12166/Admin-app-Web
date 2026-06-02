import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'https://ecommerce-app-backend-1kn0.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});