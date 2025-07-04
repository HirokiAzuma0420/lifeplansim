/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}" // ← src以下のTSXにも適用されるようにする
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'IBM Plex Sans JP', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
