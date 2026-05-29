import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': { target: 'http://localhost:5001', changeOrigin: true },
      '/api/colleges': { target: 'http://localhost:5002', changeOrigin: true },
      '/api/students': { target: 'http://localhost:5003', changeOrigin: true },
      '/api/batches': { target: 'http://localhost:5003', changeOrigin: true },
      '/api/exams': { target: 'http://localhost:5004', changeOrigin: true },
      '/api/proctoring': { target: 'http://localhost:5005', changeOrigin: true },
      '/api/notifications': { target: 'http://localhost:5006', changeOrigin: true },
      '/api/analytics': { target: 'http://localhost:5006', changeOrigin: true },
      '/api/health': { target: 'http://localhost:5001', changeOrigin: true },
      '/ws': { target: 'ws://localhost:6001', ws: true }
    }
  }
})

