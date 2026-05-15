/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: { DEFAULT: '#0d1117', card: '#161b22', elevated: '#1c2128' },
        border: { DEFAULT: '#21262d', strong: '#30363d' },
      }
    }
  },
  plugins: []
};
