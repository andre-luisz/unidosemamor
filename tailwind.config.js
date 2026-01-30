/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  
  theme: {
    extend: {
      colors: {
        primary: "#E53935",
        secondary: "#FBC02D",
        support: "#1E88E5",
        dark: "#0F172A",
      },
    },
  },
  plugins: [],
}
