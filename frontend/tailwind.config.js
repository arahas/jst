/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          blue: '#232F3E',
          yellow: '#FF9900',
          orange: '#FF9900',
          lightblue: '#37475A',
          darkblue: '#131921'
        }
      }
    },
  },
  plugins: [],
} 