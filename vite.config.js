import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Solo',
        short_name: 'Solo',
        description: 'Sistema Tático de Treino',
        theme_color: '#000000', 
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo-solo192px.png', 
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' 
          },
          {
            src: 'logo-solo512px.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/controle-de-treino/',
})