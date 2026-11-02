/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: '#08080A',
        obsidian: '#0F1015',
        scarlet: '#E6007E',
        'scarlet-dark': '#B5005F',
        gold: '#D4AF37',
        champagne: '#ECE5D8',
        'panel': '#13151C',
        'border-dark': '#1E2028',
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        vibes: ['"Great Vibes"', 'cursive'],
      },
      backgroundImage: {
        'gradient-scarlet': 'linear-gradient(135deg, #E6007E 0%, #B5005F 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #A88A1A 100%)',
      },
    },
  },
  plugins: [],
}
