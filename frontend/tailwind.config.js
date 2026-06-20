/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '375px',
      'ms': '425px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1440px',
    },
    extend: {
      colors: {
        // Core palette
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",

        // Backgrounds
        bgPrimary: "var(--background)",
        bgCard: "var(--surface)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "card-bg": "var(--card-background)",
        "modal-bg": "var(--modal-background)",
        "sidebar-bg": "var(--sidebar-background)",
        "header-bg": "var(--header-background)",

        // Text
        textPrimary: "var(--text)",
        textSecondary: "var(--text-secondary)",
        "text-muted": "var(--text-muted)",

        // Borders
        border: "var(--border)",
        "border-strong": "var(--border-strong)",

        // Semantic
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",

        // Interactive states
        "hover-bg": "var(--hover-bg)",
        "selected-bg": "var(--selected-bg)",
      },
      boxShadow: {
        glass: "0 2px 8px var(--shadow-color), 0 1px 3px rgba(0,0,0,0.03)",
        "glass-sm": "0 1px 3px var(--shadow-color), 0 1px 2px rgba(0,0,0,0.04)",
        "glass-lg": "0 10px 40px var(--shadow-color), 0 2px 8px var(--shadow-color)",
        "glass-xl": "0 20px 60px var(--shadow-color), 0 4px 12px var(--shadow-color)",
        card: "0 2px 8px color-mix(in srgb, var(--secondary) 12%, transparent)",
        "card-hover": "0 4px 12px color-mix(in srgb, var(--secondary) 15%, transparent)",
        theme: "0 2px 8px var(--shadow-color), 0 1px 3px rgba(0,0,0,0.04)",
        "theme-lg": "0 10px 40px var(--shadow-color), 0 2px 8px var(--shadow-color)",
      },
      borderRadius: {
        glass: "14px",
        "glass-lg": "18px",
      },
    },
  },
  plugins: [],
};
