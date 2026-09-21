/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lab: {
          950: '#080a0f',
          900: '#0d111a',
          850: '#121824',
          800: '#172030',
          700: '#222f46',
          600: '#2f4263',
          500: '#3f5884',
        },
        neon: {
          cyan: '#00f2fe',
          magenta: '#ff007f',
          purple: '#9d4edd',
          lime: '#00ff88',
          amber: '#ffb703'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
