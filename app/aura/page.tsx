import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AURA — Mirage Nights",
  description:
    "A one-thumb light-weaving arcade game. Catch motes (each plays a note), dodge shards, charge the pulse. Pure canvas + WebAudio.",
};

// AURA is a fully self-contained HTML5 canvas + WebAudio game in
// /public/aura/index.html. Loaded full-screen via an iframe so it owns its
// own touch input, audio context, and game loop.
export default function AuraPage() {
  return (
    <main style={{ position: "fixed", inset: 0, margin: 0, background: "#05030f", overflow: "hidden" }}>
      <iframe
        src="/aura/index.html"
        title="AURA — Mirage Nights"
        allow="autoplay; fullscreen"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", display: "block" }}
      />
    </main>
  );
}
