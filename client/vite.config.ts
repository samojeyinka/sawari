import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/courses': 'http://localhost:4000',
      '/sitemap.xml': 'http://localhost:4000',
      '/robots.txt': 'http://localhost:4000',
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
  },
})
