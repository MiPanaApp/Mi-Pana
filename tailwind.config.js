/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pana-yellow': '#FFB400',
        'pana-gold': '#F8E22A',
        'pana-bg': '#E0E5EC',
        'pana-surface': '#EDEDF5',
        'pana-blue': '#1A1A3A', // Adjusted for contrast per PRD context
        'pana-red': '#D90429',
      },
      boxShadow: {
        'clay-card': '20px 20px 60px #bebebe, -20px -20px 60px #ffffff',
        'clay-btn': 'inset 5px 5px 10px #bebebe, inset -5px -5px 10px #ffffff',
        'neumorphic-soft': '10px 10px 20px #d1d1d9, -10px -10px 20px #ffffff',
        'clay-icon': 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
