/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // App Theme Core Colors (Mapped to Tailwind utilities)
        coral: {
          light: '#F58972',
          DEFAULT: '#F26C4F',
          dark: '#D14F33',
        },
        orange: {
          light: '#EB7850',
          DEFAULT: '#E05624',
          dark: '#B83E14',
        },
        peach: {
          light: '#FFEBD6',
          DEFAULT: '#FFDAB9',
          dark: '#E6C19E',
        },
        yellow: {
          light: '#FEDD8A',
          DEFAULT: '#FEC84C',
          dark: '#DCA224',
        },
        rose: {
          light: '#E29EA7',
          DEFAULT: '#D9838E',
          dark: '#BA626D',
        },
        cream: {
          light: '#FFFFFF',
          DEFAULT: '#FDFBF7',
          dark: '#F5EFE3',
        },
        plum: {
          light: '#522F47',
          DEFAULT: '#3A1C30',
          dark: '#260F1E',
        },
        'warm-brown': {
          DEFAULT: '#4A2D1D',
          dark: '#301B0E'
        }
      },
      fontFamily: {
        // Aesthetic modern typography
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft-peach': '0 4px 20px -2px rgba(217, 131, 142, 0.12)',
        'soft-coral': '0 4px 25px -4px rgba(242, 108, 47, 0.15)',
        'premium': '0 10px 30px -10px rgba(58, 28, 48, 0.08)'
      }
    },
  },
  plugins: [],
}
