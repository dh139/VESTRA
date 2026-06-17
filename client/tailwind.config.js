/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14110F',
        bone: '#F6F3EE',
        pine: '#1F3D2B',
        brass: '#B08968',
        mist: '#E4E1D8',
        signal: '#C0392B',
      },
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        utility: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 10px 30px -5px rgba(20, 17, 15, 0.05), 0 8px 15px -6px rgba(20, 17, 15, 0.05)',
      }
    },
  },
  plugins: [],
}
