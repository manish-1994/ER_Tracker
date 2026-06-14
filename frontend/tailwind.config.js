/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00E5FF",
        secondary: "#8B5CF6",
        success: "#00FF9D",
        warning: "#FFB800",
        danger: "#FF4D6D",
        cyberBg: "#020617",
        cyberCard: "rgba(8,15,30,0.85)",
        cyberBorder: "rgba(0,229,255,0.20)",
        text: "#E2E8F0",
        muted: "#94A3B8",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
