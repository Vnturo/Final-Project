/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This makes Lato the default font across your entire app
        sans: ['Lato', 'sans-serif'], 
      },
      colors: {
        dropBackground: '#0F172A', // Sleek dark slate
        dropCard: '#1E293B',       // Slightly lighter card background
        urgencyOrange: '#FF5722',  // Our primary "Deal" color
        urgencyPurple: '#8B5CF6',
      },
      animation: {
        // A slow 3-second pulse that isn't obnoxious
        'subtle-pulse': 'subtlePulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        subtlePulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 }, // Doesn't flash fully off, just dims slightly
        }
      }
    },
  },
  plugins: [],
}