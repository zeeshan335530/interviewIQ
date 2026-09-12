import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'charts': ['recharts'],
          'pdf': ['jspdf', 'jspdf-autotable'],
          'ui-vendor': ['motion', 'react-icons', 'react-hot-toast', 'react-circular-progressbar'],
          'face-api': ['face-api.js'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
