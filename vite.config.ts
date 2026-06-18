import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const adminApiProxyTarget =
  process.env.VITE_ADMIN_API_PROXY_TARGET || 'https://ecommerce-app-backend-1kn0.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/v1': {
        target: adminApiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
