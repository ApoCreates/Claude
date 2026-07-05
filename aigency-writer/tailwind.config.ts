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
        ink: {
          950: "#0b0e14",
          900: "#10141d",
          800: "#171c28",
          700: "#212838",
          600: "#2e3750",
          500: "#4a5573",
          400: "#7482a3",
          300: "#a3aec9",
          200: "#cdd4e4",
          100: "#e8ebf3",
        },
        qalam: {
          DEFAULT: "#d4a545",
          soft: "#e7c67c",
          deep: "#a97e24",
        },
        teal: {
          glow: "#3fbf9f",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "Noto Sans Arabic",
          "Tahoma",
          "sans-serif",
        ],
        arabic: [
          "Noto Naskh Arabic",
          "Amiri",
          "Geeza Pro",
          "Traditional Arabic",
          "Tahoma",
          "serif",
        ],
      },
      boxShadow: {
        glow: "0 0 40px -12px rgba(212, 165, 69, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
