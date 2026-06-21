import type { Config } from "tailwindcss";

/**
 * The Aigency — design tokens, lifted verbatim from the v.2 brand guide and the
 * web "Front door" token set. Dark surface is the default; paper is the inverse.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // surfaces
        surface: "#15140F", // ink — primary dark surface, never #000000
        surface2: "#1A1812",
        card: "#1A1812",
        cardHover: "#211E17",
        // paper (inverse)
        paper: "#F4EFE5",
        paperDeep: "#E9E2D3",
        // text
        on: "#F4EFE5", // text on dark
        ink: "#15140F", // text on paper
        mute: "#6E685D",
        // accents (warm, restrained)
        accent: "#FFCB58", // marigold — type highlight on dark
        accent2: "#F2862A", // coral-orange
        ochre: "#C4612A", // primary accent
        dusk: "#8B2E1F", // weight / warnings
        gold: "#D9A24A", // warmth, never a heading color
      },
      fontFamily: {
        serif: ["var(--serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--sans)", "Inter Tight", "system-ui", "sans-serif"],
        mono: ["var(--mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        label: "0.2em",
      },
      maxWidth: {
        shell: "1440px",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulse2: {
          "0%": { boxShadow: "0 0 0 0 rgba(255,203,88,0.5)" },
          "70%": { boxShadow: "0 0 0 8px rgba(255,203,88,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,203,88,0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "none" },
        },
      },
      animation: {
        floaty: "floaty 9s ease-in-out infinite",
        pulse2: "pulse2 2.4s ease-out infinite",
        rise: "rise 800ms cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
