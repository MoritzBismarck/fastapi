/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['Courier', 'monospace'], // Override font-mono to use Courier
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

