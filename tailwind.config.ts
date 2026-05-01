import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hunter: "#0c2f21",
        "hunter-deep": "#071d16",
        gold: "#c99b3b",
        "gold-light": "#e0bf70",
        cream: "#f6efd8",
        parchment: "#efe1bd",
        ink: "#1d241f",
        sage: "#879b75",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Arial",
          "Helvetica",
          "sans-serif",
        ],
      },
      boxShadow: {
        "gold-soft": "0 20px 60px rgba(201, 155, 59, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
