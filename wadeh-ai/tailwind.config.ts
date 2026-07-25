import type { Config } from "tailwindcss";

// wadehAI palette — derived from The Aigency design system v.3, set in its
// "on paper" mode: Paper #F4EFE5 carries the page, Ink #15140F carries the
// type, and Ochre is the one accent. Never #FFF, never #000.
//
// NOTE ON TOKEN NAMES: the app was first built ink-first, so components use
// `bg-ink` for surfaces and `text-paper` for type. The daylight flip happens
// HERE, at the token layer: `ink` now resolves to paper values (surfaces) and
// `paper` to ink values (type). Read tokens as roles — surface/text — not hues.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // type + dark fills (was Paper cream)
        paper: "#15140F",
        "paper-deep": "#2A2620",
        // surfaces (was Ink near-black)
        ink: "#F4EFE5",
        "ink-panel": "#ECE5D4",
        "ink-lift": "#E4DCC8",
        mute: "#8A8272",
        "mute-light": "#6E685D",
        ochre: "#C4612A",
        dusk: "#8B2E1F",
        gold: "#A87D2A",
        // the active accent for borders, highlights and primary buttons —
        // ochre-family in daylight (marigold text is illegible on paper)
        marigold: "#C4612A",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "var(--font-amiri)", "Georgia", "serif"],
        sans: ["var(--font-inter-tight)", "var(--font-plex-arabic)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderColor: {
        hairline: "rgba(21, 20, 15, 0.16)",
        "hairline-strong": "rgba(21, 20, 15, 0.34)",
      },
      letterSpacing: {
        label: "0.22em",
      },
    },
  },
  plugins: [],
};
export default config;
