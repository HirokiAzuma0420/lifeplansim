/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}" // ← src以下のTSXにも適用されるようにする
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
