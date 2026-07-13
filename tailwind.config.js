/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta estricta de marca Entel. No usar colores fuera de esta definicion.
      colors: {
        primary: {
          DEFAULT: '#002eff',
          50: '#eef1ff',
          100: '#dbe1ff',
          600: '#002eff',
          700: '#0025cc',
          900: '#001a8f',
        },
        accent: {
          DEFAULT: '#ff3d00',
          50: '#fff2ee',
          100: '#ffe0d6',
        },
        secondary: {
          DEFAULT: '#41e8b4',
          50: '#eafbf5',
          100: '#d1f6e8',
        },
        ink: {
          DEFAULT: '#0b1020',
          soft: '#3a4152',
          faint: '#6b7280',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f5f6fa',
          border: '#e6e8ef',
        },
      },
      fontFamily: {
        // Tipografia exclusiva de marca: Barlow.
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11, 16, 32, 0.08), 0 1px 2px rgba(11, 16, 32, 0.04)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
}
