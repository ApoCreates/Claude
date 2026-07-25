import type { Config } from "tailwindcss";

// wadehAI palette — derived from The Aigency design system v.3.
// Two colours carry every composition (paper / ink) at roughly 70/20/10.
// Ochre is the default accent. Never #FFF, never #000.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4EFE5",
        "paper-deep": "#E9E2D3",
        ink: "#15140F",
        "ink-panel": "#1D1A13",
        "ink-lift": "#242017",
        mute: "#6E685D",
        "mute-light": "#A39B8B",
        ochre: "#C4612A",
        dusk: "#8B2E1F",
        gold: "#D9A24A",
        marigold: "#FFCB58",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "var(--font-amiri)", "Georgia", "serif"],
        sans: ["var(--font-inter-tight)", "var(--font-plex-arabic)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderColor: {
        hairline: "rgba(244, 239, 229, 0.14)",
        "hairline-strong": "rgba(244, 239, 229, 0.28)",
      },
      letterSpacing: {
        label: "0.22em",
      },
    },
  },
  plugins: [],
};
export default config;
