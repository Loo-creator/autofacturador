import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Ruta relativa: funciona igual en la raíz del dominio y en un subpath de
  // GitHub Pages (https://<usuario>.github.io/<repo>/)
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 900
  },
  server: {
    port: 5173,
    open: true
  }
})
