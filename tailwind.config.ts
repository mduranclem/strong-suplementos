import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F97316',
          dark: '#EA580C',
          light: '#FED7AA',
        },
        surface: '#F9FAFB',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        touch: '3.5rem',
      },
      fontSize: {
        '2xs': '0.65rem',
      },
    },
  },
  plugins: [],
} satisfies Config
