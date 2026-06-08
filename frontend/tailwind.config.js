/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryBg: "#050816",
        secondaryBg: "#0A1020",
        cardBg: "rgba(15,23,42,0.8)",
        primaryAccent: "#00F5FF",
        secondaryAccent: "#FF00EA",
        success: "#00FF9D",
        warning: "#FFC857",
        danger: "#FF4D6D",
        text: "#FFFFFF",
        muted: "#94A3B8",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
