import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // Aumentado a 5MB para evitar error en build de Vercel
      },
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo192.png', 'logo512.png'],
      manifest: {
        name: 'Mi Pana',
        short_name: 'Mi Pana',
        description: 'Marketplace Premium para la Diáspora Venezolana',
        theme_color: '#FFB400',
        background_color: '#EDEDF5',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
