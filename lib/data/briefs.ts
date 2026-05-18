export type Brief = {
  date: string;
  headline: string;
  summary: string;
  sections: { title: string; body: string }[];
  actions: string[];
};

// Canned morning briefs — represent the "morning content machine" output.
// In production these would be generated overnight from live data.

export const BRIEFS: Brief[] = [
  {
    date: "2026-05-18",
    headline: "Volt Berry Rush takes #1 energy slot in convenience; West region revenue +6.4% WoW",
    summary:
      "Strongest week of the quarter for the West region, led by energy drinks and HORECA juice. Watch Amperion's price action in Texas convenience.",
    sections: [
      {
        title: "What moved",
        body:
          "Volt Berry Rush overtook Amperion's flagship in convenience-channel scan data for the first time, capturing 24.1% category share (+3.8pp WoW). HORECA juice volumes in West rose 11% as Verde Mango Sunrise listings hit 240 new accounts.",
      },
      {
        title: "What broke",
        body:
          "Glacio Sparkling Lime is short on supply in three Midwest distribution centers. Forecast suggests stockouts in 18 Hypermarket banners by Wednesday if no reallocation.",
      },
      {
        title: "What to watch",
        body:
          "Amperion filed for a Texas-only promo permit suggesting an imminent 12% discount push. Cascade ChargeX shelf resets begin May 22 — expect competitive pressure on Volt Original.",
      },
    ],
    actions: [
      "Approve emergency Glacio Sparkling Lime reallocation from Northeast surplus.",
      "Brief Volt brand team on Amperion's likely Texas counter-move.",
      "Greenlight Verde Mango Sunrise Northeast HORECA expansion (see Scenario scn-002).",
    ],
  },
  {
    date: "2026-05-17",
    headline: "Mountain region underperforms forecast for 3rd week; investigate Meridian price action",
    summary:
      "Mountain region revenue tracked 7% below forecast. Glacio still-water share dropped 1.4pp; Meridian Pure appears to be running a quiet trade promo.",
    sections: [
      {
        title: "What moved",
        body:
          "Mountain weekly revenue $1.92M vs forecast $2.07M. Glacio Still volumes -9% WoW in Denver and Salt Lake City. Aurora Cola Zero held flat — the only bright spot.",
      },
      {
        title: "What broke",
        body:
          "Two convenience banners in Phoenix temporarily delisted Solace Lemon Honey after slow turn rates. Aligns with the discontinuation thesis in Scenario scn-003.",
      },
      {
        title: "What to watch",
        body:
          "Solbright Foods recall coverage in Midwest media may shift dairy demand — Pasture has a 10-day window to capture trial.",
      },
    ],
    actions: [
      "Field team to confirm Meridian trade promo within 48h.",
      "Run a 2-week Pasture trial promo in Midwest while Solbright is offline.",
    ],
  },
  {
    date: "2026-05-16",
    headline: "Quarter-on-quarter margin holds despite input cost pressure",
    summary:
      "Aggregate gross margin held at 28.7% (-0.2pp QoQ) despite a 4% rise in aluminum costs. Mix shift to Energy and Sparkling Water offset can-cost pressure.",
    sections: [
      {
        title: "What moved",
        body:
          "Energy category gross margin expanded to 41.8% on Volt premium pack growth. Sparkling water expanded to 33.1% on Glacio Sparkling Lime velocity.",
      },
      {
        title: "What broke",
        body:
          "Juice category margin dropped to 21.4% as Verde Apple Crisp absorbed cost without a price increase. Pricing committee to review next Tuesday.",
      },
      {
        title: "What to watch",
        body:
          "Cascade's zero-cal launch lands May 22 — first week scan data will reveal whether they're pricing for share or for margin.",
      },
    ],
    actions: [
      "Pricing committee to approve +3% list on Verde Apple Crisp effective June 1.",
      "Marketing to draft response brief for Cascade zero-cal launch.",
    ],
  },
];

export function briefForDate(date: string) {
  return BRIEFS.find((b) => b.date === date);
}

export function latestBrief() {
  return BRIEFS[0];
}
