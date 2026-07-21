import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // /mnt (9p/drvfs) não entrega eventos inotify → HMR não vê edições.
    // Polling garante hot-reload no WSL sobre disco Windows.
    watch: { usePolling: true, interval: 300 },
    // libera o domínio do túnel zrok (preview do ambiente local)
    allowedHosts: ['.share.zrok.io', '.zrok.io', 'localhost'],
    // 1 túnel serve front + API: /api → Django local (evita CORS e 2º túnel)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
