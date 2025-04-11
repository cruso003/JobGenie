/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1", // Indigo-500
        accent: "#06B6D4",  // Cyan-500
        background: "#F9FAFB",
        dark: "#111827",
        cardLight: "#FFFFFF",
        cardDark: "#1F2937",
      },
    },
  },
  plugins: [],
};
