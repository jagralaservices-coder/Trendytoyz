/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B192C',
          deep: '#1E3E62',
          card: '#162840',
          silver: '#E2E8F0',
          accent: '#0284C7',
          accentHover: '#0369A1',
          gold: '#F59E0B',
          bg: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
