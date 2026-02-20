import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Code splitting for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-icons', 'react-hot-toast', 'framer-motion'],
          'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts'],
          'redux': ['redux', 'react-redux', '@reduxjs/toolkit', 'redux-persist'],
        }
      }
    },
    // Use swc for faster minification (Vite default)
    minify: 'esbuild',
    // Increase chunk size warning
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'socket.io-client'],
  }
})