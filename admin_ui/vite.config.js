import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Must match the path FastAPI serves the app at (/panel)
  base: '/panel/',

  server: {
    port: 5174,
    // Proxy API calls to the local FastAPI server during development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
