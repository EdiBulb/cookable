import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' → 어떤 경로에 올려도 동작하도록 상대 경로로 빌드
export default defineConfig({
  base: './',
  plugins: [react()],
})
