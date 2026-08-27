/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shade: {
          dark: '#0B0F19', // Console/God mode background
          panel: '#151A25', // Floating panels background
          border: '#232A3B',
          accent: '#00FF9D', // Terminal green accent
          heat: {
            100: '#ffecd9',
            300: '#ffa15a',
            500: '#ff4c1a',
            700: '#bf1600',
            900: '#5a0000',
          },
          cool: {
            100: '#d9f2ff',
            500: '#0099ff',
            900: '#002b5a',
          },
          equity: {
            purple: '#9d00ff', // Highlights for vulnerability
          }
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', '"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
