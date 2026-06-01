/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        blender: {
          dark: '#212121',
          panel: '#303030',
          input: '#1D1D1D',
          accent: '#E58E35',
        }
      }
    },
  },
  plugins: [],
}
