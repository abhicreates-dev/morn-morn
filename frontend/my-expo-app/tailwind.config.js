/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './screens/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#2f3e46',
        surface: '#354f52',
        surfaceLight: '#52796f',
        primary: '#84a98c',
        textMuted: '#cad2c5',
        textMain: '#ffffff',
      }
    },
  },
  plugins: [],
};
