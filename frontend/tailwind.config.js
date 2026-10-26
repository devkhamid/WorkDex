export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#ff7a16',
          'orange-hover': '#e86807',
          blue: '#3b82f6',
          green: '#21bd68',
          red: '#ef5350',
          purple: '#8b5cf6',
          bg: '#f6f7f9',
          card: '#ffffff',
          line: '#e4e7ec',
          text: '#171b25',
          muted: '#7b8190',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 30px rgba(30,38,55,.06)',
        dropdown: '0 12px 30px rgba(20,30,45,.12)',
      }
    },
  },
  plugins: [],
}
