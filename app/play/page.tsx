import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mirage City — Dubai Nights · Chapter 1",
  description:
    "A playable concept: a neon-noir, GTA-style open world set in Dubai. Drive supercars, walk the Marina, read the city's lights.",
};

// The game itself is a fully self-contained HTML5 canvas build living in
// /public/dubai/index.html. We load it full-screen via an iframe so it can own
// its own touch input, fullscreen canvas, and game loop without fighting React.
export default function PlayPage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        margin: 0,
        background: "#05060f",
        overflow: "hidden",
      }}
    >
      <iframe
        src="/dubai/index.html"
        title="Mirage City — Dubai Nights"
        allow="fullscreen; accelerometer; gyroscope"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
    </main>
  );
}
