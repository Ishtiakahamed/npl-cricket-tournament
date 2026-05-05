/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        telegram: {
          blue: '#0088cc',
          dark: '#17212b',
          darker: '#0e1621',
          panel: '#1b2836',
          hover: '#202b36',
          msg: '#182533',
          msgOut: '#2b5278',
          text: '#e4ecf2',
          textSec: '#6d8296',
          accent: '#64b5ef',
          green: '#4fae4e',
          red: '#e05555',
          orange: '#e09255',
        },
      },
    },
  },
  plugins: [],
};
