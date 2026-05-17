/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gbg:    '#0a0a1f',
        gcard:  '#0f0f2a',
        gborder:'#2a2a50',
        gacc:   '#6366f1',
      },
      fontFamily: {
        digital: ['"Share Tech Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
