import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    basicSsl(),
    nodePolyfills({
      include: ['crypto', 'buffer', 'util', 'stream'],
      globals: { Buffer: true, global: true, process: true }
    })
  ],
})
