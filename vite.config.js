import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    host: true,
    watch: {
      ignored: ['**/instagram_profiles/**', '**/rendered_reels/**', '**/backend/**']
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5182',
        changeOrigin: true
      },
      '/videos': {
        target: 'http://127.0.0.1:5182',
        changeOrigin: true
      }
    }
  }
})
