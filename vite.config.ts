import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dad-jokes-sms/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      }
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5174
    }
  }
})
