import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiOrigin = new URL(env.VITE_API_BASE_URL || 'http://localhost:5000').origin
  return {
    plugins: [
      react(),
      {
        name: 'auth-content-security-policy',
        apply: 'build',
        transformIndexHtml() {
          return [{
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' ${apiOrigin}; object-src 'none'; base-uri 'none'; form-action 'self'`,
            },
            injectTo: 'head-prepend',
          }]
        },
      },
    ],
    server: { port: 5173 },
  }
})
