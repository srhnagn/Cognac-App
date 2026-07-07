import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'electron/main.js',
    }),
  ],
  server: {
    proxy: {
      '/api-apple': {
        target: 'https://api.music.apple.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-apple/, ''),
        headers: {
          'Origin': 'https://music.apple.com',
          'Referer': 'https://music.apple.com/'
        }
      }
    }
  }
})
