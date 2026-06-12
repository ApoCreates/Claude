import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WayOut Camper Quest — UAE Family Adventure",
  description:
    "Rent a WayOut camper van, load up the family, and roam the real UAE collecting tokens at genuine camping spots. Find rare places to level up — every stop shows its real Google Maps listing.",
};

// The game is a fully self-contained HTML5 canvas build living in
// /public/wayout-quest/index.html. We load it full-screen via an iframe so it
// owns its own touch input, fullscreen canvas, and game loop without fighting React.
export default function WayOutQuestPage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        margin: 0,
        background: "#0d1526",
        overflow: "hidden",
      }}
    >
      <iframe
        src="/wayout-quest/index.html"
        title="WayOut Camper Quest"
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
