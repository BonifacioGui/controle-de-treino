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
      },
      // 🔥 O CÉREBRO OFFLINE COMEÇA AQUI
      workbox: {
        // Diz para o navegador fazer download e guardar todos esses tipos de arquivo:
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Se o usuário entrar numa rota que não existe offline, joga ele pro index principal:
        navigateFallback: '/controle-de-treino/index.html',
        // Quando você lançar uma versão nova do app, ele limpa a memória velha pra não pesar o celular do usuário:
        cleanupOutdatedCaches: true, 
      }
    })
  ],
  base: '/controle-de-treino/',
})