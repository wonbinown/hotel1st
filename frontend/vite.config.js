import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    port: 5173,
    proxy: {
      '/api':   { target: 'http://localhost:8888', changeOrigin: true },
      '/oauth2':{ target: 'http://localhost:8888', changeOrigin: true },
      // ✅ 추가: /confirm도 백엔드(8888)로 프록시
      '/confirm': { target: 'http://localhost:8888', changeOrigin: true }
    }
  }
})

