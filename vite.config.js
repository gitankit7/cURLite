import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure ports - matches server/index.js logic
const DEV_PORT = parseInt(process.env.DEV_PORT || process.env.PORT || '2401', 10);
const API_PORT = parseInt(process.env.API_PORT || (process.env.PORT ? (parseInt(process.env.PORT) + 1) : '2402'), 10);

export default defineConfig({
  plugins: [react()],
  server: {
    port: DEV_PORT,
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
