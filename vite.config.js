import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Electron plugin kaldırıldı — artık Swift native app kullanıyoruz
export default defineConfig({
  plugins: [
    react(),
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
