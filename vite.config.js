import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import { viteExpressPlugin } from './backend/vite-plugin.ts'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: { port: 6712 },
  plugins: [viteExpressPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
