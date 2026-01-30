/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AQUI ESTÁ A CORREÇÃO.
        // Conectamos o nome que está no React (primary) com a variável do seu CSS (--primary)
        
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        input: 'var(--bg-input)',
        
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        
        // As cores que estavam faltando:
        primary: 'var(--primary)',     
        secondary: 'var(--secondary)', 
        
        // Outras utilitárias
        border: 'var(--border-color)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        cyber: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      }
    },
  },
  plugins: [],
}