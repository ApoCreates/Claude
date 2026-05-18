export type Scenario = {
  id: string;
  title: string;
  question: string;
  owner: string;
  createdAt: string;
  horizonMonths: number;
  status: "draft" | "modeled" | "endorsed";
  baselineRevenue: number;
  projectedRevenue: number;
  confidence: number;
  drivers: { name: string; delta: number }[];
  risks: string[];
  recommendation: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "scn-001",
    title: "Volt Berry Rush price drop to win convenience",
    question: "If we cut Volt Berry Rush MSRP by 8% in convenience channel for Q3, what's the expected category revenue impact?",
    owner: "M. Okafor (Pricing)",
    createdAt: "2026-05-09",
    horizonMonths: 6,
    status: "modeled",
    baselineRevenue: 12_400_000,
    projectedRevenue: 13_650_000,
    confidence: 0.71,
    drivers: [
      { name: "Volume uplift from price elasticity", delta: 0.14 },
      { name: "Cannibalization of Volt Zero", delta: -0.04 },
      { name: "Win-back from Amperion", delta: 0.05 },
      { name: "Margin compression", delta: -0.05 },
    ],
    risks: [
      "Amperion may respond with deeper promo in 8-week window.",
      "Convenience banners require slotting fees not yet negotiated.",
    ],
    recommendation: "Pilot in 4 convenience banners across South & West for 8 weeks before national rollout.",
  },
  {
    id: "scn-002",
    title: "HORECA expansion for Verde Mango Sunrise",
    question: "What's the revenue lift from adding Verde Mango Sunrise to 600 HORECA accounts in West & Northeast?",
    owner: "S. Lindqvist (Channel)",
    createdAt: "2026-05-12",
    horizonMonths: 9,
    status: "modeled",
    baselineRevenue: 4_100_000,
    projectedRevenue: 5_280_000,
    confidence: 0.62,
    drivers: [
      { name: "New door distribution", delta: 0.22 },
      { name: "Cross-sell to existing HORECA accounts", delta: 0.06 },
      { name: "Operational onboarding drag", delta: -0.03 },
    ],
    risks: [
      "Northwave dominates premium juice in HORECA — pricing pressure expected.",
      "Cold-chain capacity in Northeast distributors is constrained until Q4.",
    ],
    recommendation: "Sequence West (Q3) then Northeast (Q4) to match distributor capacity; bundle with Solace Peach for combo placement.",
  },
  {
    id: "scn-003",
    title: "Sunset Solace Lemon Honey",
    question: "If we discontinue Solace Lemon Honey by end of year, what's the net P&L impact after reallocating shelf to Peach Iced Tea?",
    owner: "A. Beraud (Portfolio)",
    createdAt: "2026-05-14",
    horizonMonths: 12,
    status: "draft",
    baselineRevenue: 2_900_000,
    projectedRevenue: 3_350_000,
    confidence: 0.55,
    drivers: [
      { name: "Lost Lemon Honey revenue", delta: -0.18 },
      { name: "Shelf reallocation to Peach Iced Tea", delta: 0.28 },
      { name: "SG&A simplification savings", delta: 0.05 },
    ],
    risks: [
      "Lemon Honey has loyal base in Mountain region — risk of consumer defection to Cascade.",
    ],
    recommendation: "Phase out over two quarters, retain in Mountain region pending consumer survey.",
  },
];

export function scenarioById(id: string) {
  return SCENARIOS.find((s) => s.id === id);
}
