import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  base: '/ZIP/', // GitHub Pages 저장소 이름 대소문자 일치
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
