/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tons tirados do logótipo oficial da ISFA
        isfa: {
          blue: "#1c4aa0",
          "blue-dark": "#0f2f6b",
          "blue-soft": "#eaf0fb",
          green: "#2a9d3c",
          "green-dark": "#1e7a2d",
          "green-soft": "#e8f6ea",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
