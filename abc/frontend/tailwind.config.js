/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          teal: {
            light: '#0F6E56',
            dark: '#1D9E75',
            DEFAULT: '#0F6E56'
          }
        },
        risk: {
          low: '#16A34A',
          suspicious: '#D97706',
          high: '#DC2626'
        }
      }
    },
  },
  plugins: [],
}
