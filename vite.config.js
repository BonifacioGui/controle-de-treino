import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/controle-de-treino/', // Isso garante que os caminhos dos arquivos fiquem relativos
})
