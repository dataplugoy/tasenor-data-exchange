import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Umami web analytics: the tracker tag goes into index.html only when UMAMI_WEBSITE_ID is set at build
// time (bin/docker-publish sets it for the hosted instance; other builds send nothing anywhere).
function umami(env: Record<string, string>) {
  return {
    name: 'umami',
    transformIndexHtml() {
      if (!env.UMAMI_WEBSITE_ID) return []
      const attrs: Record<string, string | boolean> = {
        defer: true,
        src: env.UMAMI_SCRIPT_URL || 'https://stats.dataplug-oy.com/dp.js',
        'data-website-id': env.UMAMI_WEBSITE_ID,
      }
      if (env.UMAMI_DOMAINS) attrs['data-domains'] = env.UMAMI_DOMAINS
      return [{ tag: 'script', attrs, injectTo: 'head' as const }]
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [umami(env), react()],
    base: '/',
    define: {
      DEBUG: JSON.stringify(env.DEBUG === 'true'),
      NODE_ENV: JSON.stringify(env.NODE_ENV || 'dev'),
      global: 'globalThis',
    },
    server: {
      allowedHosts: true,
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
