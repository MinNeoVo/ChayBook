/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chaybook: {
          primary: '#006b2c',
          hover: '#00873a',
          bg: '#f7faf7',
          container: '#f1f4f1',
        }
      }
    },
  },
  plugins: [],
}