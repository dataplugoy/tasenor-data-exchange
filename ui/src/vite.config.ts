import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: '/',
    define: {
      DEBUG: JSON.stringify(env.DEBUG === 'true'),
      NODE_ENV: JSON.stringify(env.NODE_ENV || 'dev'),
      global: 'globalThis',
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.API_URL || 'http://localhost:7302',
          secure: false,
          ws: false,
        },
      }
    }
  }
})
