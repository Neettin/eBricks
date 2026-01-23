/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
    "./constants.tsx"
  ],
  theme: {
    extend: {
      colors: {
        brick: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a', // Added this to match your Home.tsx bg-brick-950
          dark: '#450a0a',
        },
        heritage: {
          gold: '#D4AF37',
          bronze: '#CD7F32',
          wood: '#5D4037',
          temple: '#8D6E63'
        },
        construction: {
          yellow: '#FFD700',
          gold: '#DAA520',
          dark: '#2d3436'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        mukta: ['Mukta', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.8s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}