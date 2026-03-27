import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['leaflet', 'react-leaflet', 'react', 'react-dom'],
  },
  server: {
    port: 3000,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
