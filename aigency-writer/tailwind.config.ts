import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Aigency design language (ai-gency.ai): cream paper, warm ink,
      // sun orange, solid offset shadows. The `ink` scale is INVERTED
      // relative to a dark theme — 950 is the light page background and
      // 100 is the darkest text — so the existing dark-theme class usage
      // (bg-ink-950 page, bg-ink-900 cards, text-ink-200 body text)
      // flips to the light theme without touching every component.
      colors: {
        ink: {
          950: "#FBF7EE", // page (cream paper)
          900: "#FFFFFF", // cards
          800: "#F4EDDF", // panels
          700: "#E5DCC6", // borders
          600: "#D3C6A8", // strong borders / inputs
          500: "#A79878", // hints
          400: "#7A6F5B", // muted text
          300: "#57503F", // secondary text
          200: "#332E24", // body text
          100: "#1C1812", // ink (headings, solid shadows)
        },
        qalam: {
          DEFAULT: "#F26B1F", // the Aigency sun
          soft: "#C4500E", // readable orange for text on cream
          deep: "#9A3D0C",
        },
        teal: {
          glow: "#0C7C59",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "Noto Sans Arabic",
          "Tahoma",
          "sans-serif",
        ],
        serif: ["Playfair Display", "Noto Naskh Arabic", "Georgia", "serif"],
        display: ["Anton", "Noto Kufi Arabic", "Impact", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
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
        glow: "4px 4px 0 0 #1C1812",
        solid: "8px 8px 0 0 #1C1812",
        "solid-sun": "6px 6px 0 0 #F26B1F",
      },
    },
  },
  plugins: [],
};

export default config;
