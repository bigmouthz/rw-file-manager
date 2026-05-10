import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    cssMinify: 'esbuild',
  },
  server: {
    port: 5199,
    strictPort: true,
  },
})
