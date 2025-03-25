import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dad-jokes-sms/',
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  ...(process.env.NODE_ENV === 'development' ? {
    server: {
      port: 5174,
      strictPort: true, // This will make Vite fail if port 5174 is not available
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    }
  } : {})
})
