/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primario: '#0B5ED7',
        fundo: '#F3F4F6'
      }
    }
  },
  plugins: []
};
