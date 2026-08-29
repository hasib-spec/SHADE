/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#050608',
          900: '#08090d',
          850: '#0c0e14',
          800: '#11141d',
          700: '#1a1f2c',
        },
        laser: {
          cyan: '#00e5ff',
          emerald: '#00f59b',
          crimson: '#ff3355',
          amber: '#ff9900',
          violet: '#a855f7',
        },
        shade: {
          dark: '#08090d',
          panel: '#0e121a',
          border: 'rgba(0, 229, 255, 0.15)',
          accent: '#00f59b',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'laser-cyan': '0 0 20px rgba(0, 229, 255, 0.25)',
        'laser-emerald': '0 0 20px rgba(0, 245, 155, 0.25)',
        'laser-crimson': '0 0 20px rgba(255, 51, 85, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-cyan': 'glowCyan 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowCyan: {
          '0%': { boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
