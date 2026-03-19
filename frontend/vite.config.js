import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: { port: 6712 },
  build: { outDir: '../backend/dist', emptyOutDir: true },
  plugins: [tailwindcss()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: 'preact',
    },
  },
})
