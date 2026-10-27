/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#120E17',
          900: '#19151F', // Main app background
          800: '#231A28',
          700: '#2B2432', // Card background
          600: '#35293B', // Nested panel / input background
          500: '#514052', // Border / track
          400: '#665368',
          text: '#F6DDE8', // Primary text
          muted: '#A492A1', // Subtitles / secondary
        },
        cream: {
          50: '#FFFBF7',
          100: '#FBF3EB',
          200: '#F5E8DA',
          300: '#ECD9C5',
        },
        blush: {
          50: '#FDF4F5',
          100: '#FAE6E9',
          200: '#F4CDD3',
          300: '#EDB0B9',
          400: '#E594A1',
          500: '#DA7484',
          600: '#C45A6C',
          700: '#A04555',
          800: '#7E3745',
        },
        plum: {
          50: '#F6F1F3',
          100: '#E8DBE1',
          200: '#CDB4C0',
          300: '#B08AA0',
          400: '#936681',
          500: '#7A4E66',
          600: '#623E53',
          700: '#4E3242',
          800: '#3B2633',
          900: '#2A1A25',
        },
        sage: {
          400: '#8FB39B',
          500: '#6E9B7E',
          600: '#527E63',
        },
        gold: {
          400: '#E8C384',
          500: '#D9A85A',
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 20px -4px rgba(122, 78, 102, 0.12)',
        card: '0 8px 30px -10px rgba(122, 78, 102, 0.18)',
        glow: '0 0 24px -6px rgba(237, 176, 185, 0.5)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
        'tab-slide-down': 'tabSlideDown 0.38s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop': 'pop 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        tabSlideDown: {
          '0%': { opacity: '0', transform: 'translate3d(0, -26px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(0.97)' },
          '60%': { transform: 'scale(1.015)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
