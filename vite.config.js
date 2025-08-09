// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy for Edamam API
      '/api-edamam': {
        target: 'https://api.edamam.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-edamam/, ''),
      },
      // Proxy for TheMealDB API
      '/api-themealdb': {
        target: 'https://www.themealdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-themealdb/, ''),
      },
      // Proxy for Spoonacular API
      '/api-spoonacular': {
        target: 'https://api.spoonacular.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-spoonacular/, ''),
      },
    },
  },
})