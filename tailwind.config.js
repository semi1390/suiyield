/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0E1A",
        card: "#111827",
        card2: "#161D2E",
        elevated: "#1C2539",
        green: { DEFAULT: "#00D4AA", dim: "#00A882" },
        brand: { 400: "#00D4AA", 600: "#00A882" }
      },
      fontFamily: { sans: ["DM Sans", "system-ui", "sans-serif"] }
    }
  },
  plugins: []
}
