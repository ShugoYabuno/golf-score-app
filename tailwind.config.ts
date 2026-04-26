import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#ede4d3",
        fairway: "#335c43",
        moss: "#7e9b76",
        cream: "#f5f2e9",
        ink: "#182218",
        danger: "#a83f2f",
      },
      boxShadow: {
        card: "0 18px 48px rgba(24, 34, 24, 0.08)",
      },
      borderRadius: {
        panel: "1.5rem",
      },
      fontFamily: {
        sans: ["Hiragino Sans", "Noto Sans JP", "system-ui", "sans-serif"],
        display: ['"Hiragino Mincho ProN"', '"Yu Mincho"', '"Noto Serif JP"', "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
