export const ADMIN_CONFIG = {
  // Use 'public' for the unified Render-hosted backend.
  // Switch to 'local' only when you are running the unified backend on your machine.
  mode: 'public' as 'public' | 'local',

  // Production unified ecommerce backend on Render.
  publicApiBaseUrl: 'https://ecommerce-app-backend-1kn0.onrender.com/api/v1',
  publicSocketUrl: 'https://ecommerce-app-backend-1kn0.onrender.com',

  // Local unified backend for Android emulator testing.
  localApiBaseUrl: 'http://10.0.2.2:5001/api/v1',
  localSocketUrl: 'http://10.0.2.2:5001',
};

export const getApiBaseUrl = () =>
  ADMIN_CONFIG.mode === 'public'
    ? ADMIN_CONFIG.publicApiBaseUrl
    : ADMIN_CONFIG.localApiBaseUrl;

export const getSocketBaseUrl = () =>
  ADMIN_CONFIG.mode === 'public'
    ? ADMIN_CONFIG.publicSocketUrl
    : ADMIN_CONFIG.localSocketUrl;
