/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff5500', // ELD Vibrant Orange
          600: '#e54b00',
          700: '#c23800',
          800: '#9a2c00',
          900: '#7c2400',
          950: '#430f00',
        },
        dark: {
          950: '#09090b', // ELD Deep Black
          900: '#121215',
          850: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
        },
        sidebar: {
          bg: '#ffffff',
          darkBg: '#0e0e11',
          border: '#e4e4e7',
          hover: '#fff7ed',
          active: '#ffedd5',
          text: '#52525b',
          activeText: '#ff5500',
        },
        surface: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        },
        status: {
          orange: {
            bg: '#fff7ed',
            text: '#c23800',
            border: '#fed7aa',
          },
          blue: {
            bg: '#eff6ff',
            text: '#1d4ed8',
            border: '#bfdbfe',
          },
          green: {
            bg: '#ecfdf5',
            text: '#047857',
            border: '#a7f3d0',
          },
          yellow: {
            bg: '#fffbeb',
            text: '#b45309',
            border: '#fde68a',
          },
          red: {
            bg: '#fef2f2',
            text: '#b91c1c',
            border: '#fecaca',
          },
          purple: {
            bg: '#f5f3ff',
            text: '#6d28d9',
            border: '#ddd6fe',
          },
          gray: {
            bg: '#f4f4f5',
            text: '#52525b',
            border: '#e4e4e7',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        dropdown: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
        glow: '0 0 16px -4px rgba(255, 85, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
